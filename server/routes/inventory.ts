import { Router } from 'express';
import { db } from '../db/index.js';
import { inventoryStock, inventoryTransactions, categories, godowns } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

const router = Router();

// Get all inventory stock with details
router.get('/', async (req, res) => {
    try {
        const stock = await db
            .select({
                id: inventoryStock.id,
                godownId: inventoryStock.godownId,
                godownName: godowns.name,
                categoryId: inventoryStock.categoryId,
                categoryName: categories.name,
                quantity: inventoryStock.quantity,
                lastUpdated: inventoryStock.lastUpdated,
            })
            .from(inventoryStock)
            .leftJoin(godowns, eq(inventoryStock.godownId, godowns.id))
            .leftJoin(categories, eq(inventoryStock.categoryId, categories.id))
            .all();

        res.json(stock);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Get stock for specific godown and category
router.get('/stock/:godownId/:categoryId', async (req, res) => {
    try {
        const { godownId, categoryId } = req.params;

        const stock = await db
            .select()
            .from(inventoryStock)
            .where(
                and(
                    eq(inventoryStock.godownId, parseInt(godownId)),
                    eq(inventoryStock.categoryId, parseInt(categoryId))
                )
            )
            .get();

        res.json(stock || { quantity: 0 });
    } catch (error) {
        console.error('Error fetching stock:', error);
        res.status(500).json({ error: 'Failed to fetch stock' });
    }
});

// Manual stock adjustment
router.post('/adjust', async (req, res) => {
    try {
        const { godownId, categoryId, quantity, type, notes } = req.body;

        // Get current stock
        const currentStock = await db
            .select()
            .from(inventoryStock)
            .where(
                and(
                    eq(inventoryStock.godownId, godownId),
                    eq(inventoryStock.categoryId, categoryId)
                )
            )
            .get();

        const newQuantity = currentStock
            ? currentStock.quantity + (type === 'IN' ? quantity : -quantity)
            : (type === 'IN' ? quantity : 0);

        if (newQuantity < 0) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Update or insert stock
        if (currentStock) {
            await db
                .update(inventoryStock)
                .set({ quantity: newQuantity, lastUpdated: new Date() })
                .where(eq(inventoryStock.id, currentStock.id));
        } else {
            await db.insert(inventoryStock).values({
                godownId,
                categoryId,
                quantity: newQuantity,
            });
        }

        // Record transaction
        await db.insert(inventoryTransactions).values({
            godownId,
            categoryId,
            quantity,
            type,
            referenceType: 'ADJUSTMENT',
            notes,
        });

        res.json({ success: true, newQuantity });
    } catch (error) {
        console.error('Error adjusting stock:', error);
        res.status(500).json({ error: 'Failed to adjust stock' });
    }
});

// Get inventory transaction history
router.get('/history', async (req, res) => {
    try {
        const history = await db
            .select({
                id: inventoryTransactions.id,
                godownName: godowns.name,
                categoryName: categories.name,
                quantity: inventoryTransactions.quantity,
                type: inventoryTransactions.type,
                referenceType: inventoryTransactions.referenceType,
                referenceId: inventoryTransactions.referenceId,
                notes: inventoryTransactions.notes,
                createdAt: inventoryTransactions.createdAt,
            })
            .from(inventoryTransactions)
            .leftJoin(godowns, eq(inventoryTransactions.godownId, godowns.id))
            .leftJoin(categories, eq(inventoryTransactions.categoryId, categories.id))
            .orderBy(sql`${inventoryTransactions.createdAt} DESC`)
            .all();

        res.json(history);
    } catch (error) {
        console.error('Error fetching inventory history:', error);
        res.status(500).json({ error: 'Failed to fetch inventory history' });
    }
});

export default router;
