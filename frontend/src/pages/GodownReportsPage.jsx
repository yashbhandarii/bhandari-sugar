import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import api from '../services/api';
import { printInvoice, shareInvoice } from '../utils/thermalPrinter';

const formatMoney = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const GodownReportsPage = () => {
    const [summary, setSummary] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCustomer, setExpandedCustomer] = useState(null);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [printingId, setPrintingId] = useState(null);
    const [sharingId, setSharingId] = useState(null);
    const shareSupported = typeof navigator !== 'undefined' && 'share' in navigator;

    const fetchInvoiceForPrint = async (invoiceId) => {
        const res = await api.get(`/godown/invoices/${invoiceId}`);
        return res.data;
    };

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
            console.error(err);
            toast.error('Failed to load Godown reports.');
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
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to process payment.');
        } finally {
            setProcessingPayment(false);
        }
    };

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

    const handleShareInvoice = async (invoiceId) => {
        setSharingId(invoiceId);
        try {
            const invoice = await fetchInvoiceForPrint(invoiceId);
            await shareInvoice(invoice);
        } catch (error) {
            if (error?.name === 'AbortError') {
                toast('Share cancelled.');
            } else {
                toast.error(error?.message || 'Failed to share invoice.');
            }
        } finally {
            setSharingId(null);
        }
    };

    const handleBluetoothPrint = async (invoiceId) => {
        setPrintingId(invoiceId);
        try {
            const invoice = await fetchInvoiceForPrint(invoiceId);
            await printInvoice(invoice);
            toast.success('Invoice sent to Bluetooth printer.');
        } catch (error) {
            if (error?.name === 'AbortError' || error?.name === 'NotFoundError') {
                toast('Printer selection cancelled.');
            } else {
                toast.error(error?.message || 'Failed to print invoice.');
            }
        } finally {
            setPrintingId(null);
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading Godown analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Godown Performance & Reports"
                subtitle="Exclusive insights for Godown sales, stock, collections, and customer-wise bag movement."
            />

            {summary && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <div className="text-sm text-gray-500">Today Sales</div>
                        <div className="text-2xl font-bold text-gray-900">{formatMoney(summary.today_sales)}</div>
                    </Card>
                    <Card>
                        <div className="text-sm text-gray-500">This Week Sales</div>
                        <div className="text-2xl font-bold text-gray-900">{formatMoney(summary.week_sales)}</div>
                    </Card>
                    <Card>
                        <div className="text-sm text-gray-500">This Month Sales</div>
                        <div className="text-2xl font-bold text-gray-900">{formatMoney(summary.month_sales)}</div>
                    </Card>
                    <Card>
                        <div className="text-sm text-gray-500">Total Pending Bills</div>
                        <div className="text-2xl font-bold text-red-600">{formatMoney(summary.total_pending)}</div>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-1">
                    <Card title="Current Godown Stock">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="p-2 text-sm font-semibold">Category</th>
                                        <th className="p-2 text-right text-sm font-semibold">Available Bags</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stock.map((item) => (
                                        <tr key={item.category} className="border-b">
                                            <td className="p-2 text-sm">{item.category}</td>
                                            <td className="p-2 text-right text-sm font-bold">{item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card title="Customer Summary (Godown Only)">
                        <div className="h-[28rem] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white">
                                    <tr className="border-b bg-gray-50">
                                        <th className="w-8 p-2 text-sm font-semibold"></th>
                                        <th className="p-2 text-sm font-semibold">Customer</th>
                                        <th className="p-2 text-right text-sm font-semibold">Bags</th>
                                        <th className="p-2 text-right text-sm font-semibold">Pending</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((customer) => {
                                        const categories = customer.categories || [];
                                        const isExpanded = expandedCustomer === customer.id;

                                        return (
                                            <React.Fragment key={customer.id}>
                                                <tr className="border-b">
                                                    <td className="p-2 text-sm">
                                                        {categories.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedCustomer(isExpanded ? null : customer.id)}
                                                                className="font-bold text-gray-500 hover:text-gray-700"
                                                            >
                                                                {isExpanded ? '-' : '+'}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-sm font-medium">{customer.name}</td>
                                                    <td className="p-2 text-right text-sm font-semibold text-gray-900">
                                                        {customer.total_bags}
                                                    </td>
                                                    <td
                                                        className={`p-2 text-right text-sm font-semibold ${
                                                            parseFloat(customer.pending_balance) > 0
                                                                ? 'text-red-600'
                                                                : 'text-green-600'
                                                        }`}
                                                    >
                                                        {formatMoney(customer.pending_balance)}
                                                    </td>
                                                </tr>

                                                {isExpanded && categories.length > 0 && (
                                                    <tr className="border-b bg-gray-50">
                                                        <td colSpan={4} className="p-3">
                                                            <div className="flex flex-wrap gap-2">
                                                                {categories.map((category) => (
                                                                    <span
                                                                        key={`${customer.id}-${category.category}`}
                                                                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs"
                                                                    >
                                                                        <span className="font-medium text-gray-700">
                                                                            {category.category}
                                                                        </span>
                                                                        <span className="text-gray-600">
                                                                            {category.bags} bags
                                                                        </span>
                                                                        <span className="text-blue-600">
                                                                            {formatMoney(category.amount)}
                                                                        </span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}

                                    {customers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center text-sm text-gray-500">
                                                No customers have fetched Godown items yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card title="All Godown Invoices">
                        <div className="overflow-x-auto">
                            <table className="w-full whitespace-nowrap text-left">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="p-3 text-sm font-semibold text-gray-700">Invoice #</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700">Date</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700">Customer</th>
                                        <th className="p-3 text-right text-sm font-semibold text-gray-700">Pending Amt</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-700">Status</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-700">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 text-sm font-medium">{invoice.invoice_number}</td>
                                            <td className="p-3 text-sm">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                                            <td className="p-3 text-sm">{invoice.customer_name}</td>
                                            <td className="p-3 text-right text-sm font-bold text-red-600">
                                                {formatMoney(invoice.pending_amount)}
                                            </td>
                                            <td className="p-3 text-center text-sm">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                        invoice.status === 'paid'
                                                            ? 'bg-green-100 text-green-800'
                                                            : invoice.status === 'partial'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {invoice.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="space-x-2 p-3 text-center text-sm">
                                                {invoice.status !== 'paid' && (
                                                    <Button size="sm" onClick={() => handleOpenPayment(invoice)}>
                                                        Collect
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleShareInvoice(invoice.id)}
                                                    disabled={sharingId === invoice.id || !shareSupported}
                                                >
                                                    {sharingId === invoice.id ? '...' : 'Share'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleBluetoothPrint(invoice.id)}
                                                    disabled={printingId === invoice.id}
                                                >
                                                    {printingId === invoice.id ? '...' : 'Bluetooth'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownloadInvoice(invoice.id)}
                                                    disabled={downloadingId === invoice.id}
                                                >
                                                    {downloadingId === invoice.id ? '...' : 'PDF'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}

                                    {invoices.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-6 text-center text-gray-500">
                                                All Godown bills are cleared.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            {isPaymentModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b p-4">
                            <h3 className="text-lg font-semibold">Collect Payment</h3>
                            <button
                                type="button"
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleProcessPayment} className="space-y-4 p-4">
                            <div className="rounded-md bg-gray-50 p-3 text-sm">
                                <div className="mb-1 flex justify-between">
                                    <span className="text-gray-500">Invoice:</span>
                                    <span className="font-semibold">{selectedInvoice.invoice_number}</span>
                                </div>
                                <div className="mb-1 flex justify-between">
                                    <span className="text-gray-500">Customer:</span>
                                    <span className="font-semibold">{selectedInvoice.customer_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Max amount:</span>
                                    <span className="font-bold text-red-600">{formatMoney(selectedInvoice.pending_amount)}</span>
                                </div>
                            </div>

                            <Input
                                label="Payment Amount (Rs)"
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
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2"
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

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                                    Cancel
                                </Button>
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
