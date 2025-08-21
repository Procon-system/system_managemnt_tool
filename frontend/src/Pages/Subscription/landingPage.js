import React from "react";
import { Link } from "react-router-dom";
import { BiCheckCircle, BiRocket, BiGroup, BiTrendingUp } from "react-icons/bi";
import MainImg from "../../assets/home.png";

const features = [
  {
    title: "Smart Scheduling",
    desc: "Quickly organize tasks, deadlines, and reminders with intelligent automation.",
    icon: BiRocket,
  },
  {
    title: "Real-Time Collaboration",
    desc: "Work with your team live—comments, mentions, and seamless updates.",
    icon: BiGroup,
  },
  {
    title: "Productivity Insights",
    desc: "Get actionable analytics that help you work smarter, not harder.",
    icon: BiTrendingUp,
  },
];

const FeatureCard = ({ title, desc, icon: Icon }) => (
  <div className="group h-full rounded-2xl border border-tasknitter-blue-100 bg-gradient-card shadow-soft transition-all duration-300 hover:shadow-blue hover:-translate-y-2 hover:border-tasknitter-blue-600/20">
    <div className="px-8 py-12 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-tasknitter-blue-50 text-4xl text-tasknitter-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-tasknitter-blue-600 group-hover:text-white">
        <Icon aria-hidden />
      </div>
      <h3 className="mb-4 text-xl font-bold text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-subtle overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full px-4 md:px-8 lg:px-12 pt-16 md:pt-24 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Text */}
            <div className="lg:col-span-5 text-center lg:text-left space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black leading-tight tracking-tight">
                  Welcome to
                  <br />
                  <span className="bg-gradient-hero bg-clip-text text-transparent drop-shadow-sm">
                    TaskNitter
                  </span>
                </h1>
                
                <div className="space-y-2">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    The one tool to rule them all!
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                    Manage your tasks seamlessly—ideal for personal projects and team collaboration. 
                    Experience the future of productivity management.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/sub"
                  className="group inline-flex items-center justify-center rounded-2xl bg-gradient-hero px-8 py-4 text-lg font-bold text-white shadow-blue transition-all duration-300 hover:shadow-large hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-tasknitter-blue-600/20"
                >
                  Get Started
                  <BiRocket className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-tasknitter-blue-600 px-8 py-4 text-lg font-bold text-tasknitter-blue-600 transition-all duration-300 hover:bg-tasknitter-blue-600 hover:text-white hover:shadow-medium focus:outline-none focus:ring-4 focus:ring-tasknitter-blue-600/20"
                >
                  Login
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center lg:justify-start gap-8 pt-8">
                <div className="flex items-center gap-2">
                  <BiCheckCircle className="text-2xl text-tasknitter-blue-600" />
                  <span className="text-sm font-semibold text-muted-foreground">Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <BiCheckCircle className="text-2xl text-tasknitter-blue-600" />
                  <span className="text-sm font-semibold text-muted-foreground">No setup required</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="lg:col-span-7 flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-tasknitter-blue-600/10 rounded-3xl blur-3xl transform -rotate-6"></div>
                <img
                  src={MainImg}
                  alt="TaskNitter dashboard showcasing modern task management interface with blue theme"
                  className="relative max-w-4xl w-full drop-shadow-2xl transform hover:scale-105 transition-transform duration-500 rounded-2xl"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full px-4 md:px-8 lg:px-12 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-6 text-foreground">
              Why You'll Love <span className="text-tasknitter-blue-600">TaskNitter</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Discover the powerful features that make TaskNitter the ultimate productivity companion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full px-4 md:px-8 lg:px-12 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 md:p-16 text-center shadow-large">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-20 translate-y-20"></div>
            
            <div className="relative z-10 space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                  Ready to Boost Your Productivity?
                </h2>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of users who rely on TaskNitter to stay organized and achieve more every day.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-lg font-bold text-tasknitter-blue-600 shadow-medium transition-all duration-300 hover:shadow-large hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20"
                >
                  Sign Up Now
                  <BiRocket className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                
                <p className="text-blue-100 text-sm font-medium">
                  ✨ Start your free trial today
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-4 md:px-8 lg:px-12 py-12 border-t border-tasknitter-blue-100">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-muted-foreground">
            © 2025 Tasknitter. Built with ❤️ for productivity enthusiasts.
          </p>
        </div>
      </footer>
    </div>
  );
}