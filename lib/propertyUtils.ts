import { PROPERTY_RULES } from "../data/propertyRules";
import { Player, PropertySet } from "../types/game";
import { RentCard } from "../types/card";

export function isSetComplete(set: PropertySet): boolean {
  const rule = PROPERTY_RULES[set.color];
  return set.properties.length >= rule.setSize;
}

export function getCompletedSetCount(player: Player): number {
  let count = 0;
  for (const set of player.propertySets) {
    if (isSetComplete(set)) {
      count++;
    }
  }
  return count;
}

export function getRentForSet(set: PropertySet): number {
  const rule = PROPERTY_RULES[set.color];
  const count = set.properties.length;
  const tierIndex = Math.min(count - 1, rule.rentTiers.length - 1);
  return rule.rentTiers[tierIndex];
}

export function getRentableSetsByCard(
  player: Player,
  rentCard: RentCard
): PropertySet[] {
  return player.propertySets.filter(set =>
    rentCard.rentableColors.includes(set.color)
  );
}