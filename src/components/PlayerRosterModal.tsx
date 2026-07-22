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
  Trophy, 
  BarChart2, 
  Activity, 
  Check, 
  Copy, 
  ChevronRight,
  ShieldCheck,
  Flame,
  Award,
  Filter
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

  // Form state for creating / editing
  const [formData, setFormData] = useState<Partial<Player>>({
    number: 10,
    name: '',
    position: 'Base',
    role: 'Rotació Principal',
    height: '1.85 m',
    averageMinutes: 20,
    ratings: { shooting: 7, defense: 7, tacticalIQ: 7, physical: 7, leadership: 7 },
    strengths: ['Joc col·lectiu'],
    areasToImprove: ['Balanç defensiu'],
    notes: '',
    statsSummary: { ppg: 6, rpg: 3, apg: 2, threePointPct: 30 }
  });

  const [newStrength, setNewStrength] = useState('');
  const [newImprovement, setNewImprovement] = useState('');

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
      height: '1.88 m',
      averageMinutes: 18,
      ratings: { shooting: 7, defense: 7, tacticalIQ: 7, physical: 7, leadership: 7 },
      strengths: [],
      areasToImprove: [],
      notes: '',
      statsSummary: { ppg: 5.0, rpg: 2.5, apg: 2.0, threePointPct: 33.0 }
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
      averageMinutes: player.averageMinutes || 20,
      ratings: player.ratings || { shooting: 7, defense: 7, tacticalIQ: 7, physical: 7, leadership: 7 },
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
        averageMinutes: Number(formData.averageMinutes) || 15,
        ratings: formData.ratings || { shooting: 7, defense: 7, tacticalIQ: 7, physical: 7, leadership: 7 },
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

  const handleCopyReport = (player: Player) => {
    let report = `🏀 VALORACIÓ TÀCTICA DE JUGADOR (JÚNIOR A FCBQ)\n`;
    report += `Jugador: #${player.number} ${player.name}\n`;
    report += `Posició: ${player.position} | Rol: ${player.role || 'Rotació'}\n`;
    report += `Alçada: ${player.height || 'N/A'} | Minuts mitjans: ${player.averageMinutes || 0} min/partit\n`;
    report += `--------------------------------------------------\n`;
    report += `ESTADÍSTIQUES MITJANES:\n`;
    report += `• Punts: ${player.statsSummary?.ppg || 0} ppg | Rebots: ${player.statsSummary?.rpg || 0} rpg | Assistències: ${player.statsSummary?.apg || 0} apg\n`;
    report += `• % Triple: ${player.statsSummary?.threePointPct || 0}%\n\n`;
    report += `VALORACIONS TÈCNIC-TÀCTIQUES (1-10):\n`;
    report += `• Tir/Anotació: ${player.ratings?.shooting || '-'}/10\n`;
    report += `• Defensa/Consciència: ${player.ratings?.defense || '-'}/10\n`;
    report += `• IQ Tàctic/Lectura: ${player.ratings?.tacticalIQ || '-'}/10\n`;
    report += `• Físic/Intensitat: ${player.ratings?.physical || '-'}/10\n`;
    report += `• Lideratge/Actitud: ${player.ratings?.leadership || '-'}/10\n\n`;
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
                Anotacions, minuts, % de tir, rols i informes d'evolució en segon pla
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                          <div className="flex items-center gap-2 text-[10px] opacity-80">
                            <span className="font-bold">{player.position}</span>
                            <span>•</span>
                            <span>{player.averageMinutes || 0}m/g</span>
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
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    {isAdding ? '➕ Afegir Nou Jugador' : `✏️ Editar Fitxa #${formData.number} ${formData.name}`}
                  </h3>
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
                      value={formData.number || ''}
                      onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                      className="w-full text-xs font-mono font-black p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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
                      className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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
                      className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
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
                      className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
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
                      className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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
                      value={formData.averageMinutes || 0}
                      onChange={(e) => setFormData({ ...formData, averageMinutes: parseInt(e.target.value) })}
                      className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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
                          value={formData.statsSummary?.ppg || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            statsSummary: { ...formData.statsSummary, ppg: parseFloat(e.target.value) }
                          })}
                          className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">Rebots:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.statsSummary?.rpg || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            statsSummary: { ...formData.statsSummary, rpg: parseFloat(e.target.value) }
                          })}
                          className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">Assists:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.statsSummary?.apg || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            statsSummary: { ...formData.statsSummary, apg: parseFloat(e.target.value) }
                          })}
                          className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">% 3P:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.statsSummary?.threePointPct || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            statsSummary: { ...formData.statsSummary, threePointPct: parseFloat(e.target.value) }
                          })}
                          className="w-full text-xs font-mono font-bold p-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RATINGS SLIDERS (1-10) */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                    📊 Valoració Tècnic-Tàctica (Escala 1 a 10):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {[
                      { key: 'shooting', label: '🎯 Tir / Anotació' },
                      { key: 'defense', label: '🛡️ Defensa / Consciència' },
                      { key: 'tacticalIQ', label: '🧠 IQ Tàctic / Lectura' },
                      { key: 'physical', label: '⚡ Físic / Intensitat' },
                      { key: 'leadership', label: '🔥 Lideratge / Actitud' },
                    ].map(item => {
                      const val = (formData.ratings as any)?.[item.key] || 7;
                      return (
                        <div key={item.key} className="space-y-1">
                          <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                            <span>{item.label}</span>
                            <span className="font-mono text-orange-600 font-extrabold">{val}/10</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={val}
                            onChange={(e) => setFormData({
                              ...formData,
                              ratings: {
                                ...formData.ratings,
                                [item.key]: parseInt(e.target.value)
                              }
                            })}
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                        </div>
                      );
                    })}
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
                
                {/* PLAYER HEADER INFO */}
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

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyReport(activePlayer)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg border border-slate-300 transition cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedReport ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      <span>{copiedReport ? 'Copiat!' : 'Copiar Informe'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(activePlayer)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
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

                {/* SKILLS & RATINGS BARS */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <BarChart2 size={15} className="text-orange-500" /> Valoració de Competències (1-10)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {[
                      { label: '🎯 Tir i Anotació', val: activePlayer.ratings?.shooting || 7 },
                      { label: '🛡️ Defensa i Consciència', val: activePlayer.ratings?.defense || 7 },
                      { label: '🧠 IQ Tàctic i Lectura', val: activePlayer.ratings?.tacticalIQ || 7 },
                      { label: '⚡ Físic i Intensitat', val: activePlayer.ratings?.physical || 7 },
                      { label: '🔥 Lideratge i Caràcter', val: activePlayer.ratings?.leadership || 7 },
                    ].map(r => (
                      <div key={r.label} className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                          <span>{r.label}</span>
                          <span className="font-mono text-orange-600 font-extrabold">{r.val}/10</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-orange-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${(r.val / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
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
    </div>
  );
}
