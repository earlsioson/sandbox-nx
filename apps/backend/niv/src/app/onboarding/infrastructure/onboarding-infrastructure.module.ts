import { Module } from '@nestjs/common';
import { OrmPersistenceModule } from './orm/orm-persistence.module';

@Module({})
export class OnboardingInfrastructureModule {
  static use() {
    // Can use different persistence modules here
    const persistenceModule = OrmPersistenceModule;

    return {
      module: OnboardingInfrastructureModule,
      imports: [persistenceModule],
      exports: [persistenceModule],
    };
  }
}
