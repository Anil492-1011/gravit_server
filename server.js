import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import createTables from './config/createTablesAuto.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
   "https://gravit-client.vercel.app/",
   "https://gravit-client-git-main-anil-daymas-projects.vercel.app/",
   "https://gravit-client-j4h2z5j71-anil-daymas-projects.vercel.app/"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Error handling middleware By Gravit InfoSystem
app.use((err, req, res, next) => {
  console.error('Error:', err);
  return res.status(500).json({
    success: false,
    message: err?.message || 'Internal server error'
  });
});

// Handle unhandled promise rejections By Gravit InfoSystem
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions By Gravit InfoSystem
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: "https://gravit-client.vercel.app",
        methods: ["GET", "POST"]
    }
});

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

// Socket.IO Logic with lock expiration
const lockedSeats = {}; // { eventId: { seatIndex: { userId, timestamp } } }
const LOCK_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Clean up expired locks every minute
setInterval(() => {
    const now = Date.now();
    Object.keys(lockedSeats).forEach(eventId => {
        Object.keys(lockedSeats[eventId]).forEach(seatIndex => {
            const lock = lockedSeats[eventId][seatIndex];
            if (now - lock.timestamp > LOCK_EXPIRY_TIME) {
                delete lockedSeats[eventId][seatIndex];
                io.to(`event-${eventId}`).emit('seatUnlocked', { seatIndex });
            }
        });
    });
}, 60000); // Check every minute

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinEvent', (eventId) => {
        try {
            socket.join(`event-${eventId}`);
            // Send current locked seats (only active locks)
            const now = Date.now();
            const activeLocks = {};
            if (lockedSeats[eventId]) {
                Object.keys(lockedSeats[eventId]).forEach(seatIndex => {
                    const lock = lockedSeats[eventId][seatIndex];
                    if (now - lock.timestamp <= LOCK_EXPIRY_TIME) {
                        activeLocks[seatIndex] = lock.userId;
                    }
                });
            }
            socket.emit('lockedSeats', activeLocks);
        } catch (error) {
            console.error('Error in joinEvent:', error);
        }
    });

    socket.on('lockSeat', ({ eventId, seatIndex, userId }) => {
        try {
            if (!eventId || seatIndex === undefined || !userId) {
                socket.emit('seatLockFailed', { seatIndex, reason: 'Invalid lock request' });
                return;
            }

            if (!lockedSeats[eventId]) lockedSeats[eventId] = {};
            
            const now = Date.now();
            const existingLock = lockedSeats[eventId][seatIndex];
            
            // Check if lock exists and is still valid
            if (existingLock && (now - existingLock.timestamp <= LOCK_EXPIRY_TIME)) {
                // Seat is already locked by someone else
                if (existingLock.userId !== userId) {
                    socket.emit('seatLockFailed', { seatIndex, reason: 'Seat is already locked' });
                    return;
                }
                // Same user, refresh the lock
                existingLock.timestamp = now;
            } else {
                // Lock is expired or doesn't exist, create new lock
                lockedSeats[eventId][seatIndex] = { userId, timestamp: now };
                io.to(`event-${eventId}`).emit('seatLocked', { seatIndex, userId });
            }
        } catch (error) {
            console.error('Error in lockSeat:', error);
            socket.emit('seatLockFailed', { seatIndex, reason: 'Server error' });
        }
    });

    socket.on('unlockSeat', ({ eventId, seatIndex, userId }) => {
        try {
            if (!eventId || seatIndex === undefined) {
                return; // Silently ignore invalid requests
            }

            if (lockedSeats[eventId] && lockedSeats[eventId][seatIndex]) {
                const lock = lockedSeats[eventId][seatIndex];
                // Only unlock if it's the same user or lock is expired
                if (!userId || lock.userId === userId || (Date.now() - lock.timestamp > LOCK_EXPIRY_TIME)) {
                    delete lockedSeats[eventId][seatIndex];
                    io.to(`event-${eventId}`).emit('seatUnlocked', { seatIndex });
                }
            }
        } catch (error) {
            console.error('Error in unlockSeat:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Note: We can't reliably track userId from socket, so locks will expire naturally
        // The cleanup interval will handle expired locks
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});


// Start Server
const PORT = process.env.PORT || 5000;

// Test Database Connection
db.execute('SELECT 1')
    .then(async () => {
        console.log('Database connected successfully');
        
        await createTables(db);
        console.log("All tables checked/created");

        
        // Start server
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API available at http://localhost:${PORT}/api`);
        });
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use`);
            } else {
                console.error('Server error:', err.message);
            }
        });
    })
    .catch((err) => {
        console.error('Database connection failed:', err.message);
        console.error('Error code:', err.code);
        console.error('\nCheck your .env file:');
        console.error('DB_HOST=hopper.proxy.rlwy.net');
        console.error('DB_PORT=29337');
        console.error('DB_USER=root');
        console.error('DB_PASSWORD=your-password');
        console.error('DB_NAME=railway');
        process.exit(1);
    });
