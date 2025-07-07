import { AuthModule } from '@app/auth/auth.module';
import { ConfigurationModule } from '@lib/configuration';
import { InfraModule } from '@lib/infra';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigurationModule, InfraModule, AuthModule],
  controllers: [],
  providers: [],
})
export class BackOfficeModule {}
