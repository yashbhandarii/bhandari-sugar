import React, { useEffect, useState } from 'react';
import Card from './ui/Card';
import api from '../services/api';

const StockSummaryCard = () => {
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const res = await api.get('/delivery-sheets/stock-summary');
                setStockData(res.data || []);
            } catch (e) {
                console.error('Error fetching stock summary', e);
            } finally {
                setLoading(false);
            }
        };
        fetchStock();
    }, []);

    const COLORS = {
        medium: { bar: 'bg-yellow-500', text: 'text-yellow-600' },
        super_small: { bar: 'bg-purple-500', text: 'text-purple-600' },
    };

    const grandTotal = stockData.reduce((sum, r) => sum + (r.total_bags || 0), 0);
    const maxBags = Math.max(...stockData.map(r => r.total_bags || 0), 1);

    const getColor = (name) => {
        const key = name?.toLowerCase().replace(/\s+/g, '_');
        return COLORS[key] || { bar: 'bg-blue-500', text: 'text-blue-600' };
    };

    return (
        <Card title="Delivery Stock (This Year)" className="h-full">
            {loading ? (
                <p className="text-sm text-gray-400 mt-4">Loading stock data...</p>
            ) : stockData.length === 0 ? (
                <p className="text-sm text-gray-400 mt-4">No delivery data yet for this year.</p>
            ) : (
                <div className="space-y-6 mt-4">
                    {stockData.map((row) => {
                        const { bar } = getColor(row.category);
                        const pct = Math.min((row.total_bags / maxBags) * 100, 100);
                        return (
                            <div key={row.category}>
                                <div className="flex justify-between mb-1.5">
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                        {row.category.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {row.total_bags.toLocaleString()} Bags
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div
                                        className={`${bar} h-3 rounded-full transition-all duration-1000`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Total Bags Delivered (Year)
                </p>
                <p className="text-3xl font-bold text-gray-800">
                    {grandTotal.toLocaleString()}{' '}
                    <span className="text-base font-normal text-gray-500">Bags</span>
                </p>
            </div>
        </Card>
    );
};

export default StockSummaryCard;
