// shared/infrastructure/pcc/pcc-config.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class PccConfigService {
  get clientId(): string {
    const clientId = process.env.PCC_CLIENT_ID;
    if (!clientId) {
      throw new Error('PCC_CLIENT_ID environment variable is required');
    }
    return clientId;
  }

  get clientSecret(): string {
    const clientSecret = process.env.PCC_CLIENT_SECRET;
    if (!clientSecret) {
      throw new Error('PCC_CLIENT_SECRET environment variable is required');
    }
    return clientSecret;
  }

  get certPath(): string {
    const certPath =
      process.env.PCC_CERT_PATH ||
      '~/dev/certs/dev.ancientfire.tech/fullchain.pem';
    return certPath.replace('~', process.env.HOME || '');
  }

  get keyPath(): string {
    const keyPath =
      process.env.PCC_KEY_PATH ||
      '~/dev/certs/dev.ancientfire.tech/privkey.pem';
    return keyPath.replace('~', process.env.HOME || '');
  }

  get baseUrl(): string {
    return process.env.PCC_BASE_URL || 'https://connect2.pointclickcare.com';
  }

  get timeout(): number {
    return parseInt(process.env.PCC_TIMEOUT || '30000', 10);
  }

  getCredentialsBase64(): string {
    return Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      'base64'
    );
  }
}
