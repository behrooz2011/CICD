import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationPipe } from '../src/common/pipes/validation.pipe';
import { getModelToken } from '@nestjs/mongoose';
// import { User } from 'src/users/schemas/user.schema';
import { User } from '../src/users/schemas/user.schema';
import { Model } from 'mongoose';

describe('AuthController (e2e)', () => {
  console.log('--first describe--');
  let app: INestApplication;
  let token: string;
  let userModel: Model<User>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));

    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(new ValidationPipe());
    // app.setGlobalPrefix('api'); No prefix is needed

    await app.init();
  });
  afterEach(async () => {
    await userModel.deleteMany({});
  });

  afterAll(async () => {
    await userModel.db?.close();
    await app.close();
  });

  describe('Authentication', () => {
    it('should register a new userrr', () => {
      console.log('--REGISTER A USER --');
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          console.log('res.body.data: ', res.body.data);
          expect(res.body.data.data).toHaveProperty('user');
          expect(res.body.data.data).toHaveProperty('accessToken');
          expect(res.body.data.data).toHaveProperty('refreshToken');
          expect(res.body.data.data.user).toHaveProperty(
            'email',
            'john.doe@example.com',
          );

          // Save token for later tests
          token = res.body.data.accessToken;
          console.log('Token: ', token);
        });
    });

    it('should not register with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          firstName: 'jj',
          lastName: 'jjj',
          email: 'jj@example.com',
          password: '12345678',
        })
        .expect(400);
    });

    it('should login with valid credentials', async () => {
      // Ensure the user is registered before logging in
      await request(app.getHttpServer()).post('/auth/register').send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          expect(
            (res.body as { data: { data: { refreshToken: string } } }).data
              .data,
          ).toHaveProperty('user');
          expect(
            (res.body as { data: { data: { refreshToken: string } } }).data
              .data,
          ).toHaveProperty('accessToken');
          //   expect(res.body.data.data).toHaveProperty('refreshToken');
          expect(
            (res.body as { data: { data: { refreshToken: string } } }).data
              .data,
          ).toHaveProperty('refreshToken');
        });
    });

    it('should not login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });
  });
});
