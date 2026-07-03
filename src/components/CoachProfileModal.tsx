import React, { useState, useRef } from 'react';
import { X, Camera, Upload, User, Check } from 'lucide-react';
import { CoachProfile } from '../lib/firebase';

interface CoachProfileModalProps {
  profile: CoachProfile;
  onSave: (updated: CoachProfile) => void;
  onClose: () => void;
}

export default function CoachProfileModal({ profile, onSave, onClose }: CoachProfileModalProps) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [team, setTeam] = useState(profile.team);
  const [level, setLevel] = useState(profile.level);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-configured elegant presets
  const presets = [
    { name: 'Predeterminat', url: '/src/assets/images/coach_avatar_profile_1782414908020.jpg' },
    { name: 'Tàctic', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150&auto=format&fit=crop&q=60' },
    { name: 'Pista', url: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=150&auto=format&fit=crop&q=60' }
  ];

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('⚠️ Només pots pujar fitxers d\'imatge.');
      return;
    }
    // Limit to 800KB for highly responsive base64 storage
    if (file.size > 800 * 1024) {
      setError('⚠️ La imatge és massa gran (límit: 800KB). Si us plau, utilitza una imatge comprimida o més petita.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatar(e.target.result as string);
      }
    };
    reader.onerror = () => {
      setError('⚠️ Error en carregar la imatge.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('⚠️ El nom de l\'entrenador no pot estar buit.');
      return;
    }
    onSave({
      name: name.trim(),
      email: email.trim(),
      team: team.trim() || 'Junior Masculí',
      level: level.trim() || 'Júnior A • FCBQ',
      avatar
    });
  };

  return (
    <div id="profile-modal-backdrop" className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs select-none">
      <div 
        id="profile-modal-card" 
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 max-w-md w-full relative space-y-5 animate-in fade-in zoom-in duration-200 text-left"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-700 cursor-pointer"
          title="Tancar"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-orange-500/10 text-orange-600 rounded-lg">
              <User size={18} />
            </span>
            Perfil de l'Entrenador
          </h3>
          <p className="text-xs text-slate-450 leading-relaxed font-sans">
            Personalitza la teva signatura de pissarra. Els canvis es desaran localment i es sincronitzaran en temps real amb el teu mòbil de pista.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Edit Section */}
          <div className="flex flex-col items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block self-start">Foto de Perfil</span>
            
            <div className="flex items-center gap-4 w-full">
              {/* Photo Preview & Upload clicker */}
              <div 
                className="relative group cursor-pointer shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src={avatar}
                  alt="Coach Avatar Preview"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border-4 border-orange-500 shadow-md group-hover:opacity-85 transition"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition duration-150">
                  <Camera size={14} className="text-white" />
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-xl p-3 text-center cursor-pointer transition duration-150 h-16 ${
                  dragActive 
                    ? 'border-orange-500 bg-orange-50/20' 
                    : 'border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50/30'
                }`}
              >
                <Upload size={14} className="text-slate-400 mb-1" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Arrossega o prem per triar
                </span>
                <span className="text-[8px] text-slate-400 mt-0.5">Màxim 800KB</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />

            {/* Presets Grid */}
            <div className="w-full space-y-1.5 mt-1">
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-450 block">O tria una predeterminada:</span>
              <div className="flex gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset.url)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-bold tracking-wide transition ${
                      avatar === preset.url 
                        ? 'bg-orange-500/10 border-orange-400 text-orange-600' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <img src={preset.url} alt="" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full object-cover" />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-450 block mb-1">Nom de l'Entrenador</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: David Pino"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-450 block mb-1">Correu Electrònic</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: dpinogay@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-450 block mb-1">Equip / Curs</label>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="Ex: Junior Masculí"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-450 block mb-1">Categoria / Lliga</label>
                <input
                  type="text"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="Ex: Júnior A • FCBQ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-[10px] text-red-500 font-semibold mt-1 bg-red-50 border border-red-100 rounded-xl p-2.5">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer text-center"
            >
              Cancel·lar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold transition active:scale-95 cursor-pointer shadow-md shadow-orange-500/15 text-center flex items-center justify-center gap-1.5"
            >
              <Check size={14} strokeWidth={3} />
              Desar Canvis
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
