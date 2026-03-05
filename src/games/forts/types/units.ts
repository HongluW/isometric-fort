/**
 * Offensive unit and siege lane types for IsoForts.
 * Units are simulated in aggregate groups per lane during the defense phase.
 */

// Unit classes that can appear in siege waves
export type UnitClassId = 'infantry' | 'siege_ram' | 'archer';

export interface UnitClass {
  id: UnitClassId;
  name: string;
  /** Hit points per unit */
  maxHealth: number;
  /** Tiles per second of advance toward the fort along a lane (abstracted) */
  moveSpeed: number;
  /** Damage per second each unit can inflict on walls / outer defenses */
  dpsVersusWalls: number;
  /** Damage per second each unit can inflict on the fort base once inside */
  dpsVersusBase: number;
}

export const UNIT_CLASS_DEFS: Record<UnitClassId, UnitClass> = {
  infantry: {
    id: 'infantry',
    name: 'Infantry',
    maxHealth: 40,
    moveSpeed: 0.10,
    dpsVersusWalls: 0.4,
    dpsVersusBase: 0.8,
  },
  siege_ram: {
    id: 'siege_ram',
    name: 'Siege Ram',
    maxHealth: 120,
    moveSpeed: 0.06,
    dpsVersusWalls: 2.2,
    dpsVersusBase: 0.9,
  },
  archer: {
    id: 'archer',
    name: 'Archers',
    maxHealth: 30,
    moveSpeed: 0.11,
    dpsVersusWalls: 0.3,
    dpsVersusBase: 1.1,
  },
};

// Abstract approach directions. Later these can map to actual map edges.
export type SiegeLaneId = 'north' | 'east' | 'south' | 'west';

/** One aggregate bucket of units of the same class travelling along a lane. */
export interface UnitGroup {
  classId: UnitClassId;
  /** Approximate number of units still alive in this group. */
  count: number;
  /** Health per unit at full strength. */
  healthPerUnit: number;
  /** Total health for this group (count * healthPerUnit after damage). */
  totalHealth: number;
  /**
   * Progress along the lane:
   * 0   = just entering the map
   * 0.6 = reaching outer walls
   * 1.0 = at fort
   * >1  = inside fort doing direct damage
   */
  progress: number;
}

export interface SiegeLaneState {
  id: SiegeLaneId;
  groups: UnitGroup[];
}

/** Aggregate siege state for the current defense phase. */
export interface SiegeState {
  lanes: SiegeLaneState[];
  /** Timestamp (ms) when the siege started. */
  startedAt: number;
  /** True once all groups are gone or the siege timer has expired. */
  completed: boolean;
  /** Total units at siege start, for UI percentages. */
  totalInitialUnits: number;
  /** Units still alive across all lanes. */
  remainingUnits: number;
  /** Base health at siege start, for integrity percentages. */
  initialBaseHealth: number;
}

