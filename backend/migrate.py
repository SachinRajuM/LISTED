"""
Run this once to add the uploaded_by column to the resumes table.
    python migrate.py
"""
from database import engine
from sqlalchemy import text
 
def migrate():
    with engine.connect() as conn:
        # Check if column exists first
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name='resumes' AND column_name='uploaded_by'
        """))
        if result.fetchone():
            print("✅ uploaded_by column already exists — skipping")
        else:
            conn.execute(text("ALTER TABLE resumes ADD COLUMN uploaded_by INTEGER"))
            conn.commit()
            print("✅ uploaded_by column added to resumes table")
 
        # Show current columns
        result = conn.execute(text("""
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_name='resumes' ORDER BY ordinal_position
        """))
        print("\nCurrent resumes columns:")
        for row in result:
            print(f"  {row[0]:30} {row[1]}")
 
if __name__ == "__main__":
    migrate()
 