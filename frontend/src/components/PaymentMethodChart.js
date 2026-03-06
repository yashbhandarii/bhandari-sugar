import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from './ui/Card';

const PaymentMethodChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + item.amount, 0);

    const COLORS = ['#10b981', '#3b82f6', '#f97316', '#a855f7', '#ef4444'];

    // Prepare data for recharts
    const chartData = data.map(d => ({
        name: d.method.charAt(0).toUpperCase() + d.method.slice(1),
        value: d.amount
    }));

    return (
        <Card title="Payment Methods" className="h-full">
            <div className="relative" style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Total */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-sm font-bold text-gray-900">₹{(total / 1000).toFixed(1)}k</p>
                </div>
            </div>
        </Card>
    );
};

export default PaymentMethodChart;
