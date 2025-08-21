// src/pages/DashboardPage.jsx
import React from "react";
import { BiRocket, BiUser, BiCollection, BiLinkExternal } from "react-icons/bi";

function titleCase(s = "") {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export default function DashboardPage({
  subscriber = {
    subscription_type: "free",
    max_permitted_user_amount: 1,
    max_permitted_resource_amount: 5,
  },
  goTasknitterUrl = "/home",
}) {
  const plan = titleCase(subscriber?.subscription_type || "");
  const maxUsers =
    subscriber?.max_permitted_user_amount ?? "—";
  const maxResources =
    subscriber?.max_permitted_resource_amount ?? "—";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4">
            <h4 className="text-xl font-semibold m-0">Your Dashboard</h4>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {/* Summary list */}
            <ul className="rounded-xl border border-gray-200 overflow-hidden mb-6 divide-y">
              <li className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-50">
                <div className="flex items-center gap-2 text-gray-600">
                  <BiRocket aria-hidden />
                  <span>Subscription Plan:</span>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm font-semibold">
                  {plan || "—"}
                </span>
              </li>

              <li className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <BiUser aria-hidden />
                  <span>Max Users:</span>
                </div>
                <strong className="text-gray-900">{maxUsers}</strong>
              </li>

              <li className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <BiCollection aria-hidden />
                  <span>Max Resources:</span>
                </div>
                <strong className="text-gray-900">{maxResources}</strong>
              </li>
            </ul>

            {/* CTA */}
            <a
              href={goTasknitterUrl}
              className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white text-lg font-semibold py-3 rounded-xl shadow hover:bg-green-700 transition"
            >
              Go to Tasknitter
              <BiLinkExternal aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
