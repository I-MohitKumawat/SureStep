from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.location import Location, Geofence, GeofenceAlert
from app.models.user import User
from app.models.link import CaregiverPatientLink
from app.schemas.geofence import (
    GeofenceCreate, GeofenceResponse,
    LocationUpdate, GeofenceAlertResponse
)
from app.utils.dependencies import get_current_user, caregiver_only
from app.utils.geofence_utils import is_inside_geofence
from app.utils.notification_utils import send_geofence_alerts

router = APIRouter(prefix="/geofence", tags=["Geofencing"])

# ─── Create Safe Zone ─────────────────────────────────────

@router.post("/", response_model=GeofenceResponse)
def create_geofence(
    data: GeofenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a safe zone for a patient.
    Example: Home with 200 meter radius.
    """
    geofence = Geofence(
        patient_id=current_user.id,
        name=data.name,
        latitude=data.latitude,
        longitude=data.longitude,
        radius_meters=data.radius_meters
    )
    db.add(geofence)
    db.commit()
    db.refresh(geofence)
    return geofence


@router.get("/my-zones", response_model=List[GeofenceResponse])
def get_my_geofences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all safe zones for current patient"""
    return db.query(Geofence).filter(
        Geofence.patient_id == current_user.id,
        Geofence.is_active == True
    ).all()


@router.delete("/{geofence_id}")
def delete_geofence(
    geofence_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a safe zone"""
    geofence = db.query(Geofence).filter(
        Geofence.id == geofence_id,
        Geofence.patient_id == current_user.id
    ).first()

    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")

    geofence.is_active = False
    db.commit()
    return {"message": "Geofence deleted successfully"}


# ─── Location Update ──────────────────────────────────────

@router.post("/location/update")
def update_location(
    data: LocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient's phone calls this every few minutes.
    Server checks all geofences and sends alerts if needed.
    """
    # Save location
    location = Location(
        patient_id=current_user.id,
        latitude=data.latitude,
        longitude=data.longitude
    )
    db.add(location)
    db.commit()

    # Get all active geofences for this patient
    geofences = db.query(Geofence).filter(
        Geofence.patient_id == current_user.id,
        Geofence.is_active == True
    ).all()

    alerts_triggered = []

    for geofence in geofences:
        inside = is_inside_geofence(
            data.latitude, data.longitude,
            geofence.latitude, geofence.longitude,
            geofence.radius_meters
        )

        if not inside:
            # Check if unacknowledged alert already exists
            recent_alert = db.query(GeofenceAlert).filter(
                GeofenceAlert.patient_id == current_user.id,
                GeofenceAlert.geofence_id == geofence.id,
                GeofenceAlert.is_acknowledged == False
            ).first()

            if not recent_alert:
                # Create alert
                alert = GeofenceAlert(
                    patient_id=current_user.id,
                    geofence_id=geofence.id,
                    latitude=data.latitude,
                    longitude=data.longitude
                )
                db.add(alert)
                db.commit()

                # Find linked caregivers
                links = db.query(CaregiverPatientLink).filter(
                    CaregiverPatientLink.patient_id == current_user.id,
                    CaregiverPatientLink.status == "active"
                ).all()

                for link in links:
                    caregiver = db.query(User).filter(
                        User.id == link.caregiver_id
                    ).first()

                    if caregiver:
                        send_geofence_alerts(
                            caregiver_email=caregiver.email,
                            emergency_contact=current_user.emergency_contact,
                            patient_name=current_user.name,
                            geofence_name=geofence.name,
                            latitude=data.latitude,
                            longitude=data.longitude
                        )

                alerts_triggered.append(geofence.name)

    if alerts_triggered:
        return {
            "status": "outside_safe_zone",
            "alerts_sent_for": alerts_triggered,
            "message": "You are outside your safe zone! Alerts sent."
        }

    return {
        "status": "inside_safe_zone",
        "message": "Location updated successfully ✅"
    }


# ─── Caregiver Views ──────────────────────────────────────

@router.get("/location/latest")
def get_latest_location(
    patient_id: int,
    current_user: User = Depends(caregiver_only),
    db: Session = Depends(get_db)
):
    """Caregiver gets latest location of their patient"""
    location = db.query(Location).filter(
        Location.patient_id == patient_id
    ).order_by(Location.recorded_at.desc()).first()

    if not location:
        raise HTTPException(
            status_code=404,
            detail="No location found for this patient"
        )

    return {
        "patient_id": patient_id,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "recorded_at": location.recorded_at,
        "google_maps_link": f"https://www.google.com/maps?q={location.latitude},{location.longitude}"
    }


@router.get("/alerts", response_model=List[GeofenceAlertResponse])
def get_alerts(
    patient_id: int,
    current_user: User = Depends(caregiver_only),
    db: Session = Depends(get_db)
):
    """Caregiver gets all geofence alerts for their patient"""
    return db.query(GeofenceAlert).filter(
        GeofenceAlert.patient_id == patient_id
    ).order_by(GeofenceAlert.created_at.desc()).all()


@router.patch("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(caregiver_only),
    db: Session = Depends(get_db)
):
    """Caregiver acknowledges an alert"""
    alert = db.query(GeofenceAlert).filter(
        GeofenceAlert.id == alert_id
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_acknowledged = True
    alert.acknowledged_by = current_user.id
    db.commit()
    return {"message": "Alert acknowledged ✅"}
