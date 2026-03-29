const request = require('supertest');
const express = require('express');
require('dotenv').config();

// We need an app with the godown routes mounted
const app = express();
app.use(express.json());

// Mock auth middleware for testing
const authMiddleware = require('./middleware/auth.middleware');
authMiddleware.verifyToken = (req, res, next) => {
    req.userId = 1;
    req.userRole = 'owner';
    next();
};

const godownRoutes = require('./routes/godown.routes');
app.use('/api/godown', godownRoutes);

const db = require('./db.js');

(async () => {
    try {
        const allInvs = await db.query('SELECT id FROM godown_invoices LIMIT 1');
        if (allInvs.rows.length > 0) {
            const id = allInvs.rows[0].id;
            console.log("Testing invoice ID:", id);
            
            const res = await request(app).get(`/api/godown/invoices/${id}`);
            console.log("Status Code:", res.statusCode);
            console.log("Response Body:", res.body);
            
            if (res.statusCode === 404) {
                 console.log("It returned 404!");
            }
        } else {
            console.log("No invoices found to test.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
