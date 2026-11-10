import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Allow high limits for receipt of JSON payloads
app.use(express.json({ limit: "15mb" }));

// Enable CORS so external statistics apps (e.g. 074a2bc9-59ce-468c-af9e-bc747b6122da) can send live match data
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

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
    const ts = matchAnnotation.teamStats || {};

    const teamStatsSummary = `
- Pases perduts (bad passes): ${ts.lostPasses || 0}
- Altres pèrdues de pilota: ${ts.otherTurnovers || 0} (Total Pèrdues: ${(ts.lostPasses || 0) + (ts.otherTurnovers || 0)})
- Tirs de 2 anotats/fallats: ${ts.fg2Made || 0} / ${ts.fg2Missed || 0} (${(ts.fg2Made || 0) + (ts.fg2Missed || 0) > 0 ? (((ts.fg2Made || 0) / ((ts.fg2Made || 0) + (ts.fg2Missed || 0))) * 100).toFixed(1) + '%' : 'N/A'})
- Tirs de 3 anotats/fallats: ${ts.fg3Made || 0} / ${ts.fg3Missed || 0} (${(ts.fg3Made || 0) + (ts.fg3Missed || 0) > 0 ? (((ts.fg3Made || 0) / ((ts.fg3Made || 0) + (ts.fg3Missed || 0))) * 100).toFixed(1) + '%' : 'N/A'})
- Tirs Lliures anotats/fallats: ${ts.ftMade || 0} / ${ts.ftMissed || 0} (${(ts.ftMade || 0) + (ts.ftMissed || 0) > 0 ? (((ts.ftMade || 0) / ((ts.ftMade || 0) + (ts.ftMissed || 0))) * 100).toFixed(1) + '%' : 'N/A'})
- Rebots Ofensius: ${ts.offRebounds || 0} | Defensius: ${ts.defRebounds || 0} (Total: ${(ts.offRebounds || 0) + (ts.defRebounds || 0)})
- Recuperacions de pilota: ${ts.steals || 0} | Faltes personals: ${ts.fouls || 0} | Taps: ${ts.blocks || 0}`;

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
- ESTADÍSTIQUES I PERCENTATGES DE L'EQUIP:
${teamStatsSummary}
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

// In-memory and file-backed cache for cross-device state synchronization
const syncStateCache = new Map<string, any>();
const SYNC_CACHE_FILE = path.join(process.cwd(), ".sync_cache.json");
const RECOVERED_STATE_FILE = path.join(process.cwd(), "src", "data", "recoveredState.json");

// Helper to get base recovered state
const getBaseRecoveredState = () => {
  try {
    if (fs.existsSync(RECOVERED_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(RECOVERED_STATE_FILE, "utf-8"));
    }
  } catch (e) {
    console.warn("[SyncState] Could not load recovered state template:", e);
  }
  return null;
};

// Load initial sync cache from disk if available
try {
  if (fs.existsSync(SYNC_CACHE_FILE)) {
    const raw = fs.readFileSync(SYNC_CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    Object.keys(parsed).forEach(k => syncStateCache.set(k, parsed[k]));
    console.log(`[SyncState] Loaded ${syncStateCache.size} synced documents from cache.`);
  }
} catch (e) {
  console.warn("[SyncState] Could not load sync cache file:", e);
}

// If cache is empty or missing standard keys, populate from recovered state
const baseState = getBaseRecoveredState();
if (baseState) {
  const standardCodes = ["PINETY-GA5Z", "PINETY-JUNIORA", "PINETY-DJAG", "PINETY-KCSA", "PINETY-734D", "PINETY-DEFAULT", "DEFAULT"];
  standardCodes.forEach(code => {
    if (!syncStateCache.has(code)) {
      syncStateCache.set(code, {
        ...baseState,
        syncCode: code,
        updatedAt: baseState.updatedAt || new Date().toISOString()
      });
    }
  });
}

const persistSyncCache = () => {
  try {
    const obj: Record<string, any> = {};
    syncStateCache.forEach((v, k) => { obj[k] = v; });
    fs.writeFileSync(SYNC_CACHE_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (e) {
    console.warn("[SyncState] Could not save sync cache file:", e);
  }
};

// POST endpoint to save sync state
app.post("/api/sync-state", (req, res) => {
  try {
    const { syncCode, data } = req.body;
    if (!syncCode || !data) {
      return res.status(400).json({ error: "Falten syncCode o data" });
    }
    const cleanCode = syncCode.trim().toUpperCase();
    syncStateCache.set(cleanCode, data);
    persistSyncCache();
    console.log(`[SyncState] Updated state for code: ${cleanCode} at ${data.updatedAt || new Date().toISOString()}`);
    res.json({ success: true, syncCode: cleanCode, updatedAt: data.updatedAt });
  } catch (err: any) {
    console.error("[SyncState POST] Error:", err);
    res.status(500).json({ error: err.message || "Error al desar l'estat sincronitzat." });
  }
});

// GET endpoint to fetch sync state with robust fallback
app.get("/api/sync-state", (req, res) => {
  try {
    const code = (req.query.code as string || "").trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: "Falta el paràmetre 'code'" });
    }
    let data = syncStateCache.get(code);
    if (!data) {
      // Fallback to standard room state if code is unrecognized
      data = syncStateCache.get("PINETY-KCSA") || syncStateCache.get("PINETY-JUNIORA") || getBaseRecoveredState();
    }
    if (!data) {
      return res.status(404).json({ error: "No hi ha dades sincronitzades per aquest codi" });
    }
    res.json({ success: true, syncCode: code, data });
  } catch (err: any) {
    console.error("[SyncState GET] Error:", err);
    res.status(500).json({ error: err.message || "Error al recuperar l'estat sincronitzat." });
  }
});

// Live match statistics cache for automatic syncing with the Junior A stats app
const matchStatsCache = new Map<string, any[]>();
const MATCHES_CACHE_FILE = path.join(process.cwd(), ".matches_cache.json");

// Load initial matches cache
try {
  if (fs.existsSync(MATCHES_CACHE_FILE)) {
    const raw = fs.readFileSync(MATCHES_CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    Object.keys(parsed).forEach(k => matchStatsCache.set(k, parsed[k]));
  }
} catch (e) {
  console.warn("[MatchStats] Could not load matches cache:", e);
}

const persistMatchesCache = () => {
  try {
    const obj: Record<string, any> = {};
    matchStatsCache.forEach((v, k) => { obj[k] = v; });
    fs.writeFileSync(MATCHES_CACHE_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (e) {}
};

// POST endpoint to receive match statistics automatically from external stats apps or webhooks
app.post("/api/sync-match", (req, res) => {
  try {
    const body = req.body || {};
    const channelCode = (body.channelCode || req.query.channelCode || "PINETY-JUNIOR-STATS").toString().trim().toUpperCase();
    
    // Support either { match: {...} }, { matches: [...] }, or match object sent directly
    let incomingMatches: any[] = [];
    if (Array.isArray(body.matches)) {
      incomingMatches = body.matches;
    } else if (body.match && typeof body.match === 'object') {
      incomingMatches = [body.match];
    } else if (body.opponent || body.teamStats || body.playerStats) {
      incomingMatches = [body];
    }

    if (incomingMatches.length === 0) {
      return res.status(400).json({ error: "Falten les dades del partit (match o matches)" });
    }

    const current = matchStatsCache.get(channelCode) || [];
    
    // Merge or prepend
    const merged = [...incomingMatches];
    current.forEach(cm => {
      if (!merged.some(im => (im.id && im.id === cm.id) || (im.dateIndex && im.dateIndex === cm.dateIndex) || (im.opponent === cm.opponent && im.matchDate === cm.matchDate))) {
        merged.push(cm);
      }
    });

    matchStatsCache.set(channelCode, merged);
    persistMatchesCache();
    console.log(`[SyncMatch] Received and cached ${incomingMatches.length} match(es) for channel ${channelCode}`);

    res.json({
      success: true,
      channelCode,
      count: merged.length,
      matches: merged,
      updatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[SyncMatch POST] Error:", err);
    res.status(500).json({ error: err.message || "Error al desar les estadístiques del partit." });
  }
});

// GET endpoint to retrieve match statistics
app.get("/api/sync-match", (req, res) => {
  try {
    const channelCode = (req.query.channelCode || "PINETY-JUNIOR-STATS").toString().trim().toUpperCase();
    const matches = matchStatsCache.get(channelCode) || [];
    res.json({
      success: true,
      channelCode,
      count: matches.length,
      matches,
      updatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[SyncMatch GET] Error:", err);
    res.status(500).json({ error: err.message || "Error al recuperar les estadístiques del partit." });
  }
});

// GET endpoint to sync match statistics directly from a GitHub repository
app.get("/api/github/sync-stats", async (req, res) => {
  try {
    const repo = (req.query.repo as string || "Pinetys/Entrenaments").trim();
    const branch = (req.query.branch as string || "main").trim();
    const channelCode = (req.query.channelCode as string || "PINETY-JUNIOR-STATS").trim().toUpperCase();
    const customFilePath = req.query.filePath ? (req.query.filePath as string).trim() : null;

    const candidateFiles = customFilePath 
      ? [customFilePath] 
      : [".matches_cache.json", "matches.json", "junior_matches.json", "stats.json", "junior_stats.json", "data/matches.json"];

    let rawData: any = null;
    let foundFile: string | null = null;

    for (const fileName of candidateFiles) {
      const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${fileName}?t=${Date.now()}`;
      try {
        const response = await fetch(rawUrl, {
          headers: {
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "CoachPinety-GitHubSync"
          }
        });
        if (response.ok) {
          const text = await response.text();
          try {
            rawData = JSON.parse(text);
            foundFile = fileName;
            break;
          } catch (e) {
            console.warn(`[GitHubSync] Could not parse JSON from ${fileName}:`, e);
          }
        }
      } catch (fetchErr) {
        // try next candidate file
      }
    }

    if (!rawData || !foundFile) {
      return res.status(404).json({
        error: `No s'ha trobat cap fitxer de partits a GitHub (${repo} @ ${branch}). S'han buscat: ${candidateFiles.join(', ')}`,
        repo,
        branch,
        searchedFiles: candidateFiles
      });
    }

    // Parse matches from rawData
    let extractedMatches: any[] = [];
    if (Array.isArray(rawData)) {
      extractedMatches = rawData;
    } else if (rawData[channelCode] && Array.isArray(rawData[channelCode])) {
      extractedMatches = rawData[channelCode];
    } else if (rawData.matches && Array.isArray(rawData.matches)) {
      extractedMatches = rawData.matches;
    } else if (typeof rawData === 'object') {
      const allArrayValues = Object.values(rawData).filter(v => Array.isArray(v)) as any[][];
      if (allArrayValues.length > 0) {
        extractedMatches = allArrayValues.flat();
      } else if (rawData.opponent || rawData.teamStats) {
        extractedMatches = [rawData];
      }
    }

    // Merge into local cache
    const current = matchStatsCache.get(channelCode) || [];
    const merged = [...extractedMatches];
    current.forEach(cm => {
      if (!merged.some(im => (im.id && im.id === cm.id) || (im.dateIndex && im.dateIndex === cm.dateIndex) || (im.opponent === cm.opponent && im.matchDate === cm.matchDate))) {
        merged.push(cm);
      }
    });
    matchStatsCache.set(channelCode, merged);
    persistMatchesCache();

    console.log(`[GitHubSync] Successfully synced ${extractedMatches.length} match(es) from GitHub ${repo}/${foundFile}`);

    res.json({
      success: true,
      repo,
      branch,
      fileFound: foundFile,
      count: extractedMatches.length,
      matches: extractedMatches,
      syncedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[GitHubSync GET] Error:", err);
    res.status(500).json({ error: err.message || "Error al sincronitzar des de GitHub." });
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
