const categoryService = require('../services/category.service');

exports.getCategories = async (req, res, next) => {
    try {
        const categories = await categoryService.getAllCategories();
        res.json(categories);
    } catch (err) {
        next(err);
    }
};

exports.createCategory = async (req, res, next) => {
    try {
        const category = await categoryService.createCategory(req.body);
        res.status(201).json(category);
    } catch (err) {
        // Handle unique constraint error
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Category already exists' });
        }
        next(err);
    }
};

exports.deleteCategory = async (req, res, next) => {
    try {
        await categoryService.deleteCategory(req.params.id);
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        next(err);
    }
};
