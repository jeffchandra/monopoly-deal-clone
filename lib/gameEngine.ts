import { Game, Player } from "../types/game";

export function createPlayer(
  id: string,
  name: string
): Player {
  return {
    id,
    name,
    hand: [],
    bank: [],
    propertyGroups: [],
  };
}

export function createGame(
  player1: Player,
  player2: Player
): Game {
  return {
    id: crypto.randomUUID(),

    players: [player1, player2],

    deck: [],

    discardPile: [],

    currentPlayerId: player1.id,

    winnerId: null,

    config: {
      enableDealBreaker: false,
    },
  };
}

export function endTurn(
  game: Game
): void {
  const currentIndex =
    game.players.findIndex(
      player =>
        player.id === game.currentPlayerId
    );

  const nextIndex =
    (currentIndex + 1) %
    game.players.length;

  game.currentPlayerId =
    game.players[nextIndex].id;
}