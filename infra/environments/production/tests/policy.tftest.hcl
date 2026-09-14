mock_provider "azurerm" {}
variables {
  subscription_id               = "00000000-0000-0000-0000-000000000001"
  tenant_id                     = "00000000-0000-0000-0000-000000000002"
  database_admin_object_id      = "00000000-0000-0000-0000-000000000003"
  database_admin_principal_name = "test-database-operators"
  name_suffix                   = "test1"
}
run "environment_policy" {
  command = plan
  assert {
    condition     = output.foundation.environment_policy.database_backup_days == 35
    error_message = "Database recovery retention changed."
  }
  assert {
    condition     = output.foundation.environment_policy.private_database && output.foundation.environment_policy.private_objects
    error_message = "Data services must deny public access."
  }
  assert {
    condition     = output.foundation.environment_policy.service_bus_enabled == true && output.foundation.environment_policy.key_vault_enabled == true && output.foundation.environment_policy.deletion_lock == true
    error_message = "POC/production isolation policy changed."
  }
  assert {
    condition     = !output.foundation.environment_policy.workloads_deployed
    error_message = "Foundation must not deploy placeholder workloads."
  }

  assert {
    condition     = output.foundation.environment_policy.environment == "production" && output.foundation.environment_policy.vnet_cidr == "10.70.0.0/16" && output.foundation.resource_group_name == "rg-timur-production-test1"
    error_message = "Environment name or network isolation changed."
  }
  assert {
    condition     = output.foundation.environment_policy.database_entra_auth && !output.foundation.environment_policy.database_password_auth && !output.foundation.environment_policy.cross_region_backup
    error_message = "Database authentication or Singapore backup residency policy changed."
  }
  assert {
    condition     = !output.foundation.environment_policy.objects_shared_keys && output.foundation.environment_policy.objects_versioned && output.foundation.environment_policy.objects_retention_days == 35
    error_message = "Object authentication or recoverability policy changed."
  }
  assert {
    condition     = output.foundation.environment_policy.private_compute && output.foundation.environment_policy.compute_zone_redundancy == true && output.foundation.environment_policy.database_zone_ha == true && output.foundation.environment_policy.private_endpoint_count == 3
    error_message = "Private networking or zone availability policy changed."
  }
  assert {
    condition     = output.foundation.environment_policy.private_vault && output.foundation.environment_policy.vault_purge_protected && output.foundation.environment_policy.vault_rbac && output.foundation.environment_policy.private_bus && !output.foundation.environment_policy.bus_local_auth
    error_message = "Production secrets or queue authentication/isolation changed."
  }
}
