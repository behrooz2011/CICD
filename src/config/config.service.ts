import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService<EnvironmentVariables>) {}

  get port(): number {
    return this.configService.get<number>('PORT') || 3000;
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV') || 'development';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get mongodbUri(): string {
    return (
      this.configService.get<string>('MONGODB_URI') ||
      'mongodb://localhost:27017/task-management'
    );
  }

  get jwtSecret(): string {
    return (
      this.configService.get<string>('JWT_SECRET') || 'your_jwt_secret_key_here'
    );
  }

  get jwtExpiration(): string {
    return this.configService.get<string>('JWT_EXPIRATION') || '1h';
  }

  get jwtRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'your_jwt_refresh_secret_key_here'
    );
  }

  get jwtRefreshExpiration(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
  }
}
