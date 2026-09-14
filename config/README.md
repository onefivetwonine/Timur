# Environment configuration

`environments/*.json` are reviewed environment intent manifests, checked in CI.
They document target infrastructure and acceptance status; they do not inject
runtime values. The matching `*.env.example` files show runtime variable names.
The current runtime validates its actual environment variables at startup.

There are exactly two deployment environments: `poc` and `production`. Local
development is the loopback profile of POC, not a third cloud environment.
The same application images move between them; build output must not bake in
data, production credentials or the final environment. Next.js uses server-side
runtime configuration, never `NEXT_PUBLIC_` secrets.

Both defaults are synthetic with external AI and external recruitment actions
disabled. Changing an intent JSON does not implement a control or enable a
feature. Production live-data acceptance is recorded separately in the launch
checklist. Use Entra and managed identity integrations before enabling business
routes; runtime environment checks alone do not enforce data classification.

Use separate Azure subscriptions where feasible; at minimum separate resource
groups, networks, PostgreSQL servers, storage, state, identities and vaults.
Never copy a production database or Terraform state into POC. Promote immutable
code and reviewed migrations, not candidate data or authority grants.
