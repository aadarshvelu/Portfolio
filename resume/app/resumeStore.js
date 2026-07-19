"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import defaultData from "./resumeData.js";

// Edits persist to this browser only (localStorage) until "Save to Cloud" is
// clicked. The cloud copy lives in Cloudflare KV via /api/resume (see
// app/api/resume/route.js). This whole app is expected to sit behind
// Cloudflare Access, so every request here is already the owner.
const KEY = "resume:v2";
const CLOUD_URL = "/api/resume";

function loadInitial() {
  if (typeof window === "undefined") return structuredClone(defaultData);
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
  // idle | loading-cloud | saving | saved | error
  // Starts "loading-cloud" directly (rather than being set synchronously
  // inside the mount effect below) — avoids a same-tick cascading render.
  const [cloudStatus, setCloudStatus] = useState("loading-cloud");
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  // On mount, check for a cloud copy — it's the source of truth once one
  // exists (e.g. opening this page fresh on another device/browser). A local
  // draft newer than the last cloud save is NOT auto-overwritten mid-session;
  // this only applies to the very first load.
  useEffect(() => {
    let cancelled = false;
    fetch(CLOUD_URL, { headers: { Accept: "application/json" } })
      .then((res) => (res.ok ? res.json() : null))
      .then((cloud) => {
        if (cancelled || !cloud) return;
        setData({ ...structuredClone(defaultData), ...cloud });
        setCloudStatus("idle");
      })
      .catch(() => {
        if (!cancelled) setCloudStatus("idle");
      });
    return () => { cancelled = true; };
  }, []);

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

  const saveToCloud = useCallback(async () => {
    setCloudStatus("saving");
    try {
      const res = await fetch(CLOUD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`save failed: ${res.status}`);
      if (mounted.current) {
        setCloudStatus("saved");
        setTimeout(() => mounted.current && setCloudStatus("idle"), 2500);
      }
    } catch {
      if (mounted.current) {
        setCloudStatus("error");
        setTimeout(() => mounted.current && setCloudStatus("idle"), 3500);
      }
    }
  }, [data]);

  return { data, update, reset, saveToCloud, cloudStatus };
}
