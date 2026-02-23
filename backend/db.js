const { Pool } = require('pg');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.on('connect', () => {
    // console.log('Connected to the PostgreSQL database'); // Reduce log noise
});

pool.on('error', (err) => {
    logger.dbError('POOL_ERROR', 'unknown', err);
    // Log the error but don't exit - allow app to continue and attempt reconnection
    // Subsequent queries will fail with proper error handling via the query promise
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool: pool
};
