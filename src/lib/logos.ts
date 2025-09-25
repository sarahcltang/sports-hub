// Team logos configuration
// Using publicly available logos from reliable sources

export const TEAM_LOGOS: Record<string, string> = {
  // MLB Teams
  'mlb-dodgers': 'https://a.espncdn.com/i/teamlogos/mlb/500/la.png',
  
  // NBA Teams  
  'nba-lakers': 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
  
  // EPL Teams
  'epl-liverpool': 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
  
  // NFL Teams
  'nfl-chiefs': 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
  'nfl-49ers': 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png', 
  'nfl-eagles': 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
  'nfl-bills': 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
  'nfl-cowboys': 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
  'nfl-ravens': 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
};

// Fallback sport emojis for teams without logos
export const SPORT_EMOJIS: Record<string, string> = {
  'MLB': '⚾',
  'NBA': '🏀', 
  'EPL': '⚽',
  'NFL': '🏈',
};

export function getTeamLogo(teamId: string): string {
  return TEAM_LOGOS[teamId] || '';
}

export function getSportEmoji(sport: string): string {
  return SPORT_EMOJIS[sport] || '🏆';
}
