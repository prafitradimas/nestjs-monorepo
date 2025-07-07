import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { AppConfig } from '@lib/configuration/configuration.type';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (cfg: ConfigService<AppConfig>) => {
        const opts = cfg.get<AppConfig>('mailer');
        const templatePath = path.resolve(
          process.cwd(),
          'assets',
          'email',
          'templates',
        );

        return {
          ...opts,
          template: {
            adapter: new HandlebarsAdapter(),
            dir: templatePath,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
