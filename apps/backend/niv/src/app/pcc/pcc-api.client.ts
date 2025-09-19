// apps/backend/niv/src/app/shared/infrastructure/pcc/pcc-api.client.ts
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import { ExceptionTranslator } from '../exception-translator.service';
import { PccAuthService } from './pcc-auth.service';
import { PccConfigService } from './pcc-config.service';

@Injectable()
export class PccAPIClient {
  private readonly logger = new Logger(PccAPIClient.name);
  private httpsAgent: https.Agent;

  constructor(
    private authService: PccAuthService,
    private configService: PccConfigService
  ) {
    this.httpsAgent = this.createMTLSAgent();
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const token = await this.authService.getAccessToken();
    const url = `${this.configService.baseUrl}${endpoint}`;

    this.logger.log(`🔗 PCC API GET: ${endpoint}`);

    try {
      const response: AxiosResponse<T> = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params,
        httpsAgent: this.httpsAgent,
        timeout: this.configService.timeout,
      });

      this.logger.log(`✅ PCC API Success: ${endpoint}`, {
        status: response.status,
        dataLength: JSON.stringify(response.data).length,
      });

      return response.data;
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const isNetworkError = ExceptionTranslator.isNetworkError(error);
      const isAuthError = ExceptionTranslator.isAuthenticationError(error);

      const logContext = {
        endpoint,
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

      this.logger.error(`❌ PCC API Failed: ${endpoint}`, logContext);

      // If unauthorized, clear cached token and retry once
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.logger.log('🔄 Token expired, retrying with new token...');
        this.authService.clearCachedToken();

        try {
          const newToken = await this.authService.getAccessToken();
          const retryResponse: AxiosResponse<T> = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            params,
            httpsAgent: this.httpsAgent,
            timeout: this.configService.timeout,
          });

          this.logger.log(`✅ PCC API Retry Success: ${endpoint}`);
          return retryResponse.data;
        } catch (retryError) {
          const retryErrorMessage = ExceptionTranslator.getMessage(retryError);
          this.logger.error(
            `❌ PCC API Retry Failed: ${endpoint}`,
            retryErrorMessage
          );
          throw new Error(
            `PCC API call failed after retry: ${retryErrorMessage}`
          );
        }
      }

      throw new Error(`PCC API call failed: ${errorMessage}`);
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const token = await this.authService.getAccessToken();
    const url = `${this.configService.baseUrl}${endpoint}`;

    this.logger.log(`🔗 PCC API POST: ${endpoint}`);

    try {
      const response: AxiosResponse<T> = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        httpsAgent: this.httpsAgent,
        timeout: this.configService.timeout,
      });

      this.logger.log(`✅ PCC API POST Success: ${endpoint}`, {
        status: response.status,
      });

      return response.data;
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const isNetworkError = ExceptionTranslator.isNetworkError(error);
      const isAuthError = ExceptionTranslator.isAuthenticationError(error);

      const logContext = {
        endpoint,
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

      this.logger.error(`❌ PCC API POST Failed: ${endpoint}`, logContext);

      throw new Error(`PCC API POST call failed: ${errorMessage}`);
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const token = await this.authService.getAccessToken();
    const url = `${this.configService.baseUrl}${endpoint}`;

    this.logger.log(`🔗 PCC API PUT: ${endpoint}`);

    try {
      const response: AxiosResponse<T> = await axios.put(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        httpsAgent: this.httpsAgent,
        timeout: this.configService.timeout,
      });

      this.logger.log(`✅ PCC API PUT Success: ${endpoint}`);
      return response.data;
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const isNetworkError = ExceptionTranslator.isNetworkError(error);
      const isAuthError = ExceptionTranslator.isAuthenticationError(error);

      const logContext = {
        endpoint,
        isNetworkError,
        isAuthError,
      };

      this.logger.error(`❌ PCC API PUT Failed: ${endpoint}`, logContext);
      throw new Error(`PCC API PUT call failed: ${errorMessage}`);
    }
  }

  private createMTLSAgent(): https.Agent {
    try {
      const cert = fs.readFileSync(this.configService.certPath);
      const key = fs.readFileSync(this.configService.keyPath);

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
