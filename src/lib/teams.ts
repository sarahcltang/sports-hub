import type { Team } from './types';

export const DODGERS: Team = {
  id: 'mlb-dodgers',
  name: 'Los Angeles Dodgers',
  shortName: 'Dodgers',
  sport: 'MLB',
  league: 'MLB',
  sourceIds: { mlb: '119' },
};

export const LAKERS: Team = {
  id: 'nba-lakers',
  name: 'Los Angeles Lakers',
  shortName: 'Lakers',
  sport: 'NBA',
  league: 'NBA',
  sourceIds: { balldontlie: '14' },
};

export const LIVERPOOL: Team = {
  id: 'epl-liverpool',
  name: 'Liverpool FC',
  shortName: 'Liverpool',
  sport: 'EPL',
  league: 'Premier League',
  sourceIds: { footballData: '64' },
};

export const NFL_TEAMS: Team[] = [
  { id: 'nfl-chiefs', name: 'Kansas City Chiefs', shortName: 'Chiefs', sport: 'NFL', league: 'NFL', sourceIds: { espn: '12' } },
  { id: 'nfl-49ers', name: 'San Francisco 49ers', shortName: '49ers', sport: 'NFL', league: 'NFL', sourceIds: { espn: '25' } },
  { id: 'nfl-eagles', name: 'Philadelphia Eagles', shortName: 'Eagles', sport: 'NFL', league: 'NFL', sourceIds: { espn: '21' } },
  { id: 'nfl-bills', name: 'Buffalo Bills', shortName: 'Bills', sport: 'NFL', league: 'NFL', sourceIds: { espn: '4' } },
  { id: 'nfl-cowboys', name: 'Dallas Cowboys', shortName: 'Cowboys', sport: 'NFL', league: 'NFL', sourceIds: { espn: '6' } },
  { id: 'nfl-ravens', name: 'Baltimore Ravens', shortName: 'Ravens', sport: 'NFL', league: 'NFL', sourceIds: { espn: '33' } },
];

export const FEATURED_TEAMS: Team[] = [DODGERS, LAKERS, LIVERPOOL, ...NFL_TEAMS];
