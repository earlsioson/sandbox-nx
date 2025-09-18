// apps/backend/niv/src/app/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OAuthModule } from './oauth/oauth.module';
import { PccTestModule } from './pcc-test/pcc-test.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [UploadModule, OAuthModule, PccTestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
