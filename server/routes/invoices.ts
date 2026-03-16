import { Router } from 'express';
import { db } from '../db';
import {
    invoices,
    invoiceItems,
    invoiceExpenses,
    inventoryStock,
    inventoryTransactions,
    inventoryDistributions,
    customers,
    godowns,
    categories
} from '../db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';

const router = Router();

// Get all invoices
router.get('/', async (req, res) => {
    try {
        const result = await db
            .select({
                invoice: invoices,
                customerName: customers.name,
                godownName: godowns.name,
            })
            .from(invoices)
            .leftJoin(customers, eq(invoices.customerId, customers.id))
            .leftJoin(godowns, eq(invoices.godownId, godowns.id))
            .orderBy(desc(invoices.date));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

// Get single invoice
router.get('/:id', async (req, res) => {
    try {
        const invoiceId = parseInt(req.params.id);
        const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).get();

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const items = await db
            .select({
                id: invoiceItems.id,
                categoryId: invoiceItems.categoryId,
                categoryName: categories.name,
                quantity: invoiceItems.quantity,
                bagWeight: invoiceItems.bagWeight,
                ratePerBag: invoiceItems.ratePerBag,
                amount: invoiceItems.amount,
            })
            .from(invoiceItems)
            .leftJoin(categories, eq(invoiceItems.categoryId, categories.id))
            .where(eq(invoiceItems.invoiceId, invoiceId));

        const expenses = await db
            .select()
            .from(invoiceExpenses)
            .where(eq(invoiceExpenses.invoiceId, invoiceId));

        const customer = await db.select().from(customers).where(eq(customers.id, invoice.customerId)).get();

        res.json({ invoice, items, expenses, customer });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

// Create invoice
router.post('/', async (req, res) => {
    try {
        const { invoice: invoiceData, items, expenses, distributionIds } = req.body;

        // Calculate due date if not provided (default to 7 days)
        let dueDate = invoiceData.dueDate;
        if (!dueDate && invoiceData.date) {
            const date = new Date(invoiceData.date);
            date.setDate(date.getDate() + 7);
            dueDate = date;
        }

        // Generate invoice number
        const lastInvoice = await db
            .select()
            .from(invoices)
            .orderBy(desc(invoices.id))
            .limit(1)
            .get();

        const invoiceNumber = lastInvoice
            ? `INV-${String(parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1).padStart(6, '0')}`
            : 'INV-000001';

        // Create invoice
        const [newInvoice] = await db
            .insert(invoices)
            .values({
                ...invoiceData,
                dueDate: new Date(dueDate),
                invoiceNumber,
            })
            .returning();

        // Link distributions if provided
        if (distributionIds && distributionIds.length > 0) {
            await db
                .update(inventoryDistributions)
                .set({ invoiceId: newInvoice.id })
                .where(inArray(inventoryDistributions.id, distributionIds));
        }

        // Create invoice items and deduct inventory
        for (const item of items) {
            await db.insert(invoiceItems).values({
                invoiceId: newInvoice.id,
                ...item,
            });

            // Deduct from inventory ONLY if explicit deduction is requested (default true for new items)
            // Items coming from distributions have already restricted stock, so we skip them.
            if (invoiceData.godownId && item.deductStock !== false) {
                const currentStock = await db
                    .select()
                    .from(inventoryStock)
                    .where(
                        and(
                            eq(inventoryStock.godownId, invoiceData.godownId),
                            eq(inventoryStock.categoryId, item.categoryId)
                        )
                    )
                    .get();

                if (currentStock) {
                    const newQuantity = currentStock.quantity - item.quantity;

                    if (newQuantity < 0) {
                        throw new Error(`Insufficient stock for category ${item.categoryId}`);
                    }

                    await db
                        .update(inventoryStock)
                        .set({ quantity: newQuantity, lastUpdated: new Date() })
                        .where(eq(inventoryStock.id, currentStock.id));

                    // Record transaction
                    await db.insert(inventoryTransactions).values({
                        godownId: invoiceData.godownId,
                        categoryId: item.categoryId,
                        quantity: item.quantity,
                        type: 'OUT',
                        referenceType: 'INVOICE',
                        referenceId: newInvoice.id,
                    });
                }
            }
        }

        // Create invoice expenses
        if (expenses && expenses.length > 0) {
            for (const expense of expenses) {
                await db.insert(invoiceExpenses).values({
                    invoiceId: newInvoice.id,
                    ...expense,
                });
            }
        }

        res.status(201).json(newInvoice);
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: error.message || 'Failed to create invoice' });
    }
});

// Delete invoice (and restore inventory)
router.delete('/:id', async (req, res) => {
    try {
        const invoiceId = parseInt(req.params.id);

        const invoice = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, invoiceId))
            .get();

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Get invoice items to restore inventory
        const items = await db
            .select()
            .from(invoiceItems)
            .where(eq(invoiceItems.invoiceId, invoiceId))
            .all();

        // Restore inventory
        if (invoice.godownId) {
            for (const item of items) {
                const currentStock = await db
                    .select()
                    .from(inventoryStock)
                    .where(
                        and(
                            eq(inventoryStock.godownId, invoice.godownId),
                            eq(inventoryStock.categoryId, item.categoryId)
                        )
                    )
                    .get();

                if (currentStock) {
                    await db
                        .update(inventoryStock)
                        .set({
                            quantity: currentStock.quantity + item.quantity,
                            lastUpdated: new Date(),
                        })
                        .where(eq(inventoryStock.id, currentStock.id));
                }
            }
        }

        // Unlink distributions
        await db
            .update(inventoryDistributions)
            .set({ invoiceId: null })
            .where(eq(inventoryDistributions.invoiceId, invoiceId));


        await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
        await db.delete(invoiceExpenses).where(eq(invoiceExpenses.invoiceId, invoiceId));
        await db.delete(invoices).where(eq(invoices.id, invoiceId));

        res.json({ message: 'Invoice deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
});

export default router;
