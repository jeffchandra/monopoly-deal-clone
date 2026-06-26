"use client";
import { Card, PropertyCard, ActionCard } from "../types/card";
import { CardView } from "./CardView";

interface MyHandProps {
  cards: Card[];
  selectedCardIds: string[];
  needsDiscard: boolean;
  onToggleCard: (cardId: string) => void;
}

export function MyHand({ cards, selectedCardIds, needsDiscard, onToggleCard }: MyHandProps) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
        padding: "0 2px",
      }}>
        <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Your Hand ({cards.length})
        </span>
        {needsDiscard && (
          <span style={{ color: "#f87171", fontSize: 11, fontWeight: 500 }}>
            ⚠ Discard {cards.length - 7}
          </span>
        )}
      </div>

      {cards.length === 0 ? (
        <div style={{ color: "#4b5563", fontSize: 12, padding: "8px 2px" }}>
          Empty hand
        </div>
      ) : (
        <div style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 8,
          paddingTop: 4,
          scrollbarWidth: "none",
        }}>
          {cards.map(card => (
            <CardView
              key={card.id}
              card={card}
              size="md"
              selected={selectedCardIds.includes(card.id)}
              onClick={() => onToggleCard(card.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}