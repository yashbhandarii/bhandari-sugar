import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import ConfirmModal from '../components/ui/ConfirmModal';
import { preventScrollChange, handleEnterKey } from '../utils/inputHelpers';

const BillingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Rate inputs
    const [mediumRate, setMediumRate] = useState('');
    const [superSmallRate, setSuperSmallRate] = useState('');

    // Discounts per customer: { customer_id: { type: 'percentage'|'fixed', value: number } }
    const [discounts, setDiscounts] = useState({});
    const [discountType, setDiscountType] = useState('none');
    const [discountValue, setDiscountValue] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);

    // Preview data
    const [previewData, setPreviewData] = useState(null);
    const [previewing, setPreviewing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // Fetch initial delivery sheet data
    useEffect(() => {
        const fetchSheetData = async () => {
            try {
                await api.get(`/delivery-sheets/${id}`);
                // Initialize with empty rates (manager must enter)
                setMediumRate('');
                setSuperSmallRate('');
                setError(null);
            } catch (err) {
                console.error("Error fetching delivery sheet", err);
                setError(err.response?.data?.error || "Failed to load delivery sheet");
            }
        };
        fetchSheetData();
    }, [id]);

    // Validate rates
    const validateRates = () => {
        if (!mediumRate || !superSmallRate) {
            toast.error('Please enter both Medium Rate and Super Small Rate');
            return false;
        }
        const mr = parseFloat(mediumRate);
        const sr = parseFloat(superSmallRate);
        if (mr <= 0 || sr <= 0) {
            toast.error('Rates must be positive numbers');
            return false;
        }
        return true;
    };

    // Load preview with rates and discounts
    const handleLoadPreview = async () => {
        if (!validateRates()) return;

        setPreviewing(true);
        setError(null);
        try {
            const payload = {
                medium_rate: parseFloat(mediumRate),
                super_small_rate: parseFloat(superSmallRate),
                discounts: discounts // Pass all discounts
            };

            const res = await api.post(`/billing/preview/${id}`, payload);
            setPreviewData(res.data);
            setSelectedCustomerId(null); // Reset discount selection
        } catch (err) {
            console.error("Error loading preview", err);
            setError(err.response?.data?.error || "Failed to load preview");
            setPreviewData(null);
        } finally {
            setPreviewing(false);
        }
    };

    // Apply discount to a customer
    const handleApplyDiscount = () => {
        if (!selectedCustomerId) {
            toast.error('Please select a customer first');
            return;
        }
        if (discountType === 'none') {
            // Remove discount
            const newDiscounts = { ...discounts };
            delete newDiscounts[selectedCustomerId];
            setDiscounts(newDiscounts);
            setError(null);
        } else {
            // Apply discount
            if (!discountValue || parseFloat(discountValue) < 0) {
                toast.error('Please enter a valid discount value');
                return;
            }
            setDiscounts({
                ...discounts,
                [selectedCustomerId]: {
                    type: discountType,
                    value: parseFloat(discountValue)
                }
            });
            setError(null);
        }
        setDiscountType('none');
        setDiscountValue('');
    };

    // Generate invoices
    const handleGenerateInvoices = async () => {
        if (!previewData) {
            toast.error('Please load preview first');
            return;
        }

        setConfirmModalOpen(true);
    };

    const executeGenerateInvoices = async () => {
        setConfirmModalOpen(false);
        setSubmitting(true);
        try {
            const payload = {
                medium_rate: parseFloat(mediumRate),
                super_small_rate: parseFloat(superSmallRate),
                discounts: discounts
            };

            await api.post(`/billing/generate/${id}`, payload);
            toast.success('Billing generated successfully!');
            navigate('/manager/delivery-sheets');
        } catch (err) {
            console.error("Error generating invoices", err);
            toast.error('Failed to generate invoices: ' + (err.response?.data?.error || err.message));
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Manager Billing - Sheet #${id}`}
                subtitle="Enter rates, apply discounts, and generate invoices"
            />

            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                <ExclamationCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-red-700 font-medium">Error loading delivery sheet</p>
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
            </div>}

            {/* RATE ENTRY SECTION */}
            <Card title="Step 1: Enter Rates (GST Inclusive)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Medium Bag Rate (₹)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={mediumRate}
                            onChange={(e) => setMediumRate(e.target.value)}
                            onWheel={preventScrollChange}
                            onKeyDown={handleEnterKey}
                            placeholder="e.g., 1050"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1">Rate should include 5% GST</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Super Small Bag Rate (₹)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={superSmallRate}
                            onChange={(e) => setSuperSmallRate(e.target.value)}
                            onWheel={preventScrollChange}
                            onKeyDown={handleEnterKey}
                            placeholder="e.g., 1260"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1">Rate should include 5% GST</p>
                    </div>
                </div>
            </Card>

            {/* DISCOUNT SECTION */}
            <Card title="Step 2: Optional - Apply Discounts (Per Customer)">
                <div className="space-y-4">
                    {previewData?.previews?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Customer
                                </label>
                                <select
                                    value={selectedCustomerId || ''}
                                    onChange={(e) => {
                                        const cid = e.target.value ? parseInt(e.target.value) : null;
                                        setSelectedCustomerId(cid);
                                        // Populate existing discount if any
                                        if (cid && discounts[cid]) {
                                            setDiscountType(discounts[cid].type);
                                            setDiscountValue(discounts[cid].value.toString());
                                        } else {
                                            setDiscountType('none');
                                            setDiscountValue('');
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Choose customer...</option>
                                    {previewData.previews.map((p) => (
                                        <option key={p.customer_id} value={p.customer_id}>
                                            {p.customer_name} ({p.medium_bags}M, {p.super_small_bags}S)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount Type
                                </label>
                                <select
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="none">No Discount</option>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>

                            {discountType !== 'none' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {discountType === 'percentage' ? 'Discount %' : 'Discount ₹'}
                                    </label>
                                    <input
                                        type="number"
                                        step={discountType === 'percentage' ? '0.1' : '0.01'}
                                        min="0"
                                        max={discountType === 'percentage' ? '100' : undefined}
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        onWheel={preventScrollChange}
                                        onKeyDown={handleEnterKey}
                                        placeholder={discountType === 'percentage' ? '10' : '1000'}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            )}

                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    onClick={handleApplyDiscount}
                                    variant="secondary"
                                    size="md"
                                    className="w-full"
                                >
                                    {discountType === 'none' ? 'Clear' : 'Apply'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Load preview first to manage discounts per customer</p>
                    )}

                    {/* Display applied discounts */}
                    {Object.keys(discounts).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Applied Discounts:</p>
                            <div className="space-y-1">
                                {Object.entries(discounts).map(([customerId, discount]) => {
                                    const customer = previewData?.previews?.find(p => p.customer_id === parseInt(customerId));
                                    return (
                                        <div key={customerId} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                                            {customer?.customer_name}: {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* PREVIEW & LOAD BUTTON */}
            <div className="flex justify-center">
                <Button
                    onClick={handleLoadPreview}
                    variant="primary"
                    size="lg"
                    disabled={previewing}
                >
                    {previewing ? 'Loading Preview...' : 'Load Preview'}
                </Button>
            </div>

            {/* LIVE PREVIEW SECTION */}
            {previewData && previewData.previews && previewData.previews.length > 0 && (
                <Card title="Step 3: Review Preview & Generate Invoices">
                    {/* Items Table */}
                    <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3">Items to be Billed:</h4>
                        <div className="responsive-table">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Customer</th>
                                        <th className="px-4 py-2 text-right">Medium</th>
                                        <th className="px-4 py-2 text-right">Super Small</th>
                                        <th className="px-4 py-2 text-right">Subtotal</th>
                                        <th className="px-4 py-2 text-right">Discount</th>
                                        <th className="px-4 py-2 text-right">Net</th>
                                        <th className="px-4 py-2 text-right">SGST</th>
                                        <th className="px-4 py-2 text-right">CGST</th>
                                        <th className="px-4 py-2 text-right font-bold">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.previews && previewData.previews.length > 0 && previewData.previews.map((preview) => (
                                        <tr key={preview?.customer_id || Math.random()} className="border-b hover:bg-gray-50">
                                            <td data-label="Customer" className="px-4 py-2 font-medium">{preview?.customer_name || 'Unknown'}</td>
                                            <td data-label="Medium" className="px-4 py-2 text-right">{preview?.medium_bags || 0}</td>
                                            <td data-label="S.Small" className="px-4 py-2 text-right">{preview?.super_small_bags || 0}</td>
                                            <td data-label="Subtotal" className="px-4 py-2 text-right text-gray-600 text-xs">
                                                ₹{((preview?.inclusive_total || 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td data-label="Discount" className="px-4 py-2 text-right text-orange-600 font-medium">
                                                {((preview?.discount_amount || 0) || 0) > 0 ? (
                                                    <>
                                                        -₹{((preview?.discount_amount || 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        <span className="text-xs text-gray-500 block sm:inline ml-1">
                                                            ({(preview?.discount_type || '') === 'percentage' ? `${preview?.discount_value || 0}%` : 'Fixed'})
                                                        </span>
                                                    </>
                                                ) : '₹0'}
                                            </td>
                                            <td data-label="Net" className="px-4 py-2 text-right text-gray-600 text-xs">
                                                ₹{((preview?.subtotal || 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} + GST
                                            </td>
                                            <td data-label="SGST" className="px-4 py-2 text-right text-blue-600 font-medium">
                                                ₹{((preview?.sgst_amount || 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td data-label="CGST" className="px-4 py-2 text-right text-blue-600 font-medium">
                                                ₹{((preview?.cgst_amount || 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td data-label="Total" className="px-4 py-2 text-right font-bold text-lg text-primary">
                                                ₹{((preview?.total_amount || 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <p className="text-xs text-gray-600">Base Subtotal</p>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{(previewData?.totals?.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600">SGST (2.5%)</p>
                                <p className="text-lg font-bold text-blue-600">
                                    ₹{(previewData?.totals?.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600">CGST (2.5%)</p>
                                <p className="text-lg font-bold text-blue-600">
                                    ₹{(previewData?.totals?.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600">Total Discount</p>
                                <p className="text-lg font-bold text-orange-600">
                                    -₹{(previewData?.totals?.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="border-l-2 border-primary pl-4">
                                <p className="text-xs text-gray-600">Final Total</p>
                                <p className="text-2xl font-bold text-primary">
                                    ₹{(previewData?.totals?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-end gap-4">
                        <Button
                            onClick={() => navigate('/manager/delivery-sheets')}
                            variant="secondary"
                            size="md"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGenerateInvoices}
                            variant="primary"
                            size="md"
                            disabled={submitting}
                        >
                            {submitting ? 'Generating...' : 'Generate Invoices'}
                        </Button>
                    </div>
                </Card>
            )}

            <ConfirmModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={executeGenerateInvoices}
                title="Generate Invoices"
                message="Are you sure you want to generate invoices? This action cannot be undone."
                confirmText="Generate"
                cancelText="Cancel"
                isDestructive={false}
            />
        </div>
    );
};

export default BillingPage;
