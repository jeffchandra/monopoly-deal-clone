"use client";
import { Card, PropertyCard, RentCard, ActionCard } from "../types/card";
import { PROPERTY_RULES } from "../data/propertyRules";

interface CardViewProps {
  card: Card;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { width: 52, height: 74, bandHeight: 16, nameFontSize: 7, valueFontSize: 9, subFontSize: 7 },
  md: { width: 68, height: 96, bandHeight: 20, nameFontSize: 9, valueFontSize: 11, subFontSize: 8 },
  lg: { width: 84, height: 118, bandHeight: 24, nameFontSize: 10, valueFontSize: 13, subFontSize: 9 },
};

export function CardView({ card, selected, dimmed, onClick, size = "md" }: CardViewProps) {
  const s = SIZES[size];

  return (
    <div
      onClick={onClick}
      style={{
        width: s.width,
        height: s.height,
        flexShrink: 0,
        borderRadius: 8,
        border: selected ? "2px solid #facc15" : "1px solid #d1d5db",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        opacity: dimmed ? 0.4 : 1,
        transform: selected ? "translateY(-4px)" : "none",
        transition: "transform 0.1s, border 0.1s",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        boxShadow: selected ? "0 4px 12px rgba(250,204,21,0.4)" : "0 1px 3px rgba(0,0,0,0.3)",
      }}
    >
      {/* Color band */}
      {card.type === "property" && (
        <PropertyBand card={card as PropertyCard} height={s.bandHeight} />
      )}
      {card.type === "rent" && (
        <RentBand card={card as RentCard} height={s.bandHeight} />
      )}
      {card.type === "action" && (
        <ActionBand card={card as ActionCard} height={s.bandHeight} />
      )}
      {card.type === "money" && (
        <div style={{ height: s.bandHeight, background: "#15803d" }} />
      )}

      {/* Card body */}
      <div style={{ flex: 1, padding: "3px 4px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {card.type === "money" ? (
          <MoneyBody card={card} valueFontSize={s.valueFontSize * 1.8} subFontSize={s.subFontSize} />
        ) : (
          <RegularBody card={card} nameFontSize={s.nameFontSize} valueFontSize={s.valueFontSize} subFontSize={s.subFontSize} />
        )}
      </div>
    </div>
  );
}

function PropertyBand({ card, height }: { card: PropertyCard; height: number }) {
  if (card.colors.length === 1) {
    const rule = PROPERTY_RULES[card.activeColor];
    return <div style={{ height, background: rule.color, flexShrink: 0 }} />;
  }
  // Wild card — split band
  return (
    <div style={{ height, display: "flex", flexShrink: 0 }}>
      {card.colors.map(c => (
        <div key={c} style={{ flex: 1, background: PROPERTY_RULES[c].color }} />
      ))}
    </div>
  );
}

function RentBand({ card, height }: { card: RentCard; height: number }) {
  return (
    <div style={{ height, display: "flex", flexShrink: 0 }}>
      {card.rentableColors.map(c => (
        <div key={c} style={{ flex: 1, background: PROPERTY_RULES[c].color }} />
      ))}
    </div>
  );
}

function ActionBand({ card, height }: { card: ActionCard; height: number }) {
  const colors: Record<string, string> = {
    passGo: "#2563eb",
    itsMyBirthday: "#db2777",
    debtCollector: "#ea580c",
    slyDeal: "#dc2626",
    forcedDeal: "#c2410c",
    dealBreaker: "#7c3aed",
    justSayNo: "#0891b2",
    rentWild: "#7c3aed",
    house: "#16a34a",
    hotel: "#ca8a04",
    doubleRent: "#9333ea",
  };
  const bg = colors[card.action] ?? "#6b7280";
  return (
    <div style={{
      height,
      background: bg,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <span style={{ color: "white", fontSize: 7, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {getActionLabel(card.action)}
      </span>
    </div>
  );
}

function MoneyBody({ card, valueFontSize, subFontSize }: { card: Card; valueFontSize: number; subFontSize: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <div style={{ fontSize: valueFontSize, fontWeight: 700, color: "#15803d", lineHeight: 1 }}>
        ${card.value}M
      </div>
    </div>
  );
}

function RegularBody({ card, nameFontSize, valueFontSize, subFontSize }: {
  card: Card;
  nameFontSize: number;
  valueFontSize: number;
  subFontSize: number;
}) {
  const propCard = card.type === "property" ? card as PropertyCard : null;
  const rentCard = card.type === "rent" ? card as RentCard : null;
  const actionCard = card.type === "action" ? card as ActionCard : null;

  return (
    <>
      <div style={{ fontSize: nameFontSize, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>
        {card.name}
      </div>
      <div>
        {propCard && (
          <div style={{ fontSize: subFontSize, color: "#6b7280" }}>
            {propCard.colors.length > 2
              ? "All Colors"
              : propCard.colors.length > 1
                ? propCard.colors.map(c => PROPERTY_RULES[c].displayName).join("/")
                : PROPERTY_RULES[propCard.activeColor].displayName}
          </div>
        )}
        {rentCard && (
          <div style={{ fontSize: subFontSize, color: "#6b7280" }}>
            {rentCard.rentableColors.map(c => PROPERTY_RULES[c].displayName).join("/")}
          </div>
        )}
        {actionCard && (
          <div style={{ fontSize: subFontSize, color: "#6b7280" }}>
            {getActionDescription(actionCard.action)}
          </div>
        )}
        <div style={{ fontSize: valueFontSize, fontWeight: 600, color: "#374151", marginTop: 2 }}>
          ${card.value}M
        </div>
      </div>
    </>
  );
}

function getActionLabel(action: ActionCard["action"]): string {
  switch (action) {
    case "passGo": return "Action";
    case "itsMyBirthday": return "Action";
    case "debtCollector": return "Action";
    case "slyDeal": return "Action";
    case "forcedDeal": return "Action";
    case "dealBreaker": return "Action";
    case "justSayNo": return "Action";
    case "rentWild": return "Rent";
    case "house": return "Building";
    case "hotel": return "Building";
    case "doubleRent": return "Action";
    default: return "Action";
  }
}

function getActionDescription(action: ActionCard["action"]): string {
  switch (action) {
    case "passGo": return "Draw 2 cards";
    case "itsMyBirthday": return "All pay $2M";
    case "debtCollector": return "Collect $5M";
    case "slyDeal": return "Steal property";
    case "forcedDeal": return "Swap property";
    case "dealBreaker": return "Steal full set";
    case "justSayNo": return "Block action";
    case "rentWild": return "Charge anyone";
    case "house": return "+$3M rent";
    case "hotel": return "+$4M rent";
    case "doubleRent": return "Double rent";
    default: return "";
  }
}