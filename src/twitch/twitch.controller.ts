import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TwitchJwtTokenPayload } from 'src/auth/types/jwt-payload';
import { GetTwitchPayload } from 'src/shared/user.decorator';
import { TwitchService } from './twitch.service';
import { BroadcasterSettings } from './types/broadcaster-settings';

@UseGuards(JwtAuthGuard)
@Controller('twitch')
export class TwitchController {
  constructor(
    private readonly twitchService: TwitchService,
    private readonly authService: AuthService
  ) {}

  @Get('configuration/settings')
  async getBroadcasterSettings(
    @GetTwitchPayload() twitchUser: TwitchJwtTokenPayload
  ) {
    Logger.log('call get config');
    Logger.log(twitchUser);
    return await this.twitchService.getBroadcasterSettings(
      twitchUser.channel_id
    );
  }

  @Post('configuration/settings')
  async setBroadcasterSettings(
    @GetTwitchPayload() twitchUser: TwitchJwtTokenPayload,
    @Body() settings: BroadcasterSettings
  ) {
    Logger.debug('call post config');
    Logger.log(twitchUser);
    Logger.log(settings);
    await this.twitchService.setBroadcasterSettings(
      twitchUser.channel_id,
      settings
    );
    return settings;
  }

  @Get('configuration/segment')
  async getConfigurationService(
    @GetTwitchPayload() twitchUser: TwitchJwtTokenPayload
  ) {
    const segment = await this.twitchService.getConfigurationSegment(
      'broadcaster',
      twitchUser.channel_id
    );
    Logger.debug('segment-RESPONSE');
    console.log(segment);
    return segment;
  }

  @Get('search/channel')
  async getChannel(@Query('broadcaster_id') channelId: string) {
    Logger.log(channelId);
    if (!channelId) {
      return new BadRequestException();
    }
    return this.twitchService.getChannelInformation(channelId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search/user')
  async getUser(@Query('id') userId: string) {
    Logger.log(userId);
    if (!userId) {
      return new BadRequestException();
    }
    return this.twitchService.getUser(userId);
  }
}
