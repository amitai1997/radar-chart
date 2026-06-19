"use client";

import { useState } from "react";
import { Button } from "@/components/ui/controls";

const EXAMPLES = [
  "Compare the top 5 LLMs",
  "Nutritional profile of espresso vs matcha",
  "Attributes of Napoleon Bonaparte",
  "Compare Messi, Ronaldo and Mbappé",
];

export function PromptBar({
  onGenerate,
  loading,
  error,
}: {
  onGenerate: (prompt: string) => void;
  loading: boolean;
  error: string | null;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed && !loading) onGenerate(trimmed);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={2}
          placeholder="Describe a topic to chart — e.g. “Compare the top 5 LLMs”"
          className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-32 text-sm text-white/90 outline-none transition focus:border-white/30 placeholder:text-white/30"
        />
        <div className="absolute bottom-2.5 right-2.5">
          <Button onClick={submit} disabled={loading || !value.trim()}>
            {loading ? "Researching…" : "Generate"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-white/30">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setValue(ex);
              if (!loading) onGenerate(ex);
            }}
            disabled={loading}
            className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/55 transition hover:border-white/25 hover:text-white/85 disabled:opacity-40"
          >
            {ex}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-xs text-white/40">
          Searching the web and scoring axes — this can take 10–20 seconds.
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
