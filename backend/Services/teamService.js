const Team = require('../Models/TeamSchema');
const User = require('../Models/UserSchema');
const Organization = require('../Models/OrganizationSchema');

exports.createTeam = async (teamData) => {
  // Validate organization exists
  const organization = await Organization.findById(teamData.organization);
  if (!organization) {
    throw new Error('Organization not found');
  }

  // Check if team name already exists in this organization
  const existingTeam = await Team.findOne({
    name: teamData.name,
    organization: teamData.organization
  });
  
  if (existingTeam) {
    throw new Error('Team with this name already exists in the organization');
  }

  // Validate members exist and belong to the same organization
  if (teamData.members && teamData.members.length > 0) {
    const memberIds = teamData.members.map(m => m.user);
    const users = await User.find({
      _id: { $in: memberIds },
      organization: teamData.organization
    });
    
    if (users.length !== memberIds.length) {
      throw new Error('One or more members not found or belong to different organization');
    }
  }

  const team = new Team(teamData);
  return await team.save();
};

exports.getTeamById = async (teamId, organizationId) => {
  const team = await Team.findOne({
    _id: teamId,
    organization: organizationId
  })
  .populate('members.user', 'first_name last_name email')
  .populate('organization', 'name');
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  return team;
};

exports.getTeamsByOrganization = async (organizationId, options = {}) => {
  const { page = 1, limit = 10, search } = options;
  
  const query = { organization: organizationId };
  
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  
  const teams = await Team.find(query)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('members.user', 'first_name last_name')
    .populate('organization', 'name');
    
  const count = await Team.countDocuments(query);
  
  return {
    teams,
    total: count,
    pages: Math.ceil(count / limit),
    currentPage: page
  };
};

exports.updateTeam = async (teamId, updateData, organizationId) => {
  // Don't allow changing organization
  if (updateData.organization) {
    throw new Error('Cannot change team organization');
  }
  
  // Validate members if being updated
  if (updateData.members) {
    const memberIds = updateData.members.map(m => m.user);
    const users = await User.find({
      _id: { $in: memberIds },
      organization: organizationId
    });
    
    if (users.length !== memberIds.length) {
      throw new Error('One or more members not found or belong to different organization');
    }
  }
  
  const team = await Team.findOneAndUpdate(
    { _id: teamId, organization: organizationId },
    updateData,
    { new: true, runValidators: true }
  )
  .populate('members.user', 'first_name last_name');
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  return team;
};

exports.deleteTeam = async (teamId, organizationId) => {
  const team = await Team.findOneAndDelete({
    _id: teamId,
    organization: organizationId
  });
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  // Optional: Remove team references from users
  await User.updateMany(
    { 'teams': teamId },
    { $pull: { teams: teamId } }
  );
};

exports.addTeamMember = async (teamId, userId, role, organizationId) => {
  // Verify user belongs to the same organization
  const user = await User.findOne({
    _id: userId,
    organization: organizationId
  });
  
  if (!user) {
    throw new Error('User not found or belongs to different organization');
  }
  
  const team = await Team.findOneAndUpdate(
    { 
      _id: teamId,
      organization: organizationId,
      'members.user': { $ne: userId } // Ensure user not already in team
    },
    { $addToSet: { members: { user: userId, role } } },
    { new: true, runValidators: true }
  )
  .populate('members.user', 'first_name last_name');
  
  if (!team) {
    throw new Error('Team not found or user already in team');
  }
  
  // Add team to user's teams array
  await User.findByIdAndUpdate(userId, { $addToSet: { teams: teamId } });
  
  return team;
};

exports.removeTeamMember = async (teamId, userId, organizationId) => {
  const team = await Team.findOneAndUpdate(
    { _id: teamId, organization: organizationId },
    { $pull: { members: { user: userId } } },
    { new: true }
  );
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  // Remove team from user's teams array
  await User.findByIdAndUpdate(userId, { $pull: { teams: teamId } });
  
  return team;
};

exports.updateMemberRole = async (teamId, userId, role, organizationId) => {
  const team = await Team.findOneAndUpdate(
    { 
      _id: teamId, 
      organization: organizationId,
      'members.user': userId
    },
    { $set: { 'members.$.role': role } },
    { new: true, runValidators: true }
  )
  .populate('members.user', 'first_name last_name');
  
  if (!team) {
    throw new Error('Team not found or user not in team');
  }
  
  return team;
};