# Availability Zone for the public subnet
data "aws_availability_zones" "available" {
  state = "available"
}

# Local values for networking
locals {
  vpc_cidr = "10.0.0.0/16"
  az_name  = sort(data.aws_availability_zones.available.names)[0]
}

# Dedicated VPC (public only)
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(var.tags, { component = "networking" })
}

# Internet gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { component = "networking" })
}

# Public subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  availability_zone       = local.az_name
  cidr_block              = cidrsubnet(local.vpc_cidr, 8, 0)
  map_public_ip_on_launch = true
  tags                    = merge(var.tags, { component = "networking" })
}

# Public routing
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { component = "networking" })
}

resource "aws_route" "public_internet_access" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Session security group
resource "aws_security_group" "session" {
  name_prefix = "${var.name_prefix}-session-"
  vpc_id      = aws_vpc.main.id
  description = "Session SSH access"
  tags        = merge(var.tags, { component = "networking" })

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
