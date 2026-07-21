export type DrillCategory = string;

export interface BoardPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  type: 'solid' | 'dashed' | 'dotted' | 'zigzag';
}

export interface BoardPin {
  id: string;
  label: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  type: 'attacker' | 'defender' | 'ball' | 'cone' | 'coach';
  anchoredTo?: string;
}

export interface BoardState {
  paths: BoardPath[];
  pins: BoardPin[];
  courtType?: 'half' | 'full';
}

export interface Drill {
  id: string;
  title: string;
  category: DrillCategory;
  concept?: string; // Special focus or tactical concept (e.g. Pick and roll, bloqueo indirecto, defensa zonal)
  duration: number; // in minutes
  objectives: string[];
  description: string;
  setupInstructions: string;
  playersNeeded: number;
  materials: string[];
  boardState: BoardState;
  boardStates?: BoardState[]; // Multi-graphics for complex exercises
  isCustom?: boolean;
  isOver15?: boolean; // For drills recommended for > 15 years old
}

export interface TrainingSession {
  id: string;
  name: string; // e.g. "Día 1: Martes - Ritmo y Transición"
  dayOfWeek: string; // e.g. "Martes"
  totalDuration: number; // should aim for 75
  drills: {
    drillId: string;
    duration: number; // can override drill default duration
    notes?: string;
  }[];
  scheduledTime?: string; // ISO string or YYYY-MM-DDTHH:MM
}

export interface WeeklyPlan {
  id: string;
  name: string;
  startDate: string; // "YYYY-MM-DD" or similar
  dia1: TrainingSession;
  dia2: TrainingSession;
  dia3?: TrainingSession;
  dia4?: TrainingSession;
  dia5?: TrainingSession;
  dia6?: TrainingSession;
  dia7?: TrainingSession;
  dia8?: TrainingSession;
}

export interface AppState {
  drills: Drill[];
  weeklyPlans: WeeklyPlan[];
  selectedWeeklyPlanId: string;
  selectedSessionId: string;
  activeView: string;
}

export interface SessionCompletion {
  id: string;
  planId: string;
  sessionId: string;
  completedAt: string;
}
