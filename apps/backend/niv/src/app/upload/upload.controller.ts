import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { S3Service } from '../aws/s3.service';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(
    private readonly uploadService: UploadService,
    private readonly s3Service: S3Service
  ) {}

  @Post('presigned-url')
  async createPresignedUrl(@Body() body: any) {
    try {
      this.logger.log(`Presigned URL request: ${JSON.stringify(body)}`);

      return await this.uploadService.createPresignedUpload({
        fileName: body.fileName,
        contentType: body.contentType,
        category: body.category,
        metadata: body.metadata,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Presigned URL generation failed: ${message}`);
      throw error;
    }
  }

  @Get('test-connection')
  async testConnection() {
    return this.s3Service.testConnection();
  }
}
