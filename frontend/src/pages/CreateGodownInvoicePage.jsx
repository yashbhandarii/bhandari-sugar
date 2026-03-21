import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import PrintInstructionsModal from '../components/ui/PrintInstructionsModal';
import api from '../services/api';
import { printInvoice, shareInvoice } from '../utils/thermalPrinter';

const formatMoney = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

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

    const [showSuccess, setShowSuccess] = useState(false);
    const [lastInvoice, setLastInvoice] = useState(null);
    const [printingTransport, setPrintingTransport] = useState(null);
    const [sharing, setSharing] = useState(false);
    const [showPrintHelp, setShowPrintHelp] = useState(false);
    const bluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    const shareSupported = typeof navigator !== 'undefined' && 'share' in navigator;

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get('/customers');
                const customerData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setCustomers(customerData);
            } catch (err) {
                toast.error('Failed to load customers');
                setCustomers([]);
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

        if (parseInt(bags, 10) <= 0 || parseFloat(rate) <= 0) {
            toast.error('Bags and rate must be greater than zero.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                customer_id: customerId,
                invoice_date: invoiceDate,
                category,
                bags: parseInt(bags, 10),
                rate: parseFloat(rate),
                discount_amount: parseFloat(discountAmount) || 0
            };

            const res = await api.post('/godown/invoices', payload);
            toast.success('Godown GST invoice created successfully!');

            const invoiceId = res.data.data?.id;
            if (invoiceId) {
                try {
                    const invoiceRes = await api.get(`/godown/invoices/${invoiceId}`);
                    setLastInvoice(invoiceRes.data);
                } catch {
                    setLastInvoice(null);
                }
            }

            setShowSuccess(true);
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

    const handleDirectPrint = async () => {
        if (!lastInvoice) return;

        setPrintingTransport('bluetooth');
        try {
            await printInvoice(lastInvoice);
            toast.success('Invoice sent to Bluetooth printer.');
        } catch (err) {
            const message = err?.message || 'Printer connection failed.';
            if (err?.name === 'NotFoundError' || err?.name === 'AbortError') {
                toast('Printer selection cancelled.');
            } else if (err?.name === 'SecurityError') {
                toast.error('Browser blocked the permission prompt. Click the printer button again directly.');
            } else if (message.includes('Web Bluetooth is not available')) {
                toast.error('This mobile browser does not support Web Bluetooth. Use Share to Print instead.');
            } else {
                toast.error(message);
            }
        } finally {
            setPrintingTransport(null);
        }
    };

    const handleSharePrint = async () => {
        if (!lastInvoice) return;

        setSharing(true);
        try {
            await shareInvoice(lastInvoice);
        } catch (err) {
            if (err?.name === 'AbortError') {
                toast('Share cancelled.');
            } else {
                toast.error(err?.message || 'Sharing failed on this device.');
            }
        } finally {
            setSharing(false);
        }
    };

    const parsedBags = parseInt(bags, 10) || 0;
    const parsedRate = parseFloat(rate) || 0;
    const parsedDiscount = parseFloat(discountAmount) || 0;
    const grossTotal = parsedBags * parsedRate;
    const inclusiveTotal = grossTotal - parsedDiscount;
    const projectedBase = inclusiveTotal > 0 ? inclusiveTotal / 1.05 : 0;
    const projectedGst = inclusiveTotal > 0 ? inclusiveTotal - projectedBase : 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Create Godown Invoice"
                subtitle="Generate GST-inclusive invoices from Godown stock and print them on 58mm thermal paper."
            />

            {showSuccess && (
                <Card>
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                            <span className="text-2xl text-green-600">OK</span>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">Invoice Created Successfully</h3>
                            {lastInvoice && (
                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                    <p><span className="font-medium">Invoice #:</span> {lastInvoice.invoice_number}</p>
                                    <p><span className="font-medium">Customer:</span> {lastInvoice.name}</p>
                                    <p><span className="font-medium">Amount:</span> {formatMoney(lastInvoice.total_amount)}</p>
                                </div>
                            )}

                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button variant="primary" onClick={handleSharePrint} disabled={sharing}>
                                    {sharing ? 'Sharing...' : 'Share to Print'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleDirectPrint}
                                    disabled={printingTransport !== null}
                                >
                                    {printingTransport === 'bluetooth' ? 'Printing...' : 'Bluetooth ESC/POS'}
                                </Button>
                                <Button variant="secondary" onClick={() => setShowPrintHelp(true)}>
                                    Print Setup Help
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowSuccess(false);
                                        setLastInvoice(null);
                                    }}
                                >
                                    Create Another
                                </Button>
                            </div>

                            <p className="mt-3 text-xs text-gray-500">
                                The thermal template is sized for standard 58mm printers with about 48mm printable width.
                            </p>
                            {!bluetoothSupported && (
                                <p className="mt-2 text-xs text-amber-700">
                                    Web Bluetooth is not available in this mobile browser. Use Share to Print to open your printer app directly.
                                </p>
                            )}
                            {!shareSupported && (
                                <p className="mt-2 text-xs text-amber-700">
                                    Share is not available in this browser. Open this page in a modern mobile browser to send the invoice to your print app.
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Card title="Invoice Details">
                        <form onSubmit={handleCreateInvoice} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Customer</label>
                                    <select
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary disabled:bg-gray-100"
                                        disabled={loadingCustomers}
                                        required
                                    >
                                        <option value="">Select Customer...</option>
                                        {(customers || []).map((customer) => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </option>
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

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
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
                                    label="Inclusive Rate (Rs)"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    placeholder="Rate with GST"
                                    required
                                />
                            </div>

                            <Input
                                label="Discount Amount (Rs)"
                                type="number"
                                step="0.01"
                                min="0"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(e.target.value)}
                                placeholder="Enter discount if any"
                            />

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
                            <div className="flex items-center justify-between border-b pb-2 text-sm">
                                <span className="text-gray-600">Gross (bags x rate)</span>
                                <span className="font-semibold text-gray-900">{formatMoney(grossTotal)}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2 text-sm">
                                <span className="text-gray-600">Discount Applied</span>
                                <span className="font-semibold text-red-600">- {formatMoney(parsedDiscount)}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2 text-sm">
                                <span className="text-gray-600">Base Amount (Taxable)</span>
                                <span className="font-semibold text-gray-900">{formatMoney(projectedBase)}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2 text-sm">
                                <span className="text-gray-600">Total GST (5%)</span>
                                <span className="font-semibold text-gray-900">{formatMoney(projectedGst)}</span>
                            </div>
                            <div className="mt-4 flex items-center justify-between rounded-md bg-gray-50 p-3 text-lg">
                                <span className="font-bold text-gray-700">Grand Total</span>
                                <span className="font-extrabold text-primary">
                                    {formatMoney(inclusiveTotal >= 0 ? inclusiveTotal : 0)}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <PrintInstructionsModal isOpen={showPrintHelp} onClose={() => setShowPrintHelp(false)} />
        </div>
    );
};

export default CreateGodownInvoicePage;
