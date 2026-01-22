# Lightsail MySQL Database
resource "aws_lightsail_database" "main" {
  relational_database_name = "${var.name_prefix}-mysql"
  master_database_name     = var.database_name
  master_username          = var.admin_username
  master_password          = var.admin_password
  blueprint_id             = var.blueprint_id
  bundle_id                = var.bundle_id
  publicly_accessible      = var.publicly_accessible
  skip_final_snapshot      = true
  apply_immediately        = true
  tags                     = merge(var.tags, { component = "database" })
}
