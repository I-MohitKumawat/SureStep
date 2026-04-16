from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GeofenceCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    radius_meters: float

class GeofenceResponse(BaseModel):
    id: int
    patient_id: int
    name: str
    latitude: float
    longitude: float
    radius_meters: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

class GeofenceAlertResponse(BaseModel):
    id: int
    patient_id: int
    geofence_id: int
    latitude: float
    longitude: float
    is_acknowledged: bool
    created_at: datetime

    class Config:
        from_attributes = True