// routes/ai.js - AI-Powered Threat Detection
const express = require('express');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'shield-secret-key-change-in-prod';

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const d = jwt.verify(token, JWT_SECRET);
    req.userId = d.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = (store) => {
  const router = express.Router();

  // ── Analyze Audio for Distress Signals ────────────────────────────────────
  router.post('/analyze-audio', authenticate, async (req, res) => {
    try {
      const { audioFeatures, duration, amplitude, frequencyData } = req.body;

      // Simulated AI audio analysis
      // In production: Use TensorFlow.js model or cloud ML API
      const analysis = analyzeAudioFeatures({
        amplitude: amplitude || 0,
        duration: duration || 0,
        frequencyData: frequencyData || [],
        audioFeatures: audioFeatures || {},
      });

      res.json({
        threatDetected: analysis.threatDetected,
        confidence: analysis.confidence,
        threatType: analysis.threatType,
        recommendation: analysis.recommendation,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Analyze Movement Pattern ───────────────────────────────────────────────
  router.post('/analyze-movement', authenticate, (req, res) => {
    try {
      const { accelerometerData, gyroscopeData, locationHistory } = req.body;

      const analysis = analyzeMovementPatterns({
        accelerometerData: accelerometerData || [],
        gyroscopeData: gyroscopeData || [],
        locationHistory: locationHistory || [],
      });

      res.json({
        erraticMovement: analysis.erraticMovement,
        panicIndicator: analysis.panicIndicator,
        confidence: analysis.confidence,
        suggestSOS: analysis.suggestSOS,
        pattern: analysis.pattern,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Safe Route Analysis ────────────────────────────────────────────────────
  router.post('/safe-route', authenticate, async (req, res) => {
    try {
      const { startLat, startLng, endLat, endLng, timeOfDay } = req.body;

      const routes = generateSafeRoutes({
        start: { lat: startLat, lng: startLng },
        end: { lat: endLat, lng: endLng },
        timeOfDay: timeOfDay || new Date().getHours(),
      });

      res.json({
        routes,
        recommendedRoute: routes[0],
        safetyScore: routes[0]?.safetyScore || 85,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Risk Zone Assessment ───────────────────────────────────────────────────
  router.post('/risk-assessment', authenticate, (req, res) => {
    try {
      const { lat, lng, radius = 500 } = req.body;

      // Simulated risk assessment based on time and area
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour > 21;
      const riskScore = calculateRiskScore({ lat, lng, isNight });

      res.json({
        riskScore,
        riskLevel: riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW',
        factors: [
          { factor: 'Time of Day', impact: isNight ? 'HIGH' : 'LOW', description: isNight ? 'Night hours - reduced visibility' : 'Daytime - generally safer' },
          { factor: 'Area Type', impact: 'MEDIUM', description: 'Mixed residential/commercial area' },
          { factor: 'Lighting', impact: isNight ? 'MEDIUM' : 'LOW', description: isNight ? 'Check for well-lit paths' : 'Good natural lighting' },
        ],
        recommendations: getRiskRecommendations(riskScore, isNight),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Crowd Density (Simulated) ──────────────────────────────────────────────
  router.get('/crowd-density', authenticate, (req, res) => {
    const { lat, lng } = req.query;
    const hour = new Date().getHours();

    // Simulate crowd density based on time
    let density = 'LOW';
    if (hour >= 8 && hour <= 20) density = 'MEDIUM';
    if (hour >= 11 && hour <= 14) density = 'HIGH';
    if (hour >= 17 && hour <= 19) density = 'HIGH';

    res.json({
      lat: parseFloat(lat), lng: parseFloat(lng),
      density,
      crowdScore: density === 'HIGH' ? 85 : density === 'MEDIUM' ? 50 : 20,
      saferToDensity: density !== 'LOW',
      nearbyPeople: density === 'HIGH' ? '100+' : density === 'MEDIUM' ? '30-50' : '<10',
      timestamp: new Date().toISOString(),
    });
  });

  // ── AI Helper Functions ────────────────────────────────────────────────────
  function analyzeAudioFeatures({ amplitude, duration, frequencyData }) {
    // Simplified scream/distress detection algorithm
    // In production: Use trained ML model (TensorFlow.js)
    
    const highAmplitude = amplitude > 0.7;
    const highFrequency = frequencyData.some ? 
      frequencyData.some(f => f > 3000 && f < 4000) : false;
    
    // Simulate detection based on amplitude threshold
    const screamConfidence = Math.min(amplitude * 100, 95);
    const threatDetected = amplitude > 0.75;

    return {
      threatDetected,
      confidence: Math.round(screamConfidence),
      threatType: threatDetected ? 'DISTRESS_SCREAM' : 'NORMAL',
      recommendation: threatDetected ? 
        'High distress audio detected. Consider triggering SOS.' : 
        'Audio levels normal. No threat detected.',
    };
  }

  function analyzeMovementPatterns({ accelerometerData, locationHistory }) {
    // Detect erratic movement patterns
    if (!accelerometerData.length && !locationHistory.length) {
      return {
        erraticMovement: false,
        panicIndicator: false,
        confidence: 0,
        suggestSOS: false,
        pattern: 'INSUFFICIENT_DATA',
      };
    }

    // Simulate shake detection
    const avgMagnitude = accelerometerData.length > 0 ?
      accelerometerData.reduce((s, d) => s + (Math.abs(d.x || 0) + Math.abs(d.y || 0) + Math.abs(d.z || 0)), 0) / accelerometerData.length : 0;

    const isErratic = avgMagnitude > 15; // Above 15 m/s² threshold
    const isPanic = avgMagnitude > 25;

    return {
      erraticMovement: isErratic,
      panicIndicator: isPanic,
      confidence: Math.min(avgMagnitude * 3, 95),
      suggestSOS: isPanic,
      pattern: isPanic ? 'PANIC_MOVEMENT' : isErratic ? 'ERRATIC_MOVEMENT' : 'NORMAL',
    };
  }

  function generateSafeRoutes({ start, end, timeOfDay }) {
    const isNight = timeOfDay < 6 || timeOfDay > 21;
    
    // Generate 3 mock routes with safety scores
    return [
      {
        id: 'route-1',
        name: 'Safest Route',
        distance: '2.3 km',
        duration: '28 min',
        safetyScore: isNight ? 72 : 91,
        features: ['Well-lit streets', 'CCTV coverage', 'Populated areas', 'Police beat'],
        waypoints: [
          { lat: start.lat, lng: start.lng },
          { lat: (start.lat + end.lat) / 2 + 0.001, lng: (start.lng + end.lng) / 2 },
          { lat: end.lat, lng: end.lng },
        ],
        warnings: isNight ? ['Low visibility in sector 3'] : [],
      },
      {
        id: 'route-2',
        name: 'Fastest Route',
        distance: '1.8 km',
        duration: '22 min',
        safetyScore: isNight ? 45 : 73,
        features: ['Main road', 'Some CCTV'],
        waypoints: [
          { lat: start.lat, lng: start.lng },
          { lat: end.lat, lng: end.lng },
        ],
        warnings: isNight ? ['Poorly lit stretch near market'] : ['Less monitored'],
      },
      {
        id: 'route-3',
        name: 'Scenic Route',
        distance: '2.8 km',
        duration: '35 min',
        safetyScore: isNight ? 60 : 82,
        features: ['Shopping area', 'High foot traffic'],
        waypoints: [
          { lat: start.lat, lng: start.lng },
          { lat: start.lat + 0.005, lng: start.lng + 0.003 },
          { lat: end.lat, lng: end.lng },
        ],
        warnings: [],
      },
    ].sort((a, b) => b.safetyScore - a.safetyScore);
  }

  function calculateRiskScore({ lat, lng, isNight }) {
    // Simplified risk calculation
    const baseRisk = 30;
    const nightBonus = isNight ? 35 : 0;
    const variation = Math.floor(Math.random() * 20) - 10;
    return Math.min(100, Math.max(0, baseRisk + nightBonus + variation));
  }

  function getRiskRecommendations(riskScore, isNight) {
    const recs = [];
    if (riskScore > 70) {
      recs.push('Share your live location with a trusted contact');
      recs.push('Stay in well-lit, crowded areas');
      recs.push('Consider alternative transport options');
    } else if (riskScore > 40) {
      recs.push('Stay aware of your surroundings');
      recs.push('Keep your phone charged and accessible');
    }
    if (isNight) {
      recs.push('Travel in groups if possible during night hours');
      recs.push('Inform someone about your route and ETA');
    }
    recs.push('SHIELD is monitoring. Press SOS if you feel unsafe.');
    return recs;
  }

  return router;
};
