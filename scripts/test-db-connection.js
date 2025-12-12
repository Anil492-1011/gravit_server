// Script to test database connection
const db = require('../config/db');

async function testConnection() {
    try {
        console.log('Testing database connection...');
        const [result] = await db.execute('SELECT 1 as test');
        console.log('Connection successful!');
        console.log('Test query result:', result);
        
        // Test if we can query a table
        try {
            const [tables] = await db.execute('SHOW TABLES');
            console.log('\nAvailable tables:', tables.length);
            tables.forEach(table => {
                console.log(`  - ${Object.values(table)[0]}`);
            });
        } catch (err) {
            console.log('Could not list tables:', err.message);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Connection failed:', error.message);
        console.error('Error code:', error.code);
        process.exit(1);
    }
}

testConnection();

