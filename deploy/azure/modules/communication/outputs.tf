output "connection_string" {
  description = "Azure Communication Services connection string"
  value       = azurerm_communication_service.main.primary_connection_string
  sensitive   = true
}

output "sender_address" {
  description = "Email sender address (Azure-managed domain)"
  value       = "DoNotReply@${azurerm_email_communication_service_domain.main.from_sender_domain}"
}

output "service_name" {
  description = "Communication service name"
  value       = azurerm_communication_service.main.name
}
