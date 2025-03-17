// src/services/taskService.js
import axios from 'axios';
import { localDB } from '../pouchDb';
import { v4 as uuidv4 } from 'uuid';
const API_URL = 'http://localhost:5000/api/tasks';
const syncLocalDataWithBackend = async (token) => {
  let isSyncing = false; // Sync lock to prevent multiple simultaneous syncs

  if (isSyncing) {
    console.log("🔄 Sync already in progress. Skipping...");
    return;
  }

  isSyncing = true; // Lock the sync process

  try {
    // Fetch the tasks document from the local database
    const tasksDoc = await localDB.get('tasks').catch(() => null);

    if (tasksDoc) {
      // Extract the tasks array from the document
      const tasks = tasksDoc.data;
      console.log('Tasks in localDB:', tasks);

      // Filter for unsynced tasks (including bulk updates)
      const unsyncedTasks = tasks.filter((task) => !task.synced);
      console.log('Unsynced tasks:', unsyncedTasks);

      // Group unsynced tasks by type: deleted, new, updated, or bulk updated
      const deletedTasks = unsyncedTasks.filter((task) => task._deleted);
      const newTasks = unsyncedTasks.filter((task) => task.isNew);
      const updatedTasks = unsyncedTasks.filter(
        (task) => !task._deleted && !task.isNew && !task.bulkUpdated
      );
      const bulkUpdatedTasks = unsyncedTasks.filter((task) => task.bulkUpdated);

      // Sync deleted tasks
      for (const task of deletedTasks) {
        try {
          console.log('Syncing deleted task:', task._id);
          await axios.delete(`${API_URL}/delete-tasks/${task._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          // Remove the deleted task from the local database
          const updatedTasks = tasks.filter((t) => t._id !== task._id);

          // Fetch the latest revision to avoid conflicts
          const latestDoc = await localDB.get('tasks');
          await localDB.put({
            _id: 'tasks',
            _rev: latestDoc._rev,
            data: updatedTasks,
          });

          console.log('Deleted task synced and removed from localDB.');
        } catch (error) {
          console.error(`Error syncing deleted task ${task._id}:`, error.response?.data || error.message);
          // Mark the task as synced to prevent infinite retries
          const updatedTasks = tasks.map((t) =>
            t._id === task._id ? { ...t, synced: true } : t
          );
          await localDB.put({
            _id: 'tasks',
            _rev: tasksDoc._rev,
            data: updatedTasks,
          });
        }
      }

      // Sync new tasks
      for (const task of newTasks) {
        try {
          console.log('Syncing new task:', task._id);
          const { _id, isNew, ...taskData } = task;

          // Create the task on the server
          const response = await axios.post(`${API_URL}/create-tasks`, taskData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          // Replace the temporary task with the one returned by the server
          const updatedTasks = tasks
            .filter((t) => t._id !== task._id) // Remove the temporary task
            .concat({ ...response.data, synced: true, isNew: false }); // Add the synced task

          // Fetch the latest revision to avoid conflicts
          const latestDoc = await localDB.get('tasks');
          await localDB.put({
            _id: 'tasks',
            _rev: latestDoc._rev,
            data: updatedTasks,
          });

          console.log('New task synced and updated in localDB.');
        } catch (error) {
          console.error(`Error syncing new task ${task._id}:`, error.response?.data || error.message);
          // Mark the task as synced to prevent infinite retries
          const updatedTasks = tasks.map((t) =>
            t._id === task._id ? { ...t, synced: true } : t
          );
          await localDB.put({
            _id: 'tasks',
            _rev: tasksDoc._rev,
            data: updatedTasks,
          });
        }
      }

      // Sync updated tasks (non-bulk)
      // for (const task of updatedTasks) {
      //   try {
      //     console.log('Syncing updated task:', task._id);

      //     // Fetch the latest version of the task from the server
      //     const latestTask = await axios.get(`${API_URL}/get-tasks-id/${task._id}`, {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     });

      //     // Merge the local changes with the latest version from the server
      //     const mergedTask = {
      //       ...latestTask.data, // Start with the server's version
      //       ...task, // Overwrite with local changes
      //       _rev: latestTask.data._rev, // Use the latest _rev from the server
      //     };

      //     // Log the merged task to verify the updated values
      //     console.log('Merged task payload:', mergedTask);

      //     // Update the task on the server
      //     await axios.put(`${API_URL}/update-tasks/${task._id}`, mergedTask, {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     });

      //     // Mark the task as synced in the local database
      //     const updatedTasks = tasks.map((t) =>
      //       t._id === task._id ? { ...t, synced: true } : t
      //     );

      //     // Fetch the latest revision to avoid conflicts
      //     const latestDoc = await localDB.get('tasks');
      //     await localDB.put({
      //       _id: 'tasks',
      //       _rev: latestDoc._rev,
      //       data: updatedTasks,
      //     });

      //     console.log('Updated task synced and marked as synced in localDB.');
      //   } catch (error) {
      //     console.error(`Error syncing updated task ${task._id}:`, error.response?.data || error.message);
      //     // Mark the task as synced to prevent infinite retries
      //     const updatedTasks = tasks.map((t) =>
      //       t._id === task._id ? { ...t, synced: true } : t
      //     );
      //     await localDB.put({
      //       _id: 'tasks',
      //       _rev: tasksDoc._rev,
      //       data: updatedTasks,
      //     });
      //   }
      // }
// Sync updated tasks (non-bulk)
for (const task of updatedTasks) {
  try {
    console.log('Syncing updated task:', task._id);

    // Fetch the latest version of the task from the server
    const latestTask = await axios.get(`${API_URL}/get-tasks-id/${task._id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Merge the local changes with the latest version from the server
    const mergedTask = {
      ...latestTask.data, // Start with the server's version
      ...task, // Overwrite with local changes
      _rev: latestTask.data._rev, // Use the latest _rev from the server
    };

    // Log the merged task to verify the updated values
    console.log('Merged task payload:', mergedTask);

    // Update the task on the server
    await axios.put(`${API_URL}/update-tasks/${task._id}`, mergedTask, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle image uploads if the task has images
    if (task.images && task.images.length > 0) {
      
      // Check for new or updated images
      for (const imageName of task.images) {
        try {
          // Fetch the image attachment from PouchDB
          const imageBlob = await localDB.getAttachment(task._id, imageName);

          // Upload the image to the server
          const formData = new FormData();
          formData.append('images', imageBlob, imageName);

          await axios.post(`${API_URL}/upload-images/${task._id}`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

          console.log(`Image ${imageName} uploaded successfully.`);
        } catch (imageError) {
          console.error(`Error uploading image ${imageName}:`, imageError.response?.data || imageError.message);
        }
      }
    }

    // Mark the task as synced in the local database
    const updatedTasks = tasks.map((t) =>
      t._id === task._id ? { ...t, synced: true } : t
    );

    // Fetch the latest revision to avoid conflicts
    const latestDoc = await localDB.get('tasks');
    await localDB.put({
      _id: 'tasks',
      _rev: latestDoc._rev,
      data: updatedTasks,
    });

    console.log('Updated task synced and marked as synced in localDB.');
  } catch (error) {
    console.error(`Error syncing updated task ${task._id}:`, error.response?.data || error.message);
    // Mark the task as synced to prevent infinite retries
    const updatedTasks = tasks.map((t) =>
      t._id === task._id ? { ...t, synced: true } : t
    );
    await localDB.put({
      _id: 'tasks',
      _rev: tasksDoc._rev,
      data: updatedTasks,
    });
  }
}
      // Sync bulk updated tasks
      if (bulkUpdatedTasks.length > 0) {
        try {
          console.log('Syncing bulk updated tasks:', bulkUpdatedTasks);

          // Prepare bulk update payload
          const bulkUpdatePayload = bulkUpdatedTasks.map((task) => ({
            id: task._id,
            updateData: {
              start_time: task.start_time,
              end_time: task.end_time,
              color: task.color,
              title: task.title,
              updated_at: new Date().toISOString(),
            },
          }));

          // Send bulk updates to the server
          const response = await axios.put(
            `${API_URL}/bulk-update`,
            { taskUpdates: bulkUpdatePayload },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log('Bulk update response:', response.data);

          // Mark bulk updated tasks as synced in the local database
          const updatedTasks = tasks.map((task) =>
            bulkUpdatedTasks.some((t) => t._id === task._id)
              ? { ...task, synced: true, bulkUpdated: false } // Mark as synced and reset bulkUpdated flag
              : task
          );

          // Fetch the latest revision to avoid conflicts
          const latestDoc = await localDB.get('tasks');
          await localDB.put({
            _id: 'tasks',
            _rev: latestDoc._rev,
            data: updatedTasks,
          });

          console.log('Bulk updated tasks synced and marked as synced in localDB.');
        } catch (error) {
          console.error('Error syncing bulk updated tasks:', error.response?.data || error.message);
          // Mark tasks as synced to prevent infinite retries
          const updatedTasks = tasks.map((task) =>
            bulkUpdatedTasks.some((t) => t._id === task._id)
              ? { ...task, synced: true, bulkUpdated: false } // Mark as synced and reset bulkUpdated flag
              : task
          );
          await localDB.put({
            _id: 'tasks',
            _rev: tasksDoc._rev,
            data: updatedTasks,
          });
        }
      }

      console.log('Sync process for tasks completed.');
    } else {
      console.error('Tasks document not found in localDB.');
    }
  } catch (error) {
    console.error('Error during sync process for tasks:', error.response?.data || error.message);
    throw error.response?.data || new Error('Error during sync process for tasks');
  } finally {
    isSyncing = false; // Release the sync lock
  }
};
const taskService = {
createTask : async (taskData, token) => {
    try {
      if (navigator.onLine) {
        // Online: Create task on the server
        const response = await axios.post(`${API_URL}/create-tasks`, taskData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        // Sync the created task with the local database
        const createdTask = response.data;
  
        // Fetch the existing tasks document
        const existingDoc = await localDB.get('tasks').catch(() => null);
  
        if (existingDoc) {
          // Add the new task to the data array
          const updatedTasks = [...existingDoc.data, { ...createdTask, synced: true, isNew: false }];
  
          // Update the document with the new tasks array
          await localDB.put({
            _id: 'tasks',
            _rev: existingDoc._rev,
            data: updatedTasks,
          });
  
          console.log('Task added to localDB:', createdTask);
        } else {
          // Create a new tasks document if it doesn't exist
          await localDB.put({
            _id: 'tasks',
            data: [{ ...createdTask, synced: true, isNew: false }],
          });
  
          console.log('New tasks document created in localDB:', createdTask);
        }
  
        return createdTask.results;
      } 
      else {
        const taskId = `task:${uuidv4()}`; // Generate a task:<UUID> _id
      
        // Function to get color based on task status
        const getColorForStatus = (status) => {
          const statusColorMap = {
            pending: "#ffcc00", // Yellow for pending tasks
            in_progress: "#007bff", // Blue for in-progress tasks
            completed: "#28a745", // Green for completed tasks
            cancelled: "#dc3545", // Red for cancelled tasks
          };
          return statusColorMap[status] || "#6c757d"; // Default to gray if status is unknown
        };
      
        const newTask = {
          _id: taskId,
          color: getColorForStatus(taskData.status), // Assign color based on status
          type: 'task',
          ...taskData, // Spread the rest of the task data
          synced: false, // Mark as unsynced
          isNew: true, // Mark as new task
        };
      
        try {
          // Fetch the existing tasks document
          const existingDoc = await localDB.get('tasks').catch(() => null);
      
          if (existingDoc) {
            // Add the new task to the data array
            const updatedTasks = [...existingDoc.data, newTask];
      
            // Update the document with the new tasks array
            await localDB.put({
              _id: 'tasks',
              _rev: existingDoc._rev,
              data: updatedTasks,
            });
      
            console.log('Task saved locally:', newTask);
          } else {
            // Create a new tasks document if it doesn't exist
            await localDB.put({
              _id: 'tasks',
              data: [newTask],
            });
      
            console.log('New tasks document created in localDB:', newTask);
          }
      
          return { taskData: newTask }; // Wrap the task in a taskData field
        } catch (error) {
          console.error('Failed to save task locally:', error);
      
          // Fallback function to save task with color
          const fallbackTask = {
            _id: taskId,
            color: getColorForStatus(taskData.status), // Ensure the task has a color
            type: 'task',
            ...taskData,
            synced: false,
            isNew: true,
          };
      
          // Attempt to save the task again
          try {
            await localDB.put({
              _id: taskId,
              ...fallbackTask,
            });
      
            console.log('Task saved using fallback function:', fallbackTask);
            return { taskData: fallbackTask };
          } catch (fallbackError) {
            console.error('Fallback save failed:', fallbackError);
            throw new Error('Failed to save task locally and in fallback.');
          }
        }
      }
      // else {
        // const taskId = `task:${uuidv4()}`; // Generate a task:<UUID> _id
        // const newTask = {
        //   _id: taskId,
        //   type: 'task',
        //   ...taskData,
        //   synced: false, // Mark as unsynced
        //   isNew: true, // Mark as new task
        // };
  
        // // Fetch the existing tasks document
        // const existingDoc = await localDB.get('tasks').catch(() => null);
  
        // if (existingDoc) {
        //   // Add the new task to the data array
        //   const updatedTasks = [...existingDoc.data, newTask];
  
        //   // Update the document with the new tasks array
        //   await localDB.put({
        //     _id: 'tasks',
        //     _rev: existingDoc._rev,
        //     data: updatedTasks,
        //   });
  
        //   console.log('Task saved locally:', newTask);
        // } else {
        //   // Create a new tasks document if it doesn't exist
        //   await localDB.put({
        //     _id: 'tasks',
        //     data: [newTask],
        //   });
  
        //   console.log('New tasks document created in localDB:', newTask);
        // }
  
        // return { taskData: newTask }; // Wrap the task in a taskData field
      // }
      
    } catch (error) {
      console.error('Error creating task:', error.response?.data || error.message);
      throw error || new Error('Error creating task');
    }
},
fetchTasks: async (token) => {
  try {
    let tasks;

    if (navigator.onLine) {
      // Online: Fetch tasks from the server
      const response = await axios.get(`${API_URL}/get-all-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      tasks = response.data;

      console.log("Fetched tasks from server:", tasks);

      // Save tasks to local PouchDB for offline use
      try {
        const existingDoc = await localDB.get("tasks").catch(() => null);

        const docToSave = {
          _id: "tasks",
          data: tasks.map((task) => ({ ...task, synced: true, isNew: false })),
        };

        if (existingDoc) {
          docToSave._rev = existingDoc._rev;
        }

        await localDB.put(docToSave);
        console.log("Tasks saved to PouchDB successfully.");

        // Save images as attachments in PouchDB
        for (const task of tasks) {
          if (task.images && task.images.length > 0) {
            let taskDoc;

            try {
              taskDoc = await localDB.get(task._id);
            } catch (err) {
              if (err.status === 404) {
                taskDoc = { _id: task._id, type: "task" };
                await localDB.put(taskDoc);
                console.log(`Task document ${task._id} created in PouchDB.`);
                taskDoc = await localDB.get(task._id); // Fetch the new revision
              } else {
                throw err;
              }
            }

            for (const image of task.images) {
              let retryCount = 0;
              let saved = false;

              while (!saved && retryCount < 3) {
                try {
                  const imageResponse = await axios.get(`${API_URL}/get-images/${task._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });

                  const imageData = imageResponse.data.images.find((img) => img.name === image.name);

                  if (imageData) {
                    const byteCharacters = atob(imageData.base64.split(",")[1]);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const imageBlob = new Blob([byteArray], { type: imageData.mimeType });

                    // Save image as attachment with correct _rev
                    const result = await localDB.putAttachment(
                      taskDoc._id,
                      image.name,
                      taskDoc._rev,
                      imageBlob,
                      imageData.mimeType
                    );

                    console.log(`Image ${image.name} saved to PouchDB.`);
                    taskDoc._rev = result.rev; // Update _rev for next image
                    saved = true;
                  } else {
                    console.error(`Image ${image.name} not found in response.`);
                    break;
                  }
                } catch (imageError) {
                  if (imageError.name === "conflict") {
                    console.warn(`Conflict detected for image ${image.name}. Retrying...`);
                    taskDoc = await localDB.get(task._id); // Fetch latest _rev
                    retryCount++;
                  } else {
                    console.error(`Error fetching or saving image ${image.name}:`, imageError);
                    break;
                  }
                }
              }
            }
          }
        }
        console.log("Images saved to PouchDB successfully.");
      } catch (err) {
        if (err.name === "conflict") {
          console.log("Document conflict detected. Retrying...");
          const latestDoc = await localDB.get("tasks");
          await localDB.put({
            _id: "tasks",
            _rev: latestDoc._rev,
            data: tasks.map((task) => ({ ...task, synced: true, isNew: false })),
          });
          console.log("Tasks updated in PouchDB successfully.");
        } else {
          console.error("Error saving tasks to PouchDB:", err);
          throw err;
        }
      }

      return tasks;
    } else {
      console.log("App is offline. Fetching tasks from PouchDB...");
      const localData = await localDB.get("tasks").catch(() => ({ data: [] }));
      console.log("Fetched tasks from PouchDB:", localData.data);
      return localData.data;
    }
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    throw new Error("Failed to fetch tasks");
  }
},
updateTask: async (taskId, updatedData, token) => {
  try {
    // Fetch the tasks document from the local database
    const tasksDoc = await localDB.get('tasks').catch(() => null);

    if (!tasksDoc) {
      throw new Error('Tasks document not found in localDB.');
    }

    // Find the task to update in the data array
    const tasks = tasksDoc.data;
    const taskIndex = tasks.findIndex((task) => task._id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task ${taskId} not found in localDB.`);
    }

    let updatedTask;

    if (navigator.onLine) {
      // Online: Update task on the remote API
      const response = await axios.put(`${API_URL}/update-tasks/${taskId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Sync the updated task with the local database
      updatedTask = response.data.task;
      updatedTask.synced = true; // Mark as synced
    } else {
      // Offline: Update task locally and mark as unsynced
      // Convert FormData to a plain object
      const updatedDataObj = {};
      updatedData.forEach((value, key) => {
        updatedDataObj[key] = value;
      });

      // Merge updated data with the existing task
      updatedTask = {
        ...tasks[taskIndex], // Keep existing task properties
        ...updatedDataObj, // Overwrite with updated data
        synced: false, // Mark as unsynced
      };

      // Handle image updates offline
      if (updatedDataObj.images && updatedDataObj.images.length > 0) {
        // Fetch the individual task document
        let taskDoc;
        try {
          taskDoc = await localDB.get(taskId);
        } catch (err) {
          if (err.status === 404) {
            // Create a new task document if it doesn't exist
            taskDoc = { _id: taskId, type: "task" };
            await localDB.put(taskDoc);
            taskDoc = await localDB.get(taskId); // Fetch the new revision
          } else {
            throw err;
          }
        }

        // Save new images as attachments in PouchDB
        for (const image of updatedDataObj.images) {
          if (image instanceof File) {
            const imageBlob = new Blob([image], { type: image.type });

            // Save image as attachment with correct _rev
            await localDB.putAttachment(
              taskId,
              image.name,
              taskDoc._rev,
              imageBlob,
              image.type
            );

            console.log(`Image ${image.name} saved to PouchDB as attachment.`);
            taskDoc = await localDB.get(taskId); // Fetch the latest revision
          }
        }

        // Update the task's images array with the new image names
        updatedTask.images = updatedDataObj.images.map((img) => img.name || img);
      }
    }

    // Update the task in the tasks array
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = updatedTask;

    // Update the tasks document
    await localDB.put({
      _id: 'tasks',
      _rev: tasksDoc._rev,
      data: updatedTasks,
    });

    console.log('Task updated successfully:', updatedTask);
    return updatedTask;
  } catch (error) {
    console.error("Error updating task:", error.response?.data || error.message);
    throw error.response?.data || error.message || new Error("Error updating task");
  }
},
deleteTask: async (taskId, token) => {
  try {
    // Fetch the tasks document from the local database
    const tasksDoc = await localDB.get('tasks').catch(() => null);

    if (!tasksDoc) {
      throw new Error('Tasks document not found in localDB.');
    }

    // Find the task to delete in the data array
    const tasks = tasksDoc.data;
    const taskIndex = tasks.findIndex((task) => task._id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task ${taskId} not found in localDB.`);
    }

    if (navigator.onLine) {
      // Online: Delete task from the remote API
      const response = await axios.delete(`${API_URL}/delete-tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove the task from the tasks array
      const updatedTasks = tasks.filter((task) => task._id !== taskId);

      // Update the tasks document
      await localDB.put({
        _id: 'tasks',
        _rev: tasksDoc._rev,
        data: updatedTasks,
      });

      console.log('Task deleted successfully:', taskId);
      return response.data;
    } else {
      // Offline: Mark the task as deleted locally
      const updatedTasks = tasks.map((task) =>
        task._id === taskId ? { ...task, _deleted: true, synced: false } : task
      );

      // Update the tasks document
      await localDB.put({
        _id: 'tasks',
        _rev: tasksDoc._rev,
        data: updatedTasks,
      });

      console.log('Task marked for deletion (offline):', taskId);
      return { message: "Task marked for deletion (offline)" };
    }
  } catch (error) {
    console.error('Error deleting task:', error.response?.data || error.message);
    throw error.response?.data || new Error('Error deleting task');
  }
},
getTasksByAssignedUser: async (userId, token) => {
  try {
    if (navigator.onLine) {
      // Online: Fetch tasks from the remote API
      const response = await axios.get(`${API_URL}/get-tasks/assigned`, {
        params: { userId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Sync fetched tasks with the local database
      const tasksDoc = await localDB.get('tasks').catch(() => null);
      if (tasksDoc) {
        const updatedTasks = tasksDoc.data.map((task) => {
          const updatedTask = response.data.find((t) => t._id === task._id);
          return updatedTask ? { ...task, ...updatedTask, synced: true } : task;
        });

        await localDB.put({
          _id: 'tasks',
          _rev: tasksDoc._rev,
          data: updatedTasks,
        });
      }

      return response.data;
    } else {
      // Offline: Fetch tasks from the local database
      const tasksDoc = await localDB.get('tasks').catch(() => null);
      if (!tasksDoc) {
        console.log('No tasks found in PouchDB. Returning empty array.');
        return [];
      }

      const tasks = tasksDoc.data.filter((task) => task.assigned_to?.includes(userId));
      return tasks;
    }
  } catch (error) {
    console.error('Error fetching tasks:', error.response?.data || error.message);
    throw error.response?.data || new Error('Error fetching tasks');
  }
},
getTasksDoneByAssignedUser: async (userId, token) => {
  try {
    if (navigator.onLine) {
      // Online: Fetch done tasks from the remote API
      const response = await axios.get(`${API_URL}/get-tasks/done/user`, {
        params: { userId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Sync fetched tasks with the local database
      const tasksDoc = await localDB.get('tasks').catch(() => null);
      if (tasksDoc) {
        const updatedTasks = tasksDoc.data.map((task) => {
          const updatedTask = response.data.find((t) => t._id === task._id);
          return updatedTask ? { ...task, ...updatedTask, synced: true } : task;
        });

        await localDB.put({
          _id: 'tasks',
          _rev: tasksDoc._rev,
          data: updatedTasks,
        });
      }

      return response.data;
    } else {
      // Offline: Fetch done tasks from the local database
      const tasksDoc = await localDB.get('tasks').catch(() => null);
      if (!tasksDoc) {
        console.log('No tasks found in PouchDB. Returning empty array.');
        return [];
      }

      const tasks = tasksDoc.data.filter(
        (task) => task.assigned_to?.includes(userId) && task.status === 'done'
      );
      return tasks;
    }
  } catch (error) {
    console.error('Error fetching tasks:', error.response?.data || error.message);
    throw error.response?.data || new Error('Error fetching tasks');
  }
},
getAllDoneTasks: async (token) => {
  try {
    if (navigator.onLine) {
      // Online: Fetch all done tasks from the remote API
      const response = await axios.get(`${API_URL}/get-tasks/done`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Sync fetched tasks with the local database
      const tasksDoc = await localDB.get('tasks').catch(() => null);
      if (tasksDoc) {
        const updatedTasks = tasksDoc.data.map((task) => {
          const updatedTask = response.data.find((t) => t._id === task._id);
          return updatedTask ? { ...task, ...updatedTask, synced: true } : task;
        });

        await localDB.put({
          _id: 'tasks',
          _rev: tasksDoc._rev,
          data: updatedTasks,
        });
      }

      return response.data;
    } else {
      // Offline: Fetch all done tasks from the local database
      const tasksDoc = await localDB.get('tasks').catch(() => null);
      if (!tasksDoc) {
        console.log('No tasks found in PouchDB. Returning empty array.');
        return [];
      }

      const tasks = tasksDoc.data.filter((task) => task.status === 'done');
      return tasks;
    }
  } catch (error) {
    console.error('Error fetching tasks:', error.response?.data || error.message);
    throw error.response?.data || new Error('Error fetching tasks');
  }
},
bulkUpdateTasks: async (tasksData, token) => {
    try {
    if (navigator.onLine) {
      // Online: Send updates to the backend
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Format the data to match backend expectations
      const taskUpdates = tasksData.map((task) => ({
        id: task._id,
        updateData: {
          start_time: task.start_time,
          end_time: task.end_time,
          color: task.color,
          title: task.title,
          updated_at: new Date().toISOString(),
        },
      }));

      const response = await axios.put(
        `${API_URL}/bulk-update`,
        { taskUpdates },
        config
      );
      // Update local DB with the latest changes from the backend
      const tasksDoc = await localDB.get('tasks').catch(() => null);
      if (tasksDoc) {
        const updatedTasks = tasksDoc.data.map((task) => {
          const updatedTask = response.data.results.find((t) => t._id === task._id);
          return updatedTask
            ? { ...task, ...updatedTask, synced: true, bulkUpdated: false } // Mark as synced and reset bulkUpdated flag
            : task;
        });

        await localDB.put({
          _id: 'tasks',
          _rev: tasksDoc._rev,
          data: updatedTasks,
        });
      }

      return response.data.results; // Return the updated tasks data
    } else {
      // Offline: Store updates in PouchDB and mark them for sync later
      const tasksDoc = await localDB.get('tasks').catch(() => null);
      if (!tasksDoc) {
        throw new Error('Tasks document not found in localDB.');
      }

      const updatedTasks = tasksDoc.data.map((task) => {
        const updatedTask = tasksData.find((t) => t._id === task._id);
        return updatedTask
          ? { ...task, ...updatedTask, synced: false, bulkUpdated: true } // Mark as unsynced and bulkUpdated
          : task;
      });

      await localDB.put({
        _id: 'tasks',
        _rev: tasksDoc._rev,
        data: updatedTasks,
      });

      return updatedTasks; // Return the locally updated tasks
    }
  } catch (error) {
    console.log("error service", error);
    console.error("Error updating tasks:", error.response?.data || error.message);
    throw error.response?.data || error.message || new Error("Error updating tasks");
  }
},

filterTasks : async (filters) => {
  try {
    if (navigator.onLine) {
      // Online: Fetch filtered tasks from the backend
      const response = await axios.get(`${API_URL}/filter`, { params: filters });

      // Sync the fetched tasks to PouchDB for offline use
      const tasksDoc = await localDB.get('tasks').catch(() => null);
      if (tasksDoc) {
        tasksDoc.data = response.data;
        await localDB.put(tasksDoc);
      } else {
        await localDB.put({ _id: 'tasks', data: response.data });
      }

      return response.data;
    } else {
      // Offline: Fetch tasks from PouchDB and apply filters locally
      const tasksDoc = await localDB.get('tasks').catch(() => null);
      if (!tasksDoc) {
        console.log('No tasks found in PouchDB. Returning empty array.');
        return [];
      }

      console.log("tasksDoc from PouchDB:", tasksDoc);

      const tasks = tasksDoc.data;
      if (!Array.isArray(tasks)) {
        console.error("Invalid tasks data structure in PouchDB. Expected an array.");
        return [];
      }

      console.log("Tasks from PouchDB:", tasks);
      console.log("Filters:", filters);

      // Apply filters locally
      const filteredTasks = tasks.filter((task) => {
        console.log("Checking task:", task._id);

        // Filter by status (skip if filter is empty)
        if (filters.status && filters.status.length > 0) {
          const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
          if (!statusArray.includes(task.status)) {
            console.log(`Task ${task._id} excluded: status mismatch`);
            return false;
          }
        }

        // Filter by assigned_to (skip if filter is empty)
        if (filters.assignedTo && filters.assignedTo.length > 0) {
          const assignedToArray = Array.isArray(filters.assignedTo) ? filters.assignedTo : [filters.assignedTo];
          if (
            !task.assigned_to ||
            !Array.isArray(task.assigned_to) ||
            !task.assigned_to.some((user) => assignedToArray.includes(user._id))
          ) {
            console.log(`Task ${task._id} excluded: assigned_to mismatch`);
            return false;
          }
        }

        // Filter by facility
        if (filters.facility) {
          const taskFacilityId = task.facility?._id || task.facility; // Handle both object and string cases
          if (taskFacilityId !== filters.facility) {
            console.log(`Task ${task._id} excluded: facility mismatch (task: ${taskFacilityId}, filter: ${filters.facility})`);
            return false;
          }
        }

        // Filter by machine (skip if filter is empty)
        if (filters.machine && task.machine !== filters.machine) {
          console.log(`Task ${task._id} excluded: machine mismatch`);
          return false;
        }

        // Filter by tools (skip if filter is empty)
        if (filters.tools && filters.tools.length > 0) {
          const toolsArray = Array.isArray(filters.tools) ? filters.tools : [filters.tools];
          if (
            !task.tools ||
            !Array.isArray(task.tools) ||
            !task.tools.some((tool) => toolsArray.includes(tool._id))
          ) {
            console.log(`Task ${task._id} excluded: tools mismatch`);
            return false;
          }
        }

        // Filter by materials (skip if filter is empty)
        if (filters.materials && filters.materials.length > 0) {
          const materialsArray = Array.isArray(filters.materials) ? filters.materials : [filters.materials];
          if (
            !task.materials ||
            !Array.isArray(task.materials) ||
            !task.materials.some((material) => materialsArray.includes(material._id))
          ) {
            console.log(`Task ${task._id} excluded: materials mismatch`);
            return false;
          }
        }

        // Filter by date range (skip if filter is empty)
        if (filters.startDate && filters.endDate) {
          const taskDate = new Date(task.start_time);
          const startDate = new Date(filters.startDate);
          const endDate = new Date(filters.endDate);
          if (taskDate < startDate || taskDate > endDate) {
            console.log(`Task ${task._id} excluded: date mismatch`);
            return false;
          }
        }

        return true;
      });

      console.log("Filtered tasks:", filteredTasks);
      return filteredTasks;
    }
  } catch (error) {
    console.error("Error filtering tasks:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error filtering tasks");
  }
},
// ✅ Wrapper function to check if sync is needed before calling it
checkAndSync : async (token) => {
  try {
      await syncLocalDataWithBackend(token);
    
  } catch (error) {
    console.error("❌ Error checking tasks for sync:", error.message);
  }
},
// ✅ Function to remove duplicate tasks (Optional Cleanup)
removeDuplicateTasks : async () => {
  try {
    const result = await localDB.allDocs({ include_docs: true });
    const tasks = result.rows.map((row) => row.doc);

    const seenIds = new Set();
    for (const task of tasks) {
      if (seenIds.has(task._id)) {
        console.log(`🗑️ Deleting duplicate task: ${task._id}`);
        await localDB.remove(task); // Remove duplicate tasks
      } else {
        seenIds.add(task._id); // Track task IDs
      }
    }
    console.log("✅ Duplicate tasks removed.");
  } catch (error) {
    console.error("❌ Error removing duplicate tasks:", error.message);
  }
}
};
export default taskService;
