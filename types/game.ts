import { Card, PropertyColor } from "./card";

export interface PropertyGroup {
  id: string;

  color: PropertyColor;

  cards: Card[];
}

export interface Player {
  id: string;

  name: string;

  hand: Card[];

  bank: Card[];

  propertyGroups: PropertyGroup[];
}

export interface GameConfig {
  enableDealBreaker: boolean;
}

export interface Game {
  id: string;

  players: Player[];

  deck: Card[];

  discardPile: Card[];

  currentPlayerId: string;

  winnerId: string | null;

  config: GameConfig;
}