import { PropertyColor } from "../types/card";
import { PROPERTY_RULES } from "../data/propertyRules";

export function getColorHex(color: PropertyColor): string {
  return PROPERTY_RULES[color].color;
}

export function getColorText(color: PropertyColor): string {
  return PROPERTY_RULES[color].textColor;
}

export function getColorName(color: PropertyColor): string {
  return PROPERTY_RULES[color].displayName;
}
