"use client";
import { Player, Game, PropertySet } from "../types/game";
import { PropertyCard, RentCard } from "../types/card";
import { PROPERTY_RULES } from "../data/propertyRules";
import { isSetComplete, getRentForSet } from "../lib/propertyUtils";

interface PlayerBoardProps {
  player: Player;
  game: Game;
  isCurrentTurn: boolean;
  isViewing: boolean;
  isMyTurn: boolean;
  // Selection state
  selectedCardIds: string[];
  selectedPropertyColor: string | null;
  rentableSets: PropertySet[];
  rentSetId: string | null;
  // Action states
  allMoney: boolean;
  singleRent: boolean;
  singleNonPropertyNonMoney: boolean;
  canEndTurn: boolean;
  needsDiscard: boolean;
  discardCount: number;
  // Callbacks
  onToggleCard: (cardId: string) => void;
  onAddToSet: (setId: string) => void;
  onNewSet: () => void;
  onSelectRentSet: (setId: string) => void;
  onBankCards: () => void;
  onPlayRent: () => void;
  onDrawCards: () => void;
  onEndTurn: () => void;
  onDiscard: () => void;
}

export function PlayerBoard({
  player,
  game,
  isCurrentTurn,
  isViewing,
  isMyTurn,
  selectedCardIds,
  selectedPropertyColor,
  rentableSets,
  rentSetId,
  allMoney,
  singleRent,
  singleNonPropertyNonMoney,
  canEndTurn,
  needsDiscard,
  discardCount,
  onToggleCard,
  onAddToSet,
  onNewSet,
  onSelectRentSet,
  onBankCards,
  onPlayRent,
  onDrawCards,
  onEndTurn,
  onDiscard,
}: PlayerBoardProps) {
  const selectedCards = player.hand.filter(c => selectedCardIds.includes(c.id));
  const singleProperty =
    selectedCards.length === 1 && selectedCards[0].type === "property";
  const singleRentSelected =
    selectedCards.length === 1 && selectedCards[0].type === "rent";

  return (
    <div
      className={`rounded-xl border p-4 mb-4 ${
        isCurrentTurn
          ? "border-emerald-500 bg-slate-800"
          : "border-slate-600 bg-slate-800/50"
      }`}
    >
      {/* ── Player header + turn controls ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              isCurrentTurn
                ? "bg-emerald-500 text-white"
                : "bg-slate-600 text-slate-300"
            }`}
          >
            {player.name[0]}
          </div>
          <h2 className="font-bold text-white">{player.name}</h2>
          {isCurrentTurn && (
            <span className="text-xs text-emerald-400 font-medium">
              ● Current Turn
            </span>
          )}
          {isViewing && (
            <span className="text-xs text-blue-400 font-medium">👁 Viewing</span>
          )}
        </div>

        {/* Draw / End Turn — top right of box */}
        {isMyTurn && isViewing && (
          <div className="flex gap-2">
            {game.phase === "drawPhase" && (
              <button
                onClick={onDrawCards}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs"
              >
                Draw 2
              </button>
            )}
            {game.phase === "actionPhase" && (
              <button
                onClick={onEndTurn}
                disabled={!canEndTurn}
                className={`font-semibold px-3 py-1.5 rounded-lg text-xs ${
                  canEndTurn
                    ? "bg-slate-600 hover:bg-slate-500 text-white"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                }`}
              >
                End Turn →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Discard banner ── */}
      {needsDiscard && isViewing && (
        <div className="bg-red-900 border border-red-500 p-2 rounded-lg mb-3 text-xs flex items-center justify-between">
          <span className="text-red-200">
            Select{" "}
            <span className="font-bold text-white">{discardCount}</span>{" "}
            card{discardCount !== 1 ? "s" : ""} to discard
            {selectedCardIds.length > 0 && (
              <span className="text-slate-400 ml-1">
                ({selectedCardIds.length} selected)
              </span>
            )}
          </span>
          <button
            onClick={onDiscard}
            disabled={selectedCardIds.length !== discardCount}
            className={`font-semibold px-3 py-1 rounded-lg ${
              selectedCardIds.length === discardCount
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-red-950 text-red-800 cursor-not-allowed"
            }`}
          >
            Discard
          </button>
        </div>
      )}

      {/* ── Bank ── */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
            Bank — ${player.bank.reduce((s, c) => s + c.value, 0)}M
          </div>
          {/* Bank button lives next to bank label */}
          {isMyTurn && isViewing && game.phase === "actionPhase" && (
            <>
              {allMoney && (
                <button
                  onClick={onBankCards}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded text-xs"
                >
                  💰 Bank {selectedCardIds.length > 1 ? `${selectedCardIds.length} Cards` : "Card"}
                </button>
              )}
              {singleNonPropertyNonMoney && (
                <button
                  onClick={onBankCards}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded text-xs"
                >
                  💰 Bank Card
                </button>
              )}
            </>
          )}
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

      {/* ── Property sets ── */}
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
                singleRentSelected &&
                rentableSets.some(s => s.id === set.id);

              const isSelectedRentSet = set.id === rentSetId;

              return (
                <div
                  key={set.id}
                  onClick={() => {
                    if (isRentTarget) onSelectRentSet(set.id);
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
                    {isRentTarget && (
                      <span className="ml-auto text-red-300 font-normal">
                        ${getRentForSet(set)}M rent
                      </span>
                    )}
                    {isMatchingColor && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onAddToSet(set.id);
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

        {/* Charge Rent button — below properties when rent set selected */}
        {isMyTurn && isViewing && game.phase === "actionPhase" && singleRentSelected && rentSetId && (
          <button
            onClick={onPlayRent}
            className="mt-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs"
          >
            💸 Charge Rent
          </button>
        )}

        {/* New Set button */}
        {singleProperty &&
          isViewing &&
          isMyTurn &&
          game.phase === "actionPhase" && (
            <button
              onClick={onNewSet}
              className="mt-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs"
            >
              ＋ New Set
            </button>
          )}
      </div>

      {/* ── Hand ── */}
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
              const rc =
                card.type === "rent" ? (card as RentCard) : null;

              return (
                <div
                  key={card.id}
                  onClick={() => onToggleCard(card.id)}
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
            {Array.from({ length: Math.min(player.hand.length, 10) }).map(
              (_, i) => (
                <div
                  key={i}
                  className="w-8 h-11 bg-slate-700 border border-slate-600 rounded"
                />
              )
            )}
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
}