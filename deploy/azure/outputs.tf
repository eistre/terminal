output "web_url" {
  description = "URL of the web application"
  value       = module.container_apps.web_url
}

output "mysql_host" {
  description = "MySQL server hostname"
  value       = module.database.host
}

output "keyvault_url" {
  description = "Azure Key Vault URL"
  value       = module.keyvault.vault_url
}

output "email_sender" {
  description = "Email sender address for Azure Communication Services"
  value       = module.communication.sender_address
}

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}
