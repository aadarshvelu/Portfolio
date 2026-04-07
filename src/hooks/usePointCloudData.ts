"use client";

import { useEffect, useState } from "react";
import type { PointCloudData } from "@/types/pointcloud";
import { loadPointCloud } from "@/lib/load-pointcloud";

interface UsePointCloudResult {
  data: PointCloudData | null;
  loading: boolean;
  error: Error | null;
}

export function usePointCloudData(basePath: string = "/data"): UsePointCloudResult {
  const [data, setData] = useState<PointCloudData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadPointCloud(basePath)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [basePath]);

  return { data, loading, error };
}
