"use client";
import { Game } from "../types/game";
import { Player } from "../types/game";

interface GameHeaderProps {
  game: Game;
  currentPlayer: Player;
  onClearError: () => void;
  error: string | null;
}

export function GameHeader({ game, currentPlayer, onClearError, error }: GameHeaderProps) {
  return (
    <div className="mb-4">
      {/* Title + stats row */}
      <div className="flex items-center justify-between mb-2">
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

      {/* Error toast */}
      {error && (
        <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            onClick={onClearError}
            className="ml-3 text-red-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}