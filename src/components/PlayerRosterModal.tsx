import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Users, 
  Trash2, 
  Edit3, 
  Save, 
  Search, 
  Plus, 
  Star, 
  BarChart2, 
  Check, 
  Copy, 
  ChevronRight,
  ShieldCheck,
  Flame,
  Settings,
  RotateCcw,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { Player } from '../types';

interface PlayerRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAddPlayer: (newPlayer: Omit<Player, 'id'>) => void;
  onUpdatePlayer: (id: string, updated: Partial<Player>) => void;
  onDeletePlayer: (id: string) => void;
  triggerToast?: (msg: string) => void;
}

export interface BaremoItem {
  id: string;
  label: string;
}

export const DEFAULT_BAREMOS: BaremoItem[] = [
  { id: 'shooting', label: '🎯 Tir i Anotació' },
  { id: 'defense', label: '🛡️ Defensa i Consciència' },
  { id: 'tacticalIQ', label: '🧠 IQ Tàctic i Lectura' },
  { id: 'physical', label: '⚡ Físic i Intensitat' },
  { id: 'leadership', label: '🔥 Lideratge i Actitud' },
  { id: 'technique', label: '🏀 Tècnica Individual' },
  { id: 'teamwork', label: '🤝 Joc Col·lectiu' }
];

const POSITIONS = ['Base', 'Escorta', 'Ala', 'Ala-Pivot', 'Pivot'] as const;
const ROLES = ['Quintet Inicial', 'Rotació Principal', 'Especialista', 'Júnior Desenvolupament'] as const;

export default function PlayerRosterModal({
  isOpen,
  onClose,
  players,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  triggerToast
}: PlayerRosterModalProps) {
  if (!isOpen) return null;

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(players[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPos, setFilterPos] = useState<string>('ALL');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Baremo configuration state
  const [baremos, setBaremos] = useState<BaremoItem[]>(() => {
    try {
      const saved = localStorage.getItem('coachboard_baremos_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading baremos config:', e);
    }
    return DEFAULT_BAREMOS;
  });

  const [showBaremoModal, setShowBaremoModal] = useState(false);
  const [newBaremoLabel, setNewBaremoLabel] = useState('');

  // Form state for creating / editing
  const [formData, setFormData] = useState<Partial<Player>>({
    number: 10,
    name: '',
    position: 'Base',
    role: 'Rotació Principal',
    height: '1.85 m',
    averageMinutes: 0,
    ratings: {}, // NO prefilled percentages at start!
    strengths: [],
    areasToImprove: [],
    notes: '',
    statsSummary: { ppg: 0, rpg: 0, apg: 0, threePointPct: 0 }
  });

  const [newStrength, setNewStrength] = useState('');
  const [newImprovement, setNewImprovement] = useState('');

  const saveBaremosList = (newList: BaremoItem[]) => {
    setBaremos(newList);
    try {
      localStorage.setItem('coachboard_baremos_config', JSON.stringify(newList));
    } catch (e) {
      console.error('Error saving baremos config:', e);
    }
  };

  const handleAddBaremo = () => {
    if (!newBaremoLabel.trim()) return;
    const newId = 'baremo_' + Date.now();
    const updated = [...baremos, { id: newId, label: newBaremoLabel.trim() }];
    saveBaremosList(updated);
    setNewBaremoLabel('');
    if (triggerToast) triggerToast(`✅ Barems d'avaluació afegit: "${newBaremoLabel.trim()}"`);
  };

  const handleRemoveBaremo = (id: string) => {
    if (baremos.length <= 1) {
      alert('Has de tenir almenys un barem d\'avaluació.');
      return;
    }
    const updated = baremos.filter(b => b.id !== id);
    saveBaremosList(updated);
    if (triggerToast) triggerToast(`🗑️ Barem eliminat`);
  };

  const handleResetBaremos = () => {
    if (window.confirm('Vols restablir els barems d\'avaluació als valors per defecte?')) {
      saveBaremosList(DEFAULT_BAREMOS);
      if (triggerToast) triggerToast(`🔄 Barems restablerts per defecte`);
    }
  };

  const calculatePlayerMedia = (ratings?: Record<string, number>) => {
    if (!ratings) return { media: null, percent: null, ratedCount: 0, totalCount: baremos.length };
    let sum = 0;
    let count = 0;
    baremos.forEach(b => {
      const val = ratings[b.id];
      if (typeof val === 'number' && val > 0) {
        sum += val;
        count++;
      }
    });
    if (count === 0) return { media: null, percent: null, ratedCount: 0, totalCount: baremos.length };
    const media = Number((sum / count).toFixed(1));
    const percent = Math.round(media * 10);
    return { media, percent, ratedCount: count, totalCount: baremos.length };
  };

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.number.toString().includes(searchTerm);
    const matchesPos = filterPos === 'ALL' || p.position === filterPos;
    return matchesSearch && matchesPos;
  });

  const activePlayer = players.find(p => p.id === selectedPlayerId) || filteredPlayers[0] || null;

  const handleStartAdd = () => {
    setIsAdding(true);
    setIsEditing(false);
    setFormData({
      number: players.length > 0 ? Math.max(...players.map(p => p.number)) + 1 : 4,
      name: '',
      position: 'Base',
      role: 'Rotació Principal',
      height: '1.85 m',
      averageMinutes: 0,
      ratings: {}, // Start with ZERO / NO percentages!
      strengths: [],
      areasToImprove: [],
      notes: '',
      statsSummary: { ppg: 0, rpg: 0, apg: 0, threePointPct: 0 }
    });
  };

  const handleStartEdit = (player: Player) => {
    setIsEditing(true);
    setIsAdding(false);
    setFormData({
      number: player.number,
      name: player.name,
      position: player.position,
      role: player.role || 'Rotació Principal',
      height: player.height || '1.85 m',
      averageMinutes: player.averageMinutes || 0,
      ratings: player.ratings ? { ...player.ratings } : {},
      strengths: [...(player.strengths || [])],
      areasToImprove: [...(player.areasToImprove || [])],
      notes: player.notes || '',
      statsSummary: player.statsSummary || { ppg: 0, rpg: 0, apg: 0, threePointPct: 0 }
    });
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('El nom del jugador és obligatori.');
      return;
    }

    if (isAdding) {
      onAddPlayer({
        number: Number(formData.number) || 4,
        name: formData.name.trim(),
        position: formData.position as any || 'Base',
        role: formData.role as any || 'Rotació Principal',
        height: formData.height || '1.85 m',
        averageMinutes: Number(formData.averageMinutes) || 0,
        ratings: formData.ratings || {},
        strengths: formData.strengths || [],
        areasToImprove: formData.areasToImprove || [],
        notes: formData.notes || '',
        statsSummary: formData.statsSummary || { ppg: 0, rpg: 0, apg: 0, threePointPct: 0 },
        updatedAt: new Date().toISOString()
      });
      setIsAdding(false);
      if (triggerToast) triggerToast(`🏀 Jugador #${formData.number} ${formData.name} creat amb èxit!`);
    } else if (isEditing && selectedPlayerId) {
      onUpdatePlayer(selectedPlayerId, {
        number: Number(formData.number),
        name: formData.name.trim(),
        position: formData.position as any,
        role: formData.role as any,
        height: formData.height,
        averageMinutes: Number(formData.averageMinutes),
        ratings: formData.ratings,
        strengths: formData.strengths,
        areasToImprove: formData.areasToImprove,
        notes: formData.notes,
        statsSummary: formData.statsSummary,
        updatedAt: new Date().toISOString()
      });
      setIsEditing(false);
      if (triggerToast) triggerToast(`✅ Fitxa del jugador #${formData.number} actualitzada`);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Estàs segur que vols eliminar la fitxa del jugador ${name}?`)) {
      onDeletePlayer(id);
      if (selectedPlayerId === id) {
        setSelectedPlayerId(null);
      }
      if (triggerToast) triggerToast(`🗑️ Jugador ${name} eliminat de la plantilla`);
    }
  };

  const handleAddStrength = () => {
    if (!newStrength.trim()) return;
    const current = formData.strengths || [];
    setFormData({ ...formData, strengths: [...current, newStrength.trim()] });
    setNewStrength('');
  };

  const handleRemoveStrength = (index: number) => {
    const current = formData.strengths || [];
    setFormData({ ...formData, strengths: current.filter((_, i) => i !== index) });
  };

  const handleAddImprovement = () => {
    if (!newImprovement.trim()) return;
    const current = formData.areasToImprove || [];
    setFormData({ ...formData, areasToImprove: [...current, newImprovement.trim()] });
    setNewImprovement('');
  };

  const handleRemoveImprovement = (index: number) => {
    const current = formData.areasToImprove || [];
    setFormData({ ...formData, areasToImprove: current.filter((_, i) => i !== index) });
  };

  const handleCopyReport = (player: Player) => {
    const { media, percent, ratedCount, totalCount } = calculatePlayerMedia(player.ratings);

    let report = `🏀 VALORACIÓ TÀCTICA DE JUGADOR (JÚNIOR A FCBQ)\n`;
    report += `Jugador: #${player.number} ${player.name}\n`;
    report += `Posició: ${player.position} | Rol: ${player.role || 'Rotació'}\n`;
    report += `Alçada: ${player.height || 'N/A'} | Minuts mitjans: ${player.averageMinutes || 0} min/partit\n`;
    report += `--------------------------------------------------\n`;
    report += `MEDIA DEL JUGADOR: ${media !== null ? `${media} / 10 (${percent}%)` : 'Pendent de valoració (Sense mitjana)'}\n`;
    report += `--------------------------------------------------\n`;
    report += `ESTADÍSTIQUES MITJANES:\n`;
    report += `• Punts: ${player.statsSummary?.ppg || 0} ppg | Rebots: ${player.statsSummary?.rpg || 0} rpg | Assistències: ${player.statsSummary?.apg || 0} apg\n`;
    report += `• % Triple: ${player.statsSummary?.threePointPct || 0}%\n\n`;
    report += `VALORACIÓ EN BAREMS DE COMPETÈNCIES (${ratedCount}/${totalCount} avaluats):\n`;
    
    baremos.forEach(b => {
      const val = player.ratings?.[b.id];
      report += `• ${b.label}: ${typeof val === 'number' && val > 0 ? `${val}/10 (${val * 10}%)` : '—'}\n`;
    });
    report += `\n`;

    if (player.strengths && player.strengths.length > 0) {
      report += `PUNTS FORTS:\n` + player.strengths.map(s => `• ${s}`).join('\n') + `\n\n`;
    }
    if (player.areasToImprove && player.areasToImprove.length > 0) {
      report += `ASPECTES A MILLORAR:\n` + player.areasToImprove.map(a => `• ${a}`).join('\n') + `\n\n`;
    }
    if (player.notes) {
      report += `OBSERVACIONS DE L'ENTRENADOR:\n${player.notes}\n`;
    }

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
    if (triggerToast) triggerToast(`📋 Informe del jugador #${player.number} copiat`);
  };

  const formMediaCalc = calculatePlayerMedia(formData.ratings as Record<string, number>);

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-slate-950 flex items-center justify-center font-black">
              <Users size={20} />
            </div>
            <div>
              <h2 className="font-extrabold uppercase text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                Plantilla de Jugadors i Valoracions Junior A
                <span className="text-[10px] font-mono font-black bg-orange-500/20 text-orange-400 border border-orange-400/30 px-2 py-0.5 rounded uppercase">
                  {players.length} Jugadors
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                Anotacions en barems configurables, càlcul de mitjana del jugador i desenvolupament
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBaremoModal(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
              title="Configurar els barems d'avaluació"
            >
              <Settings size={14} className="text-orange-400" />
              <span className="hidden sm:inline">Configurar Barems</span>
            </button>
            <button
              type="button"
              onClick={handleStartAdd}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus size={15} />
              <span className="hidden sm:inline">Nou Jugador</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-100">
          
          {/* LEFT COLUMN: ROSTER LIST */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-white flex flex-col shrink-0">
            
            {/* SEARCH & FILTERS */}
            <div className="p-3 border-b border-slate-100 space-y-2 bg-slate-50/80">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cercar per nom o dorsal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setFilterPos('ALL')}
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                    filterPos === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  Tots
                </button>
                {POSITIONS.map(pos => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setFilterPos(pos)}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer shrink-0 ${
                      filterPos === pos ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* PLAYER TILES LIST */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[300px] md:max-h-none">
              {filteredPlayers.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-medium space-y-2">
                  <Users size={28} className="mx-auto opacity-40" />
                  <p>No s'ha trobat cap jugador amb aquests filtres.</p>
                </div>
              ) : (
                filteredPlayers.map(player => {
                  const isSelected = activePlayer?.id === player.id;
                  const { media, percent } = calculatePlayerMedia(player.ratings);

                  return (
                    <div
                      key={player.id}
                      onClick={() => {
                        setSelectedPlayerId(player.id);
                        setIsEditing(false);
                        setIsAdding(false);
                      }}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg font-black font-mono text-xs flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-orange-500 text-slate-950' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          #{player.number}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {player.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                            <span className="font-bold">{player.position}</span>
                            <span>•</span>
                            {media !== null ? (
                              <span className={`font-mono font-black ${isSelected ? 'text-orange-400' : 'text-orange-600'}`}>
                                ⭐ {media} ({percent}%)
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">Pendent</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {player.role === 'Quintet Inicial' && (
                          <span className="text-[9px] bg-amber-400/20 text-amber-500 font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
                            5
                          </span>
                        )}
                        <ChevronRight size={14} className={isSelected ? 'text-orange-400' : 'text-slate-300'} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: PLAYER DETAIL / EDIT / ADD FORM */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
            
            {(isAdding || isEditing) ? (
              /* CREATE / EDIT FORM */
              <form onSubmit={handleSaveForm} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      {isAdding ? '➕ Afegir Nou Jugador' : `✏️ Editar Fitxa #${formData.number} ${formData.name}`}
                    </h3>
                    {isAdding && (
                      <p className="text-[11px] text-orange-600 font-semibold mt-0.5">
                        * Els nous jugadors es creen sense percentatges ni valoracions per defecte.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setIsEditing(false);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancel·lar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Dorsal */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Dorsal (#):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={formData.number ?? ''}
                      onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                      className="w-full text-xs font-mono font-black p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      required
                    />
                  </div>

                  {/* Nom */}
                  <div className="sm:col-span-9 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Nom i Cognoms:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Marc Soler"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      required
                    />
                  </div>

                  {/* Posició */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Posició:
                    </label>
                    <select
                      value={formData.position || 'Base'}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                      className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
                    >
                      {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Rol */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Rol a l'Equip:
                    </label>
                    <select
                      value={formData.role || 'Rotació Principal'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Alçada */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Alçada:
                    </label>
                    <input
                      type="text"
                      placeholder="1.88 m"
                      value={formData.height || ''}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>

                  {/* Minuts mitjans */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Minuts Habituals/G:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={formData.averageMinutes ?? 0}
                      onChange={(e) => setFormData({ ...formData, averageMinutes: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>

                  {/* Stats summary */}
                  <div className="sm:col-span-8 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block">
                      Promedis Estadístics (PPG, RPG, APG, % 3P):
                    </label>
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">Punts:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.statsSummary?.ppg ?? 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            statsSummary: { ...formData.statsSummary, ppg: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">Rebots:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.statsSummary?.rpg ?? 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            statsSummary: { ...formData.statsSummary, rpg: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">Assists:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.statsSummary?.apg ?? 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            statsSummary: { ...formData.statsSummary, apg: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">% 3P:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.statsSummary?.threePointPct ?? 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            statsSummary: { ...formData.statsSummary, threePointPct: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC RATINGS / BAREMOS SLIDERS */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider block">
                        📊 Valoració en Barems de Competències (Escala 1 a 10)
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Selecciona puntuació o deixa a 0 / Sense valorar.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-mono font-black text-xs">
                        {formMediaCalc.media !== null ? (
                          <span className="text-orange-400">
                            MEDIA: {formMediaCalc.media} / 10 ({formMediaCalc.percent}%)
                          </span>
                        ) : (
                          <span className="text-slate-400">Pendent de Valoració</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBaremoModal(true)}
                        className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1"
                      >
                        <Settings size={12} /> Editar Barems
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    {baremos.map(b => {
                      const val = formData.ratings?.[b.id] || 0;
                      return (
                        <div key={b.id} className="space-y-1.5 p-2 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between font-bold text-slate-700 text-[11px]">
                            <span className="truncate pr-2">{b.label}</span>
                            {val > 0 ? (
                              <span className="font-mono text-orange-600 font-black text-xs shrink-0">
                                {val}/10 ({val * 10}%)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 italic shrink-0">
                                Sense valorar (0%)
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={10}
                              step={1}
                              value={val}
                              onChange={(e) => {
                                const newNum = parseInt(e.target.value);
                                const newRatings = { ...(formData.ratings || {}) };
                                if (newNum === 0) {
                                  delete newRatings[b.id];
                                } else {
                                  newRatings[b.id] = newNum;
                                }
                                setFormData({ ...formData, ratings: newRatings });
                              }}
                              className="w-full accent-orange-500 cursor-pointer"
                            />
                            {val > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newRatings = { ...(formData.ratings || {}) };
                                  delete newRatings[b.id];
                                  setFormData({ ...formData, ratings: newRatings });
                                }}
                                className="text-[10px] text-slate-400 hover:text-rose-600 font-bold shrink-0 px-1"
                                title="Netejar valoració d'aquest barem"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* STRENGTHS & AREAS TO IMPROVE INPUTS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Punts Forts */}
                  <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                    <label className="text-[10px] font-black uppercase text-emerald-900 tracking-wider block">
                      💪 Punts Forts:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ex: Bon tir de 3p..."
                        value={newStrength}
                        onChange={(e) => setNewStrength(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStrength(); } }}
                        className="flex-1 text-xs p-1.5 bg-white border border-emerald-300 rounded focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddStrength}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition"
                      >
                        +
                      </button>
                    </div>
                    {formData.strengths && formData.strengths.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {formData.strengths.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                            {s}
                            <button type="button" onClick={() => handleRemoveStrength(i)} className="hover:text-rose-600 font-black">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Aspectes a Treballar */}
                  <div className="space-y-1.5 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                    <label className="text-[10px] font-black uppercase text-amber-900 tracking-wider block">
                      🎯 Aspectes a Treballar / Millorar:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ex: Balanç defensiu..."
                        value={newImprovement}
                        onChange={(e) => setNewImprovement(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImprovement(); } }}
                        className="flex-1 text-xs p-1.5 bg-white border border-amber-300 rounded focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddImprovement}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition"
                      >
                        +
                      </button>
                    </div>
                    {formData.areasToImprove && formData.areasToImprove.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {formData.areasToImprove.map((a, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-300">
                            {a}
                            <button type="button" onClick={() => handleRemoveImprovement(i)} className="hover:text-rose-600 font-black">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* NOTES */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    Observacions i Desenvolupament (Anotacions Privades de l'Entrenador):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Escriu comentaris sobre la progressió, actitud, aspectes psicològics o consells individuals..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg transition cursor-pointer"
                  >
                    Cancel·lar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-lg transition cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Save size={14} /> Desar Fitxa Jugador
                  </button>
                </div>
              </form>
            ) : activePlayer ? (
              /* VIEW ACTIVE PLAYER DETAIL CARD */
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5 animate-fadeIn">
                
                {/* PLAYER HEADER INFO & MEDIA SCORE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center font-black shadow-md border-2 border-orange-500">
                      <span className="text-[10px] uppercase text-orange-400 font-mono tracking-widest leading-none">DORSAL</span>
                      <span className="text-xl font-mono text-white leading-none">#{activePlayer.number}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          {activePlayer.name}
                        </h2>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded border border-orange-200">
                          {activePlayer.position}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-bold mt-1">
                        <span>{activePlayer.role || 'Rotació'}</span>
                        <span>•</span>
                        <span>Alçada: {activePlayer.height || 'N/A'}</span>
                        <span>•</span>
                        <span className="text-slate-800">{activePlayer.averageMinutes || 0} min/partit</span>
                      </div>
                    </div>
                  </div>

                  {/* MEDIA SCORE BADGE */}
                  {(() => {
                    const { media, percent, ratedCount, totalCount } = calculatePlayerMedia(activePlayer.ratings);
                    return (
                      <div className="flex items-center gap-2">
                        <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                          media !== null
                            ? media >= 8
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : media >= 6
                                ? 'bg-orange-50 border-orange-300 text-orange-950'
                                : 'bg-amber-50 border-amber-300 text-amber-950'
                            : 'bg-slate-100 border-slate-300 text-slate-600'
                        }`}>
                          <Star size={20} className={media !== null ? 'text-amber-500 fill-amber-400' : 'text-slate-400'} />
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider block opacity-70">
                              MEDIA DEL JUGADOR
                            </span>
                            {media !== null ? (
                              <div className="flex items-baseline gap-1 font-mono font-black">
                                <span className="text-lg">{media}</span>
                                <span className="text-xs opacity-75">/ 10</span>
                                <span className="text-xs font-sans font-extrabold ml-1 px-1.5 py-0.2 rounded bg-black/10">
                                  {percent}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-500">
                                Pendent d'avaluació ({ratedCount}/{totalCount})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyReport(activePlayer)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg border border-slate-300 transition cursor-pointer flex items-center gap-1"
                            title="Copiar informe per WhatsApp / Email"
                          >
                            {copiedReport ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                            <span className="hidden sm:inline">{copiedReport ? 'Copiat!' : 'Copiar'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(activePlayer)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 size={14} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(activePlayer.id, activePlayer.name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Eliminar jugador"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* STATS OVERVIEW CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Punts / Partit</span>
                    <span className="text-lg font-black font-mono text-slate-900">{activePlayer.statsSummary?.ppg || 0}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Rebots / Partit</span>
                    <span className="text-lg font-black font-mono text-slate-900">{activePlayer.statsSummary?.rpg || 0}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Assistències / Partit</span>
                    <span className="text-lg font-black font-mono text-slate-900">{activePlayer.statsSummary?.apg || 0}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">% Tir Exterior (3P)</span>
                    <span className="text-lg font-black font-mono text-orange-600">{activePlayer.statsSummary?.threePointPct || 0}%</span>
                  </div>
                </div>

                {/* SKILLS & BAREMOS EVALUATIONS */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <BarChart2 size={15} className="text-orange-500" /> Valoració en Barems de Competències
                    </h3>

                    <button
                      type="button"
                      onClick={() => setShowBaremoModal(true)}
                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-white px-2 py-1 rounded border border-orange-200 transition"
                    >
                      <Settings size={12} /> Editar Criteris de Barems
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {baremos.map(b => {
                      const val = activePlayer.ratings?.[b.id];
                      const isRated = typeof val === 'number' && val > 0;
                      return (
                        <div key={b.id} className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                            <span>{b.label}</span>
                            {isRated ? (
                              <span className="font-mono text-orange-600 font-extrabold">{val}/10 ({val * 10}%)</span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Sense valorar</span>
                            )}
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                            {isRated ? (
                              <div 
                                className="bg-orange-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${(val / 10) * 100}%` }}
                              />
                            ) : (
                              <div className="bg-slate-200/50 h-full w-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* STRENGTHS & IMPROVEMENTS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                    <span className="text-xs font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1">
                      <Flame size={14} className="text-emerald-600" /> Punts Forts:
                    </span>
                    {activePlayer.strengths && activePlayer.strengths.length > 0 ? (
                      <ul className="space-y-1 text-xs text-emerald-950 font-medium">
                        {activePlayer.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-emerald-700/70 italic">Sense punts forts enregistrats.</p>
                    )}
                  </div>

                  <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-2">
                    <span className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                      <ShieldCheck size={14} className="text-amber-600" /> Aspectes a Treballar:
                    </span>
                    {activePlayer.areasToImprove && activePlayer.areasToImprove.length > 0 ? (
                      <ul className="space-y-1 text-xs text-amber-950 font-medium">
                        {activePlayer.areasToImprove.map((a, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-amber-700/70 italic">Sense aspectes de millora pendents.</p>
                    )}
                  </div>
                </div>

                {/* COACH NOTES */}
                {activePlayer.notes && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-xs font-black uppercase text-slate-600 tracking-wider block">
                      📝 Observacions de l'Entrenador (Privat):
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {activePlayer.notes}
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 text-slate-400">
                <Users size={40} className="mx-auto opacity-30" />
                <p className="text-xs font-bold text-slate-500">
                  Selecciona un jugador de la llista de l'esquerra o crea'n un de nou.
                </p>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus size={15} /> Afegir Jugador
                </button>
              </div>
            )}

          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 bg-slate-900 text-slate-400 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="font-mono text-[11px] text-slate-400">
            CoachBoard Junior A • Dades desades en segon pla (localStorage + Núvol)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-lg transition cursor-pointer"
          >
            Tancar
          </button>
        </div>

      </div>

      {/* SUB-MODAL: BAREMOS MANAGER CONFIGURATION */}
      {showBaremoModal && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-orange-500" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                  Configurar Barems d'Avaluació
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBaremoModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Personalitza els barems que utilitzes per avaluar els jugadors. Els canvis s'aplicaran a totes les fitxes i en la mitjana global.
            </p>

            {/* ADD NEW BAREMO */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: 🤾 Transició Ofensiva..."
                value={newBaremoLabel}
                onChange={(e) => setNewBaremoLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBaremo(); } }}
                className="flex-1 text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={handleAddBaremo}
                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition flex items-center gap-1 shrink-0"
              >
                <Plus size={14} /> Afegir
              </button>
            </div>

            {/* BAREMOS LIST */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 p-1 border-t border-b border-slate-100 my-2">
              {baremos.map((b, idx) => (
                <div key={b.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold">
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <span className="text-slate-400 font-mono text-[10px] shrink-0">#{idx + 1}</span>
                    <input
                      type="text"
                      value={b.label}
                      onChange={(e) => {
                        const updated = baremos.map(item => item.id === b.id ? { ...item, label: e.target.value } : item);
                        saveBaremosList(updated);
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBaremo(b.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Eliminar aquest barem"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* RESET & CLOSE */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetBaremos}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RotateCcw size={12} /> Restablir Barems Inicials
              </button>

              <button
                type="button"
                onClick={() => setShowBaremoModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-lg transition"
              >
                Desar i Tancar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
