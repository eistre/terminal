output "host" {
  description = "MySQL server hostname"
  value       = azurerm_mysql_flexible_server.main.fqdn
}

output "connection_string" {
  description = "MySQL connection string for the application"
  value       = "mysql://${var.admin_username}:${var.admin_password}@${azurerm_mysql_flexible_server.main.fqdn}:3306/${var.database_name}"
  sensitive   = true
}

output "server_name" {
  description = "MySQL server name"
  value       = azurerm_mysql_flexible_server.main.name
}
