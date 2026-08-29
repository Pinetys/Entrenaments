import { WeeklyPlan, TrainingSession, Drill, Player } from '../types';
import { DEFAULT_JUNIOR_PLAYERS } from './defaultPlayers';

export const RECOVERED_DRILLS_MAP: Record<string, Partial<Drill>> = {
  'drill-rueda-11': {
    id: 'drill-rueda-11',
    title: "Rueda de 11 Explosiva - Calentamiento",
    category: 'Transició',
    duration: 12
  },
  'drill-press-break': {
    id: 'drill-press-break',
    title: "Salida de Presión 1-2-1-1 y Ataque de Ventajas",
    category: 'Transició',
    duration: 15
  },
  'drill-rueda-tiro-competitiva': {
    id: 'drill-rueda-tiro-competitiva',
    title: "Rueda de Tiro Nivel A (Salida de Indirecto)",
    category: 'Tir',
    duration: 15
  },
  'drill-junior-transicion-3x2': {
    id: 'drill-junior-transicion-3x2',
    title: "3x2 Continu amb Retorn en 2x1 (Transició d’Alt Nivell)",
    category: 'Transició',
    duration: 15
  },
  'drill-spacing-junior-spacing': {
    id: 'drill-spacing-junior-spacing',
    title: "Espaiat de Joc Dinàmic (Spacing) i Reemplaçaments Extra Passe",
    category: 'Atac',
    duration: 12
  },
  'drill-defensa-shell': {
    id: 'drill-defensa-shell',
    title: "Roda de Defensa Shell 4x4 (Alineació i Ajudes de la Línia de Passe)",
    category: 'Defensa',
    duration: 15
  },
  'drill-dejan-cikic-decisions': {
    id: 'drill-dejan-cikic-decisions',
    title: "Roda de Decisions i Passades de Dejan Cikic",
    category: 'Tècnica',
    duration: 10
  },
  'drill-dejan-cikic-spacing': {
    id: 'drill-dejan-cikic-spacing',
    title: "Spacing Actiu 3x0 i Reemplaçaments de Fons d’en Dejan Cikic",
    category: 'Atac',
    duration: 12
  },
  'drill-bojan-cikic-motion': {
    id: 'drill-bojan-cikic-motion',
    title: "Tallades i Reaccions de Tall d'en Bojan Cikic (Motion)",
    category: 'Atac',
    duration: 15
  },
  'drill-bojan-cikic-trap': {
    id: 'drill-bojan-cikic-trap',
    title: "Pressió de Mans Actives i Trap Frontal d'en Bojan Cikic",
    category: 'Defensa',
    duration: 15
  }
};

export const RECOVERED_SESSIONS: Record<string, TrainingSession> = {
  dia1: {
    id: 'dia1',
    name: 'Sessió 1: Dilluns 31 d’Agost - Pretemporada & Ritme de Transició',
    dayOfWeek: 'Dilluns',
    scheduledTime: '2026-08-31T19:30',
    totalDuration: 75,
    drills: [
      { drillId: 'drill-rueda-11', duration: 15, notes: 'Activa ritme de cames ràpides i passe fort de sortida.' },
      { drillId: 'virtual-hydration', duration: 3, notes: 'Pausa d’hidratació de 90 segons.' },
      { drillId: 'drill-junior-transicion-3x2', duration: 15, notes: 'Balanç defensiu agressiu i comunicació de canvis.' },
      { drillId: 'virtual-freethrows', duration: 7, notes: 'Tirs lliures amb fatiga acumulada.' },
      { drillId: 'drill-spacing-junior-spacing', duration: 15, notes: 'Ocupació racional del perímetre de 4-oberts.' },
      { drillId: 'drill-rueda-tiro-competitiva', duration: 20, notes: 'Consumir tir exterior per equips amb ritme alt.' }
    ]
  },
  dia2: {
    id: 'dia2',
    name: 'Sessió 2: Dimecres 2 de Setembre - Defensa i Bloquejos (Pick & Roll)',
    dayOfWeek: 'Dimecres',
    scheduledTime: '2026-09-02T19:30',
    totalDuration: 60,
    drills: [
      { drillId: 'drill-rueda-11', duration: 10, notes: 'Estiramiento dinámico activo.' },
      { drillId: 'virtual-hydration', duration: 3, notes: 'Pausa tàctica per explicar directrius de partit.' },
      { drillId: 'drill-rueda-tiro-competitiva', duration: 15, notes: 'Series de 5 triples seguidos desde 5 posiciones distintas.' },
      { drillId: 'virtual-freethrows', duration: 4, notes: 'Rutina d’encert consecutiu de tirs lliures (75% mínim equip).' },
      { drillId: 'drill-press-break', duration: 15, notes: 'Salida de línea de presión rápido.' },
      { drillId: 'drill-rueda-11', duration: 13, notes: 'Rueda táctica de tiros libres finales de tensión.' }
    ]
  },
  dia3: {
    id: 'dia3',
    name: 'Sessió 3: Dijous 3 de Setembre - Transició i Joc Continu',
    dayOfWeek: 'Dijous',
    scheduledTime: '2026-09-03T19:30',
    totalDuration: 27,
    drills: [
      { drillId: 'drill-spacing-junior-spacing', duration: 12, notes: 'Espaiat de joc i passada extra ràpida.' },
      { drillId: 'drill-defensa-shell', duration: 15, notes: 'Defensa shell 4x4 i ajudes defensives.' }
    ]
  },
  dia4: {
    id: 'dia4',
    name: 'Sessió 4: Dimarts 8 de Setembre - Pick & Roll Situacions',
    dayOfWeek: 'Dimarts',
    scheduledTime: '2026-09-08T19:30',
    totalDuration: 55,
    drills: [
      { drillId: 'drill-rueda-11', duration: 10, notes: 'Calentar piernas, flexiones si se cae el balón.' },
      { drillId: 'virtual-hydration', duration: 3, notes: 'Hidratació ràpida a banquetes abans de treball de pnr.' },
      { drillId: 'virtual-freethrows', duration: 4, notes: 'Tirs de fatiga per baixar les pulsacions d’exigència.' },
      { drillId: 'drill-press-break', duration: 20, notes: 'Presionar después de canasta. Dos contra uno agresivo.' },
      { drillId: 'drill-rueda-tiro-competitiva', duration: 10, notes: 'Tiro de perimetro bajo pulsaciones altas.' },
      { drillId: 'drill-rueda-11', duration: 8, notes: 'Tancament de balanç defensiu a pista sencera.' }
    ]
  },
  dia5: {
    id: 'dia5',
    name: 'Sessió 5: Dijous 10 de Setembre - Construcció del Contraatac',
    dayOfWeek: 'Dijous',
    scheduledTime: '2026-09-10T19:30',
    totalDuration: 0,
    drills: []
  },
  dia6: {
    id: 'dia6',
    name: 'Sessió 6: Dimarts 15 de Setembre - Defensa d’Ajudes Col·lectives',
    dayOfWeek: 'Dimarts',
    scheduledTime: '2026-09-15T19:30',
    totalDuration: 0,
    drills: []
  },
  dia7: {
    id: 'dia7',
    name: 'Sessió 7: Dijous 17 de Setembre - Presió a Tot Camp',
    dayOfWeek: 'Dijous',
    scheduledTime: '2026-09-17T19:30',
    totalDuration: 0,
    drills: []
  },
  dia8: {
    id: 'dia8',
    name: 'Sessió 8: Dimarts 22 de Setembre - Roda de Tir Prepartit i Ajustos',
    dayOfWeek: 'Dimarts',
    scheduledTime: '2026-09-22T19:30',
    totalDuration: 27,
    drills: [
      { drillId: 'drill-rueda-11', duration: 12, notes: 'Roda 11 ritme de tir continu.' },
      { drillId: 'drill-press-break', duration: 15, notes: 'Sortida de pressió i transició ofensiva.' }
    ]
  },
  dia9: {
    id: 'dia9',
    name: 'Sessió 9: Dijous 24 de Setembre - Presió a Tot Camp',
    dayOfWeek: 'Dijous',
    scheduledTime: '2026-09-24T19:30',
    totalDuration: 0,
    drills: []
  },
  dia10: {
    id: 'dia10',
    name: 'Sessió 10: Dimarts 29 de Setembre - Roda de Tir Prepartit i Ajustos',
    dayOfWeek: 'Dimarts',
    scheduledTime: '2026-09-29T19:30',
    totalDuration: 0,
    drills: []
  }
};

export const RECOVERED_WEEKLY_PLAN: WeeklyPlan = {
  id: 'plan-default',
  name: 'Planificació Mensual: Pretemporada & Temporada Regular',
  startDate: '2026-08-31',
  dia1: RECOVERED_SESSIONS.dia1,
  dia2: RECOVERED_SESSIONS.dia2,
  dia3: RECOVERED_SESSIONS.dia3,
  dia4: RECOVERED_SESSIONS.dia4,
  dia5: RECOVERED_SESSIONS.dia5,
  dia6: RECOVERED_SESSIONS.dia6,
  dia7: RECOVERED_SESSIONS.dia7,
  dia8: RECOVERED_SESSIONS.dia8,
  dia9: RECOVERED_SESSIONS.dia9,
  dia10: RECOVERED_SESSIONS.dia10
};

export const RECOVERED_WEEKLY_PLANS: WeeklyPlan[] = [RECOVERED_WEEKLY_PLAN];

export function countTotalDrillsInWeeklyPlans(plans?: WeeklyPlan[]): number {
  if (!plans || !Array.isArray(plans)) return 0;
  let count = 0;
  plans.forEach(p => {
    for (let i = 1; i <= 10; i++) {
      const s = (p as any)[`dia${i}`];
      if (s && Array.isArray(s.drills)) {
        count += s.drills.length;
      }
    }
  });
  return count;
}
