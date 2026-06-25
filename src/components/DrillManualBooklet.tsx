import React, { useState } from 'react';
import { X, Clock, Users, Shield, Wrench, Sparkles, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Drill } from '../types';
import TacticalBoard from './TacticalBoard';

interface DrillManualBookletProps {
  drill: Drill;
  onClose: () => void;
}

export default function DrillManualBooklet({ drill, onClose }: DrillManualBookletProps) {
  // Support active graphic page switching
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);

  const boardStates = drill.boardStates && drill.boardStates.length > 0
    ? drill.boardStates
    : [drill.boardState || { paths: [], pins: [] }];

  const currentBS = boardStates[activeBoardIndex] || boardStates[0] || { paths: [], pins: [] };

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
      <div className="relative w-full max-w-5xl bg-[#fdfbf7] border-4 border-[#e9e3d5] rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* TEXTBOOK VINTAGE TOP BANNER */}
        <div className="bg-[#1e293b] text-[#f8fafc] px-6 py-3 flex items-center justify-between border-b border-amber-950/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono text-slate-300">
              Federació Catalana de Basquetbol • Quadern de Pista Nivel A
            </span>
          </div>
          
          <button
            id="btn-close-booklet-top"
            onClick={onClose}
            className="p-1 px-2.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <span>Tancar</span>
            <X size={15} />
          </button>
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
              <h2 className="text-[#1e293b] text-xs font-black tracking-widest uppercase font-mono border border-slate-200 bg-[#f4ebd9] px-2 py-0.5 rounded-sm w-max">
                EXERCICI {exerciseNumber}
              </h2>
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
            <div className="pt-4 border-t border-[#eddcc4] shrink-0 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 italic font-mono uppercase tracking-widest">
                COACHBOARD AUTOMATED PLANNER 2026
              </span>
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

        {/* NOTIFY STATUS STRIP FOR THE MANUAL */}
        <div className="bg-[#f3ebd9] text-[#735a39] border-t border-[#eddcc4] px-6 py-2.5 text-center text-[11px] font-medium shrink-0">
          📍 Pots llegir i dur aquests exercicis a la pista amb el cronómetre obrint el mòbil.
        </div>

      </div>
    </div>
  );
}
