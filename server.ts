import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Allow high limits for receipt of JSON payloads
app.use(express.json({ limit: "15mb" }));

// Endpoint for AI Coach Advice based on match annotations
app.post("/api/ai/coach-advice", async (req, res) => {
  try {
    const { matchAnnotation, microcycleName } = req.body;
    if (!matchAnnotation) {
      return res.status(400).json({ error: "Falten les dades del partit." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY no trobada. Configura la clau d'API a la secció de Secrets." 
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const opponent = matchAnnotation.opponent || "Rival no especificat";
    const location = matchAnnotation.isHome ? "Local 🏠" : "Visitant ✈️";
    const score = (matchAnnotation.ourScore !== undefined && matchAnnotation.opponentScore !== undefined)
      ? `${matchAnnotation.ourScore} - ${matchAnnotation.opponentScore}`
      : "Sense resultat enregistrat";

    const qNotes = matchAnnotation.quarterNotes || {};
    const keyPoints = (matchAnnotation.tacticalKeyPoints || []).join("\n• ") || "Cap especificat";

    const prompt = `Ets un Entrenador Superior de Bàsquet i Director Tècnic d'alta competició de la Categoria Junior A a la Federació Catalana de Basquetbol (FCBQ).
Analitza les següents anotacions d'un partit disputat per l'equip i recomana idees concretes, tasques i un enfocament per al pla d'entrenament de la setmana.

DADES DEL PARTIT:
- Microcicle: ${microcycleName || "Microcicle Junior A"}
- Rival: ${opponent} (${location})
- Resultat Final: ${score}
- 1r Quart: ${qNotes.q1 || "Sense dades"}
- 2n Quart: ${qNotes.q2 || "Sense dades"}
- 3r Quart: ${qNotes.q3 || "Sense dades"}
- 4t Quart: ${qNotes.q4 || "Sense dades"}
- Pròrroga: ${qNotes.ot || "Sense dades"}
- Observacions Generals: ${matchAnnotation.generalNotes || "Cap observació general"}
- Punts tàctics remarcats pel cos tècnic:
• ${keyPoints}

Siusplau, respon en CATALÀ amb un estil professional, directe i motivador per a un equip d'edat Junior A (16-18 anys). Estructura la resposta en 4 seccions clares amb títols en negreta i emojis:

1. 📊 Diagnòstic Tàctic del Partit:
(Anàlisi breu dels punts forts i les fuites tàctiques/físiques observades).

2. 🎯 Enfocament dels Entrenaments de la Setmana (Dimarts i Dijous):
(Els 3 objectius prioritaris a treballar a la pista).

3. 🏀 Exercicis i Situacions de Joc Recomanades:
(Proposa 3 exercicis pràctics detallant nom de l'exercici, format ex: 3v2 o 4v4, i què s'ha d'exigir als jugadors).

4. 💬 Consell de Gestió del Vestidor (Psicologia Junior A):
(Com comunicar aquests ajustos als jugadors de forma constructiva).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "Ets un mentor d'entrenadors de bàsquet de màxim nivell a Catalunya. Dona respostes pràctiques, tàctiques i motivadores.",
        temperature: 0.7,
      }
    });

    const advice = response.text || "No s'ha pogut obtenir la resposta de la IA.";
    res.json({ advice });
  } catch (err: any) {
    console.error("[GeminiCoachAdvice] Error:", err);
    res.status(500).json({ error: err.message || "Error al comunicar amb la IA de Gemini." });
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
