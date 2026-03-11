import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const CreateGodownInvoicePage = () => {
    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [customerId, setCustomerId] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('Medium');
    const [bags, setBags] = useState('');
    const [rate, setRate] = useState('');
    const [discountAmount, setDiscountAmount] = useState('0');

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get('/customers');
                // Ensure we get an array, some endpoints return { data: [...] }
                const customerData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setCustomers(customerData);
            } catch (err) {
                toast.error('Failed to load customers');
                setCustomers([]); // Fallback to empty array on error
            } finally {
                setLoadingCustomers(false);
            }
        };
        fetchCustomers();
    }, []);

    const handleCreateInvoice = async (e) => {
        e.preventDefault();

        if (!customerId) {
            toast.error('Please select a customer.');
            return;
        }

        if (parseInt(bags) <= 0 || parseFloat(rate) <= 0) {
            toast.error('Bags and Rate must be greater than zero.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                customer_id: customerId,
                invoice_date: invoiceDate,
                category,
                bags: parseInt(bags),
                rate: parseFloat(rate),
                discount_amount: parseFloat(discountAmount) || 0
            };

            await api.post('/godown/invoices', payload);
            toast.success('Godown GST Invoice created successfully!');

            // Reset form
            setCustomerId('');
            setBags('');
            setRate('');
            setDiscountAmount('0');

        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create invoice. Check Godown stock.');
        } finally {
            setSubmitting(false);
        }
    };

    // Auto-calculating projections for UI
    const b = parseInt(bags) || 0;
    const r = parseFloat(rate) || 0;
    const d = parseFloat(discountAmount) || 0;
    const inclusiveTotal = (b * r) - d;
    const projectedBase = inclusiveTotal > 0 ? (inclusiveTotal / 1.05).toFixed(2) : 0;
    const projectedGst = inclusiveTotal > 0 ? (inclusiveTotal - projectedBase).toFixed(2) : 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Create Godown Invoice"
                subtitle="Generate GST inclusive invoices dynamically from backend Godown stock."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card title="Invoice Details">
                        <form onSubmit={handleCreateInvoice} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                                    <select
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100"
                                        disabled={loadingCustomers}
                                        required
                                    >
                                        <option value="">Select Customer...</option>
                                        {(customers || []).map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="Invoice Date"
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    >
                                        <option value="Medium">Medium</option>
                                        <option value="Super Small">Super Small</option>
                                    </select>
                                </div>
                                <Input
                                    label="Bags"
                                    type="number"
                                    min="1"
                                    value={bags}
                                    onChange={(e) => setBags(e.target.value)}
                                    placeholder="Qty"
                                    required
                                />
                                <Input
                                    label="Inclusive Rate (₹)"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    placeholder="Rate with GST"
                                    required
                                />
                            </div>

                            <div>
                                <Input
                                    label="Discount Amount (₹)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(e.target.value)}
                                    placeholder="Enter discount if any"
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" variant="primary" fullWidth disabled={submitting}>
                                    {submitting ? 'Generating Invoice...' : 'Generate Invoice and Deduct Stock'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                <div>
                    <Card title="Billing Math Projection">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm border-b pb-2">
                                <span className="text-gray-600">Total (Bags × Rate)</span>
                                <span className="font-semibold text-gray-900">₹ {(b * r).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b pb-2">
                                <span className="text-gray-600">Discount Applied</span>
                                <span className="font-semibold text-red-600">- ₹ {d.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b pb-2">
                                <span className="text-gray-600">Base Amount (Taxable)</span>
                                <span className="font-semibold text-gray-900">₹ {projectedBase}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b pb-2">
                                <span className="text-gray-600">Total GST (5%)</span>
                                <span className="font-semibold text-gray-900">₹ {projectedGst}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg mt-4 bg-gray-50 p-3 rounded-md">
                                <span className="font-bold text-gray-700">Grand Total</span>
                                <span className="font-extrabold text-primary">₹ {inclusiveTotal >= 0 ? inclusiveTotal.toFixed(2) : '0.00'}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CreateGodownInvoicePage;
