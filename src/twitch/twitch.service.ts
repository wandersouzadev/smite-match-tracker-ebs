import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { lastValueFrom, map } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
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
  }): Promise<T> {
    let cachedToken = await this.cacheManager.get('twitch_app_access_token');
    if (!cachedToken) {
      cachedToken = await this.getAccessToken();
    }
    return lastValueFrom(
      this.httpService
        .request<T | any>({
          method: args.method as any,
          url: args.url,
          params: args.params,
          headers: {
            Authorization: `Bearer ${args.token ?? cachedToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID
          }
        })
        .pipe(map((response) => response.data.data))
    );
  }

  private async getAccessToken(): Promise<OauthAuthorize> {
    const oauthResponse = await lastValueFrom(
      this.httpService
        .post(process.env.TWITCH_OAUTH_URL, {
          params: {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_SECRET,
            grant_type: 'client_credentials'
          },
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          }
        })
        .pipe(map((response) => response.data.data))
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
  async getUser(userId: string): Promise<GetUser> {
    return this.twitchCall<GetUser[]>({
      method: 'GET',
      url: '/users',
      params: {
        id: userId
      }
    }).then((user) => user[0]);
  }

  async getConfigurationSegment(
    segment: 'broadcaster' | 'developer' | 'global',
    broadcasterId: string
  ) {
    const token = await this.authService.encode({
      user_id: broadcasterId,
      role: 'external'
    });
    return this.twitchCall<GetConfigurationSegment[]>({
      method: 'GET',
      url: '/extensions/configurations',
      params: {
        extension_id: process.env.TWITCH_CLIENT_ID,
        broadcaster_id: broadcasterId,
        segment
      },
      token
    })
      .then((response) => response.shift())
      .catch(Logger.error);
  }
}
