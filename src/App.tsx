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
  User
} from 'lucide-react';
import { Drill, TrainingSession, AppState, WeeklyPlan, SessionCompletion } from './types';
import SessionPlanner from './components/SessionPlanner';
import DrillDatabase, { PRE_POPULATED_DRILLS } from './components/DrillDatabase';
import MobileCourtView from './components/MobileCourtView';
import DrillManualBooklet from './components/DrillManualBooklet';
import CoachProfileModal from './components/CoachProfileModal';
import { generateSyncCode, saveToCloud, loadFromCloud, subscribeToCloud, CoachProfile } from './lib/firebase';

const LOCAL_STORAGE_KEY = 'basket_planner_junior_a_state';

const DEFAULT_COACH_PROFILE: CoachProfile = {
  name: "David Pino",
  email: "dpinogay@gmail.com",
  team: "Junior Masculí • Nivell A (FCBQ)",
  level: "Júnior A • FCBQ",
  avatar: "/src/assets/images/coach_avatar_profile_1782414908020.jpg"
};

const DEFAULT_SESSIONS = {
  dia1: { 
    id: 'dia1', 
    name: 'Sessió 1: Dimarts Setmana 1 - Ritme de Transició', 
    dayOfWeek: 'Martes', 
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
    name: 'Sessió 2: Dijous Setmana 1 - Defensa de l’1v1', 
    dayOfWeek: 'Jueves', 
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
  dia3: { id: 'dia3', name: 'Sessió 3: Dimarts Setmana 2 - Transició i Joc Continu', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
  dia4: { id: 'dia4', name: 'Sessió 4: Dijous Setmana 2 - Pick & Roll Situacions', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
  dia5: { id: 'dia5', name: 'Sessió 5: Dimarts Setmana 3 - Construcció del Contraatac', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
  dia6: { id: 'dia6', name: 'Sessió 6: Dijous Setmana 3 - Defensa d’Ajudes Col·lectives', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
  dia7: { id: 'dia7', name: 'Sessió 7: Dimarts Setmana 4 - Presió a Tot Camp', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
  dia8: { id: 'dia8', name: 'Sessió 8: Dijous Setmana 4 - Roda de Tir Prepartit i Ajustos', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
};

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
      
      // Auto-generate on first-ever load so every device is ready
      const newCode = generateSyncCode();
      localStorage.setItem('basket_planner_sync_code', newCode);
      return newCode;
    } catch (e) {}
    return '';
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
          return parsed.weeklyPlans;
        }
        // Migration from old single "sessions"
        if (parsed.sessions) {
          return [{
            id: 'plan-default',
            name: 'Planificació Mensual: Transició i Defensa Base',
            startDate: new Date().toISOString().substring(0, 10),
            dia1: parsed.sessions.dia1 || DEFAULT_SESSIONS.dia1,
            dia2: parsed.sessions.dia2 || DEFAULT_SESSIONS.dia2,
            dia3: parsed.sessions.dia3 || DEFAULT_SESSIONS.dia3,
            dia4: parsed.sessions.dia4 || DEFAULT_SESSIONS.dia4,
            dia5: parsed.sessions.dia5 || DEFAULT_SESSIONS.dia5,
            dia6: parsed.sessions.dia6 || DEFAULT_SESSIONS.dia6,
            dia7: parsed.sessions.dia7 || DEFAULT_SESSIONS.dia7,
            dia8: parsed.sessions.dia8 || DEFAULT_SESSIONS.dia8,
          }];
        }
      }
    } catch (e) {
      console.error('Error loading weeklyPlans from localstorage', e);
    }
    return [
      {
        id: 'plan-default',
        name: 'Planificació Mensual: Transició i Defensa Base',
        startDate: new Date().toISOString().substring(0, 10),
        dia1: DEFAULT_SESSIONS.dia1,
        dia2: DEFAULT_SESSIONS.dia2,
        dia3: DEFAULT_SESSIONS.dia3,
        dia4: DEFAULT_SESSIONS.dia4,
        dia5: DEFAULT_SESSIONS.dia5,
        dia6: DEFAULT_SESSIONS.dia6,
        dia7: DEFAULT_SESSIONS.dia7,
        dia8: DEFAULT_SESSIONS.dia8,
      }
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
      dia3: fallbackPlan.dia3 || { id: 'dia3', name: 'Sessió 3: Dimarts Setmana 2 - Transició i Joc Continu', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
      dia4: fallbackPlan.dia4 || { id: 'dia4', name: 'Sessió 4: Dijous Setmana 2 - Pick & Roll Situacions', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
      dia5: fallbackPlan.dia5 || { id: 'dia5', name: 'Sessió 5: Dimarts Setmana 3 - Construcció del Contraatac', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
      dia6: fallbackPlan.dia6 || { id: 'dia6', name: 'Sessió 6: Dijous Setmana 3 - Defensa d’Ajudes Col·lectives', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
      dia7: fallbackPlan.dia7 || { id: 'dia7', name: 'Sessió 7: Dimarts Setmana 4 - Presió a Tot Camp', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
      dia8: fallbackPlan.dia8 || { id: 'dia8', name: 'Sessió 8: Dijous Setmana 4 - Roda de Tir Prepartit i Ajustos', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
    };
  }, [activePlan, weeklyPlans]);

  // Custom setSessions wrapper that writes modifications directly into the active slice of weeklyPlans
  const setSessions = (newSessionsValOrFn: any) => {
    setWeeklyPlans(prevPlans => prevPlans.map(plan => {
      if (plan.id === selectedWeeklyPlanId) {
        const currentFullSessions = {
          dia1: plan.dia1,
          dia2: plan.dia2,
          dia3: plan.dia3 || { id: 'dia3', name: 'Sessió 3: Dimarts Setmana 2 - Transició i Joc Continu', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
          dia4: plan.dia4 || { id: 'dia4', name: 'Sessió 4: Dijous Setmana 2 - Pick & Roll Situacions', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
          dia5: plan.dia5 || { id: 'dia5', name: 'Sessió 5: Dimarts Setmana 3 - Construcció del Contraatac', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
          dia6: plan.dia6 || { id: 'dia6', name: 'Sessió 6: Dijous Setmana 3 - Defensa d’Ajudes Col·lectives', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
          dia7: plan.dia7 || { id: 'dia7', name: 'Sessió 7: Dimarts Setmana 4 - Presió a Tot Camp', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
          dia8: plan.dia8 || { id: 'dia8', name: 'Sessió 8: Dijous Setmana 4 - Roda de Tir Prepartit i Ajustos', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
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
        };
      }
      return plan;
    }));
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
  const [planIdToDelete, setPlanIdToDelete] = useState<string | null>(null);

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

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => current === msg ? null : current);
    }, 4500);
  };

  // Load from cloud or URL parameter on startup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSyncCode = params.get('sync');
    
    let codeToUse = urlSyncCode || localStorage.getItem('basket_planner_sync_code');
    
    if (urlSyncCode) {
      let sanitized = urlSyncCode.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
      if (!sanitized.startsWith('PINETY-') && sanitized.length === 4) {
        sanitized = `PINETY-${sanitized}`;
      }
      codeToUse = sanitized;
      setSyncCode(sanitized);
      localStorage.setItem('basket_planner_sync_code', sanitized);
      localStorage.setItem('basket_planner_sync_code_manually_entered', 'true');
      
      // Clean up URL parameter to avoid bookmark/refresh loops with old parameters
      try {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      } catch (e) {}
    }

    if (codeToUse) {
      setIsSyncing(true);
      loadFromCloud(codeToUse)
        .then(cloudData => {
          if (cloudData) {
            setDrills(prevLocal => {
              const cloudDrills = cloudData.drills || [];
              if (cloudDrills.length === 0) return prevLocal;
              
              // MERGE: Keep any locally added custom drills that are not in the cloud
              const merged = [...cloudDrills];
              prevLocal.forEach(localDrill => {
                if (localDrill.isCustom && !merged.some(cd => cd.id === localDrill.id)) {
                  merged.push(localDrill);
                }
              });
              return merged;
            });

            if (cloudData.weeklyPlans && cloudData.weeklyPlans.length > 0) setWeeklyPlans(cloudData.weeklyPlans);
            if (cloudData.selectedWeeklyPlanId) setSelectedWeeklyPlanId(cloudData.selectedWeeklyPlanId);
            if (cloudData.selectedSessionId) setSelectedSessionId(cloudData.selectedSessionId);
            if (cloudData.completions) setCompletions(cloudData.completions);
            if (cloudData.favoriteDrillIds) setFavoriteDrillIds(cloudData.favoriteDrillIds);
            if (cloudData.coachProfile) setCoachProfile(cloudData.coachProfile);
            
            setSyncCode(codeToUse);
            if (cloudData.updatedAt) {
              setLastSynced(new Date(cloudData.updatedAt));
              lastSavedTimeStrRef.current = cloudData.updatedAt;
            } else {
              setLastSynced(new Date());
              lastSavedTimeStrRef.current = null;
            }
            triggerToast('🔄 Dades sincronitzades correctament des del núvol!');
          } else {
            // Document doesn't exist yet, we will save the current data for it
            setSyncCode(codeToUse);
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
      // If there is no code, we generate one
      const newCode = generateSyncCode();
      setSyncCode(newCode);
      localStorage.setItem('basket_planner_sync_code', newCode);
      setHasLoadedFromCloud(true);
    }
  }, []);

  // Auto-save changes to cloud
  useEffect(() => {
    if (!hasLoadedFromCloud || !syncCode) return;

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const savedTimeStr = await saveToCloud(syncCode, {
          drills,
          weeklyPlans,
          selectedWeeklyPlanId,
          selectedSessionId,
          completions,
          favoriteDrillIds,
          coachProfile
        });
        setLastSynced(new Date(savedTimeStr));
        lastSavedTimeStrRef.current = savedTimeStr;
        setSyncError(null);
      } catch (e: any) {
        console.warn('Auto-save to cloud failed:', e);
        setSyncError(e?.message || String(e));
      } finally {
        setIsSyncing(false);
      }
    }, 2000); // reduced timeout to 2 seconds for faster cloud backup response

    return () => clearTimeout(timer);
  }, [drills, weeklyPlans, selectedWeeklyPlanId, selectedSessionId, completions, favoriteDrillIds, coachProfile, syncCode, hasLoadedFromCloud]);

  // Listen for real-time changes from the cloud (Firestore onSnapshot)
  useEffect(() => {
    if (!syncCode || !hasLoadedFromCloud) return;

    const unsubscribe = subscribeToCloud(syncCode, (cloudData) => {
      if (!cloudData) return;

      // Check if cloudData is actually newer than our last saved/synced updatedAt timestamp
      // Comparing raw strings avoids any client clock skew or timezone offsets.
      if (cloudData.updatedAt && lastSavedTimeStrRef.current && cloudData.updatedAt === lastSavedTimeStrRef.current) {
        // This update is our own write (or we already applied it), skip updating to avoid local reset
        return;
      }

      // If we are actively saving (isSyncing is true), let's skip to avoid overwrite loops
      if (isSyncing) return;

      // Update local state from cloud
      if (cloudData.drills && cloudData.drills.length > 0) {
        setDrills(prevLocal => {
          const cloudDrills = cloudData.drills || [];
          if (cloudDrills.length === 0) return prevLocal;
          
          // MERGE: Keep any locally added custom drills that are not in the cloud
          const merged = [...cloudDrills];
          prevLocal.forEach(localDrill => {
            if (localDrill.isCustom && !merged.some(cd => cd.id === localDrill.id)) {
              merged.push(localDrill);
            }
          });
          return merged;
        });
      }

      if (cloudData.weeklyPlans && cloudData.weeklyPlans.length > 0) {
        setWeeklyPlans(cloudData.weeklyPlans);
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

      if (cloudData.updatedAt) {
        setLastSynced(new Date(cloudData.updatedAt));
        lastSavedTimeStrRef.current = cloudData.updatedAt;
      } else {
        const fallbackNow = new Date();
        setLastSynced(fallbackNow);
        lastSavedTimeStrRef.current = fallbackNow.toISOString();
      }
      
      // Silent in-background synchronization (no continuous toasts to prevent UX noise)
      console.log('🔄 Sincronització en segon pla completada correctament.');
    });

    return () => unsubscribe();
  }, [syncCode, hasLoadedFromCloud, isSyncing]);

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
        setDrills(prevLocal => {
          const cloudDrills = cloudData.drills || [];
          if (cloudDrills.length === 0) return prevLocal;
          
          // MERGE: Keep any locally added custom drills that are not in the cloud
          const merged = [...cloudDrills];
          prevLocal.forEach(localDrill => {
            if (localDrill.isCustom && !merged.some(cd => cd.id === localDrill.id)) {
              merged.push(localDrill);
            }
          });
          return merged;
        });

        if (cloudData.weeklyPlans && cloudData.weeklyPlans.length > 0) setWeeklyPlans(cloudData.weeklyPlans);
        if (cloudData.selectedWeeklyPlanId) setSelectedWeeklyPlanId(cloudData.selectedWeeklyPlanId);
        if (cloudData.selectedSessionId) setSelectedSessionId(cloudData.selectedSessionId);
        if (cloudData.completions) setCompletions(cloudData.completions);
        if (cloudData.favoriteDrillIds) setFavoriteDrillIds(cloudData.favoriteDrillIds);
        if (cloudData.coachProfile) setCoachProfile(cloudData.coachProfile);
        
        setSyncCode(sanitizedCode);
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
      saveToCloud(syncCode, {
        drills,
        weeklyPlans,
        selectedWeeklyPlanId,
        selectedSessionId,
        completions,
        favoriteDrillIds
      }).then((savedTimeStr) => {
        setLastSynced(new Date(savedTimeStr));
      }).catch(e => {
        console.warn('Auto-save on opening sync modal failed:', e);
      }).finally(() => {
        setIsSyncing(false);
      });
    }
  };

  const handleUnlinkSyncCode = () => {
    setSyncCode('');
    localStorage.removeItem('basket_planner_sync_code');
    localStorage.removeItem('basket_planner_sync_code_manually_entered');
    setLastSynced(null);
    triggerToast('🔌 Codi de sincronització desvinculat.');
  };

  // Force save to cloud manually
  const handleForceSaveToCloud = async () => {
    if (!syncCode || !hasLoadedFromCloud) return;
    setIsSyncing(true);
    try {
      const savedTimeStr = await saveToCloud(syncCode, {
        drills,
        weeklyPlans,
        selectedWeeklyPlanId,
        selectedSessionId,
        completions,
        favoriteDrillIds
      });
      setLastSynced(new Date(savedTimeStr));
      setSyncError(null);
      triggerToast('☁️ Dades desades al núvol correctament!');
    } catch (e: any) {
      console.error(e);
      const errMsg = e?.message || String(e);
      setSyncError(errMsg);
      triggerToast(`❌ Error al desar al núvol: ${errMsg.substring(0, 45)}...`);
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

  // Save changes to localStorage (runs ONLY when actual configuration changes, NOT on every second stopwatch timer tick!)
  useEffect(() => {
    try {
      const dataToSave = {
        drills,
        weeklyPlans,
        selectedWeeklyPlanId,
        selectedSessionId,
        completions,
        favoriteDrillIds
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('Could not persist application configuration changes to localStorage. This is expected inside isolated mobile browsers/private sandbox frames:', e);
    }
  }, [drills, weeklyPlans, selectedWeeklyPlanId, selectedSessionId, completions, favoriteDrillIds]);

  // Generate compact, un-bloated mobile link
  // Generate compact, un-bloated mobile link using the server-side short URL service (protects QR sizes!)
  const handleGenerateShareCode = async () => {
    try {
      const activeSession = sessions[selectedSessionId] || sessions['dia1'] || { drills: [] };
      const scheduledDrillIds = new Set((activeSession.drills || []).map(d => d.drillId));
      
      // Keep only paths with coordinate points to avoid bloat, and only drills scheduled in activeSession
      const compactDrills = drills
        .filter(d => scheduledDrillIds.has(d.id))
        .map(d => {
          // If there are multiple boardStates in the drill, keep them but compact their paths too
          const compactBoardStates = (d.boardStates || []).map(state => ({
            ...state,
            pins: state.pins || [],
            paths: (state.paths || []).map(p => ({
              ...p,
              points: p.points ? p.points.slice(0, 30) : []
            }))
          }));

          return {
            ...d,
            boardState: {
              pins: d.boardState?.pins || [],
              paths: (d.boardState?.paths || []).map(p => ({
                ...p,
                points: p.points ? p.points.slice(0, 30) : []
              }))
            },
            boardStates: compactBoardStates
          };
        });

      const dataToPack = {
        compactSession: activeSession,
        compactDrills,
        selectedSessionId
      };

      const response = await fetch('/api/share-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: dataToPack })
      });

      if (!response.ok) {
        throw new Error('Sessió nos s’ha pogut desar al servidor');
      }

      const resJson = await response.json();
      if (!resJson.success || !resJson.code) {
        throw new Error('Codi de resposta no vàlid');
      }

      const absoluteUrl = `${window.location.origin}${window.location.pathname}?sync=${syncCode}#plan=${resJson.code}`;
      setShareUrl(absoluteUrl);
      setShowShareModal(true);
      setCopied(false);
    } catch (e) {
      console.warn('Could not store state in server, falling back to local base64 compression', e);
      // Fallback base64 link support (guarantees offline support!)
      try {
        const activeSession = sessions[selectedSessionId] || sessions['dia1'] || { drills: [] };
        const scheduledDrillIds = new Set((activeSession.drills || []).map(d => d.drillId));
        const compactDrills = drills
          .filter(d => scheduledDrillIds.has(d.id))
          .map(d => ({
            ...d,
            boardState: {
              pins: d.boardState?.pins || [],
              paths: (d.boardState?.paths || []).map(p => ({
                ...p,
                points: p.points ? p.points.slice(0, 30) : []
              }))
            }
          }));

        const dataToPack = {
          compactSession: activeSession,
          compactDrills,
          selectedSessionId
        };
        const jsonStr = JSON.stringify(dataToPack);
        const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
        const absoluteUrl = `${window.location.origin}${window.location.pathname}?sync=${syncCode}#plan=${base64Str}`;
        setShareUrl(absoluteUrl);
        setShowShareModal(true);
        setCopied(false);
      } catch (err) {
        console.error('Failed both server share and base64 compression', err);
        triggerToast('Error en generar l’enllaç de compartició.');
      }
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
    setDrills(prev => prev.map(d => d.id === updatedDrill.id ? updatedDrill : d));
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
        <header id="global-header" className={`${activeView === 'mobile' ? 'hidden md:flex' : 'flex'} h-16 bg-white border-b border-slate-200 items-center justify-between px-6 md:px-8 shrink-0 relative z-10 select-none`}>
          
          {/* Logo brand & Catalan basket descriptors */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 w-11 h-11 rounded-xl flex items-center justify-center text-white relative shadow-md border border-orange-400/20 group">
              <Dribbble strokeWidth={2.2} size={25} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-[spin_12s_linear_infinite]" />
              <div className="absolute -bottom-1 -right-1 bg-slate-950 text-white text-[8px] px-1 font-black rounded-full border border-orange-500 scale-90">
                A
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-xl font-black tracking-tighter text-slate-900 leading-none">COACH PINETY</h1>
                <span className="bg-orange-500/10 text-orange-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">v1.2</span>
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-bold mt-0.5 leading-none">{coachProfile.team}</p>
            </div>
          </div>

          {/* Core Controls & Share trigger */}
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden lg:inline-flex text-[11px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-sm">
              Temporada 23/24
            </span>
            <span className="hidden sm:inline-flex bg-slate-100 px-3 py-1 rounded-full text-xs text-slate-600 font-medium">
              Sessió de Pista
            </span>

            <button
              id="btn-header-share"
              onClick={handleGenerateShareCode}
              className="py-1.5 md:py-2 px-3.5 bg-orange-500 hover:bg-orange-600 active:scale-95 transition text-xs font-bold rounded-md text-white flex items-center gap-1.5 shadow-sm cursor-pointer uppercase tracking-wider"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">Pista QR</span>
              <span className="sm:hidden">QR</span>
            </button>

            <button
              id="btn-header-sync"
              onClick={handleOpenSyncModal}
              title="Sincronització automàtica Firestore"
              className="py-1.5 md:py-2 px-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 transition text-xs font-bold rounded-md text-white flex items-center gap-1.5 shadow-sm cursor-pointer uppercase tracking-wider"
            >
              <Cloud size={13} className={isSyncing ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">Núvol Sync</span>
              <span className="sm:hidden">Sync</span>
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
        {activeView !== 'mobile' && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            
            {/* Visual Tabs selector - Beautifully aligned geometric layout */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/60 rounded-md select-none self-start">
              <button
                id="tab-planner"
                onClick={() => setActiveView('planner')}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  activeView === 'planner' 
                    ? 'bg-white text-slate-900 shadow-xs border-b-2 border-orange-500' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar size={14} className={activeView === 'planner' ? 'text-orange-500' : 'text-slate-500'} />
                Planificar Sessions
              </button>

              <button
                id="tab-database"
                onClick={() => setActiveView('database')}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  activeView === 'database' 
                    ? 'bg-white text-slate-900 shadow-xs border-b-2 border-orange-500' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen size={14} className={activeView === 'database' ? 'text-orange-500' : 'text-slate-500'} />
                Biblioteca d'Exercicis
              </button>

              <button
                id="tab-court-mode"
                onClick={() => setActiveView('mobile')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                  activeView === 'mobile' 
                    ? 'bg-white text-slate-900 shadow-xs border-b-2 border-orange-500' 
                    : 'text-orange-600 hover:text-orange-850 hover:bg-orange-50'
                }`}
              >
                <Smartphone size={14} className="text-orange-500 animate-bounce" />
                ⚡ Modo Pista (Mòbil)
              </button>
            </div>

            {/* 8-Session Selection Bar (Tells coach exactly which session of the month they are editing) */}
            {activeView === 'planner' && (
              <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 p-1.5 rounded-md shadow-xs self-start md:self-auto max-w-full overflow-x-auto no-scrollbar">
                <span className="text-[10px] uppercase font-mono font-black text-slate-400 px-2 select-none shrink-0">Sessió Activa:</span>
                {[
                  { id: 'dia1', label: 'S1', title: 'Setm. 1 - DiM' },
                  { id: 'dia2', label: 'S2', title: 'Setm. 1 - DiJ' },
                  { id: 'dia3', label: 'S3', title: 'Setm. 2 - DiM' },
                  { id: 'dia4', label: 'S4', title: 'Setm. 2 - DiJ' },
                  { id: 'dia5', label: 'S5', title: 'Setm. 3 - DiM' },
                  { id: 'dia6', label: 'S6', title: 'Setm. 3 - DiJ' },
                  { id: 'dia7', label: 'S7', title: 'Setm. 4 - DiM' },
                  { id: 'dia8', label: 'S8', title: 'Setm. 4 - DiJ' },
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`btn-session-select-${item.id}`}
                    onClick={() => setSelectedSessionId(item.id)}
                    className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all leading-tight shrink-0 text-center cursor-pointer ${
                      selectedSessionId === item.id
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div>{item.label}</div>
                    <div className={`text-[8px] font-mono tracking-tighter ${selectedSessionId === item.id ? 'text-orange-100 font-medium' : 'text-slate-400'}`}>
                      {item.title}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WORKSPACE TAB RENDERING */}
        {activeView === 'planner' ? (
          <div className="space-y-6">
            
            {/* INTERACTIVE BASKETBALL TRAINING CALENDAR */}
            <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-500/10 text-orange-600 p-1.5 rounded-lg flex items-center justify-center">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Calendari del Microcicle</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">Control de sessions de la temporada de Júnior A</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                    className="py-1 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{isCalendarExpanded ? "▲ Amagar Calendari" : "▼ Mostrar Calendari"}</span>
                  </button>
                  <span className="text-[9px] font-mono font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded hidden sm:inline-block">
                    FCBQ STANDARD
                  </span>
                </div>
              </div>

              {isCalendarExpanded && (
                <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                  <p className="text-[10px] text-slate-500 font-bold">Fes clic en un dimarts o dijous actius per canviar de dia d'entrenament a l'instant:</p>
                  <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                    {/* Header days */}
                    {['Dil', 'Dim', 'Dmc', 'Dij', 'Div', 'Dis', 'Diu'].map(dayName => (
                      <div key={dayName} className="text-center py-1 text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono">
                        {dayName}
                      </div>
                    ))}

                    {/* 28 simulated calendar squares */}
                    {Array.from({ length: 28 }).map((_, i) => {
                      const dayNum = i + 1;
                      const dayOfWeekIndex = i % 7; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
                      const weekIndex = Math.floor(i / 7);
                      const isDay1 = dayOfWeekIndex === 1; // Tuesday
                      const isDay2 = dayOfWeekIndex === 3; // Thursday
                      const isWeekend = dayOfWeekIndex >= 5; // Saturday/Sunday

                      let sessionCode = '';
                      let sessionNum = 0;
                      if (isDay1) {
                        if (weekIndex === 0) { sessionCode = 'dia1'; sessionNum = 1; }
                        else if (weekIndex === 1) { sessionCode = 'dia3'; sessionNum = 3; }
                        else if (weekIndex === 2) { sessionCode = 'dia5'; sessionNum = 5; }
                        else if (weekIndex === 3) { sessionCode = 'dia7'; sessionNum = 7; }
                      } else if (isDay2) {
                        if (weekIndex === 0) { sessionCode = 'dia2'; sessionNum = 2; }
                        else if (weekIndex === 1) { sessionCode = 'dia4'; sessionNum = 4; }
                        else if (weekIndex === 2) { sessionCode = 'dia6'; sessionNum = 6; }
                        else if (weekIndex === 3) { sessionCode = 'dia8'; sessionNum = 8; }
                      }

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
                        bgStyle = "bg-slate-100/70 text-slate-400 font-medium";
                        content = (
                          <span className="text-[6px] uppercase font-bold text-slate-500 font-mono mt-1 block leading-none">
                            FCBQ 🏆
                          </span>
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
                            }
                          }}
                          className={`p-1 min-h-[36px] sm:min-h-[40px] rounded transition-all duration-150 flex flex-col justify-between cursor-pointer ${bgStyle} ${borderStyle}`}
                        >
                          <span className="text-[8px] font-black font-mono self-start">{dayNum}</span>
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
            />
          </div>
        ) : activeView === 'database' ? (
          <DrillDatabase
            drills={drills}
            onAddDrill={handleAddDrillToDatabase}
            onEditDrill={handleEditDrillInDatabase}
            onDeleteDrill={handleDeleteDrillFromDatabase}
            triggerToast={triggerToast}
            favoriteDrillIds={favoriteDrillIds}
            onToggleFavorite={handleToggleFavoriteDrill}
          />
        ) : (
          <div className={`${isSharedMobile || activeView === 'mobile' ? 'p-0' : 'py-2'}`}>
            <MobileCourtView
              session={activeSession}
              drills={drills}
              onBackToPlanner={() => setActiveView('planner')}
              onPreviewDrill={setPreviewDrill}
              isSharedMobile={isSharedMobile}
              onUpdateSession={handleUpdateSession}
              onAddDrill={handleAddDrillToDatabase}
              completions={completions}
              onToggleCompleteSession={(sessId) => handleToggleCompleteSession(activePlan?.id || 'plan-default', sessId)}
              activePlanId={activePlan?.id || 'plan-default'}
              syncCode={syncCode}
              onOpenSync={handleOpenSyncModal}
              isSyncing={isSyncing}
              lastSynced={lastSynced}
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
                <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                  Escriu el codi de sincronització de l'altre dispositiu per connectar-los. Pots escriure el codi sencer (Ex: <strong>PINETY-ABCD</strong>) o només les darreres 4 lletres (Ex: <strong>ABCD</strong>):
                </p>
                
                <div className="flex gap-2">
                  <input
                    id="input-sync-code"
                    type="text"
                    placeholder="Ex: PINETY-ABCD o ABCD"
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

      {/* FOOTER GENERAL BRANDING CREDITS */}
      <footer id="general-foot-tag" className="bg-slate-900 border-t border-slate-800 py-3.5 text-center text-xs text-slate-500 shrink-0">
        <p className="text-slate-450">© 2026 CoachBoard Junior A • Federación Catalana de Baloncesto (FCBQ) Nivel A Standards</p>
      </footer>

      {/* DETAILED BOOKLET DRILL MANUAL OVERLAY */}
      {previewDrill && (
        <DrillManualBooklet 
          drill={previewDrill} 
          onClose={() => setPreviewDrill(null)} 
        />
      )}
    </div>
  );
}
