terraform {
  required_version = ">= 1.7, < 2.0"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 4.0" }
  }
}
provider "azurerm" {
  features {}
  subscription_id     = var.subscription_id
  storage_use_azuread = true
}
variable "subscription_id" { type = string }
variable "environment" {
  type = string
  validation {
    condition     = contains(["poc", "production"], var.environment)
    error_message = "Choose poc or production."
  }
}
variable "storage_account_name" { type = string }
variable "state_operator_object_id" {
  type        = string
  description = "Existing Entra group or deployment identity permitted to access state."
}
variable "operator_public_ip_cidrs" {
  type        = list(string)
  description = "Explicit permitted fixed public IPv4 addresses/CIDRs; use a controlled runner."
  validation {
    condition     = length(var.operator_public_ip_cidrs) > 0 && !contains(var.operator_public_ip_cidrs, "0.0.0.0/0")
    error_message = "State requires an explicit IP allowlist, never all internet."
  }
}
variable "location" {
  type    = string
  default = "southeastasia"
}
resource "azurerm_resource_group" "state" {
  name     = "rg-timur-${var.environment}-state"
  location = var.location
}
resource "azurerm_storage_account" "state" {
  name                            = var.storage_account_name
  resource_group_name             = azurerm_resource_group.state.name
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = "ZRS"
  min_tls_version                 = "TLS1_2"
  shared_access_key_enabled       = false
  allow_nested_items_to_be_public = false
  blob_properties {
    versioning_enabled = true
    delete_retention_policy { days = 35 }
    container_delete_retention_policy { days = 35 }
  }
  network_rules {
    default_action = "Deny"
    bypass         = ["None"]
    ip_rules       = var.operator_public_ip_cidrs
  }
  lifecycle { prevent_destroy = true }
}
resource "azurerm_storage_container" "state" {
  name                  = "tfstate"
  storage_account_id    = azurerm_storage_account.state.id
  container_access_type = "private"
}
resource "azurerm_role_assignment" "state" {
  scope                = azurerm_storage_account.state.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = var.state_operator_object_id
}
resource "azurerm_management_lock" "state" {
  name       = "protect-state"
  scope      = azurerm_resource_group.state.id
  lock_level = "CanNotDelete"
}
output "backend" {
  value = {
    resource_group_name  = azurerm_resource_group.state.name
    storage_account_name = azurerm_storage_account.state.name
    container_name       = azurerm_storage_container.state.name
    key                  = "timur/${var.environment}/terraform.tfstate"
    use_azuread_auth     = true
  }
}
