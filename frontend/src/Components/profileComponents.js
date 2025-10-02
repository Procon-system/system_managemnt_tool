// import React, { useState } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { logout } from "../features/authSlice";
// import { deleteMe, updateMe } from "../features/userSlice"; // Assuming deleteUser is also an asyncThunk
// import ProfileModal from "./profileModal";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const ProfilePage = () => {
//   const user = useSelector((state) => state.auth.user);
//   const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
//   const dispatch = useDispatch();

//   const [firstName, setFirstName] = useState(user?.first_name || "");
//   const [lastName, setLastName] = useState(user?.last_name || "");
//   const [email, setEmail] = useState(user?.email || "");
//   const [password, setPassword] = useState("");
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showUpdateModal, setShowUpdateModal] = useState(false);

//   const handleLogout = () => {
//     dispatch(logout());
//     toast.success("Logged out successfully!");
//   };

//   const handleUpdate = async (e) => { 
//     e.preventDefault();
//     const access_level = user?.access_level;
//     const updateData = { first_name: firstName, last_name: lastName, email, password, access_level };
   
//     try {
     
//       await dispatch(updateMe(updateData)).unwrap();
//       toast.success("Profile updated successfully!");
//       setShowUpdateModal(false);
//     } catch (error) {
//       setShowUpdateModal(false);
//       toast.error(error || "Failed to update profile."); 
//     }
//   };

//   const handleDeleteAccount = async () => { 
//   const id = user?._id;

//     try {
//       await dispatch(deleteMe({ id })).unwrap();
//       toast.success("Account deleted successfully!");
//       setShowDeleteModal(false);
//       dispatch(logout()); 
//     } catch (error) {
//       setShowDeleteModal(false);
//       toast.error(error || "Failed to delete account.");
//     }
//   };


//   if (!isLoggedIn) {
//     return (
//       <div className="container mx-64 text-red-900 border border-red-600 p-4">
//         <p>You are not logged in. Please log in to view your profile!</p>
//       </div>
//     );
//   }

//   return (
//     <div className="container lg:ml-72 p-4">
//       <div className="bg-white shadow-md rounded-lg p-6">
//         <h2 className="text-2xl font-semibold mb-4">Profile</h2>

//         {/* Profile Form */}
//         <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
//           <div className="flex flex-col space-y-2">
//             <label htmlFor="firstName" className="font-medium text-gray-700">First Name</label>
//             <input
//               type="text"
//               id="firstName"
//               value={firstName}
//               onChange={(e) => setFirstName(e.target.value)}
//               className="px-4 py-2 border rounded-md focus:outline-none"
//               placeholder="Enter your first name"
//             />
//           </div>

//           <div className="flex flex-col space-y-2">
//             <label htmlFor="lastName" className="font-medium text-gray-700">Last Name</label>
//             <input
//               type="text"
//               id="lastName"
//               value={lastName}
//               onChange={(e) => setLastName(e.target.value)}
//               className="px-4 py-2 border rounded-md focus:outline-none"
//               placeholder="Enter your last name"
//             />
//           </div>

//           <div className="flex flex-col space-y-2">
//             <label htmlFor="email" className="font-medium text-gray-700">Email</label>
//             <input
//               type="email"
//               id="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="px-4 py-2 border rounded-md focus:outline-none"
//               placeholder="Enter your email"
//             />
//           </div>

//           <div className="flex flex-col space-y-2">
//             <label htmlFor="password" className="font-medium text-gray-700">Password</label>
//             <input
//               type="password"
//               id="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="px-4 py-2 border rounded-md focus:outline-none"
//               placeholder="Enter a new password"
//             />
//           </div>

//           {/* Action Buttons */}
//           <div className="flex space-x-4 mt-6">
//             <button
//               type="button"
//               onClick={() => setShowUpdateModal(true)} // Open update confirmation modal
//               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
//             >
//               Update Profile
//             </button>
//             <button
//               type="button"
//               onClick={() => setShowDeleteModal(true)} // Open delete confirmation modal
//               className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none"
//             >
//               Delete Account
//             </button>
//             <button
//               type="button"
//               onClick={handleLogout}
//               className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none"
//             >
//               Logout
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Update Confirmation Modal */}
//       {showUpdateModal && (
//         <ProfileModal
//           title="Update Profile"
//           onClose={() => setShowUpdateModal(false)}
//           onConfirm={handleUpdate}
//           confirmText="Update"
//         >
//           <p>Are you sure you want to update your profile details?</p>
//         </ProfileModal>
//       )}

//       {/* Delete Confirmation Modal */}
//       {showDeleteModal && (
//         <ProfileModal
//           title="Delete Account"
//           onClose={() => setShowDeleteModal(false)}
//           onConfirm={handleDeleteAccount}
//           confirmText="Delete"
//         >
//           <p>Are you sure you want to delete your account? This action is irreversible.</p>
//         </ProfileModal>
//       )}
//     </div>
//   );
// };

// export default ProfilePage;


import React, {  useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/authSlice";
import { deleteMe, updateMe } from "../features/userSlice";
import ProfileModal from "./profileModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { validate, hasErrors ,PasswordChecklist } from "../utils/passwordValidator";

const ProfilePage = () => {
  const user = useSelector((state) => state.auth.user);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const dispatch = useDispatch();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [showPw, setShowPw] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // field-level errors (optional UX)
  const [errors, setErrors] = useState({});
  
  const changingPassword = showPw && (currentPassword || newPassword || confirmPassword);
  
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully!");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (submitting) return;
  
    // Base payload
    const payload = {
      first_name: firstName?.trim(),
      last_name: lastName?.trim(),
      email: email?.trim(),
    };
  
    // Validate profile fields (light check)
    const profileErrorFields = ['first_name','last_name','email'];
    if (hasErrors(profileErrorFields, payload)) {
      toast.error("Please fix profile errors before continuing.");
      return;
    }
  
    // If changing password, validate those fields and send only if valid
    if (showPw) {
      const pwData = {
        currentPassword,
        newPassword,
        confirmPassword,
      };
  
      const pwFields = ['currentPassword', 'newPassword', 'confirmPassword'];
      if (hasErrors(pwFields, { ...pwData, newPassword })) {
        // Fill error messages for visibility
        setErrors({
          currentPassword: validate('currentPassword', currentPassword, { newPassword, confirmPassword }),
          newPassword: validate('newPassword', newPassword),
          confirmPassword: validate('confirmPassword', confirmPassword, { newPassword }),
        });
        toast.error("Please fix password errors before continuing.");
        return;
      }
  
      // Extra guard: new must differ from current (mirrors backend)
      if (currentPassword && newPassword && currentPassword === newPassword) {
        setErrors((prev) => ({ ...prev, newPassword: "New password must be different from your current password." }));
        toast.error("New password must be different from current password.");
        return;
      }
  
      payload.currentPassword = currentPassword;
      payload.password = newPassword;
      payload.confirmPassword = confirmPassword;
    }
  
    try {
      setSubmitting(true);
      await dispatch(updateMe(payload)).unwrap();
      toast.success("Profile updated successfully!");
  
      if (showPw) {
        toast.info("Please log in again with your new password.");
        dispatch(logout());
        return;
      }
  
      setShowUpdateModal(false);
    } catch (error) {
      toast.error(error || "Failed to update profile.");
      setShowUpdateModal(false);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    const id = user?._id;
    try {
      setSubmitting(true);
      await dispatch(deleteMe({ id })).unwrap();
      toast.success("Account deleted successfully!");
      setShowDeleteModal(false);
      dispatch(logout());
    } catch (error) {
      setShowDeleteModal(false);
      toast.error(error || "Failed to delete account.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-64 text-red-900 border border-red-600 p-4">
        <p>You are not logged in. Please log in to view your profile!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-3xl bg-gray-50 shadow-md rounded-lg p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Profile</h2>
  
          {/* Profile Form */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 sm:space-y-6">
            {/* Name row (responsive grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="firstName" className="font-medium text-gray-700 text-sm sm:text-base">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your first name"
                  disabled={submitting}
                />
              </div>
  
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="lastName" className="font-medium text-gray-700 text-sm sm:text-base">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your last name"
                  disabled={submitting}
                />
              </div>
            </div>
  
            {/* Email (full width) */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="email" className="font-medium text-gray-700 text-sm sm:text-base">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                disabled={submitting}
              />
            </div>
  
            {/* Password change (optional) */}
            <div className="pt-4 sm:pt-6 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-semibold">Password</h3>
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="self-start sm:self-auto text-sm px-3 py-2 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-60"
                  disabled={submitting}
                >
                  {showPw ? "Cancel change" : "Change password"}
                </button>
              </div>
  
              {showPw && (
                <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                  {/* Current password (full width) */}
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="currentPassword" className="font-medium text-gray-700 text-sm sm:text-base">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setErrors((prev) => ({
                          ...prev,
                          currentPassword: validate("currentPassword", e.target.value, { newPassword, confirmPassword }),
                        }));
                      }}
                      className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your current password"
                      disabled={submitting}
                      autoComplete="current-password"
                    />
                    {errors.currentPassword && <p className="text-sm text-red-600">{errors.currentPassword}</p>}
                  </div>
  
                  {/* New + Confirm (responsive grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="newPassword" className="font-medium text-gray-700 text-sm sm:text-base">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNewPassword(v);
                          setErrors((prev) => ({ ...prev, newPassword: validate("newPassword", v) }));
                          setErrors((prev) => ({
                            ...prev,
                            confirmPassword: validate("confirmPassword", confirmPassword, { newPassword: v }),
                          }));
                        }}
                        className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter a new password"
                        disabled={submitting}
                        autoComplete="new-password"
                      />
                      {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword}</p>}
                      <PasswordChecklist password={newPassword} />
                    </div>
  
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="confirmPassword" className="font-medium text-gray-700 text-sm sm:text-base">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                          const v = e.target.value;
                          setConfirmPassword(v);
                          setErrors((prev) => ({
                            ...prev,
                            confirmPassword: validate("confirmPassword", v, { newPassword }),
                          }));
                        }}
                        className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Re-enter the new password"
                        disabled={submitting}
                        autoComplete="new-password"
                      />
                      {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
  
            {/* Action Buttons (stack on mobile) */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
              <button
                type="button"
                onClick={() => setShowUpdateModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Updating..." : "Update Profile"}
              </button>
  
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none disabled:opacity-60"
                disabled={submitting}
              >
                Delete Account
              </button>
  
              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto px-4 py-2.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none"
              >
                Logout
              </button>
            </div>
          </form>
        </div>
  
        {/* Update Confirmation Modal */}
        {showUpdateModal && (
          <ProfileModal
            title="Update Profile"
            onClose={() => setShowUpdateModal(false)}
            onConfirm={handleUpdate}
            confirmText={submitting ? "Updating..." : "Update"}
            disabled={submitting}
          >
            <p>Are you sure you want to update your profile details?</p>
            {changingPassword && <p className="text-sm text-gray-600 mt-2">You are also changing your password.</p>}
          </ProfileModal>
        )}
  
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <ProfileModal
            title="Delete Account"
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteAccount}
            confirmText={submitting ? "Deleting..." : "Delete"}
            disabled={submitting}
          >
            <p>Are you sure you want to delete your account? This action is irreversible.</p>
          </ProfileModal>
        )}
      </div>
    </div>
  );
  
};

export default ProfilePage;
