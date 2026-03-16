import { Router } from 'express';
import { db } from '../db/index.js';
import { payments, invoices, customers } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Get all payments
router.get('/', async (req, res) => {
    try {
        const allPayments = await db
            .select({
                id: payments.id,
                invoiceId: payments.invoiceId,
                invoiceNumber: invoices.invoiceNumber,
                customerId: payments.customerId,
                customerName: customers.name,
                amount: payments.amount,
                paymentMode: payments.paymentMode,
                paymentDate: payments.paymentDate,
                referenceNumber: payments.referenceNumber,
                notes: payments.notes,
                createdAt: payments.createdAt,
            })
            .from(payments)
            .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
            .leftJoin(customers, eq(payments.customerId, customers.id))
            .orderBy(desc(payments.createdAt))
            .all();

        res.json(allPayments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Get payments for an invoice
router.get('/invoice/:invoiceId', async (req, res) => {
    try {
        const invoicePayments = await db
            .select()
            .from(payments)
            .where(eq(payments.invoiceId, parseInt(req.params.invoiceId)))
            .all();

        res.json(invoicePayments);
    } catch (error) {
        console.error('Error fetching invoice payments:', error);
        res.status(500).json({ error: 'Failed to fetch invoice payments' });
    }
});

// Create payment
router.post('/', async (req, res) => {
    try {
        const { invoiceId, amount } = req.body;

        // Get invoice to validate payment amount
        const invoice = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, invoiceId))
            .get();

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Get total paid for this invoice
        const existingPayments = await db
            .select()
            .from(payments)
            .where(eq(payments.invoiceId, invoiceId))
            .all();

        const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
        const pending = invoice.totalAmount - totalPaid;

        if (amount > pending) {
            return res.status(400).json({
                error: 'Payment amount exceeds pending amount',
                pending,
            });
        }

        // Create payment
        const [newPayment] = await db
            .insert(payments)
            .values({
                ...req.body,
                customerId: invoice.customerId,
            })
            .returning();

        res.status(201).json(newPayment);
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

// Delete payment
router.delete('/:id', async (req, res) => {
    try {
        await db.delete(payments).where(eq(payments.id, parseInt(req.params.id)));
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ error: 'Failed to delete payment' });
    }
});

export default router;
