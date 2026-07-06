"use client";
import { useState, useEffect } from "react";
import { useMultiplayerGame } from "../../hooks/useMultiplayerGame";
import { MyBoard } from "../../components/MyBoard";
import { MyHand } from "../../components/MyHand";
import { OpponentStrip } from "../../components/OpponentStrip";
import { PaymentModal } from "../../components/PaymentModal";
import { ActionCardModal } from "../../components/ActionCardModal";
import { PropertyCard, RentCard, ActionCard, PropertyColor } from "../../types/card";
import { getRentableSetsByCard } from "../../lib/propertyUtils";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function MultiplayerPage() {
  const mp = useMultiplayerGame();

  const [screen, setScreen] = useState<"home" | "create" | "join" | "lobby" | "game">("home");
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [generatedCode] = useState(() => generateRoomCode());

  // Game UI state
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [rentSetId, setRentSetId] = useState<string | null>(null);
  const [doubleRentCardId, setDoubleRentCardId] = useState<string | null>(null);
  const [paymentCardIds, setPaymentCardIds] = useState<string[]>([]);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
  const [selectedBoardCardId, setSelectedBoardCardId] = useState<string | null>(null);
  const [selectedBoardSetId, setSelectedBoardSetId] = useState<string | null>(null);
  const [wildRentTargetPlayerId, setWildRentTargetPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (mp.game && screen === "lobby") {
      setScreen("game");
    }
  }, [mp.game]);

  const s: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0f1f0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    flexDirection: "column",
  };

  const card: React.CSSProperties = {
    background: "#0a170a",
    border: "1px solid #1f3d1f",
    borderRadius: 16,
    padding: 32,
    width: "100%",
    maxWidth: 360,
  };

  const title: React.CSSProperties = {
    color: "#4ade80",
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
  };

  const btn = (bg: string, disabled = false): React.CSSProperties => ({
    width: "100%",
    minHeight: 48,
    background: disabled ? "#1f2937" : bg,
    border: "none",
    borderRadius: 10,
    color: disabled ? "#4b5563" : "white",
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    marginBottom: 10,
    touchAction: "manipulation",
  });

  const input: React.CSSProperties = {
    width: "100%",
    background: "#0f1f0f",
    border: "1px solid #1f3d1f",
    borderRadius: 8,
    padding: "10px 14px",
    color: "white",
    fontSize: 16,
    marginBottom: 12,
    outline: "none",
    boxSizing: "border-box",
  };

  // ── Home screen ─────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <div style={s}>
        <div style={card}>
          <div style={title}>Monopoly Deal</div>
          <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>Multiplayer</div>
          <button style={btn("#16a34a")} onClick={() => setScreen("create")}>
            Create Room
          </button>
          <button style={btn("#1d4ed8")} onClick={() => setScreen("join")}>
            Join Room
          </button>
          <button
            style={{ ...btn("#374151"), marginTop: 4 }}
            onClick={() => window.location.href = "/"}
          >
            ← Pass & Play
          </button>
        </div>
      </div>
    );
  }

  // ── Create room screen ───────────────────────────────────────────────────────
  if (screen === "create") {
    return (
      <div style={s}>
        <div style={card}>
          <div style={title}>Create Room</div>
          <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>Your name:</div>
          <input
            style={input}
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
          />
          <button
            style={btn("#16a34a", !playerName.trim())}
            disabled={!playerName.trim()}
            onClick={() => {
              const code = generatedCode;
              setRoomCode(code);
              mp.connect(code, playerName.trim(), true);
              setScreen("lobby");
            }}
          >
            Create Room
          </button>
          <button style={btn("#374151")} onClick={() => setScreen("home")}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── Join room screen ─────────────────────────────────────────────────────────
  if (screen === "join") {
    return (
      <div style={s}>
        <div style={card}>
          <div style={title}>Join Room</div>
          <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>Room code:</div>
          <input
            style={{ ...input, textTransform: "uppercase", letterSpacing: 4, fontSize: 20, textAlign: "center" }}
            value={roomCodeInput}
            onChange={e => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="XXXX"
            maxLength={4}
          />
          <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>Your name:</div>
          <input
            style={input}
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
          />
          <button
            style={btn("#1d4ed8", !playerName.trim() || roomCodeInput.length !== 4)}
            disabled={!playerName.trim() || roomCodeInput.length !== 4}
            onClick={() => {
              setRoomCode(roomCodeInput);
              mp.connect(roomCodeInput, playerName.trim(), false);
              setScreen("lobby");
            }}
          >
            Join Game
          </button>
          <button style={btn("#374151")} onClick={() => setScreen("home")}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── Lobby screen ─────────────────────────────────────────────────────────────
  if (screen === "lobby" || (mp.lobby && !mp.game)) {
    const isHost = mp.lobby?.playerNames[0] === playerName;
    return (
      <div style={s}>
        <div style={card}>
          <div style={title}>Waiting for Players</div>
          <div style={{
            background: "#0f1f0f", border: "1px solid #16a34a",
            borderRadius: 12, padding: "12px 0",
            textAlign: "center", marginBottom: 20,
          }}>
            <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Room Code</div>
            <div style={{ color: "#4ade80", fontSize: 32, fontWeight: 700, letterSpacing: 8 }}>
              {roomCode}
            </div>
          </div>

          <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>
            Players ({mp.lobby?.playerNames.length ?? 0}/5):
          </div>
          <div style={{ marginBottom: 20 }}>
            {mp.lobby?.playerNames.map((name, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", background: "#0f1f0f",
                borderRadius: 8, marginBottom: 6,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: i === 0 ? "#16a34a" : "#374151",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 700, fontSize: 12,
                }}>
                  {name[0].toUpperCase()}
                </div>
                <span style={{ color: "white", fontSize: 14 }}>{name}</span>
                {i === 0 && <span style={{ color: "#4ade80", fontSize: 11, marginLeft: "auto" }}>Host</span>}
                {name === playerName && <span style={{ color: "#60a5fa", fontSize: 11, marginLeft: i === 0 ? 0 : "auto" }}>You</span>}
              </div>
            ))}
          </div>

          {mp.error && (
            <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12 }}>
              ⚠️ {mp.error}
            </div>
          )}

          {isHost ? (
            <button
              style={btn("#16a34a", (mp.lobby?.playerNames.length ?? 0) < 2)}
              disabled={(mp.lobby?.playerNames.length ?? 0) < 2}
              onClick={() => {
                mp.doStartGame();
                setScreen("game");
              }}
            >
              Start Game ({mp.lobby?.playerNames.length} players)
            </button>
          ) : (
            <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: "12px 0" }}>
              Waiting for host to start...
            </div>
          )}

          <button style={btn("#374151")} onClick={() => {
            mp.disconnect();
            setScreen("home");
          }}>
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  // ── Game screen ──────────────────────────────────────────────────────────────
  const game = mp.game;
  if (!game || !mp.myPlayerId) {
    return (
      <div style={s}>
        <div style={{ color: "#6b7280" }}>Connecting...</div>
      </div>
    );
  }

  const myPlayerId = mp.myPlayerId;
  const currentPlayer = game.players.find(p => p.id === game.currentPlayerId)!;
  const viewPlayer = game.players.find(p => p.id === myPlayerId)!;
  const isMyTurn = myPlayerId === currentPlayer.id;

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
    actionType !== "debtCollector" &&
    actionType !== "justSayNo"
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

  const isMyPayment = pendingPayment?.allPayerIds.includes(myPlayerId ?? "") ?? false;
  const isMyCharge = pendingPayment?.chargerPlayerId === myPlayerId;
  const iHaveConfirmed = pendingPayment?.confirmedPayments.some(p => p.playerId === myPlayerId) ?? false;

  const pendingSlyDeal =
    game.phase === "pendingAction" &&
    game.pendingActions.length > 0 &&
    game.pendingActions[0].kind === "slyDeal"
      ? game.pendingActions[0]
      : null;

  const pendingForcedDeal =
    game.phase === "pendingAction" &&
    game.pendingActions.length > 0 &&
    game.pendingActions[0].kind === "forcedDeal"
      ? game.pendingActions[0]
      : null;

  const pendingSteal = pendingSlyDeal ?? pendingForcedDeal ?? null;

  // Does this player have a JSN card
  const myJsnCard = game.players
    .find(p => p.id === myPlayerId)?.hand
    .find(c => c.type === "action" && (c as ActionCard).action === "justSayNo") ?? null;

  // Can I play JSN right now
  const canPlayJsn = pendingSteal !== null &&
    pendingSteal.lastJsnPlayerId !== myPlayerId &&
    myJsnCard !== null;

  const canPlayJsnOnPayment = pendingPayment !== null &&
    pendingPayment.lastJsnPlayerId !== myPlayerId &&
    myJsnCard !== null;

  function clearSelection() {
    setSelectedCardIds([]);
    setSelectedSetId(null);
    setRentSetId(null);
    setDoubleRentCardId(null);
    setSelectedBoardCardId(null);
    setSelectedBoardSetId(null);
    setWildRentTargetPlayerId(null);
  }

  function toggleCardSelection(cardId: string) {
    if (game?.phase === "drawPhase") return;
    if (game?.phase === "actionPhase" && game.actionsRemaining === 0 && !needsDiscard) return;

    const card = viewPlayer.hand.find(c => c.id === cardId);
    if (!card) return;

    setSelectedBoardCardId(null);
    setSelectedBoardSetId(null);

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

  // Game over
  if (game.phase === "gameOver") {
    const winner = game.players.find(p => p.id === game.winnerId)!;
    return (
      <div style={{ ...s, justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
          <div style={{ color: "#fbbf24", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            {winner.name} Wins!
          </div>
          <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
            Collected {game.config.winCondition} complete property sets
          </div>
          <button
            onClick={() => { mp.disconnect(); setScreen("home"); }}
            style={{ ...btn("#374151"), width: "auto", padding: "12px 32px" }}
          >
            ← Main Menu
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: "100vh", background: "#0f1f0f", padding: "8px 12px 24px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* Payment modal */}
        {pendingPayment && isMyPayment && (
          <PaymentModal
            game={game}
            pending={pendingPayment}
            viewingPlayerId={myPlayerId}
            paymentCardIds={paymentCardIds}
            onToggleCard={id =>
              setPaymentCardIds(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
              )
            }
            onConfirm={() => {
              const ids = [...paymentCardIds];
              mp.doConfirmPayment(ids);
              setPaymentCardIds([]);
            }}
            onSwitchToPlayer={() => {}}
            myJsnCard={canPlayJsnOnPayment ? myJsnCard : null}
            onPlayJustSayNo={cardId => mp.doPlayJustSayNo(cardId)}
            iHaveConfirmed={iHaveConfirmed}
            allPayerIds={pendingPayment.allPayerIds}
            confirmedPayments={pendingPayment.confirmedPayments}
            myPlayerId={myPlayerId ?? undefined}
          />
        )}

        {/* JSN response modal for sly/forced deal */}
        {pendingSteal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 50, padding: 16,
          }}>
            <div style={{
              background: "#0a170a", border: "1px solid #1f3d1f",
              borderRadius: 16, padding: 20, width: "100%", maxWidth: 400,
            }}>
              <div style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                {pendingSteal.kind === "slyDeal" ? "🃏 Sly Deal!" : "🔄 Forced Deal!"}
              </div>
              <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>
                <span style={{ color: "#f87171", fontWeight: 600 }}>
                  {game.players.find(p => p.id === pendingSteal.fromPlayerId)?.name}
                </span>
                {pendingSteal.kind === "slyDeal" ? " wants to steal " : " wants to swap for "}
                <span style={{ color: "#fbbf24", fontWeight: 600 }}>
                  {/* Find the card name from victim's properties */}
                  {(() => {
                    const victim = game.players.find(p => p.id === pendingSteal.toPlayerId);
                    const set = victim?.propertySets.find(s => s.id === pendingSteal.targetSetId);
                    const card = set?.properties.find(c => c.id === pendingSteal.targetCardId);
                    return card?.name ?? "a property";
                  })()}
                </span>
                {pendingSteal.kind === "forcedDeal" && (
                  <>
                    {" from "}
                    <span style={{ color: "#60a5fa", fontWeight: 600 }}>
                      {game.players.find(p => p.id === pendingSteal.toPlayerId)?.name}
                    </span>
                    {" in exchange for "}
                    <span style={{ color: "#4ade80", fontWeight: 600 }}>
                      {(() => {
                        const attacker = game.players.find(p => p.id === pendingSteal.fromPlayerId);
                        const set = attacker?.propertySets.find(s => s.id === (pendingSteal as any).offeredSetId);
                        const card = set?.properties.find(c => c.id === (pendingSteal as any).offeredCardId);
                        return card?.name ?? "a property";
                      })()}
                    </span>
                  </>
                )}
              </div>

              {/* JSN count indicator */}
              {pendingSteal.jsnCount > 0 && (
                <div style={{
                  background: "#1e1b4b", border: "1px solid #4c1d95",
                  borderRadius: 8, padding: "6px 12px", marginBottom: 12,
                  color: "#c4b5fd", fontSize: 12,
                }}>
                  {pendingSteal.jsnCount} Just Say No {pendingSteal.jsnCount > 1 ? "s" : ""} played —
                  action is currently {pendingSteal.jsnCount % 2 === 1 ? "BLOCKED" : "GOING THROUGH"}
                </div>
              )}

              {canPlayJsn && (
                <button
                  onClick={() => {
                    mp.doPlayJustSayNo(myJsnCard!.id);
                  }}
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

              {/* Only the victim or attacker can resolve — others just wait */}
              {(myPlayerId === pendingSteal.toPlayerId ||
                (myPlayerId === pendingSteal.fromPlayerId && pendingSteal.jsnCount % 2 === 1)) ? (
                <button
                  onClick={() => mp.doResolveJsn()}
                  style={{
                    width: "100%", minHeight: 48,
                    background: "#374151", border: "none", borderRadius: 10,
                    color: "white", fontSize: 14, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {pendingSteal.jsnCount % 2 === 0 ? "Accept" : "Resolve (Blocked)"}
                </button>
              ) : (
                <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: "8px 0" }}>
                  Waiting for {game.players.find(p => p.id === pendingSteal.toPlayerId)?.name} to respond...
                </div>
              )}
            </div>
          </div>
        )}

        {pendingPayment && !isMyPayment && !isMyCharge && (
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
              {(pendingPayment.jsnCount ?? 0) > 0 ? (
                // JSN state — existing JSN counter UI
                <>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
                  <div style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                    Just Say No played!
                  </div>
                  <div style={{
                    background: "#1e1b4b", border: "1px solid #4c1d95",
                    borderRadius: 8, padding: "6px 12px", marginBottom: 16,
                    color: "#c4b5fd", fontSize: 12,
                  }}>
                    {pendingPayment.jsnCount} JSN played —{" "}
                    {pendingPayment.jsnCount % 2 === 1 ? "BLOCKED 🚫" : "GOING THROUGH ✅"}
                  </div>
                  {canPlayJsnOnPayment && myJsnCard && (
                    <button
                      onClick={() => mp.doPlayJustSayNo(myJsnCard.id)}
                      style={{
                        width: "100%", minHeight: 48,
                        background: "#7c3aed", border: "none", borderRadius: 10,
                        color: "white", fontSize: 15, fontWeight: 700,
                        cursor: "pointer", marginBottom: 10,
                      }}
                    >
                      Counter with Just Say No! 🚫
                    </button>
                  )}
                  {pendingPayment.lastJsnPlayerId === myPlayerId && (
                    <div style={{ color: "#6b7280", fontSize: 13 }}>
                      Waiting for others to respond...
                    </div>
                  )}
                  {myPlayerId === pendingPayment.chargerPlayerId &&
                    pendingPayment.jsnCount % 2 === 1 &&
                    pendingPayment.lastJsnPlayerId !== myPlayerId && (
                    <button
                      onClick={() => mp.doConfirmPayment([])}
                      style={{
                        width: "100%", minHeight: 48,
                        background: "#374151", border: "none", borderRadius: 10,
                        color: "white", fontSize: 14, fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Accept Block
                    </button>
                  )}
                </>
              ) : (
                // Normal waiting state — show who has paid and JSN option
                <>
                  <div style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                  {pendingPayment.kind === "payBirthday" ? "🎂 It's My Birthday!" :
                    pendingPayment.kind === "payRent" ? "🏠 Rent Due" : "💰 Debt Collector"}
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>
                    Waiting for payments...
                  </div>
                  {/* Show payment status */}
                  {pendingPayment.allPayerIds.map(pid => {
                    const hasConfirmed = pendingPayment.confirmedPayments?.some(p => p.playerId === pid);
                    const player = game.players.find(p => p.id === pid);
                    return (
                      <div key={pid} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        marginBottom: 6, justifyContent: "center",
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: hasConfirmed ? "#4ade80" : "#6b7280",
                          flexShrink: 0,
                        }} />
                        <span style={{ color: hasConfirmed ? "#4ade80" : "#9ca3af", fontSize: 13 }}>
                          {player?.name} {hasConfirmed ? "✓ Paid" : "paying..."}
                        </span>
                      </div>
                    );
                  })}
                  {/* JSN button */}
                  {canPlayJsnOnPayment && myJsnCard && (
                    <button
                      onClick={() => mp.doPlayJustSayNo(myJsnCard.id)}
                      style={{
                        width: "100%", minHeight: 48,
                        background: "#7c3aed", border: "none", borderRadius: 10,
                        color: "white", fontSize: 15, fontWeight: 700,
                        cursor: "pointer", marginTop: 16,
                      }}
                    >
                      Just Say No! 🚫
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {pendingPayment && isMyCharge && (pendingPayment.jsnCount ?? 0) > 0 && (
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
              <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
              <div style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                Just Say No played!
              </div>
              <div style={{
                background: "#1e1b4b", border: "1px solid #4c1d95",
                borderRadius: 8, padding: "6px 12px", marginBottom: 16,
                color: "#c4b5fd", fontSize: 12,
              }}>
                {pendingPayment.jsnCount} JSN —{" "}
                {pendingPayment.jsnCount % 2 === 1 ? "Your action is BLOCKED 🚫" : "Your action is GOING THROUGH ✅"}
              </div>
              {canPlayJsnOnPayment && myJsnCard && (
                <button
                  onClick={() => mp.doPlayJustSayNo(myJsnCard.id)}
                  style={{
                    width: "100%", minHeight: 48,
                    background: "#7c3aed", border: "none", borderRadius: 10,
                    color: "white", fontSize: 15, fontWeight: 700,
                    cursor: "pointer", marginBottom: 10,
                  }}
                >
                  Counter with Just Say No! 🚫
                </button>
              )}
              {pendingPayment.jsnCount % 2 === 1 &&
               pendingPayment.lastJsnPlayerId !== myPlayerId && (
                <button
                  onClick={() => mp.doConfirmPayment([])}
                  style={{
                    width: "100%", minHeight: 48,
                    background: "#374151", border: "none", borderRadius: 10,
                    color: "white", fontSize: 14, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Accept Block
                </button>
              )}
            </div>
          </div>
        )}


        {/* Action card modal */}
        {selectedAction && isMyTurn && game.phase === "actionPhase" && !needsDiscard && (
          <ActionCardModal
            game={game}
            card={selectedAction}
            playerId={myPlayerId}
            onPlayPassGo={() => { mp.doPlayPassGo(selectedAction.id); clearSelection(); }}
            onPlayBirthday={() => { mp.doPlayItsMyBirthday(selectedAction.id); clearSelection(); }}
            onPlayDebtCollector={targetPlayerId => { mp.doPlayDebtCollector(selectedAction.id, targetPlayerId); clearSelection(); }}
            onPlaySlyDeal={(targetPlayerId, targetSetId, targetCardId) => {
              mp.doPlaySlyDeal(selectedAction.id, targetPlayerId, targetSetId, targetCardId);
              clearSelection();
            }}
            onPlayForcedDeal={(targetPlayerId, targetSetId, targetCardId, offeredSetId, offeredCardId) => {
              mp.doPlayForcedDeal(selectedAction.id, targetPlayerId, targetSetId, targetCardId, offeredSetId, offeredCardId);
              clearSelection();
            }}
            onPlayHouse={setId => { mp.doPlayHouse(selectedAction.id, setId); clearSelection(); }}
            onPlayHotel={setId => { mp.doPlayHotel(selectedAction.id, setId); clearSelection(); }}
            onPlayWildRent={(setId, targetPlayerId) => {
              mp.doPlayWildRent(selectedAction.id, setId, targetPlayerId);
              clearSelection();
            }}
            onBank={() => { mp.doBankCards([selectedAction.id]); clearSelection(); }}
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
              borderRadius: 6, padding: "3px 8px", color: "#6b7280", fontSize: 10,
            }}>
              {game.phase}
            </div>
            <div style={{
              background: "#0a170a", border: "1px solid #1f3d1f",
              borderRadius: 6, padding: "3px 8px", color: "#6b7280", fontSize: 10,
            }}>
              Deck: {game.deck.length}
            </div>
          </div>
        </div>

        {/* Error */}
        {mp.error && (
          <div style={{
            background: "#450a0a", border: "1px solid #991b1b",
            borderRadius: 8, padding: "8px 12px", marginBottom: 8,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ color: "#fca5a5", fontSize: 12 }}>⚠️ {mp.error}</span>
            <button onClick={mp.clearError} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Opponents */}
        {game.players.filter(p => p.id !== myPlayerId).map(p => (
          <OpponentStrip
            key={p.id}
            player={p}
            game={game}
            isCurrentTurn={p.id === currentPlayer.id}
            isMyTurn={isMyTurn}
            singleDebtCollector={singleDebtCollector}
            onPlayDebtCollector={targetPlayerId => {
              mp.doPlayDebtCollector(selectedCardIds[0], targetPlayerId);
              clearSelection();
            }}
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
          onAddToSet={setId => { mp.doPlacePropertyIntoSet(selectedCardIds[0], setId); clearSelection(); }}
          onNewSet={() => { mp.doPlacePropertyAsNewSet(selectedCardIds[0]); clearSelection(); }}
          onNewSetWithColor={color => { mp.doPlacePropertyAsNewSet(selectedCardIds[0], color); clearSelection(); }}
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
            mp.doMovePropertyBetweenSets(selectedBoardCardId, selectedBoardSetId, toSetId);
            setSelectedBoardCardId(null);
            setSelectedBoardSetId(null);
          }}
          onBankCards={() => { mp.doBankCards(selectedCardIds); clearSelection(); }}
          onPlayPassGo={() => { mp.doPlayPassGo(selectedCardIds[0]); clearSelection(); }}
          onPlayBirthday={() => { mp.doPlayItsMyBirthday(selectedCardIds[0]); clearSelection(); }}
          onPlayRent={() => {
            if (!rentSetId) return;
            mp.doPlayRentCard(selectedCardIds[0], rentSetId, doubleRentCardId ?? undefined);
            clearSelection();
          }}
          onPlayWildRent={() => {
            if (!rentSetId) return;
            const opponents = game.players.filter(p => p.id !== myPlayerId);
            const target = wildRentTargetPlayerId ?? (opponents.length === 1 ? opponents[0].id : null);
            if (!target) return;
            mp.doPlayWildRent(selectedCardIds[0], rentSetId, target, doubleRentCardId ?? undefined);
            clearSelection();
          }}
          onToggleDoubleRent={cardId => setDoubleRentCardId(prev => prev === cardId ? null : cardId)}
          onAddHouse={setId => { mp.doPlayHouse(selectedCardIds[0], setId); clearSelection(); }}
          onAddHotel={setId => { mp.doPlayHotel(selectedCardIds[0], setId); clearSelection(); }}
          onDiscard={() => {
            if (selectedCardIds.length !== 1) return;
            mp.doDiscard(selectedCardIds[0]);
            setSelectedCardIds([]);
          }}
          onEndTurn={() => { mp.doEndTurn(); clearSelection(); }}
          onDrawCards={() => mp.doStartTurn()}
          onPlacePending={(cardId, targetSetId) => mp.doPlacePendingProperty(cardId, targetSetId)}
          onSelectPending={id => {
            setSelectedPendingId(id === selectedPendingId ? null : id);
            setSelectedCardIds([]);
            setSelectedSetId(null);
            setRentSetId(null);
          }}
          onMoveWildToNewColor={(cardId, fromSetId, color) => {
            mp.doMoveWildToNewColor(cardId, fromSetId, color);
            setSelectedBoardCardId(null);
            setSelectedBoardSetId(null);
          }}
          onClearHandSelection={() => {
            setSelectedCardIds([]);
            setSelectedPendingId(null);
            setRentSetId(null);
            setDoubleRentCardId(null);
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