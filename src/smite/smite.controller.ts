import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
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

  @Get('player/@me')
  async getStreamerPlayer(
    @GetTwitchPayload() twitchPayload: TwitchJwtTokenPayload
  ) {
    const broadcasterSegment = await this.twitchService.getConfigurationSegment(
      'broadcaster',
      twitchPayload.channel_id
    );

    if (!broadcasterSegment) {
      return;
    }

    if (!broadcasterSegment?.content) {
      return;
    }

    const smiteAccounts: Partial<GetPlayer[]> = JSON.parse(
      broadcasterSegment.content
    );
    const mainAccount = smiteAccounts.shift();

    const playerData = await this.smiteApiService.getPlayer(mainAccount.Id);

    if (!playerData) {
      throw new InternalServerErrorException();
    }

    return playerData;
  }

  @Get('player')
  async getPlayer(
    @Query('account_name') accountName: string,
    @Query('portal_id') portalId?: string
  ) {
    Logger.debug({ accountName, portalId });
    if (!accountName) {
      throw new BadRequestException('Missing param account_name');
    }

    let player: GetPlayer;

    if (portalId) {
      Logger.debug('have portalId!!!');
      const playerInfo = await this.smiteApiService.getPlayerInfoByGamerTag(
        accountName,
        portalId
      );
      Logger.debug('playerInfo-by-gamer-tag response 🔽');
      Logger.debug(playerInfo);
      if (!playerInfo) {
        throw new BadRequestException('player not found');
      }
      player = await this.smiteApiService.getPlayerWithPortal(
        playerInfo.player_id.toString(),
        playerInfo.portal_id.toString()
      );
    } else {
      Logger.debug('else else');
      player = await this.smiteApiService.getPlayer(accountName);
    }

    if (!player) {
      throw new BadRequestException('Player not found');
    }
    return player;
  }

  @Get('status')
  async getPlayerStatus(@Query('account_name') accountName: string) {
    return this.smiteApiService.getPlayerStatus(accountName);
  }

  @Get('live-match')
  async getMatch(@GetTwitchPayload() twitchPayload: TwitchJwtTokenPayload) {
    const broadcasterSegment = await this.twitchService.getConfigurationSegment(
      'broadcaster',
      twitchPayload.channel_id
    );

    if (!broadcasterSegment) {
      return;
    }

    if (!broadcasterSegment?.content) {
      return;
    }

    const smiteAccounts: Partial<GetPlayer[]> = JSON.parse(
      broadcasterSegment.content
    );
    const mainAccount = smiteAccounts.shift();

    const playerStatus = await this.smiteApiService.getPlayerStatus(
      mainAccount.Id
    );

    if (!playerStatus.Match) {
      return playerStatus.status_string;
    }

    const teamsData = await this.smiteApiService.getMatch(playerStatus.Match);

    return {
      accountId: String(mainAccount.Id),
      queueId: String(playerStatus.match_queue_id),
      status: playerStatus.status_string,
      teamsData
    };
  }
}
