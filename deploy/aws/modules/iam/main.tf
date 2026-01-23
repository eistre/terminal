# Account and region context
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Assume role policy for ECS tasks
data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# ECS task execution role
resource "aws_iam_role" "ecs_execution" {
  name               = "${var.resource_prefix}-ecs-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  tags               = merge(var.tags, { component = "iam" })
}

# Attach ECS task execution policy
resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Provisioner task role
resource "aws_iam_role" "provisioner_task" {
  name               = "${var.resource_prefix}-provisioner-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  tags               = merge(var.tags, { component = "iam" })
}

# Local values for permissions and ARNs
locals {
  secret_prefix    = "${var.resource_prefix}-session-"
  ecs_cluster      = "${var.resource_prefix}-ecs"
  ecs_task_family  = "${var.resource_prefix}-session"
  ecs_cluster_arn  = "arn:aws:ecs:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:cluster/${local.ecs_cluster}"
  ecs_task_def_arn = "arn:aws:ecs:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:task-definition/${local.ecs_task_family}:*"
  ecs_task_arn     = "arn:aws:ecs:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:task/${local.ecs_cluster}/*"
}

# Provisioner permissions (ECS + Secrets Manager)
data "aws_iam_policy_document" "provisioner" {
  statement {
    actions   = ["ecs:RunTask"]
    resources = [local.ecs_task_def_arn]

    condition {
      test     = "StringEquals"
      variable = "ecs:cluster"
      values   = [local.ecs_cluster_arn]
    }
  }

  statement {
    actions = [
      "ecs:DescribeTasks",
      "ecs:StopTask",
      "ecs:TagResource",
    ]
    resources = [
      local.ecs_task_arn,
      local.ecs_task_def_arn,
    ]
  }

  statement {
    actions   = ["ecs:ListTasks"]
    resources = ["*"]
  }

  statement {
    actions = ["iam:PassRole"]
    resources = [
      aws_iam_role.ecs_execution.arn,
      aws_iam_role.provisioner_task.arn,
    ]
  }

  statement {
    actions   = ["ec2:DescribeNetworkInterfaces"]
    resources = ["*"]
  }

  statement {
    actions = [
      "secretsmanager:CreateSecret",
      "secretsmanager:GetSecretValue",
      "secretsmanager:PutSecretValue",
      "secretsmanager:DeleteSecret",
      "secretsmanager:RestoreSecret",
    ]
    resources = [
      "arn:aws:secretsmanager:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:secret:${local.secret_prefix}*",
    ]
  }
}

# Attach provisioner policy to task role
resource "aws_iam_role_policy" "provisioner_task" {
  role   = aws_iam_role.provisioner_task.id
  policy = data.aws_iam_policy_document.provisioner.json
}

# IAM user for the web app
resource "aws_iam_user" "web" {
  name = "${var.resource_prefix}-web"
  tags = merge(var.tags, { component = "iam" })
}

# IAM policy for the web app user
resource "aws_iam_user_policy" "web" {
  user   = aws_iam_user.web.name
  policy = data.aws_iam_policy_document.provisioner.json
}

# Access key for the web app user
resource "aws_iam_access_key" "web" {
  user = aws_iam_user.web.name
}
