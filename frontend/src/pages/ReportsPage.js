import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ReportTable from '../components/ReportTable';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const ReportsPage = () => {
    const [reportType, setReportType] = useState('day'); // day, week, month
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const [data, setData] = useState([]);
    const [totals, setTotals] = useState({ sale: 0, paid: 0, pending: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Init dates for week
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        setStart(lastWeek.toISOString().split('T')[0]);
        setEnd(today.toISOString().split('T')[0]);
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            let res;
            if (reportType === 'day') {
                res = await api.get(`/reports/day?date=${date}`);
            } else if (reportType === 'week') {
                res = await api.get(`/reports/week?start=${start}&end=${end}`);
            } else if (reportType === 'month') {
                res = await api.get(`/reports/month?month=${month}&year=${year}`);
            }

            const items = res.data;
            setData(items);

            // Calc totals
            const totalSale = items.reduce((sum, item) => sum + item.total_sale, 0);
            const totalPaid = items.reduce((sum, item) => sum + item.total_paid, 0);
            const totalPending = items.reduce((sum, item) => sum + item.pending_amount, 0);
            setTotals({ sale: totalSale, paid: totalPaid, pending: totalPending });

        } catch (error) {
            console.error("Error fetching report", error);
            setError(error.response?.data?.error || "Failed to generate report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        // Construct relative URL
        let url = `/reports/download?type=${reportType}`;
        if (reportType === 'day') url += `&date=${date}`;
        else if (reportType === 'week') url += `&start=${start}&end=${end}`;
        else if (reportType === 'month') url += `&month=${month}&year=${year}`;

        downloadWithAuth(url);
    };

    const downloadWithAuth = async (url) => {
        try {
            const res = await api.get(url, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Report_${reportType}_${new Date().toISOString()}.pdf`;
            link.click();
        } catch (error) {
            console.error("Download failed", error);
            setError(error.response?.data?.error || "Download failed. Please try again.");
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Advanced Reports"
                subtitle="Generate comprehensive financial reports"
                action={
                    <Button onClick={handleDownloadPDF} disabled={data.length === 0}>
                        Download PDF
                    </Button>
                }
            />

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <ExclamationCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-red-700 font-medium">Failed to load report</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
                </div>
            )}

            <Card>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-auto">
                        <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                        <select
                            id="reportType"
                            name="reportType"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                        >
                            <option value="day">Day Report</option>
                            <option value="week">Week Report</option>
                            <option value="month">Monthly Report</option>
                        </select>
                    </div>

                    {reportType === 'day' && (
                        <div className="w-full md:w-auto">
                            <Input id="reportDate" name="reportDate" type="date" label="Select Date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                    )}

                    {reportType === 'week' && (
                        <>
                            <div className="w-full md:w-auto"><Input id="startDate" name="startDate" type="date" label="Start Date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
                            <div className="w-full md:w-auto"><Input id="endDate" name="endDate" type="date" label="End Date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
                        </>
                    )}

                    {reportType === 'month' && (
                        <>
                            <div className="w-full md:w-auto">
                                <label htmlFor="reportMonth" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                <select id="reportMonth" name="reportMonth" className="bg-gray-50 border border-gray-300 rounded-lg p-2.5 w-full" value={month} onChange={(e) => setMonth(e.target.value)}>
                                    {[...Array(12)].map((_, i) => <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                                </select>
                            </div>
                            <div className="w-full md:w-auto">
                                <label htmlFor="reportYear" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <select id="reportYear" name="reportYear" className="bg-gray-50 border border-gray-300 rounded-lg p-2.5 w-full" value={year} onChange={(e) => setYear(e.target.value)}>
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="w-full md:w-auto pb-1">
                        <Button onClick={fetchReport} disabled={loading}>
                            {loading ? 'Generatin...' : 'Generate Report'}
                        </Button>
                    </div>
                </div>
            </Card>

            <ReportTable
                data={data}
                totalSale={totals.sale}
                totalPaid={totals.paid}
                totalPending={totals.pending}
            />
        </div>
    );
};

export default ReportsPage;
