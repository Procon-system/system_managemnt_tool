const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const { getOrganizationDB } = require("../config/dbManager");
const config = require('../config/config'); // <-- IMPORT THE CONFIG

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
async function handleAdminRegistration(extUser) {
  try {
    
    const Organization = mongoose.model("Organization");
    let organization = await Organization.findOne({ name: extUser.organization_name });

    if (!organization) {
      organization = await Organization.create({
        name: extUser.organization_name,
        subdomain: extUser.organization_name.toLowerCase().replace(/\s+/g, '-'),
        contactEmail: extUser.email,
        config: {
          databaseName: `tenant_${new mongoose.Types.ObjectId()}`,
          features: { tasks: true, resources: true, teams: true }
        },
        subscription: {
          plan: extUser.subscription_type || 'free',
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    }

    const Superadmin = mongoose.model('Superadmin');
    const existingSuperadmin = await Superadmin.findOne({
      $or: [
        { email: extUser.email },
        { personal_number: extUser.id.toString() }
      ]
    });

    if (existingSuperadmin) {
      return {
        user: existingSuperadmin,
        organization
      };
    }

    const newSuperadmin = await Superadmin.create({
      email: extUser.email,
      password: extUser.password || 'tempPassword123!',
      first_name: extUser.first_name || 'Admin',
      last_name: extUser.last_name || 'User',
      personal_number: extUser.id.toString(),
      org_id: organization._id,
      max_permitted_user_amount: extUser.max_permitted_user_amount || 5,
      max_permitted_resource_amount: extUser.max_permitted_resource_amount || 5,
      subscription_type: extUser.subscription_type || 'free',
      role: 'admin',
      isConfirmed: true,
      isActive: true
    });

    const tenantConn = await getOrganizationDB(organization._id);
    if (!tenantConn.models.has("User")) {
      throw new Error(`User model not found for org ${organization._id}`);
    }

    return {
      user: newSuperadmin.toObject(),
      organization
    };
  } catch (err) {
    console.error("Admin registration error:", err);
    throw err;
  }
}

module.exports = { handleAdminRegistration , handleUserLogin };
