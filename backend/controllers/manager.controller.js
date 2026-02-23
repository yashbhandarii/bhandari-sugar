const customerService = require('../services/customer.service');
// Report service will be added later

// --- Customer Management ---

exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await customerService.getAllCustomers();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        const customer = await customerService.createCustomer(req.body);
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const customer = await customerService.updateCustomer(id, req.body);
        res.json(customer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await customerService.deleteCustomer(id);
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Reports (Placeholders for now) ---
exports.getDayReport = async (req, res) => {
    res.status(501).json({ message: "Not implemented yet" });
};

exports.getWeekReport = async (req, res) => {
    res.status(501).json({ message: "Not implemented yet" });
};

exports.getMonthReport = async (req, res) => {
    res.status(501).json({ message: "Not implemented yet" });
};
