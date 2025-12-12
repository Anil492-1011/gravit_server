# Event Booking Server

Simple Node.js service that handles auth, events, and seat bookings for the Gravit platform.

## Requirements

- Node.js 18+
- MySQL 8 with an `event_booking` database
- Env file with port, database, and JWT values

## Setup

1. Install packages with `npm install`.
2. Copy `.env.example` or create `.env` with the usual PORT, JWT, and MySQL settings.
3. Run `npm run dev` for local work or `npm start` for production.

## What You Get

- REST endpoints for auth, events, and bookings.
- Socket.IO rooms that lock seats while people are checking out.
- Middleware for tokens, roles, and booking validation.
- Auto-migration script that keeps the tables in sync.

## Handy Routes

- `POST /api/auth/register` and `POST /api/auth/login`
- `GET /api/events` plus the usual create, update, delete paths for admins
- `POST /api/bookings` and `GET /api/bookings/user/:userId`

## Notes

- Update the allowed origins in `server.js` before deploying.
- Keep `JWT_SECRET` strong and rotate it when needed.
- Use parameterized queries only; the helpers in `config/db.js` already do this.

