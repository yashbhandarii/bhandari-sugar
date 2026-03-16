import { Router } from 'express';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Get all categories
router.get('/', async (req, res) => {
    try {
        const allCategories = await db.select().from(categories).all();
        res.json(allCategories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Create category
router.post('/', async (req, res) => {
    try {
        const result = await db.insert(categories).values(req.body).returning();
        res.status(201).json(result[0]);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Update category
router.put('/:id', async (req, res) => {
    try {
        const result = await db
            .update(categories)
            .set(req.body)
            .where(eq(categories.id, parseInt(req.params.id)))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(result[0]);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        await db.delete(categories).where(eq(categories.id, parseInt(req.params.id)));
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

export default router;
