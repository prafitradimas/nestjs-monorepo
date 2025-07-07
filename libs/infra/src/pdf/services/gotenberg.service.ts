import { Chromiumly, HtmlConverter } from 'chromiumly';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PdfService } from '../interfaces/pdf-service.interface';
import * as path from 'path';
import * as fs from 'fs';
import * as hbs from 'handlebars';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@lib/configuration/configuration.type';

@Injectable()
export class GotenbergService implements PdfService {
  private readonly TEMPLATE_DIR = path.resolve(
    process.cwd(),
    'assets',
    'pdf',
    'templates',
  );
  private readonly logger: Logger = new Logger(GotenbergService.name);
  private readonly htmlConverter: HtmlConverter;
  private readonly config: {
    endpoint: string;
    username?: string;
    password?: string;
    customHttpHeaders?: Record<string, string>;
  };

  constructor(protected readonly configService: ConfigService<AppConfig>) {
    this.config = configService.get<{
      endpoint: string;
      username?: string;
      password?: string;
      customHttpHeaders?: Record<string, string>;
    }>('gotenberg')!;

    Chromiumly.configure(this.config);
    this.htmlConverter = new HtmlConverter();
  }

  private async ping() {
    this.logger.debug(`sending ping to gotenberg`);

    const auth =
      this.config.username && this.config.password
        ? Buffer.from(
            `${this.config.username}:${this.config.password}`,
          ).toString('base64')
        : undefined;

    const res = await fetch(new URL('/health', this.config.endpoint), {
      headers: !auth
        ? undefined
        : {
            Authorization: `Basic ${auth}`,
          },
    });

    if (!res.ok) {
      throw new HttpException(
        {
          message: `pdf service is down status: ${res.status} ${res.statusText}`,
          details: await res.text(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async fromHtml(html: string): Promise<Buffer> {
    await this.ping();

    const buffer = await this.htmlConverter.convert({
      html: Buffer.from(html, 'utf-8'),
    });
    return buffer;
  }

  async fromHtmlTemplate(template: string, data: Object): Promise<Buffer> {
    const _templatePath = path.resolve(this.TEMPLATE_DIR, template);
    this.logger.debug(`Reading template from ${_templatePath}`);

    const source = await fs.promises.readFile(_templatePath, 'utf8');
    this.logger.debug(`Compiling template`);
    const templateCtx = hbs.compile(source);
    const content = templateCtx(data);

    return this.fromHtml(content);
  }
}
