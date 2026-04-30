import { useEffect, useMemo, useState } from "react";
import { HiCheckCircle, HiLockClosed, HiSparkles } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import subscriptionService from "../../services/subscriptionService";
import Badge from "../common/Badge";
import Button from "../common/Button";
import InputField from "../common/InputField";
import Skeleton from "../common/Skeleton";

const initialPaymentState = {
  cardNumber: "",
  expiry: "",
  cvv: "",
  cardholderName: "",
};

function SubscriptionModal({ open, blocking, status, plans, onClose, onResolved, userName }) {
  const { formatCurrency, formatDate } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedBillingCycle, setSelectedBillingCycle] = useState("monthly");
  const [paymentForm, setPaymentForm] = useState(initialPaymentState);
  const [step, setStep] = useState("plans");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStep("plans");
      setPaymentForm(initialPaymentState);
      return;
    }

    if (!selectedPlanId && plans?.length) {
      const preferredPlan = plans.find((item) => item.code === "professional") || plans[0];
      setSelectedPlanId(String(preferredPlan._id));
    }
  }, [open, plans, selectedPlanId]);

  const selectedPlan = useMemo(
    () => plans?.find((item) => String(item._id) === String(selectedPlanId)) || null,
    [plans, selectedPlanId]
  );

  const isFirstTime = status?.code === "NO_SUBSCRIPTION";
  const isExpired = status?.code === "SUBSCRIPTION_EXPIRED";
  const modalTitle = isExpired ? "Renew Your MediCare HMS Access" : "Welcome to MediCare HMS";
  const modalDescription = isExpired
    ? "Your subscription has expired. Renew your plan to continue using every module and dashboard."
    : "To access all features, please choose a subscription plan to get started.";

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  const submitPayment = async (event) => {
    event.preventDefault();

    if (!selectedPlan) {
      toast.error("Please choose a subscription plan");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        planId: selectedPlan._id,
        billingCycle: selectedBillingCycle,
        paymentProvider: "manual",
        ...paymentForm,
      };

      if (isExpired) {
        await subscriptionService.renew(payload);
      } else {
        await subscriptionService.create(payload);
      }

      setStep("success");
      await onResolved?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Subscription payment could not be completed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/70 backdrop-blur-lg">
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
          <div className="w-full overflow-hidden rounded-[36px] border border-[var(--border-color)] bg-[var(--panel-bg)] shadow-[0_40px_120px_-42px_rgba(2,8,23,0.72)]">
            <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
              <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 px-6 py-8 text-white sm:px-8 lg:px-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%)]" />
                <div className="relative z-10">
                  <Badge variant="info">{blocking ? "Access locked" : "Subscription center"}</Badge>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12">
                      <HiLockClosed className="text-3xl" />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-white/70">MediCare HMS</p>
                      <h2 className="mt-1 text-3xl font-semibold leading-tight">{modalTitle}</h2>
                    </div>
                  </div>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-white/78 sm:text-base">{modalDescription}</p>

                  {isExpired ? (
                    <div className="mt-8 rounded-[28px] border border-white/12 bg-white/8 p-5">
                      <p className="text-sm uppercase tracking-[0.22em] text-white/55">Last plan</p>
                      <p className="mt-2 text-xl font-semibold">{status?.lastPlan || "Subscription plan"}</p>
                      <p className="mt-2 text-sm text-white/72">
                        Your access ended on {status?.expiresAt ? formatDate(status.expiresAt) : "an earlier date"}.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-8 rounded-[28px] border border-white/12 bg-white/8 p-5">
                      <p className="text-sm uppercase tracking-[0.22em] text-white/55">Why subscribe</p>
                      <ul className="mt-4 space-y-3 text-sm text-white/82">
                        <li>Unlimited patient records and appointments</li>
                        <li>All role dashboards and hospital modules</li>
                        <li>Billing, pharmacy, reports, and analytics</li>
                        <li>Secure organization-wide access control</li>
                      </ul>
                    </div>
                  )}

                  <div className="mt-8 rounded-[28px] border border-white/12 bg-white/8 p-5">
                    <p className="flex items-center gap-2 text-sm font-medium text-white/90">
                      <HiSparkles className="text-lg" />
                      Welcome {userName || "back"}
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      No role bypasses subscription. Once your plan is active, the full hospital workspace unlocks automatically.
                    </p>
                  </div>
                </div>
              </section>

              <section className="px-6 py-8 sm:px-8 lg:px-10">
                {step === "success" ? (
                  <div className="flex h-full min-h-[520px] flex-col items-center justify-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                      <HiCheckCircle className="text-5xl" />
                    </div>
                    <h3 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">Subscription Activated</h3>
                    <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-muted)]">
                      Your plan is active. Refreshing hospital access now.
                    </p>
                    <Button type="button" className="mt-8 min-w-[240px]" onClick={onClose} disabled={blocking}>
                      Go to Dashboard
                    </Button>
                  </div>
                ) : step === "payment" ? (
                  <form className="space-y-4" onSubmit={submitPayment}>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">Payment step</p>
                      <h3 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                        {isExpired ? "Renew subscription" : "Complete your subscription"}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        {selectedPlan ? `${selectedPlan.name} • ${selectedBillingCycle}` : "Choose a plan to continue"}
                      </p>
                    </div>
                    <InputField label="Card Number" value={paymentForm.cardNumber} onChange={(event) => setPaymentForm((currentValue) => ({ ...currentValue, cardNumber: event.target.value }))} placeholder="1234 5678 9012 3456" required />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InputField label="Expiry" value={paymentForm.expiry} onChange={(event) => setPaymentForm((currentValue) => ({ ...currentValue, expiry: event.target.value }))} placeholder="MM/YY" required />
                      <InputField label="CVV" value={paymentForm.cvv} onChange={(event) => setPaymentForm((currentValue) => ({ ...currentValue, cvv: event.target.value }))} placeholder="123" required />
                    </div>
                    <InputField label="Cardholder Name" value={paymentForm.cardholderName} onChange={(event) => setPaymentForm((currentValue) => ({ ...currentValue, cardholderName: event.target.value }))} placeholder="Full name" required />
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <Button type="button" variant="secondary" onClick={() => setStep("plans")}>
                        Back to plans
                      </Button>
                      <Button type="submit" className="sm:min-w-[240px]" disabled={isSubmitting}>
                        {isSubmitting ? "Processing..." : isExpired ? "Renew Subscription" : "Activate Subscription"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">Choose a plan</p>
                        <h3 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                          {isExpired ? "Renew access to all hospital modules" : "Pick a plan to unlock the system"}
                        </h3>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        {blocking ? (
                          <Button type="button" variant="ghost" onClick={handleLogout}>
                            Logout
                          </Button>
                        ) : (
                          <Button type="button" variant="secondary" onClick={onClose}>
                            Close
                          </Button>
                        )}
                      </div>
                    </div>

                    {!plans?.length ? (
                      <div className="space-y-3">
                        <Skeleton className="h-40 w-full rounded-[28px]" />
                        <Skeleton className="h-40 w-full rounded-[28px]" />
                      </div>
                    ) : (
                      <div className="grid gap-4 xl:grid-cols-3">
                        {plans.map((plan) => {
                          const isSelected = String(plan._id) === String(selectedPlanId);
                          const planPrice = selectedBillingCycle === "yearly" ? plan.priceYearly : selectedBillingCycle === "trial" ? 0 : plan.priceMonthly;

                          return (
                            <button
                              key={plan._id}
                              type="button"
                              onClick={() => setSelectedPlanId(String(plan._id))}
                              className={`rounded-[30px] border p-5 text-left transition ${
                                isSelected
                                  ? "border-brand-500 bg-brand-500/10 shadow-[0_22px_54px_-30px_rgba(15,118,107,0.4)]"
                                  : "border-[var(--border-color)] bg-[var(--panel-muted)] hover:border-brand-300"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-lg font-semibold text-[var(--text-primary)]">{plan.name}</p>
                                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                                    {selectedBillingCycle === "trial" ? "Trial access" : `${formatCurrency(planPrice)} / ${selectedBillingCycle === "yearly" ? "year" : "month"}`}
                                  </p>
                                </div>
                                {isSelected ? <Badge variant="success">Selected</Badge> : null}
                              </div>
                              <p className="mt-3 text-sm text-[var(--text-muted)]">Up to {plan.maxUsers} users</p>
                              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                                {(plan.features || []).slice(0, 4).map((feature) => (
                                  <li key={feature}>• {feature}</li>
                                ))}
                              </ul>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {["monthly", "yearly", "trial"].map((cycle) => (
                          <button
                            key={cycle}
                            type="button"
                            onClick={() => setSelectedBillingCycle(cycle)}
                            className={`min-h-[52px] rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                              selectedBillingCycle === cycle
                                ? "border-brand-500 bg-brand-500 text-white"
                                : "border-[var(--border-color)] bg-[var(--panel-muted)] text-[var(--text-primary)]"
                            }`}
                          >
                            {cycle === "monthly" ? "Monthly" : cycle === "yearly" ? "Yearly" : "Trial"}
                          </button>
                        ))}
                      </div>
                      <div className="flex w-full flex-col gap-3 lg:min-w-[240px]">
                        <Button type="button" className="w-full" onClick={() => setStep("payment")} disabled={!selectedPlan}>
                          {isExpired ? "Renew Subscription" : "Subscribe Now"}
                        </Button>
                        {blocking ? (
                          <Button type="button" variant="ghost" className="w-full" onClick={handleLogout}>
                            Back to Login
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {status ? (
                      <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 text-sm text-[var(--text-muted)]">
                        <p className="font-medium text-[var(--text-primary)]">
                          {status.isActive ? "Current access is active" : isExpired ? "Your access is currently expired" : "No subscription is active yet"}
                        </p>
                        {status.expiresAt ? <p className="mt-1">Expires on {formatDate(status.expiresAt)}</p> : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionModal;
