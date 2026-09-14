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
    condition     = output.foundation.environment_policy.database_backup_days == 7
    error_message = "Database recovery retention changed."
  }
  assert {
    condition     = output.foundation.environment_policy.private_database && output.foundation.environment_policy.private_objects
    error_message = "Data services must deny public access."
  }
  assert {
    condition     = output.foundation.environment_policy.service_bus_enabled == false && output.foundation.environment_policy.key_vault_enabled == false && output.foundation.environment_policy.deletion_lock == false
    error_message = "POC/production isolation policy changed."
  }
  assert {
    condition     = !output.foundation.environment_policy.workloads_deployed
    error_message = "Foundation must not deploy placeholder workloads."
  }

  assert {
    condition     = output.foundation.environment_policy.environment == "poc" && output.foundation.environment_policy.vnet_cidr == "10.60.0.0/16" && output.foundation.resource_group_name == "rg-timur-poc-test1"
    error_message = "Environment name or network isolation changed."
  }
  assert {
    condition     = output.foundation.environment_policy.database_entra_auth && !output.foundation.environment_policy.database_password_auth && !output.foundation.environment_policy.cross_region_backup
    error_message = "Database authentication or Singapore backup residency policy changed."
  }
  assert {
    condition     = !output.foundation.environment_policy.objects_shared_keys && output.foundation.environment_policy.objects_versioned && output.foundation.environment_policy.objects_retention_days == 7
    error_message = "Object authentication or recoverability policy changed."
  }
  assert {
    condition     = output.foundation.environment_policy.private_compute && output.foundation.environment_policy.compute_zone_redundancy == false && output.foundation.environment_policy.database_zone_ha == false && output.foundation.environment_policy.private_endpoint_count == 1
    error_message = "Private networking or zone availability policy changed."
  }
  assert {
    condition     = output.foundation.environment_policy.ai_mode == "synthetic"
    error_message = "POC AI mode must remain synthetic."
  }
}
