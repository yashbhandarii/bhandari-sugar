import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { calculateInvoiceTotal, calculateItemAmount } from '@shared/calculations';
import { GST_RATES, DEFAULT_BAG_WEIGHT, EXPENSE_TYPES } from '@shared/constants';
import { generateInvoicePDF } from '../lib/pdf-generator';

interface InvoiceItem {
    categoryId: number;
    categoryName: string;
    quantity: number;
    bagWeight: number;
    ratePerBag: number;
    amount: number;
    deductStock?: boolean; // New flag to control stock deduction
}

interface Distribution {
    id: number;
    categoryId: number;
    categoryName: string;
    quantity: number;
    ratePerQuintal: number;
    distributionDate: string;
}

interface InvoiceExpense {
    expenseType: string;
    amount: number;
    description?: string;
}

export default function InvoiceBuilder() {
    const queryClient = useQueryClient();

    const [customerId, setCustomerId] = useState<number | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [godownId, setGodownId] = useState<number | null>(null);
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [expenses, setExpenses] = useState<InvoiceExpense[]>([]);
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedDistributions, setSelectedDistributions] = useState<number[]>([]);

    // Fetch data
    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await fetch('/api/customers');
            return res.json();
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await fetch('/api/categories');
            return res.json();
        },
    });

    const { data: godowns } = useQuery({
        queryKey: ['godowns'],
        queryFn: async () => {
            const res = await fetch('/api/godowns');
            return res.json();
        },
    });

    // Fetch pending distributions for selected customer
    const { data: pendingDistributions } = useQuery({
        queryKey: ['pending-distributions', customerId],
        queryFn: async () => {
            if (!customerId) return [];
            const res = await fetch(`/api/inventory-distributions/pending/${customerId}`);
            return res.json();
        },
        enabled: !!customerId,
    });

    // Filter customers based on search
    const filteredCustomers = customers?.filter((c: any) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.mobile?.includes(customerSearch)
    ) || [];

    // Add item
    const addItem = () => {
        if (categories && categories.length > 0) {
            const firstCategory = categories[0];
            setItems([
                ...items,
                {
                    categoryId: firstCategory.id,
                    categoryName: firstCategory.name,
                    quantity: 1,
                    bagWeight: firstCategory.defaultBagWeight || DEFAULT_BAG_WEIGHT,
                    ratePerBag: 0,
                    amount: 0,
                    deductStock: true, // Default to true for manually added items
                },
            ]);
        }
    };

    // Import distribution as item
    const importDistribution = (dist: Distribution) => {
        // Check if already imported
        if (selectedDistributions.includes(dist.id)) return;

        const category = categories?.find((c: any) => c.id === dist.categoryId);
        const bagWeight = category?.defaultBagWeight || DEFAULT_BAG_WEIGHT;

        // Calculate rate per bag from quintal rate (Rate per Quintal / 2) if available
        // But user might want to set their own rate, so maybe leave 0 or hint?
        // Let's use the distribution rate (purchase rate) as a baseline if it exists, but typically sale rate > purchase rate.
        // For now, let's leave it 0 or copy purchase rate if that helps, but better to let manager set it.
        // Actually the prompt says "Manager then creates there bill according to charges , discount and rates".
        // So Rate should be entered by Manager.

        setItems([
            ...items,
            {
                categoryId: dist.categoryId,
                categoryName: dist.categoryName,
                quantity: dist.quantity,
                bagWeight: bagWeight,
                ratePerBag: 0, // Manager sets this
                amount: 0,
                deductStock: false, // Don't deduct stock again
            },
        ]);

        setSelectedDistributions([...selectedDistributions, dist.id]);
    };

    // Update item
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Update category name if category changed
        if (field === 'categoryId') {
            const category = categories?.find((c: any) => c.id === parseInt(value));
            if (category) {
                newItems[index].categoryName = category.name;
                newItems[index].bagWeight = category.defaultBagWeight || DEFAULT_BAG_WEIGHT;
            }
        }

        // Recalculate amount
        newItems[index].amount = calculateItemAmount(
            newItems[index].quantity,
            newItems[index].ratePerBag
        );

        setItems(newItems);
    };

    // Remove item
    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Add expense
    const addExpense = () => {
        setExpenses([
            ...expenses,
            { expenseType: 'LABOUR', amount: 0 },
        ]);
    };

    // Update expense
    const updateExpense = (index: number, field: string, value: any) => {
        const newExpenses = [...expenses];
        newExpenses[index] = { ...newExpenses[index], [field]: value };
        setExpenses(newExpenses);
    };

    // Remove expense
    const removeExpense = (index: number) => {
        setExpenses(expenses.filter((_, i) => i !== index));
    };

    // Calculate totals
    const calculation = calculateInvoiceTotal(items, expenses);

    // Create invoice mutation
    const createInvoice = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoice: {
                        customerId,
                        date: new Date(),
                        dueDate: dueDate ? new Date(dueDate) : undefined, // Send due date
                        subtotal: calculation.subtotal,
                        sgst: calculation.sgst,
                        cgst: calculation.cgst,
                        totalAmount: calculation.totalAmount,
                        godownId,
                        notes,
                    },
                    items: items.map(item => ({
                        categoryId: item.categoryId,
                        quantity: item.quantity,
                        bagWeight: item.bagWeight,
                        ratePerBag: item.ratePerBag,
                        amount: item.amount,
                        deductStock: item.deductStock, // Send stock deduction flag
                    })),
                    expenses: expenses.filter(e => e.amount > 0),
                    distributionIds: selectedDistributions, // Send linked distributions
                }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create invoice');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });

            // Generate PDF
            const customer = customers?.find((c: any) => c.id === customerId);
            if (customer) {
                generateInvoicePDF(data, customer, items, expenses, calculation);
            }

            // Reset form
            setCustomerId(null);
            setCustomerSearch('');
            setGodownId(null);
            setItems([]);
            setExpenses([]);
            setNotes('');
            setDueDate(''); // Reset due date
            setSelectedDistributions([]); // Reset selected distributions

            alert('Invoice created successfully!');
        },
        onError: (error: any) => {
            alert(error.message || 'Failed to create invoice');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerId) {
            alert('Please select a customer');
            return;
        }

        if (items.length === 0) {
            alert('Please add at least one item');
            return;
        }

        if (!godownId) {
            alert('Please select a godown');
            return;
        }

        createInvoice.mutate();
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Invoice</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer *
                        </label>
                        <input
                            type="text"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            placeholder="Search customer by name or mobile..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {customerSearch && filteredCustomers.length > 0 && (
                            <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                                {filteredCustomers.map((customer: any) => (
                                    <button
                                        key={customer.id}
                                        type="button"
                                        onClick={() => {
                                            setCustomerId(customer.id);
                                            setCustomerSearch(customer.name);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                                    >
                                        <p className="font-medium">{customer.name}</p>
                                        {customer.mobile && (
                                            <p className="text-sm text-gray-500">{customer.mobile}</p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pending Distributions */}
                    {pendingDistributions && pendingDistributions.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 className="text-sm font-bold text-yellow-800 mb-3 flex items-center">
                                <span className="mr-2">🚛</span> Pending Deliveries
                            </h3>
                            <div className="space-y-2">
                                {pendingDistributions.map((dist: Distribution) => {
                                    const isSelected = selectedDistributions.includes(dist.id);
                                    return (
                                        <div
                                            key={dist.id}
                                            className={`flex items-center justify-between p-3 bg-white rounded border ${isSelected ? 'border-primary-300 bg-primary-50' : 'border-yellow-100'
                                                }`}
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {dist.categoryName} - {dist.quantity} bags
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(dist.distributionDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => importDistribution(dist)}
                                                disabled={isSelected}
                                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${isSelected
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-primary-600 text-white hover:bg-primary-700'
                                                    }`}
                                            >
                                                {isSelected ? 'Imported' : 'Import'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Godown Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Godown *
                        </label>
                        <select
                            value={godownId || ''}
                            onChange={(e) => setGodownId(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select Godown</option>
                            {godowns?.map((godown: any) => (
                                <option key={godown.id} value={godown.id}>
                                    {godown.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Due Date (Optional)
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Default is 7 days from today"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Defaults to 7 days from today if left blank.
                        </p>
                    </div>

                    {/* Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Items *
                            </label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                            >
                                <Plus size={16} className="mr-1" />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 bg-gray-50 rounded-lg">
                                    <div className="col-span-12 md:col-span-3">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={item.categoryId}
                                            onChange={(e) => updateItem(index, 'categoryId', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        >
                                            {categories?.map((cat: any) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-6 md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Bags
                                        </label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            min="1"
                                        />
                                    </div>

                                    <div className="col-span-6 md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Bag Wt (kg)
                                        </label>
                                        <input
                                            type="number"
                                            value={item.bagWeight}
                                            onChange={(e) => updateItem(index, 'bagWeight', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="col-span-6 md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Rate/Bag
                                        </label>
                                        <input
                                            type="number"
                                            value={item.ratePerBag}
                                            onChange={(e) => updateItem(index, 'ratePerBag', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="col-span-5 md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Amount
                                        </label>
                                        <p className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                                            {formatCurrency(item.amount)}
                                        </p>
                                    </div>

                                    <div className="col-span-1 md:col-span-1">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Expenses */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Additional Expenses
                            </label>
                            <button
                                type="button"
                                onClick={addExpense}
                                className="flex items-center px-3 py-1 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors text-sm"
                            >
                                <Plus size={16} className="mr-1" />
                                Add Expense
                            </button>
                        </div>

                        {expenses.length > 0 && (
                            <div className="space-y-3">
                                {expenses.map((expense, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 bg-gray-50 rounded-lg">
                                        <div className="col-span-6 md:col-span-4">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Type
                                            </label>
                                            <select
                                                value={expense.expenseType}
                                                onChange={(e) => updateExpense(index, 'expenseType', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            >
                                                {EXPENSE_TYPES.map((type) => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-5 md:col-span-3">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Amount
                                            </label>
                                            <input
                                                type="number"
                                                value={expense.amount}
                                                onChange={(e) => updateExpense(index, 'amount', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="col-span-11 md:col-span-4">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                value={expense.description || ''}
                                                onChange={(e) => updateExpense(index, 'description', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                placeholder="Optional"
                                            />
                                        </div>

                                        <div className="col-span-1 md:col-span-1">
                                            <button
                                                type="button"
                                                onClick={() => removeExpense(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Additional notes..."
                        />
                    </div>

                    {/* Calculation Summary */}
                    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Invoice Summary</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">{formatCurrency(calculation.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">SGST ({GST_RATES.SGST}%):</span>
                                <span className="font-medium">{formatCurrency(calculation.sgst)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">CGST ({GST_RATES.CGST}%):</span>
                                <span className="font-medium">{formatCurrency(calculation.cgst)}</span>
                            </div>
                            {calculation.totalExpenses > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Expenses:</span>
                                    <span className="font-medium">{formatCurrency(calculation.totalExpenses)}</span>
                                </div>
                            )}
                            <div className="border-t border-gray-300 pt-2 mt-2">
                                <div className="flex justify-between">
                                    <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                                    <span className="text-2xl font-bold text-primary-600">
                                        {formatCurrency(calculation.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={createInvoice.isPending}
                            className="flex-1 flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={20} className="mr-2" />
                            {createInvoice.isPending ? 'Creating...' : 'Save & Generate PDF'}
                        </button>
                    </div>
                </form >
            </div >
        </div >
    );
}
