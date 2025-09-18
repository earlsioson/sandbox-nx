// apps/backend/niv/src/app/pcc-test/pcc-test.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import { ExceptionTranslator } from '../shared/application/services/exception-translator.service';

@Injectable()
export class PccTestService {
  private readonly logger = new Logger(PccTestService.name);

  async testPccAuth(): Promise<any> {
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
      const errorMessage = ExceptionTranslator.getMessage(error);
      const isNetworkError = ExceptionTranslator.isNetworkError(error);
      const isAuthError = ExceptionTranslator.isAuthenticationError(error);

      const logContext = {
        isNetworkError,
        isAuthError,
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        statusText: axios.isAxiosError(error)
          ? error.response?.statusText
          : undefined,
        responseData: axios.isAxiosError(error)
          ? error.response?.data
          : undefined,
      };

      this.logger.error('❌ OAuth Failed:', logContext);

      return {
        success: false,
        error: {
          message: errorMessage,
          isNetworkError,
          isAuthError,
          status: logContext.status,
          statusText: logContext.statusText,
          responseData: logContext.responseData,
        },
      };
    }
  }

  async testPCCAPI(): Promise<any> {
    try {
      // First get a token
      const authResult = await this.testPccAuth();
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
      const errorMessage = ExceptionTranslator.getMessage(error);
      const isNetworkError = ExceptionTranslator.isNetworkError(error);
      const isAuthError = ExceptionTranslator.isAuthenticationError(error);

      const logContext = {
        isNetworkError,
        isAuthError,
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        statusText: axios.isAxiosError(error)
          ? error.response?.statusText
          : undefined,
        responseData: axios.isAxiosError(error)
          ? error.response?.data
          : undefined,
      };

      this.logger.error('❌ API Call Failed:', logContext);

      return {
        success: false,
        error: {
          message: errorMessage,
          isNetworkError,
          isAuthError,
          status: logContext.status,
          statusText: logContext.statusText,
          responseData: logContext.responseData,
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

    try {
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
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      throw new Error(`Failed to get full token: ${errorMessage}`);
    }
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
      const errorMessage = ExceptionTranslator.getMessage(error);
      this.logger.error(`❌ Failed to load certificates: ${errorMessage}`);
      throw new Error(`Certificate loading failed: ${errorMessage}`);
    }
  }

  async testCertificates(): Promise<any> {
    try {
      this.createMTLSAgent();
      this.logger.log('✅ Certificates loaded successfully');

      return {
        success: true,
        message: 'Certificates loaded and HTTPS agent created successfully',
      };
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
