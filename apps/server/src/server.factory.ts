import {
  BadRequestException,
  ClassSerializerInterceptor,
  DynamicModule,
  HttpStatus,
  NestApplicationOptions,
  Type,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';

import fastifyHelmet from '@fastify/helmet';
import fastifyCsrf from '@fastify/csrf-protection';
import multipart from '@fastify/multipart';
import { DateTimeSerializerInterceptor } from './interceptors/datetime-serializer.interceptor';
import { ErrorsFilter } from './filters/error.filter';

type ModuleEntry = Type<any> | DynamicModule;

export class ServerFactory {
  static async create(module: ModuleEntry | Promise<ModuleEntry>) {
    const adapter = new FastifyAdapter({});
    const options: NestApplicationOptions = { bufferLogs: true };

    const app = await NestFactory.create<NestFastifyApplication>(
      module,
      adapter,
      options,
    );

    app.useGlobalInterceptors(
      new LoggerErrorInterceptor(),
      new DateTimeSerializerInterceptor(),
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        disableErrorMessages: false,
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: (validationErrors: ValidationError[]) => {
          return new BadRequestException({
            message: 'Validation error',
            errors: validationErrors,
          });
        },
      }),
    );

    app.useGlobalFilters(new ErrorsFilter());

    const logger = app.get(Logger);
    app.useLogger(logger);

    // https://github.com/iamolegga/nestjs-pino/issues/553
    app.flushLogs();

    app.enableCors({
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
      ],
    });

    await app.register(fastifyCsrf);
    await app.register(fastifyHelmet);
    await app.register(multipart);

    return app;
  }
}
