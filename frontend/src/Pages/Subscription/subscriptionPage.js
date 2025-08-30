// src/pages/SubscriptionPage.jsx
import React, { useMemo } from "react";
import freeIcon from "../../assets/plans/free.svg";
import proIcon from "../../assets/plans/pro.svg";
import enterpriseIcon from "../../assets/plans/enterprise.svg";
import basicIcon from "../../assets/plans/basic.svg";

const ICONS = { free: freeIcon, pro: proIcon, enterprise: enterpriseIcon, basic: basicIcon };

export default function SubscriptionPage({
  plans = ["free", "pro", "basic"],
  subscriber = null,
  onSelect,
}) {
  const isOrg = useMemo(() => plans.includes("enterprise"), [plans]);
  const ordered = useMemo(() => {
    const order = isOrg ? ["free", "pro", "enterprise", "basic"] : ["free", "pro", "basic"];
    return order.filter((p) => plans.includes(p));
  }, [plans, isOrg]);

  const isPrimary = (plan) => ["pro", "industrial", "enterprise"].includes(plan);
  const isFeatured = (plan) =>
    (!isOrg && plan === "pro") || (isOrg && ["pro", "enterprise"].includes(plan));

  const planDesc = (plan) => {
    if (plan === "free") return "Start free with essential tools.";
    if (["pro", "industrial"].includes(plan)) return "Top features and priority support.";
    if (plan === "enterprise") return "Enterprise-grade controls & SLAs.";
    return "Solid basics. Upgrade anytime.";
  };

  const handleSelect = (plan) => onSelect(plan);

  return (
    <div className="min-h-screen bg-gradient-subtle px-4 py-12 overflow-x-hidden">
      {/* Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-tasknitter-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 w-[28rem] h-[28rem] rounded-full bg-tasknitter-blue-400/10 blur-3xl" />
      </div>

      {/* Heading */}
      <div className="relative text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
          Choose a{" "}
          <span className="bg-gradient-hero bg-clip-text text-transparent drop-shadow-sm">
            Subscription Plan
          </span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Pick the plan that fits your team and scale up anytime.
        </p>
      </div>

      {/* Pricing Deck */}
      <div className="relative mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {ordered.map((plan) => {
          const selected = subscriber?.subscription_type === plan;
          const primary = isPrimary(plan);
          const featured = isFeatured(plan);
          const iconSrc = ICONS[plan] || basicIcon;

          return (
            <div
              key={plan}
              className={[
                "relative rounded-3xl border border-tasknitter-blue-100 bg-gradient-card shadow-soft text-center overflow-hidden transition-all duration-300 hover:shadow-blue hover:-translate-y-1.5",
                selected ? "ring-2 ring-tasknitter-blue-600" : "",
                primary ? "bg-white" : "",
              ].join(" ")}
            >
              {/* Decorative stripe */}
              <div className="h-1 w-full bg-gradient-hero" />

              {/* Featured badge */}
              {featured && (
                <div className="absolute -top-2 right-4">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full shadow bg-tasknitter-blue-50 text-tasknitter-blue-700 border border-tasknitter-blue-200">
                    Featured
                  </span>
                </div>
              )}

              {/* Icon + Title */}
              <div className="px-8 pt-8">
                <img
                  className="h-40 w-40 mx-auto mb-4 drop-shadow"
                  src={iconSrc}
                  alt={`${plan} icon`}
                  loading="lazy"
                />
                <h5 className="text-xl font-bold tracking-wide uppercase text-foreground">
                  {plan}
                </h5>
                <p className="mt-1 text-muted-foreground">{planDesc(plan)}</p>
              </div>

              {/* Perks */}
              <ul className="mt-6 px-8 text-sm text-foreground/90 space-y-2">
                {plan === "free" && (
                  <>
                    <li>• 1 user</li>
                    <li>• Basic tasks</li>
                    <li>• Community support</li>
                  </>
                )}
                {plan === "pro" && (
                  <>
                    <li>• Up to 10 users</li>
                    <li>• Advanced features</li>
                    <li>• Email support</li>
                  </>
                )}
                {plan === "enterprise" && (
                  <>
                    <li>• Unlimited users</li>
                    <li>• SSO, audit logs</li>
                    <li>• Priority support & SLA</li>
                  </>
                )}
                {plan === "basic" && (
                  <>
                    <li>• 3 users</li>
                    <li>• Core features</li>
                    <li>• Standard support</li>
                  </>
                )}
              </ul>

              {/* CTA */}
              <div className="px-8 py-8">
                <button
                  onClick={() => handleSelect(plan)}
                  className={[
                    "inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 font-semibold shadow transition-all duration-300",
                    primary
                      ? "bg-white text-tasknitter-blue-700 border border-tasknitter-blue-200 hover:bg-tasknitter-blue-50"
                      : "bg-gradient-hero text-white hover:shadow-large hover:-translate-y-0.5",
                  ].join(" ")}
                >
                  {selected ? "Current Plan" : "Select"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
