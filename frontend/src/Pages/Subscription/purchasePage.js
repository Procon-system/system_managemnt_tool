import React, { useMemo, useState } from "react";
import { BiCreditCardFront, BiCalendar, BiLockAlt, BiCheckboxSquare } from "react-icons/bi";

const digitsOnly = (str = "") => String(str).replace(/\D/g, "");
const titleCase = (s = "") => s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());

function LoadingDots() {
  return (
    <span className="inline-flex items-baseline" aria-hidden="true">
      <span className="mx-0.5 animate-pulse">.</span>
      <span className="mx-0.5 animate-pulse [animation-delay:120ms]">.</span>
      <span className="mx-0.5 animate-pulse [animation-delay:240ms]">.</span>
    </span>
  );
}

export default function PurchasePage({
  plan = "pro",
  price = 0,
  onPay,
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCardNumber = (e) => {
    const value = digitsOnly(e.target.value).slice(0, 19);
    const grouped = value.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumber(grouped);
  };

  const handleExpiry = (e) => {
    const value = digitsOnly(e.target.value).slice(0, 4);
    const mm = value.slice(0, 2);
    const yy = value.slice(2, 4);
    setExpiry(value.length > 2 ? `${mm}/${yy}` : mm);
  };

  const handleCvv = (e) => {
    setCvv(digitsOnly(e.target.value).slice(0, 3));
  };

  const luhnValid = (num) => {
    let sum = 0;
    let alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let n = parseInt(num[i], 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  };

  const notExpired = (mm, yy) => {
    const month = parseInt(mm, 10);
    if (isNaN(month) || month < 1 || month > 12) return false;
    const fullYear = 2000 + parseInt(yy || "00", 10);
    const now = new Date();
    const exp = new Date(fullYear, month, 0, 23, 59, 59, 999);
    return exp >= now;
  };

  const isValid = useMemo(() => {
    const raw = digitsOnly(cardNumber);
    if (raw.length < 13 || raw.length > 19) return false;
    if (!luhnValid(raw)) return false;

    if (expiry.length !== 5 || expiry.indexOf("/") !== 2) return false;
    const [mm, yy] = expiry.split("/");
    if (!notExpired(mm, yy)) return false;

    if (cvv.length !== 3) return false;
    return true;
  }, [cardNumber, expiry, cvv]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;         // hard guard against double-clicks
    setError("");

    // optionally block if invalid
    // if (!isValid) return;

    try {
      setSubmitting(true);
      await Promise.resolve(
        onPay?.({
          card_number: cardNumber.replace(/\s/g, ""),
          expiry,
          cvv,
        })
      );
      // Keep disabled if you’re redirecting away;
      // If not redirecting on success, you can re-enable:
      // setSubmitting(false);
    } catch (err) {
      setError(err?.message || "Payment failed. Please try again.");
      setSubmitting(false); // re-enable on error so user can retry
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle px-4 py-10 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-tasknitter-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 w-[28rem] h-[28rem] rounded-full bg-tasknitter-blue-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        <div className="rounded-3xl border border-tasknitter-blue-100 bg-white/70 backdrop-blur-sm shadow-soft overflow-hidden">
          <div className="h-1 w-full bg-gradient-hero" />

          <div className="px-8 pt-8 text-center">
            <h4 className="text-3xl font-black tracking-tight">
              <span className="bg-gradient-hero bg-clip-text text-transparent drop-shadow-sm">
                Checkout
              </span>
            </h4>
            <p className="text-muted-foreground mt-2">
              You’re purchasing the <strong>{titleCase(plan)}</strong> plan for{" "}
              <strong>${price}</strong>.
            </p>
          </div>

          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Field label="Card Number">
                <Input
                  id="card_number"
                  name="card_number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={handleCardNumber}
                  icon={<BiCreditCardFront />}
                  aria-invalid={!isValid && cardNumber.length > 0 ? "true" : "false"}
                  disabled={submitting}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Expiry Date">
                  <Input
                    id="expiry"
                    name="expiry"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={handleExpiry}
                    icon={<BiCalendar />}
                    disabled={submitting}
                  />
                </Field>

                <Field label="CVV" hint="3 digits on the back of your card">
                  <Input
                    id="cvv"
                    name="cvv"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    value={cvv}
                    onChange={handleCvv}
                    type="password"
                    icon={<BiLockAlt />}
                    disabled={submitting}
                  />
                </Field>
              </div>

              {error && (
                <div className="text-red-600 text-sm font-medium">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting /* || !isValid */}
                aria-disabled={submitting ? "true" : "false"}
                aria-busy={submitting ? "true" : "false"}
                className="w-full group inline-flex items-center justify-center rounded-2xl bg-gradient-hero px-6 py-3 text-lg font-bold text-white shadow-blue transition-all duration-300 hover:shadow-large hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    Submitting <LoadingDots />
                  </>
                ) : (
                  <>Pay ${price}</>
                )}
              </button>
            </form>
          </div>

          <div className="px-8 py-4 border-t border-tasknitter-blue-100 text-muted-foreground text-sm flex items-center gap-2">
            <BiCheckboxSquare aria-hidden />
            <span>Your payment information is encrypted and secure.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
