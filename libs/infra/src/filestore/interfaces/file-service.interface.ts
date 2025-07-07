import { File } from '@nest-lab/fastify-multer';

export interface FileService {
  get(relativePath: Readonly<string>): Promise<File>;
  save(relativePath: Readonly<string>, file: File): Promise<string>;
  delete(relativePath: Readonly<string>): Promise<void>;
}
