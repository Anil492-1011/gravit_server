import db from '../config/db.js';

const transformEvent = (event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    date: event.date,
    totalSeats: event.total_seats,
    availableSeats: event.available_seats,
    price: event.price,
    status: event.status || 'upcoming',
    image: event.img
});

export const getAllEvents = async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM events ORDER BY date ASC');
        const transformedEvents = events.map(transformEvent);
        
        return res.status(200).json({
            success: true,
            message: 'Events fetched successfully',
            data: transformedEvents
        });
    } catch (error) {
        console.error('Get all events error:', error?.message);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Server error while fetching events'
        });
    }
};

export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const [events] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
        
        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Event fetched successfully',
            data: transformEvent(events[0])
        });
    } catch (error) {
        console.error('Get event by id error:', error?.message);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Server error while fetching event'
        });
    }
};

export const createEvent = async (req, res) => {
    try {
        const { title, description, location, date, totalSeats, price, image, status } = req.body;

        if (!title || !date || !totalSeats || !price) {
            return res.status(400).json({
                success: false,
                message: 'Title, date, totalSeats, and price are required'
            });
        }

        const [result] = await db.query(
            'INSERT INTO events (title, description, location, date, total_seats, available_seats, price, img, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description || null, location || null, date, totalSeats, totalSeats, price, image || null, status || 'upcoming']
        );

        const [newEvent] = await db.query('SELECT * FROM events WHERE id = ?', [result.insertId]);

        return res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: transformEvent(newEvent[0])
        });
    } catch (error) {
        console.error('Create event error:', error?.message);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Server error while creating event'
        });
    }
};

export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, location, date, totalSeats, price, status, image } = req.body;

        await db.query(
            'UPDATE events SET title = ?, description = ?, location = ?, date = ?, total_seats = ?, price = ?, status = ?, img = ? WHERE id = ?',
            [title, description, location, date, totalSeats, price, status, image, id]
        );

        const [updated] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
        
        if (updated.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: transformEvent(updated[0])
        });
    } catch (error) {
        console.error('Update event error:', error?.message);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Server error while updating event'
        });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.query('DELETE FROM events WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Delete event error:', error?.message);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Server error while deleting event'
        });
    }
};
