# Azure Key Vault for SSH key storage
resource "azurerm_key_vault" "main" {
  name                       = "${var.name_prefix}-keyvault"
  resource_group_name        = var.resource_group_name
  location                   = var.location
  tenant_id                  = var.tenant_id
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  rbac_authorization_enabled = true
  sku_name                   = "standard"

  # Keep public access on to avoid private endpoint cost; rely on ACLs below.
  public_network_access_enabled = true
  network_acls {
    bypass         = "AzureServices"
    default_action = "Allow"
  }

  tags = merge(var.tags, { component = "keyvault" })
}

# This allows managed identity set, get, delete operations on secrets
resource "azurerm_role_assignment" "secrets_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = var.principal_id
}
