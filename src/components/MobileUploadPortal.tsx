import React, { useState, useEffect } from 'react';
import { Camera, Upload, Check, RefreshCw, Sparkles, AlertCircle, Info, MapPin, Dribbble } from 'lucide-react';
import TacticalBoard from './TacticalBoard';
import { Drill } from '../types';

import { compressAndResizeImage, ImageAnalysisResult } from '../lib/imageCompressor';

interface MobileUploadPortalProps {
  code: string;
  onBackToPC: () => void;
}

export default function MobileUploadPortal({ code, onBackToPC }: MobileUploadPortalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [uploading, setUploading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Gemini vision states on Mobile
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analyzedDrill, setAnalyzedDrill] = useState<Drill | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [qualityAnalysis, setQualityAnalysis] = useState<ImageAnalysisResult | null>(null);

  const loadingSteps = [
    "Iniciant motor de visió artificial de Gemini...",
    "Escanejant línies de la pista de bàsquet...",
    "Identificant la distribució de cons i fitxes...",
    "Detecció de posicions de jugadors (atacants i defensors)...",
    "Calculant trajectòries i fletxes de passades...",
    "Traduint contingut tècnic al català (FCBQ)...",
    "Generant gràfics de microfase..."
  ];

  useEffect(() => {
    if (!analyzing) return;
    let stepIndex = 0;
    setAnalysisStep(loadingSteps[0]);
    setCurrentStepIdx(0);

    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % loadingSteps.length;
      setAnalysisStep(loadingSteps[stepIndex]);
      setCurrentStepIdx(stepIndex);
    }, 2400);

    return () => clearInterval(interval);
  }, [analyzing]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setSuccess(false);
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

  const handleAnalyzeWithGemini = async () => {
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
        throw new Error(errorData.error || "No s'ha pogut obtenir anàlisi de la pissarra.");
      }

      const data = await res.json();
      if (data && data.drill) {
        setAnalyzedDrill(data.drill);
      } else {
        throw new Error("Estructura d'exercici no vàlida retornada per Gemini.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error analitzant amb Gemini. Comprova la connexió.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendToPC = async () => {
    if (!selectedImage) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const base64Content = selectedImage.split(',')[1];
      const res = await fetch('/api/upload-from-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          image: base64Content,
          mimeType: mimeType,
          drill: analyzedDrill // Pass the pre-analyzed drill to fast-track PC load!
        })
      });

      if (!res.ok) {
        throw new Error("L'enviament ha fallat en el servidor.");
      }

      setSuccess(true);
      setSelectedImage(null);
      setAnalyzedDrill(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error d'enviament. Comprova la teva connexió a Internet.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div id="mobile-portal-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-6 font-sans select-none">
      
      {/* Header Info */}
      <header className="text-center py-3 border-b border-slate-900 shrink-0">
        <div className="w-10 h-10 bg-orange-500 rounded-sm flex items-center justify-center text-white font-black text-xl mx-auto shadow-md mb-1.5 animate-pulse">
          <Dribbble strokeWidth={2.5} size={22} className="text-white" />
        </div>
        <h1 className="text-sm font-black uppercase tracking-wider text-orange-500">Coach Pinety Scanner</h1>
        <p className="text-[10px] text-slate-400">Escaneja i grafia les pissarres tàctiques amb Gemini Vision</p>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center my-4 space-y-4">
        
        {/* Pairing Status Header */}
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-3 rounded-lg text-center shadow-lg">
          <span className="text-[9px] uppercase font-mono font-bold text-slate-500 tracking-widest block">Codi de Sincronització</span>
          <div className="text-2xl font-black tracking-widest text-white mt-1 select-all bg-slate-950 py-1.5 rounded border border-slate-850">
            {code}
          </div>
          <span className="text-[9px] text-emerald-400 font-mono mt-1.5 block">● Vinculat i preparat</span>
        </div>

        {/* Action / Success / Scanning Screen */}
        <div className="w-full max-w-sm">
          {success ? (
            <div className="text-center p-6 bg-emerald-950/25 border border-emerald-500/20 rounded-xl space-y-4 w-full">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-slate-950 shadow-md">
                <Check size={28} strokeWidth={3} />
              </div>
              <div>
                <h3 className="font-extrabold text-emerald-400 text-sm uppercase tracking-wide">EXERCICI ENVIAT AMB ÈXIT!</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  L'esquema de pissarra s'ha digitalitzat, s'han grafiat les trajectòries i s'ha enviat immediatament a la pantalla del teu ordinador.
                </p>
              </div>
              <button
                onClick={() => setSuccess(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer border border-slate-800"
              >
                Escanejar un altre dibuix
              </button>
            </div>
          ) : analyzing ? (
            <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-5 shadow-xl w-full flex flex-col items-center justify-center min-h-[350px]">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-orange-500 animate-spin"></div>
                <Sparkles size={24} className="text-orange-500 absolute animate-pulse" />
              </div>
              
              <div className="space-y-2 w-full px-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                  <span className="text-orange-400 font-extrabold animate-pulse">ANALITZANT PISSARRA...</span>
                  <span className="text-slate-400 font-bold">{Math.round(((currentStepIdx + 1) / loadingSteps.length) * 100)}%</span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 p-[1px]">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.round(((currentStepIdx + 1) / loadingSteps.length) * 100)}%` }}
                  ></div>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-850 text-center min-h-[44px] flex items-center justify-center mt-2 shadow-inner">
                  <p className="text-[11px] text-slate-200 font-semibold leading-snug">
                    {analysisStep}
                  </p>
                </div>
              </div>

              {/* Step Checklist */}
              <div className="w-full space-y-1.5 text-left bg-slate-950/40 p-3.5 rounded-lg border border-slate-900 text-[10px] font-mono text-slate-500 max-h-[170px] overflow-y-auto">
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fases de l'Escaneig Tàctic</div>
                {loadingSteps.map((step, idx) => {
                  const isCompleted = idx < currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2 transition-all duration-300 ${
                        isCurrent ? 'text-orange-400 font-bold' : isCompleted ? 'text-emerald-400 font-semibold' : 'text-slate-650'
                      }`}
                    >
                      <span className="shrink-0 text-[11px] w-4 flex justify-center">
                        {isCompleted ? '✓' : isCurrent ? '⚡' : '○'}
                      </span>
                      <span className="truncate">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4">
              
              {/* Photo selector area */}
              {!selectedImage ? (
                <label className="flex flex-col items-center justify-center p-6 bg-slate-900/40 border-2 border-dashed border-slate-800 hover:border-orange-500 hover:bg-slate-900/80 rounded-xl transition cursor-pointer text-center group min-h-[190px]">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-full text-slate-400 group-hover:text-orange-500 group-hover:scale-105 transition duration-150 shadow-md">
                    <Camera size={28} />
                  </div>
                  <span className="text-xs font-black uppercase text-slate-200 mt-3 tracking-wider">Fes o puja una foto</span>
                  <p className="text-[10px] text-slate-500 mt-1 px-4 leading-relaxed">
                    Prem per fer una foto a la pissarra táctica o selecciona una imatge de la galeria
                  </p>
                  
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-4 w-full max-h-[75vh] overflow-y-auto pr-1">
                  
                  {/* Photo Preview Thumbnail & Action buttons */}
                  {!analyzedDrill ? (
                    <div className="space-y-4">
                      <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-inner max-h-[220px] flex items-center justify-center">
                        <img
                          src={selectedImage}
                          alt="Captura realitzada"
                          className="max-h-[220px] object-contain w-full"
                        />
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="absolute top-2 right-2 bg-slate-900/90 text-slate-300 hover:bg-rose-950 hover:text-red-400 p-1 px-2.5 rounded text-[10px] font-bold transition shadow-md border border-slate-800 cursor-pointer"
                        >
                          Treure imatge
                        </button>
                      </div>

                      {/* Live Quality / Focus indicator dashboard */}
                      {qualityAnalysis && (
                        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-3 text-left shadow-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">
                              Anàlisi de Qualitat de Captura
                            </span>
                            <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                              qualityAnalysis.qualityScore >= 90 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              qualityAnalysis.qualityScore >= 70 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {qualityAnalysis.qualityLabel} ({qualityAnalysis.qualityScore}%)
                            </span>
                          </div>

                          {/* Visual score dial/bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                              <span>Nitidesa i contrast de línies</span>
                              <span>{qualityAnalysis.qualityScore}/100</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-850">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  qualityAnalysis.qualityScore >= 90 ? 'bg-emerald-500' :
                                  qualityAnalysis.qualityScore >= 70 ? 'bg-amber-500' :
                                  'bg-rose-500'
                                }`}
                                style={{ width: `${qualityAnalysis.qualityScore}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Metadata list */}
                          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-slate-950 p-2 rounded border border-slate-850 text-slate-400">
                            <div>
                              <span className="text-slate-500 block text-[7px] uppercase">Resolució de Sensor</span>
                              <span className="font-bold text-slate-300">{qualityAnalysis.originalWidth}x{qualityAnalysis.originalHeight}px</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[7px] uppercase">Pes d'Enviament</span>
                              <span className="font-bold text-slate-300">{qualityAnalysis.compressedSizeKb} KB</span>
                            </div>
                          </div>

                          {/* Suggestion / Tips checklist */}
                          <div className="space-y-1.5 border-t border-slate-800/60 pt-2.5">
                            <span className="text-[8px] font-mono font-black text-orange-400 uppercase tracking-widest block mb-1">
                              Recomanacions del Motor de Visió
                            </span>
                            {qualityAnalysis.suggestions.map((suggestion: string, idx: number) => (
                              <p key={idx} className="text-[9px] text-slate-300 leading-normal flex items-start gap-1">
                                <span className="text-orange-500 select-none shrink-0">•</span>
                                <span>{suggestion}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleAnalyzeWithGemini}
                          className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Sparkles size={14} />
                          Analitzar i grafiar amb Gemini
                        </button>

                        <button
                          onClick={handleSendToPC}
                          disabled={uploading}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center border border-slate-800 flex items-center justify-center gap-1.5"
                        >
                          {uploading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                          Sols enviar imatge original
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* WE HAVE THE ANALYZED DRILL AND GRAPHICS PREVIEW! */
                    <div className="space-y-4 text-left">
                      
                      {/* Animated alert confirming successful translation */}
                      <div className="p-3 bg-emerald-950/20 border border-emerald-500/25 rounded-lg flex gap-2 items-start">
                        <Sparkles size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <h5 className="text-[10px] font-black uppercase text-emerald-400 tracking-wide">Pissarra grafiada amb èxit!</h5>
                          <p className="text-[9px] text-slate-350 leading-relaxed mt-0.5">
                            La IA ha detectat les posicions dels jugadors i ha traçat les fletxes tàctiques automàticament a sota.
                          </p>
                        </div>
                      </div>

                      {/* Display of the Tactical Board render directly on phone */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black tracking-widest text-orange-400 uppercase">Gràfic d'Exercici Detectat</label>
                        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative shadow-inner">
                          <TacticalBoard 
                            boardState={analyzedDrill.boardState || { paths: [], pins: [] }} 
                            onChange={() => {}} 
                            readOnly={true} 
                          />
                        </div>
                      </div>

                      {/* Core details card of the drill */}
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-2.5">
                        <div>
                          <span className="text-[8px] bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                            {analyzedDrill.category || "Tàctica"}
                          </span>
                          <h4 className="text-xs font-black text-white mt-1 leading-normal">{analyzedDrill.title}</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-b border-slate-800/80 py-2">
                          <div>
                            <span className="text-slate-450 uppercase tracking-widest block font-mono text-[7px]">Durada ideal</span>
                            <span className="text-slate-200 font-extrabold">{analyzedDrill.duration || 15} MINUTS</span>
                          </div>
                          <div>
                            <span className="text-slate-450 uppercase tracking-widest block font-mono text-[7px]">Jugadors recomanats</span>
                            <span className="text-slate-200 font-extrabold">{analyzedDrill.playersNeeded || 6} JUGADORS</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-450 uppercase tracking-widest block font-mono text-[7px]">Descripció de l'exercici</span>
                          <p className="text-[10px] text-slate-300 mt-1 leading-relaxed leading-normal line-clamp-4 select-text">
                            {analyzedDrill.description}
                          </p>
                        </div>
                      </div>

                      {/* PC sync buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setAnalyzedDrill(null);
                          }}
                          className="py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                        >
                          🔄 Re-escanejar
                        </button>
                        <button
                          onClick={handleSendToPC}
                          disabled={uploading}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                        >
                          {uploading ? <RefreshCw size={11} className="animate-spin" /> : <Upload size={11} />}
                          Sincronitzar PC
                        </button>
                      </div>

                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-2.5 bg-rose-950/20 border border-rose-500/20 text-rose-400 text-[10px] leading-relaxed text-center rounded-lg font-bold">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* Footer disclaimer / navigation */}
      <footer className="text-center py-2.5 border-t border-slate-900 shrink-0">
        <button
          onClick={onBackToPC}
          className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition uppercase tracking-wider underline underline-offset-4"
        >
          Anar al planificador (PC)
        </button>
        <p className="text-[8px] text-slate-650 mt-1.5 opacity-60">© 2026 Coach Pinety Project. Tots els drets reservats.</p>
      </footer>
    </div>
  );
}

