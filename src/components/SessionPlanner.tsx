import React, { useState } from 'react';
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
  GripVertical
} from 'lucide-react';
import { Drill, TrainingSession, DrillCategory } from '../types';

export function getEnhancedSessionDrills(
  sessionDrills: { drillId: string; duration: number; notes?: string }[],
  allDrills: Drill[]
) {
  return sessionDrills.map((sd, index) => {
    if (sd.drillId === 'virtual-hydration' || sd.drillId.startsWith('virtual-hydration')) {
      return {
        id: `hydration-${index}`,
        drillId: sd.drillId,
        title: 'Descans d’Hidratació i Recuperació',
        category: 'Físico' as DrillCategory,
        duration: sd.duration || 3,
        setupInstructions: 'Tot l’equip corre a banquetes. Hidratació ràpida (90 segons) i retorn d’explicació per part del coach.',
        description: 'Pausa necessària a meitat d’entrenament per garantir la recuperació física i hidratació òptima.',
        notes: sd.notes || '',
        boardState: { paths: [], pins: [] },
        objectives: [],
        isVirtual: true,
        virtualType: 'hydration' as const,
        realIndex: index
      };
    }
    if (sd.drillId === 'virtual-freethrows' || sd.drillId.startsWith('virtual-freethrows')) {
      return {
        id: `freethrows-${index}`,
        drillId: sd.drillId,
        title: 'Tirs Lliures de Recuperació Activa',
        category: 'Tiro' as DrillCategory,
        duration: sd.duration || 4,
        setupInstructions: 'Llançaments de lliures per l’equip (parelles, 10 tirs cadascun). Cal registrar els encerts en parelles.',
        description: 'Treball de tir lliure en condicions de fatiga simulada. Es canvia de llançador cada 2 tirs.',
        notes: sd.notes || '',
        boardState: { paths: [], pins: [] },
        objectives: [],
        isVirtual: true,
        virtualType: 'freethrows' as const,
        realIndex: index
      };
    }

    const originalDrill = allDrills.find(d => d.id === sd.drillId);
    return {
      ...sd,
      id: `${sd.drillId}-${index}`,
      title: originalDrill?.title || 'Ejercicio No Encontrado',
      category: originalDrill?.category || 'Técnica',
      setupInstructions: originalDrill?.setupInstructions || '',
      description: originalDrill?.description || '',
      objectives: originalDrill?.objectives || [],
      playersNeeded: originalDrill?.playersNeeded || 0,
      boardState: originalDrill?.boardState || { paths: [], pins: [] },
      originalDuration: originalDrill?.duration || 10,
      isVirtual: false,
      realIndex: index
    };
  });
}

interface SessionPlannerProps {
  session: TrainingSession;
  drills: Drill[];
  onChangeSession: (updatedSession: TrainingSession) => void;
  onNavigateToMobile: () => void;
  onPreviewDrill: (drill: Drill) => void;
}

export default function SessionPlanner({ session, drills, onChangeSession, onNavigateToMobile, onPreviewDrill }: SessionPlannerProps) {
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [activeNoteEditId, setActiveNoteEditId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const activeDrillsInSession = session.drills.map(sd => {
    const originalDrill = drills.find(d => d.id === sd.drillId);
    return {
      ...sd,
      // Fallbacks if drill was deleted from db
      title: originalDrill?.title || 'Ejercicio No Encontrado',
      category: originalDrill?.category || 'Técnica',
      setupInstructions: originalDrill?.setupInstructions || '',
      originalDuration: originalDrill?.duration || 10
    };
  });

  const enhancedDrillsInSession = getEnhancedSessionDrills(session.drills, drills);
  const totalTime = enhancedDrillsInSession.reduce((acc, curr) => acc + curr.duration, 0);
  const TIME_LIMIT = 75; // 1 hour 15 minutes = 75 minutes

  // Handle adding drill to active session
  const handleAddDrillToSession = (drillId: string) => {
    const originalDrill = drills.find(d => d.id === drillId);
    if (!originalDrill) return;

    const newDrillRef = {
      drillId,
      duration: originalDrill.duration,
      notes: ''
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
      
      const sys = drills.find(d => d.category === 'Sistemas')?.id;
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
            <div>
              <div className="flex items-center gap-1.5 text-xs text-orange-600 font-bold uppercase tracking-widest">
                <CalendarDays size={13} className="text-orange-500" />
                Planificació Real de Temporada
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1 uppercase italic tracking-tight">
                {session.name}
              </h2>
            </div>

            {/* Quick Presets Dropdown or list - Geometric Balance crisp tags */}
            <div className="flex flex-wrap items-center gap-1.5">
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
            </div>
          </div>

          {/* Time speed/gauge calculation panel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center relative z-10">
            <div className="md:col-span-4 flex items-center gap-4">
              <div className="p-4 bg-slate-50 rounded-sm border border-slate-200 text-center w-full shadow-inner">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Minuts Planificats</span>
                <span className={`text-5xl font-black block my-1 font-mono tracking-tighter ${
                  totalTime === TIME_LIMIT ? 'text-emerald-600' : totalTime > TIME_LIMIT ? 'text-red-600 animate-pulse' : 'text-slate-800'
                }`}>
                  {totalTime}′
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Límit real de pista (75′)</span>
              </div>
            </div>

            <div className="md:col-span-8 space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">
                  <span>Progrés temporal del microcicle</span>
                  <span>{totalTime} / 75 min</span>
                </div>
                {/* Visual indicator bar */}
                <div className="h-4 bg-slate-150 rounded-sm overflow-hidden border border-slate-200 flex relative">
                  <div 
                    className={`h-full bg-gradient-to-r transition-all duration-300 rounded-sm ${getGuageColor()}`}
                    style={{ width: `${Math.min(100, (totalTime / TIME_LIMIT) * 100)}%` }}
                  />
                  {/* Mark at 75m */}
                  <div className="absolute right-[0%] top-0 bottom-0 w-0.5 bg-red-400 opacity-60" />
                </div>
              </div>

              {/* Status Alert Context Box */}
              {totalTime === TIME_LIMIT ? (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900 px-3 py-2 rounded-sm text-xs flex items-center gap-2">
                  <FileCheck2 size={15} className="shrink-0 text-emerald-600 font-bold" />
                  <span><strong>Planificació Perfecta:</strong> Has cobert exactament els 75' réglementaris d'un entrenament FCBQ.</span>
                </div>
              ) : totalTime > TIME_LIMIT ? (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-900 px-3 py-2 rounded-sm text-xs flex items-center gap-2">
                  <ShieldAlert size={15} className="shrink-0 text-red-500 animate-bounce" />
                  <span><strong>Sessió sobrecarregada:</strong> Sobren <strong>{totalTime - TIME_LIMIT} minuts</strong>. Pots ajustar els valors inferiors.</span>
                </div>
              ) : (
                <div className="bg-slate-50 border-l-4 border-slate-400 text-slate-700 px-3 py-2 rounded-sm text-xs flex items-center gap-2">
                  <Clock size={15} className="shrink-0 text-slate-500" />
                  <span>Queden <strong>{TIME_LIMIT - totalTime} minuts</strong> lliures. Afegeix exercicis de tir o tàctica per completar-ho.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exercises list selected in trainer session */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <NotebookPen size={16} className="text-orange-500" />
              Secuencia de Ejercicios en Pista
            </h3>
            {activeDrillsInSession.length > 0 && (
              <button
                id="btn-clear-session-drills"
                onClick={clearSession}
                className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer py-1 px-2.5 rounded-lg hover:bg-red-50 transition flex items-center gap-1"
              >
                <ListRestart size={13} /> Limpiar Todo
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
                  return (
                    <div
                      id={sd.id}
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
                        isHydration ? 'border-l-cyan-500' : 'border-l-emerald-500'
                      } ${
                        draggedIndex === realIdx 
                          ? 'opacity-40 border-slate-300 border-dashed bg-slate-50' 
                          : dragOverIndex === realIdx 
                            ? 'border-orange-500 scale-[1.01] bg-orange-50/40' 
                            : 'bg-slate-50 border-slate-200 hover:border-orange-400'
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

                        {/* Minutes tag */}
                        <div className="w-full md:w-24 text-center border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 md:pr-4 shrink-0 flex md:flex-col items-center justify-between md:justify-center">
                          <span className={`block text-2xl font-black tracking-tight font-mono ${
                            isHydration ? 'text-cyan-600' : 'text-emerald-600'
                          }`}>{sd.duration}′</span>
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Durada</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider ${
                              isHydration ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-emerald-100 text-emerald-850 border border-emerald-200'
                            }`}>
                              {isHydration ? 'Descans fìsic' : 'Tir lliure'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">Ordre #{realIdx + 1}</span>
                          </div>
                          
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                            {isHydration ? '💧' : '🏀'} {sd.title}
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
                            title="Subir de orden"
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
                            title="Bajar de orden"
                            className="p-1 px-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded bg-white border border-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        {/* Drill session custom note editor */}
                        <div className="relative">
                          {activeNoteEditId === `${sd.drillId}-${realIdx}` ? (
                            <div className="absolute right-0 bottom-full mb-2 bg-white border border-slate-250 rounded-xl shadow-lg p-3 z-30 w-64 space-y-2">
                              <label className="text-[10px] uppercase font-bold text-slate-400 block">Observación para este ejercicio:</label>
                              <input
                                id={`note-input-${realIdx}`}
                                type="text"
                                defaultValue={sd.notes || ''}
                                draggable={false}
                                onDragStart={(e) => e.stopPropagation()}
                                placeholder="Ej. Excluir botes innecesarios"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleNoteSave(realIdx, (e.target as HTMLInputElement).value);
                                  }
                                }}
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                                autoFocus
                              />
                              <p className="text-[9px] text-slate-400">Pulsa Intro para guardar la anotación táctica.</p>
                            </div>
                          ) : (
                            <button
                              id={`btn-toggle-note-${realIdx}`}
                              onClick={() => setActiveNoteEditId(`${sd.drillId}-${realIdx}`)}
                              draggable={false}
                              onDragStart={(e) => e.stopPropagation()}
                              title="Añadir nota táctica específica para hoy"
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
                          title="Quitar de esta sesión"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition border border-dashed border-slate-200 hover:border-red-200 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                }

                const realIdx = sd.realIndex;

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
                    className={`border rounded-md p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition shadow-xs group cursor-grab active:cursor-grabbing ${
                      draggedIndex === realIdx 
                        ? 'opacity-40 border-slate-300 border-dashed bg-slate-50' 
                        : dragOverIndex === realIdx 
                          ? 'border-orange-500 scale-[1.01] bg-orange-50/40' 
                          : 'bg-white border-slate-200 hover:border-orange-400'
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
                          title="Subir de orden"
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
                          title="Bajar de orden"
                          className="p-1 px-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded bg-white border border-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      {/* Drill session custom note editor */}
                      <div className="relative">
                        {activeNoteEditId === `${sd.drillId}-${realIdx}` ? (
                          <div className="absolute right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-30 w-64 space-y-2">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block">Observación para este ejercicio:</label>
                            <input
                              id={`note-input-${realIdx}`}
                              type="text"
                              defaultValue={sd.notes || ''}
                              draggable={false}
                              onDragStart={(e) => e.stopPropagation()}
                              placeholder="Ej. Excluir botes innecesarios"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleNoteSave(realIdx, (e.target as HTMLInputElement).value);
                                }
                              }}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                              autoFocus
                            />
                            <p className="text-[9px] text-slate-400">Pulsa Intro para guardar la anotación táctica.</p>
                          </div>
                        ) : (
                          <button
                            id={`btn-toggle-note-${realIdx}`}
                            onClick={() => setActiveNoteEditId(`${sd.drillId}-${realIdx}`)}
                            draggable={false}
                            onDragStart={(e) => e.stopPropagation()}
                            title="Añadir nota táctica específica para hoy"
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
                        title="Quitar de esta sesión"
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
                Llevar al Móvil (Modo Pista)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Quick-add Library Drills selector Panel (4 columns) */}
      <div id="quick-add-panel" className="xl:col-span-4 bg-white border border-slate-200 rounded-sm p-6 space-y-5 shadow-xs">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Exercicis Disponibles</h3>
          <p className="text-xs text-slate-500">Afegeix-los de forma instantània prement el botó.</p>
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

        <div id="quick-drills-list" className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {drills.map((drill) => {
            const isAlreadyIn = session.drills.some(sd => sd.drillId === drill.id);
            return (
              <div
                id={`quick-drill-item-${drill.id}`}
                key={drill.id}
                className="p-3 border border-slate-250 rounded-sm bg-white hover:border-orange-450 transition flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-sm lg:rounded-none text-[8px] bg-slate-100 font-extrabold text-slate-600 uppercase tracking-wider">
                      {drill.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1 pl-1">
                      <Clock size={10} />
                      {drill.duration}′
                    </span>
                  </div>
                  <h4 
                    onClick={() => onPreviewDrill(drill)}
                    title="Clica per veure el manual tàctic"
                    className="text-xs font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-orange-650 hover:underline cursor-pointer transition-colors"
                  >
                    {drill.title}
                  </h4>
                </div>

                <button
                  id={`btn-quick-add-${drill.id}`}
                  onClick={() => handleAddDrillToSession(drill.id)}
                  type="button"
                  className="px-3 py-1.5 rounded-sm bg-orange-500 hover:bg-orange-600 transition text-[10px] font-black uppercase text-white flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                >
                  <Plus size={11} strokeWidth={3} />
                  Afegir
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
