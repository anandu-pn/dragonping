import os
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import requests

from app.db import get_db, SessionLocal
from app.models import Service, User, ServiceType, ProtocolType

db = SessionLocal()
user = db.query(User).filter(User.username == 'nandu').first()

if user:
    new_service = Service(
        name="Fresh Service ORM",
        type=ServiceType.WEBSITE,
        protocol=ProtocolType.HTTP,
        is_public=True,
        user_id=user.id,
        active=True
    )
    db.add(new_service)
    db.commit()

response = requests.get('http://localhost:8000/api/public/status/nandu')
print("STATUS:", response.status_code)
print("TEXT:", response.text)
