/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  BookOpen, 
  Smartphone, 
  Share2, 
  Sparkles, 
  Dribbble, 
  Clock, 
  Info, 
  X, 
  QrCode,
  Download,
  Upload,
  Check,
  RefreshCw,
  Cloud,
  Database,
  Camera,
  User,
  NotebookPen,
  Users,
  Save
} from 'lucide-react';
import coachPinetyLogo from './assets/images/coach_pinety_logo_1785329115241.jpg';
import { Drill, TrainingSession, AppState, WeeklyPlan, SessionCompletion, SessionTemplate, MatchAnnotation, Player } from './types';
import { DEFAULT_SESSION_TEMPLATES } from './data/defaultTemplates';
import { DEFAULT_JUNIOR_PLAYERS } from './data/defaultPlayers';
import SessionPlanner from './components/SessionPlanner';
import DrillDatabase, { PRE_POPULATED_DRILLS } from './components/DrillDatabase';
import DrillCreator from './components/DrillCreator';
import MobileCourtView from './components/MobileCourtView';
import DrillManualBooklet from './components/DrillManualBooklet';
import CoachProfileModal from './components/CoachProfileModal';
import MatchAnnotationsModal from './components/MatchAnnotationsModal';
import PlayerRosterModal, { DEFAULT_BAREMOS, BaremoItem } from './components/PlayerRosterModal';
import { generateSyncCode, saveToCloud, loadFromCloud, subscribeToCloud, CoachProfile, DEFAULT_SYNC_CODE } from './lib/firebase';

const LOCAL_STORAGE_KEY = 'basket_planner_junior_a_state';

const DEFAULT_COACH_PROFILE: CoachProfile = {
  name: "David Pino",
  email: "dpinogay@gmail.com",
  team: "Junior Masculí • Nivell A (FCBQ)",
  level: "Júnior A • FCBQ",
  avatar: "/src/assets/images/coach_avatar_profile_1782414908020.jpg"
};

export const CALENDAR_SESSION_METADATA: Record<string, { label: string; dateStr: string; dayOfWeek: string; defaultTitle: string }> = {
  dia1: { label: 'S1', dateStr: 'Dilluns 31 d’Agost', dayOfWeek: 'Dilluns', defaultTitle: 'Pretemporada & Ritme' },
  dia2: { label: 'S2', dateStr: 'Dimecres 2 de Setembre', dayOfWeek: 'Dimecres', defaultTitle: 'Fonaments i Intensitat Defensiva' },
  dia3: { label: 'S3', dateStr: 'Dijous 3 de Setembre', dayOfWeek: 'Dijous', defaultTitle: 'Ritme de Transició i Tir' },
  dia4: { label: 'S4', dateStr: 'Dimarts 8 de Setembre', dayOfWeek: 'Dimarts', defaultTitle: 'Defensa de l’1v1 i Ajudes' },
  dia5: { label: 'S5', dateStr: 'Dijous 10 de Setembre', dayOfWeek: 'Dijous', defaultTitle: 'Transició i Joc Continu' },
  dia6: { label: 'S6', dateStr: 'Dimarts 15 de Setembre', dayOfWeek: 'Dimarts', defaultTitle: 'Pick & Roll Situacions' },
  dia7: { label: 'S7', dateStr: 'Dijous 17 de Setembre', dayOfWeek: 'Dijous', defaultTitle: 'Construcció del Contraatac' },
  dia8: { label: 'S8', dateStr: 'Dimarts 22 de Setembre', dayOfWeek: 'Dimarts', defaultTitle: 'Defensa d’Ajudes Col·lectives' },
  dia9: { label: 'S9', dateStr: 'Dijous 24 de Setembre', dayOfWeek: 'Dijous', defaultTitle: 'Presió a Tot Camp' },
  dia10: { label: 'S10', dateStr: 'Dimarts 29 de Setembre', dayOfWeek: 'Dimarts', defaultTitle: 'Roda de Tir Prepartit i Ajustos' },
};

export const DEFAULT_SESSIONS: Record<string, TrainingSession> = {
  dia1: { 
    id: 'dia1', 
    name: 'Sessió 1: Dilluns 31 d’Agost - Pretemporada & Ritme', 
    dayOfWeek: 'Dilluns', 
    totalDuration: 75, 
    drills: [
      { drillId: 'drill-rueda-11', duration: 15, notes: "Activa ritme de cames ràpides i passe fort de sortida." },
      { drillId: 'virtual-hydration', duration: 3 },
      { drillId: 'drill-junior-transicion-3x2', duration: 15, notes: "Balanç defensiu agressiu i comunicació de canvis." },
      { drillId: 'virtual-freethrows', duration: 7 },
      { drillId: 'drill-spacing-junior-spacing', duration: 15, notes: "Ocupació racional del perímetre de 4-oberts." },
      { drillId: 'drill-rueda-tiro-competitiva', duration: 20, notes: "Consumir tir exterior per equips amb ritme alt." }
    ] 
  },
  dia2: { 
    id: 'dia2', 
    name: 'Sessió 2: Dimecres 2 de Setembre - Fonaments i Intensitat Defensiva', 
    dayOfWeek: 'Dimecres', 
    totalDuration: 75, 
    drills: [
      { drillId: 'drill-defensa-shell', duration: 20, notes: "Control d'ajuda i recuperació de línies de passe." },
      { drillId: 'virtual-hydration', duration: 2 },
      { drillId: 'drill-bojan-cikic-trap', duration: 18, notes: "Presionar la cantonada per forçar passe bombat." },
      { drillId: 'virtual-freethrows', duration: 6 },
      { drillId: 'drill-bojan-cikic-motion', duration: 19, notes: "Sincronització de bloquejos indirectes de l'anvers." },
      { drillId: 'drill-dejan-cikic-decisions', duration: 10, notes: "Lectura ràpida de l'avantatge espacial en la trena." }
    ] 
  },
  dia3: { id: 'dia3', name: 'Sessió 3: Dijous 3 de Setembre - Ritme de Transició i Tir', dayOfWeek: 'Dijous', totalDuration: 0, drills: [] },
  dia4: { id: 'dia4', name: 'Sessió 4: Dimarts 8 de Setembre - Defensa de l’1v1 i Ajudes', dayOfWeek: 'Dimarts', totalDuration: 0, drills: [] },
  dia5: { id: 'dia5', name: 'Sessió 5: Dijous 10 de Setembre - Transició i Joc Continu', dayOfWeek: 'Dijous', totalDuration: 0, drills: [] },
  dia6: { id: 'dia6', name: 'Sessió 6: Dimarts 15 de Setembre - Pick & Roll Situacions', dayOfWeek: 'Dimarts', totalDuration: 0, drills: [] },
  dia7: { id: 'dia7', name: 'Sessió 7: Dijous 17 de Setembre - Construcció del Contraatac', dayOfWeek: 'Dijous', totalDuration: 0, drills: [] },
  dia8: { id: 'dia8', name: 'Sessió 8: Dimarts 22 de Setembre - Defensa d’Ajudes Col·lectives', dayOfWeek: 'Dimarts', totalDuration: 0, drills: [] },
  dia9: { id: 'dia9', name: 'Sessió 9: Dijous 24 de Setembre - Presió a Tot Camp', dayOfWeek: 'Dijous', totalDuration: 0, drills: [] },
  dia10: { id: 'dia10', name: 'Sessió 10: Dimarts 29 de Setembre - Roda de Tir Prepartit i Ajustos', dayOfWeek: 'Dimarts', totalDuration: 0, drills: [] },
};

export function sanitizePlanSession(sessId: string, sess?: Partial<TrainingSession>): TrainingSession {
  const fallback = DEFAULT_SESSIONS[sessId] || {
    id: sessId,
    name: `Sessió ${sessId.replace('dia', '')}`,
    dayOfWeek: 'Dimarts',
    totalDuration: 0,
    drills: []
  };

  const meta = CALENDAR_SESSION_METADATA[sessId];
  let rawName = (sess && sess.name) ? sess.name : fallback.name;
  let dayOfWeek = meta ? meta.dayOfWeek : (sess?.dayOfWeek || fallback.dayOfWeek);

  if (meta) {
    let customSubtitle = meta.defaultTitle;
    if (rawName.includes(' - ')) {
      const parts = rawName.split(' - ');
      const candidate = parts.slice(1).join(' - ').trim();
      if (candidate) customSubtitle = candidate;
    } else if (rawName.includes(': ')) {
      const parts = rawName.split(': ');
      const candidate = parts.slice(1).join(': ').trim();
      if (candidate && !candidate.toLowerCase().includes('dimarts') && !candidate.toLowerCase().includes('dilluns') && !candidate.toLowerCase().includes('dimecres') && !candidate.toLowerCase().includes('dijous') && !candidate.toLowerCase().includes('lunes') && !candidate.toLowerCase().includes('martes') && !candidate.toLowerCase().includes('miércoles') && !candidate.toLowerCase().includes('jueves')) {
        customSubtitle = candidate;
      }
    }
    rawName = `Sessió ${sessId.replace('dia', '')}: ${meta.dateStr} - ${customSubtitle}`;
  }

  return {
    id: sessId,
    name: rawName,
    dayOfWeek: dayOfWeek,
    totalDuration: (sess?.drills || []).reduce((acc, d) => acc + (d.duration || 10), 0),
    drills: sess?.drills || fallback.drills || [],
    scheduledTime: sess?.scheduledTime
  };
}

export function sanitizeWeeklyPlan(plan: any): WeeklyPlan {
  return {
    ...plan,
    startDate: plan.startDate === '2026-09-03' ? '2026-08-31' : (plan.startDate || '2026-08-31'),
    dia1: sanitizePlanSession('dia1', plan.dia1),
    dia2: sanitizePlanSession('dia2', plan.dia2),
    dia3: sanitizePlanSession('dia3', plan.dia3),
    dia4: sanitizePlanSession('dia4', plan.dia4),
    dia5: sanitizePlanSession('dia5', plan.dia5),
    dia6: sanitizePlanSession('dia6', plan.dia6),
    dia7: sanitizePlanSession('dia7', plan.dia7),
    dia8: sanitizePlanSession('dia8', plan.dia8),
    dia9: sanitizePlanSession('dia9', plan.dia9),
    dia10: sanitizePlanSession('dia10', plan.dia10),
  };
}

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  // Standard user-agent detection for phones and tablets. No false positives on touchscreen laptops/desktops.
  const ua = navigator.userAgent || '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
};

export default function App() {
  const [drills, setDrills] = useState<Drill[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.drills) {
          return parsed.drills as Drill[];
        }
      }
    } catch (e) {
      console.error('Error loading drills from localstorage', e);
    }
    return PRE_POPULATED_DRILLS;
  });

  const [syncCode, setSyncCode] = useState<string>(() => {
    try {
      const savedCode = localStorage.getItem('basket_planner_sync_code');
      if (savedCode) return savedCode;
      
      // Auto-use DEFAULT_SYNC_CODE ('PINETY-JUNIORA') so computer and mobile share the exact same database by default
      localStorage.setItem('basket_planner_sync_code', DEFAULT_SYNC_CODE);
      return DEFAULT_SYNC_CODE;
    } catch (e) {}
    return DEFAULT_SYNC_CODE;
  });

  const [isLinked, setIsLinked] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('basket_planner_sync_code_manually_entered');
      if (stored !== null) return stored === 'true';
      return true; // Auto-linked by default to PINETY-JUNIORA
    } catch (e) {}
    return true;
  });

  const [hasLoadedFromCloud, setHasLoadedFromCloud] = useState<boolean>(false);

  const [coachProfile, setCoachProfile] = useState<CoachProfile>(() => {
    try {
      const stored = localStorage.getItem('basket_planner_coach_profile');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_COACH_PROFILE;
  });
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const lastSavedTimeStrRef = useRef<string | null>(null);
  const lastSavedDataJsonRef = useRef<string | null>(null);
  const isInitialMountRef = useRef<boolean>(true);

  useEffect(() => {
    localStorage.setItem('basket_planner_coach_profile', JSON.stringify(coachProfile));
  }, [coachProfile]);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [inputSyncCode, setInputSyncCode] = useState<string>('');
  const [syncError, setSyncError] = useState<string | null>(null);

  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.weeklyPlans && parsed.weeklyPlans.length > 0) {
          return parsed.weeklyPlans.map(sanitizeWeeklyPlan);
        }
        // Migration from old single "sessions"
        if (parsed.sessions) {
          return [sanitizeWeeklyPlan({
            id: 'plan-default',
            name: 'Planificació Mensual: Pretemporada & Temporada Regular',
            startDate: '2026-08-31',
            dia1: parsed.sessions.dia1 || DEFAULT_SESSIONS.dia1,
            dia2: parsed.sessions.dia2 || DEFAULT_SESSIONS.dia2,
            dia3: parsed.sessions.dia3 || DEFAULT_SESSIONS.dia3,
            dia4: parsed.sessions.dia4 || DEFAULT_SESSIONS.dia4,
            dia5: parsed.sessions.dia5 || DEFAULT_SESSIONS.dia5,
            dia6: parsed.sessions.dia6 || DEFAULT_SESSIONS.dia6,
            dia7: parsed.sessions.dia7 || DEFAULT_SESSIONS.dia7,
            dia8: parsed.sessions.dia8 || DEFAULT_SESSIONS.dia8,
            dia9: parsed.sessions.dia9 || DEFAULT_SESSIONS.dia9,
            dia10: parsed.sessions.dia10 || DEFAULT_SESSIONS.dia10,
          })];
        }
      }
    } catch (e) {
      console.error('Error loading weeklyPlans from localstorage', e);
    }
    return [
      sanitizeWeeklyPlan({
        id: 'plan-default',
        name: 'Planificació Mensual: Pretemporada & Temporada Regular',
        startDate: '2026-08-31',
        dia1: DEFAULT_SESSIONS.dia1,
        dia2: DEFAULT_SESSIONS.dia2,
        dia3: DEFAULT_SESSIONS.dia3,
        dia4: DEFAULT_SESSIONS.dia4,
        dia5: DEFAULT_SESSIONS.dia5,
        dia6: DEFAULT_SESSIONS.dia6,
        dia7: DEFAULT_SESSIONS.dia7,
        dia8: DEFAULT_SESSIONS.dia8,
        dia9: DEFAULT_SESSIONS.dia9,
        dia10: DEFAULT_SESSIONS.dia10,
      })
    ];
  });

  const [selectedWeeklyPlanId, setSelectedWeeklyPlanId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedWeeklyPlanId) return parsed.selectedWeeklyPlanId;
      }
    } catch (e) {}
    return 'plan-default';
  });

  // Calculate active weekly plan
  const activePlan = weeklyPlans.find(p => p.id === selectedWeeklyPlanId) || weeklyPlans[0];

  // Wrap sessions derivation in React.useMemo to stabilize its reference completely.
  // This completely stops writing to localStorage on every timer clock-second-tick in App.tsx!
  const sessions = React.useMemo<Record<string, TrainingSession>>(() => {
    const fallbackPlan = activePlan || (weeklyPlans && weeklyPlans[0]) || {
      dia1: DEFAULT_SESSIONS.dia1,
      dia2: DEFAULT_SESSIONS.dia2
    };
    return {
      dia1: fallbackPlan.dia1 || DEFAULT_SESSIONS.dia1,
      dia2: fallbackPlan.dia2 || DEFAULT_SESSIONS.dia2,
      dia3: fallbackPlan.dia3 || DEFAULT_SESSIONS.dia3,
      dia4: fallbackPlan.dia4 || DEFAULT_SESSIONS.dia4,
      dia5: fallbackPlan.dia5 || DEFAULT_SESSIONS.dia5,
      dia6: fallbackPlan.dia6 || DEFAULT_SESSIONS.dia6,
      dia7: fallbackPlan.dia7 || DEFAULT_SESSIONS.dia7,
      dia8: fallbackPlan.dia8 || DEFAULT_SESSIONS.dia8,
      dia9: fallbackPlan.dia9 || DEFAULT_SESSIONS.dia9,
      dia10: fallbackPlan.dia10 || DEFAULT_SESSIONS.dia10,
    };
  }, [activePlan, weeklyPlans]);

  // Custom setSessions wrapper that writes modifications directly into the active slice of weeklyPlans
  const setSessions = (newSessionsValOrFn: any) => {
    setWeeklyPlans(prevPlans => {
      const updated = prevPlans.map(plan => {
        if (plan.id === selectedWeeklyPlanId) {
          const currentFullSessions = {
            dia1: plan.dia1 || DEFAULT_SESSIONS.dia1,
            dia2: plan.dia2 || DEFAULT_SESSIONS.dia2,
            dia3: plan.dia3 || DEFAULT_SESSIONS.dia3,
            dia4: plan.dia4 || DEFAULT_SESSIONS.dia4,
            dia5: plan.dia5 || DEFAULT_SESSIONS.dia5,
            dia6: plan.dia6 || DEFAULT_SESSIONS.dia6,
            dia7: plan.dia7 || DEFAULT_SESSIONS.dia7,
            dia8: plan.dia8 || DEFAULT_SESSIONS.dia8,
            dia9: plan.dia9 || DEFAULT_SESSIONS.dia9,
            dia10: plan.dia10 || DEFAULT_SESSIONS.dia10,
          };
          const resolved = typeof newSessionsValOrFn === 'function' 
            ? newSessionsValOrFn(currentFullSessions) 
            : newSessionsValOrFn;
          return {
            ...plan,
            dia1: resolved.dia1,
            dia2: resolved.dia2,
            dia3: resolved.dia3,
            dia4: resolved.dia4,
            dia5: resolved.dia5,
            dia6: resolved.dia6,
            dia7: resolved.dia7,
            dia8: resolved.dia8,
            dia9: resolved.dia9,
            dia10: resolved.dia10,
          };
        }
        return plan;
      });

      // Synchronously write to localStorage immediately to avoid data loss on fast reloads
      try {
        const nowIso = new Date().toISOString();
        const cur = latestStateRef.current;
        const normalized = {
          drills: cur.drills || drills,
          weeklyPlans: updated,
          selectedWeeklyPlanId: cur.selectedWeeklyPlanId || selectedWeeklyPlanId || 'plan-default',
          selectedSessionId: cur.selectedSessionId || selectedSessionId || 'dia1',
          completions: cur.completions || completions || [],
          favoriteDrillIds: cur.favoriteDrillIds || favoriteDrillIds || [],
          coachProfile: cur.coachProfile || coachProfile || DEFAULT_COACH_PROFILE,
          players: cur.players || players || [],
          sessionTemplates: cur.sessionTemplates || sessionTemplates || [],
          baremosConfig: cur.baremosConfig || baremosConfig || DEFAULT_BAREMOS,
          updatedAt: nowIso
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
      } catch (e) {}

      return updated;
    });
  };

  const [selectedSessionId, setSelectedSessionId] = useState<string>('dia1');
  const [activeView, setActiveView] = useState<string>(() => {
    try {
      // Direct mobile UA and size-responsive detection so phones load mobile views natively & quickly
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      if (isMobileUA || isSmallScreen) {
        return 'mobile';
      }
    } catch (e) {}
    return 'planner';
  });
  const [isSharedMobile, setIsSharedMobile] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewDrill, setPreviewDrill] = useState<Drill | null>(null);
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null);
  const [planIdToDelete, setPlanIdToDelete] = useState<string | null>(null);

  // Player roster and evaluation state
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.players && Array.isArray(parsed.players) && parsed.players.length > 0) {
          return parsed.players;
        }
      }
    } catch (e) {
      console.error('Error loading players from localStorage', e);
    }
    return DEFAULT_JUNIOR_PLAYERS;
  });

  const [baremosConfig, setBaremosConfig] = useState<BaremoItem[]>(() => {
    try {
      const saved = localStorage.getItem('coachboard_baremos_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_BAREMOS;
  });

  const [showPlayerRosterModal, setShowPlayerRosterModal] = useState<boolean>(false);

  const syncStateToCloudImmediately = (overrideState?: any) => {
    if (!syncCode || !hasLoadedFromCloud) return;
    const newState = buildNormalizedState(overrideState);
    const newStateStr = JSON.stringify(newState);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newStateStr);
    } catch (e) {}
    saveToCloud(syncCode, newState).then(savedTime => {
      setLastSynced(new Date(savedTime));
      lastSavedTimeStrRef.current = savedTime;
      lastSavedDataJsonRef.current = JSON.stringify(newState);
    }).catch(err => {
      console.warn('Instant cloud sync failed:', err);
    });
  };

  const handleAddPlayer = (newPlayer: Omit<Player, 'id'>) => {
    const created: Player = {
      ...newPlayer,
      id: `player-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    const nextPlayers = [...players, created];
    setPlayers(nextPlayers);
    syncStateToCloudImmediately({ players: nextPlayers });
  };

  const handleUpdatePlayer = (id: string, updated: Partial<Player>) => {
    const nextPlayers = players.map(p => p.id === id ? { ...p, ...updated, updatedAt: new Date().toISOString() } : p);
    setPlayers(nextPlayers);
    syncStateToCloudImmediately({ players: nextPlayers });
  };

  const handleDeletePlayer = (id: string) => {
    const nextPlayers = players.filter(p => p.id !== id);
    setPlayers(nextPlayers);
    syncStateToCloudImmediately({ players: nextPlayers });
  };

  // Match annotations state
  const [showMatchModal, setShowMatchModal] = useState<boolean>(false);
  const [selectedMatchDateIndex, setSelectedMatchDateIndex] = useState<number>(5);

  const handleSaveMatchAnnotation = (dateIndex: number, annotation: MatchAnnotation) => {
    setWeeklyPlans(prevPlans => prevPlans.map(plan => {
      if (plan.id === selectedWeeklyPlanId) {
        const existing = plan.matchAnnotations || {};
        return {
          ...plan,
          matchAnnotations: {
            ...existing,
            [dateIndex.toString()]: annotation
          }
        };
      }
      return plan;
    }));
  };

  const handleDeleteMatchAnnotation = (dateIndex: number) => {
    setWeeklyPlans(prevPlans => prevPlans.map(plan => {
      if (plan.id === selectedWeeklyPlanId) {
        const existing = { ...(plan.matchAnnotations || {}) };
        delete existing[dateIndex.toString()];
        return {
          ...plan,
          matchAnnotations: existing
        };
      }
      return plan;
    }));
  };

  // Completions list with localStorage persistence
  const [completions, setCompletions] = useState<SessionCompletion[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.completions) {
          return parsed.completions;
        }
      }
    } catch (e) {
      console.error('Error loading completions from localstorage', e);
    }
    return [];
  });

  // Favorite drills tracking state
  const [favoriteDrillIds, setFavoriteDrillIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.favoriteDrillIds) {
          return parsed.favoriteDrillIds as string[];
        }
      }
    } catch (e) {
      console.error('Error loading favoriteDrillIds from localstorage', e);
    }
    return [];
  });

  // Session templates library state
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sessionTemplates && parsed.sessionTemplates.length > 0) {
          return parsed.sessionTemplates;
        }
      }
    } catch (e) {
      console.error('Error loading sessionTemplates from localstorage', e);
    }
    return DEFAULT_SESSION_TEMPLATES;
  });

  const handleApplyTemplateToSession = (template: SessionTemplate, targetSessionId: string) => {
    setSessions((prevSessions: Record<string, TrainingSession>) => {
      const currentSess = prevSessions[targetSessionId] || {
        id: targetSessionId,
        name: `Sessió ${targetSessionId}`,
        dayOfWeek: 'Martes',
        totalDuration: 0,
        drills: []
      };

      const newDrills = template.drills.map(d => ({
        drillId: d.drillId,
        duration: d.duration,
        notes: d.notes || ''
      }));

      const totalDuration = newDrills.reduce((acc, curr) => acc + curr.duration, 0);

      return {
        ...prevSessions,
        [targetSessionId]: {
          ...currentSess,
          drills: newDrills,
          totalDuration
        }
      };
    });
  };

  const handleSaveCurrentSessionAsTemplate = (name: string, category: string, description?: string, customSession?: TrainingSession) => {
    const sessionToSave = customSession || sessions[selectedSessionId] || sessions['dia1'];
    if (!sessionToSave || !sessionToSave.drills || sessionToSave.drills.length === 0) return;

    const newTemplate: SessionTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name,
      category,
      description: description || '',
      totalDuration: sessionToSave.drills.reduce((a, b) => a + (b.duration || 10), 0),
      drills: sessionToSave.drills.map(d => ({
        drillId: d.drillId,
        duration: d.duration || 10,
        notes: d.notes || ''
      })),
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    setSessionTemplates(prev => [newTemplate, ...prev]);
  };

  const handleCreateTemplateFromScratch = (newTplData: Omit<SessionTemplate, 'id'>) => {
    const newTemplate: SessionTemplate = {
      ...newTplData,
      id: `tpl-custom-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setSessionTemplates(prev => [newTemplate, ...prev]);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setSessionTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleToggleFavoriteDrill = (drillId: string) => {
    setFavoriteDrillIds(prev => {
      const isFav = prev.includes(drillId);
      if (isFav) {
        triggerToast('⭐ S’ha eliminat de preferits');
        return prev.filter(id => id !== drillId);
      } else {
        triggerToast('⭐ Afegit als teus exercicis preferits!');
        return [...prev, drillId];
      }
    });
  };

  const handleAddDrillToSession = (drillId: string, targetSessionId?: string, customNotes?: string) => {
    const targetId = targetSessionId || selectedSessionId || 'dia1';
    const originalDrill = drills.find(d => d.id === drillId);
    if (!originalDrill) return;

    setSessions((prevSessions: Record<string, TrainingSession>) => {
      const currentSess = prevSessions[targetId] || {
        id: targetId,
        name: `Sessió ${targetId}`,
        dayOfWeek: 'Martes',
        totalDuration: 0,
        drills: []
      };

      const newDrillRef = {
        drillId,
        duration: originalDrill.duration || 10,
        notes: customNotes || ''
      };

      const updatedDrills = [...currentSess.drills, newDrillRef];
      const totalDuration = updatedDrills.reduce((acc, curr) => acc + (curr.duration || 10), 0);

      return {
        ...prevSessions,
        [targetId]: {
          ...currentSess,
          drills: updatedDrills,
          totalDuration
        }
      };
    });

    const sessName = sessions[targetId]?.name || `Sessió`;
    triggerToast(`➕ S'ha afegit "${originalDrill.title}" a la ${sessName}`);
  };

  const handleToggleCompleteSession = (planId: string, sessId: string) => {
    const isCompleted = completions.some(c => c.planId === planId && c.sessionId === sessId);
    if (isCompleted) {
      setCompletions(current => current.filter(c => !(c.planId === planId && c.sessionId === sessId)));
      triggerToast('Sessió desmarcada com a completada 🔄');
    } else {
      const newCompletion: SessionCompletion = {
        id: `completion-${Date.now()}`,
        planId,
        sessionId: sessId,
        completedAt: new Date().toISOString()
      };
      setCompletions(current => [...current, newCompletion]);
      triggerToast('Sessió marcada com a completada! Enhorabona! 🎉');
    }
  };

  const handleAddRepetition = (planId: string, sessId: string) => {
    const newCompletion: SessionCompletion = {
      id: `completion-${Date.now()}-${Math.random()}`,
      planId,
      sessionId: sessId,
      completedAt: new Date().toISOString()
    };
    setCompletions(current => [...current, newCompletion]);
    triggerToast('S’ha afegit una nova repetició d’entrenament! 📈');
  };

  const handleRemoveRepetition = (completionId: string) => {
    setCompletions(current => current.filter(c => c.id !== completionId));
    triggerToast('S’ha eliminat la repetició del registre.');
  };

  const handleClearCompletions = (planId: string, sessId: string) => {
    setCompletions(current => current.filter(c => !(c.planId === planId && c.sessionId === sessId)));
    triggerToast('S’ha reiniciat el registre de repeticions d’aquesta sessió.');
  };
  
  // Mobile direct photo pairing code state
  const [mobilePairingCode, setMobilePairingCode] = useState<string | null>(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);

  const latestStateRef = useRef<{
    drills: Drill[];
    weeklyPlans: WeeklyPlan[];
    selectedWeeklyPlanId: string;
    selectedSessionId: string;
    completions: any[];
    favoriteDrillIds: string[];
    coachProfile: CoachProfile;
    players: Player[];
    sessionTemplates: SessionTemplate[];
    baremosConfig: BaremoItem[];
  }>({
    drills: [],
    weeklyPlans: [],
    selectedWeeklyPlanId: '',
    selectedSessionId: '',
    completions: [],
    favoriteDrillIds: [],
    coachProfile: DEFAULT_COACH_PROFILE,
    players: [],
    sessionTemplates: [],
    baremosConfig: DEFAULT_BAREMOS
  });

  // Keep latestStateRef updated on every render
  latestStateRef.current = {
    drills,
    weeklyPlans,
    selectedWeeklyPlanId,
    selectedSessionId,
    completions,
    favoriteDrillIds,
    coachProfile,
    players,
    sessionTemplates,
    baremosConfig
  };

  // Helper to build normalized state object with all fields strictly typed
  const buildNormalizedState = (customData?: Partial<{
    drills: Drill[];
    weeklyPlans: WeeklyPlan[];
    selectedWeeklyPlanId: string;
    selectedSessionId: string;
    completions: any[];
    favoriteDrillIds: string[];
    coachProfile: CoachProfile;
    players: Player[];
    sessionTemplates: SessionTemplate[];
    baremosConfig: BaremoItem[];
  }>) => {
    const cur = latestStateRef.current;
    return {
      drills: customData?.drills || cur.drills || drills,
      weeklyPlans: (customData?.weeklyPlans && customData.weeklyPlans.length > 0) ? customData.weeklyPlans : (cur.weeklyPlans && cur.weeklyPlans.length > 0 ? cur.weeklyPlans : weeklyPlans),
      selectedWeeklyPlanId: customData?.selectedWeeklyPlanId || cur.selectedWeeklyPlanId || selectedWeeklyPlanId || 'plan-default',
      selectedSessionId: customData?.selectedSessionId || cur.selectedSessionId || selectedSessionId || 'dia1',
      completions: customData?.completions || cur.completions || completions || [],
      favoriteDrillIds: customData?.favoriteDrillIds || cur.favoriteDrillIds || favoriteDrillIds || [],
      coachProfile: customData?.coachProfile || cur.coachProfile || coachProfile || DEFAULT_COACH_PROFILE,
      players: customData?.players || cur.players || players || [],
      sessionTemplates: customData?.sessionTemplates || cur.sessionTemplates || sessionTemplates || [],
      baremosConfig: customData?.baremosConfig || cur.baremosConfig || baremosConfig || DEFAULT_BAREMOS
    };
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => current === msg ? null : current);
    }, 4500);
  };

  // Helper to re-fetch and apply cloud state seamlessly
  const refreshFromCloud = async (forceCode?: string) => {
    const codeToQuery = forceCode || syncCode || DEFAULT_SYNC_CODE;
    if (!codeToQuery) return;
    
    try {
      const cloudData = await loadFromCloud(codeToQuery);
      if (cloudData) {
        if (cloudData.updatedAt && lastSavedTimeStrRef.current && cloudData.updatedAt === lastSavedTimeStrRef.current) {
          return;
        }

        const cloudDrills = cloudData.drills || [];
        const localDrills = latestStateRef.current.drills;
        const mergedDrills = [...cloudDrills];
        localDrills.forEach(localDrill => {
          if (localDrill.isCustom && !mergedDrills.some(cd => cd.id === localDrill.id)) {
            mergedDrills.push(localDrill);
          }
        });

        if (mergedDrills.length > 0) setDrills(mergedDrills);
        if (cloudData.weeklyPlans && cloudData.weeklyPlans.length > 0) {
          setWeeklyPlans(cloudData.weeklyPlans.map(sanitizeWeeklyPlan));
        }
        if (cloudData.selectedWeeklyPlanId) setSelectedWeeklyPlanId(cloudData.selectedWeeklyPlanId);
        if (cloudData.selectedSessionId) setSelectedSessionId(cloudData.selectedSessionId);
        if (cloudData.completions) setCompletions(cloudData.completions);
        if (cloudData.favoriteDrillIds) setFavoriteDrillIds(cloudData.favoriteDrillIds);
        if (cloudData.coachProfile) setCoachProfile(cloudData.coachProfile);
        if (cloudData.players && Array.isArray(cloudData.players)) setPlayers(cloudData.players);
        if (cloudData.sessionTemplates && Array.isArray(cloudData.sessionTemplates)) setSessionTemplates(cloudData.sessionTemplates);
        if (cloudData.baremosConfig && Array.isArray(cloudData.baremosConfig) && cloudData.baremosConfig.length > 0) {
          setBaremosConfig(cloudData.baremosConfig);
        }

        if (cloudData.updatedAt) {
          setLastSynced(new Date(cloudData.updatedAt));
          lastSavedTimeStrRef.current = cloudData.updatedAt;
        } else {
          setLastSynced(new Date());
          lastSavedTimeStrRef.current = null;
        }

        const normState = buildNormalizedState({
          drills: mergedDrills,
          weeklyPlans: cloudData.weeklyPlans && cloudData.weeklyPlans.length > 0 ? cloudData.weeklyPlans.map(sanitizeWeeklyPlan) : undefined,
          selectedWeeklyPlanId: cloudData.selectedWeeklyPlanId,
          selectedSessionId: cloudData.selectedSessionId,
          completions: cloudData.completions,
          favoriteDrillIds: cloudData.favoriteDrillIds,
          coachProfile: cloudData.coachProfile,
          players: cloudData.players,
          sessionTemplates: cloudData.sessionTemplates,
          baremosConfig: cloudData.baremosConfig
        });

        lastSavedDataJsonRef.current = JSON.stringify(normState);
        const stateStr = JSON.stringify({ ...normState, updatedAt: cloudData.updatedAt || new Date().toISOString() });
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, stateStr);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('[AutoSync] Background refresh failed:', e);
    }
  };

  // Load from cloud or URL parameter on startup with automatic cloud-first hydration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSyncCode = params.get('sync');
    const urlView = params.get('view');
    const urlSession = params.get('session');
    
    let codeToUse = urlSyncCode || localStorage.getItem('basket_planner_sync_code') || DEFAULT_SYNC_CODE;
    
    if (urlView) {
      setActiveView(urlView);
    }
    if (urlSession) {
      setSelectedSessionId(urlSession);
    }

    if (urlSyncCode) {
      let sanitized = urlSyncCode.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
      if (!sanitized.startsWith('PINETY-') && sanitized.length === 4) {
        sanitized = `PINETY-${sanitized}`;
      }
      codeToUse = sanitized;
      setSyncCode(sanitized);
      setIsLinked(true);
      localStorage.setItem('basket_planner_sync_code', sanitized);
      localStorage.setItem('basket_planner_sync_code_manually_entered', 'true');
      
      // Clean up URL parameter to avoid bookmark/refresh loops with old parameters
      try {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      } catch (e) {}
    } else {
      localStorage.setItem('basket_planner_sync_code', codeToUse);
    }

    if (codeToUse) {
      setIsSyncing(true);
      loadFromCloud(codeToUse)
        .then(cloudData => {
          if (cloudData) {
            // Cloud data is always the primary source of truth across mobile and desktop
            const cloudDrills = cloudData.drills || [];
            const localDrills = latestStateRef.current.drills;
            const mergedDrills = [...cloudDrills];
            localDrills.forEach(localDrill => {
              if (localDrill.isCustom && !mergedDrills.some(cd => cd.id === localDrill.id)) {
                mergedDrills.push(localDrill);
              }
            });

            if (mergedDrills.length > 0) setDrills(mergedDrills);
            if (cloudData.weeklyPlans && cloudData.weeklyPlans.length > 0) {
              setWeeklyPlans(cloudData.weeklyPlans.map(sanitizeWeeklyPlan));
            }
            if (cloudData.selectedWeeklyPlanId) setSelectedWeeklyPlanId(cloudData.selectedWeeklyPlanId);
            if (cloudData.selectedSessionId) setSelectedSessionId(cloudData.selectedSessionId);
            if (cloudData.completions) setCompletions(cloudData.completions);
            if (cloudData.favoriteDrillIds) setFavoriteDrillIds(cloudData.favoriteDrillIds);
            if (cloudData.coachProfile) setCoachProfile(cloudData.coachProfile);
            if (cloudData.players && Array.isArray(cloudData.players)) setPlayers(cloudData.players);
            if (cloudData.sessionTemplates && Array.isArray(cloudData.sessionTemplates)) setSessionTemplates(cloudData.sessionTemplates);
            if (cloudData.baremosConfig && Array.isArray(cloudData.baremosConfig) && cloudData.baremosConfig.length > 0) {
              setBaremosConfig(cloudData.baremosConfig);
            }

            setSyncCode(codeToUse);
            setIsLinked(true);
            if (cloudData.updatedAt) {
              setLastSynced(new Date(cloudData.updatedAt));
              lastSavedTimeStrRef.current = cloudData.updatedAt;
            } else {
              setLastSynced(new Date());
              lastSavedTimeStrRef.current = null;
            }

            const normState = buildNormalizedState({
              drills: mergedDrills,
              weeklyPlans: cloudData.weeklyPlans && cloudData.weeklyPlans.length > 0 ? cloudData.weeklyPlans.map(sanitizeWeeklyPlan) : undefined,
              selectedWeeklyPlanId: cloudData.selectedWeeklyPlanId,
              selectedSessionId: cloudData.selectedSessionId,
              completions: cloudData.completions,
              favoriteDrillIds: cloudData.favoriteDrillIds,
              coachProfile: cloudData.coachProfile,
              players: cloudData.players,
              sessionTemplates: cloudData.sessionTemplates,
              baremosConfig: cloudData.baremosConfig
            });

            lastSavedDataJsonRef.current = JSON.stringify(normState);
            const stateStr = JSON.stringify({ ...normState, updatedAt: cloudData.updatedAt || new Date().toISOString() });

            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, stateStr);
            } catch (e) {}

            triggerToast('🔄 Sessions sincronitzades automàticament des del núvol!');
          } else {
            // Document doesn't exist yet in cloud, save current local state so it initializes in Firestore and backend
            setSyncCode(codeToUse);
            setIsLinked(true);
            const initialState = buildNormalizedState();
            saveToCloud(codeToUse, initialState).then((savedTime) => {
              setLastSynced(new Date(savedTime));
              lastSavedTimeStrRef.current = savedTime;
              lastSavedDataJsonRef.current = JSON.stringify(initialState);
            }).catch(() => {});
          }
        })
        .catch(err => {
          console.warn('Could not auto-load from cloud on startup:', err);
        })
        .finally(() => {
          setIsSyncing(false);
          setHasLoadedFromCloud(true);
        });
    } else {
      setHasLoadedFromCloud(true);
    }
  }, []);

  // Multi-event automatic synchronization: triggers on window focus, mobile screen unlock (visibilitychange), and network recovery
  useEffect(() => {
    if (!hasLoadedFromCloud) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshFromCloud();
      }
    };

    const handleFocus = () => {
      refreshFromCloud();
    };

    const handleOnline = () => {
      refreshFromCloud();
    };

    // Periodic safety sync poll every 12 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshFromCloud();
      }
    }, 12000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [hasLoadedFromCloud, syncCode]);

  // Auto-save changes to cloud and always persist to localStorage immediately
  useEffect(() => {
    const currentState = buildNormalizedState({
      drills,
      weeklyPlans,
      selectedWeeklyPlanId,
      selectedSessionId,
      completions,
      favoriteDrillIds,
      coachProfile,
      players,
      sessionTemplates,
      baremosConfig
    });
    
    const currentStateDataJson = JSON.stringify(currentState);

    // Skip saving on the very first mount before initial cloud hydration completes
    if (!hasLoadedFromCloud) return;

    // Persist to localStorage immediately for instant client reload
    const nowIso = new Date().toISOString();
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...currentState, updatedAt: nowIso }));
    } catch (e) {}

    if (!syncCode) return;

    // If local state content hasn't changed relative to what was last saved or loaded from cloud, SKIP saving!
    if (lastSavedDataJsonRef.current === currentStateDataJson) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const savedTimeStr = await saveToCloud(syncCode, currentState);
        setLastSynced(new Date(savedTimeStr));
        lastSavedTimeStrRef.current = savedTimeStr;
        lastSavedDataJsonRef.current = currentStateDataJson;
        setSyncError(null);
      } catch (e: any) {
        console.warn('Auto-save to cloud failed:', e);
        setSyncError(e?.message || String(e));
      } finally {
        setIsSyncing(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [drills, weeklyPlans, selectedWeeklyPlanId, selectedSessionId, completions, favoriteDrillIds, coachProfile, players, sessionTemplates, baremosConfig, syncCode, hasLoadedFromCloud]);

  const handleForceSaveSession = async () => {
    setIsSyncing(true);
    const nowIso = new Date().toISOString();
    const currentState = buildNormalizedState({
      drills,
      weeklyPlans,
      selectedWeeklyPlanId,
      selectedSessionId,
      completions,
      favoriteDrillIds,
      coachProfile,
      players,
      sessionTemplates,
      baremosConfig
    });
    const stateWithTimestamp = { ...currentState, updatedAt: nowIso };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateWithTimestamp));
      if (syncCode) {
        const savedTimeStr = await saveToCloud(syncCode, currentState);
        setLastSynced(new Date(savedTimeStr));
        lastSavedTimeStrRef.current = savedTimeStr;
        lastSavedDataJsonRef.current = JSON.stringify(currentState);
      }
      triggerToast(`💾 Sessió sincronitzada amb el núvol en temps real!`);
    } catch (e: any) {
      triggerToast('💾 Sessió desada localment a la memòria del navegador.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Listen for real-time changes from the cloud (Firestore onSnapshot)
  useEffect(() => {
    if (!syncCode || !hasLoadedFromCloud) return;

    const unsubscribe = subscribeToCloud(syncCode, (cloudData) => {
      if (!cloudData) return;

      if (cloudData.updatedAt && lastSavedTimeStrRef.current && cloudData.updatedAt === lastSavedTimeStrRef.current) {
        return;
      }

      const currentLocalDrills = latestStateRef.current.drills;
      let mergedDrills = currentLocalDrills;

      if (cloudData.drills && cloudData.drills.length > 0) {
        const cloudDrills = cloudData.drills || [];
        const merged = [...cloudDrills];
        currentLocalDrills.forEach(localDrill => {
          if (localDrill.isCustom && !merged.some(cd => cd.id === localDrill.id)) {
            merged.push(localDrill);
          }
        });
        mergedDrills = merged;
        setDrills(merged);
      }

      if (cloudData.weeklyPlans && cloudData.weeklyPlans.length > 0) {
        setWeeklyPlans(cloudData.weeklyPlans.map(sanitizeWeeklyPlan));
      }
      if (cloudData.selectedWeeklyPlanId) {
        setSelectedWeeklyPlanId(cloudData.selectedWeeklyPlanId);
      }
      if (cloudData.selectedSessionId) {
        setSelectedSessionId(cloudData.selectedSessionId);
      }
      if (cloudData.completions) {
        setCompletions(cloudData.completions);
      }
      if (cloudData.favoriteDrillIds) {
        setFavoriteDrillIds(cloudData.favoriteDrillIds);
      }
      if (cloudData.coachProfile) {
        setCoachProfile(cloudData.coachProfile);
      }
      if (cloudData.players && Array.isArray(cloudData.players)) {
        setPlayers(cloudData.players);
      }
      if (cloudData.sessionTemplates && Array.isArray(cloudData.sessionTemplates)) {
        setSessionTemplates(cloudData.sessionTemplates);
      }
      if (cloudData.baremosConfig && Array.isArray(cloudData.baremosConfig) && cloudData.baremosConfig.length > 0) {
        setBaremosConfig(cloudData.baremosConfig);
      }

      if (cloudData.updatedAt) {
        setLastSynced(new Date(cloudData.updatedAt));
        lastSavedTimeStrRef.current = cloudData.updatedAt;
      } else {
        const fallbackNow = new Date();
        setLastSynced(fallbackNow);
        lastSavedTimeStrRef.current = fallbackNow.toISOString();
      }

      const appliedState = buildNormalizedState({
        drills: mergedDrills,
        weeklyPlans: cloudData.weeklyPlans ? cloudData.weeklyPlans.map(sanitizeWeeklyPlan) : undefined,
        selectedWeeklyPlanId: cloudData.selectedWeeklyPlanId,
        selectedSessionId: cloudData.selectedSessionId,
        completions: cloudData.completions,
        favoriteDrillIds: cloudData.favoriteDrillIds,
        coachProfile: cloudData.coachProfile,
        players: cloudData.players,
        sessionTemplates: cloudData.sessionTemplates,
        baremosConfig: cloudData.baremosConfig
      });
      
      lastSavedDataJsonRef.current = JSON.stringify(appliedState);
      const appliedString = JSON.stringify({ ...appliedState, updatedAt: cloudData.updatedAt || new Date().toISOString() });

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, appliedString);
      } catch (e) {}
      
      console.log('🔄 Sincronització en segon pla completada correctament des del núvol.');
    });

    return () => unsubscribe();
  }, [syncCode, hasLoadedFromCloud]);

  // Real HTML5 Notification Scheduler to alert the coach 10 minutes prior to training session start
  useEffect(() => {
    // 1. Request notifications permission gracefully on load
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notificacions d’entrenament activades pel sistema.');
          }
        });
      }
    }

    // 2. Track already notified alert keys so we never spam the coach's device
    const notifiedKeys = new Set<string>();

    // 3. Polling check every 12 seconds
    const interval = setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();

      weeklyPlans.forEach(plan => {
        const keys: (keyof WeeklyPlan)[] = ['dia1', 'dia2', 'dia3', 'dia4', 'dia5', 'dia6', 'dia7', 'dia8'];
        keys.forEach(key => {
          const session = plan[key] as TrainingSession | undefined;
          if (session && session.scheduledTime) {
            const schedDate = new Date(session.scheduledTime);
            const diffMs = schedDate.getTime() - now.getTime();
            const diffMins = diffMs / 1000 / 60;

            // Trigger when exactly 9.5 to 10.5 minutes remain
            const alertKey = `${plan.id}-${session.id}-${session.scheduledTime}`;
            if (diffMins > 9.0 && diffMins <= 10.5 && !notifiedKeys.has(alertKey)) {
              notifiedKeys.add(alertKey);

              // Dispatch Native System Notification
              new Notification("🏀 Alerta d'Entrenament (Júnior A)!", {
                body: `Falten 10 minuts per a l'inici de la sessió programada: "${session.name}". En marxa!`,
                requireInteraction: true,
                tag: alertKey
              });

              triggerToast(`🔔 Notificació enviada: Falten 10 minuts per "${session.name}"!`);
            }
          }
        });
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [weeklyPlans]);

  // Handler to load cloud data from entering a sync code manually
  const handleLoadCloudData = async (codeToLoad: string) => {
    // Highly robust sanitization: supports abcd, PINETY-abcd, pinetyabcd, pinety abcd
    let sanitizedCode = codeToLoad.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!sanitizedCode) {
      triggerToast('⚠️ Introdueix un codi vàlid per sincronitzar.');
      return;
    }

    if (sanitizedCode.startsWith('PINETY')) {
      const suffix = sanitizedCode.substring(6);
      sanitizedCode = `PINETY-${suffix}`;
    } else {
      sanitizedCode = `PINETY-${sanitizedCode}`;
    }

    setIsSyncing(true);
    try {
      const cloudData = await loadFromCloud(sanitizedCode);
      if (cloudData) {
        const cloudDrills = cloudData.drills || [];
        const localDrills = latestStateRef.current.drills;
        const mergedDrills = [...cloudDrills];
        localDrills.forEach(localDrill => {
          if (localDrill.isCustom && !mergedDrills.some(cd => cd.id === localDrill.id)) {
            mergedDrills.push(localDrill);
          }
        });

        setDrills(mergedDrills);

        if (cloudData.weeklyPlans && cloudData.weeklyPlans.length > 0) setWeeklyPlans(cloudData.weeklyPlans);
        if (cloudData.selectedWeeklyPlanId) setSelectedWeeklyPlanId(cloudData.selectedWeeklyPlanId);
        if (cloudData.selectedSessionId) setSelectedSessionId(cloudData.selectedSessionId);
        if (cloudData.completions) setCompletions(cloudData.completions);
        if (cloudData.favoriteDrillIds) setFavoriteDrillIds(cloudData.favoriteDrillIds);
        if (cloudData.coachProfile) setCoachProfile(cloudData.coachProfile);
        
        setSyncCode(sanitizedCode);
        setIsLinked(true);
        localStorage.setItem('basket_planner_sync_code', sanitizedCode);
        localStorage.setItem('basket_planner_sync_code_manually_entered', 'true');
        setHasLoadedFromCloud(true);
        if (cloudData.updatedAt) {
          setLastSynced(new Date(cloudData.updatedAt));
          lastSavedTimeStrRef.current = cloudData.updatedAt;
        } else {
          setLastSynced(new Date());
          lastSavedTimeStrRef.current = null;
        }

        lastSavedDataJsonRef.current = JSON.stringify(buildNormalizedState({
          drills: mergedDrills,
          weeklyPlans: cloudData.weeklyPlans && cloudData.weeklyPlans.length > 0 ? cloudData.weeklyPlans.map(sanitizeWeeklyPlan) : latestStateRef.current.weeklyPlans,
          selectedWeeklyPlanId: cloudData.selectedWeeklyPlanId || latestStateRef.current.selectedWeeklyPlanId,
          selectedSessionId: cloudData.selectedSessionId || latestStateRef.current.selectedSessionId,
          completions: cloudData.completions || latestStateRef.current.completions,
          favoriteDrillIds: cloudData.favoriteDrillIds || latestStateRef.current.favoriteDrillIds,
          coachProfile: cloudData.coachProfile || latestStateRef.current.coachProfile,
          players: cloudData.players || latestStateRef.current.players,
          sessionTemplates: cloudData.sessionTemplates || latestStateRef.current.sessionTemplates,
          baremosConfig: cloudData.baremosConfig || latestStateRef.current.baremosConfig
        }));

        setShowSyncModal(false);
        triggerToast('🔄 Sincronització completada amb èxit! Dades recuperades.');
      } else {
        triggerToast(`⚠️ No s'han trobat dades vinculades al codi "${sanitizedCode}".`);
      }
    } catch (err) {
      console.error(err);
      triggerToast('❌ Error en descarregar les dades del núvol.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Immediate save on opening sync modal to completely avoid race conditions
  const handleOpenSyncModal = () => {
    setInputSyncCode('');
    setShowSyncModal(true);
    if (syncCode && hasLoadedFromCloud) {
      setIsSyncing(true);
      const stateToSave = buildNormalizedState();
      saveToCloud(syncCode, stateToSave).then((savedTimeStr) => {
        setLastSynced(new Date(savedTimeStr));
      }).catch(e => {
        console.warn('Auto-save on opening sync modal failed:', e);
      }).finally(() => {
        setIsSyncing(false);
      });
    }
  };

  const handleUnlinkSyncCode = () => {
    const newCode = generateSyncCode();
    setSyncCode(newCode);
    setIsLinked(false);
    localStorage.setItem('basket_planner_sync_code', newCode);
    localStorage.removeItem('basket_planner_sync_code_manually_entered');
    setLastSynced(null);
    triggerToast('🔌 Codi desvinculat. S’ha creat un nou codi local.');
  };

  // Force save to cloud manually with robust bidirectional synchronization merging local and cloud updates safely
  const handleForceSaveToCloud = async () => {
    if (!syncCode || !hasLoadedFromCloud) return;
    setIsSyncing(true);
    try {
      // 1. Fetch latest cloud state first to avoid overwriting newer data
      const cloudData = await loadFromCloud(syncCode);
      
      let mergedDrills = drills;
      let mergedPlans = weeklyPlans;
      let mergedCompletions = completions;
      let mergedFavs = favoriteDrillIds;
      let mergedProfile = coachProfile;
      let mergedPlayers = players;
      let mergedTemplates = sessionTemplates;
      let mergedBaremos = baremosConfig;

      if (cloudData) {
        // 2. Bidirectional Merge: Drills (Union of both lists by id)
        const cloudDrills = cloudData.drills || [];
        const uniqueLocalDrills = drills.filter(ld => !cloudDrills.some(cd => cd.id === ld.id));
        mergedDrills = [...cloudDrills, ...uniqueLocalDrills];

        // 3. Bidirectional Merge: Weekly Plans
        const cloudPlans = cloudData.weeklyPlans || [];
        const uniqueLocalPlans = weeklyPlans.filter(lp => !cloudPlans.some(cp => cp.id === lp.id));
        mergedPlans = [...cloudPlans, ...uniqueLocalPlans];

        // 4. Bidirectional Merge: Completions
        const cloudCompletions = cloudData.completions || [];
        const uniqueLocalCompletions = completions.filter(lc => !cloudCompletions.some(cc => cc.id === lc.id));
        mergedCompletions = [...cloudCompletions, ...uniqueLocalCompletions];

        // 5. Bidirectional Merge: Favorites
        const cloudFavs = cloudData.favoriteDrillIds || [];
        mergedFavs = Array.from(new Set([...cloudFavs, ...favoriteDrillIds]));

        // 6. Merge Coach Profile, Players, Templates and Baremos
        mergedProfile = cloudData.coachProfile || coachProfile;
        mergedPlayers = (cloudData.players && cloudData.players.length > 0) ? cloudData.players : players;
        mergedTemplates = (cloudData.sessionTemplates && cloudData.sessionTemplates.length > 0) ? cloudData.sessionTemplates : sessionTemplates;
        mergedBaremos = (cloudData.baremosConfig && cloudData.baremosConfig.length > 0) ? cloudData.baremosConfig : baremosConfig;
      }

      // 7. Push merged state back to cloud
      const currentState = buildNormalizedState({
        drills: mergedDrills,
        weeklyPlans: mergedPlans,
        selectedWeeklyPlanId,
        selectedSessionId,
        completions: mergedCompletions,
        favoriteDrillIds: mergedFavs,
        coachProfile: mergedProfile,
        players: mergedPlayers,
        sessionTemplates: mergedTemplates,
        baremosConfig: mergedBaremos
      });

      const savedTimeStr = await saveToCloud(syncCode, currentState);
      
      // 8. Update local state with the merged version
      setDrills(mergedDrills);
      setWeeklyPlans(mergedPlans);
      setCompletions(mergedCompletions);
      setFavoriteDrillIds(mergedFavs);
      setCoachProfile(mergedProfile);
      setPlayers(mergedPlayers);
      setSessionTemplates(mergedTemplates);
      setBaremosConfig(mergedBaremos);

      setLastSynced(new Date(savedTimeStr));
      lastSavedTimeStrRef.current = savedTimeStr;
      lastSavedDataJsonRef.current = JSON.stringify(currentState);
      setSyncError(null);
      
      triggerToast('🔄 Sincronització completada amb èxit! Dades fusionades.');
    } catch (e: any) {
      console.error(e);
      const errMsg = e?.message || String(e);
      setSyncError(errMsg);
      triggerToast(`❌ Error al sincronitzar: ${errMsg.substring(0, 45)}...`);
    } finally {
      setIsSyncing(false);
    }
  };

  // URL Hash checks for both shared microcycles AND mobile photo upload links
  useEffect(() => {
    const applyPackedData = (packedData: any) => {
      setIsSharedMobile(true);
      if (packedData.compactSession && packedData.compactDrills) {
        setDrills(current => {
          const combined = [...current];
          (packedData.compactDrills as Drill[]).forEach(cd => {
            if (!combined.some(d => d.id === cd.id)) {
              combined.push(cd);
            }
          });
          return combined;
        });
        setSessions(current => ({
          ...current,
          [packedData.selectedSessionId]: packedData.compactSession
        }));
        setSelectedSessionId(packedData.selectedSessionId);
        setActiveView('mobile');
        window.history.replaceState('', document.title, window.location.pathname);
        triggerToast('📥 S’ha importat correctament l’entrenament compartit! S’ha obert el mode mòbil.');
      } else if (packedData.drills && packedData.sessions) {
        setDrills(packedData.drills);
        setSessions(packedData.sessions);
        if (packedData.selectedSessionId) {
          setSelectedSessionId(packedData.selectedSessionId);
        }
        // Redirect straight to mobile view for fast court access!
        setActiveView('mobile');
        // Clear hash to prevent reloading stale details when refreshing
        window.history.replaceState('', document.title, window.location.pathname);
        triggerToast('📥 S’ha importat correctament el llistat d’entrenament! S’ha obert el mode mòbil.');
      }
    };

    const handleHashRouter = () => {
      try {
        const hash = window.location.hash;
        if (hash) {
          if (hash.startsWith('#plan=')) {
            // Instantly transition to the responsive, high-performance 'mobile' view.
            // This prevents mobile browsers from showing slow/heavy desktop frames while the background request runs!
            setActiveView('mobile');
            const codeOrBase64 = hash.substring(6);
            if (codeOrBase64.length < 15) {
              // Fetch short shared session from server
              fetch(`/api/get-shared-session?code=${codeOrBase64}`)
                .then(r => {
                  if (!r.ok) {
                    throw new Error('Sessió no trobada');
                  }
                  return r.json();
                })
                .then(data => {
                  if (data && data.payload) {
                    applyPackedData(data.payload);
                  }
                })
                .catch(err => {
                  console.error('Failed to load short coded shared session', err);
                  triggerToast('❌ Error: El codi compartit no és vàlid o ha caducat.');
                });
            } else {
              // Legacy full base64 string
              const decodedStr = decodeURIComponent(escape(atob(codeOrBase64)));
              const packedData = JSON.parse(decodedStr);
              applyPackedData(packedData);
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse window hash parameters', e);
      }
    };

    handleHashRouter();
    window.addEventListener('hashchange', handleHashRouter);
    return () => window.removeEventListener('hashchange', handleHashRouter);
  }, []);

  // Generate direct mobile court QR link seamlessly connected with Firestore real-time cloud sync
  const handleGenerateShareCode = async () => {
    try {
      setIsSyncing(true);
      const nowIso = new Date().toISOString();
      const currentState = buildNormalizedState({
        drills,
        weeklyPlans,
        selectedWeeklyPlanId,
        selectedSessionId,
        completions,
        favoriteDrillIds,
        coachProfile,
        players,
        sessionTemplates,
        baremosConfig
      });
      const stateWithTimestamp = { ...currentState, updatedAt: nowIso };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateWithTimestamp));
        if (syncCode) {
          const savedTimeStr = await saveToCloud(syncCode, currentState);
          setLastSynced(new Date(savedTimeStr));
          lastSavedTimeStrRef.current = savedTimeStr;
          lastSavedDataJsonRef.current = JSON.stringify(currentState);
        }
      } catch (e) {
        console.warn('Sync before share warning:', e);
      } finally {
        setIsSyncing(false);
      }

      const activeCode = syncCode || DEFAULT_SYNC_CODE;
      const targetSession = selectedSessionId || 'dia1';
      const absoluteUrl = `${window.location.origin}${window.location.pathname}?sync=${encodeURIComponent(activeCode)}&view=mobile&session=${encodeURIComponent(targetSession)}`;
      setShareUrl(absoluteUrl);
      setShowShareModal(true);
      setCopied(false);
      triggerToast('📱 Codi QR de Pista generat! Escaneja amb el mòbil per obrir la sessió sincronitzada.');
    } catch (err) {
      console.error('Error generating share link:', err);
      const activeCode = syncCode || DEFAULT_SYNC_CODE;
      const absoluteUrl = `${window.location.origin}${window.location.pathname}?sync=${encodeURIComponent(activeCode)}&view=mobile`;
      setShareUrl(absoluteUrl);
      setShowShareModal(true);
      setCopied(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Manual Drill list manipulation operations
  const handleAddDrillToDatabase = (newDrill: Drill) => {
    setDrills(prev => [newDrill, ...prev]);
  };

  const handleEditDrillInDatabase = (updatedDrill: Drill) => {
    // 1. Update drill in drills library directly without duplicating
    setDrills(prev => prev.map(d => d.id === updatedDrill.id ? updatedDrill : d));

    // 2. Also update in any sessions containing this drill
    setSessions(prev => {
      let changed = false;
      const updated: Record<string, TrainingSession> = {};
      Object.keys(prev).forEach(key => {
        const sess = prev[key];
        let sessChanged = false;
        const newDrills = (sess.drills || []).map(sd => {
          if (sd.drillId === updatedDrill.id) {
            sessChanged = true;
            return {
              ...sd,
              duration: updatedDrill.duration || sd.duration
            };
          }
          return sd;
        });

        if (sessChanged) {
          changed = true;
          updated[key] = {
            ...sess,
            drills: newDrills,
            totalDuration: newDrills.reduce((acc, d) => acc + (d.duration || 10), 0)
          };
        } else {
          updated[key] = sess;
        }
      });
      return changed ? updated : prev;
    });
  };

  const handleDeleteDrillFromDatabase = (drillId: string) => {
    // Delete from list
    setDrills(prev => prev.filter(d => d.id !== drillId));
    // Remove references to this deleted drill from weekly schedules
    const sanitizeSession = (sess: TrainingSession): TrainingSession => {
      const filtered = sess.drills.filter(sd => sd.drillId !== drillId);
      return {
        ...sess,
        drills: filtered,
        totalDuration: filtered.reduce((acc, c) => acc + c.duration, 0)
      };
    };
    setSessions(prev => {
      const updated: Record<string, TrainingSession> = {};
      Object.keys(prev).forEach(key => {
        updated[key] = sanitizeSession(prev[key]);
      });
      return updated;
    });
  };

  // Weekly cycle multi-plan controllers
  const handleSelectWeeklyPlan = (planId: string) => {
    setSelectedWeeklyPlanId(planId);
  };

  const handleCreateWeeklyPlan = () => {
    const name = prompt('Introdueix el nom de la nova planificació de la temporada:', `Mes ${weeklyPlans.length + 1}: Nova Planificació`);
    if (!name) return;
    
    const newPlan: WeeklyPlan = {
      id: `plan-${Date.now()}`,
      name,
      startDate: new Date().toISOString().substring(0, 10),
      dia1: { id: 'dia1', name: `Sessió 1: Dimarts Setmana 1 (${name})`, dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
      dia2: { id: 'dia2', name: `Sessió 2: Dijous Setmana 1 (${name})`, dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
      dia3: { id: 'dia3', name: `Sessió 3: Dimarts Setmana 2 (${name})`, dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
      dia4: { id: 'dia4', name: `Sessió 4: Dijous Setmana 2 (${name})`, dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
      dia5: { id: 'dia5', name: `Sessió 5: Dimarts Setmana 3 (${name})`, dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
      dia6: { id: 'dia6', name: `Sessió 6: Dijous Setmana 3 (${name})`, dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
      dia7: { id: 'dia7', name: `Sessió 7: Dimarts Setmana 4 (${name})`, dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
      dia8: { id: 'dia8', name: `Sessió 8: Dijous Setmana 4 (${name})`, dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
    };
    
    setWeeklyPlans(prev => [...prev, newPlan]);
    setSelectedWeeklyPlanId(newPlan.id);
    triggerToast(`S'ha creat la planificació de la temporada "${name}" amb èxit!`);
  };

  const handleDeleteWeeklyPlan = (planId: string) => {
    if (weeklyPlans.length <= 1) {
      triggerToast('Sempre has de tenir almenys una planificació activa a la pantalla.');
      return;
    }
    const planToDelete = weeklyPlans.find(p => p.id === planId);
    if (!planToDelete) return;

    setPlanIdToDelete(planId);
  };

  const confirmDeleteWeeklyPlan = () => {
    if (!planIdToDelete) return;
    const planToDelete = weeklyPlans.find(p => p.id === planIdToDelete);
    if (planToDelete) {
      setWeeklyPlans(prev => {
        const remainingPlans = prev.filter(p => p.id !== planIdToDelete);
        if (selectedWeeklyPlanId === planIdToDelete) {
          const fallbackPlan = remainingPlans[0];
          setSelectedWeeklyPlanId(fallbackPlan.id);
        }
        return remainingPlans;
      });
      triggerToast(`Planificació "${planToDelete.name}" eliminada correctament.`);
    }
    setPlanIdToDelete(null);
  };

  // Plan scheduler callbacks
  const handleUpdateSession = (updatedSession: TrainingSession) => {
    setSessions(prev => ({
      ...prev,
      [updatedSession.id]: updatedSession
    }));
  };

  const handleDuplicateSession = (sourceSessionId: string, targetSessionId: string) => {
    let targetName = 'sessió';
    setSessions(prev => {
      const sourceSession = prev[sourceSessionId];
      const targetSession = prev[targetSessionId];
      if (!sourceSession || !targetSession) return prev;

      // Use a regex/split to retain target prefix structural details but copy source's actual content topic
      let sourceTopic = "Còpia";
      const parts = sourceSession.name.split(' - ');
      if (parts.length > 1) {
        sourceTopic = parts[1];
      }

      const targetPrefix = targetSession.name.split(' - ')[0];
      const newName = `${targetPrefix} - ${sourceTopic}`;
      targetName = targetSession.name.split(':')[0];

      const duplicatedSession: TrainingSession = {
        ...targetSession,
        name: newName,
        totalDuration: sourceSession.totalDuration,
        drills: sourceSession.drills.map(d => ({ ...d }))
      };

      return {
        ...prev,
        [targetSessionId]: duplicatedSession
      };
    });

    // Automatically navigate/select target session to give visual feedback
    setSelectedSessionId(targetSessionId);
    triggerToast(`🔄 Sessió duplicada correctament a la ${targetName}!`);
  };

  // Back up configuration package via local json download
  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ drills, sessions }));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `planificacion_basket_juniorA_${selectedSessionId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerToast('📥 S’ha descarregat la còpia de seguretat del teu planning!');
    } catch (e) {
      triggerToast('Error en exportar el fitxer d’entrenament.');
    }
  };

  // Upload configuration
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.drills && parsed.sessions) {
            setDrills(parsed.drills);
            setSessions(parsed.sessions);
            triggerToast('✅ Planificació i biblioteca de la temporada carregades amb èxit!');
          } else {
            triggerToast('⚠️ El fitxer escollit no té el format de planificació correcte.');
          }
        } catch (error) {
          triggerToast('💥 Error de lectura o descodificació del fitxer JSON.');
        }
      };
    }
  };

  // Helper calculation details
  const activeSession = sessions[selectedSessionId] || sessions['dia1'] || { id: 'dia1', name: 'Sessió de Recuperació', dayOfWeek: 'Martes', totalDuration: 75, drills: [] };
  const timeScheduledObj = (activeSession.drills || []).reduce((acc, d) => acc + d.duration, 0);

  return (
    <div id="app-workspace" className="min-h-screen bg-slate-150 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* MOBILE VIEW REDIRECT BANNER */}
      {!isSharedMobile && activeView !== 'mobile' && (
        <div id="mobile-redirect-banner" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 md:hidden shrink-0 shadow-sm relative z-50">
          <span>📱 Estàs fent servir un mòbil?</span>
          <button
            type="button"
            onClick={() => setActiveView('mobile')}
            className="bg-white text-orange-600 px-3 py-1 rounded-lg font-black uppercase text-[10px] shadow-sm tracking-wider hover:bg-orange-50 transition active:scale-95 cursor-pointer"
          >
            Obrir Modo Pista
          </button>
        </div>
      )}
      
      {/* GLOBAL GEOMETRIC BALANCE HEADER */}
      {!isSharedMobile && (
        <header id="global-header" className={`${activeView === 'mobile' ? 'hidden md:flex' : 'flex'} flex-col md:flex-row md:h-16 bg-white border-b border-slate-200 justify-between px-3.5 md:px-8 py-2.5 md:py-0 shrink-0 relative z-10 select-none gap-2.5 md:gap-0 md:items-center`}>
          
          {/* Row 1: Logo, Brand Title, Team Subtitle & Profile Avatar */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl overflow-hidden relative shadow-md border border-orange-500/40 group shrink-0 bg-slate-900">
                <img 
                  src={coachPinetyLogo} 
                  alt="Coach Pinety Logo" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition transform group-hover:scale-105" 
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm md:text-xl font-black tracking-tighter text-slate-900 leading-none truncate">COACH PINETY</h1>
                  <span className="bg-orange-500/10 text-orange-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">v1.2</span>
                </div>
                <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-bold mt-0.5 leading-none truncate">{coachProfile.team}</p>
              </div>
            </div>

            {/* Mobile Coach Avatar */}
            <div className="flex md:hidden items-center shrink-0">
              <button
                type="button"
                id="btn-coach-profile-avatar-mobile"
                onClick={() => setShowProfileModal(true)}
                className="relative cursor-pointer focus:outline-none"
                title="Editar Perfil d'Entrenador"
              >
                <img
                  src={coachProfile.avatar}
                  alt="Coach Profile Avatar"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border-2 border-orange-500 shadow-xs"
                />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>
            </div>
          </div>

          {/* Row 2 on Mobile (Grid of 3 buttons) / Inline controls on Desktop */}
          <div className="w-full md:w-auto pt-2 md:pt-0 border-t border-slate-150 md:border-none">
            {/* Mobile 3-column action row */}
            <div className="grid grid-cols-3 gap-1.5 md:hidden w-full">
              <button
                id="btn-header-players-mobile"
                onClick={() => setShowPlayerRosterModal(true)}
                title="Plantilla de Jugadors"
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 active:scale-95 transition text-[11px] font-extrabold rounded-md text-white flex items-center justify-center gap-1 uppercase tracking-wider shadow-xs"
              >
                <Users size={13} className="text-orange-400 shrink-0" />
                <span className="truncate">Jugadors</span>
              </button>

              <button
                id="btn-header-share-mobile"
                onClick={handleGenerateShareCode}
                title="Compartir QR Pista"
                className="py-1.5 px-2 bg-orange-500 hover:bg-orange-600 active:scale-95 transition text-[11px] font-extrabold rounded-md text-white flex items-center justify-center gap-1 uppercase tracking-wider shadow-xs"
              >
                <Share2 size={12} className="shrink-0" />
                <span className="truncate">Pista QR</span>
              </button>

              <button
                id="btn-header-sync-mobile"
                onClick={handleOpenSyncModal}
                title="Sincronització Núvol"
                className="py-1.5 px-2 bg-amber-500 hover:bg-amber-600 active:scale-95 transition text-[11px] font-extrabold rounded-md text-white flex items-center justify-center gap-1 uppercase tracking-wider shadow-xs"
              >
                <Cloud size={12} className={`shrink-0 ${isSyncing ? "animate-pulse" : ""}`} />
                <span className="truncate">Sync</span>
              </button>
            </div>

            {/* Desktop Action Row */}
            <div className="hidden md:flex items-center gap-2 md:gap-3">
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-sm">
                Temporada 26/27
              </span>
              <span className="bg-slate-100 px-3 py-1 rounded-full text-xs text-slate-600 font-medium">
                Sessió de Pista
              </span>

              <button
                id="btn-header-players"
                onClick={() => setShowPlayerRosterModal(true)}
                title="Plantilla de Jugadors i Valoracions Junior A"
                className="py-1.5 md:py-2 px-3.5 bg-slate-900 hover:bg-slate-800 active:scale-95 transition text-xs font-bold rounded-md text-white flex items-center gap-1.5 shadow-sm cursor-pointer uppercase tracking-wider"
              >
                <Users size={14} className="text-orange-400" />
                <span>Jugadors ({players.length})</span>
              </button>

              <button
                id="btn-header-share"
                onClick={handleGenerateShareCode}
                className="py-1.5 md:py-2 px-3.5 bg-orange-500 hover:bg-orange-600 active:scale-95 transition text-xs font-bold rounded-md text-white flex items-center gap-1.5 shadow-sm cursor-pointer uppercase tracking-wider"
              >
                <Share2 size={13} />
                <span>Pista QR</span>
              </button>

              <button
                id="btn-header-sync"
                onClick={handleOpenSyncModal}
                title="Sincronització automàtica Firestore"
                className="py-1.5 md:py-2 px-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 transition text-xs font-bold rounded-md text-white flex items-center gap-1.5 shadow-sm cursor-pointer uppercase tracking-wider"
              >
                <Cloud size={13} className={isSyncing ? "animate-pulse" : ""} />
                <span>Núvol Sync</span>
              </button>

              <button
                id="btn-header-force-save"
                onClick={handleForceSaveSession}
                title="Grabar i desar immediatament en memòria i núvol"
                className="py-1.5 md:py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition text-xs font-black rounded-md text-white flex items-center gap-1.5 shadow-sm cursor-pointer uppercase tracking-wider"
              >
                <Save size={13} />
                <span>Desar Sessió</span>
              </button>

              <button
                id="btn-header-export"
                onClick={handleExportJson}
                title="Descarregar còpia del pla"
                className="p-1.5 md:p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 cursor-pointer active:scale-95 transition shadow-xs"
              >
                <Download size={14} />
              </button>

              <label
                id="lbl-header-import-file"
                title="Pujar fitxer de planificació desat"
                className="p-1.5 md:p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-600 hover:text-slate-950 cursor-pointer active:scale-95 transition shadow-xs"
              >
                <Upload size={14} />
                <input
                  id="file-import-input"
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>

              {/* User Profile Custom Avatar */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-2.5 md:pl-3.5">
                <button
                  type="button"
                  id="btn-coach-profile-avatar"
                  onClick={() => setShowProfileModal(true)}
                  className="relative group cursor-pointer focus:outline-none"
                  title="Editar Perfil d'Entrenador"
                >
                  <img
                    src={coachProfile.avatar}
                    alt="Coach Profile Avatar"
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border-2 border-orange-500/80 shadow-xs hover:border-orange-600 transition duration-200"
                  />
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  
                  {/* Profile dropdown tooltip on hover */}
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-2 px-3 hidden group-hover:block transition duration-250 z-50 text-left">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Entrenador Actiu</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={coachProfile.email}>{coachProfile.name}</p>
                    <p className="text-[9px] font-medium text-slate-500 mt-0.5 truncate">{coachProfile.email}</p>
                    <div className="border-t border-slate-100 my-1.5" />
                    <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded text-center mb-1">{coachProfile.level}</p>
                    <p className="text-[9px] text-center text-slate-400 hover:text-orange-500 transition font-bold uppercase tracking-wider mt-1">Prem per editar ✎</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* QUICK SUB-INFOBANNER EXPLAINING COACH CONTROLS FOR FCBQ NIVEL A */}
      {!isSharedMobile && (
        <div id="sub-info-belt" className="bg-slate-50 border-b border-slate-200 py-2.5 px-6 md:px-8 shrink-0 text-xs hidden md:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span>Microcicle d'Entrenament Real de <strong>75 minuts (1h 15m)</strong> adaptat a competició Nivel A</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">Pista Interactiva • Canvis Autodesats</span>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT PAGE CONTENT VIEWPORT */}
      <main id="main-content-area" className={`flex-1 ${isSharedMobile || activeView === 'mobile' ? 'p-0 md:px-8 md:py-6 max-w-md md:max-w-7xl' : 'max-w-7xl px-4 py-6 md:px-8'} w-full mx-auto relative`}>
        
        {/* TAB WORKSPACE SEPARATION (planner, library database, mobile view slider) */}
        {!isSharedMobile && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
            
            {/* Visual Tabs selector - Beautifully aligned squared geometric grid on mobile */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/60 rounded-lg select-none w-full sm:w-auto">
              <button
                id="tab-planner"
                onClick={() => setActiveView('planner')}
                className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeView === 'planner' 
                    ? 'bg-white text-slate-900 shadow-xs border-b-2 border-orange-500' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar size={14} className={activeView === 'planner' ? 'text-orange-500' : 'text-slate-500'} />
                <span className="truncate">Planificar</span>
              </button>

              <button
                id="tab-database"
                onClick={() => setActiveView('database')}
                className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeView === 'database' 
                    ? 'bg-white text-slate-900 shadow-xs border-b-2 border-orange-500' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen size={14} className={activeView === 'database' ? 'text-orange-500' : 'text-slate-500'} />
                <span className="truncate">Biblioteca</span>
              </button>

              <button
                id="tab-creator"
                onClick={() => {
                  setEditingDrill(null);
                  setActiveView('creator');
                }}
                className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeView === 'creator' 
                    ? 'bg-white text-slate-900 shadow-xs border-b-2 border-orange-500' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles size={14} className={activeView === 'creator' ? 'text-orange-500' : 'text-slate-500'} />
                <span className="truncate">Creador</span>
              </button>

              <button
                id="tab-court-mode"
                onClick={() => setActiveView('mobile')}
                className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-md text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeView === 'mobile' 
                    ? 'bg-white text-slate-900 shadow-xs border-b-2 border-orange-500' 
                    : 'text-orange-600 hover:text-orange-850 hover:bg-orange-50'
                }`}
              >
                <Smartphone size={14} className="text-orange-500 animate-bounce" />
                <span className="truncate">Modo Pista</span>
              </button>
            </div>

          </div>
        )}

        {/* WORKSPACE TAB RENDERING */}
        {activeView === 'planner' ? (
          <div className="space-y-6">
            
            {/* UNIFIED CALENDARI DEL MICROCICLE & SESSIÓ ACTIVA CARD */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs space-y-3.5">
              
              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-150">
                <div className="flex items-center gap-2.5">
                  <div className="bg-orange-500/10 text-orange-600 p-2 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                        Calendari del Microcicle & Sessió Activa
                      </h2>
                      <span className="text-[9px] font-mono font-black text-orange-600 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded hidden sm:inline-block">
                        FCBQ STANDARD
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                      Gestió centralitzada de sessions d'entrenament i partits del microcicle
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMatchDateIndex(5);
                      setShowMatchModal(true);
                    }}
                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold rounded-md text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Obrir anotacions de partit en directe o post-partit"
                  >
                    <NotebookPen size={13} />
                    <span>Anotacions de Partit 🏀</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                    className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{isCalendarExpanded ? "▲ Amagar Matriu" : "▼ Mostrar Matriu"}</span>
                  </button>
                </div>
              </div>

              {/* Integrated Active Session Selector Strip */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-slate-50/90 border border-slate-200 p-2.5 rounded-lg">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] uppercase font-mono font-black text-slate-500 px-1 select-none flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    Sessió Activa:
                  </span>
                  <span className="text-xs font-black text-orange-700 font-mono bg-orange-100/90 px-2.5 py-1 rounded border border-orange-200/80 shadow-2xs">
                    S{selectedSessionId.replace('dia', '')} · {sessions[selectedSessionId]?.name || `Setm. ${Math.ceil(parseInt(selectedSessionId.replace('dia','')) / 2)}`}
                  </span>
                </div>

                {/* S1..S10 Direct Switcher Buttons */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/80">
                  {[
                    { id: 'dia1', label: 'S1', title: 'Dil 31 Ago' },
                    { id: 'dia2', label: 'S2', title: 'Dmc 2 Set' },
                    { id: 'dia3', label: 'S3', title: 'Dij 3 Set' },
                    { id: 'dia4', label: 'S4', title: 'Dim 8 Set' },
                    { id: 'dia5', label: 'S5', title: 'Dij 10 Set' },
                    { id: 'dia6', label: 'S6', title: 'Dim 15 Set' },
                    { id: 'dia7', label: 'S7', title: 'Dij 17 Set' },
                    { id: 'dia8', label: 'S8', title: 'Dim 22 Set' },
                    { id: 'dia9', label: 'S9', title: 'Dij 24 Set' },
                    { id: 'dia10', label: 'S10', title: 'Dim 29 Set' },
                  ].map((item) => {
                    const itemSession = sessions[item.id];
                    const isScheduled = !!itemSession?.scheduledTime;
                    const isSelected = selectedSessionId === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`btn-session-select-${item.id}`}
                        onClick={() => setSelectedSessionId(item.id)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all leading-tight shrink-0 text-center cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 text-white shadow-xs font-black ring-1 ring-orange-600'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{item.label}</span>
                          {isScheduled && (
                            <span 
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-200' : 'bg-emerald-500'}`} 
                              title="Sessió Planificada" 
                            />
                          )}
                        </div>
                        <div className={`text-[8px] font-mono tracking-tighter ${isSelected ? 'text-orange-100 font-medium' : 'text-slate-400'}`}>
                          {item.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {isCalendarExpanded && (
                <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                  <p className="text-[10px] text-slate-500 font-bold">Fes clic als dies d'entrenament (dilluns/dimecres/dimarts/dijous) o als caps de setmana per obrir les anotacions del partit:</p>
                  <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                    {/* Header days */}
                    {['Dil', 'Dim', 'Dmc', 'Dij', 'Div', 'Dis', 'Diu'].map(dayName => (
                      <div key={dayName} className="text-center py-1 text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono">
                        {dayName}
                      </div>
                    ))}

                    {/* 35 calendar squares starting Monday 31st August 2026 */}
                    {Array.from({ length: 35 }).map((_, i) => {
                      const dayOfWeekIndex = i % 7; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
                      const weekIndex = Math.floor(i / 7);
                      const isWeekend = dayOfWeekIndex >= 5; // Saturday/Sunday

                      let dayLabel = '';
                      if (i === 0) dayLabel = '31 Ago';
                      else if (i === 1) dayLabel = '1 Set';
                      else if (i <= 30) dayLabel = `${i}`;
                      else if (i === 31) dayLabel = '1 Oct';
                      else dayLabel = `${i - 30}`;

                      const SESSION_MAP: Record<number, { code: string; num: number }> = {
                        0: { code: 'dia1', num: 1 },
                        2: { code: 'dia2', num: 2 },
                        3: { code: 'dia3', num: 3 },
                        8: { code: 'dia4', num: 4 },
                        10: { code: 'dia5', num: 5 },
                        15: { code: 'dia6', num: 6 },
                        17: { code: 'dia7', num: 7 },
                        22: { code: 'dia8', num: 8 },
                        24: { code: 'dia9', num: 9 },
                        29: { code: 'dia10', num: 10 },
                      };

                      const sessionInfo = SESSION_MAP[i];
                      const sessionCode = sessionInfo?.code || '';
                      const sessionNum = sessionInfo?.num || 0;

                      const matchItem = activePlan.matchAnnotations?.[i.toString()];
                      const hasMatchData = Boolean(matchItem);

                      let bgStyle = "bg-slate-50 text-slate-700 hover:bg-slate-100";
                      let borderStyle = "border border-slate-200";
                      let content = null;

                      if (sessionCode) {
                        const isActive = selectedSessionId === sessionCode;
                        bgStyle = isActive 
                          ? "bg-orange-500 text-white shadow-xs relative scale-[1.01] z-5" 
                          : "bg-orange-50/70 text-slate-800 hover:bg-orange-100/95";
                        borderStyle = isActive 
                          ? "border border-orange-600 font-extrabold ring-2 ring-orange-200" 
                          : "border border-dashed border-orange-300";
                        content = (
                          <div className="mt-0.5 flex flex-col items-center">
                            <span className={`text-[7px] uppercase tracking-tight font-black truncate max-w-full px-1 py-0.5 rounded ${isActive ? 'bg-orange-750 text-white' : 'bg-orange-100 text-orange-850'}`}>
                              🏀 S{sessionNum}
                            </span>
                            <span className="text-[6px] block font-mono mt-0.5 truncate max-w-full leading-none opacity-90">Set. {weekIndex + 1}</span>
                          </div>
                        );
                      } else if (isWeekend) {
                        bgStyle = hasMatchData
                          ? "bg-amber-500 text-white shadow-xs font-bold scale-[1.01] hover:bg-amber-600"
                          : "bg-amber-50/80 hover:bg-amber-100/95 text-amber-900";
                        borderStyle = hasMatchData
                          ? "border border-amber-600 ring-2 ring-amber-300 font-extrabold"
                          : "border border-amber-300 border-dashed";
                        content = (
                          <div className="mt-0.5 flex flex-col items-center">
                            <span className={`text-[7px] uppercase tracking-tight font-black truncate max-w-full px-1 py-0.5 rounded ${hasMatchData ? 'bg-amber-950 text-amber-100' : 'bg-amber-200/90 text-amber-950'}`}>
                              {matchItem?.opponent ? `🏆 vs ${matchItem.opponent}` : '🏆 PARTIT'}
                            </span>
                            <span className="text-[6px] font-mono font-bold mt-0.5 block leading-none">
                              {matchItem?.ourScore !== undefined && matchItem?.opponentScore !== undefined
                                ? `${matchItem.ourScore}-${matchItem.opponentScore}`
                                : hasMatchData ? '📝 Anotat' : '📝 Anotar'}
                            </span>
                          </div>
                        );
                      } else {
                        content = (
                          <span className="text-[6px] font-mono text-slate-400 block mt-1 opacity-50 leading-none">Lliure</span>
                        );
                      }

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (sessionCode) {
                              setSelectedSessionId(sessionCode);
                            } else {
                              setSelectedMatchDateIndex(i);
                              setShowMatchModal(true);
                            }
                          }}
                          className={`p-1 min-h-[36px] sm:min-h-[40px] rounded transition-all duration-150 flex flex-col justify-between cursor-pointer ${bgStyle} ${borderStyle}`}
                        >
                          <span className="text-[8px] font-black font-mono self-start">{dayLabel}</span>
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <SessionPlanner
              session={activeSession}
              drills={drills}
              onChangeSession={handleUpdateSession}
              onNavigateToMobile={() => setActiveView('mobile')}
              onPreviewDrill={setPreviewDrill}
              completions={completions}
              activePlan={activePlan}
              onToggleCompleteSession={(sessId) => handleToggleCompleteSession(activePlan.id, sessId)}
              onAddRepetition={(sessId) => handleAddRepetition(activePlan.id, sessId)}
              onRemoveRepetition={handleRemoveRepetition}
              onClearRepetitions={(sessId) => handleClearCompletions(activePlan.id, sessId)}
              onDuplicateSession={handleDuplicateSession}
              allSessions={sessions}
              onDeleteDrill={handleDeleteDrillFromDatabase}
              triggerToast={triggerToast}
              favoriteDrillIds={favoriteDrillIds}
              onToggleFavorite={handleToggleFavoriteDrill}
              sessionTemplates={sessionTemplates}
              onApplyTemplateToSession={handleApplyTemplateToSession}
              onSaveCurrentSessionAsTemplate={handleSaveCurrentSessionAsTemplate}
              onCreateTemplateFromScratch={handleCreateTemplateFromScratch}
              onDeleteTemplate={handleDeleteTemplate}
              onOpenMatchNotes={(dateIdx) => {
                setSelectedMatchDateIndex(dateIdx !== undefined ? dateIdx : 5);
                setShowMatchModal(true);
              }}
              onForceSaveSession={handleForceSaveSession}
            />
          </div>
        ) : activeView === 'database' ? (
          <DrillDatabase
            drills={drills}
            onAddDrill={handleAddDrillToDatabase}
            onAddDrillToSession={handleAddDrillToSession}
            allSessions={sessions}
            selectedSessionId={selectedSessionId}
            onEditDrill={(drill) => {
              setEditingDrill(drill);
              setActiveView('creator');
            }}
            onDeleteDrill={handleDeleteDrillFromDatabase}
            triggerToast={triggerToast}
            favoriteDrillIds={favoriteDrillIds}
            onToggleFavorite={handleToggleFavoriteDrill}
            onOpenCreator={(drill) => {
              setEditingDrill(drill || null);
              setActiveView('creator');
            }}
          />
        ) : activeView === 'creator' ? (
          <DrillCreator
            editingDrill={editingDrill}
            initialDrill={editingDrill}
            onSaveDrill={(savedDrill) => {
              if (editingDrill) {
                // Directly update the existing drill without creating a copy
                handleEditDrillInDatabase({
                  ...savedDrill,
                  id: editingDrill.id
                });
                triggerToast(`Exercici "${savedDrill.title}" actualitzat correctament!`);
              } else if (drills.some(d => d.id === savedDrill.id)) {
                handleEditDrillInDatabase(savedDrill);
                triggerToast(`Exercici "${savedDrill.title}" actualitzat correctament!`);
              } else {
                handleAddDrillToDatabase(savedDrill);
                triggerToast(`Exercici "${savedDrill.title}" creat a la biblioteca!`);
              }
              setEditingDrill(null);
              setActiveView('database');
            }}
            onCancel={() => {
              setEditingDrill(null);
              setActiveView('database');
            }}
            onNavigateToLibrary={() => {
              setEditingDrill(null);
              setActiveView('database');
            }}
          />
        ) : (
          <div className={`${isSharedMobile || activeView === 'mobile' ? 'p-0' : 'py-2'}`}>
            <MobileCourtView
              session={activeSession}
              allSessions={sessions}
              selectedSessionId={selectedSessionId}
              drills={drills}
              onBackToPlanner={() => setActiveView('planner')}
              onNavigateView={setActiveView}
              onAddDrillToSession={handleAddDrillToSession}
              favoriteDrillIds={favoriteDrillIds}
              onToggleFavorite={handleToggleFavoriteDrill}
              onPreviewDrill={setPreviewDrill}
              isSharedMobile={isSharedMobile}
              onUpdateSession={handleUpdateSession}
              onSelectSessionId={setSelectedSessionId}
              onAddDrill={handleAddDrillToDatabase}
              completions={completions}
              onToggleCompleteSession={(sessId) => handleToggleCompleteSession(activePlan?.id || 'plan-default', sessId)}
              activePlanId={activePlan?.id || 'plan-default'}
              syncCode={syncCode}
              isLinked={isLinked}
              onOpenSync={handleOpenSyncModal}
              isSyncing={isSyncing}
              lastSynced={lastSynced}
              onForceSaveSession={handleForceSaveSession}
            />
          </div>
        )}
      </main>

      {/* FLOATING SYSTEM QR SHARING POPUP */}
      {showShareModal && (
        <div id="modal-backdrop" className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs select-none">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 max-w-md w-full relative space-y-4 animate-in fade-in zoom-in duration-200">
            
            <button
              id="btn-close-share-modal"
              onClick={() => setShowShareModal(false)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-105 transition text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <QrCode size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Escanea para Consultar en Pista</h3>
              <p className="text-xs text-slate-450 leading-relaxed font-sans">
                Transfiere este plan de 75′ a tu teléfono al instante. Escanea el código QR o copia el enlace de abajo.
              </p>
            </div>

            {/* Rendered Google Chart dynamic QR engine */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-center aspect-square max-w-56 mx-auto shadow-inner">
              <img
                id="img-shared-qr"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                alt="QR Compartir Celular"
                className="w-full h-full object-contain mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Copier link button */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  id="input-share-link-preview"
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] text-slate-500 font-mono flex-1 focus:outline-none"
                />
                <button
                  id="btn-copy-share-link"
                  onClick={copyToClipboard}
                  className="px-3.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition active:scale-95 flex items-center justify-center cursor-pointer py-1.5 shrink-0 min-w-24"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : 'Copiar'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic text-center text-rose-500">
                ⚠️ Abre el enlace en tu móvil. Se abrirá directamente en "Modo Pista" con el cronómetro de 75'.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CLOUD SYNC POPUP (FIRESTORE) */}
      {showSyncModal && (() => {
        const syncUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?sync=${syncCode}` : '';
        return (
          <div id="sync-modal-backdrop" className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs select-none">
            <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 max-w-md w-full relative space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              
              <button
                id="btn-close-sync-modal"
                onClick={() => setShowSyncModal(false)}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Cloud size={24} className={isSyncing ? "animate-bounce" : ""} />
                </div>
                <h3 className="text-base font-bold text-slate-800">Sincronització al Núvol (Firestore)</h3>
                <p className="text-xs text-slate-450 leading-relaxed font-sans">
                  Sincronitza els teus exercicis creats, planificacions de temporada i històric automàticament i en temps real entre els teus dispositius.
                </p>
              </div>

              {/* ACTIVE SYNC CODE & QR CARD */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-center space-y-3">
                <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-widest font-mono block">El teu codi de sincronització actiu</span>
                
                <div className="text-2xl font-black text-amber-950 tracking-wider font-mono select-all">
                  {syncCode || 'Generant...'}
                </div>

                {syncCode && (
                  <div className="space-y-2 py-2">
                    <p className="text-[10px] text-slate-500 font-bold">
                      📸 Escaneja amb el mòbil per enllaçar a l'instant:
                    </p>
                    <div className="bg-white border border-slate-100 p-2 rounded-xl flex items-center justify-center aspect-square max-w-40 mx-auto shadow-sm">
                      <img
                        id="img-sync-qr"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(syncUrl)}`}
                        alt="QR d'enllaç de sincronització"
                        className="w-full h-full object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (typeof navigator !== 'undefined') {
                        navigator.clipboard.writeText(syncUrl);
                        triggerToast('📋 Enllaç copiat! Envia’l per WhatsApp/Email o obre’l al mòbil.');
                      }
                    }}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Copiar enllaç directe de sincronització
                  </button>

                  {lastSynced && (
                    <div className="text-[9px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Desat darrer cop: {lastSynced.toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {syncError && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-left space-y-1.5 mt-2">
                    <span className="text-[10px] text-red-750 font-extrabold uppercase tracking-widest font-mono flex items-center gap-1">
                      ⚠️ Alerta de Sincronització
                    </span>
                    <p className="text-[10px] text-red-650 leading-normal font-sans font-semibold">
                      La connexió amb la base de dades no s'ha pogut establir o està offline:
                    </p>
                    <div className="bg-red-100/50 rounded p-1.5 font-mono text-[9px] text-red-800 break-all select-all">
                      {syncError}
                    </div>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      💡 <strong>Consell:</strong> Comprova que tinguis connexió a internet al mòbil. L'aplicació continuarà funcionant correctament desant tot en local, i es sincronitzarà automàticament quan recuperi la connexió.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-amber-100/50">
                  <button
                    id="btn-force-save-cloud"
                    onClick={handleForceSaveToCloud}
                    disabled={isSyncing || !syncCode}
                    className="py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
                    Sincronitzar ara
                  </button>
                  <button
                    id="btn-unlink-sync"
                    onClick={handleUnlinkSyncCode}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-900 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Desvincular actiu
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-105 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700">Enllaçar un altre dispositiu o recuperar dades</h4>
                
                {/* DETAILED PAIRING ASSISTANT TIP CARD */}
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-[10px] text-amber-900 leading-relaxed space-y-1">
                  <p className="font-bold">💡 Vols veure els exercicis de l'ordinador al teu mòbil?</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-amber-800 font-sans">
                    <li>Obre el planificador al teu <span className="font-semibold">ordinador</span>.</li>
                    <li>Prem la icona del <span className="font-semibold">núvol groc/taronja</span> (dalt a la dreta).</li>
                    <li>Anota el codi de 4 lletres que hi apareix (Ex: <strong className="font-mono">ABCD</strong>).</li>
                    <li>Escriu aquest codi de l'ordinador aquí sota i prem <span className="font-semibold">Enllaçar</span>.</li>
                  </ol>
                </div>

                <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                  Escriu el codi de sincronització de l'altre dispositiu per connectar-los. Pots escriure el codi sencer (Ex: <strong>PINETY-ABCD</strong>) o només les darreres 4 lletres (Ex: <strong>ABCD</strong>):
                </p>
                
                <div className="flex gap-2">
                  <input
                    id="input-sync-code"
                    type="text"
                    placeholder="Ex: PINETY-JUNIORA o ABCD"
                    value={inputSyncCode}
                    onChange={(e) => setInputSyncCode(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono flex-1 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                  />
                  <button
                    id="btn-sync-submit"
                    onClick={() => handleLoadCloudData(inputSyncCode)}
                    disabled={isSyncing}
                    className="px-4 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-amber-700 transition active:scale-95 flex items-center justify-center cursor-pointer py-2 shrink-0 disabled:opacity-50"
                  >
                    {isSyncing ? 'Sincronitzant...' : 'Enllaçar'}
                  </button>
                </div>

                <button
                  id="btn-use-default-sync-code"
                  type="button"
                  onClick={() => handleLoadCloudData(DEFAULT_SYNC_CODE)}
                  disabled={isSyncing}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-bold text-[11px] rounded-xl transition border border-emerald-200/80 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs mt-2"
                >
                  💚 Vincular al Codi Predeterminat de l'Equip ({DEFAULT_SYNC_CODE})
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* FLOATING CONFIRM PLAN DELETE MODAL */}
      {planIdToDelete && (() => {
        const planToDelete = weeklyPlans.find(p => p.id === planIdToDelete);
        return (
          <div id="delete-plan-modal-backdrop" className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs select-none">
            <div className="bg-[#fdfbf7] border-2 border-slate-200 rounded-3xl shadow-2xl p-6 max-w-sm w-full relative space-y-4 text-center animate-in fade-in zoom-in duration-150">
              <span className="text-3xl block">⚠️</span>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Eliminar planificació de temporada?</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Estàs completament segur que vols eliminar definitivament la planificació <span className="text-rose-600 font-extrabold">"{planToDelete?.name}"</span>?<br/>
                Tots els seus entrenaments i observacions es perdran per sempre.
              </p>
              <div className="flex items-center gap-3 justify-center pt-2">
                <button
                  type="button"
                  id="btn-confirm-delete-plan-yes"
                  onClick={confirmDeleteWeeklyPlan}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
                >
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-plan-no"
                  onClick={() => setPlanIdToDelete(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  No, mantenir
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FLOATING RETRO DYNAMIC TOAST ALERTS */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-750 text-white rounded-none px-4 py-3 shadow-2xl flex items-center gap-3 max-w-sm animate-bounce" style={{ borderLeft: '4px solid #f97316' }}>
          <div className="flex-1">
            <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-0.5">NOTIFICACIÓ</span>
            <span className="text-xs font-bold leading-normal text-slate-100">{toastMessage}</span>
          </div>
          <button 
            type="button"
            onClick={() => setToastMessage(null)} 
            className="text-slate-400 hover:text-white text-[9px] font-black uppercase border border-slate-700 px-2 py-1 rounded-none ml-2 shrink-0 transition"
          >
            OK
          </button>
        </div>
      )}

      {/* FLOATING COACH PROFILE EDITOR POPUP */}
      {showProfileModal && (
        <CoachProfileModal
          profile={coachProfile}
          onSave={(updatedProfile) => {
            setCoachProfile(updatedProfile);
            setShowProfileModal(false);
            triggerToast('✅ Canvis al perfil de l’entrenador actualitzats!');
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* MATCH ANNOTATIONS MODAL */}
      {showMatchModal && (
        <MatchAnnotationsModal
          isOpen={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          activePlan={activePlan}
          initialDateIndex={selectedMatchDateIndex}
          onSaveAnnotation={handleSaveMatchAnnotation}
          onDeleteAnnotation={handleDeleteMatchAnnotation}
          triggerToast={triggerToast}
        />
      )}

      {/* PLAYER ROSTER & EVALUATIONS MODAL */}
      {showPlayerRosterModal && (
        <PlayerRosterModal
          isOpen={showPlayerRosterModal}
          onClose={() => setShowPlayerRosterModal(false)}
          players={players}
          onAddPlayer={handleAddPlayer}
          onUpdatePlayer={handleUpdatePlayer}
          onDeletePlayer={handleDeletePlayer}
          baremosConfig={baremosConfig}
          onUpdateBaremosConfig={(newBaremos) => {
            setBaremosConfig(newBaremos);
            try {
              localStorage.setItem('coachboard_baremos_config', JSON.stringify(newBaremos));
            } catch (e) {}
            syncStateToCloudImmediately({ baremosConfig: newBaremos });
          }}
          triggerToast={triggerToast}
        />
      )}

      {/* FOOTER GENERAL BRANDING CREDITS */}
      <footer id="general-foot-tag" className="bg-slate-900 border-t border-slate-800 py-3.5 text-center text-xs text-slate-500 shrink-0">
        <p className="text-slate-450">© 2026 CoachBoard Junior A • Federación Catalana de Baloncesto (FCBQ) Nivel A Standards</p>
      </footer>

      {/* DETAILED BOOKLET DRILL MANUAL OVERLAY */}
      {previewDrill && (
        <DrillManualBooklet 
          drill={previewDrill} 
          onClose={() => setPreviewDrill(null)} 
          onAddToSession={(targetSessId, note) => {
            handleAddDrillToSession(previewDrill.id, targetSessId, note);
          }}
          allSessions={sessions}
          selectedSessionId={selectedSessionId}
        />
      )}
    </div>
  );
}
