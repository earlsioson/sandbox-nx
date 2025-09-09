// File 2: apps/api/src/app/oauth/oauth.module.ts
import { Module } from '@nestjs/common';
import { OAuthController } from './oauth.controller';

@Module({
  controllers: [OAuthController],
})
export class OAuthModule {}
