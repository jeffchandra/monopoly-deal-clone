"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import PartySocket from "partysocket";
import { Game } from "../types/game";
import { PropertyColor } from "../types/card";
import type { ServerMessage, ClientMessage } from "../party/index";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

export type LobbyState = {
  playerNames: string[];
  roomCode: string;
};

export function useMultiplayerGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<PartySocket | null>(null);

  function connect(roomCode: string, playerName: string) {
    console.log("Connecting to:", PARTYKIT_HOST, "room:", roomCode);
    if (socketRef.current) {
      socketRef.current.close();
    }

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomCode.toLowerCase(),
    });

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setConnected(true);
      send({ type: "join", playerName });
    });

    socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data) as ServerMessage;
      handleServerMessage(msg);
    });

    socket.addEventListener("close", () => {
      setConnected(false);
      setError("Disconnected from server.");
    });

    socket.addEventListener("error", () => {
      setError("Connection error.");
    });
  }

  function handleServerMessage(msg: ServerMessage) {
    switch (msg.type) {
      case "waiting":
        setLobby({ playerNames: msg.playerNames, roomCode: msg.roomCode });
        break;
      case "gameState":
        const sortedGame = msg.game;
        for (const p of sortedGame.players) {
            p.bank = [...p.bank].sort((a, b) => b.value - a.value);
        }
        setGame(sortedGame);
        setMyPlayerId(msg.yourPlayerId);
        setLobby(null);
        break;
      case "error":
        setError(msg.message);
        break;
      case "gameOver":
        // game state already updated via gameState message
        break;
    }
  }

  function send(msg: ClientMessage) {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }

  function disconnect() {
    socketRef.current?.close();
    socketRef.current = null;
    setGame(null);
    setMyPlayerId(null);
    setLobby(null);
    setConnected(false);
  }

  // ── Game actions ────────────────────────────────────────────────────────────
  const doStartGame = useCallback(() => send({ type: "startGame" }), []);
  const doStartTurn = useCallback(() => send({ type: "startTurn" }), []);
  const doEndTurn = useCallback(() => send({ type: "endTurn" }), []);
  const doDiscard = useCallback((cardId: string) => send({ type: "discard", cardId }), []);
  const doBankCards = useCallback((cardIds: string[]) => send({ type: "bankCards", cardIds }), []);
  const doPlacePropertyAsNewSet = useCallback((cardId: string, colorOverride?: PropertyColor) =>
    send({ type: "placePropertyAsNewSet", cardId, colorOverride }), []);
  const doPlacePropertyIntoSet = useCallback((cardId: string, setId: string) =>
    send({ type: "placePropertyIntoSet", cardId, setId }), []);
  const doPlayRentCard = useCallback((cardId: string, setId: string, doubleRentCardId?: string, targetPlayerId?: string) =>
    send({ type: "playRentCard", cardId, setId, doubleRentCardId, targetPlayerId }), []);
  const doPlayWildRent = useCallback((cardId: string, setId: string, targetPlayerId: string, doubleRentCardId?: string) =>
    send({ type: "playWildRent", cardId, setId, targetPlayerId, doubleRentCardId }), []);
  const doConfirmPayment = useCallback((cardIds: string[]) =>
    send({ type: "confirmPayment", cardIds }), []);
  const doPlacePendingProperty = useCallback((cardId: string, targetSetId: string | null) =>
    send({ type: "placePendingProperty", cardId, targetSetId }), []);
  const doPlayPassGo = useCallback((cardId: string) =>
    send({ type: "playPassGo", cardId }), []);
  const doPlayItsMyBirthday = useCallback((cardId: string) =>
    send({ type: "playItsMyBirthday", cardId }), []);
  const doPlayDebtCollector = useCallback((cardId: string, targetPlayerId: string) =>
    send({ type: "playDebtCollector", cardId, targetPlayerId }), []);
  const doPlaySlyDeal = useCallback((cardId: string, targetPlayerId: string, targetSetId: string, targetCardId: string) =>
    send({ type: "playSlyDeal", cardId, targetPlayerId, targetSetId, targetCardId }), []);
  const doPlayForcedDeal = useCallback((cardId: string, targetPlayerId: string, targetSetId: string, targetCardId: string, offeredSetId: string, offeredCardId: string) =>
    send({ type: "playForcedDeal", cardId, targetPlayerId, targetSetId, targetCardId, offeredSetId, offeredCardId }), []);
  const doPlayHouse = useCallback((cardId: string, setId: string) =>
    send({ type: "playHouse", cardId, setId }), []);
  const doPlayHotel = useCallback((cardId: string, setId: string) =>
    send({ type: "playHotel", cardId, setId }), []);
  const doMovePropertyBetweenSets = useCallback((cardId: string, fromSetId: string, toSetId: string) =>
    send({ type: "movePropertyBetweenSets", cardId, fromSetId, toSetId }), []);
  const doMoveWildToNewColor = useCallback((cardId: string, fromSetId: string, newColor: PropertyColor) =>
    send({ type: "moveWildToNewColor", cardId, fromSetId, newColor }), []);

  return {
    game,
    myPlayerId,
    lobby,
    error,
    connected,
    clearError: () => setError(null),
    connect,
    disconnect,
    doStartGame,
    doStartTurn,
    doEndTurn,
    doDiscard,
    doBankCards,
    doPlacePropertyAsNewSet,
    doPlacePropertyIntoSet,
    doPlayRentCard,
    doPlayWildRent,
    doConfirmPayment,
    doPlacePendingProperty,
    doPlayPassGo,
    doPlayItsMyBirthday,
    doPlayDebtCollector,
    doPlaySlyDeal,
    doPlayForcedDeal,
    doPlayHouse,
    doPlayHotel,
    doMovePropertyBetweenSets,
    doMoveWildToNewColor,
  };
}