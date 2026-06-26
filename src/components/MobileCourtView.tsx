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
  X,
  Camera,
  Sparkles,
  Upload,
  Check,
  RefreshCw
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
  onAddDrill?: (drill: Drill) => void;
}

export default function MobileCourtView({ 
  session, 
  drills, 
  onBackToPlanner, 
  onPreviewDrill,
  isSharedMobile = false,
  onUpdateSession,
  onAddDrill
}: MobileCourtViewProps) {
  const [activeDrillIndex, setActiveDrillIndex] = useState(0);
  const [isFullscreenBoard, setIsFullscreenBoard] = useState(false);
  const [showSessionEditor, setShowSessionEditor] = useState(false);
  const [isMotionMode, setIsMotionMode] = useState(false);
  const [editorSearchText, setEditorSearchText] = useState('');
  const [addCategoryFilter, setAddCategoryFilter] = useState<'Tots' | 'Escalfament' | 'Atac' | 'Defensa'>('Tots');

  // Camera scanner states
  const [showAiScanner, setShowAiScanner] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scannerMimeType, setScannerMimeType] = useState<string>('image/jpeg');
  const [scannerAnalyzing, setScannerAnalyzing] = useState<boolean>(false);
  const [scannerErrorMsg, setScannerErrorMsg] = useState<string | null>(null);
  const [scannerAnalyzedDrill, setScannerAnalyzedDrill] = useState<Drill | null>(null);
  const [scannerAnalysisStep, setScannerAnalysisStep] = useState<string>('');
  const [scannerSaving, setScannerSaving] = useState<boolean>(false);

  const scannerLoadingSteps = [
    "Iniciant motor de visió artificial de Gemini...",
    "Escanejant línies de la pista de bàsquet...",
    "Identificant la distribució de cons i fitxes...",
    "Detecció de posicions de jugadors d'atac i defensa...",
    "Calculant trajectòries, passades i fletxes...",
    "Traduint contingut tècnic al català (FCBQ)...",
    "Generant fets de microfase..."
  ];

  useEffect(() => {
    if (!scannerAnalyzing) return;
    let stepIndex = 0;
    setScannerAnalysisStep(scannerLoadingSteps[0]);

    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % scannerLoadingSteps.length;
      setScannerAnalysisStep(scannerLoadingSteps[stepIndex]);
    }, 2400);

    return () => clearInterval(interval);
  }, [scannerAnalyzing]);

  const handleScannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setScannerAnalyzedDrill(null);
      setScannerErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScannerAnalyze = async () => {
    if (!selectedImage) return;

    setScannerAnalyzing(true);
    setScannerErrorMsg(null);
    setScannerAnalyzedDrill(null);

    try {
      const base64Content = selectedImage.split(',')[1];
      const res = await fetch('/api/analyze-drill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Content,
          mimeType: scannerMimeType
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "No s'ha pogut obtenir l'anàlisi de la pissarra.");
      }

      const data = await res.json();
      if (data && data.drill) {
        setScannerAnalyzedDrill(data.drill);
      } else {
        throw new Error("Estructura d'exercici no vàlida de Gemini.");
      }
    } catch (err: any) {
      console.error(err);
      setScannerErrorMsg(err.message || "Error analitzant amb Gemini. Comprova la connexió.");
    } finally {
      setScannerAnalyzing(false);
    }
  };

  const handleScannerSave = async (addToSession: boolean) => {
    if (!scannerAnalyzedDrill) return;

    setScannerSaving(true);
    try {
      const newDrillId = `drill-scanned-${Date.now()}`;
      const newDrill: Drill = {
        ...scannerAnalyzedDrill,
        id: newDrillId
      };

      // 1. Add to global list of drills
      if (onAddDrill) {
        onAddDrill(newDrill);
      }

      // 2. Add to session if requested
      if (addToSession && onUpdateSession) {
        const newDrillRef = {
          drillId: newDrillId,
          duration: newDrill.duration || 15,
          notes: "Afegit amb l'Escàner de Càmera IA"
        };
        const updatedDrills = [...session.drills, newDrillRef];
        const updatedSession = {
          ...session,
          drills: updatedDrills,
          totalDuration: updatedDrills.reduce((acc, c) => acc + c.duration, 0)
        };
        onUpdateSession(updatedSession);
      }

      // Clean up states
      setSelectedImage(null);
      setScannerAnalyzedDrill(null);
      setShowAiScanner(false);
      
      // Select the newly added drill as active drill so they can see it instantly!
      if (addToSession) {
        setTimeout(() => {
          setActiveDrillIndex(session.drills.length);
        }, 150);
      }
    } catch (err: any) {
      console.error(err);
      setScannerErrorMsg("No s'ha pogut guardar l'exercici.");
    } finally {
      setScannerSaving(false);
    }
  };

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
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, sessionTimerRunning, restTimerRunning, activeDrillIndex]);

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

          {!isMotionMode && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSessionEditor(true)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-[10px] font-bold uppercase tracking-wider text-slate-305 rounded transition flex items-center gap-1 cursor-pointer"
              >
                ✏️ Exercicis
              </button>
              
              <button
                type="button"
                onClick={() => setShowAiScanner(true)}
                className="px-2.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-[10px] font-black uppercase tracking-wider text-white rounded transition flex items-center gap-1 cursor-pointer shadow-md"
              >
                <span className="animate-pulse">📸</span> Scanner IA
              </button>
            </div>
          )}
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
            <h3 className="text-sm font-black text-white leading-snug underline hover:text-orange-400 decoration-dotted break-all whitespace-normal">{activeDrill.title}</h3>
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
      )}

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

          {/* Drawer Scrollable Content with spacious bottom padding so items can be fully scrolled above the footer */}
          <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-5 text-left">
            {/* NEW AI CAMERA SCANNER BANNER */}
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2 text-center shadow-lg">
              <span className="text-[9px] uppercase font-mono font-black text-orange-400 tracking-wider block">NOU: RECONEIXEMENT AMB IA</span>
              <button
                type="button"
                onClick={() => {
                  setShowSessionEditor(false);
                  setShowAiScanner(true);
                }}
                className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Camera size={14} />
                Fes una Foto i Reconeix l'Exercici (IA)
              </button>
              <p className="text-[8px] text-slate-400 leading-normal">
                Apunta amb la càmera a una pissarra, llibre o dibuix fet a mà. Gemini Vision ho digitalitzarà a l'instant.
              </p>
            </div>

            {/* CURRENT DRILLS IN SESSION */}
            <div className="space-y-2.5">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-400">Exercicis a l'Entrenament d'Avui</h5>
              
              {(!session.drills || session.drills.length === 0) ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  No hi ha exercicis en aquest entrenament. Afegeix-ne un a sota!
                </div>
              ) : (
                <div className="space-y-2">
                  {(session.drills || []).map((sd, sIdx) => {
                    const drillItem = drills.find(d => d.id === sd.drillId);
                    if (!drillItem) return null;

                    return (
                      <div key={sIdx} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-start gap-4 shadow-xs text-left">
                        {/* Enlarged Tactical Board Preview */}
                        <div className="w-28 xs:w-36 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-800 p-0.5 shadow-inner self-center">
                          <TacticalBoard boardState={drillItem.boardState || { paths: [], pins: [] }} onChange={() => {}} readOnly={true} />
                        </div>

                        {/* Bullet & text */}
                        <div className="min-w-0 flex-1 text-left flex flex-col justify-between min-h-24">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono font-bold">
                                # {sIdx + 1}
                              </span>
                              <span className="text-[8px] bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold">
                                {drillItem.category}
                              </span>
                            </div>
                            <h6 className="text-xs xs:text-sm font-black text-white mt-1.5 leading-snug whitespace-normal break-words">{drillItem.title}</h6>
                          </div>
                          
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
                        <div className="flex flex-col gap-1 items-end shrink-0">
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
                <p className="text-[9px] text-slate-400 font-sans">Cerca i selecciona un exercici ordenat per categoria de treball.</p>
              </div>

              {/* Search bar */}
              <input
                type="text"
                placeholder="🔍 Filtra per títol..."
                value={editorSearchText}
                onChange={(e) => setEditorSearchText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 select-none">
                {(['Tots', 'Escalfament', 'Atac', 'Defensa'] as const).map((cat) => {
                  const isActive = addCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAddCategoryFilter(cat)}
                      className={`flex-1 py-1 px-1 rounded text-[9px] font-black uppercase tracking-wider transition cursor-pointer text-center ${
                        isActive 
                          ? 'bg-orange-500 text-white' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      {cat === 'Tots' ? 'Tots' : cat === 'Escalfament' ? 'Calentament' : cat === 'Atac' ? 'Atac' : 'Defensa'}
                    </button>
                  );
                })}
              </div>

              {/* Removed fixed small container height to let drills render naturally and cleanly scroll within the drawer */}
              <div className="space-y-2 text-left">
                {drills
                  .filter(d => {
                    const matchesSearch = d.title.toLowerCase().includes(editorSearchText.toLowerCase()) || 
                                          d.description.toLowerCase().includes(editorSearchText.toLowerCase());
                    
                    if (!matchesSearch) return false;

                    // Apply active category filter partition
                    if (addCategoryFilter === 'Escalfament') {
                      return ['Técnica', 'Físico', 'Escalfament'].includes(d.category);
                    }
                    if (addCategoryFilter === 'Atac') {
                      return ['Táctica', 'Sistemas', 'Tiro', 'Transición', 'Atac'].includes(d.category);
                    }
                    if (addCategoryFilter === 'Defensa') {
                      return ['Defensa'].includes(d.category);
                    }
                    return true;
                  })
                  .map(d => {
                    const isAlreadyAdded = session.drills.some(sd => sd.drillId === d.id);

                    return (
                      <div key={d.id} className="bg-slate-950 border border-slate-900 p-3 rounded-lg flex items-start gap-4 text-left">
                        {/* Much larger Tactical Board Preview */}
                        <div className="w-28 xs:w-36 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-900 p-0.5 shadow-inner self-center">
                          <TacticalBoard boardState={d.boardState || { paths: [], pins: [] }} onChange={() => {}} readOnly={true} />
                        </div>

                        <div className="min-w-0 flex-1 flex flex-col justify-between min-h-24">
                          <div>
                            <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase font-black font-mono">
                              {d.category}
                            </span>
                            <h6 className="text-xs xs:text-sm font-black text-slate-100 mt-1 leading-snug whitespace-normal break-words">{d.title}</h6>
                            <p className="text-[9px] text-slate-450 font-mono mt-1">{d.duration} MIN</p>
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
                            className={`w-max px-3 py-1.5 rounded text-[8px] font-black uppercase tracking-wider transition shrink-0 cursor-pointer ${
                              isAlreadyAdded
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                            }`}
                          >
                            {isAlreadyAdded ? '✓ Afegit' : '➕ Afegir'}
                          </button>
                        </div>
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

      {/* AI SCANNER DRAWER IN MOBILE VIEW */}
      {showAiScanner && (
        <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-950 z-50 flex flex-col animate-in slide-in-from-bottom duration-250 select-text overflow-y-auto">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">📸</span>
              <div className="text-left">
                <h4 className="text-xs font-black uppercase text-white tracking-wider">Escàner de Pissarres IA</h4>
                <p className="text-[10px] text-slate-400">Reconeix i digitalitza fletxes i jugadors</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAiScanner(false);
                setSelectedImage(null);
                setScannerAnalyzedDrill(null);
                setScannerErrorMsg(null);
              }}
              className="p-1 px-2.5 text-slate-400 hover:text-white rounded bg-slate-850 hover:bg-slate-800 transition text-xs font-bold cursor-pointer"
            >
              Tancar
            </button>
          </div>

          {/* Scanner Body */}
          <div className="flex-1 p-5 pb-32 space-y-5 text-left">
            {!selectedImage ? (
              <label className="flex flex-col items-center justify-center p-8 bg-slate-900/40 border-2 border-dashed border-slate-800 hover:border-orange-500 hover:bg-slate-900/80 rounded-2xl transition cursor-pointer text-center group min-h-[220px]">
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-full text-slate-400 group-hover:text-orange-500 group-hover:scale-105 transition duration-150 shadow-md">
                  <Camera size={32} />
                </div>
                <span className="text-xs font-black uppercase text-slate-200 mt-4 tracking-wider">Fes una foto o tria imatge</span>
                <p className="text-[10px] text-slate-500 mt-1.5 px-4 leading-relaxed">
                  Prem per activar la càmera del mòbil sobre el teu esbós, quadern o pissarra tàctica
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleScannerFileChange}
                  className="hidden"
                />
              </label>
            ) : scannerAnalyzing ? (
              <div className="text-center p-8 bg-slate-900/60 border border-orange-500/30 rounded-xl space-y-5 shadow-xl w-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-dashed border-orange-500 animate-spin"></div>
                  <span className="absolute text-orange-500 text-lg animate-pulse">✨</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase text-orange-400 tracking-widest">Processament Intel·ligent</h4>
                  <p className="text-[11px] text-slate-305 font-medium h-12 flex items-center justify-center px-4 leading-normal text-center">
                    {scannerAnalysisStep}
                  </p>
                </div>
              </div>
            ) : !scannerAnalyzedDrill ? (
              <div className="space-y-4">
                <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner max-h-[260px] flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Captura"
                    className="max-h-[260px] object-contain w-full"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 bg-slate-900/90 text-slate-300 hover:bg-rose-950 hover:text-red-400 p-1 px-2.5 rounded text-[10px] font-bold transition shadow-md border border-slate-850 cursor-pointer"
                  >
                    Treure imatge
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleScannerAnalyze}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span className="animate-pulse">✨</span>
                  Analitzar Exercici amb Gemini IA
                </button>
              </div>
            ) : (
              /* RECOGNIZED DRILL PREVIEW */
              <div className="space-y-4">
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/25 rounded-xl flex gap-2 items-start">
                  <span className="text-emerald-400 mt-0.5">✨</span>
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-emerald-400 tracking-wide">Pissarra digitalitzada correctament!</h5>
                    <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                      S'han col·locat els jugadors, fletxes d'atac/defensa i s'ha traduït el contingut al català de nivell FCBQ.
                    </p>
                  </div>
                </div>

                {/* Live Tactical Board Preview */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black tracking-widest text-orange-400 uppercase">Previsualització Tàctica</label>
                  <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden relative shadow-inner aspect-[4/3] xs:aspect-[1.5] w-full">
                    <TacticalBoard 
                      boardState={scannerAnalyzedDrill.boardState || { paths: [], pins: [] }} 
                      onChange={() => {}} 
                      readOnly={true} 
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-3">
                  <div>
                    <span className="text-[8px] bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                      {scannerAnalyzedDrill.category || "Atac"}
                    </span>
                    <input
                      type="text"
                      value={scannerAnalyzedDrill.title}
                      onChange={(e) => setScannerAnalyzedDrill({ ...scannerAnalyzedDrill, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-bold mt-1.5 focus:outline-none focus:border-orange-500"
                      placeholder="Títol de l'exercici"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-b border-slate-800/80 py-2.5 font-sans">
                    <div>
                      <span className="text-slate-500 uppercase tracking-widest block font-mono text-[7px]">Durada recomanada</span>
                      <input
                        type="number"
                        value={scannerAnalyzedDrill.duration || 15}
                        onChange={(e) => setScannerAnalyzedDrill({ ...scannerAnalyzedDrill, duration: parseInt(e.target.value) || 15 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 mt-1 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase tracking-widest block font-mono text-[7px]">Mínim Jugadors</span>
                      <input
                        type="number"
                        value={scannerAnalyzedDrill.playersNeeded || 6}
                        onChange={(e) => setScannerAnalyzedDrill({ ...scannerAnalyzedDrill, playersNeeded: parseInt(e.target.value) || 6 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 mt-1 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase tracking-widest block font-mono text-[7px]">Descripció de l'exercici</span>
                    <textarea
                      value={scannerAnalyzedDrill.description}
                      onChange={(e) => setScannerAnalyzedDrill({ ...scannerAnalyzedDrill, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 mt-1.5 focus:outline-none focus:border-orange-500 min-h-20 font-sans"
                    />
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="flex flex-col gap-2 font-sans">
                  <button
                    type="button"
                    onClick={() => handleScannerSave(true)}
                    disabled={scannerSaving}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  >
                    {scannerSaving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                    Desar i afegir a la sessió d'avui
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScannerSave(false)}
                    disabled={scannerSaving}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 border border-slate-800"
                  >
                    Només desar a la biblioteca
                  </button>
                </div>
              </div>
            )}

            {scannerErrorMsg && (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-bold text-center">
                ⚠️ {scannerErrorMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
