-- Migration to add seats column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seats TEXT;
ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'confirmed';


