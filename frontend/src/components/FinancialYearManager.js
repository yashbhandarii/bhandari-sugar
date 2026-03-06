import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Input from './ui/Input';
import ConfirmModal from './ui/ConfirmModal';
import { LockClosedIcon, LockOpenIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const FinancialYearManager = () => {
    const [years, setYears] = useState([]);
    const [activeYear, setActiveYear] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New Year Form
    const [showNewForm, setShowNewForm] = useState(false);
    const [newForm, setNewForm] = useState({ year_label: '', start_date: '', end_date: '' });

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        actionType: null, // 'close' or 'purge'
        yearId: null,
        yearLabel: null
    });

    const fetchYears = async () => {
        setLoading(true);
        try {
            const [allReq, activeReq] = await Promise.all([
                api.get('/financial-years'),
                api.get('/financial-years/active').catch(() => ({ data: null }))
            ]);
            setYears(allReq.data);
            setActiveYear(activeReq.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load financial years');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYears();
    }, []);

    const handleCreateYear = async (e) => {
        e.preventDefault();
        try {
            await api.post('/financial-years', newForm);
            setShowNewForm(false);
            setNewForm({ year_label: '', start_date: '', end_date: '' });
            fetchYears();
            toast.success("New Financial Year Created!");
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error creating year');
        }
    };

    const confirmCloseYear = (id) => {
        setConfirmModal({ isOpen: true, actionType: 'close', yearId: id, yearLabel: null });
    };

    const confirmPurgeData = (id, label) => {
        setConfirmModal({ isOpen: true, actionType: 'purge', yearId: id, yearLabel: label });
    };

    const executeConfirmAction = async () => {
        const { actionType, yearId } = confirmModal;
        if (!yearId) return;

        setConfirmModal({ isOpen: false, actionType: null, yearId: null, yearLabel: null });

        if (actionType === 'close') {
            try {
                const res = await api.post(`/financial-years/${yearId}/close`);
                toast.success(res.data.message);
                fetchYears();
            } catch (err) {
                toast.error(err.response?.data?.error || 'Error closing year');
            }
        } else if (actionType === 'purge') {
            const toastId = toast.loading('Deleting all data... please wait');
            try {
                await api.delete(`/financial-years/${yearId}/purge`);
                toast.success('✅ All data permanently deleted. App is ready for a new year.', { id: toastId, duration: 6000 });
                fetchYears();
            } catch (err) {
                toast.error(err.response?.data?.error || 'Failed to delete data', { id: toastId });
            }
        }
    };

    const handleDownloadReport = async (id, label) => {
        const toastId = toast.loading('Generating PDF report...');
        try {
            const res = await api.get(`/financial-years/${id}/report`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `${label.replace(/\s+/g, '_')}_report.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Report downloaded!', { id: toastId });
        } catch (err) {
            toast.error('Failed to generate report', { id: toastId });
        }
    };

    const handleDownloadJSON = async (id, label) => {
        const toastId = toast.loading('Preparing JSON export...');
        try {
            const res = await api.get(`/financial-years/${id}/export-json`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `${label.replace(/\s+/g, '_')}_export.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('JSON exported!', { id: toastId });
        } catch (err) {
            toast.error('Failed to export JSON', { id: toastId });
        }
    };

    if (loading) return <div className="text-gray-500 text-sm">Loading Financial Years...</div>;

    return (
        <Card title="Financial Year Management" className="border-l-4 border-l-red-500 shadow-md">
            {error && <div className="p-3 mb-4 bg-red-100 text-red-700 text-sm rounded">{error}</div>}

            <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                        Active Year:{' '}
                        {activeYear ? (
                            <span className="text-green-600 ml-1">{activeYear.year_label}</span>
                        ) : (
                            <span className="text-red-500 ml-1">None! System operations blocked.</span>
                        )}
                    </h3>
                </div>
                {!activeYear && (
                    <button
                        onClick={() => setShowNewForm(!showNewForm)}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm transition"
                    >
                        <PlusIcon className="w-4 h-4" /> New Year
                    </button>
                )}
            </div>

            {showNewForm && (
                <form onSubmit={handleCreateYear} className="space-y-4 mb-6 p-4 bg-gray-50 rounded border">
                    <p className="text-sm text-gray-600 mb-2">Create a new operational year. Note: You must close the previous year first.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Label (e.g. FY 2025-26)"
                            required
                            value={newForm.year_label}
                            onChange={(e) => setNewForm({ ...newForm, year_label: e.target.value })}
                        />
                        <Input
                            label="Start Date"
                            type="date"
                            required
                            value={newForm.start_date}
                            onChange={(e) => setNewForm({ ...newForm, start_date: e.target.value })}
                        />
                        <Input
                            label="End Date"
                            type="date"
                            required
                            value={newForm.end_date}
                            onChange={(e) => setNewForm({ ...newForm, end_date: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowNewForm(false)} className="text-gray-500 text-sm hover:underline">Cancel</button>
                        <button type="submit" className="bg-green-600 text-white px-4 py-1.5 rounded text-sm shadow">Create & Open Year</button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                            <th className="px-4 py-2 font-medium">Label</th>
                            <th className="px-4 py-2 font-medium">Period</th>
                            <th className="px-4 py-2 font-medium">Status</th>
                            <th className="px-4 py-2 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {years.map(y => (
                            <tr key={y.id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3 font-semibold text-gray-800">{y.year_label}</td>
                                <td className="px-4 py-3 text-gray-500">
                                    {new Date(y.start_date).toLocaleDateString()} to {new Date(y.end_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    {y.is_closed ? (
                                        <Badge variant="error" className="flex items-center gap-1 w-max">
                                            <LockClosedIcon className="w-3 h-3" /> Closed
                                        </Badge>
                                    ) : (
                                        <Badge variant="success" className="flex items-center gap-1 w-max">
                                            <LockOpenIcon className="w-3 h-3" /> Active
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={() => handleDownloadReport(y.id, y.year_label)}
                                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs transition shadow-sm"
                                        >
                                            📥 PDF
                                        </button>
                                        <button
                                            onClick={() => handleDownloadJSON(y.id, y.year_label)}
                                            className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-xs transition shadow-sm"
                                        >
                                            📦 JSON
                                        </button>
                                        {!y.is_closed && (
                                            <button
                                                onClick={() => confirmCloseYear(y.id)}
                                                className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs transition shadow-sm"
                                            >
                                                Close Year
                                            </button>
                                        )}
                                        {y.is_closed && (
                                            <button
                                                onClick={() => confirmPurgeData(y.id, y.year_label)}
                                                className="text-white bg-red-900 hover:bg-red-950 px-3 py-1 rounded text-xs transition shadow-sm font-bold"
                                                title="Permanently delete all data for this year"
                                            >
                                                ⚠️ Delete All Data
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {years.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center py-6 text-gray-500 italic">No financial years tracked yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, actionType: null, yearId: null, yearLabel: null })}
                onConfirm={executeConfirmAction}
                title={confirmModal.actionType === 'purge' ? 'Permanent Data Deletion' : 'Close Financial Year'}
                message={
                    confirmModal.actionType === 'purge'
                        ? `⚠️ DANGER: This will PERMANENTLY DELETE all invoices, payments, delivery sheets, and reports for "${confirmModal.yearLabel}".\n\nThis CANNOT be undone. Have you already downloaded both the PDF and JSON backup?`
                        : 'WARNING: Closing a financial year is PERMANENT. No modifications to invoices, payments, or stock will be possible for dates within this year. Are you absolutely sure?'
                }
                confirmText={confirmModal.actionType === 'purge' ? 'Delete All Data' : 'Close Year'}
                cancelText="Cancel"
                isDestructive={true}
                requireInput={confirmModal.actionType === 'purge' ? 'DELETE' : null}
            />
        </Card>
    );
};

export default FinancialYearManager;
