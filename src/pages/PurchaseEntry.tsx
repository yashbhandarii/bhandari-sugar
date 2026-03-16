import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Save, Trash2, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PurchaseEntry() {
    const queryClient = useQueryClient();

    // Bulk Purchase form state
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [purchaseGodownId, setPurchaseGodownId] = useState('');
    const [bulkItems, setBulkItems] = useState<{ categoryId: number; quantity: string; ratePerQuintal: string }[]>([]);

    // Edit/Delete State
    const [editingPurchase, setEditingPurchase] = useState<any | null>(null);

    // Fetch data
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

    const { data: purchases } = useQuery({
        queryKey: ['inventory-purchases'],
        queryFn: async () => {
            const res = await fetch('/api/inventory-purchases');
            return res.json();
        },
    });

    // Auto-set godown ID when godowns are loaded
    useEffect(() => {
        if (godowns && godowns.length > 0 && !purchaseGodownId) {
            setPurchaseGodownId(godowns[0].id.toString());
        }
    }, [godowns]);

    // Initialize bulk items when categories load
    useEffect(() => {
        if (categories) {
            setBulkItems(categories.map((cat: any) => ({
                categoryId: cat.id,
                quantity: '',
                ratePerQuintal: ''
            })));
        }
    }, [categories]);

    // Create bulk purchase mutation
    const createBulkPurchase = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/inventory-purchases/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create bulk purchase');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-purchases'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });

            // Reset quantities but keep rates
            setBulkItems(prev => prev.map(item => ({ ...item, quantity: '' })));
            alert('Bulk purchase recorded successfully!');
        },
        onError: (error: any) => {
            alert(error.message || 'Failed to create bulk purchase');
        },
    });

    // Delete purchase mutation
    const deletePurchase = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/inventory-purchases/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete purchase');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-purchases'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            alert('Purchase deleted successfully!');
        },
        onError: (error: any) => {
            alert(error.message || 'Failed to delete purchase');
        },
    });

    // Update purchase mutation
    const updatePurchase = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/inventory-purchases/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update purchase');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-purchases'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setEditingPurchase(null);
            alert('Purchase updated successfully!');
        },
        onError: (error: any) => {
            alert(error.message || 'Failed to update purchase');
        },
    });


    const handleBulkPurchaseSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validItems = bulkItems
            .filter(item => item.quantity && parseFloat(item.quantity) > 0)
            .map(item => ({
                categoryId: item.categoryId,
                quantity: parseInt(item.quantity),
                ratePerQuintal: parseFloat(item.ratePerQuintal) || 0,
            }));

        if (validItems.length === 0) {
            alert('Please enter quantity for at least one category');
            return;
        }

        createBulkPurchase.mutate({
            date: purchaseDate,
            godownId: parseInt(purchaseGodownId),
            items: validItems
        });
    };

    const handleBulkItemChange = (categoryId: number, field: 'quantity' | 'ratePerQuintal', value: string) => {
        setBulkItems(prev => prev.map(item =>
            item.categoryId === categoryId ? { ...item, [field]: value } : item
        ));
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this purchase? This will reduce the stock.')) {
            deletePurchase.mutate(id);
        }
    };

    const handleEditClick = (purchase: any) => {
        setEditingPurchase({
            ...purchase,
            date: new Date(purchase.date).toISOString().split('T')[0],
        });
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updatePurchase.mutate({
            id: editingPurchase.id,
            date: editingPurchase.date,
            godownId: editingPurchase.godownId,
            categoryId: editingPurchase.categoryId,
            quantity: parseInt(editingPurchase.quantity),
            ratePerQuintal: parseFloat(editingPurchase.ratePerQuintal),
            notes: editingPurchase.notes
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Purchase Entry</h1>
                <p className="mt-2 text-gray-600">Manage daily inventory purchases</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Daily Purchase Entry</h2>
                    <div className="text-sm text-gray-500">
                        Enter stock for multiple categories at once
                    </div>
                </div>

                <form onSubmit={handleBulkPurchaseSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <input
                                type="date"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Godown *</label>
                            <select
                                value={purchaseGodownId}
                                onChange={(e) => setPurchaseGodownId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                required
                            >
                                {godowns?.map((g: any) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity (Bags)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate (₹/Quintal)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories?.map((cat: any) => {
                                    const item = bulkItems.find(i => i.categoryId === cat.id) || { quantity: '', ratePerQuintal: '' };
                                    const amount = ((parseInt(item.quantity) || 0) / 2) * (parseFloat(item.ratePerQuintal) || 0);

                                    return (
                                        <tr key={cat.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {cat.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleBulkItemChange(cat.id, 'quantity', e.target.value)}
                                                    className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                                                    min="0"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={item.ratePerQuintal}
                                                    onChange={(e) => handleBulkItemChange(cat.id, 'ratePerQuintal', e.target.value)}
                                                    className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                {amount > 0 ? formatCurrency(amount) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={createBulkPurchase.isPending}
                            className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-bold"
                        >
                            <Save size={20} className="mr-2" />
                            {createBulkPurchase.isPending ? 'Saving...' : 'Save All Purchases'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Recent Purchases */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Purchases</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Godown
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Rate/Quintal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {purchases?.slice(0, 10).map((purchase: any) => (
                                <tr key={purchase.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(purchase.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {purchase.categoryName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {purchase.godownName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {purchase.quantity} bags
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatCurrency(purchase.ratePerQuintal)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                        {formatCurrency(purchase.totalAmount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEditClick(purchase)}
                                            className="text-primary-600 hover:text-primary-900 mr-4"
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(purchase.id)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingPurchase && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Edit Purchase</h3>
                            <button
                                onClick={() => setEditingPurchase(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={editingPurchase.date}
                                    onChange={(e) => setEditingPurchase({ ...editingPurchase, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={editingPurchase.categoryId}
                                    onChange={(e) => setEditingPurchase({ ...editingPurchase, categoryId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                >
                                    {categories?.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Godown</label>
                                <select
                                    value={editingPurchase.godownId}
                                    onChange={(e) => setEditingPurchase({ ...editingPurchase, godownId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                >
                                    {godowns?.map((g: any) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Bags)</label>
                                <input
                                    type="number"
                                    value={editingPurchase.quantity}
                                    onChange={(e) => setEditingPurchase({ ...editingPurchase, quantity: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    min="1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rate (₹/Quintal)</label>
                                <input
                                    type="number"
                                    value={editingPurchase.ratePerQuintal}
                                    onChange={(e) => setEditingPurchase({ ...editingPurchase, ratePerQuintal: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingPurchase(null)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatePurchase.isPending}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    {updatePurchase.isPending ? 'Saving...' : 'Update Purchase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
