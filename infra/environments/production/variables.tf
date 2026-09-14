variable "subscription_id" { type = string }
variable "tenant_id" { type = string }
variable "name_suffix" { type = string }
variable "database_admin_object_id" {
  type        = string
  description = "Object ID of an existing Entra operator group for this environment."
}
variable "database_admin_principal_name" { type = string }
variable "location" {
  type    = string
  default = "southeastasia"
}
variable "tags" {
  type    = map(string)
  default = {}
}
