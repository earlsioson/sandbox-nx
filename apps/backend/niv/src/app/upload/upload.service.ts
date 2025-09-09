import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { S3Service } from '../aws/s3.service';

export interface UploadRequest {
  fileName: string;
  contentType: string;
  category?: string;
  metadata?: Record<string, string>;
}

export interface UploadResponse {
  uploadUrl: string;
  key: string;
  bucket: string;
  expiresIn: number;
  uploadInstructions: {
    method: string;
    headers: Record<string, string>;
  };
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly s3Service: S3Service) {}

  async createPresignedUpload(request: UploadRequest): Promise<UploadResponse> {
    // Validate request
    this.validateUploadRequest(request);

    // Generate unique key
    const key = this.generateFileKey(request.fileName, request.category);

    // Get presigned URL from S3
    const s3Response = await this.s3Service.generatePresignedUrl({
      key,
      contentType: request.contentType,
    });

    this.logger.log(
      `Created presigned upload for: ${request.fileName} -> ${key}`
    );

    return {
      ...s3Response,
      uploadInstructions: {
        method: 'PUT',
        headers: {
          'Content-Type': request.contentType,
        },
      },
    };
  }

  private validateUploadRequest(request: UploadRequest): void {
    if (!request.fileName || typeof request.fileName !== 'string') {
      throw new BadRequestException(
        'fileName is required and must be a string'
      );
    }

    if (request.fileName.length > 255) {
      throw new BadRequestException('fileName too long (max 255 characters)');
    }

    if (!request.contentType || typeof request.contentType !== 'string') {
      throw new BadRequestException('contentType is required');
    }

    if (!request.contentType.includes('/')) {
      throw new BadRequestException('contentType must be a valid MIME type');
    }

    // File type allowlist
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/json',
    ];

    if (!allowedTypes.includes(request.contentType)) {
      throw new BadRequestException(
        `File type not allowed: ${request.contentType}`
      );
    }

    // Sanitize filename
    const sanitizedName = this.sanitizeFileName(request.fileName);
    if (sanitizedName !== request.fileName) {
      throw new BadRequestException('fileName contains invalid characters');
    }
  }

  private generateFileKey(fileName: string, category?: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const uniqueId = randomUUID().slice(0, 8);
    const basePath = category ? category : 'documents';
    const datePath = `${year}/${month}/${day}`;
    const sanitizedFileName = this.sanitizeFileName(fileName);

    return `${basePath}/${datePath}/${uniqueId}-${sanitizedFileName}`;
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.\-_]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .slice(0, 100);
  }
}
