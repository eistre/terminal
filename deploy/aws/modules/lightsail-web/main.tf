# AWS region from provider configuration
data "aws_region" "current" {}

# Local values for container image paths
locals {
  web_image                   = "${var.image_registry}/${var.image_owner}/terminal-web:${var.image_tag}"
  provisioner_container_image = "${var.image_registry}/${var.image_owner}/terminal-container:${var.image_tag}"

  # Local values for environment variables
  web_environment = {
    # General environment variables
    NODE_ENV     = "production"
    LOGGER_LEVEL = var.logger_level

    # Database
    DATABASE_URL         = var.database_url
    DATABASE_SSL_ENABLED = "true"

    # Auth
    AUTH_SECRET           = var.auth_secret
    AUTH_USER_EXPIRY_DAYS = var.user_expiry_days
    AUTH_ADMIN_EMAIL      = var.admin_email
    AUTH_ADMIN_PASSWORD   = var.admin_password

    # Mailer
    MAILER_TYPE       = "aws"
    MAILER_SENDER     = var.mailer_sender
    MAILER_SES_REGION = var.mailer_ses_region

    # Provisioner
    PROVISIONER_TYPE                     = "aws"
    PROVISIONER_APP_NAME                 = var.name_prefix
    PROVISIONER_CONTAINER_IMAGE          = local.provisioner_container_image
    PROVISIONER_CONTAINER_EXPIRY_MINUTES = var.provisioner_container_expiry_minutes
    PROVISIONER_AWS_REGION               = data.aws_region.current.name
    PROVISIONER_AWS_ECS_CLUSTER          = var.ecs_cluster_name
    PROVISIONER_AWS_TASK_FAMILY          = var.session_task_family
    PROVISIONER_AWS_SUBNETS              = join(",", var.subnet_ids)
    PROVISIONER_AWS_SECURITY_GROUPS      = join(",", var.security_group_ids)
    PROVISIONER_AWS_USE_PUBLIC_IP        = "true"

    # AWS SDK
    AWS_ACCESS_KEY_ID     = var.aws_access_key_id
    AWS_SECRET_ACCESS_KEY = var.aws_secret_access_key
    AWS_DEFAULT_REGION    = data.aws_region.current.name
  }
}

# Lightsail Container Service
resource "aws_lightsail_container_service" "web" {
  name        = "${var.name_prefix}-web"
  power       = var.power
  scale       = var.scale
  is_disabled = false
  tags        = merge(var.tags, { component = "web", version = var.image_tag })
}

# Lightsail Container Service Deployment
resource "aws_lightsail_container_service_deployment_version" "web" {
  service_name = aws_lightsail_container_service.web.name

  container {
    container_name = "web"
    image          = local.web_image
    environment    = local.web_environment
    ports = {
      3000 = "HTTP"
    }
  }

  public_endpoint {
    container_name = "web"
    container_port = 3000

    health_check {
      healthy_threshold   = 2
      unhealthy_threshold = 2
      timeout_seconds     = 5
      interval_seconds    = 15
      path                = "/"
      success_codes       = "200-499"
    }
  }
}
