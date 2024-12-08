
const TaskModel = {
  _id: '',                    // Unique identifier for the task
  type: 'task',               // Type to distinguish task documents
  title: '',                  // Title of the task
  facility: '',               // Foreign key: ID of the associated Facility
  machine: '',                // Foreign key: ID of the associated Machine
  service_location: '',       // Location for the task
  task_period: '',            // Period for task execution (e.g., 'daily', 'weekly')
  repeat_frequency: '',       // Frequency of repetition
  status: 'pending',          // Task status: pending, in progress, etc.
  notes: '',                  // Optional notes about the task
  image: '',                  // ID of the image document in GridFS
  start_time: '',             // Start time (ISO 8601 format)
  end_time: '',               // End time (ISO 8601 format)
  color_code: '',             // Status-dependent color code (blue, green, yellow, red, etc.)
  alarm_enabled: false,       // Boolean to indicate if alarm is enabled
  assigned_to: [],            // Array of User IDs assigned to this task
  created_by: '',             // ID of the User who created the task
  tools: [],                  // Array of Tool IDs required for the task
  materials: [],              // Array of Material IDs required for the task
  created_at: '',             // Timestamp for task creation
  updated_at: '',             // Timestamp for the last update
};

module.exports = TaskModel;
