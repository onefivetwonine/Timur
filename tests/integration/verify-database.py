#!/usr/bin/env python3
"""Reproducible isolated PG16 migration/RLS/restore smoke; server tools on PATH."""
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import tempfile

root = Path(__file__).resolve().parents[2]
for name in ('initdb', 'pg_ctl', 'psql', 'createdb', 'pg_dump', 'pg_restore', 'node'):
    if not shutil.which(name):
        raise SystemExit(f'Missing tool: {name}')
directory = Path(tempfile.mkdtemp(prefix='timur-database-verification-'))
password = secrets.token_hex(24)
password_file = directory / 'init-password'
password_file.write_text(password)
password_file.chmod(0o600)
with socket.socket() as available:
    available.bind(('127.0.0.1', 0))
    port = available.getsockname()[1]
env = dict(os.environ, TIMUR_ENVIRONMENT='poc', PGHOST='127.0.0.1', PGPORT=str(port),
           PGUSER='timur_owner', PGDATABASE='timur_poc', PGPASSWORD=password,
           POSTGRES_USER='timur_owner', POSTGRES_DB='timur_poc', APP_DB_PASSWORD=secrets.token_hex(24),
           MIGRATION_DATABASE_URL=f'postgresql://timur_owner:{password}@127.0.0.1:{port}/timur_poc')
for key in ('PGHOSTADDR', 'PGSERVICE', 'PGSERVICEFILE', 'PGOPTIONS'):
    env.pop(key, None)

def run(*command, check=True):
    result = subprocess.run(list(map(str, command)), cwd=root, env=env, text=True,
                            capture_output=True, check=False)
    if check and result.returncode:
        raise RuntimeError(f'Command failed: {command[0]}; inspect private cluster {directory}')
    return result

data = directory / 'data'
started = False
try:
    run('initdb', '-D', data, '-U', 'timur_owner', '--auth=scram-sha-256',
        '--pwfile', password_file, '--no-locale', '--encoding=UTF8')
    password_file.unlink()
    run('pg_ctl', '-D', data, '-l', directory / 'postgres.log', '-o',
        f'-h 127.0.0.1 -p {port} -k {directory}', '-w', 'start')
    started = True
    run('createdb', '--no-password', 'timur_poc')
    run('bash', 'scripts/dev/init-db.sh')
    run('node', 'scripts/dev/migrate.mjs')
    run('node', 'scripts/dev/migrate.mjs')
    run('psql', '-X', '-v', 'ON_ERROR_STOP=1', '-f', 'database/tests/tenant-isolation.sql')
    original = run('psql', '-X', '-tA', '-c', 'SELECT sha256 FROM public.timur_schema_migrations').stdout.strip()
    run('psql', '-X', '-v', 'ON_ERROR_STOP=1', '-c', "UPDATE public.timur_schema_migrations SET sha256='tampered'")
    assert run('node', 'scripts/dev/migrate.mjs', check=False).returncode != 0
    assert len(original) == 64 and all(c in '0123456789abcdef' for c in original)
    run('psql', '-X', '-v', 'ON_ERROR_STOP=1', '-c',
        f"UPDATE public.timur_schema_migrations SET sha256='{original}'")
    run('python3', 'tests/integration/restore-roundtrip.py')
    print('PASS: PG16 initial/repeated migrations, drift rejection, tenant read/write denial, '
          'logical backup/restore, grant reconstruction and restored tenant checks.')
finally:
    if started:
        run('pg_ctl', '-D', data, '-m', 'fast', '-w', 'stop')
    print(f'Isolated server stopped; private diagnostics retained: {directory}')
