#!/usr/bin/env python3
"""Check admin user."""

from app.db import init_db, engine
from app.models import User
from sqlalchemy.orm import sessionmaker

# Initialize database
init_db()

# Create session
Session = sessionmaker(bind=engine)
session = Session()

# Get all users
users = session.query(User).all()
print(f"Total users: {len(users)}")
for user in users:
    print(f"  - {user.email} (ID: {user.id}, Admin: {user.is_admin})")

# Check admin specifically
admin = session.query(User).filter(User.email == "admin@example.com").first()
if admin:
    print(f"\nAdmin user found: {admin.email} (Admin role: {admin.is_admin})")
else:
    print("\nAdmin user NOT found")

session.close()
