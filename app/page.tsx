"use client";
import { useState } from "react";
import { useGame } from "../hooks/useGame";
import { GameHeader } from "../components/GameHeader";
import { PaymentModal } from "../components/PaymentModal";
import { ActionCardModal } from "../components/ActionCardModal";
import { MyBoard } from "../components/MyBoard";
import { MyHand } from "../components/MyHand";
import { OpponentStrip } from "../components/OpponentStrip";
import { PropertyCard, RentCard, ActionCard, PropertyColor } from "../types/card";
import { getRentableSetsByCard } from "../lib/propertyUtils";
import { HandoffScreen } from "../components/HandoffScreen";

export default function Page() {
  const {
    game, error, clearError, init, reset, lastLog,
    doStartTurn, doEndTurn, doDiscard, doBankCards,
    doPlacePropertyAsNewSet, doPlacePropertyIntoSet,
    doPlayRentCard, doConfirmPayment, doPlacePendingProperty,
    doPlayPassGo, doPlayItsMyBirthday, doPlayDebtCollector,
    doPlaySlyDeal, doPlayForcedDeal, doPlayHouse, doPlayHotel,
    doMovePropertyBetweenSets, doPlayWildRent,
  } = useGame();

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [rentSetId, setRentSetId] = useState<string | null>(null);
  const [doubleRentCardId, setDoubleRentCardId] = useState<string | null>(null);
  const [paymentCardIds, setPaymentCardIds] = useState<string[]>([]);
  const [viewingPlayerId, setViewingPlayerId] = useState<string>("p1");
  const [playerNames, setPlayerNames] = useState<string[]>(["Player 1", "Player 2"]);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
  const [selectedBoardCardId, setSelectedBoardCardId] = useState<string | null>(null);
  const [selectedBoardSetId, setSelectedBoardSetId] = useState<string | null>(null);
  const [wildRentTargetPlayerId, setWildRentTargetPlayerId] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<{ toPlayerName: string; reason: string; onReady: () => void } | null>(null);

  // ── Setup screen ─────────────────────────────────────────────────────────────
  if (!game) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0f1f0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}>
        <div style={{
          background: "#0a170a",
          border: "1px solid #1f3d1f",
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 360,
        }}>
          <div style={{ color: "#4ade80", fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Monopoly Deal
          </div>
          <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>2–5 players</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {playerNames.map((name, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#6b7280", fontSize: 12, width: 60 }}>Player {i + 1}</span>
                <input
                  value={name}
                  onChange={e => setPlayerNames(prev => prev.map((n, j) => j === i ? e.target.value : n))}
                  style={{
                    flex: 1, background: "#0f1f0f", border: "1px solid #1f3d1f",
                    borderRadius: 8, padding: "8px 12px", color: "white",
                    fontSize: 13, outline: "none",
                  }}
                />
                {playerNames.length > 2 && (
                  <button
                    onClick={() => setPlayerNames(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 16 }}
                  >✕</button>
                )}
              </div>
            ))}
          </div>

          {playerNames.length < 5 && (
            <button
              onClick={() => setPlayerNames(prev => [...prev, `Player ${prev.length + 1}`])}
              style={{
                width: "100%", minHeight: 44, marginBottom: 12,
                background: "none", border: "1px dashed #1f3d1f",
                borderRadius: 8, color: "#4b5563", fontSize: 12, cursor: "pointer",
                touchAction: "manipulation",
              }}
            >
              + Add Player
            </button>
          )}

          <button
            onClick={() => {
              init(playerNames.filter(n => n.trim()));
              setViewingPlayerId("p1");
              clearSelection();
              setPaymentCardIds([]);
            }}
            disabled={playerNames.filter(n => n.trim()).length < 2}
            style={{
              width: "100%", minHeight: 52,
              background: "#16a34a", border: "none", borderRadius: 10,
              color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
              touchAction: "manipulation",
            }}
          >
            Deal Cards
          </button>
        </div>
      </div>
    );
  }

  // ── Derived state ─────────────────────────────────────────────────────────────
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

  const getActionType = () =>
    selectedCards.length === 1 && selectedCards[0].type === "action"
      ? (selectedCards[0] as ActionCard).action
      : null;

  const actionType = getActionType();
  const singleWildRent = actionType === "rentWild";
  const singleHouse = actionType === "house";
  const singleHotel = actionType === "hotel";
  const singleDoubleRent = actionType === "doubleRent";
  const singlePassGo = actionType === "passGo";
  const singleBirthday = actionType === "itsMyBirthday";
  const singleDebtCollector = actionType === "debtCollector";

  const selectedPropertyColor = singleProperty
    ? (selectedCards[0] as PropertyCard).activeColor
    : null;

  const rentCard = singleRent ? selectedCards[0] as RentCard : null;
  const rentableSets = rentCard
    ? getRentableSetsByCard(viewPlayer, rentCard)
    : singleWildRent
      ? viewPlayer.propertySets
      : [];

  const selectedAction =
    selectedCards.length === 1 &&
    selectedCards[0].type === "action" &&
    actionType !== "rentWild" &&
    actionType !== "house" &&
    actionType !== "hotel" &&
    actionType !== "doubleRent" &&
    actionType !== "passGo" &&
    actionType !== "itsMyBirthday" &&
    actionType !== "debtCollector"
      ? selectedCards[0] as ActionCard
      : null;

  const canEndTurn =
    (game.phase === "actionPhase" || game.phase === "discardPhase") &&
    isMyTurn &&
    currentPlayer.pendingPlacements.length === 0 &&
    currentPlayer.hand.length <= 7;

  const needsDiscard =
    isMyTurn &&
    viewPlayer.hand.length > 7 &&
    game.actionsRemaining === 0;

  const pendingPayment =
    game.phase === "pendingAction" &&
    game.pendingActions.length > 0 &&
    (game.pendingActions[0].kind === "payRent" ||
      game.pendingActions[0].kind === "payBirthday" ||
      game.pendingActions[0].kind === "payDebtCollector")
      ? game.pendingActions[0]
      : null;

  // ── Handlers ──────────────────────────────────────────────────────────────────
  function toggleCardSelection(cardId: string) {
    if (game?.phase === "drawPhase") return;
    const card = viewPlayer.hand.find(c => c.id === cardId);
    if (!card) return;

    if (needsDiscard) {
      setSelectedCardIds(prev => prev.includes(cardId) ? [] : [cardId]);
      setSelectedPendingId(null);
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
    setDoubleRentCardId(null);
    setSelectedBoardCardId(null);
    setSelectedBoardSetId(null);
    setWildRentTargetPlayerId(null);
  }
  function showHandoff(toPlayerName: string, reason: string, onReady: () => void) {
    setHandoff({ toPlayerName, reason, onReady });
  }

  function handleEndTurn() {
    if (!game) return;
    const idx = game.players.findIndex(p => p.id === currentPlayer.id);
    const next = game.players[(idx + 1) % game.players.length];
    doEndTurn(() => {
      showHandoff(next.name, "It's your turn!", () => {
        setViewingPlayerId(next.id);
        clearSelection();
        setHandoff(null);
      });
    });
  }

  function handleDiscard() {
    if (!game || selectedCardIds.length !== 1) return;
    doDiscard(viewingPlayerId, selectedCardIds[0], () => {
      setSelectedCardIds([]);
    });
  }

  function handleConfirmPayment() {
    if (!game) return;
    const nextPending = game.pendingActions[1];
    const actingPlayerId = game.currentPlayerId;
    const actingPlayerName = game.players.find(p => p.id === actingPlayerId)?.name ?? "";
    doConfirmPayment(viewingPlayerId, paymentCardIds, () => {
      setPaymentCardIds([]);
      if (nextPending) {
        const nextPayerName = game.players.find(p => p.id === nextPending.fromPlayerId)?.name ?? "";
        showHandoff(nextPayerName, "You need to make a payment.", () => {
          setViewingPlayerId(nextPending.fromPlayerId);
          setHandoff(null);
        });
      } else {
        showHandoff(actingPlayerName, "All payments done — continue your turn.", () => {
          setViewingPlayerId(actingPlayerId);
          setHandoff(null);
        });
      }
    });
  }

  function handlePlayRent() {
    if (!game || !rentSetId) return;
    const opponents = game.players.filter(p => p.id !== viewPlayer.id);
    doPlayRentCard(viewPlayer.id, selectedCardIds[0], rentSetId, () => {
      clearSelection();
      if (opponents.length > 0) {
        showHandoff(opponents[0].name, "You need to pay rent.", () => {
          setViewingPlayerId(opponents[0].id);
          setHandoff(null);
        });
      }
    }, doubleRentCardId ?? undefined);
  }

  function handlePlayWildRent() {
    if (!game || !rentSetId) return;
    const opponents = game.players.filter(p => p.id !== viewPlayer.id);
    const target = wildRentTargetPlayerId ?? (opponents.length === 1 ? opponents[0].id : null);
    if (!target) return;
    const targetName = game.players.find(p => p.id === target)?.name ?? "";
    doPlayWildRent(viewPlayer.id, selectedCardIds[0], rentSetId, target, () => {
      clearSelection();
      showHandoff(targetName, "You need to pay rent.", () => {
        setViewingPlayerId(target);
        setHandoff(null);
      });
    }, doubleRentCardId ?? undefined);
  }

  function handlePlayPassGo(cardId: string) {
    doPlayPassGo(viewPlayer.id, cardId);
    clearSelection();
  }

  function handlePlayBirthday(cardId: string) {
    if (!game) return;
    const opponents = game.players.filter(p => p.id !== viewPlayer.id);
    doPlayItsMyBirthday(viewPlayer.id, cardId, () => {
      clearSelection();
      if (opponents.length > 0) {
        showHandoff(opponents[0].name, "You need to make a payment.", () => {
          setViewingPlayerId(opponents[0].id);
          setHandoff(null);
        });
      }
    });
  }

  function handlePlayDebtCollector(cardId: string, targetPlayerId: string) {
    const targetName = game?.players.find(p => p.id === targetPlayerId)?.name ?? "";
    doPlayDebtCollector(viewPlayer.id, cardId, targetPlayerId, () => {
      clearSelection();
      showHandoff(targetName, "You need to make a payment.", () => {
        setViewingPlayerId(targetPlayerId);
        setHandoff(null);
      });
    });
  }

  function handlePlaySlyDeal(cardId: string, targetPlayerId: string, targetSetId: string, targetCardId: string) {
    doPlaySlyDeal(viewPlayer.id, cardId, targetPlayerId, targetSetId, targetCardId);
    clearSelection();
  }

  function handlePlayForcedDeal(
    cardId: string, targetPlayerId: string, targetSetId: string,
    targetCardId: string, offeredSetId: string, offeredCardId: string
  ) {
    const actingPlayerId = viewPlayer.id;
    doPlayForcedDeal(viewPlayer.id, cardId, targetPlayerId, targetSetId, targetCardId, offeredSetId, offeredCardId, () => {
      clearSelection();
      setViewingPlayerId(actingPlayerId);
    });
  }

  // ── Game over ─────────────────────────────────────────────────────────────────
  if (game.phase === "gameOver") {
    const winner = game.players.find(p => p.id === game.winnerId)!;
    return (
      <div style={{
        minHeight: "100vh", background: "#0f1f0f",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}>
        <div style={{ textAlign: "center", maxWidth: 400, width: "100%" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
          <div style={{ color: "#fbbf24", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            {winner.name} Wins!
          </div>
          <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
            Collected {game.config.winCondition} complete property sets
          </div>
          <button
            onClick={() => { reset(); setViewingPlayerId("p1"); clearSelection(); setPaymentCardIds([]); }}
            style={{
              background: "#374151", border: "none", borderRadius: 12,
              padding: "12px 32px", color: "white", fontSize: 16,
              fontWeight: 600, cursor: "pointer", marginBottom: 24,
            }}
          >
            ← Main Menu
          </button>
          <div style={{
            background: "#0a170a", border: "1px solid #1f3d1f",
            borderRadius: 12, padding: 12, textAlign: "left",
            maxHeight: 300, overflowY: "auto",
          }}>
            <div style={{ color: "#6b7280", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              Game Log
            </div>
            {lastLog.map((entry, i) => (
              <div key={i} style={{
                color: "#6b7280", fontSize: 11, padding: "3px 0",
                borderBottom: "1px solid #1f3d1f",
              }}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main game ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0f1f0f", padding: "8px 12px 24px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* Handoff screen */}
        {handoff && (
          <HandoffScreen
            toPlayerName={handoff.toPlayerName}
            reason={handoff.reason}
            onReady={handoff.onReady}
          />
        )}

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
            onSwitchToPlayer={id => { setViewingPlayerId(id); setPaymentCardIds([]); }}
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
            onPlayDebtCollector={targetPlayerId => handlePlayDebtCollector(selectedAction.id, targetPlayerId)}
            onPlaySlyDeal={(targetPlayerId, targetSetId, targetCardId) =>
              handlePlaySlyDeal(selectedAction.id, targetPlayerId, targetSetId, targetCardId)}
            onPlayForcedDeal={(targetPlayerId, targetSetId, targetCardId, offeredSetId, offeredCardId) =>
              handlePlayForcedDeal(selectedAction.id, targetPlayerId, targetSetId, targetCardId, offeredSetId, offeredCardId)}
            onPlayHouse={setId => { doPlayHouse(viewPlayer.id, selectedAction.id, setId); clearSelection(); }}
            onPlayHotel={setId => { doPlayHotel(viewPlayer.id, selectedAction.id, setId); clearSelection(); }}
            onPlayWildRent={(setId, targetPlayerId) => {
              doPlayRentCard(viewPlayer.id, selectedAction.id, setId, () => {
                clearSelection();
                setViewingPlayerId(targetPlayerId);
              }, undefined, targetPlayerId);
            }}
            onBank={() => { doBankCards(viewPlayer.id, [selectedAction.id]); clearSelection(); }}
            onCancel={() => clearSelection()}
          />
        )}

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 0 10px",
        }}>
          <div style={{ color: "#4ade80", fontSize: 16, fontWeight: 700 }}>Monopoly Deal</div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{
              background: "#0a170a", border: "1px solid #1f3d1f",
              borderRadius: 6, padding: "3px 8px",
              color: "#6b7280", fontSize: 10,
            }}>
              {game.phase}
            </div>
            <div style={{
              background: "#0a170a", border: "1px solid #1f3d1f",
              borderRadius: 6, padding: "3px 8px",
              color: "#6b7280", fontSize: 10,
            }}>
              Deck: {game.deck.length}
            </div>
          </div>
        </div>

        {/* Error toast */}
        {error && (
          <div style={{
            background: "#450a0a", border: "1px solid #991b1b",
            borderRadius: 8, padding: "8px 12px", marginBottom: 8,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ color: "#fca5a5", fontSize: 12 }}>⚠️ {error}</span>
            <button onClick={clearError} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Player switcher */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {game.players.map(p => (
            <button
              key={p.id}
              onClick={() => { setViewingPlayerId(p.id); clearSelection(); }}
              style={{
                flex: 1, padding: "6px 0",
                background: viewPlayer.id === p.id ? "#16a34a" : "#0a170a",
                border: `1px solid ${viewPlayer.id === p.id ? "#4ade80" : "#1f3d1f"}`,
                borderRadius: 8, color: viewPlayer.id === p.id ? "white" : "#6b7280",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              {p.name} {p.id === currentPlayer.id ? "🎯" : ""}
            </button>
          ))}
        </div>

        {/* Opponent strips */}
        {game.players.filter(p => p.id !== viewPlayer.id).map(p => (
          <OpponentStrip
            key={p.id}
            player={p}
            game={game}
            isCurrentTurn={p.id === currentPlayer.id}
            isMyTurn={isMyTurn}
            singleDebtCollector={singleDebtCollector}
            onPlayDebtCollector={targetPlayerId =>
              handlePlayDebtCollector(selectedCardIds[0], targetPlayerId)
            }
            singleWildRent={singleWildRent}
            wildRentTargetPlayerId={wildRentTargetPlayerId}
            rentSetId={rentSetId}
            onSetWildRentTarget={id => setWildRentTargetPlayerId(prev => prev === id ? null : id)}
          />
        ))}

        {/* My board */}
        <MyBoard
          player={viewPlayer}
          game={game}
          isMyTurn={isMyTurn}
          selectedCardIds={selectedCardIds}
          selectedPropertyColor={selectedPropertyColor}
          selectedPendingId={selectedPendingId}
          selectedBoardCardId={selectedBoardCardId}
          selectedBoardSetId={selectedBoardSetId}
          rentSetId={rentSetId}
          rentableSets={rentableSets}
          doubleRentCardId={doubleRentCardId}
          singleProperty={singleProperty}
          singleRent={singleRent}
          singleWildRent={singleWildRent}
          singleHouse={singleHouse}
          singleHotel={singleHotel}
          singleDebtCollector={singleDebtCollector}
          allMoney={allMoney}
          singleNonPropertyNonMoney={singleNonPropertyNonMoney}
          singleDoubleRent={singleDoubleRent}
          singlePassGo={singlePassGo}
          singleBirthday={singleBirthday}
          canEndTurn={canEndTurn}
          needsDiscard={needsDiscard}
          wildRentTargetPlayerId={wildRentTargetPlayerId}
          onAddToSet={setId => { doPlacePropertyIntoSet(viewPlayer.id, selectedCardIds[0], setId); clearSelection(); }}
          onNewSet={() => { doPlacePropertyAsNewSet(viewPlayer.id, selectedCardIds[0]); clearSelection(); }}
          onNewSetWithColor={color => { doPlacePropertyAsNewSet(viewPlayer.id, selectedCardIds[0], color); clearSelection(); }}
          onSelectRentSet={setId => setRentSetId(prev => prev === setId ? null : setId)}
          onSelectBoardCard={(cardId, setId) => {
            if (selectedBoardCardId === cardId) {
              setSelectedBoardCardId(null);
              setSelectedBoardSetId(null);
            } else {
              setSelectedBoardCardId(cardId);
              setSelectedBoardSetId(setId);
              setSelectedCardIds([]);
              setSelectedPendingId(null);
            }
          }}
          onMoveToSet={toSetId => {
            if (!selectedBoardCardId || !selectedBoardSetId) return;
            doMovePropertyBetweenSets(viewPlayer.id, selectedBoardCardId, selectedBoardSetId, toSetId);
            setSelectedBoardCardId(null);
            setSelectedBoardSetId(null);
          }}
          onBankCards={() => { doBankCards(viewPlayer.id, selectedCardIds); clearSelection(); }}
          onPlayPassGo={() => handlePlayPassGo(selectedCardIds[0])}
          onPlayBirthday={() => handlePlayBirthday(selectedCardIds[0])}
          onPlayRent={handlePlayRent}
          onPlayWildRent={handlePlayWildRent}
          onToggleDoubleRent={cardId => setDoubleRentCardId(prev => prev === cardId ? null : cardId)}
          onAddHouse={setId => { doPlayHouse(viewPlayer.id, selectedCardIds[0], setId); clearSelection(); }}
          onAddHotel={setId => { doPlayHotel(viewPlayer.id, selectedCardIds[0], setId); clearSelection(); }}
          onDiscard={handleDiscard}
          onEndTurn={handleEndTurn}
          onDrawCards={doStartTurn}
          onPlacePending={(cardId, targetSetId) => doPlacePendingProperty(viewPlayer.id, cardId, targetSetId)}
          onSelectPending={id => {
            setSelectedPendingId(id === selectedPendingId ? null : id);
            setSelectedCardIds([]);
            setSelectedSetId(null);
            setRentSetId(null);
          }}
        />

        {/* My hand */}
        <MyHand
          cards={viewPlayer.hand}
          selectedCardIds={selectedCardIds}
          needsDiscard={needsDiscard}
          onToggleCard={toggleCardSelection}
        />

        {/* Game log */}
        <div style={{
          marginTop: 12, background: "#0a170a",
          border: "1px solid #1f3d1f", borderRadius: 10, padding: 10,
          maxHeight: 120, overflowY: "auto",
        }}>
          <div style={{ color: "#4b5563", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            Game Log
          </div>
          {game.log.map((entry, i) => (
            <div key={i} style={{ color: "#4b5563", fontSize: 11, padding: "2px 0", borderBottom: "1px solid #1a2e1a" }}>
              {entry}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}