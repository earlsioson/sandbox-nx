import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OAuthModule } from './oauth/oauth.module';
import { OnboardingModule } from './onboarding/onboarding.module'; // Add this
import { PccTestModule } from './pcc-test/pcc-test.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [UploadModule, OAuthModule, PccTestModule, OnboardingModule], // Add OnboardingModule
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
