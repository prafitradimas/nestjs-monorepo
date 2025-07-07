import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';
import { FastifyReply /* FastifyRequest */ } from 'fastify';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';

@Catch()
export class ErrorsFilter extends BaseExceptionFilter {
  public override catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    // const req = http.getRequest<FastifyRequest>();
    const res = http.getResponse<FastifyReply>();
    // const status = this.getHttpStatus(exception);

    if (
      exception instanceof TokenExpiredError ||
      exception instanceof JsonWebTokenError
    ) {
      res
        .status(HttpStatus.UNAUTHORIZED)
        .type('application/json')
        .send({ message: exception.message });
      return;
    }

    if (exception instanceof TypeORMError) {
      this.handleTypeORMError(res, exception);
      return;
    }

    super.catch(exception, host);
  }

  // private getHttpStatus(exception: unknown): HttpStatus {
  //   return exception instanceof HttpException
  //     ? exception.getStatus()
  //     : HttpStatus.INTERNAL_SERVER_ERROR;
  // }

  private handleTypeORMError(response: FastifyReply, err: Error) {
    if (
      err instanceof EntityNotFoundError ||
      err.message.includes('already exists')
    ) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .type('application/json')
        .send({ message: err.message });
    } else if (
      err instanceof QueryFailedError &&
      (err.message.includes('input value for enum') ||
        err.message.includes(
          'duplicate key value violates unique constraint',
        ) ||
        err.message.includes('violates foreign key constraint'))
    ) {
      response.status(HttpStatus.BAD_REQUEST);
      response.type('application/json');
      response.send({ message: err.message });
    } else {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .type('application/json')
        .send({ message: err.message });
    }
  }
}
