data "aws_region" "current" {}

# Local values for container image paths
locals {
  session_task_family       = "${var.resource_prefix}-session"
  session_container_image   = "${var.image_registry}/${var.image_owner}/terminal-container:${var.image_tag}"
  database_cleanup_image    = "${var.image_registry}/${var.image_owner}/terminal-database-cleanup:${var.image_tag}"
  provisioner_cleanup_image = "${var.image_registry}/${var.image_owner}/terminal-provisioner-cleanup:${var.image_tag}"
}

# ECS cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.resource_prefix}-ecs"
  tags = merge(var.tags, { component = "ecs" })
}

# Session task definition
resource "aws_ecs_task_definition" "session" {
  family                   = local.session_task_family
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.session_task_cpu
  memory                   = var.session_task_memory
  execution_role_arn       = var.execution_role_arn
  tags                     = merge(var.tags, { component = "ecs" })

  runtime_platform {
    cpu_architecture = var.session_cpu_architecture
  }

  container_definitions = jsonencode([
    {
      name      = "terminal"
      image     = local.session_container_image
      essential = true
      portMappings = [
        {
          containerPort = 22
          protocol      = "tcp"
        }
      ]
      healthCheck = {
        command  = ["CMD-SHELL", "bash -c '</dev/tcp/127.0.0.1/22'"]
        interval = 10
        timeout  = 5
        retries  = 2
      }
    }
  ])
}

# Cleanup task definition for database cleanup
resource "aws_ecs_task_definition" "database_cleanup" {
  family                   = "${var.resource_prefix}-database-cleanup"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.execution_role_arn
  tags                     = merge(var.tags, { component = "ecs" })

  runtime_platform {
    cpu_architecture = var.session_cpu_architecture
  }

  container_definitions = jsonencode([
    {
      name      = "database-cleanup"
      image     = local.database_cleanup_image
      essential = true
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "LOGGER_LEVEL", value = var.logger_level },
        { name = "DATABASE_URL", value = var.database_url },
        { name = "DATABASE_SSL_ENABLED", value = "true" },
      ]
    }
  ])
}

# Cleanup task definition for provisioner cleanup
resource "aws_ecs_task_definition" "provisioner_cleanup" {
  family                   = "${var.resource_prefix}-provisioner-cleanup"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.provisioner_task_role_arn
  tags                     = merge(var.tags, { component = "ecs" })

  runtime_platform {
    cpu_architecture = var.session_cpu_architecture
  }

  container_definitions = jsonencode([
    {
      name      = "provisioner-cleanup"
      image     = local.provisioner_cleanup_image
      essential = true
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "LOGGER_LEVEL", value = var.logger_level },
        { name = "PROVISIONER_TYPE", value = "aws" },
        { name = "PROVISIONER_APP_NAME", value = var.resource_prefix },
        { name = "PROVISIONER_CONTAINER_IMAGE", value = local.session_container_image },
        { name = "PROVISIONER_AWS_REGION", value = data.aws_region.current.region },
        { name = "PROVISIONER_AWS_ECS_CLUSTER", value = aws_ecs_cluster.main.name },
        { name = "PROVISIONER_AWS_TASK_FAMILY", value = aws_ecs_task_definition.session.family },
        { name = "PROVISIONER_AWS_SUBNETS", value = join(",", var.session_subnet_ids) },
        { name = "PROVISIONER_AWS_SECURITY_GROUPS", value = join(",", var.session_security_group_ids) },
        { name = "PROVISIONER_AWS_USE_PUBLIC_IP", value = "true" },
      ]
    }
  ])
}

# EventBridge schedule to run cleanup jobs
data "aws_iam_policy_document" "events_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "events" {
  name               = "${var.resource_prefix}-events"
  assume_role_policy = data.aws_iam_policy_document.events_assume.json
  tags               = merge(var.tags, { component = "ecs" })
}

data "aws_iam_policy_document" "events" {
  statement {
    actions = ["ecs:RunTask"]
    resources = [
      aws_ecs_task_definition.database_cleanup.arn,
      aws_ecs_task_definition.provisioner_cleanup.arn,
    ]
  }

  statement {
    actions = ["iam:PassRole"]
    resources = [
      var.execution_role_arn,
      var.provisioner_task_role_arn,
    ]
  }
}

resource "aws_iam_role_policy" "events" {
  role   = aws_iam_role.events.id
  policy = data.aws_iam_policy_document.events.json
}

# EventBridge rule for database cleanup
resource "aws_cloudwatch_event_rule" "database_cleanup" {
  name                = "${var.resource_prefix}-database-cleanup"
  schedule_expression = "cron(0 0 * * ? *)"
  tags                = merge(var.tags, { component = "ecs" })
}

# EventBridge rule for provisioner cleanup
resource "aws_cloudwatch_event_rule" "provisioner_cleanup" {
  name                = "${var.resource_prefix}-provisioner-cleanup"
  schedule_expression = "cron(0/15 * * * ? *)"
  tags                = merge(var.tags, { component = "ecs" })
}

# EventBridge target for database cleanup
resource "aws_cloudwatch_event_target" "database_cleanup" {
  rule     = aws_cloudwatch_event_rule.database_cleanup.name
  arn      = aws_ecs_cluster.main.arn
  role_arn = aws_iam_role.events.arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.database_cleanup.arn
    launch_type         = "FARGATE"
    platform_version    = "LATEST"

    network_configuration {
      subnets          = var.session_subnet_ids
      security_groups  = var.session_security_group_ids
      assign_public_ip = true
    }
  }
}

# EventBridge target for provisioner cleanup
resource "aws_cloudwatch_event_target" "provisioner_cleanup" {
  rule     = aws_cloudwatch_event_rule.provisioner_cleanup.name
  arn      = aws_ecs_cluster.main.arn
  role_arn = aws_iam_role.events.arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.provisioner_cleanup.arn
    launch_type         = "FARGATE"
    platform_version    = "LATEST"

    network_configuration {
      subnets          = var.session_subnet_ids
      security_groups  = var.session_security_group_ids
      assign_public_ip = true
    }
  }
}
