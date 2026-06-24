"use client";
import { useState } from "react";
import { Game, Player } from "../types/game";
import { ActionCard, PropertyCard } from "../types/card";
import { PROPERTY_RULES } from "../data/propertyRules";
import { getRentForSet, isSetComplete } from "../lib/propertyUtils";

interface ActionCardModalProps {
  game: Game;
  card: ActionCard;
  playerId: string;
  onPlayPassGo: () => void;
  onPlayBirthday: () => void;
  onPlayDebtCollector: (targetPlayerId: string) => void;
  onPlaySlyDeal: (targetPlayerId: string, targetSetId: string, targetCardId: string) => void;
  onPlayForcedDeal: (targetPlayerId: string, targetSetId: string, targetCardId: string, offeredSetId: string, offeredCardId: string) => void;
  onPlayHouse: (setId: string) => void;
  onPlayHotel: (setId: string) => void;
  onPlayWildRent: (setId: string, targetPlayerId: string) => void;
  onBank: () => void;
  onCancel: () => void;
}

export function ActionCardModal({
  game,
  card,
  playerId,
  onPlayPassGo,
  onPlayBirthday,
  onPlayDebtCollector,
  onPlaySlyDeal,
  onPlayForcedDeal,
  onPlayWildRent,
  onPlayHouse,
  onPlayHotel,
  onBank,
  onCancel,
}: ActionCardModalProps) {
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(
    game.players.filter(p => p.id !== playerId).length === 1
      ? game.players.filter(p => p.id !== playerId)[0].id
      : null
  );
  const [targetSetId, setTargetSetId] = useState<string | null>(null);
  const [targetCardId, setTargetCardId] = useState<string | null>(null);
  const [offeredSetId, setOfferedSetId] = useState<string | null>(null);
  const [offeredCardId, setOfferedCardId] = useState<string | null>(null);
  const [wildRentSetId, setWildRentSetId] = useState<string | null>(null);
  const [wildRentTargetPlayerId, setWildRentTargetPlayerId] = useState<string | null>(null);

  const player = game.players.find(p => p.id === playerId)!;
  const opponents = game.players.filter(p => p.id !== playerId);
  const targetPlayer = targetPlayerId
    ? game.players.find(p => p.id === targetPlayerId) ?? null
    : null;

  function resetTargeting() {
    setTargetPlayerId(
      opponents.length === 1 ? opponents[0].id : null
    );
    setTargetSetId(null);
    setTargetCardId(null);
    setOfferedSetId(null);
    setOfferedCardId(null);
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{card.name}</h2>
            <p className="text-slate-400 text-xs mt-0.5">{getDescription(card)}</p>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white font-bold text-xl">✕</button>
        </div>

        {/* Pass Go */}
        {card.action === "passGo" && (
          <div className="flex gap-2">
            <button onClick={onPlayPassGo}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm">
              Draw 2 Cards
            </button>
            <button onClick={onBank}
              className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg text-sm">
              Bank ${card.value}M
            </button>
          </div>
        )}

        {/* It's My Birthday */}
        {card.action === "itsMyBirthday" && (
          <div>
            <p className="text-slate-300 text-sm mb-4">
              All opponents must pay you <span className="text-yellow-400 font-bold">$2M</span>.
            </p>
            <div className="flex gap-2">
              <button onClick={onPlayBirthday}
                className="flex-1 py-2 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-lg text-sm">
                🎂 Celebrate!
              </button>
              <button onClick={onBank}
                className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg text-sm">
                Bank ${card.value}M
              </button>
            </div>
          </div>
        )}

        {/* Debt Collector */}
        {card.action === "debtCollector" && (
          <div>
            <p className="text-slate-300 text-sm mb-3">
              Choose who pays you <span className="text-yellow-400 font-bold">$5M</span>:
            </p>
            <OpponentSelector
              opponents={opponents}
              selected={targetPlayerId}
              onSelect={id => setTargetPlayerId(id)}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => targetPlayerId && onPlayDebtCollector(targetPlayerId)}
                disabled={!targetPlayerId}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm"
              >
                Collect $5M
              </button>
              <button onClick={onBank}
                className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg text-sm">
                Bank ${card.value}M
              </button>
            </div>
          </div>
        )}

        {/* Sly Deal */}
        {card.action === "slyDeal" && (
          <div>
            <p className="text-slate-300 text-sm mb-3">
              Steal one property from an incomplete set:
            </p>
            <OpponentSelector
              opponents={opponents}
              selected={targetPlayerId}
              onSelect={id => {
                setTargetPlayerId(id);
                setTargetSetId(null);
                setTargetCardId(null);
              }}
            />
            {targetPlayer && (
              <div className="mt-3">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
                  {targetPlayer.name}'s incomplete sets
                </div>
                {targetPlayer.propertySets.filter(s => !isSetComplete(s)).length === 0 ? (
                  <p className="text-xs text-slate-500">No stealable properties.</p>
                ) : (
                  targetPlayer.propertySets
                    .filter(s => !isSetComplete(s))
                    .map(set => {
                      const rule = PROPERTY_RULES[set.color];
                      return (
                        <div key={set.id} className="mb-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rule.color }} />
                            <span>{rule.displayName} ({set.properties.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {set.properties.map(prop => (
                              <div
                                key={prop.id}
                                onClick={() => { setTargetSetId(set.id); setTargetCardId(prop.id); }}
                                className={`text-xs border rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                                  targetCardId === prop.id
                                    ? "bg-red-700 border-red-400 text-white"
                                    : "bg-slate-700 border-slate-500 text-slate-300 hover:border-red-500"
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rule.color }} />
                                  <span className="font-semibold">{prop.name}</span>
                                </div>
                                <div className="text-slate-400">${prop.value}M</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => targetPlayerId && targetSetId && targetCardId &&
                  onPlaySlyDeal(targetPlayerId, targetSetId, targetCardId)}
                disabled={!targetCardId}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm"
              >
                Steal Property
              </button>
              <button onClick={onBank}
                className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg text-sm">
                Bank ${card.value}M
              </button>
            </div>
          </div>
        )}

        {/* Forced Deal */}
        {card.action === "forcedDeal" && (
          <div>
            <p className="text-slate-300 text-sm mb-3">
              Swap one of your properties with one of theirs:
            </p>
            <OpponentSelector
              opponents={opponents}
              selected={targetPlayerId}
              onSelect={id => {
                setTargetPlayerId(id);
                setTargetSetId(null);
                setTargetCardId(null);
              }}
            />

            {targetPlayer && (
              <>
                {/* Their property */}
                <div className="mt-3">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
                    Their property (you want):
                  </div>
                  {targetPlayer.propertySets.filter(s => !isSetComplete(s)).length === 0 ? (
                    <p className="text-xs text-slate-500">No stealable properties.</p>
                  ) : (
                    targetPlayer.propertySets
                      .filter(s => !isSetComplete(s))
                      .map(set => {
                        const rule = PROPERTY_RULES[set.color];
                        return (
                          <div key={set.id} className="mb-2">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rule.color }} />
                              <span>{rule.displayName} ({set.properties.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {set.properties.map(prop => (
                                <div
                                  key={prop.id}
                                  onClick={() => { setTargetSetId(set.id); setTargetCardId(prop.id); }}
                                  className={`text-xs border rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                                    targetCardId === prop.id
                                      ? "bg-red-700 border-red-400 text-white"
                                      : "bg-slate-700 border-slate-500 text-slate-300 hover:border-red-500"
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rule.color }} />
                                    <span className="font-semibold">{prop.name}</span>
                                  </div>
                                  <div className="text-slate-400">${prop.value}M</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Your property */}
                <div className="mt-3">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
                    Your property (you give):
                  </div>
                  {player.propertySets.filter(s => !isSetComplete(s)).length === 0 ? (
                    <p className="text-xs text-slate-500">No properties to offer.</p>
                  ) : (
                    player.propertySets
                      .filter(s => !isSetComplete(s))
                      .map(set => {
                        const rule = PROPERTY_RULES[set.color];
                        return (
                          <div key={set.id} className="mb-2">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rule.color }} />
                              <span>{rule.displayName} ({set.properties.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {set.properties.map(prop => (
                                <div
                                  key={prop.id}
                                  onClick={() => { setOfferedSetId(set.id); setOfferedCardId(prop.id); }}
                                  className={`text-xs border rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                                    offeredCardId === prop.id
                                      ? "bg-orange-700 border-orange-400 text-white"
                                      : "bg-slate-700 border-slate-500 text-slate-300 hover:border-orange-500"
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rule.color }} />
                                    <span className="font-semibold">{prop.name}</span>
                                  </div>
                                  <div className="text-slate-400">${prop.value}M</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => targetPlayerId && targetSetId && targetCardId && offeredSetId && offeredCardId &&
                  onPlayForcedDeal(targetPlayerId, targetSetId, targetCardId, offeredSetId, offeredCardId)}
                disabled={!targetCardId || !offeredCardId}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm"
              >
                Swap Properties
              </button>
              <button onClick={onBank}
                className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg text-sm">
                Bank ${card.value}M
              </button>
            </div>
          </div>
        )}

        {/* House */}
        {card.action === "house" && (
          <div>
            <p className="text-slate-300 text-sm mb-3">
              Add a house to a complete set <span className="text-slate-400">(not railroads or utilities)</span>:
            </p>
            {player.propertySets.filter(s =>
              isSetComplete(s) &&
              !s.hasHouse &&
              s.color !== "railroad" &&
              s.color !== "utility"
            ).length === 0 ? (
              <p className="text-xs text-slate-500 mb-4">No eligible sets.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {player.propertySets
                  .filter(s =>
                    isSetComplete(s) &&
                    !s.hasHouse &&
                    s.color !== "railroad" &&
                    s.color !== "utility"
                  )
                  .map(set => {
                    const rule = PROPERTY_RULES[set.color];
                    return (
                      <div
                        key={set.id}
                        onClick={() => setTargetSetId(set.id === targetSetId ? null : set.id)}
                        className={`text-xs border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                          targetSetId === set.id
                            ? "border-emerald-400 bg-emerald-900/30"
                            : "border-slate-500 bg-slate-700 hover:border-emerald-500"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rule.color }} />
                          <span>{rule.displayName}</span>
                          <span className="text-slate-400 font-normal">✓</span>
                        </div>
                        <div className="text-slate-400">
                          Current rent: ${getRentForSet(set)}M → with house: ${getRentForSet(set) + 3}M
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => targetSetId && onPlayHouse(targetSetId)}
                disabled={!targetSetId}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm"
              >
                🏠 Add House
              </button>
              <button onClick={onBank}
                className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg text-sm">
                Bank ${card.value}M
              </button>
            </div>
          </div>
        )}

        {/* Hotel */}
        {card.action === "hotel" && (
          <div>
            <p className="text-slate-300 text-sm mb-3">
              Add a hotel to a complete set with a house <span className="text-slate-400">(not railroads or utilities)</span>:
            </p>
            {player.propertySets.filter(s =>
              isSetComplete(s) &&
              s.hasHouse &&
              !s.hasHotel &&
              s.color !== "railroad" &&
              s.color !== "utility"
            ).length === 0 ? (
              <p className="text-xs text-slate-500 mb-4">No eligible sets — need a complete set with a house first.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {player.propertySets
                  .filter(s =>
                    isSetComplete(s) &&
                    s.hasHouse &&
                    !s.hasHotel &&
                    s.color !== "railroad" &&
                    s.color !== "utility"
                  )
                  .map(set => {
                    const rule = PROPERTY_RULES[set.color];
                    return (
                      <div
                        key={set.id}
                        onClick={() => setTargetSetId(set.id === targetSetId ? null : set.id)}
                        className={`text-xs border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                          targetSetId === set.id
                            ? "border-yellow-400 bg-yellow-900/30"
                            : "border-slate-500 bg-slate-700 hover:border-yellow-500"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rule.color }} />
                          <span>{rule.displayName}</span>
                          <span className="text-slate-400 font-normal">🏠✓</span>
                        </div>
                        <div className="text-slate-400">
                          Current rent: ${getRentForSet(set)}M → with hotel: ${getRentForSet(set) + 4}M
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => targetSetId && onPlayHotel(targetSetId)}
                disabled={!targetSetId}
                className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm"
              >
                🏨 Add Hotel
              </button>
              <button onClick={onBank}
                className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg text-sm">
                Bank ${card.value}M
              </button>
            </div>
          </div>
        )}

        {/* Double Rent */}
        {card.action === "doubleRent" && (
          <div>
            <p className="text-slate-300 text-sm mb-4">
              Play alongside a rent card to double the amount charged.
              Select a rent card first, then use the "Double Rent?" toggle.
            </p>
            <button
              onClick={onBank}
              className="w-full py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg text-sm"
            >
              Bank ${card.value}M
            </button>
          </div>
        )}

        {/* Wild Rent */}
        {card.action === "rentWild" && (
          <div>
            <p className="text-slate-300 text-sm mb-3">
              Choose one of your sets and one opponent to charge:
            </p>

            {/* Set selector */}
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
              Your set to charge rent on:
            </div>
            {player.propertySets.length === 0 ? (
              <p className="text-xs text-slate-500 mb-4">You have no properties.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {player.propertySets.map(set => {
                  const rule = PROPERTY_RULES[set.color];
                  return (
                    <div
                      key={set.id}
                      onClick={() => setWildRentSetId(set.id === wildRentSetId ? null : set.id)}
                      className={`text-xs border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                        wildRentSetId === set.id
                          ? "border-red-400 bg-red-900/30"
                          : "border-slate-500 bg-slate-700 hover:border-red-500"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rule.color }} />
                        <span>{rule.displayName}</span>
                        <span className="text-slate-400 font-normal">({set.properties.length})</span>
                        {wildRentSetId === set.id && (
                          <span className="text-red-300 ml-1">
                            ${getRentForSet(set)}M rent
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Opponent selector */}
            {opponents.length > 1 && (
              <>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
                  Who to charge:
                </div>
                <OpponentSelector
                  opponents={opponents}
                  selected={wildRentTargetPlayerId}
                  onSelect={setWildRentTargetPlayerId}
                />
              </>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  if (!wildRentSetId) return;
                  const target = wildRentTargetPlayerId ?? (opponents.length === 1 ? opponents[0].id : null);
                  if (!target) return;
                  onPlayWildRent(wildRentSetId, target);
                }}
                disabled={!wildRentSetId || !wildRentTargetPlayerId}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm"
              >
                💸 Charge Rent
              </button>
              <button
                onClick={onBank}
                className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg text-sm"
              >
                Bank ${card.value}M
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function OpponentSelector({
  opponents,
  selected,
  onSelect,
}: {
  opponents: Player[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (opponents.length === 1) return null;
  return (
    <div className="flex gap-2 flex-wrap">
      {opponents.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
            selected === p.id
              ? "bg-emerald-700 border-emerald-400 text-white"
              : "bg-slate-700 border-slate-500 text-slate-300 hover:border-slate-300"
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

function getDescription(card: ActionCard): string {
  switch (card.action) {
    case "passGo": return "Draw 2 extra cards from the deck.";
    case "itsMyBirthday": return "All opponents pay you $2M.";
    case "debtCollector": return "One opponent pays you $5M.";
    case "slyDeal": return "Steal one property from an incomplete set.";
    case "forcedDeal": return "Swap one of your properties with one of theirs.";
    case "house": return "Add a house to a complete set (+$3M rent).";
    case "hotel": return "Add a hotel to a complete set with a house (+$4M rent).";
    case "doubleRent": return "Play with a rent card to double the rent charged.";
    case "rentWild": return "Charge one opponent rent for any of your property sets.";
    default: return "";
  }
}