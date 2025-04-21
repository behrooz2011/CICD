import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// import { Test, TestingModule } from '@nestjs/testing';
// import { INestApplication } from '@nestjs/common';
// import * as request from 'supertest';
// import { AppModule } from '../src/app.module';
// import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
// import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
// import { ValidationPipe } from '../src/common/pipes/validation.pipe';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  //added
  afterAll(async () => {
    await app.close();
  });
  //

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  //added
  // it('/health (GET)', () => {
  //   return request(app.getHttpServer())
  //     .get('/api/health')
  //     .expect(200)
  //     .expect((res) => {
  //       expect(res.body).toHaveProperty('data');
  //       expect(res.body.data).toHaveProperty('status', 'ok');
  //     });
  // });
});
