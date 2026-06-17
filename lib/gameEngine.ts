import { Game, Player, PendingPayment } from "../types/game";
import { Card, RentCard, PropertyCard } from "../types/card";
import { createDeck, shuffleDeck } from "./deck";
import { isSetComplete, getCompletedSetCount, getRentForSet, getRentableSetsByCard } from "./propertyUtils";
import { getTotalAssets } from "./bankUtils";
import { PROPERTY_RULES } from "../data/propertyRules";

export function createPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    hand: [],
    bank: [],
    propertySets: [],
    pendingPlacements: [],
  };
}

export function createGame(players: Player[]): Game {
  return {
    id: crypto.randomUUID(),
    players,
    deck: [],
    discardPile: [],
    currentPlayerId: players[0].id,
    winnerId: null,
    config: {
      enableDealBreaker: false,
      enableWildCard: false,
      winCondition: 3,
    },
    actionsRemaining: 3,
    phase: "waitingToStart",
    pendingActions: [],
    log: [],
  };
}


export function addLog(game: Game, message: string): void {
  game.log = [message, ...game.log].slice(0, 50);
}

export function getPlayerById(game: Game, playerId: string): Player {
  const player = game.players.find(p => p.id === playerId);
  if (!player) throw new Error(`Player ${playerId} not found`);
  return player;
}

export function getCurrentPlayer(game: Game): Player {
  return getPlayerById(game, game.currentPlayerId);
}

export function getOpponents(game: Game, playerId: string): Player[] {
  return game.players.filter(p => p.id !== playerId);
}

export function drawCard(game: Game, playerId: string): void {
  if (game.deck.length === 0) {
    if (game.discardPile.length === 0) return;
    game.deck = shuffleDeck([...game.discardPile]);
    game.discardPile = [];
    addLog(game, "Deck reshuffled from discard pile.");
  }

  const card = game.deck.pop();
  if (!card) return;

  const player = getPlayerById(game, playerId);
  player.hand.push(card);
}

export function dealOpeningHands(game: Game): void {
  for (let i = 0; i < 5; i++) {
    for (const player of game.players) {
      drawCard(game, player.id);
    }
  }
}

export function startGame(game: Game): void {
  game.deck = shuffleDeck(createDeck());
  dealOpeningHands(game);
  game.phase = "drawPhase";
  addLog(game, "Game started! Each player was dealt 5 cards.");
}

export function startTurn(game: Game): void {
  if (game.phase !== "drawPhase") throw new Error("Not in draw phase");
  
  const player = getCurrentPlayer(game);
  drawCard(game, player.id);
  drawCard(game, player.id);
  game.actionsRemaining = 3;
  game.phase = "actionPhase";
  addLog(game, `${player.name} drew 2 cards.`);
}

export function checkWinCondition(game: Game): boolean {
  const current = getCurrentPlayer(game);
  const completedSets = getCompletedSetCount(current);
  if (completedSets >= game.config.winCondition) {
    game.winnerId = current.id;
    game.phase = "gameOver";
    addLog(game, `🏆 ${current.name} wins!`);
    return true;
  }
  return false;
}

export function endTurn(game: Game): void {
  if (game.phase === "pendingAction") {
    throw new Error("Cannot end turn — waiting for action response");
  }
  if (game.phase !== "actionPhase") {
    throw new Error("Not in action phase");
  }
  if (game.actionsRemaining > 0 && getCurrentPlayer(game).hand.length > 7) {
    throw new Error("You still have actions remaining");
  }

  const player = getCurrentPlayer(game);

  if (player.pendingPlacements.length > 0) {
    throw new Error("You must place all received properties first");
  }

  if (player.hand.length > 7) {
    game.phase = "discardPhase";
    addLog(game, `${player.name} has ${player.hand.length} cards — must discard down to 7.`);
    return;
  }

  advanceToNextPlayer(game);
}

function advanceToNextPlayer(game: Game): void {
  const idx = game.players.findIndex(p => p.id === game.currentPlayerId);
  const next = game.players[(idx + 1) % game.players.length];
  game.currentPlayerId = next.id;
  game.phase = "drawPhase";
  addLog(game, `It's ${next.name}'s turn.`);
}

export function discard(game: Game, playerId: string, cardIds: string[]): void {
  if (game.phase !== "discardPhase") throw new Error("Not in discard phase");

  const player = getPlayerById(game, playerId);
  const target = player.hand.length - 7;

  if (cardIds.length !== target) {
    throw new Error(`Must discard exactly ${target} card(s)`);
  }

  for (const id of cardIds) {
    const idx = player.hand.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Card not found in hand");
    game.discardPile.push(player.hand.splice(idx, 1)[0]);
  }

  addLog(game, `${player.name} discarded ${cardIds.length} card(s).`);
  advanceToNextPlayer(game);
}

export function placePropertyAsNewSet(
  game: Game,
  playerId: string,
  cardId: string
): void {
  if (game.phase !== "actionPhase") throw new Error("Not in action phase");
  if (game.actionsRemaining <= 0) throw new Error("No actions remaining");

  const player = getPlayerById(game, playerId);
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) throw new Error("Card not found in hand");

  const card = player.hand.splice(cardIdx, 1)[0];

  player.propertySets.push({
    id: crypto.randomUUID(),
    color: (card as import("../types/card").PropertyCard).activeColor,
    properties: [card as import("../types/card").PropertyCard],
    hasHouse: false,
    hasHotel: false,
  });

  game.actionsRemaining--;
  addLog(game, `${player.name} started a new set with ${card.name}.`);
  checkWinCondition(game);
}

export function placePropertyIntoSet(
  game: Game,
  playerId: string,
  cardId: string,
  setId: string
): void {
  if (game.phase !== "actionPhase") throw new Error("Not in action phase");
  if (game.actionsRemaining <= 0) throw new Error("No actions remaining");

  const player = getPlayerById(game, playerId);
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) throw new Error("Card not found in hand");

  const set = player.propertySets.find(s => s.id === setId);
  if (!set) throw new Error("Set not found");
  if (isSetComplete(set)) throw new Error("That set is already complete");

  const card = player.hand.splice(cardIdx, 1)[0] as import("../types/card").PropertyCard;

  if (card.activeColor !== set.color) throw new Error("Card color does not match set");

  set.properties.push(card);

  game.actionsRemaining--;
  addLog(game, `${player.name} added ${card.name} to their ${set.color} set.`);
  checkWinCondition(game);
}

export function playCardToBank(
  game: Game,
  playerId: string,
  cardId: string
): void {
  if (game.phase !== "actionPhase") throw new Error("Not in action phase");
  if (game.actionsRemaining <= 0) throw new Error("No actions remaining");

  const player = getPlayerById(game, playerId);
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) throw new Error("Card not found in hand");

  const card = player.hand.splice(cardIdx, 1)[0];

  if (card.type === "property") throw new Error("Properties cannot be banked — place them on the board");

  player.bank.push(card);
  game.actionsRemaining--;
  addLog(game, `${player.name} banked ${card.name} for $${card.value}M.`);
}

export function confirmPayment(
  game: Game,
  playerId: string,
  cardIds: string[]
): void {
  if (game.phase !== "pendingAction") throw new Error("No pending action");

  const pending = game.pendingActions[0];
  if (!pending) throw new Error("No pending action");
  if (
    pending.kind !== "payRent" &&
    pending.kind !== "payBirthday" &&
    pending.kind !== "payDebtCollector"
  ) throw new Error("Pending action is not a payment");
  if (pending.fromPlayerId !== playerId) throw new Error("Not your payment to make");

  const payer = getPlayerById(game, playerId);
  const receiver = getPlayerById(game, pending.toPlayerId);

  const totalAssets = getTotalAssets(payer);
  const amountOwed = pending.amountOwed;

  // Calculate value of selected cards
  let selectedValue = 0;
  for (const id of cardIds) {
    const bankCard = payer.bank.find(c => c.id === id);
    if (bankCard) {
      selectedValue += bankCard.value;
      continue;
    }
    for (const set of payer.propertySets) {
      if (isSetComplete(set)) continue;
      const prop = set.properties.find(c => c.id === id);
      if (prop) {
        selectedValue += prop.value;
        break;
      }
    }
  }

  // Must pay full amount, or everything they have if they can't afford it
  if (selectedValue < amountOwed && selectedValue < totalAssets) {
    throw new Error(`Must pay $${amountOwed}M or everything you have`);
  }

  for (const id of cardIds) {
    // Try bank first
    const bankIdx = payer.bank.findIndex(c => c.id === id);
    if (bankIdx !== -1) {
      receiver.bank.push(payer.bank.splice(bankIdx, 1)[0]);
      continue;
    }

    // Try incomplete property sets
    for (const set of payer.propertySets) {
      if (isSetComplete(set)) continue;
      const propIdx = set.properties.findIndex(c => c.id === id);
      if (propIdx !== -1) {
        const card = set.properties.splice(propIdx, 1)[0] as PropertyCard;
        // Clean up empty set
        if (set.properties.length === 0) {
          payer.propertySets = payer.propertySets.filter(s => s.id !== set.id);
        }
        receiver.pendingPlacements.push(card);
        break;
      }
    }
  }

  addLog(game, `${payer.name} paid $${selectedValue}M to ${receiver.name}.`);

  game.pendingActions.shift();
  if (game.pendingActions.length === 0) {
    game.phase = "actionPhase";
  }
}

export function getPayableSources(
  game: Game,
  playerId: string
): { bankCards: import("../types/card").Card[], incompleteSetCards: { setId: string, card: import("../types/card").PropertyCard }[] } {
  const player = getPlayerById(game, playerId);

  const bankCards = [...player.bank];

  const incompleteSetCards: { setId: string, card: import("../types/card").PropertyCard }[] = [];
  for (const set of player.propertySets) {
    if (isSetComplete(set)) continue;
    for (const card of set.properties) {
      incompleteSetCards.push({ setId: set.id, card });
    }
  }

  return { bankCards, incompleteSetCards };
}

export function playRentCard(
  game: Game,
  playerId: string,
  cardId: string,
  setId: string
): void {
  if (game.phase !== "actionPhase") throw new Error("Not in action phase");
  if (game.actionsRemaining <= 0) throw new Error("No actions remaining");

  const player = getPlayerById(game, playerId);
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) throw new Error("Card not found in hand");

  const card = player.hand[cardIdx];
  if (card.type !== "rent") throw new Error("Card is not a rent card");

  const rentCard = card as RentCard;
  const set = player.propertySets.find(s => s.id === setId);
  if (!set) throw new Error("Set not found");

  if (!rentCard.rentableColors.includes(set.color)) {
    throw new Error("This rent card does not cover that color");
  }

  const rentablesets = getRentableSetsByCard(player, rentCard);
  if (rentablesets.length === 0) {
    throw new Error("You have no matching properties to charge rent for");
  }

  const amount = getRentForSet(set);
  const opponents = getOpponents(game, playerId);

  // Remove card from hand and discard
  player.hand.splice(cardIdx, 1);
  game.discardPile.push(rentCard);
  game.actionsRemaining--;

  // Push a pending payment for each opponent
  for (const opponent of opponents) {
    const payment: PendingPayment = {
      kind: "payRent",
      fromPlayerId: opponent.id,
      toPlayerId: playerId,
      amountOwed: amount,
      selectedCardIds: [],
      blocked: false,
    };
    game.pendingActions.push(payment);
  }

  game.phase = "pendingAction";
  addLog(
    game,
    `${player.name} charged $${amount}M rent on ${PROPERTY_RULES[set.color].displayName}.`
  );
}

export function placePendingProperty(
  game: Game,
  playerId: string,
  cardId: string,
  targetSetId: string | null
): void {
  const player = getPlayerById(game, playerId);
  const cardIdx = player.pendingPlacements.findIndex(c => c.id === cardId);
  if (cardIdx === -1) throw new Error("Card not in pending placements");

  const card = player.pendingPlacements.splice(cardIdx, 1)[0];

  if (targetSetId === null) {
    // New set
    player.propertySets.push({
      id: crypto.randomUUID(),
      color: card.activeColor,
      properties: [card],
      hasHouse: false,
      hasHotel: false,
    });
  } else {
    // Existing set
    const set = player.propertySets.find(s => s.id === targetSetId);
    if (!set) throw new Error("Set not found");
    if (isSetComplete(set)) throw new Error("Set is already complete");
    if (set.color !== card.activeColor) throw new Error("Color mismatch");
    set.properties.push(card);
  }

  addLog(game, `${player.name} placed ${card.name}.`);
  checkWinCondition(game);
}