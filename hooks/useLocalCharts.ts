"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChartModel } from "@/lib/schema";

const CURRENT_KEY = "rc:current";
const RECENTS_KEY = "rc:recents";
const RECENTS_CAP = 12;

export type Recent = {
  id: string;
  title: string;
  savedAt: number;
  model: ChartModel;
};

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or serialization error — non-fatal */
  }
}

export function loadCurrent(): ChartModel | null {
  return read<ChartModel>(CURRENT_KEY);
}

/** Persist the in-progress chart so a refresh doesn't lose work. */
export function saveCurrent(model: ChartModel | null): void {
  if (model) write(CURRENT_KEY, model);
}

/** Reactive list of saved snapshots with save/remove/clear. */
export function useRecents() {
  const [recents, setRecents] = useState<Recent[]>([]);

  useEffect(() => {
    setRecents(read<Recent[]>(RECENTS_KEY) ?? []);
  }, []);

  const persist = useCallback((next: Recent[]) => {
    setRecents(next);
    write(RECENTS_KEY, next);
  }, []);

  const save = useCallback(
    (model: ChartModel) => {
      const entry: Recent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: model.title || "Untitled",
        savedAt: Date.now(),
        model,
      };
      setRecents((prev) => {
        const next = [entry, ...prev].slice(0, RECENTS_CAP);
        write(RECENTS_KEY, next);
        return next;
      });
      return entry.id;
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setRecents((prev) => {
      const next = prev.filter((r) => r.id !== id);
      write(RECENTS_KEY, next);
      return next;
    });
  }, []);

  const clear = useCallback(() => persist([]), [persist]);

  return { recents, save, remove, clear };
}
