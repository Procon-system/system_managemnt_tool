// src/pages/RegisterSubPage.jsx
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BiUser,
  BiBuilding,
  BiLock,
  BiEnvelope,
  BiPhone,
  BiHomeAlt,
} from "react-icons/bi";

export default function RegisterSubPage({ formData, updateFormData, onComplete }) {
  const passwordPattern = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*\\W).{8,}";
  const isOrg = formData.account_type === "organization";
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  const isValid = useMemo(() => {
    const required =
      formData.first_name &&
      formData.last_name &&
      formData.email &&
      formData.telephone &&
      formData.address &&
      formData.password;
    const orgOk = !isOrg || formData.organization_name;
    return required && orgOk && new RegExp(passwordPattern).test(formData.password);
  }, [formData, isOrg]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle px-4 py-10 overflow-x-hidden">
      {/* Background brand glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-tasknitter-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 w-[28rem] h-[28rem] rounded-full bg-tasknitter-blue-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-xl">
        <div className="rounded-3xl border border-tasknitter-blue-100 bg-white/70 backdrop-blur-sm shadow-soft overflow-hidden animate-fade-in">
          {/* Decorative top bar */}
          <div className="h-1 w-full bg-gradient-hero" />

          <div className="p-8">
            <h2 className="text-3xl font-black text-center tracking-tight">
              <span className="bg-gradient-hero bg-clip-text text-transparent drop-shadow-sm">
                Create Your Account
              </span>
            </h2>
            <p className="text-center text-muted-foreground mt-2">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-tasknitter-blue-600 hover:underline">
                Login here
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {/* Account type */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <RadioCard
                    name="account_type"
                    value="personal"
                    checked={formData.account_type === "personal"}
                    onChange={handleChange}
                    icon={<BiUser className="text-xl" />}
                    label="Personal"
                  />
                  <RadioCard
                    name="account_type"
                    value="organization"
                    checked={formData.account_type === "organization"}
                    onChange={handleChange}
                    icon={<BiBuilding className="text-xl" />}
                    label="Organization"
                  />
                </div>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name">
                  <Input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Jane"
                    required
                    icon={<BiUser />}
                  />
                </Field>

                <Field label="Last Name">
                  <Input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                    icon={<BiUser />}
                  />
                </Field>
              </div>

              {/* Email */}
              <Field label="Email">
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  icon={<BiEnvelope />}
                />
              </Field>

              {/* Telephone */}
              <Field label="Telephone">
                <Input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+251 9XX XXX XXX"
                  required
                  icon={<BiPhone />}
                />
              </Field>

              {/* Address */}
              <Field label="Address">
                <Input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  required
                  icon={<BiHomeAlt />}
                />
              </Field>

              {/* Organization name */}
              {isOrg && (
                <Field label="Organization Name">
                  <Input
                    type="text"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    placeholder="Acme Corp"
                    required
                    icon={<BiBuilding />}
                  />
                </Field>
              )}

              {/* Password */}
              <Field
                label="Password"
                hint="Must be at least 8 characters and include uppercase, lowercase, number, and symbol."
              >
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    pattern={passwordPattern}
                    title="Must be at least 8 characters, include uppercase, lowercase, number, and symbol."
                    icon={<BiLock />}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </Field>

              <button
                type="submit"
                disabled={!isValid}
                className="w-full group inline-flex items-center justify-center rounded-2xl bg-gradient-hero px-6 py-3 text-lg font-bold text-white shadow-blue transition-all duration-300 hover:shadow-large hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-tasknitter-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Continue to Subscription
              </button>
            </form>
          </div>
        </div>

        {/* Small reassurance note */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

/* ---------- UI Subcomponents (styled to match your theme) ---------- */

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Input({ icon, className = "", ...props }) {
  return (
    <div className="flex items-center rounded-2xl border border-tasknitter-blue-100 bg-white shadow-sm focus-within:ring-2 focus-within:ring-tasknitter-blue-600/30 focus-within:border-tasknitter-blue-300 transition">
      {icon && <span className="pl-3 text-tasknitter-blue-600">{icon}</span>}
      <input
        {...props}
        className={`w-full rounded-2xl px-3 py-2.5 outline-none bg-transparent text-foreground placeholder:text-slate-400 ${className}`}
      />
    </div>
  );
}

function RadioCard({ name, value, checked, onChange, icon, label }) {
  return (
    <label className="relative block">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-tasknitter-blue-100 bg-gradient-card px-4 py-3 text-foreground shadow-soft transition-all duration-300 hover:shadow-blue peer-checked:border-tasknitter-blue-600/40 peer-checked:bg-tasknitter-blue-50/60 peer-checked:ring-2 peer-checked:ring-tasknitter-blue-600/20">
        <span className="text-tasknitter-blue-600">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
    </label>
  );
}
