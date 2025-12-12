 import express from 'express';
import {
    createBooking,
    getUserBookings,
    getBookingById,
    getAllBookings,
    updateBooking
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/roleMiddleware.js';
import { checkUserRole, checkEventStatus } from '../middleware/bookingMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, checkUserRole, checkEventStatus, createBooking);
router.get('/', authenticateToken, getAllBookings);
router.get('/user/:userId', authenticateToken, getUserBookings);
router.get('/:id', authenticateToken, getBookingById);
router.put('/:id', authenticateToken, authorizeRole('admin'), updateBooking);

export default router;
