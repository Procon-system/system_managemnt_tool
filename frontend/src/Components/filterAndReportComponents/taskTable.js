import React from "react";

const TaskTable = ({ tasks }) => {
  console.log("tasks", tasks);
  return (
    <div className="mt-6">
     <div className="flex flex-wrap justify-between items-center w-full mb-4">
  {/* Left-aligned Title */}
  <h2 className="text-xl bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-semibold">
    Filtered Results
  </h2>

  {/* Right-aligned Button */}
  <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
    Generate Report
  </button>
</div>

      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="bg-blue-300">
            <tr className="text-left">
              <th className="py-3 px-6 border-b">Title</th>
              <th className="py-3 px-6 border-b">Assigned To</th>
              <th className="py-3 px-6 border-b">Facility</th>
              <th className="py-3 px-6 border-b">Machine</th>
              <th className="py-3 px-6 border-b">Status</th>
              <th className="py-3 px-6 border-b">Task Period</th>
              <th className="py-3 px-6 border-b">Tools</th>
              <th className="py-3 px-6 border-b">Materials</th>
            </tr>
          </thead>
          <tbody>
            {tasks?.length > 0 ? (
              tasks.map((task, index) => (
                <tr
                  key={task._id}
                  className={`text-sm ${index % 2 === 0 ? "bg-blue-50" : "bg-blue-100"} hover:bg-blue-200`}
                >
                  {/* Task Title */}
                  <td className="py-3 px-6 border-b whitespace-nowrap">
                    {task.title || "N/A"}
                  </td>

                  {/* Assigned Users (Display Names Instead of IDs) */}
                  <td className="py-3 px-6 border-b whitespace-nowrap">
                    {Array.isArray(task.assigned_to)
                      ? task.assigned_to.map(user => `${user.first_name} ${user.last_name}`).join(", ") || "N/A"
                      : "N/A"}
                  </td>

                  {/* Facility (Display Name Instead of ID) */}
                  <td className="py-3 px-6 border-b whitespace-nowrap">
                    {task.facility?.facility_name || "N/A"}
                  </td>

                  {/* Machine (Display Name Instead of ID) */}
                  <td className="py-3 px-6 border-b whitespace-nowrap">
                    {task.machine?.machine_name || "N/A"}
                  </td>

                  {/* Task Status */}
                  <td className="py-3 px-6 border-b">{task.status || "N/A"}</td>

                  {/* Task Period */}
                  <td className="py-3 px-6 border-b whitespace-nowrap">
                    {task.task_period || "N/A"}
                  </td>

                  {/* Tools (Display Names Instead of IDs) */}
                  <td className="py-3 px-6 border-b whitespace-nowrap">
                    {Array.isArray(task.tools)
                      ? task.tools.map(tool => tool.tool_name || "Unknown").join(", ")
                      : "N/A"}
                  </td>

                  {/* Materials (Display Names Instead of IDs) */}
                  <td className="py-3 px-6 border-b whitespace-nowrap">
                    {Array.isArray(task.materials)
                      ? task.materials.map(material => material.material_name || "Unknown").join(", ")
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-4 text-center text-gray-500">
                  No tasks found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable;
