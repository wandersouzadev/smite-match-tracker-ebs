import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwitchModule } from 'src/twitch/twitch.module';
import { SmitePublicController } from './smite-public.controller';
import { SmiteController } from './smite.controller';
import { SmiteService } from './smite.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TwitchModule,
    HttpModule.register({
      baseURL: process.env.SMITE_API_URL
    })
  ],
  providers: [SmiteService],
  controllers: [SmiteController, SmitePublicController],
  exports: [SmiteService]
})
export class SmiteModule {}
