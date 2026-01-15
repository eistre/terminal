# Azure Communication Services
resource "azurerm_communication_service" "main" {
  name                = "${var.name_prefix}-comm-${var.random_suffix}"
  resource_group_name = var.resource_group_name
  data_location       = "Europe"

  tags = merge(var.tags, { component = "email" })
}

# Email Communication Service
resource "azurerm_email_communication_service" "main" {
  name                = "${var.name_prefix}-email-${var.random_suffix}"
  resource_group_name = var.resource_group_name
  data_location       = "Europe"

  tags = merge(var.tags, { component = "email" })
}

# Azure-managed email domain (no custom domain setup needed)
resource "azurerm_email_communication_service_domain" "main" {
  name             = "AzureManagedDomain"
  email_service_id = azurerm_email_communication_service.main.id

  domain_management = "AzureManaged"
}

# Link the email domain to the communication service
resource "azurerm_communication_service_email_domain_association" "main" {
  communication_service_id = azurerm_communication_service.main.id
  email_service_domain_id  = azurerm_email_communication_service_domain.main.id
}
