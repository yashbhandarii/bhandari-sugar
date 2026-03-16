import { Router } from 'express';
import { db } from '../db/index.js';
import { godowns } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Get all godowns
router.get('/', async (req, res) => {
    try {
        const allGodowns = await db.select().from(godowns).all();
        res.json(allGodowns);
    } catch (error) {
        console.error('Error fetching godowns:', error);
        res.status(500).json({ error: 'Failed to fetch godowns' });
    }
});

// Create godown
router.post('/', async (req, res) => {
    try {
        const result = await db.insert(godowns).values(req.body).returning();
        res.status(201).json(result[0]);
    } catch (error) {
        console.error('Error creating godown:', error);
        res.status(500).json({ error: 'Failed to create godown' });
    }
});

// Update godown
router.put('/:id', async (req, res) => {
    try {
        const result = await db
            .update(godowns)
            .set(req.body)
            .where(eq(godowns.id, parseInt(req.params.id)))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({ error: 'Godown not found' });
        }

        res.json(result[0]);
    } catch (error) {
        console.error('Error updating godown:', error);
        res.status(500).json({ error: 'Failed to update godown' });
    }
});

// Delete godown
router.delete('/:id', async (req, res) => {
    try {
        await db.delete(godowns).where(eq(godowns.id, parseInt(req.params.id)));
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting godown:', error);
        res.status(500).json({ error: 'Failed to delete godown' });
    }
});

export default router;
