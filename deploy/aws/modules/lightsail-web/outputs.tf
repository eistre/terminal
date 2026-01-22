output "web_url" {
  description = "URL of the web application"
  value       = aws_lightsail_container_service.web.url
}

output "private_domain_name" {
  description = "Private Lightsail domain name (VPC-only)"
  value       = aws_lightsail_container_service.web.private_domain_name
}
