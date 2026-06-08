import { PROPERTY_RULES } from "../data/propertyRules";
import { PropertySet, Player } from "../types/game";
import { PropertyColor } from "../types/card";

export function isSetComplete(set: PropertySet): boolean {
  return set.properties.length >= PROPERTY_RULES[set.color].setSize;
}

export function getCompletedSetCount(player: Player): number {
  return player.propertySets.filter(isSetComplete).length;
}

export function getRentForSet(set: PropertySet): number {
  const rule = PROPERTY_RULES[set.color];
  const count = set.properties.length;
  const tierIndex = Math.min(count - 1, rule.rentTiers.length - 1);
  let rent = rule.rentTiers[tierIndex];
  if (isSetComplete(set)) {
    if (set.hasHouse) rent += 3;
    if (set.hasHotel) rent += 4;
  }
  return rent;
}

export function getPropertySetsForColor(
  player: Player,
  color: PropertyColor
): PropertySet[] {
  return player.propertySets.filter(s => s.color === color);
}

export function getIncompleteSetForColor(
  player: Player,
  color: PropertyColor
): PropertySet | undefined {
  return player.propertySets.find(
    s => s.color === color && !isSetComplete(s)
  );
}
