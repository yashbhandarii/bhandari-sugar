import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const todayStr = () => new Date().toISOString().split('T')[0];

const TodayCashPage = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchCashData(selectedDate);
        // Auto-refresh every 2 minutes ONLY when viewing today
        let interval;
        if (selectedDate === todayStr()) {
            interval = setInterval(() => fetchCashData(selectedDate), 2 * 60 * 1000);
        }
        return () => clearInterval(interval);
    }, [selectedDate]);

    const fetchCashData = async (date) => {
        try {
            setLoading(true);
            const res = await api.get(`/reports/today-cash?date=${date}`);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching cash collection:', error);
            toast.error('Failed to fetch cash collection data');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        setDownloading(true);
        try {
            const res = await api.get(
                `/reports/download?type=today-cash&date=${selectedDate}`,
                { responseType: 'blob' }
            );
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Cash_Collection_${selectedDate}.pdf`;
            link.click();
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('PDF download failed');
        } finally {
            setDownloading(false);
        }
    };

    const isToday = selectedDate === todayStr();
    const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const totalCollected = data?.total_cash_collected || 0;
    const tableData = data?.data || [];

    return (
        <div className="space-y-6">
            <PageHeader
                title={isToday ? "Today's Cash Collection" : "Cash Collection Report"}
                subtitle={`Cash received on ${displayDate}`}
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Date Picker */}
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <label htmlFor="cash-date" className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                📅 Date
                            </label>
                            <input
                                id="cash-date"
                                type="date"
                                value={selectedDate}
                                max={todayStr()}
                                onChange={(e) => {
                                    if (e.target.value) setSelectedDate(e.target.value);
                                }}
                                className="text-sm text-gray-800 bg-transparent border-none outline-none cursor-pointer"
                            />
                        </div>

                        {/* Quick navigation buttons */}
                        <div className="flex gap-1">
                            <button
                                onClick={() => {
                                    const d = new Date(selectedDate + 'T00:00:00');
                                    d.setDate(d.getDate() - 1);
                                    setSelectedDate(d.toISOString().split('T')[0]);
                                }}
                                className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
                                title="Previous day"
                            >
                                ← Prev
                            </button>
                            {!isToday && (
                                <button
                                    onClick={() => setSelectedDate(todayStr())}
                                    className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                                    title="Go to today"
                                >
                                    Today
                                </button>
                            )}
                            {selectedDate < todayStr() && (
                                <button
                                    onClick={() => {
                                        const d = new Date(selectedDate + 'T00:00:00');
                                        d.setDate(d.getDate() + 1);
                                        const next = d.toISOString().split('T')[0];
                                        if (next <= todayStr()) setSelectedDate(next);
                                    }}
                                    className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
                                    title="Next day"
                                >
                                    Next →
                                </button>
                            )}
                        </div>

                        <Button onClick={downloadPDF} disabled={downloading || loading}>
                            {downloading ? 'Generating...' : '⬇ Download PDF'}
                        </Button>
                        <Button variant="secondary" onClick={() => navigate('/reports')}>
                            ← Back
                        </Button>
                    </div>
                }
            />

            {loading ? (
                <div className="text-center py-16 text-gray-400">
                    <div className="text-3xl mb-2">⏳</div>
                    <p className="text-sm">Loading cash collection data...</p>
                </div>
            ) : (
                <>
                    {/* Total Summary */}
                    <Card className={`border-l-4 ${totalCollected > 0 ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-600' : 'bg-gray-50 border-gray-300'}`}>
                        <div className="text-center">
                            <div className={`text-4xl font-bold ${totalCollected > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-lg text-gray-600 mt-3">
                                Total Cash Collected{isToday ? ' Today' : ` on ${displayDate}`}
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                                {tableData.length} payment(s) received
                            </div>
                        </div>
                    </Card>

                    {/* Payments Detail Table */}
                    <Card>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h3>
                        {tableData.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer Name</th>
                                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Invoice ID</th>
                                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Payment Amount</th>
                                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Remaining Pending</th>
                                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Last Invoice Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.map((item, idx) => (
                                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 text-gray-900 font-medium">
                                                    {item.customer_name}
                                                </td>
                                                <td className="py-3 px-4 text-center text-gray-900">
                                                    {item.invoice_id ? `#${item.invoice_id}` : '—'}
                                                </td>
                                                <td className="text-right py-3 px-4 text-green-600 font-bold">
                                                    ₹{parseFloat(item.payment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-right py-3 px-4">
                                                    <span className={`px-3 py-1 rounded font-semibold text-sm ${parseFloat(item.remaining_pending) === 0
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-orange-100 text-orange-800'
                                                        }`}>
                                                        ₹{parseFloat(item.remaining_pending).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="text-center py-3 px-4 text-gray-600 text-sm">
                                                    {item.last_invoice_date
                                                        ? new Date(item.last_invoice_date).toLocaleDateString('en-IN')
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <div className="text-2xl mb-2">💰</div>
                                <p>No cash collections recorded on {displayDate}</p>
                            </div>
                        )}
                    </Card>

                    {/* Summary Stats */}
                    {tableData.length > 0 && (
                        <Card>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600">Number of Payments</div>
                                    <div className="text-2xl font-bold text-gray-900 mt-1">
                                        {tableData.length}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Average Payment</div>
                                    <div className="text-2xl font-bold text-gray-900 mt-1">
                                        ₹{(totalCollected / tableData.length).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Total Still Pending</div>
                                    <div className="text-2xl font-bold text-red-600 mt-1">
                                        ₹{tableData.reduce((sum, item) => sum + parseFloat(item.remaining_pending), 0)
                                            .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default TodayCashPage;
