import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './db/database.module';
import { EmailModule } from './email/email.module';

import { AppConfig } from '@lib/configuration/configuration.type';
import { ConfigService } from '@nestjs/config';

import pino from 'pino';
import { LokiOptions } from 'pino-loki';
import { Options } from 'pino-http';

import {
  LoggerModule as PinoLoggerModule,
  Params,
  LoggerModule,
} from 'nestjs-pino';
import { FileStoreModule } from './filestore/filestore.module';
import { PdfModule } from './pdf/pdf.module';

@Global()
@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    PdfModule,
    FileStoreModule,
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>): Params => {
        const isProduction = ['production', 'staging'].includes(
          process.env.NODE_ENV || '',
        );

        // See:
        // - https://github.com/pinojs/pino/blob/main/docs/transports.md
        // - https://github.com/Julien-R44/pino-loki
        const targets: pino.TransportTargetOptions[] = [];
        if (isProduction) {
          const lokiOpts: LokiOptions = config.getOrThrow('loki');
          targets.push({
            target: 'pino-loki',
            options: {
              ...lokiOpts,
            },
          });
        } else {
          targets.push({
            target: 'pino-pretty',
            options: {
              colorize: true,
              levelFirst: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          });
        }

        const pinoHttpOptions: Options = {
          level: isProduction ? 'warn' : 'info',
          transport: {
            targets: targets,
          },
          redact: {
            paths: ['user.password', '*.user.password'],
            remove: true,
          },
          depthLimit: 2,
          customLogLevel: (_req, res, _) => {
            if (res.statusCode >= 500) {
              return 'error';
            }
            return 'info';
          },
          mixin: (_mergeObject, level, logger) => {
            return { label: logger.levels.labels[level] };
          },
        };

        // see:
        // - https://github.com/iamolegga/nestjs-pino
        // - https://github.com/pinojs/pino/blob/main/docs/api.md#pino-destination
        return {
          pinoHttp: pinoHttpOptions,
        };
      },
    }),
  ],
  exports: [
    DatabaseModule,
    EmailModule,
    FileStoreModule,
    PdfModule,
    LoggerModule,
  ],
})
export class InfraModule {}
