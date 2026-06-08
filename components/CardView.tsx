"use client";
import React from "react";
import { Card, PropertyCard, ActionCard, RentCard } from "../types/card";
import { getColorHex, getColorName, getColorText } from "../lib/colorUtils";

interface CardViewProps {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  small?: boolean;
  disabled?: boolean;
}

export function CardView({ card, selected, onClick, small, disabled }: CardViewProps) {
  const base = small ? "w-16 h-24 text-[9px]" : "w-24 h-36 text-xs";
  const cursor = onClick && !disabled ? "cursor-pointer hover:scale-105" : "";
  const ring = selected ? "ring-2 ring-yellow-400 scale-105" : "";
  const dimmed = disabled ? "opacity-40" : "";

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative rounded-lg border border-gray-600 flex flex-col overflow-hidden shadow-md transition-all select-none ${base} ${cursor} ${ring} ${dimmed}`}
      style={{ backgroundColor: getCardBg(card) }}
    >
      {/* Color band for property cards */}
      {card.type === "property" && (
        <div
          className="w-full flex-shrink-0"
          style={{
            height: small ? 20 : 28,
            backgroundColor: getColorHex((card as PropertyCard).activeColor),
          }}
        >
          {(card as PropertyCard).colors.length > 1 && (
            <div className="flex h-full">
              {(card as PropertyCard).colors.map((c, i) => (
                <div
                  key={c}
                  className="flex-1"
                  style={{ backgroundColor: getColorHex(c), opacity: i === 0 ? 1 : 0.7 }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rent card color stripes */}
      {card.type === "rent" && (
        <div className="flex w-full flex-shrink-0" style={{ height: small ? 10 : 14 }}>
          {(card as RentCard).rentableColors.map(c => (
            <div
              key={c}
              className="flex-1"
              style={{ backgroundColor: getColorHex(c) }}
            />
          ))}
        </div>
      )}

      <div className={`flex flex-col flex-1 p-1 ${card.type === "money" ? "items-center justify-center" : ""}`}>
        {card.type === "money" ? (
          <>
            <div className="font-black" style={{ fontSize: small ? 18 : 26, color: "#15803d" }}>
              ${card.value}M
            </div>
          </>
        ) : (
          <>
            <div className="font-bold leading-tight text-white drop-shadow-sm line-clamp-2">
              {card.name}
            </div>
            {card.type === "property" && (
              <div className="mt-auto text-gray-300">
                {getColorName((card as PropertyCard).activeColor)}
              </div>
            )}
            {card.type === "rent" && (
              <div className="mt-1 text-gray-200 leading-tight">
                {(card as RentCard).rentableColors.map(getColorName).join(" / ")}
              </div>
            )}
            {card.type === "action" && (
              <div className="mt-1 text-gray-300">{getActionLabel((card as ActionCard).action)}</div>
            )}
            <div className="mt-auto text-gray-300 font-semibold">${ card.value }M</div>
          </>
        )}
      </div>

      {/* Value badge top-right */}
      {card.type !== "money" && (
        <div className="absolute top-0.5 right-0.5 bg-black/50 rounded px-0.5 text-white font-bold" style={{ fontSize: 9 }}>
          ${card.value}
        </div>
      )}
    </div>
  );
}

function getCardBg(card: Card): string {
  if (card.type === "money") return "#1a2e1a";
  if (card.type === "property") return "#1e1e2e";
  if (card.type === "rent") return "#1e1e2e";
  if (card.type === "action") return "#2a1a2e";
  return "#1e1e2e";
}

function getActionLabel(action: ActionCard["action"]): string {
  switch (action) {
    case "passGo": return "Draw 2 cards";
    case "itsMyBirthday": return "Everyone pays $2M";
    case "debtCollector": return "Collect $5M";
    case "slyDeal": return "Steal 1 property";
    case "forcedDeal": return "Swap properties";
    case "dealBreaker": return "Steal a full set";
    case "justSayNo": return "Block an action";
    case "rentWild": return "Charge any player";
    case "house": return "+$3M rent";
    case "hotel": return "+$4M rent";
    default: return "";
  }
}
