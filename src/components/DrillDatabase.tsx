import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Filter, 
  Clock, 
  Users, 
  Wrench, 
  CheckCircle,
  Copy,
  BookOpen,
  Star
} from 'lucide-react';
import { Drill } from '../types';
import { getDrillColorProfile } from '../lib/drillColors';
import TacticalBoard from './TacticalBoard';
import DrillManualBooklet from './DrillManualBooklet';

// Pre-populated High-Level Drills for Junior Nivel A Catalan Federation
export const PRE_POPULATED_DRILLS: Drill[] = [
  {
    id: 'drill-rueda-11',
    title: "Roda d'11 FCBQ de Contraatac Continuat",
    category: 'Transició',
    concept: 'Contraatac Ràpid',
    duration: 12,
    objectives: [
      "Desenvolupament del primer passe de sortida (outlet pass) en menys de 2 segons.",
      "Coordinació espacial de les tres línies de carril de contraatac a màxima velocitat.",
      "Entrenar la finalització en velocitat sota pressió i el balanç defensiu dinàmic."
    ],
    description: "Exercici insígnia de l'Escola d'Entrenadors del Bàsquet Català per a escalfaments competitius. Es col·loquen tres files a línia de fons (un passador a l'eix i dos corredors a les cantonades). El jugador amb pilota llança voluntàriament contra el taulell, agafa el rebot ràpid d'embranzida, gira l'eix de malucs per obrir el passe ràpid a la banda i inicia una trena de pista sencera a 3 passades sense botar fins a resoldre en entrada.",
    setupInstructions: "Dividir el grup en 3 files darrere de la línia de fons. El d'enmig comença amb pilota llançant al taulell. Els dos dels costats corren pegats a la banda preparant-se per a la trena de transició.",
    playersNeeded: 10,
    materials: ['Pilotes de bàsquet (S7)', 'Cons de demarcació'],
    boardState: {
      courtType: 'full',
      paths: [
        { id: 'p1', points: [{ x: 50, y: 88 }, { x: 50, y: 55 }, { x: 20, y: 75 }], color: '#0ea5e9', type: 'dashed' }
      ],
      pins: [
        { id: 'att1', label: '1', x: 50, y: 90, type: 'attacker' },
        { id: 'att2', label: '2', x: 20, y: 92, type: 'attacker' },
        { id: 'att3', label: '3', x: 80, y: 92, type: 'attacker' },
        { id: 'cone1', label: '▲', x: 20, y: 50, type: 'cone' },
        { id: 'cone2', label: '▲', x: 80, y: 50, type: 'cone' }
      ]
    }
  },
  {
    id: 'drill-pnr-def',
    title: 'Defensa de Bloqueig Directe (Pick & Roll) Central Drop',
    category: 'Defensa',
    concept: 'Pick & Roll',
    duration: 15,
    objectives: [
      "Negar el pas central al base contrari forçant-lo cap a la banda per reduir angle de decisió.",
      "Treballar la comunicació verbal ràpida del defensor de l'home gran ('Bloqueig!', 'Drop!').",
      "Assegurar l'ajuda de fons (costat feble) en la recuperació de la continuació (Roll)."
    ],
    description: "Syllabus de Nivell A de la Federació Catalana. Treball defensiu de 3x3 de Pick & Roll central. Apliquem la defensa de contenció tipus 'Drop' mentre el defensor del base lluita per sobre de la pantalla atacant per darrere o recuperant l'eix d'ajudes.",
    setupInstructions: "Situar un 3 contra 3 a mitja pista. Pilota en posició de base central. Ajustar el cos de fons defensant especialment les ajudes de segon esforç des de cantonades.",
    playersNeeded: 6,
    materials: ['Pilotes de joc', 'Petos de contrast'],
    boardState: {
      paths: [
        { id: 'path-block', points: [{ x: 65, y: 55 }, { x: 50, y: 65 }], color: '#000000', type: 'solid' },
        { id: 'path-def', points: [{ x: 50, y: 72 }, { x: 40, y: 78 }], color: '#000000', type: 'dashed' }
      ],
      pins: [
        { id: 'att1', label: '1', x: 50, y: 65, type: 'attacker' },
        { id: 'att2', label: '5', x: 65, y: 55, type: 'attacker' },
        { id: 'att3', label: '2', x: 25, y: 75, type: 'attacker' },
        { id: 'def1', label: '1', x: 50, y: 72, type: 'defender' },
        { id: 'def2', label: '5', x: 61, y: 59, type: 'defender' },
        { id: 'def3', label: '2', x: 28, y: 72, type: 'defender' },
        { id: 'ball', label: '🏀', x: 48, y: 65, type: 'ball' }
      ]
    }
  },
  {
    id: 'drill-press-break',
    title: 'Sortida de Pressió 1-3-1 amb Connexió Vertical',
    category: 'Transició',
    concept: 'Sortida de Pressió',
    duration: 15,
    objectives: [
      "Batre la trapa de cantonada a línia de fons sense esgotar el bot.",
      "Fixar la segona línia de la zona de pressió atacant l'eix central amb la finta de cos.",
      "Trobar el jugador 'flash' al cercle central per generar superioritat de 3v2."
    ],
    description: "Estructura de sortida de pressió adaptada per a equips Júnior A. Davant defenses agressives a tota pista, establim 3 línies de passada curtes a camp propi per rebre en moviment i girar el joc al costat feble.",
    setupInstructions: "5v5 a pista sencera. Equip defensor col·locat en pressió zonal 1-2-1-1.",
    playersNeeded: 10,
    materials: ['Pilota de joc'],
    boardState: {
      courtType: 'full',
      paths: [
        { id: 'p1', points: [{ x: 50, y: 92 }, { x: 20, y: 80 }], color: '#0ea5e9', type: 'dashed' }
      ],
      pins: [
        { id: 'a1', label: '1', x: 50, y: 95, type: 'attacker' },
        { id: 'a2', label: '2', x: 20, y: 80, type: 'attacker' },
        { id: 'a3', label: '3', x: 80, y: 80, type: 'attacker' },
        { id: 'a4', label: '4', x: 50, y: 60, type: 'attacker' },
        { id: 'a5', label: '5', x: 50, y: 30, type: 'attacker' }
      ]
    }
  }
];

interface DrillDatabaseProps {
  drills: Drill[];
  onAddDrill: (drill: Drill) => void;
  onEditDrill: (drill: Drill) => void;
  onDeleteDrill: (drillId: string) => void;
  triggerToast?: (msg: string) => void;
  favoriteDrillIds?: string[];
  onToggleFavorite?: (drillId: string) => void;
  onOpenCreator?: (drillToEdit?: Drill) => void;
}

export default function DrillDatabase({ 
  drills, 
  onAddDrill, 
  onDeleteDrill, 
  triggerToast,
  favoriteDrillIds = [],
  onToggleFavorite,
  onOpenCreator
}: DrillDatabaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tots');
  const [drillToDelete, setDrillToDelete] = useState<Drill | null>(null);
  const [selectedDrillForOverlay, setSelectedDrillForOverlay] = useState<Drill | null>(null);

  // Dynamically obtain all unique categories from current drills state
  const uniqueCategoriesInDrills = useMemo(() => {
    const cats = new Set<string>(['Atac', 'Defensa', 'Transició', 'Escalfament']);
    drills.forEach(d => {
      if (d.category) {
        cats.add(d.category);
      }
    });
    return Array.from(cats);
  }, [drills]);

  const handleCloneDrill = (drill: Drill) => {
    try {
      const clonedDrill: Drill = {
        ...JSON.parse(JSON.stringify(drill)),
        id: `drill-cloned-${Date.now()}`,
        title: `${drill.title} (Còpia)`
      };
      onAddDrill(clonedDrill);
      if (triggerToast) {
        triggerToast(`S'ha clonat l'exercici "${drill.title}" de la biblioteca!`);
      }
    } catch (e) {
      console.error(e);
      if (triggerToast) triggerToast("No s'ha pogut duplicar l'exercici.");
    }
  };

  // Filters
  const filteredDrills = drills.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'Favorits') {
      return matchesSearch && favoriteDrillIds.includes(d.id);
    }
    if (selectedCategory !== 'Tots') {
      return matchesSearch && d.category === selectedCategory;
    }
    return matchesSearch; // 'Tots'
  });

  return (
    <div id="drill-database-view" className="space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER BANNER & ACTION BAR */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 md:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-orange-500" size={22} />
            <h2 className="text-base md:text-xl font-black text-slate-900 uppercase tracking-tight">
              BIBLIOTECA D'EXERCICIS TÀCTICS
            </h2>
            <span className="bg-orange-100 text-orange-850 text-xs font-black px-2.5 py-0.5 rounded-full font-mono">
              {drills.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Catàleg complet d'exercicis per organitzar i seleccionar als teus entrenaments.
          </p>
        </div>

        {onOpenCreator && (
          <button
            id="btn-open-drill-creator"
            type="button"
            onClick={() => onOpenCreator()}
            className="w-full md:w-auto py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black rounded-sm text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Plus size={16} className="text-orange-400" />
            <span>+ Crear Nou Exercici</span>
          </button>
        )}
      </div>

      {/* FILTERING & SEARCH TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={14} />
          </span>
          <input
            id="input-drill-search"
            type="text"
            placeholder="Cerca exercicis en català..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-orange-500 bg-slate-50 font-medium"
          />
        </div>

        {/* Category Chips Horizontal bar */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto select-none no-scrollbar">
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mr-1 flex items-center gap-1">
            <Filter size={11} />
            Filtrar:
          </span>
          {['Tots', 'Favorits', ...uniqueCategoriesInDrills].map((cat) => (
            <button
              id={`chip-${cat}`}
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              type="button"
              className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat === 'Tots' ? 'TOTS' : cat === 'Favorits' ? '⭐ FAVORITS' : cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-widest pl-1">
        Mostrant {filteredDrills.length} de {drills.length} exercicis
      </div>

      {/* EXERCISES GRID */}
      <div id="drills-grid-container" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDrills.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white border border-slate-200 rounded-sm shadow-xs">
            <BookOpen size={48} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-800 font-bold uppercase text-sm">No s’han trobat exercicis</p>
            <p className="text-slate-500 text-xs mt-1">Crea un exercici nou fent clic a "+ Crear Nou Exercici".</p>
          </div>
        ) : (
          filteredDrills.map((drill) => {
            const colors = getDrillColorProfile(drill);
            return (
              <div
                id={`drill-card-${drill.id}`}
                key={drill.id}
                className={`bg-white border rounded-sm transition p-4 flex flex-col gap-3 group shadow-xs hover:shadow-md ${colors.cardClass}`}
              >
                {/* Header row: title, category badge, actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider ${colors.badgeClass}`}>
                        {drill.category}
                      </span>
                      {drill.concept && (
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${colors.conceptClass}`}>
                          {drill.concept}
                        </span>
                      )}
                      {drill.isOver15 && (
                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-150 flex items-center gap-0.5 select-none font-mono" title="Aquest exercici només és per a majors de 15 anys">
                          🚫 +15 ANYS
                        </span>
                      )}
                    </div>
                    <h3 
                      onClick={() => setSelectedDrillForOverlay(drill)}
                      title="Clica per veure el quadern de pista"
                      className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 cursor-pointer transition-colors"
                    >
                      {drill.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 select-none">
                    <button
                      id={`btn-fav-drill-${drill.id}`}
                      onClick={() => onToggleFavorite && onToggleFavorite(drill.id)}
                      title={favoriteDrillIds.includes(drill.id) ? "Treure de preferits" : "Afegir a preferits"}
                      className={`p-1.5 rounded-sm transition cursor-pointer border ${
                        favoriteDrillIds.includes(drill.id)
                          ? 'bg-amber-50 text-amber-500 border-amber-200'
                          : 'hover:bg-amber-50 text-slate-400 hover:text-amber-500 border-transparent hover:border-amber-200'
                      }`}
                    >
                      <Star size={14} fill={favoriteDrillIds.includes(drill.id) ? "currentColor" : "none"} />
                    </button>
                    <button
                      id={`btn-clone-drill-${drill.id}`}
                      onClick={() => handleCloneDrill(drill)}
                      title="Duplicar / Clonar exercici"
                      className="p-1.5 rounded-sm hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition cursor-pointer border border-transparent hover:border-orange-200"
                    >
                      <Copy size={14} />
                    </button>
                    {onOpenCreator && (
                      <button
                        id={`btn-edit-drill-${drill.id}`}
                        onClick={() => onOpenCreator(drill)}
                        title="Obrir al Creador d'Exercicis"
                        className="p-1.5 rounded-sm hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition cursor-pointer border border-transparent hover:border-slate-300"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    <button
                      id={`btn-delete-drill-${drill.id}`}
                      onClick={() => setDrillToDelete(drill)}
                      title="Esborrar de la biblioteca"
                      className="p-1.5 rounded-sm hover:bg-rose-50 text-slate-400 hover:text-red-700 transition cursor-pointer border border-transparent hover:border-rose-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Tactical board graphic preview */}
                <div 
                  onClick={() => setSelectedDrillForOverlay(drill)}
                  className="w-full bg-white border border-slate-200 rounded shadow-xs overflow-hidden p-1 relative cursor-pointer group-hover:border-orange-300 transition"
                >
                  <TacticalBoard boardState={drill.boardState || { paths: [], pins: [] }} onChange={() => {}} readOnly={true} />
                  {drill.boardStates && drill.boardStates.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-slate-900/90 text-[9px] text-white font-extrabold uppercase px-2 py-0.5 rounded tracking-widest font-mono shadow-xs">
                      {drill.boardStates.length} Grafismes
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                  {drill.description}
                </p>

                {/* Footer metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      {drill.duration}′
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-slate-400" />
                      {drill.playersNeeded || 'X'} Jugadors
                    </span>
                  </div>
                  {drill.materials.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-400 font-mono truncate max-w-[150px]">
                      <Wrench size={11} />
                      {drill.materials.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>

                {drill.objectives && drill.objectives.length > 0 && (
                  <div className="border-t border-slate-100 pt-2 mt-1">
                    <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block mb-1">OBJECTIUS DE PISTA:</span>
                    <ul className="space-y-1 text-xs text-slate-600 font-medium">
                      {drill.objectives.slice(0, 2).map((obj, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5 font-bold" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DETALL D'EXERCICI OVERLAY BOOKLET */}
      {selectedDrillForOverlay && (
        <DrillManualBooklet 
          drill={selectedDrillForOverlay} 
          onClose={() => setSelectedDrillForOverlay(null)} 
        />
      )}

      {/* CONFIRMATION DIALOG FOR DRILL DELETION */}
      {drillToDelete && (
        <div className="fixed inset-0 bg-slate-950/75 flex items-center justify-center p-4 z-50 backdrop-blur-xs select-none">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Trash2 size={24} />
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Esborrar Exercici?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Estàs segur que vols eliminar permanentment l'exercici <strong className="text-slate-800">"{drillToDelete.title}"</strong> de la biblioteca de l'equip?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onDeleteDrill(drillToDelete.id);
                  setDrillToDelete(null);
                  if (triggerToast) {
                    triggerToast(`🗑️ S'ha eliminat "${drillToDelete.title}" de la biblioteca.`);
                  }
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Sí, esborrar
              </button>
              <button
                type="button"
                onClick={() => setDrillToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Cancel·lar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
