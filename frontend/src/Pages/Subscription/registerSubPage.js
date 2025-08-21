import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { BiUser, BiBuilding, BiLock, BiEnvelope, BiPhone, BiHomeAlt } from "react-icons/bi";

export default function RegisterSubPage({ formData, updateFormData, onComplete }) {
  const passwordPattern = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*\\W).{8,}";
  const isOrg = formData.account_type === "organization";
  const [showPassword, setShowPassword] = useState(false); 
 
  const handleChange = (e) => {
    updateFormData({ [e.target.name]: e.target.value });
  };
  
  // Validation logic remains the same, but uses formData from props
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

  // The submit handler now just calls the parent's completion function
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      onComplete(); // Go to the next step
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-md p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          Create Your Account
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account type */}
          <div>
            <label className="block font-semibold mb-2">Account Type</label>
            <div className="flex gap-3">
              <label className="flex-1">
                <input
                  type="radio"
                  name="account_type"
                  value="personal"
                  checked={formData.account_type === "personal"}
                  onChange={handleChange}
                  className="hidden peer"
                />
                <div className="flex items-center justify-center border rounded-lg py-2 cursor-pointer peer-checked:bg-blue-600 peer-checked:text-white">
                  <BiUser className="mr-2" /> Personal
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  name="account_type"
                  value="organization"
                  checked={formData.account_type === "organization"}
                  onChange={handleChange}
                  className="hidden peer"
                />
                <div className="flex items-center justify-center border rounded-lg py-2 cursor-pointer peer-checked:bg-blue-600 peer-checked:text-white">
                  <BiBuilding className="mr-2" /> Organization
                </div>
              </label>
            </div>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1">Email</label>
            <div className="flex items-center border rounded-lg">
              <BiEnvelope className="ml-2 text-gray-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="flex-1 px-3 py-2 outline-none"
                required
              />
            </div>
          </div>

          {/* Telephone */}
          <div>
            <label className="block mb-1">Telephone</label>
            <div className="flex items-center border rounded-lg">
              <BiPhone className="ml-2 text-gray-500" />
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="flex-1 px-3 py-2 outline-none"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block mb-1">Address</label>
            <div className="flex items-center border rounded-lg">
              <BiHomeAlt className="ml-2 text-gray-500" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="flex-1 px-3 py-2 outline-none"
                required
              />
            </div>
          </div>

          {/* Organization name */}
          {isOrg && (
            <div>
              <label className="block mb-1">Organization Name</label>
              <input
                type="text"
                name="organization_name"
                value={formData.organization_name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block mb-1">Password</label>
            <div className="flex items-center border rounded-lg">
              <BiLock className="ml-2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="flex-1 px-3 py-2 outline-none"
                required
                pattern={passwordPattern}
                title="Must be at least 8 characters, include uppercase, lowercase, number, and symbol."
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="px-3 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Must include uppercase, lowercase, number, and symbol.
            </p>
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold shadow hover:bg-blue-700 disabled:opacity-50"
          >
            Continue to Subscription
          </button>
        </form>
      </div>
    </div>
  );
}
