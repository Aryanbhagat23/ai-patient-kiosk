"""Reset a staff password to the default (it must be changed at the next sign-in).

Usage (from the backend folder):  venv\\Scripts\\python reset_admin.py [username]
"""
import sys

import config
from database import SessionLocal, StaffDB, init_db
from security import hash_password

username = sys.argv[1] if len(sys.argv) > 1 else config.DEFAULT_ADMIN_USERNAME
init_db()
db = SessionLocal()
staff = db.query(StaffDB).filter(StaffDB.username == username).first()
if not staff:
    staff = StaffDB(username=username)
    db.add(staff)
staff.password = hash_password(config.DEFAULT_ADMIN_PASSWORD)
staff.must_change_password = True
db.commit()
print(f"Password for '{username}' reset to the default. Sign in and choose a new one.")
