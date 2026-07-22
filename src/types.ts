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
  type: 'attacker' | 'defender' | 'ball' | 'cone' | 'coach' | 'handoff';
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

export interface QuarterNotes {
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
  ot?: string;
}

export interface MatchAnnotation {
  id: string;
  dateIndex: number; // 0..27 (day index in 28-day microcycle grid)
  matchDate?: string; // e.g. "Setmana 1 - Dissabte"
  opponent?: string; // e.g. "CB Manresa"
  isHome?: boolean; // true = Local, false = Visitant
  ourScore?: string | number;
  opponentScore?: string | number;
  quarterNotes?: QuarterNotes;
  generalNotes?: string;
  tacticalKeyPoints?: string[];
  tags?: string[];
  updatedAt?: string;
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
  matchAnnotations?: Record<string, MatchAnnotation>; // key is dateIndex string (e.g. "5", "6", etc.)
}

export interface Player {
  id: string;
  number: number;
  name: string;
  position: 'Base' | 'Escorta' | 'Ala' | 'Ala-Pivot' | 'Pivot';
  role?: 'Quintet Inicial' | 'Rotació Principal' | 'Especialista' | 'Júnior Desenvolupament';
  height?: string;
  averageMinutes?: number;
  ratings?: {
    shooting?: number; // 1-10
    defense?: number; // 1-10
    tacticalIQ?: number; // 1-10
    physical?: number; // 1-10
    leadership?: number; // 1-10
  };
  strengths?: string[];
  areasToImprove?: string[];
  notes?: string;
  statsSummary?: {
    ppg?: number;
    rpg?: number;
    apg?: number;
    threePointPct?: number;
  };
  updatedAt?: string;
}

export interface AppState {
  drills: Drill[];
  weeklyPlans: WeeklyPlan[];
  selectedWeeklyPlanId: string;
  selectedSessionId: string;
  activeView: string;
  players?: Player[];
}

export interface SessionCompletion {
  id: string;
  planId: string;
  sessionId: string;
  completedAt: string;
}

export interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  category: string; // 'Atac' | 'Defensa' | 'Transició' | 'Físico' | 'Combinat'
  totalDuration: number;
  drills: {
    drillId: string;
    duration: number;
    notes?: string;
  }[];
  isCustom?: boolean;
  createdAt?: string;
}
