import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Response } from 'express';

export interface ResponseData<T> {
  data: T;
  statusCode: number;
  timestamp: string;
  path: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseData<T>>
{
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseData<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const statusCode = response.statusCode;

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${method} ${url} ${statusCode} - ${Date.now() - now}ms`,
        );
      }),
      map((data) => ({
        data,
        statusCode,
        timestamp: new Date().toISOString(),
        path: url,
      })),
    );
  }
}
