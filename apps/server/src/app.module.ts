import { Module } from '@nestjs/common';
import { AuthModule } from '@app/auth/auth.module';
import { BackOfficeModule } from '@app/back-office/back-office.module';
import { MobileAppModule } from '@app/mobile-app/mobile-app.module';
import { InfraModule } from '@lib/infra/infra.module';
import { ConfigurationModule } from '@lib/configuration';

@Module({
  imports: [
    ConfigurationModule,
    InfraModule,
    AuthModule,
    BackOfficeModule,
    MobileAppModule,
  ],
})
export class AppModule {}
