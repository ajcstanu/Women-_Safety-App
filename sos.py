"""
SOS routes: /api/sos/trigger, /cancel, /active, /history, /location-update, /sms-fallback
"""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import get_current_user_id
from store import store

router = APIRouter()
_sio: Any = None  # injected from main.py


def set_sio(sio):
    global _sio
    _sio = sio


# ─── Schemas ──────────────────────────────────────────────────────────────────
class SOSTriggerRequest(BaseModel):
    lat: float
    lng: float
    accuracy: float | None = None
    trigger_type: str = "MANUAL"  # MANUAL | VOICE | SHAKE | AI_DETECTED
    audio_base64: str | None = None
    message: str = ""


class LocationUpdateRequest(BaseModel):
    lat: float
    lng: float
    accuracy: float | None = None
    speed: float | None = None
    heading: float | None = None


class SMSFallbackRequest(BaseModel):
    lat: float
    lng: float
    contacts: list[dict] = []


# ─── Helper ───────────────────────────────────────────────────────────────────
async def _notify_contacts(user: dict, alert: dict) -> list:
    contacts = user.get("emergency_contacts", [])
    results = []
    for c in contacts:
        results.append({
            "to": c["phone"],
            "name": c["name"],
            "message": (
                f"🚨 EMERGENCY! {user['name']} has triggered an SOS alert. "
                f"Location: https://maps.google.com/?q={alert['location']['lat']},{alert['location']['lng']} "
                f"| Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | SHIELD Safety App"
            ),
            "status": "simulated",  # Replace with Twilio in production
            "timestamp": datetime.utcnow().isoformat(),
        })
    return results


# ─── Routes ───────────────────────────────────────────────────────────────────
@router.post("/trigger", status_code=201)
async def trigger_sos(body: SOSTriggerRequest, user_id: str = Depends(get_current_user_id)):
    user = store["users"].get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    alert_id = str(uuid.uuid4())
    alert = {
        "id": alert_id,
        "user_id": user_id,
        "user_name": user["name"],
        "user_phone": user["phone"],
        "trigger_type": body.trigger_type,
        "status": "ACTIVE",
        "location": {"lat": body.lat, "lng": body.lng, "accuracy": body.accuracy},
        "location_history": [{"lat": body.lat, "lng": body.lng, "accuracy": body.accuracy, "ts": _now_ms()}],
        "message": body.message,
        "audio_evidence": f"audio_{alert_id}.webm" if body.audio_base64 else None,
        "video_evidence": None,
        "emergency_contacts": user.get("emergency_contacts", []),
        "responded_by": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    store["alerts"][alert_id] = alert

    # Real-time broadcast to police
    if _sio:
        broadcast_alert = {k: v for k, v in alert.items() if k != "audio_evidence"}
        await _sio.emit("new-sos-alert", broadcast_alert, room="police-control-room")

    sms_results = await _notify_contacts(user, alert)

    # Create incident record
    incident_id = str(uuid.uuid4())
    store["incidents"][incident_id] = {
        "id": incident_id,
        "alert_id": alert_id,
        "user_id": user_id,
        "type": "SOS_EMERGENCY",
        "severity": "HIGH",
        "location": {"lat": body.lat, "lng": body.lng},
        "timestamp": datetime.utcnow().isoformat(),
        "status": "OPEN",
        "geotagged": True,
        "timestamped": True,
    }

    return {
        "success": True,
        "alert_id": alert_id,
        "incident_id": incident_id,
        "message": "SOS activated. Help is on the way.",
        "sms_results": sms_results,
        "cloud_upload": bool(body.audio_base64),
        "timestamp": alert["created_at"],
    }


@router.post("/cancel/{alert_id}")
async def cancel_sos(alert_id: str, user_id: str = Depends(get_current_user_id)):
    alert = store["alerts"].get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    alert.update({
        "status": "CANCELLED",
        "cancelled_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    })
    store["alerts"][alert_id] = alert

    if _sio:
        await _sio.emit("alert-cancelled", {"alert_id": alert_id}, room="police-control-room")

    return {"success": True, "message": "SOS cancelled"}


@router.get("/active")
async def get_active_alerts(user_id: str = Depends(get_current_user_id)):
    alerts = [
        a for a in store["alerts"].values()
        if a["user_id"] == user_id and a["status"] == "ACTIVE"
    ]
    return sorted(alerts, key=lambda a: a["created_at"], reverse=True)


@router.get("/history")
async def get_alert_history(user_id: str = Depends(get_current_user_id)):
    alerts = [a for a in store["alerts"].values() if a["user_id"] == user_id]
    return sorted(alerts, key=lambda a: a["created_at"], reverse=True)[:50]


@router.post("/location-update/{alert_id}")
async def update_sos_location(
    alert_id: str,
    body: LocationUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    alert = store["alerts"].get(alert_id)
    if not alert or alert["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Alert not found")

    entry = {"lat": body.lat, "lng": body.lng, "accuracy": body.accuracy,
              "speed": body.speed, "heading": body.heading, "ts": _now_ms()}
    alert["location"] = {"lat": body.lat, "lng": body.lng, "accuracy": body.accuracy}
    alert["location_history"] = (alert.get("location_history", []) + [entry])[-200:]
    alert["updated_at"] = datetime.utcnow().isoformat()
    store["alerts"][alert_id] = alert

    if _sio:
        await _sio.emit("location-update", {"alert_id": alert_id, "user_id": user_id, **entry},
                        room="police-control-room")

    return {"success": True}


@router.post("/sms-fallback")
async def sms_fallback(body: SMSFallbackRequest, user_id: str = Depends(get_current_user_id)):
    user = store["users"].get(user_id)
    name = user["name"] if user else "User"
    msg = (
        f"🚨 EMERGENCY ALERT from {name}! They need help. "
        f"Location: https://maps.google.com/?q={body.lat},{body.lng} "
        f"- Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} - Sent via SHIELD Safety App"
    )
    results = [
        {"to": c.get("phone"), "message": msg, "status": "queued",
         "timestamp": datetime.utcnow().isoformat()}
        for c in body.contacts
    ]
    return {"success": True, "sms_sent": len(results), "results": results}


def _now_ms() -> int:
    import time
    return int(time.time() * 1000)
