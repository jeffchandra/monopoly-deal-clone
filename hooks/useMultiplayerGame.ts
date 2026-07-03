"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Game } from "../types/game";
import { PropertyColor } from "../types/card";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001";

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
  const socketRef = useRef<Socket | null>(null);
  const roomCodeRef = useRef<string>("");
  const playerIdRef = useRef<string>("");

  function connect(roomCode: string, playerName: string, isHost: boolean) {
    const socket = io(SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    roomCodeRef.current = roomCode.toLowerCase();

    socket.on("connect", () => {
      setConnected(true);
      if (isHost) {
        socket.emit("createRoom", { roomCode, playerName });
      } else {
        socket.emit("joinRoom", { roomCode, playerName });
      }
    });

    socket.on("waiting", (data: LobbyState) => {
      setLobby(data);
    });

    socket.on("gameState", (data: { game: Game; yourPlayerId: string }) => {
      const sortedGame = data.game;
      for (const p of sortedGame.players) {
        p.bank = [...p.bank].sort((a, b) => b.value - a.value);
      }
      setGame(sortedGame);
      setMyPlayerId(data.yourPlayerId);
      playerIdRef.current = data.yourPlayerId;
      setLobby(null);
    });

    socket.on("error", (data: { message: string }) => {
      setError(data.message);
    });

    socket.on("playerDisconnected", (data: { playerName: string; reconnectable: boolean }) => {
      setError(`${data.playerName} disconnected. Waiting for them to reconnect...`);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });
  }

  function disconnect() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setGame(null);
    setMyPlayerId(null);
    setLobby(null);
    setConnected(false);
    setError(null);
  }

  function send(action: any) {
    socketRef.current?.emit("gameAction", {
      roomCode: roomCodeRef.current,
      playerId: playerIdRef.current,
      action,
    });
  }

  function rejoin(roomCode: string, playerName: string) {
    const socket = io(SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    roomCodeRef.current = roomCode.toLowerCase();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("rejoinRoom", { roomCode, playerName });
    });

    socket.on("gameState", (data: { game: Game; yourPlayerId: string }) => {
      const sortedGame = data.game;
      for (const p of sortedGame.players) {
        p.bank = [...p.bank].sort((a, b) => b.value - a.value);
      }
      setGame(sortedGame);
      setMyPlayerId(data.yourPlayerId);
      playerIdRef.current = data.yourPlayerId;
      setLobby(null);
    });

    socket.on("error", (data: { message: string }) => {
      setError(data.message);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });
  }

  const doStartGame = useCallback(() => {
    socketRef.current?.emit("startGame", { roomCode: roomCodeRef.current });
  }, []);

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
    game, myPlayerId, lobby, error, connected,
    clearError: () => setError(null),
    connect, disconnect,
    doStartGame, doStartTurn, doEndTurn, doDiscard, doBankCards,
    doPlacePropertyAsNewSet, doPlacePropertyIntoSet,
    doPlayRentCard, doPlayWildRent, doConfirmPayment, doPlacePendingProperty,
    doPlayPassGo, doPlayItsMyBirthday, doPlayDebtCollector,
    doPlaySlyDeal, doPlayForcedDeal, doPlayHouse, doPlayHotel,
    doMovePropertyBetweenSets, doMoveWildToNewColor, rejoin,
  };
}