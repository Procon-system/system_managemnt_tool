// const teamService = require('../Services/teamService');
// const { sendResponse } = require('../utils/responseHandler');

// exports.createTeam = async (req, res) => {
//   try {
//     const teamData = {
//       ...req.body,
//       organization: req.user.organization // Set from authenticated user
//     };
    
//     const team = await teamService.createTeam(teamData);
//     sendResponse(res, 201, 'Team created successfully', team);
//   } catch (error) {
//     sendResponse(res, 400, error.message, null);
//   }
// };

// exports.getTeam = async (req, res) => {
//   try {
//     const team = await teamService.getTeamById(
//       req.params.id,
//       req.user.organization
//     );
//     sendResponse(res, 200, 'Team retrieved successfully', team);
//   } catch (error) {
//     sendResponse(res, 404, error.message, null);
//   }
// };

// exports.getOrganizationTeams = async (req, res) => {
//   try {
//     const teams = await teamService.getTeamsByOrganization(
//       req.user.organization,
//       {
//         page: req.query.page,
//         limit: req.query.limit,
//         search: req.query.search
//       }
//     );
//     sendResponse(res, 200, 'Teams retrieved successfully', teams);
//   } catch (error) {
//     sendResponse(res, 400, error.message, null);
//   }
// };

// exports.updateTeam = async (req, res) => {
//   try {
//     const team = await teamService.updateTeam(
//       req.params.id,
//       req.body,
//       req.user.organization
//     );
//     sendResponse(res, 200, 'Team updated successfully', team);
//   } catch (error) {
//     sendResponse(res, 400, error.message, null);
//   }
// };

// exports.deleteTeam = async (req, res) => {
//   try {
//     await teamService.deleteTeam(
//       req.params.id,
//       req.user.organization
//     );
//     sendResponse(res, 200, 'Team deleted successfully', null);
//   } catch (error) {
//     sendResponse(res, 400, error.message, null);
//   }
// };

// exports.addMember = async (req, res) => {
//   try {
//     const team = await teamService.addTeamMember(
//       req.params.teamId,
//       req.body.userId,
//       req.body.role || 'member',
//       req.user.organization
//     );
//     sendResponse(res, 200, 'Member added successfully', team);
//   } catch (error) {
//     sendResponse(res, 400, error.message, null);
//   }
// };

// exports.removeMember = async (req, res) => {
//   try {
//     const team = await teamService.removeTeamMember(
//       req.params.teamId,
//       req.params.userId,
//       req.user.organization
//     );
//     sendResponse(res, 200, 'Member removed successfully', team);
//   } catch (error) {
//     sendResponse(res, 400, error.message, null);
//   }
// };

// exports.updateMemberRole = async (req, res) => {
//   try {
//     const team = await teamService.updateMemberRole(
//       req.params.teamId,
//       req.params.userId,
//       req.body.role,
//       req.user.organization
//     );
//     sendResponse(res, 200, 'Member role updated successfully', team);
//   } catch (error) {
//     sendResponse(res, 400, error.message, null);
//   }
// };
const teamService = require('../Services/teamService');
const { sendResponse } = require('../utils/responseHandler');
const { 
  getFromCache, 
  setToCache, 
  deleteFromCache, 
  clearPattern,
  generateCacheKey
} = require('../redisUtils');

// Cache TTL configuration
const CACHE_TTL = {
  TEAM: 3600, // 1 hour for individual teams
  TEAM_LIST: 1800, // 30 minutes for team lists
  DEFAULT: 1200 // 20 minutes default
};

exports.createTeam = async (req, res) => {
  try {
    const teamData = {
      ...req.body,
      organization: req.user.organization
    };
    
    const team = await teamService.createTeam(teamData);
    
    // Clear relevant cache entries
    await clearPattern(`teams:org:${req.user.organization}*`);
    console.log(`[Cache] Cleared teams cache for org ${req.user.organization}`);

    sendResponse(res, 201, 'Team created successfully', team);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.getTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const orgId = req.user.organization;
    const cacheKey = generateCacheKey('team', orgId, { id: teamId });

    // Try cache first
    const cachedTeam = await getFromCache(cacheKey);
    if (cachedTeam) {
      console.log(`[Cache] Hit for team ${teamId}`);
      return sendResponse(res, 200, 'Team retrieved from cache', cachedTeam);
    }

    const team = await teamService.getTeamById(teamId, orgId);
    
    // Cache the result
    await setToCache(cacheKey, team, CACHE_TTL.TEAM);
    console.log(`[Cache] Set cache for team ${teamId}`);
    
    sendResponse(res, 200, 'Team retrieved successfully', team);
  } catch (error) {
    sendResponse(res, 404, error.message, null);
  }
};

exports.getOrganizationTeams = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const { page = 1, limit = 10, search } = req.query;
    const cacheKey = generateCacheKey('teams', orgId, { page, limit, search });

    // Try cache first
    const cachedTeams = await getFromCache(cacheKey);
    if (cachedTeams) {
      console.log(`[Cache] Hit for teams in org ${orgId}, page ${page}`);
      return sendResponse(res, 200, 'Teams retrieved from cache', cachedTeams);
    }

    const teams = await teamService.getTeamsByOrganization(orgId, { page, limit, search });
    
    // Cache the results
    await setToCache(cacheKey, teams, CACHE_TTL.TEAM_LIST);
    console.log(`[Cache] Set cache for teams in org ${orgId}, page ${page}`);
    
    sendResponse(res, 200, 'Teams retrieved successfully', teams);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const orgId = req.user.organization;

    const team = await teamService.updateTeam(teamId, req.body, orgId);
    
    // Clear relevant cache entries
    await Promise.all([
      deleteFromCache(generateCacheKey('team', orgId, { id: teamId })),
      clearPattern(`teams:org:${orgId}*`)
    ]);
    console.log(`[Cache] Cleared cache for updated team ${teamId}`);

    sendResponse(res, 200, 'Team updated successfully', team);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const orgId = req.user.organization;

    await teamService.deleteTeam(teamId, orgId);
    
    // Clear relevant cache entries
    await Promise.all([
      deleteFromCache(generateCacheKey('team', orgId, { id: teamId })),
      clearPattern(`teams:org:${orgId}*`)
    ]);
    console.log(`[Cache] Cleared cache for deleted team ${teamId}`);

    sendResponse(res, 200, 'Team deleted successfully', null);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.addMember = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const orgId = req.user.organization;

    const team = await teamService.addTeamMember(
      teamId,
      req.body.userId,
      req.body.role || 'member',
      orgId
    );
    
    // Clear relevant cache entries
    await Promise.all([
      deleteFromCache(generateCacheKey('team', orgId, { id: teamId })),
      clearPattern(`teams:org:${orgId}*`)
    ]);
    console.log(`[Cache] Cleared cache for team ${teamId} after adding member`);

    sendResponse(res, 200, 'Member added successfully', team);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.removeMember = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const orgId = req.user.organization;

    const team = await teamService.removeTeamMember(
      teamId,
      req.params.userId,
      orgId
    );
    
    // Clear relevant cache entries
    await Promise.all([
      deleteFromCache(generateCacheKey('team', orgId, { id: teamId })),
      clearPattern(`teams:org:${orgId}*`)
    ]);
    console.log(`[Cache] Cleared cache for team ${teamId} after removing member`);

    sendResponse(res, 200, 'Member removed successfully', team);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const orgId = req.user.organization;

    const team = await teamService.updateMemberRole(
      teamId,
      req.params.userId,
      req.body.role,
      orgId
    );
    
    // Clear relevant cache entries
    await Promise.all([
      deleteFromCache(generateCacheKey('team', orgId, { id: teamId })),
      clearPattern(`teams:org:${orgId}*`)
    ]);
    console.log(`[Cache] Cleared cache for team ${teamId} after role update`);

    sendResponse(res, 200, 'Member role updated successfully', team);
  } catch (error) {
    sendResponse(res, 400, error.message, null);
  }
};