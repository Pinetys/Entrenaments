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
  const docRef = doc(db, 'syncs', syncCode);
  const updatedAt = new Date().toISOString();
  await setDoc(docRef, {
    ...data,
    syncCode,
    updatedAt
  });
  return updatedAt;
}

// Retrieve application state from Firestore
export async function loadFromCloud(syncCode: string): Promise<SyncData | null> {
  const docRef = doc(db, 'syncs', syncCode);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as SyncData;
  }
  return null;
}

// Subscribe to real-time changes of the sync document
export function subscribeToCloud(syncCode: string, callback: (data: SyncData | null) => void) {
  const docRef = doc(db, 'syncs', syncCode);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SyncData);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error("subscribeToCloud error:", err);
  });
}
