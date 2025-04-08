const taskService = require('../Services/taskService');
const { sendResponse } = require('../utils/responseHandler');
const calculateTaskPeriod = require('../Helper/taskPeriodCalc');

exports.setTaskSocketIoInstance = (ioInstance) => {
  io = ioInstance;
};
exports.createTask = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.schedule?.start || !req.body.schedule?.end) {
      throw {
        message: "Missing required fields: schedule.start or schedule.end",
        statusCode: 400
      };
    }

    // Prepare base task data
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
      status: req.body.status || 'pending', // Changed from 'pending'
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
      periodEndDate = calculateTaskPeriod(taskData.schedule.start, taskData.task_period);
    }

    // Create task(s)
    let tasks;
    if (taskData.repeat_frequency && periodEndDate) {
      tasks = await taskService.createRecurringTasks({
        baseTask: taskData,
        frequency: taskData.repeat_frequency,
        endDate: periodEndDate
      });
    } else {
      // For single task, ensure status is valid
      if (!['pending', 'in_progress', 'completed'].includes(taskData.status)) {
        taskData.status = 'pending';
      }
      const task = await taskService.createTask(taskData);
      tasks = [task];
    }

    // Prepare response
    const response = {
      success: true,
      message: tasks.length > 1 
        ? 'Recurring tasks created successfully' 
        : 'Task created successfully',
      data: tasks.length === 1 ? tasks[0] : tasks
    };

    // Emit socket event if available
    if (io) {
      try {
        const roomId = req.user.organization.toString();
        io.to(roomId).emit('taskCreated', {
          newTasks: tasks.length > 1 ? tasks : undefined,
          newTask: tasks.length === 1 ? tasks[0] : undefined,
          message: response.message
        });
      } catch (socketError) {
        console.error('Socket emission error:', socketError);
        // Don't fail the request because of socket error
      }
    }

    // Send response
    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
      data: null
    });
  }
};
// exports.createTask = async (req, res) => {
//   try {
//     // Validate required fields
//     if (!req.body.schedule?.start || !req.body.schedule?.end) {
//       throw {
//         message: "Missing required fields: schedule.start or schedule.end",
//         statusCode: 400
//       };
//     }

//     // Prepare base task data according to your DB schema
//     const taskData = {
//       title: req.body.title,
//       organization: req.user.organization,
//       createdBy: req.user._id,
//       resources: req.body.resources || [],
//       assignments: req.body.assigned_to?.map(userId => ({
//         user: userId,
//         role: 'assignee'
//       })) || [],
//       color_code: req.body.color_code || '#fbbf24',
//       status: req.body.status || 'pending',
//       repeat_frequency: req.body.repeat_frequency || '',
//       task_period: req.body.task_period || '',
//       schedule: {
//         start: new Date(req.body.schedule.start),
//         end: new Date(req.body.schedule.end),
//         timezone: req.body.schedule.timezone || 'UTC'
//       },
//       notes: req.body.notes || '',
//       priority: req.body.priority || 'medium',
//       visibility: req.body.visibility || 'team'
//     };

//     // Calculate period end date if recurring task
//     let periodEndDate = null;
//     if (taskData.task_period && taskData.repeat_frequency) {
//       try {
//         periodEndDate = calculateTaskPeriod(taskData.schedule.start, taskData.task_period);
//       } catch (err) {
//         throw {
//           message: err.message,
//           statusCode: 400
//         };
//       }
//     }

//     // Create single or recurring tasks
//     let tasks;
//     if (taskData.repeat_frequency && periodEndDate) {
//       // Generate recurring tasks
//       tasks = await taskService.createRecurringTasks({
//         baseTask: taskData,
//         frequency: taskData.repeat_frequency,
//         endDate: periodEndDate
//       });
//     } else {
//       // Create single task
//       const task = await taskService.createTask(taskData);
//       tasks = [task];
//     }
//     if (io) {
//       const roomId = req.user.organization.toString();
      
//       console.log('\n[Socket.IO Debug] Preparing to emit task creation event:');
//       console.log('  - Room ID:', roomId);
//       console.log('  - Number of tasks:', tasks.length);
//       console.log('  - First task ID:', tasks[0]?._id);
      
//       const emitData = {
//         newTasks: tasks.length > 1 ? tasks : undefined,
//         newTask: tasks.length === 1 ? tasks[0] : undefined,
//         message: tasks.length > 1 
//           ? 'Recurring tasks created successfully' 
//           : 'Task created successfully'
//       };
    
//       console.log('\n[Socket.IO Debug] Emission payload:');
//       console.log(JSON.stringify(emitData, null, 2));
      
//       try {
//         io.to(roomId).emit('taskCreated', emitData);
//         console.log('\n[Socket.IO Debug] Event successfully emitted to room:', roomId);
//       } catch (error) {
//         console.error('\n[Socket.IO Error] Failed to emit event:');
//         console.error(error);
//       }
//     }
  
//     sendResponse(res, 201, 
//       tasks.length > 1 ? 'Recurring tasks created successfully' : 'Task created successfully', 
//       tasks.length === 1 ? tasks[0] : tasks
//     );

//   } catch (error) {
//     sendResponse(res, error.statusCode || 500, error.message, null);
//   }
// };
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