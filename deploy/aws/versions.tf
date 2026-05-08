terraform {
  required_version = "~> 1.15.2"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.28.0"
    }
    http = {
      source  = "hashicorp/http"
      version = ">= 3.5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
