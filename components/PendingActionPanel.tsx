"use client";
import React, { useState } from "react";
import { Game, PendingAction, Player } from "../types/game";
import { Card, ActionCard } from "../types/card";
import { CardView } from "./CardView";
import { PropertySetView } from "./PropertySetView";
import { getTotalPayableAssets } from "../lib/gameEngine";
import { isSetComplete } from "../lib/propertyUtils";
import { getBankValue } from "../lib/bankUtils";

interface PendingActionPanelProps {
  game: Game;
  viewingPlayerId: string;
  onConfirmPayment: (cardIds: string[]) => void;
  onJustSayNo: (cardId: string) => void;
}

export function PendingActionPanel({
  game,
  viewingPlayerId,
  onConfirmPayment,
  onJustSayNo,
}: PendingActionPanelProps) {
  const pending = game.pendingActions[0];
  if (!pending) return null;

  const isMyTurn = (() => {
    if ("fromPlayerId" in pending) return pending.fromPlayerId === viewingPlayerId;
    return false;
  })();

  if (!isMyTurn) {
    // Show a "waiting" state
    const actorName = game.players.find(
      p => p.id === (pending as any).toPlayerId
    )?.name ?? "someone";
    const victimName = game.players.find(
      p => p.id === (pending as any).fromPlayerId
    )?.name ?? "someone";

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-2xl p-8 text-center shadow-2xl border border-gray-700 max-w-sm">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-gray-200 text-lg font-semibold">Waiting for {victimName}...</p>
          <p className="text-gray-400 mt-2 text-sm">{actorName} is waiting for a response.</p>
        </div>
      </div>
    );
  }

  if (
    pending.kind === "payRent" ||
    pending.kind === "payBirthday" ||
    pending.kind === "payDebtCollector"
  ) {
    return (
      <PaymentModal
        game={game}
        pending={pending}
        viewingPlayerId={viewingPlayerId}
        onConfirm={onConfirmPayment}
        onJustSayNo={onJustSayNo}
      />
    );
  }

  return null;
}

function PaymentModal({
  game,
  pending,
  viewingPlayerId,
  onConfirm,
  onJustSayNo,
}: {
  game: Game;
  pending: Extract<PendingAction, { kind: "payRent" | "payBirthday" | "payDebtCollector" }>;
  viewingPlayerId: string;
  onConfirm: (ids: string[]) => void;
  onJustSayNo: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const payer = game.players.find(p => p.id === viewingPlayerId)!;
  const creditor = game.players.find(p => p.id === pending.toPlayerId)!;

  const totalAssets = getTotalPayableAssets(payer);
  const maxPayable = Math.min(pending.amountOwed, totalAssets);

  const justSayNoCards = payer.hand.filter(
    c => c.type === "action" && (c as ActionCard).action === "justSayNo"
  );

  const selectedValue = selected.reduce((sum, id) => {
    const bankCard = payer.bank.find(c => c.id === id);
    if (bankCard) return sum + bankCard.value;
    for (const set of payer.propertySets) {
      if (isSetComplete(set)) continue;
      const p = set.properties.find(c => c.id === id);
      if (p) return sum + p.value;
    }
    return sum;
  }, 0);

  const canPay = selectedValue >= maxPayable || selectedValue >= pending.amountOwed;

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const label =
    pending.kind === "payBirthday"
      ? "🎂 It's My Birthday!"
      : pending.kind === "payDebtCollector"
      ? "💰 Debt Collector"
      : "🏠 Rent Due";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700 w-full max-w-lg">
        <h2 className="text-xl font-bold text-white mb-1">{label}</h2>
        <p className="text-gray-300 mb-4 text-sm">
          {creditor.name} wants <span className="text-yellow-400 font-bold">${pending.amountOwed}M</span>.{" "}
          {totalAssets < pending.amountOwed
            ? `You can only pay $${totalAssets}M (all your liquid assets).`
            : "Select cards to pay with."}
        </p>

        <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Your Bank</div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {payer.bank.map(c => (
            <CardView
              key={c.id}
              card={c}
              small
              selected={selected.includes(c.id)}
              onClick={() => toggle(c.id)}
            />
          ))}
          {payer.bank.length === 0 && (
            <p className="text-gray-500 text-xs">Empty bank</p>
          )}
        </div>

        {payer.propertySets.some(s => !isSetComplete(s)) && (
          <>
            <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">
              Incomplete Properties (can pay with these)
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {payer.propertySets
                .filter(s => !isSetComplete(s))
                .flatMap(s =>
                  s.properties.map(c => (
                    <CardView
                      key={c.id}
                      card={c}
                      small
                      selected={selected.includes(c.id)}
                      onClick={() => toggle(c.id)}
                    />
                  ))
                )}
            </div>
          </>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-gray-300">
            Selected: <span className="text-yellow-400 font-bold">${selectedValue}M</span>
            {" / "}
            <span className="text-gray-400">${maxPayable}M needed</span>
          </div>
          <div className="flex gap-2">
            {justSayNoCards.length > 0 && (
              <button
                onClick={() => onJustSayNo(justSayNoCards[0].id)}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Just Say No!
              </button>
            )}
            <button
              onClick={() => onConfirm(selected)}
              disabled={!canPay}
              className="px-4 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
