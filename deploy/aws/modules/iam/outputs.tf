output "ecs_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_execution.arn
}

output "provisioner_task_role_arn" {
  description = "Provisioner task role ARN"
  value       = aws_iam_role.provisioner_task.arn
}

output "web_access_key_id" {
  description = "Access key ID for the web app"
  value       = aws_iam_access_key.web.id
  sensitive   = true
}

output "web_secret_access_key" {
  description = "Secret access key for the web app"
  value       = aws_iam_access_key.web.secret
  sensitive   = true
}
