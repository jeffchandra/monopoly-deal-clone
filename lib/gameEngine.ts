import { Game, Player } from "../types/game";
import { Card, PropertyCard } from "../types/card";
import { createTestDeck, shuffleDeck } from "./deck";

export function createPlayer(
  id: string,
  name: string
): Player {
  return {
    id,
    name,
    hand: [],
    bank: [],
    propertySets: [],
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

export function getPlayerById(
  game: Game,
  playerId: string
): Player {
  const player =
    game.players.find(
      p => p.id === playerId
    );

  if (!player) {
    throw new Error(
      `Player ${playerId} not found`
    );
  }

  return player;
}

export function getCurrentPlayer(
  game: Game
): Player {
  return getPlayerById(
    game,
    game.currentPlayerId
  );
}

export function drawCard(
  game: Game,
  playerId: string
): Card {
  const player =
    getPlayerById(
      game,
      playerId
    );

  const card = game.deck.pop();

  if (!card) {
    throw new Error(
      "Deck is empty"
    );
  }

  player.hand.push(card);

  return card;
}

export function dealOpeningHands(
  game: Game
): void {
  const OPENING_HAND_SIZE = 5;

  for (
    let i = 0;
    i < OPENING_HAND_SIZE;
    i++
  ) {
    for (
      const player of game.players
    ) {
      drawCard(
        game,
        player.id
      );
    }
  }
}

export function startGame(
  game: Game
): void {
  game.deck = shuffleDeck(
    createTestDeck()
  );

  dealOpeningHands(game);
}

export function startTurn(
  game: Game
): void {
  const player =
    getCurrentPlayer(game);

  drawCard(
    game,
    player.id
  );

  drawCard(
    game,
    player.id
  );
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

export function advanceTurn(
  game: Game
): void {
  endTurn(game);

  startTurn(game);
}

export function playCard(
  game: Game,
  playerId: string,
  cardId: string
): void {
  const player =
    getPlayerById(
      game,
      playerId
    );

  const cardIndex =
    player.hand.findIndex(
      card =>
        card.id === cardId
    );

  if (cardIndex === -1) {
    throw new Error(
      "Card not found in hand"
    );
  }

  const card =
    player.hand[cardIndex];

  player.hand.splice(
    cardIndex,
    1
  );

  if (card.type === "money") {
    player.bank.push(card);
    return;
  }

  if (
    card.type === "property"
  ) {
    const propertyCard =
      card as PropertyCard;

    addPropertyToBoard(
      player,
      propertyCard
    );
    
    return;
  }

  throw new Error(
    `Unsupported card type: ${card.type}`
  );
}

function addPropertyToBoard(
  player: Player,
  propertyCard: PropertyCard
) {
  const existingSet =
    player.propertySets.find(
      set =>
        set.color ===
        propertyCard.activeColor
    );

  if (existingSet) {
    existingSet.properties.push(
      propertyCard
    );

    return;
  }

  player.propertySets.push({
    id: crypto.randomUUID(),

    color:
      propertyCard.activeColor,

    properties: [
      propertyCard,
    ],

    house: null,

    hotel: null,
  });
}