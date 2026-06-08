"use client";
import React from "react";
import { PropertySet } from "../types/game";
import { CardView } from "./CardView";
import { isSetComplete, getRentForSet } from "../lib/propertyUtils";
import { getColorHex, getColorName } from "../lib/colorUtils";
import { PROPERTY_RULES } from "../data/propertyRules";

interface PropertySetViewProps {
  set: PropertySet;
  selectedCardId?: string;
  onCardClick?: (cardId: string) => void;
  small?: boolean;
}

export function PropertySetView({ set, selectedCardId, onCardClick, small }: PropertySetViewProps) {
  const complete = isSetComplete(set);
  const rent = getRentForSet(set);
  const rule = PROPERTY_RULES[set.color];

  return (
    <div
      className={`rounded-lg p-1.5 border ${complete ? "border-yellow-400/60" : "border-gray-700"} bg-gray-900/60`}
    >
      <div className="flex items-center gap-1 mb-1">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: getColorHex(set.color) }}
        />
        <span className="text-gray-400 font-medium" style={{ fontSize: 10 }}>
          {getColorName(set.color)} {set.properties.length}/{rule.setSize}
        </span>
        {complete && (
          <span className="ml-1 text-yellow-400 font-bold" style={{ fontSize: 10 }}>✓</span>
        )}
        <span className="ml-auto text-green-400 font-semibold" style={{ fontSize: 10 }}>
          ${rent}M rent
        </span>
      </div>

      {(set.hasHouse || set.hasHotel) && (
        <div className="flex gap-1 mb-1">
          {set.hasHouse && <span className="text-xs bg-green-700 text-white px-1 rounded">🏠</span>}
          {set.hasHotel && <span className="text-xs bg-red-700 text-white px-1 rounded">🏨</span>}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {set.properties.map(card => (
          <CardView
            key={card.id}
            card={card}
            small
            selected={selectedCardId === card.id}
            onClick={onCardClick ? () => onCardClick(card.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
