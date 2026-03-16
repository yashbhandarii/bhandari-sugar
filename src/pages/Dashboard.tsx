import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Users, FileText, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function Dashboard() {
    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await fetch('/api/customers');
            return res.json();
        },
    });

    const { data: invoices } = useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const res = await fetch('/api/invoices');
            return res.json();
        },
    });

    const { data: categorySales } = useQuery({
        queryKey: ['category-sales'],
        queryFn: async () => {
            const res = await fetch('/api/reports/category-sales');
            return res.json();
        },
    });

    const { data: outstanding } = useQuery({
        queryKey: ['customer-outstanding'],
        queryFn: async () => {
            const res = await fetch('/api/reports/customer-outstanding');
            return res.json();
        },
    });

    const totalSales = invoices?.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0) || 0;
    const totalPending = outstanding?.reduce((sum: number, cust: any) => sum + cust.pending, 0) || 0;
    const totalPaid = totalSales - totalPending;

    const stats = [
        {
            name: 'Total Sales',
            value: formatCurrency(totalSales),
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            name: 'Total Pending',
            value: formatCurrency(totalPending),
            icon: TrendingDown,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
        {
            name: 'Total Paid',
            value: formatCurrency(totalPaid),
            icon: TrendingUp,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            name: 'Total Customers',
            value: customers?.length || 0,
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            name: 'Total Invoices',
            value: invoices?.length || 0,
            icon: FileText,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-100',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-2 text-gray-600">Welcome to Bhandari Sugar Management System</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.name}
                            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                                    <Icon className={stat.color} size={24} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Category-wise Sales */}
            {categorySales && categorySales.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Category-wise Sales</h2>
                    <div className="space-y-4">
                        {categorySales.map((cat: any) => (
                            <div key={cat.categoryId} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{cat.categoryName}</p>
                                    <p className="text-sm text-gray-500">{cat.totalQuantity} bags</p>
                                </div>
                                <p className="text-lg font-bold text-primary-600">
                                    {formatCurrency(cat.totalAmount)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Outstanding Customers */}
            {outstanding && outstanding.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center mb-4">
                        <AlertCircle className="text-orange-500 mr-2" size={24} />
                        <h2 className="text-xl font-bold text-gray-900">Customers with Pending Payments</h2>
                    </div>
                    <div className="space-y-3">
                        {outstanding.slice(0, 5).map((cust: any) => (
                            <div key={cust.customerId} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{cust.customerName}</p>
                                    <p className="text-sm text-gray-500">
                                        Total: {formatCurrency(cust.totalInvoiced)} | Paid: {formatCurrency(cust.totalPaid)}
                                    </p>
                                </div>
                                <p className="text-lg font-bold text-orange-600">
                                    {formatCurrency(cust.pending)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
