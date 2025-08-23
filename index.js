import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import databaseConnection from './config/database.js';
import userRoute from './routes/userRoute.js';
import tweetRoute from './routes/tweetRoute.js';
import notificationRoute from './routes/notificationRoute.js';

// Load env
dotenv.config({ path: '.env' });

// DB
databaseConnection();

// App
const app = express();

// Trust reverse proxy (Render/others) so secure cookies and req.protocol work
app.set('trust proxy', 1);

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// CORS (allow prod + local dev)
const allowedOrigins = [
'https://x-clone-frontend-beta.vercel.app',
'http://localhost:3000',
'http://localhost:5173'
];

// Precompute for speed
const originSet = new Set(allowedOrigins);

app.use(
cors({
origin: (origin, callback) => {
// Allow server-to-server, curl, and same-origin (no Origin header)
if (!origin) return callback(null, true);
if (originSet.has(origin)) return callback(null, true);
return callback(new Error(`CORS blocked for origin: ${origin}`));
},
credentials: true,
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization']
})
);

// Handle preflight for all routes
app.options('*', cors());

// Health check
app.get('/health', (req, res) => {
res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

// Routes
app.use('/api/v1/user', userRoute);
app.use('/api/v1/tweet', tweetRoute);
app.use('/api/v1/notifications', notificationRoute);

// Not found handler (optional but helpful)
app.use((req, res) => {
res.status(404).json({ message: 'Route not found' });
});

// Error handler (minimal)
app.use((err, req, res, next) => {
// CORS errors or others end up here
const status = err.status || 500;
const msg = err.message || 'Internal server error';
res.status(status).json({ message: msg });
});

// Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
console.log(`Server listening on port ${PORT}`);
});