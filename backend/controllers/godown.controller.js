const godownService = require('../services/godown.service');

exports.addStock = async (req, res) => {
    try {
        const { category, quantity } = req.body;
        const result = await godownService.addStock(category, quantity);
        res.json({ message: 'Stock added successfully', data: result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        const data = { ...req.body, created_by: req.userId };
        const result = await godownService.createInvoice(data);
        res.status(201).json({ message: 'Godown invoice created', data: result });
    } catch (err) {
        console.error("CREATE INVOICE BUG:", err);
        res.status(400).json({ error: err.message });
    }
};

exports.addPayment = async (req, res) => {
    try {
        const { godown_invoice_id, amount, payment_method, payment_date } = req.body;
        const result = await godownService.addPayment(godown_invoice_id, amount, payment_method, payment_date, req.userId);
        res.json({ message: 'Payment recorded successfully', data: result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getSummary = async (req, res) => {
    try {
        const result = await godownService.getSummary();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCustomerSummary = async (req, res) => {
    try {
        const result = await godownService.getCustomerSummary();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPendingInvoices = async (req, res) => {
    try {
        const result = await godownService.getPendingInvoices();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllInvoices = async (req, res) => {
    try {
        const result = await godownService.getAllInvoices();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStock = async (req, res) => {
    try {
        const result = await godownService.getStock();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.downloadInvoice = async (req, res) => {
    const { id } = req.params;
    try {
        const invoice = await godownService.getInvoiceById(id);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const pdfService = require('../services/pdf.service');
        pdfService.generateGodownInvoicePDF(invoice, res);
    } catch (error) {
        console.error('Error downloading invoice:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
};
