import { GetMatchPlayerDetails } from '../types/get-mach-player-details';
import { GetPlayer } from '../types/get-player';
import { SmiteQueueIds } from './smite-queue-ids';

export const mapAdditionalRankedPlayerInfo = (
  matchId: number,
  matchPlayerData: GetMatchPlayerDetails,
  playerData: GetPlayer
): GetMatchPlayerDetails => {
  switch (matchId) {
    case SmiteQueueIds.RankedConquestController:
      return {
        ...matchPlayerData,
        tierWins: playerData.RankedConquestController?.Wins,
        tierLosses: playerData.RankedConquestController?.Losses,
        Tier: playerData.RankedConquestController?.Tier,
        Rank_Stat: playerData.RankedConquestController?.Rank_Stat
      };
    case SmiteQueueIds.RankedJoust:
    case SmiteQueueIds.Under30Joust:
      return {
        ...matchPlayerData,
        tierWins: playerData.RankedJoust?.Wins,
        tierLosses: playerData.RankedJoust?.Losses,
        Tier: playerData.RankedJoust?.Tier,
        Rank_Stat: playerData.RankedJoust?.Rank_Stat
      };
    case SmiteQueueIds.RankedJoustController:
      return {
        ...matchPlayerData,
        tierWins: playerData.RankedJoustController?.Wins,
        tierLosses: playerData.RankedJoustController?.Losses,
        Tier: playerData.RankedJoustController?.Tier,
        Rank_Stat: playerData.RankedJoustController?.Rank_Stat
      };
    case SmiteQueueIds.RankedDuel:
      return {
        ...matchPlayerData,
        tierWins: playerData.RankedDuel?.Wins,
        tierLosses: playerData.RankedDuel?.Losses,
        Tier: playerData.RankedDuel?.Tier,
        Rank_Stat: playerData.RankedDuel?.Rank_Stat
      };
    case SmiteQueueIds.RankedDuelController:
      return {
        ...matchPlayerData,
        tierWins: playerData.RankedDuelController?.Wins,
        tierLosses: playerData.RankedDuelController?.Losses,
        Tier: playerData.RankedDuelController?.Tier,
        Rank_Stat: playerData.RankedDuelController?.Rank_Stat
      };
    default:
      return {
        ...matchPlayerData,
        tierWins: playerData.RankedConquest?.Wins,
        tierLosses: playerData.RankedConquest?.Losses,
        Tier: playerData.RankedConquest?.Tier,
        Rank_Stat: playerData.RankedConquest?.Rank_Stat
      };
  }
};
