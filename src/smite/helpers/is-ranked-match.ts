import { SmiteQueueIds } from './smite-queue-ids';

export const isRankedMatch = (queueId: number) => {
  switch (queueId) {
    case SmiteQueueIds.RankedConquest:
    case SmiteQueueIds.RankedConquestController:
    case SmiteQueueIds.RankedJoust:
    case SmiteQueueIds.RankedJoustController:
    case SmiteQueueIds.RankedDuel:
    case SmiteQueueIds.RankedDuelController:
      return true;
    default:
      return false;
  }
};
