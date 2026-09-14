variable "environment" {
  type = string
  validation {
    condition     = contains(["poc", "production"], var.environment)
    error_message = "Environment must be poc or production."
  }
}
variable "name_suffix" {
  type        = string
  description = "Globally unique lowercase alphanumeric suffix, 3-5 characters."
  validation {
    condition     = can(regex("^[a-z0-9]{3,5}$", var.name_suffix))
    error_message = "Choose a 3-5 character lowercase alphanumeric suffix."
  }
}
variable "location" { type = string }
variable "tenant_id" { type = string }
variable "database_admin_object_id" { type = string }
variable "database_admin_principal_name" { type = string }
variable "vnet_cidr" { type = string }
variable "tags" { type = map(string) }
