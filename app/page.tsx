"use client";
import { useState } from "react";
import { useGame } from "../hooks/useGame";
import { GameHeader } from "../components/GameHeader";
import { PaymentModal } from "../components/PaymentModal";
import { PlayerBoard } from "../components/PlayerBoard";
import { PropertyCard, RentCard } from "../types/card";
import { getRentableSetsByCard } from "../lib/propertyUtils";
import { ActionCardModal } from "../components/ActionCardModal";
import { ActionCard } from "../types/card";

export default function Page() {
  const {
    game,
    error,
    clearError,
    init,
    reset,
    lastLog,
    doStartTurn,
    doEndTurn,
    doDiscard,
    doBankCards,
    doPlacePropertyAsNewSet,
    doPlacePropertyIntoSet,
    doPlayRentCard,
    doConfirmPayment,
    doPlacePendingProperty,
    doPlayPassGo,
    doPlayItsMyBirthday,
    doPlayDebtCollector,
    doPlaySlyDeal,
    doPlayForcedDeal,
  } = useGame();

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [rentSetId, setRentSetId] = useState<string | null>(null);
  const [paymentCardIds, setPaymentCardIds] = useState<string[]>([]);
  const [viewingPlayerId, setViewingPlayerId] = useState<string>("p1");
  const [playerNames, setPlayerNames] = useState<string[]>(["Alice", "Bob"]);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);

  // ── Setup screen ────────────────────────────────────────────────────────────
  if (!game) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-600 w-full max-w-sm">
          <h1 className="text-3xl font-bold text-white mb-2">Monopoly Deal</h1>
          <p className="text-slate-400 mb-6">2–5 players</p>

          <div className="space-y-2 mb-4">
            {playerNames.map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-400 text-sm w-16">Player {i + 1}</span>
                <input
                  value={name}
                  onChange={e =>
                    setPlayerNames(prev =>
                      prev.map((n, j) => (j === i ? e.target.value : n))
                    )
                  }
                  className="flex-1 bg-slate-700 border border-slate-500 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                {playerNames.length > 2 && (
                  <button
                    onClick={() =>
                      setPlayerNames(prev => prev.filter((_, j) => j !== i))
                    }
                    className="text-slate-500 hover:text-red-400 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {playerNames.length < 5 && (
            <button
              onClick={() =>
                setPlayerNames(prev => [...prev, `Player ${prev.length + 1}`])
              }
              className="w-full py-2 mb-4 border border-dashed border-slate-600 text-slate-400 rounded-lg hover:border-slate-400 hover:text-slate-200 transition-colors text-sm"
            >
              + Add Player
            </button>
          )}

          <button
            onClick={() => {
              init(playerNames.filter(n => n.trim()));
              setViewingPlayerId("p1");
              setSelectedCardIds([]);
              setSelectedSetId(null);
              setRentSetId(null);
              setPaymentCardIds([]);
            }}
            disabled={playerNames.filter(n => n.trim()).length < 2}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg transition-colors"
          >
            Deal Cards
          </button>
        </div>
      </div>
    );
  }

  // ── Derived state ───────────────────────────────────────────────────────────
  const currentPlayer = game.players.find(p => p.id === game.currentPlayerId)!;
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

  const selectedAction = selectedCards.length === 1 && selectedCards[0].type === "action"
    ? selectedCards[0] as ActionCard
    : null;

  const rentCard = singleRent ? selectedCards[0] as RentCard : null;
  const rentableSets = rentCard ? getRentableSetsByCard(viewPlayer, rentCard) : [];

  const canEndTurn =
    (game.phase === "actionPhase" || game.phase === "discardPhase") &&
    isMyTurn &&
    currentPlayer.pendingPlacements.length === 0 &&
    currentPlayer.hand.length <= 7
    game.actionsRemaining === 0;

  const pendingPayment =
    game.phase === "pendingAction" &&
    game.pendingActions.length > 0 &&
    (game.pendingActions[0].kind === "payRent" ||
      game.pendingActions[0].kind === "payBirthday" ||
      game.pendingActions[0].kind === "payDebtCollector")
      ? game.pendingActions[0]
      : null;
      
  const needsDiscard = isMyTurn && viewPlayer.hand.length > 7 && game.actionsRemaining === 0;

  // ── Handlers ────────────────────────────────────────────────────────────────
  function toggleCardSelection(cardId: string) {
    if (game?.phase === "drawPhase") return;
    const card = viewPlayer.hand.find(c => c.id === cardId);
    if (!card) return;

    if (needsDiscard) {
      setSelectedCardIds(prev => prev.includes(cardId) ? [] : [cardId]);
      setSelectedPendingId(null);
      setSelectedSetId(null);
      setRentSetId(null);
      return;
    }

    setSelectedPendingId(null);
    setSelectedSetId(null);
    setRentSetId(null);

    if (card.type === "property") {
      setSelectedCardIds(prev => prev.includes(cardId) ? [] : [cardId]);
    } else if (card.type === "money") {
      setSelectedCardIds(prev => {
        const moneyOnly = prev.filter(id =>
          viewPlayer.hand.find(c => c.id === id)?.type === "money"
        );
        if (!moneyOnly.includes(cardId) && moneyOnly.length >= (game?.actionsRemaining ?? 0)) {
          return prev;
        }
        return moneyOnly.includes(cardId)
          ? moneyOnly.filter(id => id !== cardId)
          : [...moneyOnly, cardId];
      });
    } else {
      setSelectedCardIds(prev => prev.includes(cardId) ? [] : [cardId]);
    }
  }

  function clearSelection() {
    setSelectedCardIds([]);
    setSelectedSetId(null);
    setRentSetId(null);
  }

  function handleEndTurn() {
    if (!game) return;
    const idx = game.players.findIndex(p => p.id === currentPlayer.id);
    const next = game.players[(idx + 1) % game.players.length];
    doEndTurn(() => {
      setViewingPlayerId(next.id);
      clearSelection();
    });
  }

  function handleDiscard() {
    if (!game) return;
    if (selectedCardIds.length !== 1) return;
    doDiscard(viewingPlayerId, selectedCardIds[0], () => {
      setSelectedCardIds([]);
    });
  }

  function handleConfirmPayment() {
    if (!game) return;
    const nextPending = game.pendingActions[1];
    const actingPlayerId = game.currentPlayerId;
    doConfirmPayment(viewingPlayerId, paymentCardIds, () => {
      setPaymentCardIds([]);
      if (nextPending) {
        // More payments to resolve — switch to next payer
        setViewingPlayerId(nextPending.fromPlayerId);
      } else {
        // All done — switch back to the player whose turn it is
        setViewingPlayerId(actingPlayerId);
      }
    });
  }

  function handlePlayRent() {
    if (!game || !rentSetId) return;
    const opponents = game.players.filter(p => p.id !== viewPlayer.id);
    doPlayRentCard(viewPlayer.id, selectedCardIds[0], rentSetId, () => {
      clearSelection();
      if (opponents.length > 0) setViewingPlayerId(opponents[0].id);
    });
  }

  function handlePlayPassGo(cardId: string) {
    doPlayPassGo(viewPlayer.id, cardId);
  }

  function handlePlayBirthday(cardId: string) {
    if (!game) return;
    const opponents = game.players.filter(p => p.id !== viewPlayer.id);
    doPlayItsMyBirthday(viewPlayer.id, cardId, () => {
      if (opponents.length > 0) setViewingPlayerId(opponents[0].id);
    });
  }

  function handlePlayDebtCollector(cardId: string, targetPlayerId: string) {
    doPlayDebtCollector(viewPlayer.id, cardId, targetPlayerId, () => {
      setViewingPlayerId(targetPlayerId);
    });
  }

  function handlePlaySlyDeal(
    cardId: string,
    targetPlayerId: string,
    targetSetId: string,
    targetCardId: string
  ) {
    doPlaySlyDeal(
      viewPlayer.id,
      cardId,
      targetPlayerId,
      targetSetId,
      targetCardId
    );
  }

  function handlePlayForcedDeal(
    cardId: string,
    targetPlayerId: string,
    targetSetId: string,
    targetCardId: string,
    offeredSetId: string,
    offeredCardId: string
  ) {
    const actingPlayerId = viewPlayer.id;
    doPlayForcedDeal(
      viewPlayer.id,
      cardId,
      targetPlayerId,
      targetSetId,
      targetCardId,
      offeredSetId,
      offeredCardId,
      () => {
        setSelectedCardIds([]);
        setViewingPlayerId(actingPlayerId);
      }
    );
  }

  // ── Game over ───────────────────────────────────────────────────────────────
  if (game.phase === "gameOver") {
    const winner = game.players.find(p => p.id === game.winnerId)!;
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center p-8 max-w-lg w-full">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-black text-yellow-400 mb-2">
            {winner.name} Wins!
          </h1>
          <p className="text-slate-400 mb-8">
            Collected {game.config.winCondition} complete property sets
          </p>
          <button
            onClick={() => {
              reset();
              setViewingPlayerId("p1");
              clearSelection();
              setPaymentCardIds([]);
            }}
            className="px-8 py-3 bg-slate-600 hover:bg-slate-500 text-white font-black rounded-xl text-lg mb-8"
          >
            ← Main Menu
          </button>
          {/* Game log */}
          <div className="border border-slate-600 rounded-xl p-3 bg-slate-800/50 text-left">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
              Game Log
            </div>
            {lastLog.map((entry, i) => (
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

  // ── Main game ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">

        {/* Payment modal */}
        {pendingPayment && (
          <PaymentModal
            game={game}
            pending={pendingPayment}
            viewingPlayerId={viewingPlayerId}
            paymentCardIds={paymentCardIds}
            onToggleCard={id =>
              setPaymentCardIds(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
              )
            }
            onConfirm={handleConfirmPayment}
            onSwitchToPlayer={id => {
              setViewingPlayerId(id);
              setPaymentCardIds([]);
            }}
          />
        )}

        {/* Action card modal */}
        {selectedAction && isMyTurn && game.phase === "actionPhase" && !needsDiscard && (
          <ActionCardModal
            game={game}
            card={selectedAction}
            playerId={viewPlayer.id}
            onPlayPassGo={() => handlePlayPassGo(selectedAction.id)}
            onPlayBirthday={() => handlePlayBirthday(selectedAction.id)}
            onPlayDebtCollector={targetPlayerId =>
              handlePlayDebtCollector(selectedAction.id, targetPlayerId)
            }
            onPlaySlyDeal={(targetPlayerId, targetSetId, targetCardId) =>
              handlePlaySlyDeal(selectedAction.id, targetPlayerId, targetSetId, targetCardId)
            }
            onPlayForcedDeal={(targetPlayerId, targetSetId, targetCardId, offeredSetId, offeredCardId) =>
              handlePlayForcedDeal(selectedAction.id, targetPlayerId, targetSetId, targetCardId, offeredSetId, offeredCardId)
            }
            onBank={() => {
              doBankCards(viewPlayer.id, [selectedAction.id]);
              setSelectedCardIds([]);
            }}
            onCancel={() => setSelectedCardIds([])}
          />
        )}

        <GameHeader
          game={game}
          currentPlayer={currentPlayer}
          error={error}
          onClearError={clearError}
        />

        {/* Pass & play switcher */}
        <div className="flex gap-2 mb-4">
          {game.players.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setViewingPlayerId(p.id);
                clearSelection();
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

        {/* Player boards */}
        {game.players.map(player => (
          <PlayerBoard
            key={player.id}
            player={player}
            game={game}
            isCurrentTurn={player.id === currentPlayer.id}
            isViewing={player.id === viewPlayer.id}
            isMyTurn={isMyTurn}
            selectedCardIds={player.id === viewPlayer.id ? selectedCardIds : []}
            selectedPropertyColor={selectedPropertyColor}
            rentableSets={rentableSets}
            rentSetId={rentSetId}
            allMoney={allMoney}
            singleRent={singleRent}
            singleNonPropertyNonMoney={singleNonPropertyNonMoney}
            canEndTurn={canEndTurn}
            needsDiscard={player.id === viewPlayer.id && needsDiscard}
            pendingPlacements={player.pendingPlacements}
            onToggleCard={toggleCardSelection}
            selectedPendingId={player.id === viewPlayer.id ? selectedPendingId : null}
            onSelectPending={id => {
              setSelectedPendingId(id === selectedPendingId ? null : id)
              setSelectedCardIds([]);
              setSelectedSetId(null);
              setRentSetId(null);
            }}
            onAddToSet={setId => {
              doPlacePropertyIntoSet(viewPlayer.id, selectedCardIds[0], setId);
              clearSelection();
            }}
            onNewSet={() => {
              doPlacePropertyAsNewSet(viewPlayer.id, selectedCardIds[0]);
              clearSelection();
            }}
            onSelectRentSet={setId =>
              setRentSetId(prev => prev === setId ? null : setId)
            }
            onBankCards={() => {
              doBankCards(viewPlayer.id, selectedCardIds);
              clearSelection();
            }}
            onPlayRent={handlePlayRent}
            onDrawCards={doStartTurn}
            onEndTurn={handleEndTurn}
            onDiscard={handleDiscard}
            onPlacePending={(cardId, targetSetId) =>
              doPlacePendingProperty(player.id, cardId, targetSetId)
            }
          />
        ))}

        {/* Game log */}
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