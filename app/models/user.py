from sqlalchemy import Column, Integer, String, DateTime, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # patient, caregiver, admin

    # Extra profile fields
    phone = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    emergency_contact = Column(String, nullable=True)
    medical_id = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    caregiver_links = relationship("CaregiverPatientLink",
        foreign_keys="CaregiverPatientLink.caregiver_id",
        back_populates="caregiver"
    )
    patient_links = relationship("CaregiverPatientLink",
        foreign_keys="CaregiverPatientLink.patient_id",
        back_populates="patient"
    )