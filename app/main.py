from fastapi import FastAPI
from app.routers import auth, users, links, geofence
from app.database import engine, Base
from app.models import user, token, link, location

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dementia Care API",
    description="Backend API for dementia patient care",
    version="1.0.0"
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(links.router)
app.include_router(geofence.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}