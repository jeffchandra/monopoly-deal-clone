import { Card, PropertyCard } from "../types/card";
import { Player, PropertySet } from "../types/game";
import { isSetComplete } from "./propertyUtils";

export function getBankValue(player: Player): number {
  return player.bank.reduce((sum, card) => sum + card.value, 0);
}

export function getTotalAssets(player: Player): number {
  let total = getBankValue(player);

  for (const set of player.propertySets) {
    if (isSetComplete(set)) continue; // complete sets are protected
    total += set.properties.reduce((sum, p) => sum + p.value, 0);
  }

  return total;
}

export function canAfford(player: Player, amount: number): boolean {
  return getTotalAssets(player) >= amount;
}

export function isBankrupt(player: Player, amount: number): boolean {
  return !canAfford(player, amount);
}

/**
 * Removes cards from a player's bank (and optionally incomplete property sets)
 * to cover `amount`. Returns the cards removed and any overpay remainder.
 * The cards are removed from player state in place.
 */
export function collectPayment(
  payer: Player,
  cardIds: string[]
): Card[] {
  const paid: Card[] = [];

  for (const id of cardIds) {
    // Try bank first
    const bankIdx = payer.bank.findIndex(c => c.id === id);
    if (bankIdx !== -1) {
      paid.push(payer.bank.splice(bankIdx, 1)[0]);
      continue;
    }

    // Then incomplete property sets
    for (const set of payer.propertySets) {
      if (isSetComplete(set)) continue;
      const propIdx = set.properties.findIndex(c => c.id === id);
      if (propIdx !== -1) {
        paid.push(set.properties.splice(propIdx, 1)[0]);
        if (set.properties.length === 0) {
          payer.propertySets = payer.propertySets.filter(s => s.id !== set.id);
        }
        break;
      }
    }
  }

  return paid;
}
