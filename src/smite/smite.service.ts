import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { HirezSignature } from 'hirez-signature-ts';
import { HirezApiMethods } from 'hirez-signature-ts/lib/types';
import { lastValueFrom, map } from 'rxjs';
import { CreateSession } from './types/create-session';
import { GetMatchPlayerDetails } from './types/get-mach-player-details';
import { GetPlayer } from './types/get-player';
import { GetPlayerStatus } from './types/get-player-status';
import { SearchPlayers } from './types/search-player';

@Injectable()
export class SmiteService {
  private readonly returnType: string = 'json';
  private readonly hirezDevId: string = process.env.HIREZ_DEV_ID;
  private readonly hirezAuthKey: string = process.env.HIREZ_AUTH_KEY;
  private readonly cacheTime: number = 60 * 2; // 2 minutes
  constructor(
    private httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  //
  private createSignature(method: HirezApiMethods): {
    signature: string;
    timestamp: string;
  } {
    return HirezSignature.createSignature({
      hirezDevId: this.hirezDevId,
      hirezAuthKey: this.hirezAuthKey,
      method
    });
  }

  //
  private async smiteRestCall<T>(args: {
    apiMethod: HirezApiMethods;
    query?: string;
  }): Promise<T> {
    const cachedResult = await this.cacheManager.get(
      `${args.apiMethod}-${args.query}`
    );

    if (cachedResult) {
      return JSON.parse(cachedResult as string) as T;
    }
    const query = args?.query?.length ? `/${args.query}` : '';

    const { signature, timestamp } = this.createSignature(args.apiMethod);
    let session = await this.cacheManager.get('session_id');
    if (!session) {
      session = await this.createSession();
      await this.cacheManager.set('session_id', session);
    }
    const data = await lastValueFrom(
      this.httpService
        .get<T | any>(
          `/${args.apiMethod}${this.returnType}/${this.hirezDevId}/${signature}/${session}/${timestamp}${query}`
        )
        .pipe(map((response) => response.data))
    );

    if (data) {
      await this.cacheManager.set(
        `${args.apiMethod}-${args.query}`,
        JSON.stringify(data),
        {
          ttl: this.cacheTime
        }
      );
    }
    return data;
  }

  //
  private createSession() {
    const method = 'createsession';
    const { signature, timestamp } = this.createSignature(method);
    const request = this.httpService
      .get<CreateSession>(
        `/${method}${this.returnType}/${this.hirezDevId}/${signature}/${timestamp}`
      )
      .pipe(map((res) => res.data.session_id));
    return lastValueFrom(request);
  }

  async ping(): Promise<string> {
    return lastValueFrom(
      this.httpService
        .get(`/ping${this.returnType}`)
        .pipe(map((response) => response.data))
    );
  }

  async testSession() {
    return this.smiteRestCall({
      apiMethod: 'testsession'
    });
  }

  async getDataUsed() {
    return this.smiteRestCall({
      apiMethod: 'getdataused'
    });
  }

  async getHirezServerStatus() {
    return this.smiteRestCall({
      apiMethod: 'gethirezserverstatus'
    });
  }

  async searchAccounts(accountName: string) {
    return this.smiteRestCall<SearchPlayers[]>({
      apiMethod: 'searchplayers',
      query: accountName
    })
      .then((accounts) => accounts.slice(0, 9))
      .catch(Logger.error);
  }

  async getPlayer(accountName: string) {
    return this.smiteRestCall<GetPlayer[]>({
      apiMethod: 'getplayer',
      query: accountName
    })
      .then((playerInfo) => playerInfo.shift())
      .catch(Logger.error);
  }

  async getPlayerWithPortal(playerName: string, portalId: string) {
    return this.smiteRestCall<GetPlayer[]>({
      apiMethod: 'getplayer',
      query: `${playerName}/${portalId}`
    })
      .then((playerInfo) => playerInfo.shift())
      .catch(Logger.error);
  }

  async getPlayerStatus(playerNameOrId: string | number) {
    return this.smiteRestCall<GetPlayerStatus[]>({
      apiMethod: 'getplayerstatus',
      query: `${playerNameOrId}`
    }).then((playerStatus) => playerStatus.shift());
  }

  async getMatch(matchId: number) {
    return this.smiteRestCall<GetMatchPlayerDetails[]>({
      apiMethod: 'getmatchplayerdetails',
      query: `${matchId}`
    });
  }
}
