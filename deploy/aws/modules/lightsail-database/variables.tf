variable "region" {
  description = "AWS region (provider configuration)"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for Lightsail database resource name"
  type        = string
}

variable "admin_username" {
  description = "Database admin username"
  type        = string
  default     = "terminal"
}

variable "admin_password" {
  description = "Database admin password"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "Database name"
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
