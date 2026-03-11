import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const GodownReportsPage = () => {
    const [summary, setSummary] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sumRes, custRes, invRes, stockRes] = await Promise.all([
                api.get('/godown/reports/summary'),
                api.get('/godown/reports/customer-summary'),
                api.get('/godown/reports/all-invoices'),
                api.get('/godown/reports/stock')
            ]);
            setSummary(sumRes.data);
            setCustomers(Array.isArray(custRes.data) ? custRes.data : (custRes.data?.data || []));
            setInvoices(Array.isArray(invRes.data) ? invRes.data : (invRes.data?.data || []));
            setStock(Array.isArray(stockRes.data) ? stockRes.data : (stockRes.data?.data || []));
        } catch (err) {
            toast.error('Failed to load Godown reports.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenPayment = (invoice) => {
        setSelectedInvoice(invoice);
        setPaymentAmount(invoice.pending_amount);
        setIsPaymentModalOpen(true);
    };

    const handleProcessPayment = async (e) => {
        e.preventDefault();

        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Invalid amount.');
            return;
        }

        setProcessingPayment(true);
        try {
            await api.post('/godown/payments', {
                godown_invoice_id: selectedInvoice.id,
                amount: parseFloat(paymentAmount),
                payment_method: paymentMethod,
                payment_date: paymentDate
            });
            toast.success('Payment recorded successfully.');
            setIsPaymentModalOpen(false);
            fetchData(); // Refresh all data
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to process payment.');
        } finally {
            setProcessingPayment(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading Godown Analytics...</div>;
    }

    const handleDownloadInvoice = async (invoiceId) => {
        setDownloadingId(invoiceId);
        try {
            const res = await api.get(`/godown/invoices/${invoiceId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `GodownInvoice_${invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download invoice PDF');
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Godown Performance & Reports"
                subtitle="Exclusive insights for Godown sales, stock, and collections."
            />

            {/* High Level Stats */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card><div className="text-sm text-gray-500">Today Sales</div><div className="text-2xl font-bold text-gray-900">₹{parseFloat(summary.today_sales).toFixed(2)}</div></Card>
                    <Card><div className="text-sm text-gray-500">This Week Sales</div><div className="text-2xl font-bold text-gray-900">₹{parseFloat(summary.week_sales).toFixed(2)}</div></Card>
                    <Card><div className="text-sm text-gray-500">This Month Sales</div><div className="text-2xl font-bold text-gray-900">₹{parseFloat(summary.month_sales).toFixed(2)}</div></Card>
                    <Card><div className="text-sm text-gray-500">Total Pending Bills</div><div className="text-2xl font-bold text-red-600">₹{parseFloat(summary.total_pending).toFixed(2)}</div></Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side: Customers & Stock */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Current Godown Stock">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="p-2 text-sm font-semibold">Category</th>
                                        <th className="p-2 text-sm font-semibold text-right">Available Bags</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stock.map((item, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="p-2 text-sm">{item.category}</td>
                                            <td className="p-2 text-sm text-right font-bold">{item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card title="Customer Summary (Godown Only)">
                        <div className="overflow-x-auto h-96 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white">
                                    <tr className="border-b bg-gray-50">
                                        <th className="p-2 text-sm font-semibold">Customer</th>
                                        <th className="p-2 text-sm font-semibold text-right">Pending</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map(c => (
                                        <tr key={c.id} className="border-b">
                                            <td className="p-2 text-sm">{c.name}</td>
                                            <td className={`p-2 text-sm text-right font-semibold ${parseFloat(c.pending_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                ₹{parseFloat(c.pending_balance).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {customers.length === 0 && (
                                        <tr><td colSpan="2" className="p-4 text-center text-sm text-gray-500">No customers fetched Godown items yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Right side: All Invoices with Collection & PDF Actions */}
                <div className="lg:col-span-2">
                    <Card title="All Godown Invoices">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="p-3 text-sm font-semibold text-gray-700">Invoice #</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700">Date</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700">Customer</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 text-right">Pending Amt</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 text-center">Status</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((inv) => (
                                        <tr key={inv.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 text-sm font-medium">{inv.invoice_number}</td>
                                            <td className="p-3 text-sm">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                            <td className="p-3 text-sm">{inv.customer_name}</td>
                                            <td className="p-3 text-sm text-right font-bold text-red-600">₹{parseFloat(inv.pending_amount).toFixed(2)}</td>
                                            <td className="p-3 text-sm text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                    {inv.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-center space-x-2">
                                                {inv.status !== 'paid' && (
                                                    <Button size="sm" onClick={() => handleOpenPayment(inv)}>Collect</Button>
                                                )}
                                                <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(inv.id)} disabled={downloadingId === inv.id}>
                                                    {downloadingId === inv.id ? '...' : 'PDF'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {invoices.length === 0 && (
                                        <tr><td colSpan="6" className="p-6 text-center text-gray-500">All Godown bills are cleared!</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">Collect Payment</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleProcessPayment} className="p-4 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-md text-sm">
                                <div className="flex justify-between mb-1"><span className="text-gray-500">Invoice:</span> <span className="font-semibold">{selectedInvoice.invoice_number}</span></div>
                                <div className="flex justify-between mb-1"><span className="text-gray-500">Customer:</span> <span className="font-semibold">{selectedInvoice.customer_name}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Max amount:</span> <span className="font-bold text-red-600">₹{parseFloat(selectedInvoice.pending_amount).toFixed(2)}</span></div>
                            </div>

                            <Input
                                label="Payment Amount (₹)"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={parseFloat(selectedInvoice.pending_amount)}
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                required
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="upi">UPI</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="bank">Bank Transfer</option>
                                    </select>
                                </div>
                                <Input
                                    label="Date"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="pt-4 flex justify-end space-x-3">
                                <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" disabled={processingPayment}>
                                    {processingPayment ? 'Processing...' : 'Confirm Receipt'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GodownReportsPage;
