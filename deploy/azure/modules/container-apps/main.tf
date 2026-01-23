# Local values for container image paths
locals {
  web_image                 = "${var.image_registry}/${var.image_owner}/terminal-web:${var.image_tag}"
  database_cleanup_image    = "${var.image_registry}/${var.image_owner}/terminal-database-cleanup:${var.image_tag}"
  provisioner_cleanup_image = "${var.image_registry}/${var.image_owner}/terminal-provisioner-cleanup:${var.image_tag}"
  container_image           = "${var.image_registry}/${var.image_owner}/terminal-container:${var.image_tag}"
}

# Container App Environment
resource "azurerm_container_app_environment" "main" {
  name                = "${var.name_prefix}-env"
  location            = var.location
  resource_group_name = var.resource_group_name

  tags = merge(var.tags, { component = "environment" })
}

# Container App for Web Application
resource "azurerm_container_app" "web" {
  name                         = "${var.name_prefix}-web"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [var.managed_identity_id]
  }

  dynamic "registry" {
    for_each = var.ghcr_username == "" || var.ghcr_token == "" ? [] : [1]
    content {
      server               = var.image_registry
      username             = var.ghcr_username
      password_secret_name = "ghcr-token"
    }
  }

  dynamic "secret" {
    for_each = var.ghcr_username == "" || var.ghcr_token == "" ? [] : [1]
    content {
      name  = "ghcr-token"
      value = var.ghcr_token
    }
  }

  secret {
    name  = "database-url"
    value = var.database_url
  }

  secret {
    name  = "auth-secret"
    value = var.auth_secret
  }

  secret {
    name  = "admin-password"
    value = var.admin_password
  }

  secret {
    name  = "mailer-connection-string"
    value = var.mailer_connection_string
  }

  ingress {
    external_enabled = true
    target_port      = 3000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 0
    max_replicas = 3

    container {
      name   = "web"
      image  = local.web_image
      cpu    = 0.5
      memory = "1Gi"

      # General environment variables
      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "LOGGER_LEVEL"
        value = var.logger_level
      }

      # Database
      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name  = "DATABASE_SSL_ENABLED"
        value = "true"
      }

      # Auth
      env {
        name        = "AUTH_SECRET"
        secret_name = "auth-secret"
      }

      env {
        name  = "AUTH_USER_EXPIRY_DAYS"
        value = var.user_expiry_days
      }

      env {
        name  = "AUTH_ADMIN_EMAIL"
        value = var.admin_email
      }

      env {
        name        = "AUTH_ADMIN_PASSWORD"
        secret_name = "admin-password"
      }

      # Mailer
      env {
        name  = "MAILER_TYPE"
        value = "azure"
      }

      env {
        name        = "MAILER_AZURE_CONNECTION_STRING"
        secret_name = "mailer-connection-string"
      }

      env {
        name  = "MAILER_SENDER"
        value = var.mailer_sender
      }

      # Provisioner
      env {
        name  = "PROVISIONER_TYPE"
        value = "azure"
      }

      env {
        name  = "PROVISIONER_APP_NAME"
        value = var.name_prefix
      }

      env {
        name  = "PROVISIONER_CONTAINER_IMAGE"
        value = local.container_image
      }

      env {
        name  = "PROVISIONER_CONTAINER_EXPIRY_MINUTES"
        value = var.container_expiry_minutes
      }

      env {
        name  = "PROVISIONER_AZURE_SUBSCRIPTION_ID"
        value = var.subscription_id
      }

      env {
        name  = "PROVISIONER_AZURE_RESOURCE_GROUP"
        value = var.resource_group_name
      }

      env {
        name  = "PROVISIONER_AZURE_LOCATION"
        value = var.location
      }

      env {
        name  = "PROVISIONER_AZURE_KEYVAULT_URL"
        value = var.keyvault_url
      }

      env {
        name  = "PROVISIONER_AZURE_CPU"
        value = var.aci_cpu
      }

      env {
        name  = "PROVISIONER_AZURE_MEMORY_GB"
        value = var.aci_memory_gb
      }

      # Managed Identity Client ID for Azure SDK
      env {
        name  = "AZURE_CLIENT_ID"
        value = var.managed_identity_client_id
      }
    }

    http_scale_rule {
      name                = "http-concurrency"
      concurrent_requests = 30
    }
  }

  tags = merge(var.tags, {
    component = "web"
    version   = var.image_tag
  })
}

# Container App Job for Database Cleanup
resource "azurerm_container_app_job" "database_cleanup" {
  name                         = "${var.name_prefix}-database-cleanup"
  resource_group_name          = var.resource_group_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  location                     = var.location

  replica_timeout_in_seconds = 300
  replica_retry_limit        = 2

  schedule_trigger_config {
    cron_expression          = "0 0 * * *" # Daily at midnight
    parallelism              = 1
    replica_completion_count = 1
  }

  dynamic "registry" {
    for_each = var.ghcr_username == "" || var.ghcr_token == "" ? [] : [1]
    content {
      server               = var.image_registry
      username             = var.ghcr_username
      password_secret_name = "ghcr-token"
    }
  }

  dynamic "secret" {
    for_each = var.ghcr_username == "" || var.ghcr_token == "" ? [] : [1]
    content {
      name  = "ghcr-token"
      value = var.ghcr_token
    }
  }

  secret {
    name  = "database-url"
    value = var.database_url
  }

  template {
    container {
      name   = "database-cleanup"
      image  = local.database_cleanup_image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "LOGGER_LEVEL"
        value = var.logger_level
      }

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name  = "DATABASE_SSL_ENABLED"
        value = "true"
      }
    }
  }

  tags = merge(var.tags, {
    component = "database-cleanup"
    version   = var.image_tag
  })
}

# Container App Job for Provisioner Cleanup
resource "azurerm_container_app_job" "provisioner_cleanup" {
  name                         = "${var.name_prefix}-provisioner-cleanup"
  resource_group_name          = var.resource_group_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  location                     = var.location

  replica_timeout_in_seconds = 300
  replica_retry_limit        = 2

  schedule_trigger_config {
    cron_expression          = "*/15 * * * *" # Every 15 minutes
    parallelism              = 1
    replica_completion_count = 1
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [var.managed_identity_id]
  }

  dynamic "registry" {
    for_each = var.ghcr_username == "" || var.ghcr_token == "" ? [] : [1]
    content {
      server               = var.image_registry
      username             = var.ghcr_username
      password_secret_name = "ghcr-token"
    }
  }

  dynamic "secret" {
    for_each = var.ghcr_username == "" || var.ghcr_token == "" ? [] : [1]
    content {
      name  = "ghcr-token"
      value = var.ghcr_token
    }
  }

  secret {
    name  = "database-url"
    value = var.database_url
  }

  template {
    container {
      name   = "provisioner-cleanup"
      image  = local.provisioner_cleanup_image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "LOGGER_LEVEL"
        value = var.logger_level
      }

      env {
        name  = "PROVISIONER_TYPE"
        value = "azure"
      }

      env {
        name  = "PROVISIONER_APP_NAME"
        value = var.name_prefix
      }

      env {
        name  = "PROVISIONER_CONTAINER_IMAGE"
        value = local.container_image
      }

      env {
        name  = "PROVISIONER_AZURE_SUBSCRIPTION_ID"
        value = var.subscription_id
      }

      env {
        name  = "PROVISIONER_AZURE_RESOURCE_GROUP"
        value = var.resource_group_name
      }

      env {
        name  = "PROVISIONER_AZURE_LOCATION"
        value = var.location
      }

      env {
        name  = "PROVISIONER_AZURE_KEYVAULT_URL"
        value = var.keyvault_url
      }

      # Managed Identity Client ID for Azure SDK
      env {
        name  = "AZURE_CLIENT_ID"
        value = var.managed_identity_client_id
      }
    }
  }

  tags = merge(var.tags, {
    component = "provisioner-cleanup"
    version   = var.image_tag
  })
}
