"use client";
import { Player, Game, PropertySet } from "../types/game";
import { PropertyCard, ActionCard, PropertyColor } from "../types/card";
import { PROPERTY_RULES } from "../data/propertyRules";
import { isSetComplete, getRentForSet } from "../lib/propertyUtils";
import { CardView } from "./CardView";

interface MyBoardProps {
  player: Player;
  game: Game;
  isMyTurn: boolean;
  // Selection state
  selectedCardIds: string[];
  selectedPropertyColor: string | null;
  selectedPendingId: string | null;
  selectedBoardCardId: string | null;
  selectedBoardSetId: string | null;
  rentSetId: string | null;
  rentableSets: PropertySet[];
  doubleRentCardId: string | null;
  // Derived flags
  singleProperty: boolean;
  singleRent: boolean;
  singleWildRent: boolean;
  singleHouse: boolean;
  singleHotel: boolean;
  singleDebtCollector: boolean;
  allMoney: boolean;
  singleNonPropertyNonMoney: boolean;
  singleDoubleRent: boolean;
  singlePassGo: boolean;
  singleBirthday: boolean;
  canEndTurn: boolean;
  needsDiscard: boolean;
  // Callbacks
  onAddToSet: (setId: string) => void;
  onNewSet: () => void;
  onNewSetWithColor: (color: import("../types/card").PropertyColor) => void;
  onSelectRentSet: (setId: string) => void;
  onSelectBoardCard: (cardId: string, setId: string) => void;
  onMoveToSet: (toSetId: string) => void;
  onBankCards: () => void;
  onPlayPassGo: () => void;
  onPlayBirthday: () => void;
  onPlayRent: () => void;
  onPlayWildRent: () => void;
  onToggleDoubleRent: (cardId: string) => void;
  onAddHouse: (setId: string) => void;
  onAddHotel: (setId: string) => void;
  onDiscard: () => void;
  onEndTurn: () => void;
  onDrawCards: () => void;
  onPlacePending: (cardId: string, targetSetId: string | null) => void;
  onSelectPending: (cardId: string) => void;
  onMoveWildToNewColor: (cardId: string, fromSetId: string, newColor: PropertyColor) => void;
  onClearHandSelection: () => void;
  wildRentTargetPlayerId: string | null;
}

export function MyBoard({
  player,
  game,
  isMyTurn,
  selectedCardIds,
  selectedPropertyColor,
  selectedPendingId,
  selectedBoardCardId,
  selectedBoardSetId,
  rentSetId,
  rentableSets,
  doubleRentCardId,
  singleProperty,
  singleRent,
  singleWildRent,
  singleHouse,
  singleHotel,
  singleDebtCollector,
  allMoney,
  singleNonPropertyNonMoney,
  singleDoubleRent,
  singlePassGo,
  singleBirthday,
  canEndTurn,
  needsDiscard,
  onAddToSet,
  onNewSet,
  onNewSetWithColor,
  onSelectRentSet,
  onSelectBoardCard,
  onMoveToSet,
  onBankCards,
  onPlayPassGo,
  onPlayBirthday,
  onPlayRent,
  onPlayWildRent,
  onToggleDoubleRent,
  onAddHouse,
  onAddHotel,
  onDiscard,
  onEndTurn,
  onDrawCards,
  onPlacePending,
  onSelectPending,
  onMoveWildToNewColor,
  onClearHandSelection,
  wildRentTargetPlayerId,
}: MyBoardProps) {
  const selectedCards = player.hand.filter(c => selectedCardIds.includes(c.id));
  const singleRentSelected = singleRent || singleWildRent;
  const selectedPendingCard = player.pendingPlacements.find(c => c.id === selectedPendingId) ?? null;

  return (
    <div style={{
      background: "#0d1f0d",
      border: "1px solid #1f3d1f",
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    }}>
      {/* ── Header with turn controls ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#16a34a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14, color: "white",
          }}>
            {player.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 600, fontSize: 13 }}>{player.name}</div>
            <div style={{ color: "#6b7280", fontSize: 10 }}>
              {game.actionsRemaining} action{game.actionsRemaining !== 1 ? "s" : ""} left
            </div>
          </div>
        </div>

        {isMyTurn && (
          <div style={{ display: "flex", gap: 6 }}>
            {game.phase === "drawPhase" && (
            <button onClick={onDrawCards} style={{
              background: "#1d4ed8", color: "white", border: "none",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", minHeight: 36, touchAction: "manipulation",
            }}>
              Draw 2
            </button>
            )}
            {game.phase === "actionPhase" && singlePassGo && (
            <button onClick={onPlayPassGo} style={{
              background: "#2563eb", color: "white", border: "none",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", minHeight: 36, touchAction: "manipulation",
            }}>
              Draw 2 Cards
            </button>
            )}
            {(game.phase === "actionPhase" || game.phase === "discardPhase") && (
            <button
              onClick={onEndTurn}
              disabled={!canEndTurn}
              style={{
              background: canEndTurn ? "#374151" : "#1f2937",
              color: canEndTurn ? "#e5e7eb" : "#4b5563",
              border: "none", borderRadius: 8,
              padding: "6px 12px", fontSize: 12, fontWeight: 600,
              cursor: canEndTurn ? "pointer" : "not-allowed",
              minHeight: 36, touchAction: "manipulation",
              }}
            >
              End Turn →
            </button>
          )}
        </div>
        )}
      </div>

      {/* ── Discard banner ── */}
      {isMyTurn && needsDiscard && (
        <div style={{
          background: "#450a0a", border: "1px solid #991b1b",
          borderRadius: 8, padding: "6px 10px", marginBottom: 8,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ color: "#fca5a5", fontSize: 11 }}>
            Discard {player.hand.length - 7} card{player.hand.length - 7 !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onDiscard}
            disabled={selectedCardIds.length !== 1}
            style={{
              background: selectedCardIds.length === 1 ? "#dc2626" : "#7f1d1d",
              color: selectedCardIds.length === 1 ? "white" : "#4b5563",
              border: "none", borderRadius: 6,
              padding: "3px 10px", fontSize: 11, fontWeight: 600,
              cursor: selectedCardIds.length === 1 ? "pointer" : "not-allowed",
            }}
          >
            Discard
          </button>
        </div>
      )}

      {/* ── Bank ── */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ color: "#6b7280", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>
          Bank — ${player.bank.reduce((s, c) => s + c.value, 0)}M
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {player.bank.length === 0 ? (
            <span style={{ color: "#4b5563", fontSize: 11 }}>Empty</span>
          ) : (
            player.bank.map(c => (
              <div key={c.id} style={{
                background: "#052e16", border: "1px solid #166534",
                borderRadius: 20, padding: "2px 8px",
                color: "#4ade80", fontSize: 11, fontWeight: 600,
              }}>
                ${c.value}M
              </div>
            ))
          )}
        </div>

        {/* Bank action buttons */}
        {isMyTurn && game.phase === "actionPhase" && game.actionsRemaining > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {allMoney && (
              <ActionBtn color="#16a34a" onClick={onBankCards}>
                💰 Bank {selectedCardIds.length > 1 ? `${selectedCardIds.length} Cards` : "Card"}
              </ActionBtn>
            )}
            {singleNonPropertyNonMoney && (
              <ActionBtn color="#16a34a" onClick={onBankCards}>💰 Bank Card</ActionBtn>
            )}
            {singleBirthday && (
              <>
                <ActionBtn color="#db2777" onClick={onPlayBirthday}>🎂 Everyone pays $2M</ActionBtn>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Properties ── */}
      <div>
        <div style={{ color: "#6b7280", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>
          Properties
        </div>

        {/* Pending placements */}
        {player.pendingPlacements.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ color: "#a78bfa", fontSize: 10, marginBottom: 4 }}>Received — tap to place</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {player.pendingPlacements.map(card => {
                const rule = PROPERTY_RULES[card.activeColor];
                const isSelected = selectedPendingId === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => onSelectPending(isSelected ? "" : card.id)}
                    style={{
                      background: isSelected ? "#4c1d95" : "#1e1b4b",
                      border: `1px solid ${isSelected ? "#7c3aed" : "#3730a3"}`,
                      borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: rule.color, flexShrink: 0 }} />
                    <span style={{ color: "#c4b5fd", fontSize: 10, fontWeight: 500 }}>{card.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {player.propertySets.length === 0 && player.pendingPlacements.length === 0 ? (
          <span style={{ color: "#4b5563", fontSize: 11 }}>None</span>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {player.propertySets.map(set => {
              const complete = isSetComplete(set);
              const rule = PROPERTY_RULES[set.color];
              const selectedPendingCard2 = player.pendingPlacements.find(c => c.id === selectedPendingId) ?? null;

              const isMatchingColor =
                !complete &&
                isMyTurn &&
                game.phase === "actionPhase" &&
                game.actionsRemaining > 0 &&
                (
                  (singleProperty && (
                    selectedPropertyColor === set.color ||
                    (selectedCards[0] as PropertyCard)?.colors?.includes(set.color)
                  )) ||
                  (selectedPendingCard2 !== null && (
                    selectedPendingCard2.activeColor === set.color ||
                    selectedPendingCard2.colors.includes(set.color)
                  ))
                );

              const isRentTarget =
                isMyTurn &&
                game.phase === "actionPhase" &&
                game.actionsRemaining > 0 &&
                (
                  (singleRent && rentableSets.some(s => s.id === set.id)) ||
                  singleWildRent
                );

              const isSelectedRentSet = set.id === rentSetId;

              const isMoveTarget =
                selectedBoardCardId !== null &&
                selectedBoardSetId !== null &&
                set.id !== selectedBoardSetId &&
                !complete &&
                (() => {
                  const movingCard = player.propertySets
                    .flatMap(s => s.properties)
                    .find(c => c.id === selectedBoardCardId) as PropertyCard | undefined;
                  if (!movingCard) return false;
                  if (movingCard.colors.length > 1) return movingCard.colors.includes(set.color);
                  return set.color === (player.propertySets.find(s => s.id === selectedBoardSetId)?.color);
                })();

              const isHouseTarget =
                isMyTurn && game.phase === "actionPhase" && game.actionsRemaining > 0 && singleHouse &&
                complete && !set.hasHouse &&
                set.color !== "railroad" && set.color !== "utility";

              const isHotelTarget =
                isMyTurn && game.phase === "actionPhase" && game.actionsRemaining > 0 && singleHotel &&
                complete && set.hasHouse && !set.hasHotel &&
                set.color !== "railroad" && set.color !== "utility";

              const borderColor =
                isSelectedRentSet ? "#f87171" :
                isRentTarget ? "#ef4444" :
                isMoveTarget ? "#60a5fa" :
                isMatchingColor ? "#a78bfa" :
                isHouseTarget ? "#4ade80" :
                isHotelTarget ? "#fbbf24" :
                complete ? "#ca8a04" :
                "#1f3d1f";

              return (
                <div
                  key={set.id}
                  onClick={() => {
                    if (isRentTarget) onSelectRentSet(set.id);
                    if (isMoveTarget) onMoveToSet(set.id);
                  }}
                  style={{
                    background: "#0a170a",
                    border: `1px solid ${borderColor}`,
                    borderRadius: 8,
                    padding: "6px 8px",
                    minWidth: 80,
                    cursor: (isRentTarget || isMoveTarget) ? "pointer" : "default",
                  }}
                >
                  {/* Set header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: rule.color, flexShrink: 0 }} />
                    <span style={{ color: "#e5e7eb", fontSize: 10, fontWeight: 600 }}>{rule.displayName}</span>
                    <span style={{ color: "#6b7280", fontSize: 9 }}>{set.properties.length}/{rule.setSize}</span>
                    {complete && <span style={{ color: "#fbbf24", fontSize: 9 }}>✓</span>}
                    {set.hasHouse && <span style={{ fontSize: 9 }}>🏠</span>}
                    {set.hasHotel && <span style={{ fontSize: 9 }}>🏨</span>}

                    {/* Right side — only one thing at a time */}
                    {isMatchingColor ? (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (selectedPendingCard2) {
                            onPlacePending(selectedPendingCard2.id, set.id);
                            onSelectPending("");
                          } else {
                            onAddToSet(set.id);
                          }
                        }}
                        style={{
                          marginLeft: "auto", background: "#7c3aed", color: "white",
                          border: "none", borderRadius: 4, padding: "1px 6px",
                          fontSize: 9, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Add
                      </button>
                    ) : isMoveTarget ? (
                      <button
                        onClick={e => { e.stopPropagation(); onMoveToSet(set.id); }}
                        style={{
                          marginLeft: "auto", background: "#1d4ed8", color: "white",
                          border: "none", borderRadius: 4, padding: "1px 6px",
                          fontSize: 9, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Move here
                      </button>
                    ) : isHouseTarget ? (
                      <button
                        onClick={e => { e.stopPropagation(); onAddHouse(set.id); }}
                        style={{
                          marginLeft: "auto", background: "#16a34a", color: "white",
                          border: "none", borderRadius: 4, padding: "1px 6px",
                          fontSize: 9, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        🏠 Add
                      </button>
                    ) : isHotelTarget ? (
                      <button
                        onClick={e => { e.stopPropagation(); onAddHotel(set.id); }}
                        style={{
                          marginLeft: "auto", background: "#ca8a04", color: "white",
                          border: "none", borderRadius: 4, padding: "1px 6px",
                          fontSize: 9, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        🏨 Add
                      </button>
                    ) : (
                      <span style={{ color: isRentTarget ? "#f87171" : "#4ade80", fontSize: 9, marginLeft: "auto" }}>
                        ${getRentForSet(set)}M{isRentTarget ? " rent" : ""}
                      </span>
                    )}
                  </div>

                  {/* Individual property cards */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                    {set.properties.map(prop => {
                      const isSelectedBoard = selectedBoardCardId === prop.id;
                      const canSelect =
                        !complete &&
                        (game.phase === "actionPhase" || game.phase === "discardPhase" ||
                        game.phase === "drawPhase" || game.phase === "pendingAction");

                      return (
                        <div
                          key={prop.id}
                          onClick={e => {
                            e.stopPropagation();
                            if (canSelect) {
                              onClearHandSelection();
                              onSelectBoardCard(prop.id, set.id);
                            }
                          }}
                          style={{
                            outline: isSelectedBoard ? "2px solid #3b82f6" : "none",
                            borderRadius: 8,
                            cursor: canSelect ? "pointer" : "default",
                            transform: isSelectedBoard ? "translateY(-4px)" : "none",
                            transition: "transform 0.1s",
                          }}
                        >
                          <CardView card={prop} size="sm" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New Set / Wild color picker */}
        {isMyTurn && (game.phase === "actionPhase" || game.phase === "pendingAction") &&
          (singleProperty || selectedPendingCard !== null) && (
          <div style={{ marginTop: 6 }}>
            {(() => {
              const card = selectedPendingCard ?? (singleProperty ? selectedCards[0] as PropertyCard : null);
              if (!card) return null;
              const isWild = card.colors.length > 1;
              if (isWild) {
                return (
                  <div>
                    <div style={{ color: "#9ca3af", fontSize: 10, marginBottom: 4 }}>
                      {card.colors.length > 2 ? "Choose color:" : "New set as:"}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {card.colors.map(color => {
                        const r = PROPERTY_RULES[color];
                        const isAllColor = card.colors.length > 2;
                        return (
                          <button
                            key={color}
                            onClick={() => {
                              if (selectedPendingCard) {
                              onPlacePending(selectedPendingCard.id, null);
                              onSelectPending("");
                              } else {
                              onNewSetWithColor(color);
                              }
                            }}
                            style={{
                              background: r.color + "33",
                              border: `1px solid ${r.color}`,
                              borderRadius: 6, padding: "3px 8px",
                              color: "white", fontSize: 10, fontWeight: 500,
                              cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 4,
                              minHeight: 32, touchAction: "manipulation",
                            }}
                          >
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                            {!isAllColor && r.displayName}
                          </button>
                        );
                        })}
                    </div>
                  </div>
                );
              }
              return (
                <button
                  onClick={() => {
                    if (selectedPendingCard) {
                      onPlacePending(selectedPendingCard.id, null);
                      onSelectPending("");
                    } else {
                      onNewSet();
                    }
                  }}
                  style={{
                    background: "#4c1d95", border: "1px solid #7c3aed",
                    borderRadius: 6, padding: "4px 10px",
                    color: "white", fontSize: 10, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  ＋ New Set
                </button>
              );
            })()}
          </div>
        )}

        {/* Rent / Wild Rent charge section */}
        {isMyTurn && game.phase === "actionPhase" && singleRentSelected && rentSetId && (
          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {(() => {
              const doubleCard = player.hand.find(
                c => c.type === "action" &&
                (c as ActionCard).action === "doubleRent" &&
                c.id !== selectedCardIds[0]
              );
              return doubleCard ? (
                <button
                  onClick={() => onToggleDoubleRent(doubleCard.id)}
                  style={{
                    background: doubleRentCardId ? "#7e22ce" : "#1f1535",
                    border: `1px solid ${doubleRentCardId ? "#a855f7" : "#4c1d95"}`,
                    borderRadius: 6, padding: "4px 10px",
                    color: doubleRentCardId ? "white" : "#a78bfa",
                    fontSize: 10, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  {doubleRentCardId ? "✓ Double Rent" : "Double Rent?"}
                </button>
              ) : null;
            })()}

            {singleRent && (
              <button onClick={onPlayRent} style={{
                background: "#991b1b", border: "1px solid #ef4444",
                borderRadius: 6, padding: "4px 10px",
                color: "white", fontSize: 10, fontWeight: 600, cursor: "pointer",
              }}>
                💸 Charge Rent{doubleRentCardId ? " (×2)" : ""}
              </button>
            )}

            {singleWildRent && (
              <button
                onClick={onPlayWildRent}
                disabled={!wildRentTargetPlayerId && game.players.filter(p => p.id !== player.id).length > 1}
                style={{
                  background: "#991b1b", border: "1px solid #ef4444",
                  borderRadius: 6, padding: "4px 10px",
                  color: "white", fontSize: 10, fontWeight: 600,
                  cursor: "pointer", opacity: !wildRentTargetPlayerId && game.players.filter(p => p.id !== player.id).length > 1 ? 0.4 : 1,
                }}
              >
                💸 Wild Rent{doubleRentCardId ? " (×2)" : ""}
                {wildRentTargetPlayerId
                  ? ` → ${game.players.find(p => p.id === wildRentTargetPlayerId)?.name}`
                  : game.players.filter(p => p.id !== player.id).length === 1
                    ? ` → ${game.players.find(p => p.id !== player.id)?.name}`
                    : ""}
              </button>
            )}
          </div>
        )}

        {/* New set option for wild card on board */}
        {(game.phase === "actionPhase" || game.phase === "discardPhase") &&
          selectedBoardCardId !== null && selectedBoardSetId !== null && (() => {
            const movingCard = player.propertySets
              .flatMap(s => s.properties)
              .find(c => c.id === selectedBoardCardId) as PropertyCard | undefined;
            const fromSet = player.propertySets.find(s => s.id === selectedBoardSetId);
            if (!movingCard || !fromSet || movingCard.colors.length <= 1) return null;
            if (isSetComplete(fromSet)) return null;

            // Show color options for colors not already the active color
            const otherColors = movingCard.colors.filter(c => c !== fromSet.color);
            return (
              <div style={{ marginTop: 6 }}>
                <div style={{ color: "#9ca3af", fontSize: 10, marginBottom: 4 }}>
                  Move wild to new set as:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {otherColors.map(color => {
                    const r = PROPERTY_RULES[color];
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          onMoveWildToNewColor(selectedBoardCardId, selectedBoardSetId, color);
                        }}
                        style={{
                          background: r.color + "33",
                          border: `1px solid ${r.color}`,
                          borderRadius: 6, padding: "3px 8px",
                          color: "white", fontSize: 10, fontWeight: 500,
                          cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4,
                          minHeight: 32,
                        }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                        {r.displayName}
                      </button>
                    );
                  })}
                </div>
            </div>
            );
        })()
        }
      </div>
    </div>
  );
}

function ActionBtn({ color, onClick, children }: { color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: color, color: "white", border: "none",
        borderRadius: 6, padding: "4px 10px",
        fontSize: 10, fontWeight: 600, cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}