
import React, { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import RegisterSubPage from "./registerSubPage";
import SubscriptionPage from "./subscriptionPage";
import PurchasePage from "./purchasePage";
import { adminRegistration } from "../../features/authSlice";

const PLAN_PRICES = { free: 0, basic: 10, pro: 25, enterprise: 100 };

const ERROR_STEP_MAP = {
  EMAIL_EXISTS: 1,
  ORG_EXISTS: 1,
  VALIDATION_ERROR: 1,
  PAYMENT_DECLINED: 3,
  TENANT_MODEL_MISSING: 2,
};

export default function RegistrationFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => ({
    account_type: "personal",
    first_name: "",
    last_name: "",
    email: "",
    telephone: "",
    address: "",
    organization_name: "",
    password: "",
    subscription_plan: "",
    card_number: "",
    expiry: "",
    cvv: "",
  }));

  const [errorInfo, setErrorInfo] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status } = useSelector((state) => state.auth);
  const isLoading = status === "loading";

  // STABLE handlers to prevent child re-mounts causing "flush"
  const updateFormData = useCallback((data) => {
    setErrorInfo(null);
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleNextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const handlePrevStep = useCallback(() => {
    setStep((prev) => Math.max(1, prev - 1));
  }, []);

  const routeOnError = useCallback((err) => {
    const code = err?.code || "VALIDATION_ERROR";
    const message =
      err?.message ||
      (typeof err === "string" ? err : "Please review your information.");
    const field = err?.field;

    setErrorInfo({ code, message, field });

    // jump to the step that can fix the issue (default to 1)
    setStep(ERROR_STEP_MAP[code] ?? 1);

    // optional: clear only sensitive fields for relevant errors
    setFormData((p) => ({
      ...p,
      password: code === "EMAIL_EXISTS" || code === "VALIDATION_ERROR" ? "" : p.password,
      cvv: code === "PAYMENT_DECLINED" ? "" : p.cvv,
    }));
  }, []);

  const handleFinalSubmit = useCallback(
    async (paymentData = {}) => {
      setErrorInfo(null);
      const finalData = { ...formData, ...paymentData };

      try {
        await dispatch(adminRegistration(finalData)).unwrap();
        navigate("/dashboard");
      } catch (err) {
        console.error("Registration failed:", err);
        routeOnError(err);
      }
    },
    [dispatch, formData, navigate, routeOnError]
  );

  // Prevent Enter key from submitting (causing “flush”) on steps 1 & 3
  const preventEnterSubmit = useCallback((e) => {
    if (e.key === "Enter") e.preventDefault();
  }, []);

  const selectedPrice = useMemo(
    () => PLAN_PRICES[formData.subscription_plan] || 0,
    [formData.subscription_plan]
  );

  const availablePlans = useMemo(
    () =>
      formData.account_type === "organization"
        ? ["free", "pro", "enterprise", "basic"]
        : ["free", "pro", "basic"],
    [formData.account_type]
  );

  switch (step) {
    case 1:
      return (
        <div onKeyDown={preventEnterSubmit}>
          {/* Keep your original UI. Just pass optional error hints */}
          <RegisterSubPage
            formData={formData}
            updateFormData={updateFormData}
            onComplete={handleNextStep}
            fieldError={errorInfo?.field}
            errorMessage={
              errorInfo &&
              (errorInfo.code === "EMAIL_EXISTS" ||
                errorInfo.code === "VALIDATION_ERROR")
                ? errorInfo.message
                : null
            }
            isLoading={isLoading}
            onBack={handlePrevStep} // you can ignore if not used
          />
        </div>
      );

    case 2:
      return (
        <SubscriptionPage
          plans={availablePlans}
          onSelect={async (plan) => {
            updateFormData({ subscription_plan: plan });
            if (PLAN_PRICES[plan] === 0) {
              // await so we can catch errors and route correctly
              await handleFinalSubmit({ subscription_plan: plan });
            } else {
              handleNextStep();
            }
          }}
          disabled={isLoading}
          errorMessage={
            errorInfo?.code === "TENANT_MODEL_MISSING" ? errorInfo.message : null
          }
          onBack={handlePrevStep}
        />
      );

    case 3:
      return (
        <div onKeyDown={preventEnterSubmit}>
          <PurchasePage
            plan={formData.subscription_plan}
            price={selectedPrice}
            onPay={handleFinalSubmit}
            disabled={isLoading}
            errorMessage={
              errorInfo?.code === "PAYMENT_DECLINED" ? errorInfo.message : null
            }
            onBack={handlePrevStep}
          />
        </div>
      );

    default:
      return <div>Registration Complete!</div>;
  }
}
