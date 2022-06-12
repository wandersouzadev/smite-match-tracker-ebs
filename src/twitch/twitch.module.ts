import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { TwitchController } from './twitch.controller';
import { TwitchService } from './twitch.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    HttpModule.register({
      baseURL: process.env.TWITCH_API_URL
    })
  ],
  providers: [TwitchService],
  controllers: [TwitchController],
  exports: [TwitchService]
})
export class TwitchModule {}
