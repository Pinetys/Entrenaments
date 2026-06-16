import React, { useState, useEffect } from 'react';
import { Camera, Upload, Check, RefreshCw, Sparkles, AlertCircle, Info, MapPin } from 'lucide-react';
import TacticalBoard from './TacticalBoard';
import { Drill } from '../types';

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

  const loadingSteps = [
    "Iniciant motor de visió artificial de Gemini...",
    "Escanejant línies de la pissarra táctica...",
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

    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % loadingSteps.length;
      setAnalysisStep(loadingSteps[stepIndex]);
    }, 2400);

    return () => clearInterval(interval);
  }, [analyzing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setSuccess(false);
      setAnalyzedDrill(null);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
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
        <div className="w-10 h-10 bg-orange-500 rounded-sm flex items-center justify-center text-white font-black text-xl mx-auto shadow-md mb-1.5">
          J
        </div>
        <h1 className="text-sm font-black uppercase tracking-wider text-orange-500">Court Commander Scanner</h1>
        <p className="text-[10px] text-slate-400">Escaneja i grafia les pissarres táctiques amb Gemini Vision</p>
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
            <div className="text-center p-8 bg-slate-900/60 border border-orange-500/30 rounded-xl space-y-5 shadow-xl w-full flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-orange-500 animate-spin"></div>
                <Sparkles size={24} className="text-orange-500 absolute animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase text-orange-400 tracking-widest">Processament Intel·ligent</h4>
                <p className="text-[11px] text-slate-300 font-medium h-8 flex items-center justify-center px-4 leading-normal transition duration-300">
                  {analysisStep}
                </p>
              </div>
              <p className="text-[9px] text-slate-500 max-w-xs uppercase tracking-wider">
                Analitzant traços, fletxes i jugadors sobre el terreny de joc...
              </p>
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
                    <div className="space-y-3">
                      <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-inner max-h-[220px] flex items-center justify-center">
                        <img
                          src={selectedImage}
                          alt="Captura realitzada"
                          className="max-h-[220px] object-contain w-full"
                        />
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="absolute top-2 right-2 bg-slate-900 text-slate-300 hover:bg-rose-950 hover:text-red-400 p-1 px-2.5 rounded text-[10px] font-bold transition shadow-md border border-slate-800"
                        >
                          Treure imatge
                        </button>
                      </div>

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
        <p className="text-[8px] text-slate-650 mt-1.5 opacity-60">© 2026 Court Commander Project. Tots els drets reservats.</p>
      </footer>
    </div>
  );
}

