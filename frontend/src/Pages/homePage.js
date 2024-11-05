import React, { useState } from 'react';
import EventCalendarWrapper from '../Helper/EventCalendarWrapper';

const HomePage = () => {
  const [events, setEvents] = useState([
    { id: '1', title: 'Meeting', start: '2024-11-07T10:00:00', end: '2024-11-07T11:00:00', color: 'green' },
    // Add more initial events here
  ]);

  const updateEventInDatabase = async (updatedEvent) => {
    try {
    //   const response = await fetch('/api/updateEvent', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(updatedEvent),
    //   });

    //   if (!response.ok) {
    //     console.error('Failed to update event in database:', response.statusText);
    //   }
    console.log("eventdata", updatedEvent);
    } catch (error) {
      console.error('Error updating event in database:', error);
    }
  };

  const handleEventUpdate = (updatedEvent) => {
    console.log('Received Updated Event Data:', updatedEvent);

    // Update the state to reflect changes in the calendar
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
      )
    );

    // Call function to persist changes to the database
    updateEventInDatabase(updatedEvent);
  };

  return (
    <div>
      <h1>My Calendar</h1>
      <EventCalendarWrapper events={events} onEventUpdate={handleEventUpdate} />
    </div>
  );
};

export default HomePage;
