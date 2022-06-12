export class TwitchJwtTokenPayload {
  exp: number;
  opaque_user_id: string;
  channel_id: string;
  role: string;
  is_unlinked: string;
  pubsub_perms: {
    listen: [string, string];
    send: [string, string];
  };
  iat: number;
}
