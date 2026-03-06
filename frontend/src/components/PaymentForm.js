import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import toast from 'react-hot-toast';

const PaymentForm = ({ customers, onSubmit, isSubmitting }) => {
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [unpaidInvoices, setUnpaidInvoices] = useState([]);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [loadingPending, setLoadingPending] = useState(false);
    const [amount, setAmount] = useState('');
    const [discount, setDiscount] = useState('');
    const [discountReason, setDiscountReason] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (selectedCustomerId) {
            const fetchData = async () => {
                setLoadingPending(true);
                try {
                    // Fetch total pending
                    const pendingRes = await api.get(`/payments/pending/${selectedCustomerId}`);
                    setPendingAmount(pendingRes.data.pending || 0);

                    // Fetch unpaid invoices
                    const invoicesRes = await api.get(`/billing/customer/${selectedCustomerId}`);
                    const unpaid = (invoicesRes.data || []).filter(inv => inv.status !== 'paid');
                    setUnpaidInvoices(unpaid);
                } catch (error) {
                    console.error('Error fetching data:', error);
                    setPendingAmount(0);
                    setUnpaidInvoices([]);
                } finally {
                    setLoadingPending(false);
                }
            };
            fetchData();
        } else {
            setPendingAmount(0);
            setUnpaidInvoices([]);
            setSelectedInvoiceId('');
        }
    }, [selectedCustomerId]);

    const activeInvoicePending = useMemo(() => {
        if (!selectedInvoiceId) return pendingAmount;
        const inv = unpaidInvoices.find(i => i.id === parseInt(selectedInvoiceId));
        if (!inv) return 0;
        // Backend handles specific invoice pending too, but for UI we calculate local
        // NOTE: inv.total_amount is the full amount. Invoices list from billing/customer 
        // doesn't usually return current pending per invoice unless calculated.
        // For simplicity, we show the total customer pending unless an invoice is picked.
        // If an invoice is picked, we should ideally know its pending.
        return parseFloat(inv.total_amount || 0);
    }, [selectedInvoiceId, unpaidInvoices, pendingAmount]);

    const finalPending = useMemo(() => {
        const amt = parseFloat(amount) || 0;
        const disc = parseFloat(discount) || 0;
        return Math.max(0, activeInvoicePending - amt - disc);
    }, [activeInvoicePending, amount, discount]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedCustomerId) return;
        if (!amount && !discount) {
            toast.error("Please enter either a payment amount or a discount.");
            return;
        }

        const amountValue = parseFloat(amount) || 0;
        const discountValue = parseFloat(discount) || 0;

        if (amountValue < 0 || discountValue < 0) {
            toast.error("Negative values are not allowed.");
            return;
        }

        if (discountValue > 0 && !selectedInvoiceId) {
            toast.error("A specific invoice must be selected to apply a discount.");
            return;
        }

        // Validation against active pending
        if (amountValue + discountValue > activeInvoicePending + 0.5) {
            toast.error(`Total (₹${(amountValue + discountValue).toLocaleString()}) exceeds pending amount (₹${activeInvoicePending.toLocaleString()})`);
            return;
        }

        onSubmit({
            customer_id: parseInt(selectedCustomerId),
            invoice_id: selectedInvoiceId ? parseInt(selectedInvoiceId) : null,
            amount: amountValue,
            discount: discountValue,
            reason: discountReason,
            payment_method: paymentMethod,
            notes
        });
    };

    return (
        <Card title="Record Payment & Discount" className="max-w-lg mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                    <select
                        id="customer_id"
                        name="customer_id"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white"
                        required
                    >
                        <option value="">Select Customer</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.mobile ? `- ${c.mobile}` : ''}</option>
                        ))}
                    </select>
                </div>

                {selectedCustomerId && (
                    <>
                        <div>
                            <label htmlFor="invoice_id" className="block text-sm font-medium text-gray-700 mb-1">Target Invoice (Optional for payments, REQUIRED for discounts)</label>
                            <select
                                id="invoice_id"
                                name="invoice_id"
                                value={selectedInvoiceId}
                                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white"
                            >
                                <option value="">General Account Payment</option>
                                {unpaidInvoices.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                        Inv #{inv.id} - ₹{parseFloat(inv.total_amount).toLocaleString()} ({new Date(inv.delivery_date).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">Selected Pending</span>
                                <span className="text-lg font-bold">₹{activeInvoicePending.toLocaleString()}</span>
                            </div>
                            <div className="text-xs text-blue-600">
                                {selectedInvoiceId ? `Applying to Invoice #${selectedInvoiceId}` : 'Applying to general account pending'}
                            </div>
                        </div>
                    </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Payment Amount (₹)"
                        id="amount"
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                    />
                    <Input
                        label="Discount Given (₹)"
                        id="discount"
                        name="discount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="Optional"
                    />
                </div>

                {parseFloat(discount) > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-1">
                        <label htmlFor="discount_reason" className="block text-sm font-medium text-gray-700 mb-1">Reason for Discount</label>
                        <textarea
                            id="discount_reason"
                            name="discount_reason"
                            rows="2"
                            value={discountReason}
                            onChange={(e) => setDiscountReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white"
                            placeholder="e.g. Round off, Cash discount, Special case"
                            required={parseFloat(discount) > 0}
                        />
                    </div>
                )}

                <div>
                    <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                        id="payment_method"
                        name="payment_method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white"
                        disabled={!amount || parseFloat(amount) <= 0}
                    >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="cheque">Cheque</option>
                        <option value="bank">Bank Transfer</option>
                    </select>
                </div>

                <Input
                    label="Internal Notes (Optional)"
                    id="notes"
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reference numbers, etc."
                />

                {(parseFloat(amount) > 0 || parseFloat(discount) > 0) && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Live Preview</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Old Pending:</span>
                                <span>₹{activeInvoicePending.toLocaleString()}</span>
                            </div>
                            {parseFloat(amount) > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>(-) Payment:</span>
                                    <span>₹{parseFloat(amount).toLocaleString()}</span>
                                </div>
                            )}
                            {parseFloat(discount) > 0 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>(-) Discount:</span>
                                    <span>₹{parseFloat(discount).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="border-t border-gray-300 pt-1 mt-1 flex justify-between font-bold text-gray-900">
                                <span>New Pending:</span>
                                <span>₹{finalPending.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isSubmitting || loadingPending}
                    variant="primary"
                    fullWidth
                    className="mt-4"
                >
                    {isSubmitting ? 'Recording...' : 'RECORD SETTLEMENT'}
                </Button>
            </form>
        </Card>
    );
};

export default React.memo(PaymentForm);

