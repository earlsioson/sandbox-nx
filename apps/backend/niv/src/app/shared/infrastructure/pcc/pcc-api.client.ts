// shared/infrastructure/pcc/pcc-api.client.ts
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as https from 'https';
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
      this.logger.error(`❌ PCC API Failed: ${endpoint}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // If unauthorized, clear cached token and retry once
      if (error.response?.status === 401) {
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
          this.logger.error(
            `❌ PCC API Retry Failed: ${endpoint}`,
            retryError.message
          );
          throw new Error(
            `PCC API call failed after retry: ${retryError.message}`
          );
        }
      }

      throw new Error(`PCC API call failed: ${error.message}`);
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
      this.logger.error(`❌ PCC API POST Failed: ${endpoint}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      throw new Error(`PCC API POST call failed: ${error.message}`);
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
      this.logger.error(`❌ PCC API PUT Failed: ${endpoint}`, error.message);
      throw new Error(`PCC API PUT call failed: ${error.message}`);
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
      this.logger.error('❌ Failed to load mTLS certificates:', error.message);
      throw new Error(`Certificate loading failed: ${error.message}`);
    }
  }
}
