import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Allow high limits for receipt of JSON payloads
app.use(express.json({ limit: "15mb" }));

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
