const paymentService = require('../services/payment.service');

exports.getCustomerPending = async (req, res) => {
    const { customer_id } = req.params;
    try {
        const pending = await paymentService.getCustomerPending(customer_id);
        res.json(pending);
    } catch (error) {
        console.error('Error getting pending amount:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addPayment = async (req, res) => {
    try {
        const payment = await paymentService.addPayment(req.body);
        res.status(201).json(payment);
    } catch (error) {
        console.error('Error adding payment:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

exports.getPaymentsByCustomer = async (req, res) => {
    const { customer_id } = req.params;
    try {
        const payments = await paymentService.getPaymentsByCustomer(customer_id);
        res.json(payments);
    } catch (error) {
        console.error('Error getting payments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
