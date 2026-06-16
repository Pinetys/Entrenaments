/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Camera,
  RefreshCw
} from 'lucide-react';
import { Drill, TrainingSession, AppState, WeeklyPlan } from './types';
import SessionPlanner from './components/SessionPlanner';
import DrillDatabase, { PRE_POPULATED_DRILLS } from './components/DrillDatabase';
import MobileCourtView from './components/MobileCourtView';
import DrillManualBooklet from './components/DrillManualBooklet';
import MobileUploadPortal from './components/MobileUploadPortal';

const LOCAL_STORAGE_KEY = 'basket_planner_junior_a_state';

const DEFAULT_SESSIONS = {
  dia1: { id: 'dia1', name: 'Sessió 1: Dimarts Setmana 1 - Ritme de Transició', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
  dia2: { id: 'dia2', name: 'Sessió 2: Dijous Setmana 1 - Defensa de l’1v1', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
  dia3: { id: 'dia3', name: 'Sessió 3: Dimarts Setmana 2 - Transició i Joc Continu', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
  dia4: { id: 'dia4', name: 'Sessió 4: Dijous Setmana 2 - Pick & Roll Situacions', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
  dia5: { id: 'dia5', name: 'Sessió 5: Dimarts Setmana 3 - Construcció del Contraatac', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
  dia6: { id: 'dia6', name: 'Sessió 6: Dijous Setmana 3 - Defensa d’Ajudes Col·lectives', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
  dia7: { id: 'dia7', name: 'Sessió 7: Dimarts Setmana 4 - Presió a Tot Camp', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
  dia8: { id: 'dia8', name: 'Sessió 8: Dijous Setmana 4 - Roda de Tir Prepartit i Ajustos', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
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

  // Derive sessions object elegantly with 8 days fallback compatibility
  const sessions: Record<string, TrainingSession> = {
    dia1: activePlan.dia1,
    dia2: activePlan.dia2,
    dia3: activePlan.dia3 || { id: 'dia3', name: 'Sessió 3: Dimarts Setmana 2 - Transició i Joc Continu', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
    dia4: activePlan.dia4 || { id: 'dia4', name: 'Sessió 4: Dijous Setmana 2 - Pick & Roll Situacions', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
    dia5: activePlan.dia5 || { id: 'dia5', name: 'Sessió 5: Dimarts Setmana 3 - Construcció del Contraatac', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
    dia6: activePlan.dia6 || { id: 'dia6', name: 'Sessió 6: Dijous Setmana 3 - Defensa d’Ajudes Col·lectives', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
    dia7: activePlan.dia7 || { id: 'dia7', name: 'Sessió 7: Dimarts Setmana 4 - Presió a Tot Camp', dayOfWeek: 'Martes', totalDuration: 0, drills: [] },
    dia8: activePlan.dia8 || { id: 'dia8', name: 'Sessió 8: Dijous Setmana 4 - Roda de Tir Prepartit i Ajustos', dayOfWeek: 'Jueves', totalDuration: 0, drills: [] },
  };

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
  const [activeView, setActiveView] = useState<string>('planner');
  const [isSharedMobile, setIsSharedMobile] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewDrill, setPreviewDrill] = useState<Drill | null>(null);
  
  // Mobile direct photo pairing code state
  const [mobilePairingCode, setMobilePairingCode] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => current === msg ? null : current);
    }, 4500);
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
        triggerToast('📥 S’ha importat correctament l’entrenament escanejat! S’ha obert el mode mòbil.');
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
          if (hash.startsWith('#upload-photo')) {
            const match = hash.match(/code=([^&]+)/);
            if (match && match[1]) {
              setMobilePairingCode(match[1].toUpperCase());
              setActiveView('mobile-upload-portal');
              return;
            }
          }
          if (hash.startsWith('#plan=')) {
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

  // Save changes to localStorage
  useEffect(() => {
    const dataToSave = {
      drills,
      weeklyPlans,
      selectedWeeklyPlanId,
      sessions,
      selectedSessionId
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  }, [drills, weeklyPlans, selectedWeeklyPlanId, sessions, selectedSessionId]);

  // Generate compact, un-bloated mobile link
  // Generate compact, un-bloated mobile link using the server-side short URL service (protects QR sizes!)
  const handleGenerateShareCode = async () => {
    try {
      const activeSession = sessions[selectedSessionId];
      const scheduledDrillIds = new Set(activeSession.drills.map(d => d.drillId));
      
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

      const absoluteUrl = `${window.location.origin}${window.location.pathname}#plan=${resJson.code}`;
      setShareUrl(absoluteUrl);
      setShowShareModal(true);
      setCopied(false);
    } catch (e) {
      console.warn('Could not store state in server, falling back to local base64 compression', e);
      // Fallback base64 link support (guarantees offline support!)
      try {
        const activeSession = sessions[selectedSessionId];
        const scheduledDrillIds = new Set(activeSession.drills.map(d => d.drillId));
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
        const absoluteUrl = `${window.location.origin}${window.location.pathname}#plan=${base64Str}`;
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
    setDrills([newDrill, ...drills]);
  };

  const handleEditDrillInDatabase = (updatedDrill: Drill) => {
    setDrills(drills.map(d => d.id === updatedDrill.id ? updatedDrill : d));
  };

  const handleDeleteDrillFromDatabase = (drillId: string) => {
    // Delete from list
    setDrills(drills.filter(d => d.id !== drillId));
    // Remove references to this deleted drill from weekly schedules
    const sanitizeSession = (sess: TrainingSession): TrainingSession => {
      const filtered = sess.drills.filter(sd => sd.drillId !== drillId);
      return {
        ...sess,
        drills: filtered,
        totalDuration: filtered.reduce((acc, c) => acc + c.duration, 0)
      };
    };
    setSessions({
      dia1: sanitizeSession(sessions.dia1),
      dia2: sanitizeSession(sessions.dia2),
      dia3: sanitizeSession(sessions.dia3),
      dia4: sanitizeSession(sessions.dia4),
      dia5: sanitizeSession(sessions.dia5),
      dia6: sanitizeSession(sessions.dia6),
      dia7: sanitizeSession(sessions.dia7),
      dia8: sanitizeSession(sessions.dia8),
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
    
    setWeeklyPlans([...weeklyPlans, newPlan]);
    setSelectedWeeklyPlanId(newPlan.id);
    triggerToast(`S'ha creat la planificació de la temporada "${name}" amb èxit!`);
  };

  const handleDeleteWeeklyPlan = (planId: string) => {
    if (weeklyPlans.length <= 1) {
      alert('Sempre has de tenir almenys una planificació activa a la pantalla.');
      return;
    }
    const planToDelete = weeklyPlans.find(p => p.id === planId);
    if (!planToDelete) return;

    if (confirm(`Estàs completament segur que vols eliminar definitivament la planificació "${planToDelete.name}"?\nTots els seus entrenaments i observacions es perdran.`)) {
      const remainingPlans = weeklyPlans.filter(p => p.id !== planId);
      setWeeklyPlans(remainingPlans);
      
      if (selectedWeeklyPlanId === planId) {
        const fallbackPlan = remainingPlans[0];
        setSelectedWeeklyPlanId(fallbackPlan.id);
      }
      triggerToast(`Planificació "${planToDelete.name}" eliminada correctament.`);
    }
  };

  // Plan scheduler callbacks
  const handleUpdateSession = (updatedSession: TrainingSession) => {
    setSessions({
      ...sessions,
      [updatedSession.id]: updatedSession
    });
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
  if (activeView === 'mobile-upload-portal') {
    return (
      <MobileUploadPortal 
        code={mobilePairingCode || ''} 
        onBackToPC={() => {
          setActiveView('planner');
          // Clear hash to return to main base safely
          window.location.hash = '';
        }} 
      />
    );
  }

  const activeSession = sessions[selectedSessionId];
  const timeScheduledObj = activeSession.drills.reduce((acc, d) => acc + d.duration, 0);

  return (
    <div id="app-workspace" className="min-h-screen bg-slate-150 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* GLOBAL GEOMETRIC BALANCE HEADER */}
      {!isSharedMobile && (
        <header id="global-header" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0 relative z-10 select-none">
          
          {/* Logo brand & Catalan basket descriptors */}
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 w-10 h-10 rounded-sm flex items-center justify-center text-white font-black text-xl shadow-xs">
              J
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black tracking-tight text-slate-900 leading-tight">COURT COMMANDER</h1>
              <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-semibold">Junior Masculí • Nivell A (FCBQ)</p>
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
              id="btn-header-export"
              onClick={handleExportJson}
              title="Descarregar copia del plan"
              className="p-1.5 md:p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 cursor-pointer active:scale-95 transition shadow-xs"
            >
              <Download size={14} />
            </button>

            <label
              id="lbl-header-import-file"
              title="Subir archivo de planificación guardado"
              className="p-1.5 md:p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 cursor-pointer active:scale-95 transition shadow-xs"
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
      <main id="main-content-area" className={`flex-1 ${isSharedMobile ? 'p-0 max-w-md' : 'max-w-7xl px-4 py-6 md:px-8'} w-full mx-auto relative`}>
        
        {/* TAB WORKSPACE SEPARATION (planner, library database, mobile view slider) */}
        {activeView !== 'mobile' && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            
            {/* Visual Tabs selector - Beautifully aligned geometric layout */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-md select-none self-start">
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
                Planificar Sesions
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
            <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">CALENDARI DE L'ENTRENAMENT DE JÚNIOR A</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Fes clic en dimarts o dijous per canviar de dia d'entrenament instantàniament.</p>
                </div>
                <span className="text-[10px] font-mono font-black text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded">
                  CALENDARI OFICIAL FCBQ
                </span>
              </div>

              {/* Calendar Grid Container */}
              <div className="grid grid-cols-7 gap-2">
                {/* Header days */}
                {['Dil', 'Dim', 'Dmc', 'Dij', 'Div', 'Dis', 'Diu'].map(dayName => (
                  <div key={dayName} className="text-center py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono">
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
                      <div className="mt-1 flex flex-col items-center">
                        <span className={`text-[8px] uppercase tracking-wide font-black truncate max-w-full px-1.5 py-0.5 rounded ${isActive ? 'bg-orange-750 text-white' : 'bg-orange-100 text-orange-850'}`}>
                          🏀 Sessió {sessionNum}
                        </span>
                        <span className="text-[7px] block font-mono mt-0.5 truncate max-w-full leading-tight opacity-95">Setmana {weekIndex + 1} ({isDay1 ? 'Dim' : 'Dij'})</span>
                      </div>
                    );
                  } else if (isWeekend) {
                    bgStyle = "bg-slate-100 text-slate-400 font-medium";
                    content = (
                      <span className="text-[7px] uppercase font-bold text-slate-500 font-mono mt-2 block">
                        Partit FCBQ 🏆
                      </span>
                    );
                  } else {
                    content = (
                      <span className="text-[7px] font-mono text-slate-450 block mt-2 opacity-60">Lliure</span>
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
                      className={`p-2 min-h-[66px] rounded transition-all duration-150 flex flex-col justify-between cursor-pointer ${bgStyle} ${borderStyle}`}
                    >
                      <span className="text-[10px] font-black font-mono self-start">{dayNum}</span>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>

            <SessionPlanner
              session={activeSession}
              drills={drills}
              onChangeSession={handleUpdateSession}
              onNavigateToMobile={() => setActiveView('mobile')}
              onPreviewDrill={setPreviewDrill}
            />
          </div>
        ) : activeView === 'database' ? (
          <DrillDatabase
            drills={drills}
            onAddDrill={handleAddDrillToDatabase}
            onEditDrill={handleEditDrillInDatabase}
            onDeleteDrill={handleDeleteDrillFromDatabase}
            triggerToast={triggerToast}
          />
        ) : (
          <div className={`${isSharedMobile ? 'p-0' : 'py-2'}`}>
            <MobileCourtView
              session={activeSession}
              drills={drills}
              onBackToPlanner={() => setActiveView('planner')}
              onPreviewDrill={setPreviewDrill}
              isSharedMobile={isSharedMobile}
              onUpdateSession={handleUpdateSession}
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
