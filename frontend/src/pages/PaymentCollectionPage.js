import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PaymentForm from '../components/PaymentForm';
import PageHeader from '../components/ui/PageHeader';
import toast from 'react-hot-toast';

const PaymentCollectionPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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
            await api.post('/payments', paymentData);
            toast.success("Payment recorded successfully!");
            setSubmitting(false);
            window.location.reload();
        } catch (error) {
            console.error("Error recording payment", error);
            toast.error("Failed to record payment: " + (error.response?.data?.error || error.message));
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Loading Customers...</div>;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Payment Collection"
                subtitle="Record received payments against customer accounts"
            />

            <PaymentForm
                customers={customers}
                onSubmit={handlePaymentSubmit}
                isSubmitting={submitting}
            />
        </div>
    );
};

export default PaymentCollectionPage;
