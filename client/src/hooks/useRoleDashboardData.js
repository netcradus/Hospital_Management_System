import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function useRoleDashboardData(loader, fallback) {
  const [data, setData] = useState(fallback);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const result = await loader();
        if (isMounted) {
          setData(result);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load dashboard data");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [loader]);

  return { data, isLoading };
}
