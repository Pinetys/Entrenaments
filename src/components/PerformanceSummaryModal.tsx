import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  Flame, 
  X, 
  Award, 
  TrendingUp, 
  Save, 
  FileText,
  Gauge
} from 'lucide-react';
import { Drill, TrainingSession } from '../types';

interface PerformanceSummaryModalProps {
  session: TrainingSession;
  drills: Drill[];
  completedDrillIndices?: number[];
  onClose: () => void;
  onSaveCompletion?: (rpe: number, notes: string) => void;
  onToggleCompleteSession?: (sessionId: string) => void;
  isCompleted?: boolean;
}

export const RPE_LABELS: Record<number, { title: string; desc: string; color: string; bg: string; border: string }> = {
  1: { title: 'Molt Molt Lleuger', desc: 'Recuperació total / Esforç mínim', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' },
  2: { title: 'Molt Lleuger', desc: 'Ritme d\'escalfament molt suau', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' },
  3: { title: 'Lleuger', desc: 'Respiració còmoda, treball de control', color: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/40' },
  4: { title: 'Moderat', desc: 'Esforç continu, parla sense dificultat', color: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/40' },
  5: { title: 'Un poc dur', desc: 'Ritme aeròbic sostingut, suor moderada', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  6: { title: 'Dur', desc: 'Ritme de partit, respiració accentuada', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  7: { title: 'Molt dur', desc: 'Alta exigència física i àrea táctica', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40' },
  8: { title: 'Exigent', desc: 'Cansament elevat, gran concentració', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40' },
  9: { title: 'Molt exigent', desc: 'Freqüència cardíaca màxima sostenible', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40' },
  10: { title: 'Màxim esforç', desc: 'Esgotament total / Intensitat 100%', color: 'text-red-500', bg: 'bg-red-500/30', border: 'border-red-500/60' }
};

export default function PerformanceSummaryModal({
  session,
  drills,
  completedDrillIndices = [],
  onClose,
  onSaveCompletion,
  onToggleCompleteSession,
  isCompleted = false
}: PerformanceSummaryModalProps) {
  const drillsInSession = (session.drills
    .map((sd) => {
      const found = drills.find((d) => d.id === sd.drillId);
      if (!found) return null;
      return {
        ...found,
        duration: sd.duration || found.duration || 10,
        notes: sd.notes
      };
    })
    .filter(Boolean) as (Drill & { duration: number; notes?: string })[]);

  const totalDrillsCount = drillsInSession.length;
  const completedCount = completedDrillIndices.length > 0 ? completedDrillIndices.length : totalDrillsCount;

  // Calculate work time
  const totalWorkTimeMinutes = drillsInSession.reduce((acc, curr, idx) => {
    if (completedDrillIndices.length === 0 || completedDrillIndices.includes(idx)) {
      return acc + (curr.duration || 10);
    }
    return acc;
  }, 0);

  const plannedTotalTime = session.totalDuration || drillsInSession.reduce((a, c) => a + c.duration, 0) || 75;

  // Load previously saved RPE & notes for this session
  const storageKey = `basket_planner_rpe_${session.id}`;
  const [rpe, setRpe] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.rpe || 7;
      }
    } catch (e) {}
    return 7;
  });

  const [notes, setNotes] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.notes || '';
      }
    } catch (e) {}
    return '';
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    try {
      const summaryData = {
        sessionId: session.id,
        sessionName: session.name,
        rpe,
        notes,
        totalWorkTimeMinutes,
        completedCount,
        totalDrillsCount,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(summaryData));
    } catch (e) {}

    if (onSaveCompletion) {
      onSaveCompletion(rpe, notes);
    }
    if (onToggleCompleteSession && !isCompleted) {
      onToggleCompleteSession(session.id);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const activeRpeInfo = RPE_LABELS[rpe] || RPE_LABELS[7];

  return (
    <div className="fixed inset-0 bg-slate-950/85 z-[999999] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl text-left font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-500/30">
              <Activity size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block font-mono">
                Post-Entrenament
              </span>
              <h2 className="text-base font-black text-white tracking-tight">
                Resum de Rendiment
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Session Name Banner */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sessió Avaluada</span>
            <p className="text-sm font-extrabold text-white truncate">{session.name}</p>
          </div>
          <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-bold shrink-0">
            {session.dayOfWeek || 'Entrenament'}
          </span>
        </div>

        {/* Key Performance Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Work Time */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Temps de Treball</span>
              <Clock size={15} className="text-orange-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">{totalWorkTimeMinutes}</span>
              <span className="text-xs font-bold text-slate-400">minuts</span>
            </div>
            <p className="text-[10px] text-slate-450 truncate">
              Planificat: {plannedTotalTime} min
            </p>
          </div>

          {/* Exercises Completed */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Exercicis Fets</span>
              <CheckCircle2 size={15} className="text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">{completedCount}</span>
              <span className="text-xs font-bold text-slate-400">/ {totalDrillsCount}</span>
            </div>
            <p className="text-[10px] text-emerald-400 font-bold">
              {totalDrillsCount > 0 ? Math.round((completedCount / totalDrillsCount) * 100) : 100}% completats
            </p>
          </div>
        </div>

        {/* RPE - Rate of Perceived Exertion Scale (1 - 10) */}
        <div className="space-y-3 bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Gauge size={16} className="text-orange-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                Intensitat Percabuda (RPE 1 - 10)
              </h3>
            </div>
            <span className="text-[10px] font-extrabold text-slate-400">
              Escala Borg RPE
            </span>
          </div>

          {/* RPE Selector Buttons 1-10 */}
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
              const isSelected = rpe === val;
              let bgBtn = 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800';
              if (isSelected) {
                if (val <= 2) bgBtn = 'bg-emerald-500 text-white border-emerald-400 ring-2 ring-emerald-500/50 shadow-md scale-105';
                else if (val <= 4) bgBtn = 'bg-sky-500 text-white border-sky-400 ring-2 ring-sky-500/50 shadow-md scale-105';
                else if (val <= 6) bgBtn = 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 ring-2 ring-amber-500/50 shadow-md scale-105';
                else if (val <= 8) bgBtn = 'bg-orange-500 text-white border-orange-400 ring-2 ring-orange-500/50 shadow-md scale-105';
                else bgBtn = 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50 shadow-md scale-105';
              }

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRpe(val)}
                  className={`h-9 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center font-mono ${bgBtn}`}
                >
                  {val}
                </button>
              );
            })}
          </div>

          {/* Selected RPE Feedback Box */}
          <div className={`p-3 rounded-xl border ${activeRpeInfo.bg} ${activeRpeInfo.border} flex items-center justify-between transition-all duration-200`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black font-mono ${activeRpeInfo.color}`}>
                  RPE {rpe}: {activeRpeInfo.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {activeRpeInfo.desc}
              </p>
            </div>
            <Flame size={20} className={activeRpeInfo.color} />
          </div>
        </div>

        {/* Coach Notes Textarea */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block font-mono">
            Observacions i Valoració de l'Entrenador
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Escriu comentaris sobre l'actitud de l'equip, ritme de joc o punts a millorar..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition font-sans resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tancar
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={savedSuccess}
            className={`flex-1 py-2.5 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer ${
              savedSuccess
                ? 'bg-emerald-600 border border-emerald-400'
                : 'bg-orange-600 hover:bg-orange-500 active:scale-95 shadow-orange-600/20'
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 size={15} />
                <span>Rendiment Desat!</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Desar Rendiment</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
