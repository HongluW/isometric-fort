'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { getCardsUnlockedAtRound } from '@/games/forts/types/cards';
import type { CardId } from '@/games/forts/types/cards';

interface CardDrawSceneProps {
  round: number;
  onAdvance: (pickedCardIds: CardId[]) => void;
}

export function CardDrawScene({ round, onAdvance }: CardDrawSceneProps) {
  const offeredCards = getCardsUnlockedAtRound(round);
  const [selectedIds, setSelectedIds] = useState<Set<CardId>>(new Set());

  const toggle = useCallback((id: CardId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAdvance = useCallback(() => {
    onAdvance(Array.from(selectedIds));
  }, [onAdvance, selectedIds]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95">
      <div className="max-w-lg mx-auto p-8 text-center space-y-6">
        <h2 className="text-2xl font-semibold text-white">Round {round}</h2>
        <p className="text-white/70 text-sm">
          Choose cards to add to your hand. Chosen cards stay available for the rest of the run.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {offeredCards.map((card) => {
            const chosen = selectedIds.has(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => toggle(card.id)}
                className={`w-28 min-h-[7rem] rounded border p-2 flex flex-col items-center justify-center text-left transition-colors ${
                  chosen
                    ? 'border-amber-400 bg-amber-500/20 text-white'
                    : 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                }`}
              >
                <span className="font-medium text-xs truncate w-full" title={card.name}>
                  {card.name}
                </span>
                <span className="text-[10px] mt-0.5 opacity-70">{card.rarity}</span>
                <span className="text-[10px] mt-1 line-clamp-2 opacity-60" title={card.description}>
                  {card.description}
                </span>
              </button>
            );
          })}
        </div>
        <Button onClick={handleAdvance} className="mt-6">
          Continue to Build Phase
        </Button>
      </div>
    </div>
  );
}
