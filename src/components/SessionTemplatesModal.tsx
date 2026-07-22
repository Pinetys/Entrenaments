import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  Clock, 
  Layers, 
  BookOpen, 
  Bookmark, 
  Zap, 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  ShieldAlert,
  Flame,
  Maximize2,
  FileText
} from 'lucide-react';
import { Drill, SessionTemplate, TrainingSession, WeeklyPlan, DrillCategory, BoardState } from '../types';
import { getDrillColorProfile } from '../lib/drillColors';
import TacticalBoard from './TacticalBoard';

interface SessionTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: SessionTemplate[];
  drills: Drill[];
  activePlan: WeeklyPlan;
  activeSession: TrainingSession;
  allSessions?: Record<string, TrainingSession>;
  onApplyTemplateToSession: (template: SessionTemplate, targetSessionId: string) => void;
  onSaveCurrentSessionAsTemplate: (name: string, category: string, description?: string) => void;
  onCreateTemplateFromScratch: (newTpl: Omit<SessionTemplate, 'id'>) => void;
  onDeleteTemplate: (templateId: string) => void;
  triggerToast?: (msg: string) => void;
}

export default function SessionTemplatesModal({
  isOpen,
  onClose,
  templates,
  drills,
  activePlan,
  activeSession,
  allSessions,
  onApplyTemplateToSession,
  onSaveCurrentSessionAsTemplate,
  onCreateTemplateFromScratch,
  onDeleteTemplate,
  triggerToast
}: SessionTemplatesModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'save_current' | 'create_new'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tots');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // Selector for "Traslladar a qualsevol sessió"
  const [transferTarget, setTransferTarget] = useState<{ template: SessionTemplate; openDropdown: boolean } | null>(null);

  // Drill preview Lightbox modal state
  const [lightboxDrill, setLightboxDrill] = useState<Drill | null>(null);

  // Template deletion confirmation modal state
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<SessionTemplate | null>(null);

  // Helper to handle applying template with confirmation if session is not empty
  const handleConfirmAndApplyTemplate = (tpl: SessionTemplate, targetSessionId: string) => {
    const targetSessionObj = allSessions ? allSessions[targetSessionId] : (activePlan[targetSessionId as keyof WeeklyPlan] as TrainingSession | undefined);
    const targetCount = targetSessionObj?.drills?.length || 0;
    
    if (targetCount > 0) {
      if (!window.confirm(`Estàs segur que vols aplicar la plantilla "${tpl.name}"? Això sobreescriurà els ${targetCount} exercicis actuals de la sessió.`)) {
        return;
      }
    }
    
    onApplyTemplateToSession(tpl, targetSessionId);
    if (triggerToast) triggerToast(`📥 Plantilla "${tpl.name}" carregada correctament`);
    onClose();
  };

  // Form states for "Save Current Session as Template"
  const [saveName, setSaveName] = useState(activeSession.name || 'Nova Plantilla d\'Entrenament');
  const [saveCategory, setSaveCategory] = useState('Transició');
  const [saveDescription, setSaveDescription] = useState('');

  // Form states for "Create Template From Scratch"
  const [createName, setCreateName] = useState('');
  const [createCategory, setCreateCategory] = useState('Atac');
  const [createDescription, setCreateDescription] = useState('');
  const [selectedDrillItems, setSelectedDrillItems] = useState<{ drillId: string; duration: number; notes: string }[]>([]);
  const [scratchSearch, setScratchSearch] = useState('');

  if (!isOpen) return null;

  // Filter templates
  const filteredTemplates = templates.filter(tpl => {
    const matchesCategory = categoryFilter === 'Tots' || tpl.category === categoryFilter;
    const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.description && tpl.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Calculate session list names for target assignment dropdown
  const sessionList = [
    { id: 'dia1', num: 1, name: activePlan.dia1?.name || 'Sessió 1' },
    { id: 'dia2', num: 2, name: activePlan.dia2?.name || 'Sessió 2' },
    { id: 'dia3', num: 3, name: activePlan.dia3?.name || 'Sessió 3' },
    { id: 'dia4', num: 4, name: activePlan.dia4?.name || 'Sessió 4' },
    { id: 'dia5', num: 5, name: activePlan.dia5?.name || 'Sessió 5' },
    { id: 'dia6', num: 6, name: activePlan.dia6?.name || 'Sessió 6' },
    { id: 'dia7', num: 7, name: activePlan.dia7?.name || 'Sessió 7' },
    { id: 'dia8', num: 8, name: activePlan.dia8?.name || 'Sessió 8' }
  ];

  const handleConfirmSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;
    if (activeSession.drills.length === 0) {
      if (triggerToast) triggerToast('⚠️ No pots desar una plantilla buida. Afegeix primer exercicis a la sessió!');
      return;
    }
    onSaveCurrentSessionAsTemplate(saveName.trim(), saveCategory, saveDescription.trim());
    if (triggerToast) triggerToast(`✅ S'ha guardat la plantilla "${saveName.trim()}" a la biblioteca!`);
    setActiveTab('library');
  };

  const handleConfirmCreateFromScratch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    if (selectedDrillItems.length === 0) {
      if (triggerToast) triggerToast('⚠️ Afegeix almenys un exercici a la nova plantilla.');
      return;
    }
    const totalDuration = selectedDrillItems.reduce((acc, curr) => acc + curr.duration, 0);
    onCreateTemplateFromScratch({
      name: createName.trim(),
      category: createCategory,
      description: createDescription.trim(),
      drills: selectedDrillItems,
      totalDuration,
      isCustom: true
    });
    if (triggerToast) triggerToast(`✅ S'ha creat la plantilla "${createName.trim()}" a la biblioteca!`);
    setCreateName('');
    setCreateDescription('');
    setSelectedDrillItems([]);
    setActiveTab('library');
  };

  const addDrillToScratch = (drill: Drill) => {
    setSelectedDrillItems(prev => [
      ...prev,
      { drillId: drill.id, duration: drill.duration || 10, notes: '' }
    ]);
  };

  const removeDrillFromScratch = (index: number) => {
    setSelectedDrillItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateScratchDuration = (index: number, newDur: number) => {
    setSelectedDrillItems(prev => prev.map((item, idx) => 
      idx === index ? { ...item, duration: Math.max(1, newDur) } : item
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 my-auto">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>Biblioteca d'Entrenaments</span>
                <span className="text-[10px] bg-orange-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Plantilles
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Crea, guarda i trasllada entrenaments complets a qualsevol sessió del calendari
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'library'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-250'
              }`}
            >
              <BookOpen size={14} className={activeTab === 'library' ? 'text-orange-400' : ''} />
              Biblioteca ({templates.length})
            </button>
            <button
              onClick={() => {
                setSaveName(activeSession.name || 'Sessió d\'Entrenament');
                setActiveTab('save_current');
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'save_current'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-250'
              }`}
            >
              <Bookmark size={14} className={activeTab === 'save_current' ? 'text-amber-400' : ''} />
              Desar Sessió Activa ({activeSession.drills.length} ex.)
            </button>
            <button
              onClick={() => setActiveTab('create_new')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'create_new'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-250'
              }`}
            >
              <Plus size={14} className={activeTab === 'create_new' ? 'text-emerald-400' : ''} />
              Crear Plantilla Nova
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
          
          {/* TAB 1: LIBRARY OF TEMPLATES */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              
              {/* FILTERS & SEARCH BAR */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cercar per nom o descripció..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Category filter pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {['Tots', 'Transició', 'Atac', 'Defensa', 'Físico', 'Combinat'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded text-[11px] font-extrabold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                        categoryFilter === cat
                          ? 'bg-orange-500 text-slate-950 font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* CARDS GALLERY */}
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">
                    No s'ha trobat cap plantilla
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                    Pots desar la sessió actual com a plantilla o bé crear-ne una de nova des de zero.
                  </p>
                  <button
                    onClick={() => setActiveTab('save_current')}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-md cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Bookmark size={14} /> Desar Sessió Activa Ara
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map(tpl => {
                    const isExpanded = expandedTemplateId === tpl.id;
                    const isTransferOpen = transferTarget?.template.id === tpl.id;

                    return (
                      <div
                        key={tpl.id}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between relative"
                      >
                        {/* CARD HEADER */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider border font-mono ${
                                tpl.category === 'Atac' 
                                  ? 'bg-orange-50 text-orange-700 border-orange-200' 
                                  : tpl.category === 'Defensa'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : tpl.category === 'Transició'
                                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {tpl.category}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                ⏱️ {tpl.totalDuration} min
                              </span>
                              <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                                {tpl.drills.length} exercicis
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTemplate(tpl)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition cursor-pointer flex items-center gap-1"
                              title="Eliminar plantilla de la biblioteca"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug">
                            {tpl.name}
                          </h3>

                          {tpl.description && (
                            <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                              {tpl.description}
                            </p>
                          )}
                        </div>

                        {/* DRILL PREVIEW MINI CHIPS */}
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">
                            <span>Resum d'exercicis:</span>
                            <button
                              type="button"
                              onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                              className="text-orange-600 hover:text-orange-700 flex items-center gap-0.5 cursor-pointer font-black"
                            >
                              {isExpanded ? 'Amagar detall' : 'Veure desglossament'}
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          </div>

                          {/* Collapsed view: horizontal drill thumbnails with Tactical Board graphics */}
                          {!isExpanded && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {tpl.drills.slice(0, 4).map((dItem, idx) => {
                                const orig = drills.find(dr => dr.id === dItem.drillId);
                                const isVirtual = dItem.drillId.startsWith('virtual-');
                                const title = isVirtual 
                                  ? (dItem.drillId.includes('hydration') ? 'Hydration' : 'Tirs Lliures')
                                  : (orig?.title || 'Exercici');
                                const boardState = orig?.boardState || { paths: [], pins: [] };

                                return (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      if (orig) setLightboxDrill(orig);
                                    }}
                                    title={`Fes clic per ampliar: ${title}`}
                                    className="bg-slate-50 border border-slate-200 hover:border-orange-400 p-1 rounded-md flex flex-col items-center gap-1 cursor-pointer transition shadow-2xs group w-20"
                                  >
                                    {!isVirtual ? (
                                      <div className="w-full h-12 bg-white rounded overflow-hidden border border-slate-200 pointer-events-none">
                                        <TacticalBoard boardState={boardState} onChange={() => {}} readOnly={true} />
                                      </div>
                                    ) : (
                                      <div className="w-full h-12 bg-blue-50/80 rounded flex items-center justify-center text-xs">
                                        {dItem.drillId.includes('hydration') ? '💧' : '🏀'}
                                      </div>
                                    )}
                                    <div className="text-[9px] font-bold text-slate-700 truncate w-full text-center px-0.5">
                                      {title}
                                    </div>
                                    <span className="text-[8px] font-mono font-black text-orange-600 bg-orange-50 px-1 rounded">
                                      {dItem.duration}′
                                    </span>
                                  </div>
                                );
                              })}
                              {tpl.drills.length > 4 && (
                                <div className="bg-slate-100 border border-slate-200 text-slate-600 rounded-md p-1 font-bold text-[10px] flex items-center justify-center w-12 h-16 self-center">
                                  +{tpl.drills.length - 4} més
                                </div>
                              )}
                            </div>
                          )}

                          {/* Expanded view: full list of drills with Tactical Board Graphics */}
                          {isExpanded && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                              {tpl.drills.map((dItem, idx) => {
                                const orig = drills.find(dr => dr.id === dItem.drillId);
                                const isVirtual = dItem.drillId.startsWith('virtual-');
                                const title = isVirtual 
                                  ? (dItem.drillId.includes('hydration') ? 'Descans d’Hidratació' : 'Tirs Lliures de Recuperació')
                                  : (orig?.title || 'Exercici No Trobat');
                                const cat = isVirtual ? (dItem.drillId.includes('hydration') ? 'Físico' : 'Tiro') : (orig?.category || 'Atac');
                                const boardState = orig?.boardState || { paths: [], pins: [] };

                                return (
                                  <div
                                    key={idx}
                                    className="text-xs bg-white border border-slate-200 p-2 rounded-lg flex items-center justify-between gap-3 shadow-2xs hover:border-orange-300 transition"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 font-mono text-[9px] font-black text-slate-600 flex items-center justify-center shrink-0">
                                        {idx + 1}
                                      </span>

                                      {/* Tactical Board Court Graphic Preview */}
                                      {!isVirtual && (
                                        <div 
                                          onClick={() => orig && setLightboxDrill(orig)}
                                          title="Clica per ampliar el gràfic tàctic"
                                          className="w-20 xs:w-24 h-16 bg-white border border-slate-200 rounded overflow-hidden shrink-0 cursor-pointer hover:border-orange-500 hover:scale-[1.02] transition shadow-2xs"
                                        >
                                          <TacticalBoard boardState={boardState} onChange={() => {}} readOnly={true} />
                                        </div>
                                      )}

                                      <div className="min-w-0 flex-1">
                                        <p 
                                          onClick={() => orig && setLightboxDrill(orig)}
                                          className={`font-bold text-slate-800 text-[11px] uppercase tracking-tight ${orig ? 'cursor-pointer hover:text-orange-600 hover:underline' : ''}`}
                                        >
                                          {title}
                                        </p>
                                        <p className="text-[9.5px] text-slate-400 font-mono">
                                          {cat} {dItem.notes ? `• ${dItem.notes}` : ''}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="font-mono text-xs font-black bg-orange-100 text-orange-850 px-2 py-0.5 rounded shrink-0">
                                      {dItem.duration}′
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* CARD ACTIONS */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                          {/* Apply to active session directly */}
                          <button
                            type="button"
                            onClick={() => {
                              handleConfirmAndApplyTemplate(tpl, activeSession.id);
                            }}
                            className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-md cursor-pointer transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Zap size={13} className="text-orange-400" />
                            Carregar a Sessió Activa
                          </button>

                          {/* Transfer / assign to any specific session in calendar */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                if (isTransferOpen) {
                                  setTransferTarget(null);
                                } else {
                                  setTransferTarget({ template: tpl, openDropdown: true });
                                }
                              }}
                              className="w-full sm:w-auto py-2 px-3 bg-white hover:bg-orange-50 border border-orange-300 text-orange-850 font-black text-xs uppercase tracking-wider rounded-md cursor-pointer transition flex items-center justify-center gap-1 shadow-xs"
                              title="Assignar aquesta plantilla a qualsevol sessió del calendari"
                            >
                              <Calendar size={13} className="text-orange-600" />
                              <span>Traslladar a...</span>
                              <ChevronDown size={13} />
                            </button>

                            {/* DROPDOWN FOR SELECTING TARGET SESSION */}
                            {isTransferOpen && (
                              <div className="absolute right-0 bottom-full mb-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-30 animate-fadeIn space-y-1">
                                <div className="px-2 py-1 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                                  Tria la sessió de destinació:
                                </div>
                                <div className="max-h-56 overflow-y-auto no-scrollbar space-y-1">
                                  {sessionList.map(s => {
                                    const sessionObj = allSessions ? allSessions[s.id] : (activePlan[s.id as keyof WeeklyPlan] as TrainingSession | undefined);
                                    const drillsCount = sessionObj?.drills?.length || 0;
                                    return (
                                      <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                          handleConfirmAndApplyTemplate(tpl, s.id);
                                          setTransferTarget(null);
                                        }}
                                        className="w-full text-left p-2 hover:bg-orange-50 border border-transparent hover:border-orange-200 rounded transition cursor-pointer flex items-center justify-between gap-2 text-xs"
                                      >
                                        <div className="min-w-0">
                                          <p className="font-bold text-slate-800 text-xs truncate">
                                            S{s.num}: {sessionObj?.name ? sessionObj.name : `Sessió ${s.num}`}
                                          </p>
                                          <p className="text-[9.5px] font-mono text-slate-400">
                                            {drillsCount > 0 ? `${drillsCount} ex. actuals` : 'Sessió buida'}
                                          </p>
                                        </div>
                                        <ArrowRight size={13} className="text-orange-500 shrink-0" />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVE CURRENT ACTIVE SESSION AS A TEMPLATE */}
          {activeTab === 'save_current' && (
            <form onSubmit={handleConfirmSaveCurrent} className="space-y-4 max-w-2xl mx-auto bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="border-b border-slate-150 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Bookmark size={16} className="text-orange-500" />
                  Desar Sessió Activa a la Biblioteca
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Convertiràs els {activeSession.drills.length} exercicis de "{activeSession.name}" en una plantilla reutilitzable.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nom de la Plantilla:
                  </label>
                  <input
                    type="text"
                    required
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Ex: Sessió Tàctica de Pick and Roll i Pressió"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Categoria / Enfocament:
                    </label>
                    <select
                      value={saveCategory}
                      onChange={(e) => setSaveCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                    >
                      <option value="Transició">Transició</option>
                      <option value="Atac">Atac</option>
                      <option value="Defensa">Defensa</option>
                      <option value="Físico">Físico / Condicionament</option>
                      <option value="Combinat">Combinat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Durada calculada:
                    </label>
                    <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-700 flex items-center justify-between">
                      <span>{activeSession.drills.reduce((a, b) => a + (b.duration || 10), 0)} minuts</span>
                      <span className="text-[10px] text-orange-600 font-extrabold uppercase">{activeSession.drills.length} exercicis</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Descripció o Objectiu Principal (opcional):
                  </label>
                  <textarea
                    rows={3}
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="Escriu breument els objectius principals d'aquesta plantilla d'entrenament..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Drill preview inside session to save */}
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Exercicis a incloure ({activeSession.drills.length}):
                  </span>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-48 overflow-y-auto no-scrollbar space-y-1.5">
                    {activeSession.drills.map((sd, i) => {
                      const orig = drills.find(d => d.id === sd.drillId);
                      const isVirtual = sd.drillId.startsWith('virtual-');
                      const title = isVirtual 
                        ? (sd.drillId.includes('hydration') ? 'Descans d’Hidratació' : 'Tirs Lliures de Recuperació')
                        : (orig?.title || 'Exercici');
                      const boardState = orig?.boardState || { paths: [], pins: [] };

                      return (
                        <div key={i} className="text-xs bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {!isVirtual && (
                              <div 
                                onClick={() => orig && setLightboxDrill(orig)}
                                title="Clica per veure la gràfica ampliada"
                                className="w-16 h-12 bg-white border border-slate-200 rounded overflow-hidden shrink-0 cursor-pointer hover:border-orange-500 transition"
                              >
                                <TacticalBoard boardState={boardState} onChange={() => {}} readOnly={true} />
                              </div>
                            )}
                            <span 
                              onClick={() => orig && setLightboxDrill(orig)}
                              className={`font-bold text-slate-800 truncate uppercase text-[11px] ${orig ? 'cursor-pointer hover:text-orange-600' : ''}`}
                            >
                              {i + 1}. {title}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] font-black bg-orange-100 text-orange-850 px-2 py-0.5 rounded shrink-0 ml-2">
                            {sd.duration || 10}′
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-150 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs uppercase rounded-md hover:bg-slate-50"
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-md cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Bookmark size={14} /> Desar a la Biblioteca
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CREATE TEMPLATE FROM SCRATCH */}
          {activeTab === 'create_new' && (
            <form onSubmit={handleConfirmCreateFromScratch} className="space-y-5 max-w-3xl mx-auto bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="border-b border-slate-150 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Plus size={16} className="text-emerald-500" />
                  Crear Nova Plantilla d'Entrenament
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selecciona exercicis de la biblioteca, defineix les durades i guarda una nova plantilla per a futures sessions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nom de la Plantilla:
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Ex: Treball Especialitzat de Tir i Continuïtat"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Categoria:
                  </label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                  >
                    <option value="Atac">Atac</option>
                    <option value="Defensa">Defensa</option>
                    <option value="Transició">Transició</option>
                    <option value="Físico">Físico / Condicionament</option>
                    <option value="Combinat">Combinat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Descripció de la plantilla:
                </label>
                <textarea
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Objectius, intensitat o instruccions generals per als entrenadors..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* DRILL PICKER BUILDER GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* Left side: Available Drills in DB */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">
                      Biblioteca d'Exercicis
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {drills.length} disponibles
                    </span>
                  </div>

                  <input
                    type="text"
                    value={scratchSearch}
                    onChange={(e) => setScratchSearch(e.target.value)}
                    placeholder="Cercar exercici..."
                    className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />

                  <div className="max-h-56 overflow-y-auto no-scrollbar space-y-1.5 pr-1">
                    {/* Add hydration and freethrows buttons */}
                    <button
                      type="button"
                      onClick={() => setSelectedDrillItems(prev => [...prev, { drillId: 'virtual-hydration', duration: 3, notes: 'Hidratació' }])}
                      className="w-full text-left p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-blue-900 uppercase text-[11px]">💧 Descans d’Hidratació</span>
                      <span className="text-[10px] font-mono text-blue-700 font-bold">+ Afegeix (3′)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDrillItems(prev => [...prev, { drillId: 'virtual-freethrows', duration: 4, notes: 'Tirs lliures' }])}
                      className="w-full text-left p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-amber-900 uppercase text-[11px]">🏀 Tirs Lliures de Fatiga</span>
                      <span className="text-[10px] font-mono text-amber-700 font-bold">+ Afegeix (4′)</span>
                    </button>

                    {drills
                      .filter(d => d.title.toLowerCase().includes(scratchSearch.toLowerCase()) || d.category.toLowerCase().includes(scratchSearch.toLowerCase()))
                      .map(d => (
                        <div
                          key={d.id}
                          className="p-1.5 bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-orange-300 rounded-lg transition flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div 
                              onClick={() => setLightboxDrill(d)}
                              title="Clica per veure la gràfica ampliada"
                              className="w-14 h-10 bg-white border border-slate-200 rounded overflow-hidden shrink-0 cursor-pointer hover:border-orange-500 transition"
                            >
                              <TacticalBoard boardState={d.boardState || { paths: [], pins: [] }} onChange={() => {}} readOnly={true} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p 
                                onClick={() => setLightboxDrill(d)}
                                className="font-bold text-slate-800 text-[11px] truncate uppercase cursor-pointer hover:text-orange-600"
                              >
                                {d.title}
                              </p>
                              <p className="text-[9.5px] text-slate-400 font-mono">{d.category} • {d.duration}′</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addDrillToScratch(d)}
                            className="px-2 py-1 bg-orange-100 hover:bg-orange-500 text-orange-900 hover:text-white font-black text-xs rounded transition shrink-0 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Right side: Selected Drills in Template */}
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-1.5">
                      <span className="text-[11px] font-extrabold uppercase text-slate-800 tracking-wider">
                        Seqüència ({selectedDrillItems.length})
                      </span>
                      <span className="text-xs font-mono font-black text-orange-600">
                        Total: {selectedDrillItems.reduce((a, b) => a + b.duration, 0)}′ / 75′
                      </span>
                    </div>

                    {selectedDrillItems.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded">
                        Fes clic als exercicis de l'esquerra per afegir-los a la plantilla.
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto no-scrollbar space-y-1.5">
                        {selectedDrillItems.map((item, idx) => {
                          const orig = drills.find(d => d.id === item.drillId);
                          const isVirtual = item.drillId.startsWith('virtual-');
                          const title = isVirtual 
                            ? (item.drillId.includes('hydration') ? 'Descans d’Hidratació' : 'Tirs Lliures')
                            : (orig?.title || 'Exercici');
                          const boardState = orig?.boardState || { paths: [], pins: [] };

                          return (
                            <div key={idx} className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {!isVirtual && (
                                  <div 
                                    onClick={() => orig && setLightboxDrill(orig)}
                                    title="Clica per ampliar el dibuix tàctic"
                                    className="w-14 h-10 bg-white border border-slate-200 rounded overflow-hidden shrink-0 cursor-pointer hover:border-orange-500 transition"
                                  >
                                    <TacticalBoard boardState={boardState} onChange={() => {}} readOnly={true} />
                                  </div>
                                )}
                                <p 
                                  onClick={() => orig && setLightboxDrill(orig)}
                                  className={`font-bold text-slate-800 text-[11px] truncate uppercase ${orig ? 'cursor-pointer hover:text-orange-600' : ''}`}
                                >
                                  {idx + 1}. {title}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  value={item.duration}
                                  onChange={(e) => updateScratchDuration(idx, parseInt(e.target.value, 10) || 5)}
                                  className="w-12 px-1 py-0.5 border border-slate-300 rounded font-mono font-bold text-xs text-center text-slate-800"
                                />
                                <span className="text-[10px] text-slate-400 font-mono">′</span>
                                <button
                                  type="button"
                                  onClick={() => removeDrillFromScratch(idx)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={selectedDrillItems.length === 0 || !createName.trim()}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-md cursor-pointer transition shadow-xs flex items-center justify-center gap-1 mt-2"
                  >
                    <Check size={14} /> Crear i Desar Plantilla Nova
                  </button>
                </div>

              </div>
            </form>
          )}

        </div>

      </div>

      {/* ENLARGED DIAGRAM LIGHTBOX MODAL */}
      {lightboxDrill && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-orange-500 text-slate-950 font-mono">
                  {lightboxDrill.category}
                </span>
                <h3 className="font-extrabold uppercase text-sm tracking-tight text-white truncate max-w-md">
                  {lightboxDrill.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxDrill(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 bg-slate-50">
              {/* Tactical court diagram */}
              <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-lg p-2 shadow-inner overflow-hidden">
                <TacticalBoard boardState={lightboxDrill.boardState || { paths: [], pins: [] }} onChange={() => {}} readOnly={true} />
              </div>

              {/* Details & description */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                {lightboxDrill.description && (
                  <div>
                    <h4 className="font-extrabold uppercase text-slate-700 text-[10px] tracking-wider mb-1">
                      Descripció Tàctica:
                    </h4>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      {lightboxDrill.description}
                    </p>
                  </div>
                )}

                {lightboxDrill.objectives && lightboxDrill.objectives.length > 0 && (
                  <div>
                    <h4 className="font-extrabold uppercase text-slate-700 text-[10px] tracking-wider mb-1">
                      Objectius d'Entrenament:
                    </h4>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 font-medium">
                      {lightboxDrill.objectives.map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setLightboxDrill(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded cursor-pointer hover:bg-slate-800"
              >
                Tancar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM TEMPLATE DELETION DIALOG */}
      {deleteConfirmTemplate && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-slate-900">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">Confirmar eliminació de plantilla</h3>
                <p className="text-xs text-slate-500 font-medium">Acció irreversible de la biblioteca</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Estàs segur que vols eliminar la plantilla <strong className="text-slate-900">"{deleteConfirmTemplate.name}"</strong> de la biblioteca? Aquesta acció no es pot desfer.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmTemplate(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-md transition cursor-pointer"
              >
                Cancel·lar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTemplate(deleteConfirmTemplate.id);
                  if (triggerToast) triggerToast(`🗑️ S'ha eliminat la plantilla "${deleteConfirmTemplate.name}"`);
                  setDeleteConfirmTemplate(null);
                }}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-md transition cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Trash2 size={13} /> Sí, Eliminar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
