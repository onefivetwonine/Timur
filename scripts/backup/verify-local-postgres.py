#!/usr/bin/env python3
"""Actual synthetic backup smoke. Requires PostgreSQL server/client tools on PATH.
Creates a private, disposable local cluster; stops it in finally and retains files
for diagnosis. No production access, dependencies installed, or cloud resources.
"""
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]


def main():
    for tool in ("initdb", "pg_ctl", "psql", "createdb", "pg_dump", "pg_restore"):
        if not shutil.which(tool):
            raise SystemExit(f"Missing PostgreSQL tool: {tool}")
    if os.geteuid() == 0:
        raise SystemExit("Run as an unprivileged local user, not root.")
    directory = Path(tempfile.mkdtemp(prefix="timur-backup-verification-"))
    password = secrets.token_hex(32)
    password_file = directory / "init-password"
    password_file.write_text(password + "\n")
    password_file.chmod(0o600)
    data = directory / "data"
    env = {**os.environ, "TIMUR_ENVIRONMENT": "poc", "TIMUR_TRUST_BACKUP": "yes",
           "PGHOST": "127.0.0.1", "PGPORT": os.environ.get("TIMUR_TEST_PGPORT", "55439"),
           "PGUSER": "postgres", "PGDATABASE": "timur_poc", "PGPASSWORD": password}
    for key in ("PGSERVICE", "PGSERVICEFILE", "PGHOSTADDR", "PGOPTIONS"):
        env.pop(key, None)

    def run(*args, check=True):
        return subprocess.run(list(map(str, args)), env=env, text=True,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=check)

    def sql(database, query):
        return run("psql", "--no-password", "--no-psqlrc", "--tuples-only", "--no-align",
                   "--set", "ON_ERROR_STOP=1", "--dbname", database, "--command", query).stdout.strip()

    started = False
    try:
        run("initdb", "--pgdata", data, "--username", "postgres", "--auth", "scram-sha-256",
            "--pwfile", password_file, "--no-locale", "--encoding", "UTF8")
        password_file.unlink()
        run("pg_ctl", "--pgdata", data, "--log", directory / "server.log", "--wait", "start",
            "--options", f"-h 127.0.0.1 -p {env['PGPORT']} -k {directory}")
        started = True
        run("createdb", "--no-password", "timur_poc")
        sql("timur_poc", "CREATE TABLE synthetic_recovery_probe (id integer PRIMARY KEY, tenant_id text NOT NULL, evidence text NOT NULL)")
        sql("timur_poc", "INSERT INTO synthetic_recovery_probe VALUES (1, 'synthetic-tenant-a', 'fixture alpha'), (2, 'synthetic-tenant-b', 'fixture beta')")
        query = "SELECT id, tenant_id, evidence FROM synthetic_recovery_probe ORDER BY id"
        expected = sql("timur_poc", query)
        start = time.monotonic()
        run(ROOT / "scripts/backup/poc-postgres.sh", directory / "backups")
        archive = next((directory / "backups").iterdir())
        target = "timur_restore_actual_drill"
        run(ROOT / "scripts/restore/poc-postgres.sh", archive, target)
        assert sql(target, query) == expected, "Restored rows differ"
        elapsed = time.monotonic() - start
        assert run(ROOT / "scripts/restore/poc-postgres.sh", archive, target, check=False).returncode != 0
        assert sql(target, query) == expected, "Existing target was changed"
        dump = archive / "database.dump"
        original = dump.read_bytes()
        dump.write_bytes(original + b"deliberate checksum corruption")
        try:
            assert run(ROOT / "scripts/restore/poc-postgres.sh", archive, "timur_restore_corrupt_drill", check=False).returncode != 0
            assert sql("postgres", "SELECT count(*) FROM pg_database WHERE datname='timur_restore_corrupt_drill'") == "0"
        finally:
            dump.write_bytes(original)
        result = {"status": "passed", "postgres": run("pg_dump", "--version").stdout.strip(),
                  "rows_restored": 2, "backup_restore_seconds": round(elapsed, 3),
                  "existing_target_rejected_and_unchanged": True,
                  "checksum_corruption_rejected_before_target_creation": True,
                  "scope": "local synthetic smoke, not full application or production recovery"}
        (directory / "result.json").write_text(json.dumps(result, indent=2) + "\n")
        print(json.dumps(result, indent=2))
    except subprocess.CalledProcessError as error:
        # Commands never contain password values; server logs remain private.
        print(error.stderr)
        raise
    finally:
        if started:
            stopped = run("pg_ctl", "--pgdata", data, "--wait", "stop", "--mode", "fast", check=False)
            if stopped.returncode != 0:
                raise RuntimeError(f"Could not stop isolated server; inspect {directory}")
        print(f"Private diagnostic artifacts retained: {directory}")


if __name__ == "__main__":
    main()
