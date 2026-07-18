import { useCallback, useEffect, useState } from "react";
import defaultData from "./resumeData.js";

// Edits persist to this browser only (localStorage). Reset restores resumeData.
const KEY = "resume:v2";

function loadInitial() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      // Backfill any top-level keys added since this browser last saved (e.g.
      // the `meta` block), so older saved data doesn't crash newer fields.
      return { ...structuredClone(defaultData), ...JSON.parse(raw) };
    }
  } catch {
    /* ignore corrupt/absent storage */
  }
  return structuredClone(defaultData);
}

export function useResumeData() {
  const [data, setData] = useState(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full / disabled — edits stay in memory */
    }
  }, [data]);

  // Poor-man's immer: clone, let the caller mutate the draft, store it.
  const update = useCallback((producer) => {
    setData((prev) => {
      const draft = structuredClone(prev);
      producer(draft);
      return draft;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setData(structuredClone(defaultData));
  }, []);

  return { data, update, reset };
}
