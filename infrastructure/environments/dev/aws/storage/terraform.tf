# environments/dev/aws/storage/terraform.tf
terraform {
  required_version = ">= 1.13.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Remote state backend configuration
  backend "s3" {
    bucket         = "af-sandbox-terraform-state-2025"
    key            = "environments/dev/aws/storage/terraform.tfstate"
    region         = "us-east-2"
    profile        = "af-sandbox"
    dynamodb_table = "af-sandbox-terraform-state-2025-locks"
  }
}

provider "aws" {
  profile = "af-sandbox"
  region  = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
      Owner       = "sandbox-admin"
    }
  }
}
