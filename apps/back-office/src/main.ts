import { Logger } from 'nestjs-pino';
import { ServerFactory } from 'apps/server/src/server.factory';
import { BackOfficeModule } from './back-office.module';

async function bootstrap() {
  const app = await ServerFactory.create(BackOfficeModule);

  const logger = app.get(Logger);
  await app.listen(
    process.env.APP_PORT ?? 3000,
    (err: Error | null, addr: string) => {
      if (err) {
        logger.error(err.message, 'boostrap');
      } else {
        logger.log(`Server is running at ${addr}`, 'bootstrap');
      }
    },
  );
}
bootstrap();
