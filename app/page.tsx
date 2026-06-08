"use client";
import React, { useState } from "react";
import { useGame } from "../hooks/useGame";
import { PlayerBoard } from "../components/PlayerBoard";
import { PlayCardModal } from "../components/PlayCardModal";
import { PendingActionPanel } from "../components/PendingActionPanel";
import { CardView } from "../components/CardView";
import { Card } from "../types/card";

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function SetupScreen({ onStart }: { onStart: (names: string[]) => void }) {
  const [names, setNames] = useState(["Alice", "Bob"]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-1">Monopoly Deal</h1>
        <p className="text-gray-400 text-sm mb-8">First to collect 3 complete property sets wins.</p>

        <div className="space-y-3 mb-6">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-gray-400 text-sm w-20">Player {i + 1}</span>
              <input
                value={name}
                onChange={e => setNames(prev => prev.map((n, j) => j === i ? e.target.value : n))}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                placeholder={`Player ${i + 1} name`}
              />
              {names.length > 2 && (
                <button
                  onClick={() => setNames(prev => prev.filter((_, j) => j !== i))}
                  className="text-gray-500 hover:text-red-400 text-lg"
                >✕</button>
              )}
            </div>
          ))}
        </div>

        {names.length < 5 && (
          <button
            onClick={() => setNames(prev => [...prev, `Player ${prev.length + 1}`])}
            className="w-full py-2 mb-4 border border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-gray-400 hover:text-gray-200 transition-colors text-sm"
          >
            + Add Player
          </button>
        )}

        <button
          onClick={() => onStart(names.filter(n => n.trim()))}
          disabled={names.filter(n => n.trim()).length < 2}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-gray-900 font-black rounded-xl text-lg transition-colors"
        >
          Deal Cards
        </button>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-gray-500 text-xs leading-relaxed">
            <strong className="text-gray-400">How to play:</strong> On your turn, draw 2 cards then play up to 3 actions.
            Place properties, bank money, or play action cards. First to complete 3 property sets wins!
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Page() {
  const {
    game, error, clearError, initGame, startTurn, endTurn,
    playCard, confirmPayment, justSayNo, discard,
  } = useGame();

  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedDiscardIds, setSelectedDiscardIds] = useState<string[]>([]);

  if (!game) {
    return <SetupScreen onStart={initGame} />;
  }

  const viewPlayer = viewingPlayerId
    ? game.players.find(p => p.id === viewingPlayerId) ?? game.players[0]
    : game.players[0];

  if (!viewingPlayerId) {
    setViewingPlayerId(game.players[0].id);
  }

  const currentPlayer = game.players.find(p => p.id === game.currentPlayerId)!;
  const isViewingCurrentPlayer = viewPlayer.id === currentPlayer.id;

  if (game.phase === "gameOver") {
    const winner = game.players.find(p => p.id === game.winnerId)!;
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-black text-yellow-400 mb-2">{winner.name} Wins!</h1>
          <p className="text-gray-400 mb-8">Collected 3 complete property sets</p>
          <button onClick={() => window.location.reload()}
            className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black rounded-xl text-lg">
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900 border border-red-700 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-300 hover:text-white font-bold">✕</button>
        </div>
      )}

      {game.phase === "pendingAction" && (
        <PendingActionPanel
          game={game}
          viewingPlayerId={viewPlayer.id}
          onConfirmPayment={ids => confirmPayment(viewPlayer.id, ids)}
          onJustSayNo={cardId => justSayNo(viewPlayer.id, cardId)}
        />
      )}

      {selectedCard && game.phase === "actionPhase" && (
        <PlayCardModal
          game={game}
          card={selectedCard}
          playerId={viewPlayer.id}
          onPlay={params => { playCard(viewPlayer.id, selectedCard.id, params); setSelectedCard(null); }}
          onBank={() => { playCard(viewPlayer.id, selectedCard.id, { bankCard: true }); setSelectedCard(null); }}
          onCancel={() => setSelectedCard(null)}
        />
      )}

      {game.phase === "discardPhase" && viewPlayer.id === currentPlayer.id && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-2">Discard Down to 7</h2>
            <p className="text-gray-400 text-sm mb-4">
              Select {viewPlayer.hand.length - 7} card{viewPlayer.hand.length - 7 !== 1 ? "s" : ""} to discard.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {viewPlayer.hand.map(c => (
                <CardView key={c.id} card={c}
                  selected={selectedDiscardIds.includes(c.id)}
                  onClick={() => setSelectedDiscardIds(prev =>
                    prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id]
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => { discard(viewPlayer.id, selectedDiscardIds); setSelectedDiscardIds([]); }}
              disabled={selectedDiscardIds.length !== viewPlayer.hand.length - 7}
              className="w-full py-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white rounded-lg font-semibold"
            >
              Discard {selectedDiscardIds.length} card{selectedDiscardIds.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-black text-white">Monopoly Deal</h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{currentPlayer.name}'s turn</span>
            {game.phase === "actionPhase" && (
              <span className="bg-yellow-900/60 text-yellow-300 px-2 py-0.5 rounded text-xs font-semibold">
                {game.actionsRemaining} action{game.actionsRemaining !== 1 ? "s" : ""} left
              </span>
            )}
            <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-xs">
              {game.deck.length} in deck
            </span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {game.players.map(p => (
            <button key={p.id} onClick={() => setViewingPlayerId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewPlayer.id === p.id ? "bg-yellow-500 text-gray-900" : "bg-gray-800 text-gray-400 hover:text-white"
              }`}>
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {game.players.filter(p => p.id !== viewPlayer.id).map(p => (
            <PlayerBoard key={p.id} player={p}
              isCurrentPlayer={p.id === currentPlayer.id} isViewing={false} />
          ))}
        </div>

        <PlayerBoard
          player={viewPlayer}
          isCurrentPlayer={isViewingCurrentPlayer}
          isViewing={true}
          selectedCardId={selectedCard?.id}
          onCardClick={isViewingCurrentPlayer && game.phase === "actionPhase"
            ? card => setSelectedCard(card) : undefined}
          label="(You)"
        />

        <div className="mt-4 flex gap-3 justify-end">
          {game.phase === "drawPhase" && isViewingCurrentPlayer && (
            <button onClick={startTurn}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-semibold shadow">
              Draw 2 Cards
            </button>
          )}
          {game.phase === "actionPhase" && isViewingCurrentPlayer && (
            <button onClick={endTurn}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold">
              End Turn
            </button>
          )}
        </div>

        <div className="mt-4 bg-gray-900/60 rounded-xl border border-gray-800 p-3 max-h-36 overflow-y-auto">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Game Log</div>
          {game.log.map((entry, i) => (
            <div key={i} className="text-gray-400 text-xs py-0.5 border-b border-gray-800/60 last:border-0">{entry}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
