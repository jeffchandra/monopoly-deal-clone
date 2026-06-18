"use client";
import { Game, PendingPayment } from "../types/game";
import { PropertyCard } from "../types/card";
import { PROPERTY_RULES } from "../data/propertyRules";

interface PaymentModalProps {
  game: Game;
  pending: PendingPayment;
  viewingPlayerId: string;
  paymentCardIds: string[];
  onToggleCard: (cardId: string) => void;
  onConfirm: () => void;
  onSwitchToPlayer: (playerId: string) => void;
}

export function PaymentModal({
  game,
  pending,
  viewingPlayerId,
  paymentCardIds,
  onToggleCard,
  onConfirm,
  onSwitchToPlayer,
}: PaymentModalProps) {
  const isMyPayment = pending.fromPlayerId === viewingPlayerId;
  const payer = game.players.find(p => p.id === pending.fromPlayerId)!;
  const creditor = game.players.find(p => p.id === pending.toPlayerId)!;

  // ── Waiting screen — not your payment ─────────────────────────────────────
  if (!isMyPayment) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-8 text-center shadow-2xl">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-white text-lg font-semibold mb-1">
            Waiting for {payer.name}...
          </p>
          <p className="text-slate-400 text-sm mb-4">
            Pass the device to them to pay.
          </p>
          <button
            onClick={() => onSwitchToPlayer(pending.fromPlayerId)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg text-sm"
          >
            Switch to {payer.name}
          </button>
        </div>
      </div>
    );
  }

  // ── Payable sources ────────────────────────────────────────────────────────
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
  const canConfirm =
    selectedValue >= amountOwed || selectedValue >= totalPayable;

  const kindLabel =
    pending.kind === "payRent" ? "🏠 Rent Due" :
    pending.kind === "payBirthday" ? "🎂 It's My Birthday!" :
    "💰 Debt Collector";

  // ── Payment screen ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-lg shadow-2xl">

        <h2 className="text-xl font-bold text-white mb-1">{kindLabel}</h2>
        <p className="text-slate-400 text-sm mb-4">
          <span className="text-blue-400 font-semibold">{payer.name}</span> owes{" "}
          <span className="text-white font-semibold">{creditor.name}</span>{" "}
          <span className="text-yellow-400 font-bold">${amountOwed}M</span>.{" "}
          {totalPayable < amountOwed
            ? `You only have $${totalPayable}M — pay everything you have.`
            : "Select cards to pay with."}
        </p>

        {/* Bank cards */}
        <div className="mb-4">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
            Your Bank
          </div>
          {bankCards.length === 0 ? (
            <span className="text-xs text-slate-500">Empty</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {bankCards.map(c => (
                <div
                  key={c.id}
                  onClick={() => onToggleCard(c.id)}
                  className={`text-xs border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                    paymentCardIds.includes(c.id)
                      ? "bg-blue-700 border-blue-400 text-white"
                      : "bg-emerald-900 border-emerald-700 text-emerald-300 hover:border-emerald-400"
                  }`}
                >
                  <div className="font-bold">${c.value}M</div>
                  <div className="text-slate-400">{c.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incomplete property cards */}
        {incompleteSetCards.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
              Incomplete Properties
            </div>
            <div className="flex flex-wrap gap-1.5">
              {incompleteSetCards.map(({ card }) => {
                const rule = PROPERTY_RULES[card.activeColor];
                return (
                  <div
                    key={card.id}
                    onClick={() => onToggleCard(card.id)}
                    className={`text-xs border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                      paymentCardIds.includes(card.id)
                        ? "bg-blue-700 border-blue-400 text-white"
                        : "bg-slate-700 border-slate-500 text-violet-300 hover:border-violet-400"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-semibold">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: rule.color }}
                      />
                      {card.name}
                    </div>
                    <div className="text-slate-400">${card.value}M · {rule.displayName}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary + confirm */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
          <div className="text-sm">
            <span className="text-slate-400">Selected: </span>
            <span className={`font-bold ${
              selectedValue >= amountOwed ? "text-emerald-400" : "text-yellow-400"
            }`}>
              ${selectedValue}M
            </span>
            <span className="text-slate-500"> / ${maxNeeded}M needed</span>
          </div>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`font-bold px-5 py-2 rounded-lg text-sm ${
              canConfirm
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            Pay
          </button>
        </div>

      </div>
    </div>
  );
}