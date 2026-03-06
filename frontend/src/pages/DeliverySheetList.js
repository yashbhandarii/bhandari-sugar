// v2 - delete button added
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Table, { TableRow, TableCell } from '../components/ui/Table';
import TableSkeleton from '../components/ui/TableSkeleton';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';
import toast from 'react-hot-toast';
import { preventScrollChange, handleEnterKey } from '../utils/inputHelpers';

const DeliverySheetList = () => {
    const [sheets, setSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 20;

    const [ratesModal, setRatesModal] = useState(null); // { id, medium_rate, super_small_rate }
    const [ratesSaving, setRatesSaving] = useState(false);

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToDelete: null });

    const fetchSheets = async (pageNum) => {
        setLoading(true);
        try {
            const res = await api.get(`/delivery-sheets?page=${pageNum}&limit=${limit}`);
            if (res.data.data) {
                setSheets(res.data.data);
                setTotalPages(res.data.meta.totalPages || 1);
            } else {
                setSheets(res.data);
            }
        } catch (error) {
            console.error("Error fetching sheets", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSheets(page);
    }, [page]);

    const confirmDelete = (id) => {
        setConfirmModal({ isOpen: true, idToDelete: id });
    };

    const executeDelete = async () => {
        const id = confirmModal.idToDelete;
        if (!id) return;

        try {
            await api.delete(`/delivery-sheets/${id}`);
            toast.success('Delivery sheet deleted successfully');
            fetchSheets(page);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete delivery sheet');
        } finally {
            setConfirmModal({ isOpen: false, idToDelete: null });
        }
    };

    const handleDownload = async (id) => {
        try {
            const res = await api.get(`/delivery-sheets/${id}/download`, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `DeliverySheet_${id}.pdf`;
            link.click();
        } catch (error) {
            console.error("Download failed", error);
            toast.error("Failed to download delivery sheet");
        }
    };

    const handleSaveRates = async () => {
        if (!ratesModal) return;
        setRatesSaving(true);
        try {
            await api.patch(`/delivery-sheets/${ratesModal.id}`, {
                medium_rate: parseFloat(ratesModal.medium_rate) || 0,
                super_small_rate: parseFloat(ratesModal.super_small_rate) || 0
            });
            setRatesModal(null);
            fetchSheets(page);
            toast.success("Rates updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update rates');
        } finally {
            setRatesSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Delivery Sheets" subtitle="Loading sheets..." />
                <TableSkeleton columns={6} rows={10} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Delivery Sheets"
                subtitle="Manage and billing for delivery sheets"
            />

            <div className="responsive-table">
                <Table headers={['ID', 'Truck Number', 'Date', 'Rates (₹/bag)', 'Status', 'Actions']}>
                    {sheets.map(sheet => (
                        <TableRow key={sheet.id}>
                            <TableCell data-label="ID">#{sheet.id}</TableCell>
                            <TableCell data-label="Truck" className="font-medium text-gray-900">{sheet.truck_number}</TableCell>
                            <TableCell data-label="Date">{new Date(sheet.date).toLocaleDateString()}</TableCell>
                            <TableCell data-label="Rates" className="text-sm text-gray-600">
                                M: {sheet.medium_rate != null ? Number(sheet.medium_rate).toLocaleString() : '–'} / SS: {sheet.super_small_rate != null ? Number(sheet.super_small_rate).toLocaleString() : '–'}
                            </TableCell>
                            <TableCell data-label="Status"><Badge status={sheet.status} /></TableCell>
                            <TableCell data-label="Actions" className="actions-cell">
                                <div className="flex flex-wrap gap-2">
                                    {sheet.status === 'draft' && (
                                        <Button size="sm" variant="outline" onClick={() => setRatesModal({ id: sheet.id, medium_rate: String(sheet.medium_rate ?? ''), super_small_rate: String(sheet.super_small_rate ?? '') })}>
                                            Set rates
                                        </Button>
                                    )}
                                    <Button size="sm" variant="outline" onClick={() => handleDownload(sheet.id)}>
                                        Download
                                    </Button>
                                    {sheet.status === 'submitted' && (
                                        <Link to={`/manager/billing/${sheet.id}`}>
                                            <Button size="sm" variant="primary">Generate Billing</Button>
                                        </Link>
                                    )}
                                    {sheet.status === 'draft' && (
                                        <button
                                            onClick={() => confirmDelete(sheet.id)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {sheets.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-gray-500">
                                No delivery sheets found.
                            </TableCell>
                        </TableRow>
                    )}
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 mt-4">
                    <Button
                        variant="secondary"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-gray-600 font-medium">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="secondary"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            {ratesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Set rates (Sheet #{ratesModal.id})</h3>
                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Medium (₹/bag)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    value={ratesModal.medium_rate}
                                    onChange={(e) => setRatesModal(prev => ({ ...prev, medium_rate: e.target.value }))}
                                    onWheel={preventScrollChange}
                                    onKeyDown={handleEnterKey}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Super Small (₹/bag)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    value={ratesModal.super_small_rate}
                                    onChange={(e) => setRatesModal(prev => ({ ...prev, super_small_rate: e.target.value }))}
                                    onWheel={preventScrollChange}
                                    onKeyDown={handleEnterKey}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="secondary" onClick={() => setRatesModal(null)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSaveRates} disabled={ratesSaving}>{ratesSaving ? 'Saving...' : 'Save'}</Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, idToDelete: null })}
                onConfirm={executeDelete}
                title="Delete Delivery Sheet"
                message="Are you sure you want to delete this draft delivery sheet? This action cannot be undone."
                confirmText="Delete Sheet"
                cancelText="Cancel"
                isDestructive={true}
            />
        </div>
    );
};

export default DeliverySheetList;
