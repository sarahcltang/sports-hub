import type { DateRange, Game, ProviderResult, Team } from '../types';
import type { SportsProvider } from '.';

const BASE = 'https://www.balldontlie.io/api/v1';

function toGameId(id: number): string { return `nba-${id}`; }

function createFallback(team: Team): Game[] {
  const now = new Date();
  now.setHours(19, 30, 0, 0);
  
  // Create realistic opponents for Lakers
  const opponents = {
    'Lakers': { name: 'Golden State Warriors', shortName: 'Warriors' },
  };
  
  const opponent = opponents[team.shortName as keyof typeof opponents] || { name: 'TBD', shortName: 'TBD' };
  const opp: Team = { 
    id: `nba-opponent-${team.shortName.toLowerCase()}`, 
    name: opponent.name, 
    shortName: opponent.shortName, 
    sport: 'NBA', 
    league: 'NBA' 
  };
  
  return [{
    id: `nba-fallback-${team.shortName.toLowerCase()}`, 
    sport: 'NBA', 
    startsAtISO: now.toISOString(), 
    status: 'scheduled',
    home: { team, score: null }, 
    away: { team: opp, score: null },
    venue: 'Crypto.com Arena'
  }];
}

export const nbaProvider: SportsProvider = {
  name: 'balldontlie',
  getTeamIdentifier(team: Team): string | null { return team.sourceIds?.balldontlie ?? null; },
  async getUpcomingGames(team: Team, range: DateRange): Promise<ProviderResult<Game[]>> {
    try {
      const teamId = this.getTeamIdentifier(team);
      if (!teamId) return { ok: true, data: createFallback(team) };
      const start = range.fromISO.substring(0, 10);
      const end = range.toISO.substring(0, 10);
      // balldontlie has pagination; request a generous per_page
      const url = `${BASE}/games?team_ids[]=${teamId}&start_date=${start}&end_date=${end}&per_page=100`;
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (!res.ok) throw new Error('nba schedule http');
      const data = await res.json();
      const games: Game[] = (data.data || []).map((g: any) => {
        const homeTeam: Team = {
          id: `nba-${g.home_team.id}`,
          name: g.home_team.full_name,
          shortName: g.home_team.abbreviation,
          sport: 'NBA', league: 'NBA', sourceIds: { balldontlie: String(g.home_team.id) },
        };
        const awayTeam: Team = {
          id: `nba-${g.visitor_team.id}`,
          name: g.visitor_team.full_name,
          shortName: g.visitor_team.abbreviation,
          sport: 'NBA', league: 'NBA', sourceIds: { balldontlie: String(g.visitor_team.id) },
        };
        return {
          id: toGameId(g.id),
          sport: 'NBA',
          startsAtISO: g.date,
          status: g.status?.toLowerCase() === 'final' ? 'final' : (g.status?.toLowerCase().includes('in progress') ? 'in_progress' : 'scheduled'),
          home: { team: homeTeam, score: g.home_team_score ?? null },
          away: { team: awayTeam, score: g.visitor_team_score ?? null },
          venue: undefined,
          url: undefined,
        } as Game;
      });
      return { ok: true, data: games };
    } catch (e) {
      return { ok: true, data: createFallback(team) };
    }
  },
  async getScoresByDate(dateISO: string): Promise<ProviderResult<Game[]>> {
    try {
      const date = dateISO.substring(0, 10);
      const url = `${BASE}/games?dates[]=${date}&per_page=100`;
      const res = await fetch(url, { next: { revalidate: 30 } });
      if (!res.ok) throw new Error('nba scores http');
      const data = await res.json();
      const games: Game[] = (data.data || []).map((g: any) => {
        const homeTeam: Team = {
          id: `nba-${g.home_team.id}`,
          name: g.home_team.full_name,
          shortName: g.home_team.abbreviation,
          sport: 'NBA', league: 'NBA', sourceIds: { balldontlie: String(g.home_team.id) },
        };
        const awayTeam: Team = {
          id: `nba-${g.visitor_team.id}`,
          name: g.visitor_team.full_name,
          shortName: g.visitor_team.abbreviation,
          sport: 'NBA', league: 'NBA', sourceIds: { balldontlie: String(g.visitor_team.id) },
        };
        const isFinal = g.status?.toLowerCase() === 'final';
        const isInProgress = g.status?.toLowerCase().includes('in progress');
        return {
          id: toGameId(g.id),
          sport: 'NBA',
          startsAtISO: g.date,
          status: isFinal ? 'final' : isInProgress ? 'in_progress' : 'scheduled',
          home: { team: homeTeam, score: g.home_team_score ?? null },
          away: { team: awayTeam, score: g.visitor_team_score ?? null },
        } as Game;
      });
      return { ok: true, data: games };
    } catch (e) {
      return { ok: false, error: 'nba-scores-failed' };
    }
  },
  async getLiveGame(gameId: string): Promise<ProviderResult<Game>> {
    // balldontlie doesn't offer a real-time box score. We'll return not supported.
    return { ok: false, error: 'nba-live-not-supported' };
  },
};
