import { createContext, useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";

export const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const [status, setStatus] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isBlocked = false; // Boolean(isAuthenticated && status && !status.isActive);

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
      setStatus(null);
      setPlans([]);
      setIsModalOpen(false);
      return null;
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
      setIsModalOpen(false); // true
      window.__HMS_SUBSCRIPTION_BLOCKED__ = false; // true
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

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}
