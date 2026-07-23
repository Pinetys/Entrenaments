import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  BookOpen, 
  Sparkles, 
  Undo2, 
  CheckCircle2, 
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Drill, DrillCategory, BoardState } from '../types';
import TacticalBoard from './TacticalBoard';

interface DrillCreatorProps {
  editingDrill?: Drill | null;
  initialDrill?: Drill | null;
  onSaveDrill: (drill: Drill) => void;
  onCancel?: () => void;
  onNavigateToLibrary?: () => void;
  triggerToast?: (msg: string) => void;
  uniqueCategories?: string[];
}

export default function DrillCreator({
  editingDrill,
  initialDrill,
  onSaveDrill,
  onCancel,
  onNavigateToLibrary,
  triggerToast,
  uniqueCategories = ['Atac', 'Defensa', 'Transició', 'Escalfament']
}: DrillCreatorProps) {
  const activeInitialDrill = initialDrill || editingDrill;
  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Atac');
  const [concept, setConcept] = useState('');
  const [duration, setDuration] = useState(15);
  const [objectivesString, setObjectivesString] = useState('');
  const [description, setDescription] = useState('');
  const [setupInstructions, setSetupInstructions] = useState('');
  const [playersNeeded, setPlayersNeeded] = useState(8);
  const [materialsString, setMaterialsString] = useState('');
  const [isOver15, setIsOver15] = useState(false);

  // Tactical Board state
  const [boardStates, setBoardStates] = useState<BoardState[]>([{ paths: [], pins: [], courtType: 'half' }]);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [showDeletePhaseConfirm, setShowDeletePhaseConfirm] = useState<boolean>(false);

  // Custom Category State
  const [isCreatingCustomCategory, setIsCreatingCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Populate when editingDrill/initialDrill changes
  useEffect(() => {
    if (activeInitialDrill) {
      setTitle(activeInitialDrill.title || '');
      setCategory(activeInitialDrill.category || 'Atac');
      setConcept(activeInitialDrill.concept || '');
      setDuration(activeInitialDrill.duration || 15);
      setObjectivesString(activeInitialDrill.objectives ? activeInitialDrill.objectives.join('\n') : '');
      setDescription(activeInitialDrill.description || '');
      setSetupInstructions(activeInitialDrill.setupInstructions || '');
      setPlayersNeeded(activeInitialDrill.playersNeeded || 8);
      setMaterialsString(activeInitialDrill.materials ? activeInitialDrill.materials.join(', ') : '');
      setIsOver15(!!activeInitialDrill.isOver15);

      const initialBoardStates = activeInitialDrill.boardStates && activeInitialDrill.boardStates.length > 0
        ? activeInitialDrill.boardStates
        : [activeInitialDrill.boardState || { paths: [], pins: [], courtType: 'half' }];
      setBoardStates(initialBoardStates);
      setActivePhaseIndex(0);

      const defaultCats = ['Atac', 'Defensa', 'Transició', 'Escalfament'];
      if (activeInitialDrill.category && !defaultCats.includes(activeInitialDrill.category)) {
        setIsCreatingCustomCategory(true);
        setCustomCategoryName(activeInitialDrill.category);
      } else {
        setIsCreatingCustomCategory(false);
        setCustomCategoryName('');
      }
    } else {
      resetForm();
    }
  }, [activeInitialDrill]);

  const resetForm = () => {
    setTitle('');
    setCategory('Atac');
    setConcept('');
    setDuration(15);
    setObjectivesString('');
    setDescription('');
    setSetupInstructions('');
    setPlayersNeeded(8);
    setMaterialsString('');
    setIsOver15(false);
    setBoardStates([{ paths: [], pins: [], courtType: 'half' }]);
    setActivePhaseIndex(0);
    setIsCreatingCustomCategory(false);
    setCustomCategoryName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Si us plau, introdueix un títol per a l\'exercici');
      return;
    }

    const cleanObjectives = objectivesString
      .split('\n')
      .map(o => o.trim())
      .filter(o => o.length > 0);

    const cleanMaterials = materialsString
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    const drillData: Drill = {
      id: editingDrill?.id || `drill-${Date.now()}`,
      title: title.trim(),
      category: (category.trim() || 'Atac') as DrillCategory,
      concept: concept.trim() || undefined,
      duration: Number(duration),
      objectives: cleanObjectives.length > 0 ? cleanObjectives : ['Millorar fonaments de bàsquet'],
      description: description.trim(),
      setupInstructions: setupInstructions.trim(),
      playersNeeded: Number(playersNeeded),
      materials: cleanMaterials,
      boardState: boardStates[0] || { paths: [], pins: [] },
      boardStates: boardStates,
      isCustom: true,
      isOver15: isOver15
    };

    onSaveDrill(drillData);
    if (triggerToast) {
      triggerToast(editingDrill ? `S'ha actualitzat l'exercici "${drillData.title}"` : `S'ha creat l'exercici "${drillData.title}" a la biblioteca`);
    }
    resetForm();
    if (onNavigateToLibrary) {
      onNavigateToLibrary();
    }
  };

  return (
    <div id="drill-creator-view" className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 md:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onNavigateToLibrary && (
            <button
              type="button"
              onClick={onNavigateToLibrary}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-sm text-slate-700 transition cursor-pointer"
              title="Tornar a la Biblioteca d'Exercicis"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="text-orange-500" size={20} />
              <h2 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight">
                {editingDrill ? 'EDITAR EXERCICI TÀCTIC' : 'CREADOR D\'EXERCICIS'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Dissenya el croquis de pista, fases d'execució i especificacions tàctiques.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editingDrill && onCancel && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                if (onCancel) onCancel();
              }}
              className="text-xs px-3 py-2 rounded-sm bg-slate-200 hover:bg-slate-300 text-slate-800 transition font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Undo2 size={14} /> Cancel·lar Edició
            </button>
          )}
          {onNavigateToLibrary && (
            <button
              type="button"
              onClick={onNavigateToLibrary}
              className="text-xs px-3.5 py-2 rounded-sm border border-slate-300 hover:bg-slate-100 text-slate-700 transition font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen size={14} /> Veure Biblioteca
            </button>
          )}
        </div>
      </div>

      {/* Main Creator Form Workspace */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-sm p-4 md:p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Tactical Board Canvas (7 columns) */}
          <div className="lg:col-span-7 space-y-4 bg-slate-50/60 p-4 border border-slate-200 rounded-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>CROQUIS TÀCTIC I MULTIGRAFISME DE PISTA</span>
              </label>
              <span className="text-[10px] text-orange-600 bg-orange-50 font-bold px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                <Sparkles size={12} className="text-orange-500 animate-pulse" /> Dibuix multi-fase disponible
              </span>
            </div>

            {/* Multi-phase Grafismes Selector */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 border border-slate-200 rounded-sm">
              {boardStates.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActivePhaseIndex(idx);
                    setShowDeletePhaseConfirm(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-sm cursor-pointer transition ${
                    activePhaseIndex === idx
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Grafisme {idx + 1}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  const currentBS = boardStates[activePhaseIndex] || { paths: [], pins: [], courtType: 'half' };
                  const clonedBS: BoardState = {
                    paths: [],
                    pins: JSON.parse(JSON.stringify(currentBS.pins || [])),
                    courtType: currentBS.courtType || 'half'
                  };
                  setBoardStates([...boardStates, clonedBS]);
                  setActivePhaseIndex(boardStates.length);
                  setShowDeletePhaseConfirm(false);
                  if (triggerToast) triggerToast(`Grafisme ${boardStates.length + 1} afegit amb èxit.`);
                }}
                className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-sm text-xs font-black uppercase tracking-wider ml-auto cursor-pointer"
              >
                + Afegir Grafisme
              </button>

              {boardStates.length > 1 && (
                <div className="flex items-center gap-1">
                  {!showDeletePhaseConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeletePhaseConfirm(true)}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      ✘ Eliminar
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-rose-50 p-1 border border-rose-200 rounded-sm">
                      <span className="text-[10px] text-rose-700 font-bold px-1 uppercase">Eliminar?</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = boardStates.filter((_, i) => i !== activePhaseIndex);
                          setBoardStates(updated);
                          setActivePhaseIndex(Math.max(0, activePhaseIndex - 1));
                          setShowDeletePhaseConfirm(false);
                          if (triggerToast) triggerToast('S\'ha eliminat el grafisme.');
                        }}
                        className="px-2 py-0.5 bg-rose-600 text-white rounded-sm text-xs font-black uppercase cursor-pointer"
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeletePhaseConfirm(false)}
                        className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-sm text-xs font-black uppercase cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tactical Board Canvas */}
            <div className="bg-white p-2 border border-slate-200 rounded-sm shadow-xs">
              <TacticalBoard
                boardState={boardStates[activePhaseIndex] || { paths: [], pins: [], courtType: 'half' }}
                onChange={(newBS) => {
                  const updated = [...boardStates];
                  updated[activePhaseIndex] = newBS;
                  setBoardStates(updated);
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 italic leading-snug">
              Pots afegir fletxes de passades, botes, tallades i el símbol d'entrega de mà a mà (Hand-off T).
            </p>
          </div>

          {/* RIGHT: Written Metadata Inputs (5 columns) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Nom de l'Exercici *
              </label>
              <input
                id="creator-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Contraatac continu 3 contra 2 amb retorn"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Concepte Tàctic</span>
                <span className="text-[10px] text-slate-400 font-normal">Ex: Pick & Roll, Spacing...</span>
              </label>
              <input
                id="creator-concept"
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ex: Superioritat 3v2"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <select
                  id="creator-category"
                  value={isCreatingCustomCategory ? "CREATE_NEW" : category}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "CREATE_NEW") {
                      setIsCreatingCustomCategory(true);
                      setCategory('');
                    } else {
                      setIsCreatingCustomCategory(false);
                      setCategory(val);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white font-bold text-slate-800"
                >
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="CREATE_NEW">➕ Nova categoria...</option>
                </select>
                {isCreatingCustomCategory && (
                  <input
                    id="creator-custom-category"
                    type="text"
                    placeholder="Nova categoria"
                    value={customCategoryName}
                    onChange={(e) => {
                      setCustomCategoryName(e.target.value);
                      setCategory(e.target.value);
                    }}
                    className="w-full mt-1.5 px-3 py-1.5 border border-slate-300 rounded-sm text-xs font-bold text-orange-600 bg-orange-50/60 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Duració (Mins)
                </label>
                <input
                  id="creator-duration"
                  type="number"
                  min="1"
                  max="90"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Jugadors Neces.
                </label>
                <input
                  id="creator-players"
                  type="number"
                  min="1"
                  value={playersNeeded}
                  onChange={(e) => setPlayersNeeded(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Materials
                </label>
                <input
                  id="creator-materials"
                  type="text"
                  value={materialsString}
                  onChange={(e) => setMaterialsString(e.target.value)}
                  placeholder="Pilotes, Cons, Petos"
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                />
              </div>
            </div>

            {/* Over 15 Age Restriction */}
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-150 p-2.5 rounded-sm">
              <input
                id="creator-over15"
                type="checkbox"
                checked={isOver15}
                onChange={(e) => setIsOver15(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer accent-rose-600"
              />
              <label htmlFor="creator-over15" className="text-xs font-extrabold text-rose-800 cursor-pointer select-none">
                🚫 Reservat per a majors de 15 anys (+15)
              </label>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Objectius de l'Exercici (Un per línia)
              </label>
              <textarea
                id="creator-objectives"
                rows={2}
                value={objectivesString}
                onChange={(e) => setObjectivesString(e.target.value)}
                placeholder="Ex: Treballar contraatac en velocitat&#13;Coordinar les linies de passada"
                className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Descripció i Reglament
              </label>
              <textarea
                id="creator-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica com s'inicia l'exercici, la rotació de jugadors i normes tàctiques..."
                className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium text-slate-800 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Anotacions Tàctiques de Pista
              </label>
              <input
                id="creator-setup"
                type="text"
                value={setupInstructions}
                onChange={(e) => setSetupInstructions(e.target.value)}
                placeholder="Ex: Defensors amb mans preparades en l'eix"
                className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <button
              id="btn-save-creator-drill"
              type="submit"
              className="w-full py-3 px-4 rounded-sm text-xs font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer pt-3"
            >
              <CheckCircle2 size={16} className="text-orange-400" />
              <span>{editingDrill ? 'Desar Canvis de l\'Exercici' : 'Guardar a la Biblioteca'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
