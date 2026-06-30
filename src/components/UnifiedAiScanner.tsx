import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Image as ImageIcon,
  Users,
  Clock,
  BookOpen,
  Plus
} from 'lucide-react';
import { Drill, DrillCategory, BoardState, TrainingSession } from '../types';
import TacticalBoard from './TacticalBoard';
import { compressAndResizeImage, ImageAnalysisResult } from '../lib/imageCompressor';

interface UnifiedAiScannerProps {
  onAddDrill: (drill: Drill) => void;
  activeSession: TrainingSession;
  onUpdateSession: (updatedSession: TrainingSession) => void;
  triggerToast: (msg: string) => void;
}

export default function UnifiedAiScanner({ 
  onAddDrill, 
  activeSession, 
  onUpdateSession, 
  triggerToast 
}: UnifiedAiScannerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Scanned drill result
  const [analyzedDrill, setAnalyzedDrill] = useState<Drill | null>(null);
  const [qualityAnalysis, setQualityAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [stepIdx, setStepIdx] = useState<number>(0);

  const loadingSteps = [
    "Connectant amb l'IA de Gemini de Google...",
    "Processant i optimitzant fotografia...",
    "Detectant jugadors (atacants O i defensors X)...",
    "Interpretant moviments, fletxes i trajectòries...",
    "Generant esquema de la pissarra tàctica...",
    "Sintetitzant títol i instruccions de l'exercici...",
    "Enllestint la fitxa tècnica (FCBQ Standard)..."
  ];

  useEffect(() => {
    if (!analyzing) return;
    let stepIndex = 0;
    setAnalysisStep(loadingSteps[0]);
    setStepIdx(0);

    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % loadingSteps.length;
      setAnalysisStep(loadingSteps[stepIndex]);
      setStepIdx(stepIndex);
    }, 2200);

    return () => clearInterval(interval);
  }, [analyzing]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setAnalyzedDrill(null);
    setErrorMsg(null);
    setQualityAnalysis(null);

    try {
      const result = await compressAndResizeImage(file, 1200);
      setMimeType(result.mimeType);
      setSelectedImage(`data:${result.mimeType};base64,${result.base64Data}`);
      setQualityAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("No s'ha pogut processar o reduir la imatge seleccionada.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setErrorMsg(null);
    setAnalyzedDrill(null);

    try {
      const base64Content = selectedImage.split(',')[1];
      const res = await fetch('/api/analyze-drill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Content,
          mimeType: mimeType
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "No s'ha pogut obtenir l'anàlisi de la pissarra.");
      }

      const data = await res.json();
      if (data && data.drill) {
        setAnalyzedDrill(data.drill);
        triggerToast("✨ Dibuix digitalitzat amb èxit per la intel·ligència de Gemini!");
      } else {
        throw new Error("Estructura d'exercici no vàlida retornada pel servidor.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error analitzant el grafisme. Comprova la teva connexió.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveDrill = async (addToSession: boolean) => {
    if (!analyzedDrill) return;

    setSaving(true);
    try {
      // Create new unique ID
      const newDrillId = `drill-scanned-${Date.now()}`;
      const finalDrill: Drill = {
        ...analyzedDrill,
        id: newDrillId,
        isCustom: true
      };

      // 1. Save to global database list
      onAddDrill(finalDrill);

      // 2. Save directly to current active session if requested
      if (addToSession) {
        const updatedSession: TrainingSession = {
          ...activeSession,
          drills: [
            ...(activeSession.drills || []),
            {
              drillId: newDrillId,
              duration: finalDrill.duration || 15
            }
          ]
        };
        onUpdateSession(updatedSession);
        triggerToast(`💾 S'ha guardat i afegit l'exercici a la sessió: "${activeSession.name}"!`);
      } else {
        triggerToast("💾 S'ha guardat correctament a la Biblioteca d'Exercicis!");
      }

      // Reset Scanner Form
      setSelectedImage(null);
      setAnalyzedDrill(null);
    } catch (err) {
      triggerToast("⚠️ No s'ha pogut desar l'exercici digitalitzat.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-6 max-w-4xl mx-auto select-none">
      
      {/* Visual Header */}
      <div className="border-b border-slate-100 pb-4 text-center space-y-2">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-1 shadow-md">
          <Sparkles size={24} className="animate-pulse" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-wider text-slate-800">📸 Escàner de Pissarres i Dibuixos IA</h2>
        <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
          Feu una foto des del mòbil o pengeu una imatge d'una pissarra táctica, llibre o esbós fet a mà. La Intel·ligència Artificial de Gemini llegirà les fletxes, jugadors i pilotes per traduir-ho en un grafisme interactiu.
        </p>
      </div>

      {/* Upload Screen vs Loading Steps vs Digitalized Results */}
      {!selectedImage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CAMERA CAPTURE (opens camera directly on mobile) */}
          <label className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-50/40 to-amber-50/20 border-2 border-dashed border-orange-200 hover:border-orange-500 hover:bg-orange-50/50 rounded-3xl transition cursor-pointer text-center group min-h-[240px]">
            <div className="p-4 bg-orange-500 text-white rounded-full group-hover:scale-110 transition duration-150 shadow-md">
              <Camera size={32} />
            </div>
            <span className="text-sm font-black uppercase text-orange-900 mt-4 tracking-wider">📸 Obrir Càmera Mòbil</span>
            <p className="text-[11px] text-orange-750 mt-1.5 px-4 leading-relaxed max-w-xs">
              Activa directament la càmera de fotos del mòbil o tauleta per fer una captura instantània de la pissarra.
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* GALLERY / FILE UPLOAD */}
          <label className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-orange-500 hover:bg-orange-50/20 rounded-3xl transition cursor-pointer text-center group min-h-[240px]">
            <div className="p-4 bg-white border border-slate-100 rounded-full text-slate-400 group-hover:text-orange-500 group-hover:scale-110 transition duration-150 shadow-md">
              <Upload size={32} />
            </div>
            <span className="text-sm font-black uppercase text-slate-700 mt-4 tracking-wider">📁 Seleccionar Imatge / Arxiu</span>
            <p className="text-[11px] text-slate-400 mt-1.5 px-4 leading-relaxed max-w-xs">
              Tria un arxiu d'imatge ja desat al teu ordinador o mòbil (galeria de fotos, descàrregues, etc.).
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      ) : analyzing ? (
        <div className="flex flex-col items-center justify-center p-10 bg-slate-50 border border-slate-200 rounded-3xl min-h-[350px] space-y-6 text-center">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-4 border-dashed border-orange-500 animate-spin"></div>
            <Sparkles size={32} className="text-orange-500 absolute animate-pulse" />
          </div>

          <div className="space-y-3 w-full max-w-md">
            <div className="flex justify-between items-center text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 px-1">
              <span className="text-orange-600 animate-pulse">Analitzant grafisme...</span>
              <span>{Math.round(((stepIdx + 1) / loadingSteps.length) * 100)}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300/60 p-[1px]">
              <div 
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.round(((stepIdx + 1) / loadingSteps.length) * 100)}%` }}
              ></div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-150 text-center shadow-xs">
              <p className="text-xs font-bold text-slate-700 leading-snug">
                {analysisStep}
              </p>
            </div>
          </div>

          {/* Checklist Step Indicators */}
          <div className="w-full max-w-md space-y-2 text-left bg-white p-4 rounded-xl border border-slate-150 text-[10px] font-mono text-slate-400 max-h-[180px] overflow-y-auto shadow-xs">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Fases del Reconeixement</span>
            {loadingSteps.map((step, idx) => {
              const isCompleted = idx < stepIdx;
              const isCurrent = idx === stepIdx;
              return (
                <div 
                  key={idx} 
                  className={`flex items-center gap-2.5 transition-all duration-300 ${
                    isCompleted ? 'text-emerald-600 font-extrabold' :
                    isCurrent ? 'text-orange-600 font-black scale-[1.01]' : 'text-slate-350'
                  }`}
                >
                  <span className="shrink-0">{isCompleted ? '✓' : isCurrent ? '●' : '○'}</span>
                  <span className="truncate">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : !analyzedDrill ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left panel: Selected photograph with quality assessment */}
          <div className="space-y-3">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Imatge capturada</span>
            <div className={`relative bg-slate-900 rounded-2xl overflow-hidden border transition-all duration-300 h-[280px] flex items-center justify-center shadow-inner ${
              qualityAnalysis 
                ? qualityAnalysis.qualityScore >= 90 ? 'border-emerald-400/50 shadow-emerald-500/10'
                  : qualityAnalysis.qualityScore >= 70 ? 'border-amber-400/50 shadow-amber-500/10'
                  : 'border-rose-400/50 shadow-rose-500/10'
                : 'border-slate-200'
            }`}>
              <img
                src={selectedImage}
                alt="Selected board photograph"
                className="max-h-[280px] w-auto object-contain"
              />

              {/* Focus assessment overlay */}
              {qualityAnalysis && (
                <div className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-md text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-2 shadow-md border ${
                  qualityAnalysis.qualityScore >= 90 ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
                  qualityAnalysis.qualityScore >= 70 ? 'bg-amber-950 text-amber-400 border-amber-500/30' :
                  'bg-rose-950 text-rose-400 border-rose-500/30'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                  <span>Enfocament: {qualityAnalysis.qualityLabel} ({qualityAnalysis.qualityScore}%)</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setQualityAnalysis(null);
                }}
                className="absolute top-3 right-3 bg-slate-950/90 hover:bg-rose-950 text-slate-200 hover:text-red-400 p-1.5 px-3 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-800 transition shadow-md cursor-pointer"
              >
                Canviar foto
              </button>
            </div>
          </div>

          {/* Right panel: Ready to trigger analysis */}
          <div className="flex flex-col justify-center space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mx-auto">
              <Camera size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Imatge a punt!</h4>
              <p className="text-xs text-slate-500 px-4 leading-relaxed">
                Gemini Vision està preparat per digitalitzar les fletxes de moviment de passades, tir i bot, i la col·locació de jugadors atacants (O) i defensors (X).
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
              <Sparkles size={15} />
              Començar Digitalització amb IA
            </button>
          </div>

        </div>
      ) : (
        /* Final Scanned results display & form fine-tuning */
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-orange-500 text-white rounded-lg shrink-0">
              <Check size={18} strokeWidth={3} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-orange-950">Lectura de Pissarra Completada!</h4>
              <p className="text-[11px] text-orange-850">La IA ha convertit el teu dibuix en fitxa i gràfic interactiu de bàsquet. Reviseu la informació a sota.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Form details */}
            {(() => {
              const rawCat = analyzedDrill.category || 'Atac';
              const normCat = rawCat === 'Defensa' ? 'Defensa' : (['Físico', 'Técnica', 'Escalfament'].includes(rawCat) ? 'Escalfament' : 'Atac');
              return (
                <div className={`space-y-4 bg-slate-50 p-5 rounded-2xl border transition-colors duration-300 ${
                  normCat === 'Atac' ? 'border-l-4 border-l-orange-500 border-orange-200' :
                  normCat === 'Defensa' ? 'border-l-4 border-l-rose-500 border-rose-200' :
                  'border-l-4 border-l-emerald-500 border-emerald-200'
                }`}>
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">Fitxa Tècnica de l'Exercici</h5>


              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Títol de l'Exercici</label>
                  <input
                    type="text"
                    value={analyzedDrill.title || ''}
                    onChange={(e) => setAnalyzedDrill({ ...analyzedDrill, title: e.target.value })}
                    className="w-full bg-white border border-slate-250 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Durada (Minuts)</label>
                    <input
                      type="number"
                      value={analyzedDrill.duration || 15}
                      onChange={(e) => setAnalyzedDrill({ ...analyzedDrill, duration: parseInt(e.target.value) || 15 })}
                      className="w-full bg-white border border-slate-250 px-3 py-2 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Categoria</label>
                    <select
                      value={analyzedDrill.category || 'Atac'}
                      onChange={(e) => setAnalyzedDrill({ ...analyzedDrill, category: e.target.value as DrillCategory })}
                      className="w-full bg-white border border-slate-250 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="Atac">Atac</option>
                      <option value="Defensa">Defensa</option>
                      <option value="Escalfament">Escalfament</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Jugadors Req.</label>
                    <input
                      type="number"
                      value={analyzedDrill.playersNeeded || 6}
                      onChange={(e) => setAnalyzedDrill({ ...analyzedDrill, playersNeeded: parseInt(e.target.value) || 6 })}
                      className="w-full bg-white border border-slate-250 px-3 py-2 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Concepte Principal</label>
                    <input
                      type="text"
                      value={analyzedDrill.concept || ''}
                      onChange={(e) => setAnalyzedDrill({ ...analyzedDrill, concept: e.target.value })}
                      className="w-full bg-white border border-slate-250 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripció d'execució</label>
                  <textarea
                    rows={4}
                    value={analyzedDrill.description || ''}
                    onChange={(e) => setAnalyzedDrill({ ...analyzedDrill, description: e.target.value })}
                    className="w-full bg-white border border-slate-250 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500 leading-relaxed font-sans"
                  />
                </div>
              </div>
            </div>
          );
        })()}

            {/* Interactive tactical preview */}
            <div className="space-y-4">
              <span className="block text-xs font-black uppercase tracking-wider text-slate-700 leading-none">Gràfic Pissarra Tàctica Auto-Generat</span>
              <div className="w-full h-[320px] rounded-2xl overflow-hidden border border-slate-200 shadow-md relative bg-emerald-950">
                <TacticalBoard 
                  boardState={analyzedDrill.boardState || { pins: [], paths: [] }} 
                  onChange={() => {}}
                  readOnly={true} 
                />
              </div>

              {/* Action save triggers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveDrill(true)}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  {saving ? <RefreshCw className="animate-spin" size={13} /> : <Plus size={13} strokeWidth={3} />}
                  Desar i afegir a l'entrenament
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveDrill(false)}
                  disabled={saving}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95 border border-slate-800"
                >
                  Desar només a la Biblioteca
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {errorMsg && (
        errorMsg.includes("GEMINI_API_KEY") ? (
          <div className="p-5 bg-amber-50 border border-amber-200 text-slate-800 rounded-2xl text-xs space-y-3 shadow-sm max-w-xl mx-auto text-left">
            <div className="flex items-center gap-2 text-amber-700 font-black uppercase tracking-wider text-[11px]">
              <span>⚠️ CONFIGURACIÓ DE L'API DE GEMINI REQUERIDA</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              Per poder analitzar i digitalitzar les teves imatges utilitzant la Intel·ligència Artificial de Google, necessites configurar una clau d'API de Gemini (<strong>GEMINI_API_KEY</strong>) gratuïta:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 font-medium">
              <li>Ves a la secció de <strong>Configuració / Secrets</strong> d'AI Studio (a la cantonada de la pantalla o menú superior/lateral de la plataforma).</li>
              <li>Afegeix una nova variable d'entorn anomenada <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">GEMINI_API_KEY</code>.</li>
              <li>Insereix la teva clau de l'API de Gemini gratuïta (que pots obtenir a <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline font-bold">aistudio.google.com</a>).</li>
            </ol>
            <p className="text-[10px] text-slate-500 italic pt-2 border-t border-amber-200/60">
              Un cop configurada, torna a provar de pujar la imatge i digitalitzarem el teu exercici a l'instant!
            </p>
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold text-center">
            ⚠️ {errorMsg}
          </div>
        )
      )}

    </div>
  );
}
