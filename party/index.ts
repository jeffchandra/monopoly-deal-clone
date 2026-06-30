import type * as Party from "partykit/server";
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
  confirmPayment,
  placePendingProperty,
  playPassGo,
  playItsMyBirthday,
  playDebtCollector,
  playSlyDeal,
  playForcedDeal,
  playHouse,
  playHotel,
  movePropertyBetweenSets,
  moveWildToNewColor,
  playWildRent,
} from "../lib/gameEngine";
import { Game } from "../types/game";
import { PropertyColor } from "../types/card";

export type ClientMessage =
  | { type: "join"; playerName: string }
  | { type: "startGame" }
  | { type: "startTurn" }
  | { type: "endTurn" }
  | { type: "discard"; cardId: string }
  | { type: "bankCards"; cardIds: string[] }
  | { type: "placePropertyAsNewSet"; cardId: string; colorOverride?: PropertyColor }
  | { type: "placePropertyIntoSet"; cardId: string; setId: string }
  | { type: "playRentCard"; cardId: string; setId: string; doubleRentCardId?: string; targetPlayerId?: string }
  | { type: "playWildRent"; cardId: string; setId: string; targetPlayerId: string; doubleRentCardId?: string }
  | { type: "confirmPayment"; cardIds: string[] }
  | { type: "placePendingProperty"; cardId: string; targetSetId: string | null }
  | { type: "playPassGo"; cardId: string }
  | { type: "playItsMyBirthday"; cardId: string }
  | { type: "playDebtCollector"; cardId: string; targetPlayerId: string }
  | { type: "playSlyDeal"; cardId: string; targetPlayerId: string; targetSetId: string; targetCardId: string }
  | { type: "playForcedDeal"; cardId: string; targetPlayerId: string; targetSetId: string; targetCardId: string; offeredSetId: string; offeredCardId: string }
  | { type: "playHouse"; cardId: string; setId: string }
  | { type: "playHotel"; cardId: string; setId: string }
  | { type: "movePropertyBetweenSets"; cardId: string; fromSetId: string; toSetId: string }
  | { type: "moveWildToNewColor"; cardId: string; fromSetId: string; newColor: PropertyColor };

export type ServerMessage =
  | { type: "gameState"; game: Game; yourPlayerId: string }
  | { type: "error"; message: string }
  | { type: "waiting"; playerNames: string[]; roomCode: string }
  | { type: "gameOver"; winnerId: string };

interface RoomState {
  game: Game | null;
  players: { id: string; name: string; connectionId: string }[];
  started: boolean;
}

export default class GameServer implements Party.Server {
  state: RoomState = {
    game: null,
    players: [],
    started: false,
  };

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Send current waiting state to new connection
    if (!this.state.started) {
      conn.send(JSON.stringify({
        type: "waiting",
        playerNames: this.state.players.map(p => p.name),
        roomCode: this.room.id,
      } satisfies ServerMessage));
    } else if (this.state.game) {
      // Game already started — find which player this connection belongs to
      // They need to rejoin with their name
    }
  }

  onClose(conn: Party.Connection) {
    // Remove player and end game if started
    const playerIdx = this.state.players.findIndex(p => p.connectionId === conn.id);
    if (playerIdx !== -1) {
      const player = this.state.players[playerIdx];
      this.state.players.splice(playerIdx, 1);

      if (this.state.started && this.state.game) {
        // End the game — player disconnected
        this.state.game.phase = "gameOver";
        this.broadcast({
          type: "error",
          message: `${player.name} disconnected. Game over.`,
        });
      } else {
        // Still in lobby — just update waiting screen
        this.broadcastWaiting();
      }
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    try {
      this.handleMessage(msg, sender);
    } catch (e: any) {
      sender.send(JSON.stringify({
        type: "error",
        message: e.message,
      } satisfies ServerMessage));
    }
  }

  handleMessage(msg: ClientMessage, sender: Party.Connection) {
    if (msg.type === "join") {
      if (this.state.started) {
        sender.send(JSON.stringify({ type: "error", message: "Game already started" } satisfies ServerMessage));
        return;
      }
      if (this.state.players.length >= 5) {
        sender.send(JSON.stringify({ type: "error", message: "Room is full" } satisfies ServerMessage));
        return;
      }

      const playerId = `p${this.state.players.length + 1}`;
      this.state.players.push({
        id: playerId,
        name: msg.playerName,
        connectionId: sender.id,
      });

      // Store playerId on connection for later lookups
      (sender as any).playerId = playerId;

      this.broadcastWaiting();
      return;
    }

    if (msg.type === "startGame") {
      if (this.state.players.length < 2) {
        sender.send(JSON.stringify({ type: "error", message: "Need at least 2 players" } satisfies ServerMessage));
        return;
      }

      const players = this.state.players.map(p => createPlayer(p.id, p.name));
      this.state.game = createGame(players);
      startGame(this.state.game);
      this.state.started = true;
      this.broadcastGameState();
      return;
    }

    // All other messages require a started game
    if (!this.state.game) return;
    const game = this.state.game;
    const playerId = (sender as any).playerId as string;
    if (!playerId) return;

    switch (msg.type) {
      case "startTurn":
        startTurn(game);
        break;
      case "endTurn":
        endTurn(game);
        break;
      case "discard":
        discard(game, playerId, msg.cardId);
        break;
      case "bankCards":
        for (const id of msg.cardIds) playCardToBank(game, playerId, id);
        break;
      case "placePropertyAsNewSet":
        placePropertyAsNewSet(game, playerId, msg.cardId, msg.colorOverride);
        break;
      case "placePropertyIntoSet":
        placePropertyIntoSet(game, playerId, msg.cardId, msg.setId);
        break;
      case "playRentCard":
        playRentCard(game, playerId, msg.cardId, msg.setId, msg.doubleRentCardId, msg.targetPlayerId);
        break;
      case "playWildRent":
        playWildRent(game, playerId, msg.cardId, msg.setId, msg.targetPlayerId, msg.doubleRentCardId);
        break;
      case "confirmPayment":
        confirmPayment(game, playerId, msg.cardIds);
        break;
      case "placePendingProperty":
        placePendingProperty(game, playerId, msg.cardId, msg.targetSetId);
        break;
      case "playPassGo":
        playPassGo(game, playerId, msg.cardId);
        break;
      case "playItsMyBirthday":
        playItsMyBirthday(game, playerId, msg.cardId);
        break;
      case "playDebtCollector":
        playDebtCollector(game, playerId, msg.cardId, msg.targetPlayerId);
        break;
      case "playSlyDeal":
        playSlyDeal(game, playerId, msg.cardId, msg.targetPlayerId, msg.targetSetId, msg.targetCardId);
        break;
      case "playForcedDeal":
        playForcedDeal(game, playerId, msg.cardId, msg.targetPlayerId, msg.targetSetId, msg.targetCardId, msg.offeredSetId, msg.offeredCardId);
        break;
      case "playHouse":
        playHouse(game, playerId, msg.cardId, msg.setId);
        break;
      case "playHotel":
        playHotel(game, playerId, msg.cardId, msg.setId);
        break;
      case "movePropertyBetweenSets":
        movePropertyBetweenSets(game, playerId, msg.cardId, msg.fromSetId, msg.toSetId);
        break;
      case "moveWildToNewColor":
        moveWildToNewColor(game, playerId, msg.cardId, msg.fromSetId, msg.newColor);
        break;
    }

    this.broadcastGameState();
  }

  broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg));
  }

  broadcastWaiting() {
    this.broadcast({
      type: "waiting",
      playerNames: this.state.players.map(p => p.name),
      roomCode: this.room.id,
    });
  }

  broadcastGameState() {
    if (!this.state.game) return;
    // Send each player a version of the game state
    for (const player of this.state.players) {
      const conn = this.room.getConnection(player.connectionId);
      if (!conn) continue;
      conn.send(JSON.stringify({
        type: "gameState",
        game: this.state.game,
        yourPlayerId: player.id,
      } satisfies ServerMessage));
    }
  }
}

GameServer satisfies Party.Worker;