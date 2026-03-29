import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const AgingReportPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgingReport();
    }, []);

    const fetchAgingReport = async () => {
        try {
            setLoading(true);
            const res = await api.get('/reports/aging');
            setData(res.data);
        } catch (error) {
            console.error('Error fetching aging report:', error);
            toast.error('Failed to fetch aging report');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        try {
            const res = await api.get('/reports/download?type=aging', { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Aging_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('PDF download failed');
        }
    };

    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    const buckets = data?.by_bucket || {};
    const bucketOrder = ['0-7 days', '8-15 days', '16-30 days', '30+ days'];
    const bucketColors = {
        '0-7 days': 'bg-green-50 border-green-200',
        '8-15 days': 'bg-yellow-50 border-yellow-200',
        '16-30 days': 'bg-orange-50 border-orange-200',
        '30+ days': 'bg-red-50 border-red-200'
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Aging Report"
                subtitle="Track overdue invoices grouped by age"
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                            {(data?.total_pending || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Total Pending</div>
                    </div>
                </Card>
                <Card>
                    <div className={`text-center ${data?.high_risk_count > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                        <div className={`text-3xl font-bold ${data?.high_risk_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {data?.high_risk_count || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">High Risk (30+ days)</div>
                    </div>
                </Card>
            </div>

            {/* Aging Buckets */}
            <div className="space-y-4">
                {bucketOrder.map(bucket => {
                    const bucketData = buckets[bucket] || { count: 0, total: 0, data: [] };
                    return (
                        <Card key={bucket} className={`border-l-4 ${bucketColors[bucket]}`}>
                            <div className="mb-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900">{bucket}</h3>
                                    <div className="text-sm font-semibold">
                                        <span className="text-gray-700">Count: {bucketData.count}</span>
                                        <span className="mx-4 text-gray-400">|</span>
                                        <span className="text-gray-700">Total: {bucketData.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {bucketData.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer Name</th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Pending Amount</th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Days Pending</th>
                                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Risk Level</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bucketData.data.map((item, idx) => (
                                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-gray-900">{item.customer_name}</td>
                                                    <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                                                        {item.pending_amount.toFixed(2)}
                                                    </td>
                                                    <td className="text-right py-3 px-4 text-gray-900">
                                                        {item.days_pending}
                                                    </td>
                                                    <td className="text-center py-3 px-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.risk_level === 'HIGH_RISK' ? 'bg-red-200 text-red-800' :
                                                                item.risk_level === 'MEDIUM_RISK' ? 'bg-orange-200 text-orange-800' :
                                                                    item.risk_level === 'WATCH_LIST' ? 'bg-yellow-200 text-yellow-800' :
                                                                        'bg-green-200 text-green-800'
                                                            }`}>
                                                            {item.risk_level.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    No customers in this bracket
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default AgingReportPage;
