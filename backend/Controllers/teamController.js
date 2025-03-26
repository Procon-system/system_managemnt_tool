const teamService = require('../Services/teamService');
const { sendResponse } = require('../utils/responseHandler');

exports.createTeam = async (req, res) => {
  try {
    const teamData = {
      ...req.body,
      organization: req.user.organization // Set from authenticated user
    };
    
    const team = await teamService.createTeam(teamData);
    sendResponse(res, 201, 'Team created successfully', team);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.getTeam = async (req, res) => {
  try {
    const team = await teamService.getTeamById(
      req.params.id,
      req.user.organization
    );
    sendResponse(res, 200, 'Team retrieved successfully', team);
  } catch (error) {
    sendResponse(res, 404, error.message, null);
  }
};

exports.getOrganizationTeams = async (req, res) => {
  try {
    const teams = await teamService.getTeamsByOrganization(
      req.user.organization,
      {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search
      }
    );
    sendResponse(res, 200, 'Teams retrieved successfully', teams);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await teamService.updateTeam(
      req.params.id,
      req.body,
      req.user.organization
    );
    sendResponse(res, 200, 'Team updated successfully', team);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    await teamService.deleteTeam(
      req.params.id,
      req.user.organization
    );
    sendResponse(res, 200, 'Team deleted successfully', null);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.addMember = async (req, res) => {
  try {
    const team = await teamService.addTeamMember(
      req.params.teamId,
      req.body.userId,
      req.body.role || 'member',
      req.user.organization
    );
    sendResponse(res, 200, 'Member added successfully', team);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.removeMember = async (req, res) => {
  try {
    const team = await teamService.removeTeamMember(
      req.params.teamId,
      req.params.userId,
      req.user.organization
    );
    sendResponse(res, 200, 'Member removed successfully', team);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const team = await teamService.updateMemberRole(
      req.params.teamId,
      req.params.userId,
      req.body.role,
      req.user.organization
    );
    sendResponse(res, 200, 'Member role updated successfully', team);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};