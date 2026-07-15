"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { generateRaceText } from "@/lib/words";
import { LeaderboardEntry, Player, RoomStatus, StartPayload } from "@/lib/types";
import Leaderboard from "@/components/Leaderboard";
import TypingArea from "@/components/TypingArea";

const COUNTDOWN_SECONDS = 3;

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const roomCode = code.toUpperCase();
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "Player";
  const isHost = searchParams.get("host") === "1";

  const playerIdRef = useRef<string>("");
  if (!playerIdRef.current) {
    playerIdRef.current =
      typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random());
  }
  const playerId = playerIdRef.current;

  const [status, setStatus] = useState<RoomStatus>("lobby");
  const [wordCount, setWordCount] = useState(40);
  const [players, setPlayers] = useState<Player[]>([]);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [targetText, setTargetText] = useState("");
  const [leaderboard, setLeaderboard] = useState<Record<string, LeaderboardEntry>>({});

  const [currentInput, setCurrentInput] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [mistyped, setMistyped] = useState(false);
  const [correctWords, setCorrectWords] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [raceStartAt, setRaceStartAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const words = targetText ? targetText.split(" ") : [];

  const updateLeaderboard = useCallback(
    (entry: LeaderboardEntry) => {
      setLeaderboard((prev) => ({ ...prev, [entry.playerId]: entry }));
    },
    []
  );

  useEffect(() => {
    const channel = supabase.channel(`room:${roomCode}`, {
      config: { presence: { key: playerId }, broadcast: { self: true } },
    });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ name: string; isHost: boolean }>();
      const list: Player[] = Object.entries(state).map(([id, metas]) => ({
        playerId: id,
        name: metas[0]?.name ?? "Player",
        isHost: metas[0]?.isHost ?? false,
      }));
      setPlayers(list);
    });

    channel.on("broadcast", { event: "start" }, ({ payload }) => {
      const data = payload as StartPayload;
      setTargetText(data.targetText);
      setRaceStartAt(data.startAt);
      setStatus("countdown");
    });

    channel.on("broadcast", { event: "progress" }, ({ payload }) => {
      updateLeaderboard(payload as LeaderboardEntry);
    });

    channel.on("broadcast", { event: "race_over" }, () => {
      setStatus("finished");
    });

    channel.on("broadcast", { event: "reset" }, () => {
      setStatus("lobby");
      setTargetText("");
      setRaceStartAt(null);
      setCountdown(COUNTDOWN_SECONDS);
      setCurrentInput("");
      setWordIndex(0);
      setScore(0);
      setMistyped(false);
      setCorrectWords(0);
      setTotalAttempted(0);
      setCorrectChars(0);
      setFinished(false);
      setLeaderboard({});
    });

    channel.subscribe(async (subStatus) => {
      if (subStatus === "SUBSCRIBED") {
        await channel.track({ name, isHost });
      }
    });

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  useEffect(() => {
    if (status !== "countdown" || raceStartAt === null) return;
    const tick = () => {
      const remainingMs = raceStartAt - Date.now();
      const remaining = Math.ceil(remainingMs / 1000);
      if (remaining <= 0) {
        setStatus("racing");
        setCountdown(0);
        inputRef.current?.focus();
      } else {
        setCountdown(remaining);
      }
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [status, raceStartAt]);

  function handleStart() {
    if (!channelRef.current) return;
    const text = generateRaceText(wordCount);
    const startAt = Date.now() + COUNTDOWN_SECONDS * 1000;
    channelRef.current.send({
      type: "broadcast",
      event: "start",
      payload: { targetText: text, startAt } satisfies StartPayload,
    });
  }

  async function finishRace(finalScore: number, finalWpm: number, finalAccuracy: number) {
    if (finished) return;
    setFinished(true);

    channelRef.current?.send({
      type: "broadcast",
      event: "progress",
      payload: {
        playerId,
        name,
        score: finalScore,
        wpm: finalWpm,
        accuracy: finalAccuracy,
        progress: 1,
        finished: true,
      } satisfies LeaderboardEntry,
    });

    channelRef.current?.send({
      type: "broadcast",
      event: "race_over",
      payload: {},
    });

    setStatus("finished");

    await supabase.from("race_results").insert({
      room_code: roomCode,
      player_name: name,
      score: finalScore,
      wpm: finalWpm,
      accuracy: finalAccuracy,
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (status !== "racing" || finished || raceStartAt === null) return;
    const value = e.target.value;
    const target = words[wordIndex] ?? "";

    if (value.endsWith(" ")) {
      const typedWord = value.trim();
      const isCorrect = typedWord === target;
      const newScore = isCorrect ? score + 1 : score - 1;
      const newCorrectWords = isCorrect ? correctWords + 1 : correctWords;
      const newTotalAttempted = totalAttempted + 1;
      const newCorrectChars = isCorrect ? correctChars + target.length : correctChars;

      setScore(newScore);
      setCorrectWords(newCorrectWords);
      setTotalAttempted(newTotalAttempted);
      setCorrectChars(newCorrectChars);
      setCurrentInput("");
      setMistyped(false);

      const nextIndex = wordIndex + 1;
      setWordIndex(nextIndex);

      const minutesElapsed = Math.max((Date.now() - raceStartAt) / 60000, 1 / 60);
      const wpm = Math.round(newCorrectChars / 5 / minutesElapsed);
      const accuracy = newTotalAttempted
        ? Math.round((newCorrectWords / newTotalAttempted) * 100)
        : 100;
      const progress = nextIndex / words.length;

      updateLeaderboard({
        playerId,
        name,
        score: newScore,
        wpm,
        accuracy,
        progress,
        finished: nextIndex >= words.length,
      });

      channelRef.current?.send({
        type: "broadcast",
        event: "progress",
        payload: {
          playerId,
          name,
          score: newScore,
          wpm,
          accuracy,
          progress,
          finished: nextIndex >= words.length,
        } satisfies LeaderboardEntry,
      });

      if (nextIndex >= words.length) {
        finishRace(newScore, wpm, accuracy);
      }
    } else {
      setCurrentInput(value);
      setMistyped(!target.startsWith(value));
    }
  }

  useEffect(() => {
    if (status !== "lobby") return;
    updateLeaderboard({
      playerId,
      name,
      score: 0,
      wpm: 0,
      accuracy: 100,
      progress: 0,
      finished: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function handlePlayAgain() {
    channelRef.current?.send({
      type: "broadcast",
      event: "reset",
      payload: {},
    });
  }

  const leaderboardEntries = Object.values(leaderboard);

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-semibold text-accent">
          Room {roomCode}
        </h1>
        <span className="text-black/50 text-sm">Playing as {name}</span>
      </div>

      {status === "lobby" && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-serif text-xl mb-3">Players in lobby</h2>
            <ul className="flex flex-col gap-2">
              {players.map((p) => (
                <li
                  key={p.playerId}
                  className="rounded-xl bg-white border border-black/10 px-4 py-2 flex justify-between"
                >
                  <span>{p.name}</span>
                  {p.isHost && <span className="text-accent text-sm">Host</span>}
                </li>
              ))}
            </ul>
          </div>
          {isHost && (
            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-between rounded-xl bg-white border border-black/10 px-4 py-3">
                <span className="text-sm text-black/60">Word count</span>
                <select
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-accent"
                >
                  {[15, 25, 40, 60, 100].map((count) => (
                    <option key={count} value={count}>
                      {count} words
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={handleStart}
                className="rounded-xl bg-accent text-white py-3 font-medium hover:opacity-90 transition-opacity"
              >
                Start race
              </button>
            </div>
          )}
        </div>
      )}

      {status === "countdown" && (
        <div className="flex items-center justify-center h-[50vh]">
          <span className="font-serif text-8xl text-accent">{countdown}</span>
        </div>
      )}

      {(status === "racing" || status === "finished") && (
        <div className="flex flex-col gap-8">
          {status === "racing" && (
            <>
              <TypingArea
                words={words}
                currentWordIndex={wordIndex}
                currentInput={currentInput}
                mistyped={mistyped}
              />
              <input
                ref={inputRef}
                autoFocus
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-accent font-mono"
                value={currentInput}
                onChange={handleInputChange}
                disabled={finished}
                placeholder="Start typing..."
              />
            </>
          )}

          <div>
            <h2 className="font-serif text-xl mb-3">
              {status === "finished" ? "Final results" : "Leaderboard"}
            </h2>
            <Leaderboard entries={leaderboardEntries} currentPlayerId={playerId} />
          </div>

          {status === "finished" && isHost && (
            <button
              onClick={handlePlayAgain}
              className="rounded-xl bg-accent text-white py-3 font-medium hover:opacity-90 transition-opacity text-center"
            >
              Play again
            </button>
          )}
          {status === "finished" && !isHost && (
            <p className="text-center text-black/50 text-sm">
              Waiting for the host to start another race…
            </p>
          )}
        </div>
      )}
    </main>
  );
}
