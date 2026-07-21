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
  Megaphone,
  Expand,
  Minimize,
  Check,
  X
} from 'lucide-react';
import { Drill, TrainingSession, BoardState, SessionCompletion } from '../types';
import TacticalBoard from './TacticalBoard';
import { getEnhancedSessionDrills } from './SessionPlanner';

interface MobileCourtViewProps {
  session: TrainingSession;
  drills: Drill[];
  onBackToPlanner: () => void;
  onPreviewDrill?: (drill: Drill) => void;
  isSharedMobile?: boolean;
  onUpdateSession?: (updatedSession: TrainingSession) => void;
  onAddDrill?: (drill: Drill) => void;
  completions?: SessionCompletion[];
  onToggleCompleteSession?: (sessionId: string) => void;
  activePlanId?: string;
  syncCode?: string;
  isLinked?: boolean;
  onOpenSync?: () => void;
  isSyncing?: boolean;
  lastSynced?: Date | null;
}

export default function MobileCourtView({ 
  session, 
  drills, 
  onBackToPlanner, 
  onPreviewDrill,
  isSharedMobile = false,
  onUpdateSession,
  onAddDrill,
  completions = [],
  onToggleCompleteSession,
  activePlanId = 'plan-default',
  syncCode = '',
  isLinked = false,
  onOpenSync,
  isSyncing = false,
  lastSynced = null
}: MobileCourtViewProps) {
  const [activeDrillIndex, setActiveDrillIndex] = useState(0);
  const [isFullscreenBoard, setIsFullscreenBoard] = useState(false);
  const [showSessionEditor, setShowSessionEditor] = useState(false);
  const [isMotionMode, setIsMotionMode] = useState(false);
  const [editorSearchText, setEditorSearchText] = useState('');
  const [addCategoryFilter, setAddCategoryFilter] = useState<'Tots' | 'Escalfament' | 'Atac' | 'Defensa'>('Tots');
  const [showSyncCallout, setShowSyncCallout] = useState(true);

  // Network connection status for completely offline Modo Pista support
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(75 * 60); // 75 minutes of training remaining
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionTimerRunning, setSessionTimerRunning] = useState(false);
  const [showFinishedToast, setShowFinishedToast] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Rest timer states
  const [configuredRestTime, setConfiguredRestTime] = useState(60);
  const [restTimeLeft, setRestTimeLeft] = useState(60);
  const [restTimerRunning, setRestTimerRunning] = useState(false);
  const [showRestFinishedToast, setShowRestFinishedToast] = useState(false);

  // Active diagram navigation inside exercises
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);

  // Intensity stopwatch and effort peak tracking states
  const [intensityElapsed, setIntensityElapsed] = useState(0);
  const [intensityTimerRunning, setIntensityTimerRunning] = useState(false);
  const [selectedIntensityLevel, setSelectedIntensityLevel] = useState<number>(3);
  const [intensityPeaks, setIntensityPeaks] = useState<Record<string, { peakTime: string; intensityLabel: string; level: number }>>({});
  const [toast, setToast] = useState<string | null>(null);

  const triggerLocalToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => prev === msg ? null : prev);
    }, 2500);
  };

  // Load registered intensity peaks on session change
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`basket_planner_intensity_peaks_${session.id}`);
      if (stored) {
        setIntensityPeaks(JSON.parse(stored));
      } else {
        setIntensityPeaks({});
      }
    } catch (e) {
      console.warn("Failed to load intensity peaks from localStorage", e);
    }
    setIntensityElapsed(0);
    setIntensityTimerRunning(false);
  }, [session.id]);

  // Propagate main timer execution to intensity stopwatch automatically
  useEffect(() => {
    setIntensityTimerRunning(timerRunning);
  }, [timerRunning]);

  const handleMarkPeakEffort = () => {
    const peakTimeStr = formatTime(intensityElapsed);
    const labelMap: Record<number, string> = {
      1: 'Baix 🍃',
      2: 'Moderat 🟡',
      3: 'Alta Intensitat 🟠',
      4: 'Molt Alta (Llàctic) 🔴',
      5: 'Màxim Esforç (Pic) 💀'
    };
    
    const newPeak = {
      peakTime: peakTimeStr,
      intensityLabel: labelMap[selectedIntensityLevel] || 'Alta',
      level: selectedIntensityLevel
    };

    const updated = {
      ...intensityPeaks,
      [activeDrill.id]: newPeak
    };

    setIntensityPeaks(updated);
    localStorage.setItem(`basket_planner_intensity_peaks_${session.id}`, JSON.stringify(updated));
    triggerLocalToast(`🔥 Pic d'esforç registrat a les ${peakTimeStr}!`);
    playSynthesizedWhistle();
  };

  // Active training drill resolving with physical water breaks and active shooting loops
  const drillsInSession = getEnhancedSessionDrills(session.drills, drills);

  // Safely clamp activeDrillIndex to ensure no index out of bounds crashes
  const safeActiveIndex = Math.min(Math.max(0, activeDrillIndex), Math.max(0, drillsInSession.length - 1));
  const activeDrill = drillsInSession[safeActiveIndex];

  // Sync intensity timers when transitioning between active drills
  useEffect(() => {
    setIntensityElapsed(0);
    setIntensityTimerRunning(timerRunning);
  }, [safeActiveIndex]);

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

  // Sync Timer when active drill changes (uses stable, primitive parameters to prevent timer reset glitches)
  useEffect(() => {
    if (activeDrill) {
      setTimeLeft(activeDrill.duration * 60);
      setTimerRunning(false);
      setShowFinishedToast(false);
    }
  }, [safeActiveIndex, activeDrill?.id]);

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

  // Audio Buzzer (Basketball Horn) synthesiser using Web Audio API (dissonant sawtooth waves)
  const playSynthesizedBuzzer = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const duration = 1.6; // authentic basketball horn length
      const baseFreq = 75; // low frequency bass of the horn
      
      // Detuned sawtooth harmonics for the raspy electric buzz of a basket horn
      const frequencies = [baseFreq, baseFreq * 2, baseFreq * 3, baseFreq * 4, baseFreq * 5, baseFreq * 6];
      
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq + (idx * 0.4 - 1.0), ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3 / frequencies.length, ctx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.3 / frequencies.length, ctx.currentTime + duration - 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      });
    } catch (e) {
      console.warn("Audio Context blocked or not supported on this browser frame", e);
    }
  };

  // Timer tick runner
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionTimerRunning) {
        setSessionTimeLeft((prevSess) => Math.max(0, prevSess - 1));
      }

      if (restTimerRunning) {
        setRestTimeLeft((prevRest) => {
          if (prevRest <= 1) {
            setRestTimerRunning(false);
            playSynthesizedWhistle();
            setShowRestFinishedToast(true);
            return 0;
          }
          return prevRest - 1;
        });
      }

      if (timerRunning) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            playSynthesizedBuzzer();
            // Trigger custom visual flash toast state
            setShowFinishedToast(true);
            return 0;
          }
          return prev - 1;
        });
      }

      if (intensityTimerRunning) {
        setIntensityElapsed((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, sessionTimerRunning, restTimerRunning, activeDrillIndex, intensityTimerRunning]);

  if (drillsInSession.length === 0) {
    return (
      <div id="empty-court-view" className="max-w-md mx-auto text-center py-20 px-5 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-4">
        <AlertOctagon size={44} className="text-orange-500 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold">Sense Entrenaments Programats</h3>
        <p className="text-xs text-slate-400">
          Has d'afegir exercicis al planificador de la sessió seleccionada abans d'obrir el Modo Pista (Mòbil).
        </p>
        <button
          id="btn-empty-back"
          onClick={onBackToPlanner}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-xs font-bold uppercase rounded-xl transition cursor-pointer"
        >
          Tornar al Planificador
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

  const isSessionCompleted = completions.some(c => c.planId === activePlanId && c.sessionId === session.id);

  return (
    <div id="mobile-court-view-layout" className="w-full max-w-md mx-auto bg-slate-950 text-white min-h-screen md:min-h-[750px] flex flex-col md:rounded-3xl md:border md:border-slate-800 md:shadow-2xl relative overflow-hidden select-none">
      
      {/* Network & Completion Control Center for fully supported offline session tracking */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-xs font-sans shrink-0 gap-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse shadow-xs shadow-emerald-400' : 'bg-amber-500 shadow-xs shadow-amber-400 animate-ping'}`}></span>
          <span className="text-[9px] font-bold font-mono tracking-wide text-slate-300">
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {syncCode && isLinked ? (
          <button
            type="button"
            onClick={onOpenSync}
            className="px-2.5 py-1 rounded bg-slate-900 border border-emerald-500 hover:bg-slate-800 text-[9px] font-extrabold text-emerald-400 tracking-widest flex items-center gap-1.5 active:scale-95 transition cursor-pointer shadow-md shadow-emerald-500/10"
            title="Sincronització Núvol Activa. Codi vinculat."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono">{syncCode}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenSync}
            className="px-2.5 py-1 rounded bg-amber-950/85 border border-amber-500 hover:bg-amber-900 text-[9px] font-black text-amber-300 tracking-widest flex items-center gap-1 active:scale-95 transition cursor-pointer animate-pulse shadow-lg shadow-amber-500/15"
            title="Estat Local. Prem per vincular amb l'ordinador per sincronitzar exercicis."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>VINCULAR MÒBIL</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (onToggleCompleteSession) {
              onToggleCompleteSession(session.id);
            }
          }}
          className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition active:scale-95 cursor-pointer border ${
            isSessionCompleted 
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-450 hover:bg-emerald-500/20' 
              : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-700/50 shadow-xs'
          }`}
        >
          {isSessionCompleted ? (
            <>
              <Check size={10} strokeWidth={3.5} />
              <span>Sessió Feta ✓</span>
            </>
          ) : (
            <>
              <span>Finalitzar Sessió</span>
            </>
          )}
        </button>
      </div>

      {/* DISMISSIBLE SYNC REMINDER CALLOUT */}
      {!isLinked && showSyncCallout && (
        <div className="bg-gradient-to-r from-amber-600/25 to-orange-600/25 border-b border-amber-500/20 px-4 py-2.5 text-[10px] leading-relaxed flex items-start gap-2 relative animate-in slide-in-from-top duration-300 select-none">
          <span className="text-xs select-none">💡</span>
          <div className="flex-1 space-y-0.5">
            <p className="font-bold text-amber-300">Vols veure els teus exercicis de l'ordinador?</p>
            <p className="text-slate-300 font-sans">
              El mòbil està en mode local. Prem <strong className="text-amber-300">"VINCULAR MÒBIL"</strong> a dalt o escaneja el codi QR del planificador de l'ordinador per enllaçar-los a l'instant!
            </p>
          </div>
          <button 
            onClick={() => setShowSyncCallout(false)}
            className="p-1 -mr-1 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
            title="Tancar avís"
          >
            <X size={12} />
          </button>
        </div>
      )}

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
        <div className="flex items-center gap-1">
          <button
            id="btn-whistle-demo"
            onClick={playSynthesizedWhistle}
            title="Tocar xiulet d’entrenador (Silbato)"
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-amber-400 cursor-pointer active:scale-95 transition"
          >
            <Volume2 size={14} />
          </button>
          <button
            id="btn-buzzer-demo"
            onClick={playSynthesizedBuzzer}
            title="Tocar bocina de bàsquet (Buzzer)"
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-red-500 cursor-pointer active:scale-95 transition"
          >
            <Megaphone size={14} />
          </button>
        </div>
      </div>

  {/* TIMING DOUBLE STOPWATCH UNIT */}
      <div id="mobile-stopwatch-unit" className="px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0 flex flex-col gap-2">
        {!isMotionMode ? (
          <div className="grid grid-cols-2 gap-3">
            
            {/* CARD 1: ACTIVE EXERCISE COOLDOWN */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-xl flex flex-col justify-between relative overflow-hidden">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block text-left">Crono Exercici Actiu</span>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-2xl font-extrabold font-mono tracking-tighter ${timerRunning ? 'text-green-400 animate-pulse' : 'text-slate-350'}`}>
                  {formatTime(timeLeft)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    id="btn-toggle-timer"
                    type="button"
                    onClick={() => setTimerRunning(!timerRunning)}
                    title={timerRunning ? "Pausar exercici" : "Iniciar exercici"}
                    className="p-2 rounded-full font-bold shadow transition active:scale-95 cursor-pointer flex items-center justify-center"
                    style={{ minWidth: '34px', minHeight: '34px', backgroundColor: timerRunning ? '#e11d48' : '#10b981', color: timerRunning ? '#ffffff' : '#020617' }}
                  >
                    {timerRunning ? <Pause size={13} strokeWidth={3} /> : <Play size={13} strokeWidth={3} />}
                  </button>
                  <button
                    id="btn-reset-timer"
                    type="button"
                    onClick={() => {
                      setTimeLeft(activeDrill.duration * 60);
                      setTimerRunning(false);
                    }}
                    title="Reiniciar crono exercici"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition active:scale-95 cursor-pointer flex items-center justify-center"
                    style={{ minWidth: '34px', minHeight: '34px' }}
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
              {/* Tiny background progress bar for active exercise */}
              <div className="w-full bg-slate-850 h-1 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, (timeLeft / (activeDrill.duration * 60 || 1)) * 100))}%` }}></div>
              </div>
            </div>

            {/* CARD 2: TOTAL SESSION STOPWATCH (75') */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-xl flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider block text-left">Temps de Sessió</span>
                <span className="text-[8px] px-1.5 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded font-mono font-bold leading-none">75′ Cap</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-2xl font-extrabold font-mono tracking-tighter ${sessionTimerRunning ? 'text-orange-450 animate-pulse' : 'text-slate-350'}`}>
                  {formatTime(sessionTimeLeft)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    id="btn-toggle-session-timer"
                    type="button"
                    onClick={() => setSessionTimerRunning(!sessionTimerRunning)}
                    title={sessionTimerRunning ? "Pausar temps general" : "Reanudar temps general"}
                    className="p-2 rounded-full font-bold shadow transition active:scale-95 cursor-pointer flex items-center justify-center"
                    style={{ minWidth: '34px', minHeight: '34px', backgroundColor: sessionTimerRunning ? '#f59e0b' : '#3d82f6', color: '#ffffff' }}
                  >
                    {sessionTimerRunning ? <Pause size={13} strokeWidth={3} /> : <Play size={13} strokeWidth={3} />}
                  </button>
                  <button
                    id="btn-reset-session-timer"
                    type="button"
                    onClick={() => {
                      setSessionTimeLeft(75 * 60);
                      setSessionTimerRunning(false);
                    }}
                    title="Reiniciar a 75′ d'entrenament"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition active:scale-95 cursor-pointer flex items-center justify-center"
                    style={{ minWidth: '34px', minHeight: '34px' }}
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
              {/* Visual colored remaining bar for the 75 minutes */}
              <div className="w-full bg-slate-850 h-1 rounded-full mt-2 overflow-hidden">
                <div className="h-full transition-all duration-300" style={{ width: `${(sessionTimeLeft / (75 * 60)) * 100}%`, backgroundColor: sessionTimeLeft < 15 * 60 ? '#f43f5e' : sessionTimeLeft < 30 * 60 ? '#f59e0b' : '#f97316' }}></div>
              </div>
            </div>

          </div>
        ) : (
          /* MAXIMALLY VIEWABLE LARGE TIMER FOR ON-THE-GO TRAINING */
          <div className="bg-slate-950 border border-green-500/20 p-3.5 rounded-2xl flex items-center justify-between gap-4 relative overflow-hidden select-none">
            <div className="min-w-0">
              <span className="text-[9px] text-green-400 font-extrabold uppercase tracking-widest block text-left">Cronòmetre d'Exercici (LLETRES GRANS)</span>
              <span className="text-xs text-slate-300 font-semibold truncate block mt-0.5">{activeDrill.title}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`text-4xl xs:text-5xl font-black font-mono tracking-tighter ${timerRunning ? 'text-green-400 animate-pulse' : 'text-slate-100'}`}>
                {formatTime(timeLeft)}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-toggle-timer"
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  title={timerRunning ? "Pausar exercici" : "Iniciar exercici"}
                  className="p-2 rounded-full font-bold shadow transition active:scale-95 cursor-pointer flex items-center justify-center h-11 w-11"
                  style={{ backgroundColor: timerRunning ? '#e11d48' : '#10b981', color: '#ffffff' }}
                >
                  {timerRunning ? <Pause size={18} strokeWidth={3} /> : <Play size={18} strokeWidth={3} />}
                </button>
                <button
                  id="btn-reset-timer"
                  type="button"
                  onClick={() => {
                    setTimeLeft(activeDrill.duration * 60);
                    setTimerRunning(false);
                  }}
                  title="Reiniciar"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition active:scale-95 cursor-pointer flex items-center justify-center h-11 w-11"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-slate-900 h-1.5 overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, (timeLeft / (activeDrill.duration * 60 || 1)) * 100))}%` }}></div>
            </div>
          </div>
        )}

        {/* CONFIGURABLE REST TIMER BETWEEN DRILL BLOCKS (Hidden in motion mode) */}
        {!isMotionMode && (
          <div className="bg-slate-950/90 border border-amber-500/30 p-2 rounded-xl flex items-center justify-between gap-3 relative overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-base text-amber-500 animate-pulse shrink-0">💤</span>
              <div className="min-w-0">
                <span className="text-[8px] text-amber-400 font-extrabold uppercase tracking-wider block leading-none">Descans Personalitzat</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-sm font-black font-mono leading-none tracking-tight ${restTimerRunning ? 'text-amber-300 animate-pulse' : 'text-slate-400'}`}>
                    {formatTime(restTimeLeft)}
                  </span>
                  
                  {/* Duration dropdown selector */}
                  <select
                    disabled={restTimerRunning}
                    value={configuredRestTime}
                    onChange={(e) => {
                      const secs = Number(e.target.value);
                      setConfiguredRestTime(secs);
                      setRestTimeLeft(secs);
                    }}
                    className="bg-slate-900 border border-slate-800 text-amber-400 rounded text-[9px] font-black px-1.5 py-0.5 ml-1 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={30}>30s</option>
                    <option value={45}>45s</option>
                    <option value={60}>1 min</option>
                    <option value={90}>1:30 min</option>
                    <option value={120}>2 min</option>
                    <option value={180}>3 min</option>
                    <option value={300}>5 min</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mini progress bar */}
            <div className="flex-1 bg-slate-850 h-1 rounded-full overflow-hidden mx-2 shrink opacity-60 hidden xs:block">
              <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${(restTimeLeft / configuredRestTime) * 100}%` }}></div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="btn-toggle-rest"
                type="button"
                onClick={() => {
                  setRestTimerRunning(!restTimerRunning);
                  if (!restTimerRunning) {
                    setTimerRunning(false); // Stop active exercise automatically on rest toggle
                  }
                }}
                className="px-2.5 py-1.5 text-[9px] font-black uppercase rounded transition active:scale-95 cursor-pointer font-sans"
                style={{ backgroundColor: restTimerRunning ? '#f59e0b' : '#334155', color: restTimerRunning ? '#020617' : '#94a3b8' }}
              >
                {restTimerRunning ? 'Pausar' : `Iniciar`}
              </button>
              <button
                id="btn-reset-rest"
                type="button"
                onClick={() => {
                  setRestTimeLeft(configuredRestTime);
                  setRestTimerRunning(false);
                }}
                title="Reiniciar descans"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-full transition active:scale-95 cursor-pointer flex items-center justify-center"
                style={{ minWidth: '28px', minHeight: '28px' }}
              >
                <RotateCcw size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK SESSION ACTIONS BAR */}
      <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-405 text-[11px] font-black">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-200">{isMotionMode ? 'MODO MOVIMENT' : 'Sessió activa'}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Active Coach Motion Mode Toggle Button - High prominence */}
          <button
            type="button"
            onClick={() => setIsMotionMode(!isMotionMode)}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer active:scale-95 ${
              isMotionMode 
                ? 'bg-amber-500 hover:bg-amber-450 text-slate-950 shadow-md animate-pulse border border-amber-600' 
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
            }`}
            title="S'amplia la mida dels textos de descripció per a una fons gran ideal en moviment"
          >
            {isMotionMode ? '🏃‍♂️ Vista Normal' : '🏃‍♂️ Lletra Gran (Pista)'}
          </button>
        </div>
      </div>

      {/* CORE DISPLAY SWIPE BODY */}
      <div id="mobile-swipe-body" className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        
        {/* TIME COMPLETE CUSTOM TOAST ALARM BANNER (Non-blocking) */}
        {showFinishedToast && (
          <div className="bg-red-750 border-2 border-red-500 rounded-2xl p-4 text-white shadow-lg flex flex-col gap-3 animate-pulse">
            <div className="flex items-start gap-2.5">
              <span className="text-2xl mt-0.5">⏱️</span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-red-105">TEMPS EXHAURIT!</h4>
                <p className="text-xs font-bold leading-normal mt-1">
                  S'ha completat el període planificat per a: <strong className="underline font-black">"{activeDrill.title}"</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 justify-end flex-wrap">
              <button
                type="button"
                onClick={() => setShowFinishedToast(false)}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-[9px] font-black uppercase tracking-wider rounded-lg active:scale-95 transition"
              >
                Ignorar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFinishedToast(false);
                  setRestTimeLeft(configuredRestTime);
                  setRestTimerRunning(true);
                  setTimerRunning(false);
                }}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-lg active:scale-95 transition"
              >
                💤 Descans de {formatTime(configuredRestTime)}
              </button>
              {safeActiveIndex < drillsInSession.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    nextDrill();
                    setShowFinishedToast(false);
                  }}
                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-750 text-white text-[9px] font-black uppercase tracking-wider rounded-lg active:scale-95 transition"
                >
                  Següent Exercici ➔
                </button>
              )}
            </div>
          </div>
        )}

        {/* REST TIMER FINISHED TOAST BANNER */}
        {showRestFinishedToast && (
          <div className="bg-amber-600 border border-amber-400 text-slate-950 rounded-2xl p-4 shadow-xl flex flex-col gap-3 animate-bounce">
            <div className="flex items-start gap-2.5">
              <span className="text-2xl mt-0.5">💤</span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-950">DESCANS FINALITZAT!</h4>
                <p className="text-xs font-bold leading-normal mt-1">
                  El descans d’1 minut s’ha completat. És hora de tornar a la pista per al següent bloc d’exercici!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowRestFinishedToast(false)}
                className="px-3 py-1.5 bg-slate-950 text-white text-[9px] font-black uppercase tracking-wider rounded-lg active:scale-95 transition"
              >
                Tancar
              </button>
              {safeActiveIndex < drillsInSession.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    nextDrill();
                    setShowRestFinishedToast(false);
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-100 text-[9px] font-black uppercase tracking-wider rounded-lg active:scale-95 transition hover:bg-slate-800"
                >
                  Començar següent exercici ➔
                </button>
              )}
            </div>
          </div>
        )}

        {/* Drill Title block navigation */}
        {(() => {
          const rawCat = activeDrill.category || 'Atac';
          const activeNormCat = rawCat === 'Defensa' ? 'Defensa' : (rawCat === 'Transició' ? 'Transició' : (['Físico', 'Técnica', 'Escalfament'].includes(rawCat) ? 'Escalfament' : 'Atac'));
          return (
            <div className={`flex items-center justify-between bg-slate-900 border-2 rounded-2xl p-5 shrink-0 shadow-lg transition-colors duration-300 ${
              activeNormCat === 'Atac' ? 'border-orange-500' :
              activeNormCat === 'Defensa' ? 'border-rose-500' :
              activeNormCat === 'Transició' ? 'border-sky-500' : 'border-emerald-500'
            }`}>
              <button
                id="btn-swipe-prev"
                onClick={prevDrill}
                disabled={safeActiveIndex === 0}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-10 cursor-pointer active:scale-95 transition flex items-center justify-center shrink-0"
              >
                <ChevronLeft size={22} strokeWidth={3} />
              </button>

              <div 
                onClick={() => {
                  // Find the original full drill object if possible
                  const orig = drills.find(d => d.id === activeDrill.drillId) || activeDrill as any;
                  if (onPreviewDrill && orig) onPreviewDrill(orig);
                }}
                title="Veure el manual tàctic tipus llibre"
                className="text-center min-w-0 flex-1 px-3 cursor-pointer group select-none active:scale-95 transition"
              >
                <span className={`text-[10px] px-2.5 py-1 rounded-full text-white font-extrabold tracking-wider font-mono uppercase block w-max mx-auto mb-1.5 transition-colors shadow-xs ${
                  activeNormCat === 'Atac' ? 'bg-orange-600' :
                  activeNormCat === 'Defensa' ? 'bg-rose-600' :
                  activeNormCat === 'Transició' ? 'bg-sky-600' : 'bg-emerald-600'
                }`}>
                  Exercici {safeActiveIndex + 1} de {drillsInSession.length} ({activeDrill.duration}′) • 📖 Ver manual
                </span>
                <h3 className="text-base xs:text-lg font-black text-white tracking-tight leading-snug group-hover:text-orange-400 transition break-words whitespace-normal drop-shadow-sm uppercase flex items-center justify-center gap-1.5 flex-wrap">
                  <span>{activeDrill.title}</span>
                  {(() => {
                    const orig = drills.find(d => d.id === activeDrill.drillId);
                    return orig?.isOver15 ? (
                      <span className="text-rose-400 bg-rose-950/65 border border-rose-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full select-none inline-flex items-center gap-0.5 uppercase tracking-wider font-mono">
                        🚫 +15
                      </span>
                    ) : null;
                  })()}
                </h3>
              </div>

              <button
                id="btn-swipe-next"
                onClick={nextDrill}
                disabled={safeActiveIndex === drillsInSession.length - 1}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-10 cursor-pointer active:scale-95 transition flex items-center justify-center shrink-0"
              >
                <ChevronRight size={22} strokeWidth={3} />
              </button>
            </div>
          );
        })()}

        {/* INTENSITY MONITORING & PEAK EFFORT CONTROL */}
        {!activeDrill.isVirtual && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-orange-500/20 rounded-2xl p-4.5 space-y-3 shadow-xl relative overflow-hidden">
            {/* Decorative background pulse glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm animate-pulse">🔥</span>
                <div>
                  <h4 className="text-[10px] uppercase font-extrabold text-orange-400 tracking-wider font-mono">
                    Control d'Intensitat i Esforç
                  </h4>
                  <span className="text-[9px] text-slate-400 block -mt-0.5">
                    Registra el pic màxim de rendiment actiu
                  </span>
                </div>
              </div>
              
              {/* Status indicator */}
              {intensityPeaks[activeDrill.id] ? (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-[8px] font-bold font-mono tracking-wide animate-pulse">
                  ⚡ PIC ENREGISTRAT
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full text-[8px] font-bold font-mono tracking-wide">
                  SENSE MARCAR
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Counting stopwatch */}
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider font-mono">Temps de Treball Actiu</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black font-mono tracking-tighter text-white">
                    {formatTime(intensityElapsed)}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold font-mono uppercase">Cronòmetre</span>
                </div>
              </div>

              {/* Manual stopwatch override controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIntensityTimerRunning(!intensityTimerRunning)}
                  className={`p-2 rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer ${
                    intensityTimerRunning ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={intensityTimerRunning ? "Pausar cronòmetre d'intensitat" : "Iniciar cronòmetre d'intensitat"}
                >
                  {intensityTimerRunning ? <Pause size={13} strokeWidth={3} /> : <Play size={13} strokeWidth={3} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIntensityElapsed(0);
                    setIntensityTimerRunning(false);
                  }}
                  className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-450 hover:text-slate-200 rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center"
                  title="Reiniciar cronòmetre d'intensitat"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            {/* Intensity Level selector */}
            <div className="space-y-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
              <div className="flex items-center justify-between text-[9px] font-sans font-bold uppercase tracking-wider">
                <span className="text-slate-400">Nivell de pic previst:</span>
                <span className="text-orange-400 font-extrabold font-mono">
                  {selectedIntensityLevel === 1 && '🟢 BAIX (Regeneratiu)'}
                  {selectedIntensityLevel === 2 && '🟡 MODERAT (Aeròbic)'}
                  {selectedIntensityLevel === 3 && '🟠 ALTA INTENSITAT'}
                  {selectedIntensityLevel === 4 && '🔴 MOLT ALTA (Llàctic)'}
                  {selectedIntensityLevel === 5 && '💀 MÀXIM ESFORÇ (Pic)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 justify-between">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedIntensityLevel(lvl)}
                    className={`flex-1 py-1 text-[10px] font-black rounded-lg transition-all duration-150 border active:scale-95 cursor-pointer ${
                      selectedIntensityLevel === lvl
                        ? 'bg-orange-500 text-slate-950 border-orange-400 font-black scale-[1.03] shadow-md shadow-orange-500/10'
                        : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-800 hover:text-slate-250'
                    }`}
                  >
                    {lvl} {lvl === 5 ? '🔥' : lvl === 1 ? '🍃' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Mark Peak Effort Trigger Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleMarkPeakEffort}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25"
              >
                <span>🔥 MARCAR PIC D'ESFORÇ EXERCICI</span>
              </button>
            </div>

            {/* Recorded Peak details */}
            {intensityPeaks[activeDrill.id] && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3.5 py-2 text-xs flex items-center justify-between text-orange-200 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⏱️</span>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider leading-none">Pic d'esforç registrat</span>
                    <span className="text-[11px] font-semibold mt-0.5 block">
                      Assolit al minut <strong className="font-black text-orange-400 font-mono text-xs">{intensityPeaks[activeDrill.id].peakTime}</strong> amb intensitat <strong className="font-extrabold text-white">{intensityPeaks[activeDrill.id].intensityLabel}</strong>.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...intensityPeaks };
                    delete updated[activeDrill.id];
                    setIntensityPeaks(updated);
                    localStorage.setItem(`basket_planner_intensity_peaks_${session.id}`, JSON.stringify(updated));
                    triggerLocalToast("🗑️ Pic d'esforç esborrat.");
                  }}
                  className="text-slate-400 hover:text-rose-400 font-extrabold transition text-[11px] px-1.5 py-1 cursor-pointer"
                  title="Eliminar registre de pic"
                >
                  Esborrar
                </button>
              </div>
            )}
          </div>
        )}

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
          <div id="mobile-tactical-container" className="space-y-2.5 relative -mx-5 sm:mx-0">
            <div className="flex items-center justify-between px-5 sm:px-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>Esquema de l'Exercici</span>
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
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-5 sm:px-0 select-none no-scrollbar">
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
          <div 
            id="mobile-drill-quick-note" 
            className={`transition-all duration-200 ${
              isMotionMode 
                ? 'bg-amber-500 text-slate-950 p-5 rounded-2xl border-2 border-amber-400 space-y-2 shadow-lg' 
                : 'bg-amber-500/10 border-2 border-amber-500/30 text-amber-200 px-4 py-3 rounded-2xl text-xs space-y-1'
            }`}
          >
            <span className={`font-extrabold uppercase tracking-widest block flex items-center gap-1 ${
              isMotionMode ? 'text-slate-950 text-xs font-black' : 'text-amber-400 text-[10px]'
            }`}>
              <Zap size={isMotionMode ? 14 : 11} className={`fill-amber-950 text-amber-950 ${isMotionMode ? 'animate-pulse' : 'animate-bounce'}`} />
              Observació d'avui (Codi Pista):
            </span>
            <p className={`font-extrabold leading-snug ${isMotionMode ? 'text-lg text-slate-900' : 'text-xs'}`}>{activeDrill.notes}</p>
          </div>
        )}

        {/* DRILL LARGE CHECKLIST DETAILS FOR COACH SCANNING */}
        <div className="space-y-4">
          
          {/* Direct Instructions list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-3 shadow-xs">
            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 border-b border-slate-800 pb-1.5 shrink-0">
              <Clipboard size={12} className="text-orange-400" />
              Instruccions de l'Exercici
            </h4>
            <p className={`leading-relaxed font-sans transition-all duration-200 ${
              isMotionMode ? 'text-lg text-white font-black px-1 py-1' : 'text-xs text-slate-200 font-medium'
            }`}>
              {activeDrill.description}
            </p>
          </div>

          {/* Objectives Bullet points checklists */}
          {activeDrill.objectives && activeDrill.objectives.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-3 shadow-xs">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 border-b border-slate-800 pb-1.5 shrink-0">
                <Users size={12} className="text-sky-400" />
                Punts de Focus (Nivell A)
              </h4>
              <ul className="space-y-3">
                {activeDrill.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-slate-100">
                    <span className={`rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      isMotionMode ? 'w-6 h-6 text-xs' : 'w-5 h-5 text-[10px]'
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`leading-relaxed transition-all duration-200 ${
                      isMotionMode ? 'text-base text-sky-200 font-black' : 'text-xs text-slate-100 font-medium'
                    }`}>{obj}</span>
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
                Normes o Restriccions de Pista
              </h4>
              <p className={`leading-relaxed font-sans italic transition-all duration-200 ${
                isMotionMode ? 'text-base font-black text-yellow-300' : 'text-xs text-slate-300'
              }`}>
                "{activeDrill.setupInstructions}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QUICK FOOTER DOTS TRACKER (Hidden in Motion-Pista Mode for clutter-free scrolling) */}
      {!isMotionMode && (
        <div id="mobile-dots-indicator" className="py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-1.5 shrink-0">
          {drillsInSession.map((item, i) => {
            const rawCat = item.category || 'Atac';
            const itemNormCat = rawCat === 'Defensa' ? 'Defensa' : (rawCat === 'Transició' ? 'Transició' : (['Físico', 'Técnica', 'Escalfament'].includes(rawCat) ? 'Escalfament' : 'Atac'));
            const colorClass = itemNormCat === 'Atac' 
              ? (safeActiveIndex === i ? 'bg-orange-500 ring-2 ring-orange-500 scale-125' : 'bg-orange-500/40')
              : itemNormCat === 'Defensa'
                ? (safeActiveIndex === i ? 'bg-rose-500 ring-2 ring-rose-500 scale-125' : 'bg-rose-500/40')
                : itemNormCat === 'Transició'
                  ? (safeActiveIndex === i ? 'bg-sky-500 ring-2 ring-sky-500 scale-125' : 'bg-sky-500/40')
                  : (safeActiveIndex === i ? 'bg-emerald-500 ring-2 ring-emerald-500 scale-125' : 'bg-emerald-500/40');
            return (
              <button
                key={i}
                onClick={() => setActiveDrillIndex(i)}
                type="button"
                className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${colorClass}`}
              />
            );
          })}
        </div>
      )}

      {/* SESSION EDITOR DRAWER IN MOBILE VIEW REMOVED FOR PISTA READ-ONLY MODE */}
      {toast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-orange-500/40 text-white font-sans font-extrabold px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 z-[9999] animate-in fade-in slide-in-from-bottom-3 duration-200 backdrop-blur-md">
          <span className="text-orange-400 animate-bounce">🔥</span>
          <span className="text-[11px] uppercase tracking-wide">{toast}</span>
        </div>
      )}
    </div>
  );
}
