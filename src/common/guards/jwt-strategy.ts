// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { JwtPayload } from './jwt-payload.interface'; // Define this interface according to your needs
// import { AuthService } from './auth.service'; // Import your AuthService

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(private readonly authService: AuthService) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKey: 'your_jwt_secret', // Use your secret key here
//     });
//   }

//   async validate(payload: JwtPayload) {
//     // You can add your user validation logic here
//     return await this.authService.validateUser(payload);
//   }
// }
