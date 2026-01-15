# ==============================================================================
# Required Variables
# ==============================================================================

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
}

variable "admin_email" {
  description = "Email address for the admin user"
  type        = string
}

variable "admin_password" {
  description = "Password for the admin user"
  type        = string
  sensitive   = true
}

variable "auth_secret" {
  description = "Secret key for authentication (minimum 32 characters)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.auth_secret) >= 32
    error_message = "auth_secret must be at least 32 characters long"
  }
}

variable "mysql_admin_password" {
  description = "Password for MySQL admin user"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.mysql_admin_password) >= 8
    error_message = "mysql_admin_password must be at least 8 characters long"
  }
}

variable "ghcr_username" {
  description = "GitHub username for pulling container images from ghcr.io"
  type        = string
}

variable "ghcr_token" {
  description = "GitHub Personal Access Token with read:packages scope"
  type        = string
  sensitive   = true
}

# ==============================================================================
# Optional Variables
# ==============================================================================

variable "resource_prefix" {
  description = "Prefix for all resource names (lowercase, alphanumeric)"
  type        = string
  default     = "terminal"

  validation {
    condition     = can(regex("^[a-z][a-z0-9]{2,12}$", var.resource_prefix))
    error_message = "resource_prefix must be 3-13 lowercase alphanumeric characters, starting with a letter"
  }
}

variable "container_image_registry" {
  description = "Container image registry"
  type        = string
  default     = "ghcr.io"
}

variable "container_image_owner" {
  description = "Container image owner/organization"
  type        = string
  default     = "eistre"
}

variable "container_image_tag" {
  description = "Tag for container images"
  type        = string
  default     = "latest"
}

variable "mysql_sku" {
  description = "SKU for MySQL Flexible Server (e.g., B_Standard_B1ms for cheapest)"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "info"

  validation {
    condition     = contains(["error", "warn", "info", "debug", "trace"], var.log_level)
    error_message = "log_level must be one of: error, warn, info, debug, trace"
  }
}

variable "container_expiry_minutes" {
  description = "Minutes until terminal containers expire"
  type        = number
  default     = 30
}

variable "user_expiry_days" {
  description = "Days until inactive users are deleted"
  type        = number
  default     = 90
}

variable "aci_cpu" {
  description = "CPU cores for terminal containers (0.1 increments)"
  type        = number
  default     = 0.1
}

variable "aci_memory_gb" {
  description = "Memory in GB for terminal containers (0.1 increments)"
  type        = number
  default     = 0.1
}
