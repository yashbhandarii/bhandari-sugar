import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package } from 'lucide-react';

export default function GodownManagement() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', location: '' });

    const { data: godowns } = useQuery({
        queryKey: ['godowns'],
        queryFn: async () => {
            const res = await fetch('/api/godowns');
            return res.json();
        },
    });

    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: async () => {
            const res = await fetch('/api/inventory');
            return res.json();
        },
    });

    const createGodown = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/godowns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['godowns'] });
            setFormData({ name: '', location: '' });
            setShowForm(false);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createGodown.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Godown Management</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} className="mr-2" />
                    Add Godown
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">New Godown</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="md:col-span-2 flex gap-3">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {godowns?.map((godown: any) => {
                    const godownStock = inventory?.filter((inv: any) => inv.godownId === godown.id) || [];
                    const totalStock = godownStock.reduce((sum: number, inv: any) => sum + inv.quantity, 0);

                    return (
                        <div key={godown.id} className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="bg-primary-100 p-3 rounded-lg mr-3">
                                        <Package className="text-primary-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{godown.name}</h3>
                                        {godown.location && (
                                            <p className="text-sm text-gray-500">{godown.location}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Total Stock:</span>
                                    <span className="text-lg font-bold text-primary-600">{totalStock} bags</span>
                                </div>

                                {godownStock.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-xs font-medium text-gray-500 mb-2">Stock by Category:</p>
                                        {godownStock.map((inv: any) => (
                                            <div key={inv.id} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{inv.categoryName}:</span>
                                                <span className="font-medium">{inv.quantity} bags</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
