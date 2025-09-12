# environments/dev/aws/storage/main.tf
module "documents_bucket" {
  source = "../../../../modules/aws/storage/s3-bucket"

  bucket_name  = var.bucket_name
  environment  = var.environment
  project_name = var.project_name

  # Dev-specific configuration
  versioning_enabled                 = true
  lifecycle_enabled                  = true
  noncurrent_version_expiration_days = 7 # Shorter retention for dev
}
