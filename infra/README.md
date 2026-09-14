# Azure infrastructure foundation

Two independent Terraform roots define **POC** and **production**. No cloud resources have been deployed. They provision platform foundations only: applications, jobs, migrations, authentication, image registry and ingress publication remain release work. Never treat a successful Terraform validation as proof of a working product.

| Property | POC | Production |
| --- | --- | --- |
| State / subscription / operator group | Dedicated | Separate dedicated resources |
| Region | Southeast Asia (Singapore) | Southeast Asia (Singapore) |
| Database | PostgreSQL 16, burstable, private, Entra only | PostgreSQL 16, general purpose, private, Entra only, zone HA |
| Database PITR | 7 days | 35 days |
| Object storage | Private, LRS, versions + 7-day soft delete | Private, ZRS, versions + 35-day soft delete |
| Queue | PostgreSQL outbox in application | Private Service Bus Premium + jobs queue |
| Secrets | Future Container Apps secret bindings | Private Key Vault, RBAC, purge protection |
| AI | Synthetic deterministic application adapter | Unconfigured until provider approval |
| Container Apps | Internal environment, no workloads | Internal zone-redundant environment, no workloads |
| Logs | 30 days / 1 GB daily cap | 90 days / 5 GB daily cap |
| Deletion protection | State only | State and workload resource group |

Service Bus Premium, HA PostgreSQL, private endpoints, logs and storage incur charges even without application traffic. Review a real Azure estimate and subscription quotas before applying. A daily log cap can hide incidents after it is reached; connect alerts before live traffic. Regional SKU/zone availability must be confirmed by a real plan/deployment.

## Repository layout

- `modules/foundation`: shared network, database, object storage, monitoring and compute environment resources.
- `environments/poc`: isolated POC root, non-overlapping 10.60.0.0/16 network.
- `environments/production`: isolated production root, 10.70.0.0/16 network.
- `bootstrap/state`: instantiate independently for each environment; local initial state requires protected custody and migration.

Use independent Azure subscriptions where possible, separate workload/state groups and state accounts always. Do not use Terraform workspaces to combine these environments. Module changes must pass POC first; pin reviewed commits and provider lockfiles in releases.

## Prepare state and identity

1. Create environment-specific Entra operator groups and OIDC federated deployment identities. Grant only required resource deployment permissions and scoped role assignment permissions. Never place credentials in tfvars or backend files.
2. Instantiate `bootstrap/state` from a separate secured working copy/state directory for each environment. Supply subscription ID, environment, unique account name, state operator object ID and a controlled runner's fixed public IP allowlist. Its initial state is local: protect it and move it to its own secured bootstrap backend; do not overwrite it when bootstrapping the second environment.
3. State access uses Entra RBAC and a storage firewall. Operator must be on the IP allowlist and have Storage Blob Data Contributor. OIDC federation setup is external to this module. State has versioning, soft delete, an Azure lock and Terraform `prevent_destroy`; backup these bootstrap state records too.
4. Copy `backend.hcl.example` and `terraform.tfvars.example` to ignored local counterparts and replace all placeholders. For interactive `az login`, set `use_oidc = false`; CI must use OIDC and environment-specific identities. Supply the appropriate ARM subscription/tenant/client IDs through the runner environment.

```sh
terraform -chdir=infra/environments/poc init -backend-config=backend.hcl
terraform -chdir=infra/environments/poc plan -out=poc.tfplan
# Review the plan and cost estimate before executing a deployment.
terraform -chdir=infra/environments/poc apply poc.tfplan
```

Repeat using the production root and its own identity/backend only after POC acceptance. Saved plans and Terraform state are sensitive artifacts; keep them out of Git and expire CI copies. Never copy POC data or state to production.

## Private operations and workload integration

Both environments deny public database and Blob access. Container Apps environments are internal. Operations require a network-connected runner/operator and private DNS resolution (VPN/peering/resolver design is organization-specific and is not created here). Storage containers use ARM management-plane resources; data access still requires private connectivity and data-plane RBAC. No public application endpoint or DNS domain is created.

Before deploying application images:

- Create an image registry, build and scan immutable digest-pinned images, and grant pull access.
- Wire API port 8000 (`/health/live`, `/health/ready`), web port 3000 and worker/job execution to Container Apps; set sensible scale bounds and timeouts.
- Grant the API and worker managed identities only their required container/queue/secret roles. Identities exist but deliberately have no data roles before the domain access model is implemented.
- Bootstrap PostgreSQL roles for managed identities using the Entra administrator from inside the network, implement token refresh and separate migration/application privileges, then migrate. Azure resource RBAC does not grant SQL access.
- Configure Container Apps secret bindings for POC or Key Vault references in production as actually needed. No passwords or secret values are managed in these Terraform roots.
- Define authenticated ingress, tenant enforcement, quarantine scanning/release, retention/deletion schedules and production provider approval. Add customer-facing DNS/TLS only after the authentication path is ready.
- Route runtime telemetry without candidate content or secrets. Add action groups, database capacity/availability alerts, queue depth/dead-letter alerts and restore evidence before production traffic.

## Recovery and retention

PostgreSQL native PITR and Blob versions/soft delete are configured. These provide same-region recovery foundations; they are **not independent immutable backups**. Geographic backups are disabled to keep this baseline in Singapore until an explicit residency decision. No cross-region disaster-recovery capability is claimed.

A production CanNotDelete resource-group lock prevents accidental deletion but can also block legitimate replacement/deletion in Terraform. Remove it only in an explicitly reviewed recovery/change procedure, execute the change and restore the lock. State additionally uses `prevent_destroy`. These controls do not protect against all privileged-account compromise.

Restore PostgreSQL into a **new** server at the selected UTC timestamp, validate tenant boundaries, counts and migrations from a private runner, then switch the application connection during a controlled cutover. Restore deleted Blob objects/versions into a recovery container and verify checksums, permissions and database object references before release. Retain the old resources until the recovery is accepted. Test both restores quarterly and before onboarding real data; record measured RPO/RTO, operator, timestamps and evidence in the operations runbooks. Soft-deleted/versioned personal data remains retained until expiry; a business deletion request must consider those retained copies.

Independent encrypted logical database exports, immutable isolated backup storage, Blob point-in-time restoration, retention automation, restore execution, alert routing and business-approved RPO/RTO targets remain explicit implementation decisions. No scheduled export or restore job exists yet.

## Local verification

```sh
terraform fmt -check -recursive infra
terraform -chdir=infra/environments/poc init -backend=false
terraform -chdir=infra/environments/poc validate
terraform -chdir=infra/environments/poc test
terraform -chdir=infra/environments/production init -backend=false
terraform -chdir=infra/environments/production validate
terraform -chdir=infra/environments/production test
terraform -chdir=infra/bootstrap/state init -backend=false
terraform -chdir=infra/bootstrap/state validate
```

Mock tests validate planned isolation and retention rules without Azure credentials or billable resources. They cannot prove Azure API acceptance, quotas, RBAC, DNS or restore success.

## References

- [AzureRM PostgreSQL schema](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/postgresql_flexible_server)
- [PostgreSQL backup and restore](https://learn.microsoft.com/en-us/azure/postgresql/backup-restore/concepts-backup-restore)
- [PostgreSQL high availability](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-high-availability)
- [Service Bus network security](https://learn.microsoft.com/en-us/azure/service-bus-messaging/network-security)
- [Terraform provider mocking](https://developer.hashicorp.com/terraform/language/tests/mocking)
