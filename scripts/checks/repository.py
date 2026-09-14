#!/usr/bin/env python3
"""Offline repository invariants; not a substitute for security or live tests."""
import hashlib
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[2]
required = [
    'README.md', 'AGENTS.md', 'docs/architecture/baseline.md',
    'docs/plans/implementation-roadmap.md', 'docs/reference/verification.md',
    'docs/operations/backup-and-recovery.md', 'docs/operations/launch-checklist.md',
    'compose.poc.yaml', 'package-lock.json', '.github/workflows/ci.yml',
    'database/migrations/0001_foundation.sql', 'database/tests/tenant-isolation.sql',
]
errors = [f'Missing required file: {name}' for name in required if not (root / name).is_file()]
for environment in ('poc', 'production'):
    config = json.loads((root / f'config/environments/{environment}.json').read_text())
    expected = {'environment': environment, 'data_mode': 'synthetic',
                'external_ai_enabled': False, 'ai_provider': 'deterministic',
                'live_data_accepted': False, 'outbound_recruitment_actions_enabled': False}
    for key, value in expected.items():
        if config.get(key) != value:
            errors.append(f'{environment}: foundation invariant changed: {key}')
    for filename in ('main.tf', 'variables.tf', '.terraform.lock.hcl', 'backend.hcl.example'):
        if not (root / f'infra/environments/{environment}' / filename).is_file():
            errors.append(f'Missing {environment} Terraform file: {filename}')
manifest = json.loads((root / 'packages/contracts/provenance.json').read_text())
for entry in manifest['files']:
    asset = root / 'packages/contracts/schemas' / entry['file']
    if hashlib.sha256(asset.read_bytes()).hexdigest() != entry['sha256']:
        errors.append(f'Upstream schema changed without provenance update: {entry["file"]}')
for workflow in (root / '.github/workflows').glob('*.yml'):
    for action in re.findall(r'uses:\s*([^\s#]+)', workflow.read_text()):
        if not action.startswith('./') and not re.fullmatch(r'[^@]+@[a-f0-9]{40}', action):
            errors.append(f'{workflow.name}: action must use full commit SHA: {action}')
for doc in [root / 'README.md', *list((root / 'docs').rglob('*.md'))]:
    for target in re.findall(r'\]\(([^)]+)\)', doc.read_text()):
        if '://' in target or target.startswith('#'):
            continue
        target = target.split('#')[0]
        if not (doc.parent / target).exists():
            errors.append(f'{doc.relative_to(root)}: broken local link {target}')
if errors:
    raise SystemExit('\n'.join(errors))
print('Repository structure, environment defaults, source hashes, action pins and documentation links pass.')
