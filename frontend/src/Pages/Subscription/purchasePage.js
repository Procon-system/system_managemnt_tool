// src/pages/PurchasePage.jsx
import React, { useMemo, useState } from "react";
import { BiCreditCardFront, BiCalendar, BiLockAlt, BiCheckboxSquare } from "react-icons/bi";

function titleCase(s = "") {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
const digitsOnly = (s = "") => s.replace(/\D/g, "");

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

  // Format 1234 5678 9012 3456
  const handleCardNumber = (e) => {
    const value = digitsOnly(e.target.value).slice(0, 19);
    const grouped = value.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumber(grouped);
  };

  // Format MM/YY
  const handleExpiry = (e) => {
    const value = digitsOnly(e.target.value).slice(0, 4);
    const mm = value.slice(0, 2);
    const yy = value.slice(2, 4);
    setExpiry(value.length > 2 ? `${mm}/${yy}` : mm);
  };

  // CVV 3 digits (to match your original template)
  const handleCvv = (e) => {
    setCvv(digitsOnly(e.target.value).slice(0, 3));
  };

  const luhnValid = (num) => {
    // Basic Luhn check
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

    // Interpret YY as 20YY
    const fullYear = 2000 + parseInt(yy || "00", 10);
    const now = new Date();
    // Set to end of month
    const exp = new Date(fullYear, month, 0, 23, 59, 59, 999);
    return exp >= now;
  };

  const isValid = useMemo(() => {
    const raw = digitsOnly(cardNumber);
    if (raw.length < 13 || raw.length > 19) return false; // general range
    if (!luhnValid(raw)) return false;

    if (expiry.length !== 5 || expiry.indexOf("/") !== 2) return false;
    const [mm, yy] = expiry.split("/");
    if (!notExpired(mm, yy)) return false;

    if (cvv.length !== 3) return false;
    return true;
  }, [cardNumber, expiry, cvv]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // if (!isValid) return;
    onPay({
      card_number: cardNumber.replace(/\s/g, ""),
      expiry,
      cvv,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-blue-500 text-white px-6 py-4">
            <h4 className="text-xl font-semibold m-0">Checkout</h4>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {/* Plan & price summary */}
            <h5 className="text-lg font-semibold mb-1">
              {titleCase(plan)} Plan
            </h5>
            <p className="text-gray-600 mb-6">
              You’re purchasing the <strong>{titleCase(plan)}</strong> plan for{" "}
              <strong>${price}</strong>.
            </p>

            {/* Payment form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Card number */}
              <div>
                <label htmlFor="card_number" className="block font-medium mb-1">
                  Card Number
                </label>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <span className="pl-3 pr-2 text-gray-500">
                    <BiCreditCardFront aria-hidden />
                  </span>
                  <input
                    id="card_number"
                    name="card_number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    className="flex-1 px-3 py-2 outline-none"
                    value={cardNumber}
                    onChange={handleCardNumber}
                    required
                    aria-invalid={!isValid && cardNumber.length > 0 ? "true" : "false"}
                  />
                </div>
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry" className="block font-medium mb-1">
                    Expiry Date
                  </label>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <span className="pl-3 pr-2 text-gray-500">
                      <BiCalendar aria-hidden />
                    </span>
                    <input
                      id="expiry"
                      name="expiry"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      className="flex-1 px-3 py-2 outline-none"
                      value={expiry}
                      onChange={handleExpiry}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cvv" className="block font-medium mb-1">
                    CVV
                  </label>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <span className="pl-3 pr-2 text-gray-500">
                      <BiLockAlt aria-hidden />
                    </span>
                    <input
                      id="cvv"
                      name="cvv"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      className="flex-1 px-3 py-2 outline-none"
                      value={cvv}
                      onChange={handleCvv}
                      required
                      type="password"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm font-medium">{error}</div>
              )}

              {/* Pay button */}
              <button
                type="submit"
                // disabled={submitting || !isValid}
                className="w-full bg-green-600 text-white text-lg font-semibold py-3 rounded-xl shadow hover:bg-green-700 disabled:opacity-50"
              >
                Pay ${price}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t text-gray-600 text-sm flex items-center gap-2">
            <BiCheckboxSquare aria-hidden />
            <span>Your payment information is encrypted and secure.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
