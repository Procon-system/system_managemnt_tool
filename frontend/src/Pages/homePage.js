// import React, { useState } from 'react';
// import EventCalendarWrapper from '../Helper/EventCalendarWrapper';

// const HomePage = () => {
//   const [events, setEvents] = useState([
//     { id: '1', title: 'Meeting', start: '2024-11-07T10:00:00', end: '2024-11-07T11:00:00', color: 'green' },
//     // Add more initial events here
//   ]);

//   const updateEventInDatabase = async (updatedEvent) => {
//     try {
//     //   const response = await fetch('/api/updateEvent', {
//     //     method: 'POST',
//     //     headers: { 'Content-Type': 'application/json' },
//     //     body: JSON.stringify(updatedEvent),
//     //   });

//     //   if (!response.ok) {
//     //     console.error('Failed to update event in database:', response.statusText);
//     //   }
//     console.log("eventdata", updatedEvent);
//     } catch (error) {
//       console.error('Error updating event in database:', error);
//     }
//   };

//   const handleEventUpdate = (updatedEvent) => {
//     console.log('Received Updated Event Data:', updatedEvent);

//     // Update the state to reflect changes in the calendar
//     setEvents((prevEvents) =>
//       prevEvents.map((event) =>
//         event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
//       )
//     );

//     // Call function to persist changes to the database
//     updateEventInDatabase(updatedEvent);
//   };

//   return (
//     <div>
//       <h1>My Calendar</h1>
//       <EventCalendarWrapper events={events} onEventUpdate={handleEventUpdate} />
//     </div>
//   );
// };

// export default HomePage;
import React, { useState } from 'react';
import EventCalendarWrapper from '../Helper/EventCalendarWrapper';

const HomePage = () => {
  const [selectedEvent, setSelectedEvent] = useState(null); // To store clicked event
  const [isLoginVisible, setIsLoginVisible] = useState(false); // Control login modal visibility

  const handleEventClick = (event) => {
    setSelectedEvent(event); // Set event to edit or view
    setIsLoginVisible(true); // Show login modal
  };

  const closeModal = () => {
    setIsLoginVisible(false);
    setSelectedEvent(null); // Clear event on close
  };

  return (
    <div>
      <EventCalendarWrapper
        // events={/* Your event data */}
        // onEventUpdate={/* Your update handler */}
        // onEventCreate={/* Your create handler */}
        openForm={handleEventClick} // Pass function to open form
      />

      {isLoginVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg max-w-sm w-full z-60">
            <h2 className="text-xl font-semibold mb-4">Login</h2>
            <form>
              {/* Login Form Fields */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">Username:</label>
                <input type="text" name="username" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">Password:</label>
                <input type="password" name="password" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">Login</button>
            </form>
            <button onClick={closeModal} className="mt-4 text-blue-500 underline">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
