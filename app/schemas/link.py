from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LinkCreate(BaseModel):
    patient_id: int

class LinkResponse(BaseModel):
    id: int
    caregiver_id: int
    patient_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class LinkedPatientResponse(BaseModel):
    link_id: int
    patient: dict