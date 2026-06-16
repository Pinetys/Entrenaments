import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Clipboard, 
  Zap, 
  Users, 
  NotebookText, 
  AlertOctagon,
  Volume2,
  Expand,
  Minimize,
  X
} from 'lucide-react';
import { Drill, TrainingSession, BoardState } from '../types';
import TacticalBoard from './TacticalBoard';
import { getEnhancedSessionDrills } from './SessionPlanner';

interface MobileCourtViewProps {
  session: TrainingSession;
  drills: Drill[];
  onBackToPlanner: () => void;
  onPreviewDrill?: (drill: Drill) => void;
  isSharedMobile?: boolean;
  onUpdateSession?: (updatedSession: TrainingSession) => void;
}

export default function MobileCourtView({ 
  session, 
  drills, 
  onBackToPlanner, 
  onPreviewDrill,
  isSharedMobile = false,
  onUpdateSession
}: MobileCourtViewProps) {
  const [activeDrillIndex, setActiveDrillIndex] = useState(0);
  const [isFullscreenBoard, setIsFullscreenBoard] = useState(false);
  const [showSessionEditor, setShowSessionEditor] = useState(false);
  const [editorSearchText, setEditorSearchText] = useState('');

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(75 * 60); // 75 minutes of training remaining
  const [timerRunning, setTimerRunning] = useState(false);
  const [showFinishedToast, setShowFinishedToast] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active diagram navigation inside exercises
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);

  // Active training drill resolving with physical water breaks and active shooting loops
  const drillsInSession = getEnhancedSessionDrills(session.drills, drills);

  // Safely clamp activeDrillIndex to ensure no index out of bounds crashes
  const safeActiveIndex = Math.min(Math.max(0, activeDrillIndex), Math.max(0, drillsInSession.length - 1));
  const activeDrill = drillsInSession[safeActiveIndex];

  // Extract all available diagrams/phases for the active drill
  const activeDrillAny = activeDrill as any;
  const activeBoardStates: BoardState[] = activeDrillAny?.boardStates && activeDrillAny.boardStates.length > 0
    ? activeDrillAny.boardStates 
    : [activeDrillAny?.boardState || { paths: [], pins: [] }];

  // Safely clamp activeBoardIndex to activeBoardStates length
  const safeBoardIndex = Math.min(Math.max(0, activeBoardIndex), activeBoardStates.length - 1);
  const currentBS = activeBoardStates[safeBoardIndex];

  // Reset phase slide view indicator whenever a new exercise layout loads
  useEffect(() => {
    setActiveBoardIndex(0);
  }, [safeActiveIndex]);

  // Sync index if length of active drills decreases
  useEffect(() => {
    if (activeDrillIndex >= drillsInSession.length && drillsInSession.length > 0) {
      setActiveDrillIndex(drillsInSession.length - 1);
    }
  }, [drillsInSession.length, activeDrillIndex]);

  // Sync Timer when active drill changes
  useEffect(() => {
    if (activeDrill) {
      setTimeLeft(activeDrill.duration * 60);
      setTimerRunning(false);
      setShowFinishedToast(false);
    }
  }, [safeActiveIndex, session.drills]);

  // Audio Whistle synthesiser using Web Audio API (Zero-dependency, works 100% offline & instantly)
  const playSynthesizedWhistle = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // High pitched double beep representing a referee whistle
      const playBeep = (delay: number, duration: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'triangle'; // rich retro whistle sound
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + delay + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration - 0.02);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      // Play double sharp blast
      playBeep(0, 0.45, 1200);   // First blast
      playBeep(0.1, 0.45, 1400);  // overlapping vibrato blast
      playBeep(0.6, 0.4, 1300);   // Second sharp blast
    } catch (e) {
      console.warn("Audio Context blocked or not supported on this browser frame", e);
    }
  };

  // Timer tick runner
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        // Decrease overall session-wide stopwatch
        setSessionTimeLeft((prevSess) => Math.max(0, prevSess - 1));

        // Decrease active drill single timer
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            playSynthesizedWhistle();
            // Trigger custom visual flash toast state
            setShowFinishedToast(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, activeDrillIndex]);

  if (drillsInSession.length === 0) {
    return (
      <div id="empty-court-view" className="max-w-md mx-auto text-center py-20 px-5 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-4">
        <AlertOctagon size={44} className="text-orange-500 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold">Sin Entrenamientos Programados</h3>
        <p className="text-xs text-slate-400">
          Debes añadir ejercicios al planificador semanal de hoy (Día 1 / Día 2) antes de abrir el Modo Móvil/Pista.
        </p>
        <button
          id="btn-empty-back"
          onClick={onBackToPlanner}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-xs font-bold uppercase rounded-xl transition cursor-pointer"
        >
          Volver al Planificador
        </button>
      </div>
    );
  }

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const nextDrill = () => {
    if (safeActiveIndex < drillsInSession.length - 1) {
      setActiveDrillIndex(safeActiveIndex + 1);
    }
  };

  const prevDrill = () => {
    if (safeActiveIndex > 0) {
      setActiveDrillIndex(safeActiveIndex - 1);
    }
  };

  return (
    <div id="mobile-court-view-layout" className="max-w-md mx-auto bg-slate-950 text-white min-h-[750px] flex flex-col rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden select-none">
      
      {/* HEADER BAR FOR MOBILE */}
      <div id="mobile-header" className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        {!isSharedMobile ? (
          <button
            id="btn-mobile-back"
            onClick={onBackToPlanner}
            className="text-xs px-2.5 py-1.5 font-bold rounded-lg bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft size={16} /> Volver
          </button>
        ) : (
          <div className="w-[85px]" />
        )}
        <div className="text-center">
          <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest block font-mono">Modo Pista (Junior A)</span>
          <span className="text-xs font-semibold text-slate-200 truncate max-w-40 block">{session.name}</span>
        </div>
        <button
          id="btn-whistle-demo"
          onClick={playSynthesizedWhistle}
          title="Tocar silbato de prueba"
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-orange-400 cursor-pointer active:scale-95 transition"
        >
          <Volume2 size={15} />
        </button>
      </div>

      {/* TIMING DOUBLE STOPWATCH UNIT */}
      <div id="mobile-stopwatch-unit" className="px-5 py-3.5 bg-slate-900/40 border-b border-slate-800 shrink-0 grid grid-cols-12 gap-3 items-center">
        {/* LEFT COLUMN: ACTIVE EXERCISE COOLDOWN (8 cols) */}
        <div className="col-span-8 flex items-center justify-between border-r border-slate-800 pr-3">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Crono Exercici Actiu</span>
            <span className={`text-3xl font-extrabold font-mono tracking-tighter ${timerRunning ? 'text-green-400 animate-pulse' : 'text-slate-300'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-toggle-timer"
              type="button"
              onClick={() => setTimerRunning(!timerRunning)}
              className={`p-2.5 rounded-full font-bold shadow transition active:scale-95 cursor-pointer ${
                timerRunning 
                  ? 'bg-rose-600 text-white hover:bg-rose-700' 
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-600'
              }`}
            >
              {timerRunning ? <Pause size={14} strokeWidth={3} /> : <Play size={14} strokeWidth={3} />}
            </button>
            
            <button
              id="btn-reset-timer"
              type="button"
              onClick={() => {
                setTimeLeft(activeDrill.duration * 60);
                setTimerRunning(false);
              }}
              title="Reiniciar crono exercici"
              className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-full hover:bg-slate-700 transition active:scale-95 cursor-pointer"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: TRAINING SESSION TOTAL LIMIT STOPWATCH (4 cols) */}
        <div className="col-span-4 pl-1">
          <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider block whitespace-nowrap">Temps Sessió (75′)</span>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <span className={`text-lg font-bold font-mono tracking-tighter ${timerRunning ? 'text-orange-500' : 'text-slate-400'}`}>
              {formatTime(sessionTimeLeft)}
            </span>
            <button
              id="btn-reset-session-timer"
              type="button"
              onClick={() => {
                setSessionTimeLeft(75 * 60);
              }}
              title="Reiniciar crono de 75 minuts d'entrenament"
              className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded transition cursor-pointer"
            >
              <RotateCcw size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK SESSION ACTIONS BAR */}
      <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Sessió activa</span>
        </div>
        <button
          type="button"
          onClick={() => setShowSessionEditor(true)}
          className="px-3 py-1.5 bg-orange-655 hover:bg-orange-700 active:scale-95 text-[10px] font-black uppercase tracking-wider text-white rounded bg-orange-600 transition flex items-center gap-1 cursor-pointer"
        >
          ✏️ Exercicis de la sessió
        </button>
      </div>

      {/* CORE DISPLAY SWIPE BODY */}
      <div id="mobile-swipe-body" className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        
        {/* TIME COMPLETE CUSTOM TOAST ALARM BANNER (Non-blocking) */}
        {showFinishedToast && (
          <div className="bg-red-700 border border-red-500 rounded-sm p-4 text-white shadow-md flex flex-col gap-3 animate-pulse">
            <div className="flex items-start gap-2.5">
              <span className="text-2xl mt-0.5">⏱️</span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-red-200">TEMPS EXHAURIT!</h4>
                <p className="text-xs font-bold leading-normal mt-1">
                  S'ha completat el període planificat per a: <strong className="underline font-black">"{activeDrill.title}"</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowFinishedToast(false)}
                className="px-3 py-1.5 bg-white text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-none active:scale-95 transition"
              >
                Ignorar
              </button>
              {safeActiveIndex < drillsInSession.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    nextDrill();
                    setShowFinishedToast(false);
                  }}
                  className="px-3 py-1.5 bg-red-950 text-white border border-red-500 text-[9px] font-black uppercase tracking-wider rounded-none active:scale-95 transition"
                >
                  Següent Exercici ➔
                </button>
              )}
            </div>
          </div>
        )}

        {/* Drill Title block navigation */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 shrink-0 shadow-sm">
          <button
            id="btn-swipe-prev"
            onClick={prevDrill}
            disabled={safeActiveIndex === 0}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer active:scale-95 transition"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          <div 
            onClick={() => {
              // Find the original full drill object if possible
              const orig = drills.find(d => d.id === activeDrill.drillId) || activeDrill as any;
              if (onPreviewDrill && orig) onPreviewDrill(orig);
            }}
            title="Veure el manual tàctic tipus llibre"
            className="text-center min-w-0 flex-1 px-2 cursor-pointer group select-none active:scale-95 transition"
          >
            <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-bold tracking-wider font-mono uppercase block w-max mx-auto mb-1 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              Exercici {safeActiveIndex + 1} de {drillsInSession.length} ({activeDrill.duration}′) • 📖 Ver manual
            </span>
            <h3 className="text-sm font-extrabold text-white truncate underline group-hover:text-orange-400 decoration-dotted">{activeDrill.title}</h3>
          </div>

          <button
            id="btn-swipe-next"
            onClick={nextDrill}
            disabled={safeActiveIndex === drillsInSession.length - 1}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer active:scale-95 transition"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* TACTICAL BOARD DISPLAY OR SPECIAL POSTER FOR VIRTUAL PAUSES */}
        {activeDrill.isVirtual ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-inner min-h-64 flex flex-col justify-center items-center">
            {activeDrill.virtualType === 'hydration' ? (
              <>
                <div className="w-20 h-20 bg-cyan-500/15 text-cyan-400 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-4xl">💧</span>
                </div>
                <h4 className="text-lg font-black text-cyan-300 uppercase tracking-wide">Descans d'Hidratació</h4>
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed font-sans">
                  Beu aigua ràpid, recupera l’alè i escolta els ajustos táctics de l’entrenador per a la segona meitat!
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-orange-500/15 text-orange-400 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-4xl">🏀</span>
                </div>
                <h4 className="text-lg font-black text-orange-300 uppercase tracking-wide font-sans">Ronda de Tirs Lliures</h4>
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed font-sans font-medium">
                  Tir lliure de competició: 10 llançaments per parella. Concentració, relaxació i mecànica de llançament perfecte!
                </p>
              </>
            )}
          </div>
        ) : (
          <div id="mobile-tactical-container" className="space-y-2 relative">
            <div className="flex items-center justify-between pl-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>Esquema del Ejercicio</span>
                {activeBoardStates.length > 1 && (
                  <span className="text-[9px] bg-orange-650 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                    Grafisme {activeBoardIndex + 1} de {activeBoardStates.length}
                  </span>
                )}
              </label>
              <button
                id="btn-expand-board"
                onClick={() => setIsFullscreenBoard(!isFullscreenBoard)}
                className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer py-0.5 font-sans"
              >
                {isFullscreenBoard ? (
                  <>
                    <Minimize size={11} /> Reducir
                  </>
                ) : (
                  <>
                    <Expand size={11} /> Pantalla Completa
                  </>
                )}
              </button>
            </div>

            {/* Quick Slide Navigation Tabs */}
            {activeBoardStates.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 select-none no-scrollbar">
                {activeBoardStates.map((_, bIdx) => (
                  <button
                    key={bIdx}
                    onClick={() => setActiveBoardIndex(bIdx)}
                    className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer shrink-0 ${
                      activeBoardIndex === bIdx
                        ? 'bg-orange-500 text-white shadow'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Graf. {bIdx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Interactive tactile board wrapper */}
            <div className={`transition-all duration-300 ${
              isFullscreenBoard 
                ? 'fixed inset-0 bg-slate-950 z-50 p-4 flex flex-col justify-center' 
                : 'w-full'
            }`}>
              {isFullscreenBoard && activeBoardStates.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-4 self-center select-none no-scrollbar">
                  {activeBoardStates.map((_, bIdx) => (
                    <button
                      key={bIdx}
                      onClick={() => setActiveBoardIndex(bIdx)}
                      className={`px-4 py-1.5 rounded text-xs font-black uppercase tracking-wider transition shrink-0 ${
                        activeBoardIndex === bIdx
                          ? 'bg-orange-500 text-white shadow'
                          : 'bg-slate-900 border border-slate-800 text-slate-350'
                      }`}
                    >
                      Grafisme {bIdx + 1}
                    </button>
                  ))}
                </div>
              )}
              
              <TacticalBoard boardState={currentBS} onChange={() => {}} readOnly={isFullscreenBoard ? false : true} />
              
              {isFullscreenBoard && (
                <button
                  id="btn-close-fullscreen-board"
                  onClick={() => setIsFullscreenBoard(false)}
                  className="mt-4 w-full py-2 bg-orange-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition shrink-0"
                >
                  Cerrar Pantalla Completa
                </button>
              )}
            </div>
          </div>
        )}

        {/* CUSTOM NOTES SPECIFIC FOR THE ACTIVE TRAINING DAY */}
        {activeDrill.notes && (
          <div id="mobile-drill-quick-note" className="bg-amber-500/10 border-2 border-amber-500/30 text-amber-200 px-4 py-3 rounded-2xl text-xs space-y-1">
            <span className="font-extrabold uppercase tracking-widest text-[10px] text-amber-400 block flex items-center gap-1">
              <Zap size={11} className="fill-amber-400 text-amber-400 animate-bounce" />
              Observación de hoy (Junior A):
            </span>
            <p className="font-bold leading-relaxed">{activeDrill.notes}</p>
          </div>
        )}

        {/* DRILL LARGE CHECKLIST DETAILS FOR COACH SCANNING */}
        <div className="space-y-4">
          
          {/* Direct Instructions list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-3 shadow-xs">
            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 border-b border-slate-800 pb-1.5 shrink-0">
              <Clipboard size={12} className="text-orange-400" />
              Instrucciones y Dinámica (Paso a Paso)
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
              {activeDrill.description}
            </p>
          </div>

          {/* Objectives Bullet points checklists */}
          {activeDrill.objectives && activeDrill.objectives.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-3 shadow-xs">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 border-b border-slate-800 pb-1.5 shrink-0">
                <Users size={12} className="text-sky-400" />
                Puntos de Enfoque Junior Nivel A
              </h4>
              <ul className="space-y-2.5">
                {activeDrill.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-100">
                    <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="font-medium leading-relaxed">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Setup Instructions */}
          {activeDrill.setupInstructions && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-2 shadow-xs">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <NotebookText size={12} className="text-yellow-400" />
                Reglas / Limitaciones de Pista
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                "{activeDrill.setupInstructions}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QUICK FOOTER DOTS TRACKER */}
      <div id="mobile-dots-indicator" className="py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-1.5 shrink-0">
        {drillsInSession.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveDrillIndex(i)}
            type="button"
            className={`w-2 h-2 rounded-full cursor-pointer transition ${
              safeActiveIndex === i ? 'bg-orange-500 scale-125' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* SESSION EDITOR DRAWER IN MOBILE VIEW */}
      {showSessionEditor && (
        <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-950/98 backdrop-blur-md z-50 flex flex-col animate-in slide-in-from-bottom duration-250 select-text">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">✏️</span>
              <div className="text-left">
                <h4 className="text-xs font-black uppercase text-white tracking-wider">Modificar exercicis</h4>
                <p className="text-[10px] text-slate-400">Canvia l’ordre, la durada o afegeix nous exercicis</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSessionEditor(false)}
              className="p-1 px-2.5 text-slate-400 hover:text-white rounded bg-slate-850 hover:bg-slate-800 transition text-xs font-bold"
            >
              Tancar
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left">
            {/* CURRENT DRILLS IN SESSION */}
            <div className="space-y-2.5">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-400">Exercicis a l'Entrenament d'Avui</h5>
              
              {session.drills.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  No hi ha exercicis en aquest entrenament. Afegeix-ne un a sota!
                </div>
              ) : (
                <div className="space-y-2">
                  {session.drills.map((sd, sIdx) => {
                    const drillItem = drills.find(d => d.id === sd.drillId);
                    if (!drillItem) return null;

                    return (
                      <div key={sIdx} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between gap-3 shadow-xs">
                        {/* Bullet & text */}
                        <div className="min-w-0 flex-grow text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono font-bold">
                              # {sIdx + 1}
                            </span>
                            <span className="text-[8px] bg-orange-500/15 text-orange-400 px-1 rounded uppercase tracking-wider font-extrabold max-w-28 truncate">
                              {drillItem.category}
                            </span>
                          </div>
                          <h6 className="text-[11px] font-black text-white mt-1 truncate">{drillItem.title}</h6>
                          
                          {/* Duration adjustments */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedDrills = [...session.drills];
                                updatedDrills[sIdx] = {
                                  ...updatedDrills[sIdx],
                                  duration: Math.max(1, sd.duration - 1)
                                };
                                const updatedSession = {
                                  ...session,
                                  drills: updatedDrills,
                                  totalDuration: updatedDrills.reduce((acc, c) => acc + c.duration, 0)
                                };
                                if (onUpdateSession) onUpdateSession(updatedSession);
                              }}
                              className="w-5 h-5 bg-slate-800 hover:bg-slate-750 text-white font-black text-xs rounded-sm flex items-center justify-center cursor-pointer transition select-none"
                            >
                              -
                            </button>
                            <span className="text-[10px] font-mono font-bold text-slate-300">
                              {sd.duration} MIN
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedDrills = [...session.drills];
                                updatedDrills[sIdx] = {
                                  ...updatedDrills[sIdx],
                                  duration: sd.duration + 1
                                };
                                const updatedSession = {
                                  ...session,
                                  drills: updatedDrills,
                                  totalDuration: updatedDrills.reduce((acc, c) => acc + c.duration, 0)
                                };
                                if (onUpdateSession) onUpdateSession(updatedSession);
                              }}
                              className="w-5 h-5 bg-slate-800 hover:bg-slate-750 text-white font-black text-xs rounded-sm flex items-center justify-center cursor-pointer transition select-none"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Reordering & deleting actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={sIdx === 0}
                            onClick={() => {
                              const updatedDrills = [...session.drills];
                              const temp = updatedDrills[sIdx];
                              updatedDrills[sIdx] = updatedDrills[sIdx - 1];
                              updatedDrills[sIdx - 1] = temp;
                              const updatedSession = {
                                ...session,
                                drills: updatedDrills,
                                totalDuration: updatedDrills.reduce((acc, c) => acc + c.duration, 0)
                              };
                              if (onUpdateSession) onUpdateSession(updatedSession);
                            }}
                            className="p-1 px-1.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded disabled:opacity-20 cursor-pointer text-[9px]"
                          >
                            ▲
                          </button>
                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={sIdx === session.drills.length - 1}
                            onClick={() => {
                              const updatedDrills = [...session.drills];
                              const temp = updatedDrills[sIdx];
                              updatedDrills[sIdx] = updatedDrills[sIdx + 1];
                              updatedDrills[sIdx + 1] = temp;
                              const updatedSession = {
                                ...session,
                                drills: updatedDrills,
                                totalDuration: updatedDrills.reduce((acc, c) => acc + c.duration, 0)
                              };
                              if (onUpdateSession) onUpdateSession(updatedSession);
                            }}
                            className="p-1 px-1.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded disabled:opacity-20 cursor-pointer text-[9px]"
                          >
                            ▼
                          </button>
                          {/* Trash Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedDrills = session.drills.filter((_, i) => i !== sIdx);
                              const updatedSession = {
                                ...session,
                                drills: updatedDrills,
                                totalDuration: updatedDrills.reduce((acc, c) => acc + c.duration, 0)
                              };
                              if (onUpdateSession) onUpdateSession(updatedSession);
                            }}
                            className="p-1 px-1.5 bg-rose-950 hover:bg-rose-900 text-red-400 rounded cursor-pointer transition text-[9px]"
                            title="Treure de la sessió"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CHOOSE EXTRA EXERCISES TO ADD */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="space-y-1">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-sky-400">Afegir Exercicis de la Biblioteca</h5>
                <p className="text-[9px] text-slate-400 font-sans">Cerca un exercici de la col·lecció per afegir-lo d'immediat.</p>
              </div>

              {/* Search bar */}
              <input
                type="text"
                placeholder="🔍 Filtra per títol..."
                value={editorSearchText}
                onChange={(e) => setEditorSearchText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-left">
                {drills
                  .filter(d => {
                    const matchesSearch = d.title.toLowerCase().includes(editorSearchText.toLowerCase()) || 
                                          d.description.toLowerCase().includes(editorSearchText.toLowerCase());
                    return matchesSearch;
                  })
                  .map(d => {
                    const isAlreadyAdded = session.drills.some(sd => sd.drillId === d.id);

                    return (
                      <div key={d.id} className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg flex items-center justify-between gap-3 text-left">
                        <div className="min-w-0 flex-1">
                          <span className="text-[7px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase font-black font-mono">
                            {d.category}
                          </span>
                          <h6 className="text-[11px] font-extrabold text-slate-350 mt-0.5 truncate">{d.title}</h6>
                          <p className="text-[9px] text-slate-450 font-mono">{d.duration} MIN</p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const newDrillRef = {
                              drillId: d.id,
                              duration: d.duration,
                              notes: "Afegit des de dispositiu mòbil"
                            };
                            const updatedDrills = [...session.drills, newDrillRef];
                            const updatedSession = {
                              ...session,
                              drills: updatedDrills,
                              totalDuration: updatedDrills.reduce((acc, c) => acc + c.duration, 0)
                            };
                            if (onUpdateSession) onUpdateSession(updatedSession);
                          }}
                          className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider transition shrink-0 cursor-pointer ${
                            isAlreadyAdded
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-orange-500 hover:bg-orange-600 text-white'
                          }`}
                        >
                          {isAlreadyAdded ? '+ Afegir' : '➕ Afegir'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Footer of Drawer */}
          <div className="px-5 py-4 bg-slate-900 border-t border-slate-850 shrink-0 text-center">
            <button
              type="button"
              onClick={() => setShowSessionEditor(false)}
              className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition font-sans"
            >
              Completar i Desar canvis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
