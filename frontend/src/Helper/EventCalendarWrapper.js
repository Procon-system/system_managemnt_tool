
import React, { useEffect, useRef } from 'react';
import Calendar from '@event-calendar/core';
import TimeGrid from '@event-calendar/time-grid';
import Interaction from '@event-calendar/interaction';
import '@event-calendar/core/index.css';
import { v4 as uuidv4 } from 'uuid';
const EventCalendarWrapper = ({ events = [], onEventUpdate, onEventCreate, openForm }) => {
  const calendarContainer = useRef(null);
  const mappedEvents = events.map(event => ({
   
    _id: event._id.toString(),  // Ensure _id is passed as a string
    start: event.start,
    end: event.end,
    title: event.title,
  color: event.color, 
    allDay: event.allDay,
    extendedProps: {
      _id: event._id.toString(),  // Store MongoDB _id here
      // Other properties
    },
    // other properties
  }));
  const adjustTimeForBackend = (time, timezoneOffset) => {
    const date = new Date(time); // Convert to Date object
    date.setHours(date.getHours() + timezoneOffset); // Adjust by the timezone offset
    return date.toISOString(); // Convert back to ISO string for backend
  };
  console.log("mapped", mappedEvents)
console.log("idd",events)
  useEffect(() => {
    if (!calendarContainer.current) return;

    const ec = new Calendar({
      target: calendarContainer.current,
      props: {
        plugins: [TimeGrid, Interaction],
        options: {
          view: 'timeGridWeek',
          events:mappedEvents,
          selectable: true,
          editable: true,
          eventStartEditable: true,
          eventDurationEditable: true,

          // Handle event creation via click-and-drag
          select: (info) => {
            const { start, end, resource } = info;
            const newEvent = {
              title: 'New Event',
              start: start.toISOString(),
              end: end.toISOString(),
              resource,
            };
            onEventCreate(newEvent);
          },

          // Open pop-up form on event click
          eventClick: (info) => {
            const { event } = info;
          
            // Access the MongoDB _id from the event's extendedProps
            const mongoId = event.extendedProps._id || event._id; // Using _id from extendedProps or event directly
          
            // Add MongoDB _id to the event object if it's not already there
            const updatedEvent = {
              ...event, // Spread the existing event properties
              _id: mongoId, // Ensure MongoDB _id is included
            };
          
            console.log('Event clicked:', updatedEvent);  // Log the event with the MongoDB _id
          
            // Pass the updated event with MongoDB _id to the openForm function
            openForm(updatedEvent);
          },
          

eventResize: (info) => {
  const { event } = info;
  
  // Access MongoDB _id from extendedProps
  const mongoId = event.extendedProps._id;
  console.log("Event on resize:", event);
  console.log("MongoDB _id on resize:", mongoId);
  
  // Adjust the times for the backend (example: UTC+3 offset, change as needed)
  const timezoneOffset = 3; // Adjust this value based on the expected timezone of your backend
  const adjustedStartTime = adjustTimeForBackend(event.start, timezoneOffset);
  const adjustedEndTime = adjustTimeForBackend(event.end, timezoneOffset);
  
  // Create the updated event object with adjusted times
  const updatedEvent = {
    _id: mongoId,  // Use the MongoDB _id from extendedProps
    start_time: adjustedStartTime,  // Adjusted start time for backend
    end_time: adjustedEndTime,  // Adjusted end time for backend
  };
  
  // Pass the updated event to onEventUpdate function
  onEventUpdate(updatedEvent);
},

// eventDrop handler
eventDrop: (info) => {
  const { event, jsEvent } = info;
  console.log("Event on drop:", event);
  
  const generatedId = uuidv4(); 
  const eventId = event._id || event.id;  // Fallback to event.id if _id is missing

  // Handle ALT key for duplication
  if (jsEvent.altKey) {
    const duplicatedEvent = {
      ...event,
      _id: generatedId, // Generates a unique ID for the duplicated event
      start: event.start.toISOString(),
      end: event.end.toISOString(),
    };
    onEventCreate(duplicatedEvent); // Create new event
  } else {
    if (!eventId) {
      console.error("Missing _id or id on event drop.");
      return;
    }
    
    const mongoId = event.extendedProps._id;
    
    // Adjust the times for the backend (example: UTC+3 offset, change as needed)
    const timezoneOffset = 3; // Adjust this value based on the expected timezone of your backend
    const adjustedStartTime = adjustTimeForBackend(event.start, timezoneOffset);
    const adjustedEndTime = adjustTimeForBackend(event.end, timezoneOffset);
    
    // Create the updated event object with new start and end times
    const updatedEvent = {
      _id: mongoId, // Use _id for update
      start_time: adjustedStartTime, // Adjusted start time for backend
      end_time: adjustedEndTime, // Adjusted end time for backend
    };
    
    // Pass the updated event to onEventUpdate
    onEventUpdate(updatedEvent);
  }
},

        },
      },
    });

    return () => ec.destroy();
  }, [events, onEventUpdate, onEventCreate, openForm]);

  return <div ref={calendarContainer} id="ec" />;
};

export default EventCalendarWrapper;
