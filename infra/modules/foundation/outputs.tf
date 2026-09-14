output "resource_group_name" { value = azurerm_resource_group.main.name }
output "postgresql_fqdn" { value = azurerm_postgresql_flexible_server.main.fqdn }
output "storage_account_name" { value = azurerm_storage_account.objects.name }
output "container_app_environment_id" { value = azurerm_container_app_environment.main.id }
output "workload_identities" {
  value = { for name, identity in azurerm_user_assigned_identity.workload : name => {
    id = identity.id, client_id = identity.client_id, principal_id = identity.principal_id
  } }
}
output "environment_policy" {
  value = {
    environment             = var.environment
    database_backup_days    = azurerm_postgresql_flexible_server.main.backup_retention_days
    private_database        = !azurerm_postgresql_flexible_server.main.public_network_access_enabled
    private_objects         = !azurerm_storage_account.objects.public_network_access_enabled
    service_bus_enabled     = length(azurerm_servicebus_namespace.main) == 1
    key_vault_enabled       = length(azurerm_key_vault.main) == 1
    deletion_lock           = length(azurerm_management_lock.production) == 1
    ai_mode                 = local.production ? "unconfigured" : "synthetic"
    workloads_deployed      = false
    vnet_cidr               = one(azurerm_virtual_network.main.address_space)
    database_password_auth  = azurerm_postgresql_flexible_server.main.authentication[0].password_auth_enabled
    database_entra_auth     = azurerm_postgresql_flexible_server.main.authentication[0].active_directory_auth_enabled
    database_zone_ha        = try(azurerm_postgresql_flexible_server.main.high_availability[0].mode == "ZoneRedundant", false)
    cross_region_backup     = azurerm_postgresql_flexible_server.main.geo_redundant_backup_enabled
    objects_shared_keys     = azurerm_storage_account.objects.shared_access_key_enabled
    objects_versioned       = azurerm_storage_account.objects.blob_properties[0].versioning_enabled
    objects_retention_days  = azurerm_storage_account.objects.blob_properties[0].delete_retention_policy[0].days
    private_compute         = azurerm_container_app_environment.main.internal_load_balancer_enabled
    compute_zone_redundancy = azurerm_container_app_environment.main.zone_redundancy_enabled
    private_vault           = try(!azurerm_key_vault.main[0].public_network_access_enabled, null)
    vault_purge_protected   = try(azurerm_key_vault.main[0].purge_protection_enabled, null)
    vault_rbac              = try(azurerm_key_vault.main[0].rbac_authorization_enabled, null)
    private_bus             = try(!azurerm_servicebus_namespace.main[0].public_network_access_enabled, null)
    bus_local_auth          = try(azurerm_servicebus_namespace.main[0].local_auth_enabled, null)
    private_endpoint_count  = length(azurerm_private_endpoint.services)
  }
}
output "monitoring" {
  value = {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
    application_insights_id    = azurerm_application_insights.main.id
    database_resource_id       = azurerm_postgresql_flexible_server.main.id
    service_bus_namespace_id   = try(azurerm_servicebus_namespace.main[0].id, null)
    alert_routing_configured   = false
  }
}
