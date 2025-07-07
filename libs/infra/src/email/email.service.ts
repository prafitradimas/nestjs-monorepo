import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { Attachment } from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  constructor(
    protected readonly service: MailerService,
    @InjectPinoLogger(EmailService.name)
    protected readonly logger: PinoLogger,
  ) {
    service.verifyAllTransporters().catch((e) => {
      logger.fatal(e, `failed to verify email's transporters`);
    });
  }

  async send(
    to: Readonly<string>,
    subject: Readonly<string>,
    template: Readonly<string>,
    params: Readonly<Record<string, any>>,
    attachments?: Attachment[],
  ): Promise<void> {
    try {
      await this.service.sendMail({
        to: to,
        subject: subject,
        template: template,
        context: {
          ...params,
        },
        attachments: attachments,
      });
    } catch (err: unknown) {
      this.logger.error(
        err,
        `Error while sending email to: %s, subject: %s, template: %s, params: %o`,
        to,
        subject,
        template,
        params,
      );

      throw err;
    }
  }
}
