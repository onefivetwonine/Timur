terraform {
  required_version = ">= 1.7, < 2.0"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 4.0" }
  }
  backend "azurerm" {}
}
provider "azurerm" {
  features {}
  subscription_id     = var.subscription_id
  tenant_id           = var.tenant_id
  storage_use_azuread = true
}
module "foundation" {
  source                        = "../../modules/foundation"
  environment                   = "poc"
  name_suffix                   = var.name_suffix
  location                      = var.location
  tenant_id                     = var.tenant_id
  database_admin_object_id      = var.database_admin_object_id
  database_admin_principal_name = var.database_admin_principal_name
  vnet_cidr                     = "10.60.0.0/16"
  tags                          = var.tags
}
output "foundation" { value = module.foundation }
