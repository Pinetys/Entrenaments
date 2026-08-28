import React, { useState } from 'react';
import { X, Clock, Users, Shield, Wrench, Sparkles, BookOpen, ChevronLeft, ChevronRight, Plus, Check, Calendar } from 'lucide-react';
import { Drill, TrainingSession } from '../types';
import TacticalBoard from './TacticalBoard';
import { formatSessionOptionName } from './DrillDatabase';

interface DrillManualBookletProps {
  drill: Drill;
  onClose: () => void;
  onAddToSession?: (targetSessionId?: string, customNotes?: string) => void;
  allSessions?: Record<string, TrainingSession>;
  selectedSessionId?: string;
}

export default function DrillManualBooklet({ 
  drill, 
  onClose,
  onAddToSession,
  allSessions,
  selectedSessionId = 'dia1'
}: DrillManualBookletProps) {
  // Support active graphic page switching
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [targetSession, setTargetSession] = useState<string>(selectedSessionId);
  const [customNote, setCustomNote] = useState<string>('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  const boardStates = drill.boardStates && drill.boardStates.length > 0
    ? drill.boardStates
    : [drill.boardState || { paths: [], pins: [] }];

  const currentBS = boardStates[activeBoardIndex] || boardStates[0] || { paths: [], pins: [] };

  const handleExecuteAdd = (sessId: string) => {
    if (onAddToSession) {
      onAddToSession(sessId, customNote);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
      setShowSessionPicker(false);
    }
  };

  // Generate a random-looking or hash-based realistic exercise number (e.g. 712) for the physical textbook feel
  const exerciseNumber = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < drill.title.length; i++) {
      hash = drill.title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs((hash % 800) + 100);
  }, [drill.title]);

  return (
    <div 
      id="drill-manual-portal" 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`relative w-full max-w-5xl bg-[#fdfbf7] border-4 rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200 ${
        drill.category === 'Atac' ? 'border-orange-500' :
        drill.category === 'Defensa' ? 'border-rose-500' : 'border-emerald-500'
      }`}>
        
        {/* TEXTBOOK VINTAGE TOP BANNER */}
        <div className="bg-[#1e293b] text-[#f8fafc] px-6 py-3 flex items-center justify-between border-b border-amber-950/20 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono text-slate-300 truncate">
              Federació Catalana de Basquetbol • Quadern de Pista Nivel A
            </span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {onAddToSession && (
              <button
                type="button"
                onClick={() => setShowSessionPicker(true)}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                {addedSuccess ? <Check size={14} className="text-slate-950" /> : <Plus size={14} strokeWidth={3} />}
                <span>{addedSuccess ? 'Afegit!' : 'Afegir a la Sessió'}</span>
              </button>
            )}
            <button
              id="btn-close-booklet-top"
              onClick={onClose}
              className="p-1 px-2.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span>Tancar</span>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* PHYSICAL NOTEBOOK BOOKLET SPREAD CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
          
          {/* VIRTUAL CENTRAL RING BINDER COIL SPINE (Only on larger screens to simulate physical open notebook book) */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-7 flex-col justify-around items-center pointer-events-none opacity-80 z-20">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center w-full">
                {/* Left hole */}
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700/35 border border-slate-900/10 shadow-inner" />
                {/* Steel wire ring */}
                <div className="w-6 h-3.5 rounded-full border-t-2 border-b-2 border-r-2 border-[#b8b3a7] bg-gradient-to-r from-[#eadecc]/30 via-white/50 to-slate-400/20 shadow-md -mx-1" />
                {/* Right hole */}
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700/35 border border-slate-900/10 shadow-inner" />
              </div>
            ))}
          </div>

          {/* LEFT CHRONICLE PAGE: INTENTIONAL PAIRING TEXTBOOK TEXT */}
          <div className="space-y-6 lg:pr-8 border-b lg:border-b-0 lg:border-r border-[#eddcc4] pb-6 lg:pb-0">
            
            {/* Textbook Page Header details */}
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#e6d8c0] pb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900/60 font-mono">
                PARTE {drill.category === 'Atac' ? '1: RITME' : drill.category === 'Defensa' ? '2: DIRECTRIU' : '3: EXECUCIÓ'}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900/60 font-mono">
                <BookOpen size={11} />
                <span>PÀG. {exerciseNumber - 40}</span>
              </div>
            </div>

            {/* BIG VINTAGE HANDBOOK TITLE BLOCK */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[#1e293b] text-xs font-black tracking-widest uppercase font-mono border border-slate-200 bg-[#f4ebd9] px-2 py-0.5 rounded-sm w-max">
                  EXERCICI {exerciseNumber}
                </h2>
                {drill.isOver15 && (
                  <span className="text-rose-700 bg-rose-50 border border-rose-200 text-[9px] font-black px-2 py-0.5 rounded-full select-none flex items-center gap-1 uppercase tracking-wider">
                    🚫 +15 ANYS
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#0f172a] uppercase tracking-tight leading-tight">
                {drill.title}
              </h1>
            </div>

            {/* QUICK TRAINING METRICS */}
            <div className="grid grid-cols-3 gap-3 bg-[#f5eeda] border border-[#eddcc4] p-3 rounded-md">
              <div className="text-center">
                <span className="text-[9px] font-black text-amber-900/50 uppercase tracking-widest block font-mono">DURADA</span>
                <span className="text-[15px] font-black text-slate-800 font-mono">{drill.duration} min.</span>
              </div>
              <div className="text-center border-x border-[#dfd0b7]">
                <span className="text-[9px] font-black text-amber-900/50 uppercase tracking-widest block font-mono">JUGADORS</span>
                <span className="text-[15px] font-black text-slate-800 font-mono">{drill.playersNeeded}+ pax</span>
              </div>
              <div className="text-center">
                <span className="text-[9px] font-black text-amber-900/50 uppercase tracking-widest block font-mono">CATEGORIA</span>
                <span className="text-[11px] font-extrabold uppercase tracking-wide bg-slate-800 text-amber-100 rounded-sm px-1.5 py-0.5 mt-0.5 inline-block scale-90">
                  {drill.category}
                </span>
              </div>
            </div>

            {/* CLASSIC DESCRIPTION (The core manual text) */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-[#78350f] underline decoration-amber-500/50 decoration-2">
                Descripció de l'Exercici
              </h4>
              <p className="text-sm text-[#334155] font-medium leading-relaxed first-letter:text-4xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:text-orange-600 font-sans">
                {drill.description}
              </p>
            </div>

            {/* OBJECTIVES LIST */}
            {drill.objectives && drill.objectives.length > 0 && (
              <div className="space-y-3 bg-[#f7efde]/60 p-4 border-l-4 border-orange-500/80 rounded-sm">
                <h4 className="text-[10px] uppercase font-black tracking-widest text-[#78350f] flex items-center gap-1.5">
                  <Shield size={13} className="text-orange-600" />
                  <span>Objectius i Punts de Focus Català Nivel A</span>
                </h4>
                <ul className="space-y-2">
                  {drill.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="font-bold leading-normal">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* MATERIALS INCLUDED */}
            {drill.materials && drill.materials.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#eddcc4]">
                <span className="text-[9px] font-black text-amber-900/50 uppercase tracking-widest font-mono">S'HA DE PREPARAR:</span>
                {drill.materials.map((mat, idx) => (
                  <span key={idx} className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono rounded-none uppercase font-bold">
                    {mat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT CHRONICLE PAGE: TACTICAL DRILL GRAPHIC BOARD */}
          <div className="space-y-6 lg:pl-8 flex flex-col justify-between">
            
            {/* Header placeholder details */}
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#e6d8c0] pb-3 shrink-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900/60 font-mono">
                ESQUEMA GRÀFIC DE PISTA
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-950/40 font-mono">
                TACTICAL CANVAS
              </span>
            </div>

            {/* DYNAMIC COURT VIEW CONTAINER */}
            <div className="flex-1 flex flex-col justify-center py-2 space-y-3">
              {boardStates.length > 1 && (
                <div className="flex items-center justify-between bg-[#f4ebd9] p-1.5 border border-[#dfceb0] rounded shrink-0">
                  <button
                    type="button"
                    disabled={activeBoardIndex === 0}
                    onClick={() => setActiveBoardIndex(activeBoardIndex - 1)}
                    className="p-1 rounded bg-[#eadecc] hover:bg-orange-500 hover:text-white transition cursor-pointer disabled:opacity-40 disabled:hover:bg-[#eadecc] flex items-center justify-center"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#78350f] font-mono">
                    Gràfic {activeBoardIndex + 1} de {boardStates.length}
                  </span>
                  <button
                    type="button"
                    disabled={activeBoardIndex === boardStates.length - 1}
                    onClick={() => setActiveBoardIndex(activeBoardIndex + 1)}
                    className="p-1 rounded bg-[#eadecc] hover:bg-orange-500 hover:text-white transition cursor-pointer disabled:opacity-40 disabled:hover:bg-[#eadecc] flex items-center justify-center"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              <div className="bg-[#cbd5e1] rounded-lg p-2.5 border-4 border-[#e9e3d5] shadow-xl max-w-md mx-auto w-full overflow-hidden">
                <TacticalBoard 
                  boardState={currentBS} 
                  onChange={() => {}} 
                  readOnly={true} 
                />
              </div>
              <p className="text-center text-[10px] font-mono text-slate-400 mt-2 italic">
                * Representació gràfica de les rotacions d'atac i defensa
              </p>
            </div>

            {/* SETUP RULES & LAWS */}
            {drill.setupInstructions && (
              <div className="bg-[#f0e6d2] p-4 border border-[#e3d3b7] rounded-sm shrink-0">
                <span className="text-[9px] font-black text-amber-950/60 uppercase tracking-widest block font-mono mb-1">
                  NORMES I ADVERTÈNCIES DE PISTA:
                </span>
                <p className="text-xs text-[#5c4014] font-mono leading-relaxed bg-[#f9f5eb] p-2.5 border border-[#dfceb0]">
                  "{drill.setupInstructions}"
                </p>
              </div>
            )}

            {/* FOOTER ACTION CLOSER */}
            <div className="pt-4 border-t border-[#eddcc4] shrink-0 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[10px] text-slate-400 italic font-mono uppercase tracking-widest">
                COACHBOARD AUTOMATED PLANNER 2026
              </span>
              <div className="flex items-center gap-2">
                {onAddToSession && (
                  <button
                    type="button"
                    onClick={() => setShowSessionPicker(true)}
                    className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                  >
                    {addedSuccess ? <Check size={15} /> : <Plus size={15} strokeWidth={3} />}
                    <span>{addedSuccess ? 'Afegit a la Sessió!' : 'Afegir a la Sessió'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-none shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  Tancar Manual
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* NOTIFY STATUS STRIP FOR THE MANUAL */}
        <div className="bg-[#f3ebd9] text-[#735a39] border-t border-[#eddcc4] px-6 py-2.5 text-center text-[11px] font-medium shrink-0">
          📍 Pots llegir i dur aquests exercicis a la pista amb el cronómetre obrint el mòbil.
        </div>

      </div>

      {/* SESSION PICKER POPUP */}
      {showSessionPicker && (
        <div className="fixed inset-0 bg-slate-950/80 z-60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                  <Plus size={18} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Afegir Exercici a la Sessió
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Tria quina sessió del microcicle rebrà aquest exercici
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionPicker(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Exercici seleccionat:</span>
              <h4 className="text-xs font-black text-slate-900 uppercase">{drill.title}</h4>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-[9px] uppercase font-black">{drill.category}</span>
                <span>•</span>
                <span>⏱️ {drill.duration} minuts</span>
              </div>
            </div>

            {/* SESSIONS LIST */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                Selecciona la Sessió d'Entrenament:
              </span>
              
              {allSessions ? (
                Object.entries(allSessions).map(([sessId, sess]) => {
                  const isActive = sessId === targetSession;
                  const isCurrentActiveGlobal = sessId === selectedSessionId;
                  const drillCount = sess.drills?.length || 0;
                  const totalMin = sess.drills?.reduce((acc, curr) => acc + (curr.duration || 10), 0) || 0;
                  const formatted = formatSessionOptionName(sessId, sess);

                  return (
                    <button
                      key={sessId}
                      type="button"
                      onClick={() => setTargetSession(sessId)}
                      className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-black uppercase truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                            {formatted.title}
                          </span>
                          {isCurrentActiveGlobal && (
                            <span className="text-[8px] font-black uppercase bg-orange-500 text-slate-950 px-1.5 py-0.2 rounded font-mono">
                              ACTIVA
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] block font-medium ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                          {formatted.subtitle} • {drillCount} exercicis ({totalMin} min)
                        </span>
                      </div>
                      {isActive && <Check size={16} className="text-orange-400 shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-3 bg-slate-50 text-center text-xs text-slate-500 font-bold">
                  S'afegirà a la sessió activa actual.
                </div>
              )}
            </div>

            {/* OPTIONAL NOTE */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                Anotació Tàctica Específica per aquesta Sessió (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Emfatitzar la comunicació en els canvis de marca..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSessionPicker(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
              >
                Cancel·lar
              </button>
              <button
                type="button"
                onClick={() => handleExecuteAdd(targetSession)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Confirmar i Afegir</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}
