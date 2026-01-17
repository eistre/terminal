# Azure Key Vault for SSH key storage
resource "azurerm_key_vault" "main" {
  name                = "${var.name_prefix}-keyvault-${var.random_suffix}"
  resource_group_name = var.resource_group_name
  location            = var.location
  tenant_id           = var.tenant_id

  sku_name                      = "standard"
  public_network_access_enabled = true
  network_acls {
    bypass         = "AzureServices"
    default_action = length(var.allowed_ip_addresses) > 0 ? "Deny" : "Allow"
    ip_rules       = var.allowed_ip_addresses
  }

  # Soft delete settings - minimum retention for cost efficiency
  soft_delete_retention_days = 7
  purge_protection_enabled   = true

  # Use RBAC for access control
  rbac_authorization_enabled = true

  tags = merge(var.tags, { component = "keyvault" })
}

# This allows managed identity set, get, delete operations on secrets
resource "azurerm_role_assignment" "secrets_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = var.principal_id
}
