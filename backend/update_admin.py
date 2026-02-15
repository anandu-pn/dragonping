#!/usr/bin/env python3
"""Update admin user role."""

from app.db import init_db, engine
from app.models import User
from sqlalchemy.orm import sessionmaker

# Initialize database
init_db()

# Create session
Session = sessionmaker(bind=engine)
session = Session()

# Get admin user
admin = session.query(User).filter(User.email == "admin@example.com").first()
if admin:
    admin.is_admin = True
    session.commit()
    session.refresh(admin)
    print(f"Updated: {admin.email} - Admin role: {admin.is_admin}")
else:
    print("Admin user not found")

session.close()
