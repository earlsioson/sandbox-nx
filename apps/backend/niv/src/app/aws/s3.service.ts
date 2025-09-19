// apps/backend/niv/src/app/aws/s3.service.ts
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-providers';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ExceptionTranslator } from '../exception-translator.service';

export interface PresignedUrlRequest {
  key: string;
  contentType: string;
  expiresIn?: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  bucket: string;
  expiresIn: number;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'af-sandbox-documents-dev';

    // Debug logging
    this.logger.log(`=== AWS Configuration ===`);
    this.logger.log(`AWS_REGION: ${process.env.AWS_REGION}`);
    this.logger.log(`AWS_PROFILE: ${process.env.AWS_PROFILE}`);
    this.logger.log(`AWS_S3_BUCKET: ${this.bucket}`);

    // Create S3Client with proper credential provider
    if (process.env.AWS_PROFILE) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-2',
        credentials: fromIni({ profile: process.env.AWS_PROFILE }),
      });
      this.logger.log(`Using AWS profile: ${process.env.AWS_PROFILE}`);
    } else {
      // Use default credential chain
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-2',
      });
      this.logger.log('Using default AWS credential chain');
    }

    this.logger.log(`S3Service initialized successfully`);
  }

  async generatePresignedUrl(
    request: PresignedUrlRequest
  ): Promise<PresignedUrlResponse> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: request.key,
        ContentType: request.contentType,
      });

      const expiresIn = request.expiresIn || 900;

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      this.logger.log(`Generated presigned URL for: ${request.key}`);

      return {
        uploadUrl,
        key: request.key,
        bucket: this.bucket,
        expiresIn,
      };
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const errorStack = ExceptionTranslator.getStack(error);

      this.logger.error(
        `Failed to generate presigned URL: ${errorMessage}`,
        errorStack
      );
      throw new Error(`S3 presigned URL generation failed: ${errorMessage}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.generatePresignedUrl({
        key: 'connection-test.txt',
        contentType: 'text/plain',
      });

      return { success: true, message: `Connected to bucket: ${this.bucket}` };
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      return { success: false, message: errorMessage };
    }
  }
}
