import { createParamDecorator, ExecutionContext } from '@nestjs/common';
interface CustomRequest extends Request {
  user: any; // Replace `any` with the actual type of your user object
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<CustomRequest>();
    return request.user;
  },
);
