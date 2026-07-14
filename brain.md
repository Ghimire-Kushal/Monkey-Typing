Build a real-time multiplayer typing race web app for classroom use.
Concept: Like MonkeyType + TypeRacer combined. A whole class joins the same room, everyone types the same text, and a live leaderboard ranks everyone in real time as they type.
Tech stack:

Next.js 15 (App Router) + React + TypeScript
Supabase Realtime (Broadcast + Presence channels) for live sync — no custom WebSocket server
Tailwind CSS for styling
Deploy target: Vercel (frontend) + Supabase (realtime + Postgres for storing results)

Core flow:

Host creates a room → gets a room code (e.g. 6-char code). Players join by entering the code + their name.
A lobby shows all connected players live (using Supabase Presence).
Host clicks "Start" → a 3-2-1 countdown → the same target text appears for everyone simultaneously.
Everyone types. Live scoring + leaderboard update on every completed word.
When someone finishes (or a timer ends), show final rankings.

Scoring logic (important — get this exact):

Compare the typed word against the target word on each space/word-completion.
Correct word → score += 1
Incorrect word → score −= 1
Also compute live: WPM = (correct characters ÷ 5) ÷ minutes elapsed, and accuracy = correct words ÷ total words attempted × 100.
On each completed word, broadcast { playerId, name, score, wpm, accuracy, progress } to the room channel. Server/clients sort by score (tiebreak by WPM) and everyone's leaderboard re-renders live.

UI / Design system (use these exactly):

Background: cream #faf8f4
Primary/accent: deep green #1a4d3a
Headings: Fraunces serif font (Google Fonts)
Body text: Inter
Warm editorial aesthetic — generous whitespace, clean, elegant. Not gamer-neon.
The typing area should highlight the current word, dim completed words, and color mistyped words red as they happen.
Leaderboard on the side/top: each player as a row with rank, name, score, WPM, and a live progress bar (deep green fill).

Screens needed:

Home — create room / join room
Lobby — list of connected players, host has Start button
Race — typing area + live leaderboard
Results — final rankings with a "Play Again" button

Data to store in Postgres: final results per race (room code, player name, score, wpm, accuracy, timestamp) so history/rankings persist.
Set up the Supabase client, the realtime channel subscription, and the presence tracking. Make it responsive so students can join on phones or laptops. Provide clear instructions for the env variables I need (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).

Two quick things before you run it:

Word source — I left the target text generic. Do you want a fixed passage each race, or a random word bank (MonkeyType style)? If you want random, add one line to the prompt: "Generate the race text from a random word bank of ~200 common English words, 30-50 words per race."
If Claude Code asks about the game timer vs. finish-line, tell it your preference — a 60-second timer (everyone types as much as possible) is usually more fun for a class than "first to finish the passage."

