"use client";
import React, { useState } from "react";
import { Card, PropertyCard, ActionCard, RentCard } from "../types/card";
import { Game, Player } from "../types/game";
import { CardView } from "./CardView";
import { PropertySetView } from "./PropertySetView";
import { isSetComplete } from "../lib/propertyUtils";
import { getColorName } from "../lib/colorUtils";
import { PlayCardParams } from "../lib/gameEngine";
import { PROPERTY_RULES } from "../data/propertyRules";

interface PlayCardModalProps {
  game: Game;
  card: Card;
  playerId: string;
  onPlay: (params?: PlayCardParams) => void;
  onBank: () => void;
  onCancel: () => void;
}

export function PlayCardModal({ game, card, playerId, onPlay, onBank, onCancel }: PlayCardModalProps) {
  const player = game.players.find(p => p.id === playerId)!;
  const opponents = game.players.filter(p => p.id !== playerId);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-4 items-start">
            <CardView card={card} />
            <div>
              <h2 className="text-xl font-bold text-white">{card.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{getCardDescription(card)}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-white text-xl font-bold">✕</button>
        </div>

        <CardActionBody
          game={game}
          card={card}
          player={player}
          opponents={opponents}
          onPlay={onPlay}
          onBank={onBank}
        />
      </div>
    </div>
  );
}

function CardActionBody({
  game, card, player, opponents, onPlay, onBank,
}: {
  game: Game;
  card: Card;
  player: Player;
  opponents: Player[];
  onPlay: (params?: PlayCardParams) => void;
  onBank: () => void;
}) {
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(
    opponents.length === 1 ? opponents[0].id : null
  );
  const [targetSetId, setTargetSetId] = useState<string | null>(null);
  const [targetCardId, setTargetCardId] = useState<string | null>(null);
  const [offeredSetId, setOfferedSetId] = useState<string | null>(null);
  const [offeredCardId, setOfferedCardId] = useState<string | null>(null);

  // Money — just bank or play is irrelevant (money always goes to bank)
  if (card.type === "money") {
    return (
      <div className="flex gap-3 mt-4">
        <button onClick={() => onPlay()} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold">
          Add to Bank
        </button>
      </div>
    );
  }

  // Property
  if (card.type === "property") {
    const propCard = card as PropertyCard;
    const isWild = propCard.colors.length > 1;
    return (
      <div>
        {isWild && (
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-2">Choose which color to play as:</p>
            <div className="flex flex-wrap gap-2">
              {propCard.colors.map(color => (
                <button
                  key={color}
                  onClick={() => onPlay()} // activeColor managed by flip after placement
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-600 hover:border-white transition-colors"
                >
                  {getColorName(color)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={() => onPlay()} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-semibold">
            Place on Board
          </button>
          <button onClick={onBank} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold">
            Bank as ${card.value}M
          </button>
        </div>
      </div>
    );
  }

  // Action cards
  if (card.type === "action") {
    const actionCard = card as ActionCard;

    if (actionCard.action === "passGo") {
      return (
        <div className="flex gap-3 mt-4">
          <button onClick={() => onPlay()} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold">
            Draw 2 Cards
          </button>
          <button onClick={onBank} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold">
            Bank as ${card.value}M
          </button>
        </div>
      );
    }

    if (actionCard.action === "justSayNo") {
      return (
        <div>
          <p className="text-gray-400 text-sm mb-4">Just Say No can only be played in response to an action card targeting you.</p>
          <button onClick={onBank} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold">
            Bank as ${card.value}M
          </button>
        </div>
      );
    }

    if (actionCard.action === "itsMyBirthday") {
      return (
        <div>
          <p className="text-gray-300 text-sm mb-4">All opponents must pay you $2M.</p>
          <div className="flex gap-3">
            <button onClick={() => onPlay()} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-lg font-semibold">
              🎂 Celebrate!
            </button>
            <button onClick={onBank} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold">
              Bank as ${card.value}M
            </button>
          </div>
        </div>
      );
    }

    if (actionCard.action === "debtCollector") {
      return (
        <TargetPlayerSelect
          label="Choose who to collect $5M from:"
          opponents={opponents}
          selected={targetPlayerId}
          onSelect={setTargetPlayerId}
          onConfirm={() => onPlay({ targetPlayerId: targetPlayerId! })}
          onBank={onBank}
          card={card}
        />
      );
    }

    if (actionCard.action === "rentWild") {
      // Choose your set to rent, then target player
      const mySets = player.propertySets;
      return (
        <div>
          <p className="text-gray-300 text-sm mb-3">Choose your set to charge rent on:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {mySets.map(set => (
              <button
                key={set.id}
                onClick={() => setTargetSetId(set.id)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  targetSetId === set.id
                    ? "border-yellow-400 text-yellow-400"
                    : "border-gray-600 text-gray-300 hover:border-gray-400"
                }`}
              >
                {getColorName(set.color)} ({set.properties.length})
              </button>
            ))}
          </div>
          {mySets.length === 0 && <p className="text-gray-500 text-sm mb-4">You have no properties.</p>}
          {targetSetId && (
            <TargetPlayerSelect
              label="Choose who to charge:"
              opponents={opponents}
              selected={targetPlayerId}
              onSelect={setTargetPlayerId}
              onConfirm={() => onPlay({ targetSetId: targetSetId!, targetPlayerId: targetPlayerId! })}
              onBank={onBank}
              card={card}
            />
          )}
          {!targetSetId && (
            <button onClick={onBank} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold mt-2">
              Bank as ${card.value}M
            </button>
          )}
        </div>
      );
    }

    if (actionCard.action === "slyDeal") {
      const targetPlayer = targetPlayerId ? game.players.find(p => p.id === targetPlayerId) : null;
      const availableSets = targetPlayer?.propertySets.filter(s => !isSetComplete(s)) ?? [];
      return (
        <div>
          <TargetPlayerSelect
            label="Steal from:"
            opponents={opponents}
            selected={targetPlayerId}
            onSelect={id => { setTargetPlayerId(id); setTargetSetId(null); setTargetCardId(null); }}
            onConfirm={() => {}}
            hideConfirm
            onBank={onBank}
            card={card}
          />
          {targetPlayerId && (
            <div className="mt-3">
              <p className="text-gray-300 text-sm mb-2">Choose a property to steal:</p>
              {availableSets.length === 0 && <p className="text-gray-500 text-sm">No stealable properties.</p>}
              {availableSets.map(set => (
                <div key={set.id} className="mb-2">
                  <PropertySetView
                    set={set}
                    selectedCardId={targetCardId ?? undefined}
                    onCardClick={cid => { setTargetSetId(set.id); setTargetCardId(cid); }}
                  />
                </div>
              ))}
            </div>
          )}
          {targetCardId && targetSetId && (
            <button
              onClick={() => onPlay({ targetPlayerId: targetPlayerId!, targetSetId: targetSetId!, targetCardId: targetCardId! })}
              className="mt-3 w-full py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg font-semibold"
            >
              Steal Property
            </button>
          )}
        </div>
      );
    }

    if (actionCard.action === "forcedDeal") {
      const targetPlayer = targetPlayerId ? game.players.find(p => p.id === targetPlayerId) : null;
      const theirSets = targetPlayer?.propertySets.filter(s => !isSetComplete(s)) ?? [];
      const mySets = player.propertySets.filter(s => !isSetComplete(s));
      return (
        <div>
          <TargetPlayerSelect
            label="Swap with:"
            opponents={opponents}
            selected={targetPlayerId}
            onSelect={id => { setTargetPlayerId(id); setTargetSetId(null); setTargetCardId(null); }}
            onConfirm={() => {}}
            hideConfirm
            onBank={onBank}
            card={card}
          />
          {targetPlayerId && (
            <>
              <div className="mt-3">
                <p className="text-gray-300 text-sm mb-2">Their property (you want):</p>
                {theirSets.map(set => (
                  <div key={set.id} className="mb-2">
                    <PropertySetView
                      set={set}
                      selectedCardId={targetCardId ?? undefined}
                      onCardClick={cid => { setTargetSetId(set.id); setTargetCardId(cid); }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <p className="text-gray-300 text-sm mb-2">Your property (you give):</p>
                {mySets.map(set => (
                  <div key={set.id} className="mb-2">
                    <PropertySetView
                      set={set}
                      selectedCardId={offeredCardId ?? undefined}
                      onCardClick={cid => { setOfferedSetId(set.id); setOfferedCardId(cid); }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
          {targetCardId && offeredCardId && (
            <button
              onClick={() => onPlay({
                targetPlayerId: targetPlayerId!,
                targetSetId: targetSetId!,
                targetCardId: targetCardId!,
                offeredSetId: offeredSetId!,
                offeredCardId: offeredCardId!,
              })}
              className="mt-3 w-full py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-lg font-semibold"
            >
              Swap Properties
            </button>
          )}
        </div>
      );
    }

    if (actionCard.action === "dealBreaker") {
      const targetPlayer = targetPlayerId ? game.players.find(p => p.id === targetPlayerId) : null;
      const completeSets = targetPlayer?.propertySets.filter(s => isSetComplete(s)) ?? [];
      return (
        <div>
          <TargetPlayerSelect
            label="Take a complete set from:"
            opponents={opponents}
            selected={targetPlayerId}
            onSelect={id => { setTargetPlayerId(id); setTargetSetId(null); }}
            onConfirm={() => {}}
            hideConfirm
            onBank={onBank}
            card={card}
          />
          {targetPlayerId && completeSets.length === 0 && (
            <p className="text-gray-500 text-sm mt-3">They have no complete sets.</p>
          )}
          {completeSets.map(set => (
            <div
              key={set.id}
              onClick={() => setTargetSetId(set.id)}
              className={`mt-2 cursor-pointer rounded-lg border ${targetSetId === set.id ? "border-yellow-400" : "border-gray-600"} p-1`}
            >
              <PropertySetView set={set} />
            </div>
          ))}
          {targetSetId && (
            <button
              onClick={() => onPlay({ targetPlayerId: targetPlayerId!, targetSetId: targetSetId! })}
              className="mt-3 w-full py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg font-semibold"
            >
              Deal Break!
            </button>
          )}
        </div>
      );
    }

    if (actionCard.action === "house" || actionCard.action === "hotel") {
      const isHotel = actionCard.action === "hotel";
      const eligibleSets = player.propertySets.filter(s => {
        if (!isSetComplete(s)) return false;
        if (isHotel) return s.hasHouse && !s.hasHotel;
        return !s.hasHouse;
      });
      return (
        <div>
          <p className="text-gray-300 text-sm mb-3">
            {isHotel ? "Add hotel to a complete set (must have house):" : "Add house to a complete set:"}
          </p>
          {eligibleSets.length === 0 && (
            <p className="text-gray-500 text-sm mb-4">No eligible sets.</p>
          )}
          {eligibleSets.map(set => (
            <div
              key={set.id}
              onClick={() => setTargetSetId(set.id)}
              className={`mt-2 cursor-pointer rounded-lg border ${targetSetId === set.id ? "border-yellow-400" : "border-gray-600"} p-1`}
            >
              <PropertySetView set={set} />
            </div>
          ))}
          {targetSetId && (
            <button
              onClick={() => onPlay({ targetSetId: targetSetId! })}
              className="mt-3 w-full py-2 bg-green-800 hover:bg-green-700 text-white rounded-lg font-semibold"
            >
              {isHotel ? "Add Hotel 🏨" : "Add House 🏠"}
            </button>
          )}
          <button onClick={onBank} className="mt-2 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold">
            Bank as ${card.value}M
          </button>
        </div>
      );
    }
  }

  // Rent card
  if (card.type === "rent") {
    const rentCard = card as RentCard;
    const mySets = player.propertySets.filter(s => rentCard.rentableColors.includes(s.color));
    return (
      <div>
        <p className="text-gray-300 text-sm mb-3">Choose which set to charge rent on:</p>
        {mySets.length === 0 && <p className="text-gray-500 text-sm mb-4">You don't own any {rentCard.rentableColors.map(getColorName).join("/")} properties.</p>}
        {mySets.map(set => (
          <div
            key={set.id}
            onClick={() => setTargetSetId(set.id)}
            className={`mt-2 cursor-pointer rounded-lg border ${targetSetId === set.id ? "border-yellow-400" : "border-gray-600"} p-1`}
          >
            <PropertySetView set={set} />
          </div>
        ))}
        {targetSetId && (
          <button
            onClick={() => onPlay({ targetSetId: targetSetId! })}
            className="mt-3 w-full py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold"
          >
            Charge Rent (all opponents)
          </button>
        )}
        <button onClick={onBank} className="mt-2 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold">
          Bank as ${card.value}M
        </button>
      </div>
    );
  }

  return null;
}

function TargetPlayerSelect({
  label, opponents, selected, onSelect, onConfirm, hideConfirm, onBank, card,
}: {
  label: string;
  opponents: Player[];
  selected: string | null;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  hideConfirm?: boolean;
  onBank: () => void;
  card: Card;
}) {
  return (
    <div>
      <p className="text-gray-300 text-sm mb-2">{label}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {opponents.map(opp => (
          <button
            key={opp.id}
            onClick={() => onSelect(opp.id)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              selected === opp.id
                ? "border-yellow-400 text-yellow-400"
                : "border-gray-600 text-gray-300 hover:border-gray-400"
            }`}
          >
            {opp.name}
          </button>
        ))}
      </div>
      {!hideConfirm && selected && (
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold">
            Play
          </button>
          <button onClick={onBank} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold">
            Bank as ${card.value}M
          </button>
        </div>
      )}
      {!hideConfirm && !selected && (
        <button onClick={onBank} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold">
          Bank as ${card.value}M
        </button>
      )}
    </div>
  );
}

function getCardDescription(card: Card): string {
  if (card.type === "money") return "Add to your bank.";
  if (card.type === "property") return "Place on your board or bank for cash.";
  if (card.type === "rent") return "Charge opponents rent on your matching properties.";
  if (card.type === "action") {
    const a = (card as ActionCard).action;
    switch (a) {
      case "passGo": return "Draw 2 extra cards.";
      case "itsMyBirthday": return "All opponents must pay you $2M.";
      case "debtCollector": return "One opponent must pay you $5M.";
      case "slyDeal": return "Steal one property from an incomplete set.";
      case "forcedDeal": return "Swap one of your properties with one of theirs.";
      case "dealBreaker": return "Steal an entire complete set!";
      case "justSayNo": return "Block an action card used against you.";
      case "rentWild": return "Charge one player rent for any of your sets.";
      case "house": return "Add a house to a complete set (+$3M rent).";
      case "hotel": return "Add a hotel to a complete set with a house (+$4M rent).";
    }
  }
  return "";
}
