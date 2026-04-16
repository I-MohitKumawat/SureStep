from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.link import CaregiverPatientLink
from app.schemas.link import LinkCreate, LinkResponse
from app.utils.dependencies import get_current_user, caregiver_only

router = APIRouter(prefix="/links", tags=["Caregiver-Patient Links"])

@router.post("/", response_model=LinkResponse)
def create_link(
    link_data: LinkCreate,
    current_user: User = Depends(caregiver_only),
    db: Session = Depends(get_db)
):
    """Caregiver links themselves to a patient"""

    # Check patient exists
    patient = db.query(User).filter(
        User.id == link_data.patient_id,
        User.role == "patient"
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Check if link already exists
    existing_link = db.query(CaregiverPatientLink).filter(
        CaregiverPatientLink.caregiver_id == current_user.id,
        CaregiverPatientLink.patient_id == link_data.patient_id,
        CaregiverPatientLink.status == "active"
    ).first()

    if existing_link:
        raise HTTPException(status_code=400, detail="Already linked to this patient")

    # Create the link
    new_link = CaregiverPatientLink(
        caregiver_id=current_user.id,
        patient_id=link_data.patient_id
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    return new_link

@router.get("/my-patients")
def get_my_patients(
    current_user: User = Depends(caregiver_only),
    db: Session = Depends(get_db)
):
    """Caregiver gets list of their linked patients"""
    links = db.query(CaregiverPatientLink).filter(
        CaregiverPatientLink.caregiver_id == current_user.id,
        CaregiverPatientLink.status == "active"
    ).all()

    patients = []
    for link in links:
        patient = db.query(User).filter(User.id == link.patient_id).first()
        patients.append({
            "link_id": link.id,
            "patient_id": patient.id,
            "patient_name": patient.name,
            "patient_email": patient.email,
            "linked_since": link.created_at
        })

    return {"patients": patients}

@router.delete("/{link_id}")
def remove_link(
    link_id: int,
    current_user: User = Depends(caregiver_only),
    db: Session = Depends(get_db)
):
    """Caregiver unlinks from a patient"""
    link = db.query(CaregiverPatientLink).filter(
        CaregiverPatientLink.id == link_id,
        CaregiverPatientLink.caregiver_id == current_user.id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    link.status = "inactive"
    db.commit()

    return {"message": "Successfully unlinked from patient"}