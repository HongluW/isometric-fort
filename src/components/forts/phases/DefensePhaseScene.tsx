'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useForts } from '@/context/FortsContext';
import { DEFENSE_PHASE_MAX_MS } from '@/games/forts/types/phases';

const TICK_MS = 80;
const SPEED_UP_THRESHOLD_MS = 2.5 * 60 * 1000; // 2.5 min — then speed up if units remain
const MAX_SPEED_MULTIPLIER = 4;

interface DefensePhaseSceneProps {
  round: number;
  onSiegeComplete: () => void;
}

export function DefensePhaseScene({ round, onSiegeComplete }: DefensePhaseSceneProps) {
  const { state } = useForts();
  const defense = state.stats?.defense ?? 0;
  const baseHealth = state.baseHealth ?? 500;

  const [attackers, setAttackers] = useState(0);
  const [fortHealth, setFortHealth] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [speedMult, setSpeedMult] = useState(1);

  const completed = useRef(false);
  const startTime = useRef(0);
  const lastTick = useRef(0);
  const attackersRef = useRef(0);
  const fortHealthRef = useRef(0);
  const speedMultRef = useRef(1);
  const initialAttackersRef = useRef(0);

  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    onSiegeComplete();
  }, [onSiegeComplete]);

  useEffect(() => {
    const initialAttackers = Math.max(8, 10 + round * 6);
    initialAttackersRef.current = initialAttackers;
    setAttackers(initialAttackers);
    setFortHealth(baseHealth);
    setElapsedMs(0);
    setSpeedMult(1);
    completed.current = false;
    startTime.current = Date.now();
    lastTick.current = Date.now();
    attackersRef.current = initialAttackers;
    fortHealthRef.current = baseHealth;
    speedMultRef.current = 1;
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

      let currentAttackers = attackersRef.current;
      let currentFort = fortHealthRef.current;
      const mult = speedMultRef.current;
      const delta = Math.min(now - lastTick.current, 200) / 1000;
      lastTick.current = now;

      setElapsedMs(totalElapsed);

      const damageFromFort = defense * 0.12 * mult * delta;
      currentAttackers = Math.max(0, currentAttackers - damageFromFort);
      const damageFromAttackers = currentAttackers * 0.05 * delta;
      currentFort = Math.max(0, currentFort - damageFromAttackers);

      attackersRef.current = currentAttackers;
      fortHealthRef.current = currentFort;
      setAttackers(currentAttackers);
      setFortHealth(currentFort);

      if (currentAttackers <= 0) {
        finish();
        return;
      }

      if (totalElapsed >= SPEED_UP_THRESHOLD_MS && mult < MAX_SPEED_MULTIPLIER) {
        const next = Math.min(MAX_SPEED_MULTIPLIER, mult + 0.25);
        speedMultRef.current = next;
        setSpeedMult(next);
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [defense, finish]);

  const attackerPercent =
    initialAttackersRef.current > 0
      ? Math.max(0, Math.min(100, (attackers / initialAttackersRef.current) * 100))
      : 0;

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
                  width: `${baseHealth > 0 ? Math.max(0, (fortHealth / baseHealth) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
