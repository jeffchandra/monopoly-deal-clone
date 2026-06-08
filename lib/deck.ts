import {
  Card,
  MoneyCard,
  PropertyCard,
  RentCard,
} from "../types/card";

export function createTestDeck(): Card[] {
  const cards: Card[] = [];

  // Money
  for (let i = 0; i < 10; i++) {
    cards.push({
      id: crypto.randomUUID(),
      name: `Money ${i}`,
      type: "money",
      value: 1,
    } as MoneyCard);
  }

  // Properties
  for (let i = 0; i < 5; i++) {
    cards.push({
      id: crypto.randomUUID(),
      name: `Blue Property ${i}`,
      type: "property",
      value: 4,
      colors: ["darkBlue"],
      activeColor: "darkBlue",
    } as PropertyCard);
  }

  for (let i = 0; i < 5; i++) {
    cards.push({
      id: crypto.randomUUID(),
      name: `Green Property ${i}`,
      type: "property",
      value: 4,
      colors: ["green"],
      activeColor: "green",
    } as PropertyCard);
  }

  return cards;
}

export function shuffleDeck(
  deck: Card[]
): Card[] {
  const shuffled = [...deck];

  for (
    let i = shuffled.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
}