import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  Check, 
  Copy, 
  Clock, 
  Info, 
  Sparkles,
  Users, 
  Calendar, 
  Dribbble,
  Layers,
  Edit3
} from 'lucide-react';
import { TrainingSession, Drill, DrillCategory, WeeklyPlan } from '../types';
import { getEnhancedSessionDrills } from './SessionPlanner';

interface SimplifiedSessionPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TrainingSession;
  drills: Drill[];
  activePlan?: WeeklyPlan;
  teamLabel?: string;
  onOpenDetailedDossier?: () => void;
  triggerToast?: (msg: string) => void;
}

export const SimplifiedSessionPdfModal: React.FC<SimplifiedSessionPdfModalProps> = ({
  isOpen,
  onClose,
  session,
  drills,
  activePlan,
  teamLabel = 'Júnior A Masculí • Nivell A (FCBQ)',
  onOpenDetailedDossier,
  triggerToast
}) => {
  const [copied, setCopied] = useState(false);
  const [courtObservations, setCourtObservations] = useState<string>('');
  const [isEditingObservations, setIsEditingObservations] = useState(false);

  if (!isOpen) return null;

  const enhancedDrills = getEnhancedSessionDrills(session.drills, drills);
  const totalDuration = enhancedDrills.reduce((acc, curr) => acc + curr.duration, 0);

  // Compute cumulative minutes for each drill
  let currentMinute = 0;
  const drillsWithTiming = enhancedDrills.map((drill) => {
    const startMin = currentMinute;
    const endMin = currentMinute + drill.duration;
    currentMinute = endMin;
    return {
      ...drill,
      startMin,
      endMin,
      timeRangeStr: `${String(startMin).padStart(2, '0')}′ - ${String(endMin).padStart(2, '0')}′`
    };
  });

  // Category breakdown for summary
  const categoryMinutes: Record<string, number> = {};
  enhancedDrills.forEach((d) => {
    if (!d.isVirtual) {
      const cat = d.category || 'Atac';
      categoryMinutes[cat] = (categoryMinutes[cat] || 0) + d.duration;
    }
  });

  const formatScheduledDate = (isoStr?: string) => {
    if (!isoStr) {
      return new Date().toLocaleDateString('ca-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const days = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
      const dayName = days[d.getDay()];
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${dayName} ${day}/${month}/${year} · ${hours}:${mins}h`;
    } catch {
      return isoStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const lines = [
      `🏀 COACH PINETY - FITXA D'ENTRENAMENT A4`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Sessió: ${session.name}`,
      `Equip: ${teamLabel}`,
      `Data: ${formatScheduledDate(session.scheduledTime)}`,
      `Durada Total: ${totalDuration} minuts`,
      activePlan ? `Planificació: ${activePlan.name}` : '',
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `CRONOLOGIA D'EXERCICIS:`,
      ...drillsWithTiming.map((d, i) => {
        const catStr = d.isVirtual ? `[${d.concept || 'PAUSA'}]` : `[${d.category}]`;
        const noteStr = d.notes ? `\n   ↳ Nota: ${d.notes}` : '';
        return `${i + 1}. ${d.timeRangeStr} (${d.duration}') ${d.title} ${catStr}${noteStr}`;
      }),
      courtObservations ? `\nOBSERVACIONS A PISTA:\n${courtObservations}` : '',
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Coach Pinety Standards • FCBQ`
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      if (triggerToast) triggerToast('📋 Resum copiat al porta-retalls per compartir!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div 
      id="simplified-a4-pdf-modal"
      className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs select-none print:p-0 print:bg-white print:static print:inset-auto print:block"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl h-[94vh] flex flex-col print:h-auto print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* HEADER TOOLBAR (Hidden when printing!) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-white">
                  Fitxa de Sessió Simplificada (A4)
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/30 text-blue-300">
                  A4 PORTRAIT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Resum clar i compacte amb noms d'exercicis, horaris, durada i anotacions per imprimir o guardar en PDF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Copiar resum de la sessió com a text"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copiat!' : 'Copiar Text'}</span>
            </button>

            {onOpenDetailedDossier && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDetailedDossier();
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Veure el dossier tàctic complet amb diagrames i pissarres"
              >
                <Layers size={14} />
                <span className="hidden sm:inline">Dossier amb Pissarres</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider active:scale-95"
              title="Obre el diàleg d'impressió del sistema o Desar com a PDF"
            >
              <Printer size={15} />
              <span>Imprimir / Desar PDF (A4)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition ml-1"
              title="Tancar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 PREVIEW CANVAS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible select-text">
          
          {/* A4 Sheet Container */}
          <div 
            id="simplified-a4-pdf-print"
            className="max-w-[210mm] mx-auto bg-white border border-slate-300 print:border-none shadow-md print:shadow-none p-6 sm:p-8 space-y-5 text-slate-900 rounded-sm"
          >
            
            {/* 1. DOCUMENT HEADER */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-black text-[9px] uppercase tracking-widest rounded-xs">
                      FCBQ STANDARDS
                    </span>
                    <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider font-mono">
                      COACH PINETY BASQUETBOL
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight leading-tight mt-1">
                    {session.name}
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                    <span>Equip: <strong className="text-slate-900">{teamLabel}</strong></span>
                    {activePlan && <span>• Pla: <strong className="text-slate-900">{activePlan.name}</strong></span>}
                  </p>
                </div>

                <div className="text-right shrink-0 bg-slate-50 print:bg-white border border-slate-200 print:border-slate-300 p-2.5 rounded-sm min-w-[170px]">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block font-mono">
                    Durada Programada
                  </span>
                  <div className="text-lg font-black font-mono text-orange-600 leading-tight">
                    {totalDuration} minuts
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 font-bold mt-0.5">
                    {formatScheduledDate(session.scheduledTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SUMMARY METRICS RIBBON */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Clock size={14} className="text-orange-500" />
                <span>Estructura de la Sessió:</span>
                <span className="font-black text-slate-900 font-mono">
                  {enhancedDrills.filter(d => !d.isVirtual).length} exercicis de pista
                </span>
                {enhancedDrills.some(d => d.isVirtual) && (
                  <span className="text-slate-500 font-mono text-[11px]">
                    (+{enhancedDrills.filter(d => d.isVirtual).length} pauses de recuperació)
                  </span>
                )}
              </div>

              {/* Category badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                {Object.entries(categoryMinutes).map(([cat, mins]) => (
                  <span 
                    key={cat}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-800"
                  >
                    {cat.toUpperCase()}: <strong className="text-orange-600">{mins}′</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* 3. SIMPLIFIED EXERCISES TIMELINE TABLE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Cronologia i Continguts de l'Entrenament
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  Distribució pas a pas de 75 minuts
                </span>
              </div>

              {enhancedDrills.length === 0 ? (
                <div className="border border-dashed border-slate-300 p-8 text-center text-slate-400 font-mono text-xs rounded">
                  La sessió no té cap exercici afegit encara.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-sm overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider">
                        <th className="py-2 px-2.5 w-10 text-center font-mono">#</th>
                        <th className="py-2 px-2.5 w-24 font-mono">Horari</th>
                        <th className="py-2 px-2.5 w-20 text-center font-mono">Durada</th>
                        <th className="py-2 px-3">Exercici / Categoria</th>
                        <th className="py-2 px-3">Anotacions del Coach & Detalls Clau</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {drillsWithTiming.map((item, idx) => {
                        const isHydration = item.isVirtual && item.virtualType === 'hydration';
                        const isFreeThrows = item.isVirtual && item.virtualType === 'freethrows';

                        let categoryColorClass = "bg-slate-100 text-slate-700 border-slate-200";
                        if (item.category === 'Atac') categoryColorClass = "bg-orange-100 text-orange-900 border-orange-200";
                        else if (item.category === 'Defensa') categoryColorClass = "bg-rose-100 text-rose-900 border-rose-200";
                        else if (item.category === 'Transició') categoryColorClass = "bg-sky-100 text-sky-900 border-sky-200";
                        else if (item.category === 'Físico') categoryColorClass = "bg-amber-100 text-amber-900 border-amber-200";
                        else if (item.category === 'Tiro') categoryColorClass = "bg-emerald-100 text-emerald-900 border-emerald-200";
                        else if (item.category === 'Competència') categoryColorClass = "bg-purple-100 text-purple-900 border-purple-200";

                        const rowBg = isHydration 
                          ? "bg-blue-50/50 print:bg-white" 
                          : isFreeThrows 
                            ? "bg-emerald-50/50 print:bg-white" 
                            : (idx % 2 === 1 ? "bg-slate-50/60 print:bg-white" : "bg-white");

                        return (
                          <tr key={item.id} className={`${rowBg} break-inside-avoid hover:bg-slate-50/80 transition`}>
                            {/* Seq # */}
                            <td className="py-2.5 px-2.5 text-center font-black font-mono text-slate-900 border-r border-slate-200">
                              {idx + 1}
                            </td>

                            {/* Time interval */}
                            <td className="py-2.5 px-2.5 font-black font-mono text-[11px] text-slate-700 whitespace-nowrap border-r border-slate-200">
                              {item.timeRangeStr}
                            </td>

                            {/* Duration */}
                            <td className="py-2.5 px-2.5 text-center border-r border-slate-200">
                              <span className="inline-block px-2 py-0.5 bg-orange-50 print:bg-white border border-orange-200 text-orange-700 font-mono font-black rounded-xs text-[11px]">
                                {item.duration}′
                              </span>
                            </td>

                            {/* Drill title and category */}
                            <td className="py-2.5 px-3 border-r border-slate-200 align-top">
                              <div className="space-y-1">
                                <div className="font-black text-slate-950 text-xs leading-snug">
                                  {isHydration && <span className="mr-1">💧</span>}
                                  {isFreeThrows && <span className="mr-1">🎯</span>}
                                  {item.title}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`px-1.5 py-0.2 border rounded-xs font-mono font-black text-[9px] uppercase tracking-wider ${categoryColorClass}`}>
                                    {item.category?.toUpperCase() || 'EXERCICI'}
                                  </span>
                                  {item.playersNeeded > 0 && (
                                    <span className="text-[10px] text-slate-500 font-medium font-mono flex items-center gap-0.5">
                                      <Users size={11} className="inline text-slate-400" />
                                      {item.playersNeeded} j.
                                    </span>
                                  )}
                                  {item.materials && item.materials.length > 0 && (
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      • {item.materials.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Coach Notes and Key Objectives */}
                            <td className="py-2.5 px-3 align-top leading-tight">
                              <div className="space-y-1.5">
                                {/* Coach specific note for this drill in session */}
                                {item.notes && (
                                  <div className="bg-amber-50 print:bg-white border-l-2 border-amber-500 px-2 py-1 rounded-r-xs">
                                    <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider block font-mono">
                                      Nota del Coach:
                                    </span>
                                    <span className="text-amber-950 font-bold text-[11px]">
                                      {item.notes}
                                    </span>
                                  </div>
                                )}

                                {/* Key objectives or short instructions */}
                                {item.objectives && item.objectives.length > 0 && (
                                  <div className="text-[11px] text-slate-700">
                                    <span className="font-bold text-slate-900">Objectius: </span>
                                    <span>{item.objectives.join(' • ')}</span>
                                  </div>
                                )}

                                {/* Fallback description if no notes/objectives */}
                                {!item.notes && (!item.objectives || item.objectives.length === 0) && item.description && (
                                  <p className="text-[11px] text-slate-600 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 4. COURT OBSERVATIONS & NOTES (FOR IN-COURT COACH USE) */}
            <div className="border border-slate-300 rounded-sm p-3.5 space-y-2.5 bg-slate-50/50 print:bg-white break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Edit3 size={13} className="text-orange-500" />
                  <span>Anotacions i Observacions del Cos Tècnic a Pista</span>
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  Espai per a incidències, assistència i conclusions
                </span>
              </div>

              {/* Editable or typed notes area */}
              <div className="space-y-2">
                <textarea
                  value={courtObservations}
                  onChange={(e) => setCourtObservations(e.target.value)}
                  placeholder="Escriu aquí les indicacions especials d'avui o deixa aquest espai per prendre notes a mà a pista..."
                  className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[55px] print:min-h-[45px] print:border-none print:p-0 resize-y"
                  rows={2}
                />

                {/* Hand-written quick checklist lines for the coach clipboard */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200 text-[10px] font-mono text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800">Assistència:</span>
                    <span>____ / 12 jugadors</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800">Intensitat (1-10):</span>
                    <span>[  ]</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800">Balanç:</span>
                    <span>[ ] Òptim  [ ] Regular  [ ] Millorar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. A4 DOCUMENT FOOTER */}
            <div className="border-t-2 border-slate-900 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-600">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">
                  Coach Pinety • Full Oficial de Sessió A4
                </div>
                <div className="text-[9px] text-slate-500">
                  Comitè Tècnic de Basquetbol • Document de camp preparat per a competició
                </div>
              </div>

              <div className="text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-1 sm:pt-0 sm:pl-4 min-w-[200px]">
                <span className="text-[9px] text-slate-400 uppercase block">Signatura de l'Entrenador</span>
                <div className="h-6 border-b border-dotted border-slate-400 mt-1"></div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
export default SimplifiedSessionPdfModal;
