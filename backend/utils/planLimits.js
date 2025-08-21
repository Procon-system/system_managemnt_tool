// utils/planLimits.js
const PLAN_LIMITS = {
    free:       { max_users: 1,     max_resources: 5 },
    basic:      { max_users: 5,     max_resources: 5 },
    pro:        { max_users: 50,    max_resources: 30 },
    enterprise: { max_users: 10000, max_resources: 1000 },
  };
  
  function normalizePlan(plan) {
    const p = String(plan || 'free').toLowerCase();
    return PLAN_LIMITS[p] ? p : 'free';
  }
  
  function getPlanLimits(plan) {
    const key = normalizePlan(plan);
    return PLAN_LIMITS[key];
  }
  
  module.exports = { PLAN_LIMITS, getPlanLimits, normalizePlan };
  