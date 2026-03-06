import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import CardSkeleton from '../components/ui/CardSkeleton';

const ReportsDashboard = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/reports/dashboard-summary-advanced');
            setDashboardData(res.data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const reports = [
        {
            title: "Today's Cash Collection",
            description: 'Track cash payments received today by customer',
            icon: '💰',
            path: '/reports/today-cash',
            action: () => navigate('/reports/today-cash')
        },
        {
            title: 'Customer Summary',
            description: 'Sales, payments, and pending by customer',
            icon: '👥',
            path: '/reports/customer-summary',
            action: () => navigate('/reports/customer-summary')
        },
        {
            title: 'Aging Report',
            description: 'Track overdue invoices by customer',
            icon: '📊',
            path: '/reports/aging',
            action: () => navigate('/reports/aging')
        },
        {
            title: 'Discount Impact',
            description: 'Analyze discount trends and impact',
            icon: '📉',
            path: '/reports/discount-impact',
            action: () => navigate('/reports/discount-impact')
        },
        {
            title: 'Payment Delays',
            description: 'Customers with pending payments',
            icon: '⏰',
            path: '/reports/payment-delay',
            action: () => navigate('/reports/payment-delay')
        }
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Advanced Reports Center" subtitle="Loading analytics..." />
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    const data = dashboardData || {};

    return (
        <div className="space-y-6">
            <PageHeader
                title="Advanced Reports Center"
                subtitle="Financial insights and business analytics"
            />

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Today's Collections */}
                <Card>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                            {(data.today?.total_today || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Today Collected</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Cash: {(data.today?.cash_collected || 0).toFixed(0)}
                        </div>
                    </div>
                </Card>

                {/* Total Pending */}
                <Card>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">
                            {(data.pending?.total_pending || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Total Pending</div>
                        <div className="text-xs text-gray-500 mt-1">All Customers</div>
                    </div>
                </Card>

                {/* Week Sales */}
                <Card>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                            {(data.sales?.week_sales || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Week Sales</div>
                        <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
                    </div>
                </Card>

                {/* Month Sales */}
                <Card>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                            {(data.sales?.month_sales || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Month Sales</div>
                        <div className="text-xs text-gray-500 mt-1">Current month</div>
                    </div>
                </Card>

                {/* High Risk */}
                <Card>
                    <div className="text-center">
                        <div className={`text-3xl font-bold ${data.risk?.aging_high_risk_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {data.risk?.aging_high_risk_count || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">High Risk</div>
                        <div className="text-xs text-gray-500 mt-1">30+ days pending</div>
                    </div>
                </Card>
            </div>

            {/* Report Cards */}
            <div>
                <h2 className="text-xl font-bold mb-4">Available Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.map((report, idx) => (
                        <Card key={idx} className="cursor-pointer hover:shadow-lg transition-shadow">
                            <div className="flex flex-col h-full">
                                <div className="text-4xl mb-3">{report.icon}</div>
                                <h3 className="text-lg font-bold text-gray-900">{report.title}</h3>
                                <p className="text-sm text-gray-600 mt-2 flex-grow">{report.description}</p>
                                <Button
                                    onClick={report.action}
                                    className="mt-4 w-full"
                                >
                                    View Report
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReportsDashboard;
