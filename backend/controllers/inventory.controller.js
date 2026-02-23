const inventoryService = require('../services/inventory.service');

exports.getCurrentStock = async (req, res) => {
    try {
        const stock = await inventoryService.getCurrentStock();
        res.json(stock);
    } catch (error) {
        console.error('Error getting stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createMovement = async (req, res) => {
    try {
        const movement = await inventoryService.createMovement(req.body);
        res.status(201).json(movement);
    } catch (error) {
        console.error('Error creating movement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
