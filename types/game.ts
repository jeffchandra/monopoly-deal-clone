import { Card, PropertyCard, PropertyColor } from "./card";

export interface PropertySet {
  id: string;

  color: PropertyColor;

  properties: PropertyCard[];

  house: null;

  hotel: null;
}

export interface Player {
  id: string;

  name: string;

  hand: Card[];

  bank: Card[];

  propertySets: PropertySet[];
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