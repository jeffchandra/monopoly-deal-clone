"use client";
import { useCallback, useState } from "react";
import {
  createGame,
  createPlayer,
  startGame,
  startTurn,
  endTurn,
  playCard,
  confirmPayment,
  playJustSayNo,
  discard,
  flipWildCard,
  checkWinCondition,
  getPlayerById,
  PlayCardParams,
} from "../lib/gameEngine";
import { Game } from "../types/game";
import { PropertyColor } from "../types/card";

function cloneGame(game: Game): Game {
  return JSON.parse(JSON.stringify(game));
}

export function useGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback((fn: (g: Game) => void) => {
    setError(null);
    setGame(prev => {
      if (!prev) return prev;
      try {
        const next = cloneGame(prev);
        fn(next);
        return next;
      } catch (e: any) {
        setError(e.message);
        return prev;
      }
    });
  }, []);

  const initGame = useCallback((playerNames: string[]) => {
    setError(null);
    const players = playerNames.map((name, i) => createPlayer(`p${i + 1}`, name));
    const g = createGame(players, { enableDealBreaker: true, winCondition: 3 });
    startGame(g);
    setGame(g);
  }, []);

  const doStartTurn = useCallback(() => update(startTurn), [update]);
  const doEndTurn = useCallback(() => update(endTurn), [update]);

  const doPlayCard = useCallback(
    (playerId: string, cardId: string, params?: PlayCardParams) =>
      update(g => playCard(g, playerId, cardId, params)),
    [update]
  );

  const doConfirmPayment = useCallback(
    (playerId: string, cardIds: string[]) =>
      update(g => confirmPayment(g, playerId, cardIds)),
    [update]
  );

  const doJustSayNo = useCallback(
    (playerId: string, cardId: string) =>
      update(g => playJustSayNo(g, playerId, cardId)),
    [update]
  );

  const doDiscard = useCallback(
    (playerId: string, cardIds: string[]) =>
      update(g => discard(g, playerId, cardIds)),
    [update]
  );

  const doFlipWild = useCallback(
    (playerId: string, cardId: string, newColor: PropertyColor) =>
      update(g => flipWildCard(g, playerId, cardId, newColor)),
    [update]
  );

  return {
    game,
    error,
    clearError: () => setError(null),
    initGame,
    startTurn: doStartTurn,
    endTurn: doEndTurn,
    playCard: doPlayCard,
    confirmPayment: doConfirmPayment,
    justSayNo: doJustSayNo,
    discard: doDiscard,
    flipWild: doFlipWild,
  };
}
