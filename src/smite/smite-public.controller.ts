import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Query
} from '@nestjs/common';
import { SmiteService } from './smite.service';

@Controller('public/smite')
export class SmitePublicController {
  constructor(private smiteApiService: SmiteService) {}

  @Get('ping')
  async ping() {
    return this.smiteApiService.ping();
  }

  @Get('/test-session')
  async testSession() {
    return this.smiteApiService.testSession();
  }

  @Get('/data-used')
  async getDataUsed() {
    return this.smiteApiService.getDataUsed();
  }

  @Get('/hirez-server-status')
  async getHirezServerStatus() {
    return this.smiteApiService.getHirezServerStatus();
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
  async getPlayer(@Query('account_name') accountName: string) {
    Logger.debug(`call /player ${accountName}`);
    if (!accountName) {
      return new BadRequestException('Missing query param name');
    }
    const player = await this.smiteApiService.getPlayer(accountName);

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
  async getMatch(@Query('account_name') accountName: string) {
    const playerStatus = await this.smiteApiService.getPlayerStatus(
      accountName
    );
    if (!playerStatus.Match) {
      return new Error('This player is not in match');
    }

    return this.smiteApiService.getMatch(playerStatus.Match);
  }
}
