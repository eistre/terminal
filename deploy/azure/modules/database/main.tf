# Azure MySQL Flexible Server
resource "azurerm_mysql_flexible_server" "main" {
  name                   = "${var.name_prefix}-mysql-${var.random_suffix}"
  resource_group_name    = var.resource_group_name
  location               = var.location
  administrator_login    = var.admin_username
  administrator_password = var.admin_password
  backup_retention_days  = var.backup_retention_days
  sku_name               = var.sku_name
  version                = var.mysql_version

  storage {
    iops              = 360
    size_gb           = 20
    auto_grow_enabled = var.enable_auto_grow
  }

  tags = merge(var.tags, { component = "database" })
}

# Database
resource "azurerm_mysql_flexible_database" "main" {
  name                = var.database_name
  resource_group_name = var.resource_group_name
  server_name         = azurerm_mysql_flexible_server.main.name
  charset             = "utf8mb3"
  collation           = "utf8mb3_unicode_ci"
}

# Firewall rule to allow Azure services
resource "azurerm_mysql_flexible_server_firewall_rule" "allow_azure" {
  name                = "AllowAzureServices"
  resource_group_name = var.resource_group_name
  server_name         = azurerm_mysql_flexible_server.main.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "0.0.0.0"
}
