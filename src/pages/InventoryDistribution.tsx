import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Users, TrendingUp, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function InventoryDistribution() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'distribution' | 'report'>('distribution');

    // Distribution form state
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [distributionForm, setDistributionForm] = useState({
        categoryId: '',
        godownId: '',
        quantity: '',
        distributionDate: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // Fetch data
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await fetch('/api/categories');
            return res.json();
        },
    });

    const { data: godowns } = useQuery({
        queryKey: ['godowns'],
        queryFn: async () => {
            const res = await fetch('/api/godowns');
            return res.json();
        },
    });

    // Auto-set godown ID when godowns are loaded
    useEffect(() => {
        if (godowns && godowns.length > 0) {
            setDistributionForm(prev => ({ ...prev, godownId: godowns[0].id.toString() }));
        }
    }, [godowns]);

    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await fetch('/api/customers');
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

    const { data: purchases } = useQuery({
        queryKey: ['inventory-purchases'],
        queryFn: async () => {
            const res = await fetch('/api/inventory-purchases');
            return res.json();
        },
    });

    const { data: report } = useQuery({
        queryKey: ['distribution-report'],
        queryFn: async () => {
            const res = await fetch('/api/inventory-distributions/report');
            return res.json();
        },
        enabled: activeTab === 'report',
    });

    const { data: customerDistributions } = useQuery({
        queryKey: ['customer-distributions', selectedCustomerId],
        queryFn: async () => {
            const res = await fetch(`/api/inventory-distributions/customer/${selectedCustomerId}`);
            return res.json();
        },
        enabled: !!selectedCustomerId,
    });

    // Create distribution mutation
    const createDistribution = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/inventory-distributions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create distribution');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-distributions'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['customer-distributions'] });
            setDistributionForm({
                categoryId: '',
                godownId: '',
                quantity: '',
                distributionDate: new Date().toISOString().split('T')[0],
                notes: '',
            });
            alert('Distribution recorded successfully!');
        },
        onError: (error: any) => {
            alert(error.message || 'Failed to create distribution');
        },
    });

    const handleDistributionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomerId) {
            alert('Please select a customer');
            return;
        }
        createDistribution.mutate({
            customerId: selectedCustomerId,
            ...distributionForm,
            categoryId: parseInt(distributionForm.categoryId),
            godownId: parseInt(distributionForm.godownId),
            quantity: parseInt(distributionForm.quantity),
        });
    };



    const getAvailableStock = (categoryId: string, godownId: string) => {
        if (!categoryId || !godownId || !inventory) return 0;
        const stock = inventory.find(
            (inv: any) => inv.categoryId === parseInt(categoryId) && inv.godownId === parseInt(godownId)
        );
        return stock?.quantity || 0;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Inventory Distribution</h1>
                <p className="mt-2 text-gray-600">Manage customer distributions</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-3 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('distribution')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'distribution'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Users className="inline mr-2" size={20} />
                    Customer Distribution
                </button>
                <button
                    onClick={() => setActiveTab('report')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'report'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <TrendingUp className="inline mr-2" size={20} />
                    Distribution Report
                </button>
            </div>


            {/* Customer Distribution Tab */}
            {activeTab === 'distribution' && (
                <div className="space-y-6">
                    {/* Customer Selection */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Select Customer</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {customers?.map((customer: any) => (
                                <button
                                    key={customer.id}
                                    onClick={() => setSelectedCustomerId(customer.id)}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${selectedCustomerId === customer.id
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-gray-200 hover:border-primary-300'
                                        }`}
                                >
                                    <p className="font-bold text-gray-900">{customer.name}</p>
                                    {customer.mobile && <p className="text-sm text-gray-500">{customer.mobile}</p>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Distribution Form */}
                    {selectedCustomerId && (
                        <>
                            <div className="bg-white rounded-xl shadow-md p-6 relative">
                                <div className="absolute top-6 right-6 text-right">
                                    <p className="text-sm text-gray-500">Total Purchased Today ({new Date(distributionForm.distributionDate).toLocaleDateString()})</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {purchases?.filter((p: any) =>
                                            new Date(p.date).toISOString().split('T')[0] === distributionForm.distributionDate
                                        ).reduce((sum: number, p: any) => sum + p.quantity, 0) || 0} bags
                                    </p>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Distribute Bags</h2>
                                <form onSubmit={handleDistributionSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category *
                                        </label>
                                        <select
                                            value={distributionForm.categoryId}
                                            onChange={(e) =>
                                                setDistributionForm({ ...distributionForm, categoryId: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories?.map((cat: any) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>



                                    {distributionForm.categoryId && distributionForm.godownId && (
                                        <div>
                                            <div className="p-4 bg-blue-50 rounded-lg">
                                                <p className="text-sm font-medium text-blue-900">
                                                    Available Stock:{' '}
                                                    <span className="text-lg font-bold">
                                                        {getAvailableStock(
                                                            distributionForm.categoryId,
                                                            distributionForm.godownId
                                                        )}{' '}
                                                        bags
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quantity (Bags) *
                                        </label>
                                        <input
                                            type="number"
                                            value={distributionForm.quantity}
                                            onChange={(e) =>
                                                setDistributionForm({ ...distributionForm, quantity: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            min="1"
                                            max={getAvailableStock(distributionForm.categoryId, distributionForm.godownId)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                        <input
                                            type="date"
                                            value={distributionForm.distributionDate}
                                            onChange={(e) =>
                                                setDistributionForm({
                                                    ...distributionForm,
                                                    distributionDate: e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                        <textarea
                                            value={distributionForm.notes}
                                            onChange={(e) =>
                                                setDistributionForm({ ...distributionForm, notes: e.target.value })
                                            }
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            placeholder="Optional notes..."
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <button
                                            type="submit"
                                            disabled={createDistribution.isPending}
                                            className="flex items-center px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors disabled:opacity-50"
                                        >
                                            <Plus size={20} className="mr-2" />
                                            {createDistribution.isPending ? 'Distributing...' : 'Distribute Bags'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Customer Distribution History */}
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Distribution History</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Category
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Quantity
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Rate/Quintal
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {customerDistributions?.map((dist: any) => (
                                                <tr key={dist.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(dist.distributionDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {dist.categoryName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                                                        {dist.quantity} bags
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatCurrency(dist.ratePerQuintal)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Distribution Report Tab */}
            {activeTab === 'report' && report && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Purchased</p>
                                    <p className="mt-2 text-3xl font-bold text-green-600">
                                        {report.categoryPurchases?.reduce((sum: number, p: any) => sum + (p.totalPurchased || 0), 0) || 0} bags
                                    </p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <Package className="text-green-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Distributed</p>
                                    <p className="mt-2 text-3xl font-bold text-orange-600">
                                        {report.categoryDistributions?.reduce((sum: number, d: any) => sum + (d.totalDistributed || 0), 0) || 0} bags
                                    </p>
                                </div>
                                <div className="bg-orange-100 p-3 rounded-lg">
                                    <Users className="text-orange-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Remaining Stock</p>
                                    <p className="mt-2 text-3xl font-bold text-primary-600">
                                        {report.currentStock?.reduce((sum: number, s: any) => sum + (s.remaining || 0), 0) || 0} bags
                                    </p>
                                </div>
                                <div className="bg-primary-100 p-3 rounded-lg">
                                    <TrendingUp className="text-primary-600" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category-wise Report */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Category-wise Summary</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Purchased
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Distributed
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Remaining
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {categories?.map((category: any) => {
                                        const purchased =
                                            report.categoryPurchases?.find((p: any) => p.categoryId === category.id)
                                                ?.totalPurchased || 0;
                                        const distributed =
                                            report.categoryDistributions?.find((d: any) => d.categoryId === category.id)
                                                ?.totalDistributed || 0;
                                        const remaining =
                                            report.currentStock?.find((s: any) => s.categoryId === category.id)
                                                ?.remaining || 0;

                                        return (
                                            <tr key={category.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {category.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                    {purchased} bags
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                                                    {distributed} bags
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600 font-bold">
                                                    {remaining} bags
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Customer-wise Distribution */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Customer-wise Distribution</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Total Bags Received
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {report.customerDistributions?.map((customer: any) => (
                                        <tr key={customer.customerId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {customer.customerName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">
                                                {customer.totalBags} bags
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
