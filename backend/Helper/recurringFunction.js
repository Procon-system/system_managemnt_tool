// const { v4: uuidv4 } = require('uuid'); // UUID for unique IDs
// const generateRecurringTasksWithinPeriod = (baseTask, repeatFrequency, taskPeriodEnd) => {
//   const additionalTasks = [];
//   let nextStartTime = new Date(baseTask.start_time);
//   let nextEndTime = new Date(baseTask.end_time);
//   const taskPeriodLimit = new Date(taskPeriodEnd);

//   while (nextStartTime < taskPeriodLimit) {
//     switch (repeatFrequency.toLowerCase()) {
//       case "daily":
//         nextStartTime.setDate(nextStartTime.getDate() + 1);
//         nextEndTime.setDate(nextEndTime.getDate() + 1);
//         break;
//       case "weekly":
//         nextStartTime.setDate(nextStartTime.getDate() + 7);
//         nextEndTime.setDate(nextEndTime.getDate() + 7);
//         break;
//       case "monthly":
//         nextStartTime.setMonth(nextStartTime.getMonth() + 1);
//         nextEndTime.setMonth(nextEndTime.getMonth() + 1);
//         break;
//       default:
//         throw new Error(`Invalid repeat frequency: ${repeatFrequency}`);
//     }

//     if (nextStartTime > taskPeriodLimit) break;

//     additionalTasks.push({
//       ...baseTask,
//       _id: `task:${uuidv4()}`, // Unique ID for recurring task
//       start_time: nextStartTime.toISOString(),
//       end_time: nextEndTime.toISOString(),
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     });
//   }

//   return additionalTasks;
// };
// module.exports=generateRecurringTasksWithinPeriod;

const { addDays, addWeeks, addMonths, addYears } = require('date-fns'); 
const generateRecurringInstances = (baseTask, frequency, endDate) => {
  const tasks = [];
  let currentStart = new Date(baseTask.schedule.start);
  let currentEnd = new Date(baseTask.schedule.end);
  const periodEnd = new Date(endDate);

  // Calculate duration of the original task to maintain it for all instances
  const durationMs = currentEnd.getTime() - currentStart.getTime();

  // --- REFACTORED PARSING LOGIC ---
  const freqLower = frequency.toLowerCase();
  let interval = 1;
  let unit = freqLower;

  const match = freqLower.match(/^(\d+)\s*(daily|weekly|monthly|yearly|day|week|month|year)s?$/);

  if (match) {
    interval = parseInt(match[1], 10);
    // Normalize the unit to its singular form
    unit = match[2].replace(/s$/, ''); // remove plural 's'
  }
  // --- END OF REFACTORED PARSING LOGIC ---

  while (currentStart <= periodEnd) {
    // We only create clones for dates *after* the original start date
    if (currentStart > new Date(baseTask.schedule.start)) {
      const taskClone = {
        ...baseTask,
        _id: undefined, // Let MongoDB generate a new ID
        schedule: {
          start: new Date(currentStart),
          end: new Date(currentStart.getTime() + durationMs), // Apply original duration
          timezone: baseTask.schedule.timezone,
        },
        isRecurringInstance: true,
        rootTask: baseTask._id || null,
      };
      tasks.push(taskClone);
    }

    // --- UNIFIED INCREMENT LOGIC ---
    // Increment the start date for the next loop
    switch (unit) {
      case 'daily':
      case 'day':
        currentStart = addDays(currentStart, interval);
        break;
      case 'weekly':
      case 'week':
        currentStart = addWeeks(currentStart, interval);
        break;
      case 'monthly':
      case 'month':
        currentStart = addMonths(currentStart, interval);
        break;
      case 'yearly':
      case 'year':
        currentStart = addYears(currentStart, interval);
        break;
      default:
        // If frequency is invalid, break the loop to prevent infinite execution
        console.error(`Invalid recurrence unit: ${unit}`);
        return tasks;
    }
  }

  return tasks;
};
module.exports=generateRecurringInstances;