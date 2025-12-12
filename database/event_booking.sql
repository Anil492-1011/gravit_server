-- ---------------------------------------------------------------------
-- <copyright file="event_booking.sql" company="Gravit InfoSystem">
-- Copyright (c) Gravit InfoSystem. All rights reserved.
-- </copyright>
-- ---------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS event_booking;
USE event_booking;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    date DATETIME,
    total_seats INT,
    available_seats INT,
    price DECIMAL(10,2),
    status ENUM('upcoming', 'live', 'closed') DEFAULT 'upcoming',
    img LONGTEXT, -- Base64 image
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT,
    user_id INT,
    name VARCHAR(255),
    email VARCHAR(255),
    mobile VARCHAR(20),
    quantity INT,
    total_amount DECIMAL(10,2),
    seats TEXT, -- JSON array of seat numbers
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
