import { Global, Module } from '@nestjs/common';

import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@lib/configuration/configuration.type';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService<AppConfig>) => {
        const opts = configService.get<TypeOrmModuleOptions>('db');

        return {
          ...opts,
          namingStrategy: new SnakeNamingStrategy(),
          entities: [`${__dirname}/db/entities/**/*.{js,ts}`],
          migrations: [`${__dirname}/db/migrations/**/*.{js,ts}`],
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
