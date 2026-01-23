output "host" {
  description = "MySQL server hostname"
  value       = aws_lightsail_database.main.master_endpoint_address
}

output "connection_string" {
  description = "MySQL connection string for the application"
  value       = "mysql://${var.admin_username}:${var.admin_password}@${aws_lightsail_database.main.master_endpoint_address}:${aws_lightsail_database.main.master_endpoint_port}/${var.database_name}"
  sensitive   = true
}

output "server_name" {
  description = "MySQL server name"
  value       = aws_lightsail_database.main.relational_database_name
}
