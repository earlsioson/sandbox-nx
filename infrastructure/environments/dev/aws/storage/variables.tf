# environments/dev/aws/storage/variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "af-sandbox"
}

variable "bucket_name" {
  description = "Name of the documents S3 bucket"
  type        = string
}
