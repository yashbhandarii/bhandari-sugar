import express from 'express';
import { db, initializeDatabase } from './db/index.js';
import customersRouter from './routes/customers.js';
import categoriesRouter from './routes/categories.js';
import godownsRouter from './routes/godowns.js';
import inventoryRouter from './routes/inventory.js';
import invoicesRouter from './routes/invoices.js';
import paymentsRouter from './routes/payments.js';
import reportsRouter from './routes/reports.js';
import inventoryPurchasesRouter from './routes/inventory-purchases.js';
import inventoryDistributionsRouter from './routes/inventory-distributions.js';

const app = express();
const PORT = 3000;
// Force restart


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/godowns', godownsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/inventory-purchases', inventoryPurchasesRouter);
app.use('/api/inventory-distributions', inventoryDistributionsRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Bhandari Sugar API is running' });
});

// Initialize database and start server
async function start() {
    await initializeDatabase();

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 API available at http://localhost:${PORT}/api`);
    });
}

start().catch(console.error);
