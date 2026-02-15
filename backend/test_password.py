#!/usr/bin/env python3
"""Test password verification."""

from app.auth import hash_password, verify_password
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
    test_password = "AdminPassword123!@#"
    is_correct = verify_password(test_password, admin.password_hash)
    print(f"Admin email: {admin.email}")
    print(f"Test password: {test_password}")
    print(f"Password hash in DB: {admin.password_hash}")
    print(f"Password verification result: {is_correct}")
else:
    print("Admin user not found")

session.close()
