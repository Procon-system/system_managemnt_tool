const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const { getOrganizationDB } = require("../config/dbManager");
const config = require('../config/config'); // <-- IMPORT THE CONFIG
const { getPlanLimits, normalizePlan } = require('../utils/planLimits');

async function handleUserLogin(extUser) {
  try {
    const { user, organization } = await handleAdminRegistration(extUser);

    const payload = {
      _id: user._id,
      email: user.email,
      first_name: extUser.name?.split(' ')[0] || 'Admin',
      last_name: extUser.name?.split(' ').slice(1).join(' ') || 'User', 
      role: user.role,
      access_level: user.access_level,
      isGlobalAdmin: true,
      tenantId: organization._id,
    };

    const token = jwt.sign(
      payload,
      config.jwt.secret, // Use the secret from the config file
      { expiresIn: config.jwt.expiresIn }
    );
  
    return { token, user, organization };
  } catch (err) {
    console.error("User login handling error:", err);
    throw err;
  }
}
// async function handleAdminRegistration(extUser) {
//   try {
    
//     const Organization = mongoose.model("Organization");
//     let organization = await Organization.findOne({ name: extUser.organization_name });

//     if (!organization) {
//       organization = await Organization.create({
//         name: extUser.organization_name,
//         subdomain: extUser.organization_name.toLowerCase().replace(/\s+/g, '-'),
//         contactEmail: extUser.email,
//         config: {
//           databaseName: `tenant_${new mongoose.Types.ObjectId()}`,
//           features: { tasks: true, resources: true, teams: true }
//         },
//         subscription: {
//           plan: extUser.subscription_type || 'free',
//           startsAt: new Date(),
//           expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//         }
//       });
//     }

//     const Superadmin = mongoose.model('Superadmin');
//     const existingSuperadmin = await Superadmin.findOne({
//       $or: [
//         { email: extUser.email },
//         { personal_number: extUser.id.toString() }
//       ]
//     });

//     if (existingSuperadmin) {
//       return {
//         user: existingSuperadmin,
//         organization
//       };
//     }

//     const newSuperadmin = await Superadmin.create({
//       email: extUser.email,
//       password: extUser.password || 'tempPassword123!',
//       first_name: extUser.first_name || 'Admin',
//       last_name: extUser.last_name || 'User',
//       personal_number: extUser.id.toString(),
//       org_id: organization._id,
//       max_permitted_user_amount: extUser.max_permitted_user_amount || 5,
//       max_permitted_resource_amount: extUser.max_permitted_resource_amount || 5,
//       subscription_type: extUser.subscription_type || 'free',
//       role: 'admin',
//       isConfirmed: true,
//       isActive: true
//     });

//     const tenantConn = await getOrganizationDB(organization._id);
//     if (!tenantConn.models.has("User")) {
//       throw new Error(`User model not found for org ${organization._id}`);
//     }

//     return {
//       user: newSuperadmin.toObject(),
//       organization
//     };
//   } catch (err) {
//     console.error("Admin registration error:", err);
//     throw err;
//   }
// }
async function handleAdminRegistration(formData) {
  const Organization = mongoose.model("Organization");
  const Superadmin = mongoose.model('Superadmin');

 
  try {
    // 1. Check if user or organization already exists
    const existingSuperadmin = await Superadmin.findOne({ email: formData.email });
    if (existingSuperadmin) {
      throw new Error('A user with this email already exists.');
    }

    let organization;
    if (formData.account_type === 'organization') {
        const existingOrg = await Organization.findOne({ name: formData.organization_name });
        if(existingOrg) {
            throw new Error('An organization with this name already exists.');
        }
    }
    
    const plan = normalizePlan(formData.subscription_plan || 'free');
    const { max_users, max_resources } = getPlanLimits(plan);
  
    const orgName = formData.organization_name || `${formData.first_name}'s Workspace`;

    organization = new Organization({
      name: orgName,
      subdomain: orgName.toLowerCase().replace(/\s+/g, '-'),
      contactEmail: formData.email,
      config: {
        databaseName: `tenant_${new mongoose.Types.ObjectId()}`,
        features: { tasks: true, resources: true, teams: true }
      },
      subscription: {
        plan: formData.subscription_plan || 'free',
        startsAt: new Date(),
        
        expiresAt: formData.subscription_plan === 'free'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days for free
          : new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // 1 year for paid
      }
    });
    await organization.save();

    // 3. Create the Superadmin (the first user)
    const newSuperadmin = new Superadmin({
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      address: formData.address,
      telephone: formData.telephone,
      max_permitted_user_amount: max_users,
      max_permitted_resource_amount: max_resources,
      org_id: organization._id,
      subscription_type: formData.subscription_plan || 'free',
      role: 'admin',
      access_level: 5, 
      isConfirmed: true, 
      isActive: true
    });
    await newSuperadmin.save();
    const token = newSuperadmin.generateAuthToken();
    const tenantConn = await getOrganizationDB(organization._id);
    if (!tenantConn.models.has("User")) {
      throw new Error(`User model not found for org ${organization._id}`);
    }
    
  
    return {
      user: newSuperadmin.toObject(),
      organization: organization.toObject(),
      token
    };
  } catch (err) {
   
    console.error("Admin registration transaction error:", err);
    // Re-throw the error so the controller can catch it
    throw err;
  } 
}
module.exports = { handleAdminRegistration , handleUserLogin };
