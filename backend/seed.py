"""
Seed script — run once to create admin + sample data.
    python seed.py
"""
import sys
from database import SessionLocal, create_tables, User, Job, UserRole
 
from auth import hash_password
 
 
def seed():
    create_tables()
    db = SessionLocal()
 
    # Admin user
    if not db.query(User).filter(User.email == "admin@recruitai.com").first():
        admin = User(
            full_name="Admin User",
            email="admin@recruitai.com",
            hashed_password=hash_password("admin123"),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        db.flush()
        print("✅ Admin user created: admin@recruitai.com / admin123")
 
        # Sample recruiter
        recruiter = User(
            full_name="Jane Recruiter",
            email="recruiter@recruitai.com",
            hashed_password=hash_password("recruiter123"),
            role=UserRole.recruiter,
            is_active=True,
        )
        db.add(recruiter)
        db.flush()
        print("✅ Recruiter created: recruiter@recruitai.com / recruiter123")
 
        # Sample jobs
        sample_jobs = [
            Job(
                title="Senior React Developer",
                department="Engineering",
                location="Remote",
                description="We are looking for a Senior React Developer with 5+ years of experience building production-grade web applications. You will architect and build scalable frontend systems, mentor junior developers, and collaborate closely with product and design teams.",
                requirements="5+ years React, TypeScript, Node.js, GraphQL, AWS. Strong understanding of state management patterns. Experience with testing frameworks.",
                employment_type="full_time",
                created_by=recruiter.id,
            ),
            Job(
                title="ML Engineer",
                department="Data Science",
                location="New York, NY",
                description="Join our ML platform team to build and deploy machine learning models at scale. You will work on NLP, recommendation systems, and real-time inference pipelines.",
                requirements="3+ years ML experience, Python, TensorFlow or PyTorch, MLOps, Docker, Kubernetes, SQL. NLP experience a plus.",
                employment_type="full_time",
                created_by=recruiter.id,
            ),
            Job(
                title="Product Designer",
                department="Design",
                location="Remote",
                description="Design intuitive user experiences for our AI recruiting platform. You will own end-to-end design from research to high-fidelity Figma prototypes.",
                requirements="3+ years product design, Figma, design systems, user research, prototyping. SaaS product experience preferred.",
                employment_type="contract",
                created_by=recruiter.id,
            ),
        ]
        db.add_all(sample_jobs)
        db.commit()
        print(f"✅ {len(sample_jobs)} sample jobs created")
    else:
        print("ℹ️  Admin user already exists — skipping seed")
 
    db.close()
    print("\n🎉 Seed complete!")
    print("   Admin:     admin@recruitai.com / admin123")
    print("   Recruiter: recruiter@recruitai.com / recruiter123")
 
 
if __name__ == "__main__":
    seed()
