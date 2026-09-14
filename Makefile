SHELL := /bin/bash
.PHONY: help install check build poc-init poc-db poc-up poc-down migrate db-test backup infra-check

help:
	@echo 'install check build poc-init poc-db migrate db-test poc-up poc-down backup infra-check'

install:
	npm ci --ignore-scripts

check:
	npm run check
	python3 -m unittest discover -s scripts/backup -p 'test_*.py' -v
	node --test scripts/checks/migration-guards.test.mjs

build:
	npm run build

poc-init:
	python3 scripts/dev/init-poc.py

poc-db:
	docker compose --env-file .local/poc.env -f compose.poc.yaml up -d database

migrate:
	node --env-file=.local/poc.env scripts/dev/migrate.mjs

db-test:
	set -a; source .local/poc.env; set +a; psql --set=ON_ERROR_STOP=1 --file=database/tests/tenant-isolation.sql

poc-up:
	docker compose --env-file .local/poc.env -f compose.poc.yaml --profile application up --build -d

poc-down:
	docker compose --env-file .local/poc.env -f compose.poc.yaml --profile application down

backup:
	set -a; source .local/poc.env; set +a; scripts/backup/poc-postgres.sh

infra-check:
	bash scripts/checks/terraform.sh
