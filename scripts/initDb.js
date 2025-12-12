const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function initDb() {
    try {
        // Connect without database selected
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log('Connected to MySQL server.');

        // Read SQL file
        const sqlPath = path.join(__dirname, '../database/event_booking.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split queries by semicolon (simple split, might need robustness for complex SQL but fine here)
        const queries = sql.split(';').filter(q => q.trim());

        for (const query of queries) {
            if (query.trim()) {
                await connection.query(query);
                console.log('Executed query');
            }
        }

        console.log('Database initialized successfully.');
        await connection.end();
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

initDb();
