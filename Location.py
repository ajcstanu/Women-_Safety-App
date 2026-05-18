"""
Location routes: /api/location/update, /share, /safe-zones, /current
"""

import time
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import get_current_user_id
from store import store

router = APIRouter()


class LocationUpdateRequest(BaseModel):
    lat: float
    lng: float
    accuracy: float | None = None
    speed: float | None = None
    heading: float | None = None
    altitude: float | None = None


class SafeZoneRequest(BaseModel):
    lat: float
    lng: float
    radius: float = 500
    label: str = "Safe Zone"


@router.post("/update")
async def update_location(body: LocationUpdateRequest, user_id: str = Depends(get_current_user_id)):
    store["sessions"][user_id] = {
        "lat": body.lat, "lng": body.lng, "accuracy": body.accuracy,
        "speed": body.speed, "heading": body.heading, "altitude": body.altitude,
        "ts": int(time.time() * 1000),
        "updated_at": datetime.utcnow().isoformat(),
    }
    return {"success": True, "timestamp": datetime.utcnow().isoformat()}


@router.get("/current")
async def get_current_location(user_id: str = Depends(get_current_user_id)):
    loc = store["sessions"].get(user_id)
    if not loc:
        raise HTTPException(status_code=404, detail="No location data found")
    return loc


@router.get("/safe-zones")
async def get_safe_zones(user_id: str = Depends(get_current_user_id)):
    user = store["users"].get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"safe_zones": user.get("safe_zones", [])}


@router.post("/safe-zones")
async def add_safe_zone(body: SafeZoneRequest, user_id: str = Depends(get_current_user_id)):
    user = store["users"].get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    zone = {"lat": body.lat, "lng": body.lng, "radius": body.radius, "label": body.label}
    user.setdefault("safe_zones", []).append(zone)
    store["users"][user_id] = user
    return {"success": True, "safe_zones": user["safe_zones"]}


@router.delete("/safe-zones/{index}")
async def delete_safe_zone(index: int, user_id: str = Depends(get_current_user_id)):
    user = store["users"].get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    zones = user.get("safe_zones", [])
    if index < 0 or index >= len(zones):
        raise HTTPException(status_code=404, detail="Safe zone not found")
    zones.pop(index)
    store["users"][user_id] = user
    return {"success": True, "safe_zones": zones}


@router.post("/check-safe-zone")
async def check_safe_zone(body: LocationUpdateRequest, user_id: str = Depends(get_current_user_id)):
    """Check whether the given coordinates are inside any of the user's safe zones."""
    import math
    user = store["users"].get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    def haversine(lat1, lng1, lat2, lng2):
        R = 6371000  # Earth radius in meters
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lng2 - lng1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    for zone in user.get("safe_zones", []):
        dist = haversine(body.lat, body.lng, zone["lat"], zone["lng"])
        if dist <= zone["radius"]:
            return {"inside_safe_zone": True, "zone": zone, "distance_meters": round(dist, 2)}

    return {"inside_safe_zone": False, "zone": None}
