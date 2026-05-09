"use client";

import { useEffect, useState } from "react";
import { getCompanyProfile } from "@/services/profileService";

let cached: string | null = null;
let inflight: Promise<string | null> | null = null;

export function useCompanyId(): { companyId: string | null; loading: boolean; error: Error | null } {
  const [companyId, setCompanyId] = useState<string | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cached) {
      setCompanyId(cached);
      setLoading(false);
      return;
    }
    let alive = true;
    if (!inflight) {
      inflight = (async () => {
        try {
          const cp = await getCompanyProfile();
          cached = cp?.idPerusahaan || null;
          return cached;
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      })();
    }
    inflight
      .then((id) => {
        if (!alive) return;
        setCompanyId(id);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e as Error);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { companyId, loading, error };
}
