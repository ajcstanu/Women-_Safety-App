// SHIELD Women Safety App - Backend Server
// ==========================================
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();
const server = http.createServer(app);

// ─── WebSocket Server (Real-Time) ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP.',
});
app.use('/api/', limiter);

// SOS endpoint - higher limits
const sosLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
});
app.use('/api/sos', sosLimiter);

// ─── Database Connection ───────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      const mongoose = require('mongoose');
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected');
    } else {
      console.log('⚠️  No MongoDB URI - running with in-memory store');
    }
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
  }
};
connectDB();

// ─── In-Memory Store (Fallback / Demo Mode) ───────────────────────────────────
const store = {
  users: new Map(),
  alerts: new Map(),
  incidents: new Map(),
  safeRoutes: new Map(),
  contacts: new Map(),
  sessions: new Map(),
};

// Seed demo data
store.users.set('demo-user-001', {
  id: 'demo-user-001',
  name: 'Priya Sharma',
  email: 'priya@shield.app',
  phone: '+91-9876543210',
  emergencyContacts: [
    { name: 'Mom', phone: '+91-9876543211', relation: 'Mother' },
    { name: 'Rahul', phone: '+91-9876543212', relation: 'Brother' },
  ],
  safeZones: [
    { lat: 28.6139, lng: 77.2090, radius: 500, label: 'Home' },
    { lat: 28.6304, lng: 77.2177, radius: 300, label: 'Office' },
  ],
  createdAt: new Date().toISOString(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const sosRoutes       = require('./routes/sos');
const locationRoutes  = require('./routes/location');
const incidentRoutes  = require('./routes/incidents');
const contactRoutes   = require('./routes/contacts');
const routeRoutes     = require('./routes/safeRoutes');
const policeRoutes    = require('./routes/police');
const aiRoutes        = require('./routes/ai');

app.use('/api/auth',      authRoutes(store));
app.use('/api/sos',       sosRoutes(store, io));
app.use('/api/location',  locationRoutes(store, io));
app.use('/api/incidents', incidentRoutes(store));
app.use('/api/contacts',  contactRoutes(store));
app.use('/api/routes',    routeRoutes(store));
app.use('/api/police',    policeRoutes(store, io));
app.use('/api/ai',        aiRoutes(store));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    version: '1.0.0',
    app: 'SHIELD Women Safety',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    features: {
      sos: true, liveTracking: true, aiDetection: true,
      safeRoutes: true, offlineSMS: true, policePortal: true,
    },
  });
});

app.get('/', (req, res) => {
  res.json({ message: '🛡️ SHIELD API Running', docs: '/api/health' });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── WebSocket Events ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`📡 Client connected: ${socket.id}`);

  socket.on('join-user-room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('join-police-room', () => {
    socket.join('police-control-room');
    console.log(`Police joined control room`);
  });

  socket.on('location-update', (data) => {
    const { userId, lat, lng, accuracy, speed, heading } = data;
    store.sessions.set(userId, { lat, lng, accuracy, speed, heading, ts: Date.now() });
    // Broadcast to emergency contacts & police if active SOS
    io.to(`user:${userId}-watchers`).emit('location-update', { userId, lat, lng, accuracy, speed, heading, ts: Date.now() });
    io.to('police-control-room').emit('user-location', { userId, lat, lng, ts: Date.now() });
  });

  socket.on('sos-trigger', (data) => {
    const alert = { ...data, id: require('uuid').v4(), ts: Date.now(), status: 'ACTIVE' };
    store.alerts.set(alert.id, alert);
    io.to('police-control-room').emit('sos-alert', alert);
    io.to(`user:${data.userId}-watchers`).emit('sos-alert', alert);
    socket.broadcast.emit('sos-nearby', { lat: data.lat, lng: data.lng, radius: 500 });
    console.log(`🚨 SOS triggered by user ${data.userId}`);
  });

  socket.on('audio-chunk', (data) => {
    // Audio streaming - relay to AI analysis service
    socket.to('ai-analysis').emit('analyze-audio', data);
  });

  socket.on('disconnect', () => {
    console.log(`📡 Client disconnected: ${socket.id}`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🛡️  SHIELD Backend running on port ${PORT}`);
  console.log(`📡 WebSocket enabled`);
  console.log(`🌐 http://localhost:${PORT}\n`);
});

module.exports = { app, io, store };
