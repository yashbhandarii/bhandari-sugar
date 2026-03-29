import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const DiscountImpactPage = () => {
    const navigate = useNavigate();
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
            let url = `/reports/discount-impact?type=${type}`;
            if (type === 'day') {
                url += `&date=${date}`;
            }
            const res = await api.get(url);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching discount impact report:', error);
            toast.error('Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        try {
            let url = `/reports/download?type=discount&type=${type}`;
            if (type === 'day') {
                url += `&date=${date}`;
            }
            const res = await api.get(url, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Discount_Impact_Report_${new Date().toISOString().split('T')[0]}.pdf`;
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
                title="Discount Impact Report"
                subtitle="Analyze discount trends and their impact on revenue"
                action={
                    <div className="flex gap-2">
                        <Button onClick={downloadPDF}>
                            Download PDF
                        </Button>
                        <Button variant="secondary" onClick={() => navigate('/reports')}>
                            ← Back
                        </Button>
                    </div>
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
                            <option value="week">Week</option>
                            <option value="month">Month</option>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {(totals.overall_gross_sales || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Gross Sales</div>
                    </div>
                </Card>

                <Card>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {(totals.overall_discount_total || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Discount Given</div>
                    </div>
                </Card>

                <Card>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {(totals.overall_net_revenue || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Net Revenue</div>
                    </div>
                </Card>

                <Card>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {(totals.overall_discount_percentage || 0).toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Discount %</div>
                    </div>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Discount by Customer</h3>
                {tableData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer Name</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Gross Sales</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Discount Given</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Net Sales</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Discount %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-900">{item.customer_name}</td>
                                        <td className="text-right py-3 px-4 text-gray-900">
                                            {item.total_gross_sales.toFixed(2)}
                                        </td>
                                        <td className="text-right py-3 px-4 text-red-600 font-semibold">
                                            {item.total_discount_given.toFixed(2)}
                                        </td>
                                        <td className="text-right py-3 px-4 text-gray-900">
                                            {item.net_sales.toFixed(2)}
                                        </td>
                                        <td className="text-right py-3 px-4 text-blue-600 font-semibold">
                                            {item.discount_percentage.toFixed(2)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-500">
                        No data available for the selected period
                    </div>
                )}
            </Card>
        </div>
    );
};

export default DiscountImpactPage;
