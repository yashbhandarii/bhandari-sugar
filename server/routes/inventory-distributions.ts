import { Router } from 'express';
import { db } from '../db/index.js';
import { inventoryDistributions, inventoryStock, inventoryTransactions, inventoryPurchases, customers, categories, godowns } from '../db/schema.js';
import { eq, and, desc, sql, sum } from 'drizzle-orm';

const router = Router();

// Get all distributions with details
router.get('/', async (req, res) => {
    try {
        const distributions = await db
            .select({
                id: inventoryDistributions.id,
                customerId: inventoryDistributions.customerId,
                customerName: customers.name,
                categoryId: inventoryDistributions.categoryId,
                categoryName: categories.name,
                godownId: inventoryDistributions.godownId,
                godownName: godowns.name,
                quantity: inventoryDistributions.quantity,
                ratePerQuintal: inventoryDistributions.ratePerQuintal,
                distributionDate: inventoryDistributions.distributionDate,
                notes: inventoryDistributions.notes,
                createdAt: inventoryDistributions.createdAt,
            })
            .from(inventoryDistributions)
            .leftJoin(customers, eq(inventoryDistributions.customerId, customers.id))
            .leftJoin(categories, eq(inventoryDistributions.categoryId, categories.id))
            .leftJoin(godowns, eq(inventoryDistributions.godownId, godowns.id))
            .orderBy(desc(inventoryDistributions.distributionDate))
            .all();

        res.json(distributions);
    } catch (error) {
        console.error('Error fetching distributions:', error);
        res.status(500).json({ error: 'Failed to fetch distributions' });
    }
});

// Get distributions for a specific customer
router.get('/customer/:customerId', async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);

        const distributions = await db
            .select({
                id: inventoryDistributions.id,
                categoryId: inventoryDistributions.categoryId,
                categoryName: categories.name,
                quantity: inventoryDistributions.quantity,
                ratePerQuintal: inventoryDistributions.ratePerQuintal,
                distributionDate: inventoryDistributions.distributionDate,
                notes: inventoryDistributions.notes,
                invoiceId: inventoryDistributions.invoiceId,
            })
            .from(inventoryDistributions)
            .leftJoin(categories, eq(inventoryDistributions.categoryId, categories.id))
            .where(eq(inventoryDistributions.customerId, customerId))
            .orderBy(desc(inventoryDistributions.distributionDate))
            .all();

        res.json(distributions);
    } catch (error) {
        console.error('Error fetching customer distributions:', error);
        res.status(500).json({ error: 'Failed to fetch customer distributions' });
    }
});

// Get pending distributions for a specific customer (not yet invoiced)
router.get('/pending/:customerId', async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);

        const distributions = await db
            .select({
                id: inventoryDistributions.id,
                categoryId: inventoryDistributions.categoryId,
                categoryName: categories.name,
                quantity: inventoryDistributions.quantity,
                ratePerQuintal: inventoryDistributions.ratePerQuintal,
                distributionDate: inventoryDistributions.distributionDate,
                notes: inventoryDistributions.notes,
            })
            .from(inventoryDistributions)
            .leftJoin(categories, eq(inventoryDistributions.categoryId, categories.id))
            .where(
                and(
                    eq(inventoryDistributions.customerId, customerId),
                    sql`${inventoryDistributions.invoiceId} IS NULL`
                )
            )
            .orderBy(desc(inventoryDistributions.distributionDate))
            .all();

        res.json(distributions);
    } catch (error) {
        console.error('Error fetching pending distributions:', error);
        res.status(500).json({ error: 'Failed to fetch pending distributions' });
    }
});

// Get distribution report
router.get('/report', async (req, res) => {
    try {
        // Get total distributed per category
        const categoryDistributions = await db
            .select({
                categoryId: inventoryDistributions.categoryId,
                categoryName: categories.name,
                totalDistributed: sql<number>`SUM(${inventoryDistributions.quantity})`,
            })
            .from(inventoryDistributions)
            .leftJoin(categories, eq(inventoryDistributions.categoryId, categories.id))
            .groupBy(inventoryDistributions.categoryId, categories.name)
            .all();

        // Get total purchased per category
        const categoryPurchases = await db
            .select({
                categoryId: inventoryPurchases.categoryId,
                categoryName: categories.name,
                totalPurchased: sql<number>`SUM(${inventoryPurchases.quantity})`,
            })
            .from(inventoryPurchases)
            .leftJoin(categories, eq(inventoryPurchases.categoryId, categories.id))
            .groupBy(inventoryPurchases.categoryId, categories.name)
            .all();

        // Get current inventory stock
        const currentStock = await db
            .select({
                categoryId: inventoryStock.categoryId,
                categoryName: categories.name,
                remaining: sql<number>`SUM(${inventoryStock.quantity})`,
            })
            .from(inventoryStock)
            .leftJoin(categories, eq(inventoryStock.categoryId, categories.id))
            .groupBy(inventoryStock.categoryId, categories.name)
            .all();

        // Get customer-wise distribution
        const customerDistributions = await db
            .select({
                customerId: inventoryDistributions.customerId,
                customerName: customers.name,
                totalBags: sql<number>`SUM(${inventoryDistributions.quantity})`,
            })
            .from(inventoryDistributions)
            .leftJoin(customers, eq(inventoryDistributions.customerId, customers.id))
            .groupBy(inventoryDistributions.customerId, customers.name)
            .all();

        res.json({
            categoryDistributions,
            categoryPurchases,
            currentStock,
            customerDistributions,
        });
    } catch (error) {
        console.error('Error generating distribution report:', error);
        res.status(500).json({ error: 'Failed to generate distribution report' });
    }
});

// Create new distribution
router.post('/', async (req, res) => {
    try {
        const { customerId, categoryId, godownId, quantity, distributionDate, notes } = req.body;

        // Check current stock
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

        if (!currentStock || currentStock.quantity < quantity) {
            return res.status(400).json({
                error: `Insufficient stock. Available: ${currentStock?.quantity || 0} bags, Requested: ${quantity} bags`
            });
        }

        // Get latest purchase rate for this category
        const latestPurchase = await db
            .select()
            .from(inventoryPurchases)
            .where(eq(inventoryPurchases.categoryId, categoryId))
            .orderBy(desc(inventoryPurchases.date))
            .limit(1)
            .get();

        const ratePerQuintal = latestPurchase?.ratePerQuintal || 0;

        // Create distribution record
        const result = await db
            .insert(inventoryDistributions)
            .values({
                customerId,
                categoryId,
                godownId,
                quantity,
                purchaseId: latestPurchase?.id,
                ratePerQuintal,
                distributionDate: new Date(distributionDate),
                notes,
            })
            .run();

        // Get the newly created distribution
        const newDistribution = await db
            .select()
            .from(inventoryDistributions)
            .where(eq(inventoryDistributions.id, Number(result.lastInsertRowid)))
            .get();

        if (!newDistribution) {
            throw new Error('Failed to create distribution record');
        }

        // Update inventory stock
        await db
            .update(inventoryStock)
            .set({
                quantity: currentStock.quantity - quantity,
                lastUpdated: new Date(),
            })
            .where(eq(inventoryStock.id, currentStock.id));

        // Record transaction
        await db.insert(inventoryTransactions).values({
            godownId,
            categoryId,
            quantity,
            type: 'OUT',
            referenceType: 'DISTRIBUTION',
            referenceId: newDistribution.id,
            notes: `Distribution to customer: ${quantity} bags`,
        });

        res.status(201).json(newDistribution);
    } catch (error) {
        console.error('Error creating distribution:', error);
        res.status(500).json({ error: 'Failed to create distribution' });
    }
});

export default router;
