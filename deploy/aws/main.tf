# RDS CA bundle for Lightsail MySQL
data "http" "rds_ca_bundle" {
  url = "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem"
}

# Local variables
locals {
  # Common tags applied to all resources
  common_tags = {
    app        = var.resource_prefix
    managed-by = "terraform"
  }

  # Register other resources with the Application Registry
  app_tags = merge(local.common_tags, aws_servicecatalogappregistry_application.main.application_tag)

  # MySQL CA bundle (base64)
  mysql_ssl_ca_base64 = base64encode(data.http.rds_ca_bundle.response_body)
}

# AppRegistry application
resource "aws_servicecatalogappregistry_application" "main" {
  name        = "${var.resource_prefix}-app"
  description = var.app_registry_description
  tags        = local.common_tags
}

# Networking module
module "networking" {
  source      = "./modules/networking"
  name_prefix = var.resource_prefix
  tags        = local.app_tags
}

# IAM module
module "iam" {
  source          = "./modules/iam"
  resource_prefix = var.resource_prefix
  tags            = local.app_tags
}

# Lightsail database module
module "lightsail_database" {
  source              = "./modules/lightsail-database"
  name_prefix         = var.resource_prefix
  database_name       = var.mysql_database_name
  admin_username      = var.mysql_admin_username
  admin_password      = var.mysql_admin_password
  blueprint_id        = var.mysql_blueprint_id
  bundle_id           = var.mysql_bundle_id
  publicly_accessible = var.mysql_publicly_accessible
  tags                = local.app_tags
}

# ECS module
module "ecs" {
  source                     = "./modules/ecs"
  resource_prefix            = var.resource_prefix
  image_registry             = var.image_registry
  image_owner                = var.image_owner
  image_tag                  = var.image_tag
  session_task_cpu           = var.session_task_cpu
  session_task_memory        = var.session_task_memory
  session_cpu_architecture   = var.session_cpu_architecture
  execution_role_arn         = module.iam.ecs_execution_role_arn
  provisioner_task_role_arn  = module.iam.provisioner_task_role_arn
  session_subnet_ids         = module.networking.subnet_ids
  session_security_group_ids = module.networking.security_group_ids
  database_url               = module.lightsail_database.connection_string
  logger_level               = var.logger_level
  mysql_ssl_ca_base64        = local.mysql_ssl_ca_base64
  tags                       = local.app_tags
}

# Lightsail web module
module "lightsail_web" {
  source                               = "./modules/lightsail-web"
  name_prefix                          = var.resource_prefix
  power                                = var.lightsail_power
  scale                                = var.lightsail_scale
  image_registry                       = var.image_registry
  image_owner                          = var.image_owner
  image_tag                            = var.image_tag
  database_url                         = module.lightsail_database.connection_string
  auth_secret                          = var.auth_secret
  admin_email                          = var.admin_email
  admin_password                       = var.admin_password
  mailer_sender                        = var.mailer_sender
  mailer_ses_region                    = var.mailer_ses_region
  logger_level                         = var.logger_level
  user_expiry_days                     = var.user_expiry_days
  mysql_ssl_ca_base64                  = local.mysql_ssl_ca_base64
  provisioner_container_expiry_minutes = var.provisioner_container_expiry_minutes
  ecs_cluster_name                     = module.ecs.cluster_name
  session_task_family                  = module.ecs.session_task_family
  subnet_ids                           = module.networking.subnet_ids
  security_group_ids                   = module.networking.security_group_ids
  aws_access_key_id                    = module.iam.web_access_key_id
  aws_secret_access_key                = module.iam.web_secret_access_key
  tags                                 = local.app_tags
}
