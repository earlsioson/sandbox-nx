import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OAuthModule } from './oauth/oauth.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [UploadModule, OAuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
