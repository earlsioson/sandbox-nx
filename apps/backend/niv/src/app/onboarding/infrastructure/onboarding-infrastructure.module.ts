import { Module } from '@nestjs/common';
import { InMemoryPersistenceModule } from './in-memory/in-memory-persistence.module';
import { OrmPersistenceModule } from './orm/orm-persistence.module';

@Module({})
export class OnboardingInfrastructureModule {
  static use(driver: 'orm' | 'in-memory') {
    const persistenceModule =
      driver === 'orm' ? OrmPersistenceModule : InMemoryPersistenceModule;

    return {
      module: OnboardingInfrastructureModule,
      imports: [persistenceModule],
      exports: [persistenceModule],
    };
  }
}
