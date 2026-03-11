import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const CustomerSummaryPage = () => {
    const [type, setType] = useState('month');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, date]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            let url = `/reports/customer-summary?type=${type}`;
            if (type === 'day') {
                url += `&date=${date}`;
            }
            const res = await api.get(url);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching customer summary:', error);
            toast.error('Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        try {
            let url = `/reports/download?type=customer-summary`;
            if (type === 'day') {
                url += `&date=${date}`;
            } else if (type === 'week') {
                url += `&period=${type}`;
            } else if (type === 'month') {
                url += `&period=${type}`;
            }
            const res = await api.get(url, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Customer_Summary_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('PDF download failed');
        }
    };

    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    const totals = data?.totals || {};
    const tableData = data?.data || [];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Customer Summary Report"
                subtitle="Sales, payments, and pending by customer"
                action={
                    <Button onClick={downloadPDF}>
                        Download PDF
                    </Button>
                }
            />

            {/* Filters */}
            <Card>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        >
                            <option value="day">Day</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Current Month</option>
                        </select>
                    </div>

                    {type === 'day' && (
                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                            {(totals.total_sales || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Total Sales</div>
                    </div>
                </Card>

                <Card>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                            {(totals.total_paid || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Total Paid</div>
                    </div>
                </Card>

                <Card>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">
                            {(totals.total_pending || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Total Pending</div>
                    </div>
                </Card>
            </div>

            {/* Customer Details Table */}
            <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Transactions</h3>
                {tableData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer Name</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Sales</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Paid</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Pending</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((item, idx) => {
                                    const pendingRatio = item.total_sales > 0
                                        ? (item.total_pending / item.total_sales) * 100
                                        : 0;
                                    return (
                                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-900 font-medium">{item.customer_name}</td>
                                            <td className="text-right py-3 px-4 text-blue-600">
                                                {item.total_sales.toFixed(2)}
                                            </td>
                                            <td className="text-right py-3 px-4 text-green-600 font-semibold">
                                                {item.total_paid.toFixed(2)}
                                            </td>
                                            <td className="text-right py-3 px-4 text-red-600 font-semibold">
                                                {item.total_pending.toFixed(2)}
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.total_pending === 0 ? 'bg-green-200 text-green-800' :
                                                    pendingRatio < 25 ? 'bg-blue-200 text-blue-800' :
                                                        pendingRatio < 50 ? 'bg-yellow-200 text-yellow-800' :
                                                            'bg-red-200 text-red-800'
                                                    }`}>
                                                    {item.total_pending === 0 ? 'Paid' :
                                                        pendingRatio < 25 ? 'Good' :
                                                            pendingRatio < 50 ? 'Warning' :
                                                                'High'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-500">
                        No customer data available for the selected period
                    </div>
                )}
            </Card>
        </div>
    );
};

export default CustomerSummaryPage;
