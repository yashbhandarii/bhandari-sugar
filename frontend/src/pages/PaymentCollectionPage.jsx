import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PaymentForm from '../components/PaymentForm';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { printPaymentReceiptHTML } from '../utils/thermalPrinter';

const PaymentCollectionPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastPayment, setLastPayment] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get('/customers?limit=1000');
                setCustomers(Array.isArray(res.data) ? res.data : (res.data.data || []));
                setLoading(false);
            } catch (error) {
                console.error("Error fetching customers", error);
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const handlePaymentSubmit = async (paymentData) => {
        setSubmitting(true);
        try {
            const res = await api.post('/payments', paymentData);
            toast.success("Payment recorded successfully!");

            // Get customer name for receipt
            const customer = customers.find(c => c.id === parseInt(paymentData.customer_id));

            // Prepare payment receipt data
            setLastPayment({
                customer_name: customer?.name || 'Customer',
                mobile: customer?.mobile || '',
                amount: paymentData.amount,
                discount: paymentData.discount,
                method: paymentData.payment_method,
                old_pending: res.data?.old_pending || 0,
                new_pending: res.data?.new_pending || 0,
                date: new Date().toISOString(),
                invoice_id: paymentData.invoice_id
            });

            setShowSuccess(true);
        } catch (error) {
            console.error("Error recording payment", error);
            toast.error("Failed to record payment: " + (error.response?.data?.error || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrintReceipt = () => {
        if (lastPayment) {
            printPaymentReceiptHTML(lastPayment);
        }
    };

    const handleNewPayment = () => {
        setShowSuccess(false);
        setLastPayment(null);
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Loading Customers...</div>;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Payment Collection"
                subtitle="Record received payments against customer accounts"
            />

            {/* Success Dialog */}
            {showSuccess && lastPayment && (
                <Card>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl text-green-600">✓</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">Payment Recorded!</h3>
                            <div className="mt-2 text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">Customer:</span> {lastPayment.customer_name}</p>
                                {lastPayment.amount > 0 && (
                                    <p><span className="font-medium">Amount:</span> ₹{parseFloat(lastPayment.amount).toFixed(2)}</p>
                                )}
                                {lastPayment.discount > 0 && (
                                    <p><span className="font-medium">Discount:</span> ₹{parseFloat(lastPayment.discount).toFixed(2)}</p>
                                )}
                                <p><span className="font-medium">New Pending:</span> ₹{parseFloat(lastPayment.new_pending).toFixed(2)}</p>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <Button
                                    variant="primary"
                                    onClick={handlePrintReceipt}
                                >
                                    Print Receipt
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleNewPayment}
                                >
                                    Record Another
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {!showSuccess && (
                <PaymentForm
                    customers={customers}
                    onSubmit={handlePaymentSubmit}
                    isSubmitting={submitting}
                />
            )}
        </div>
    );
};

export default PaymentCollectionPage;
