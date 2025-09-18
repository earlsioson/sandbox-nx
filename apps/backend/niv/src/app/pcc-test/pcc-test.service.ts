// apps/backend/niv/src/app/pcc-test/pcc-test.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as https from 'https';

@Injectable()
export class PCCTestService {
  private readonly logger = new Logger(PCCTestService.name);

  async testPCCAuth(): Promise<any> {
    const clientId = process.env.PCC_CLIENT_ID || 'your-client-id';
    const clientSecret = process.env.PCC_CLIENT_SECRET || 'your-client-secret';

    // Base64 encode credentials
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64'
    );

    // Setup mTLS agent
    const httpsAgent = this.createMTLSAgent();

    try {
      this.logger.log('🔐 Testing PCC OAuth with mTLS...');

      const response = await axios.post(
        'https://connect2.pointclickcare.com/auth/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          httpsAgent,
          timeout: 30000,
        }
      );

      this.logger.log('✅ OAuth Success!', {
        expires_in: response.data.expires_in,
        token_preview: response.data.access_token?.substring(0, 20) + '...',
      });

      return {
        success: true,
        data: {
          expires_in: response.data.expires_in,
          token_type: response.data.token_type || 'Bearer',
          token_preview: response.data.access_token?.substring(0, 20) + '...',
        },
      };
    } catch (error) {
      this.logger.error('❌ OAuth Failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      return {
        success: false,
        error: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        },
      };
    }
  }

  async testPCCAPI(): Promise<any> {
    try {
      // First get a token
      const authResult = await this.testPCCAuth();
      if (!authResult.success) {
        return { success: false, error: 'Failed to get auth token' };
      }

      // Get the full token for API call (we need to make another auth call)
      const token = await this.getFullToken();

      const httpsAgent = this.createMTLSAgent();

      this.logger.log('📡 Testing PCC API call...');

      const response = await axios.get(
        'https://connect2.pointclickcare.com/api/public/preview1/webhook-subscriptions?applicationName=centara-dev',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          httpsAgent,
          timeout: 30000,
        }
      );

      this.logger.log('✅ API Call Success!', {
        status: response.status,
        dataLength: JSON.stringify(response.data).length,
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      this.logger.error('❌ API Call Failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      return {
        success: false,
        error: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        },
      };
    }
  }

  private async getFullToken(): Promise<string> {
    const clientId = process.env.PCC_CLIENT_ID || 'your-client-id';
    const clientSecret = process.env.PCC_CLIENT_SECRET || 'your-client-secret';
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64'
    );
    const httpsAgent = this.createMTLSAgent();

    const response = await axios.post(
      'https://connect2.pointclickcare.com/auth/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        httpsAgent,
      }
    );

    return response.data.access_token;
  }

  private createMTLSAgent(): https.Agent {
    const certPath = (
      process.env.PCC_CERT_PATH ||
      '~/dev/certs/dev.ancientfire.tech/fullchain.pem'
    ).replace('~', process.env.HOME || '');
    const keyPath = (
      process.env.PCC_KEY_PATH || '~/dev/certs/dev.ancientfire.tech/privkey.pem'
    ).replace('~', process.env.HOME || '');

    try {
      const cert = fs.readFileSync(certPath);
      const key = fs.readFileSync(keyPath);

      this.logger.log('📜 Loading mTLS certificates:', {
        certPath,
        keyPath,
        certSize: cert.length,
        keySize: key.length,
      });

      return new https.Agent({
        cert,
        key,
        rejectUnauthorized: true,
      });
    } catch (error) {
      this.logger.error('❌ Failed to load certificates:', error.message);
      throw new Error(`Certificate loading failed: ${error.message}`);
    }
  }

  async testCertificates(): Promise<any> {
    try {
      const agent = this.createMTLSAgent();
      this.logger.log('✅ Certificates loaded successfully');

      return {
        success: true,
        message: 'Certificates loaded and HTTPS agent created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
