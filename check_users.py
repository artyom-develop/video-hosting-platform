import asyncio
import sys
sys.path.append(".")
from app.core.database import get_db
from app.models.models import User

async def check_users():
    db = next(get_db())
    users = db.query(User).all()
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")

if __name__ == "__main__":
    asyncio.run(check_users())