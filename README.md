# Andrew's Sports Hub

A modern Next.js app to view game times, scores, and live updates for featured teams:
- ⚾ Los Angeles Dodgers (MLB) - with live game stats
- 🏀 Los Angeles Lakers (NBA)
- ⚽ Liverpool FC (Premier League)
- 🏈 Top NFL teams (Chiefs, 49ers, Eagles, Bills, Cowboys, Ravens)

## ✨ Features

- **Live Game Updates**: Real-time scores and game status
- **Live MLB Stats**: Current pitcher, batter, inning, and count during live games
- **Auto-refresh**: Games update every minute automatically
- **Modern UI**: Clean, responsive design with sport-specific emojis
- **Multi-sport Support**: Baseball, Basketball, Soccer, and Football
- **Real-time Clock**: Live time display in header

## Getting Started

1. Install Node.js 18+ (LTS recommended).
2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up API keys for enhanced features:
   ```bash
   cp .env.example .env.local
   ```
   Fill in:
   - `TWITTER_BEARER_TOKEN` (Twitter/X API v2 recent search)
   - `FOOTBALL_DATA_API_KEY` (football-data.org)

4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3001

## 🚀 What's New

This version merges the best features from both the Express.js and Next.js versions:
- **Enhanced UI**: Modern design with better styling and animations
- **Live Game Stats**: Real-time pitcher/batter information for MLB games
- **Auto-refresh**: Games update automatically every minute
- **Better Error Handling**: Graceful fallbacks when APIs are unavailable
- **Responsive Design**: Works great on desktop and mobile

## Data Providers

- MLB (Dodgers): MLB Stats API (public)
- NBA (Lakers): balldontlie (public)
- Soccer (Liverpool): football-data.org (API key required)
- NFL: ESPN public scoreboard JSON (subject to change; no key)

All providers implement a common interface and return fallback data if the upstream request fails or is unavailable.

## Commentary API

Server route: `GET /api/commentary?q=Query` proxies to Twitter/X API v2 recent search using `TWITTER_BEARER_TOKEN`. If no token is configured, it returns a mocked informative item so the UI remains functional.

## Notes

- This project uses the Next.js App Router with TailwindCSS.
- Public endpoints may rate limit or change. For production, consider paid data providers for stability.
- Do not expose your API keys to the browser; keep them in `.env.local`.
