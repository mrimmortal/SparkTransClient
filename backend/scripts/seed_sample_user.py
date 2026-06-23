import sys
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
os.chdir(BACKEND_DIR)
sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal, init_db
from app.services.seed import seed_sample_user


SAMPLE_EMAIL = "sample@sparktrans.app"
SAMPLE_PASSWORD = "SampleUser123!"


def main() -> None:
    init_db()
    with SessionLocal() as db:
        seed_sample_user(db, SAMPLE_EMAIL, SAMPLE_PASSWORD)
    print(f"Sample user ready: {SAMPLE_EMAIL} / {SAMPLE_PASSWORD}")


if __name__ == "__main__":
    main()
