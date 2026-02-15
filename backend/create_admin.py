#!/usr/bin/env python3
"""Create admin user for testing."""

from app.db import init_db, engine
from app.models import User, Base
from app.auth import hash_password
from sqlalchemy.orm import sessionmaker

# Initialize database
init_db()

# Create session
Session = sessionmaker(bind=engine)
session = Session()

# Check if admin exists
admin_email = "admin@example.com"
existing_admin = session.query(User).filter(User.email == admin_email).first()

if existing_admin:
    print(f"Admin user '{admin_email}' already exists")
    session.close()
    exit(0)

# Create admin user
admin_user = User(
    email=admin_email,
    password_hash=hash_password("AdminPassword123!@#"),
    is_admin=True
)

session.add(admin_user)
session.commit()
session.refresh(admin_user)

print(f"Admin user created: {admin_user.email} (ID: {admin_user.id}, Admin: {admin_user.is_admin})")
session.close()
