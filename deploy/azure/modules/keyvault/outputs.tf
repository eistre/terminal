output "vault_url" {
  description = "Key Vault URL"
  value       = azurerm_key_vault.main.vault_uri
}

output "vault_id" {
  description = "Key Vault resource ID"
  value       = azurerm_key_vault.main.id
}

output "vault_name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.main.name
}
