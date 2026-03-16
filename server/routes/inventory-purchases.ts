

import { Router } from 'express';
import { db } from '../db/index.js';
import { inventoryPurchases, inventoryStock, inventoryTransactions, inventoryDistributions, categories, godowns } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

console.log('✅ inventory-purchases route loaded');

// Bulk create inventory purchases
router.post('/bulk', async (req, res) => {
    try {
        console.log('=== Creating bulk inventory purchases ===');
        console.log('Request body:', req.body);
        const { date, godownId, items } = req.body; // items: { categoryId, quantity, ratePerQuintal, notes? }[]

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'No items provided' });
        }

        const purchases = db.transaction((tx) => {
            const results = [];

            for (const item of items) {
                const { categoryId, quantity, ratePerQuintal, notes } = item;
                const totalAmount = (quantity / 2) * ratePerQuintal;

                // Create purchase record
                const createdPurchase = tx
                    .insert(inventoryPurchases)
                    .values({
                        date: new Date(date),
                        categoryId,
                        godownId,
                        quantity,
                        ratePerQuintal,
                        totalAmount,
                        notes,
                    })
                    .returning()
                    .get();

                if (!createdPurchase) {
                    throw new Error(`Failed to create purchase record for category ${categoryId}`);
                }

                // Update inventory stock
                const currentStock = tx
                    .select()
                    .from(inventoryStock)
                    .where(
                        and(
                            eq(inventoryStock.godownId, godownId),
                            eq(inventoryStock.categoryId, categoryId)
                        )
                    )
                    .get();

                if (currentStock) {
                    tx
                        .update(inventoryStock)
                        .set({
                            quantity: currentStock.quantity + quantity,
                            lastUpdated: new Date(),
                        })
                        .where(eq(inventoryStock.id, currentStock.id))
                        .run();
                } else {
                    tx.insert(inventoryStock).values({
                        godownId,
                        categoryId,
                        quantity,
                    }).run();
                }

                // Record transaction
                tx.insert(inventoryTransactions).values({
                    godownId,
                    categoryId,
                    quantity,
                    type: 'IN',
                    referenceType: 'PURCHASE',
                    referenceId: createdPurchase.id,
                    notes: `Bulk Purchase: ${quantity} bags @ ₹${ratePerQuintal}/quintal`,
                }).run();

                results.push(createdPurchase);
            }

            return results;
        });

        res.status(201).json(purchases);
    } catch (error) {
        console.error('Error creating bulk inventory purchases:', error);
        res.status(500).json({ error: 'Failed to create bulk inventory purchases', details: error instanceof Error ? error.message : String(error) });
    }
});

// Get all inventory purchases with details
router.get('/', async (req, res) => {
    try {
        const purchases = await db
            .select({
                id: inventoryPurchases.id,
                date: inventoryPurchases.date,
                categoryId: inventoryPurchases.categoryId,
                categoryName: categories.name,
                godownId: inventoryPurchases.godownId,
                godownName: godowns.name,
                quantity: inventoryPurchases.quantity,
                ratePerQuintal: inventoryPurchases.ratePerQuintal,
                totalAmount: inventoryPurchases.totalAmount,
                notes: inventoryPurchases.notes,
                createdAt: inventoryPurchases.createdAt,
            })
            .from(inventoryPurchases)
            .leftJoin(categories, eq(inventoryPurchases.categoryId, categories.id))
            .leftJoin(godowns, eq(inventoryPurchases.godownId, godowns.id))
            .orderBy(desc(inventoryPurchases.date))
            .all();

        res.json(purchases);
    } catch (error) {
        console.error('Error fetching inventory purchases:', error);
        res.status(500).json({ error: 'Failed to fetch inventory purchases' });
    }
});

// Get latest purchase for a category (to get current rate)
router.get('/latest/:categoryId', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId);

        const latestPurchase = await db
            .select()
            .from(inventoryPurchases)
            .where(eq(inventoryPurchases.categoryId, categoryId))
            .orderBy(desc(inventoryPurchases.date))
            .limit(1)
            .get();

        res.json(latestPurchase || null);
    } catch (error) {
        console.error('Error fetching latest purchase:', error);
        res.status(500).json({ error: 'Failed to fetch latest purchase' });
    }
});

// Create new inventory purchase
router.post('/', async (req, res) => {
    try {
        console.log('=== Creating inventory purchase ===');
        console.log('Request body:', req.body);
        const { date, categoryId, godownId, quantity, ratePerQuintal, notes } = req.body;

        // Calculate total amount: (quantity / 2) * ratePerQuintal
        // Since rate is per quintal (100kg = 2 bags of 50kg each)
        const totalAmount = (quantity / 2) * ratePerQuintal;

        const newPurchase = db.transaction((tx) => {
            // Create purchase record
            const createdPurchase = tx
                .insert(inventoryPurchases)
                .values({
                    date: new Date(date),
                    categoryId,
                    godownId,
                    quantity,
                    ratePerQuintal,
                    totalAmount,
                    notes,
                })
                .returning()
                .get();

            if (!createdPurchase) {
                throw new Error('Failed to create purchase record');
            }

            // Update inventory stock
            const currentStock = tx
                .select()
                .from(inventoryStock)
                .where(
                    and(
                        eq(inventoryStock.godownId, godownId),
                        eq(inventoryStock.categoryId, categoryId)
                    )
                )
                .get();

            if (currentStock) {
                tx
                    .update(inventoryStock)
                    .set({
                        quantity: currentStock.quantity + quantity,
                        lastUpdated: new Date(),
                    })
                    .where(eq(inventoryStock.id, currentStock.id))
                    .run();
            } else {
                tx.insert(inventoryStock).values({
                    godownId,
                    categoryId,
                    quantity,
                }).run();
            }

            // Record transaction
            tx.insert(inventoryTransactions).values({
                godownId,
                categoryId,
                quantity,
                type: 'IN',
                referenceType: 'PURCHASE',
                referenceId: createdPurchase.id,
                notes: `Purchase: ${quantity} bags @ ₹${ratePerQuintal}/quintal`,
            }).run();

            return createdPurchase;
        });

        res.status(201).json(newPurchase);
    } catch (error) {
        console.error('Error creating inventory purchase:', error);
        res.status(500).json({ error: 'Failed to create inventory purchase' });
    }
});



// Update inventory purchase
router.put('/:id', async (req, res) => {
    try {
        console.log('=== Updating inventory purchase ===');
        const id = parseInt(req.params.id);
        const { date, categoryId, godownId, quantity, ratePerQuintal, notes } = req.body;

        const updatedPurchase = db.transaction((tx) => {
            // Get original purchase
            const originalPurchase = tx
                .select()
                .from(inventoryPurchases)
                .where(eq(inventoryPurchases.id, id))
                .get();

            if (!originalPurchase) {
                throw new Error('Purchase not found');
            }

            // Revert original stock
            const oldStock = tx
                .select()
                .from(inventoryStock)
                .where(and(
                    eq(inventoryStock.godownId, originalPurchase.godownId),
                    eq(inventoryStock.categoryId, originalPurchase.categoryId)
                ))
                .get();

            if (oldStock) {
                tx
                    .update(inventoryStock)
                    .set({
                        quantity: oldStock.quantity - originalPurchase.quantity,
                        lastUpdated: new Date()
                    })
                    .where(eq(inventoryStock.id, oldStock.id))
                    .run();
            }

            // Calculate new total amount
            const totalAmount = (quantity / 2) * ratePerQuintal;

            // Update purchase record
            const updated = tx
                .update(inventoryPurchases)
                .set({
                    date: new Date(date),
                    categoryId,
                    godownId,
                    quantity,
                    ratePerQuintal,
                    totalAmount,
                    notes,
                })
                .where(eq(inventoryPurchases.id, id))
                .returning()
                .get();

            // Add new stock
            const currentStock = tx
                .select()
                .from(inventoryStock)
                .where(
                    and(
                        eq(inventoryStock.godownId, godownId),
                        eq(inventoryStock.categoryId, categoryId)
                    )
                )
                .get();

            if (currentStock) {
                tx
                    .update(inventoryStock)
                    .set({
                        quantity: currentStock.quantity + quantity,
                        lastUpdated: new Date(),
                    })
                    .where(eq(inventoryStock.id, currentStock.id))
                    .run();
            } else {
                tx.insert(inventoryStock).values({
                    godownId,
                    categoryId,
                    quantity,
                }).run();
            }

            return updated;
        });

        res.json(updatedPurchase);
    } catch (error) {
        console.error('Error updating inventory purchase:', error);
        res.status(500).json({ error: 'Failed to update inventory purchase', details: error instanceof Error ? error.message : String(error) });
    }
});

// Delete inventory purchase
router.delete('/:id', async (req, res) => {
    try {
        console.log('=== Deleting inventory purchase ===');
        const id = parseInt(req.params.id);

        db.transaction((tx) => {
            // Get original purchase
            const originalPurchase = tx
                .select()
                .from(inventoryPurchases)
                .where(eq(inventoryPurchases.id, id))
                .get();

            if (!originalPurchase) {
                throw new Error('Purchase not found');
            }

            // Delete related inventory distributions first (to avoid foreign key constraint)
            tx
                .delete(inventoryDistributions)
                .where(eq(inventoryDistributions.purchaseId, id))
                .run();

            // Delete related inventory transactions
            tx
                .delete(inventoryTransactions)
                .where(and(
                    eq(inventoryTransactions.referenceId, id),
                    eq(inventoryTransactions.referenceType, 'PURCHASE')
                ))
                .run();

            // Revert stock
            const stock = tx
                .select()
                .from(inventoryStock)
                .where(and(
                    eq(inventoryStock.godownId, originalPurchase.godownId),
                    eq(inventoryStock.categoryId, originalPurchase.categoryId)
                ))
                .get();

            if (stock) {
                tx
                    .update(inventoryStock)
                    .set({
                        quantity: stock.quantity - originalPurchase.quantity,
                        lastUpdated: new Date()
                    })
                    .where(eq(inventoryStock.id, stock.id))
                    .run();
            }

            // Delete purchase record
            tx
                .delete(inventoryPurchases)
                .where(eq(inventoryPurchases.id, id))
                .run();
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting inventory purchase:', error);
        res.status(500).json({ error: 'Failed to delete inventory purchase', details: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
