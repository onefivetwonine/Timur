#!/usr/bin/env python3
"""Exercise migrated synthetic data through real local backup/restore tools."""
import os
import subprocess
import tempfile
import time
from pathlib import Path

root = Path(__file__).resolve().parents[2]
if os.environ.get('TIMUR_ENVIRONMENT') != 'poc':
    raise SystemExit('POC only')
if os.environ.get('PGHOST') not in ('127.0.0.1', 'localhost', '::1'):
    raise SystemExit('Loopback PostgreSQL required')
if os.environ.get('PGDATABASE') != 'timur_poc':
    raise SystemExit('Requires timur_poc database')
env = dict(os.environ)
for name in ('PGHOSTADDR', 'PGSERVICE', 'PGSERVICEFILE'):
    env.pop(name, None)

def sql(statement, database='timur_poc'):
    return subprocess.check_output(['psql', '--no-password', '--set=ON_ERROR_STOP=1',
                                    '--tuples-only', '--no-align', '--dbname', database,
                                    '--command', statement], env=env, text=True).strip()

tenant = f'synthetic-drill-{time.time_ns()}'
sql(f"INSERT INTO timur.tenants(tenant_id) VALUES ('{tenant}'); "
    f"INSERT INTO timur.outbox(tenant_id,event_id,event_type,aggregate_id,payload) "
    f"VALUES ('{tenant}','restore-test','SyntheticFixtureCreated','fixture','{{}}');")
with tempfile.TemporaryDirectory(prefix='timur-backup-check-') as tmp:
    subprocess.run(['bash', str(root / 'scripts/backup/poc-postgres.sh'), tmp], env=env, check=True)
    backup = next(Path(tmp).glob('poc-*'))
    target = f'timur_restore_ci_{time.time_ns()}'
    restore_env = dict(env, TIMUR_TRUST_BACKUP='yes')
    subprocess.run(['bash', str(root / 'scripts/restore/poc-postgres.sh'), str(backup), target],
                   env=restore_env, check=True)
    assert sql(f"SELECT count(*) FROM timur.outbox WHERE tenant_id='{tenant}'", target) == '1'
    assert sql('SELECT name || sha256 FROM public.timur_schema_migrations ORDER BY name', target) == \
        sql('SELECT name || sha256 FROM public.timur_schema_migrations ORDER BY name')
    # Logical backups omit ACLs; reconstruct controlled grants before testing RLS.
    subprocess.run(['psql', '--no-password', '--set=ON_ERROR_STOP=1', '--dbname', target,
                    '--file', str(root / 'database/access/runtime-grants.sql')], env=env, check=True)
    subprocess.run(['psql', '--no-password', '--set=ON_ERROR_STOP=1', '--dbname', target,
                    '--file', str(root / 'database/tests/tenant-isolation.sql')], env=env, check=True)
    duplicate = subprocess.run(['bash', str(root / 'scripts/restore/poc-postgres.sh'), str(backup), target],
                               env=restore_env, capture_output=True)
    assert duplicate.returncode != 0, 'Existing target must never be overwritten'
    assert sql(f"SELECT count(*) FROM timur.outbox WHERE tenant_id='{tenant}'", target) == '1'
    print(f'Real migrated-data restore passed. Isolated database retained: {target}')
