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
    totalDuration: 49,
    drills: [
      { drillId: 'drill-rueda-11', duration: 12, notes: 'Saca el balón con rabia. Comunicación vocal intensa de Nivel A.' },
      { drillId: 'virtual-hydration', duration: 3, notes: 'Descans ràpid, hidratació i explicació de conceptes de Pick and Roll Drop.' },
      { drillId: 'virtual-freethrows', duration: 4, notes: '10 tirs lliures per parella en condicions de fatiga moderada.' },
      { drillId: 'drill-press-break', duration: 15, notes: 'Romper sin botar las esquinas traseras. Posesiones cortas.' },
      { drillId: 'drill-rueda-11', duration: 15, notes: 'Juego real 5v5 libre pero anotando solo canastas en transición rápida.' }
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

export const RECOVERED_SENIOR_SESSIONS: Record<string, TrainingSession> = {
  dia1: {
    id: 'dia1',
    name: 'Sessió 1: Dilluns 31 d’Agost - Pretemporada Sènior: Ritme 5v5 i Transició Ofensiva',
    dayOfWeek: 'Dilluns',
    scheduledTime: '2026-08-31T21:00',
    totalDuration: 75,
    team: 'senior',
    drills: [
      { drillId: 'drill-rueda-11', duration: 15, notes: 'Activació dinàmica, primer passe de contraatac i velocitat d’execució.' },
      { drillId: 'virtual-hydration', duration: 3, notes: 'Pausa d’hidratació i fixació d’objectius de pretemporada sènior.' },
      { drillId: 'drill-junior-transicion-3x2', duration: 15, notes: 'Generació d’avantatges en arribada i lectura de balanç defensiu.' },
      { drillId: 'virtual-freethrows', duration: 7, notes: 'Tirs lliures amb exigència de concentració sota fatiga.' },
      { drillId: 'drill-spacing-junior-spacing', duration: 15, notes: 'Ocupació d’espais 5-oberts (Drive & Kick, Extra Pass).' },
      { drillId: 'drill-rueda-tiro-competitiva', duration: 20, notes: 'Concurs de tir exterior per parelles amb ritme de partit.' }
    ]
  },
  dia2: {
    id: 'dia2',
    name: 'Sessió 2: Dimecres 2 de Setembre - Pick & Roll Ofensiu (Lectures Short Roll & Pop) i Balanç',
    dayOfWeek: 'Dimecres',
    scheduledTime: '2026-09-02T21:00',
    totalDuration: 75,
    team: 'senior',
    drills: [
      { drillId: 'drill-rueda-11', duration: 12, notes: 'Escalfament dinàmic amb finalitzacions de contacte.' },
      { drillId: 'virtual-hydration', duration: 3, notes: 'Pausa tècnica per explicar angles de bloqueig directe.' },
      { drillId: 'drill-rueda-tiro-competitiva', duration: 15, notes: 'Tir sortint de bloqueig indirecte per a tiradors.' },
      { drillId: 'virtual-freethrows', duration: 5, notes: 'Sèrie de tirs lliures 2+1.' },
      { drillId: 'drill-defensa-shell', duration: 20, notes: 'Defensa de l’1v1 del base i ajudes del costat feble.' },
      { drillId: 'drill-press-break', duration: 20, notes: 'Arribada en transició ràpida a 5v5 continu.' }
    ]
  },
  dia3: {
    id: 'dia3',
    name: 'Sessió 3: Dijous 3 de Setembre - Defensa de Pick & Roll (Drop / Next / Switch) i Rebot',
    dayOfWeek: 'Dijous',
    scheduledTime: '2026-09-03T21:00',
    totalDuration: 60,
    team: 'senior',
    drills: [
      { drillId: 'drill-rueda-11', duration: 12, notes: 'Roda de passades i entrades amb oposició.' },
      { drillId: 'virtual-hydration', duration: 3, notes: 'Instruccions de comunicació defensiva i bloqueig de rebot.' },
      { drillId: 'drill-defensa-shell', duration: 15, notes: 'Rotacions defensives i protecció del cercle (Tag & Recover).' },
      { drillId: 'virtual-freethrows', duration: 5, notes: 'Tirs lliures per parelles.' },
      { drillId: 'drill-press-break', duration: 25, notes: 'Situacions de 5v5 a mig camp i tot camp amb regles defensives.' }
    ]
  },
  dia4: {
    id: 'dia4',
    name: 'Sessió 4: Dimarts 8 de Setembre - Espaiat 5-Oberts (Spacing), Tallades i Extra Pass',
    dayOfWeek: 'Dimarts',
    scheduledTime: '2026-09-08T21:00',
    totalDuration: 60,
    team: 'senior',
    drills: [
      { drillId: 'drill-rueda-11', duration: 10, notes: 'Activació ràpida de cames i coordinació.' },
      { drillId: 'virtual-hydration', duration: 3, notes: 'Pausa d’hidratació.' },
      { drillId: 'drill-spacing-junior-spacing', duration: 17, notes: 'Lectura de talls a l’esquena (Backdoor) i reemplaçaments.' },
      { drillId: 'virtual-freethrows', duration: 5, notes: 'Tirs lliures sota pressió.' },
      { drillId: 'drill-rueda-tiro-competitiva', duration: 25, notes: 'Partidet 5v5 amb valor doble per a cistelles d’extra-pass.' }
    ]
  },
  dia5: {
    id: 'dia5',
    name: 'Sessió 5: Dijous 10 de Setembre - Sortida de Pressió i Lectura de Superioritats',
    dayOfWeek: 'Dijous',
    scheduledTime: '2026-09-10T21:00',
    totalDuration: 0,
    team: 'senior',
    drills: []
  },
  dia6: {
    id: 'dia6',
    name: 'Sessió 6: Dimarts 15 de Setembre - Situacions Especials (ATO, Fons, Bandes) i Tir',
    dayOfWeek: 'Dimarts',
    scheduledTime: '2026-09-15T21:00',
    totalDuration: 0,
    team: 'senior',
    drills: []
  },
  dia7: {
    id: 'dia7',
    name: 'Sessió 7: Dijous 17 de Setembre - Transició Defensiva i Defensa de Transició Ràpida',
    dayOfWeek: 'Dijous',
    scheduledTime: '2026-09-17T21:00',
    totalDuration: 0,
    team: 'senior',
    drills: []
  },
  dia8: {
    id: 'dia8',
    name: 'Sessió 8: Dimarts 22 de Setembre - Situacions de Clot i Desavantatge (Closeouts & Rotacions)',
    dayOfWeek: 'Dimarts',
    scheduledTime: '2026-09-22T21:00',
    totalDuration: 0,
    team: 'senior',
    drills: []
  },
  dia9: {
    id: 'dia9',
    name: 'Sessió 9: Dijous 24 de Setembre - Preparació Tàctica de Partit i Scouting',
    dayOfWeek: 'Dijous',
    scheduledTime: '2026-09-24T21:00',
    totalDuration: 0,
    team: 'senior',
    drills: []
  },
  dia10: {
    id: 'dia10',
    name: 'Sessió 10: Dimarts 29 de Setembre - Roda de Tir Prepartit, Ajustos 5v5 i Ritme',
    dayOfWeek: 'Dimarts',
    scheduledTime: '2026-09-29T21:00',
    totalDuration: 0,
    team: 'senior',
    drills: []
  }
};

export const RECOVERED_WEEKLY_PLAN: WeeklyPlan = {
  id: 'plan-default',
  name: 'Planificació Mensual: Pretemporada & Temporada Regular (Júnior A)',
  startDate: '2026-08-31',
  team: 'junior_a',
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

export const RECOVERED_SENIOR_WEEKLY_PLAN: WeeklyPlan = {
  id: 'plan-senior-default',
  name: 'Planificació Mensual: Pretemporada & Lliga Regular (Sènior)',
  startDate: '2026-08-31',
  team: 'senior',
  dia1: RECOVERED_SENIOR_SESSIONS.dia1,
  dia2: RECOVERED_SENIOR_SESSIONS.dia2,
  dia3: RECOVERED_SENIOR_SESSIONS.dia3,
  dia4: RECOVERED_SENIOR_SESSIONS.dia4,
  dia5: RECOVERED_SENIOR_SESSIONS.dia5,
  dia6: RECOVERED_SENIOR_SESSIONS.dia6,
  dia7: RECOVERED_SENIOR_SESSIONS.dia7,
  dia8: RECOVERED_SENIOR_SESSIONS.dia8,
  dia9: RECOVERED_SENIOR_SESSIONS.dia9,
  dia10: RECOVERED_SENIOR_SESSIONS.dia10
};

export const RECOVERED_WEEKLY_PLANS: WeeklyPlan[] = [
  RECOVERED_WEEKLY_PLAN,
  RECOVERED_SENIOR_WEEKLY_PLAN
];

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
