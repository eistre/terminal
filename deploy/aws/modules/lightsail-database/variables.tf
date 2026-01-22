variable "region" {
  description = "AWS region"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
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

variable "blueprint_id" {
  description = "Lightsail DB blueprint ID"
  type        = string
  default     = "mysql_8_4"
}

variable "bundle_id" {
  description = "Lightsail DB bundle ID"
  type        = string
  default     = "micro_2_0"
}

variable "publicly_accessible" {
  description = "Whether the database is publicly accessible (public endpoint)"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
