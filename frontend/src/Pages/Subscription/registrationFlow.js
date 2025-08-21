// src/pages/RegistrationFlow.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import RegisterSubPage from "./registerSubPage";
import SubscriptionPage from "./subscriptionPage";
import PurchasePage from "./purchasePage";
import { adminRegistration } from '../../features/authSlice';

const PLAN_PRICES = {
  free: 0,
  basic: 10,
  pro: 25,
  enterprise: 100,
};

export default function RegistrationFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    
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
        navigate('/dashboard');
      })
      .catch((err) => {
        console.error("Registration failed:", err);
      });
  };
  const selectedPrice = PLAN_PRICES[formData.subscription_plan] || 0;
  
  const availablePlans = formData.account_type === "organization"
  ? ["free", "pro", "enterprise", "basic"]
  : ["free", "pro", "basic"];

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
          plans={availablePlans} 
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
          onPay={handleFinalSubmit} 
        />
      );
    default:
      return <div>Registration Complete!</div>;
  }
}