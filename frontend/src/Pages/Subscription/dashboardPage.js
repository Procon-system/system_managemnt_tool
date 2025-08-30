// src/pages/DashboardPage.jsx
import React from "react";
import { useSelector } from "react-redux";
import { BiRocket, BiUser, BiCollection, BiLinkExternal } from "react-icons/bi";

function titleCase(s = "") {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export default function DashboardPage({ goTasknitterUrl = "/home" }) {
  const { user } = useSelector((state) => state.auth);
  const plan = titleCase(user?.organization?.subscription?.plan || "");
  const maxUsers = user?.max_permitted_user_amount ?? "—";
  const maxResources = user?.max_permitted_resource_amount ?? "—";

  const stats = [
    { icon: BiRocket, label: "Subscription Plan", value: plan || "—", isHighlight: true },
    { icon: BiUser, label: "Max Users", value: maxUsers },
    { icon: BiCollection, label: "Max Resources", value: maxResources },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle px-4 py-10 overflow-x-hidden">
      {/* Background accents to match LandingPage */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-tasknitter-blue-600/10 blur-3xl"></div>
        <div className="absolute -bottom-28 -left-20 w-[28rem] h-[28rem] rounded-full bg-tasknitter-blue-400/10 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-5xl space-y-10">
        {/* Header */}
        <header className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl font-black tracking-tight">
            <span className="bg-gradient-hero bg-clip-text text-transparent drop-shadow-sm">
              Your Dashboard
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Overview of your plan and workspace limits
          </p>
        </header>

        {/* Stats */}
        <section className="grid gap-6 md:grid-cols-3 animate-fade-in [animation-delay:120ms]">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group rounded-2xl border border-tasknitter-blue-100 bg-gradient-card shadow-soft transition-all duration-300 hover:shadow-blue hover:-translate-y-1.5"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4" aria-hidden />
                        <p className="text-sm font-medium">{stat.label}</p>
                      </div>

                      {stat.isHighlight ? (
                        <span className="inline-flex items-center rounded-full bg-tasknitter-blue-50 text-tasknitter-blue-700 px-3 py-1.5 text-sm font-semibold border border-tasknitter-blue-600/20">
                          {stat.value}
                        </span>
                      ) : (
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      )}
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-tasknitter-blue-50 flex items-center justify-center transition-all duration-300 group-hover:bg-tasknitter-blue-600">
                      <Icon
                        className="h-6 w-6 text-tasknitter-blue-600 transition-all duration-300 group-hover:text-white"
                        aria-hidden
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* CTA Card */}
        <section className="animate-fade-in [animation-delay:240ms]">
          <div className="rounded-3xl border border-tasknitter-blue-100 bg-card/70 backdrop-blur-sm shadow-soft overflow-hidden">
            {/* Decorative top bar */}
            <div className="h-1 w-full bg-gradient-hero" />

            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground">Ready to dive in</h2>
              <p className="text-muted-foreground mt-1">
                Open your TaskNitter workspace and manage your projects
              </p>

              <div className="mt-6">
                <a
                  href={goTasknitterUrl}
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-hero px-8 py-4 text-lg font-bold text-white shadow-blue transition-all duration-300 hover:shadow-large hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-tasknitter-blue-600/20"
                >
                  Go to Tasknitter
                  <BiLinkExternal className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Helpful notes */}
        <section className="animate-fade-in [animation-delay:320ms]">
          <div className="rounded-2xl border border-tasknitter-blue-100 bg-white/70 backdrop-blur-sm p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-3">Tips</h3>
            <ul className="grid sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
              <li className="rounded-xl border border-tasknitter-blue-100 bg-tasknitter-blue-50/40 px-4 py-3">
                Keep your team organized with roles
              </li>
              <li className="rounded-xl border border-tasknitter-blue-100 bg-tasknitter-blue-50/40 px-4 py-3">
                Enable strong passwords or SSO
              </li>
              <li className="rounded-xl border border-tasknitter-blue-100 bg-tasknitter-blue-50/40 px-4 py-3">
                Archive unused resources to stay within limits
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
