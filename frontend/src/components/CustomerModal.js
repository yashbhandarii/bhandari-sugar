import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

const CustomerModal = ({ isOpen, onClose, customer, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        address: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                mobile: customer.mobile || '',
                address: customer.address || ''
            });
        } else {
            setFormData({ name: '', mobile: '', address: '' });
        }
        setError('');
    }, [customer, isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }
        if (!/^\d{10}$/.test(formData.mobile)) {
            setError('Mobile number must be exactly 10 digits');
            return;
        }

        setLoading(true);
        try {
            await onSave(formData);
            onClose(); // Close on success
        } catch (err) {
            console.error("Save error", err);
            // API might return error message
            setError(err.response?.data?.error || 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">
                    {customer ? 'Edit Customer' : 'Add New Customer'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Customer Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        required
                    />
                    <Input
                        label="Mobile Number"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="10-digit mobile number"
                        type="tel"
                        maxLength={10}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="3"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            placeholder="Enter address (optional)"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerModal;
