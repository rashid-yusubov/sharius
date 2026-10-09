#!/bin/sh
set -e

echo "Waiting for database to be ready..."
python << 'EOF'
import asyncio
import asyncpg
import os
import sys
from urllib.parse import urlparse

async def wait_for_db():
    db_url = os.getenv('DATABASE_URL')
    db_host = os.getenv('DB_HOST', 'db')
    db_port = int(os.getenv('DB_PORT', '5432'))
    db_user = os.getenv('DB_USER', 'project_user')
    db_password = os.getenv('DB_PASSWORD', 'project_password')
    db_name = os.getenv('DB_NAME', 'project_db')

    if db_url:
        try:
            clean_url = db_url.replace('postgresql+psycopg://', 'postgresql://')
            parsed = urlparse(clean_url)
            if parsed.hostname:
                db_host = parsed.hostname
            if parsed.port:
                db_port = parsed.port
            if parsed.username:
                db_user = parsed.username
            if parsed.password:
                db_password = parsed.password
            if parsed.path and len(parsed.path) > 1:
                db_name = parsed.path.lstrip('/')
        except Exception:
            pass

    max_retries = 30
    retry_count = 0

    while retry_count < max_retries:
        try:
            conn = await asyncpg.connect(
                host=db_host,
                port=db_port,
                user=db_user,
                password=db_password,
                database=db_name,
                timeout=5
            )
            await conn.close()
            print('✓ Database connection established successfully!')
            return True
        except Exception as e:
            retry_count += 1
            if retry_count >= max_retries:
                print(f'✗ Database connection failed after {max_retries} attempts: {e}', file=sys.stderr)
                return False
            print(f'⏳ Database not ready ({retry_count}/{max_retries}), retrying in 1s...')
            await asyncio.sleep(1)

if not asyncio.run(wait_for_db()):
    sys.exit(1)
EOF

echo "Applying database migrations and ensuring schema..."
python << 'EOF'
import subprocess
import sys
from app.database.db import engine
from app.models.models import Base

# Try running Alembic migrations first
try:
    res = subprocess.run(["alembic", "upgrade", "head"], capture_output=True, text=True)
    if res.returncode == 0:
        print("✓ Alembic migrations applied successfully!")
    else:
        print(f"Notice: Alembic output: {res.stderr or res.stdout}. Ensuring tables via Base.metadata...")
        Base.metadata.create_all(engine)
        print("✓ Tables verified/created successfully!")
except Exception as e:
    print(f"Notice: {e}. Fallback to Base.metadata.create_all...")
    Base.metadata.create_all(engine)
    print("✓ Tables created successfully!")
EOF

echo "Starting Sharius Backend API..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --reload
