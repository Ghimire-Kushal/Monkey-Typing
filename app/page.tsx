"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateRoomCode } from "@/lib/words";

const NAME_STORAGE_KEY = "typerace-player-name";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");

  useEffect(() => {
    const savedName = localStorage.getItem(NAME_STORAGE_KEY);
    if (savedName) setName(savedName);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    localStorage.setItem(NAME_STORAGE_KEY, name.trim());
    const params = new URLSearchParams({ name: name.trim() });

    if (mode === "create") {
      const code = generateRoomCode();
      params.set("host", "1");
      router.push(`/room/${code}?${params.toString()}`);
    } else {
      const code = joinCode.trim().toUpperCase();
      if (!code) return;
      router.push(`/room/${code}?${params.toString()}`);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-5xl font-semibold text-accent text-center mb-2">
          TypeRace
        </h1>
        <p className="text-center text-black/60 mb-10">
          A live typing race for the whole class.
        </p>

        <div className="flex mb-6 rounded-full bg-accent-light p-1">
          <button
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              mode === "create" ? "bg-accent text-white" : "text-accent"
            }`}
            onClick={() => setMode("create")}
            type="button"
          >
            Create room
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              mode === "join" ? "bg-accent text-white" : "text-accent"
            }`}
            onClick={() => setMode("join")}
            type="button"
          >
            Join room
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-accent"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            required
          />

          {mode === "join" && (
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-accent tracking-widest uppercase"
              placeholder="Room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              maxLength={6}
              required
            />
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-accent text-white py-3 font-medium hover:opacity-90 transition-opacity"
          >
            {mode === "create" ? "Create room" : "Join room"}
          </button>
        </form>
      </div>
    </main>
  );
}
