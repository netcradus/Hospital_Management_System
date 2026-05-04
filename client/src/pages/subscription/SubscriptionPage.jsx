import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import { FEATURES } from "../../config/features";

const plans = [
  {
    name: "Basic",
    price: "$49/mo",
    description: "Perfect for a growing clinic team.",
    features: ["Up to 10 staff accounts", "Appointments and billing", "Patient records"],
  },
  {
    name: "Pro",
    price: "$99/mo",
    description: "Designed for multi-doctor hospital workflows.",
    features: ["Advanced dashboards", "Audit trail", "Priority reminders"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large hospital groups and custom integrations.",
    features: ["Custom onboarding", "Dedicated support", "Workflow tailoring"],
  },
];

function SubscriptionPage() {
  if (!FEATURES.SUBSCRIPTION_ENABLED) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Subscription"
        title="Choose a hospital plan"
        description="Billing activation is disabled for now, but the subscription route is ready for future rollout."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} title={plan.name} subtitle={plan.price}>
            <p className="text-sm text-[var(--text-muted)]">{plan.description}</p>
            <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              {plan.features.map((feature) => (
                <p key={feature}>{feature}</p>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default SubscriptionPage;
