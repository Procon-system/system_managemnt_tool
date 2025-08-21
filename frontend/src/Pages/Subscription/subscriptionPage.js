// src/pages/SubscriptionPage.jsx
import React, { useMemo } from "react";
import freeIcon from "../../assets/plans/free.svg";
import proIcon from "../../assets/plans/pro.svg";
import enterpriseIcon from "../../assets/plans/enterprise.svg";
import basicIcon from "../../assets/plans/basic.svg";

const ICONS = {
  free: freeIcon,
  pro: proIcon,
  enterprise: enterpriseIcon,
  basic: basicIcon,
};

export default function SubscriptionPage({
  plans = ["free", "pro", "basic"],
  subscriber = null,
  onSelect,
}) {
  // org if enterprise is among available plans
  const isOrg = useMemo(() => plans.includes("enterprise"), [plans]);

  // Order: personal => free, pro, basic; org => free, pro, enterprise, basic
  const ordered = useMemo(() => {
    const order = isOrg ? ["free", "pro", "enterprise", "basic"] : ["free", "pro", "basic"];
    return order.filter((p) => plans.includes(p));
  }, [plans, isOrg]);

  // Primary (blue) cards
  const isPrimary = (plan) => ["pro", "industrial", "enterprise"].includes(plan);

  // Featured: Pro for personal; Pro + Enterprise for org
  const isFeatured = (plan) =>
    (!isOrg && plan === "pro") || (isOrg && ["pro", "enterprise"].includes(plan));

  // Descriptions mirroring your template
  const planDesc = (plan) => {
    if (plan === "free") return "Start free with essential tools.";
    if (["pro", "industrial"].includes(plan)) return "Get the best with top features and support.";
    if (plan === "enterprise") return "Enterprise-grade features with priority support.";
    return "Get basic features. Unlock advanced tools.";
  };

  const handleSelect = (plan) => {
    onSelect(plan);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 px-4 py-10">
      {/* Heading */}
      <div className="text-center mb-16">
        <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight subscription-heading">
          Choose&nbsp;A<br />
          <span className="text-blue-600">Subscription&nbsp;Plan</span>
        </h1>
      </div>

      {/* Pricing Deck */}
      <div className="mx-auto max-w-5xl flex flex-wrap gap-6 justify-center">
        {ordered.map((plan) => {
          const selected = subscriber?.subscription_type === plan;
          const primary = isPrimary(plan);
          const featured = isFeatured(plan);

          const cardBase =
            "relative w-full sm:w-[200px] rounded-2xl border shadow-sm transition hover:shadow-md text-center overflow-hidden";
          const primaryCls = primary
            ? "bg-blue-500 text-white border-blue-200"
            : "bg-white text-gray-900 border-gray-100";
          const ringCls = selected ? "ring-2 ring-blue-500" : "";
          const pad = "px-6 py-7";

          const iconSrc = ICONS[plan] || basicIcon; // safe fallback

          return (
            <div key={plan} className={`${cardBase} ${primaryCls} ${ringCls}`}>
              {/* Featured badge */}
              {featured && (
                <div className="absolute -top-2 right-4">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full shadow ${
                      primary ? "bg-white text-blue-700" : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    Featured
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`${pad} pb-4`}>
                <img
                  className="h-48 w-44 mx-auto mb-3"
                  src={iconSrc}
                  alt={`${plan} icon`}
                  loading="lazy"
                />

                {/* Title */}
                <h5 className="text-xl font-bold tracking-wide mb-2 uppercase">
                  {plan}
                </h5>

                {/* Description */}
                <p className={primary ? "opacity-90" : "text-gray-600"}>
                  {planDesc(plan)}
                </p>
              </div>

              {/* Select button */}
              <div className="px-6 pb-7">
                <button
                  onClick={() => handleSelect(plan)}
                  className={`btn btn-select inline-flex items-center justify-center w-full rounded-xl px-4 py-3 font-semibold shadow ${
                    primary
                      ? "bg-white text-blue-700 hover:bg-blue-50"
                      : "bg-blue-500 text-white hover:bg-blue-400"
                  }`}
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
