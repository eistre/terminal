output "web_url" {
  description = "URL of the web application"
  value       = "https://${azurerm_container_app.web.ingress[0].fqdn}"
}

output "environment_id" {
  description = "Container Apps environment ID"
  value       = azurerm_container_app_environment.main.id
}
