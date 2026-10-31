import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { MatchAnnotation } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAxpJxHal2pfwthSxfqB4YIwl0-gcFmRIc",
  authDomain: "majestic-bison-gb34d.firebaseapp.com",
  projectId: "majestic-bison-gb34d",
  storageBucket: "majestic-bison-gb34d.firebasestorage.app",
  messagingSenderId: "299494806548",
  appId: "1:299494806548:web:23286ad228c4792e868301"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-planificadordeba-e08a4fe8-1e14-4fe1-a1da-a05b4b2b9893");

export interface CoachProfile {
  name: string;
  email: string;
  team: string;
  level: string;
  avatar: string;
}

export const DEFAULT_SYNC_CODE = 'PINETY-JUNIORA';
export const DEFAULT_STATS_SYNC_CODE = 'PINETY-JUNIOR-STATS';

export interface SyncData {
  drills: any[];
  weeklyPlans: any[];
  selectedTeam?: 'junior_a' | 'senior';
  selectedWeeklyPlanId: string;
  selectedSessionId: string;
  completions: any[];
  favoriteDrillIds: string[];
  updatedAt: string;
  syncCode: string;
  coachProfile?: CoachProfile;
  players?: any[];
  sessionTemplates?: any[];
  baremosConfig?: any[];
}

// Function to generate a random 6-character alphanumeric code
export function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Readable chars (no O/0, I/1)
  let code = 'PINETY-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Save application state to Firestore and return the exact timestamp string
export async function saveToCloud(syncCode: string, data: Omit<SyncData, 'updatedAt' | 'syncCode'>): Promise<string> {
  const cleanCode = (syncCode || DEFAULT_SYNC_CODE).trim().toUpperCase();
  const updatedAt = new Date().toISOString();
  // Deep clone and clean all undefined properties so Firestore never rejects the payload
  const cleanData = JSON.parse(JSON.stringify({
    ...data,
    syncCode: cleanCode,
    updatedAt
  }));

  // 1. Save to Firestore
  const firestorePromise = (async () => {
    try {
      const docRef = doc(db, 'syncs', cleanCode);
      await setDoc(docRef, cleanData);
    } catch (err) {
      console.warn('[CloudSync] Firestore setDoc error:', err);
    }
  })();

  // 2. Save to server API cache backup
  const serverPromise = (async () => {
    try {
      await fetch('/api/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncCode: cleanCode, data: cleanData })
      });
    } catch (e) {
      console.warn('[CloudSync] Server backup sync error:', e);
    }
  })();

  await Promise.allSettled([firestorePromise, serverPromise]);
  return updatedAt;
}

// Retrieve application state from Firestore or backend fallback
export async function loadFromCloud(syncCode: string): Promise<SyncData | null> {
  const cleanCode = (syncCode || DEFAULT_SYNC_CODE).trim().toUpperCase();
  
  // 1. Try Firestore direct
  try {
    const docRef = doc(db, 'syncs', cleanCode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SyncData;
      // Also cache to server in background
      fetch('/api/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncCode: cleanCode, data })
      }).catch(() => {});
      return data;
    }
  } catch (err) {
    console.warn("[CloudSync] Firestore getDoc error, checking server backup API:", err);
  }

  // 2. Fallback to server API
  try {
    const resp = await fetch(`/api/sync-state?code=${encodeURIComponent(cleanCode)}`);
    if (resp.ok) {
      const resJson = await resp.json();
      if (resJson && resJson.data) {
        return resJson.data as SyncData;
      }
    }
  } catch (e) {
    console.warn("[CloudSync] Server API backup fetch error:", e);
  }

  return null;
}

// Subscribe to real-time changes of the sync document
export function subscribeToCloud(syncCode: string, callback: (data: SyncData | null) => void) {
  const cleanCode = (syncCode || DEFAULT_SYNC_CODE).trim().toUpperCase();
  const docRef = doc(db, 'syncs', cleanCode);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SyncData);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error("[CloudSync] subscribeToCloud error:", err);
    // On subscription error, try polling server API once
    loadFromCloud(cleanCode).then(data => {
      if (data) callback(data);
    }).catch(() => {});
  });
}

// Format and validate incoming raw match data
export function sanitizeMatchData(raw: any): MatchAnnotation {
  const now = new Date().toISOString();
  return {
    id: raw.id || `match-junior_a-${raw.dateIndex || Date.now()}`,
    dateIndex: raw.dateIndex !== undefined ? raw.dateIndex : Date.now() % 100000,
    team: raw.team || 'junior_a',
    matchDate: raw.matchDate || raw.date || new Date().toLocaleDateString('ca-ES'),
    opponent: raw.opponent || raw.rival || 'CB Manresa Júnior A',
    isHome: raw.isHome !== false,
    ourScore: raw.ourScore !== undefined ? Number(raw.ourScore) : (raw.points || 0),
    opponentScore: raw.opponentScore !== undefined ? Number(raw.opponentScore) : 0,
    generalNotes: raw.generalNotes || raw.notes || '',
    tacticalKeyPoints: Array.isArray(raw.tacticalKeyPoints) ? raw.tacticalKeyPoints : [],
    teamStats: {
      lostPasses: raw.teamStats?.lostPasses || raw.lostPasses || raw.turnovers || 0,
      otherTurnovers: raw.teamStats?.otherTurnovers || 0,
      fg2Made: raw.teamStats?.fg2Made || raw.fg2Made || 0,
      fg2Missed: raw.teamStats?.fg2Missed || raw.fg2Missed || 0,
      fg3Made: raw.teamStats?.fg3Made || raw.fg3Made || 0,
      fg3Missed: raw.teamStats?.fg3Missed || raw.fg3Missed || 0,
      ftMade: raw.teamStats?.ftMade || raw.ftMade || 0,
      ftMissed: raw.teamStats?.ftMissed || raw.ftMissed || 0,
      offRebounds: raw.teamStats?.offRebounds || raw.offRebounds || 0,
      defRebounds: raw.teamStats?.defRebounds || raw.defRebounds || 0,
      steals: raw.teamStats?.steals || raw.steals || 0,
      fouls: raw.teamStats?.fouls || raw.fouls || 0,
      blocks: raw.teamStats?.blocks || raw.blocks || 0
    },
    playerStats: Array.isArray(raw.playerStats) ? raw.playerStats : (Array.isArray(raw.players) ? raw.players : []),
    updatedAt: raw.updatedAt || now
  };
}

// Structure stored in syncs/PINETY-JUNIOR-STATS
export interface MatchStatsCloudPayload {
  channelCode: string;
  matches: MatchAnnotation[];
  lastMatch?: MatchAnnotation;
  updatedAt: string;
}

// Save match stats to cloud (Firestore + server API fallback)
export async function saveMatchStatsToCloud(match: MatchAnnotation, channelCode: string = DEFAULT_STATS_SYNC_CODE): Promise<string> {
  const cleanCode = (channelCode || DEFAULT_STATS_SYNC_CODE).trim().toUpperCase();
  const sanitized = sanitizeMatchData(match);
  const now = new Date().toISOString();

  // 1. Get current matches from cloud to append/update
  let currentMatches: MatchAnnotation[] = [];
  try {
    currentMatches = await loadMatchStatsFromCloud(cleanCode);
  } catch (e) {}

  const updatedMatches = [
    sanitized,
    ...currentMatches.filter(m => m.id !== sanitized.id && m.dateIndex?.toString() !== sanitized.dateIndex?.toString())
  ];

  const payload: MatchStatsCloudPayload = {
    channelCode: cleanCode,
    matches: updatedMatches,
    lastMatch: sanitized,
    updatedAt: now
  };

  const cleanPayload = JSON.parse(JSON.stringify(payload));

  // Firestore write
  const firestorePromise = (async () => {
    try {
      const docRef = doc(db, 'syncs', cleanCode);
      await setDoc(docRef, cleanPayload, { merge: true });
    } catch (err) {
      console.warn('[MatchStatsSync] Firestore write failed:', err);
    }
  })();

  // Server backup write
  const serverPromise = (async () => {
    try {
      await fetch('/api/sync-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelCode: cleanCode, match: sanitized })
      });
    } catch (err) {
      console.warn('[MatchStatsSync] Server backup write failed:', err);
    }
  })();

  await Promise.allSettled([firestorePromise, serverPromise]);
  return now;
}

// Load match stats from cloud
export async function loadMatchStatsFromCloud(channelCode: string = DEFAULT_STATS_SYNC_CODE): Promise<MatchAnnotation[]> {
  const cleanCode = (channelCode || DEFAULT_STATS_SYNC_CODE).trim().toUpperCase();

  // 1. Try Firestore direct
  try {
    const docRef = doc(db, 'syncs', cleanCode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.matches)) {
        return data.matches.map(sanitizeMatchData);
      } else if (data && data.lastMatch) {
        return [sanitizeMatchData(data.lastMatch)];
      }
    }
  } catch (e) {
    console.warn('[MatchStatsSync] Firestore load failed, trying server API:', e);
  }

  // 2. Try Server API
  try {
    const resp = await fetch(`/api/sync-match?channelCode=${encodeURIComponent(cleanCode)}`);
    if (resp.ok) {
      const json = await resp.json();
      if (json && Array.isArray(json.matches)) {
        return json.matches.map(sanitizeMatchData);
      }
    }
  } catch (e) {
    console.warn('[MatchStatsSync] Server API fetch failed:', e);
  }

  return [];
}

// Subscribe to live match statistics updates in real time
export function subscribeToMatchStats(
  channelCode: string = DEFAULT_STATS_SYNC_CODE, 
  callback: (matches: MatchAnnotation[]) => void
): () => void {
  const cleanCode = (channelCode || DEFAULT_STATS_SYNC_CODE).trim().toUpperCase();
  const docRef = doc(db, 'syncs', cleanCode);

  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.matches) && data.matches.length > 0) {
        callback(data.matches.map(sanitizeMatchData));
      } else if (data && data.lastMatch) {
        callback([sanitizeMatchData(data.lastMatch)]);
      }
    }
  }, (err) => {
    console.warn('[MatchStatsSync] Live subscription error:', err);
    // On subscription fallback, poll server once
    loadMatchStatsFromCloud(cleanCode).then(matches => {
      if (matches.length > 0) callback(matches);
    }).catch(() => {});
  });
}

