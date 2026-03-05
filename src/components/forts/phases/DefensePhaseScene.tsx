'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useForts } from '@/context/FortsContext';
import { DEFENSE_PHASE_MAX_MS } from '@/games/forts/types/phases';

const TICK_MS = 80;

interface DefensePhaseSceneProps {
  round: number;
  onSiegeComplete: () => void;
}

export function DefensePhaseScene({ round, onSiegeComplete }: DefensePhaseSceneProps) {
  const { state, tickSiege } = useForts();
  const baseHealth = state.baseHealth ?? 500;
  const siege = state.siegeState;

  const completed = useRef(false);
  const startTime = useRef(0);
  const lastTick = useRef(0);

  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    onSiegeComplete();
  }, [onSiegeComplete]);

  useEffect(() => {
    completed.current = false;
    startTime.current = Date.now();
    lastTick.current = Date.now();
  }, [round, baseHealth]);

  useEffect(() => {
    const id = setInterval(() => {
      if (completed.current) return;

      const now = Date.now();
      const totalElapsed = now - startTime.current;
      if (totalElapsed >= DEFENSE_PHASE_MAX_MS) {
        finish();
        return;
      }

      const delta = Math.min(now - lastTick.current, 200);
      lastTick.current = now;
      tickSiege(delta);

      const updatedSiege = state.siegeState;
      if (!updatedSiege || updatedSiege.completed) {
        finish();
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [finish, tickSiege, state.siegeState]);

  const total = siege?.totalInitialUnits ?? 0;
  const remaining = siege?.remainingUnits ?? 0;
  const attackerPercent =
    total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;

  return (
    <div className="absolute inset-x-0 top-2 z-40 flex justify-center pointer-events-none">
      <div className="pointer-events-auto inline-flex items-center gap-6 rounded-md bg-slate-900/90 border border-slate-700 px-4 py-2 shadow-lg">
        {/* Attackers — percentage remaining */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <span className="text-red-400 text-xs font-semibold uppercase tracking-wide">
            Attackers
          </span>
          <div className="w-40 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-150"
              style={{ width: `${attackerPercent}%` }}
            />
          </div>
          <span className="text-white/70 text-[11px] font-mono tabular-nums">
            {attackerPercent.toFixed(0)}% remaining
          </span>
        </div>

        <div className="h-8 w-px bg-slate-700/80" />

        {/* Fort integrity — visual only */}
        <div className="flex items-center gap-3 min-w-[140px]">
          <div className="flex flex-col gap-1 w-32">
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wide">
              Fort integrity
            </span>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{
                  width: `${baseHealth > 0 && siege ? Math.max(0, (state.baseHealth ?? 0) / baseHealth * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
