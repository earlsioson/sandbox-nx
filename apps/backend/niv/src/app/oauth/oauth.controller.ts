// File 1: apps/api/src/app/oauth/oauth.controller.ts
import { Controller, Get, Logger, Query } from '@nestjs/common';

@Controller('oauth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  @Get('callback')
  handleCallback(@Query() query: Record<string, any>) {
    this.logger.log('=== OAuth Callback Received ===');
    this.logger.log('Full query parameters:', JSON.stringify(query, null, 2));

    if (query.code) {
      this.logger.log(
        `✅ Authorization Code received: ${query.code.slice(0, 20)}...`
      );
    }

    if (query.state) {
      this.logger.log(`✅ State parameter: ${query.state}`);
    }

    if (query.error) {
      this.logger.error(`❌ OAuth Error: ${query.error}`);
      if (query.error_description) {
        this.logger.error(`❌ Error Description: ${query.error_description}`);
      }
    }

    return {
      message: 'OAuth callback received successfully',
      timestamp: new Date().toISOString(),
      parameters: query,
      success: !!query.code && !query.error,
    };
  }
}
