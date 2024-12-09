
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
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
const EventCalendarWrapper = ({ events = [],onEventUpdate, onEventCreate, openForm, openCreateForm }) => {
  const calendarContainer = useRef(null);
  const [changedView, setChangedView] = useState('timeGridWeek'); // To keep track of current view
  const calendarRef = useRef(null);
  const user =useSelector((state) => state.auth);
  // const getStatusColor = (endDate) => {
  //   const now = new Date();
  //   const deadline = new Date(endDate);
  //   const daysLeft = (deadline - now) / (1000 * 60 * 60 * 24); // Calculate days difference
  
  //   if (daysLeft <= 0) {
  //     return 'red'; // Overdue
  //   } else if (daysLeft <= 2) {
  //     return 'yellow'; // Approaching deadline
  //   } else {
  //     return 'green'; // Ongoing
  //   }
  // };
  console.log("events",events)
  const mappedEvents = events.map(event => ({
    _id: event._id,
    start: event.start,
    end: event.end,
    title: event.title,
    color:  event.color,
    allDay: event.allDay,
    
    resourceIds: [
      ...(event.assigned_resources.assigned_to || []).map(user => user._id ? user._id.toString() : 'undefined'),
      ...(event.assigned_resources.tools || []).map(tool => tool._id ? tool._id.toString() : ''),
      ...(event.assigned_resources.materials || []).map(material => material._id ? material._id.toString() : ''),
    ],
    // resourceIds: [
    //   ...(event.assigned_resources.assigned_to || []).map(userId => userId.toString()),
    //   ...(event.assigned_resources.tools || []).map(toolId => toolId.toString()),
    //   ...(event.assigned_resources.materials || []).map(materialId => materialId.toString()),
    // ],
    extendedProps: {
      _id: event._id,
      image: event.image,
      notes:event.notes,
      status:event.status,
      assigned_resources: {
        assigned_to:event.assigned_resources.assigned_to || [],
        tools: event.assigned_resources.tools || [],
        materials: event.assigned_resources.materials || [],
      },
    },
  }));
  const groupedAssignedResources = [
  {
    id: 'assignedUsers',
    title: 'Assigned Users',
    children: events.flatMap(event => 
      (event.assigned_resources.assigned_to || []).map(user => ({
        id: user._id ? user._id.toString() : 'undefined',
        title: `${user.first_name} ${user.last_name}`,
        parent: 'assignedUsers'
      }))
    ),
  },
  {
    id: 'tools',
    title: 'Tools',
    children: events.flatMap(event => 
      (event.assigned_resources.tools || []).map(tool => ({
        id: tool._id ? tool._id.toString() : '',
        title: tool.tool_name,
        parent: 'tools'
      }))
    ),
  },
  {
    id: 'materials',
    title: 'Materials',
    children: events.flatMap(event => 
      (event.assigned_resources.materials || []).map(material => ({
        id: material._id ? material._id.toString() : '',
        title: material.material_name,
        parent: 'materials'
      }))
    ),
  },
];

// Combine parent categories and children into a single array
const assigned_resources = [
  ...groupedAssignedResources,
  // ...groupedAssignedResources.flatMap(group => group.children),
];
  console.log("mapped events",mappedEvents)
  const adjustTimeForBackend = (time, timezoneOffset) => {
    const date = new Date(time);
    date.setHours(date.getHours() + timezoneOffset);
    return date.toISOString();
  };
 
  const handleViewChange = (view) => {
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
          resources:  assigned_resources,
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
              click: () => handleViewChange('resourceTimelineDay'), // Corrected view name
            },
          },
          select: (info) => {
            if (user.access_level < 3) {
              // toast.success("Login successful!");
              toast.error('You do not have permission to create events.');
              return;
            }
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
            console.log("user",user);
            if (user.access_level < 3) {
              toast.error('You do not have permission to create events.');
              return;
            }
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
            if (user.access_level < 2) {
              toast.error('You do not have permission to create events.');
              return;
            }
             // Extract event details
  const { event } = info;
  const { extendedProps } = event;
  // Ensure `_id` is extracted properly, either from extendedProps or the event itself
  const mongoId = extendedProps?._id || event.id;
  // Construct updatedEvent with image and notes
  const updatedEvent = {
    _id: mongoId,
    title: event.title,
    start: event.start,
    end: event.end,
    color: event.backgroundColor,
    image: extendedProps?.image || null, // Add image if available
    notes: extendedProps?.notes || 'No notes available', // Add notes if available
    status: extendedProps?.status || null,
    // assigned_to: (extendedProps?.assigned_resources?.assigned_to || []).map((userId) => userId.toString()),};
  //   assigned_to: Array.isArray(extendedProps?.assigned_resources?.assigned_to)
  //   ? extendedProps.assigned_resources.assigned_to.map((userId) =>
  //       userId ? userId.toString() : "Unknown User"
  //     )
  //   : [],
  // materials: Array.isArray(extendedProps?.materials) ? extendedProps.materials : [],
  // tools: Array.isArray(extendedProps?.tools) ? extendedProps.tools : [],
  // resourceIds: Array.isArray(event.resourceIds)
  //   ? event.resourceIds.filter((id) => id && id !== "undefined") // Exclude invalid entries
  //   : [],
};
          console.log("updated",updatedEvent)  
            openForm(updatedEvent);
          },
          eventResize: (info) => {
            if (user.access_level < 3) {
              toast.error('You do not have permission to create events.');
              return;
            }
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
            if (user.access_level < 3) {
              toast.error('You do not have permission to create events.');
              return;
            }
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
      {/* Calendar Container */}
      <div ref={calendarContainer} id="ec" />
    </div>
  );
};

export default EventCalendarWrapper;
