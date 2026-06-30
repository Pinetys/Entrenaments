import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  NotebookPen, 
  Flame, 
  ShieldAlert, 
  Smartphone,
  CalendarDays,
  FileCheck2,
  ListRestart,
  GripVertical,
  X,
  Search,
  Filter,
  Printer,
  Star
} from 'lucide-react';
import { Drill, TrainingSession, DrillCategory, SessionCompletion, WeeklyPlan } from '../types';
import TacticalBoard from './TacticalBoard';

export function getEnhancedSessionDrills(
  sessionDrills: { drillId: string; duration: number; notes?: string }[],
  allDrills: Drill[]
) {
  // First, filter out any manual virtual breaks from the drill reference list so we don't double count
  const realDrillsRef = sessionDrills.filter(sd => 
    sd.drillId !== 'virtual-hydration' && 
    !sd.drillId.startsWith('virtual-hydration') &&
    sd.drillId !== 'virtual-freethrows' && 
    !sd.drillId.startsWith('virtual-freethrows')
  );

  const M = realDrillsRef.length;
  if (M === 0) return [];

  // Map each active real drill to its detailed form
  const enhancedReal = realDrillsRef.map((sd, index) => {
    const originalDrill = allDrills.find(d => d.id === sd.drillId);
    const drillDuration = sd.duration || originalDrill?.duration || 10;
    return {
      ...sd,
      id: `${sd.drillId}-${index}`,
      title: originalDrill?.title || 'Ejercicio No Encontrado',
      category: originalDrill?.category || 'Atac',
      concept: originalDrill?.concept,
      setupInstructions: originalDrill?.setupInstructions || '',
      description: originalDrill?.description || '',
      objectives: originalDrill?.objectives || [],
      playersNeeded: originalDrill?.playersNeeded || 0,
      boardState: originalDrill?.boardState || { paths: [], pins: [] },
      originalDuration: originalDrill?.duration || 10,
      duration: drillDuration,
      isVirtual: false,
      realIndex: index
    };
  });

  // Calculate the index positions (0-indexed relative to real drills list) where we should trigger hydration
  let h1 = -1;
  let h2 = -1;
  if (M === 1) {
    h1 = 0; // Trigger before/after as handled in loop
  } else if (M === 2) {
    h1 = 0;
    h2 = 1;
  } else {
    h1 = Math.floor((M - 1) / 3);
    h2 = Math.floor(2 * (M - 1) / 3);
    if (h2 === h1) {
      h2 = Math.min(M - 1, h1 + 1);
    }
  }

  const result: any[] = [];

  // Helper builder for automatic hydration breaks
  const createHydrationBlock = (index: number, partLabel: string) => ({
    id: `auto-hydration-${index}`,
    drillId: 'virtual-hydration-auto',
    title: `Descans d’Hidratació (${partLabel})`,
    category: 'Físico' as DrillCategory,
    concept: 'HIDRATACIÓ',
    duration: 3,
    setupInstructions: 'Tot l’equip corre a banquetes. Hidratació ràpida (90 segons) i retorn ràpid.',
    description: 'Pausa automàtica de seguretat distribuïda per garantir la correcta hidratació durant la sessió.',
    notes: '',
    boardState: { paths: [], pins: [] },
    objectives: ['Hidratació', 'Recuperació cardíaca'],
    isVirtual: true,
    virtualType: 'hydration' as const,
    realIndex: index
  });

  // Helper builder for automatic active-recovery free throws
  const createFreeThrowsBlock = (index: number) => ({
    id: `auto-freethrows-${index}`,
    drillId: 'virtual-freethrows-auto',
    title: 'Tirs Lliures de Recuperació Activa',
    category: 'Tiro' as DrillCategory,
    concept: 'REC. ACTIVA',
    duration: 4,
    setupInstructions: 'Llançaments de lliures per l’equip (en parelles, 10 llançaments cadascun).',
    description: 'Llançament de tirs lliures en condicions de fatiga acumulada simulada.',
    notes: '',
    boardState: { paths: [], pins: [] },
    objectives: ['Sota fatiga extrema', 'Tècnica de tir lliure'],
    isVirtual: true,
    virtualType: 'freethrows' as const,
    realIndex: index
  });

  // For M == 1, insert first hydration break at the start of the session
  if (M === 1) {
    result.push(createHydrationBlock(0, 'Inici'));
  }

  enhancedReal.forEach((drill, i) => {
    result.push(drill);

    // Free throws every 2 active exercises (after drill 2, 4, 6, etc.), but not at the very end of session
    if ((i + 1) % 2 === 0 && i < M - 1) {
      result.push(createFreeThrowsBlock(i));
    }

    // Hydration twice per session
    if (M === 1) {
      result.push(createHydrationBlock(0, 'Final'));
    } else if (M === 2) {
      if (i === 0) {
        result.push(createHydrationBlock(0, 'Part 1'));
      } else if (i === 1) {
        result.push(createHydrationBlock(1, 'Part 2'));
      }
    } else {
      if (i === h1) {
        result.push(createHydrationBlock(i, 'Part 1'));
      } else if (i === h2) {
        result.push(createHydrationBlock(i, 'Part 2'));
      }
    }
  });

  return result;
}

interface SessionPlannerProps {
  session: TrainingSession;
  drills: Drill[];
  onChangeSession: (updatedSession: TrainingSession) => void;
  onNavigateToMobile: () => void;
  onPreviewDrill: (drill: Drill) => void;
  completions: SessionCompletion[];
  activePlan: WeeklyPlan;
  onToggleCompleteSession: (sessionId: string) => void;
  onAddRepetition: (sessionId: string) => void;
  onRemoveRepetition: (completionId: string) => void;
  onClearRepetitions: (sessionId: string) => void;
  onDuplicateSession: (sourceSessionId: string, targetSessionId: string) => void;
  allSessions?: Record<string, TrainingSession>;
  onDeleteDrill?: (drillId: string) => void;
  triggerToast?: (msg: string) => void;
  favoriteDrillIds?: string[];
  onToggleFavorite?: (drillId: string) => void;
}

export default function SessionPlanner({ 
  session, 
  drills, 
  onChangeSession, 
  onNavigateToMobile, 
  onPreviewDrill,
  completions,
  activePlan,
  onToggleCompleteSession,
  onAddRepetition,
  onRemoveRepetition,
  onClearRepetitions,
  onDuplicateSession,
  allSessions,
  onDeleteDrill,
  triggerToast,
  favoriteDrillIds = [],
  onToggleFavorite
}: SessionPlannerProps) {
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [activeNoteEditId, setActiveNoteEditId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [plannerCategoryFilter, setPlannerCategoryFilter] = useState<string>('Tots');
  const [plannerSearchQuery, setPlannerSearchQuery] = useState<string>('');
  const [drillQuickNotes, setDrillQuickNotes] = useState<Record<string, string>>({});
  const [showDuplicateDropdown, setShowDuplicateDropdown] = useState(false);
  const [drillToDelete, setDrillToDelete] = useState<Drill | null>(null);

  // State for show print preview mode
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Discreet state to show category distribution graph (defaults to false for 100% "disimulado" look)
  const [showCategoryChart, setShowCategoryChart] = useState(false);

  // Completion calculation helpers
  const completedSessionIds = completions
    .filter(c => c.planId === activePlan.id)
    .map(c => c.sessionId);

  const getSessionCompletionsCount = (sessId: string) => {
    return completions.filter(c => c.planId === activePlan.id && c.sessionId === sessId).length;
  };

  const isCurrentSessionCompleted = completedSessionIds.includes(session.id);
  const currentSessionRepetitions = getSessionCompletionsCount(session.id);
  const cycleTotalPracticeCount = completions.filter(c => c.planId === activePlan.id).length;

  const activeDrillsInSession = session.drills.map(sd => {
    const originalDrill = drills.find(d => d.id === sd.drillId);
    return {
      ...sd,
      // Fallbacks if drill was deleted from db
      title: originalDrill?.title || 'Ejercicio No Encontrado',
      category: originalDrill?.category || 'Atac',
      setupInstructions: originalDrill?.setupInstructions || '',
      originalDuration: originalDrill?.duration || 10
    };
  });

  const enhancedDrillsInSession = getEnhancedSessionDrills(session.drills, drills);
  const totalTime = enhancedDrillsInSession.reduce((acc, curr) => acc + curr.duration, 0);
  const TIME_LIMIT = 75; // 1 hour 15 minutes = 75 minutes

  // Trigger a visual warning (toast) when exactly 5 minutes are remaining (i.e., totalTime is exactly 70 minutes)
  useEffect(() => {
    if (totalTime === 70) {
      if (triggerToast) {
        triggerToast("⏳ Alerta: Falten només 5 minuts per arribar al límit de 75 minuts de la sessió! (Temps actual: 70 minuts)");
      }
    }
  }, [totalTime, triggerToast]);

  // Handle adding drill to active session
  const handleAddDrillToSession = (drillId: string, customNotes?: string) => {
    const originalDrill = drills.find(d => d.id === drillId);
    if (!originalDrill) return;

    const newDrillRef = {
      drillId,
      duration: originalDrill.duration,
      notes: customNotes || ''
    };

    const updatedDrills = [...session.drills, newDrillRef];
    onChangeSession({
      ...session,
      drills: updatedDrills,
      totalDuration: updatedDrills.reduce((acc, curr) => acc + curr.duration, 0)
    });
  };

  // Handle removing drill from session
  const handleRemoveDrill = (index: number) => {
    const updatedDrills = session.drills.filter((_, idx) => idx !== index);
    onChangeSession({
      ...session,
      drills: updatedDrills,
      totalDuration: updatedDrills.reduce((acc, curr) => acc + curr.duration, 0)
    });
  };

  // Adjust specific duration inside the session
  const handleDurationChange = (index: number, newDur: number) => {
    const updatedDrills = session.drills.map((d, idx) => 
      idx === index ? { ...d, duration: Math.max(1, newDur) } : d
    );
    onChangeSession({
      ...session,
      drills: updatedDrills,
      totalDuration: updatedDrills.reduce((acc, curr) => acc + curr.duration, 0)
    });
  };

  // Edit drill specific custom session note
  const handleNoteSave = (index: number, note: string) => {
    const updatedDrills = session.drills.map((d, idx) => 
      idx === index ? { ...d, notes: note } : d
    );
    onChangeSession({
      ...session,
      drills: updatedDrills,
      totalDuration: updatedDrills.reduce((acc, curr) => acc + curr.duration, 0)
    });
    setActiveNoteEditId(null);
  };

  // Reorder drills in session
  const moveDrill = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === session.drills.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedDrills = [...session.drills];
    
    // Swap
    const temp = updatedDrills[index];
    updatedDrills[index] = updatedDrills[targetIndex];
    updatedDrills[targetIndex] = temp;

    onChangeSession({
      ...session,
      drills: updatedDrills,
      totalDuration: updatedDrills.reduce((acc, d) => acc + d.duration, 0)
    });
  };

  // Drag and drop reordering
  const handleDragReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updatedDrills = [...session.drills];
    const [draggedItem] = updatedDrills.splice(fromIndex, 1);
    updatedDrills.splice(toIndex, 0, draggedItem);

    onChangeSession({
      ...session,
      drills: updatedDrills,
      totalDuration: updatedDrills.reduce((acc, d) => acc + d.duration, 0)
    });
  };

  // Load Presets tailored specifically for Junior A Catalan League
  const loadPreset = (presetType: 'balanced' | 'defensive' | 'preMatch') => {
    let presetDrills: { drillId: string; duration: number; notes: string }[] = [];

    if (presetType === 'balanced') {
      const r11 = drills.find(d => d.id === 'drill-rueda-11')?.id || drills[0]?.id;
      const pnr = drills.find(d => d.id === 'drill-pnr-def')?.id || drills[1]?.id;
      const press = drills.find(d => d.id === 'drill-press-break')?.id || drills[2]?.id;
      const shot = drills.find(d => d.id === 'drill-rueda-tiro-competitiva')?.id || drills[3]?.id;

      if (r11) presetDrills.push({ drillId: r11, duration: 12, notes: 'Saca el balón con rabia. Comunicación vocal intensa de Nivel A.' });
      presetDrills.push({ drillId: 'virtual-hydration', duration: 3, notes: 'Descans ràpid, hidratació i explicació de conceptes de Pick and Roll Drop.' });
      if (pnr) presetDrills.push({ drillId: pnr, duration: 15, notes: 'Forzar siempre por la banda (ICE). Ayuda del pivot del fondo.' });
      presetDrills.push({ drillId: 'virtual-freethrows', duration: 4, notes: '10 tirs lliures per parella en condicions de fatiga moderada.' });
      if (press) presetDrills.push({ drillId: press, duration: 15, notes: 'Romper sin botar las esquinas traseras. Posesiones cortas.' });
      if (shot) presetDrills.push({ drillId: shot, duration: 11, notes: 'Tiros libres de castigo al equipo perdedor.' });
      
      const sys = drills.find(d => d.category === 'Atac')?.id;
      if (sys && sys !== press) {
        presetDrills.push({ drillId: sys, duration: 15, notes: 'Juego real 5v5 con arbitraje riguroso para meter presión de partido.' });
      } else {
        presetDrills.push({ drillId: drills[0]?.id, duration: 15, notes: 'Juego real 5v5 libre pero anotando solo canastas en transición rápida.' });
      }
    } else if (presetType === 'defensive') {
      const press = drills.find(d => d.id === 'drill-press-break')?.id || drills[2]?.id;
      const pnr = drills.find(d => d.id === 'drill-pnr-def')?.id || drills[1]?.id;
      const r11 = drills.find(d => d.id === 'drill-rueda-11')?.id || drills[0]?.id;

      if (r11) presetDrills.push({ drillId: r11, duration: 10, notes: 'Calentar piernas, flexiones si se cae el balón.' });
      presetDrills.push({ drillId: 'virtual-hydration', duration: 3, notes: 'Hidratació ràpida a banquetes abans de treball de pnr.' });
      if (pnr) presetDrills.push({ drillId: pnr, duration: 20, notes: 'Insistir en contacto en los bloqueos directos.' });
      presetDrills.push({ drillId: 'virtual-freethrows', duration: 4, notes: 'Tirs de fatiga per baixar les pulsacions d’exigència.' });
      if (press) presetDrills.push({ drillId: press, duration: 20, notes: 'Presionar después de canasta. Dos contra uno agresivo.' });
      if (drills[3]?.id) presetDrills.push({ drillId: drills[3].id, duration: 10, notes: 'Tiro de perimetro bajo pulsaciones altas.' });
      presetDrills.push({ drillId: drills[0]?.id, duration: 8, notes: 'Tancament de balanç defensiu a pista sencera.' });
    } else if (presetType === 'preMatch') {
      const shot = drills.find(d => d.id === 'drill-rueda-tiro-competitiva')?.id || drills[3]?.id;
      const press = drills.find(d => d.id === 'drill-press-break')?.id || drills[2]?.id;
      const r11 = drills.find(d => d.id === 'drill-rueda-11')?.id || drills[0]?.id;

      if (r11) presetDrills.push({ drillId: r11, duration: 10, notes: 'Estiramiento dinámico activo.' });
      presetDrills.push({ drillId: 'virtual-hydration', duration: 3, notes: 'Pausa tàctica per explicar directrius de partit.' });
      if (shot) presetDrills.push({ drillId: shot, duration: 15, notes: 'Series de 5 triples seguidos desde 5 posiciones distintas.' });
      presetDrills.push({ drillId: 'virtual-freethrows', duration: 4, notes: 'Rutina d’encert consecutiu de tirs lliures (75% mínim equip).' });
      if (press) presetDrills.push({ drillId: press, duration: 15, notes: 'Salida de línea de presión rápido.' });
      
      const pnr = drills.find(d => d.id === 'drill-pnr-def')?.id || drills[1]?.id;
      if (pnr) presetDrills.push({ drillId: pnr, duration: 15, notes: 'Repaso de defensas especiales pre-partido.' });
      presetDrills.push({ drillId: drills[0]?.id, duration: 13, notes: 'Rueda táctica de tiros libres finales de tensión.' });
    }

    onChangeSession({
      ...session,
      drills: presetDrills,
      totalDuration: presetDrills.reduce((acc, curr) => acc + curr.duration, 0)
    });
  };

  const clearSession = () => {
    if (confirm('¿Quieres vaciar completamente todo el plan de entrenamiento seleccionado?')) {
      onChangeSession({
        ...session,
        drills: [],
        totalDuration: 0
      });
    }
  };

  // Get status color for 75 minutes gauge
  const getGuageColor = () => {
    if (totalTime === TIME_LIMIT) return 'from-emerald-500 to-green-600 bg-emerald-600';
    if (totalTime > TIME_LIMIT) return 'from-orange-500 to-red-600 bg-red-600';
    if (totalTime >= 60) return 'from-blue-500 to-sky-500 bg-blue-500';
    return 'from-amber-400 to-amber-500 bg-amber-500';
  };

  return (
    <div id="session-planner-view" className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      
      {/* LEFT: Active Session Scheduler (8 columns) */}
      <div id="active-session-column" className="xl:col-span-8 space-y-6">
        
        {/* GEOMETRIC PALETTE TIMING CONTROL CARD */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-6 text-slate-950 relative overflow-hidden">
          {/* Subtle basket background logo decor */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-3 flex items-center justify-center select-none pointer-events-none">
            <span className="text-[140px] font-bold">🏀</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-slate-200 pb-4 relative z-10">
            <div className="flex-1 group min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-orange-600 font-bold uppercase tracking-widest">
                <CalendarDays size={13} className="text-orange-500" />
                Planificació Real de Temporada
              </div>
              <div className="flex items-center gap-2 mt-1 max-w-full">
                <input
                  id="session-name-editor-input"
                  type="text"
                  value={session.name}
                  onChange={(e) => {
                    onChangeSession({
                      ...session,
                      name: e.target.value
                    });
                  }}
                  className="text-lg md:text-xl font-black text-slate-900 uppercase italic tracking-tight bg-transparent border-b border-transparent hover:border-slate-300 focus:border-orange-500 focus:bg-slate-50 px-1 py-0.5 rounded-sm focus:outline-none transition-all duration-155 flex-1 min-w-0 font-sans cursor-text"
                  title="Fes clic per reanomenar la sessió"
                />
                <span className="text-slate-400 group-hover:text-orange-550 transition-colors pointer-events-none shrink-0" title="Editar nom de la sessió">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </span>
              </div>
              
              {/* Dynamic start-time scheduler for system notification alerts */}
              <div className="flex items-center gap-2 mt-2.5 text-[10px] bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg max-w-sm">
                <span className="font-extrabold text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1">📅 Programar entrenament:</span>
                <input
                  type="datetime-local"
                  value={session.scheduledTime || ''}
                  onChange={(e) => {
                    onChangeSession({
                      ...session,
                      scheduledTime: e.target.value
                    });
                  }}
                  className="bg-white border border-slate-300 px-2 py-1 rounded text-[10px] font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer w-full"
                  title="Tria la data i hora d'aquest entrenament"
                />
              </div>
            </div>

            {/* Quick Presets Dropdown or list - Geometric Balance crisp tags */}
            <div className="flex flex-wrap items-center gap-1.5 relative">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block md:inline mr-1">Pre-dissenyats:</span>
              <button
                id="btn-preset-balanced"
                type="button"
                onClick={() => loadPreset('balanced')}
                className="px-2.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 active:scale-95 rounded-sm text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer transition border border-transparent shadow-xs"
              >
                Balanced
              </button>
              <button
                id="btn-preset-defensive"
                type="button"
                onClick={() => loadPreset('defensive')}
                className="px-2.5 py-1.5 bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 active:scale-95 rounded-sm text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                Defensiu
              </button>
              <button
                id="btn-preset-prematch"
                type="button"
                onClick={() => loadPreset('preMatch')}
                className="px-2.5 py-1.5 bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 active:scale-95 rounded-sm text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                Pre-Partit
              </button>

              <div className="relative">
                <button
                  id="btn-duplicate-session"
                  type="button"
                  onClick={() => setShowDuplicateDropdown(!showDuplicateDropdown)}
                  className={`px-2.5 py-1.5 border active:scale-95 rounded-sm text-[10px] font-black tracking-wider uppercase flex items-center gap-1 cursor-pointer transition-all duration-150 shadow-xs ${
                    showDuplicateDropdown 
                      ? 'bg-orange-500 text-white border-orange-600' 
                      : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                  }`}
                  title="Copiar tots els exercicis d'aquesta sessió a una altra d'un clic"
                >
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  Duplicar
                </button>

                {showDuplicateDropdown && (
                  <div id="duplicate-session-dropdown" className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-md shadow-lg p-3.5 z-[100] animate-fadeIn">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Duplicar Sessió Activa</span>
                      <button 
                        onClick={() => setShowDuplicateDropdown(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                      Copiar els exercicis, durades i observacions de <strong className="text-slate-700">Sessió {session.id.replace('dia', '')}</strong> a una altra sessió del microcicle:
                    </p>
                    
                    <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5 no-scrollbar">
                      {[
                        { id: 'dia1', num: 1 },
                        { id: 'dia2', num: 2 },
                        { id: 'dia3', num: 3 },
                        { id: 'dia4', num: 4 },
                        { id: 'dia5', num: 5 },
                        { id: 'dia6', num: 6 },
                        { id: 'dia7', num: 7 },
                        { id: 'dia8', num: 8 }
                      ]
                      .filter(s => s.id !== session.id)
                      .map(target => {
                        const destSession = allSessions ? allSessions[target.id] : (activePlan[target.id as keyof WeeklyPlan] as TrainingSession | undefined);
                        const drillsCount = destSession?.drills?.length || 0;
                        return (
                          <button
                            key={target.id}
                            onClick={() => {
                              if (drillsCount > 0) {
                                if (!confirm(`S'eliminaran els ${drillsCount} exercicis actuals de la "Sessió ${target.num}". Vols prosseguir?`)) {
                                  return;
                                }
                              }
                              onDuplicateSession(session.id, target.id);
                              setShowDuplicateDropdown(false);
                            }}
                            className="w-full text-left px-2 py-1 bg-white hover:bg-orange-50 font-medium text-slate-700 border border-slate-100 hover:border-orange-100 flex items-center justify-between text-xs transition cursor-pointer rounded"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-5 h-5 flex items-center justify-center bg-orange-100 text-orange-850 rounded-sm text-[9px] font-black uppercase shrink-0">
                                S{target.num}
                              </span>
                              <span className="truncate font-semibold text-slate-700">
                                {destSession?.name ? destSession.name : `Sessió ${target.num}`}
                              </span>
                            </div>
                            <span className="text-[8px] font-mono text-slate-400 uppercase font-black shrink-0 ml-1">
                              {drillsCount > 0 ? `${drillsCount} ex.` : 'Buda'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                id="btn-pdf-session-active"
                type="button"
                onClick={() => setShowPrintPreview(true)}
                className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black rounded-sm text-[10px] tracking-wider uppercase flex items-center gap-1.5 cursor-pointer transition border border-transparent shadow-xs"
                title="Generar un resum en format PDF de la sessió activa, incloent el cronograma, notes i descripcions dels exercicis."
              >
                <Printer size={12} /> Generar PDF / Imprimir 🖨️
              </button>
            </div>
          </div>

          {/* Time speed/gauge calculation panel (Discreet minimalist compact version) */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-2.5 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full">
            <div className="flex items-center gap-2 shrink-0 select-none">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Temps Planificat:</span>
              <span className={`text-sm font-black font-mono tracking-tight px-2 py-0.5 rounded ${
                totalTime === TIME_LIMIT 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : totalTime > TIME_LIMIT 
                    ? 'bg-red-100 text-red-700 animate-pulse' 
                    : 'bg-slate-200 text-slate-800'
              }`}>
                {totalTime}′ <span className="text-[10px] opacity-75 font-sans font-semibold">/ 75′</span>
              </span>
            </div>

            {/* Subtle, thin visual progress meter */}
            <div className="flex-1 w-full flex items-center gap-3">
              <div className="flex-grow h-2 bg-slate-200/80 rounded-full overflow-hidden relative border border-slate-250 flex">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${getGuageColor()}`}
                  style={{ width: `${Math.min(100, (totalTime / TIME_LIMIT) * 100)}%` }}
                />
              </div>

              {/* Ultra-compact alert feedback summary */}
              <div className="shrink-0 font-bold flex items-center gap-2">
                {totalTime === TIME_LIMIT ? (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 uppercase tracking-wider">
                    <FileCheck2 size={12} className="shrink-0 text-emerald-500 font-bold" /> Perfecte
                  </span>
                ) : totalTime > TIME_LIMIT ? (
                  <span className="text-[10px] text-red-650 font-black flex items-center gap-1 uppercase tracking-wider animate-pulse">
                    <ShieldAlert size={12} className="shrink-0 text-red-500" /> +{totalTime - TIME_LIMIT}′
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 uppercase tracking-wider">
                    <Clock size={12} className="shrink-0 text-slate-450" /> -{TIME_LIMIT - totalTime}′
                  </span>
                )}

                {/* Micro Toggle to see details - 100% "disimulado"! */}
                <button
                  type="button"
                  onClick={() => setShowCategoryChart(!showCategoryChart)}
                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider transition-colors cursor-pointer select-none shrink-0 ${
                    showCategoryChart
                      ? 'bg-slate-300 text-slate-800'
                      : 'bg-orange-100 hover:bg-orange-200 text-orange-850 border border-orange-200'
                  }`}
                  title="Fes clic per veure/ocultar el gràfic de distribució de continguts"
                >
                  {showCategoryChart ? 'Tancar gràfic ✕' : 'Distribució 📊'}
                </button>
              </div>
            </div>
          </div>

          {/* CATEGORY DISTRIBUTION STATS BAR (Sleek stacked minimalist row - 100% "disimulado") */}
          {showCategoryChart && (() => {
            const categoryMinutes: Record<string, number> = {};
            enhancedDrillsInSession.forEach(item => {
              if (!item.isVirtual) {
                const rawCat = item.category || 'Atac';
                const cat = rawCat === 'Defensa' ? 'Defensa' : (['Físico', 'Técnica', 'Escalfament'].includes(rawCat) ? 'Escalfament' : 'Atac');
                categoryMinutes[cat] = (categoryMinutes[cat] || 0) + item.duration;
              }
            });
            const totalMinExercise = Object.values(categoryMinutes).reduce((acc, v) => acc + v, 0);
            
            if (totalMinExercise === 0) return null;

            const categories = ['Atac', 'Defensa', 'Escalfament'];
            const activeCategories = categories.filter(cat => (categoryMinutes[cat] || 0) > 0);

            return (
              <div className="mt-2 text-left pt-2 border-t border-slate-150 relative z-10 w-full animate-fadeIn select-none">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Equilibri de Treball de la Sessió</span>
                  <span className="text-[8px] text-slate-400 font-mono font-medium">Distribució temporal</span>
                </div>
                
                {/* Single multi-colored stacked progress bar */}
                <div className="w-full bg-slate-150 h-1 rounded-full overflow-hidden flex border border-slate-200">
                  {activeCategories.map(cat => {
                    const mins = categoryMinutes[cat] || 0;
                    const pct = (mins / totalMinExercise) * 100;
                    const colorClass = cat === 'Atac' ? 'bg-orange-500' :
                                       cat === 'Defensa' ? 'bg-rose-500' : 'bg-emerald-500';

                    return (
                      <div 
                        key={cat} 
                        className={`${colorClass} h-full transition-all duration-300`} 
                        style={{ width: `${pct}%` }}
                        title={`${cat}: ${mins}′ (${Math.round(pct)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Micro legend row */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[8.5px] text-slate-500 font-semibold uppercase tracking-wider">
                  {activeCategories.map(cat => {
                    const mins = categoryMinutes[cat] || 0;
                    const labelCatalan = cat === 'Atac' ? 'Atac' : cat === 'Defensa' ? 'Defensa' : 'Escalfament';
                    const colorDotClass = cat === 'Atac' ? 'bg-orange-500' :
                                          cat === 'Defensa' ? 'bg-rose-500' : 'bg-emerald-500';

                    return (
                      <span key={cat} className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${colorDotClass}`} />
                        <span className="text-slate-600">{labelCatalan}</span>
                        <strong className="text-slate-900 font-mono font-bold text-[9px]">{mins}′</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Exercises list selected in trainer session */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <NotebookPen size={16} className="text-orange-500" />
              Seqüència d'Exercicis a Pista
            </h3>
            {activeDrillsInSession.length > 0 && (
              <button
                id="btn-clear-session-drills"
                onClick={clearSession}
                className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer py-1 px-2.5 rounded-lg hover:bg-red-50 transition flex items-center gap-1"
              >
                <ListRestart size={13} /> Netejar Tot
              </button>
            )}
          </div>

          {activeDrillsInSession.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-md p-6">
              <CalendarDays className="text-slate-300 mx-auto mb-3" size={40} />
              <p className="text-slate-700 font-bold uppercase text-sm">La planificació està buida</p>
              <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                Tria exercicis de la llista de la dreta prement **"+ Afegir"** per completar els 75 minuts d'entrenament en pista.
              </p>
            </div>
          ) : (
            <div id="session-drills-active-list" className="space-y-3 select-none">
              {enhancedDrillsInSession.map((sd, idx) => {
                if (sd.isVirtual) {
                  const isHydration = sd.virtualType === 'hydration';
                  const realIdx = sd.realIndex;
                  const isAuto = !!sd.isAutoHydration;
                  return (
                    <div
                      id={sd.id}
                      key={`${sd.drillId}-${realIdx}`}
                      draggable={!isAuto}
                      onDragStart={isAuto ? undefined : (e) => {
                        e.dataTransfer.setData('text/plain', String(realIdx));
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedIndex(realIdx);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDragEnter={isAuto ? undefined : () => {
                        setDragOverIndex(realIdx);
                      }}
                      onDragEnd={isAuto ? undefined : () => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      onDrop={isAuto ? undefined : (e) => {
                        e.preventDefault();
                        if (draggedIndex !== null && draggedIndex !== realIdx) {
                          handleDragReorder(draggedIndex, realIdx);
                        }
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      className={`border border-l-4 rounded-md p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition shadow-xs group ${
                        isAuto ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                      } ${
                        isAuto 
                          ? 'border-l-blue-500 bg-blue-50/25' 
                          : isHydration 
                            ? 'border-l-cyan-500 bg-slate-50' 
                            : 'border-l-emerald-500 bg-slate-50'
                      } ${
                        !isAuto && draggedIndex === realIdx 
                          ? 'opacity-40 border-slate-300 border-dashed bg-slate-50' 
                          : !isAuto && dragOverIndex === realIdx 
                            ? 'border-orange-500 scale-[1.01] bg-orange-50/40' 
                            : 'bg-slate-50 border-slate-200 hover:border-orange-400'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 flex-1 min-w-0">
                        {/* Drag Grip Handle */}
                        {!isAuto ? (
                          <div 
                            title="Arrastra per reordenar"
                            className="flex items-center text-slate-400 hover:text-orange-600 bg-slate-100 p-1.5 rounded transition cursor-grab active:cursor-grabbing shrink-0"
                          >
                            <GripVertical size={15} />
                          </div>
                        ) : (
                          <div 
                            title="Descanse de seguretat obligatori"
                            className="flex items-center text-blue-500 bg-blue-50/50 p-1.5 rounded shrink-0 shadow-xs"
                          >
                            <span role="img" aria-label="Aigua" className="text-xs">💧</span>
                          </div>
                        )}

                        {/* Minutes tag */}
                        <div className="w-full md:w-24 text-center border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 md:pr-4 shrink-0 flex md:flex-col items-center justify-between md:justify-center">
                          <span className={`block text-2xl font-black tracking-tight font-mono ${
                            isAuto ? 'text-blue-600' : isHydration ? 'text-cyan-600' : 'text-emerald-600'
                          }`}>{sd.duration}′</span>
                          <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Durada</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider ${
                              isAuto 
                                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                : isHydration 
                                  ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' 
                                  : 'bg-emerald-100 text-emerald-850 border border-emerald-200'
                            }`}>
                              {isAuto ? 'SISTEMA AUTOMÀTIC' : isHydration ? 'Descans fìsic' : 'Tir lliure'}
                            </span>
                            {isAuto ? (
                              <span className="text-[9px] px-1.5 py-0.2 bg-blue-50/50 text-blue-600 border border-blue-200/55 rounded font-black uppercase tracking-wider">
                                Mínim de Seguretat Recomanat
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono font-bold">Ordre #{realIdx + 1}</span>
                            )}
                          </div>
                          
                          <h4 className={`text-sm font-black uppercase tracking-tight flex items-center gap-1.5 ${
                            isAuto ? 'text-blue-900' : 'text-slate-900'
                          }`}>
                            {isAuto ? '💧' : isHydration ? '💧' : '🏀'} {sd.title}
                          </h4>
                          
                          {sd.notes ? (
                            <p className="text-xs text-orange-850 italic font-medium mt-1 bg-orange-50 border-l-2 border-orange-500 py-1 px-2 rounded-sm">
                              Obs: "{sd.notes}"
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-1 italic leading-relaxed">
                              {sd.setupInstructions}
                            </p>
                          )}
                        </div>
                      </div>

                      {isAuto ? (
                        <div className="flex items-center text-[10px] uppercase font-bold bg-blue-105 text-blue-800 px-3 py-1.5 rounded-md border border-blue-200 gap-1.5 tracking-wider select-none shrink-0">
                          <span>💧 Hidratació Auto</span>
                        </div>
                      ) : (
                        <div 
                          onDragStart={(e) => e.stopPropagation()} 
                          draggable={false}
                          className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0"
                        >
                          {/* Timing controls */}
                          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-100">
                            <span className="text-[11px] font-bold text-slate-400 mr-1 font-mono uppercase">Mins:</span>
                            <input
                              id={`input-dur-change-${realIdx}`}
                              type="number"
                              min="1"
                              max="75"
                              value={sd.duration}
                              draggable={false}
                              onDragStart={(e) => e.stopPropagation()}
                              onChange={(e) => handleDurationChange(realIdx, Number(e.target.value))}
                              className="w-10 bg-white border border-slate-200 rounded text-center text-xs font-bold font-mono py-0.5 text-slate-700"
                            />
                            <span className="text-slate-400 text-xs font-mono">′</span>
                          </div>

                          {/* Ordering buttons */}
                          <div className="flex items-center gap-0.5">
                            <button
                              id={`btn-move-up-${realIdx}`}
                              onClick={() => moveDrill(realIdx, 'up')}
                              disabled={realIdx === 0}
                              draggable={false}
                              onDragStart={(e) => e.stopPropagation()}
                              title="Pujar d'ordre"
                              className="p-1 px-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded bg-white border border-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              id={`btn-move-down-${realIdx}`}
                              onClick={() => moveDrill(realIdx, 'down')}
                              disabled={realIdx === session.drills.length - 1}
                              draggable={false}
                              onDragStart={(e) => e.stopPropagation()}
                              title="Baixar d'ordre"
                              className="p-1 px-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded bg-white border border-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>

                          {/* Drill session custom note editor */}
                          <div className="relative">
                            {activeNoteEditId === `${sd.drillId}-${realIdx}` ? (
                              <div className="absolute right-0 bottom-full mb-2 bg-white border border-slate-250 rounded-xl shadow-lg p-3 z-30 w-64 space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-400 block">Observació per a aquest exercici:</label>
                                <input
                                  id={`note-input-${realIdx}`}
                                  type="text"
                                  defaultValue={sd.notes || ''}
                                  draggable={false}
                                  onDragStart={(e) => e.stopPropagation()}
                                  placeholder="P. ex. Excloure bots innecessaris"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleNoteSave(realIdx, (e.target as HTMLInputElement).value);
                                    }
                                  }}
                                  className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  autoFocus
                                />
                                <p className="text-[9px] text-slate-400">Prem Intro per desar l'anotació tàctica.</p>
                              </div>
                            ) : (
                              <button
                                id={`btn-toggle-note-${realIdx}`}
                                onClick={() => setActiveNoteEditId(`${sd.drillId}-${realIdx}`)}
                                draggable={false}
                                onDragStart={(e) => e.stopPropagation()}
                                title="Afegir nota tàctica específica per avui"
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  sd.notes 
                                    ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
                                    : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                                }`}
                              >
                                <NotebookPen size={14} />
                              </button>
                            )}
                          </div>

                          {/* Delete drill from session */}
                          <button
                            id={`btn-remove-session-drill-${realIdx}`}
                            onClick={() => handleRemoveDrill(realIdx)}
                            draggable={false}
                            onDragStart={(e) => e.stopPropagation()}
                            title="Treure d'aquesta sessió"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition border border-dashed border-slate-200 hover:border-red-200 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                const realIdx = sd.realIndex;
                const rawCat = sd.category || 'Atac';
                const normCat = rawCat === 'Defensa' ? 'Defensa' : (['Físico', 'Técnica', 'Escalfament'].includes(rawCat) ? 'Escalfament' : 'Atac');

                return (
                  <div
                    id={`session-drill-item-${realIdx}`}
                    key={`${sd.drillId}-${realIdx}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(realIdx));
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedIndex(realIdx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDragEnter={() => {
                      setDragOverIndex(realIdx);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== null && draggedIndex !== realIdx) {
                        handleDragReorder(draggedIndex, realIdx);
                      }
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`border border-l-4 rounded-md p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition shadow-xs group cursor-grab active:cursor-grabbing ${
                      draggedIndex === realIdx 
                        ? 'opacity-40 border-slate-300 border-dashed bg-slate-50' 
                        : dragOverIndex === realIdx 
                          ? 'border-orange-500 scale-[1.01] bg-orange-50/40' 
                          : normCat === 'Atac'
                            ? 'border-l-orange-500 border-orange-200 bg-orange-50/5 hover:border-orange-400'
                            : normCat === 'Defensa'
                              ? 'border-l-rose-500 border-rose-200 bg-rose-50/5 hover:border-rose-400'
                              : 'border-l-emerald-500 border-emerald-200 bg-emerald-50/5 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 flex-1 min-w-0">
                      {/* Drag Grip Handle */}
                      <div 
                        title="Arrastra per reordenar"
                        className="flex items-center text-slate-400 hover:text-orange-600 bg-slate-100 p-1.5 rounded transition cursor-grab active:cursor-grabbing shrink-0"
                      >
                        <GripVertical size={15} />
                      </div>

                      {/* Geometric Left block: Minutes column */}
                      <div className="w-full md:w-24 text-center border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 md:pr-4 shrink-0 flex md:flex-col items-center justify-between md:justify-center">
                        <span className="block text-2xl font-black text-slate-800 tracking-tight font-mono">{sd.duration}′</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Durada</span>
                      </div>

                      {/* Tactical Board Preview Thumbnail */}
                      <div 
                        onClick={() => {
                          const orig = drills.find(d => d.id === sd.drillId);
                          if (orig) onPreviewDrill(orig);
                        }}
                        title="Clica per veure en gran"
                        className="w-24 xs:w-28 md:w-32 bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 mx-auto md:mx-0 p-0.5 shadow-inner cursor-pointer hover:border-orange-500 hover:scale-[1.02] transition self-center"
                      >
                        <TacticalBoard boardState={sd.boardState || { paths: [], pins: [] }} onChange={() => {}} readOnly={true} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider ${
                            sd.category === 'Transición' ? 'bg-orange-100 text-orange-850' :
                            sd.category === 'Táctica' ? 'bg-blue-100 text-blue-800' :
                            sd.category === 'Tiro' ? 'bg-emerald-100 text-emerald-800' :
                            sd.category === 'Físico' ? 'bg-red-100 text-red-800' :
                            sd.category === 'Defensa' ? 'bg-rose-100 text-rose-800' :
                            sd.category === 'Sistemas' ? 'bg-purple-100 text-purple-800' : 'bg-cyan-100 text-cyan-800'
                          }`}>
                            {sd.category}
                          </span>
                          {sd.concept && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[8px] font-black uppercase tracking-wider animate-fadeIn">
                              {sd.concept}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono font-bold">Ordre #{realIdx + 1}</span>
                        </div>
                        
                        <h4 
                          onClick={() => {
                            const orig = drills.find(d => d.id === sd.drillId);
                            if (orig) onPreviewDrill(orig);
                          }}
                          title="Clica per veure el manual tàctic"
                          className="text-sm font-black text-slate-800 uppercase tracking-tight hover:text-orange-600 hover:underline cursor-pointer transition-colors"
                        >
                          {sd.title}
                        </h4>

                        {/* Display custom notes elegantly or layout default note instructions */}
                        {sd.notes ? (
                          <p className="text-xs text-orange-850 italic font-medium mt-1 bg-orange-50 border-l-2 border-orange-500 py-1 px-2 rounded-sm">
                            Obs: "{sd.notes}"
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500 mt-1 italic">{sd.setupInstructions || 'Sense anotacions tàctiques afegides'}</p>
                        )}
                      </div>
                    </div>

                    <div 
                      onDragStart={(e) => e.stopPropagation()} 
                      draggable={false}
                      className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0"
                    >
                      {/* Timing controls */}
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <span className="text-[11px] font-bold text-slate-400 mr-1 font-mono uppercase">Mins:</span>
                        <input
                          id={`input-dur-change-${realIdx}`}
                          type="number"
                          min="1"
                          max="75"
                          value={sd.duration}
                          draggable={false}
                          onDragStart={(e) => e.stopPropagation()}
                          onChange={(e) => handleDurationChange(realIdx, Number(e.target.value))}
                          className="w-10 bg-white border border-slate-200 rounded text-center text-xs font-bold font-mono py-0.5 text-slate-700"
                        />
                        <span className="text-slate-400 text-xs font-mono">′</span>
                      </div>

                      {/* Ordering buttons */}
                      <div className="flex items-center gap-0.5">
                        <button
                          id={`btn-move-up-${realIdx}`}
                          onClick={() => moveDrill(realIdx, 'up')}
                          disabled={realIdx === 0}
                          draggable={false}
                          onDragStart={(e) => e.stopPropagation()}
                          title="Pujar d'ordre"
                          className="p-1 px-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded bg-white border border-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          id={`btn-move-down-${realIdx}`}
                          onClick={() => moveDrill(realIdx, 'down')}
                          disabled={realIdx === session.drills.length - 1}
                          draggable={false}
                          onDragStart={(e) => e.stopPropagation()}
                          title="Baixar d'ordre"
                          className="p-1 px-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded bg-white border border-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      {/* Drill session custom note editor */}
                      <div className="relative">
                        {activeNoteEditId === `${sd.drillId}-${realIdx}` ? (
                          <div className="absolute right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-30 w-64 space-y-2">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block">Observació per a aquest exercici:</label>
                            <input
                              id={`note-input-${realIdx}`}
                              type="text"
                              defaultValue={sd.notes || ''}
                              draggable={false}
                              onDragStart={(e) => e.stopPropagation()}
                              placeholder="P. ex. Excloure bots innecessaris"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleNoteSave(realIdx, (e.target as HTMLInputElement).value);
                                }
                              }}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                              autoFocus
                            />
                            <p className="text-[9px] text-slate-400">Prem Intro per desar l'anotació tàctica.</p>
                          </div>
                        ) : (
                          <button
                            id={`btn-toggle-note-${realIdx}`}
                            onClick={() => setActiveNoteEditId(`${sd.drillId}-${realIdx}`)}
                            draggable={false}
                            onDragStart={(e) => e.stopPropagation()}
                            title="Afegir nota tàctica específica per avui"
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              sd.notes 
                                ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
                                : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                            }`}
                          >
                            <NotebookPen size={14} />
                          </button>
                        )}
                      </div>

                      {/* Delete drill from session */}
                      <button
                        id={`btn-remove-session-drill-${realIdx}`}
                        onClick={() => handleRemoveDrill(realIdx)}
                        title="Treure d'aquesta sessió"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition border border-dashed border-slate-200 hover:border-red-200 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick link button to mobile court view */}
          {activeDrillsInSession.length > 0 && (
            <div className="text-right pt-2" id="action-pista-link">
              <button
                id="btn-goto-pista-mode"
                onClick={onNavigateToMobile}
                className="py-3 px-6 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-sm text-xs uppercase tracking-widest shadow-md inline-flex items-center gap-2 cursor-pointer transition active:scale-95 border-none"
              >
                <Smartphone className="text-orange-400 shrink-0" size={15} />
                Obrir Modo Pista (Mòbil) ⚡
              </button>
            </div>
          )}
        </div>

        {/* RIGHT NOW SITUATED IN THE MAIN COLUMN: Quick-add Library Drills selector Panel (raised up to left column!) */}
        <div id="quick-add-panel" className="bg-white border border-slate-200 rounded-md p-6 space-y-5 shadow-sm mt-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Exercicis Disponibles</h3>
            <p className="text-xs text-slate-500 font-medium">Afegeix-los de forma instantània prement el botó.</p>
          </div>

          {/* Dynamic Hydration and Free Throws Creator Buttons */}
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-3.5 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">💧 Pauses i Tir de Recuperació</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-add-hydration-custom"
                type="button"
                onClick={() => {
                  const newDrillRef = {
                    drillId: 'virtual-hydration',
                    duration: 3,
                    notes: ''
                  };
                  const updatedDrills = [...session.drills, newDrillRef];
                  onChangeSession({
                    ...session,
                    drills: updatedDrills,
                    totalDuration: updatedDrills.reduce((acc, curr) => acc + curr.duration, 0)
                  });
                }}
                className="px-2 py-2 bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-400 text-cyan-700 rounded-sm text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-xs"
              >
                💧 + Hidratació (3′)
              </button>
              <button
                id="btn-add-freethrows-custom"
                type="button"
                onClick={() => {
                  const newDrillRef = {
                    drillId: 'virtual-freethrows',
                    duration: 4,
                    notes: ''
                  };
                  const updatedDrills = [...session.drills, newDrillRef];
                  onChangeSession({
                    ...session,
                    drills: updatedDrills,
                    totalDuration: updatedDrills.reduce((acc, curr) => acc + curr.duration, 0)
                  });
                }}
                className="px-2 py-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 text-emerald-700 rounded-sm text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-xs"
              >
                🏀 + Tirs Lliures (4′)
              </button>
            </div>
          </div>

          {/* Search bar and Category filters for Available Drills */}
          <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-sm p-3 shadow-xs">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <Search size={13} />
              </span>
              <input
                id="input-planner-drill-search"
                type="text"
                placeholder="Cerca exercicis..."
                value={plannerSearchQuery}
                onChange={(e) => setPlannerSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-[11px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white font-medium"
              />
              {plannerSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPlannerSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-col gap-1.5 select-none">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                <Filter size={9} />
                Filtrar per Categoria:
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'Tots', label: 'Tots' },
                  { id: 'Favorits', label: '⭐ Favorits' },
                  { id: 'Escalfament', label: 'Escalfament' },
                  { id: 'Atac', label: 'Atac' },
                  { id: 'Defensa', label: 'Defensa' }
                ].map((item) => {
                  const isActive = plannerCategoryFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPlannerCategoryFilter(item.id)}
                      className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition border cursor-pointer ${
                        isActive
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div id="quick-drills-list" className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
            {drills
              .filter((drill) => {
                // Apply Search Query first
                if (plannerSearchQuery) {
                  const query = plannerSearchQuery.toLowerCase();
                  const matchesTitle = drill.title.toLowerCase().includes(query);
                  const matchesDesc = drill.description.toLowerCase().includes(query);
                  const matchesConcept = drill.concept?.toLowerCase().includes(query) || false;
                  if (!matchesTitle && !matchesDesc && !matchesConcept) return false;
                }

                // Apply Category Filter
                if (plannerCategoryFilter === 'Tots') return true;
                if (plannerCategoryFilter === 'Favorits') {
                  return favoriteDrillIds.includes(drill.id);
                }
                if (plannerCategoryFilter === 'Escalfament') {
                  return ['Técnica', 'Físico', 'Escalfament'].includes(drill.category);
                }
                if (plannerCategoryFilter === 'Atac') {
                  return ['Táctica', 'Sistemas', 'Tiro', 'Transición', 'Atac'].includes(drill.category);
                }
                if (plannerCategoryFilter === 'Defensa') {
                  return ['Defensa'].includes(drill.category);
                }
                return true;
              })
              .map((drill) => {
              const isAlreadyIn = session.drills.some(sd => sd.drillId === drill.id);
              const rawCat = drill.category || 'Atac';
              const normCat = rawCat === 'Defensa' ? 'Defensa' : (['Físico', 'Técnica', 'Escalfament'].includes(rawCat) ? 'Escalfament' : 'Atac');
              return (
                <div
                  id={`quick-drill-item-${drill.id}`}
                  key={drill.id}
                  className={`p-3 border rounded transition flex flex-col justify-between gap-2.5 group shadow-xs hover:shadow-2xs ${
                    normCat === 'Atac' 
                      ? 'border-l-4 border-l-orange-500 border-orange-200 bg-orange-50/5 hover:border-orange-400' 
                      : normCat === 'Defensa' 
                        ? 'border-l-4 border-l-rose-500 border-rose-200 bg-rose-50/5 hover:border-rose-400' 
                        : 'border-l-4 border-l-emerald-500 border-emerald-200 bg-emerald-50/5 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-start gap-3 w-full">
                    {/* Tactical Board Miniature Preview Graphic */}
                    <div 
                      onClick={() => onPreviewDrill(drill)}
                      title="Clica per veure en gran el manual tàctic"
                      className="w-20 xs:w-24 bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 shadow-inner cursor-pointer hover:border-orange-500 hover:scale-[1.03] transition p-0.5 self-center"
                    >
                      <TacticalBoard boardState={drill.boardState || { paths: [], pins: [] }} onChange={() => {}} readOnly={true} />
                    </div>

                    {/* Primary labels & titles */}
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-1 mb-1">
                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-100 font-extrabold text-slate-650 uppercase tracking-widest border border-slate-200/60">
                          {drill.category}
                        </span>
                        {drill.concept && (
                          <span className="px-1 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[8px] font-black uppercase tracking-wider">
                            {drill.concept}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleFavorite) onToggleFavorite(drill.id);
                          }}
                          className={`p-1 rounded-full transition cursor-pointer border-none bg-transparent hover:scale-110 ml-auto flex items-center justify-center ${
                            favoriteDrillIds.includes(drill.id)
                              ? 'text-amber-500'
                              : 'text-slate-300 hover:text-amber-400'
                          }`}
                          title={favoriteDrillIds.includes(drill.id) ? 'Treure de preferits' : 'Marcar com a preferit'}
                        >
                          <Star size={12} fill={favoriteDrillIds.includes(drill.id) ? 'currentColor' : 'none'} />
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1">
                          <Clock size={10} className="text-slate-400" />
                          {drill.duration}′
                        </span>
                      </div>
                      <h4 
                        onClick={() => onPreviewDrill(drill)}
                        title="Clica per veure el manual tàctic"
                        className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug group-hover:text-orange-600 hover:underline cursor-pointer transition-colors truncate"
                      >
                        {drill.title}
                      </h4>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        id={`btn-quick-add-${drill.id}`}
                        onClick={() => {
                          handleAddDrillToSession(drill.id, drillQuickNotes[drill.id]);
                          // Clear the input after adding
                          setDrillQuickNotes(prev => {
                            const copy = { ...prev };
                            copy[drill.id] = '';
                            return copy;
                          });
                        }}
                        type="button"
                        className="px-2.5 py-1.5 rounded bg-orange-500 hover:bg-orange-600 transition text-[9px] font-black uppercase text-white flex items-center justify-center gap-1 cursor-pointer shadow-xs border-none"
                      >
                        <Plus size={10} strokeWidth={3} />
                        {isAlreadyIn ? 'Afegir+' : 'Afegir'}
                      </button>

                      <button
                        id={`btn-quick-delete-${drill.id}`}
                        onClick={() => setDrillToDelete(drill)}
                        type="button"
                        title="Eliminar de la biblioteca de l'equip"
                        className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 transition text-[8px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={10} />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Optional Note / Custom written note beside tag info */}
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded border border-slate-150">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider shrink-0 font-mono">Anotació:</span>
                    <input
                      type="text"
                      placeholder="Escriu un escrit/observació per a l'exercici..."
                      value={drillQuickNotes[drill.id] || ''}
                      onChange={(e) => setDrillQuickNotes({
                        ...drillQuickNotes,
                        [drill.id]: e.target.value
                      })}
                      className="flex-1 text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-400 font-medium"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Completions, Weekly registry, and PDF (4 columns) */}
      <div id="execution-registry-panel" className="xl:col-span-4 bg-white border border-slate-200 rounded-md shadow-sm p-6 space-y-6">
        <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Registre d'Execució i PDF</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Gestió de sessions completades i exportació a PDF.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPrintPreview(true)}
            className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition uppercase tracking-wider"
          >
            📄 PDF del Microcicle / Imprimir
          </button>
        </div>

        <div className="space-y-6">
          {/* Active session completion controls */}
          <div className="space-y-3">
            <span className="text-[10px] text-slate-450 font-black uppercase tracking-widest block text-left">Sessió Activa • Estat</span>
            
            <div className="p-3.5 bg-slate-50 rounded border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">Completada:</span>
                <button
                  type="button"
                  onClick={() => onToggleCompleteSession(session.id)}
                  className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider transition ${
                    isCurrentSessionCompleted
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-707 hover:bg-slate-100'
                  }`}
                >
                  {isCurrentSessionCompleted ? '✓ Sí' : '☐ No'}
                </button>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700">Repeticions:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      type="button"
                      disabled={currentSessionRepetitions <= (isCurrentSessionCompleted ? 1 : 0)}
                      onClick={() => {
                        const record = [...completions]
                          .reverse()
                          .find(c => c.planId === activePlan.id && c.sessionId === session.id);
                        if (record) onRemoveRepetition(record.id);
                      }}
                      className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded font-black text-xs disabled:opacity-50 cursor-pointer flex items-center justify-center shadow-xs"
                    >
                      -
                    </button>
                    <span className="text-xs font-black font-mono w-5 text-center">{currentSessionRepetitions}</span>
                    <button
                      type="button"
                      onClick={() => onAddRepetition(session.id)}
                      className="w-6 h-6 bg-slate-900 hover:bg-slate-800 text-white rounded font-black text-xs cursor-pointer flex items-center justify-center shadow-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => onClearRepetitions(session.id)}
                    className="text-[9px] text-slate-450 hover:text-red-500 transition font-bold"
                    title="Reiniciar repeticions"
                  >
                    Netejar comptador
                  </button>
                </div>
              </div>
            </div>

            {/* Progress of the 8 days weekly plan */}
            <div className="pt-2">
              <div className="flex justify-between text-[10px] text-slate-400 font-extrabold uppercase tracking-wide mb-1.5">
                <span>Completades (Local)</span>
                <span>{completedSessionIds.length} / 8</span>
              </div>
              
              {/* 8 squares of active plan */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'dia1', num: 1 },
                  { id: 'dia2', num: 2 },
                  { id: 'dia3', num: 3 },
                  { id: 'dia4', num: 4 },
                  { id: 'dia5', num: 5 },
                  { id: 'dia6', num: 6 },
                  { id: 'dia7', num: 7 },
                  { id: 'dia8', num: 8 },
                ].map(day => {
                  const count = getSessionCompletionsCount(day.id);
                  const isSessCompleted = count > 0;
                  return (
                    <div
                      key={day.id}
                      className={`py-1.5 border text-center rounded flex flex-col justify-between ${
                        isSessCompleted 
                          ? count > 1 
                            ? 'bg-orange-50 border-orange-300 text-orange-950 font-black'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                      title={`Sessió ${day.num}: ${count} repeticions.`}
                    >
                      <span className="text-[10px] font-mono leading-tight">S{day.num}</span>
                      {count > 0 ? (
                        <span className="text-[9px] font-mono font-black text-orange-655 block leading-tight mt-0.5">x{count}</span>
                      ) : (
                        <span className="text-[8px] opacity-40">☐</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-650 font-bold flex justify-between items-center">
                <span>📈 Total Microcicle:</span>
                <span className="font-black text-orange-700 font-mono">{cycleTotalPracticeCount}</span>
              </div>
            </div>
          </div>

          {/* Simple Completions history log list */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <span className="text-[10.5px] text-slate-400 font-extrabold uppercase tracking-widest block text-left">Historial de Treball</span>
            
            <div className="border border-slate-200 rounded h-[180px] overflow-y-auto bg-slate-50 p-1.5 space-y-1 text-[11px]">
              {completions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-mono italic text-[10px]">
                  No hi ha cap registre encara.
                </div>
              ) : (
                [...completions].reverse().map(item => {
                  const dateFormatted = new Date(item.completedAt).toLocaleDateString('ca-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  let sessionNum = 0;
                  if (item.sessionId === 'dia1') sessionNum = 1;
                  else if (item.sessionId === 'dia2') sessionNum = 2;
                  else if (item.sessionId === 'dia3') sessionNum = 3;
                  else if (item.sessionId === 'dia4') sessionNum = 4;
                  else if (item.sessionId === 'dia5') sessionNum = 5;
                  else if (item.sessionId === 'dia6') sessionNum = 6;
                  else if (item.sessionId === 'dia7') sessionNum = 7;
                  else if (item.sessionId === 'dia8') sessionNum = 8;

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-150 p-1.5 rounded-sm flex items-center justify-between gap-1.5 shadow-2xs hover:border-slate-300 transition"
                    >
                      <div className="min-w-0 flex-grow text-left">
                        <div className="flex items-center gap-1">
                          <span className="px-1 py-0.2 bg-orange-100 text-orange-950 font-black font-mono text-[8px] uppercase rounded">
                            S{sessionNum}
                          </span>
                          <span className="text-[8.5px] text-slate-400 font-mono shrink-0">{dateFormatted}</span>
                        </div>
                        <p className="text-[10px] text-slate-505 font-bold truncate mt-0.5">
                          Plan: {activePlan.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveRepetition(item.id)}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded shrink-0 transition"
                        title="Eliminar"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PRINT PREVIEW OVERLAY MODAL */}
      {showPrintPreview && (
        <div id="print-overlay" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none print:p-0 print:bg-white print:static print:inset-auto print:block">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col print:h-auto print:shadow-none print:border-none print:w-full">
            
            {/* HEADER CONTROLS (Hidden during printing!) */}
            <div className="bg-slate-50 border-b border-slate-250 px-6 py-4 flex items-center justify-between shrink-0 print:hidden relative">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Dossier de Preparació de la Sessió (PDF)</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Revisa la prèvia d'impressió abans de desar-lo o enviar i imprimir.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="py-1.5 px-3 bg-slate-905 hover:bg-slate-800 text-slate-800 font-black text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer uppercase tracking-wider text-[10px]"
                  title="Consell per desar en PDF"
                  onClick={() => alert("💡 CONSELL PER GUARDAR EN PDF:\n\nAl menú de col·locació de la teva impressora de sistema, selecciona 'Anomena com a PDF' o 'Anomena en PDF' com a destí. Pots escollir format 'Sense Marges' o 'Escala 100%' per mantenir l'elegància del disseny adaptat.")}
                >
                  💡 Com desar?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="py-1.5 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer uppercase tracking-wider text-[10px]"
                >
                  Imprimir / Desar PDF 🖨️
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-950"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* ACTIVE DOCUMENT PREVIEW AREA (Prints directly!) */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 print:p-0 print:overflow-visible text-slate-900 select-text">
              
              {/* Document Header */}
              <div className="border-b-4 border-orange-500 pb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase font-mono bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">
                    FCBQ JÚNIOR MASCULÍ • NIVELL A STANDARDS
                  </span>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-2 uppercase tracking-tight leading-none italic">
                    DOSSIER TÀCTIC i ORGANITZATIU
                  </h1>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold tracking-wider">
                    Microcicle d'Entrenament de Pista • {activePlan.name}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 text-right rounded-sm min-w-[180px] print:bg-white print:border-none print:p-0">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block font-mono">Data del Dossier</span>
                  <span className="text-xs font-black font-mono text-slate-800">{new Date().toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Session Overview Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 print:bg-white print:border-slate-300">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Sessió de Pista</span>
                  <h3 className="text-xs font-black text-slate-850 uppercase mt-1 leading-tight">{session.name}</h3>
                  <p className="text-[10px] text-slate-505 mt-0.5">Sessió vigent d'aquest bloc planificat.</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 print:bg-white print:border-slate-300">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Durada de l'Entrenament</span>
                  <h3 className="text-base font-black text-orange-600 font-mono mt-1">{totalTime} minuts</h3>
                  <p className="text-[10px] text-slate-505 mt-0.5">Límit reglamentari d'ocupació de pista.</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 print:bg-white print:border-slate-300">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Nivell d'Exigència</span>
                  <h3 className="text-xs font-black text-indigo-950 uppercase mt-1">Competició FCBQ A</h3>
                  <p className="text-[10px] text-slate-505 mt-0.5">Planificació de màxima intensitat tàctica.</p>
                </div>
              </div>

              {/* Category Distribution chart or blocks */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-450 border-b border-slate-100 pb-1.5">Equilibri de Treball de la Sessió</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['Atac', 'Defensa', 'Escalfament'].map(cat => {
                    let catMin = 0;
                    enhancedDrillsInSession.forEach(item => {
                      if (!item.isVirtual) {
                        const rawCat = item.category || 'Atac';
                        const normalizedCat = rawCat === 'Defensa' ? 'Defensa' : (['Físico', 'Técnica', 'Escalfament'].includes(rawCat) ? 'Escalfament' : 'Atac');
                        if (normalizedCat === cat) {
                          catMin += item.duration;
                        }
                      }
                    });
                    if (catMin === 0) return null;
                    const labelCatalan = cat === 'Atac' ? 'ATAC' : cat === 'Defensa' ? 'DEFENSA' : 'ESCALFAMENT';
                    return (
                      <div key={cat} className="bg-slate-50 border border-slate-200 rounded p-2 text-center flex flex-col justify-between print:bg-white print:border-slate-300">
                        <span className="text-[8px] text-slate-505 font-black tracking-wider uppercase block truncate">{labelCatalan}</span>
                        <span className="text-xs font-black text-slate-800 font-mono block mt-1">{catMin}′</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drills List Section */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-805 border-b-2 border-slate-200 pb-2">CRONOLOGIA DE L'ENTRENAMENT</h3>
                
                <div className="space-y-8">
                  {enhancedDrillsInSession.map((item, idx) => {
                    const rawCat = item.category || 'Atac';
                    const normalizedCat = rawCat === 'Defensa' ? 'Defensa' : (['Físico', 'Técnica', 'Escalfament'].includes(rawCat) ? 'Escalfament' : 'Atac');
                    const labelCatalan = normalizedCat === 'Atac' ? 'ATAC' : normalizedCat === 'Defensa' ? 'DEFENSA' : 'ESCALFAMENT';
                    const hasBoardState = item.boardState && (item.boardState.pins.length > 0 || item.boardState.paths.length > 0);
                    
                    return (
                      <div key={item.id} className={`border border-l-4 rounded-xl p-5 bg-white space-y-4 shadow-2xs break-inside-avoid print:border-slate-300 ${
                        normalizedCat === 'Atac' 
                          ? 'border-l-orange-500 border-orange-200' 
                          : normalizedCat === 'Defensa' 
                            ? 'border-l-rose-500 border-rose-200' 
                            : 'border-l-emerald-500 border-emerald-200'
                      }`}>
                        
                        {/* Header info of the exercise */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center font-mono font-black text-[10px]">
                              {idx + 1}
                            </span>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                              {item.title}
                            </h4>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-705 font-extrabold uppercase text-[7px] tracking-widest rounded-sm border border-slate-200">
                              {labelCatalan}
                            </span>
                          </div>
                          <span className="text-xs font-black font-mono text-orange-600 bg-orange-50 px-2.5 py-1 rounded">
                            ⏱️ {item.duration} min
                          </span>
                        </div>

                        {/* Details and drawing panel */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                          <div className="md:col-span-7 space-y-2.5 text-[11px] leading-relaxed">
                            
                            {item.objectives && item.objectives.length > 0 && (
                              <div>
                                <strong className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Objectius clau:</strong>
                                <ul className="list-disc list-inside space-y-0.5 text-slate-700 font-bold">
                                  {item.objectives.map((obj, oIdx) => <li key={oIdx}>{obj}</li>)}
                                </ul>
                              </div>
                            )}

                            <div>
                              <strong className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Descripció:</strong>
                              <p className="text-slate-600 font-semibold">{item.description}</p>
                            </div>

                            {item.setupInstructions && (
                              <div>
                                <strong className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Preparació:</strong>
                                <p className="text-slate-650 italic font-medium">{item.setupInstructions}</p>
                              </div>
                            )}

                            {item.notes && (
                              <div className="bg-amber-50 border-l-2 border-amber-500 p-2 rounded-r print:bg-white print:border-l-4">
                                <strong className="text-[9px] font-black text-amber-850 uppercase tracking-wider block">Nota del Coach:</strong>
                                <p className="text-amber-900 font-bold">{item.notes}</p>
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-5 flex flex-col items-center">
                            {hasBoardState ? (
                              <div className="border border-slate-200 rounded-lg p-1.5 bg-slate-50 w-full max-w-[240px] aspect-square relative print:bg-white print:border-slate-350">
                                <TacticalBoard 
                                  boardState={item.boardState} 
                                  onChange={() => {}} 
                                  readOnly={true} 
                                />
                              </div>
                            ) : (
                              <div className="border border-dashed border-slate-250 rounded-lg p-5 bg-slate-50 flex flex-col items-center justify-center text-center w-full max-w-[240px] h-[180px] print:bg-white">
                                <span className="text-lg">📋</span>
                                <span className="text-[8px] text-slate-405 font-black uppercase tracking-wider mt-1 block">SENSE DIAGRAMA TÀCTIC</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dossier footer notes */}
              <div className="border-t border-slate-200 pt-5 flex justify-between items-center text-[9px] text-slate-450 font-mono">
                <span>Generat automàticament per Coach Pinety Junior A</span>
                <span>Federació Catalana de Basquetbol Standards</span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG FOR DRILL DELETION */}
      {drillToDelete && (
        <div className="fixed inset-0 bg-slate-950/75 flex items-center justify-center p-4 z-50 backdrop-blur-xs select-none">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Trash2 size={24} />
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Esborrar Exercici?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Estàs segur que vols eliminar permanentment l'exercici <strong className="text-slate-800">"{drillToDelete.title}"</strong> de la biblioteca de l'equip?
              </p>
              <div className="text-[10px] text-red-650 font-bold bg-amber-50/50 border border-amber-200 p-2.5 rounded-xl text-left">
                ⚠️ Aquesta acció és irreversible i el traurà de qualsevol sessió d'entrenament on estigui programat.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onDeleteDrill) {
                    onDeleteDrill(drillToDelete.id);
                  }
                  setDrillToDelete(null);
                  if (triggerToast) {
                    triggerToast(`🗑️ S'ha eliminat "${drillToDelete.title}" de la biblioteca.`);
                  }
                }}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-none"
              >
                Sí, esborrar
              </button>
              <button
                type="button"
                onClick={() => setDrillToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-none"
              >
                Cancel·lar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
