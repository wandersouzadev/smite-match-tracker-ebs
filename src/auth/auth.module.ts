import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    JwtModule.register({
      secret: Buffer.from(process.env.TWITCH_KEY, 'base64'),
      signOptions: { expiresIn: '60s' }
    })
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
