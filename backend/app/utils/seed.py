import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.admin import Admin
from app.models.registry import StudentRegistry
from app.models.student import Student
from app.models.form import StudentForm, CorrectionHistory

logger = logging.getLogger(__name__)

DEMO_REGISTRY = [
    (1, "Aarav Sharma", "MDM2024001", "CSE"),
    (2, "Priya Patel", "MDM2024002", "AI/ML"),
    (3, "Rohit Verma", "MDM2024003", "Data Science"),
    (4, "Sneha Kulkarni", "MDM2024004", "ECE"),
    (5, "Kiran Mehta", "MDM2024005", "Mechanical"),
    (6, "Anjali Singh", "MDM2024006", "CSE"),
    (7, "Vikram Desai", "MDM2024007", "AI/ML"),
    (8, "Pooja Joshi", "MDM2024008", "Civil"),
    (9, "Rahul Nair", "MDM2024009", "Electrical"),
     (10, "Sameer Khan", "MDM2024013", "VLSI"),
    (11, "Lakshmi Rao", "MDM2024014", "5G"),
    (12, "Nikhil Gupta", "MDM2024015", "CSE"),
    (13, "Riya Chavan", "MDM2024016", "AI/ML"),
    (14, "Amit Patil", "MDM2024017", "Mechanical"),
    (15, "Swati Bhosale", "MDM2024018", "ECE"),
    (16, "Tejas Wagh", "MDM2024019", "CSE"),
    (17, "Kavya Iyer", "MDM2024020", "Data Science"),
]

# DEMO_STUDENTS = [
#     ("MDM2024001", "aarav.sharma@student.mdm.edu", "Aarav Sharma", "CSE", "Aarav", "Ramesh", "Sharma"),
#     ("MDM2024002", "priya.patel@student.mdm.edu", "Priya Patel", "AI/ML", "Priya", "Suresh", "Patel"),
#     ("MDM2024003", "rohit.verma@student.mdm.edu", "Rohit Verma", "Data Science", "Rohit", "Anil", "Verma"),
#     ("MDM2024004", "sneha.kulkarni@student.mdm.edu", "Sneha Kulkarni", "ECE", "Sneha", "Vijay", "Kulkarni"),
#     ("MDM2024005", "kiran.mehta@student.mdm.edu", "Kiran Mehta", "Mechanical", "Kiran", "Deepak", "Mehta"),
#     ("MDM2024006", "anjali.singh@student.mdm.edu", "Anjali Singh", "CSE", "Anjali", "Rakesh", "Singh"),
#     ("MDM2024007", "vikram.desai@student.mdm.edu", "Vikram Desai", "AI/ML", "Vikram", "Pramod", "Desai"),
#     ("MDM2024008", "pooja.joshi@student.mdm.edu", "Pooja Joshi", "Civil", "Pooja", "Hemant", "Joshi"),
#     ("MDM2024009", "rahul.nair@student.mdm.edu", "Rahul Nair", "Electrical", "Rahul", "Sunil", "Nair"),
#     ("MDM2024010", "divya.reddy@student.mdm.edu", "Divya Reddy", "ENTC", "Divya", "Krishna", "Reddy"),
# ]


def seed_all():
    db: Session = SessionLocal()
    try:
        # Seed Admin
        admin = db.query(Admin).filter(Admin.email == "admin@mdm.edu").first()
        if not admin:
            admin = Admin(
                email="admin@mdm.edu",
                hashed_password=get_password_hash("Admin@123"),
                full_name="MDM Administrator",
                role="admin",
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            logger.info("Admin seeded: admin@mdm.edu / Admin@123")

        # Seed Registry
        for sr, name, prn, branch in DEMO_REGISTRY:
            if not db.query(StudentRegistry).filter(StudentRegistry.prn == prn).first():
                db.add(StudentRegistry(sr_no=sr, name=name, prn=prn, branch=branch))
        db.commit()

        # Seed Students and Forms
        subjects_cse = ["ECE", "VLSI", "5G", "Mechanical", "Civil", "Electrical"]
        subjects_other = ["CSE", "AI/ML", "Data Science"]
        statuses = ["approved", "submitted", "rejected", "correction_requested", "approved", "submitted", "approved", "submitted", "approved", "draft"]

        for i, (prn, email, full_name, branch, first, father, last) in enumerate(DEMO_STUDENTS):
            reg = db.query(StudentRegistry).filter(StudentRegistry.prn == prn).first()
            if not db.query(Student).filter(Student.prn == prn).first():
                student = Student(
                    prn=prn,
                    email=email,
                    hashed_password=get_password_hash("Student@123"),
                    full_name=full_name,
                    branch=branch,
                    registry_id=reg.id if reg else None,
                )
                db.add(student)
                db.commit()
                db.refresh(student)
                if reg:
                    reg.is_registered = True
                    db.commit()

                # Create form
                eligible = subjects_cse if branch.lower() in ["cse", "ai/ml", "data science"] else subjects_other
                pref_choices = eligible[:3]
                form_status = statuses[i % len(statuses)]

                form = StudentForm(
                    student_id=student.id,
                    prn=prn,
                    first_name=first,
                    middle_name="",
                    last_name=last,
                    father_name=f"{father} {last}",
                    email=email,
                    student_mobile=f"9{800000000 + i * 11111111 % 100000000:09d}",
                    parent_mobile=f"8{700000000 + i * 22222222 % 100000000:09d}",
                    percentage=round(65.0 + (i * 3.5) % 35, 2),
                    sgpa=round(7.0 + (i * 0.3) % 3, 2),
                    cgpa=round(7.2 + (i * 0.25) % 2.8, 2),
                    backlogs=i % 3,
                    preference_1=pref_choices[0],
                    preference_2=pref_choices[1],
                    preference_3=pref_choices[2],
                    status=form_status,
                    submitted_at=datetime.now(timezone.utc) - timedelta(days=i) if form_status != "draft" else None,
                    reviewed_at=datetime.now(timezone.utc) - timedelta(hours=i * 3) if form_status in ["approved", "rejected", "correction_requested"] else None,
                    reviewed_by=admin.id if form_status in ["approved", "rejected", "correction_requested"] else None,
                    is_locked=form_status == "approved",
                    admin_remarks="Please verify SGPA/CGPA values" if form_status == "correction_requested" else None,
                )
                db.add(form)
                db.commit()
                db.refresh(form)

                # Audit history
                history = CorrectionHistory(
                    form_id=form.id,
                    version=1,
                    changed_by_role="student",
                    changed_by_id=student.id,
                    changed_by_name=student.full_name,
                    action="submitted",
                    old_data=None,
                    new_data={"status": "submitted"},
                    created_at=datetime.now(timezone.utc) - timedelta(days=i),
                )
                db.add(history)

                if form_status in ["approved", "rejected", "correction_requested"]:
                    history2 = CorrectionHistory(
                        form_id=form.id,
                        version=1,
                        changed_by_role="admin",
                        changed_by_id=admin.id,
                        changed_by_name=admin.full_name,
                        action=form_status,
                        old_data={"status": "submitted"},
                        new_data={"status": form_status},
                        remarks=form.admin_remarks,
                        created_at=datetime.now(timezone.utc) - timedelta(hours=i * 3),
                    )
                    db.add(history2)

                db.commit()

        logger.info("Demo data seeded successfully")
    except Exception as e:
        logger.error(f"Seed error: {e}")
        db.rollback()
    finally:
        db.close()
