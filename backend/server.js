const express = require('express');
const cors = require('cors');
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
app.use(helmet());

// Trust Render/Vercel proxy — required for rate limiting and correct IP detection
app.set('trust proxy', 1);

// Configure CORS — allow localhost and all *.vercel.app deployments
const corsOptions = {
    origin: (origin, callback) => {
        // Allow: no origin (mobile/Postman), localhost, any vercel.app URL, or FRONTEND_URL env
        const allowed =
            !origin ||
            origin === 'http://localhost:3000' ||
            /^https:\/\/[\w-]+\.vercel\.app$/.test(origin) ||
            (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL);

        if (allowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection check
const db = require('./db');
const { globalLimiter } = require('./middleware/rateLimiter');

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Initialize Backup Scheduler
    const { initScheduler } = require('./cron/scheduler');
    initScheduler();
});
