variable "resource_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "session_container_image" {
  description = "Session container image used by the AWS provisioner"
  type        = string
}

variable "session_task_cpu" {
  description = "ECS task CPU units for session containers (e.g. 256)"
  type        = string
}

variable "session_task_memory" {
  description = "ECS task memory in MiB for session containers (e.g. 512)"
  type        = string
}

variable "session_cpu_architecture" {
  description = "CPU architecture for ECS tasks (X86_64 or ARM64)"
  type        = string
}

variable "execution_role_arn" {
  description = "ECS task execution role ARN"
  type        = string
}

variable "provisioner_task_role_arn" {
  description = "Task role ARN for provisioner cleanup jobs"
  type        = string
}

variable "session_subnet_ids" {
  description = "Subnet IDs for session tasks and cleanup jobs"
  type        = list(string)
}

variable "session_security_group_ids" {
  description = "Security group IDs for session tasks and cleanup jobs"
  type        = list(string)
}

variable "database_url" {
  description = "Database URL used by cleanup jobs"
  type        = string
}

variable "logger_level" {
  description = "Logger level for cleanup jobs"
  type        = string
}

variable "database_cleanup_image" {
  description = "Database cleanup job image"
  type        = string
}

variable "provisioner_cleanup_image" {
  description = "Provisioner cleanup job image"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
