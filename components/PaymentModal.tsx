"use client";
import { Game, PendingPayment } from "../types/game";
import { PropertyCard } from "../types/card";
import { PROPERTY_RULES } from "../data/propertyRules";

interface PaymentModalProps {
  game: Game;
  pending: PendingPayment;
  viewingPlayerId: string;
  myPlayerId?: string;
  paymentCardIds: string[];
  onToggleCard: (cardId: string) => void;
  onConfirm: () => void;
  onSwitchToPlayer: (playerId: string) => void;
  myJsnCard?: { id: string } | null;
  onPlayJustSayNo?: (cardId: string) => void;
  canPlayJsn?: boolean;
}

export function PaymentModal({
  game, pending, viewingPlayerId, myPlayerId,
  paymentCardIds, onToggleCard, onConfirm, onSwitchToPlayer,
  myJsnCard, onPlayJustSayNo, canPlayJsn,
}: PaymentModalProps) {
  const isMyPayment = pending.fromPlayerId === viewingPlayerId;
  const payer = game.players.find(p => p.id === pending.fromPlayerId)!;
  const creditor = game.players.find(p => p.id === pending.toPlayerId)!;
  const jsnCount = pending.jsnCount ?? 0;
  const isBlocked = jsnCount % 2 === 1;

  // ── Pass and play waiting screen ───────────────────────────────────────────
  if (!isMyPayment && !myPlayerId) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#0f1f0f",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: 32,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ color: "white", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Waiting for {payer.name}...
        </div>
        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 32 }}>
          Pass the device to them to pay.
        </div>
        <button
          onClick={() => onSwitchToPlayer(pending.fromPlayerId)}
          style={{
            background: "#1d4ed8", border: "none", borderRadius: 10,
            padding: "12px 28px", color: "white",
            fontSize: 14, fontWeight: 600, minHeight: 48,
          }}
        >
          Switch to {payer.name}
        </button>
      </div>
    );
  }

  // ── JSN was played — show waiting/counter screen ───────────────────────────
  if (jsnCount > 0) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: 16,
      }}>
        <div style={{
          background: "#0a170a", border: "1px solid #1f3d1f",
          borderRadius: 16, padding: 24, width: "100%", maxWidth: 400,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
          <div style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Just Say No!
          </div>
          <div style={{
            background: "#1e1b4b", border: "1px solid #4c1d95",
            borderRadius: 8, padding: "8px 12px", marginBottom: 16,
            color: "#c4b5fd", fontSize: 13,
          }}>
            {jsnCount} JSN played — action is {isBlocked ? "BLOCKED 🚫" : "GOING THROUGH ✅"}
          </div>
          <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 20 }}>
            {pending.lastJsnPlayerId === viewingPlayerId
              ? "Waiting for others to respond..."
              : isBlocked
                ? `${creditor.name}'s action is blocked. Counter with Just Say No to unblock it.`
                : `${payer.name}'s payment is required. Counter with Just Say No to block it.`
            }
          </div>

          {/* JSN counter button */}
          {canPlayJsn && myJsnCard && onPlayJustSayNo && (
            <button
              onClick={() => onPlayJustSayNo(myJsnCard.id)}
              style={{
                width: "100%", minHeight: 48,
                background: "#7c3aed", border: "none", borderRadius: 10,
                color: "white", fontSize: 15, fontWeight: 700,
                cursor: "pointer", marginBottom: 10,
              }}
            >
              Just Say No!
            </button>
          )}

          {/* Payer confirms payment when not blocked */}
          {isMyPayment && !isBlocked && (
            <div style={{ color: "#9ca3af", fontSize: 12 }}>
              JSN cancelled — you must pay. Tap below to proceed.
            </div>
          )}

          {/* Attacker accepts block */}
          {myPlayerId === pending.toPlayerId && isBlocked && pending.lastJsnPlayerId !== myPlayerId && (
            <button
              onClick={onConfirm}
              style={{
                width: "100%", minHeight: 48,
                background: "#374151", border: "none", borderRadius: 10,
                color: "white", fontSize: 14, fontWeight: 600,
                cursor: "pointer", marginBottom: 10,
              }}
            >
              Accept Block
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Normal payment screen ──────────────────────────────────────────────────
  const bankCards = [...payer.bank];
  const incompleteSetCards: { setId: string; card: PropertyCard }[] = [];
  for (const set of payer.propertySets) {
    const rule = PROPERTY_RULES[set.color];
    if (set.properties.length >= rule.setSize) continue;
    for (const card of set.properties) {
      incompleteSetCards.push({ setId: set.id, card });
    }
  }

  const totalPayable =
    bankCards.reduce((s, c) => s + c.value, 0) +
    incompleteSetCards.reduce((s, { card }) => s + card.value, 0);

  const selectedValue = paymentCardIds.reduce((sum, id) => {
    const bankCard = bankCards.find(c => c.id === id);
    if (bankCard) return sum + bankCard.value;
    const propCard = incompleteSetCards.find(c => c.card.id === id);
    if (propCard) return sum + propCard.card.value;
    return sum;
  }, 0);

  const amountOwed = pending.amountOwed;
  const maxNeeded = Math.min(amountOwed, totalPayable);
  const canConfirm = selectedValue >= amountOwed || selectedValue >= totalPayable;

  const kindLabel =
    pending.kind === "payRent" ? "🏠 Rent Due" :
    pending.kind === "payBirthday" ? "🎂 It's My Birthday!" :
    "💰 Debt Collector";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 50, padding: 16,
    }}>
      <div style={{
        background: "#0a170a", border: "1px solid #1f3d1f",
        borderRadius: 16, padding: 20, width: "100%", maxWidth: 420,
        maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          {kindLabel}
        </div>
        <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>
          <span style={{ color: "#60a5fa", fontWeight: 600 }}>{payer.name}</span> owes{" "}
          <span style={{ color: "white", fontWeight: 600 }}>{creditor.name}</span>{" "}
          <span style={{ color: "#fbbf24", fontWeight: 700 }}>${amountOwed}M</span>.{" "}
          {totalPayable < amountOwed
            ? `You only have $${totalPayable}M — pay everything.`
            : "Select cards to pay with."}
        </div>

        {/* Bank cards */}
        <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          Your Bank
        </div>
        {bankCards.length === 0 ? (
          <div style={{ color: "#4b5563", fontSize: 12, marginBottom: 12 }}>Empty</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {bankCards.map(c => (
              <div
                key={c.id}
                onClick={() => onToggleCard(c.id)}
                style={{
                  background: paymentCardIds.includes(c.id) ? "#1e40af" : "#052e16",
                  border: `1px solid ${paymentCardIds.includes(c.id) ? "#3b82f6" : "#166534"}`,
                  borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                  minHeight: 44, display: "flex", flexDirection: "column", justifyContent: "center",
                }}
              >
                <div style={{ color: paymentCardIds.includes(c.id) ? "white" : "#4ade80", fontWeight: 700, fontSize: 14 }}>
                  ${c.value}M
                </div>
                <div style={{ color: "#6b7280", fontSize: 10 }}>{c.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Incomplete properties */}
        {incompleteSetCards.length > 0 && (
          <>
            <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              Incomplete Properties
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {incompleteSetCards.map(({ card }) => {
                const rule = PROPERTY_RULES[card.activeColor];
                return (
                  <div
                    key={card.id}
                    onClick={() => onToggleCard(card.id)}
                    style={{
                      background: paymentCardIds.includes(card.id) ? "#1e40af" : "#0a170a",
                      border: `1px solid ${paymentCardIds.includes(card.id) ? "#3b82f6" : "#1f3d1f"}`,
                      borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                      minHeight: 44, display: "flex", flexDirection: "column", justifyContent: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: rule.color }} />
                      <span style={{ color: "white", fontWeight: 600, fontSize: 12 }}>{card.name}</span>
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 10 }}>${card.value}M · {rule.displayName}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Summary + buttons */}
        <div style={{
          borderTop: "1px solid #1f3d1f", paddingTop: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        }}>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: "#6b7280" }}>Selected: </span>
            <span style={{ color: selectedValue >= amountOwed ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>
              ${selectedValue}M
            </span>
            <span style={{ color: "#4b5563" }}> / ${maxNeeded}M</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {myJsnCard && onPlayJustSayNo && (
              <button
                onClick={() => onPlayJustSayNo(myJsnCard.id)}
                style={{
                  background: "#7c3aed", border: "none", borderRadius: 8,
                  padding: "10px 16px", color: "white",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 44,
                }}
              >
                JSN
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={!canConfirm}
              style={{
                background: canConfirm ? "#16a34a" : "#1f2937",
                color: canConfirm ? "white" : "#4b5563",
                border: "none", borderRadius: 8,
                padding: "10px 24px", fontSize: 14, fontWeight: 700,
                cursor: canConfirm ? "pointer" : "not-allowed",
                minHeight: 44,
              }}
            >
              Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}