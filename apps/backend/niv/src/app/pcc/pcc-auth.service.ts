// apps/backend/niv/src/app/shared/infrastructure/pcc/pcc-auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import { ExceptionTranslator } from '../exception-translator.service';
import { PccConfigService } from './pcc-config.service';

export interface PccTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class PccAuthService {
  private readonly logger = new Logger(PccAuthService.name);
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private httpsAgent: https.Agent;

  constructor(private configService: PccConfigService) {
    this.httpsAgent = this.createMTLSAgent();
  }

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 300000) {
      return this.cachedToken;
    }

    this.logger.log('🔐 Requesting new PCC access token...');

    try {
      const response = await axios.post<PccTokenResponse>(
        `${this.configService.baseUrl}/auth/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${this.configService.getCredentialsBase64()}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          httpsAgent: this.httpsAgent,
          timeout: this.configService.timeout,
        }
      );

      this.cachedToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

      this.logger.log('✅ PCC access token obtained', {
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
      });

      return this.cachedToken;
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

      this.logger.error('❌ PCC authentication failed:', logContext);

      throw new Error(`PCC authentication failed: ${errorMessage}`);
    }
  }

  clearCachedToken(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
    this.logger.log('🔄 PCC token cache cleared');
  }

  private createMTLSAgent(): https.Agent {
    try {
      const cert = fs.readFileSync(this.configService.certPath);
      const key = fs.readFileSync(this.configService.keyPath);

      this.logger.log('📜 Loading mTLS certificates:', {
        certPath: this.configService.certPath,
        keyPath: this.configService.keyPath,
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
      this.logger.error(`❌ Failed to load mTLS certificates: ${errorMessage}`);
      throw new Error(`Certificate loading failed: ${errorMessage}`);
    }
  }
}
