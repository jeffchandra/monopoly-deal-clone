import { Card, MoneyCard, PropertyCard, RentCard, ActionCard, PropertyColor } from "../types/card";

function uid(): string {
  return crypto.randomUUID();
}

function money(value: number): MoneyCard {
  return { id: uid(), name: `$${value}M`, type: "money", value };
}

function property(
  name: string,
  value: number,
  colors: PropertyColor[],
  activeColor: PropertyColor
): PropertyCard {
  return { id: uid(), name, type: "property", value, colors, activeColor };
}

function rent(colors: PropertyColor[], value: number = 1): RentCard {
  return {
    id: uid(),
    name: `Rent: ${colors.join("/")}`,
    type: "rent",
    value,
    rentableColors: colors,
  };
}

function action(
  name: string,
  value: number,
  actionType: ActionCard["action"]
): ActionCard {
  return { id: uid(), name, type: "action", value, action: actionType };
}

export function createFullDeck(): Card[] {
  const cards: Card[] = [
    // ── Money ──────────────────────────────────────────────────────────────
    money(10), money(10),
    money(5), money(5), money(5),
    money(4), money(4), money(4),
    money(3), money(3), money(3),
    money(2), money(2), money(2), money(2), money(2), money(2),
    money(1), money(1), money(1), money(1), money(1), money(1),

    // ── Brown (Mediterranean, Baltic) ──────────────────────────────────────
    property("Mediterranean Ave", 1, ["brown"], "brown"),
    property("Baltic Ave", 1, ["brown"], "brown"),

    // ── Light Blue (Oriental, Vermont, Connecticut) ───────────────────────
    property("Oriental Ave", 1, ["lightBlue"], "lightBlue"),
    property("Vermont Ave", 1, ["lightBlue"], "lightBlue"),
    property("Connecticut Ave", 1, ["lightBlue"], "lightBlue"),

    // ── Pink (St. Charles, States, Virginia) ───────────────────────────────
    property("St. Charles Place", 2, ["pink"], "pink"),
    property("States Ave", 2, ["pink"], "pink"),
    property("Virginia Ave", 2, ["pink"], "pink"),

    // ── Orange (St. James, Tennessee, New York) ────────────────────────────
    property("St. James Place", 2, ["orange"], "orange"),
    property("Tennessee Ave", 2, ["orange"], "orange"),
    property("New York Ave", 2, ["orange"], "orange"),

    // ── Red (Kentucky, Indiana, Illinois) ─────────────────────────────────
    property("Kentucky Ave", 3, ["red"], "red"),
    property("Indiana Ave", 3, ["red"], "red"),
    property("Illinois Ave", 3, ["red"], "red"),

    // ── Yellow (Atlantic, Ventnor, Marvin Gardens) ─────────────────────────
    property("Atlantic Ave", 3, ["yellow"], "yellow"),
    property("Ventnor Ave", 3, ["yellow"], "yellow"),
    property("Marvin Gardens", 3, ["yellow"], "yellow"),

    // ── Green (Pacific, North Carolina, Pennsylvania) ──────────────────────
    property("Pacific Ave", 4, ["green"], "green"),
    property("North Carolina Ave", 4, ["green"], "green"),
    property("Pennsylvania Ave", 4, ["green"], "green"),

    // ── Dark Blue (Park Place, Boardwalk) ──────────────────────────────────
    property("Park Place", 4, ["darkBlue"], "darkBlue"),
    property("Boardwalk", 4, ["darkBlue"], "darkBlue"),

    // ── Railroads ─────────────────────────────────────────────────────────
    property("Reading Railroad", 2, ["railroad"], "railroad"),
    property("Pennsylvania Railroad", 2, ["railroad"], "railroad"),
    property("B&O Railroad", 2, ["railroad"], "railroad"),
    property("Short Line Railroad", 2, ["railroad"], "railroad"),

    // ── Utilities ─────────────────────────────────────────────────────────
    property("Electric Company", 2, ["utility"], "utility"),
    property("Water Works", 2, ["utility"], "utility"),

    // ── Wild Properties ────────────────────────────────────────────────────
    property("Wild: Railroad/Utility", 4, ["railroad", "utility"], "railroad"),
    property("Wild: Light Blue/Brown", 1, ["lightBlue", "brown"], "lightBlue"),
    property("Wild: Green/Dark Blue", 4, ["green", "darkBlue"], "green"),
    property("Wild: Pink/Orange", 2, ["pink", "orange"], "pink"),
    property("Wild: Pink/Orange", 2, ["pink", "orange"], "pink"),
    property("Wild: Red/Yellow", 3, ["red", "yellow"], "red"),
    property("Wild: Red/Yellow", 3, ["red", "yellow"], "red"),
    property("All Colors Wild", 3, [
      "brown","lightBlue","pink","orange","red","yellow","green","darkBlue","railroad","utility"
    ], "green"),
    property("All Colors Wild", 3, [
      "brown","lightBlue","pink","orange","red","yellow","green","darkBlue","railroad","utility"
    ], "green"),

    // ── Rent Cards ─────────────────────────────────────────────────────────
    rent(["brown", "lightBlue"]),
    rent(["brown", "lightBlue"]),
    rent(["pink", "orange"]),
    rent(["pink", "orange"]),
    rent(["red", "yellow"]),
    rent(["red", "yellow"]),
    rent(["green", "darkBlue"]),
    rent(["green", "darkBlue"]),
    rent(["railroad", "utility"]),
    rent(["railroad", "utility"]),
    // Wild rents (charge any player any amount — simplified as single color)
    action("Wild Rent", 3, "rentWild"),
    action("Wild Rent", 3, "rentWild"),
    action("Wild Rent", 3, "rentWild"),

    // ── Action Cards ───────────────────────────────────────────────────────
    action("Pass Go", 1, "passGo"),
    action("Pass Go", 1, "passGo"),
    action("Pass Go", 1, "passGo"),
    action("Pass Go", 1, "passGo"),
    action("Pass Go", 1, "passGo"),
    action("Pass Go", 1, "passGo"),
    action("Pass Go", 1, "passGo"),
    action("Pass Go", 1, "passGo"),
    action("Pass Go", 1, "passGo"),
    action("Pass Go", 1, "passGo"),

    action("Sly Deal", 3, "slyDeal"),
    action("Sly Deal", 3, "slyDeal"),
    action("Sly Deal", 3, "slyDeal"),

    action("Forced Deal", 3, "forcedDeal"),
    action("Forced Deal", 3, "forcedDeal"),
    action("Forced Deal", 3, "forcedDeal"),

    action("Debt Collector", 3, "debtCollector"),
    action("Debt Collector", 3, "debtCollector"),
    action("Debt Collector", 3, "debtCollector"),

    action("It's My Birthday!", 2, "itsMyBirthday"),
    action("It's My Birthday!", 2, "itsMyBirthday"),
    action("It's My Birthday!", 2, "itsMyBirthday"),

    action("Deal Breaker", 5, "dealBreaker"),
    action("Deal Breaker", 5, "dealBreaker"),

    action("Just Say No", 4, "justSayNo"),
    action("Just Say No", 4, "justSayNo"),
    action("Just Say No", 4, "justSayNo"),

    action("House", 3, "house"),
    action("House", 3, "house"),
    action("House", 3, "house"),

    action("Hotel", 4, "hotel"),
    action("Hotel", 4, "hotel"),
    action("Hotel", 4, "hotel"),
  ];

  return cards;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
