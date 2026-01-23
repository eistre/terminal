output "web_url" {
  description = "URL of the web application"
  value       = module.lightsail_web.web_url
}

output "web_private_domain" {
  description = "Private Lightsail domain name (VPC-only)"
  value       = module.lightsail_web.private_domain_name
}

output "mysql_host" {
  description = "MySQL server hostname"
  value       = module.lightsail_database.host
}

output "ecs_cluster_name" {
  description = "ECS cluster name used by the provisioner"
  value       = module.ecs.cluster_name
}

output "session_task_family" {
  description = "ECS task definition family for session containers"
  value       = module.ecs.session_task_family
}

output "session_subnet_ids" {
  description = "Subnet IDs used for session tasks"
  value       = module.networking.subnet_ids
}

output "session_security_group_ids" {
  description = "Security group IDs used for session tasks"
  value       = module.networking.security_group_ids
}

output "app_registry_application_arn" {
  description = "AppRegistry application ARN (MyApplications)"
  value       = aws_servicecatalogappregistry_application.main.arn
}

output "app_registry_application_tag" {
  description = "Tag map used to associate resources with the AppRegistry application"
  value       = aws_servicecatalogappregistry_application.main.application_tag
}
