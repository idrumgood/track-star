require('dotenv').config();
const { PrismaClient } = require('../generated/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let pool;

if (process.env.K_SERVICE) {
    // Production (Cloud Run)
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const password = process.env.DATABASE_PASSWORD;

    // Construct the socket path
    const instanceConnectionName = `${project}:us-central1:track-star-db`;
    const socketPath = `/cloudsql/${instanceConnectionName}`;

    // Using the official recommendation for pg with Unix sockets on GCP
    pool = new Pool({
        host: socketPath,
        user: 'postgres',
        password: password,
        database: 'postgres',
    });
} else {
    // Local / Development
    console.log('[db] Environment: Local');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
}

pool.on('error', (err) => {
    console.error('[db] Unexpected error on idle client', err);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
