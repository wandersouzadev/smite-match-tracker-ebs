import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Query
} from '@nestjs/common';
import { TwitchService } from './twitch.service';

@Controller('public-api/twitch')
export class TwitchController {
  constructor(private readonly twitchService: TwitchService) {}

  async getChannel(@Query('broadcaster_id') channelId: string) {
    Logger.log(channelId);
    if (!channelId) {
      return new BadRequestException();
    }
    return this.twitchService.getChannelInformation(channelId);
  }

  @Get('search/user')
  async getUser(@Query('id') userId: string) {
    Logger.log(userId);
    if (!userId) {
      return new BadRequestException();
    }
    return this.twitchService.getUser(userId);
  }
}
