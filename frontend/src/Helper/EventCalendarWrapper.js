// import React, { useEffect, useRef } from 'react';
// import Calendar from '@event-calendar/core';
// import TimeGrid from '@event-calendar/time-grid';
// import Interaction from '@event-calendar/interaction';
// import '@event-calendar/core/index.css';

// const EventCalendarWrapper = ({ events = [], onEventUpdate }) => {
//   const calendarContainer = useRef(null);

//   useEffect(() => {
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
//         },
//       },
//     });
//     console.log("ec",ec)
  
//     // Listen for event drop
//     ec.$on('eventDrop', (info) => {
//       console.log("starting")
//       const updatedEvent = {
//         id: info.event.id,
//         start: info.event.start.toISOString(),
//         end: info.event.end.toISOString(),
//         oldStart: info.oldEvent.start.toISOString(),
//         oldEnd: info.oldEvent.end.toISOString(),
//         delta: info.delta, // Duration object for time moved
//         resourceChange: info.oldResource && info.newResource, // Whether the resource has changed
//         ...info.event,
//       };
//       console.log('Event Dropped:', updatedEvent);

//       // Update callback with the new event details
//       onEventUpdate(updatedEvent);
//     });

//     // Listen for event resize
//     ec.$on('eventResize', (info) => {
//       console.log("starting event resize")
//       const updatedEvent = {
//         id: info.event.id,
//         start: info.event.start.toISOString(),
//         end: info.event.end.toISOString(),
//         oldStart: info.oldEvent.start.toISOString(),
//         oldEnd: info.oldEvent.end.toISOString(),
//         endDelta: info.endDelta, // Duration object for time extended
//         ...info.event,
//       };
//       console.log('Event Resized:', updatedEvent);

//       // Update callback with the resized event details
//       onEventUpdate(updatedEvent);
//     });

//     return () => ec.destroy();
//   }, [events, onEventUpdate]);
// console.log('hhh');
//   return <div ref={calendarContainer} id="ec" />;
// };

// export default EventCalendarWrapper;
import React, { useEffect, useRef } from 'react';
import Calendar from '@event-calendar/core';
import TimeGrid from '@event-calendar/time-grid';
import Interaction from '@event-calendar/interaction';
import '@event-calendar/core/index.css';

const EventCalendarWrapper = ({ events = [], onEventUpdate }) => {
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
          selectable: true,
          editable: true,
          eventStartEditable: true,
          eventDurationEditable: true,

          // Attach listeners directly in options
          eventResize: (info) => {
            console.log("starting event resize");
            const updatedEvent = {
              id: info.event.id,
              start: info.event.start.toISOString(),
              end: info.event.end.toISOString(),
              oldStart: info.oldEvent.start.toISOString(),
              oldEnd: info.oldEvent.end.toISOString(),
              endDelta: info.endDelta,
              ...info.event,
            };
            console.log('Event Resized:', updatedEvent);

            onEventUpdate(updatedEvent);
          },

          eventDrop: (info) => {
            console.log("starting event drop");
            const updatedEvent = {
              id: info.event.id,
              start: info.event.start.toISOString(),
              end: info.event.end.toISOString(),
              oldStart: info.oldEvent.start.toISOString(),
              oldEnd: info.oldEvent.end.toISOString(),
              delta: info.delta,
              resourceChange: info.oldResource && info.newResource,
              ...info.event,
            };
            console.log('Event Dropped:', updatedEvent);

            onEventUpdate(updatedEvent);
          },
        },
      },
    });

    return () => ec.destroy(); // Cleanup on unmount
  }, [events, onEventUpdate]);

  return <div ref={calendarContainer} id="ec" />;
};

export default EventCalendarWrapper;
