"""
Database initialization script with retry logic
"""
import asyncio
import logging
from sqlalchemy import text
from app.core.config import settings
from app.core.database import Base, engine

logger = logging.getLogger(__name__)

async def wait_for_db(max_retries: int = 30, delay: int = 2):
    """
    Wait for database to be ready with retry logic
    """
    retries = 0
    while retries < max_retries:
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
                logger.info("Database is ready!")
                return True
        except Exception as e:
            retries += 1
            logger.warning(f"Database not ready yet (attempt {retries}/{max_retries}): {e}")
            await asyncio.sleep(delay)
    
    logger.error("Failed to connect to database after retries")
    return False

def init_db():
    """
    Initialize database tables
    """
    try:
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
        return True
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        return False

async def initialize_database():
    """
    Initialize database with retry logic
    """
    if await wait_for_db():
        if init_db():
            logger.info("Database initialization completed successfully")
            return True
    return False

if __name__ == "__main__":
    import sys
    success = asyncio.run(initialize_database())
    sys.exit(0 if success else 1)
