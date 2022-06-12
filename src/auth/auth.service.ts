import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TwitchJwtTokenPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async verify(token: string) {
    Logger.debug('call VERIFY');
    const payload = this.jwtService.decode(token) as TwitchJwtTokenPayload;
    return payload;
  }

  async encode(data: any) {
    const tokenBody = {
      ...data
    };
    return this.jwtService.sign(tokenBody, {
      privateKey: Buffer.from(process.env.TWITCH_KEY, 'base64')
    });
  }
}
