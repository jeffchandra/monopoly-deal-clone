"use client";
import React from "react";
import { Player } from "../types/game";
import { Card } from "../types/card";
import { CardView } from "./CardView";
import { PropertySetView } from "./PropertySetView";
import { getBankValue } from "../lib/bankUtils";
import { getCompletedSetCount } from "../lib/propertyUtils";

interface PlayerBoardProps {
  player: Player;
  isCurrentPlayer: boolean;
  isViewing: boolean;  // true = show this player's hand face-up
  selectedCardId?: string | null;
  onCardClick?: (card: Card) => void;
  label?: string;
}

export function PlayerBoard({
  player,
  isCurrentPlayer,
  isViewing,
  selectedCardId,
  onCardClick,
  label,
}: PlayerBoardProps) {
  const completedSets = getCompletedSetCount(player);
  const bankValue = getBankValue(player);

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isCurrentPlayer
          ? "border-yellow-500/60 bg-gray-900/80"
          : "border-gray-700/60 bg-gray-900/40"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            isCurrentPlayer ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-gray-300"
          }`}
        >
          {player.name[0].toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">{player.name}</span>
            {label && <span className="text-gray-500 text-xs">{label}</span>}
            {isCurrentPlayer && (
              <span className="text-yellow-400 text-xs font-medium">● Turn</span>
            )}
          </div>
          <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
            <span>🏦 ${bankValue}M</span>
            <span>🃏 {player.hand.length} cards</span>
            <span>🏆 {completedSets}/3 sets</span>
          </div>
        </div>
      </div>

      {/* Bank */}
      {player.bank.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Bank — ${bankValue}M</div>
          <div className="flex flex-wrap gap-1">
            {player.bank.map(c => (
              <CardView key={c.id} card={c} small />
            ))}
          </div>
        </div>
      )}

      {/* Properties */}
      {player.propertySets.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Properties</div>
          <div className="flex flex-wrap gap-2">
            {player.propertySets.map(set => (
              <PropertySetView key={set.id} set={set} small />
            ))}
          </div>
        </div>
      )}

      {/* Hand (only visible for viewing player) */}
      {isViewing && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">
            Hand ({player.hand.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {player.hand.map(c => (
              <CardView
                key={c.id}
                card={c}
                selected={selectedCardId === c.id}
                onClick={onCardClick ? () => onCardClick(c) : undefined}
              />
            ))}
            {player.hand.length === 0 && (
              <p className="text-gray-600 text-sm">Empty hand</p>
            )}
          </div>
        </div>
      )}

      {/* Hidden hand indicator for opponents */}
      {!isViewing && player.hand.length > 0 && (
        <div className="flex gap-1">
          {Array.from({ length: Math.min(player.hand.length, 10) }).map((_, i) => (
            <div
              key={i}
              className="w-8 h-12 rounded-md bg-gray-700 border border-gray-600"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, #374151 0px, #374151 2px, #1f2937 2px, #1f2937 8px)" }}
            />
          ))}
          {player.hand.length > 10 && (
            <span className="text-gray-500 text-xs self-center ml-1">+{player.hand.length - 10}</span>
          )}
        </div>
      )}
    </div>
  );
}
