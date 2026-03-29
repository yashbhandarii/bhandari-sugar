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

exports.getInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await godownService.getInvoiceById(id);
        if (!invoice || !invoice.data) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(invoice.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        const { data } = await godownService.getSummary();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCustomerSummary = async (req, res) => {
    try {
        const { data } = await godownService.getCustomerSummary();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPendingInvoices = async (req, res) => {
    try {
        const { data } = await godownService.getPendingInvoices();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllInvoices = async (req, res) => {
    try {
        const { data } = await godownService.getAllInvoices();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStock = async (req, res) => {
    try {
        const { data } = await godownService.getStock();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.downloadInvoice = async (req, res) => {
    const { id } = req.params;
    try {
        const invoice = await godownService.getInvoiceById(id);
        if (!invoice || !invoice.data) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const pdfService = require('../services/pdf.service');
        pdfService.generateGodownInvoicePDF(invoice.data, res);
    } catch (error) {
        console.error('Error downloading invoice:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
};

exports.downloadGodownReport = async (req, res) => {
    try {
        const [summary, stock, customers, pendingInvoices] = await Promise.all([
            godownService.getSummary(),
            godownService.getStock(),
            godownService.getCustomerSummary(),
            godownService.getPendingInvoices()
        ]);

        const pdfService = require('../services/pdf.service');
        
        pdfService.generateReportPDF({
            reportType: 'Godown Report',
            dateRange: new Date().toISOString().split('T')[0],
            summary: summary.data,
            stock: stock.data,
            customers: customers.data,
            pendingInvoices: pendingInvoices.data
        }, res);

    } catch (error) {
        console.error('Error downloading godown report:', error);
        if (!res.headersSent) res.status(500).json({ error: error.stack || error.message || 'Internal server error' });
    }
};
