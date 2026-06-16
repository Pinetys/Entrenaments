import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Allow high limits for receipt of base64 images
app.use(express.json({ limit: "15mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint to automatically analyze a blackboard training drill image and structure into JSON format
app.post("/api/analyze-drill", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: "Falten paràmetres 'image' o 'mimeType'" });
    }

    const promptString = `Ets un prestigiós expert entrenador de bàsquet i formador de la Federació Catalana de Basquetbol (FCBQ).
Analitza de forma molt exhaustiva aquesta imatge d'un exercici tàctic de bàsquet (pot ser una foto presa amb mòbil d'una pissarra tàctica d'entrenament, un llibre d'exercicis, un quadern o un esquema escrit a mà).

Pautes crítiques d'extracció i millorament de qualitat:
1. Identifica el Títol, la Descripció en català, la Categoria apropiada, la Durada aproximada, els Objectius del moviment i les Instruccions detallades de col·locació i de rotacions.
2. Reconeix la disposició en pista per crear tant 'boardState' (el gràfic original o global) com l'array 'boardStates' d'etapes o fases progressives.
3. ÉS REQUERIT I MANDATORI QUE SEMPRE ENVIÏS UN DIBUIX DE COORDINADES ('boardState' I 'boardStates' AMB ARRAYS DE 'pins' I 'paths' NO BUITS). Encara que la imatge tingui un dibuix borrós, oblic, o fins i tot si només té text, DISSENYA I CONSTRUEIX SINTÈTICAMENT de manera lògica els xips o fitxes (pins) i trajectòries (paths). És a dir, col·loca sempre mínim 4-6 pins (jugadors d'atac/defensa, con de sortida, pilota 🏀) i de 2 o 3 fletxes de trajectòria (paths) per a representar esportivament l'exercici sobre la pista táctica. Mai deixis el 'boardState' buit ni sense línies gràfiques!
4. Els xips ('pins') han d'estar perfectament distribuïts per ressaltar l'exercici de forma pulcra dins la pista (coordenades x: 5% a 95%, y: 5% a 95%) amb labels i id clars (id únics com 'att1', 'def1', 'cone1', 'ball'). El pin de la pilota (id: 'ball', label: '🏀', type: 'ball') s'ha d'ubicar inicialment on comença la jugada o l'atacant amb pilota.
5. Els traçats ('paths') han d'usar obligatòriament colors hex adients: #eab308 o #f97316 per trajectòries d'atac (solid o zigzag), #0ea5e9 per passades de pilota (dashed), #ef4444 per desplaçament defensiu (dotted). Cada path ha de contenir com a mínim un punt inicial i un punt final directament orientats cap a la cistella.
6. Assegura't que la Categoria de l'exercici estigui estrictament restringida a un d'aquests valors: 'Técnica', 'Táctica', 'Tiro', 'Físico', 'Transición', 'Sistemas', 'Defensa'.
7. REQUISIT CRÍTIC DE GRAFISME: El valor de retornar 'boardState' i 'boardStates' ha de contenir la representació gràfica completa del flux de l'exercici. És completament obligatori que dibuixis el tatami/pista sobre el full de dades estructurades per representar visualment la mecànica de l'exercici.
Tots els teus comentaris, instruccions i dades de retorn han d'estar redactats íntegrament en un català correcte, tècnic i formal. Els títols i instruccions han de ser eloqüents.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: image,
      },
    };
    const textPart = {
      text: promptString,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Nom o Títol de l'exercici de bàsquet en català." },
            category: { 
              type: Type.STRING, 
              description: "Categoria de l'exercici. Valors vàlids: Técnica, Táctica, Tiro, Físico, Transición, Sistemas, Defensa." 
            },
            duration: { type: Type.INTEGER, description: "Duració ideal estimada en minuts (enter)." },
            objectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Llista ràpida en català dels 2 o 3 objectius principals."
            },
            description: { type: Type.STRING, description: "Descripció estructurada i entenedora de com s'executa el moviment i les rotacions." },
            setupInstructions: { type: Type.STRING, description: "Disposició o normes de pista." },
            playersNeeded: { type: Type.INTEGER, description: "Mínim nombre de jugadors de pista necessaris." },
            materials: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Indispensables de pista. Exemples: Pilotes, Cons, Petos."
            },
            boardState: {
              type: Type.OBJECT,
              description: "Estat de la pissarra tàctica (grafisme principal). Requerit.",
              properties: {
                courtType: { 
                  type: Type.STRING, 
                  description: "Tipus d'esquema de pista: 'half' (mitja pista) o 'full' (camp sencer)." 
                },
                pins: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "ID únic (Ex: att1, att2, def1, cone1, ball)" },
                      label: { type: Type.STRING, description: "Etiqueta molt curta: '1', '2', '3', 'D1', 'D2', 'C' (con), '🏀' (pilota)." },
                      x: { type: Type.INTEGER, description: "Coordinada en % horitzontal de 0 a 100 de la pista." },
                      y: { type: Type.INTEGER, description: "Coordinada en % vertical de 0 a 100 de la pista." },
                      type: { type: Type.STRING, description: "Tipus d'element: 'attacker', 'defender', 'ball', 'cone'." }
                    },
                    required: ["id", "label", "x", "y", "type"]
                  },
                  description: "Xips o fitxes de colors posicionats a sobre de la pista."
                },
                paths: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "ID de fletxa (Ex: path1)" },
                      points: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            x: { type: Type.INTEGER },
                            y: { type: Type.INTEGER }
                          },
                          required: ["x", "y"]
                        },
                        description: "Sèrie de 2 o més punts ordenats definint de fons a fons la direcció del desplaçament."
                      },
                      color: { type: Type.STRING, description: "Color de la fletxa en format hex (#eab308 per talls/desmarques d'atacant, #0ea5e9 per passades, #ef4444 per desplaçament de defensa, #f97316 per bot/driblatge)." },
                      type: { type: Type.STRING, description: "Traç de la fletxa: 'solid' (moure's / desmarca d'atacant), 'dashed' (passar), 'dotted' (moure's en defensa), 'zigzag' (botar o driblar)." }
                    },
                    required: ["id", "points", "color", "type"]
                  },
                  description: "Fletxes de passades, talls o desplaçaments del grafisme."
                }
              },
              required: ["courtType", "pins", "paths"]
            },
            boardStates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  courtType: { type: Type.STRING },
                  pins: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        x: { type: Type.INTEGER },
                        y: { type: Type.INTEGER },
                        type: { type: Type.STRING }
                      },
                      required: ["id", "label", "x", "y", "type"]
                    }
                  },
                  paths: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        points: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              x: { type: Type.INTEGER },
                              y: { type: Type.INTEGER }
                            },
                            required: ["x", "y"]
                          }
                        },
                        color: { type: Type.STRING, description: "Color de la fletxa en format hex (#eab308 per talls, #0ea5e9 per passades, #ef4444 per defenses, #f97316 per bot/driblatge)." },
                        type: { type: Type.STRING, description: "Traç de la fletxa: 'solid' (moure's / d'atac), 'dashed' (passades), 'dotted' (moure's defensiu), 'zigzag' (botar o driblar)." }
                      },
                      required: ["id", "points", "color", "type"]
                    }
                  }
                },
                required: ["courtType", "pins", "paths"]
              },
              description: "Array de fases per exercicis complexos. Si només té 1 fase, incloreu un únic element que coincideixi amb 'boardState'."
            }
          },
          required: ["title", "category", "duration", "objectives", "description", "setupInstructions", "playersNeeded", "materials", "boardState", "boardStates"]
        }
      }
    });

    const parsedDrill = JSON.parse(response.text || "{}");
    res.json({ drill: parsedDrill });
  } catch (error: any) {
    console.error("Error analitzant imatge d'exercici amb Gemini:", error);
    res.status(500).json({ error: error?.message || "Error processant la informació." });
  }
});

// Shared sessions mapping for ultra-short QR Codes
const sharedSessions = new Map<string, { payload: string; timestamp: number }>();

// Clean up shared sessions periodically (older than 24 hours)
setInterval(() => {
  const now = Date.now();
  for (const [code, item] of sharedSessions.entries()) {
    if (now - item.timestamp > 24 * 60 * 60 * 1000) {
      sharedSessions.delete(code);
    }
  }
}, 3600000);

// Endpoint to generate a short-coded shared session link
app.post("/api/share-session", (req, res) => {
  const { payload } = req.body;
  if (!payload) {
    return res.status(400).json({ error: "Falta el 'payload' de la sessió." });
  }

  const generateShortCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  let code = generateShortCode();
  let attempts = 0;
  while (sharedSessions.has(code) && attempts < 50) {
    code = generateShortCode();
    attempts++;
  }

  sharedSessions.set(code, {
    payload: typeof payload === "string" ? payload : JSON.stringify(payload),
    timestamp: Date.now()
  });

  console.log(`[SessionSync] Saved shared session under short code: ${code}`);
  res.json({ success: true, code });
});

// Endpoint to fetch content of a short-coded shared session
app.get("/api/get-shared-session", (req, res) => {
  const code = (req.query.code as string || "").trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ error: "Falta el codi de la sessió compartida (code)" });
  }

  const item = sharedSessions.get(code);
  if (!item) {
    return res.status(404).json({ error: "La sessió no existeix o ha caducat" });
  }

  try {
    const parsedPayload = JSON.parse(item.payload);
    res.json({ payload: parsedPayload });
  } catch (err) {
    res.status(500).json({ error: "Error en parsejar la sessió emmagatzemada" });
  }
});

// Pairs for mobile-to-desktop photo transfer
const mobileUploads = new Map<string, { image: string; mimeType: string; timestamp: number; drill?: any }>();

// Clean up uploads older than 10 minutes periodically
setInterval(() => {
  const now = Date.now();
  for (const [code, item] of mobileUploads.entries()) {
    if (now - item.timestamp > 10 * 60 * 1000) {
      mobileUploads.delete(code);
    }
  }
}, 60000);

// Endpoint for mobile to send photo and optional pre-analyzed drill
app.post("/api/upload-from-mobile", (req, res) => {
  const { code, image, mimeType, drill } = req.body;
  if (!code || !image || !mimeType) {
    return res.status(400).json({ error: "Falten paràmetres 'code', 'image' o 'mimeType'" });
  }
  
  // Save with current timestamp
  mobileUploads.set(code.trim().toUpperCase(), {
    image,
    mimeType,
    drill,
    timestamp: Date.now()
  });
  
  console.log(`[MobileSync] Photo and/or drill uploaded successfully for pairing code: ${code}`);
  res.json({ success: true, message: "Foto rebuda correctament al servidor!" });
});

// Endpoint for desktop to poll and fetch photo
app.get("/api/check-mobile-upload", (req, res) => {
  const code = (req.query.code as string || "").trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ error: "Falta el codi de vinculació" });
  }
  
  const item = mobileUploads.get(code);
  if (item) {
    // Return image, mimeType and drill, then remove to prevent duplicate consumption
    mobileUploads.delete(code);
    return res.json({ 
      status: "found", 
      image: item.image, 
      mimeType: item.mimeType, 
      drill: item.drill 
    });
  }
  
  res.json({ status: "pending" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Fullstack] Server running on http://localhost:${PORT}`);
  });
}

startServer();
