import React, { useState, useMemo } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  Plus, 
  BarChart3, 
  Minus, 
  Trophy, 
  Calendar, 
  Shield, 
  Target, 
  Sparkles, 
  AlertCircle, 
  Bot, 
  Loader2, 
  Copy, 
  Check, 
  Edit3, 
  ArrowLeft,
  Flame,
  Home,
  Plane
} from 'lucide-react';
import { WeeklyPlan, MatchAnnotation, TeamType, TeamStats } from '../types';

interface MatchAnnotationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlan: WeeklyPlan;
  initialDateIndex?: number;
  onSaveAnnotation: (dateIndex: number, annotation: MatchAnnotation, targetTeam?: TeamType) => void;
  onDeleteAnnotation: (dateIndex: number, targetTeam?: TeamType) => void;
  triggerToast?: (msg: string) => void;
  selectedTeam?: TeamType;
  onSelectTeam?: (team: TeamType) => void;
  allWeeklyPlans?: WeeklyPlan[];
}

export default function MatchAnnotationsModal({
  isOpen,
  onClose,
  activePlan,
  onSaveAnnotation,
  onDeleteAnnotation,
  triggerToast,
  selectedTeam = 'junior_a',
  onSelectTeam,
  allWeeklyPlans = []
}: MatchAnnotationsModalProps) {
  if (!isOpen) return null;

  // Active Team state (separated between junior_a and senior)
  const [currentTeam, setCurrentTeam] = useState<TeamType>(selectedTeam || activePlan.team || 'junior_a');
  
  // Tab state: 'stats' (Averages & Season stats), 'matches' (Match List), 'form' (Add/Edit Match)
  const [activeTab, setActiveTab] = useState<'stats' | 'matches' | 'form'>('stats');

  // Form State for Adding / Editing Match
  const [editingDateIndex, setEditingDateIndex] = useState<number | null>(null);
  const [formOpponent, setFormOpponent] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(() => new Date().toLocaleDateString('ca-ES'));
  const [formIsHome, setFormIsHome] = useState<boolean>(true);
  const [formOurScore, setFormOurScore] = useState<string>('');
  const [formOpponentScore, setFormOpponentScore] = useState<string>('');
  
  // Simplified Stats Counters
  const [fg2Made, setFg2Made] = useState<number>(0);
  const [fg2Missed, setFg2Missed] = useState<number>(0);
  const [fg3Made, setFg3Made] = useState<number>(0);
  const [fg3Missed, setFg3Missed] = useState<number>(0);
  const [ftMade, setFtMade] = useState<number>(0);
  const [ftMissed, setFtMissed] = useState<number>(0);
  const [offRebounds, setOffRebounds] = useState<number>(0);
  const [defRebounds, setDefRebounds] = useState<number>(0);
  const [lostPasses, setLostPasses] = useState<number>(0); // Turnovers
  const [steals, setSteals] = useState<number>(0); // Recoveries
  const [fouls, setFouls] = useState<number>(0);
  const [generalNotes, setGeneralNotes] = useState<string>('');

  // AI Advice state
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [copiedAi, setCopiedAi] = useState<boolean>(false);

  // Switch team and notify parent if provided
  const handleTeamChange = (newTeam: TeamType) => {
    setCurrentTeam(newTeam);
    if (onSelectTeam) {
      onSelectTeam(newTeam);
    }
    setActiveTab('stats');
    setAiAdvice(null);
  };

  // Compile all matches strictly for currentTeam across plans
  const teamMatches = useMemo(() => {
    const list: (MatchAnnotation & { planId: string })[] = [];
    const targetPlans = allWeeklyPlans.length > 0 ? allWeeklyPlans : [activePlan];

    targetPlans.forEach(plan => {
      const planBelongsToTeam = currentTeam === 'senior' ? plan.team === 'senior' : plan.team !== 'senior';
      if (plan.matchAnnotations) {
        Object.entries(plan.matchAnnotations).forEach(([key, ann]) => {
          if (!ann) return;
          // Match belongs to currentTeam if annotation.team explicitly matches, OR if plan belongs to team
          const isThisTeam = ann.team ? ann.team === currentTeam : planBelongsToTeam;
          if (isThisTeam) {
            // Avoid duplicate by id
            if (!list.some(m => m.id === ann.id && m.dateIndex === ann.dateIndex)) {
              list.push({
                ...ann,
                dateIndex: ann.dateIndex !== undefined ? ann.dateIndex : parseInt(key, 10) || 0,
                team: currentTeam,
                planId: plan.id
              });
            }
          }
        });
      }
    });

    // Sort descending by date or dateIndex
    return list.sort((a, b) => (b.dateIndex || 0) - (a.dateIndex || 0));
  }, [allWeeklyPlans, activePlan, currentTeam]);

  // Aggregate Season Statistics ONLY for the currentTeam
  const aggregateStats = useMemo(() => {
    const totalMatches = teamMatches.length;
    if (totalMatches === 0) {
      return {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winPct: 0,
        totalPointsScored: 0,
        totalPointsConceded: 0,
        avgPointsScored: '0.0',
        avgPointsConceded: '0.0',
        pointDifferential: '+0.0',
        // Shooting
        fg2Made: 0,
        fg2Missed: 0,
        fg2Total: 0,
        fg2Pct: '0.0',
        avgFg2Made: '0.0',
        fg3Made: 0,
        fg3Missed: 0,
        fg3Total: 0,
        fg3Pct: '0.0',
        avgFg3Made: '0.0',
        ftMade: 0,
        ftMissed: 0,
        ftTotal: 0,
        ftPct: '0.0',
        avgFtMade: '0.0',
        // Rebounds & Turnovers
        avgOffReb: '0.0',
        avgDefReb: '0.0',
        avgTotalReb: '0.0',
        avgTurnovers: '0.0',
        avgSteals: '0.0',
        avgFouls: '0.0',
        homeWins: 0,
        homeLosses: 0,
        awayWins: 0,
        awayLosses: 0
      };
    }

    let wins = 0;
    let losses = 0;
    let totalPointsScored = 0;
    let totalPointsConceded = 0;
    let homeWins = 0;
    let homeLosses = 0;
    let awayWins = 0;
    let awayLosses = 0;

    let totFg2M = 0;
    let totFg2Miss = 0;
    let totFg3M = 0;
    let totFg3Miss = 0;
    let totFtM = 0;
    let totFtMiss = 0;
    let totOffReb = 0;
    let totDefReb = 0;
    let totTurnovers = 0;
    let totSteals = 0;
    let totFouls = 0;

    teamMatches.forEach(m => {
      const our = typeof m.ourScore === 'number' ? m.ourScore : parseInt(m.ourScore || '0', 10) || 0;
      const opp = typeof m.opponentScore === 'number' ? m.opponentScore : parseInt(m.opponentScore || '0', 10) || 0;
      totalPointsScored += our;
      totalPointsConceded += opp;

      if (our > opp) {
        wins++;
        if (m.isHome !== false) homeWins++;
        else awayWins++;
      } else if (our < opp || (our > 0 && opp > 0)) {
        losses++;
        if (m.isHome !== false) homeLosses++;
        else awayLosses++;
      }

      const ts = m.teamStats;
      if (ts) {
        totFg2M += ts.fg2Made || 0;
        totFg2Miss += ts.fg2Missed || 0;
        totFg3M += ts.fg3Made || 0;
        totFg3Miss += ts.fg3Missed || 0;
        totFtM += ts.ftMade || 0;
        totFtMiss += ts.ftMissed || 0;
        totOffReb += ts.offRebounds || 0;
        totDefReb += ts.defRebounds || 0;
        totTurnovers += (ts.lostPasses || 0) + (ts.otherTurnovers || 0);
        totSteals += ts.steals || 0;
        totFouls += ts.fouls || 0;
      }
    });

    const winPct = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
    const avgScored = (totalPointsScored / totalMatches).toFixed(1);
    const avgConceded = (totalPointsConceded / totalMatches).toFixed(1);
    const diff = (parseFloat(avgScored) - parseFloat(avgConceded)).toFixed(1);

    const fg2Tot = totFg2M + totFg2Miss;
    const fg3Tot = totFg3M + totFg3Miss;
    const ftTot = totFtM + totFtMiss;

    return {
      totalMatches,
      wins,
      losses,
      winPct,
      totalPointsScored,
      totalPointsConceded,
      avgPointsScored: avgScored,
      avgPointsConceded: avgConceded,
      pointDifferential: parseFloat(diff) >= 0 ? `+${diff}` : diff,
      // 2P
      fg2Made: totFg2M,
      fg2Missed: totFg2Miss,
      fg2Total: fg2Tot,
      fg2Pct: fg2Tot > 0 ? ((totFg2M / fg2Tot) * 100).toFixed(1) : '0.0',
      avgFg2Made: (totFg2M / totalMatches).toFixed(1),
      // 3P
      fg3Made: totFg3M,
      fg3Missed: totFg3Miss,
      fg3Total: fg3Tot,
      fg3Pct: fg3Tot > 0 ? ((totFg3M / fg3Tot) * 100).toFixed(1) : '0.0',
      avgFg3Made: (totFg3M / totalMatches).toFixed(1),
      // FT
      ftMade: totFtM,
      ftMissed: totFtMiss,
      ftTotal: ftTot,
      ftPct: ftTot > 0 ? ((totFtM / ftTot) * 100).toFixed(1) : '0.0',
      avgFtMade: (totFtM / totalMatches).toFixed(1),
      // Rebounds & Turnovers
      avgOffReb: (totOffReb / totalMatches).toFixed(1),
      avgDefReb: (totDefReb / totalMatches).toFixed(1),
      avgTotalReb: ((totOffReb + totDefReb) / totalMatches).toFixed(1),
      avgTurnovers: (totTurnovers / totalMatches).toFixed(1),
      avgSteals: (totSteals / totalMatches).toFixed(1),
      avgFouls: (totFouls / totalMatches).toFixed(1),
      homeWins,
      homeLosses,
      awayWins,
      awayLosses
    };
  }, [teamMatches, currentTeam]);

  // Reset form to blank
  const resetForm = () => {
    setEditingDateIndex(null);
    setFormOpponent('');
    setFormDate(new Date().toLocaleDateString('ca-ES'));
    setFormIsHome(true);
    setFormOurScore('');
    setFormOpponentScore('');
    setFg2Made(0);
    setFg2Missed(0);
    setFg3Made(0);
    setFg3Missed(0);
    setFtMade(0);
    setFtMissed(0);
    setOffRebounds(0);
    setDefRebounds(0);
    setLostPasses(0);
    setSteals(0);
    setFouls(0);
    setGeneralNotes('');
  };

  // Open form for a new match
  const handleOpenNewMatch = () => {
    resetForm();
    // Unique dateIndex based on current time or next available index
    const newIndex = Date.now() % 100000;
    setEditingDateIndex(newIndex);
    setActiveTab('form');
  };

  // Open form to edit existing match
  const handleEditMatch = (match: MatchAnnotation) => {
    setEditingDateIndex(match.dateIndex);
    setFormOpponent(match.opponent || '');
    setFormDate(match.matchDate || new Date().toLocaleDateString('ca-ES'));
    setFormIsHome(match.isHome !== false);
    setFormOurScore(match.ourScore !== undefined ? match.ourScore.toString() : '');
    setFormOpponentScore(match.opponentScore !== undefined ? match.opponentScore.toString() : '');
    
    const ts = match.teamStats || {};
    setFg2Made(ts.fg2Made || 0);
    setFg2Missed(ts.fg2Missed || 0);
    setFg3Made(ts.fg3Made || 0);
    setFg3Missed(ts.fg3Missed || 0);
    setFtMade(ts.ftMade || 0);
    setFtMissed(ts.ftMissed || 0);
    setOffRebounds(ts.offRebounds || 0);
    setDefRebounds(ts.defRebounds || 0);
    setLostPasses(ts.lostPasses || ts.otherTurnovers || 0);
    setSteals(ts.steals || 0);
    setFouls(ts.fouls || 0);
    setGeneralNotes(match.generalNotes || '');
    setActiveTab('form');
  };

  // Save match cleanly with team tag
  const handleSaveMatch = () => {
    if (!formOpponent.trim()) {
      if (triggerToast) triggerToast('⚠️ Si us plau, introdueix el nom del rival.');
      return;
    }

    const dateIdx = editingDateIndex !== null ? editingDateIndex : Date.now() % 100000;
    const annotation: MatchAnnotation = {
      id: `match-${currentTeam}-${dateIdx}`,
      dateIndex: dateIdx,
      team: currentTeam,
      matchDate: formDate.trim() || new Date().toLocaleDateString('ca-ES'),
      opponent: formOpponent.trim(),
      isHome: formIsHome,
      ourScore: formOurScore ? parseInt(formOurScore, 10) : 0,
      opponentScore: formOpponentScore ? parseInt(formOpponentScore, 10) : 0,
      generalNotes: generalNotes.trim(),
      teamStats: {
        lostPasses,
        otherTurnovers: 0,
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
        blocks: 0
      },
      updatedAt: new Date().toISOString()
    };

    onSaveAnnotation(dateIdx, annotation, currentTeam);
    if (triggerToast) {
      triggerToast(`✅ Partit contra ${formOpponent.trim()} desat per a ${currentTeam === 'senior' ? 'Sènior' : 'Júnior A'}!`);
    }
    setActiveTab('matches');
  };

  // Delete match
  const handleDelete = (dateIndex: number) => {
    if (window.confirm('Segur que vols eliminar aquest partit?')) {
      onDeleteAnnotation(dateIndex, currentTeam);
      if (triggerToast) triggerToast('🗑️ Partit eliminat correctament.');
    }
  };

  // Quick Counter adjustments
  const step = (setter: React.Dispatch<React.SetStateAction<number>>, delta: number) => {
    setter(prev => Math.max(0, prev + delta));
  };

  // AI Coach Analysis request
  const handleGenerateAiAdvice = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/coach-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          microcycleName: `${currentTeam === 'senior' ? 'Sènior Masculí' : 'Júnior A Masculí'} - Estadístiques`,
          matchAnnotation: {
            opponent: `Resum Temporada (${teamMatches.length} partits)`,
            teamStats: {
              fg2Made: aggregateStats.fg2Made,
              fg2Missed: aggregateStats.fg2Missed,
              fg3Made: aggregateStats.fg3Made,
              fg3Missed: aggregateStats.fg3Missed,
              ftMade: aggregateStats.ftMade,
              ftMissed: aggregateStats.ftMissed,
              offRebounds: Math.round(parseFloat(aggregateStats.avgOffReb) * aggregateStats.totalMatches),
              defRebounds: Math.round(parseFloat(aggregateStats.avgDefReb) * aggregateStats.totalMatches),
              lostPasses: Math.round(parseFloat(aggregateStats.avgTurnovers) * aggregateStats.totalMatches),
              steals: Math.round(parseFloat(aggregateStats.avgSteals) * aggregateStats.totalMatches),
              fouls: Math.round(parseFloat(aggregateStats.avgFouls) * aggregateStats.totalMatches)
            }
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al connectar');
      setAiAdvice(data.advice);
      if (triggerToast) triggerToast('✨ Anàlisi de la temporada generada!');
    } catch (e: any) {
      // Fallback local diagnosis if server AI route not reached
      const advice = `🏀 Anàlisi Tàctica de l'Entrenador (${currentTeam === 'senior' ? 'Sènior' : 'Júnior A'}):\n` +
        `• Eficiència de tir: 2P ${aggregateStats.fg2Pct}%, 3P ${aggregateStats.fg3Pct}%, TL ${aggregateStats.ftPct}%.\n` +
        `• Pèrdues de pilota: ${aggregateStats.avgTurnovers} per partit. Recomanació: Treballar línies de passada i protecció de bola.\n` +
        `• Rebot: Mitjana de ${aggregateStats.avgTotalReb} rebots per partit. Treballar el bloqueig de rebot defensiu.`;
      setAiAdvice(advice);
    } finally {
      setLoadingAi(false);
    }
  };

  // Shooting percentages in Form
  const formFg2Tot = fg2Made + fg2Missed;
  const formFg2Pct = formFg2Tot > 0 ? Math.round((fg2Made / formFg2Tot) * 100) : 0;

  const formFg3Tot = fg3Made + fg3Missed;
  const formFg3Pct = formFg3Tot > 0 ? Math.round((fg3Made / formFg3Tot) * 100) : 0;

  const formFtTot = ftMade + ftMissed;
  const formFtPct = formFtTot > 0 ? Math.round((ftMade / formFtTot) * 100) : 0;

  return (
    <div id="modal-match-annotations" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border border-slate-750 text-slate-100 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* MODAL HEADER WITH DEDICATED TEAM SEGREGATION */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <BarChart3 size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Estadístiques i Partits
              </h2>
              <p className="text-xs text-slate-400">
                Seguiment separat i independent per a cada equip
              </p>
            </div>
          </div>

          {/* STRICT TEAM TOGGLE SELECTOR - ALWAYS SEPARATED */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-850 p-1 rounded-xl border border-slate-750 flex items-center shadow-inner">
              <button
                type="button"
                id="btn-team-select-junior"
                onClick={() => handleTeamChange('junior_a')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  currentTeam === 'junior_a'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏀 Júnior A</span>
                <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono">
                  {teamMatches.filter(m => m.team === 'junior_a' || !m.team).length}
                </span>
              </button>

              <button
                type="button"
                id="btn-team-select-senior"
                onClick={() => handleTeamChange('senior')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  currentTeam === 'senior'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏆 Sènior</span>
                <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono">
                  {allWeeklyPlans.reduce((acc, p) => {
                    if (p.team === 'senior' && p.matchAnnotations) {
                      return acc + Object.keys(p.matchAnnotations).length;
                    }
                    return acc;
                  }, 0)}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Tancar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* NAVIGATION BAR (TAB SWITCHER & ADD BUTTON) */}
        <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="tab-btn-stats"
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-850 hover:bg-slate-800 border border-slate-750'
              }`}
            >
              <BarChart3 size={14} />
              <span>Promedis & Resum</span>
            </button>

            <button
              type="button"
              id="tab-btn-matches"
              onClick={() => setActiveTab('matches')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'matches'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-850 hover:bg-slate-800 border border-slate-750'
              }`}
            >
              <Calendar size={14} />
              <span>Partits Jugats ({teamMatches.length})</span>
            </button>
          </div>

          {activeTab !== 'form' && (
            <button
              type="button"
              id="btn-add-new-match"
              onClick={handleOpenNewMatch}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Nou Partit</span>
            </button>
          )}

          {activeTab === 'form' && (
            <button
              type="button"
              onClick={() => setActiveTab('matches')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Tornar a la llista</span>
            </button>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: PROMEDIS I RESUM GENERAL */}
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* CURRENT TEAM BANNER */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                currentTeam === 'senior' 
                  ? 'bg-amber-950/25 border-amber-500/30 text-amber-200' 
                  : 'bg-blue-950/25 border-blue-500/30 text-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Trophy size={18} className={currentTeam === 'senior' ? 'text-amber-400' : 'text-blue-400'} />
                  <span className="font-extrabold text-sm">
                    Estadístiques de: {currentTeam === 'senior' ? 'Sènior Masculí' : 'Júnior A Masculí'}
                  </span>
                </div>
                <span className="text-xs bg-slate-900/80 px-2.5 py-1 rounded-full font-mono font-bold border border-slate-700">
                  {aggregateStats.totalMatches} partits acumulats
                </span>
              </div>

              {aggregateStats.totalMatches === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 border border-slate-800 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <BarChart3 size={24} />
                  </div>
                  <h3 className="text-base font-bold text-white">Cap partit registrat per a aquest equip</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Afegeix el resultat i les estadístiques del teu primer partit per veure aquí automàticament els percentatges de tir, mitjanes de punts, rebots i pèrdues.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNewMatch}
                    className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Afegir Primer Partit</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* SEASON OVERVIEW TARGET CARDS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    
                    {/* WINS / LOSSES */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Balanç Victòries</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black font-mono text-emerald-400">
                          {aggregateStats.wins}V - {aggregateStats.losses}D
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 mt-1">
                        {aggregateStats.winPct}% de victòries
                      </span>
                    </div>

                    {/* POINTS PER GAME */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Punts a Favor (PPG)</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black font-mono text-blue-400">
                          {aggregateStats.avgPointsScored}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Encaixats: <span className="text-slate-300 font-mono font-bold">{aggregateStats.avgPointsConceded}</span>
                      </span>
                    </div>

                    {/* DIFFERENTIAL */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diferencial Net</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-black font-mono ${
                          parseFloat(aggregateStats.pointDifferential) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {aggregateStats.pointDifferential}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1">
                        per partit jugat
                      </span>
                    </div>

                    {/* REBOUNDS */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rebots / Partit</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black font-mono text-amber-400">
                          {aggregateStats.avgTotalReb}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Of: <span className="font-mono font-bold text-slate-300">{aggregateStats.avgOffReb}</span> | Def: <span className="font-mono font-bold text-slate-300">{aggregateStats.avgDefReb}</span>
                      </span>
                    </div>

                  </div>

                  {/* SHOOTING EFFICIENCY SECTION */}
                  <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Target size={14} className="text-emerald-400" />
                      <span>Efectivitat en el Tir ({currentTeam === 'senior' ? 'Sènior' : 'Júnior A'})</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      {/* 2 POINTS */}
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">🏀 Tir de 2 (2P)</span>
                          <span className="text-lg font-black font-mono text-emerald-400">
                            {aggregateStats.fg2Pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, parseFloat(aggregateStats.fg2Pct))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>Total: {aggregateStats.fg2Made}/{aggregateStats.fg2Total}</span>
                          <span>{aggregateStats.avgFg2Made} anotats/partit</span>
                        </div>
                      </div>

                      {/* 3 POINTS */}
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">🎯 Tir de 3 (3P)</span>
                          <span className="text-lg font-black font-mono text-blue-400">
                            {aggregateStats.fg3Pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, parseFloat(aggregateStats.fg3Pct))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>Total: {aggregateStats.fg3Made}/{aggregateStats.fg3Total}</span>
                          <span>{aggregateStats.avgFg3Made} triples/partit</span>
                        </div>
                      </div>

                      {/* FREE THROWS */}
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">⚡ Tirs Lliures (TL)</span>
                          <span className="text-lg font-black font-mono text-amber-400">
                            {aggregateStats.ftPct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, parseFloat(aggregateStats.ftPct))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>Total: {aggregateStats.ftMade}/{aggregateStats.ftTotal}</span>
                          <span>{aggregateStats.avgFtMade} TL/partit</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* DEFENSE & CONTROL SECTION */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pèrdues / Partit</span>
                        <span className="text-xl font-black font-mono text-rose-400 mt-0.5 block">
                          {aggregateStats.avgTurnovers}
                        </span>
                      </div>
                      <AlertCircle size={24} className="text-rose-400/50" />
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Recuperacions / Partit</span>
                        <span className="text-xl font-black font-mono text-emerald-400 mt-0.5 block">
                          {aggregateStats.avgSteals}
                        </span>
                      </div>
                      <Shield size={24} className="text-emerald-400/50" />
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Faltes Comeses / Partit</span>
                        <span className="text-xl font-black font-mono text-slate-300 mt-0.5 block">
                          {aggregateStats.avgFouls}
                        </span>
                      </div>
                      <Flame size={24} className="text-orange-400/50" />
                    </div>

                  </div>

                  {/* AI TACTICAL ADVICE BOX */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot size={18} className="text-orange-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">
                          Assistent Tàctic de l'Entrenador (IA)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateAiAdvice}
                        disabled={loadingAi}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-orange-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-700 disabled:opacity-50"
                      >
                        {loadingAi ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        <span>Analitzar Equip</span>
                      </button>
                    </div>

                    {aiAdvice ? (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans relative">
                        {aiAdvice}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(aiAdvice);
                            setCopiedAi(true);
                            setTimeout(() => setCopiedAi(false), 2000);
                          }}
                          className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
                          title="Copiar anàlisi"
                        >
                          {copiedAi ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Fes clic a "Analitzar Equip" per rebre conclusions automàtiques i aspectes a treballar als propers entrenaments a partir dels partits d'aquest equip.
                      </p>
                    )}
                  </div>
                </>
              )}

            </div>
          )}

          {/* TAB 2: LLISTA DE PARTITS JUGATS */}
          {activeTab === 'matches' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Partits de: <strong className="text-white">{currentTeam === 'senior' ? 'Sènior' : 'Júnior A'}</strong> ({teamMatches.length})
                </span>
                <button
                  type="button"
                  onClick={handleOpenNewMatch}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Afegir Partit</span>
                </button>
              </div>

              {teamMatches.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400">No hi ha partits registrats per a {currentTeam === 'senior' ? 'Sènior' : 'Júnior A'}.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMatches.map(match => {
                    const our = typeof match.ourScore === 'number' ? match.ourScore : parseInt(match.ourScore || '0', 10) || 0;
                    const opp = typeof match.opponentScore === 'number' ? match.opponentScore : parseInt(match.opponentScore || '0', 10) || 0;
                    const isWin = our > opp;
                    const isLoss = our < opp;
                    const ts = match.teamStats || {};

                    return (
                      <div 
                        key={`${match.team}-${match.dateIndex}`}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition space-y-3"
                      >
                        {/* Match Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-white">
                                {match.opponent || 'Rival sense especificar'}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                match.isHome !== false 
                                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' 
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}>
                                {match.isHome !== false ? <Home size={10} /> : <Plane size={10} />}
                                <span>{match.isHome !== false ? 'Local' : 'Visitant'}</span>
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium block mt-0.5">
                              {match.matchDate || 'Data no especificada'}
                            </span>
                          </div>

                          {/* Score and Result badge */}
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-xl font-black font-mono text-white block">
                                {our} - {opp}
                              </span>
                              {isWin && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                                  Victòria (+{our - opp})
                                </span>
                              )}
                              {isLoss && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-md">
                                  Derrota ({our - opp})
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                type="button"
                                onClick={() => handleEditMatch(match)}
                                className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                                title="Editar partit"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(match.dateIndex)}
                                className="p-2 bg-slate-850 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
                                title="Eliminar partit"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats Pill Row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-300 pt-2 border-t border-slate-900">
                          {((ts.fg2Made || 0) + (ts.fg2Missed || 0)) > 0 && (
                            <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                              2P: <strong className="text-emerald-400">{ts.fg2Made}/{((ts.fg2Made || 0) + (ts.fg2Missed || 0))}</strong> ({Math.round(((ts.fg2Made || 0) / ((ts.fg2Made || 0) + (ts.fg2Missed || 0))) * 100)}%)
                            </span>
                          )}

                          {((ts.fg3Made || 0) + (ts.fg3Missed || 0)) > 0 && (
                            <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                              3P: <strong className="text-blue-400">{ts.fg3Made}/{((ts.fg3Made || 0) + (ts.fg3Missed || 0))}</strong> ({Math.round(((ts.fg3Made || 0) / ((ts.fg3Made || 0) + (ts.fg3Missed || 0))) * 100)}%)
                            </span>
                          )}

                          {((ts.ftMade || 0) + (ts.ftMissed || 0)) > 0 && (
                            <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                              TL: <strong className="text-amber-400">{ts.ftMade}/{((ts.ftMade || 0) + (ts.ftMissed || 0))}</strong> ({Math.round(((ts.ftMade || 0) / ((ts.ftMade || 0) + (ts.ftMissed || 0))) * 100)}%)
                            </span>
                          )}

                          {((ts.offRebounds || 0) + (ts.defRebounds || 0)) > 0 && (
                            <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                              Reb: <strong>{(ts.offRebounds || 0) + (ts.defRebounds || 0)}</strong> ({ts.offRebounds || 0} Of)
                            </span>
                          )}

                          {(ts.lostPasses || ts.otherTurnovers || 0) > 0 && (
                            <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-rose-300">
                              Pèrdues: <strong>{(ts.lostPasses || 0) + (ts.otherTurnovers || 0)}</strong>
                            </span>
                          )}

                          {(ts.steals || 0) > 0 && (
                            <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-emerald-300">
                              Recup: <strong>{ts.steals}</strong>
                            </span>
                          )}
                        </div>

                        {/* Notes if any */}
                        {match.generalNotes && (
                          <p className="text-xs text-slate-400 bg-slate-900/50 p-2.5 rounded-xl italic">
                            "{match.generalNotes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: FORMULARI RÀPID PER AFEGIR / EDITAR PARTIT */}
          {activeTab === 'form' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Form Title & Team Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingDateIndex !== null ? 'Editar Partit' : 'Afegir Nou Partit'}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Aquest partit s'assignarà exclusivament a l'equip: <strong className="text-white">{currentTeam === 'senior' ? 'Sènior' : 'Júnior A'}</strong>
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                  currentTeam === 'senior' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {currentTeam === 'senior' ? 'Sènior' : 'Júnior A'}
                </span>
              </div>

              {/* Basic Match Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Opponent */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Equip Rival *
                  </label>
                  <input
                    type="text"
                    value={formOpponent}
                    onChange={e => setFormOpponent(e.target.value)}
                    placeholder="Ex: CB Manresa, CB Granollers..."
                    className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden"
                  />
                </div>

                {/* Match Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Data del Partit
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden"
                  />
                </div>

                {/* Home / Away */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Condició
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormIsHome(true)}
                      className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        formIsHome 
                          ? 'bg-blue-600 text-white font-black' 
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <Home size={12} />
                      <span>Local</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsHome(false)}
                      className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        !formIsHome 
                          ? 'bg-amber-600 text-white font-black' 
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <Plane size={12} />
                      <span>Visitant</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Match Score */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                  Marcador Final
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className="block text-[11px] text-emerald-400 font-bold mb-1">
                      Els nostres punts
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formOurScore}
                      onChange={e => setFormOurScore(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xl font-mono font-black text-white text-center focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-rose-400 font-bold mb-1">
                      Punts Rival
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formOpponentScore}
                      onChange={e => setFormOpponentScore(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xl font-mono font-black text-white text-center focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* TACTILE STATS COUNTERS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Estadístiques Bàsiques de l'Equip (Fàcil d'apuntar)
                  </span>
                  <span className="text-[11px] text-slate-500">Usa els botons + i -</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* 2 POINTS COUNTER */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">🏀 2 Punts (2P)</span>
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        {formFg2Pct}% ({fg2Made}/{formFg2Tot})
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">Anotats</span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => step(setFg2Made, -1)} className="w-8 h-8 rounded-lg bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-300 flex items-center justify-center font-bold text-sm">
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center font-mono font-black text-sm text-emerald-400">{fg2Made}</span>
                          <button type="button" onClick={() => step(setFg2Made, 1)} className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center font-bold text-sm">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Fallats</span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => step(setFg2Missed, -1)} className="w-8 h-8 rounded-lg bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-300 flex items-center justify-center font-bold text-sm">
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center font-mono font-black text-sm text-slate-400">{fg2Missed}</span>
                          <button type="button" onClick={() => step(setFg2Missed, 1)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 flex items-center justify-center font-bold text-sm">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3 POINTS COUNTER */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">🎯 3 Punts (3P)</span>
                      <span className="text-xs font-mono font-black text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-500/30">
                        {formFg3Pct}% ({fg3Made}/{formFg3Tot})
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">Anotats</span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => step(setFg3Made, -1)} className="w-8 h-8 rounded-lg bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-300 flex items-center justify-center font-bold text-sm">
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center font-mono font-black text-sm text-blue-400">{fg3Made}</span>
                          <button type="button" onClick={() => step(setFg3Made, 1)} className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center font-bold text-sm">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Fallats</span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => step(setFg3Missed, -1)} className="w-8 h-8 rounded-lg bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-300 flex items-center justify-center font-bold text-sm">
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center font-mono font-black text-sm text-slate-400">{fg3Missed}</span>
                          <button type="button" onClick={() => step(setFg3Missed, 1)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 flex items-center justify-center font-bold text-sm">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FREE THROWS COUNTER */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">⚡ Tirs Lliures (TL)</span>
                      <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                        {formFtPct}% ({ftMade}/{formFtTot})
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">Anotats</span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => step(setFtMade, -1)} className="w-8 h-8 rounded-lg bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-300 flex items-center justify-center font-bold text-sm">
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center font-mono font-black text-sm text-amber-400">{ftMade}</span>
                          <button type="button" onClick={() => step(setFtMade, 1)} className="w-8 h-8 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-95 text-white flex items-center justify-center font-bold text-sm">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Fallats</span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => step(setFtMissed, -1)} className="w-8 h-8 rounded-lg bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-300 flex items-center justify-center font-bold text-sm">
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center font-mono font-black text-sm text-slate-400">{ftMissed}</span>
                          <button type="button" onClick={() => step(setFtMissed, 1)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 flex items-center justify-center font-bold text-sm">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* REBOUNDS, TURNOVERS, STEALS, FOULS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* Off Rebounds */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Rebot Ofensiu</span>
                      <span className="text-lg font-mono font-black text-white">{offRebounds}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => step(setOffRebounds, -1)} className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-300 flex items-center justify-center font-bold">
                        <Minus size={12} />
                      </button>
                      <button type="button" onClick={() => step(setOffRebounds, 1)} className="w-7 h-7 bg-slate-800 hover:bg-slate-750 rounded-lg text-white flex items-center justify-center font-bold">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Def Rebounds */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Rebot Defensiu</span>
                      <span className="text-lg font-mono font-black text-white">{defRebounds}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => step(setDefRebounds, -1)} className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-300 flex items-center justify-center font-bold">
                        <Minus size={12} />
                      </button>
                      <button type="button" onClick={() => step(setDefRebounds, 1)} className="w-7 h-7 bg-slate-800 hover:bg-slate-750 rounded-lg text-white flex items-center justify-center font-bold">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Turnovers */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-rose-400 uppercase font-bold block">Pèrdues</span>
                      <span className="text-lg font-mono font-black text-rose-400">{lostPasses}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => step(setLostPasses, -1)} className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-300 flex items-center justify-center font-bold">
                        <Minus size={12} />
                      </button>
                      <button type="button" onClick={() => step(setLostPasses, 1)} className="w-7 h-7 bg-rose-900/60 hover:bg-rose-800 rounded-lg text-rose-200 flex items-center justify-center font-bold">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Steals */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">Recuperacions</span>
                      <span className="text-lg font-mono font-black text-emerald-400">{steals}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => step(setSteals, -1)} className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-300 flex items-center justify-center font-bold">
                        <Minus size={12} />
                      </button>
                      <button type="button" onClick={() => step(setSteals, 1)} className="w-7 h-7 bg-emerald-900/60 hover:bg-emerald-800 rounded-lg text-emerald-200 flex items-center justify-center font-bold">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* General Coach Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Observacions i Claus de l'Entrenador
                </label>
                <textarea
                  rows={3}
                  value={generalNotes}
                  onChange={e => setGeneralNotes(e.target.value)}
                  placeholder="Aspectes clau del partit, comportament defensiu, actitud, rotacions..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-hidden"
                />
              </div>

              {/* SAVE / CANCEL BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('matches')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel·lar
                </button>
                <button
                  type="button"
                  id="btn-save-match-record"
                  onClick={handleSaveMatch}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Save size={16} />
                  <span>Desar Partit</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Equip actiu: <strong className="text-white">{currentTeam === 'senior' ? 'Sènior Masculí' : 'Júnior A Masculí'}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl transition cursor-pointer"
          >
            Tancar
          </button>
        </div>

      </div>
    </div>
  );
}
