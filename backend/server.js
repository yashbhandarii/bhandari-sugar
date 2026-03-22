// v3 - PUT items route added
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
    console.error('CRITICAL ERROR: JWT_SECRET environment variable is not set');
    console.error('Please set JWT_SECRET in your .env file before starting the server');
    process.exit(1);
}

const app = express();

// Security Middleware
// Add security headers with helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Trust Railway/Vercel proxy — required for rate limiting and correct IP detection
app.set('trust proxy', 1);

// Configure CORS — allow localhost, Vercel deployments, and FRONTEND_URL
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const isAllowed =
            origin === 'http://localhost:3000' ||
            /^http:\/\/192\.168\.\d+\.\d+:3000$/.test(origin) ||
            /^https:\/\/.*\.vercel\.app$/.test(origin) ||
            origin === 'https://bhandari-sugar.vercel.app' ||
            (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL);

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            // Return null, false to deny CORS without throwing a generic 500 error
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Compress all responses (gzip/brotli) — 60-70% smaller JSON payloads
app.use(compression());
// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection check
require('./db');
const { globalLimiter } = require('./middleware/rateLimiter');
const { ensureGodownInvoiceSchema } = require('./utils/ensureGodownInvoiceSchema');

// Apply global rate limiting to all API requests
app.use('/api/', globalLimiter);

// Import Routes
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const deliveryItemsRoutes = require('./routes/delivery.items.routes');
const billingRoutes = require('./routes/billing.routes');
const paymentRoutes = require('./routes/payment.routes');
const reportRoutes = require('./routes/report.routes');
const categoryRoutes = require('./routes/categories.routes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/delivery-sheets', deliveryRoutes);
app.use('/api/delivery-items', deliveryItemsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/financial-years', require('./routes/financial_year.routes'));
app.use('/api/godown', require('./routes/godown.routes'));
app.use('/api/audit', require('./routes/audit.routes'));

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Bhandari Sugar API is running');
});

// Error logging middleware (logs all errors before final handler)
const errorLoggingMiddleware = require('./middleware/errorLogging.middleware');
app.use(errorLoggingMiddleware);

// Error handling middleware
const errorHandler = require('./middleware/error.middleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await ensureGodownInvoiceSchema();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);

            // Initialize Backup Scheduler
            const { initScheduler } = require('./cron/scheduler');
            initScheduler();
        });
    } catch (error) {
        console.error('Failed to verify Godown invoice schema:', error);
        process.exit(1);
    }
}

startServer();
