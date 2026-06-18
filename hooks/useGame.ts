import { useState } from "react";
import {
  createGame,
  createPlayer,
  startGame,
  startTurn,
  endTurn,
  discard,
  playCardToBank,
  placePropertyAsNewSet,
  placePropertyIntoSet,
  playRentCard,
  placePendingProperty,
  playPassGo,
  playItsMyBirthday,
  playDebtCollector,
  playSlyDeal,
  playForcedDeal,
  getCurrentPlayer,
  getPayableSources,
  confirmPayment,
} from "../lib/gameEngine";
import { Game } from "../types/game";
import { Card } from "../types/card";

function cloneGame(game: Game): Game {
  return JSON.parse(JSON.stringify(game));
}

function sortBank(bank: Card[]): Card[] {
  return [...bank].sort((a, b) => b.value - a.value);
}

export function useGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastLog, setLastLog] = useState<string[]>([]);

  function update(fn: (g: Game) => void, afterFn?: () => void) {
    setError(null);
    setGame(prev => {
      if (!prev) return prev;
      try {
        const next = cloneGame(prev);
        fn(next);
        for (const p of next.players) {
          p.bank = sortBank(p.bank);
        }
        setLastLog(next.log);
        return next;
      } catch (e: any) {
        setError(e.message);
        return prev;
      }
    });
    if (afterFn) afterFn();
  }

  function init(playerNames: string[]) {
    const players = playerNames.map((name, i) =>
      createPlayer(`p${i + 1}`, name)
    );
    const g = createGame(players);
    // g.config.winCondition = 1; // temporary — win with just 1 complete set
    startGame(g);
    setGame(g);
    setError(null);
  }

  function doStartTurn() {
    update(g => startTurn(g));
  }

  function doEndTurn(onSuccess: () => void) {
    update(g => endTurn(g), onSuccess);
  }

  function doDiscard(playerId: string, cardId: string, onSuccess?: () => void) {
    update(g => discard(g, playerId, cardId), onSuccess);
  }

  function doBankCards(playerId: string, cardIds: string[]) {
    update(g => {
      for (const id of cardIds) {
        playCardToBank(g, playerId, id);
      }
    });
  }

  function doPlacePropertyAsNewSet(playerId: string, cardId: string) {
    update(g => placePropertyAsNewSet(g, playerId, cardId));
  }

  function doPlacePropertyIntoSet(playerId: string, cardId: string, setId: string) {
    update(g => placePropertyIntoSet(g, playerId, cardId, setId));
  }

  function doPlayRentCard(playerId: string, cardId: string, setId: string, onSuccess: () => void) {
    update(g => playRentCard(g, playerId, cardId, setId), onSuccess);
  }

  function doPlacePendingProperty(playerId: string, cardId: string, targetSetId: string | null) {
    update(g => placePendingProperty(g, playerId, cardId, targetSetId));
  }

  function doConfirmPayment(playerId: string, cardIds: string[], onSuccess: () => void) {
    update(g => confirmPayment(g, playerId, cardIds), onSuccess);
  }

  function doPlayPassGo(playerId: string, cardId: string) {
    update(g => playPassGo(g, playerId, cardId));
  }

  function doPlayItsMyBirthday(playerId: string, cardId: string, onSuccess: () => void) {
    update(g => playItsMyBirthday(g, playerId, cardId), onSuccess);
  }

  function doPlayDebtCollector(playerId: string, cardId: string, targetPlayerId: string, onSuccess: () => void) {
    update(g => playDebtCollector(g, playerId, cardId, targetPlayerId), onSuccess);
  }

  function doPlaySlyDeal(
    playerId: string,
    cardId: string,
    targetPlayerId: string,
    targetSetId: string,
    targetCardId: string
  ) {
    update(g => playSlyDeal(g, playerId, cardId, targetPlayerId, targetSetId, targetCardId));
  }

  function doPlayForcedDeal(
    playerId: string,
    cardId: string,
    targetPlayerId: string,
    targetSetId: string,
    targetCardId: string,
    offeredSetId: string,
    offeredCardId: string,
    onSuccess: () => void
  ) {
    update(g => playForcedDeal(g, playerId, cardId, targetPlayerId, targetSetId, targetCardId, offeredSetId, offeredCardId), onSuccess);
  }

  function clearError() {
    setError(null);
  }

  function reset() {
    setGame(null);
    setError(null);
    setLastLog([]);
  }

  return {
    game,
    error,
    clearError,
    lastLog,
    init,
    getCurrentPlayer: () => game ? getCurrentPlayer(game) : null,
    getPayableSources: (playerId: string) => game ? getPayableSources(game, playerId) : null,
    doStartTurn,
    doEndTurn,
    doDiscard,
    doBankCards,
    doPlacePropertyAsNewSet,
    doPlacePropertyIntoSet,
    doPlayRentCard,
    doConfirmPayment,
    doPlacePendingProperty,
    doPlayPassGo,
    doPlayItsMyBirthday,
    doPlayDebtCollector,
    doPlaySlyDeal,
    doPlayForcedDeal,
    reset,
  }
}