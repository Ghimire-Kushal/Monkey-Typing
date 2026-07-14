import { LeaderboardEntry } from "@/lib/types";

export default function Leaderboard({
  entries,
  currentPlayerId,
}: {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
}) {
  const sorted = [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.wpm - a.wpm;
  });

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((entry, i) => (
        <div
          key={entry.playerId}
          className={`rounded-xl border px-4 py-3 ${
            entry.playerId === currentPlayerId
              ? "border-accent bg-accent-light"
              : "border-black/10 bg-white"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm mb-2">
            <span className="font-medium truncate max-w-full">
              <span className="text-black/40 mr-2">#{i + 1}</span>
              {entry.name}
              {entry.finished && <span className="ml-1 text-accent">✓</span>}
            </span>
            <span className="text-black/60 whitespace-nowrap">
              {entry.wpm} wpm · {entry.accuracy}% · {entry.score} pts
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, entry.progress * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
