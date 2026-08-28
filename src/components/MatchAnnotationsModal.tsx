import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  Copy, 
  Check, 
  NotebookPen, 
  Trophy, 
  Clock, 
  Plus, 
  Tag, 
  AlertCircle,
  FileText,
  ChevronRight,
  Flame,
  ShieldAlert,
  Sparkles,
  Bot,
  Loader2,
  Lightbulb,
  Wand2,
  BarChart3,
  Percent,
  Minus,
  Target,
  TrendingDown,
  RotateCcw,
  Shield
} from 'lucide-react';
import { WeeklyPlan, MatchAnnotation, QuarterNotes, TeamStats } from '../types';

interface MatchAnnotationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlan: WeeklyPlan;
  initialDateIndex?: number;
  onSaveAnnotation: (dateIndex: number, annotation: MatchAnnotation) => void;
  onDeleteAnnotation: (dateIndex: number) => void;
  triggerToast?: (msg: string) => void;
}

// Weekend match days of the microcycle starting on Monday 31st August
const WEEKEND_MATCH_DAYS = [
  { index: 5, label: 'Setmana 1 • Dissabte (5 Set)' },
  { index: 6, label: 'Setmana 1 • Diumenge (6 Set)' },
  { index: 12, label: 'Setmana 2 • Dissabte (12 Set)' },
  { index: 13, label: 'Setmana 2 • Diumenge (13 Set)' },
  { index: 19, label: 'Setmana 3 • Dissabte (19 Set)' },
  { index: 20, label: 'Setmana 3 • Diumenge (20 Set)' },
  { index: 26, label: 'Setmana 4 • Dissabte (26 Set)' },
  { index: 27, label: 'Setmana 4 • Diumenge (27 Set)' },
  { index: 33, label: 'Setmana 5 • Dissabte (3 Oct)' },
  { index: 34, label: 'Setmana 5 • Diumenge (4 Oct)' },
];

const PRESET_TAGS = [
  '⚡ Balanç Defensiu',
  '🛡️ Rebot Defensiu',
  '💥 Rebot Ofensiu',
  '🎯 PnR / Bloqueig Directe',
  '⚠️ Pèrdues de Passe',
  '🛑 Comunicació en Ajuda',
  '🔥 Ritme de Transició',
  '🏀 Tirs Lliures sota Presió',
  '📊 Defensa Zonal',
];

export default function MatchAnnotationsModal({
  isOpen,
  onClose,
  activePlan,
  initialDateIndex = 5,
  onSaveAnnotation,
  onDeleteAnnotation,
  triggerToast
}: MatchAnnotationsModalProps) {
  if (!isOpen) return null;

  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(initialDateIndex);
  const [activeQuarterTab, setActiveQuarterTab] = useState<'q1' | 'q2' | 'q3' | 'q4' | 'ot' | 'general'>('q1');

  // Form states
  const [opponent, setOpponent] = useState<string>('');
  const [isHome, setIsHome] = useState<boolean>(true);
  const [ourScore, setOurScore] = useState<string>('');
  const [opponentScore, setOpponentScore] = useState<string>('');
  const [quarterNotes, setQuarterNotes] = useState<QuarterNotes>({
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    ot: ''
  });
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [tacticalKeyPoints, setTacticalKeyPoints] = useState<string[]>([]);
  const [newKeyPoint, setNewKeyPoint] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Team Statistics Counter States
  const [lostPasses, setLostPasses] = useState<number>(0);
  const [otherTurnovers, setOtherTurnovers] = useState<number>(0);
  const [fg2Made, setFg2Made] = useState<number>(0);
  const [fg2Missed, setFg2Missed] = useState<number>(0);
  const [fg3Made, setFg3Made] = useState<number>(0);
  const [fg3Missed, setFg3Missed] = useState<number>(0);
  const [ftMade, setFtMade] = useState<number>(0);
  const [ftMissed, setFtMissed] = useState<number>(0);
  const [offRebounds, setOffRebounds] = useState<number>(0);
  const [defRebounds, setDefRebounds] = useState<number>(0);
  const [steals, setSteals] = useState<number>(0);
  const [fouls, setFouls] = useState<number>(0);
  const [blocks, setBlocks] = useState<number>(0);

  // AI Advice states
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedAi, setCopiedAi] = useState<boolean>(false);

  // Load existing annotation when selectedDateIndex changes
  useEffect(() => {
    setAiAdvice(null);
    setAiError(null);
    const existing = activePlan.matchAnnotations?.[selectedDateIndex.toString()];
    if (existing) {
      setOpponent(existing.opponent || '');
      setIsHome(existing.isHome !== undefined ? existing.isHome : true);
      setOurScore(existing.ourScore?.toString() || '');
      setOpponentScore(existing.opponentScore?.toString() || '');
      setQuarterNotes({
        q1: existing.quarterNotes?.q1 || '',
        q2: existing.quarterNotes?.q2 || '',
        q3: existing.quarterNotes?.q3 || '',
        q4: existing.quarterNotes?.q4 || '',
        ot: existing.quarterNotes?.ot || ''
      });
      setGeneralNotes(existing.generalNotes || '');
      setTacticalKeyPoints(existing.tacticalKeyPoints || []);

      const ts = existing.teamStats || {};
      setLostPasses(ts.lostPasses || 0);
      setOtherTurnovers(ts.otherTurnovers || 0);
      setFg2Made(ts.fg2Made || 0);
      setFg2Missed(ts.fg2Missed || 0);
      setFg3Made(ts.fg3Made || 0);
      setFg3Missed(ts.fg3Missed || 0);
      setFtMade(ts.ftMade || 0);
      setFtMissed(ts.ftMissed || 0);
      setOffRebounds(ts.offRebounds || 0);
      setDefRebounds(ts.defRebounds || 0);
      setSteals(ts.steals || 0);
      setFouls(ts.fouls || 0);
      setBlocks(ts.blocks || 0);
    } else {
      // Reset form
      setOpponent('');
      setIsHome(true);
      setOurScore('');
      setOpponentScore('');
      setQuarterNotes({ q1: '', q2: '', q3: '', q4: '', ot: '' });
      setGeneralNotes('');
      setTacticalKeyPoints([]);

      setLostPasses(0);
      setOtherTurnovers(0);
      setFg2Made(0);
      setFg2Missed(0);
      setFg3Made(0);
      setFg3Missed(0);
      setFtMade(0);
      setFtMissed(0);
      setOffRebounds(0);
      setDefRebounds(0);
      setSteals(0);
      setFouls(0);
      setBlocks(0);
    }
  }, [selectedDateIndex, activePlan]);

  // Request AI Advice based on match annotations
  const handleGenerateAiAdvice = async () => {
    setLoadingAi(true);
    setAiError(null);

    const dayObj = WEEKEND_MATCH_DAYS.find(d => d.index === selectedDateIndex);
    const annotationPayload = {
      opponent: opponent.trim(),
      isHome,
      ourScore: ourScore ? parseInt(ourScore) : undefined,
      opponentScore: opponentScore ? parseInt(opponentScore) : undefined,
      quarterNotes,
      generalNotes: generalNotes.trim(),
      tacticalKeyPoints,
      teamStats: {
        lostPasses,
        otherTurnovers,
        fg2Made,
        fg2Missed,
        fg3Made,
        fg3Missed,
        ftMade,
        ftMissed,
        offRebounds,
        defRebounds,
        steals,
        fouls,
        blocks
      }
    };

    try {
      const res = await fetch('/api/ai/coach-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchAnnotation: annotationPayload,
          microcycleName: activePlan.name
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al generar la resposta de la IA.');
      }

      setAiAdvice(data.advice);
      if (triggerToast) triggerToast('✨ Recomanacions de la IA generades amb èxit!');
    } catch (err: any) {
      console.error('Error generating AI advice:', err);
      setAiError(err.message || 'No s’ha pogut connectar amb la IA. Revisa la connexió o la clau d’API.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCopyAiAdvice = () => {
    if (!aiAdvice) return;
    navigator.clipboard.writeText(aiAdvice);
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 2000);
    if (triggerToast) triggerToast('📋 Resum i consells de la IA copiats al porta-retalls');
  };

  const handleApplyAiKeyPoints = () => {
    if (!aiAdvice) return;
    // Extract key lines or add general AI summary to key points
    const lines = aiAdvice.split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('1.') || l.startsWith('2.') || l.startsWith('3.') || l.startsWith('4.'))
      .slice(0, 5);

    if (lines.length > 0) {
      const formattedLines = lines.map(l => l.replace(/^[•\-\d\.]+\s*/, '🤖 IA: '));
      setTacticalKeyPoints(prev => [...prev, ...formattedLines]);
      if (triggerToast) triggerToast('✅ Afegits punts suggerits per la IA als punts tàctics d’entrenament!');
    } else {
      setTacticalKeyPoints(prev => [...prev, `🤖 Planificació recomanada per la IA per a ${opponent || 'el darrer partit'}`]);
      if (triggerToast) triggerToast('✅ Afegit punt recomanat per la IA!');
    }
  };

  // Insert tag into active text area
  const handleInsertTag = (tag: string) => {
    if (activeQuarterTab === 'general') {
      setGeneralNotes(prev => (prev ? `${prev}\n• ${tag}: ` : `• ${tag}: `));
    } else {
      setQuarterNotes(prev => ({
        ...prev,
        [activeQuarterTab]: prev[activeQuarterTab] 
          ? `${prev[activeQuarterTab]}\n• ${tag}: ` 
          : `• ${tag}: `
      }));
    }
  };

  const handleAddKeyPoint = () => {
    if (!newKeyPoint.trim()) return;
    setTacticalKeyPoints(prev => [...prev, newKeyPoint.trim()]);
    setNewKeyPoint('');
  };

  const handleRemoveKeyPoint = (idx: number) => {
    setTacticalKeyPoints(prev => prev.filter((_, i) => i !== idx));
  };

  // Statistical Calculations & Percentages
  const totalTurnovers = lostPasses + otherTurnovers;
  const totalFg2 = fg2Made + fg2Missed;
  const fg2Pct = totalFg2 > 0 ? ((fg2Made / totalFg2) * 100).toFixed(1) : '0.0';

  const totalFg3 = fg3Made + fg3Missed;
  const fg3Pct = totalFg3 > 0 ? ((fg3Made / totalFg3) * 100).toFixed(1) : '0.0';

  const totalFt = ftMade + ftMissed;
  const ftPct = totalFt > 0 ? ((ftMade / totalFt) * 100).toFixed(1) : '0.0';

  const totalFgMade = fg2Made + fg3Made;
  const totalFgAttempts = totalFg2 + totalFg3;
  const totalFgPct = totalFgAttempts > 0 ? ((totalFgMade / totalFgAttempts) * 100).toFixed(1) : '0.0';

  const totalRebounds = offRebounds + defRebounds;

  // Auto-generate improvement diagnostic list
  const getAutoImprovementAspects = (): string[] => {
    const aspects: string[] = [];
    if (lostPasses >= 8) {
      aspects.push(`⚠️ Elevat nombre de pases perduts (${lostPasses} pases erraments). Treballar l'angle de passada, la finta de passe i el desmarcatge.`);
    }
    if (totalTurnovers >= 14) {
      aspects.push(`⚠️ Total de pèrdues de pilota elevat (${totalTurnovers} pèrdues). Prioritzar balanç defensiu i protecció de pilota.`);
    }
    if (totalFt > 0 && parseFloat(ftPct) < 70) {
      aspects.push(`⚠️ Percentatge baix de Tirs Lliures (${ftPct}% - ${ftMade}/${totalFt}). Incorporar rutines de tir lliure sota fatiga.`);
    }
    if (totalFg3 > 0 && parseFloat(fg3Pct) < 30) {
      aspects.push(`⚠️ Encert en Tir de 3 punts baix (${fg3Pct}% - ${fg3Made}/${totalFg3}). Millorar selecció de tir i mecanismes de peus.`);
    }
    if (totalFg2 > 0 && parseFloat(fg2Pct) < 45) {
      aspects.push(`⚠️ Efectivitat en Tir de 2 punts baixa (${fg2Pct}% - ${fg2Made}/${totalFg2}). Treballar finalitzacions amb contacte.`);
    }
    if (offRebounds < 8 && (totalFg2 > 0 || totalFg3 > 0)) {
      aspects.push(`⚠️ Pocs rebots ofensius (${offRebounds} rebots d'atac). Treballar l'agressivitat al rebot ofensiu des del costat feble.`);
    }
    return aspects;
  };

  const handleApplyAutoDiagnosticsToTacticalKeyPoints = () => {
    const aspects = getAutoImprovementAspects();
    if (aspects.length === 0) {
      if (triggerToast) triggerToast('ℹ️ No s’han detectat millores crítiques de percentatge amb les dades actuals.');
      return;
    }

    let addedCount = 0;
    setTacticalKeyPoints(prev => {
      const next = [...prev];
      aspects.forEach(asp => {
        if (!next.includes(asp)) {
          next.push(asp);
          addedCount++;
        }
      });
      return next;
    });

    if (triggerToast) {
      triggerToast(`✅ Afegits ${addedCount} aspectes a millorar als punts tàctics d'entrenament!`);
    }
  };

  const handleSave = () => {
    const dayObj = WEEKEND_MATCH_DAYS.find(d => d.index === selectedDateIndex);
    const annotation: MatchAnnotation = {
      id: `match-ann-${selectedDateIndex}`,
      dateIndex: selectedDateIndex,
      matchDate: dayObj ? dayObj.label : `Dia ${selectedDateIndex + 1}`,
      opponent: opponent.trim(),
      isHome,
      ourScore: ourScore ? parseInt(ourScore) : undefined,
      opponentScore: opponentScore ? parseInt(opponentScore) : undefined,
      quarterNotes,
      generalNotes: generalNotes.trim(),
      tacticalKeyPoints,
      teamStats: {
        lostPasses,
        otherTurnovers,
        fg2Made,
        fg2Missed,
        fg3Made,
        fg3Missed,
        ftMade,
        ftMissed,
        offRebounds,
        defRebounds,
        steals,
        fouls,
        blocks
      },
      updatedAt: new Date().toISOString()
    };

    onSaveAnnotation(selectedDateIndex, annotation);
    if (triggerToast) triggerToast(`📝 Anotacions desar-des per al partit (Dia ${selectedDateIndex + 1})`);
  };

  const handleDelete = () => {
    if (window.confirm('Estàs segur que vols esborrar les anotacions d’aquest partit?')) {
      onDeleteAnnotation(selectedDateIndex);
      if (triggerToast) triggerToast('🗑️ Anotacions del partit esborrades');
    }
  };

  const handleCopySummary = () => {
    const dayObj = WEEKEND_MATCH_DAYS.find(d => d.index === selectedDateIndex);
    let summary = `🏀 ANOTACIONS DE PARTIT - ${dayObj?.label || `Dia ${selectedDateIndex + 1}`}\n`;
    summary += `Planificació: ${activePlan.name}\n`;
    if (opponent) summary += `Rival: ${opponent} (${isHome ? 'Local 🏠' : 'Visitant ✈️'})\n`;
    if (ourScore || opponentScore) summary += `Resultat: ${ourScore || '0'} - ${opponentScore || '0'}\n`;
    summary += `-----------------------------------\n`;

    if (totalTurnovers > 0 || totalFgAttempts > 0 || totalRebounds > 0) {
      summary += `📊 ESTADÍSTIQUES I PERCENTATGES DE L'EQUIP:\n`;
      summary += `• Pases Perduts: ${lostPasses} | Altres Pèrdues: ${otherTurnovers} (Total Pèrdues: ${totalTurnovers})\n`;
      summary += `• Tirs de 2P: ${fg2Made}/${totalFg2} (${fg2Pct}%)\n`;
      summary += `• Tirs de 3P: ${fg3Made}/${totalFg3} (${fg3Pct}%)\n`;
      summary += `• Tirs Lliures (TL): ${ftMade}/${totalFt} (${ftPct}%)\n`;
      summary += `• Tir de Camp Total (FG): ${totalFgMade}/${totalFgAttempts} (${totalFgPct}%)\n`;
      summary += `• Rebots: ${offRebounds} Ofensius | ${defRebounds} Defensius (Total: ${totalRebounds})\n`;
      summary += `• Recuperacions: ${steals} | Faltes: ${fouls} | Taps: ${blocks}\n\n`;
    }

    if (quarterNotes.q1) summary += `📌 1r Quart:\n${quarterNotes.q1}\n\n`;
    if (quarterNotes.q2) summary += `📌 2n Quart:\n${quarterNotes.q2}\n\n`;
    if (quarterNotes.q3) summary += `📌 3r Quart:\n${quarterNotes.q3}\n\n`;
    if (quarterNotes.q4) summary += `📌 4t Quart:\n${quarterNotes.q4}\n\n`;
    if (quarterNotes.ot) summary += `📌 Pròrroga:\n${quarterNotes.ot}\n\n`;
    if (generalNotes) summary += `📝 Observacions Generals:\n${generalNotes}\n\n`;

    if (tacticalKeyPoints.length > 0) {
      summary += `🎯 Punts a treballar a l'entrenament:\n`;
      tacticalKeyPoints.forEach(kp => summary += `• ${kp}\n`);
    }

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (triggerToast) triggerToast('📋 Resum de partit copiat al porta-retalls');
  };

  const selectedDayInfo = WEEKEND_MATCH_DAYS.find(d => d.index === selectedDateIndex);
  const currentHasAnnotation = Boolean(activePlan.matchAnnotations?.[selectedDateIndex.toString()]);

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* HEADER */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-slate-950 flex items-center justify-center font-black">
              <NotebookPen size={18} />
            </div>
            <div>
              <h2 className="font-extrabold uppercase text-sm tracking-tight text-white flex items-center gap-2">
                Anotacions i Observacions del Partit
                <span className="text-[9px] font-mono font-black bg-orange-500/20 text-orange-400 border border-orange-400/30 px-2 py-0.5 rounded uppercase">
                  Directe / Post-partit
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                Anota detalls tàctics per quart o observacions del partit del microcicle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* MATCH DAY SELECTOR STRIP */}
        <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 font-mono mr-1">
            Partits del Microcicle:
          </span>
          {WEEKEND_MATCH_DAYS.map((day) => {
            const isSelected = day.index === selectedDateIndex;
            const hasData = Boolean(activePlan.matchAnnotations?.[day.index.toString()]);
            const savedItem = activePlan.matchAnnotations?.[day.index.toString()];

            return (
              <button
                key={day.index}
                type="button"
                onClick={() => setSelectedDateIndex(day.index)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-xs'
                    : hasData
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🏀 {day.label.split(' • ')[0]}</span>
                {savedItem?.opponent && (
                  <span className="text-[10px] opacity-90 truncate max-w-[80px]">vs {savedItem.opponent}</span>
                )}
                {hasData && (
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500 animate-pulse'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* MAIN BODY CONTENT */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50">
          
          {/* MATCH DETAILS CARD */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <Trophy size={14} className="text-orange-500" /> Dades del Partit: {selectedDayInfo?.label}
              </span>
              {currentHasAnnotation && (
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Anotacions Desades
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Opponent */}
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  Rival / Equip Adversari:
                </label>
                <input
                  type="text"
                  placeholder="Ex: C.B. Hospitalet, Manresa..."
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              {/* Home/Away */}
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  Pista:
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsHome(true)}
                    className={`flex-1 py-1 rounded text-xs font-extrabold transition cursor-pointer ${
                      isHome ? 'bg-orange-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏠 Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHome(false)}
                    className={`flex-1 py-1 rounded text-xs font-extrabold transition cursor-pointer ${
                      !isHome ? 'bg-orange-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✈️ Visitant
                  </button>
                </div>
              </div>

              {/* Score */}
              <div className="sm:col-span-4 space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  Resultat (El nostre - Rival):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Nosaltres"
                    value={ourScore}
                    onChange={(e) => setOurScore(e.target.value)}
                    className="w-full text-center text-xs font-black font-mono px-2 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="font-extrabold text-slate-400 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="Rival"
                    value={opponentScore}
                    onChange={(e) => setOpponentScore(e.target.value)}
                    className="w-full text-center text-xs font-black font-mono px-2 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TEAM MATCH STATISTICS & PERCENTAGES CARD */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <BarChart3 size={15} className="text-orange-500" /> Estadístiques de Partit i Càlcul de Mitjanes de l'Equip
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Registra les pèrdues de pilota, pases erraments, tirs i rebots per calcular percentatges en temps real i detectar punts a millorar.
                </p>
              </div>

              {(totalTurnovers > 0 || totalFgAttempts > 0 || totalRebounds > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setLostPasses(0);
                    setOtherTurnovers(0);
                    setFg2Made(0);
                    setFg2Missed(0);
                    setFg3Made(0);
                    setFg3Missed(0);
                    setFtMade(0);
                    setFtMissed(0);
                    setOffRebounds(0);
                    setDefRebounds(0);
                    setSteals(0);
                    setFouls(0);
                    setBlocks(0);
                  }}
                  className="text-[10px] font-extrabold text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition shrink-0"
                  title="Reiniciar comptadors d'estadístiques"
                >
                  <RotateCcw size={12} /> Reiniciar comptadors
                </button>
              )}
            </div>

            {/* LIVE PERCENTAGE DASHBOARD BADGES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Turnovers badge */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
                  <span>Pèrdues Totals</span>
                  <span className="text-rose-600 font-mono font-black">{totalTurnovers}</span>
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xs font-black text-slate-800">
                    {lostPasses} <span className="text-[10px] text-slate-400 font-normal">pases perduts</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {steals > 0 ? `(Rob: ${steals})` : ''}
                  </span>
                </div>
              </div>

              {/* 2P Shot % */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
                  <span>% Tir 2 Punts</span>
                  <span className={`font-mono font-black ${parseFloat(fg2Pct) >= 50 ? 'text-emerald-600' : parseFloat(fg2Pct) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {fg2Pct}%
                  </span>
                </span>
                <div className="mt-1 flex items-baseline justify-between text-xs font-black text-slate-800">
                  <span>{fg2Made} / {totalFg2}</span>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">fallats: {fg2Missed}</span>
                </div>
              </div>

              {/* 3P Shot % */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
                  <span>% Tir 3 Punts</span>
                  <span className={`font-mono font-black ${parseFloat(fg3Pct) >= 35 ? 'text-emerald-600' : parseFloat(fg3Pct) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {fg3Pct}%
                  </span>
                </span>
                <div className="mt-1 flex items-baseline justify-between text-xs font-black text-slate-800">
                  <span>{fg3Made} / {totalFg3}</span>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">fallats: {fg3Missed}</span>
                </div>
              </div>

              {/* FT Shot % */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
                  <span>% Tirs Lliures (TL)</span>
                  <span className={`font-mono font-black ${parseFloat(ftPct) >= 70 ? 'text-emerald-600' : parseFloat(ftPct) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {ftPct}%
                  </span>
                </span>
                <div className="mt-1 flex items-baseline justify-between text-xs font-black text-slate-800">
                  <span>{ftMade} / {totalFt}</span>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">fallats: {ftMissed}</span>
                </div>
              </div>
            </div>

            {/* CONTROLLERS GRID - OPTIMIZED FOR COMPUTER & MOBILE TOUCH */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              
              {/* GROUP 1: TURNOVERS & PASSES */}
              <div className="bg-rose-50/50 border border-rose-200 p-3.5 sm:p-3 rounded-xl space-y-3 sm:space-y-2.5">
                <div className="flex items-center gap-1.5 text-rose-950 font-black text-xs uppercase tracking-wider border-b border-rose-200/80 pb-2">
                  <TrendingDown size={15} className="text-rose-600 shrink-0" /> 1. Pèrdues de Pilota i Pases
                </div>

                {/* Lost passes counter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>⚠️ Pases Perduts:</span>
                    <span className="font-mono font-black text-rose-700 text-sm">{lostPasses}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLostPasses(prev => Math.max(0, prev - 1))}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 touch-manipulation select-none shrink-0"
                      title="Restar 1 pase perdut"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={lostPasses}
                      onChange={(e) => setLostPasses(Math.max(0, parseInt(e.target.value) || 0))}
                      className="flex-1 min-w-0 h-10 sm:h-9 text-center text-sm font-black font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setLostPasses(prev => prev + 1)}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white flex items-center justify-center font-black transition cursor-pointer active:scale-95 touch-manipulation select-none shrink-0 shadow-xs"
                      title="Sumar 1 pase perdut"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Other turnovers counter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>🚫 Altres Pèrdues (Passos/Violacions):</span>
                    <span className="font-mono font-black text-rose-700 text-sm">{otherTurnovers}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOtherTurnovers(prev => Math.max(0, prev - 1))}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 touch-manipulation select-none shrink-0"
                      title="Restar 1 altra pèrdua"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={otherTurnovers}
                      onChange={(e) => setOtherTurnovers(Math.max(0, parseInt(e.target.value) || 0))}
                      className="flex-1 min-w-0 h-10 sm:h-9 text-center text-sm font-black font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setOtherTurnovers(prev => prev + 1)}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white flex items-center justify-center font-black transition cursor-pointer active:scale-95 touch-manipulation select-none shrink-0 shadow-xs"
                      title="Sumar 1 altra pèrdua"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Steals */}
                <div className="space-y-1 pt-1.5 border-t border-rose-200/60">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>⚡ Recuperacions / Robades:</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">{steals}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSteals(prev => Math.max(0, prev - 1))}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 touch-manipulation select-none shrink-0"
                      title="Restar 1 recuperació"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={steals}
                      onChange={(e) => setSteals(Math.max(0, parseInt(e.target.value) || 0))}
                      className="flex-1 min-w-0 h-10 sm:h-9 text-center text-sm font-black font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setSteals(prev => prev + 1)}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center font-black transition cursor-pointer active:scale-95 touch-manipulation select-none shrink-0 shadow-xs"
                      title="Sumar 1 recuperació"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

              </div>

              {/* GROUP 2: SHOOTING STATS (TIRS ANOTATS I FALLATS) */}
              <div className="bg-amber-50/50 border border-amber-200 p-3.5 sm:p-3 rounded-xl space-y-3 sm:space-y-2.5">
                <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs uppercase tracking-wider border-b border-amber-200/80 pb-2">
                  <Target size={15} className="text-amber-600 shrink-0" /> 2. Comptador de Tirs i Fallos
                </div>

                {/* Tiro 2P */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>🏀 Tiro de 2 Punts:</span>
                    <span className="font-mono font-bold text-amber-900 text-xs">
                      {fg2Made} Anot. / <span className="text-rose-600">{fg2Missed} Fall.</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Made */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFg2Made(prev => Math.max(0, prev - 1))}
                        className="h-10 sm:h-9 w-8 sm:w-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 shrink-0"
                        title="Restar 2P anotat"
                      >
                        <Minus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFg2Made(prev => prev + 1)}
                        className="flex-1 h-10 sm:h-9 px-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5 shadow-xs active:scale-95 touch-manipulation select-none min-w-0"
                      >
                        <Plus size={13} /> <span className="truncate">+1 Anot</span>
                      </button>
                    </div>
                    {/* Missed */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFg2Missed(prev => Math.max(0, prev - 1))}
                        className="h-10 sm:h-9 w-8 sm:w-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 shrink-0"
                        title="Restar 2P fallat"
                      >
                        <Minus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFg2Missed(prev => prev + 1)}
                        className="flex-1 h-10 sm:h-9 px-1 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-black text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5 shadow-xs active:scale-95 touch-manipulation select-none min-w-0"
                      >
                        <Plus size={13} /> <span className="truncate">+1 Fall</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tiro 3P */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>🎯 Tiro de 3 Punts:</span>
                    <span className="font-mono font-bold text-amber-900 text-xs">
                      {fg3Made} Anot. / <span className="text-rose-600">{fg3Missed} Fall.</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Made */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFg3Made(prev => Math.max(0, prev - 1))}
                        className="h-10 sm:h-9 w-8 sm:w-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 shrink-0"
                        title="Restar 3P anotat"
                      >
                        <Minus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFg3Made(prev => prev + 1)}
                        className="flex-1 h-10 sm:h-9 px-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5 shadow-xs active:scale-95 touch-manipulation select-none min-w-0"
                      >
                        <Plus size={13} /> <span className="truncate">+1 Anot</span>
                      </button>
                    </div>
                    {/* Missed */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFg3Missed(prev => Math.max(0, prev - 1))}
                        className="h-10 sm:h-9 w-8 sm:w-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 shrink-0"
                        title="Restar 3P fallat"
                      >
                        <Minus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFg3Missed(prev => prev + 1)}
                        className="flex-1 h-10 sm:h-9 px-1 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-black text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5 shadow-xs active:scale-95 touch-manipulation select-none min-w-0"
                      >
                        <Plus size={13} /> <span className="truncate">+1 Fall</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tirs lliures (TL) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>📋 Tirs Lliures (TL):</span>
                    <span className="font-mono font-bold text-amber-900 text-xs">
                      {ftMade} Anot. / <span className="text-rose-600">{ftMissed} Fall.</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Made */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFtMade(prev => Math.max(0, prev - 1))}
                        className="h-10 sm:h-9 w-8 sm:w-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 shrink-0"
                        title="Restar TL anotat"
                      >
                        <Minus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFtMade(prev => prev + 1)}
                        className="flex-1 h-10 sm:h-9 px-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5 shadow-xs active:scale-95 touch-manipulation select-none min-w-0"
                      >
                        <Plus size={13} /> <span className="truncate">+1 TL</span>
                      </button>
                    </div>
                    {/* Missed */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFtMissed(prev => Math.max(0, prev - 1))}
                        className="h-10 sm:h-9 w-8 sm:w-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 shrink-0"
                        title="Restar TL fallat"
                      >
                        <Minus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFtMissed(prev => prev + 1)}
                        className="flex-1 h-10 sm:h-9 px-1 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-black text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5 shadow-xs active:scale-95 touch-manipulation select-none min-w-0"
                      >
                        <Plus size={13} /> <span className="truncate">+1 Fall</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* GROUP 3: REBOUNDS & DEFENSIVE DISCIPLINE */}
              <div className="bg-sky-50/50 border border-sky-200 p-3.5 sm:p-3 rounded-xl space-y-3 sm:space-y-2.5">
                <div className="flex items-center gap-1.5 text-sky-950 font-black text-xs uppercase tracking-wider border-b border-sky-200/80 pb-2">
                  <Shield size={15} className="text-sky-600 shrink-0" /> 3. Rebots i Defensa
                </div>

                {/* Offensive Rebounds */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>💥 Rebot Ofensiu (Atac):</span>
                    <span className="font-mono font-black text-sky-900 text-sm">{offRebounds}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOffRebounds(prev => Math.max(0, prev - 1))}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 touch-manipulation select-none shrink-0"
                      title="Restar 1 rebot ofensiu"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={offRebounds}
                      onChange={(e) => setOffRebounds(Math.max(0, parseInt(e.target.value) || 0))}
                      className="flex-1 min-w-0 h-10 sm:h-9 text-center text-sm font-black font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setOffRebounds(prev => prev + 1)}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white flex items-center justify-center font-black transition cursor-pointer active:scale-95 touch-manipulation select-none shrink-0 shadow-xs"
                      title="Sumar 1 rebot ofensiu"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Defensive Rebounds */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>🛡️ Rebot Defensiu:</span>
                    <span className="font-mono font-black text-sky-900 text-sm">{defRebounds}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDefRebounds(prev => Math.max(0, prev - 1))}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 touch-manipulation select-none shrink-0"
                      title="Restar 1 rebot defensiu"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={defRebounds}
                      onChange={(e) => setDefRebounds(Math.max(0, parseInt(e.target.value) || 0))}
                      className="flex-1 min-w-0 h-10 sm:h-9 text-center text-sm font-black font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setDefRebounds(prev => prev + 1)}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white flex items-center justify-center font-black transition cursor-pointer active:scale-95 touch-manipulation select-none shrink-0 shadow-xs"
                      title="Sumar 1 rebot defensiu"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Fouls */}
                <div className="space-y-1 pt-1.5 border-t border-sky-200/60">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>🛑 Faltes Personals de L'Equip:</span>
                    <span className="font-mono font-black text-slate-900 text-sm">{fouls}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFouls(prev => Math.max(0, prev - 1))}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black transition cursor-pointer active:scale-90 touch-manipulation select-none shrink-0"
                      title="Restar 1 falta"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={fouls}
                      onChange={(e) => setFouls(Math.max(0, parseInt(e.target.value) || 0))}
                      className="flex-1 min-w-0 h-10 sm:h-9 text-center text-sm font-black font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setFouls(prev => prev + 1)}
                      className="h-10 sm:h-9 w-10 sm:w-9 rounded-lg bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white flex items-center justify-center font-black transition cursor-pointer active:scale-95 touch-manipulation select-none shrink-0 shadow-xs"
                      title="Sumar 1 falta"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* AUTOMATIC TEAM IMPROVEMENT DIAGNOSTICS */}
            {getAutoImprovementAspects().length > 0 && (
              <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                    <Lightbulb size={15} className="text-amber-600" /> Diagnòstic Automàtic d'Aspectes a Millorar de l'Equip:
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyAutoDiagnosticsToTacticalKeyPoints}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-[10px] uppercase tracking-wider rounded transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus size={12} /> Afegir a Punts Tàctics
                  </button>
                </div>
                <div className="space-y-1 font-medium text-xs text-amber-900">
                  {getAutoImprovementAspects().map((aspect, idx) => (
                    <div key={idx} className="bg-white/80 p-2 rounded border border-amber-200 leading-snug">
                      {aspect}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* QUARTER-BY-QUARTER LIVE NOTES & QUICK TAGS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-orange-500" /> Anotacions en Directe per Quarts:
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Clica les etiquetes ràpides per afegir observacions tàctiques a l'instant
              </span>
            </div>

            {/* PRESET QUICK TAGS */}
            <div className="space-y-1 bg-orange-50/50 p-2.5 rounded-lg border border-orange-200/60">
              <span className="text-[9.5px] font-extrabold uppercase text-orange-900 tracking-wider block">
                🏷️ Etiquetes ràpides de partit (fes clic per inserir):
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="text-[10px] bg-white hover:bg-orange-100 border border-orange-200 text-slate-800 font-bold px-2 py-1 rounded transition cursor-pointer active:scale-95 shadow-2xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* TABS FOR QUARTERS */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1 border-b border-slate-200 pb-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'q1', label: '1r Quart 🏀' },
                  { id: 'q2', label: '2n Quart 🏀' },
                  { id: 'q3', label: '3r Quart 🏀' },
                  { id: 'q4', label: '4t Quart 🏀' },
                  { id: 'ot', label: 'Pròrroga ⏱️' },
                  { id: 'general', label: 'Observacions Generals 📝' },
                ].map((tab) => {
                  const isActive = activeQuarterTab === tab.id;
                  const hasText = tab.id === 'general' 
                    ? Boolean(generalNotes)
                    : Boolean(quarterNotes[tab.id as keyof QuarterNotes]);

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveQuarterTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-t-lg text-xs font-black transition cursor-pointer flex items-center gap-1 shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {hasText && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                    </button>
                  );
                })}
              </div>

              {/* ACTIVE TEXTAREA */}
              {activeQuarterTab === 'general' ? (
                <div className="space-y-1">
                  <textarea
                    rows={4}
                    placeholder="Escriu observacions generals del partit, comportament de l'equip, aspectes positius i a millorar..."
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-sans leading-relaxed"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <textarea
                    rows={4}
                    placeholder={`Anotacions del ${activeQuarterTab.toUpperCase()} (p.ex. "Bona pressió a tot camp, 3 pèrdues en transició, ajustar PnR lateral")...`}
                    value={quarterNotes[activeQuarterTab as keyof QuarterNotes] || ''}
                    onChange={(e) => setQuarterNotes({
                      ...quarterNotes,
                      [activeQuarterTab]: e.target.value
                    })}
                    className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-sans leading-relaxed"
                  />
                </div>
              )}
            </div>
          </div>

          {/* TACTICAL KEY POINTS TO WORK ON IN NEXT PRACTICES */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-orange-500" /> Punts Tàctics a Treballar al Proper Entrenament (Dimarts / Dijous):
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Treballar balanç defensiu 3v2 i tancament del rebot d'atac..."
                  value={newKeyPoint}
                  onChange={(e) => setNewKeyPoint(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyPoint();
                    }
                  }}
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddKeyPoint}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus size={14} /> Afegir
                </button>
              </div>

              {tacticalKeyPoints.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {tacticalKeyPoints.map((kp, idx) => (
                    <div
                      key={idx}
                      className="bg-orange-50/80 border border-orange-200 p-2 rounded-lg flex items-center justify-between gap-2 text-xs font-bold text-orange-950"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-200 text-orange-900 text-[10px] font-mono font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{kp}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyPoint(idx)}
                        className="text-orange-600 hover:text-red-600 p-1 rounded transition cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI COACHING ADVICE SECTION (GEMINI 3.6 FLASH) */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white p-4.5 rounded-xl border border-indigo-700/50 shadow-md space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-tight text-indigo-100 flex items-center gap-1.5">
                    IA Assistent Tàctic Gemini
                    <span className="text-[9px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                      FCBQ Junior A
                    </span>
                  </h3>
                  <p className="text-[10px] text-indigo-200/80 font-medium">
                    Analitza les anotacions d'aquest partit per suggerir exercicis i idees de planificació
                  </p>
                </div>
              </div>

              {!aiAdvice && !loadingAi && (
                <button
                  type="button"
                  onClick={handleGenerateAiAdvice}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Wand2 size={14} />
                  <span>Generar Idees amb IA</span>
                </button>
              )}
            </div>

            {loadingAi && (
              <div className="bg-indigo-950/60 border border-indigo-800/80 p-4 rounded-lg flex items-center justify-center gap-3 text-indigo-200 text-xs font-bold animate-pulse">
                <Loader2 size={18} className="animate-spin text-indigo-400" />
                <span>Analitzant les anotacions del partit i elaborant el pla d'entrenament amb Gemini...</span>
              </div>
            )}

            {aiError && (
              <div className="bg-rose-950/80 border border-rose-800/80 p-3 rounded-lg flex items-center justify-between gap-2 text-rose-200 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-rose-400 shrink-0" />
                  <span>{aiError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiAdvice}
                  className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white font-bold rounded text-[10px] uppercase cursor-pointer shrink-0"
                >
                  Reintentar
                </button>
              </div>
            )}

            {aiAdvice && !loadingAi && (
              <div className="space-y-3">
                <div className="bg-slate-950/80 border border-indigo-800/60 p-3.5 rounded-lg text-xs font-sans text-indigo-100 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap font-medium">
                  {aiAdvice}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApplyAiKeyPoints}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus size={13} />
                    <span>Afegir als Punts Tàctics</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAiAdvice}
                      className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 font-bold text-[11px] rounded-lg border border-indigo-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedAi ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedAi ? 'Copiat!' : 'Copiar Consells'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateAiAdvice}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-200 font-bold text-[11px] rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Wand2 size={13} />
                      <span>Re-generar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!aiAdvice && !loadingAi && !aiError && (
              <div className="bg-indigo-950/40 border border-indigo-900/60 p-3 rounded-lg text-center text-indigo-300/80 text-[11px]">
                💡 Prem <strong className="text-indigo-200">"Generar Idees amb IA"</strong> per rebre un diagnòstic del partit, 3 exercicis suggerits i objectius clau per als propers entrenaments.
              </div>
            )}
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {currentHasAnnotation && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-lg border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Esborrar Anotació
              </button>
            )}
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-2 bg-white hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-lg border border-slate-300 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copiat!' : 'Copiar Resum'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-lg transition cursor-pointer"
            >
              Tancar
            </button>
            <button
              type="button"
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-lg transition cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Save size={15} /> Desar Anotacions
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
