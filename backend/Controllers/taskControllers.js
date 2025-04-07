const taskService = require('../Services/taskService');
const { sendResponse } = require('../utils/responseHandler');
const calculateTaskPeriod = require('../Helper/taskPeriodCalc');

// exports.createTask = async (req, res) => {
//   try {
//     const taskData = {
//       ...req.body,
//       assignments: req.body.assigned_to?.map(userId => ({
//         user: userId,
//         role: 'assignee' // Default role
//       })) || [],
//       organization: req.user.organization,
//       createdBy: req.user._id
//     };
//     if (!taskData || !taskData.start_time || !taskData.end_time) {
//       throw {
//         message: "Missing required fields: start_time or end_time",
//         statusCode: 400
//       };
//     }

//     // Step 2: Calculate task_period if provided
//     let periodEndDate = null;
//     if (taskData.task_period) {
//       try {
//         periodEndDate = calculateTaskPeriod(taskData.start_time, taskData.task_period);
//         console.log("Calculated task period end:", periodEndDate);
//       } catch (err) {
//         throw {
//           message: err.message,
//           statusCode: 400
//         };
//       }
//     }
//     const task = await taskService.createTask(taskData);
//     sendResponse(res, 201, 'Task created successfully', task);
//   } catch (error) {
//     sendResponse(res, error.statusCode || 500, error.message, null);
//   }
// };
exports.createTask = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.schedule?.start || !req.body.schedule?.end) {
      throw {
        message: "Missing required fields: schedule.start or schedule.end",
        statusCode: 400
      };
    }

    // Prepare base task data according to your DB schema
    const taskData = {
      title: req.body.title,
      organization: req.user.organization,
      createdBy: req.user._id,
      resources: req.body.resources || [],
      assignments: req.body.assigned_to?.map(userId => ({
        user: userId,
        role: 'assignee'
      })) || [],
      color_code: req.body.color_code || '#fbbf24',
      status: req.body.status || 'pending',
      repeat_frequency: req.body.repeat_frequency || '',
      task_period: req.body.task_period || '',
      schedule: {
        start: new Date(req.body.schedule.start),
        end: new Date(req.body.schedule.end),
        timezone: req.body.schedule.timezone || 'UTC'
      },
      notes: req.body.notes || '',
      priority: req.body.priority || 'medium',
      visibility: req.body.visibility || 'team'
    };

    // Calculate period end date if recurring task
    let periodEndDate = null;
    if (taskData.task_period && taskData.repeat_frequency) {
      try {
        periodEndDate = calculateTaskPeriod(taskData.schedule.start, taskData.task_period);
      } catch (err) {
        throw {
          message: err.message,
          statusCode: 400
        };
      }
    }

    // Create single or recurring tasks
    let tasks;
    if (taskData.repeat_frequency && periodEndDate) {
      // Generate recurring tasks
      tasks = await taskService.createRecurringTasks({
        baseTask: taskData,
        frequency: taskData.repeat_frequency,
        endDate: periodEndDate
      });
    } else {
      // Create single task
      const task = await taskService.createTask(taskData);
      tasks = [task];
    }

    sendResponse(res, 201, 
      tasks.length > 1 ? 'Recurring tasks created successfully' : 'Task created successfully', 
      tasks.length === 1 ? tasks[0] : tasks
    );

  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
exports.getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user.organization);
    if (!task) {
      return sendResponse(res, 404, 'Task not found', null);
    }
    sendResponse(res, 200, 'Task retrieved successfully', task);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

exports.updateTask = async (req, res) => {
  try {
    const updatedTask = await taskService.updateTask(
      req.params.id,
      req.body,
      req.user.organization
    );
    sendResponse(res, 200, 'Task updated successfully', updatedTask);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id, req.user.organization);
    sendResponse(res, 200, 'Task deleted successfully', null);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

exports.getTasksByOrganization = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Keep pagination
    
    const tasks = await taskService.getTasksByOrganization(
      req.user.organization,
      { page, limit } // Only pass pagination params
    );
    
    sendResponse(res, 200, 'Tasks retrieved successfully', tasks);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};


exports.changeTaskStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updatedTask = await taskService.changeTaskStatus(
      req.params.id,
      status,
      req.user._id,
      notes,
      req.user.organization
    );
    sendResponse(res, 200, 'Task status updated successfully', updatedTask);
  } catch (error) {
    sendResponse(res, error.statusCode || 500, error.message, null);
  }
};