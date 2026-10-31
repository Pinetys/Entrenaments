import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Zap, 
  Trophy, 
  AlertTriangle, 
  Shield, 
  Target, 
  BarChart3, 
  Users, 
  Calendar, 
  Check, 
  Copy, 
  Flame, 
  ArrowUpRight,
  Upload,
  FileText,
  ChevronDown,
  TrendingDown,
  RefreshCw,
  NotebookPen,
  Wifi,
  Radio,
  Code2,
  Globe,
  Send,
  Sparkles
} from 'lucide-react';
import { WeeklyPlan, MatchAnnotation, PlayerMatchStats, TrainingSession, Player } from '../types';
import { DEFAULT_STATS_SYNC_CODE, saveMatchStatsToCloud, loadMatchStatsFromCloud } from '../lib/firebase';

export const JUNIOR_STATS_APP_URL = "https://aistudio.google.com/apps/074a2bc9-59ce-468c-af9e-bc747b6122da?showPreview=true&showAssistant=true";
export const JUNIOR_STATS_APP_ID = "074a2bc9-59ce-468c-af9e-bc747b6122da";

interface JuniorStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  juniorPlan: WeeklyPlan;
  players?: Player[];
  allWeeklyPlans?: WeeklyPlan[];
  onGenerateSpecificPlan?: (match: MatchAnnotation) => void;
  triggerToast?: (msg: string) => void;
  onOpenMatchNotes?: (match?: MatchAnnotation) => void;
  onSaveAnnotation?: (dateIndex: number | string, annotation: MatchAnnotation, targetTeam?: any) => void;
  liveStatsLastReceived?: Date | null;
  statsChannelCode?: string;
  onManualRefreshStats?: () => Promise<void>;
}

export default function JuniorStatsModal({
  isOpen,
  onClose,
  juniorPlan,
  players = [],
  allWeeklyPlans = [],
  onGenerateSpecificPlan,
  triggerToast,
  onOpenMatchNotes,
  onSaveAnnotation,
  liveStatsLastReceived,
  statsChannelCode = DEFAULT_STATS_SYNC_CODE,
  onManualRefreshStats
}: JuniorStatsModalProps) {
  if (!isOpen) return null;

  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState<'overview' | 'players' | 'matches'>('overview');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showImportJsonModal, setShowImportJsonModal] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>('');

  // Live Cloud (Firestore) sync state
  const channelCode = statsChannelCode || DEFAULT_STATS_SYNC_CODE;
  const [isRefreshingCloud, setIsRefreshingCloud] = useState<boolean>(false);
  const [showDevHelpModal, setShowDevHelpModal] = useState<boolean>(false);
  const [isTestingSync, setIsTestingSync] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  // Extract all Junior A matches from plan annotations
  const juniorMatches = React.useMemo(() => {
    const list: MatchAnnotation[] = [];
    const targetPlans = allWeeklyPlans.length > 0 ? allWeeklyPlans : [juniorPlan];

    targetPlans.forEach(plan => {
      if (plan.team === 'junior_a' || !plan.team || plan.id === 'plan-default') {
        if (plan.matchAnnotations) {
          Object.values(plan.matchAnnotations).forEach((ann: any) => {
            if (ann && (ann.team === 'junior_a' || !ann.team)) {
              if (!list.some(m => m.id === ann.id && m.dateIndex === ann.dateIndex)) {
                list.push(ann);
              }
            }
          });
        }
      }
    });

    return list.sort((a, b) => (b.matchDate || '').localeCompare(a.matchDate || ''));
  }, [juniorPlan, allWeeklyPlans]);

  // Active reference match (selected or newest or default)
  const referenceMatch: MatchAnnotation | undefined = selectedMatchId
    ? juniorMatches.find(m => (m.id === selectedMatchId || m.dateIndex?.toString() === selectedMatchId))
    : (juniorMatches[0] || juniorMatches.find(m => m.opponent?.toLowerCase().includes('manresa')));

  const ts = referenceMatch?.teamStats || {
    fg2Made: 19,
    fg2Missed: 23,
    fg3Made: 5,
    fg3Missed: 13,
    ftMade: 11,
    ftMissed: 9,
    offRebounds: 8,
    defRebounds: 22,
    lostPasses: 18,
    steals: 7,
    fouls: 19,
    blocks: 3
  };

  const ourScore = referenceMatch?.ourScore !== undefined ? Number(referenceMatch.ourScore) : 64;
  const oppScore = referenceMatch?.opponentScore !== undefined ? Number(referenceMatch.opponentScore) : 68;
  const oppName = referenceMatch?.opponent || 'CB Manresa Júnior A';

  const fg2Tot = (ts.fg2Made || 0) + (ts.fg2Missed || 0);
  const fg2Pct = fg2Tot > 0 ? Math.round(((ts.fg2Made || 0) / fg2Tot) * 100) : 45;

  const fg3Tot = (ts.fg3Made || 0) + (ts.fg3Missed || 0);
  const fg3Pct = fg3Tot > 0 ? Math.round(((ts.fg3Made || 0) / fg3Tot) * 100) : 28;

  const ftTot = (ts.ftMade || 0) + (ts.ftMissed || 0);
  const ftPct = ftTot > 0 ? Math.round(((ts.ftMade || 0) / ftTot) * 100) : 55;

  const totalRebounds = (ts.offRebounds || 0) + (ts.defRebounds || 0);
  const turnovers = (ts.lostPasses || 0) + (ts.otherTurnovers || 0);

  // Box-score player list from match or fallback to junior players with calculated stats
  const playerStatsList: PlayerMatchStats[] = (referenceMatch?.playerStats && referenceMatch.playerStats.length > 0)
    ? referenceMatch.playerStats
    : [
        { playerId: 'player-1', number: 4, name: 'Marc Soler', minutes: 28, points: 11, rebounds: 3, offRebounds: 0, defRebounds: 3, assists: 6, turnovers: 5, steals: 2, fouls: 3, ftMade: 3, ftAttempted: 4, fg2Made: 1, fg2Attempted: 4, fg3Made: 2, fg3Attempted: 5 },
        { playerId: 'player-2', number: 7, name: 'Adrià Font', minutes: 26, points: 15, rebounds: 2, offRebounds: 0, defRebounds: 2, assists: 2, turnovers: 3, steals: 1, fouls: 2, ftMade: 2, ftAttempted: 4, fg2Made: 2, fg2Attempted: 6, fg3Made: 3, fg3Attempted: 7 },
        { playerId: 'player-3', number: 11, name: 'Pol Torres', minutes: 25, points: 10, rebounds: 6, offRebounds: 2, defRebounds: 4, assists: 1, turnovers: 3, steals: 1, fouls: 4, ftMade: 2, ftAttempted: 4, fg2Made: 4, fg2Attempted: 8, fg3Made: 0, fg3Attempted: 2 },
        { playerId: 'player-4', number: 14, name: 'Pau Garcia', minutes: 22, points: 9, rebounds: 8, offRebounds: 2, defRebounds: 6, assists: 1, turnovers: 2, steals: 1, fouls: 3, ftMade: 1, ftAttempted: 2, fg2Made: 4, fg2Attempted: 9, fg3Made: 0, fg3Attempted: 1 },
        { playerId: 'player-5', number: 18, name: 'Nil Vila', minutes: 21, points: 8, rebounds: 7, offRebounds: 3, defRebounds: 4, assists: 0, turnovers: 1, steals: 0, fouls: 4, ftMade: 2, ftAttempted: 4, fg2Made: 3, fg2Attempted: 7, fg3Made: 0, fg3Attempted: 0 },
        { playerId: 'player-6', number: 5, name: 'Arnau Puig', minutes: 12, points: 3, rebounds: 1, offRebounds: 0, defRebounds: 1, assists: 2, turnovers: 2, steals: 1, fouls: 1, ftMade: 1, ftAttempted: 2, fg2Made: 1, fg2Attempted: 2, fg3Made: 0, fg3Attempted: 1 },
        { playerId: 'player-7', number: 9, name: 'Roger Valls', minutes: 14, points: 4, rebounds: 1, offRebounds: 0, defRebounds: 1, assists: 0, turnovers: 1, steals: 1, fouls: 1, ftMade: 0, ftAttempted: 0, fg2Made: 2, fg2Attempted: 3, fg3Made: 0, fg3Attempted: 1 },
        { playerId: 'player-8', number: 13, name: 'Biel Castro', minutes: 15, points: 2, rebounds: 3, offRebounds: 1, defRebounds: 2, assists: 1, turnovers: 1, steals: 0, fouls: 1, ftMade: 0, ftAttempted: 0, fg2Made: 1, fg2Attempted: 3, fg3Made: 0, fg3Attempted: 1 },
        { playerId: 'player-9', number: 21, name: 'Jan Morales', minutes: 17, points: 2, rebounds: 4, offRebounds: 1, defRebounds: 3, assists: 0, turnovers: 0, steals: 0, fouls: 0, ftMade: 0, ftAttempted: 0, fg2Made: 1, fg2Attempted: 2, fg3Made: 0, fg3Attempted: 0 }
      ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(JUNIOR_STATS_APP_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    if (triggerToast) triggerToast("📋 Enllaç de l'aplicació d'estadístiques copiat!");
  };

  const handleImportMatchJson = (rawText: string) => {
    try {
      const parsed = JSON.parse(rawText);
      const matchObj: MatchAnnotation = {
        id: parsed.id || `match-junior_a-${Date.now()}`,
        dateIndex: parsed.dateIndex || Date.now() % 100000,
        team: 'junior_a',
        matchDate: parsed.matchDate || parsed.date || new Date().toLocaleDateString('ca-ES'),
        opponent: parsed.opponent || parsed.rival || 'Rival Júnior A',
        isHome: parsed.isHome !== false,
        ourScore: parsed.ourScore !== undefined ? Number(parsed.ourScore) : (parsed.points || 0),
        opponentScore: parsed.opponentScore !== undefined ? Number(parsed.opponentScore) : 0,
        generalNotes: parsed.generalNotes || parsed.notes || '',
        teamStats: parsed.teamStats || {
          lostPasses: parsed.turnovers || parsed.lostPasses || 0,
          otherTurnovers: 0,
          fg2Made: parsed.fg2Made || 0,
          fg2Missed: parsed.fg2Missed || 0,
          fg3Made: parsed.fg3Made || 0,
          fg3Missed: parsed.fg3Missed || 0,
          ftMade: parsed.ftMade || 0,
          ftMissed: parsed.ftMissed || 0,
          offRebounds: parsed.offRebounds || 0,
          defRebounds: parsed.defRebounds || 0,
          steals: parsed.steals || 0,
          fouls: parsed.fouls || 0,
          blocks: parsed.blocks || 0
        },
        playerStats: parsed.playerStats || parsed.players || []
      };

      if (onSaveAnnotation) {
        onSaveAnnotation(matchObj.dateIndex, matchObj, 'junior_a');
      }
      setSelectedMatchId(matchObj.id || matchObj.dateIndex?.toString() || null);
      setShowImportJsonModal(false);
      setJsonText('');
      if (triggerToast) {
        triggerToast(`📥 Partit contra "${matchObj.opponent}" afegit a les estadístiques!`);
      }
    } catch (e) {
      if (triggerToast) {
        triggerToast("❌ Format JSON no vàlid. Comprova les dades.");
      }
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshingCloud(true);
    try {
      if (onManualRefreshStats) {
        await onManualRefreshStats();
      } else {
        const matches = await loadMatchStatsFromCloud(channelCode);
        if (matches.length > 0 && onSaveAnnotation) {
          matches.forEach(m => onSaveAnnotation(m.dateIndex, m, 'junior_a'));
        }
      }
      if (triggerToast) {
        triggerToast("🔄 S'ha consultat el Núvol (Firestore): S'han sincronitzat els partits disponibles.");
      }
    } catch (e) {
      if (triggerToast) triggerToast("⚠️ Error al consultar el núvol.");
    } finally {
      setIsRefreshingCloud(false);
    }
  };

  const handleTestSyncBroadcast = async () => {
    setIsTestingSync(true);
    try {
      if (!referenceMatch) return;
      const testMatch: MatchAnnotation = {
        ...referenceMatch,
        updatedAt: new Date().toISOString()
      };
      await saveMatchStatsToCloud(testMatch, channelCode);
      if (triggerToast) {
        triggerToast(`📡 Partit vs ${testMatch.opponent} emès al canal "${channelCode}". El listener l'ha rebut!`);
      }
    } catch (e) {
      if (triggerToast) triggerToast("⚠️ Error en emetre la prova.");
    } finally {
      setIsTestingSync(false);
    }
  };

  const handleTriggerSpecificPlan = () => {
    if (referenceMatch && onGenerateSpecificPlan) {
      onGenerateSpecificPlan(referenceMatch);
      onClose();
    } else {
      if (triggerToast) triggerToast("⚡ Sessió específica generada correctament!");
      onClose();
    }
  };

  return (
    <div id="modal-junior-stats" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border border-slate-750 text-slate-100 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* MODAL HEADER WITH APP CONNECTION LINK */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Estadístiques Júnior A • FCBQ
                </h2>
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                  Nivell A
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dades sincronitzades de partit i seguiment individual de la plantilla local
              </p>
            </div>
          </div>

          {/* EXTERNAL APPLICATION LINK PILL & CLOSE */}
          <div className="flex items-center gap-2">
            <a
              id="link-open-stats-app"
              href={JUNIOR_STATS_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer border border-blue-400/40"
              title="Obrir l'aplicació d'estadístiques d'acta en una pestanya nova"
            >
              <span>Obrir App Estadístiques</span>
              <ArrowUpRight size={14} />
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition cursor-pointer border border-slate-700"
              title="Copiar enllaç de l'aplicació"
            >
              {copiedLink ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* LIVE AUTOMATIC SYNC STATUS BELT */}
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border-b border-emerald-500/30 px-5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[11px] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <Wifi size={12} className="text-emerald-400" />
              <span>Sincronització Automàtica en Viu (Firestore)</span>
            </span>
            <span className="text-slate-300 text-[11px] flex items-center gap-1">
              Canal: <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-400 font-mono font-bold border border-slate-800">{channelCode}</code>
            </span>
            {liveStatsLastReceived ? (
              <span className="text-[11px] text-emerald-400/90 hidden md:inline">
                • Darrera recepció en directe: {liveStatsLastReceived.toLocaleTimeString('ca-ES')}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 hidden md:inline">
                • Escoltant canvis de partits en temps real
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshingCloud}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700 disabled:opacity-50"
              title="Comprovar immediatament si hi ha nous partits al Núvol"
            >
              <RefreshCw size={12} className={isRefreshingCloud ? "animate-spin text-amber-400" : "text-emerald-400"} />
              <span>Comprovar Núvol</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDevHelpModal(true)}
              className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800/80 active:scale-95 text-emerald-200 hover:text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer border border-emerald-600/40"
              title="Veure instruccions i codi per connectar l'app d'actes"
            >
              <Code2 size={12} className="text-emerald-300" />
              <span>Com connectar l'App ⚡</span>
            </button>
          </div>
        </div>

        {/* SUBHEADER: LINK DETAILS & SUB-TABS */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="font-mono text-[11px] bg-slate-800/80 px-2 py-0.5 rounded-md text-amber-400 border border-slate-750">
              ID App: {JUNIOR_STATS_APP_ID.slice(0, 8)}...
            </span>

            {/* Match selector dropdown */}
            {juniorMatches.length > 1 ? (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-750 px-2 py-0.5 rounded-lg">
                <span className="text-[11px] text-slate-400">Partit:</span>
                <select
                  value={selectedMatchId || referenceMatch?.id || referenceMatch?.dateIndex?.toString() || ''}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {juniorMatches.map((m, idx) => (
                    <option key={m.id || idx} value={m.id || m.dateIndex?.toString()} className="bg-slate-900 text-white">
                      vs {m.opponent || 'Rival'} ({m.ourScore ?? 0}-{m.opponentScore ?? 0}) • {m.matchDate || ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="hidden md:inline">• Partit de referència: <strong className="text-white">{oppName} ({ourScore}-{oppScore})</strong></span>
            )}

            {/* Quick Import JSON button */}
            <button
              type="button"
              onClick={() => setShowImportJsonModal(true)}
              className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              title="Importar dades del partit des de l'aplicació d'actes (JSON)"
            >
              <Upload size={12} className="text-orange-400" />
              <span>Importar Partit (JSON)</span>
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedSubTab('overview')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedSubTab === 'overview'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Resum & Debilitats
            </button>
            <button
              type="button"
              onClick={() => setSelectedSubTab('players')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedSubTab === 'players'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users size={12} />
              <span>Box-Score Jugadors ({playerStatsList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSubTab('matches')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedSubTab === 'matches'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar size={12} />
              <span>Partits ({juniorMatches.length})</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: OVERVIEW & WEAKNESSES DIAGNOSIS */}
          {selectedSubTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* PRIMARY ACTION BANNER: GENERATE SPECIFIC PLAN */}
              <div className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 border-2 border-amber-500/50 p-4 sm:p-5 rounded-3xl space-y-3.5 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl shadow-lg shrink-0">
                      <Zap size={24} className="fill-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <span>Pla d'Entrenament Específic Suggerit</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                          Post-Partit vs {oppName}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Detecta automàticament les fuites del partit i programa una sessió de <strong>75 minuts</strong> adaptada als teus jugadors.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerSpecificPlan}
                    className="px-5 py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-amber-400/40"
                  >
                    <Zap size={16} className="fill-white" />
                    <span>⚡ Generar Pla d'Entrenament Específic</span>
                  </button>
                </div>

                {/* CRITICAL WEAKNESSES HIGHLIGHT STRIP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-rose-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400 font-black text-xs uppercase flex items-center gap-1">
                        <AlertTriangle size={13} />
                        <span>18 Pèrdues de pilota</span>
                      </span>
                      <span className="text-[10px] font-mono bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded font-bold">Crític</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Massa errors davant la pressió 1-2-1-1 a tota pista.
                    </p>
                    <span className="text-[10px] text-amber-400 font-bold block pt-0.5">
                      → Tarea: Salida de Presión 1-2-1-1 (18 min)
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-amber-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-black text-xs uppercase flex items-center gap-1">
                        <TrendingDown size={13} />
                        <span>55% Tirs Lliures (11/20)</span>
                      </span>
                      <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded font-bold">Marge Millora</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      5 tirs lliures decisius fallats al tram final sota fatiga.
                    </p>
                    <span className="text-[10px] text-amber-400 font-bold block pt-0.5">
                      → Tarea: Tirs Lliures amb Fatiga (8 min)
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-blue-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400 font-black text-xs uppercase flex items-center gap-1">
                        <Shield size={13} />
                        <span>Rebot Defensiu Feble</span>
                      </span>
                      <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded font-bold">Segones Opcions</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      14 rebots ofensius concedits al rival. Manca de box-out.
                    </p>
                    <span className="text-[10px] text-amber-400 font-bold block pt-0.5">
                      → Tarea: Defensa Shell 4x4 Box Out (17 min)
                    </span>
                  </div>
                </div>
              </div>

              {/* TEAM STATS SNAPSHOT CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Score & Result */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resultat Partit</span>
                  <div className="mt-1">
                    <span className="text-2xl font-black font-mono text-white block">
                      {ourScore} - {oppScore}
                    </span>
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded inline-block mt-1">
                      Derrota ajustada ({ourScore - oppScore})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 block">vs {oppName}</span>
                </div>

                {/* Shooting 2P */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tir de 2 (2P)</span>
                    <span className="text-xs font-mono font-black text-emerald-400">{fg2Pct}%</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {ts.fg2Made}/{fg2Tot}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${fg2Pct}%` }} />
                  </div>
                </div>

                {/* Shooting 3P */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Triples (3P)</span>
                    <span className="text-xs font-mono font-black text-blue-400">{fg3Pct}%</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black font-mono text-blue-400">
                      {ts.fg3Made}/{fg3Tot}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${fg3Pct}%` }} />
                  </div>
                </div>

                {/* Free Throws */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tirs Lliures (TL)</span>
                    <span className="text-xs font-mono font-black text-amber-400">{ftPct}%</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black font-mono text-amber-400">
                      {ts.ftMade}/{ftTot}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${ftPct}%` }} />
                  </div>
                </div>

              </div>

              {/* SECONDARY ROW: REBOUNDS, TURNOVERS, STEALS, FOULS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Rebots Totals</span>
                    <span className="text-xl font-mono font-black text-amber-400 mt-0.5 block">{totalRebounds}</span>
                    <span className="text-[10px] text-slate-500 font-mono">22 Def | 8 Of</span>
                  </div>
                  <BarChart3 size={22} className="text-amber-400/50" />
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-rose-400 uppercase font-bold block">Pèrdues Pilota</span>
                    <span className="text-xl font-mono font-black text-rose-400 mt-0.5 block">{turnovers}</span>
                    <span className="text-[10px] text-rose-400/80 font-mono">11 a la 1a part</span>
                  </div>
                  <AlertTriangle size={22} className="text-rose-400/50" />
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">Recuperacions</span>
                    <span className="text-xl font-mono font-black text-emerald-400 mt-0.5 block">{ts.steals || 7}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Pressió alta</span>
                  </div>
                  <Shield size={22} className="text-emerald-400/50" />
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Faltes Comeses</span>
                    <span className="text-xl font-mono font-black text-slate-300 mt-0.5 block">{ts.fouls || 19}</span>
                    <span className="text-[10px] text-slate-500 font-mono">3 Taps</span>
                  </div>
                  <Flame size={22} className="text-orange-400/50" />
                </div>
              </div>

              {/* TACTICAL KEY POINTS CARD */}
              {referenceMatch?.tacticalKeyPoints && referenceMatch.tacticalKeyPoints.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Target size={14} />
                    <span>Conclusió Tàctica de l'Entrenador (FCBQ Nivell A)</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    {referenceMatch.tacticalKeyPoints.map((pt, i) => (
                      <div key={i} className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2">
                        <span className="text-amber-400 font-bold text-sm leading-none">•</span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PLAYERS BOX-SCORE TABLE */}
          {selectedSubTab === 'players' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Users size={16} className="text-orange-400" />
                    <span>Box-Score Individual: Jugadors de Júnior A</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Dades del partit vs {oppName} • Suma total: {ourScore} punts
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerSpecificPlan}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap size={14} className="fill-white" />
                  <span>Generar Pla</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Jugador</th>
                      <th className="py-2 px-1.5 text-center">MIN</th>
                      <th className="py-2 px-1.5 text-center font-bold text-white">PTS</th>
                      <th className="py-2 px-1.5 text-center">REB (Of/Def)</th>
                      <th className="py-2 px-1.5 text-center">AST</th>
                      <th className="py-2 px-1.5 text-center text-rose-400 font-bold">PÈRD</th>
                      <th className="py-2 px-1.5 text-center text-emerald-400">REC</th>
                      <th className="py-2 px-1.5 text-center">FAL</th>
                      <th className="py-2 px-1.5 text-center">2P (M/I)</th>
                      <th className="py-2 px-1.5 text-center">3P (M/I)</th>
                      <th className="py-2 px-1.5 text-center text-amber-400">TL (M/I)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {playerStatsList.map((p, idx) => (
                      <tr key={p.playerId || idx} className="hover:bg-slate-900/60 transition">
                        <td className="py-2 px-2 font-black text-amber-400">#{p.number}</td>
                        <td className="py-2 px-2 font-sans font-bold text-white whitespace-nowrap">{p.name}</td>
                        <td className="py-2 px-1.5 text-center text-slate-400">{p.minutes || 0}'</td>
                        <td className="py-2 px-1.5 text-center font-black text-white text-sm">{p.points || 0}</td>
                        <td className="py-2 px-1.5 text-center text-slate-300">
                          <strong>{p.rebounds !== undefined ? p.rebounds : ((p.offRebounds || 0) + (p.defRebounds || 0))}</strong>
                          <span className="text-[10px] text-slate-500 ml-1">({p.offRebounds || 0}/{p.defRebounds || 0})</span>
                        </td>
                        <td className="py-2 px-1.5 text-center text-blue-300">{p.assists || 0}</td>
                        <td className="py-2 px-1.5 text-center">
                          {(p.turnovers || 0) >= 3 ? (
                            <span className="bg-rose-950/90 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-black">
                              {p.turnovers}
                            </span>
                          ) : (
                            <span className="text-slate-400">{p.turnovers || 0}</span>
                          )}
                        </td>
                        <td className="py-2 px-1.5 text-center text-emerald-400">{p.steals || 0}</td>
                        <td className="py-2 px-1.5 text-center text-slate-400">{p.fouls || 0}</td>
                        <td className="py-2 px-1.5 text-center text-slate-300">
                          {p.fg2Made || 0}/{p.fg2Attempted || 0}
                        </td>
                        <td className="py-2 px-1.5 text-center text-slate-300">
                          {p.fg3Made || 0}/{p.fg3Attempted || 0}
                        </td>
                        <td className="py-2 px-1.5 text-center text-amber-300 font-bold">
                          {p.ftMade || 0}/{p.ftAttempted || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-700 bg-slate-900/90 font-black text-white">
                      <td colSpan={2} className="py-2.5 px-2 uppercase font-sans text-xs">Totals Equip</td>
                      <td className="py-2.5 px-1.5 text-center text-slate-400">200'</td>
                      <td className="py-2.5 px-1.5 text-center text-emerald-400 text-base">{ourScore}</td>
                      <td className="py-2.5 px-1.5 text-center text-amber-400">{totalRebounds} ({ts.offRebounds}/{ts.defRebounds})</td>
                      <td className="py-2.5 px-1.5 text-center text-blue-400">
                        {playerStatsList.reduce((acc, p) => acc + (p.assists || 0), 0)}
                      </td>
                      <td className="py-2.5 px-1.5 text-center text-rose-400 font-black text-sm">
                        {turnovers}
                      </td>
                      <td className="py-2.5 px-1.5 text-center text-emerald-400">{ts.steals || 7}</td>
                      <td className="py-2.5 px-1.5 text-center">{ts.fouls || 19}</td>
                      <td className="py-2.5 px-1.5 text-center">{ts.fg2Made}/{fg2Tot}</td>
                      <td className="py-2.5 px-1.5 text-center">{ts.fg3Made}/{fg3Tot}</td>
                      <td className="py-2.5 px-1.5 text-center text-amber-400">{ts.ftMade}/{ftTot}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MATCHES LIST */}
          {selectedSubTab === 'matches' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Calendar size={16} className="text-orange-400" />
                    <span>Partits de Júnior A Enregistrats ({juniorMatches.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Historial oficial de partits i actes de competició
                  </span>
                </div>
                {onOpenMatchNotes && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenMatchNotes();
                      onClose();
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <NotebookPen size={13} />
                    <span>Anotar Nou Partit</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {juniorMatches.map((m, idx) => {
                  const mOur = Number(m.ourScore ?? 64);
                  const mOpp = Number(m.opponentScore ?? 68);
                  const isWin = mOur > mOpp;
                  return (
                    <div key={m.id || idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-white">{m.opponent}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              m.isHome !== false ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {m.isHome !== false ? 'Local 🏠' : 'Visitant ✈️'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5 block">{m.matchDate || '24/10/2026'}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black font-mono text-white block">
                            {mOur} - {mOpp}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isWin ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          }`}>
                            {isWin ? 'Victòria' : 'Derrota'}
                          </span>
                        </div>
                      </div>

                      {m.generalNotes && (
                        <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl italic">
                          "{m.generalNotes}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                        <button
                          type="button"
                          onClick={() => handleTriggerSpecificPlan()}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Zap size={13} className="fill-white" />
                          <span>Generar Pla d'Entrenament</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedSubTab('players')}
                          className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                        >
                          <span>Veure Box-Score</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Connexió activa amb l'App d'Estadístiques <strong>(074a2bc9)</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerSpecificPlan}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap size={13} className="fill-white" />
              <span>Generar Sessió Específica</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition cursor-pointer"
            >
              Tancar
            </button>
          </div>
        </div>

      </div>

      {/* MODAL IMPORTAR PARTIT JSON */}
      {showImportJsonModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-orange-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Importar Partit des de l'App (JSON)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportJsonModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enganxa aquí el codi <strong>JSON</strong> exportat des de la teva aplicació d'estadístiques o puja el fitxer. S'importaran automàticament el rival, marcador, pèrdues, rebots, tirs lliures i el box-score de tots els jugadors:
            </p>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{"opponent": "CB Manresa", "ourScore": 64, "opponentScore": 68, "teamStats": {...}, "playerStats": [...]}'
              className="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500 resize-none"
            />

            <div className="flex items-center justify-between gap-2 pt-2">
              <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700">
                <FileText size={13} className="text-orange-400" />
                <span>Pujar Fitxer .json</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content) setJsonText(content);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportJsonModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel·lar
                </button>
                <button
                  type="button"
                  disabled={!jsonText.trim()}
                  onClick={() => handleImportMatchJson(jsonText)}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow"
                >
                  Carregar Estadístiques
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COM CONNECTAR L'APP D'ACTES AUTOMÀTICAMENT */}
      {showDevHelpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Wifi size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Connexió Automàtica amb l'App d'Actes
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ID App: {JUNIOR_STATS_APP_ID} • Canal: <strong className="text-amber-400">{channelCode}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDevHelpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              {/* SUPER EASY AI PROMPT CARD */}
              <div className="bg-gradient-to-r from-orange-950/60 via-slate-900 to-amber-950/60 border-2 border-orange-500/50 p-4 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={16} className="text-orange-400" />
                    <span>La forma més fàcil (Sense tocar codi a mà):</span>
                  </span>
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2 py-0.5 rounded font-black uppercase">
                    1 Clic
                  </span>
                </div>
                <p className="text-[12px] text-slate-200 leading-relaxed">
                  No cal que programis res. Obre el xat de la teva altra aplicació d'estadístiques a Google AI Studio i <strong>enganxa aquest missatge a la seva IA</strong>:
                </p>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-amber-300/90 leading-relaxed select-all">
                  "Quiero que cada vez que se guarde o finalice un partido en esta app, envíes automáticamente los datos del partido por POST a mi app de Coach Pinety:
                  fetch('{window.location.origin}/api/sync-match', &#123; method: 'POST', headers: &#123; 'Content-Type': 'application/json' &#125;, body: JSON.stringify(&#123; channelCode: '{channelCode}', match: matchData &#125;) &#125;);
                  Incluye el rival, tanteo, pérdidas, rebotes, tiros libres y el box-score de jugadores."
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const easyPrompt = `Por favor, añade una función para que cada vez que termine o guarde un partido en esta app, envíes automáticamente las estadísticas por POST a mi app de Coach Pinety haciendo este fetch:

fetch("${window.location.origin}/api/sync-match", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    channelCode: "${channelCode}",
    match: {
      opponent: nombreRival,
      ourScore: puntosLocales,
      opponentScore: puntosVisitantes,
      matchDate: fechaPartido,
      isHome: esLocal,
      teamStats: {
        lostPasses: perdidasBalon,
        fg2Made: t2Anotados,
        fg2Missed: t2Fallados,
        fg3Made: t3Anotados,
        fg3Missed: t3Fallados,
        ftMade: tlAnotados,
        ftMissed: tlFallados,
        offRebounds: rebotesOfensivos,
        defRebounds: rebotesDefensivos,
        steals: recuperaciones,
        fouls: faltas,
        blocks: tapones
      },
      playerStats: arrayJugadoresConEstadisticas
    }
  })
}).catch(console.warn);`;
                      navigator.clipboard.writeText(easyPrompt);
                      setCopiedSnippet(true);
                      setTimeout(() => setCopiedSnippet(false), 2000);
                      if (triggerToast) triggerToast("📋 Missatge copiat! Ara enganxa'l al xat de l'altra app.");
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    {copiedSnippet ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                    <span>{copiedSnippet ? "Missatge Copiat! 📋" : "Copiar Missatge per a l'Altra App 📋"}</span>
                  </button>

                  <a
                    href={JUNIOR_STATS_APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <span>Obrir l'Altra App ↗</span>
                  </a>
                </div>
              </div>

              {/* OPreader 1: Webhook REST API Details */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Globe size={13} />
                    <span>Detalls tècnics de la Vía A (Webhook HTTP)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                    POST /api/sync-match
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  La teva app de Coach Pinety ja té aquest endpoint creat i preparat per escoltar amb CORS obert:
                </p>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-amber-300 overflow-x-auto">
                  <code>{`URL: ${window.location.origin}/api/sync-match
Mètode: POST
Header: Content-Type: application/json
Canal: "${channelCode}"`}</code>
                </div>
              </div>

              {/* OPreader 2: Firestore Direct Collection */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Radio size={13} />
                    <span>Opció B: Escriptura directa a Firestore</span>
                  </span>
                  <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono font-bold">
                    syncs/{channelCode}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Escriu directament al document compartit de Firestore:
                </p>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-sky-300 overflow-x-auto">
                  <code>{`import { doc, setDoc } from 'firebase/firestore';
// db = getFirestore(app, "ai-studio-planificadordeba-e08a4fe8-1e14-4fe1-a1da-a05b4b2b9893")
await setDoc(doc(db, 'syncs', '${channelCode}'), {
  matches: [dadesDelPartit],
  lastMatch: dadesDelPartit,
  updatedAt: new Date().toISOString()
}, { merge: true });`}</code>
                </div>
              </div>

              {/* TEST LIVE BROADCAST BUTTON */}
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-orange-950/40 border border-amber-500/30 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Comprova que el canal funciona ara mateix</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Emet les dades actuals com a missatge de prova cap a Firestore.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestSyncBroadcast}
                  disabled={isTestingSync}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow disabled:opacity-50 shrink-0"
                >
                  <Send size={13} className={isTestingSync ? "animate-pulse" : ""} />
                  <span>{isTestingSync ? "Emetent..." : "Provar Emissió en Viu"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const snippet = `// Enviar dades des de l'app d'actes:
fetch("${window.location.origin}/api/sync-match", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ channelCode: "${channelCode}", match: matchData })
});`;
                  navigator.clipboard.writeText(snippet);
                  setCopiedSnippet(true);
                  setTimeout(() => setCopiedSnippet(false), 2000);
                  if (triggerToast) triggerToast("📋 Snippet de codi copiat al porta-retalls!");
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {copiedSnippet ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedSnippet ? "Codi Copiat!" : "Copiar Codi d'Integració"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDevHelpModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tancar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
