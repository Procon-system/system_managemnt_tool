
import React, { useEffect, useRef ,useState,useMemo} from 'react';
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

  const EventCalendarWrapper = ({ events = [],onEventUpdate, onEventCreate, openForm, openCreateForm}) => {
  const calendarContainer = useRef(null);
  const [changedView, setChangedView] = useState('timeGridWeek'); // To keep track of current view
  const calendarRef = useRef(null);
  const user =useSelector((state) => state.auth);
  const currentDateRef = useRef(new Date()); // Initialize with a default value

const handleDateChange = (args) => {
  try {
    currentDateRef.current = args.start; // Update the ref with the new start date
  } catch (err) {
    console.error('Error in handleDateChange:', err);
  }
};
 const mappedEvents = events.map(event => ({
    _id: event._id,
    start:  event.start_time || event.start || new Date(),
    end:  event.end_time || event.end || new Date(),
    title: event.title || 'Untitled Event',
    color: event.color || '#cccccc', // Default color
    allDay: event.allDay,
    resourceIds: [
      ...(event.assigned_resources?.assigned_to || [])
        .filter(user => user?._id) // Filter out invalid resources
        .map(user => user._id),
      ...(event.assigned_resources?.tools || [])
        .filter(tool => tool?._id)
        .map(tool => tool._id),
      ...(event.assigned_resources?.materials || [])
        .filter(material => material?._id)
        .map(material => material._id),
    ],
    extendedProps: {
      _id: event._id,
      image: event.image,
      notes: event.notes,
      status: event.status,
      assigned_resources: {
        assigned_to: event.assigned_resources?.assigned_to || [],
        tools: event.assigned_resources?.tools || [],
        materials: event.assigned_resources?.materials || [],
      },
    },
  }));
  const groupedAssignedResources = useMemo(() => [
    {
      id: 'assignedUsers',
      title: 'Assigned Users',
      children: (events || []).flatMap(event =>
        (event.assigned_resources?.assigned_to || [])
          .filter(user => user?._id)
          .map(user => ({
            id: user._id,
            title: `${user.first_name || 'Unknown'} ${user.last_name || 'Unknown'}`,
            parent: 'assignedUsers',
          }))
      ),
    },
    {
      id: 'tools',
      title: 'Tools',
      children: (events || []).flatMap(event =>
        (event.assigned_resources?.tools || [])
          .filter(tool => tool?._id)
          .map(tool => ({
            id: tool._id,
            title: tool.tool_name || 'Unknown Tool',
            parent: 'tools',
          }))
      ),
    },
    {
      id: 'materials',
      title: 'Materials',
      children: (events || []).flatMap(event =>
        (event.assigned_resources?.materials || [])
          .filter(material => material?._id)
          .map(material => ({
            id: material._id,
            title: material.material_name || 'Unknown Material',
            parent: 'materials',
          }))
      ),
    },
  ], [events]);
  console.log("events",events);
  // Memoize assigned_resources to prevent unnecessary re-renders
  const assigned_resources = useMemo(() => [...groupedAssignedResources], [groupedAssignedResources]);

  const adjustTimeForBackend = (time, timezoneOffset) => {
    const date = new Date(time);
    date.setHours(date.getHours() + timezoneOffset);
    return date.toISOString();
  };   
  // const handleViewChange = (view) => {
  //   setChangedView(view);
  //   if (calendarRef.current) {
  //     calendarRef.current.setOption('view', view);
  //     if (view === 'year') {
  //       const { start, end } = getYearRange();
  //       calendarRef.current.setOption({visibleRange:{ start, end }},);
  //     }
  //   }
  // };
  const handleViewChange = (view) => {
    setChangedView(view);
    if (calendarRef.current) {
      calendarRef.current.setOption('view', view);
      
      if (view === 'year') {
        const { start, end } = getYearRange();
        calendarRef.current.setOption('visibleRange', { start, end });
      }
    }
  };
  
  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1); // Jan 1
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59); // Dec 31
  
    // Validate the dates
    if (isNaN(startOfYear.getTime()) || isNaN(endOfYear.getTime())) {
      console.error('Invalid date range!');
    }
  
    return { start: startOfYear, end: endOfYear };
  };
  useEffect(() => {
    if (calendarRef.current) {
    }
  }, [mappedEvents]);
  
  useEffect(() => {
    if (!calendarContainer.current) return;
    // Destroy existing calendar to prevent multiple instances
    if (calendarRef.current) {
      calendarRef.current.destroy();
    }
    if (!mappedEvents || !groupedAssignedResources) {
      console.warn('Mapped events or grouped resources are not ready yet.');
      return;
    }
   console.log("calendarRef.current",calendarRef.current);
    calendarRef.current = new Calendar({
      target: calendarContainer.current,
      props: {
        plugins: [DayGrid, TimeGrid, List, ResourceTimeGrid, ResourceTimeline, Interaction],
        options: {
          date: currentDateRef.current,
          view: changedView,
          selectable: true,
          editable: true,
          eventStartEditable: true,
          eventDurationEditable: true,
          events: mappedEvents,
          resources: assigned_resources,
          headerToolbar: {
            start: 'today,prev,next',
            center: 'title',
            end: 'year,month,week,day,list,resource,timeline',
          },
          datesSet: (args) => {
        try {
          console.log('Dates Set Triggered:', args);
          handleDateChange(args); // Ensure handler is valid
        } catch (err) {
          console.error('Error in datesSet handler:', err);
        }
      },
          views: {
            listYear: {
              type: 'list',
              duration: { months: 24 },
              buttonText: 'Year',
            },
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
            year: {
              text: 'Year',
              click: () => handleViewChange('listYear'),
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
 
            openForm(updatedEvent);
          },
          eventResize: async(info) => {
            if (user.access_level < 3) {
              toast.error('You do not have permission to create events.');
              return;
            }
            const { event } = info;
              try {
              const mongoId = event.extendedProps._id; // Ensure this exists
              const timezoneOffset = 3;
              const adjustedStartTime = adjustTimeForBackend(event.start, timezoneOffset);
              const adjustedEndTime = adjustTimeForBackend(event.end, timezoneOffset);
          
              const updatedEvent = {
                _id: mongoId,
                start_time: adjustedStartTime,
                end_time: adjustedEndTime,
                title: event.title, // Include other fields if necessary
                color: event.backgroundColor, // Example: Ensure color persists
              };
             await onEventUpdate(updatedEvent); // Call the provided update handler
             
              } catch (error) {
              console.error('Error updating event:', error);
              info.revert(); // Revert changes if update fails
            }
          },
          eventDrop: async (info) => {
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
              await onEventCreate(duplicatedEvent);
            } else {
              const mongoId = event.extendedProps._id; // Ensure this exists
              const updatedEvent = {
                _id: mongoId,
                start_time: adjustedStartTime,
                end_time: adjustedEndTime,
                color: event.backgroundColor,
                title: event.title,
              };
              await onEventUpdate(updatedEvent);
              }
          },
        },
      },
    });
    // calendarRef.current.refetchEvents(); 

    // // Cleanup on Unmount
    // return () => {
    //   if (calendarRef.current) {
    //     console.log("calendarRef.current",calendarRef.current)
    //     calendarRef.current.destroy();
    //     calendarRef.current = null;
    //   }
    // };
     // Update calendar view after currentDate change
    }, [,events, assigned_resources, changedView]);
 
 
   return (
    <>
      {/* Calendar Container */}
      <div ref={calendarContainer} id="ec" />
    </>
  );
};


export default EventCalendarWrapper;
