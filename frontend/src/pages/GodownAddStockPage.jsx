import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const GodownAddStockPage = () => {
    const [category, setCategory] = useState('Medium');
    const [quantity, setQuantity] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [currentStock, setCurrentStock] = useState([]);
    const [loadingStock, setLoadingStock] = useState(true);

    const fetchStock = async () => {
        setLoadingStock(true);
        try {
            const res = await api.get('/godown/reports/stock');
            const stockData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setCurrentStock(stockData);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load current Godown stock.');
            setCurrentStock([]);
        } finally {
            setLoadingStock(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    const handleAddStock = async (e) => {
        e.preventDefault();

        if (!quantity || parseInt(quantity) <= 0) {
            toast.error('Please enter a valid positive quantity.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/godown/stock', { category, quantity: parseInt(quantity) });
            toast.success(`Successfully added ${quantity} bags to ${category}.`);
            setQuantity('');
            fetchStock(); // Refresh stock table
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to add Godown stock.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Godown: Add Stock"
                subtitle="Directly manage inventory isolated to the Godown."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Register Inbound Stock">
                    <form onSubmit={handleAddStock} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="Medium">Medium</option>
                                <option value="Super Small">Super Small</option>
                            </select>
                        </div>

                        <Input
                            label="Number of Bags"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="e.g. 100"
                            required
                        />

                        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
                            {submitting ? 'Adding Stock...' : 'Add to Godown'}
                        </Button>
                    </form>
                </Card>

                <Card title="Current Godown Levels">
                    {loadingStock ? (
                        <p className="text-gray-500">Loading stock levels...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="p-3 text-sm font-semibold text-gray-700">Category</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 text-right">Available Bags</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(currentStock || []).map((item, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="p-3 text-sm">{item.category}</td>
                                            <td className="p-3 text-sm text-right font-bold text-gray-900">{item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default GodownAddStockPage;
