import { useEffect, useMemo, useState } from "react";
import { HiCheckCircle, HiLockClosed } from "react-icons/hi2";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import subscriptionService from "../../services/subscriptionService";
import Badge from "../common/Badge";
import Button from "../common/Button";
import InputField from "../common/InputField";
import Modal from "../common/Modal";
import Skeleton from "../common/Skeleton";

const initialPaymentState = {
  cardNumber: "",
  expiry: "",
  cvv: "",
  cardholderName: "",
};

function SubscriptionModal({ open, onClose }) {
  const { user } = useAuth();
  const { formatCurrency } = useLanguage();
  const [step, setStep] = useState("plan");
  const [status, setStatus] = useState(null);
  const [paymentForm, setPaymentForm] = useState(initialPaymentState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mustBlockClose = status?.status === "expired";
  const shouldFetch = open || user?.subscriptionStatus === "expired";

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    const loadStatus = async () => {
      try {
        const result = await subscriptionService.getStatus();
        setStatus(result);
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load subscription status");
      }
    };

    loadStatus();
  }, [shouldFetch]);

  const resolvedOpen = open || user?.subscriptionStatus === "expired";

  useEffect(() => {
    if (!resolvedOpen) {
      setStep("plan");
      setPaymentForm(initialPaymentState);
    }
  }, [resolvedOpen]);

  const formattedPrice = useMemo(() => formatCurrency(status?.planPrice || 1999), [formatCurrency, status?.planPrice]);

  if (!resolvedOpen) {
    return null;
  }

  return (
    <Modal
      open={resolvedOpen}
      onClose={mustBlockClose ? undefined : onClose}
      dismissible={!mustBlockClose}
      size="md"
      title="Unlock Full Access"
      description="Your free trial has ended. Choose a plan to continue."
    >
      {!status ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-[28px]" />
          <Skeleton className="h-28 w-full rounded-[28px]" />
        </div>
      ) : step === "success" ? (
        <div className="py-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <HiCheckCircle className="text-5xl" />
          </div>
          <h3 className="mt-5 text-2xl font-semibold text-[var(--text-primary)]">Welcome to Professional!</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Your subscription is now active and the dashboard is unlocked.</p>
          <Button type="button" className="mt-6 w-full" onClick={onClose}>
            Go to Dashboard
          </Button>
        </div>
      ) : step === "payment" ? (
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            try {
              await subscriptionService.create({
                plan: "professional-monthly",
                ...paymentForm,
              });
              setStep("success");
            } catch (error) {
              toast.error(error.response?.data?.message || "Payment could not be completed");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <InputField label="Card number" value={paymentForm.cardNumber} onChange={(event) => setPaymentForm((currentValue) => ({ ...currentValue, cardNumber: event.target.value }))} placeholder="1234 5678 9012 3456" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Expiry" value={paymentForm.expiry} onChange={(event) => setPaymentForm((currentValue) => ({ ...currentValue, expiry: event.target.value }))} placeholder="MM/YY" required />
            <InputField label="CVV" value={paymentForm.cvv} onChange={(event) => setPaymentForm((currentValue) => ({ ...currentValue, cvv: event.target.value }))} placeholder="123" required />
          </div>
          <InputField label="Cardholder name" value={paymentForm.cardholderName} onChange={(event) => setPaymentForm((currentValue) => ({ ...currentValue, cardholderName: event.target.value }))} placeholder="Full name" required />
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {!mustBlockClose ? (
              <Button type="button" variant="secondary" onClick={() => setStep("plan")}>
                Back
              </Button>
            ) : null}
            <Button type="submit" className="sm:min-w-[220px]" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : `Subscribe Now - ${formattedPrice}/month`}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <section className="rounded-[28px] border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-brand-600/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="info">Most Popular</Badge>
                <div className="mt-4 flex items-center gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white">
                    <HiLockClosed className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Professional Monthly</h3>
                    <p className="text-sm text-[var(--text-muted)]">{formattedPrice} / month</p>
                  </div>
                </div>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-[var(--text-secondary)]">
              <li>Unlimited patient records</li>
              <li>All department dashboards</li>
              <li>Real-time analytics and reports</li>
              <li>Pharmacy and billing module</li>
              <li>Priority support</li>
              <li>Data export (PDF/Excel)</li>
            </ul>
            <Button type="button" className="mt-6 w-full" onClick={() => setStep("payment")} disabled={!status.available && status.status === "unknown"}>
              {`Subscribe Now - ${formattedPrice}/month`}
            </Button>
            {!status.available ? (
              <p className="mt-3 text-xs text-[var(--text-dim)]">
                Subscription API is not available in the current backend, so this checkout stays in UI-only mode until those endpoints are added.
              </p>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-5 opacity-80">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Annual Plan</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Save 20% with yearly billing.</p>
              </div>
              <Badge variant="warning">Coming Soon</Badge>
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}

export default SubscriptionModal;
