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
  Wand2
} from 'lucide-react';
import { WeeklyPlan, MatchAnnotation, QuarterNotes } from '../types';

interface MatchAnnotationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlan: WeeklyPlan;
  initialDateIndex?: number;
  onSaveAnnotation: (dateIndex: number, annotation: MatchAnnotation) => void;
  onDeleteAnnotation: (dateIndex: number) => void;
  triggerToast?: (msg: string) => void;
}

// 28 days of the microcycle formatted
const WEEKEND_MATCH_DAYS = [
  { index: 5, label: 'Setmana 1 • Dissabte (Dia 6)' },
  { index: 6, label: 'Setmana 1 • Diumenge (Dia 7)' },
  { index: 12, label: 'Setmana 2 • Dissabte (Dia 13)' },
  { index: 13, label: 'Setmana 2 • Diumenge (Dia 14)' },
  { index: 19, label: 'Setmana 3 • Dissabte (Dia 20)' },
  { index: 20, label: 'Setmana 3 • Diumenge (Dia 21)' },
  { index: 25, label: 'Setmana 4 • Dissabte (Dia 26)' },
  { index: 26, label: 'Setmana 4 • Diumenge (Dia 27)' },
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
    } else {
      // Reset form
      const dayObj = WEEKEND_MATCH_DAYS.find(d => d.index === selectedDateIndex);
      setOpponent('');
      setIsHome(true);
      setOurScore('');
      setOpponentScore('');
      setQuarterNotes({ q1: '', q2: '', q3: '', q4: '', ot: '' });
      setGeneralNotes('');
      setTacticalKeyPoints([]);
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
      tacticalKeyPoints
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
