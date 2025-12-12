 
import express from 'express';
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} from '../controllers/eventController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', authenticateToken, authorizeRole('admin'), createEvent);
router.put('/:id', authenticateToken, authorizeRole('admin'), updateEvent);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteEvent);

export default router;
