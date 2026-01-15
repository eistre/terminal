# Azure MySQL Flexible Server
resource "azurerm_mysql_flexible_server" "main" {
  name                = "${var.name_prefix}-mysql-${var.random_suffix}"
  resource_group_name = var.resource_group_name
  location            = var.location

  administrator_login    = var.admin_username
  administrator_password = var.admin_password

  sku_name = var.sku_name
  version  = "8.0.21"

  # Cheapest storage option
  storage {
    size_gb           = 20
    auto_grow_enabled = false
  }

  # Disable backups for cost savings (thesis/demo environment)
  backup_retention_days = 1

  # Allow Azure services to connect
  # This is needed for Container Apps to connect
  zone = null

  tags = merge(var.tags, { component = "database" })
}

# Database
resource "azurerm_mysql_flexible_database" "main" {
  name                = var.database_name
  resource_group_name = var.resource_group_name
  server_name         = azurerm_mysql_flexible_server.main.name
  charset             = "utf8mb4"
  collation           = "utf8mb4_unicode_ci"
}

# Firewall rule to allow Azure services
resource "azurerm_mysql_flexible_server_firewall_rule" "allow_azure" {
  name                = "AllowAzureServices"
  resource_group_name = var.resource_group_name
  server_name         = azurerm_mysql_flexible_server.main.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "0.0.0.0"
}
