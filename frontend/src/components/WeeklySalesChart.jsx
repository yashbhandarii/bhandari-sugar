import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from './ui/Card';

const WeeklySalesChart = ({ data }) => {
    if (!data || data.length === 0) return (
        <Card className="mb-8 h-64 flex items-center justify-center text-gray-400">
            No sales data for this week.
        </Card>
    );

    // Format date for XAxis
    const formattedData = data.map(d => ({
        ...d,
        day: new Date(d.day).toLocaleDateString(undefined, { weekday: 'short' })
    }));

    return (
        <Card title="Weekly Performance (Last 7 Days)" className="mb-8">
            <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                        <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']}
                        />
                        <Bar dataKey="total_sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default WeeklySalesChart;
