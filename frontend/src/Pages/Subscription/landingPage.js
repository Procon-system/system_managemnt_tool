
import React from "react";
import { Link } from "react-router-dom";
import { BiCheckCircle } from "react-icons/bi";
import MainImg from "../../assets/main-img.png"; 

const features = [
  {
    title: "Smart Scheduling",
    desc: "Quickly organize tasks, deadlines, and reminders.",
  },
  {
    title: "Real-Time Collaboration",
    desc: "Work with your team live—comments, mentions, and more.",
  },
  {
    title: "Productivity Insights",
    desc: "Get actionable analytics that help you work smarter.",
  },
];

const FeatureCard = ({ title, desc }) => (
  <div className="h-full rounded-xl border border-gray-100 shadow-sm bg-white text-center transition hover:shadow-md">
    <div className="px-6 py-10">
      <div className="text-5xl mb-3 text-blue-600 mx-auto flex items-center justify-center">
        <BiCheckCircle aria-hidden />
      </div>
      <h5 className="text-lg font-semibold mb-2">{title}</h5>
      <p className="text-gray-600">{desc}</p>
    </div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* ───────── Hero ───────── */}
      <section className="w-full px-4 md:px-6 lg:px-10 pt-10 md:pt-16 mb-12">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Text */}
          <div className="md:col-start-2 md:col-span-5 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Welcome to
              <br />
              <span className="text-blue-600 drop-shadow-sm">Tasknitter</span>
            </h1>

            <p className="text-lg font-semibold mt-3">
              The one tool to rule them all!
            </p>
            <p className="text-lg text-gray-700">
              Manage your tasks seamlessly—ideal for personal projects
              <span className="hidden lg:inline">
                {" "}
                or team collaboration.
              </span>
            </p>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link
                to="/sub"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold shadow hover:bg-blue-700 active:bg-blue-800"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 font-semibold text-blue-700 hover:text-blue-800"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="md:col-span-6 flex justify-center">
            <img
              src={MainImg} 
              alt="Illustration of task management dashboard"
              className="max-w-xl w-full drop-shadow-sm"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ───────── Features ───────── */}
      <section className="w-full px-4 md:px-6 lg:px-10 mb-14">
        <h2 className="text-center text-2xl sm:text-3xl font-bold mb-6">
          Why You’ll Love Tasknitter
        </h2>

        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <FeatureCard key={f.title} title={f.title} desc={f.desc} />
          ))}
        </div>
      </section>

      {/* ───────── CTA Banner ───────── */}
      <section className="text-center px-4 md:px-6 lg:px-10 pb-16">
        <div className="mx-auto max-w-3xl rounded-2xl bg-blue-50 border border-blue-100 px-6 py-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Ready to Boost Your Productivity?
          </h2>
          <p className="text-gray-700 mb-5">
            Join thousands of users who rely on Tasknitter to stay organized.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold shadow hover:bg-blue-700 active:bg-blue-800"
          >
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  );
}
