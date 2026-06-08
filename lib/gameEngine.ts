import { Game, Player, PropertySet, PendingAction, PendingPayment, GamePhase } from "../types/game";
import { Card, PropertyCard, ActionCard, RentCard, PropertyColor } from "../types/card";
import { createFullDeck, shuffleDeck } from "./deck";
import { isSetComplete, getCompletedSetCount, getRentForSet, getIncompleteSetForColor } from "./propertyUtils";
import { collectPayment, getBankValue } from "./bankUtils";

// ─── Player / Game Creation ────────────────────────────────────────────────────

export function createPlayer(id: string, name: string): Player {
  return { id, name, hand: [], bank: [], propertySets: [] };
}

export function createGame(players: Player[], config?: Partial<Game["config"]>): Game {
  return {
    id: crypto.randomUUID(),
    players,
    deck: [],
    discardPile: [],
    currentPlayerId: players[0].id,
    winnerId: null,
    config: {
      enableDealBreaker: true,
      winCondition: 3,
      ...config,
    },
    actionsRemaining: 3,
    phase: "waitingToStart",
    pendingActions: [],
    log: [],
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function log(game: Game, message: string) {
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

// ─── Deck ─────────────────────────────────────────────────────────────────────

function ensureDeck(game: Game) {
  if (game.deck.length === 0) {
    if (game.discardPile.length === 0) return;
    game.deck = shuffleDeck([...game.discardPile]);
    game.discardPile = [];
    log(game, "Deck reshuffled from discard pile.");
  }
}

function drawCards(game: Game, playerId: string, count: number): Card[] {
  const player = getPlayerById(game, playerId);
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    ensureDeck(game);
    const card = game.deck.pop();
    if (!card) break;
    player.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

// ─── Game Flow ─────────────────────────────────────────────────────────────────

export function startGame(game: Game): void {
  game.deck = shuffleDeck(createFullDeck());
  // Deal 5 cards to each player
  for (let i = 0; i < 5; i++) {
    for (const player of game.players) {
      drawCards(game, player.id, 1);
    }
  }
  game.phase = "drawPhase";
  log(game, "Game started! Each player was dealt 5 cards.");
}

/** Called at the start of a player's turn to draw 2 cards */
export function startTurn(game: Game): void {
  if (game.phase !== "drawPhase") return;
  const player = getCurrentPlayer(game);
  const drawn = drawCards(game, player.id, 2);
  game.actionsRemaining = 3;
  game.phase = "actionPhase";
  log(game, `${player.name} drew ${drawn.length} card(s).`);
}

export function endTurn(game: Game): void {
  if (game.phase === "pendingAction") {
    throw new Error("Cannot end turn — waiting for action response");
  }

  const player = getCurrentPlayer(game);

  // Discard down to 7
  if (player.hand.length > 7) {
    game.phase = "discardPhase";
    return;
  }

  advanceToNextPlayer(game);
}

function advanceToNextPlayer(game: Game) {
  const idx = game.players.findIndex(p => p.id === game.currentPlayerId);
  const next = game.players[(idx + 1) % game.players.length];
  game.currentPlayerId = next.id;
  game.phase = "drawPhase";
  game.actionsRemaining = 3;
  log(game, `It's ${next.name}'s turn.`);
}

export function discard(game: Game, playerId: string, cardIds: string[]): void {
  if (game.phase !== "discardPhase") throw new Error("Not in discard phase");
  const player = getPlayerById(game, playerId);
  for (const id of cardIds) {
    const idx = player.hand.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Card not in hand");
    game.discardPile.push(player.hand.splice(idx, 1)[0]);
  }
  if (player.hand.length <= 7) {
    advanceToNextPlayer(game);
  }
}

// ─── Check Win ─────────────────────────────────────────────────────────────────

export function checkWinCondition(game: Game): boolean {
  for (const player of game.players) {
    if (getCompletedSetCount(player) >= game.config.winCondition) {
      game.winnerId = player.id;
      game.phase = "gameOver";
      log(game, `🏆 ${player.name} wins with ${game.config.winCondition} complete sets!`);
      return true;
    }
  }
  return false;
}

// ─── Property Helpers ─────────────────────────────────────────────────────────

function placePropertyOnBoard(player: Player, card: PropertyCard): void {
  const existing = getIncompleteSetForColor(player, card.activeColor);
  if (existing) {
    existing.properties.push(card);
  } else {
    player.propertySets.push({
      id: crypto.randomUUID(),
      color: card.activeColor,
      properties: [card],
      hasHouse: false,
      hasHotel: false,
    });
  }
}

function removePropertyFromBoard(player: Player, cardId: string): PropertyCard {
  for (const set of player.propertySets) {
    const idx = set.properties.findIndex(c => c.id === cardId);
    if (idx !== -1) {
      const card = set.properties.splice(idx, 1)[0];
      if (set.properties.length === 0) {
        player.propertySets = player.propertySets.filter(s => s.id !== set.id);
      }
      return card;
    }
  }
  throw new Error("Property not found on board");
}

export function getSetById(player: Player, setId: string): PropertySet {
  const set = player.propertySets.find(s => s.id === setId);
  if (!set) throw new Error("Set not found");
  return set;
}

/** Change the active color of a wildcard property already on the board */
export function flipWildCard(
  game: Game,
  playerId: string,
  cardId: string,
  newColor: PropertyColor
): void {
  const player = getPlayerById(game, playerId);
  const card = removePropertyFromBoard(player, cardId) as PropertyCard;
  if (!card.colors.includes(newColor)) throw new Error("Invalid color for this wild");
  card.activeColor = newColor;
  placePropertyOnBoard(player, card);
}

// ─── Play Card ────────────────────────────────────────────────────────────────

/**
 * Main entry point for playing a card from hand.
 * For cards that need targeting (rent, sly deal, etc.) you pass in params.
 */
export function playCard(
  game: Game,
  playerId: string,
  cardId: string,
  params?: PlayCardParams
): void {
  if (game.currentPlayerId !== playerId) throw new Error("Not your turn");
  if (game.phase !== "actionPhase") throw new Error("Not in action phase");
  if (game.actionsRemaining <= 0) throw new Error("No actions remaining");

  const player = getPlayerById(game, playerId);
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) throw new Error("Card not in hand");

  const card = player.hand.splice(cardIdx, 1)[0];

  if (card.type === "money") {
    player.bank.push(card);
    log(game, `${player.name} banked $${card.value}M.`);
    game.actionsRemaining--;

  } else if (card.type === "property") {
    placePropertyOnBoard(player, card as PropertyCard);
    log(game, `${player.name} placed ${card.name}.`);
    game.actionsRemaining--;
    checkWinCondition(game);

  } else if (card.type === "action") {
    handleActionCard(game, player, card as ActionCard, params);

  } else if (card.type === "rent") {
    handleRentCard(game, player, card as RentCard, params);

  } else {
    // Shouldn't happen — discard it
    game.discardPile.push(card);
    game.actionsRemaining--;
  }
}

export interface PlayCardParams {
  // For rent / debtCollector / birthday — which opponent(s) to charge
  targetPlayerId?: string;
  // For sly deal — which property to steal
  targetSetId?: string;
  targetCardId?: string;
  // For forced deal — what to offer + what to take
  offeredSetId?: string;
  offeredCardId?: string;
  // For deal breaker — which complete set to steal
  // targetSetId covers this
  // For banked action cards (play into bank instead of activate)
  bankCard?: boolean;
}

function handleActionCard(
  game: Game,
  player: Player,
  card: ActionCard,
  params?: PlayCardParams
): void {
  // Any action card can be banked as money instead of activated
  if (params?.bankCard) {
    player.bank.push(card);
    log(game, `${player.name} banked ${card.name} for $${card.value}M.`);
    game.actionsRemaining--;
    return;
  }

  switch (card.action) {
    case "passGo": {
      const drawn = drawCards(game, player.id, 2);
      log(game, `${player.name} played Pass Go — drew ${drawn.length} cards.`);
      game.discardPile.push(card);
      game.actionsRemaining--;
      break;
    }

    case "itsMyBirthday": {
      // Every opponent must pay $2
      const opponents = getOpponents(game, player.id);
      game.discardPile.push(card);
      game.actionsRemaining--;
      for (const opp of opponents) {
        const payment: PendingPayment = {
          kind: "payBirthday",
          fromPlayerId: opp.id,
          toPlayerId: player.id,
          amountOwed: 2,
          selectedCardIds: [],
          blocked: false,
        };
        game.pendingActions.push(payment);
      }
      if (game.pendingActions.length > 0) {
        game.phase = "pendingAction";
      }
      log(game, `🎂 ${player.name} played It's My Birthday! Everyone pays $2M.`);
      break;
    }

    case "debtCollector": {
      if (!params?.targetPlayerId) throw new Error("Must target a player for Debt Collector");
      const target = getPlayerById(game, params.targetPlayerId);
      game.discardPile.push(card);
      game.actionsRemaining--;
      const payment: PendingPayment = {
        kind: "payDebtCollector",
        fromPlayerId: target.id,
        toPlayerId: player.id,
        amountOwed: 5,
        selectedCardIds: [],
        blocked: false,
      };
      game.pendingActions.push(payment);
      game.phase = "pendingAction";
      log(game, `${player.name} hit ${target.name} with Debt Collector ($5M).`);
      break;
    }

    case "rentWild": {
      // Wild rent — pick a color you own, charge target player
      if (!params?.targetPlayerId || !params?.targetSetId) {
        throw new Error("Wild Rent needs a target player and one of your sets");
      }
      const targetPlayer = getPlayerById(game, params.targetPlayerId);
      const set = getSetById(player, params.targetSetId);
      const amount = getRentForSet(set);
      game.discardPile.push(card);
      game.actionsRemaining--;
      const payment: PendingPayment = {
        kind: "payRent",
        fromPlayerId: targetPlayer.id,
        toPlayerId: player.id,
        amountOwed: amount,
        selectedCardIds: [],
        blocked: false,
      };
      game.pendingActions.push(payment);
      game.phase = "pendingAction";
      log(game, `${player.name} charged ${targetPlayer.name} $${amount}M rent (wild).`);
      break;
    }

    case "slyDeal": {
      if (!params?.targetPlayerId || !params?.targetSetId || !params?.targetCardId) {
        throw new Error("Sly Deal needs a target player, set, and card");
      }
      const victim = getPlayerById(game, params.targetPlayerId);
      const victimSet = getSetById(victim, params.targetSetId);
      if (isSetComplete(victimSet)) throw new Error("Cannot steal from a complete set");
      const stolenCard = removePropertyFromBoard(victim, params.targetCardId);
      placePropertyOnBoard(player, stolenCard);
      game.discardPile.push(card);
      game.actionsRemaining--;
      checkWinCondition(game);
      log(game, `${player.name} sly-dealt ${stolenCard.name} from ${victim.name}.`);
      break;
    }

    case "forcedDeal": {
      if (
        !params?.targetPlayerId ||
        !params?.targetSetId ||
        !params?.targetCardId ||
        !params?.offeredSetId ||
        !params?.offeredCardId
      ) {
        throw new Error("Forced Deal needs both sides specified");
      }
      const victim2 = getPlayerById(game, params.targetPlayerId);
      const victimSet2 = getSetById(victim2, params.targetSetId);
      const offeredSet = getSetById(player, params.offeredSetId);
      if (isSetComplete(victimSet2)) throw new Error("Cannot steal from a complete set");
      if (isSetComplete(offeredSet)) throw new Error("Cannot give away a card from a complete set");
      const taken = removePropertyFromBoard(victim2, params.targetCardId);
      const given = removePropertyFromBoard(player, params.offeredCardId);
      placePropertyOnBoard(player, taken);
      placePropertyOnBoard(victim2, given);
      game.discardPile.push(card);
      game.actionsRemaining--;
      checkWinCondition(game);
      log(game, `${player.name} forced a deal: took ${taken.name}, gave ${given.name}.`);
      break;
    }

    case "dealBreaker": {
      if (!game.config.enableDealBreaker) throw new Error("Deal Breaker is disabled");
      if (!params?.targetPlayerId || !params?.targetSetId) {
        throw new Error("Deal Breaker needs a target player and complete set");
      }
      const victim3 = getPlayerById(game, params.targetPlayerId);
      const victimSet3 = getSetById(victim3, params.targetSetId);
      if (!isSetComplete(victimSet3)) throw new Error("Can only Deal Breaker a complete set");
      // Move the whole set
      victim3.propertySets = victim3.propertySets.filter(s => s.id !== victimSet3.id);
      player.propertySets.push(victimSet3);
      game.discardPile.push(card);
      game.actionsRemaining--;
      checkWinCondition(game);
      log(game, `💀 ${player.name} Deal Broke ${victim3.name}'s ${victimSet3.color} set!`);
      break;
    }

    case "house": {
      if (!params?.targetSetId) throw new Error("Must specify which set to add house to");
      const set = getSetById(player, params.targetSetId);
      if (!isSetComplete(set)) throw new Error("Can only add a house to a complete set");
      if (set.hasHouse) throw new Error("Set already has a house");
      set.hasHouse = true;
      game.discardPile.push(card);
      game.actionsRemaining--;
      log(game, `${player.name} added a house to ${set.color}.`);
      break;
    }

    case "hotel": {
      if (!params?.targetSetId) throw new Error("Must specify which set to add hotel to");
      const set = getSetById(player, params.targetSetId);
      if (!isSetComplete(set)) throw new Error("Can only add a hotel to a complete set");
      if (!set.hasHouse) throw new Error("Need a house before a hotel");
      if (set.hasHotel) throw new Error("Set already has a hotel");
      set.hasHotel = true;
      game.discardPile.push(card);
      game.actionsRemaining--;
      log(game, `${player.name} added a hotel to ${set.color}.`);
      break;
    }

    case "justSayNo": {
      // Just Say No is handled in respondToPendingAction — shouldn't be played here
      throw new Error("Just Say No must be played in response to an action");
    }

    default:
      game.discardPile.push(card);
      game.actionsRemaining--;
  }
}

function handleRentCard(
  game: Game,
  player: Player,
  card: RentCard,
  params?: PlayCardParams
): void {
  if (params?.bankCard) {
    player.bank.push(card);
    log(game, `${player.name} banked ${card.name} for $${card.value}M.`);
    game.actionsRemaining--;
    return;
  }

  if (!params?.targetSetId) throw new Error("Must specify which set to charge rent for");

  const set = getSetById(player, params.targetSetId);
  if (!card.rentableColors.includes(set.color)) {
    throw new Error(`This rent card doesn't cover ${set.color}`);
  }

  const amount = getRentForSet(set);
  game.discardPile.push(card);
  game.actionsRemaining--;

  // Charge all opponents (standard rent) or just one (if targetPlayerId specified)
  const targets = params?.targetPlayerId
    ? [getPlayerById(game, params.targetPlayerId)]
    : getOpponents(game, player.id);

  for (const target of targets) {
    const payment: PendingPayment = {
      kind: "payRent",
      fromPlayerId: target.id,
      toPlayerId: player.id,
      amountOwed: amount,
      selectedCardIds: [],
      blocked: false,
    };
    game.pendingActions.push(payment);
  }

  if (game.pendingActions.length > 0) {
    game.phase = "pendingAction";
  }

  const targetNames = targets.map(t => t.name).join(", ");
  log(game, `${player.name} charged ${targetNames} $${amount}M rent on ${set.color}.`);
}

// ─── Pending Action Responses ─────────────────────────────────────────────────

/**
 * The affected player confirms payment by specifying which of their cards to use.
 * Cards must total >= amountOwed, or be everything they own.
 */
export function confirmPayment(
  game: Game,
  playerId: string,
  cardIds: string[]
): void {
  const pending = game.pendingActions[0];
  if (!pending) throw new Error("No pending action");
  if (
    pending.kind !== "payRent" &&
    pending.kind !== "payBirthday" &&
    pending.kind !== "payDebtCollector"
  ) throw new Error("Pending action is not a payment");
  if (pending.fromPlayerId !== playerId) throw new Error("Not your action to respond to");

  const payer = getPlayerById(game, playerId);
  const receiver = getPlayerById(game, pending.toPlayerId);

  // Validate selected cards belong to payer and aren't from complete sets
  const selectedValue = getSelectedCardValue(payer, cardIds);
  const totalAssets = getTotalPayableAssets(payer);

  if (selectedValue < pending.amountOwed && selectedValue < totalAssets) {
    throw new Error("You must pay the full amount (or everything you have)");
  }

  const paid = collectPayment(payer, cardIds);
  for (const c of paid) {
    // Money goes to bank; properties go to bank as money
    receiver.bank.push(c);
  }

  log(game, `${payer.name} paid $${selectedValue}M to ${receiver.name}.`);

  game.pendingActions.shift();
  if (game.pendingActions.length === 0) {
    game.phase = "actionPhase";
    if (game.actionsRemaining <= 0) {
      endTurn(game);
    }
  }
}

/**
 * The affected player plays a Just Say No to block the pending action.
 */
export function playJustSayNo(
  game: Game,
  playerId: string,
  cardId: string
): void {
  const pending = game.pendingActions[0];
  if (!pending) throw new Error("No pending action");

  // Find which role this player has
  const isVictim = (() => {
    if ("fromPlayerId" in pending) return pending.fromPlayerId === playerId;
    return false;
  })();
  const isAttacker = (() => {
    if ("toPlayerId" in pending) return (pending as any).toPlayerId === playerId;
    return false;
  })();

  if (!isVictim && !isAttacker) throw new Error("Not your action to respond to");

  const player = getPlayerById(game, playerId);
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) throw new Error("Card not in hand");
  const card = player.hand.splice(cardIdx, 1)[0];
  if ((card as ActionCard).action !== "justSayNo") throw new Error("Card is not Just Say No");

  game.discardPile.push(card);
  log(game, `${player.name} played Just Say No!`);

  // Remove this pending action — it's blocked
  game.pendingActions.shift();

  if (game.pendingActions.length === 0) {
    game.phase = "actionPhase";
    if (game.actionsRemaining <= 0) {
      endTurn(game);
    }
  }
}

// ─── Asset Calculation Helpers ────────────────────────────────────────────────

export function getTotalPayableAssets(player: Player): number {
  let total = getBankValue(player);
  for (const set of player.propertySets) {
    if (!isSetComplete(set)) {
      total += set.properties.reduce((s, p) => s + p.value, 0);
    }
  }
  return total;
}

function getSelectedCardValue(player: Player, cardIds: string[]): number {
  let total = 0;
  for (const id of cardIds) {
    const bankCard = player.bank.find(c => c.id === id);
    if (bankCard) { total += bankCard.value; continue; }
    for (const set of player.propertySets) {
      if (isSetComplete(set)) continue;
      const prop = set.properties.find(c => c.id === id);
      if (prop) { total += prop.value; break; }
    }
  }
  return total;
}
