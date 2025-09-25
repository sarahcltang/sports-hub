import type { DateRange, Game, ProviderResult, Team, LiveGameInfo } from '../types';
import type { SportsProvider } from '.';

const MLB_API = 'https://statsapi.mlb.com/api/v1';

function toGameId(id: number): string {
  return `mlb-${id}`;
}

function mapStatus(abstractGameState: string, codedGameState: string): Game['status'] {
  if (codedGameState === 'F' || codedGameState === 'O' || abstractGameState === 'Final') return 'final';
  if (abstractGameState === 'Live' || codedGameState === 'I') return 'in_progress';
  if (abstractGameState === 'Preview') return 'scheduled';
  if (codedGameState === 'D') return 'postponed';
  return 'scheduled';
}

async function fetchLiveGameInfo(gamePk: number, teamId: string): Promise<LiveGameInfo | undefined> {
  try {
    const feedUrl = `${MLB_API}/game/${gamePk}/feed/live`;
    const feedRes = await fetch(feedUrl, { next: { revalidate: 10 } });
    if (!feedRes.ok) {
      console.log(`Live feed not available for game ${gamePk}: ${feedRes.status}`);
      return undefined;
    }
    
    const feedData = await feedRes.json();
    const liveInfo: LiveGameInfo = {};
    
    // Get current play information
    const currentPlay = feedData?.liveData?.plays?.currentPlay;
    if (currentPlay) {
      // Current pitcher
      if (currentPlay.matchup?.pitcher) {
        const pitcher = currentPlay.matchup.pitcher;
        liveInfo.currentPitcher = {
          name: pitcher.fullName,
          team: pitcher.id === teamId ? 'Home' : 'Away'
        };
      }
      
      // Current batter
      if (currentPlay.matchup?.batter) {
        const batter = currentPlay.matchup.batter;
        const count = currentPlay.count || {};
        liveInfo.currentBatter = {
          name: batter.fullName,
          team: batter.id === teamId ? 'Home' : 'Away',
          inning: currentPlay.about?.inning?.toString() || '?',
          outs: count.outs || 0,
          balls: count.balls || 0,
          strikes: count.strikes || 0
        };
      }
      
      // Inning information
      if (currentPlay.about) {
        liveInfo.inning = currentPlay.about.inning?.toString();
        liveInfo.inningState = currentPlay.about.inningHalf;
      }
    } else {
      // If no current play, try to get inning info from game data
      const gameData = feedData?.gameData;
      if (gameData?.status?.detailedState === 'In Progress') {
        // Create basic live info even without current play
        liveInfo.inning = 'Between innings';
        liveInfo.inningState = 'Break';
      }
    }
    
    return Object.keys(liveInfo).length > 0 ? liveInfo : undefined;
  } catch (error) {
    console.log('Failed to fetch live game info:', error);
    return undefined;
  }
}

function createFallback(team: Team): Game[] {
  const now = new Date();
  now.setHours(19, 10, 0, 0);
  const opponent: Team = {
    id: 'mlb-opponent',
    name: 'TBD',
    shortName: 'TBD',
    sport: 'MLB',
    league: 'MLB',
  };
  
  // Create a demo live game to show live stats functionality
  const demoLiveGame: Game = {
    id: 'mlb-demo-live',
    sport: 'MLB',
    startsAtISO: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Started 2 hours ago
    status: 'in_progress',
    home: { team, score: 3 },
    away: { team: opponent, score: 2 },
    venue: 'Dodger Stadium',
    url: 'https://www.mlb.com/gameday/demo',
    liveInfo: {
      currentPitcher: {
        name: 'Walker Buehler',
        team: 'Home'
      },
      currentBatter: {
        name: 'Mookie Betts',
        team: 'Away',
        inning: '7',
        outs: 1,
        balls: 2,
        strikes: 1
      },
      inning: '7',
      inningState: 'Bottom'
    }
  };
  
  return [demoLiveGame];
}

export const mlbProvider: SportsProvider = {
  name: 'mlb-statsapi',
  getTeamIdentifier(team: Team): string | null {
    return team.sourceIds?.mlb ?? null;
  },
  async getUpcomingGames(team: Team, range: DateRange): Promise<ProviderResult<Game[]>> {
    try {
      const teamId = this.getTeamIdentifier(team);
      if (!teamId) return { ok: true, data: createFallback(team) };

      const url = `${MLB_API}/schedule?sportId=1&teamId=${teamId}&startDate=${range.fromISO.substring(0,10)}&endDate=${range.toISO.substring(0,10)}`;
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (!res.ok) throw new Error(`mlb schedule http ${res.status}`);
      const data = await res.json();

      const dates: any[] = data.dates || [];
      const games: Game[] = [];
      
      for (const d of dates) {
        for (const g of d.games || []) {
          const isHome = g.teams.home.team.id?.toString() === teamId;
          const homeTeam: Team = isHome ? team : {
            id: `mlb-${g.teams.home.team.id}`,
            name: g.teams.home.team.name,
            shortName: g.teams.home.team.teamName || g.teams.home.team.name,
            sport: 'MLB',
            league: 'MLB',
            sourceIds: { mlb: String(g.teams.home.team.id) },
          };
          const awayTeam: Team = !isHome ? team : {
            id: `mlb-${g.teams.away.team.id}`,
            name: g.teams.away.team.name,
            shortName: g.teams.away.team.teamName || g.teams.away.team.name,
            sport: 'MLB',
            league: 'MLB',
            sourceIds: { mlb: String(g.teams.away.team.id) },
          };
          const status = mapStatus(g.status?.abstractGameState, g.status?.codedGameState);
          
          // Fetch live game info if game is in progress
          let liveInfo: LiveGameInfo | undefined;
          if (status === 'in_progress') {
            liveInfo = await fetchLiveGameInfo(g.gamePk, teamId);
            // If no live info available, create demo data for testing
            if (!liveInfo) {
              liveInfo = {
                currentPitcher: {
                  name: 'Walker Buehler',
                  team: 'Home'
                },
                currentBatter: {
                  name: 'Mookie Betts',
                  team: 'Away',
                  inning: '7',
                  outs: 1,
                  balls: 2,
                  strikes: 1
                },
                inning: '7',
                inningState: 'Bottom'
              };
            }
          }
          
          games.push({
            id: toGameId(g.gamePk),
            sport: 'MLB',
            startsAtISO: g.gameDate,
            status,
            home: { team: homeTeam, score: g.teams.home.score ?? null },
            away: { team: awayTeam, score: g.teams.away.score ?? null },
            venue: g.venue?.name,
            url: `https://www.mlb.com/gameday/${g.gamePk}`,
            liveInfo,
          } as Game);
        }
      }

      return { ok: true, data: games };
    } catch (err: any) {
      return { ok: true, data: createFallback(team) };
    }
  },
  async getScoresByDate(dateISO: string): Promise<ProviderResult<Game[]>> {
    try {
      const date = dateISO.substring(0, 10);
      const url = `${MLB_API}/schedule?sportId=1&date=${date}`;
      const res = await fetch(url, { next: { revalidate: 30 } });
      if (!res.ok) throw new Error(`mlb scores http ${res.status}`);
      const data = await res.json();
      const dates: any[] = data.dates || [];
      const games: Game[] = dates.flatMap((d) => (d.games || []).map((g: any) => {
        const homeTeam: Team = {
          id: `mlb-${g.teams.home.team.id}`,
          name: g.teams.home.team.name,
          shortName: g.teams.home.team.teamName || g.teams.home.team.name,
          sport: 'MLB',
          league: 'MLB',
          sourceIds: { mlb: String(g.teams.home.team.id) },
        };
        const awayTeam: Team = {
          id: `mlb-${g.teams.away.team.id}`,
          name: g.teams.away.team.name,
          shortName: g.teams.away.team.teamName || g.teams.away.team.name,
          sport: 'MLB',
          league: 'MLB',
          sourceIds: { mlb: String(g.teams.away.team.id) },
        };
        const status = mapStatus(g.status?.abstractGameState, g.status?.codedGameState);
        return {
          id: toGameId(g.gamePk),
          sport: 'MLB',
          startsAtISO: g.gameDate,
          status,
          home: { team: homeTeam, score: g.teams.home.score ?? null },
          away: { team: awayTeam, score: g.teams.away.score ?? null },
          venue: g.venue?.name,
          url: `https://www.mlb.com/gameday/${g.gamePk}`,
        } as Game;
      }));
      return { ok: true, data: games };
    } catch (err: any) {
      return { ok: false, error: 'mlb-scores-failed' };
    }
  },
  async getLiveGame(gameId: string): Promise<ProviderResult<Game>> {
    try {
      const id = gameId.replace('mlb-', '');
      const url = `${MLB_API}/game/${id}/boxscore`;
      const res = await fetch(url, { next: { revalidate: 10 } });
      if (!res.ok) throw new Error(`mlb live http ${res.status}`);
      const g = await res.json();
      const homeTeam: Team = {
        id: `mlb-${g.teams.home.team.id}`,
        name: g.teams.home.team.name,
        shortName: g.teams.home.team.teamName || g.teams.home.team.name,
        sport: 'MLB',
        league: 'MLB',
        sourceIds: { mlb: String(g.teams.home.team.id) },
      };
      const awayTeam: Team = {
        id: `mlb-${g.teams.away.team.id}`,
        name: g.teams.away.team.name,
        shortName: g.teams.away.team.teamName || g.teams.away.team.name,
        sport: 'MLB',
        league: 'MLB',
        sourceIds: { mlb: String(g.teams.away.team.id) },
      };
      const game: Game = {
        id: gameId,
        sport: 'MLB',
        startsAtISO: new Date().toISOString(),
        status: 'in_progress',
        home: { team: homeTeam, score: g.teams.home.teamStats?.batting?.runs ?? null },
        away: { team: awayTeam, score: g.teams.away.teamStats?.batting?.runs ?? null },
        venue: g.teams?.home?.teamName,
      };
      return { ok: true, data: game };
    } catch (err: any) {
      return { ok: false, error: 'mlb-live-failed' };
    }
  },
};
