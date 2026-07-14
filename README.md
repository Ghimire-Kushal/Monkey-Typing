# TypeRace

A real-time multiplayer typing race for classroom use. A host creates a room, students join with a room code, and everyone races the same text with a live leaderboard (score, WPM, accuracy, progress).

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql` to create the `race_results` table.
3. Create `.env.local` in the project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are on your Supabase project's Settings → API page.

4. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- **Home** — create a room (generates a 6-character code) or join one with a name.
- **Lobby** — players are tracked live via Supabase Presence; the host sees a Start button.
- **Race** — the host broadcasts a random ~40-word passage and a synchronized start time; a 3-2-1 countdown runs locally for everyone, then typing begins. Each completed word updates score, WPM, and accuracy, broadcast to the room over a Supabase Realtime channel so every client's leaderboard updates live.
- **Results** — the race ends when the first player finishes the passage; final results are written to the `race_results` table in Postgres.

## Scoring

- Correct word → `score += 1`
- Incorrect word → `score -= 1`
- `WPM = (correct characters / 5) / minutes elapsed`
- `Accuracy = correct words / total words attempted × 100`

## Deploy

Deploy the frontend to [Vercel](https://vercel.com/new) and set the two env vars above in the project settings. Supabase hosts the realtime channel and Postgres database.
# Monkey-Typing
