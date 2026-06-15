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
    g.config.winCondition = 1; // temporary — win with just 1 complete set
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

  function doDiscard(playerId: string, cardIds: string[], onSuccess: () => void) {
    update(g => discard(g, playerId, cardIds), onSuccess);
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

  function doConfirmPayment(playerId: string, cardIds: string[], onSuccess: () => void) {
    update(g => confirmPayment(g, playerId, cardIds), onSuccess);
  }

  function clearError() {
    setError(null);
  }

  return {
    game,
    error,
    clearError,
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
  };
}