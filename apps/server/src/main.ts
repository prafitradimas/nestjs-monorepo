import { AppModule } from './app.module';

import { Logger } from 'nestjs-pino';
import { ServerFactory } from './server.factory';

async function bootstrap(): Promise<void> {
  const app = await ServerFactory.create(AppModule);

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

void bootstrap();
