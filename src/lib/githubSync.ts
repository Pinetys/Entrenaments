import { MatchAnnotation } from '../types';

export const DEFAULT_GITHUB_REPO = 'Pinetys/Entrenaments';
export const DEFAULT_GITHUB_BRANCH = 'main';
export const DEFAULT_GITHUB_FILE = '.matches_cache.json';

const STORAGE_KEY_REPO = 'basket_planner_github_repo';
const STORAGE_KEY_BRANCH = 'basket_planner_github_branch';
const STORAGE_KEY_FILE = 'basket_planner_github_file';
const STORAGE_KEY_LAST_SYNC = 'basket_planner_github_last_synced';
const STORAGE_KEY_AUTO_SYNC = 'basket_planner_github_auto_sync';

export interface GitHubSyncConfig {
  repo: string;
  branch: string;
  filePath: string;
  autoSyncOnOpen: boolean;
  lastSynced: string | null;
}

export function getGitHubSyncConfig(): GitHubSyncConfig {
  try {
    return {
      repo: localStorage.getItem(STORAGE_KEY_REPO) || DEFAULT_GITHUB_REPO,
      branch: localStorage.getItem(STORAGE_KEY_BRANCH) || DEFAULT_GITHUB_BRANCH,
      filePath: localStorage.getItem(STORAGE_KEY_FILE) || DEFAULT_GITHUB_FILE,
      autoSyncOnOpen: localStorage.getItem(STORAGE_KEY_AUTO_SYNC) !== 'false',
      lastSynced: localStorage.getItem(STORAGE_KEY_LAST_SYNC)
    };
  } catch (e) {
    return {
      repo: DEFAULT_GITHUB_REPO,
      branch: DEFAULT_GITHUB_BRANCH,
      filePath: DEFAULT_GITHUB_FILE,
      autoSyncOnOpen: true,
      lastSynced: null
    };
  }
}

export function saveGitHubSyncConfig(config: Partial<GitHubSyncConfig>): GitHubSyncConfig {
  try {
    if (config.repo !== undefined) localStorage.setItem(STORAGE_KEY_REPO, config.repo.trim());
    if (config.branch !== undefined) localStorage.setItem(STORAGE_KEY_BRANCH, config.branch.trim());
    if (config.filePath !== undefined) localStorage.setItem(STORAGE_KEY_FILE, config.filePath.trim());
    if (config.autoSyncOnOpen !== undefined) localStorage.setItem(STORAGE_KEY_AUTO_SYNC, String(config.autoSyncOnOpen));
    if (config.lastSynced !== undefined && config.lastSynced !== null) {
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, config.lastSynced);
    }
  } catch (e) {}
  return getGitHubSyncConfig();
}

export function normalizeGitHubMatch(raw: any, index: number): MatchAnnotation {
  const ts = raw.teamStats || {};
  return {
    id: raw.id || `github-match-${raw.dateIndex || index}-${Date.now()}`,
    dateIndex: raw.dateIndex !== undefined ? raw.dateIndex : (index + 1),
    team: 'junior_a',
    matchDate: raw.matchDate || raw.date || new Date().toLocaleDateString('ca-ES'),
    opponent: raw.opponent || raw.rival || 'Rival Júnior A (GitHub)',
    isHome: raw.isHome !== false,
    ourScore: raw.ourScore !== undefined ? Number(raw.ourScore) : (raw.points || 0),
    opponentScore: raw.opponentScore !== undefined ? Number(raw.opponentScore) : 0,
    generalNotes: raw.generalNotes || raw.notes || 'Partit sincronitzat automàticament des del repositori de GitHub.',
    teamStats: {
      lostPasses: ts.lostPasses || raw.lostPasses || raw.turnovers || 0,
      otherTurnovers: ts.otherTurnovers || 0,
      fg2Made: ts.fg2Made || raw.fg2Made || 0,
      fg2Missed: ts.fg2Missed || raw.fg2Missed || 0,
      fg3Made: ts.fg3Made || raw.fg3Made || 0,
      fg3Missed: ts.fg3Missed || raw.fg3Missed || 0,
      ftMade: ts.ftMade || raw.ftMade || 0,
      ftMissed: ts.ftMissed || raw.ftMissed || 0,
      offRebounds: ts.offRebounds || raw.offRebounds || 0,
      defRebounds: ts.defRebounds || raw.defRebounds || 0,
      steals: ts.steals || raw.steals || 0,
      fouls: ts.fouls || raw.fouls || 0,
      blocks: ts.blocks || raw.blocks || 0
    },
    playerStats: raw.playerStats || raw.players || []
  };
}

export interface GitHubSyncResult {
  success: boolean;
  repo: string;
  branch: string;
  fileFound: string;
  count: number;
  matches: MatchAnnotation[];
  syncedAt: string;
  source: 'backend' | 'direct';
}

export async function fetchMatchesFromGitHub(
  customConfig?: Partial<GitHubSyncConfig>
): Promise<GitHubSyncResult> {
  const config = { ...getGitHubSyncConfig(), ...customConfig };
  const repo = config.repo || DEFAULT_GITHUB_REPO;
  const branch = config.branch || DEFAULT_GITHUB_BRANCH;
  const filePath = config.filePath || DEFAULT_GITHUB_FILE;

  // 1. First try our server proxy endpoint
  try {
    const url = `/api/github/sync-stats?repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}&filePath=${encodeURIComponent(filePath)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        const normalized = data.matches.map(normalizeGitHubMatch);
        const syncedAt = data.syncedAt || new Date().toISOString();
        saveGitHubSyncConfig({ lastSynced: syncedAt });
        return {
          success: true,
          repo,
          branch,
          fileFound: data.fileFound || filePath,
          count: normalized.length,
          matches: normalized,
          syncedAt,
          source: 'backend'
        };
      }
    }
  } catch (err) {
    console.warn('[GitHubSync Client] Server proxy fetch error, trying direct raw fallback:', err);
  }

  // 2. Direct Raw GitHub fallback (CORS is supported by GitHub Raw)
  const candidateFiles = filePath 
    ? [filePath, '.matches_cache.json', 'matches.json', 'junior_matches.json'] 
    : ['.matches_cache.json', 'matches.json', 'junior_matches.json', 'stats.json'];

  for (const fileName of candidateFiles) {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${fileName}?t=${Date.now()}`;
      const res = await fetch(rawUrl);
      if (res.ok) {
        const text = await res.text();
        const json = JSON.parse(text);
        let rawMatches: any[] = [];
        if (Array.isArray(json)) {
          rawMatches = json;
        } else if (json['PINETY-JUNIOR-STATS'] && Array.isArray(json['PINETY-JUNIOR-STATS'])) {
          rawMatches = json['PINETY-JUNIOR-STATS'];
        } else if (json.matches && Array.isArray(json.matches)) {
          rawMatches = json.matches;
        } else if (typeof json === 'object') {
          const values = Object.values(json).filter(v => Array.isArray(v)) as any[][];
          if (values.length > 0) rawMatches = values.flat();
          else if (json.opponent || json.teamStats) rawMatches = [json];
        }

        const normalized = rawMatches.map(normalizeGitHubMatch);
        const syncedAt = new Date().toISOString();
        saveGitHubSyncConfig({ lastSynced: syncedAt });
        return {
          success: true,
          repo,
          branch,
          fileFound: fileName,
          count: normalized.length,
          matches: normalized,
          syncedAt,
          source: 'direct'
        };
      }
    } catch (e) {
      // try next
    }
  }

  throw new Error(`No s'ha pogut carregar cap fitxer de partits des de GitHub (${repo} @ ${branch}). Comprova que el repositori sigui públic o que el fitxer existeixi.`);
}
