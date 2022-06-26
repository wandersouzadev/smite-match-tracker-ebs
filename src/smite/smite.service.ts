import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import HirezSignatureTs from 'hirez-signature-ts';
import { HirezApiMethods } from 'hirez-signature-ts/lib/types';
import { lastValueFrom, map } from 'rxjs';
import { verifyMatchPlayers } from './helpers/verify-match-players';
import { CreateSession } from './types/create-session';
import { GetMatchPlayerDetails } from './types/get-mach-player-details';
import { GetPlayer } from './types/get-player';
import { GetPlayerByGamerTag } from './types/get-player-id-by-gamer-tag';
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
    Logger.debug('call create signature');
    return HirezSignatureTs.createSignature({
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
    try {
      Logger.debug(`${this.hirezAuthKey} ${this.hirezDevId}`);
      Logger.debug(
        'SMITE API CALL method: ' + args.apiMethod + ' query: ' + args.query
      );
      const query = args?.query?.length ? `/${args.query}` : '';

      const { signature, timestamp } = this.createSignature(args.apiMethod);
      let session = await this.cacheManager.get('session_id');
      if (!session) {
        session = await this.createSession();
        await this.cacheManager.set('session_id', session);
      }
      return lastValueFrom(
        this.httpService
          .get<T | any>(
            `/${args.apiMethod}${this.returnType}/${
              this.hirezDevId
            }/${signature}/${session}/${timestamp}${encodeURIComponent(query)}`
          )
          .pipe(map((response) => response.data))
      );
    } catch (error) {
      Logger.error(error);
    }
  }

  //
  private createSession() {
    const method: HirezApiMethods = 'createsession';
    try {
      const { signature, timestamp } = this.createSignature(method);
      const request = this.httpService
        .get<CreateSession>(
          `/${method}${this.returnType}/${this.hirezDevId}/${signature}/${timestamp}`
        )
        .pipe(map((res) => res.data.session_id));
      return lastValueFrom(request);
    } catch (error) {
      Logger.error(error);
    }
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
    const method: HirezApiMethods = 'searchplayers';
    try {
      const cachedSearchResult = await this.cacheManager.get(
        `${method}-${accountName}`
      );
      if (cachedSearchResult) {
        return JSON.parse(String(cachedSearchResult)) as SearchPlayers;
      }

      const searchPlayersResponse = await this.smiteRestCall<SearchPlayers[]>({
        apiMethod: method,
        query: accountName
      });

      const accounts = searchPlayersResponse.slice(0, 9);
      await this.cacheManager.set(
        `${method}-${accountName}`,
        JSON.stringify(accounts),
        { ttl: 60 * 60 }
      );

      return accounts;
    } catch (error) {
      Logger.error(error);
    }
  }

  async getPlayerInfoByGamerTag(accountName: string, portalId: string) {
    const method: HirezApiMethods = 'getplayeridsbygamertag';
    try {
      const cachedPlayerData = await this.cacheManager.get(
        `${method}-${accountName}-${portalId}`
      );
      if (cachedPlayerData) {
        return JSON.parse(String(cachedPlayerData)) as GetPlayerByGamerTag;
      }

      const getPlayerIdByGamerTagResponse = await this.smiteRestCall<
        GetPlayerByGamerTag[]
      >({
        apiMethod: method,
        query: `${portalId}/${accountName}`
      });

      const playerInfo = getPlayerIdByGamerTagResponse.shift();
      Logger.debug('before');
      Logger.debug(playerInfo);

      await this.cacheManager.set(
        `${method}-${accountName}-${portalId}`,
        JSON.stringify(playerInfo),
        { ttl: 60 * 60 }
      );
    } catch (error) {
      Logger.error(error);
    }
  }

  async getPlayerWithPortal(accountNameOrId: string, portalId: string) {
    const method: HirezApiMethods = 'getplayer';
    try {
      const cachedPlayerData = await this.cacheManager.get(
        `${method}-${accountNameOrId}-${portalId}`
      );
      if (cachedPlayerData) {
        return JSON.parse(String(cachedPlayerData)) as GetPlayer;
      }
      const getPlayerWithPortalResponse = await this.smiteRestCall<GetPlayer[]>(
        {
          apiMethod: method,
          query: `${accountNameOrId}`
        }
      );

      const playerData = getPlayerWithPortalResponse.shift();

      await this.cacheManager.set(
        `${method}-${accountNameOrId}-${portalId}`,
        JSON.stringify(playerData),
        { ttl: 60 * 60 }
      );

      return playerData;
    } catch (error) {
      Logger.error(error);
    }
  }

  async getPlayer(accountName: string | number) {
    const method: HirezApiMethods = 'getplayer';
    try {
      const cachedPlayerData = await this.cacheManager.get(
        `${method}-${accountName}`
      );
      if (cachedPlayerData) {
        return JSON.parse(String(cachedPlayerData)) as GetPlayer;
      }

      const getPlayerResponse = await this.smiteRestCall<GetPlayer[]>({
        apiMethod: method,
        query: `${accountName}`
      });

      const playerData = getPlayerResponse.shift();

      // player profile cache 1 hour //
      await this.cacheManager.set(
        `${method}-${accountName}`,
        JSON.stringify(playerData),
        { ttl: 60 * 60 }
      );

      return playerData;
    } catch (error) {
      Logger.error(error);
    }
  }

  async getPlayerStatus(playerNameOrId: string | number) {
    const method: HirezApiMethods = 'getplayerstatus';
    try {
      const cachedPlayerStatus = await this.cacheManager.get(
        `${method}-${playerNameOrId}`
      );
      if (cachedPlayerStatus) {
        return JSON.parse(String(cachedPlayerStatus)) as GetPlayerStatus;
      }
      const getPlayerStatusResponse = await this.smiteRestCall<
        GetPlayerStatus[]
      >({
        apiMethod: method,
        query: `${playerNameOrId}`
      });

      const playerStatus = getPlayerStatusResponse.shift();

      // player status cache 1 minute //
      await this.cacheManager.set(
        `${method}-${playerNameOrId}`,
        JSON.stringify(playerStatus),
        { ttl: 60 * 1 }
      );

      return playerStatus;
    } catch (error) {
      Logger.error(error);
    }
  }

  async getMatch(matchId: number) {
    const method: HirezApiMethods = 'getmatchplayerdetails';
    try {
      const cachedMatch = await this.cacheManager.get(`${method}-${matchId}`);
      if (cachedMatch) {
        return JSON.parse(String(cachedMatch)) as GetMatchPlayerDetails;
      }
      const getMatchResponse = await this.smiteRestCall<
        GetMatchPlayerDetails[]
      >({
        apiMethod: method,
        query: `${matchId}`
      });

      Logger.debug({
        msg: 'FILA',
        id: getMatchResponse[0].Queue
      });
      Logger.debug({
        msg: 'TAMANHO DOS 2 TIMES',
        length: getMatchResponse.length
      });
      const isCompleteTeam = verifyMatchPlayers(
        getMatchResponse[0].Queue,
        getMatchResponse
      );

      Logger.debug({
        msg: 'isCompleteTeam',
        value: isCompleteTeam
      });

      // if player DC lower cache time to try find player
      if (!isCompleteTeam) {
        await this.cacheManager.set(
          `${method}-${matchId}`,
          JSON.stringify(getMatchResponse),
          { ttl: 60 * 1 }
        );
        return getMatchResponse;
      }

      // matches with 2 hour cache
      await this.cacheManager.set(
        `${method}-${matchId}`,
        JSON.stringify(getMatchResponse),
        { ttl: 60 * 130 }
      );

      return getMatchResponse;
    } catch (error) {
      Logger.log(error);
    }
  }
}
