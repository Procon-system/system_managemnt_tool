
import React from 'react';

const EventDetailsModal = ({
  isVisible,
  closeModal,
  selectedEvent,
  role,
  handleFormSubmit
}) => {
  console.log("role",selectedEvent);
  const onSubmit = (e) => {
    e.preventDefault();
    const updatedEvent = {
    ...selectedEvent,
    status: e.target.status?.value, // Always available for role >= 2
    notes: e.target.notes?.value,  // Available for role 2
  };

  // Add additional fields if the role is >= 3
  if (role >= 3) {
    updatedEvent.title = e.target.title?.value;
    updatedEvent.start_time = e.target.start?.value;
    updatedEvent.end_time = e.target.end?.value;
  }

    handleFormSubmit(updatedEvent); // Call the handler passed from the parent (HomePage)
  };

  if (!isVisible || !selectedEvent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-white p-6 rounded-lg max-w-sm w-full">
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-2 right-2 text-red-700 hover:text-red-900 text-2xl font-bold transition-transform transform hover:scale-110"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">Event Details</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          {role >= 3 && (
            <>
              <div>
                <label className="block mb-1 text-sm font-medium">Title:</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={selectedEvent.title}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Start Time:</label>
                <input
                  type="datetime-local"
                  name="start"
                  defaultValue={new Date(selectedEvent.start).toLocaleDateString("en-CA") + "T" + new Date(selectedEvent.start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">End Time:</label>
                <input
                  type="datetime-local"
                  name="end"
                  defaultValue={new Date(selectedEvent.end).toLocaleDateString("en-CA") + "T" + new Date(selectedEvent.end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </>
          )}
           {role >= 2 && (
            <div>
              <label className="block mb-1 text-sm font-medium">Status:</label>
              <select
                name="status"
                defaultValue={selectedEvent.status || "pending"}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="in progress">In progress</option>
                <option value="done">Done</option>
                <option value="impossible">Impossible</option>
                <option value="overdue">Overdue</option>
              </select>
            
             <label className="block mb-1 text-sm font-medium">Note:</label>
             <textarea
               name="notes"
               defaultValue={selectedEvent.notes}
               className="w-full px-3 py-2 border rounded-md"
             />
           </div>
          )}
          <div className="flex justify-between mt-6">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventDetailsModal;
