import type { DateRange, Game, ProviderResult, Team } from '../types';

export interface SportsProvider {
  getUpcomingGames(team: Team, range: DateRange): Promise<ProviderResult<Game[]>>;
  getScoresByDate(dateISO: string): Promise<ProviderResult<Game[]>>;
  getLiveGame(gameId: string): Promise<ProviderResult<Game>>;
  getTeamIdentifier(team: Team): string | null; // upstream id if applicable
  readonly name: string;
}

export function createDateRangeForDate(date: Date): DateRange {
  const from = new Date(date);
  from.setHours(0, 0, 0, 0);
  const to = new Date(date);
  to.setHours(23, 59, 59, 999);
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
}
