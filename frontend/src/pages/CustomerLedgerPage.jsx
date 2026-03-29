import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import LedgerTable from '../components/LedgerTable';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';

const CustomerLedgerPage = () => {
    const { customerId } = useParams();
    const [transactions, setTransactions] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!customerId || customerId === 'undefined') {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Get Customer Details
                const custRes = await api.get(`/customers/${customerId}`);
                setCustomer(custRes.data);

                // 2. Get Payments
                const payRes = await api.get(`/payments/customer/${customerId}`);
                const payments = payRes.data.map(p => ({
                    date: p.payment_date,
                    type: 'payment',
                    subType: p.payment_method,
                    amount: parseFloat(p.amount),
                    credit: parseFloat(p.amount),
                    debit: 0,
                    created_at: p.created_at
                }));

                // 3. Get Invoices
                const invRes = await api.get(`/billing/customer/${customerId}`);
                const invoices = invRes.data.map(i => ({
                    date: i.created_at,
                    type: 'invoice',
                    subType: `Sheet #${i.delivery_sheet_id}`,
                    amount: parseFloat(i.total_amount),
                    credit: 0,
                    debit: parseFloat(i.total_amount),
                    created_at: i.created_at
                }));

                // Merge and Sort by Date (Oldest First)
                // On the same date, invoices (debits) appear before payments (credits)
                const typePriority = { invoice: 0, payment: 1 };
                const all = [...payments, ...invoices].sort((a, b) => {
                    let dateAKey, dateBKey;
                    
                    const dateAObj = new Date(a.date);
                    if (isNaN(dateAObj.getTime())) {
                        dateAKey = '9999-12-31';
                    } else {
                        dateAKey = dateAObj.toISOString().split('T')[0];
                    }
                    
                    const dateBObj = new Date(b.date);
                    if (isNaN(dateBObj.getTime())) {
                        dateBKey = '9999-12-31';
                    } else {
                        dateBKey = dateBObj.toISOString().split('T')[0];
                    }
                    
                    if (dateAKey < dateBKey) return -1;
                    if (dateAKey > dateBKey) return 1;
                    
                    // Same date: invoices first, then payments
                    return (typePriority[a.type] || 0) - (typePriority[b.type] || 0);
                });

                // Calculate Running Balance
                let runningBalance = 0;
                const ledger = all.map(txn => {
                    runningBalance = runningBalance + txn.debit - txn.credit;
                    return { ...txn, balance: runningBalance.toFixed(2) };
                });

                setTransactions(ledger);
                setLoading(false);

            } catch (err) {
                console.error("Error loading ledger", err);
                setLoading(false);
            }
        };

        fetchData();
    }, [customerId]);

    if (!customerId) return <div className="p-6 text-center text-gray-500">Select a customer to view ledger.</div>;
    if (loading) return <div className="p-6 text-center text-gray-500">Loading Ledger...</div>;

    const currentBalance = parseFloat(transactions[transactions.length - 1]?.balance || 0);

    const handleSendReminder = () => {
        if (!customer || !customer.mobile) {
            alert('Customer mobile number is missing.');
            return;
        }

        const formattedBalance = currentBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 });
        const message = `Hello ${customer.name}, this is a friendly reminder from Bhandari Sugar. Your current pending balance is Rs. ${formattedBalance}. Please arrange for payment at your earliest convenience. Thank you!`;
        const whatsappUrl = `https://wa.me/91${customer.mobile}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Customer Ledger"
                subtitle={`Transaction history for ${customer?.name || 'Customer'}`}
            />

            <Card className="bg-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{customer?.name}</h2>
                        <p className="text-gray-500">{customer?.mobile}</p>
                        <p className="text-gray-500 text-sm mt-1">{customer?.address}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 min-w-[200px] text-right">
                            <span className="block text-xs text-gray-500 uppercase font-semibold tracking-wider">Current Balance</span>
                            <span className={`text-2xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{currentBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-gray-400 block mt-1">
                                {currentBalance > 0 ? '(Payment Pending)' : '(Advance/Clear)'}
                            </span>
                        </div>
                        {currentBalance > 0 && customer?.mobile && (
                            <button
                                onClick={handleSendReminder}
                                className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium shadow-sm transition"
                                title="Send reminder via WhatsApp"
                            >
                                <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                                Send Reminder
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            <LedgerTable transactions={transactions} />
        </div>
    );
};

export default CustomerLedgerPage;
