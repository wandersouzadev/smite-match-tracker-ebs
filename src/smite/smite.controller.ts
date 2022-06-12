import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Query,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TwitchJwtTokenPayload } from 'src/auth/types/jwt-payload';
import { GetTwitchPayload } from 'src/shared/user.decorator';
import { TwitchService } from 'src/twitch/twitch.service';
import { SmiteService } from './smite.service';
import { GetPlayer } from './types/get-player';

@UseGuards(JwtAuthGuard)
@Controller('smite')
export class SmiteController {
  constructor(
    private readonly smiteApiService: SmiteService,
    private readonly twitchService: TwitchService
  ) {}

  @Get('ping')
  async ping() {
    return this.smiteApiService.ping();
  }

  @Get('search')
  async searchAccount(@Query('account_name') accountName: string) {
    if (!accountName) {
      return new BadRequestException();
    }
    const accounts = await this.smiteApiService.searchAccounts(accountName);

    if (!accounts) {
      throw new BadRequestException('any player found');
    }

    return accounts;
  }

  @Get('player')
  async getPlayer(@Query('name') playerName: string) {
    if (!playerName) {
      return new BadRequestException('Missing query param name');
    }
    const player = await this.smiteApiService.getPlayerWithPortal(
      encodeURIComponent(playerName),
      '1'
    );

    if (!player) {
      throw new BadRequestException('player not found');
    }
    return player;
  }

  @Get('status')
  async getPlayerStatus(@Query('account_name') accountName: string) {
    return this.smiteApiService.getPlayerStatus(accountName);
  }

  @Get('live-match')
  async getMatch(@GetTwitchPayload() twitchPayload: TwitchJwtTokenPayload) {
    Logger.debug('call live-match');

    const broadcasterSegment = await this.twitchService.getConfigurationSegment(
      'broadcaster',
      twitchPayload.channel_id
    );

    if (!broadcasterSegment) {
      return;
    }

    Logger.log(broadcasterSegment);

    const smiteAccounts: Partial<GetPlayer[]> = JSON.parse(
      broadcasterSegment.content
    );
    const mainAccount = smiteAccounts.shift();

    const playerStatus = await this.smiteApiService.getPlayerStatus(
      mainAccount.Id
    );

    Logger.debug(playerStatus);

    if (!playerStatus.Match) {
      return playerStatus.status_string;
    }

    Logger.log(playerStatus);

    const teamsData = await this.smiteApiService.getMatch(playerStatus.Match);

    return {
      accountId: String(mainAccount.Id),
      queueId: String(playerStatus.match_queue_id),
      status: playerStatus.status_string,
      teamsData
    };
  }
}
