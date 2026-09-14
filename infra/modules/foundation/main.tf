terraform {
  required_version = ">= 1.7, < 2.0"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 4.0" }
  }
}

locals {
  production = var.environment == "production"
  prefix     = "timur-${var.environment}-${var.name_suffix}"
  compact    = "timur${var.environment}${var.name_suffix}"
  tags       = merge(var.tags, { project = "timur", environment = var.environment, managed_by = "terraform" })
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.prefix}"
  location = var.location
  tags     = local.tags
}
resource "azurerm_management_lock" "production" {
  count      = local.production ? 1 : 0
  name       = "protect-production"
  scope      = azurerm_resource_group.main.id
  lock_level = "CanNotDelete"
  notes      = "Remove only through an approved destruction or recovery change."
}
resource "azurerm_virtual_network" "main" {
  name                = "vnet-${local.prefix}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = [var.vnet_cidr]
  tags                = local.tags
}
resource "azurerm_subnet" "apps" {
  name                 = "container-apps"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_cidr, 7, 0)]
  delegation {
    name = "container-apps"
    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}
resource "azurerm_subnet" "database" {
  name                 = "postgresql"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_cidr, 8, 2)]
  delegation {
    name = "postgresql"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}
resource "azurerm_subnet" "endpoints" {
  name                 = "private-endpoints"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_cidr, 8, 3)]
}
resource "azurerm_private_dns_zone" "postgres" {
  name                = "${local.prefix}.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}
resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "postgres-vnet"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.main.id
}
resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "psql-${local.prefix}"
  resource_group_name           = azurerm_resource_group.main.name
  location                      = var.location
  version                       = "16"
  sku_name                      = local.production ? "GP_Standard_D2s_v3" : "B_Standard_B1ms"
  storage_mb                    = local.production ? 65536 : 32768
  backup_retention_days         = local.production ? 35 : 7
  geo_redundant_backup_enabled  = false
  public_network_access_enabled = false
  delegated_subnet_id           = azurerm_subnet.database.id
  private_dns_zone_id           = azurerm_private_dns_zone.postgres.id
  zone                          = "1"
  authentication {
    active_directory_auth_enabled = true
    password_auth_enabled         = false
    tenant_id                     = var.tenant_id
  }
  dynamic "high_availability" {
    for_each = local.production ? [1] : []
    content {
      mode                      = "ZoneRedundant"
      standby_availability_zone = "2"
    }
  }
  tags       = local.tags
  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]
  lifecycle {
    ignore_changes = [zone, high_availability[0].standby_availability_zone]
  }
}
resource "azurerm_postgresql_flexible_server_active_directory_administrator" "main" {
  server_name         = azurerm_postgresql_flexible_server.main.name
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = var.tenant_id
  object_id           = var.database_admin_object_id
  principal_name      = var.database_admin_principal_name
  principal_type      = "Group"
}
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "timur"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}
resource "azurerm_storage_account" "objects" {
  name                            = "${local.compact}obj"
  location                        = var.location
  resource_group_name             = azurerm_resource_group.main.name
  account_tier                    = "Standard"
  account_replication_type        = local.production ? "ZRS" : "LRS"
  min_tls_version                 = "TLS1_2"
  shared_access_key_enabled       = false
  public_network_access_enabled   = false
  allow_nested_items_to_be_public = false
  blob_properties {
    versioning_enabled = true
    delete_retention_policy { days = local.production ? 35 : 7 }
    container_delete_retention_policy { days = local.production ? 35 : 7 }
  }
  tags = local.tags
}
resource "azurerm_storage_container" "objects" {
  for_each              = toset(["quarantine", "source", "exports"])
  name                  = each.key
  storage_account_id    = azurerm_storage_account.objects.id
  container_access_type = "private"
}
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${local.prefix}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = local.production ? 90 : 30
  daily_quota_gb      = local.production ? 5 : 1
  tags                = local.tags
}
resource "azurerm_application_insights" "main" {
  name                = "appi-${local.prefix}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = local.tags
}
resource "azurerm_container_app_environment" "main" {
  name                           = "cae-${local.prefix}"
  location                       = var.location
  resource_group_name            = azurerm_resource_group.main.name
  log_analytics_workspace_id     = azurerm_log_analytics_workspace.main.id
  infrastructure_subnet_id       = azurerm_subnet.apps.id
  internal_load_balancer_enabled = true
  zone_redundancy_enabled        = local.production
  workload_profile {
    name                  = "Consumption"
    workload_profile_type = "Consumption"
  }
  tags = local.tags
}
resource "azurerm_user_assigned_identity" "workload" {
  for_each            = toset(["api", "worker"])
  name                = "id-${local.prefix}-${each.key}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}
resource "azurerm_key_vault" "main" {
  count                         = local.production ? 1 : 0
  name                          = "${local.compact}kv"
  location                      = var.location
  resource_group_name           = azurerm_resource_group.main.name
  tenant_id                     = var.tenant_id
  sku_name                      = "standard"
  rbac_authorization_enabled    = true
  soft_delete_retention_days    = 90
  purge_protection_enabled      = true
  public_network_access_enabled = false
  tags                          = local.tags
}
resource "azurerm_servicebus_namespace" "main" {
  count                         = local.production ? 1 : 0
  name                          = "sb-${local.prefix}"
  location                      = var.location
  resource_group_name           = azurerm_resource_group.main.name
  sku                           = "Premium"
  capacity                      = 1
  premium_messaging_partitions  = 1
  local_auth_enabled            = false
  public_network_access_enabled = false
  minimum_tls_version           = "1.2"
  tags                          = local.tags
}
resource "azurerm_servicebus_queue" "jobs" {
  count                                   = local.production ? 1 : 0
  name                                    = "jobs"
  namespace_id                            = azurerm_servicebus_namespace.main[0].id
  requires_duplicate_detection            = true
  duplicate_detection_history_time_window = "PT10M"
  dead_lettering_on_message_expiration    = true
  max_delivery_count                      = 5
  default_message_ttl                     = "P7D"
}
locals {
  private_services = merge({
    blob = { id = azurerm_storage_account.objects.id, zone = "privatelink.blob.core.windows.net", subresource = "blob" }
    }, local.production ? {
    vault = { id = azurerm_key_vault.main[0].id, zone = "privatelink.vaultcore.azure.net", subresource = "vault" }
    bus   = { id = azurerm_servicebus_namespace.main[0].id, zone = "privatelink.servicebus.windows.net", subresource = "namespace" }
  } : {})
}
resource "azurerm_private_dns_zone" "services" {
  for_each            = local.private_services
  name                = each.value.zone
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}
resource "azurerm_private_dns_zone_virtual_network_link" "services" {
  for_each              = local.private_services
  name                  = "${each.key}-vnet"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.services[each.key].name
  virtual_network_id    = azurerm_virtual_network.main.id
}
resource "azurerm_private_endpoint" "services" {
  for_each            = local.private_services
  name                = "pe-${local.prefix}-${each.key}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.endpoints.id
  private_service_connection {
    name                           = each.key
    private_connection_resource_id = each.value.id
    subresource_names              = [each.value.subresource]
    is_manual_connection           = false
  }
  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.services[each.key].id]
  }
  tags = local.tags
}
