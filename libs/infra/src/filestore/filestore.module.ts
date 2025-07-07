import { Global, Module } from '@nestjs/common';
import { S3FileService } from './services/s3-file.service';

@Global()
@Module({
  imports: [],
  providers: [S3FileService],
  exports: [S3FileService],
})
export class FileStoreModule {}
