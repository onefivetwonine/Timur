#!/usr/bin/env python3
"""Create ignored local credentials once. Never overwrite an existing environment."""
from pathlib import Path
import os
import secrets

root = Path(__file__).resolve().parents[2]
directory = root / '.local'
directory.mkdir(mode=0o700, exist_ok=True)
os.chmod(directory, 0o700)
target = directory / 'poc.env'
admin = secrets.token_hex(24)
app = secrets.token_hex(24)
content = f'''TIMUR_ENVIRONMENT=poc
TIMUR_DATA_MODE=synthetic
TIMUR_AI_PROVIDER=deterministic
TIMUR_EXTERNAL_AI_ENABLED=false
POSTGRES_DB=timur_poc
POSTGRES_USER=timur_owner
POSTGRES_PASSWORD={admin}
APP_DB_PASSWORD={app}
DATABASE_URL=postgresql://timur_app:{app}@127.0.0.1:5432/timur_poc
MIGRATION_DATABASE_URL=postgresql://timur_owner:{admin}@127.0.0.1:5432/timur_poc
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=timur_owner
PGDATABASE=timur_poc
PGPASSFILE={directory / 'poc.pgpass'}
'''
if target.exists():
    raise SystemExit('Local POC environment already exists; no credentials changed.')
passfile = directory / 'poc.pgpass'
with passfile.open('x', opener=lambda p, flags: os.open(p, flags, 0o600)) as f:
    f.write(f'127.0.0.1:5432:*:timur_owner:{admin}\n')
with target.open('x', opener=lambda p, flags: os.open(p, flags, 0o600)) as f:
    f.write(content)
print('Created .local/poc.env and .local/poc.pgpass with private permissions.')
