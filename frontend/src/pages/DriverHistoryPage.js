// v2 - delete button added
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import TableSkeleton from '../components/ui/TableSkeleton';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ConfirmModal from '../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

const DriverHistoryPage = () => {
    const navigate = useNavigate();
    const [sheets, setSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 20;

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToDelete: null });

    useEffect(() => {
        fetchSheets(page);
    }, [page]);

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

    const confirmDelete = (id, e) => {
        e.stopPropagation();
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

    const handleDownload = async (id, e) => {
        e.stopPropagation();
        try {
            const res = await api.get(`/delivery-sheets/${id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `delivery_sheet_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Download failed", error);
            toast.error("Failed to download sheet. Access denied or server error.");
        }
    };


    return (
        <div className="space-y-6">
            <PageHeader
                title="My Delivery Sheets"
                subtitle="History of all your trips"
                action={
                    <Button onClick={() => navigate('/driver/dashboard')}>Back to Dashboard</Button>
                }
            />

            <Card>
                {loading ? (
                    <TableSkeleton columns={4} rows={10} />
                ) : sheets.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 font-medium">No delivery sheets found.</p>
                        <p className="text-gray-400 text-sm mt-1">Start a new delivery sheet from the dashboard.</p>
                    </div>
                ) : (
                    <div className="responsive-table overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-3 font-semibold text-gray-700 text-sm">Date</th>
                                    <th className="p-3 font-semibold text-gray-700 text-sm">Truck Number</th>
                                    <th className="p-3 font-semibold text-gray-700 text-sm">Status</th>
                                    <th className="p-3 font-semibold text-gray-700 text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sheets.map(sheet => (
                                    <tr
                                        key={sheet.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => navigate(`/driver/delivery-sheet/${sheet.id}`)}
                                    >
                                        <td className="p-3 text-sm" data-label="Date">
                                            {new Date(sheet.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 font-medium text-sm" data-label="Truck">
                                            {sheet.truck_number}
                                        </td>
                                        <td className="p-3" data-label="Status">
                                            <Badge status={sheet.status} />
                                        </td>
                                        <td className="p-3 actions-cell" data-label="Actions">
                                            <div className="flex gap-2 justify-end flex-wrap">
                                                {sheet.status === 'draft' && (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/driver/delivery-sheet/${sheet.id}`);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                                {sheet.status === 'draft' && (
                                                    <button
                                                        onClick={(e) => confirmDelete(sheet.id, e)}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={(e) => handleDownload(sheet.id, e)}
                                                >
                                                    PDF
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

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

export default DriverHistoryPage;
