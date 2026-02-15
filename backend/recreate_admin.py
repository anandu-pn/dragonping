#!/usr/bin/env python3
"""Delete and recreate admin user."""

from app.db import init_db, engine
from app.models import User
from app.auth import hash_password
from sqlalchemy.orm import sessionmaker

# Initialize database
init_db()

# Create session
Session = sessionmaker(bind=engine)
session = Session()

# Delete existing admin
existing = session.query(User).filter(User.email == "admin@example.com").first()
if existing:
    session.delete(existing)
    session.commit()
    print(f"Deleted existing user: {existing.email}")

# Create new admin user
test_password = "AdminPassword123!@#"
hashed = hash_password(test_password)
print(f"Original password: {test_password}")
print(f"Hashed password: {hashed}")

admin_user = User(
    email="admin@example.com",
    password_hash=hashed,
    is_admin=True
)

session.add(admin_user)
session.commit()
session.refresh(admin_user)

print(f"\nNew admin user created:")
print(f"  Email: {admin_user.email}")
print(f"  ID: {admin_user.id}")
print(f"  Admin: {admin_user.is_admin}")
print(f"  Hash: {admin_user.password_hash}")

# Verify password works
from app.auth import verify_password
is_valid = verify_password(test_password, admin_user.password_hash)
print(f"  Password verification: {is_valid}")

session.close()
