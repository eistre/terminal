# Required variables
variable "admin_email" {
  description = "Initial admin email"
  type        = string
}

variable "admin_password" {
  description = "Initial admin password"
  type        = string
  sensitive   = true
}

variable "auth_secret" {
  description = "Auth secret (32+ chars)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.auth_secret) >= 32
    error_message = "auth_secret must be at least 32 characters long"
  }
}

variable "mysql_admin_password" {
  description = "MySQL admin password"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.mysql_admin_password) >= 8
    error_message = "mysql_admin_password must be at least 8 characters long"
  }
}

variable "mailer_sender" {
  description = "Email sender address for SES"
  type        = string
}

# Optional variables
variable "resource_prefix" {
  description = "Resource name prefix"
  type        = string
  default     = "terminal"
}

variable "app_registry_description" {
  description = "Description for the AppRegistry application (MyApplications)"
  type        = string
  default     = "Terminal application"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-north-1"
}

variable "logger_level" {
  description = "Logger level for all services"
  type        = string
  default     = "info"
}

variable "user_expiry_days" {
  description = "Days until inactive users are deleted"
  type        = number
  default     = 90
}

variable "mailer_ses_region" {
  description = "SES region"
  type        = string
  default     = "eu-north-1"
}

variable "image_registry" {
  description = "Container image registry"
  type        = string
  default     = "ghcr.io"
}

variable "image_owner" {
  description = "Container image owner/organization"
  type        = string
  default     = "eistre"
}

variable "image_tag" {
  description = "Tag for container images"
  type        = string
  default     = "latest"
}

variable "lightsail_power" {
  description = "Lightsail container service power (nano/micro/small/etc.)"
  type        = string
  default     = "nano"
}

variable "lightsail_scale" {
  description = "Lightsail container service scale (number of nodes)"
  type        = number
  default     = 1
}

variable "db_blueprint_id" {
  description = "Lightsail DB blueprint ID"
  type        = string
  default     = "mysql_8_4"
}

variable "db_bundle_id" {
  description = "Lightsail DB bundle ID"
  type        = string
  default     = "micro_2_0"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "terminal"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "terminal"
}

variable "db_public" {
  description = "Whether the Lightsail DB is publicly accessible (public endpoint)"
  type        = bool
  default     = false
}

variable "session_task_cpu" {
  description = "ECS task CPU units for session containers (e.g. 256)"
  type        = string
  default     = "256"
}

variable "session_task_memory" {
  description = "ECS task memory in MiB for session containers (e.g. 512)"
  type        = string
  default     = "512"
}

variable "session_cpu_architecture" {
  description = "CPU architecture for ECS tasks (X86_64 or ARM64)"
  type        = string
  default     = "X86_64"

  validation {
    condition     = contains(["X86_64", "ARM64"], var.session_cpu_architecture)
    error_message = "session_cpu_architecture must be X86_64 or ARM64"
  }
}

variable "provisioner_container_expiry_minutes" {
  description = "Minutes until terminal containers expire"
  type        = number
  default     = 30
}
