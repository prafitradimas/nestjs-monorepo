import { File } from '@nest-lab/fastify-multer';
import * as AWS from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileService } from '../interfaces/file-service.interface';
import { AppConfig } from '@lib/configuration/configuration.type';

@Injectable()
export class S3FileService implements FileService {
  protected readonly s3: AWS.S3;
  #config: {
    endpoint: string;
    region: string;
    bucketName: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };

  constructor(protected readonly config: ConfigService<AppConfig>) {
    const cfg = config.get('s3');
    if (!cfg) {
      throw new Error('Expected non-nullable s3 config');
    }
    this.#config = cfg;
    this.s3 = new AWS.S3(this.#config);
  }

  async get(relativePath: Readonly<string>): Promise<File> {
    const s3Obj = await this.s3.getObject({
      Bucket: this.#config.bucketName,
      Key: relativePath,
    });

    const fileResult: File = {
      filename: relativePath,
      fieldname: '',
      originalname: '',
      encoding: '',
      mimetype: '',
    };

    if (s3Obj) {
      fileResult.filename = relativePath;
      fileResult.size = s3Obj.ContentLength;
      fileResult.mimetype = s3Obj.ContentType!;
      fileResult.encoding = s3Obj.ContentEncoding!;
      const buf = await s3Obj.Body?.transformToByteArray();
      fileResult.buffer = Buffer.from(buf || new Uint8Array());
    }

    return fileResult;
  }

  async save(relativePath: Readonly<string>, file: File): Promise<string> {
    await this.s3.send(
      new AWS.PutObjectCommand({
        Bucket: this.#config.bucketName,
        Key: relativePath,
        Body: file?.buffer,
        ContentType: file?.mimetype,
        ACL: 'public-read',
      }),
    );

    return relativePath;
  }

  async delete(relativePath: Readonly<string>): Promise<void> {
    await this.s3.send(
      new AWS.DeleteObjectCommand({
        Bucket: this.#config.bucketName,
        Key: relativePath,
      }),
    );
  }
}
