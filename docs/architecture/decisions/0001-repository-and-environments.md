# ADR 0001: one repository, separate environment roots

Status: implemented foundation choice; proposed for canonical GitBook reconciliation.
Date: 2026-09-14. Authority: user's initial repository instruction.

The project needs a maintainable starting codebase with POC and production
infrastructure and operational plans. Duplicating application trees per environment
would permit contract and safety fixes to drift.

Use npm workspaces with TypeScript shared contracts and runtime policy. Put Azure
resources in a reusable Terraform module, called by independent POC and production
roots with distinct backend/identity settings. Local development is a POC profile.
Promote the same tested source/image lineage and reviewed migrations, not data.

The production root includes private services, database HA and retention/deletion
protection. These cost more than the lean POC, and require private operations.
They are templates, not approved cloud spending or completed production controls.
Keep workload deployment and live-data acceptance separate from platform validation.

Revisit when a measured customer or operational requirement changes tenancy,
residency, availability or release isolation. Record changes in GitBook and the
corresponding ADR; do not modify the five upstream schema files silently.
