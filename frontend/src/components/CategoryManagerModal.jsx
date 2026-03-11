import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Button from './ui/Button';
import Input from './ui/Input';
import ConfirmModal from './ui/ConfirmModal';
import toast from 'react-hot-toast';

const CategoryManagerModal = ({ isOpen, onClose, onCategoriesUpdated }) => {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryWeight, setNewCategoryWeight] = useState('30');
    const [loading, setLoading] = useState(false);

    // Confirm Modal
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName) return;
        setLoading(true);
        try {
            await api.post('/categories', {
                name: newCategoryName,
                default_weight: parseFloat(newCategoryWeight)
            });
            setNewCategoryName('');
            fetchCategories();
            if (onCategoriesUpdated) onCategoriesUpdated();
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Failed to add category');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id) => {
        setConfirmModal({ isOpen: true, id });
    };

    const handleDeleteCategory = async () => {
        const id = confirmModal.id;
        if (!id) return;

        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
            if (onCategoriesUpdated) onCategoriesUpdated();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        } finally {
            setConfirmModal({ isOpen: false, id: null });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Manage Categories</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder="Category Name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                        </div>
                        <div className="w-24">
                            <Input
                                type="number"
                                placeholder="Kg"
                                value={newCategoryWeight}
                                onChange={(e) => setNewCategoryWeight(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleAddCategory} disabled={loading}>Add</Button>
                    </div>
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-md">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 text-sm font-semibold">Name</th>
                                <th className="p-3 text-sm font-semibold">Weight</th>
                                <th className="p-3 text-sm font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-3">{cat.name}</td>
                                    <td className="p-3 text-gray-600">{cat.default_weight} kg</td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => confirmDelete(cat.id)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="p-4 text-center text-gray-500">No categories found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 text-right">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={handleDeleteCategory}
                title="Delete Category"
                message="Are you sure? This will hide the category from future sheets."
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
            />
        </div>
    );
};

export default CategoryManagerModal;
