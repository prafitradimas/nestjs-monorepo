import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DateTime } from 'luxon';

type Serializable =
  | string
  | null
  | Serializable[]
  | { [key: string]: Serializable };

@Injectable()
export class DateTimeSerializerInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<Serializable> {
    return next.handle().pipe(map((data) => this.serializeDateTime(data)));
  }

  private serializeDateTime(data: any): Serializable {
    if (data instanceof DateTime) {
      return data.toISO();
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.serializeDateTime(item));
    }

    if (data && typeof data === 'object') {
      const serializedObject: { [key: string]: Serializable } = {};
      for (const [key, value] of Object.entries(data as Record<string, any>)) {
        serializedObject[key] = this.serializeDateTime(value);
      }
      return serializedObject;
    }

    return data as Serializable;
  }
}
