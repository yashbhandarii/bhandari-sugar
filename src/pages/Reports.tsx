import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function Reports() {
    const [reportType, setReportType] = useState<'daily' | 'monthly' | 'outstanding'>('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: dailyReport } = useQuery({
        queryKey: ['daily-report', selectedDate],
        queryFn: async () => {
            const res = await fetch(`/api/reports/daily?date=${selectedDate}`);
            return res.json();
        },
        enabled: reportType === 'daily',
    });

    const { data: monthlyReport } = useQuery({
        queryKey: ['monthly-report'],
        queryFn: async () => {
            const now = new Date();
            const res = await fetch(`/api/reports/monthly?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
            return res.json();
        },
        enabled: reportType === 'monthly',
    });

    const { data: outstanding } = useQuery({
        queryKey: ['customer-outstanding'],
        queryFn: async () => {
            const res = await fetch('/api/reports/customer-outstanding');
            return res.json();
        },
        enabled: reportType === 'outstanding',
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="mt-2 text-gray-600">View business insights and reports</p>
            </div>

            {/* Report Type Selector */}
            <div className="flex gap-3">
                <button
                    onClick={() => setReportType('daily')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportType === 'daily'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    Daily Report
                </button>
                <button
                    onClick={() => setReportType('monthly')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportType === 'monthly'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    Monthly Report
                </button>
                <button
                    onClick={() => setReportType('outstanding')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportType === 'outstanding'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    Outstanding
                </button>
            </div>

            {/* Daily Report */}
            {reportType === 'daily' && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {dailyReport && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                                        <p className="mt-2 text-3xl font-bold text-gray-900">
                                            {dailyReport.totalInvoices}
                                        </p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <FileText className="text-blue-600" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Sales</p>
                                        <p className="mt-2 text-3xl font-bold text-green-600">
                                            {formatCurrency(dailyReport.totalSales)}
                                        </p>
                                    </div>
                                    <div className="bg-green-100 p-3 rounded-lg">
                                        <TrendingUp className="text-green-600" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Payments Received</p>
                                        <p className="mt-2 text-3xl font-bold text-primary-600">
                                            {formatCurrency(dailyReport.totalPayments)}
                                        </p>
                                    </div>
                                    <div className="bg-primary-100 p-3 rounded-lg">
                                        <TrendingUp className="text-primary-600" size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Monthly Report */}
            {reportType === 'monthly' && monthlyReport && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {monthlyReport.totalInvoices}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <p className="text-sm font-medium text-gray-600">Total Sales</p>
                        <p className="mt-2 text-3xl font-bold text-green-600">
                            {formatCurrency(monthlyReport.totalSales)}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <p className="text-sm font-medium text-gray-600">Payments Received</p>
                        <p className="mt-2 text-3xl font-bold text-primary-600">
                            {formatCurrency(monthlyReport.totalPayments)}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="mt-2 text-3xl font-bold text-orange-600">
                            {formatCurrency(monthlyReport.pending)}
                        </p>
                    </div>
                </div>
            )}

            {/* Outstanding Report */}
            {reportType === 'outstanding' && outstanding && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Total Invoiced
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Total Paid
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Pending
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {outstanding.map((customer: any) => (
                                    <tr key={customer.customerId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {customer.customerName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(customer.totalInvoiced)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                            {formatCurrency(customer.totalPaid)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                                            {formatCurrency(customer.pending)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
