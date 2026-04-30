import { createContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useAuth from "../hooks/useAuth";
import subscriptionService from "../services/subscriptionService";
import SubscriptionModal from "../components/subscription/SubscriptionModal";

export const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const [status, setStatus] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isBlocked = Boolean(isAuthenticated && status && !status.isActive);

  const refreshStatus = async ({ silent = false } = {}) => {
    if (!isAuthenticated) {
      setStatus(null);
      setPlans([]);
      setIsModalOpen(false);
      window.__HMS_SUBSCRIPTION_BLOCKED__ = false;
      return null;
    }

    if (!silent) {
      setIsChecking(true);
    }

    try {
      const [nextStatus, nextPlans] = await Promise.all([
        subscriptionService.getStatus(),
        subscriptionService.getPlans(),
      ]);

      setStatus(nextStatus);
      setPlans(nextPlans);
      setIsModalOpen(!nextStatus.isActive);
      return nextStatus;
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || "Unable to verify subscription status");
      }
      throw error;
    } finally {
      if (!silent) {
        setIsChecking(false);
      }
    }
  };

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    if (!isAuthenticated) {
      setStatus(null);
      setPlans([]);
      setIsModalOpen(false);
      window.__HMS_SUBSCRIPTION_BLOCKED__ = false;
      return;
    }

    refreshStatus().catch(() => {});
  }, [isAuthenticated, isBootstrapping]);

  useEffect(() => {
    window.__HMS_SUBSCRIPTION_BLOCKED__ = isBlocked;
  }, [isBlocked]);

  useEffect(() => {
    const handleSubscriptionRequired = (event) => {
      const nextStatus = event.detail?.data || null;
      if (nextStatus) {
        setStatus((currentValue) => ({ ...currentValue, ...nextStatus }));
      }
      setIsModalOpen(true);
      window.__HMS_SUBSCRIPTION_BLOCKED__ = true;
    };

    window.addEventListener("hms:subscription-required", handleSubscriptionRequired);
    return () => window.removeEventListener("hms:subscription-required", handleSubscriptionRequired);
  }, []);

  const openManager = () => setIsModalOpen(true);
  const closeManager = () => {
    if (!isBlocked) {
      setIsModalOpen(false);
    }
  };

  const value = useMemo(
    () => ({
      status,
      plans,
      isChecking,
      isBlocked,
      refreshStatus,
      openManager,
      closeManager,
    }),
    [status, plans, isChecking, isBlocked]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      <SubscriptionModal
        open={Boolean(isAuthenticated && (isBlocked || isModalOpen))}
        blocking={isBlocked}
        status={status}
        plans={plans}
        onClose={closeManager}
        onResolved={async () => {
          const nextStatus = await refreshStatus({ silent: true });
          if (nextStatus?.isActive) {
            setIsModalOpen(false);
            toast.success("Subscription active");
          }
        }}
        userName={user?.name}
      />
    </SubscriptionContext.Provider>
  );
}
