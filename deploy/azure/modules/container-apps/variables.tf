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

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}

# Managed identity (passed in from root to avoid circular dependency)
variable "managed_identity_id" {
  description = "ID of the user-assigned managed identity"
  type        = string
}

variable "managed_identity_client_id" {
  description = "Client ID of the user-assigned managed identity"
  type        = string
}

# Container image configuration
variable "image_registry" {
  description = "Container image registry"
  type        = string
}

variable "image_owner" {
  description = "Container image owner/organization"
  type        = string
}

variable "image_tag" {
  description = "Tag for container images"
  type        = string
}

variable "ghcr_username" {
  description = "GitHub username for pulling images"
  type        = string
  default     = ""
}

variable "ghcr_token" {
  description = "GitHub token for pulling images"
  type        = string
  sensitive   = true
  default     = ""
}

# Database configuration
variable "database_url" {
  description = "MySQL connection string"
  type        = string
  sensitive   = true
}

# Email configuration
variable "mailer_connection_string" {
  description = "Azure Communication Services connection string"
  type        = string
  sensitive   = true
}

variable "mailer_sender" {
  description = "Email sender address"
  type        = string
}

# Auth configuration
variable "auth_secret" {
  description = "Authentication secret"
  type        = string
  sensitive   = true
}

variable "admin_email" {
  description = "Admin user email"
  type        = string
}

variable "admin_password" {
  description = "Admin user password"
  type        = string
  sensitive   = true
}

# Provisioner configuration
variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "keyvault_url" {
  description = "Azure Key Vault URL"
  type        = string
}

variable "container_expiry_minutes" {
  description = "Minutes until terminal containers expire"
  type        = number
}

variable "aci_cpu" {
  description = "CPU cores for terminal containers"
  type        = number
}

variable "aci_memory_gb" {
  description = "Memory in GB for terminal containers"
  type        = number
}

# General configuration
variable "logger_level" {
  description = "Application log level"
  type        = string
}

variable "user_expiry_days" {
  description = "Days until inactive users are deleted"
  type        = number
}
