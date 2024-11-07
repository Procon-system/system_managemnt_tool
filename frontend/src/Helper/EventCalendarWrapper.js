// // import React, { useEffect, useRef } from 'react';
// // import Calendar from '@event-calendar/core';
// // import TimeGrid from '@event-calendar/time-grid';
// // import Interaction from '@event-calendar/interaction';
// // import '@event-calendar/core/index.css';

// // const EventCalendarWrapper = ({ events = [], onEventUpdate }) => {
// //   const calendarContainer = useRef(null);

// //   useEffect(() => {
// //     const ec = new Calendar({
// //       target: calendarContainer.current,
// //       props: {
// //         plugins: [TimeGrid, Interaction],
// //         options: {
// //           view: 'timeGridWeek',
// //           events: events,
// //           selectable: true,
// //           editable: true,
// //           eventStartEditable: true,
// //           eventDurationEditable: true,
// //         },
// //       },
// //     });
// //     console.log("ec",ec)
  
// //     // Listen for event drop
// //     ec.$on('eventDrop', (info) => {
// //       console.log("starting")
// //       const updatedEvent = {
// //         id: info.event.id,
// //         start: info.event.start.toISOString(),
// //         end: info.event.end.toISOString(),
// //         oldStart: info.oldEvent.start.toISOString(),
// //         oldEnd: info.oldEvent.end.toISOString(),
// //         delta: info.delta, // Duration object for time moved
// //         resourceChange: info.oldResource && info.newResource, // Whether the resource has changed
// //         ...info.event,
// //       };
// //       console.log('Event Dropped:', updatedEvent);

// //       // Update callback with the new event details
// //       onEventUpdate(updatedEvent);
// //     });

// //     // Listen for event resize
// //     ec.$on('eventResize', (info) => {
// //       console.log("starting event resize")
// //       const updatedEvent = {
// //         id: info.event.id,
// //         start: info.event.start.toISOString(),
// //         end: info.event.end.toISOString(),
// //         oldStart: info.oldEvent.start.toISOString(),
// //         oldEnd: info.oldEvent.end.toISOString(),
// //         endDelta: info.endDelta, // Duration object for time extended
// //         ...info.event,
// //       };
// //       console.log('Event Resized:', updatedEvent);

// //       // Update callback with the resized event details
// //       onEventUpdate(updatedEvent);
// //     });

// //     return () => ec.destroy();
// //   }, [events, onEventUpdate]);
// // console.log('hhh');
// //   return <div ref={calendarContainer} id="ec" />;
// // };

// // export default EventCalendarWrapper;
// import React, { useEffect, useRef } from 'react';
// import Calendar from '@event-calendar/core';
// import TimeGrid from '@event-calendar/time-grid';
// import Interaction from '@event-calendar/interaction';
// import '@event-calendar/core/index.css';

// const EventCalendarWrapper = ({ events = [], onEventUpdate }) => {
//   const calendarContainer = useRef(null);

//   useEffect(() => {
//     if (!calendarContainer.current) return; // Ensure ref is available

//     const ec = new Calendar({
//       target: calendarContainer.current,
//       props: {
//         plugins: [TimeGrid, Interaction],
//         options: {
//           view: 'timeGridWeek',
//           events: events,
//           selectable: true,
//           editable: true,
//           eventStartEditable: true,
//           eventDurationEditable: true,

//           // Attach listeners directly in options
//           eventResize: (info) => {
//             console.log("starting event resize");
//             const updatedEvent = {
//               id: info.event.id,
//               start: info.event.start.toISOString(),
//               end: info.event.end.toISOString(),
//               oldStart: info.oldEvent.start.toISOString(),
//               oldEnd: info.oldEvent.end.toISOString(),
//               endDelta: info.endDelta,
//               ...info.event,
//             };
//             console.log('Event Resized:', updatedEvent);

//             onEventUpdate(updatedEvent);
//           },

//           eventDrop: (info) => {
//             console.log("starting event drop");
//             const updatedEvent = {
//               id: info.event.id,
//               start: info.event.start.toISOString(),
//               end: info.event.end.toISOString(),
//               oldStart: info.oldEvent.start.toISOString(),
//               oldEnd: info.oldEvent.end.toISOString(),
//               delta: info.delta,
//               resourceChange: info.oldResource && info.newResource,
//               ...info.event,
//             };
//             console.log('Event Dropped:', updatedEvent);

//             onEventUpdate(updatedEvent);
//           },
//         },
//       },
//     });

//     return () => ec.destroy(); // Cleanup on unmount
//   }, [events, onEventUpdate]);

//   return <div ref={calendarContainer} id="ec" />;
// };

// export default EventCalendarWrapper;
import React, { useEffect, useRef } from 'react';
import Calendar from '@event-calendar/core';
import TimeGrid from '@event-calendar/time-grid';
import Interaction from '@event-calendar/interaction';
import '@event-calendar/core/index.css';

const EventCalendarWrapper = ({ events = [], onEventUpdate, onEventCreate, openForm }) => {
  const calendarContainer = useRef(null);

  useEffect(() => {
    if (!calendarContainer.current) return; // Ensure ref is available

    const ec = new Calendar({
      target: calendarContainer.current,
      props: {
        plugins: [TimeGrid, Interaction],
        options: {
          view: 'timeGridWeek',
          events: events,
          selectable: true,  // Enable selection (click and drag to create event)
          editable: true,  // Enable editing (drag and drop to move events)
          eventStartEditable: true,
          eventDurationEditable: true,
          
          // Listen for event creation (click and drag)
          select: (info) => {
            const { start, end, resource } = info;
            const newEvent = {
              title: "New Event",
              start: start.toISOString(),
              end: end.toISOString(),
              resource: resource,
            };
            onEventCreate(newEvent);  // Trigger event creation callback
          },

          // Handle event click to open pop-up form
          eventClick: (info) => {
            const { event } = info;
            console.log("Event clicked:", event);
            // Open a pop-up form for editing
            openForm(event);  // Use openForm passed as prop
          },

          // Duplicate event on ALT key + drag-and-drop
          eventDrop: (info) => {
            console.log("starting event drop");
            const { event, oldEvent, delta, jsEvent } = info;

            // Check if ALT key was pressed during drag-and-drop
            if (jsEvent.altKey) {
              // Duplicate the event (do not update the original)
              const duplicatedEvent = {
                ...event,
                id: `${Date.now()}`,  // Generate a new ID for the duplicated event
                start: event.start.toISOString(),
                end: event.end.toISOString(),
              };
              onEventCreate(duplicatedEvent);  // Trigger event creation callback with duplicated event
            } else {
              const updatedEvent = {
                id: event.id,
                start: event.start.toISOString(),
                end: event.end.toISOString(),
                oldStart: oldEvent.start.toISOString(),
                oldEnd: oldEvent.end.toISOString(),
                delta: delta,
                ...event,
              };
              console.log('Event Dropped:', updatedEvent);
              onEventUpdate(updatedEvent);  // Persist the updated event to the database
            }
          },
        },
      },
    });

    return () => ec.destroy(); // Cleanup on unmount
  }, [events, onEventUpdate, onEventCreate, openForm]);

  return <div ref={calendarContainer} id="ec" />;
};

export default EventCalendarWrapper;
