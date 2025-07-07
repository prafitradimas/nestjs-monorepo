import { Module } from '@nestjs/common';
import { GotenbergService } from './services/gotenberg.service';

@Module({
  imports: [],
  providers: [GotenbergService],
  exports: [GotenbergService],
})
export class PdfModule {}
