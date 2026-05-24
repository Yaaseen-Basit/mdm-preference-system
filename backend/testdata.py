from app.core.database import SessionLocal
from app.models.admin import Admin
from app.core.security import get_password_hash

db = SessionLocal()

admin = Admin(
    email="test@abc123.org",
    hashed_password=get_password_hash("test@123"),
    full_name="MDM Administrator",
    role="admin",
    is_active=True
)

db.add(admin)
db.commit()

print("Admin inserted successfully")