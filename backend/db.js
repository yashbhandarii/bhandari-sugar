const { Pool } = require('pg');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Support both DATABASE_URL (Render/Supabase) and individual vars (local dev)
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }  // Required for Supabase
    }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
    // console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
    logger.dbError('POOL_ERROR', 'unknown', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool: pool
};
