# 🛡️ SHIELD — Women Safety App
### *Intelligent. Proactive. Always On.*

> A full-stack AI-powered women's safety application with real-time threat detection, emergency escalation, live location sharing, and direct police control room integration.

---

## 📸 Features at a Glance

| Feature | Description |
|---|---|
| 🚨 **One-Tap SOS** | Hold 2s or voice/shake trigger — instantly alerts contacts + police |
| 🤖 **AI Threat Detection** | Real-time audio analysis for screams & distress sounds |
| 🗺️ **Safe Route AI** | AI-scored routes based on lighting, crowd density & safety reports |
| 📡 **Offline SMS Fallback** | Sends SMS with live GPS when internet is unavailable |
| 👮 **Police Control Room** | Live dashboard for law enforcement with real-time SOS feeds |
| 📼 **Evidence Recording** | Audio/video recorded and uploaded to cloud on SOS trigger |
| 📍 **Geotagged Reports** | All incidents timestamped + geotagged for legal investigation |
| 📳 **Shake Detection** | Shake phone 3× rapidly to trigger silent SOS |
| 🎙️ **Voice Activation** | Say "Help me" to trigger hands-free SOS |
| 🏠 **Safe Zones** | Alert when user leaves defined safe areas |

---

## 🏗️ Architecture

```
shield-app/
├── frontend/
│   └── shield-app.html        # Single-page app (HTML/CSS/JS)
│                              # Mobile-first, offline-capable PWA
│
├── backend/
│   ├── server.js              # Express + Socket.IO server
│   ├── routes/
│   │   ├── auth.js            # JWT authentication
│   │   ├── sos.js             # SOS trigger, cancel, location broadcast
│   │   ├── ai.js              # AI audio/movement/route analysis
│   │   ├── incidents.js       # Incident reporting & history
│   │   ├── contacts.js        # Emergency contacts CRUD
│   │   ├── location.js        # Live location & safe zones
│   │   ├── police.js          # Police portal API
│   │   └── safeRoutes.js      # Safe route data
│   ├── .env.example           # Environment variables template
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### Option A — Frontend Only (Demo Mode)
```bash
# Just open the HTML file in any browser
open frontend/shield-app.html
# OR serve with any static server:
npx serve frontend/
```

### Option B — Full Stack
```bash
# 1. Backend setup
cd backend
cp .env.example .env         # Edit with your credentials
npm install
npm run dev                  # Starts on http://localhost:5000

# 2. Frontend
cd ../frontend
# Update API constant in shield-app.html if needed:
# const API = 'http://localhost:5000/api';
open shield-app.html
```

### Docker (Recommended for Production)
```bash
docker-compose up --build
```

---

## 🔑 Demo Credentials
```
Email: demo@shield.app
Password: demo123
```

---

## 🎮 Demo Keyboard Shortcuts (Desktop Testing)

| Key | Action |
|---|---|
| `F1` | Trigger SOS (Manual) |
| `S` × 3 times | Simulate shake detection |
| `Escape` | Cancel active SOS |

---

## 📡 API Endpoints

### Auth
```
POST /api/auth/register      — Create account
POST /api/auth/login         — Login, get JWT token  
GET  /api/auth/profile       — Get user profile
PUT  /api/auth/profile       — Update settings
```

### SOS System
```
POST /api/sos/trigger            — Trigger emergency alert
POST /api/sos/cancel/:alertId    — Cancel active alert
GET  /api/sos/active             — Get active alerts
GET  /api/sos/history            — Alert history
POST /api/sos/location-update/:id — Update live location
POST /api/sos/sms-fallback       — Offline SMS trigger
```

### AI Analysis
```
POST /api/ai/analyze-audio       — Detect distress in audio
POST /api/ai/analyze-movement    — Detect erratic movement
POST /api/ai/safe-route          — Generate AI-scored routes
POST /api/ai/risk-assessment     — Area risk scoring
GET  /api/ai/crowd-density       — Real-time crowd data
```

### Police Portal
```
GET  /api/police/alerts          — Active alerts for officers
GET  /api/police/alerts/all      — All historical alerts
POST /api/police/respond/:id     — Mark alert as responded
POST /api/police/resolve/:id     — Resolve alert
GET  /api/police/stats           — Dashboard statistics
```

### Other
```
GET  /api/incidents              — User's incident history
POST /api/incidents/report       — File new incident report
GET  /api/incidents/nearby       — Nearby community reports
GET  /api/contacts               — Emergency contacts
POST /api/contacts               — Add contact
DELETE /api/contacts/:id         — Remove contact
POST /api/location/update        — Update current location
POST /api/location/share         — Generate shareable live-track link
POST /api/location/safe-zones    — Add safe zone
```

---

## 🔌 WebSocket Events

```javascript
// Client → Server
socket.emit('join-user-room', userId)
socket.emit('join-police-room')
socket.emit('location-update', { userId, lat, lng, accuracy, speed })
socket.emit('sos-trigger', { userId, lat, lng, triggerType })
socket.emit('audio-chunk', { userId, chunkBase64, timestamp })

// Server → Client  
socket.on('new-sos-alert', alertObject)
socket.on('location-update', { userId, lat, lng, ts })
socket.on('help-coming', { alertId, officerId, eta })
socket.on('alert-cancelled', { alertId })
socket.on('sos-nearby', { lat, lng, radius })
socket.on('user-location', locationObject)   // → police room
```

---

## 🤖 AI Features (Technical Details)

### Audio Threat Detection
- Analyzes amplitude, frequency spectrum, and duration
- Detects screams (3-4kHz range, high amplitude spikes)
- Returns confidence score 0-100
- **Production**: Replace with TensorFlow.js trained model or Google Cloud Speech API

### Movement Pattern Analysis  
- Processes accelerometer + gyroscope data
- Detects erratic patterns indicating panic/distress
- Threshold: >30 m/s² combined acceleration = erratic
- **Production**: Train on labeled panic/normal movement datasets

### Safe Route Scoring
- Factors: lighting, crowd density, CCTV coverage, police presence, incident history
- Returns top 3 routes sorted by safety score
- **Production**: Integrate Google Maps Platform + crime data APIs + streetlight databases

### Risk Assessment
- Time-of-day weighting (night = +35 risk points)
- Historical incident correlation
- Area type classification
- **Production**: ML model trained on city crime datasets

---

## 🔧 Environment Configuration

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/shield-safety
JWT_SECRET=your-super-secret-key-change-in-production

# Twilio SMS (Emergency Alerts)
TWILIO_SID=AC...
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE=+1234567890

# AWS S3 (Evidence Storage)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET=shield-evidence-bucket
AWS_REGION=ap-south-1

# Police API Integration
POLICE_PORTAL_URL=https://police-control.gov.in/api
POLICE_API_KEY=your_key
```

---

## 📱 Progressive Web App (PWA)

SHIELD works as a PWA with:
- **Service Worker** — offline caching, background sync
- **Push Notifications** — SOS alerts even when app is closed
- **Add to Home Screen** — native app experience on iOS/Android
- **Background Location** — continues tracking when minimized

### Installing on Mobile
1. Open `shield-app.html` in Chrome/Safari
2. Tap "Share" → "Add to Home Screen"
3. Grant permissions: Location, Microphone, Motion sensors

---

## 🔌 Offline Functionality

When internet is unavailable:
1. **SMS Fallback** — Twilio SMS API sends location to all contacts
2. **Local Cache** — Service Worker caches critical app data
3. **Mesh Network** (Future) — WebRTC P2P for mesh-based alerting
4. **Background Sync** — Queues location updates, syncs when online

---

## 🔒 Security

- JWT authentication with 30-day expiration
- Bcrypt password hashing (salt rounds: 12)
- Rate limiting: 100 req/15min general, 20 req/min for SOS endpoints
- MongoDB injection sanitization via `express-mongo-sanitize`
- Helmet.js for HTTP security headers
- Evidence encrypted at rest (AES-256 on S3)
- All location data transmitted over HTTPS/WSS

---

## 🌐 Production Deployment

### Backend (Node.js)
```bash
# PM2 process manager
npm install -g pm2
pm2 start server.js --name shield-api
pm2 save && pm2 startup
```

### Recommended Stack
- **Backend**: AWS EC2 / DigitalOcean Droplet / Railway
- **Database**: MongoDB Atlas (M10+ for production)
- **Evidence Storage**: AWS S3 + CloudFront CDN
- **SMS**: Twilio (supports 190+ countries)
- **Maps**: Google Maps Platform API
- **Monitoring**: Sentry + Datadog

---

## 📋 Hackathon Evaluation Notes

### ✅ Novelty & Accuracy
- AI audio threat detection with real-time processing
- Predictive risk scoring before incidents occur
- Offline-first SMS fallback architecture
- Multi-modal trigger system (voice + shake + gesture + AI)

### ✅ Feasibility
- 100% implementable with existing tech stack
- Runs in browser without app store approval
- Backend scales horizontally with Socket.IO adapter
- $0 infrastructure cost in demo mode

### ✅ User Experience
- SOS activatable in <2 seconds under stress
- Voice trigger requires zero phone interaction
- One-thumb interface optimized for emergencies
- Dark theme for low visibility situations
- Works on 2G networks via SMS fallback

---

## 🛣️ Roadmap

- [ ] **Wearable Integration** — Bluetooth LE for smartwatch SOS
- [ ] **Mesh Network** — Device-to-device alerting without internet
- [ ] **Face Recognition** — Identify & report known offenders
- [ ] **Community Watch** — Crowdsourced real-time danger zones
- [ ] **AR Navigation** — Camera-overlay safe route guidance
- [ ] **Predictive AI** — Learn patterns to predict danger before it occurs
- [ ] **Legal Module** — Auto-generate FIR with geotagged evidence

---

## 👥 Team

Built for the **New Age Women Safety App Hackathon**

---

## 📄 License

MIT License — Feel free to use, modify, and distribute for safety applications.

---

<div align="center">
  <strong>🛡️ SHIELD — Because every woman deserves to feel safe.</strong>
</div>
