from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class CaregiverPatientLink(Base):
    __tablename__ = "caregiver_patient_links"

    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="active")  # active, inactive
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    caregiver = relationship("User",
        foreign_keys=[caregiver_id],
        back_populates="caregiver_links"
    )
    patient = relationship("User",
        foreign_keys=[patient_id],
        back_populates="patient_links"
    )