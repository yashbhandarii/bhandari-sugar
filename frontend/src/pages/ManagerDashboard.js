import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import SummaryCard from '../components/ui/SummaryCard';
import Table, { TableRow, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import CardSkeleton from '../components/ui/CardSkeleton';
import {
    BanknotesIcon,
    ExclamationCircleIcon,
    ChartBarIcon,
    CubeIcon
} from '@heroicons/react/24/outline';

const ManagerDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [pendingCustomers, setPendingCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch dashboard summary and pending customers concurrently
            const [summaryRes, pendingRes] = await Promise.all([
                api.get('/reports/dashboard'),
                api.get('/reports/payment-delay')
            ]);

            setSummary(summaryRes.data);

            // Check structure from advanced-report.service.js return
            if (pendingRes.data && pendingRes.data.data) {
                // Limit to top 5 or 10 for dashboard view
                setPendingCustomers(pendingRes.data.data.slice(0, 10));
            } else {
                setPendingCustomers([]);
            }
        } catch (error) {
            console.error("Error fetching dashboard data", error);
            setError(error.response?.data?.error || "Failed to load dashboard. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Manager Dashboard" subtitle="Overview of sales, inventory, and payments" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader title="Manager Dashboard" subtitle="Overview of sales, inventory, and payments" />
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center">
                    <ExclamationCircleIcon className="w-12 h-12 text-red-600 mb-4" />
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Dashboard</h3>
                    <p className="text-red-700 text-center mb-4">{error}</p>
                    <Button onClick={fetchData} variant="primary">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const { total_sales, total_pending, today_collection, stock } = summary || {};

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'No Payments';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-8 pb-12 overflow-x-hidden">
            <PageHeader
                title="Dashboard Overview"
                subtitle="Real-time monitoring of your business performance"
                action={
                    <Button
                        onClick={() => window.location.href = '/manager/customers'}
                        className="shadow-vibrant"
                    >
                        Manage Customers
                    </Button>
                }
            />

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <SummaryCard
                    title="Today's Collection"
                    value={`₹${today_collection?.toLocaleString() || 0}`}
                    icon={<BanknotesIcon />}
                    color="primary"
                />
                <SummaryCard
                    title="Total Pending"
                    value={`₹${total_pending?.toLocaleString() || 0}`}
                    icon={<ExclamationCircleIcon />}
                    color="red"
                />
                <SummaryCard
                    title="Last 7 Days Sales"
                    value={`₹${total_sales?.toLocaleString() || 0}`}
                    icon={<ChartBarIcon />}
                    color="blue"
                />
                <div className="grid grid-cols-1 gap-4">
                    <SummaryCard
                        title="Medium Stock"
                        value={`${stock?.medium || 0} Bags`}
                        icon={<CubeIcon />}
                        color="secondary"
                    />
                </div>
            </div>

            {/* Pending Customers Section */}
            <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50/30">
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">Top Priority Pending Customers</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Sorted by delayed payments</p>
                    </div>
                    <Badge status="High Priority" className="bg-red-50 text-red-500 self-start sm:self-auto mt-2 sm:mt-0" />
                </div>

                <div className="p-2">
                    {pendingCustomers.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="bg-gray-50 inline-flex p-4 rounded-full mb-4">
                                <BanknotesIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-400 font-bold">No pending payments recorded.</p>
                        </div>
                    ) : (
                        <div className="responsive-table">
                            <Table headers={['Customer Name', 'Pending Amount', 'Last Payment', 'Delay']}>
                                {pendingCustomers.map((c, i) => (
                                    <TableRow key={i}>
                                        <TableCell data-label="Customer" className="font-bold text-gray-900">{c.customer_name}</TableCell>
                                        <TableCell data-label="Pending" className="text-red-500 font-black">₹{c.pending_amount?.toLocaleString()}</TableCell>
                                        <TableCell data-label="Last Payment" className="font-medium text-gray-500">{formatDate(c.last_payment_date)}</TableCell>
                                        <TableCell data-label="Delay">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${c.days_since_last_payment > 14 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {c.days_since_last_payment ? `${c.days_since_last_payment}d` : '-'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
