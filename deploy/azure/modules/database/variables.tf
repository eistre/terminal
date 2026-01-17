variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "random_suffix" {
  description = "Random suffix for globally unique names"
  type        = string
}

variable "admin_username" {
  description = "MySQL admin username"
  type        = string
  default     = "terminal"
}

variable "admin_password" {
  description = "MySQL admin password"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "Name of the database to create"
  type        = string
}

variable "backup_retention_days" {
  description = "Backup retention in days"
  type        = number
  default     = 7
}

variable "enable_auto_grow" {
  description = "Enable storage auto-grow to prevent out-of-space errors"
  type        = bool
  default     = true
}

variable "sku_name" {
  description = "SKU name for MySQL Flexible Server"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
