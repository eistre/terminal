# Azure Key Vault for SSH key storage
resource "azurerm_key_vault" "main" {
  name                = "${var.name_prefix}-kv-${var.random_suffix}"
  resource_group_name = var.resource_group_name
  location            = var.location
  tenant_id           = var.tenant_id

  sku_name = "standard"

  # Soft delete settings - minimum retention for cost efficiency
  soft_delete_retention_days = 7
  purge_protection_enabled   = false

  # Use RBAC for access control (recommended over access policies)
  rbac_authorization_enabled = true

  tags = merge(var.tags, { component = "keyvault" })
}

# Grant the managed identity "Key Vault Secrets Officer" role
# This allows set, get, delete operations on secrets
resource "azurerm_role_assignment" "secrets_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = var.principal_id
}
