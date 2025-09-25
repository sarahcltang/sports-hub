export type Sport = 'MLB' | 'NBA' | 'EPL' | 'NFL';

export type GameStatus =
  | 'scheduled'
  | 'in_progress'
  | 'final'
  | 'postponed'
  | 'canceled';

export interface Team {
  id: string; // stable local id we define
  name: string;
  shortName: string;
  sport: Sport;
  league?: string;
  // Map of upstream provider identifiers, e.g. { mlb: '119' }
  sourceIds?: Record<string, string>;
}

export interface ScoreSide {
  team: Team;
  score: number | null; // null before game starts
}

export interface LiveGameInfo {
  currentPitcher?: {
    name: string;
    team: string;
  };
  currentBatter?: {
    name: string;
    team: string;
    inning: string;
    outs: number;
    balls: number;
    strikes: number;
  };
  inning?: string;
  inningState?: string; // "Top", "Bottom", etc.
}

export interface Game {
  id: string;
  sport: Sport;
  startsAtISO: string; // ISO timestamp
  status: GameStatus;
  home: ScoreSide;
  away: ScoreSide;
  venue?: string;
  url?: string; // optional reference link
  liveInfo?: LiveGameInfo; // additional live game details
}

export interface CommentaryItem {
  id: string;
  text: string;
  author: string;
  createdAtISO: string;
  url?: string;
  source: 'twitter';
}

export interface DateRange {
  fromISO: string; // inclusive
  toISO: string;   // inclusive
}

export type ProviderResult<T> = { ok: true; data: T } | { ok: false; error: string };
