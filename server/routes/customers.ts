import { Router } from 'express';
import { db } from '../db/index.js';
import { customers, invoices, payments } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

const router = Router();

// Get all customers with stats
router.get('/', async (req, res) => {
    try {
        const allCustomers = await db
            .select({
                id: customers.id,
                name: customers.name,
                mobile: customers.mobile,
                address: customers.address,
                gstNumber: customers.gstNumber,
                defaultPaymentMode: customers.defaultPaymentMode,
                createdAt: customers.createdAt,
                totalInvoices: sql<number>`count(distinct ${invoices.id})`,
                totalAmount: sql<number>`coalesce(sum(${invoices.totalAmount}), 0)`,
                totalPaid: sql<number>`coalesce(sum(${payments.amount}), 0)`,
            })
            .from(customers)
            .leftJoin(invoices, eq(customers.id, invoices.customerId))
            .leftJoin(payments, eq(customers.id, payments.customerId))
            .groupBy(customers.id)
            .all();

        const customersWithPending = allCustomers.map(customer => ({
            ...customer,
            totalPending: customer.totalAmount - customer.totalPaid,
        }));

        res.json(customersWithPending);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
    try {
        const customer = await db
            .select()
            .from(customers)
            .where(eq(customers.id, parseInt(req.params.id)))
            .get();

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// Create customer
router.post('/', async (req, res) => {
    try {
        const result = await db.insert(customers).values(req.body).returning();
        res.status(201).json(result[0]);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// Update customer
router.put('/:id', async (req, res) => {
    try {
        const result = await db
            .update(customers)
            .set({ ...req.body, updatedAt: new Date() })
            .where(eq(customers.id, parseInt(req.params.id)))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(result[0]);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    try {
        await db.delete(customers).where(eq(customers.id, parseInt(req.params.id)));
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// Get customer ledger
router.get('/:id/ledger', async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);

        const customerInvoices = await db
            .select()
            .from(invoices)
            .where(eq(invoices.customerId, customerId))
            .all();

        const customerPayments = await db
            .select()
            .from(payments)
            .where(eq(payments.customerId, customerId))
            .all();

        res.json({
            invoices: customerInvoices,
            payments: customerPayments,
        });
    } catch (error) {
        console.error('Error fetching customer ledger:', error);
        res.status(500).json({ error: 'Failed to fetch customer ledger' });
    }
});

export default router;
