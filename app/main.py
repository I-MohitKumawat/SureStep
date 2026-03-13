from fastapi import FastAPI
from app.routers import auth
from app.database import engine, Base
from app.models import user
from app.models import token  

# Creates all tables in database automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dementia Care API",
    description="Backend API for dementia patient care",
    version="1.0.0"
)

app.include_router(auth.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}