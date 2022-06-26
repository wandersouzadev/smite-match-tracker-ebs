import { GetMatchPlayerDetails } from '../types/get-mach-player-details';

export const verifyMatchPlayers = (
  queueId: string,
  matchPlayers: GetMatchPlayerDetails[]
) => {
  switch (queueId) {
    case '440':
    case '502':
      return matchPlayers.length === 2;
    case '450':
    case '448':
    case '10197':
    case '503':
      return matchPlayers.length === 6;
    case '426':
    case '451':
    case '435':
    case '445':
    case '10189':
    case '434':
    case '10195':
    case '10193':
    case '504':
      return matchPlayers.length === 10;
    default:
      return true;
  }
};
