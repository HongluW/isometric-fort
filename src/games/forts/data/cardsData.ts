/**
 * Card definitions loaded from JSON. Single source of truth for gameplay and UI.
 */
import type { CardDefinition, CardId } from '@/games/forts/types/cards';
import cardsJson from '@/data/cards.json';

const cardsArray = cardsJson as Array<CardDefinition & { unlockAtRound?: number }>;

const definitions: Record<CardId, CardDefinition> = {};
for (const card of cardsArray) {
  definitions[card.id] = {
    id: card.id,
    name: card.name,
    rarity: card.rarity,
    category: card.category,
    description: card.description,
    playablePhase: card.playablePhase,
    foodCost: card.foodCost,
    woodCost: card.woodCost,
    stoneCost: card.stoneCost,
    effectKey: card.effectKey,
    buildBlocks: card.buildBlocks,
    unlockAtRound: card.unlockAtRound,
  };
}

export const CARD_DEFINITIONS: Record<CardId, CardDefinition> = definitions;

/** All card definitions (read from JSON). Used by gameplay and UIs. */
export function getCardDefinitions(): Record<CardId, CardDefinition> {
  return CARD_DEFINITIONS;
}

/** Cards that become available at or before the given round (for card pick phase). */
export function getCardsUnlockedAtRound(round: number): CardDefinition[] {
  return Object.values(CARD_DEFINITIONS).filter(
    (c) => (c.unlockAtRound ?? 1) <= round
  );
}
