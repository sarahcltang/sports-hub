'use client';

import { useEffect, useMemo, useState } from 'react';
import { FEATURED_TEAMS } from '@/lib/teams';
import type { Game, Team } from '@/lib/types';
import { createDateRangeForDate } from '@/lib/providers';
import { getTeamLogo, getSportEmoji } from '@/lib/logos';

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}


function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'in_progress': return 'text-green-600 font-semibold';
    case 'final': return 'text-blue-600';
    case 'scheduled': return 'text-gray-600';
    case 'postponed': return 'text-yellow-600';
    case 'canceled': return 'text-red-600';
    default: return 'text-gray-500';
  }
}

export default function Page() {
  const todayRange = useMemo(() => createDateRangeForDate(new Date()), []);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(FEATURED_TEAMS[0]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh games every minute
  useEffect(() => {
    if (!selectedTeam) return;
    let cancelled = false;
    
    const fetchGames = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/games?teamId=${encodeURIComponent(selectedTeam.id)}`);
        if (cancelled) return;
        const data = await response.json();
        setGames(data.ok ? data.data : []);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGames();
    const interval = setInterval(fetchGames, 60000); // Refresh every minute

    return () => { 
      cancelled = true; 
      clearInterval(interval);
    };
  }, [selectedTeam, todayRange]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Andrew's Sports Hub</h1>
          <div className="font-mono text-sm text-gray-600">
            {currentTime.toLocaleString()}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Team Selection */}
        <div className="flex flex-wrap gap-2">
          {FEATURED_TEAMS.map((team) => {
            const logoUrl = getTeamLogo(team.id);
            return (
              <button 
                key={team.id} 
                onClick={() => setSelectedTeam(team)} 
                className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center ${
                  selectedTeam?.id === team.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={`${team.shortName} logo`}
                    className="w-6 h-6 mr-2 object-contain team-logo"
                    onError={(e) => {
                      // Fallback to emoji if logo fails to load
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) nextElement.style.display = 'inline';
                    }}
                  />
                ) : null}
                <span 
                  className="mr-2" 
                  style={{ display: logoUrl ? 'none' : 'inline' }}
                >
                  {getSportEmoji(team.sport)}
                </span>
                {team.shortName}
              </button>
            );
          })}
        </div>

        {/* Games Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {selectedTeam && (
                <>
                  {getTeamLogo(selectedTeam.id) ? (
                    <img 
                      src={getTeamLogo(selectedTeam.id)} 
                      alt={`${selectedTeam.shortName} logo`}
                      className="w-8 h-8 mr-3 object-contain team-logo"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = 'inline';
                      }}
                    />
                  ) : null}
                  <span 
                    className="mr-3 text-2xl" 
                    style={{ display: getTeamLogo(selectedTeam.id) ? 'none' : 'inline' }}
                  >
                    {getSportEmoji(selectedTeam.sport)}
                  </span>
                </>
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedTeam ? `${selectedTeam.name} Games` : 'Select a Team'}
              </h2>
            </div>
            {loading && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Updating...
              </div>
            )}
          </div>

          {!selectedTeam ? (
            <div className="text-center py-12 text-gray-500">
              Select a team above to view their games
            </div>
          ) : loading && games.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Loading games...
            </div>
          ) : games.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-lg font-medium mb-1">No games scheduled</div>
              <div className="text-sm">Check back later for upcoming games</div>
            </div>
          ) : (
            <div className="grid gap-4">
              {games.map((game) => (
                <div key={game.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  {/* Game Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                      {formatTime(game.startsAtISO)}
                    </div>
                    <div className={`text-sm font-medium ${getStatusColor(game.status)}`}>
                      {game.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>

                  {/* Teams and Score */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-semibold">{game.away.team.shortName}</div>
                      {game.away.score !== null && (
                        <div className="text-xl font-bold text-gray-900">{game.away.score}</div>
                      )}
                    </div>
                    
                    <div className="text-gray-400 font-medium">@</div>
                    
                    <div className="flex items-center space-x-3">
                      {game.home.score !== null && (
                        <div className="text-xl font-bold text-gray-900">{game.home.score}</div>
                      )}
                      <div className="text-lg font-semibold">{game.home.team.shortName}</div>
                    </div>
                  </div>

                  {/* Venue */}
                  {game.venue && (
                    <div className="text-sm text-gray-500 border-t pt-3">
                      📍 {game.venue}
                    </div>
                  )}

                  {/* Live Game Information */}
                  {game.status === 'in_progress' && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center text-green-600 font-medium mb-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                        LIVE
                      </div>
                      
                      {game.liveInfo && (
                        <div className="space-y-2 text-sm">
                          {/* Current Pitcher */}
                          {game.liveInfo.currentPitcher && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pitcher:</span>
                              <span className="font-medium">{game.liveInfo.currentPitcher.name}</span>
                            </div>
                          )}
                          
                          {/* Current Batter */}
                          {game.liveInfo.currentBatter && (
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Batter:</span>
                                <span className="font-medium">{game.liveInfo.currentBatter.name}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Inning: {game.liveInfo.currentBatter.inning}</span>
                                <span>Outs: {game.liveInfo.currentBatter.outs}</span>
                                <span>Count: {game.liveInfo.currentBatter.balls}-{game.liveInfo.currentBatter.strikes}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Inning Info */}
                          {game.liveInfo.inning && game.liveInfo.inningState && (
                            <div className="text-xs text-gray-500">
                              {game.liveInfo.inningState} of {game.liveInfo.inning}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
