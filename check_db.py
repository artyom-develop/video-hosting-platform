from sqlalchemy import inspect, create_engine
import os

# Подключусь к БД
engine = create_engine(os.getenv("DATABASE_URL", "postgresql://root:password@localhost:5432/xatube"))
inspector = inspect(engine)
columns = inspector.get_columns('streams')
for c in columns:
    print(f"{c['name']}: {c['type']}")
