exports.validateTaskData = (taskData) => {
    const errors = [];
    
    if (!taskData.title) {
      errors.push('Title is required');
    }
    
    if (!taskData.startTime || !taskData.endTime) {
      errors.push('Both start and end times are required');
    } else if (new Date(taskData.startTime) >= new Date(taskData.endTime)) {
      errors.push('End time must be after start time');
    }
    
    if (taskData.assignedUsers && taskData.assignedUsers.length === 0 && 
        taskData.assignedTeams && taskData.assignedTeams.length === 0) {
      errors.push('Task must be assigned to at least one user or team');
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  };