// routes/sos.js - SOS Emergency System
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'shield-secret-key-change-in-prod';

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = (store, io) => {
  const router = express.Router();

  // ── Trigger SOS Alert ──────────────────────────────────────────────────────
  router.post('/trigger', authenticate, async (req, res) => {
    try {
      const { lat, lng, accuracy, triggerType, audioBase64, message } = req.body;
      const user = store.users.get(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const alertId = uuidv4();
      const alert = {
        id: alertId,
        userId: req.userId,
        userName: user.name,
        userPhone: user.phone,
        triggerType: triggerType || 'MANUAL', // MANUAL | VOICE | SHAKE | AI_DETECTED
        status: 'ACTIVE',
        location: { lat, lng, accuracy },
        locationHistory: [{ lat, lng, accuracy, ts: Date.now() }],
        message: message || '',
        audioEvidence: audioBase64 ? `audio_${alertId}.webm` : null,
        videoEvidence: null,
        emergencyContacts: user.emergencyContacts || [],
        respondedBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.alerts.set(alertId, alert);

      // Real-time broadcast to police portal
      io.to('police-control-room').emit('new-sos-alert', {
        ...alert,
        audioEvidence: undefined, // Don't send binary over socket
      });

      // Notify emergency contacts (simulate SMS)
      const smsResults = await notifyEmergencyContacts(user, alert);

      // Simulate audio upload to cloud
      if (audioBase64) {
        console.log(`📼 Audio evidence queued for upload: audio_${alertId}.webm`);
      }

      // Generate incident report
      const incidentId = uuidv4();
      store.incidents.set(incidentId, {
        id: incidentId,
        alertId,
        userId: req.userId,
        type: 'SOS_EMERGENCY',
        severity: 'HIGH',
        location: { lat, lng },
        timestamp: new Date().toISOString(),
        status: 'OPEN',
        geotagged: true,
        timestamped: true,
      });

      res.status(201).json({
        success: true,
        alertId,
        incidentId,
        message: 'SOS activated. Help is on the way.',
        smsResults,
        cloudUpload: !!audioBase64,
        timestamp: alert.createdAt,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Cancel SOS ─────────────────────────────────────────────────────────────
  router.post('/cancel/:alertId', authenticate, (req, res) => {
    const alert = store.alerts.get(req.params.alertId);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    if (alert.userId !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const updated = {
      ...alert,
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.alerts.set(req.params.alertId, updated);
    io.to('police-control-room').emit('alert-cancelled', { alertId: req.params.alertId });

    res.json({ success: true, message: 'SOS cancelled' });
  });

  // ── Get Active Alerts ──────────────────────────────────────────────────────
  router.get('/active', authenticate, (req, res) => {
    const alerts = [...store.alerts.values()]
      .filter(a => a.userId === req.userId && a.status === 'ACTIVE')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(alerts);
  });

  // ── Get All User Alerts ────────────────────────────────────────────────────
  router.get('/history', authenticate, (req, res) => {
    const alerts = [...store.alerts.values()]
      .filter(a => a.userId === req.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
    res.json(alerts);
  });

  // ── Update Location for Active SOS ────────────────────────────────────────
  router.post('/location-update/:alertId', authenticate, (req, res) => {
    const alert = store.alerts.get(req.params.alertId);
    if (!alert || alert.userId !== req.userId)
      return res.status(404).json({ error: 'Alert not found' });

    const { lat, lng, accuracy, speed, heading } = req.body;
    const locationEntry = { lat, lng, accuracy, speed, heading, ts: Date.now() };

    const updated = {
      ...alert,
      location: { lat, lng, accuracy },
      locationHistory: [...(alert.locationHistory || []), locationEntry].slice(-200),
      updatedAt: new Date().toISOString(),
    };
    store.alerts.set(req.params.alertId, updated);

    io.to('police-control-room').emit('location-update', {
      alertId: req.params.alertId,
      userId: req.userId,
      ...locationEntry,
    });

    res.json({ success: true });
  });

  // ── Send Distress SMS (Offline fallback info) ──────────────────────────────
  router.post('/sms-fallback', authenticate, (req, res) => {
    const { lat, lng, contacts } = req.body;
    const user = store.users.get(req.userId);
    const message = `🚨 EMERGENCY ALERT from ${user?.name || 'User'}! They need help. Location: https://maps.google.com/?q=${lat},${lng} - Time: ${new Date().toLocaleString()} - Sent via SHIELD Safety App`;

    // In production: use Twilio SMS API
    const results = (contacts || []).map(contact => ({
      to: contact.phone,
      message,
      status: 'queued', // Would be 'sent' with actual Twilio
      timestamp: new Date().toISOString(),
    }));

    console.log(`📱 SMS fallback triggered for ${user?.name} - ${results.length} contacts`);
    res.json({ success: true, smsSent: results.length, results });
  });

  // Helper: Notify emergency contacts
  async function notifyEmergencyContacts(user, alert) {
    const contacts = user.emergencyContacts || [];
    if (!contacts.length) return [];

    return contacts.map(contact => ({
      to: contact.phone,
      name: contact.name,
      message: `🚨 EMERGENCY! ${user.name} has triggered an SOS alert. Location: https://maps.google.com/?q=${alert.location.lat},${alert.location.lng} | Time: ${new Date().toLocaleString()} | SHIELD Safety App`,
      status: process.env.TWILIO_SID ? 'sent' : 'simulated',
      timestamp: new Date().toISOString(),
    }));
  }

  return router;
};
