# Local variables
locals {
  # Common tags applied to all resources (mirrors Azure provisioner pattern)
  common_tags = {
    app        = var.resource_prefix
    managed-by = "terraform"
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.resource_prefix}-rg-${random_string.suffix.result}"
  location = var.location

  tags = local.common_tags
}

# Random suffix for globally unique names
resource "random_string" "suffix" {
  length  = 6
  lower   = true
  upper   = false
  numeric = true
  special = false
}

data "azurerm_client_config" "current" {}

# Managed Identity (shared by Container Apps for Azure resource access)
resource "azurerm_user_assigned_identity" "main" {
  name                = "${var.resource_prefix}-identity-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  tags = local.common_tags
}

# Grant Contributor role on resource group for ACI provisioning
resource "azurerm_role_assignment" "contributor" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}

# Database module - MySQL Flexible Server
module "database" {
  source = "./modules/database"

  name_prefix         = var.resource_prefix
  random_suffix       = random_string.suffix.result
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  admin_username = "terminal"
  admin_password = var.mysql_admin_password
  database_name  = "terminal"
  sku_name       = var.mysql_sku
  mysql_version  = var.mysql_version

  backup_retention_days = var.mysql_backup_retention_days
  enable_auto_grow      = var.mysql_enable_auto_grow

  tags = local.common_tags
}

# Communication module - Azure Communication Services for email
module "communication" {
  source = "./modules/communication"

  name_prefix         = var.resource_prefix
  random_suffix       = random_string.suffix.result
  resource_group_name = azurerm_resource_group.main.name
  data_location       = var.communication_data_location

  tags = local.common_tags
}

# Key Vault module - for SSH key storage
module "keyvault" {
  source = "./modules/keyvault"

  name_prefix         = var.resource_prefix
  random_suffix       = random_string.suffix.result
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  tenant_id    = data.azurerm_client_config.current.tenant_id
  principal_id = azurerm_user_assigned_identity.main.principal_id

  tags = local.common_tags
}

# Container Apps module - ACA environment, web app, and jobs
module "container_apps" {
  source = "./modules/container-apps"

  name_prefix         = var.resource_prefix
  random_suffix       = random_string.suffix.result
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  # Managed identity
  managed_identity_id        = azurerm_user_assigned_identity.main.id
  managed_identity_client_id = azurerm_user_assigned_identity.main.client_id

  # Container images
  image_registry = var.container_image_registry
  image_owner    = var.container_image_owner
  image_tag      = var.container_image_tag
  ghcr_username  = var.ghcr_username
  ghcr_token     = var.ghcr_token

  # Database connection
  database_url = module.database.connection_string

  # Email configuration
  mailer_connection_string = module.communication.connection_string
  mailer_sender            = module.communication.sender_address

  # Auth configuration
  auth_secret    = var.auth_secret
  admin_email    = var.admin_email
  admin_password = var.admin_password

  # Provisioner configuration
  subscription_id          = data.azurerm_client_config.current.subscription_id
  keyvault_url             = module.keyvault.vault_url
  container_expiry_minutes = var.container_expiry_minutes
  aci_cpu                  = var.aci_cpu
  aci_memory_gb            = var.aci_memory_gb

  # General configuration
  logger_level     = var.logger_level
  user_expiry_days = var.user_expiry_days

  tags = local.common_tags
}
