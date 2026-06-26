"use client";
import { useState } from "react";
import { Game, Player } from "../types/game";
import { ActionCard, PropertyCard } from "../types/card";
import { PROPERTY_RULES } from "../data/propertyRules";
import { isSetComplete, getRentForSet } from "../lib/propertyUtils";

interface ActionCardModalProps {
  game: Game;
  card: ActionCard;
  playerId: string;
  onPlayPassGo: () => void;
  onPlayBirthday: () => void;
  onPlayDebtCollector: (targetPlayerId: string) => void;
  onPlaySlyDeal: (targetPlayerId: string, targetSetId: string, targetCardId: string) => void;
  onPlayForcedDeal: (targetPlayerId: string, targetSetId: string, targetCardId: string, offeredSetId: string, offeredCardId: string) => void;
  onPlayHouse: (setId: string) => void;
  onPlayHotel: (setId: string) => void;
  onPlayWildRent: (setId: string, targetPlayerId: string) => void;
  onBank: () => void;
  onCancel: () => void;
}

export function ActionCardModal({
  game, card, playerId,
  onPlayPassGo, onPlayBirthday, onPlayDebtCollector,
  onPlaySlyDeal, onPlayForcedDeal, onPlayHouse, onPlayHotel,
  onPlayWildRent, onBank, onCancel,
}: ActionCardModalProps) {
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(
    game.players.filter(p => p.id !== playerId).length === 1
      ? game.players.filter(p => p.id !== playerId)[0].id
      : null
  );
  const [targetSetId, setTargetSetId] = useState<string | null>(null);
  const [targetCardId, setTargetCardId] = useState<string | null>(null);
  const [offeredSetId, setOfferedSetId] = useState<string | null>(null);
  const [offeredCardId, setOfferedCardId] = useState<string | null>(null);
  const [wildRentSetId, setWildRentSetId] = useState<string | null>(null);
  const [wildRentTargetId, setWildRentTargetId] = useState<string | null>(
    game.players.filter(p => p.id !== playerId).length === 1
      ? game.players.filter(p => p.id !== playerId)[0].id
      : null
  );

  const player = game.players.find(p => p.id === playerId)!;
  const opponents = game.players.filter(p => p.id !== playerId);
  const targetPlayer = targetPlayerId ? game.players.find(p => p.id === targetPlayerId) ?? null : null;

  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 50, padding: 16,
  };

  const modal: React.CSSProperties = {
    background: "#0a170a", border: "1px solid #1f3d1f",
    borderRadius: 16, padding: 20, width: "100%", maxWidth: 420,
    maxHeight: "85vh", overflowY: "auto",
  };

  const label: React.CSSProperties = {
    color: "#6b7280", fontSize: 11, fontWeight: 500,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
  };

  const btn = (bg: string, disabled = false): React.CSSProperties => ({
    background: disabled ? "#1f2937" : bg,
    color: disabled ? "#4b5563" : "white",
    border: "none", borderRadius: 8,
    padding: "10px 16px", fontSize: 13, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    minHeight: 44, flex: 1,
  });

  const chip = (selected: boolean): React.CSSProperties => ({
    background: selected ? "#1e40af" : "#0a170a",
    border: `1px solid ${selected ? "#3b82f6" : "#1f3d1f"}`,
    borderRadius: 8, padding: "8px 10px", cursor: "pointer",
    minHeight: 44,
  });

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ color: "white", fontSize: 18, fontWeight: 700 }}>{card.name}</div>
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{getDescription(card)}</div>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        {/* Sly Deal */}
        {card.action === "slyDeal" && (
          <div>
            {opponents.length > 1 && (
              <>
                <div style={label}>Steal from:</div>
                <OpponentPicker opponents={opponents} selected={targetPlayerId} onSelect={id => { setTargetPlayerId(id); setTargetSetId(null); setTargetCardId(null); }} />
              </>
            )}
            {targetPlayer && (
              <>
                <div style={{ ...label, marginTop: 12 }}>{targetPlayer.name}'s properties:</div>
                {targetPlayer.propertySets.filter(s => !isSetComplete(s)).length === 0 ? (
                  <div style={{ color: "#4b5563", fontSize: 12, marginBottom: 12 }}>No stealable properties.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {targetPlayer.propertySets.filter(s => !isSetComplete(s)).map(set => {
                      const rule = PROPERTY_RULES[set.color];
                      return (
                        <div key={set.id}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: rule.color }} />
                            <span style={{ color: "#9ca3af", fontSize: 11 }}>{rule.displayName} ({set.properties.length})</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {set.properties.map(prop => (
                              <div key={prop.id} onClick={() => { setTargetSetId(set.id); setTargetCardId(prop.id); }} style={chip(targetCardId === prop.id)}>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: rule.color }} />
                                  <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>{prop.name}</span>
                                </div>
                                <div style={{ color: "#6b7280", fontSize: 10 }}>${prop.value}M</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => targetPlayerId && targetSetId && targetCardId && onPlaySlyDeal(targetPlayerId, targetSetId, targetCardId)} disabled={!targetCardId} style={btn("#dc2626", !targetCardId)}>Steal Property</button>
              <button onClick={onBank} style={btn("#374151")}>Bank ${card.value}M</button>
            </div>
          </div>
        )}

        {/* Forced Deal */}
        {card.action === "forcedDeal" && (
          <div>
            {opponents.length > 1 && (
              <>
                <div style={label}>Swap with:</div>
                <OpponentPicker opponents={opponents} selected={targetPlayerId} onSelect={id => { setTargetPlayerId(id); setTargetSetId(null); setTargetCardId(null); }} />
              </>
            )}
            {targetPlayer && (
              <>
                <div style={{ ...label, marginTop: 12 }}>Their property (you want):</div>
                {targetPlayer.propertySets.filter(s => !isSetComplete(s)).length === 0 ? (
                  <div style={{ color: "#4b5563", fontSize: 12, marginBottom: 8 }}>No stealable properties.</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {targetPlayer.propertySets.filter(s => !isSetComplete(s)).flatMap(set =>
                      set.properties.map(prop => {
                        const rule = PROPERTY_RULES[set.color];
                        return (
                          <div key={prop.id} onClick={() => { setTargetSetId(set.id); setTargetCardId(prop.id); }} style={chip(targetCardId === prop.id)}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: rule.color }} />
                              <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>{prop.name}</span>
                            </div>
                            <div style={{ color: "#6b7280", fontSize: 10 }}>${prop.value}M · {rule.displayName}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                <div style={{ ...label, marginTop: 8 }}>Your property (you give):</div>
                {player.propertySets.filter(s => !isSetComplete(s)).length === 0 ? (
                  <div style={{ color: "#4b5563", fontSize: 12, marginBottom: 8 }}>No properties to offer.</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {player.propertySets.filter(s => !isSetComplete(s)).flatMap(set =>
                      set.properties.map(prop => {
                        const rule = PROPERTY_RULES[set.color];
                        return (
                          <div key={prop.id} onClick={() => { setOfferedSetId(set.id); setOfferedCardId(prop.id); }} style={chip(offeredCardId === prop.id)}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: rule.color }} />
                              <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>{prop.name}</span>
                            </div>
                            <div style={{ color: "#6b7280", fontSize: 10 }}>${prop.value}M · {rule.displayName}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => targetPlayerId && targetSetId && targetCardId && offeredSetId && offeredCardId &&
                  onPlayForcedDeal(targetPlayerId, targetSetId, targetCardId, offeredSetId, offeredCardId)}
                disabled={!targetCardId || !offeredCardId}
                style={btn("#ea580c", !targetCardId || !offeredCardId)}
              >
                Swap Properties
              </button>
              <button onClick={onBank} style={btn("#374151")}>Bank ${card.value}M</button>
            </div>
          </div>
        )}

        {/* Double Rent */}
        {card.action === "doubleRent" && (
          <div>
            <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>
              Play alongside a rent card to double the amount charged. Select a rent card first, then use the Double Rent toggle.
            </div>
            <button onClick={onBank} style={{ ...btn("#374151"), flex: "none", width: "100%" }}>
              Bank ${card.value}M
            </button>
          </div>
        )}

        {/* House */}
        {card.action === "house" && (
          <div>
            <div style={{ ...label }}>Add house to a complete set:</div>
            {player.propertySets.filter(s => isSetComplete(s) && !s.hasHouse && s.color !== "railroad" && s.color !== "utility").length === 0 ? (
              <div style={{ color: "#4b5563", fontSize: 12, marginBottom: 12 }}>No eligible sets.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {player.propertySets.filter(s => isSetComplete(s) && !s.hasHouse && s.color !== "railroad" && s.color !== "utility").map(set => {
                  const rule = PROPERTY_RULES[set.color];
                  return (
                    <div key={set.id} onClick={() => setTargetSetId(set.id === targetSetId ? null : set.id)} style={{
                      ...chip(targetSetId === set.id),
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: rule.color }} />
                        <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{rule.displayName}</span>
                        <span style={{ color: "#6b7280", fontSize: 11 }}>✓</span>
                      </div>
                      <span style={{ color: "#f87171", fontSize: 11 }}>
                        ${getRentForSet(set)}M → ${getRentForSet(set) + 3}M
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => targetSetId && onPlayHouse(targetSetId)} disabled={!targetSetId} style={btn("#16a34a", !targetSetId)}>🏠 Add House</button>
              <button onClick={onBank} style={btn("#374151")}>Bank ${card.value}M</button>
            </div>
          </div>
        )}

        {/* Hotel */}
        {card.action === "hotel" && (
          <div>
            <div style={label}>Add hotel to a complete set with a house:</div>
            {player.propertySets.filter(s => isSetComplete(s) && s.hasHouse && !s.hasHotel && s.color !== "railroad" && s.color !== "utility").length === 0 ? (
              <div style={{ color: "#4b5563", fontSize: 12, marginBottom: 12 }}>No eligible sets — need a complete set with a house.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {player.propertySets.filter(s => isSetComplete(s) && s.hasHouse && !s.hasHotel && s.color !== "railroad" && s.color !== "utility").map(set => {
                  const rule = PROPERTY_RULES[set.color];
                  return (
                    <div key={set.id} onClick={() => setTargetSetId(set.id === targetSetId ? null : set.id)} style={{
                      ...chip(targetSetId === set.id),
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: rule.color }} />
                        <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{rule.displayName}</span>
                        <span style={{ fontSize: 11 }}>🏠✓</span>
                      </div>
                      <span style={{ color: "#f87171", fontSize: 11 }}>
                        ${getRentForSet(set)}M → ${getRentForSet(set) + 4}M
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => targetSetId && onPlayHotel(targetSetId)} disabled={!targetSetId} style={btn("#ca8a04", !targetSetId)}>🏨 Add Hotel</button>
              <button onClick={onBank} style={btn("#374151")}>Bank ${card.value}M</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function OpponentPicker({ opponents, selected, onSelect }: {
  opponents: Player[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (opponents.length === 1) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
      {opponents.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          style={{
            background: selected === p.id ? "#16a34a" : "#0f1f0f",
            border: `1px solid ${selected === p.id ? "#4ade80" : "#1f3d1f"}`,
            borderRadius: 8, padding: "8px 16px",
            color: selected === p.id ? "white" : "#9ca3af",
            fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 44,
          }}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

function getDescription(card: ActionCard): string {
  switch (card.action) {
    case "passGo": return "Draw 2 extra cards.";
    case "itsMyBirthday": return "All opponents pay you $2M.";
    case "debtCollector": return "One opponent pays you $5M.";
    case "slyDeal": return "Steal one property from an incomplete set.";
    case "forcedDeal": return "Swap one of your properties with one of theirs.";
    case "dealBreaker": return "Steal an entire complete set!";
    case "justSayNo": return "Block an action card used against you.";
    case "rentWild": return "Charge one player rent for any of your sets.";
    case "house": return "Add a house to a complete set (+$3M rent).";
    case "hotel": return "Add a hotel to a complete set with a house (+$4M rent).";
    case "doubleRent": return "Play with a rent card to double the rent charged.";
    default: return "";
  }
}