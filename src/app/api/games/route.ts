import { NextRequest, NextResponse } from 'next/server';
import { FEATURED_TEAMS } from '@/lib/teams';
import { createDateRangeForDate } from '@/lib/providers';
import { mlbProvider } from '@/lib/providers/mlb';
import { nbaProvider } from '@/lib/providers/nba';
import { soccerProvider } from '@/lib/providers/soccer';
import { nflProvider } from '@/lib/providers/nfl';

const providerBySport = {
	MLB: mlbProvider,
	NBA: nbaProvider,
	EPL: soccerProvider,
	NFL: nflProvider,
} as const;

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const teamId = searchParams.get('teamId');
		if (!teamId) return NextResponse.json({ ok: false, error: 'missing teamId' }, { status: 400 });
		const team = FEATURED_TEAMS.find((t) => t.id === teamId);
		if (!team) return NextResponse.json({ ok: false, error: 'unknown team' }, { status: 404 });
		const provider = providerBySport[team.sport];

		// today range
		const todayRange = createDateRangeForDate(new Date());
		let res = await provider.getUpcomingGames(team, todayRange);
		if (res.ok && res.data.length === 0) {
			// look ahead 30 days for next scheduled
			const from = new Date();
			from.setHours(0, 0, 0, 0);
			const to = new Date(from);
			to.setDate(to.getDate() + 30);
			const altRange = { fromISO: from.toISOString(), toISO: to.toISOString() };
			res = await provider.getUpcomingGames(team, altRange);
		}

		// If MLB result still shows TBD opponent, try ESPN MLB as a secondary source
		if (team.sport === 'MLB' && res.ok && res.data.length > 0) {
			const first = res.data[0];
			const hasTbd = first.home.team.shortName === 'TBD' || first.away.team.shortName === 'TBD';
			if (hasTbd) {
				const day = first.startsAtISO.substring(0, 10).replaceAll('-', '');
				const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${day}`;
				try {
					const er = await fetch(espnUrl, { next: { revalidate: 120 } });
					if (er.ok) {
						const ej = await er.json();
						const evts: any[] = ej.events || [];
						for (const e of evts) {
							const comp = e.competitions?.[0];
							if (!comp) continue;
							const competitors = comp.competitors || [];
							const homeC = competitors.find((c: any) => c.homeAway === 'home');
							const awayC = competitors.find((c: any) => c.homeAway === 'away');
							if (!homeC || !awayC) continue;
							const involvesDodgers = [homeC.team.displayName, awayC.team.displayName, homeC.team.abbreviation, awayC.team.abbreviation]
								.some((n: string) => n?.toLowerCase().includes('dodgers'));
							if (!involvesDodgers) continue;
							// Replace TBD side with ESPN opponent
							if (first.home.team.shortName === 'TBD') {
								first.home.team = {
									id: `mlb-${homeC.team.id}`,
									name: homeC.team.displayName,
									shortName: homeC.team.abbreviation,
									sport: 'MLB',
									league: 'MLB',
									sourceIds: { espn: String(homeC.team.id) },
								};
							}
							if (first.away.team.shortName === 'TBD') {
								first.away.team = {
									id: `mlb-${awayC.team.id}`,
									name: awayC.team.displayName,
									shortName: awayC.team.abbreviation,
									sport: 'MLB',
									league: 'MLB',
									sourceIds: { espn: String(awayC.team.id) },
								};
							}
							break;
						}
					}
				} catch {}
			}
		}
		return NextResponse.json(res);
	} catch (e: any) {
		return NextResponse.json({ ok: false, error: 'games-failed' }, { status: 500 });
	}
}
