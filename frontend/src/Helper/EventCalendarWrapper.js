
import React, { useEffect, useRef ,useState} from 'react';
import Calendar from '@event-calendar/core';
import DayGrid from '@event-calendar/day-grid';
import Interaction from '@event-calendar/interaction';
import List from '@event-calendar/list';
import ResourceTimeGrid from '@event-calendar/resource-time-grid';
import TimeGrid from '@event-calendar/time-grid';
import ResourceTimeline from '@event-calendar/resource-timeline';
import '@event-calendar/core/index.css';
import { v4 as uuidv4 } from 'uuid';

const EventCalendarWrapper = ({ events = [], onEventUpdate, onEventCreate, openForm, openCreateForm }) => {
  const calendarContainer = useRef(null);
  const [changedView, setChangedView] = useState('timeGridWeek'); // To keep track of current view
  const calendarRef = useRef(null);
  const mappedEvents = events.map(event => ({
    _id: event._id.toString(),
    start: event.start,
    end: event.end,
    title: event.title,
    color: event.color,
    allDay: event.allDay,
    extendedProps: {
      _id: event._id.toString(),
    },
  }));

  const adjustTimeForBackend = (time, timezoneOffset) => {
    const date = new Date(time);
    date.setHours(date.getHours() + timezoneOffset);
    return date.toISOString();
  };
 
  const handleViewChange = (view) => {
    console.log("view",view)
    setChangedView(view); // Update view when a button is clicked
  };
  useEffect(() => {
    if (!calendarContainer.current) return;

    calendarRef.current = new Calendar({
      target: calendarContainer.current,
      props: {
        plugins: [DayGrid, TimeGrid, List, ResourceTimeGrid, ResourceTimeline, Interaction],
        options: {
          view: changedView, // Set the default view
          selectable: true,
          editable: true,
          eventStartEditable: true,
          eventDurationEditable: true,
          events: mappedEvents,
          headerToolbar: {
            // start: 'month', center: '', end: 'today prev,next'  
            start: 'today,prev,next',  // "Today", "Prev", and "Next" buttons on the left
  center: 'title',           // Title in the center
  end: 'month,week,day,list resource,timeline' // Custom buttons on the right

          },
          customButtons: {
            month: {
              text: 'Month',
              click: () => handleViewChange('dayGridMonth'),
            },
            week: {
              text: 'Week',
              click: () => handleViewChange('timeGridWeek'),
            },
            day: {
              text: 'Day',
              click: () => handleViewChange('timeGridDay'),
              
            },
            list: {
              text: 'List',
              click: () => handleViewChange('listWeek'),
            },
            resource: {
              text: 'Resource',
              click: () => handleViewChange('resourceTimeGridWeek'),
              
            },
            timeline: {
              text: 'Timeline',
              click: () => handleViewChange('resourceTimeLine'),
              
            },
          },
         // Map events to be shown
          select: (info) => {
            const { start, end, resource } = info;
            const timezoneOffset = 3; // Adjust this value based on the expected timezone
            const adjustedStartTime = adjustTimeForBackend(start, timezoneOffset);
            const adjustedEndTime = adjustTimeForBackend(end, timezoneOffset);
            const generatedId = uuidv4();
            const newEvent = {
              _id: generatedId,
              start_time: adjustedStartTime,
              end_time: adjustedEndTime,
              color_code: 'green',
              title: 'new task',
              resource,
            };
            openCreateForm(newEvent);
          },
          dateClick: (info) => {
            const timezoneOffset = 3; 
            const adjustedStartTime = adjustTimeForBackend(info.date, timezoneOffset);
            const newEvent = {
              _id: uuidv4(),
              start_time: adjustedStartTime,
              color_code: 'green',
              title: 'new task',
            };
            openCreateForm(newEvent); // Open form with pre-filled start time
          },
          eventClick: (info) => {
            const { event } = info;
            const mongoId = event.extendedProps._id || event._id;
            const updatedEvent = {
              ...event,
              _id: mongoId,
            };
            openForm(updatedEvent);
          },
          eventResize: (info) => {
            const { event } = info;
            const mongoId = event.extendedProps._id;
            const timezoneOffset = 3;
            const adjustedStartTime = adjustTimeForBackend(event.start, timezoneOffset);
            const adjustedEndTime = adjustTimeForBackend(event.end, timezoneOffset);
            const updatedEvent = {
              _id: mongoId,
              start_time: adjustedStartTime,
              end_time: adjustedEndTime,
            };
            onEventUpdate(updatedEvent);
          },
          eventDrop: (info) => {
            const { event, jsEvent } = info;
            const timezoneOffset = 3;
            const adjustedStartTime = adjustTimeForBackend(event.start, timezoneOffset);
            const adjustedEndTime = adjustTimeForBackend(event.end, timezoneOffset);

            if (jsEvent.altKey) {
              const generatedId = uuidv4();
              const duplicatedEvent = {
                ...jsEvent,
                _id: generatedId,
                start_time: adjustedStartTime,
                end_time: adjustedEndTime,
                color_code: event.backgroundColor,
                title: event.title,
              };
              onEventCreate(duplicatedEvent);
            } else {
              const mongoId = event.extendedProps._id;
              const updatedEvent = {
                _id: mongoId,
                start_time: adjustedStartTime,
                end_time: adjustedEndTime,
              };
              onEventUpdate(updatedEvent);
            }
          },
        },
      },
    });
    // calendarRef.current.render();

    return () => 
      calendarRef.current.destroy();
   // return () => ec.destroy(); // Cleanup on component unmount
  }, [events, onEventUpdate, onEventCreate, openForm, openCreateForm]);
  useEffect(() => {
    // Update the calendar view when `changedView` changes
    if (calendarRef.current) {
      calendarRef.current.setOption('view', changedView);
    }
  }, [changedView]);
  return (
    <div>
      {/* View Switcher Buttons */}
      {/* <div style={{ marginBottom: '10px' }}>
        <button onClick={() => handleViewChange('dayGridMonth')}>+ Facility</button>
        <button onClick={() => handleViewChange('timeGridWeek')}>+ Material</button>
        <button onClick={() => handleViewChange('timeGridDay')}>+Tools</button>
        <button onClick={() => handleViewChange('listWeek')}></button>
        <button onClick={() => handleViewChange('resourceTimeGridWeek')}>Resource Week</button>
      </div> */}

      {/* Calendar Container */}
      <div ref={calendarContainer} id="ec" />
    </div>
  );
};

export default EventCalendarWrapper;
