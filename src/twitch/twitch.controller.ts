import {
    BadRequestException,
    Controller,
    Get,
    Logger,
    Query,
    UseGuards
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TwitchJwtTokenPayload } from 'src/auth/types/jwt-payload';
import { GetTwitchPayload } from 'src/shared/user.decorator';
import { TwitchService } from './twitch.service';

@UseGuards(JwtAuthGuard)
@Controller('twitch')
export class TwitchController {
  constructor(
    private readonly twitchService: TwitchService,
    private readonly authService: AuthService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('configuration/segment')
  async getConfigurationService(
    @GetTwitchPayload() twitchUser: TwitchJwtTokenPayload
  ) {
    return this.twitchService.getConfigurationSegment(
      'broadcaster',
      twitchUser.channel_id
    );
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
