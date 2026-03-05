import type { GameState } from '@/games/forts/types';
import { DEFENSE_PHASE_MAX_MS } from '@/games/forts/types/phases';
import {
  SiegeState,
  SiegeLaneState,
  SiegeLaneId,
  UnitGroup,
  UNIT_CLASS_DEFS,
  UnitClassId,
} from '@/games/forts/types/units';

const SIEGE_LANES: SiegeLaneId[] = ['north', 'east', 'west'];

function makeEmptyLane(id: SiegeLaneId): SiegeLaneState {
  return { id, groups: [] };
}

function cloneLane(lane: SiegeLaneState): SiegeLaneState {
  return {
    id: lane.id,
    groups: lane.groups.map((g) => ({ ...g })),
  };
}

export function createSiegeStateForRound(state: GameState): SiegeState {
  const round = state.round ?? 1;
  const defense = state.stats.defense ?? 0;

  // Simple scaling: more attack power as rounds increase, slightly offset by defense.
  const basePower = 30;
  const perRound = 10;
  const totalPower = Math.max(10, basePower + perRound * (round - 1) - Math.floor(defense * 0.3));

  const lanes: SiegeLaneState[] = SIEGE_LANES.map((id) => makeEmptyLane(id));

  // Distribute power across lanes and classes.
  let remaining = totalPower;
  let laneIndex = 0;
  const pushGroup = (laneId: SiegeLaneId, classId: UnitClassId, strength: number) => {
    const unitClass = UNIT_CLASS_DEFS[classId];
    const count = Math.max(1, Math.round(strength / unitClass.maxHealth));
    const totalHealth = count * unitClass.maxHealth;
    const group: UnitGroup = {
      classId,
      count,
      healthPerUnit: unitClass.maxHealth,
      totalHealth,
      progress: 0,
    };
    const lane = lanes.find((l) => l.id === laneId)!;
    lane.groups.push(group);
  };

  while (remaining > 0) {
    const laneId = SIEGE_LANES[laneIndex % SIEGE_LANES.length];
    laneIndex++;

    // Pick a class based on round: early = infantry/archers, later adds siege rams.
    let classId: UnitClassId = 'infantry';
    if (round >= 3 && Math.random() < 0.3) {
      classId = 'siege_ram';
    } else if (Math.random() < 0.5) {
      classId = 'archer';
    }

    const chunk = Math.min(remaining, 20 + round * 4);
    pushGroup(laneId, classId, chunk);
    remaining -= chunk;
  }

  const totalInitialUnits = lanes.reduce(
    (sum, lane) => sum + lane.groups.reduce((gSum, g) => gSum + g.count, 0),
    0
  );

  return {
    lanes,
    startedAt: Date.now(),
    completed: false,
    totalInitialUnits,
    remainingUnits: totalInitialUnits,
    initialBaseHealth: state.baseHealth ?? 500,
  };
}

export function stepSiege(state: GameState, dtMs: number): GameState {
  const siege = state.siegeState;
  if (!siege || siege.completed) return state;

  const dtSeconds = dtMs / 1000;
  const lanes = siege.lanes.map(cloneLane);
  let remainingUnits = 0;
  let baseHealth = state.baseHealth ?? 500;
  const defense = state.stats.defense ?? 0;

  const now = Date.now();
  const elapsed = now - siege.startedAt;

  for (const lane of lanes) {
    const newGroups: UnitGroup[] = [];
    for (const group of lane.groups) {
      if (group.count <= 0 || group.totalHealth <= 0) continue;

      const unitClass = UNIT_CLASS_DEFS[group.classId];

      // Advance along lane
      group.progress += unitClass.moveSpeed * dtSeconds;

      // Fort deals damage to groups that have reached the wall (progress >= 0.6)
      if (group.progress >= 0.6 && defense > 0) {
        const wallFactor = 1 + defense * 0.05;
        const damageFromFort = wallFactor * dtSeconds;
        group.totalHealth = Math.max(0, group.totalHealth - damageFromFort);
        group.count = Math.max(0, Math.round(group.totalHealth / group.healthPerUnit));
      }

      if (group.count <= 0 || group.totalHealth <= 0) {
        continue;
      }

      // Groups inside the fort (progress > 1.0) damage the base directly.
      if (group.progress > 1.0 && baseHealth > 0) {
        const dps = unitClass.dpsVersusBase * group.count;
        baseHealth = Math.max(0, baseHealth - dps * dtSeconds);
      }

      remainingUnits += group.count;
      newGroups.push(group);
    }
    lane.groups = newGroups;
  }

  const completed = remainingUnits <= 0 || elapsed >= DEFENSE_PHASE_MAX_MS;

  return {
    ...state,
    baseHealth,
    siegeState: {
      ...siege,
      lanes,
      remainingUnits,
      completed,
    },
  };
}

