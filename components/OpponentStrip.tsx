"use client";
import { useState } from "react";
import { Player, Game, PropertySet } from "../types/game";
import { PropertyCard } from "../types/card";
import { PROPERTY_RULES } from "../data/propertyRules";
import { isSetComplete, getRentForSet } from "../lib/propertyUtils";
import { CardView } from "./CardView";

interface OpponentStripProps {
  player: Player;
  game: Game;
  isCurrentTurn: boolean;
  isMyTurn: boolean;
  // Debt collector targeting
  singleDebtCollector: boolean;
  onPlayDebtCollector: (targetPlayerId: string) => void;
  // Wild rent targeting
  singleWildRent: boolean;
  wildRentTargetPlayerId: string | null;
  rentSetId: string | null;
  onSetWildRentTarget: (id: string) => void;
}

export function OpponentStrip({
  player,
  game,
  isCurrentTurn,
  isMyTurn,
  singleDebtCollector,
  onPlayDebtCollector,
  singleWildRent,
  wildRentTargetPlayerId,
  rentSetId,
  onSetWildRentTarget,
}: OpponentStripProps) {
  const [expanded, setExpanded] = useState(false);
  const bankValue = player.bank.reduce((s, c) => s + c.value, 0);
  const completeSets = player.propertySets.filter(isSetComplete).length;

  return (
    <div style={{
      background: "#0a170a",
      border: `1px solid ${isCurrentTurn ? "#16a34a" : "#1f3d1f"}`,
      borderRadius: 10,
      marginBottom: 6,
      overflow: "hidden",
    }}>
      {/* ── Compact strip ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 10px",
        gap: 8,
      }}>
        {/* Avatar */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: isCurrentTurn ? "#16a34a" : "#374151",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 12, color: "white", flexShrink: 0,
        }}>
          {player.name[0].toUpperCase()}
        </div>

        {/* Name + stats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "white", fontWeight: 600, fontSize: 12 }}>{player.name}</span>
            {isCurrentTurn && (
              <span style={{ color: "#4ade80", fontSize: 9, fontWeight: 500 }}>● Turn</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 1 }}>
            <span style={{ color: "#6b7280", fontSize: 10 }}>
              🏦 <span style={{ color: "#9ca3af" }}>${bankValue}M</span>
            </span>
            <span style={{ color: "#6b7280", fontSize: 10 }}>
              🃏 <span style={{ color: "#9ca3af" }}>{player.hand.length}</span>
            </span>
            <span style={{ color: "#6b7280", fontSize: 10 }}>
              🏆 <span style={{ color: "#9ca3af" }}>{completeSets}/3</span>
            </span>
          </div>
        </div>

        {/* Property color pips */}
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 80 }}>
          {player.propertySets.map(set => {
            const rule = PROPERTY_RULES[set.color];
            const complete = isSetComplete(set);
            return (
              <div
                key={set.id}
                style={{
                  width: 10,
                  height: 14,
                  borderRadius: 2,
                  background: rule.color,
                  opacity: complete ? 1 : 0.4,
                  border: complete ? "1px solid #fbbf24" : "none",
                }}
              />
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {isMyTurn && singleDebtCollector && (
            <button
              onClick={() => onPlayDebtCollector(player.id)}
              style={{
                background: "#ea580c", color: "white", border: "none",
                borderRadius: 6, padding: "4px 8px", fontSize: 10,
                fontWeight: 600, cursor: "pointer",
              }}
            >
              Collect $5M
            </button>
          )}
          {isMyTurn && singleWildRent && rentSetId && (
            <button
              onClick={() => onSetWildRentTarget(player.id)}
              style={{
                background: wildRentTargetPlayerId === player.id ? "#7c3aed" : "#1e1b4b",
                border: `1px solid ${wildRentTargetPlayerId === player.id ? "#a855f7" : "#3730a3"}`,
                color: "white", borderRadius: 6, padding: "4px 8px",
                fontSize: 10, fontWeight: 600, cursor: "pointer",
              }}
            >
              {wildRentTargetPlayerId === player.id ? "✓ Target" : "Target"}
            </button>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: "transparent",
              border: "1px solid #374151",
              borderRadius: 6, padding: "4px 8px",
              color: "#9ca3af", fontSize: 10, cursor: "pointer",
            }}
          >
            {expanded ? "Hide" : "View"}
          </button>
        </div>
      </div>

      {/* ── Expanded board ── */}
      {expanded && (
        <div style={{
          borderTop: "1px solid #1f3d1f",
          padding: "8px 10px",
          background: "#060f06",
        }}>
          {/* Bank */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ color: "#6b7280", fontSize: 10, fontWeight: 500, marginBottom: 4 }}>
              Bank — ${bankValue}M
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {player.bank.length === 0 ? (
                <span style={{ color: "#4b5563", fontSize: 10 }}>Empty</span>
              ) : (
                player.bank.map(c => (
                  <div key={c.id} style={{
                    background: "#052e16", border: "1px solid #166534",
                    borderRadius: 20, padding: "1px 6px",
                    color: "#4ade80", fontSize: 10, fontWeight: 600,
                  }}>
                    ${c.value}M
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Properties */}
          <div>
            <div style={{ color: "#6b7280", fontSize: 10, fontWeight: 500, marginBottom: 4 }}>
              Properties
            </div>
            {player.propertySets.length === 0 ? (
              <span style={{ color: "#4b5563", fontSize: 10 }}>None</span>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {player.propertySets.map(set => {
                  const complete = isSetComplete(set);
                  const rule = PROPERTY_RULES[set.color];
                  return (
                    <div key={set.id} style={{
                      background: "#0a170a",
                      border: `1px solid ${complete ? "#ca8a04" : "#1f3d1f"}`,
                      borderRadius: 6, padding: "4px 6px", minWidth: 70,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: rule.color }} />
                        <span style={{ color: "#e5e7eb", fontSize: 9, fontWeight: 600 }}>{rule.displayName}</span>
                        <span style={{ color: "#6b7280", fontSize: 8 }}>{set.properties.length}/{rule.setSize}</span>
                        {complete && <span style={{ color: "#fbbf24", fontSize: 8 }}>✓</span>}
                        {set.hasHouse && <span style={{ fontSize: 8 }}>🏠</span>}
                        {set.hasHotel && <span style={{ fontSize: 8 }}>🏨</span>}
                        <span style={{ color: "#f87171", fontSize: 8, marginLeft: "auto" }}>
                          ${getRentForSet(set)}M
                        </span>
                      </div>
                      {/* Individual property cards */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                        {set.properties.map(prop => (
                          <CardView key={prop.id} card={prop} size="sm" />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hidden hand */}
          <div style={{ marginTop: 8 }}>
            <div style={{ color: "#6b7280", fontSize: 10, fontWeight: 500, marginBottom: 4 }}>
              Hand ({player.hand.length})
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {Array.from({ length: Math.min(player.hand.length, 10) }).map((_, i) => (
                <div key={i} style={{
                  width: 20, height: 28, borderRadius: 3,
                  background: "#1f2937", border: "1px solid #374151",
                }} />
              ))}
              {player.hand.length > 10 && (
                <span style={{ color: "#6b7280", fontSize: 10, alignSelf: "center" }}>
                  +{player.hand.length - 10}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}