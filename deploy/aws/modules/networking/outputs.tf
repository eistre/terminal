output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "subnet_ids" {
  description = "Subnet IDs used for session tasks"
  value       = [aws_subnet.public.id]
}

output "security_group_ids" {
  description = "Security group IDs used for session tasks"
  value       = [aws_security_group.session.id]
}
