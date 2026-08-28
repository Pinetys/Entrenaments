import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

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

export interface SyncData {
  drills: any[];
  weeklyPlans: any[];
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
