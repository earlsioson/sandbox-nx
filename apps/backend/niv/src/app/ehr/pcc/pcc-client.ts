import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import { PccClientConfig, PccTokenResponse } from './types';

// Create PCC client - returns functions for making API calls
export function createPccClient(config: PccClientConfig) {
  const baseUrl = config.baseUrl || 'https://connect2.pointclickcare.com';
  const timeout = config.timeout || 30000;

  // Token cache - closure variables
  let cachedToken: string | null = null;
  let tokenExpiresAt: number = 0;

  // Create mTLS agent - pure function
  const createMTLSAgent = (): https.Agent => {
    try {
      const cert = fs.readFileSync(config.certPath);
      const key = fs.readFileSync(config.keyPath);

      return new https.Agent({
        cert,
        key,
        rejectUnauthorized: true,
      });
    } catch (error) {
      throw new Error(
        `Failed to load certificates: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  // Get access token - handles caching
  const getAccessToken = async (): Promise<string> => {
    // Return cached token if still valid (with 5 minute buffer)
    if (cachedToken && Date.now() < tokenExpiresAt - 300000) {
      return cachedToken;
    }

    const credentials = Buffer.from(
      `${config.clientId}:${config.clientSecret}`
    ).toString('base64');
    const httpsAgent = createMTLSAgent();

    try {
      // Auth endpoint is NOT under /api - use root domain
      const response = await axios.post<PccTokenResponse>(
        'https://connect2.pointclickcare.com/auth/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          httpsAgent,
          timeout,
        }
      );

      cachedToken = response.data.access_token;
      tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

      return cachedToken;
    } catch (error) {
      throw new Error(
        `PCC authentication failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  // HTTP GET function
  const get = async <T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> => {
    const token = await getAccessToken();
    const httpsAgent = createMTLSAgent();
    const url = `${baseUrl}${endpoint}`;

    try {
      const response: AxiosResponse<T> = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params,
        httpsAgent,
        timeout,
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `PCC API GET failed for ${endpoint}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  // HTTP POST function
  const post = async <T>(endpoint: string, data?: any): Promise<T> => {
    const token = await getAccessToken();
    const httpsAgent = createMTLSAgent();
    const url = `${baseUrl}${endpoint}`;

    try {
      const response: AxiosResponse<T> = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        httpsAgent,
        timeout,
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `PCC API POST failed for ${endpoint}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  // Clear cached token - useful for testing
  const clearTokenCache = (): void => {
    cachedToken = null;
    tokenExpiresAt = 0;
  };

  // Test certificates - useful for validation
  const testCertificates = (): boolean => {
    try {
      createMTLSAgent();
      return true;
    } catch {
      return false;
    }
  };

  // Return client functions
  return {
    get,
    post,
    getAccessToken,
    clearTokenCache,
    testCertificates,
  };
}

// Helper function to create config from environment variables
export function createPccConfigFromEnv(): PccClientConfig {
  const clientId = process.env.PCC_CLIENT_ID;
  const clientSecret = process.env.PCC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'PCC_CLIENT_ID and PCC_CLIENT_SECRET environment variables are required'
    );
  }

  const certPath = (
    process.env.PCC_CERT_PATH ||
    '~/dev/certs/dev.ancientfire.tech/fullchain.pem'
  ).replace('~', process.env.HOME || '');
  const keyPath = (
    process.env.PCC_KEY_PATH || '~/dev/certs/dev.ancientfire.tech/privkey.pem'
  ).replace('~', process.env.HOME || '');

  return {
    clientId,
    clientSecret,
    certPath,
    keyPath,
    baseUrl: process.env.PCC_BASE_URL,
    timeout: process.env.PCC_TIMEOUT
      ? parseInt(process.env.PCC_TIMEOUT, 10)
      : undefined,
  };
}
