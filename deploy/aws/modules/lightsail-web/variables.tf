variable "region" {
  description = "AWS region"
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

# Container configuration
variable "power" {
  description = "Lightsail container service power"
  type        = string
}

variable "scale" {
  description = "Lightsail container service scale"
  type        = number
}

# Database configuration
variable "database_url" {
  description = "MySQL connection string"
  type        = string
  sensitive   = true
}

# Email configuration
variable "mailer_sender" {
  description = "Email sender address"
  type        = string
}

variable "mailer_ses_region" {
  description = "SES region"
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
variable "provisioner_container_image" {
  description = "Provisioner container image"
  type        = string
}

variable "provisioner_container_expiry_minutes" {
  description = "Minutes until terminal containers expire"
  type        = number
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "session_task_family" {
  description = "ECS task definition family"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for provisioner tasks"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs for provisioner tasks"
  type        = list(string)
}

# AWS credentials
variable "aws_access_key_id" {
  description = "AWS access key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
  sensitive   = true
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
