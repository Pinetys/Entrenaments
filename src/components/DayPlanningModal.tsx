import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Check, 
  Copy, 
  CalendarX, 
  Trophy, 
  Dribbble, 
  ArrowRight,
  Flame,
  Layers,
  Sparkles,
  Edit3
} from 'lucide-react';
import { TrainingSession, WeeklyPlan, TeamType, MatchAnnotation, SessionTemplate, Drill } from '../types';
import { formatDateToCa } from '../App';

interface DayPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string; // YYYY-MM-DD
  sessions: Record<string, TrainingSession>;
  selectedSessionId: string;
  selectedTeam: TeamType;
  activePlan: WeeklyPlan;
  matchAnnotation?: MatchAnnotation;
  sessionTemplates?: SessionTemplate[];
  drills?: Drill[];
  onSelectSession: (sessionId: string) => void;
  onUpdateSession: (session: TrainingSession) => void;
  onCreateSession: (dateStr: string, title?: string, templateDrills?: any[], time?: string) => TrainingSession;
  onUnscheduleSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onOpenMatchModal: (dateStr: string, existingMatch?: MatchAnnotation) => void;
  triggerToast?: (msg: string) => void;
}

export const DayPlanningModal: React.FC<DayPlanningModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  sessions,
  selectedSessionId,
  selectedTeam,
  activePlan,
  matchAnnotation,
  sessionTemplates = [],
  drills = [],
  onSelectSession,
  onUpdateSession,
  onCreateSession,
  onUnscheduleSession,
  onDeleteSession,
  onOpenMatchModal,
  triggerToast
}) => {
  // Find existing session on this date
  const sessionList: TrainingSession[] = Object.values(sessions) as TrainingSession[];
  const scheduledSession = sessionList.find(
    s => s?.scheduledTime && s.scheduledTime.startsWith(dateStr)
  );

  const defaultTime = selectedTeam === 'senior' ? '21:00' : '19:30';

  // State for editing scheduled session time
  const [sessionTime, setSessionTime] = useState<string>(() => {
    if (scheduledSession?.scheduledTime) {
      const parts = scheduledSession.scheduledTime.split('T');
      if (parts[1]) return parts[1].slice(0, 5);
    }
    return defaultTime;
  });

  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // State for creating a new session
  const [activeTab, setActiveTab] = useState<'create' | 'assign'>('create');
  
  // Calculate next session number
  const existingNums = Object.keys(sessions)
    .map(k => {
      const match = k.match(/dia(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));
  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;

  const [newTitle, setNewTitle] = useState<string>('');
  const [newTime, setNewTime] = useState<string>(defaultTime);
  const [newSourceType, setNewSourceType] = useState<'empty' | 'template' | 'copy'>('empty');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCopySessionId, setSelectedCopySessionId] = useState<string>('dia1');

  // State for assigning an existing session
  const [assignSessionId, setAssignSessionId] = useState<string>('');
  const [assignTime, setAssignTime] = useState<string>(defaultTime);

  // Sync state whenever dateStr or scheduledSession changes
  useEffect(() => {
    if (scheduledSession) {
      const parts = scheduledSession.scheduledTime?.split('T');
      setSessionTime(parts && parts[1] ? parts[1].slice(0, 5) : defaultTime);
      setSessionTitle(scheduledSession.name || '');
    } else {
      setSessionTime(defaultTime);
      const dateLabel = formatDateToCa(dateStr);
      setNewTitle(`Sessió ${nextNum}: ${dateLabel}`);
      setNewTime(defaultTime);
      
      // Default assign selection to first unassigned session or dia1
      const unassigned = sessionList.find(s => !s.scheduledTime);
      setAssignSessionId(unassigned ? unassigned.id : (selectedSessionId || 'dia1'));
      setAssignTime(defaultTime);
    }
    setIsEditingTitle(false);
  }, [dateStr, scheduledSession, nextNum, defaultTime, selectedSessionId, sessionList]);

  if (!isOpen) return null;

  // Determine day of week
  const dateObj = new Date(dateStr + 'T12:00:00');
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  const isOfficialTrainingDay = dateObj.getDay() === 2 || dateObj.getDay() === 4; // Dimarts (2) i Dijous (4)
  const dayNameFormatted = formatDateToCa(dateStr);

  // Handle saving time change on existing session
  const handleSaveTimeChange = (timeVal: string) => {
    if (!scheduledSession) return;
    const updated: TrainingSession = {
      ...scheduledSession,
      scheduledTime: `${dateStr}T${timeVal}`
    };
    onUpdateSession(updated);
    setSessionTime(timeVal);
    triggerToast?.(`⏰ Hora actualitzada a les ${timeVal}!`);
  };

  // Handle saving title change on existing session
  const handleSaveTitleChange = () => {
    if (!scheduledSession || !sessionTitle.trim()) return;
    const updated: TrainingSession = {
      ...scheduledSession,
      name: sessionTitle.trim()
    };
    onUpdateSession(updated);
    setIsEditingTitle(false);
    triggerToast?.(`✏️ Nom de la sessió desat!`);
  };

  // Handle creating new session on this date
  const handleCreateSubmit = (openInPlanner: boolean = false) => {
    let templateDrills: any[] = [];
    if (newSourceType === 'template' && selectedTemplateId) {
      const tpl = sessionTemplates.find(t => t.id === selectedTemplateId);
      if (tpl && tpl.drills) {
        templateDrills = tpl.drills;
      }
    } else if (newSourceType === 'copy' && selectedCopySessionId) {
      const src = sessions[selectedCopySessionId];
      if (src && src.drills) {
        templateDrills = [...src.drills];
      }
    }

    const created = onCreateSession(dateStr, newTitle || undefined, templateDrills, newTime);
    if (openInPlanner) {
      onSelectSession(created.id);
      onClose();
    }
  };

  // Handle assigning an existing session to this date
  const handleAssignSubmit = () => {
    const targetSession = sessions[assignSessionId];
    if (!targetSession) return;

    const updated: TrainingSession = {
      ...targetSession,
      scheduledTime: `${dateStr}T${assignTime}`
    };
    onUpdateSession(updated);
    onSelectSession(targetSession.id);
    triggerToast?.(`🏀 Sessió ${targetSession.id.toUpperCase()} assignada pel ${dayNameFormatted}!`);
    onClose();
  };

  // All session options for assign dropdown
  const allSessionOptions: TrainingSession[] = [...sessionList].sort((a, b) => {
    const aNum = parseInt(a.id.replace('dia', ''), 10) || 0;
    const bNum = parseInt(b.id.replace('dia', ''), 10) || 0;
    return aNum - bNum;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
              <Calendar size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black tracking-tight uppercase text-white">
                  Planificar Dia
                </h3>
                {isWeekend ? (
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                    Cap de Setmana (Partit)
                  </span>
                ) : isOfficialTrainingDay ? (
                  <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded">
                    Dia d'Entrenament Oficial (Dimarts / Dijous)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2 py-0.5 rounded">
                    Dia Lliure / Opcional
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-300 mt-0.5">
                📅 {dayNameFormatted} ({dateStr})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Tancar"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL CONTENT BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* SECTION 1: SESSIÓ D'ENTRENAMENT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Dribbble size={15} className="text-orange-600" />
                <span>Sessió d'Entrenament</span>
              </h4>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                scheduledSession 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {scheduledSession ? '✓ Planificada' : 'Sense Sessió'}
              </span>
            </div>

            {scheduledSession ? (
              /* ACTIVE SCHEDULED SESSION CARD */
              <div className="bg-orange-50/70 border-2 border-orange-300 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200/70 pb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono uppercase bg-orange-600 text-white px-2 py-0.5 rounded">
                        🏀 S{scheduledSession.id.replace('dia', '')}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-orange-950 bg-orange-200/80 px-2 py-0.5 rounded">
                        {scheduledSession.drills?.length || 0} Exercicis · {scheduledSession.totalDuration || 75}′
                      </span>
                    </div>

                    {isEditingTitle ? (
                      <div className="flex items-center gap-1.5 mt-2">
                        <input
                          type="text"
                          value={sessionTitle}
                          onChange={(e) => setSessionTitle(e.target.value)}
                          className="text-xs font-bold px-2.5 py-1 bg-white border border-orange-300 rounded-md flex-1 text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveTitleChange}
                          className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-md hover:bg-orange-700"
                        >
                          Desar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSessionTitle(scheduledSession.name || '');
                            setIsEditingTitle(false);
                          }}
                          className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-md hover:bg-slate-300"
                        >
                          Cancel·lar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1.5 group">
                        <h5 className="text-sm font-black text-slate-900 truncate">
                          {scheduledSession.name || `Sessió ${scheduledSession.id.toUpperCase()}`}
                        </h5>
                        <button
                          type="button"
                          onClick={() => setIsEditingTitle(true)}
                          className="text-slate-400 hover:text-orange-600 transition p-0.5"
                          title="Canviar títol de la sessió"
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scheduled Time Control & Quick Chips */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 p-2.5 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-orange-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-700">Hora d'inici:</span>
                    <input
                      type="time"
                      value={sessionTime}
                      onChange={(e) => {
                        setSessionTime(e.target.value);
                        handleSaveTimeChange(e.target.value);
                      }}
                      className="bg-white border border-slate-300 font-mono text-xs font-black px-2 py-1 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {/* Quick Time Buttons */}
                  <div className="flex items-center gap-1">
                    {['17:30', '18:30', '19:30', '21:00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setSessionTime(preset);
                          handleSaveTimeChange(preset);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                          sessionTime === preset
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-100 hover:bg-orange-100 text-slate-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scheduled Session Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSession(scheduledSession.id);
                      onClose();
                    }}
                    className="flex-1 min-w-[170px] py-2 px-3 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>Obrir al Planificador</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Vols desprogramar la sessió ${scheduledSession.id.toUpperCase()} d'aquest dia? (Els exercicis es conservaran al banc de sessions)`)) {
                        onUnscheduleSession(scheduledSession.id);
                        triggerToast?.(`📅 Sessió desprogramada del ${dayNameFormatted}!`);
                      }
                    }}
                    className="py-2 px-3 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    title="Alliberar aquest dia sense esborrar els exercicis de la sessió"
                  >
                    <CalendarX size={14} />
                    <span>Desprogramar</span>
                  </button>

                  {onDeleteSession && scheduledSession.id.startsWith('dia') && parseInt(scheduledSession.id.replace('dia',''), 10) > 10 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Segur que vols eliminar completament la sessió ${scheduledSession.id.toUpperCase()}?`)) {
                          onDeleteSession(scheduledSession.id);
                        }
                      }}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition"
                      title="Eliminar sessió"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* NO SESSION: TABS TO CREATE OR ASSIGN */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3.5">
                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 py-1.5 text-xs font-black uppercase tracking-wider rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'create'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Plus size={13} />
                    <span>Crear Nova Sessió</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('assign')}
                    className={`flex-1 py-1.5 text-xs font-black uppercase tracking-wider rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'assign'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers size={13} />
                    <span>Assignar Sessió Existent</span>
                  </button>
                </div>

                {activeTab === 'create' ? (
                  /* CREATE NEW SESSION TAB */
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                        Nom de la Nova Sessió:
                      </label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={`Sessió ${nextNum}: ${dayNameFormatted}`}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                          Hora d'inici:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="bg-white border border-slate-300 font-mono text-xs font-black px-2.5 py-1.5 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                          <div className="flex items-center gap-1">
                            {['17:30', '19:30', '21:00'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setNewTime(preset)}
                                className={`px-1.5 py-1 rounded text-[9.5px] font-mono font-bold transition ${
                                  newTime === preset
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                          Contingut Inicial:
                        </label>
                        <select
                          value={newSourceType}
                          onChange={(e) => setNewSourceType(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                        >
                          <option value="empty">Sessió Buida (0 exercicis)</option>
                          {sessionTemplates.length > 0 && (
                            <option value="template">Aplicar Plantilla...</option>
                          )}
                          <option value="copy">Copiar d'una altra sessió...</option>
                        </select>
                      </div>
                    </div>

                    {/* Secondary dropdown if template or copy is chosen */}
                    {newSourceType === 'template' && sessionTemplates.length > 0 && (
                      <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-lg space-y-1">
                        <label className="text-[9.5px] font-bold text-amber-900 block">
                          Selecciona la Plantilla:
                        </label>
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-md px-2 py-1 text-xs font-bold text-slate-900"
                        >
                          <option value="">-- Selecciona una plantilla --</option>
                          {sessionTemplates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.drills?.length || 0} ex. · {t.category || 'General'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {newSourceType === 'copy' && (
                      <div className="bg-sky-50/70 border border-sky-200 p-2.5 rounded-lg space-y-1">
                        <label className="text-[9.5px] font-bold text-sky-900 block">
                          Sessió a copiar:
                        </label>
                        <select
                          value={selectedCopySessionId}
                          onChange={(e) => setSelectedCopySessionId(e.target.value)}
                          className="w-full bg-white border border-sky-300 rounded-md px-2 py-1 text-xs font-bold text-slate-900"
                        >
                          {allSessionOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.id.toUpperCase()}: {s.name} ({s.drills?.length || 0} ex.)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCreateSubmit(true)}
                        className="flex-1 py-2 px-3 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Crear i Obrir al Planificador</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCreateSubmit(false)}
                        className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                        title="Crear sessió i mantenir-se al calendari"
                      >
                        <span>Només Crear</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ASSIGN EXISTING SESSION TAB */
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                        Selecciona la Sessió a assignar:
                      </label>
                      <select
                        value={assignSessionId}
                        onChange={(e) => setAssignSessionId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        {allSessionOptions.map((s) => {
                          const isCurrentlyScheduled = !!s.scheduledTime;
                          const currentSchedDate = s.scheduledTime ? s.scheduledTime.split('T')[0] : '';
                          return (
                            <option key={s.id} value={s.id}>
                              {s.id.toUpperCase()}: {s.name} ({s.drills?.length || 0} ex.)
                              {isCurrentlyScheduled ? ` [Actualment: ${currentSchedDate}]` : ' [Pendent]'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                          Hora d'inici:
                        </label>
                        <input
                          type="time"
                          value={assignTime}
                          onChange={(e) => setAssignTime(e.target.value)}
                          className="bg-white border border-slate-300 font-mono text-xs font-black px-2.5 py-1.5 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="flex items-center gap-1 self-end pb-1">
                        {['17:30', '19:30', '21:00'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAssignTime(preset)}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition ${
                              assignTime === preset
                                ? 'bg-orange-600 text-white'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAssignSubmit}
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer mt-2"
                    >
                      <Check size={14} />
                      <span>Programar Sessió a aquesta data</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200" />

          {/* SECTION 2: PARTIT DE COMPETICIÓ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Trophy size={15} className="text-amber-500" />
                <span>Partit de Competició</span>
              </h4>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                matchAnnotation
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                {matchAnnotation ? '✓ Partit Anotat' : 'Sense Partit'}
              </span>
            </div>

            {matchAnnotation ? (
              <div className="bg-amber-50/80 border-2 border-amber-300 rounded-xl p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                      🏆 Partit Oficial
                    </span>
                    <h5 className="text-sm font-black text-slate-950 mt-1">
                      {matchAnnotation.opponent ? `vs ${matchAnnotation.opponent}` : 'Partit sense rival especificat'}
                    </h5>
                    {matchAnnotation.ourScore !== undefined && matchAnnotation.opponentScore !== undefined && (
                      <p className="text-xs font-mono font-black text-amber-950 mt-0.5">
                        Resultat: {matchAnnotation.ourScore} - {matchAnnotation.opponentScore}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenMatchModal(dateStr, matchAnnotation);
                      onClose();
                    }}
                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span>Editar Anotacions</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <p className="text-xs text-slate-500 font-medium">
                  {isWeekend 
                    ? 'Cap de setmana ideal per a partit oficial de competició o amistós.' 
                    : 'Pots afegir també un partit entre setmana si es disputa jornada ajornada.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onOpenMatchModal(dateStr, undefined);
                    onClose();
                  }}
                  className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trophy size={13} />
                  <span>Anotar Partit</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] font-mono text-slate-400">
            Temporada 2026-2027 · FCBQ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 rounded-lg transition cursor-pointer"
          >
            Tancar
          </button>
        </div>

      </div>
    </div>
  );
};
