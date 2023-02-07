import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { lastValueFrom, map } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
import { BroadcasterSettings } from './types/broadcaster-settings';
import { GetChannelInformation } from './types/get-channel-information';
import { GetConfigurationSegment } from './types/get-configuration-segment';
import { GetUser } from './types/get-user';
import { OauthAuthorize } from './types/oauth-authorize';

@Injectable()
export class TwitchService {
  constructor(
    private readonly httpService: HttpService,
    private readonly authService: AuthService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}
  private async twitchCall<T>(args: {
    method: string;
    url: string;
    params?: any;
    token?: string;
    segmentToken?: string;
  }): Promise<T> {
    let cachedToken = await this.cacheManager.get('twitch_app_access_token');
    if (!cachedToken) {
      Logger.debug('no token');
      Logger.debug(args.token);
      cachedToken = await this.getAccessToken();
      Logger.debug(cachedToken);
      Logger.debug('dle');
    }
    return lastValueFrom(
      this.httpService
        .request<T | any>({
          method: args.method as any,
          url: `${process.env.TWITCH_API_URL}${args.url}`,
          params: args.params,
          headers: {
            Authorization: `Bearer ${args.segmentToken || cachedToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID
          }
        })
        .pipe(map((response) => response.data.data))
    );
  }

  private async getAccessToken(): Promise<OauthAuthorize> {
    const oauthResponse = await lastValueFrom(
      this.httpService
        .request({
          method: 'POST',
          url: 'https://id.twitch.tv/oauth2/token',
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          params: {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_SECRET,
            grant_type: 'client_credentials'
          }
        })

        .pipe(map((response) => response.data))
    );
    await this.cacheManager.set(
      'twitch_app_access_token',
      oauthResponse.access_token,
      { ttl: 60 * 24 * 50 }
    );
    return oauthResponse.access_token;
  }

  async getChannelInformation(
    channelId: string
  ): Promise<GetChannelInformation> {
    return this.twitchCall<GetChannelInformation>({
      method: 'GET',
      url: '/channels',
      params: {
        broadcaster_id: channelId
      }
    });
  }
  async getUser(userId: string) {
    return this.twitchCall<GetUser[]>({
      method: 'GET',
      url: '/users',
      params: {
        id: userId
      }
    })
      .then((user) => user[0])
      .catch(Logger.error);
  }

  async getConfigurationSegment(
    segment: 'broadcaster' | 'developer' | 'global',
    broadcasterId: string
  ) {
    const token = await this.authService.encode({
      user_id: broadcasterId,
      role: 'external'
    });
    Logger.debug(token);
    Logger.debug(broadcasterId);
    return this.twitchCall<GetConfigurationSegment[]>({
      method: 'GET',
      url: '/extensions/configurations',
      params: {
        extension_id: process.env.TWITCH_CLIENT_ID,
        broadcaster_id: broadcasterId,
        segment
      },
      segmentToken: token
    })
      .then((response) => response.shift())
      .catch(Logger.error);
  }

  async getBroadcasterSettings(twitchChannelId: string) {
    try {
      const response = await this.cacheManager.get<string>(
        `streamer-${twitchChannelId}-settings`
      );
      return JSON.parse(response) as BroadcasterSettings;
    } catch (error) {
      Logger.error;
    }
  }
  async setBroadcasterSettings(
    twitchChannelId: string,
    settings: BroadcasterSettings
  ) {
    try {
      await this.cacheManager.set(
        `streamer-${twitchChannelId}-settings`,
        JSON.stringify(settings),
        { ttl: 0 }
      );
    } catch (error) {
      Logger.error;
    }
  }
}
