// Script to add seats column to bookings table if it doesn't exist
const db = require('../config/db');

async function addSeatsColumn() {
    try {
        // Check if column exists
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bookings' 
            AND COLUMN_NAME = 'seats'
        `);

        if (columns.length === 0) {
            // Add the column
            await db.query('ALTER TABLE bookings ADD COLUMN seats TEXT');
            console.log('✅ Seats column added successfully');
        } else {
            console.log('✅ Seats column already exists');
        }

        // Update status column if needed
        try {
            await db.query("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending'");
            console.log('✅ Status column updated');
        } catch (err) {
            console.log('Status column update skipped:', err.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding seats column:', error);
        process.exit(1);
    }
}

addSeatsColumn();


