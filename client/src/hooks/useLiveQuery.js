import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function useLiveQuery(loader, { initialData, interval = 30000, enabled = true, errorMessage } = {}) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryAfter, setRetryAfter] = useState(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const load = useCallback(async (mode = "refresh") => {
    if (!enabled || document.visibilityState === "hidden") {
      return;
    }

    if (mode === "initial" && !hasLoadedOnce) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const result = await loader();
      setData(result);
      setLastUpdated(new Date().toISOString());
      setRetryAfter(null);
      setHasLoadedOnce(true);
    } catch (error) {
      if (error.response?.status === 429) {
        setRetryAfter(Date.now() + 120000);
        return;
      }

      toast.error(error.response?.data?.message || errorMessage || "Unable to refresh live data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [enabled, errorMessage, hasLoadedOnce, loader]);

  useEffect(() => {
    if (retryAfter && retryAfter > Date.now()) {
      setIsLoading(false);
      return undefined;
    }

    load(hasLoadedOnce ? "refresh" : "initial");

    if (!enabled || !interval) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (retryAfter && retryAfter > Date.now()) {
        return;
      }

      load("refresh");
    }, interval);

    return () => window.clearInterval(intervalId);
  }, [enabled, hasLoadedOnce, interval, load, retryAfter]);

  return {
    data,
    isLoading,
    isRefreshing,
    lastUpdated,
    reload: load,
  };
}
