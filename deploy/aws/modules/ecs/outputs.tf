output "cluster_name" {
  description = "ECS cluster name used by the provisioner"
  value       = aws_ecs_cluster.main.name
}

output "session_task_family" {
  description = "ECS task definition family for session containers"
  value       = aws_ecs_task_definition.session.family
}
