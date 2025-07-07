import { MailerOptions } from '@nestjs-modules/mailer';
import { JwtModuleOptions } from '@nestjs/jwt';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LokiOptions } from 'pino-loki';

export type AppConfig = {
  app: {
    name: string;
  };
  db: TypeOrmModuleOptions;
  loki: LokiOptions;
  jwtAccess: JwtModuleOptions;
  jwtRefresh: JwtModuleOptions;
  mailer: MailerOptions;
  s3: {
    endpoint: string;
    region: string;
    bucketName: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  redis: {
    host: string;
    port: number | string;
  };
  gotenberg: {
    endpoint: string;
    username?: string;
    password?: string;
    customHttpHeaders?: Record<string, string>;
  };
};
