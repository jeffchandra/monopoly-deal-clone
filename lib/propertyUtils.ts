import { PROPERTY_RULES } from "../data/propertyRules";
import {
  PropertySet,
  Player,
} from "../types/game";

export function isSetComplete(
  set: PropertySet
): boolean {
  const rule =
    PROPERTY_RULES[
      set.color
    ];

  return (
    set.properties.length >=
    rule.setSize
  );
}

export function getCompletedSetCount(
  player: Player
): number {
  let count = 0;

  for (
    const set of player.propertySets
  ) {
    if (
      isSetComplete(set)
    ) {
      count++;
    }
  }

  return count;
}

