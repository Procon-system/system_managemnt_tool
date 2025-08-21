// src/pages/RegistrationFlow.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import RegisterSubPage from "./registerSubPage";
import SubscriptionPage from "./subscriptionPage";
import PurchasePage from "./purchasePage";
import { adminRegistration } from '../../features/authSlice';
// Define plan prices (you can fetch this from an API too)
const PLAN_PRICES = {
  free: 0,
  basic: 10,
  pro: 25,
  enterprise: 100,
};

export default function RegistrationFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Registration data
    account_type: "personal",
    first_name: "",
    last_name: "",
    email: "",
    telephone: "",
    address: "",
    organization_name: "",
    password: "",
    // Step 2: Subscription data
    subscription_plan: "",
    // Step 3: Payment data (for processing only, not stored long-term)
    card_number: "",
    expiry: "",
    cvv: "",
  });

 
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);
  const isLoading = status === 'loading';

  // Function to update the master formData object
  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Go to the next step
  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handleFinalSubmit = async (paymentData) => {
    const finalData = { ...formData, ...paymentData };
    
    // Dispatch the thunk and use .unwrap() to handle the promise
    dispatch(adminRegistration(finalData))
      .unwrap()
      .then(() => {
        // This runs only on FULFILLED
        navigate('/dashboard'); // or wherever you want to redirect on success
      })
      .catch((err) => {
        // This runs only on REJECTED
        // The toast message is already handled in the slice, so you might not need anything here.
        console.error("Registration failed:", err);
      });
  };
  const selectedPrice = PLAN_PRICES[formData.subscription_plan] || 0;

  switch (step) {
    case 1:
      return (
        <RegisterSubPage
          formData={formData}
          updateFormData={updateFormData}
          onComplete={handleNextStep}
        />
      );
    case 2:
      return (
        <SubscriptionPage
          onSelect={(plan) => {
            updateFormData({ subscription_plan: plan });
          
            if (PLAN_PRICES[plan] === 0) {

              handleFinalSubmit({ subscription_plan: plan });
            } else {
              handleNextStep();
            }
          }}
        />
      );
    case 3:
      return (
        <PurchasePage
          plan={formData.subscription_plan}
          price={selectedPrice}
          onPay={handleFinalSubmit} // onPay now triggers the final submission
        />
      );
    default:
      return <div>Registration Complete!</div>;
  }
}