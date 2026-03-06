import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Table, { TableRow, TableCell } from '../components/ui/Table';
import TableSkeleton from '../components/ui/TableSkeleton';
import Button from '../components/ui/Button';
import CustomerModal from '../components/CustomerModal';
import { PencilSquareIcon, TrashIcon, BookOpenIcon, PlusIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import ConfirmModal from '../components/ui/ConfirmModal';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

const CustomersPage = () => {
    const { user } = useContext(AuthContext);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const limit = 20;

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToDelete: null });

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        fetchCustomers(page, debouncedSearch);
    }, [page, debouncedSearch]);

    const fetchCustomers = async (pageNum, searchQuery = '') => {
        setLoading(true);
        try {
            const res = await api.get(`/customers?page=${pageNum}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`);
            if (res.data.data) {
                setCustomers(res.data.data);
                setTotalPages(res.data.meta.totalPages);
            } else {
                // If API returns plain array
                setCustomers(res.data);
            }
        } catch (error) {
            console.error("Error fetching customers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingCustomer(null);
        setModalOpen(true);
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setModalOpen(true);
    };

    const confirmDelete = (id) => {
        setConfirmModal({ isOpen: true, idToDelete: id });
    };

    const executeDelete = async () => {
        const id = confirmModal.idToDelete;
        if (!id) return;

        try {
            await api.delete(`/customers/${id}`);
            toast.success('Customer deleted successfully');
            fetchCustomers(page);
        } catch (error) {
            console.error("Delete failed", error);
            toast.error(error.response?.data?.error || "Failed to delete customer");
        } finally {
            setConfirmModal({ isOpen: false, idToDelete: null });
        }
    };

    const handleSave = async (data) => {
        if (editingCustomer) {
            await api.put(`/customers/${editingCustomer.id}`, data);
        } else {
            await api.post('/customers', data);
        }
        fetchCustomers(page); // Refresh list
    };

    const handlePrev = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNext = () => {
        if (page < totalPages) setPage(page + 1);
    };

    const handleDownloadStatement = async (customerId, customerName) => {
        const toastId = toast.loading('Generating Statement...');
        try {
            const res = await api.get(`/reports/download?type=customer-ledger&customerId=${customerId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `${customerName.replace(/\s+/g, '_')}_Statement.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Statement generated!', { id: toastId });
        } catch (err) {
            toast.error('Failed to generate statement', { id: toastId });
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Customers Directory" subtitle="Loading customers..." />
                <TableSkeleton columns={4} rows={10} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="w-full sm:w-1/2 md:w-1/3">
                    <Input
                        type="search"
                        placeholder="Search by name or mobile..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                    />
                </div>
                <Button onClick={handleAdd} className="w-full sm:w-auto flex justify-center items-center">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Customer
                </Button>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
                <Table headers={['Name', 'Mobile', 'Address', 'Actions']}>
                    {customers.map((c) => (
                        <TableRow key={c.id}>
                            <TableCell data-label="Name" className="font-medium text-gray-900 min-w-[120px]">{c.name}</TableCell>
                            <TableCell data-label="Mobile" className="min-w-[110px]">{c.mobile}</TableCell>
                            <TableCell data-label="Address" className="truncate max-w-[150px] sm:max-w-xs">{c.address || '-'}</TableCell>
                            <TableCell data-label="Actions" className="actions-cell">
                                <div className="flex gap-1 sm:gap-2 flex-wrap items-center justify-start sm:justify-end">
                                    <button
                                        onClick={() => handleEdit(c)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Edit"
                                    >
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => window.location.href = `/manager/ledger/${c.id}`}
                                        className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg"
                                        title="View Ledger"
                                    >
                                        <BookOpenIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDownloadStatement(c.id, c.name)}
                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                        title="Download Statement (PDF)"
                                    >
                                        <DocumentArrowDownIcon className="w-5 h-5" />
                                    </button>
                                    {user?.role === 'owner' && (
                                        <button
                                            onClick={() => confirmDelete(c.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {customers.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                No customers found. Click "Add Customer" to create one.
                            </TableCell>
                        </TableRow>
                    )}
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <Button
                        variant="secondary"
                        onClick={handlePrev}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-gray-600 font-medium">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="secondary"
                        onClick={handleNext}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            <CustomerModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                customer={editingCustomer}
                onSave={handleSave}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, idToDelete: null })}
                onConfirm={executeDelete}
                title="Delete Customer"
                message="Are you sure you want to delete this customer? This action cannot be undone if they have valid records."
                confirmText="Delete Customer"
                cancelText="Cancel"
                isDestructive={true}
            />
        </div>
    );
};

export default CustomersPage;
