const customerService = require('../services/customer.service');

exports.getAllCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const { customers, total } = await customerService.getAllCustomers(page, limit);

        res.json({
            data: customers,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        const customer = await customerService.createCustomerWithAudit(req.body, req.userId);
        res.status(201).json(customer);
    } catch (error) {
        console.error('Error creating customer:', error);
        if (error.code === '23505') { // Unique constraint violation or whatever PG returns
            // Actually service might throw custom error
            return res.status(400).json({ error: error.message || 'Customer already exists' });
        }
        res.status(400).json({ error: error.message || 'Server error' });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const customer = await customerService.updateCustomer(id, req.body);
        res.json(customer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(400).json({ error: error.message || 'Server error' });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await customerService.deleteCustomer(id, req.userId);
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(400).json({ error: error.message || 'Server error' });
    }
};
