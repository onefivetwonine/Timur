"""Safety/flow tests with fake PostgreSQL tools; does not prove database recovery."""
import hashlib
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
BACKUP = ROOT / "scripts/backup/poc-postgres.sh"
RESTORE = ROOT / "scripts/restore/poc-postgres.sh"


class BackupRestoreSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        tools = self.root / "bin"
        tools.mkdir()
        self.log = self.root / "calls"
        script = '''#!/usr/bin/env python3
import os, pathlib, sys
name = pathlib.Path(sys.argv[0]).name
with open(os.environ['MOCK_CALLS'], 'a') as f: f.write(name + ' ' + ' '.join(sys.argv[1:]) + '\\n')
if os.environ.get('MOCK_FAIL') == name: sys.exit(1)
if name == 'pg_dump':
    dest = next(a.split('=', 1)[1] for a in sys.argv if a.startswith('--file='))
    pathlib.Path(dest).write_bytes(b'trusted mock archive')
if name == 'pg_restore' and '--list' in sys.argv: print('mock archive table of contents')
'''
        for name in ("pg_dump", "pg_restore", "createdb"):
            path = tools / name
            path.write_text(script)
            path.chmod(0o755)
        self.env = {**os.environ, "PATH": f"{tools}:{os.environ['PATH']}",
                    "TIMUR_ENVIRONMENT": "poc", "TIMUR_TRUST_BACKUP": "yes",
                    "PGHOST": "127.0.0.1", "PGDATABASE": "timur_poc", "MOCK_CALLS": str(self.log)}

    def run_script(self, script, *args, **env):
        return subprocess.run([str(script), *map(str, args)], env={**self.env, **env}, capture_output=True, text=True)

    def backup(self):
        result = self.run_script(BACKUP, self.root / "backups")
        self.assertEqual(result.returncode, 0, result.stderr)
        return next((self.root / "backups").iterdir())

    def test_success_writes_private_verified_archive_and_restores_fresh_target(self):
        archive = self.backup()
        self.assertEqual(archive.stat().st_mode & 0o777, 0o700)
        self.assertEqual((archive / "database.dump").stat().st_mode & 0o777, 0o600)
        self.assertIn(hashlib.sha256(b"trusted mock archive").hexdigest(), (archive / "SHA256SUMS").read_text())
        result = self.run_script(RESTORE, archive, "timur_restore_test")
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.log.read_text()
        self.assertIn("--single-transaction", calls)
        self.assertNotIn("--clean", calls)

    def test_rejects_production_and_remote_hosts_before_database_calls(self):
        for script, args in ((BACKUP, [self.root / "backups"]), (RESTORE, [self.root, "timur_restore_test"])):
            for settings in ({"TIMUR_ENVIRONMENT": "production"}, {"PGHOST": "production.internal"}):
                self.assertNotEqual(self.run_script(script, *args, **settings).returncode, 0)
        self.assertFalse(self.log.exists())

    def test_rejects_existing_application_target_and_untrusted_archive(self):
        archive = self.backup()
        self.log.unlink()
        for target, settings in (("timur_poc", {}), ("timur_restore_test", {"TIMUR_TRUST_BACKUP": "no"})):
            self.assertNotEqual(self.run_script(RESTORE, archive, target, **settings).returncode, 0)
        self.assertFalse(self.log.exists())

    def test_checksum_tampering_stops_before_createdb(self):
        archive = self.backup()
        self.log.unlink()
        (archive / "database.dump").write_bytes(b"changed")
        self.assertNotEqual(self.run_script(RESTORE, archive, "timur_restore_test").returncode, 0)
        self.assertFalse(self.log.exists())

    def test_failed_createdb_never_invokes_restore(self):
        archive = self.backup()
        self.log.unlink()
        result = self.run_script(RESTORE, archive, "timur_restore_test", MOCK_FAIL="createdb")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("pg_restore", self.log.read_text())
        self.assertTrue(list(archive.glob("restore-*/create.stderr")))

    def test_failed_dump_not_marked_complete(self):
        result = self.run_script(BACKUP, self.root / "backups", MOCK_FAIL="pg_dump")
        self.assertNotEqual(result.returncode, 0)
        archive = next((self.root / "backups").iterdir())
        self.assertFalse((archive / "SHA256SUMS").exists())
        self.assertFalse((archive / "database.dump").exists())
        self.assertTrue((archive / "backup.stderr").exists())


if __name__ == "__main__":
    unittest.main()
