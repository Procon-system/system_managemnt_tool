import React, { useEffect, useRef ,useState,useMemo,useCallback} from 'react';
import Calendar from '@event-calendar/core';
import DayGrid from '@event-calendar/day-grid';
import Interaction from '@event-calendar/interaction';
import List from '@event-calendar/list';
import ResourceTimeGrid from '@event-calendar/resource-time-grid';
import TimeGrid from '@event-calendar/time-grid';
import ResourceTimeline from '@event-calendar/resource-timeline';
import '@event-calendar/core/index.css';
import { useSelector} from 'react-redux';
import { toast } from 'react-toastify';
import promptForStartAndEndTime from './promptHelper';
import { handleMonthBulkUpdate, handleWeekBulkUpdate, handleSingleEventUpdate } from './eventDropHandler';
import {
   handleEventDuplication, 
  handleEventResize } from './calendarHandlers';

const EventCalendarWrapper = ({ events = [], onEventUpdate, onMultipleEventUpdate,calendarStartDate,calendarEndDate,updateEventState, setFilteredEvents, onEventCreate, openForm, openCreateForm }) => {
  const calendarContainer = useRef(null);
  const [changedView, setChangedView] = useState('timeGridWeek'); // To keep track of current view
  const calendarRef = useRef(null);
  const user = useSelector((state) => state.auth);
  const currentDateRef = useRef(new Date()); // Initialize with a default value
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const selectedEventsRef = useRef(new Set()); // Add this ref to persist selection
  const dragStartPositionsRef = useRef(new Map());
  const [calendarDate, setCalendarDate] = useState(new Date());  // Default to today's date
 
  const handleDateChange = (args) => {
    
    try {
      const currentView = args.view.type;
      
      let normalizedArgsStart;
      let normalizedCalendarDate;
      if (currentView === "dayGridMonth") {
        const viewStartYear = args.view.currentStart.getFullYear();
        const viewStartMonth = args.view.currentStart.getMonth();
        const updatedDate = new Date(viewStartYear, viewStartMonth, 1); 
        setCalendarDate(updatedDate);
      } 
       else {
        // For week and day views, normalize to the start of the day
        normalizedArgsStart = new Date(args.start).setHours(0, 0, 0, 0);
        normalizedCalendarDate = new Date(calendarDate).setHours(0, 0, 0, 0);
      }
  
      if (normalizedCalendarDate !== normalizedArgsStart) {
        setCalendarDate(new Date(normalizedArgsStart));
        currentDateRef.current = new Date(normalizedArgsStart);
      }
  
    } catch (err) {
      console.error("Error in handleDateChange:", err);
    }
  }; console.log("mappped",events)
  const mappedEvents = events.map(event => ({
    _id: event._id,
    start: event.start_time || event.start || new Date(),
    end: event.end_time || event.end || new Date(),
    title: event.title || 'Untitled Event',
    color: event.color || event.color_code || '#cccccc', // Default color
    allDay: event.allDay,
    // resourceIds: [
    //   ...(event.assigned_resources?.assigned_to || [])
    //     .filter(user => user?._id) // Filter out invalid resources
    //     .map(user => user._id),
    //   ...(event.assigned_resources?.tools || [])
    //     .filter(tool => tool?._id)
    //     .map(tool => tool._id),
    //   ...(event.assigned_resources?.materials || [])
    //     .filter(material => material?._id)
    //     .map(material => material._id),
    // ],
    resourceIds : [
      ...(Array.isArray(event.assigned_resources?.assigned_to) 
        ? event.assigned_resources.assigned_to.filter(user => user?._id).map(user => user._id) 
        : []),
      ...(Array.isArray(event.assigned_resources?.tools) 
        ? event.assigned_resources.tools.filter(tool => tool?._id).map(tool => tool._id) 
        : []),
      ...(Array.isArray(event.assigned_resources?.materials) 
        ? event.assigned_resources.materials.filter(material => material?._id).map(material => material._id) 
        : []),
    ],
    extendedProps: {
      _id: event._id,
      image: event.image,
      notes: event.notes,
      status: event.status,
      repeat_frequency:event.repeat_frequency,
      task_period:event.task_period,
      machine: event.machine,
      facility: event.facility,
      created_by: event.created_by,
      assigned_resources: {
        assigned_to: event.assigned_resources?.assigned_to || [],
        tools: event.assigned_resources?.tools || [],
        materials: event.assigned_resources?.materials || [],
      },
    },
  }));
  const groupedAssignedResources = useMemo(() => {
    // Create Sets to track unique IDs
    const uniqueUserIds = new Set();
    const uniqueToolIds = new Set();
    const uniqueMaterialIds = new Set();

    // Helper function to add unique resources
    const addUniqueResources = (resources, idSet) => {
      const uniqueResources = [];
      if (Array.isArray(resources)) {
      resources.forEach(resource => {
        if (resource?._id && !idSet.has(resource._id)) {
          idSet.add(resource._id);
          uniqueResources.push(resource);
        }
      });
      }
      return uniqueResources;
    };

    // Get all unique resources across all events
    const uniqueUsers = [];
    const uniqueTools = [];
    const uniqueMaterials = [];

    events.forEach(event => {
      if (event.assigned_resources) {
        // Add unique users
        const users = addUniqueResources(
          event.assigned_resources.assigned_to || [],
          uniqueUserIds
        );
        uniqueUsers.push(...users);

        // Add unique tools
        const tools = addUniqueResources(
          event.assigned_resources.tools || [],
          uniqueToolIds
        );
        uniqueTools.push(...tools);

        // Add unique materials
        const materials = addUniqueResources(
          event.assigned_resources.materials || [],
          uniqueMaterialIds
        );
        uniqueMaterials.push(...materials);
      }
    });

    return [
      {
        id: 'assignedUsers',
        title: 'Assigned Users',
        children: uniqueUsers.map(user => ({
          id: user._id,
          title: `${user.first_name || 'Unknown'} ${user.last_name || 'Unknown'}`,
          parent: 'assignedUsers',
        })),
      },
      {
        id: 'tools',
        title: 'Tools',
        children: uniqueTools.map(tool => ({
          id: tool._id,
          title: tool.tool_name || 'Unknown Tool',
          parent: 'tools',
        })),
      },
      {
        id: 'materials',
        title: 'Materials',
        children: uniqueMaterials.map(material => ({
          id: material._id,
          title: material.material_name || 'Unknown Material',
          parent: 'materials',
        })),
      },
    ];
  }, [events]);
  // Memoize assigned_resources to prevent unnecessary re-renders
  const assigned_resources = useMemo(() => [...groupedAssignedResources], [groupedAssignedResources]);
  const getTimezoneFromDate = (date) => {
    const timezoneOffsetMinutes = new Date(date).getTimezoneOffset(); // In minutes
    if (isNaN(timezoneOffsetMinutes)) {
      console.error('Invalid date for timezone calculation:', date);
      return null;
    }
    return -timezoneOffsetMinutes / 60; // Convert to hours
  };
  const adjustTimeForBackend = (time, timezoneOffset) => {
    try {
      // Validate time
      const date = new Date(time);
      if (isNaN(date.getTime())) {
        console.error('Invalid date input:', time);
        return null;
      }
  
      // Validate timezoneOffset
      if (typeof timezoneOffset !== 'number' || isNaN(timezoneOffset)) {
        console.error('Invalid timezone offset:', timezoneOffset);
        return null;
      }
  
      // Calculate UTC time and adjust for timezone
      const utcTime = date.getTime();
      const adjustedTime = new Date(utcTime + timezoneOffset * 60 * 60 * 1000);
  
      if (isNaN(adjustedTime.getTime())) {
        console.error('Invalid adjusted time:', adjustedTime);
        return null;
      }
  
      return adjustedTime.toISOString();
    } catch (error) {
      console.error('Error adjusting time:', error);
      return null;
    }
  };
  
  
  
  // Add this function to update event appearance
  const updateEventAppearance = (eventId, isSelected) => {
    const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
    if (eventElement) {
      if (isSelected) {
        eventElement.style.border = '2px solid #ff4444';
        eventElement.style.boxShadow = '0 0 4px rgba(255, 68, 68, 0.5)';
      } else {
        eventElement.style.border = '';
        eventElement.style.boxShadow = '';
      }
    }
  };
  const handleViewChange = (view) => {
    setChangedView(view);
  };

  useEffect(() => {
    if (calendarRef.current) {
     
    }
  }, [mappedEvents]);

  const preserveCalendarView = useCallback(() => {
    const calendarApi = calendarRef.current?.getView();
    if (calendarApi) {
      return {
        date: calendarApi.currentStart,
        view: calendarApi.type,
      };
    }
    return null;
  }, [calendarRef]); // Ensure calendarRef is included in the dependency array
  
  const restoreCalendarView = useCallback((viewState) => {
    const calendarApi = calendarRef.current;

    if (calendarApi && viewState) {
     
      calendarApi.view.currentStart.setDate(viewState.date);
      setCalendarDate(viewState.date);
    }
   
  }, [calendarRef]); // Ensure calendarRef is included in the dependency array
  

  const handleEventDrop = async (info) => {
    if (user.access_level < 3) {
      toast.error('You do not have permission to modify events.');
      info.revert();
      return;
    }

    const { event, jsEvent } = info;
    const deltaMs = event.start.getTime() - info.oldEvent.start.getTime();
    const selectedEventIds = Array.from(selectedEventsRef.current);
    try {
      if (selectedEventIds.length > 0 && !jsEvent.altKey) {
        if (info.view.type === "dayGridMonth") {
          await handleMonthBulkUpdate({
            info,
            event,
            deltaMs,
            selectedEventIds,
            events,
            calendarRef,
            onMultipleEventUpdate,
            clearEventSelection,
            promptForStartAndEndTime
          });
        } else {
          await handleWeekBulkUpdate({
            info,
            deltaMs,
            selectedEventIds,
            events,
            onMultipleEventUpdate,
            clearEventSelection,
            calendarRef
          });
        }
      } else if (jsEvent.altKey) {
        await handleEventDuplication({
          info,
          onEventCreate,
          adjustTimeForBackend,
          preserveCalendarView,
          restoreCalendarView,
          getTimezoneFromDate
        });
      } else {
        await handleSingleEventUpdate({
          info,
          onEventUpdate,
          adjustTimeForBackend,
          calendarRef,
          promptForStartAndEndTime,
          getTimezoneFromDate
        });
      }
    } catch (error) {
      console.error('Error in event drop:', error);
      info.revert();
      toast.error('Failed to update event(s)');
    }
  
  };
  
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
    calendarRef.current = new Calendar({
      target: calendarContainer.current,
      props: {
        plugins: [DayGrid, TimeGrid, List, ResourceTimeGrid, ResourceTimeline, Interaction],
        options: {
          // date: currentDateRef.current,
          date: calendarStartDate || calendarDate,
          view: changedView,
          selectable: true,
          selectMirror: true,
          unselectAuto: false,
          editable: true,
          eventStartEditable: true,
          eventDurationEditable: true,
          events: mappedEvents,
          resources: assigned_resources,
          selectBackgroundColor: 'rgba(255, 68, 68, 0.2)',
          headerToolbar: {
            start: 'today,prev,next',
            center: 'title',
            end: 'year,month,week,day,list,resource,timeline',
          },
          datesSet: handleDateChange,
          // views: {
          //   listYear: {
          //     type: 'list',
          //     // duration: { months: 36 },
          //     buttonText: 'Year',
          //   },
            
          // },
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
          eventClassNames: (arg) => {
            return selectedEvents.has(arg.event.extendedProps._id) ? 'selected-event' : '';
          },

          select: (info) => {
            if (user.access_level < 3) {
              toast.error('You do not have permission to create events.try logging in again');
              return;
            }
            const { start, end, resource } = info;
            const timezoneOffset = 3; // Adjust this value based on the expected timezone
            const adjustedStartTime = adjustTimeForBackend(start, timezoneOffset);
            const adjustedEndTime = adjustTimeForBackend(end, timezoneOffset);
            // const generatedId = uuidv4();
            const newEvent = {
              start_time: adjustedStartTime,
              end_time: adjustedEndTime,
              // color_code: 'green',
              title: 'new task',
              resource,
            };
            openCreateForm(newEvent);
          },
          eventResize: (info) => handleEventResize(info, user, onEventUpdate, adjustTimeForBackend),
        
          dateClick: (info) => {
            if (user.access_level < 3) {
              toast.error('You do not have permission to create events. try logging in again');
              return;
            }
            const timezoneOffset = 3;
            const adjustedStartTime = adjustTimeForBackend(info.date, timezoneOffset);
            const newEvent = {
              // _id: uuidv4(),
              start_time: adjustedStartTime,
              // color_code: 'green',
              title: 'new task',
            };
             // Preserve the current view before opening the form
  const currentViewState = preserveCalendarView();

  openCreateForm(newEvent); // Open form with pre-filled start time

  // Restore the calendar view after form submission (assuming successful)
  if (currentViewState) {
    restoreCalendarView(currentViewState);
  }
            // openCreateForm(newEvent); // Open form with pre-filled start time
          },
          eventClick: (info) => {
            if (user.access_level < 2) {
              toast.error('You do not have permission to modify events.');
              return;
            }

            const eventId = info.event.extendedProps._id;
           
        
            if (info.jsEvent.shiftKey || info.jsEvent.ctrlKey) {
              info.jsEvent.preventDefault();
              const newSelected = new Set(selectedEventsRef.current);
              
              if (newSelected.has(eventId)) {
                newSelected.delete(eventId);
                updateEventAppearance(eventId, false);
              } else {
                newSelected.add(eventId);
                updateEventAppearance(eventId, true);
              }
              
              // Update both state and ref
              selectedEventsRef.current = newSelected;
              setSelectedEvents(newSelected);
            } else {
              // Single select mode
              if (selectedEvents.size > 0) {
                clearEventSelection();
              }
              const { event } = info;
              const { extendedProps } = event;
               console.log("event",extendedProps)
              // Flatten the assigned resources
// Flatten the assigned resources with proper checks for undefined or null
// const assignedTo = (extendedProps?.assigned_resources?.assigned_to || [])
//   .map(user =>`${user?.first_name || 'Unknown'} ${user?.last_name || 'User'}`)
//   .join(', ') || 'No Users Assigned'; // Fallback if empty or undefined

// const tools = (extendedProps?.assigned_resources?.tools || [])
//   .map(tool => tool?.tool_name  || 'Unknown Tool')
//   .join(', ') || 'No Tools Assigned'; // Fallback if empty or undefined

// const materials = (extendedProps?.assigned_resources?.materials || [])
//   .map(material => material?.material_name || 'Unknown Material')
//   .join(', ') || 'No Materials Assigned'; // Fallback if empty or undefined

// Construct the updatedEvent object with a flat structure for assigned resources
const updatedEvent = {
_id: eventId,
title: event.title || 'Untitled Event',
start: event.start || new Date(),
end: event.end || new Date(),
color: event.backgroundColor || '#cccccc',
image: extendedProps?.image || null,
notes: extendedProps?.notes || 'No notes available',
status: extendedProps?.status || null,
repeat_frequency: extendedProps?.repeat_frequency || null,
task_period: extendedProps?.task_period || null,
machine: extendedProps?.machine || null,
facility: extendedProps?.facility || null,
created_by: extendedProps?.created_by || null,
// Flattened assigned resources
assigned_to: extendedProps?.assigned_resources?.assigned_to || [],
  tools: extendedProps?.assigned_resources?.tools || [],
  materials: extendedProps?.assigned_resources?.materials || [],

};
console.log("upadted",updatedEvent)
              openForm(updatedEvent);
            }
          },
          // Add this to ensure events have unique identifiers
          eventDidMount: (info) => {
            const eventElement = info.el;
            const eventId = info.event.extendedProps._id;
            eventElement.setAttribute('data-event-id', eventId);
            
            // Apply selection styling if event is selected
            if (selectedEvents.has(eventId)) {
              updateEventAppearance(eventId, true);
            }
          },

          // Handle drag and drop
          eventDragStart: (info) => {
            const eventId = info.event.extendedProps._id;
            const selectedEventIds = Array.from(selectedEventsRef.current);
          
            // Store initial positions of all selected events
            dragStartPositionsRef.current.clear();
            selectedEventIds.forEach(id => {
                const event = calendarRef.current.getEventById(id);
                if (event) {
                    dragStartPositionsRef.current.set(id, {
                        start: event.start,
                        end: event.end
                    });
                }
            });

            // If the dragged event isn't in the selection, clear selection
            if (!selectedEventIds.includes(eventId)) {
                clearEventSelection();
            }
          },

          eventDrag: (info) => {
            const mainEventId = info.event.extendedProps._id;
            const deltaMs = info.event.start.getTime() - info.event._instance.range.start.getTime();
            
            // Move all selected events together
            selectedEventsRef.current.forEach(eventId => {
                if (eventId !== mainEventId) { // Skip the main dragged event
                    const eventToMove = calendarRef.current.getEventById(eventId);
                    const startPosition = dragStartPositionsRef.current.get(eventId);
                    
                    if (eventToMove && startPosition) {
                        const newStart = new Date(startPosition.start.getTime() + deltaMs);
                        const newEnd = new Date(startPosition.end.getTime() + deltaMs);
                        
                        try {
                            calendarRef.current.updateEvent({
                                id: eventId,
                                start: newStart,
                                end: newEnd,
                                allDay: eventToMove.allDay
                            });
                        } catch (error) {
                            console.error('Error updating event position:', error);
                        }
                    }
                }
            });
          },

          
          eventDrop: handleEventDrop,
        
        },
      },
    });
    // Add this to your useEffect that handles styles
    const style = document.createElement('style');
    style.textContent = `
        .time-picker-dialog {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .time-picker-dialog input[type="time"] {
            padding: 8px;
            margin: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .time-picker-dialog button {
            cursor: pointer;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        
        .time-picker-dialog button:hover {
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [events, assigned_resources, changedView]);
    // Update clearEventSelection to handle both state and ref
    const clearEventSelection = useCallback(() => {
      Array.from(selectedEventsRef.current).forEach(eventId => {
        updateEventAppearance(eventId, false);
      });
      selectedEventsRef.current.clear();
      setSelectedEvents(new Set());
    }, []);
  
    // Add this effect to sync ref with state changes
    useEffect(() => {
      selectedEventsRef.current = new Set(selectedEvents);
    }, [selectedEvents]);
  
  useEffect(() => {
    return () => {
        dragStartPositionsRef.current.clear();
    };
  }, []);

  return (
    <>
      {/* Calendar Container */}
      <div ref={calendarContainer} id="ec" />
    </>
  );
};

export default EventCalendarWrapper;
