import { NextRequest, NextResponse } from 'next/server';

// Simple recent search against X/Twitter API v2, server-side only
// Expects env: TWITTER_BEARER_TOKEN
// Query params: ?q=Dodgers or "Los Angeles Dodgers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'missing q' }, { status: 400 });

  const bearer = process.env.TWITTER_BEARER_TOKEN;
  if (!bearer) {
    // Graceful fallback with mocked data
    return NextResponse.json({ ok: true, data: [
      { id: 'mock-1', text: `${q} commentary unavailable (no token).`, author: 'system', createdAtISO: new Date().toISOString(), source: 'twitter' },
    ] });
  }

  const query = encodeURIComponent(`${q} -is:retweet lang:en`);
  const url = `https://api.x.com/2/tweets/search/recent?query=${query}&max_results=10&tweet.fields=created_at,author_id&expansions=author_id&user.fields=username`;

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${bearer}` }, next: { revalidate: 10 } });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const usersById = new Map<string, any>();
    for (const u of data.includes?.users || []) usersById.set(u.id, u);
    const mapped = (data.data || []).map((t: any) => ({
      id: t.id,
      text: t.text,
      author: usersById.get(t.author_id)?.username || t.author_id,
      createdAtISO: t.created_at,
      url: `https://x.com/${usersById.get(t.author_id)?.username || 'i'}/status/${t.id}`,
      source: 'twitter' as const,
    }));
    return NextResponse.json({ ok: true, data: mapped });
  } catch (e) {
    return NextResponse.json({ ok: true, data: [
      { id: 'mock-err', text: `${q} commentary temporarily unavailable.`, author: 'system', createdAtISO: new Date().toISOString(), source: 'twitter' },
    ] });
  }
}
