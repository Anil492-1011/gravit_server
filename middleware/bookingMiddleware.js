// ---------------------------------------------------------------------
// <copyright file="bookingMiddleware.js" company="Gravit InfoSystem">
// Copyright (c) Gravit InfoSystem. All rights reserved.
// </copyright>
// ---------------------------------------------------------------------

import db from '../config/db.js';

export const checkUserRole = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admins cannot create bookings'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || 'Error checking user role'
        });
    }
};

export const checkEventStatus = async (req, res, next) => {
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: 'Event ID is required'
            });
        }

        const [events] = await db.query('SELECT status FROM events WHERE id = ?', [eventId]);
        
        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (events[0].status === 'closed') {
            return res.status(403).json({
                success: false,
                message: 'This event is closed. Bookings are no longer available.'
            });
        }

        next();
    } catch (error) {
        console.error('Error checking event status:', error?.message);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Server error while checking event status'
        });
    }
};
