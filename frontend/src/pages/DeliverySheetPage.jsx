// v3 - Excel-like grid with auto-save
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import TableSkeleton from '../components/ui/TableSkeleton';
import ConfirmModal from '../components/ui/ConfirmModal';
import toast from 'react-hot-toast';
import { preventScrollChange, handleEnterKey } from '../utils/inputHelpers';

// Fixed category IDs - only medium and super small
const MEDIUM_NAME = 'medium';
const SUPER_SMALL_NAME = 'super_small';

const DeliverySheetPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id } = useParams();

    const [truckNumber, setTruckNumber] = useState('');
    const [selectedDriverId, setSelectedDriverId] = useState(user?.id || '');
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [drivers, setDrivers] = useState([]);
    const [sheetId, setSheetId] = useState(id || null);
    const [status, setStatus] = useState('draft');
    const [loading, setLoading] = useState(!!id);

    // Editing truck number state
    const [isEditingTruck, setIsEditingTruck] = useState(false);
    const [tempTruckNumber, setTempTruckNumber] = useState('');

    // customers: [{ id, name, mobile }]
    const [customers, setCustomers] = useState([]);
    // categories: [{ id, name }]
    const [categories, setCategories] = useState([]);
    // rows: { [customerId]: { medium: '', superSmall: '', saved: bool, saving: bool, itemId: number|null } }
    const [rows, setRows] = useState({});
    const [search, setSearch] = useState('');

    // Confirm Modal State
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // Ref to track which customer IDs already have items saved (to avoid duplicate POST)
    const savedItems = useRef({});
    // Debounce timers per customer
    const saveTimers = useRef({});

    useEffect(() => {
        fetchCustomers();
        fetchCategories();
        fetchDrivers();
        if (id) {
            fetchSheetDetails(id);
        }
    }, [id]);

    const fetchDrivers = async () => {
        try {
            const res = await api.get('/auth/drivers');
            setDrivers(res.data || []);
            // Default to current user if they're in the list
            if (user?.id && !selectedDriverId) {
                setSelectedDriverId(user.id);
            }
        } catch (e) {
            console.error('Error fetching drivers', e);
            // Fallback: just show current user
            if (user) {
                setDrivers([{ id: user.id, name: user.name }]);
            }
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (e) {
            console.error('Error fetching categories', e);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers?limit=1000');
            const list = res.data.data || res.data;
            if (Array.isArray(list)) {
                setCustomers(list);
            }
        } catch (e) {
            console.error('Error fetching customers', e);
        }
    };

    const fetchSheetDetails = async (sid) => {
        try {
            const res = await api.get(`/delivery-sheets/${sid}`);
            const sheet = res.data;
            setTruckNumber(sheet.truck_number);
            setStatus(sheet.status);
            setSheetId(sheet.id);

            // Pre-populate rows from existing items
            if (sheet.items && sheet.items.length > 0) {
                const populated = {};
                sheet.items.forEach(item => {
                    // quantities will be mapped properly below via quantitiesDetail
                    populated[item.customer_id] = {
                        medium: '',
                        superSmall: '',
                        saved: true,
                        saving: false,
                        itemId: item.id,
                    };
                    // Map quantities by category name via quantitiesDetail
                    if (item.quantitiesDetail) {
                        item.quantitiesDetail.forEach(q => {
                            const catName = q.category_name?.toLowerCase().replace(' ', '_');
                            if (catName === MEDIUM_NAME) populated[item.customer_id].medium = String(q.bags || '');
                            if (catName === SUPER_SMALL_NAME) populated[item.customer_id].superSmall = String(q.bags || '');
                        });
                    }
                    savedItems.current[item.customer_id] = item.id;
                });
                setRows(populated);
            }
        } catch (e) {
            console.error('Error fetching sheet details', e);
            toast.error('Failed to load sheet details');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSheet = async () => {
        if (!truckNumber.trim()) return toast.error('Enter Truck Number');
        if (!selectedDriverId) return toast.error('Select a Driver');
        if (!deliveryDate) return toast.error('Select Delivery Date');
        try {
            const res = await api.post('/delivery-sheets', {
                truck_number: truckNumber,
                created_by: parseInt(selectedDriverId),
                date: deliveryDate,
            });
            setSheetId(res.data.id);
            setStatus(res.data.status);
            navigate(`/driver/delivery-sheet/${res.data.id}`, { replace: true });
            toast.success('Delivery Sheet Created!');
        } catch (e) {
            toast.error('Failed to create sheet');
        }
    };

    const getCategoryId = useCallback((name) => {
        const cat = categories.find(c => c.name?.toLowerCase().replace(' ', '_') === name);
        return cat ? cat.id : null;
    }, [categories]);

    // Save or update both medium + super small together for a customer in one API call
    const doSave = useCallback(async (customerId, currentRows) => {
        const currentSheetId = sheetId;
        if (!currentSheetId) return;

        const row = currentRows[customerId];
        if (!row) return;

        const medBags = parseInt(row.medium) || 0;
        const ssBags = parseInt(row.superSmall) || 0;

        // Skip if nothing to save
        if (medBags === 0 && ssBags === 0) return;

        const medCatId = getCategoryId(MEDIUM_NAME);
        const ssCatId = getCategoryId(SUPER_SMALL_NAME);
        if (!medCatId || !ssCatId) return;

        const quantities = [];
        if (medBags > 0) quantities.push({ category_id: medCatId, bags: medBags });
        if (ssBags > 0) quantities.push({ category_id: ssCatId, bags: ssBags });

        setRows(prev => ({ ...prev, [customerId]: { ...prev[customerId], saving: true } }));

        try {
            const existingItemId = savedItems.current[customerId];
            if (existingItemId && existingItemId !== true) {
                // Already saved — UPDATE via PUT
                await api.put(`/delivery-sheets/items/${existingItemId}`, { quantities });
            } else if (existingItemId === true) {
                // It was marked as "already exists" but we don't have the ID. 
                // We must fetch the sheet again to get the real item ID to update.
                const sheetRes = await api.get(`/delivery-sheets/${currentSheetId}`);
                const item = sheetRes.data.items?.find(i => i.customer_id === customerId);
                if (item) {
                    savedItems.current[customerId] = item.id;
                    await api.put(`/delivery-sheets/items/${item.id}`, { quantities });
                } else {
                    throw new Error('Item sync failed, please refresh');
                }
            } else {
                // New — CREATE via POST
                const res = await api.post('/delivery-sheets/items', {
                    delivery_sheet_id: currentSheetId,
                    customer_id: customerId,
                    quantities,
                });
                // Only store if we haven't already captured a valid ID from a concurrent request
                if (!savedItems.current[customerId] || savedItems.current[customerId] === true) {
                    savedItems.current[customerId] = res.data.id;
                }
            }
            setRows(prev => ({ ...prev, [customerId]: { ...prev[customerId], saving: false, saved: true } }));
        } catch (e) {
            const msg = e.response?.data?.error || e.message || 'Save failed';
            
            if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
                // If a concurrent request succeeded, we might already have the ID, so don't overwrite it with true.
                if (!savedItems.current[customerId]) {
                    savedItems.current[customerId] = true;
                }
                // Try to resave immediately now that we know it exists, which will trigger the sync logic above
                doSave(customerId, currentRows);
            } else {
                setRows(prev => ({ ...prev, [customerId]: { ...prev[customerId], saving: false, saved: false } }));
                toast.error(msg);
            }
        }
    }, [sheetId, getCategoryId]);

    // On any input change: update state + debounce save by 800ms
    // This ensures both medium & super small are captured before a single save fires
    const handleInputChange = (customerId, field, value) => {
        if (value !== '' && !/^\d+$/.test(value)) return;

        // Cancel any pending save for this customer
        if (saveTimers.current[customerId]) {
            clearTimeout(saveTimers.current[customerId]);
        }

        setRows(prev => {
            const updated = {
                ...prev,
                [customerId]: {
                    medium: '',
                    superSmall: '',
                    saving: false,
                    itemId: null,
                    ...prev[customerId],
                    [field]: value,
                    saved: false,
                }
            };

            // Schedule save — always, even if previously saved (supports re-editing)
            saveTimers.current[customerId] = setTimeout(() => {
                doSave(customerId, updated);
            }, 800);

            return updated;
        });
    };

    const handleDownloadPDF = async () => {
        if (!sheetId) return;
        try {
            const res = await api.get(`/delivery-sheets/${sheetId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `delivery_sheet_${sheetId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (e) {
            toast.error('Failed to download PDF');
        }
    };

    const handleSubmitSheet = async () => {
        if (!sheetId) return;
        setConfirmModalOpen(true);
    };

    const executeSubmitSheet = async () => {
        setConfirmModalOpen(false);
        try {
            await api.post(`/delivery-sheets/${sheetId}/submit`);
            setStatus('submitted');
            toast.success('Sheet Submitted!');
            // Send owner to the delivery sheets list, driver to their history
            if (user?.role === 'owner' || user?.role === 'manager') {
                navigate('/manager/delivery-sheets');
            } else {
                navigate('/driver/history');
            }
        } catch (e) {
            toast.error('Failed to submit: ' + (e.response?.data?.error || e.message));
        }
    };

    const handleSaveTruckNumber = async () => {
        if (!tempTruckNumber.trim()) {
            toast.error('Truck number cannot be empty');
            return;
        }
        try {
            await api.patch(`/delivery-sheets/${sheetId}`, { truck_number: tempTruckNumber });
            setTruckNumber(tempTruckNumber);
            setIsEditingTruck(false);
            toast.success('Truck number updated');
        } catch (e) {
            toast.error('Failed to update truck number: ' + (e.response?.data?.error || e.message));
        }
    };

    const isReadOnly = status !== 'draft';

    // Totals
    const totalMedium = customers.reduce((sum, c) => sum + (parseInt(rows[c.id]?.medium) || 0), 0);
    const totalSS = customers.reduce((sum, c) => sum + (parseInt(rows[c.id]?.superSmall) || 0), 0);

    // Filter customers by search
    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Loading Sheet..." subtitle="Please wait" />
                <TableSkeleton columns={3} rows={10} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <PageHeader
                title={sheetId ? `Sheet #${sheetId}` : 'New Sheet'}
                subtitle={
                    <div className="flex flex-col sm:flex-row gap-1">
                        <span className="text-secondary font-black">{status.toUpperCase()}</span>
                        {sheetId && <><span className="hidden sm:inline text-gray-400">•</span><span className="text-gray-500">Truck: {truckNumber}</span></>}
                    </div>
                }
                action={
                    <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => navigate('/driver/dashboard')}>Back</Button>
                        {sheetId && (
                            <>
                                <Button variant="secondary" size="sm" onClick={handleDownloadPDF}>PDF</Button>
                                {!isReadOnly && (
                                    <Button variant="primary" size="sm" onClick={handleSubmitSheet} className="shadow-vibrant">
                                        Submit
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                }
            />

            {/* Create sheet form */}
            {!sheetId && (
                <Card title="Start New Sheet" className="max-w-md mx-auto">
                    <div className="space-y-4">
                        <Input
                            id="truckNumber"
                            name="truckNumber"
                            label="Truck Number"
                            value={truckNumber}
                            onChange={(e) => setTruckNumber(e.target.value)}
                            placeholder="e.g. MH-12-AB-1234"
                        />
                        <div>
                            <label htmlFor="driverSelect" className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                            <select
                                id="driverSelect"
                                name="driverSelect"
                                value={selectedDriverId}
                                onChange={(e) => setSelectedDriverId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white"
                                required
                            >
                                <option value="">Select Driver</option>
                                {drivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                            <input
                                id="deliveryDate"
                                name="deliveryDate"
                                type="date"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white"
                                required
                            />
                        </div>
                        <Button onClick={handleCreateSheet} fullWidth className="mt-2">Start Sheet</Button>
                    </div>
                </Card>
            )}

            {/* Excel-like grid */}
            {sheetId && (
                <div className="space-y-3">
                    {/* Info bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative group">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Truck</p>
                            {isEditingTruck ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <input 
                                        type="text" 
                                        value={tempTruckNumber} 
                                        onChange={(e) => setTempTruckNumber(e.target.value)}
                                        className="w-full text-sm font-bold border-b border-gray-300 focus:border-primary focus:outline-none px-1 py-0.5"
                                        autoFocus
                                    />
                                    <button onClick={handleSaveTruckNumber} className="text-green-600 hover:text-green-700 p-1 rounded-md bg-green-50">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </button>
                                    <button onClick={() => setIsEditingTruck(false)} className="text-red-500 hover:text-red-600 p-1 rounded-md bg-red-50">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-gray-900 truncate pr-2">{truckNumber}</p>
                                    {!isReadOnly && (
                                        <button 
                                            onClick={() => {
                                                setTempTruckNumber(truckNumber);
                                                setIsEditingTruck(true);
                                            }}
                                            className="text-gray-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1"
                                            title="Edit Truck Number"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Driver</p>
                            <p className="font-bold text-gray-900 truncate">{user?.name}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                            <p className="font-bold text-gray-900">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Bags</p>
                            <p className="font-bold text-gray-900">{totalMedium + totalSS}</p>
                        </div>
                    </div>

                    {!isReadOnly && (
                        <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm px-4 py-2 rounded-xl font-medium">
                            💡 Enter bags for each customer — data saves automatically when you move to the next field.
                        </div>
                    )}

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="🔍 Search customer..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />

                    {/* Excel Table */}
                    <div className="overflow-x-auto bg-white rounded-2xl shadow-premium border border-gray-100">
                        <table className="w-full text-left border-collapse min-w-[420px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest w-8">#</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-32">Medium</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-32">Super Small</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-16">✓</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer, index) => {
                                    const row = rows[customer.id] || {};
                                    const isSaved = row.saved;
                                    const isSaving = row.saving;
                                    const hasData = (parseInt(row.medium) || 0) > 0 || (parseInt(row.superSmall) || 0) > 0;

                                    return (
                                        <tr
                                            key={customer.id}
                                            className={`border-b border-gray-100 transition-colors ${hasData ? 'bg-green-50/40' : 'hover:bg-gray-50/50'}`}
                                        >
                                            <td className="px-4 py-2 text-xs text-gray-400 font-medium">{index + 1}</td>
                                            <td className="px-4 py-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{customer.name}</p>
                                                    {customer.mobile && <p className="text-xs text-gray-400">{customer.mobile}</p>}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    inputMode="numeric"
                                                    disabled={isReadOnly}
                                                    value={row.medium || ''}
                                                    onChange={e => handleInputChange(customer.id, 'medium', e.target.value)}
                                                    onWheel={preventScrollChange}
                                                    onKeyDown={handleEnterKey}
                                                    placeholder="0"
                                                    className={`w-20 text-center px-2 py-1.5 text-sm font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition
                                                        ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-transparent' : 'border-gray-200 hover:border-primary/40 bg-white'}
                                                        ${hasData && !isReadOnly ? 'border-green-200 bg-green-50' : ''}
                                                    `}
                                                />
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    inputMode="numeric"
                                                    disabled={isReadOnly}
                                                    value={row.superSmall || ''}
                                                    onChange={e => handleInputChange(customer.id, 'superSmall', e.target.value)}
                                                    onWheel={preventScrollChange}
                                                    onKeyDown={handleEnterKey}
                                                    placeholder="0"
                                                    className={`w-20 text-center px-2 py-1.5 text-sm font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition
                                                        ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-transparent' : 'border-gray-200 hover:border-primary/40 bg-white'}
                                                        ${hasData && !isReadOnly ? 'border-green-200 bg-green-50' : ''}
                                                    `}
                                                />
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                {isSaving ? (
                                                    <svg className="animate-spin h-4 w-4 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                    </svg>
                                                ) : isSaved && hasData ? (
                                                    <span className="text-green-500 font-black text-base">✓</span>
                                                ) : hasData ? (
                                                    <span className="text-yellow-400 text-xs">●</span>
                                                ) : (
                                                    <span className="text-gray-200 text-xs">–</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {/* Total Row */}
                                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 sticky bottom-0 z-10">
                                    <td className="px-4 py-3 text-xs text-gray-600" colSpan={2}>TOTAL</td>
                                    <td className="px-2 py-3 text-center text-sm font-black text-gray-800">{totalMedium || '–'}</td>
                                    <td className="px-2 py-3 text-center text-sm font-black text-gray-800">{totalSS || '–'}</td>
                                    <td className="px-2 py-3"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={executeSubmitSheet}
                title="Submit Delivery Sheet"
                message="Are you sure you want to submit? You cannot edit after submission."
                confirmText="Submit"
                cancelText="Cancel"
                isDestructive={false}
            />
        </div>
    );
};

export default DeliverySheetPage;
