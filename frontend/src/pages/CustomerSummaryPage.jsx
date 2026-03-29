import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import api from '../services/api';

const formatMoney = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const CustomerSummaryPage = () => {
    const navigate = useNavigate();
    const [type, setType] = useState('month');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedCustomer, setExpandedCustomer] = useState(null);

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
            let url = '/reports/download?type=customer-summary';
            if (type === 'day') {
                url += `&date=${date}`;
            } else {
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
        return <div className="py-10 text-center">Loading...</div>;
    }

    const totals = data?.totals || {};
    const tableData = data?.data || [];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Customer Summary Report"
                subtitle="Sales, payments, pending, and category-wise bag totals by customer"
                action={
                    <div className="flex gap-2">
                        <Button onClick={downloadPDF}>Download PDF</Button>
                        <Button variant="secondary" onClick={() => navigate('/reports')}>← Back</Button>
                    </div>
                }
            />

            <Card>
                <div className="flex flex-col items-end gap-4 md:flex-row">
                    <div className="w-full md:w-auto">
                        <label className="mb-1 block text-sm font-medium text-gray-700">Period</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                        >
                            <option value="day">Day</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Current Month</option>
                        </select>
                    </div>

                    {type === 'day' && (
                        <div className="w-full md:w-auto">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                            {formatMoney(totals.total_sales)}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">Total Sales</div>
                    </div>
                </Card>

                <Card>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                            {formatMoney(totals.total_paid)}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">Total Paid</div>
                    </div>
                </Card>

                <Card>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">
                            {formatMoney(totals.total_pending)}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">Total Pending</div>
                    </div>
                </Card>
            </div>

            <Card>
                <h3 className="mb-4 text-lg font-bold text-gray-900">Customer Transactions</h3>
                {tableData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="w-10 px-4 py-3 text-left font-semibold text-gray-700"></th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer Name</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Sales</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Paid</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Pending</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((item, idx) => {
                                    const pendingRatio = item.total_sales > 0
                                        ? (item.total_pending / item.total_sales) * 100
                                        : 0;
                                    const customerKey = item.customer_id ?? idx;
                                    const isExpanded = expandedCustomer === customerKey;
                                    const categories = item.categories || [];

                                    return (
                                        <React.Fragment key={customerKey}>
                                            <tr className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    {categories.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedCustomer(isExpanded ? null : customerKey)}
                                                            className="text-sm font-bold text-gray-500 hover:text-gray-700"
                                                        >
                                                            {isExpanded ? '-' : '+'}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{item.customer_name}</td>
                                                <td className="px-4 py-3 text-right text-blue-600">
                                                    {formatMoney(item.total_sales)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                    {formatMoney(item.total_paid)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-red-600">
                                                    {formatMoney(item.total_pending)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                            item.total_pending === 0
                                                                ? 'bg-green-200 text-green-800'
                                                                : pendingRatio < 25
                                                                    ? 'bg-blue-200 text-blue-800'
                                                                    : pendingRatio < 50
                                                                        ? 'bg-yellow-200 text-yellow-800'
                                                                        : 'bg-red-200 text-red-800'
                                                        }`}
                                                    >
                                                        {item.total_pending === 0
                                                            ? 'Paid'
                                                            : pendingRatio < 25
                                                                ? 'Good'
                                                                : pendingRatio < 50
                                                                    ? 'Warning'
                                                                    : 'High'}
                                                    </span>
                                                </td>
                                            </tr>

                                            {isExpanded && categories.length > 0 && (
                                                <tr className="border-b border-gray-100 bg-gray-50">
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {categories.map((category) => (
                                                                <span
                                                                    key={`${customerKey}-${category.category_name}`}
                                                                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs"
                                                                >
                                                                    <span className="font-medium text-gray-700">
                                                                        {category.category_name}
                                                                    </span>
                                                                    <span className="text-gray-600">
                                                                        {category.total_bags} bags
                                                                    </span>
                                                                    <span className="text-blue-600">
                                                                        {formatMoney(category.category_amount)}
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
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-6 text-center text-gray-500">
                        No customer data available for the selected period
                    </div>
                )}
            </Card>
        </div>
    );
};

export default CustomerSummaryPage;
