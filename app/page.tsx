"use client";
import { useState } from "react";
import {
  createGame,
  createPlayer,
  startGame,
  startTurn,
  endTurn,
  discard,
  playCardToBank,
  placePropertyAsNewSet,
  placePropertyIntoSet,
  playRentCard,
  getCurrentPlayer,
  getPayableSources,
  confirmPayment,
} from "../lib/gameEngine";
import { Game } from "../types/game";
import { Card, PropertyCard, RentCard } from "../types/card";
import { PROPERTY_RULES } from "../data/propertyRules";
import { isSetComplete, getRentableSetsByCard, getRentForSet } from "../lib/propertyUtils";

function cloneGame(game: Game): Game {
  return JSON.parse(JSON.stringify(game));
}

function sortBank(bank: Card[]): Card[] {
  return [...bank].sort((a, b) => b.value - a.value);
}

export default function Page() {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [viewingPlayerId, setViewingPlayerId] = useState<string>("p1");
  // For rent card flow — which set the player chose to charge rent on
  const [rentSetId, setRentSetId] = useState<string | null>(null);
  // For payment flow — which cards the payer has selected
  const [paymentCardIds, setPaymentCardIds] = useState<string[]>([]);

  function update(fn: (g: Game) => void, afterFn?: () => void) {
    setError(null);
    setGame(prev => {
      if (!prev) return prev;
      try {
        const next = cloneGame(prev);
        fn(next);
        for (const p of next.players) {
          p.bank = sortBank(p.bank);
        }
        return next;
      } catch (e: any) {
        setError(e.message);
        return prev;
      }
    });
    if (afterFn) afterFn();
  }

  function init() {
    const p1 = createPlayer("p1", "Alice");
    const p2 = createPlayer("p2", "Bob");
    const g = createGame([p1, p2]);
    startGame(g);
    setGame(g);
    setError(null);
    setViewingPlayerId("p1");
    setSelectedCardIds([]);
    setSelectedSetId(null);
    setRentSetId(null);
    setPaymentCardIds([]);
  }

  function toggleCardSelection(cardId: string) {
    if (!game) return;
    const card = viewPlayer.hand.find(c => c.id === cardId);
    if (!card) return;

    if (card.type === "property") {
      setSelectedCardIds(prev =>
        prev.includes(cardId) ? [] : [cardId]
      );
    } else if (card.type === "money") {
      setSelectedCardIds(prev => {
        const moneyOnly = prev.filter(id =>
          viewPlayer.hand.find(c => c.id === id)?.type === "money"
        );
        return moneyOnly.includes(cardId)
          ? moneyOnly.filter(id => id !== cardId)
          : [...moneyOnly, cardId];
      });
    } else {
      setSelectedCardIds(prev =>
        prev.includes(cardId) ? [] : [cardId]
      );
    }
    setSelectedSetId(null);
    setRentSetId(null);
  }

  function handleEndTurn() {
    if (!game) return;
    const idx = game.players.findIndex(p => p.id === currentPlayer.id);
    const next = game.players[(idx + 1) % game.players.length];
    update(g => endTurn(g), () => {
      setViewingPlayerId(next.id);
      setSelectedCardIds([]);
      setSelectedSetId(null);
      setRentSetId(null);
    });
  }

  function handleDiscard() {
    if (!game) return;
    const idx = game.players.findIndex(p => p.id === viewingPlayerId);
    const next = game.players[(idx + 1) % game.players.length];
    update(g => discard(g, viewingPlayerId, selectedCardIds), () => {
      setViewingPlayerId(next.id);
      setSelectedCardIds([]);
      setSelectedSetId(null);
    });
  }

  function togglePaymentCard(cardId: string) {
    setPaymentCardIds(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  }

  function handleConfirmPayment() {
    if (!game) return;
    const pending = game.pendingActions[0];
    if (!pending) return;

    // After this payment resolves, figure out who views next
    const remainingAfter = game.pendingActions.length - 1;
    const nextPending = game.pendingActions[1];

    update(g => confirmPayment(g, viewingPlayerId, paymentCardIds), () => {
      setPaymentCardIds([]);
      // If there are more pending payments, switch to that player
      if (nextPending) {
        setViewingPlayerId(nextPending.fromPlayerId);
      }
    });
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-600">
          <h1 className="text-3xl font-bold text-white mb-2">Monopoly Deal</h1>
          <p className="text-slate-400 mb-6">Phase 2 — Rent</p>
          <button
            onClick={init}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-lg w-full"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer(game);
  const viewPlayer = game.players.find(p => p.id === viewingPlayerId) ?? game.players[0];
  const isMyTurn = viewPlayer.id === currentPlayer.id;

  const selectedCards = viewPlayer.hand.filter(c => selectedCardIds.includes(c.id));
  const allMoney = selectedCards.length > 0 && selectedCards.every(c => c.type === "money");
  const singleProperty = selectedCards.length === 1 && selectedCards[0].type === "property";
  const singleRent = selectedCards.length === 1 && selectedCards[0].type === "rent";
  const singleNonPropertyNonMoney =
    selectedCards.length === 1 &&
    selectedCards[0].type !== "property" &&
    selectedCards[0].type !== "money";

  const selectedPropertyColor = singleProperty
    ? (selectedCards[0] as PropertyCard).activeColor
    : null;

  // For rent card — what sets can it charge for
  const rentCard = singleRent ? selectedCards[0] as RentCard : null;
  const rentableSets = rentCard
    ? getRentableSetsByCard(viewPlayer, rentCard)
    : [];

  const canEndTurn =
    game.phase === "actionPhase" &&
    isMyTurn &&
    (game.actionsRemaining === 0 || currentPlayer.hand.length <= 7);

  const needsDiscard = game.phase === "discardPhase" && isMyTurn;
  const discardCount = viewPlayer.hand.length - 7;

  // Pending payment for viewing player
  const pendingPayment =
    game.phase === "pendingAction" &&
    game.pendingActions.length > 0 &&
    (game.pendingActions[0].kind === "payRent" ||
      game.pendingActions[0].kind === "payBirthday" ||
      game.pendingActions[0].kind === "payDebtCollector")
      ? game.pendingActions[0]
      : null;

  const isMyPayment = pendingPayment?.fromPlayerId === viewingPlayerId;

  // Payment calculation
  const payableSources = pendingPayment && isMyPayment
    ? getPayableSources(game, viewingPlayerId)
    : null;

  const selectedPaymentValue = payableSources
    ? paymentCardIds.reduce((sum, id) => {
        const bankCard = payableSources.bankCards.find(c => c.id === id);
        if (bankCard) return sum + bankCard.value;
        const propCard = payableSources.incompleteSetCards.find(c => c.card.id === id);
        if (propCard) return sum + propCard.card.value;
        return sum;
      }, 0)
    : 0;

  const amountOwed = pendingPayment?.amountOwed ?? 0;
  const creditor = pendingPayment
    ? game.players.find(p => p.id === pendingPayment.toPlayerId)
    : null;

  // Total payable assets for the payer
  const totalPayable = payableSources
    ? payableSources.bankCards.reduce((s, c) => s + c.value, 0) +
      payableSources.incompleteSetCards.reduce((s, c) => s + c.card.value, 0)
    : 0;

  const canConfirmPayment =
    selectedPaymentValue >= amountOwed ||
    selectedPaymentValue >= totalPayable;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">

        {/* ── Pending Payment Modal ── */}
        {pendingPayment && isMyPayment && payableSources && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-lg shadow-2xl">

              <h2 className="text-xl font-bold text-white mb-1">
                {pendingPayment.kind === "payRent" ? "🏠 Rent Due" :
                 pendingPayment.kind === "payBirthday" ? "🎂 It's My Birthday!" :
                 "💰 Debt Collector"}
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                <span className="text-white font-semibold">{creditor?.name}</span> wants{" "}
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
                {payableSources.bankCards.length === 0 ? (
                  <span className="text-xs text-slate-500">Empty</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {payableSources.bankCards.map(c => (
                      <div
                        key={c.id}
                        onClick={() => togglePaymentCard(c.id)}
                        className={`text-xs border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                          paymentCardIds.includes(c.id)
                            ? "bg-blue-700 border-blue-400 text-white"
                            : "bg-emerald-900 border-emerald-700 text-emerald-300 hover:border-emerald-400"
                        }`}
                      >
                        <div className="font-bold">${c.value}M</div>
                        <div className="text-slate-400 text-xs">{c.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Incomplete property cards */}
              {payableSources.incompleteSetCards.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
                    Incomplete Properties
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {payableSources.incompleteSetCards.map(({ card }) => {
                      const rule = PROPERTY_RULES[card.activeColor];
                      return (
                        <div
                          key={card.id}
                          onClick={() => togglePaymentCard(card.id)}
                          className={`text-xs border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                            paymentCardIds.includes(card.id)
                              ? "bg-blue-700 border-blue-400 text-white"
                              : "bg-slate-700 border-slate-500 text-violet-300 hover:border-violet-400"
                          }`}
                        >
                          <div className="flex items-center gap-1 font-semibold">
                            <div
                              className="w-2 h-2 rounded-full"
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

              {/* Payment summary */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                <div className="text-sm">
                  <span className="text-slate-400">Selected: </span>
                  <span className={`font-bold ${
                    selectedPaymentValue >= amountOwed
                      ? "text-emerald-400"
                      : "text-yellow-400"
                  }`}>
                    ${selectedPaymentValue}M
                  </span>
                  <span className="text-slate-500"> / ${Math.min(amountOwed, totalPayable)}M needed</span>
                </div>
                <button
                  onClick={handleConfirmPayment}
                  disabled={!canConfirmPayment}
                  className={`font-bold px-5 py-2 rounded-lg text-sm ${
                    canConfirmPayment
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-slate-700 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Pay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Waiting modal — shown when it's someone else's payment ── */}
        {game.phase === "pendingAction" && pendingPayment && !isMyPayment && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-600 rounded-2xl p-8 text-center shadow-2xl">
              <div className="text-4xl mb-3">⏳</div>
              <p className="text-white text-lg font-semibold mb-1">
                Waiting for {game.players.find(p => p.id === pendingPayment.fromPlayerId)?.name}...
              </p>
              <p className="text-slate-400 text-sm">
                Pass the device to them to pay.
              </p>
              <button
                onClick={() => setViewingPlayerId(pendingPayment.fromPlayerId)}
                className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg text-sm"
              >
                Switch to {game.players.find(p => p.id === pendingPayment.fromPlayerId)?.name}
              </button>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Monopoly Deal</h1>
          <div className="flex gap-2 text-xs flex-wrap justify-end">
            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded">
              Phase: <span className="text-yellow-400 font-bold">{game.phase}</span>
            </span>
            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded">
              Turn: <span className="text-emerald-400 font-bold">{currentPlayer.name}</span>
            </span>
            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded">
              Actions: <span className="text-orange-400 font-bold">{game.actionsRemaining}</span>
            </span>
            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded">
              Deck: <span className="text-blue-400 font-bold">{game.deck.length}</span>
            </span>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-4 text-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-white">✕</button>
          </div>
        )}

        {/* ── Win ── */}
        {game.phase === "gameOver" && (
          <div className="bg-yellow-900 border border-yellow-500 px-6 py-6 rounded-xl mb-4 text-center">
            <div className="text-3xl font-bold text-yellow-300 mb-2">
              🏆 {game.players.find(p => p.id === game.winnerId)?.name} wins!
            </div>
            <button
              onClick={init}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-2 rounded-lg"
            >
              Play Again
            </button>
          </div>
        )}

        {/* ── Pass & Play switcher ── */}
        <div className="flex gap-2 mb-4">
          {game.players.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setViewingPlayerId(p.id);
                setSelectedCardIds([]);
                setSelectedSetId(null);
                setRentSetId(null);
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                viewPlayer.id === p.id
                  ? "bg-emerald-700 border-emerald-400 text-white"
                  : "bg-slate-700 border-slate-500 text-slate-300 hover:border-slate-300"
              }`}
            >
              {p.name} {p.id === currentPlayer.id ? "🎯" : ""}
            </button>
          ))}
        </div>

        {/* ── Action buttons ── */}
        {isMyTurn && game.phase !== "gameOver" && (
          <div className="flex gap-2 mb-4 flex-wrap items-center">

            {game.phase === "drawPhase" && (
              <button
                onClick={() => update(g => startTurn(g))}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg text-sm"
              >
                Draw 2 Cards
              </button>
            )}

            {game.phase === "actionPhase" && (
              <>
                {allMoney && (
                  <button
                    onClick={() => {
                      update(g => {
                        for (const id of selectedCardIds) {
                          playCardToBank(g, viewPlayer.id, id);
                        }
                      });
                      setSelectedCardIds([]);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                  >
                    💰 Bank {selectedCardIds.length > 1 ? `${selectedCardIds.length} Cards` : "Card"}
                  </button>
                )}

                {/* Bank action/rent card */}
                {singleNonPropertyNonMoney && (
                  <button
                    onClick={() => {
                      update(g => playCardToBank(g, viewPlayer.id, selectedCardIds[0]));
                      setSelectedCardIds([]);
                      setRentSetId(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                  >
                    💰 Bank Card
                  </button>
                )}

                {/* Play rent card — only show after a set is chosen */}
                {singleRent && rentSetId && (
                  <button
                    onClick={() => {
                      update(g => playRentCard(g, viewPlayer.id, selectedCardIds[0], rentSetId));
                      setSelectedCardIds([]);
                      setRentSetId(null);
                      // Switch to first opponent to pay
                      const opponents = game.players.filter(p => p.id !== viewPlayer.id);
                      if (opponents.length > 0) setViewingPlayerId(opponents[0].id);
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                  >
                    💸 Charge Rent
                  </button>
                )}

                <button
                  onClick={handleEndTurn}
                  disabled={!canEndTurn}
                  className={`ml-auto font-semibold px-4 py-2 rounded-lg text-sm ${
                    canEndTurn
                      ? "bg-slate-600 hover:bg-slate-500 text-white"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  End Turn →
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Discard banner ── */}
        {needsDiscard && (
          <div className="bg-red-900 border border-red-500 p-3 rounded-lg mb-4 text-sm flex items-center justify-between">
            <span className="text-red-200">
              Select{" "}
              <span className="font-bold text-white">{discardCount}</span>{" "}
              card{discardCount !== 1 ? "s" : ""} to discard
              {selectedCardIds.length > 0 && (
                <span className="text-slate-400 ml-2">({selectedCardIds.length} selected)</span>
              )}
            </span>
            <button
              onClick={handleDiscard}
              disabled={selectedCardIds.length !== discardCount}
              className={`font-semibold px-3 py-1 rounded-lg text-sm ${
                selectedCardIds.length === discardCount
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-red-950 text-red-800 cursor-not-allowed"
              }`}
            >
              Discard
            </button>
          </div>
        )}

        {/* ── Players ── */}
        {game.players.map(player => {
          const isViewing = player.id === viewPlayer.id;
          const isCurrentTurn = player.id === currentPlayer.id;

          return (
            <div
              key={player.id}
              className={`rounded-xl border p-4 mb-4 ${
                isCurrentTurn
                  ? "border-emerald-500 bg-slate-800"
                  : "border-slate-600 bg-slate-800/50"
              }`}
            >
              {/* Player header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isCurrentTurn ? "bg-emerald-500 text-white" : "bg-slate-600 text-slate-300"
                }`}>
                  {player.name[0]}
                </div>
                <h2 className="font-bold text-white">{player.name}</h2>
                {isCurrentTurn && (
                  <span className="text-xs text-emerald-400 font-medium">● Current Turn</span>
                )}
                {isViewing && (
                  <span className="text-xs text-blue-400 font-medium">👁 Viewing</span>
                )}
              </div>

              {/* Bank */}
              <div className="mb-3">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                  Bank — ${player.bank.reduce((s, c) => s + c.value, 0)}M
                </div>
                <div className="flex flex-wrap gap-1">
                  {player.bank.length === 0 ? (
                    <span className="text-xs text-slate-500">Empty</span>
                  ) : (
                    player.bank.map(c => (
                      <span
                        key={c.id}
                        className="text-xs bg-emerald-900 border border-emerald-700 text-emerald-300 px-2 py-0.5 rounded font-semibold"
                      >
                        ${c.value}M
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Property sets */}
              <div className="mb-3">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                  Properties
                </div>
                {player.propertySets.length === 0 ? (
                  <span className="text-xs text-slate-500">None</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {player.propertySets.map(set => {
                      const complete = isSetComplete(set);
                      const rule = PROPERTY_RULES[set.color];
                      const isMatchingColor =
                        isViewing &&
                        isMyTurn &&
                        game.phase === "actionPhase" &&
                        singleProperty &&
                        selectedPropertyColor === set.color &&
                        !complete;
                      const isRentTarget =
                        isViewing &&
                        isMyTurn &&
                        game.phase === "actionPhase" &&
                        singleRent &&
                        rentableSets.some(s => s.id === set.id);
                      const isSelectedRentSet = set.id === rentSetId;

                      return (
                        <div
                          key={set.id}
                          onClick={() => {
                            if (isRentTarget) {
                              setRentSetId(set.id === rentSetId ? null : set.id);
                            }
                          }}
                          className={`text-xs border rounded-lg px-3 py-2 transition-colors ${
                            isSelectedRentSet
                              ? "border-red-400 bg-red-900/30 cursor-pointer"
                              : isRentTarget
                                ? "border-red-600 bg-red-900/20 cursor-pointer hover:border-red-400"
                                : isMatchingColor
                                  ? "border-violet-400 bg-violet-900/30"
                                  : complete
                                    ? "border-yellow-600 bg-slate-700"
                                    : "border-slate-500 bg-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: rule.color }}
                            />
                            <span>{rule.displayName}</span>
                            <span className="text-slate-400 font-normal">
                              {set.properties.length}/{rule.setSize}
                            </span>
                            {complete && (
                              <span className="text-yellow-400 ml-1">✓</span>
                            )}
                            {/* Rent amount hint when rent card selected */}
                            {isRentTarget && (
                              <span className="ml-auto text-red-300 font-normal">
                                ${getRentForSet(set)}M rent
                              </span>
                            )}
                            {/* Add button */}
                            {isMatchingColor && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  update(g =>
                                    placePropertyIntoSet(
                                      g,
                                      viewPlayer.id,
                                      selectedCardIds[0],
                                      set.id
                                    )
                                  );
                                  setSelectedCardIds([]);
                                  setSelectedSetId(null);
                                }}
                                className="ml-2 bg-orange-600 hover:bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-semibold"
                              >
                                Add
                              </button>
                            )}
                          </div>
                          <div className="text-slate-400 leading-tight">
                            {set.properties.map(p => p.name).join(", ")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* New Set button */}
                {singleProperty &&
                  isViewing &&
                  isMyTurn &&
                  game.phase === "actionPhase" && (
                    <button
                      onClick={() => {
                        update(g =>
                          placePropertyAsNewSet(g, viewPlayer.id, selectedCardIds[0])
                        );
                        setSelectedCardIds([]);
                        setSelectedSetId(null);
                      }}
                      className="mt-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs"
                    >
                      ＋ New Set
                    </button>
                  )}
              </div>

              {/* Hand */}
              {isViewing ? (
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                    Hand ({player.hand.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {player.hand.map(card => {
                      const isSelected = selectedCardIds.includes(card.id);
                      const propCard =
                        card.type === "property" ? (card as PropertyCard) : null;
                      const isRentCard = card.type === "rent";
                      const rc = isRentCard ? card as RentCard : null;

                      return (
                        <div
                          key={card.id}
                          onClick={() => toggleCardSelection(card.id)}
                          className={`text-xs border rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-700 border-blue-400 text-white"
                              : card.type === "money"
                                ? "bg-slate-700 border-slate-500 text-emerald-300 hover:border-emerald-500"
                                : card.type === "property"
                                  ? "bg-slate-700 border-slate-500 text-violet-300 hover:border-violet-500"
                                  : card.type === "rent"
                                    ? "bg-slate-700 border-slate-500 text-red-300 hover:border-red-500"
                                    : "bg-slate-700 border-slate-500 text-yellow-300 hover:border-yellow-500"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {propCard && (
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    PROPERTY_RULES[propCard.activeColor].color,
                                }}
                              />
                            )}
                            {/* Rent card color dots */}
                            {rc && (
                              <div className="flex gap-0.5">
                                {rc.rentableColors.map(c => (
                                  <div
                                    key={c}
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: PROPERTY_RULES[c].color }}
                                  />
                                ))}
                              </div>
                            )}
                            <span className="font-semibold">{card.name}</span>
                          </div>
                          <div className="text-slate-400 mt-0.5">
                            ${card.value}M
                            {propCard && (
                              <span className="ml-1">
                                · {PROPERTY_RULES[propCard.activeColor].displayName}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                    Hand ({player.hand.length})
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(player.hand.length, 10) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-11 bg-slate-700 border border-slate-600 rounded"
                      />
                    ))}
                    {player.hand.length > 10 && (
                      <span className="text-xs text-slate-500 self-center ml-1">
                        +{player.hand.length - 10}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Game log ── */}
        <div className="border border-slate-600 rounded-xl p-3 bg-slate-800/50">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
            Game Log
          </div>
          {game.log.map((entry, i) => (
            <div
              key={i}
              className="text-xs text-slate-400 py-0.5 border-b border-slate-700 last:border-0"
            >
              {entry}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}