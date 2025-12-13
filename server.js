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

// ---------------------------
// ✔ Allowed Origins (NO SLASH)
// ---------------------------
const allowedOrigins = [
  "https://gravit-client.vercel.app",
  "https://gravit-client-git-main-anil-daymas-projects.vercel.app",
  "https://gravit-client-j4h2z5j71-anil-daymas-projects.vercel.app",
];

// ---------------------------
// ✔ CORS MIDDLEWARE
// ---------------------------
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ BLOCKED ORIGIN:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// -------------------------------------
// ✔ Socket.IO CORS (Same allowedOrigins)
// -------------------------------------
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// -----------------------
// ✔ API ROUTES
// -----------------------
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

// ---------------------------
// ⚠ ERROR MIDDLEWARE AT END
// ---------------------------
app.use((err, req, res, next) => {
  console.error('🔥 SERVER ERROR:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// =============================================================================
// SOCKET.IO LOGIC (Seat Locking System)
// =============================================================================

const lockedSeats = {};
const LOCK_EXPIRY_TIME = 5 * 60 * 1000;

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
}, 60000);

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('joinEvent', (eventId) => {
    try {
      socket.join(`event-${eventId}`);

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
      console.error('joinEvent Error:', error);
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

      if (existingLock && (now - existingLock.timestamp <= LOCK_EXPIRY_TIME)) {
        if (existingLock.userId !== userId) {
          socket.emit('seatLockFailed', { seatIndex, reason: 'Seat already locked' });
          return;
        }
        existingLock.timestamp = now;
      } else {
        lockedSeats[eventId][seatIndex] = { userId, timestamp: now };
        io.to(`event-${eventId}`).emit('seatLocked', { seatIndex, userId });
      }
    } catch (error) {
      socket.emit('seatLockFailed', { seatIndex, reason: 'Server error' });
    }
  });

  socket.on('unlockSeat', ({ eventId, seatIndex, userId }) => {
    try {
      if (lockedSeats[eventId] && lockedSeats[eventId][seatIndex]) {
        const lock = lockedSeats[eventId][seatIndex];

        if (!userId || lock.userId === userId ||
          (Date.now() - lock.timestamp > LOCK_EXPIRY_TIME)) {

          delete lockedSeats[eventId][seatIndex];
          io.to(`event-${eventId}`).emit('seatUnlocked', { seatIndex });
        }
      }
    } catch (err) {
      console.log("unlockSeat error:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// =============================================================================
// SERVER + DB CONNECTION
// =============================================================================

const PORT = process.env.PORT || 5000;

db.execute('SELECT 1')
  .then(async () => {
    console.log('📦 Database connected');

    await createTables(db);
    console.log("📁 Tables checked/created");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
