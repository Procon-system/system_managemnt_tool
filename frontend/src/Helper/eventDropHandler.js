import { toast } from 'react-toastify';

// Helper function to format event data
const formatEventUpdate = (eventId, start, end, originalEvent) => {
  return {
    _id: eventId,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    color: originalEvent.color,
    title: originalEvent.title
  };
};

// Helper to calculate new times for month view
const calculateMonthViewTimes = (originalEvent, deltaMs, timeData) => {
  const newStart = new Date(new Date(originalEvent.start).getTime() + deltaMs);
  newStart.setHours(timeData.start.getHours(), timeData.start.getMinutes(), 0);
  
  const newEnd = new Date(newStart.getTime());
  newEnd.setHours(timeData.end.getHours(), timeData.end.getMinutes(), 0);

  return { newStart, newEnd };
};

// Helper to prepare events for update
const prepareEventsForUpdate = (selectedEventIds, events, deltaMs, selectedTimes) => {
  return selectedEventIds.map(eventId => {
    const originalEvent = events.find(e => e._id === eventId);
    if (!originalEvent) return null;

    const timeData = Array.isArray(selectedTimes) 
      ? selectedTimes.find(t => t.eventId === eventId)
      : selectedTimes;

    const { newStart, newEnd } = calculateMonthViewTimes(originalEvent, deltaMs, timeData);
    return formatEventUpdate(eventId, newStart, newEnd, originalEvent);
  }).filter(Boolean);
};

// Month view bulk update handler
export const handleMonthBulkUpdate = async ({
  info,
  event,
  deltaMs,
  selectedEventIds,
  events,
  calendarRef,
  onMultipleEventUpdate,
  clearEventSelection,
  promptForStartAndEndTime
}) => {
  try {
    // Store current view state
    const currentDate = calendarRef.current.view.currentStart;
    const currentViewType = calendarRef.current.view.type;

    // Prepare event details for time prompt
    const selectedEventsDetails = selectedEventIds.map(eventId => {
      const evt = events.find(e => e._id === eventId);
      return {
        _id: evt._id,
        title: evt.title,
        color: evt.color
      };
    });

    // Get time selections from user
    const selectedTimes = await promptForStartAndEndTime(
      event.start,
      event.end,
      selectedEventsDetails
    );

    if (!selectedTimes) {
      info.revert();
      toast.info('Event updates canceled.');
      return;
    }

    // Prepare and execute updates
    const updatedEvents = prepareEventsForUpdate(
      selectedEventIds,
      events,
      deltaMs,
      selectedTimes
    );

    await onMultipleEventUpdate(updatedEvents);
    clearEventSelection();
    
    // Restore calendar view
    calendarRef.current.setOption('view', currentViewType);
    calendarRef.current.setOption('date', currentDate);
    
    return true;
  } catch (error) {
    console.error('Error in month bulk update:', error);
    info.revert();
    toast.error('Failed to update events');
    return false;
  }
};

// export const handleWeekBulkUpdate = async ({
//     info,
//     deltaMs,
//     selectedEventIds,
//     events,
//     onMultipleEventUpdate,
//     clearEventSelection,
//     calendarRef
//   }) => {
//     try {
//       // Store current view state
//       const currentView = calendarRef.current.view;
      
//       // Update calendar UI first for smooth transition
//       selectedEventIds.forEach(eventId => {
//         const event = calendarRef.current.getEventById(eventId);
//         if (event) {
//           const newStart = new Date(event.start.getTime() + deltaMs);
//           const newEnd = new Date(event.end.getTime() + deltaMs);
//           calendarRef.current.updateEvent({
//             id: eventId,
//             start: newStart,
//             end: newEnd
//           });
//         }
//       });
  
//       const updatedEvents = selectedEventIds.map(eventId => {
//         const originalEvent = events.find(e => e._id === eventId);
//         if (!originalEvent) return null;
  
//         const newStart = new Date(originalEvent.start);
//         const newEnd = new Date(originalEvent.end);
        
//         newStart.setTime(newStart.getTime() + deltaMs);
//         newEnd.setTime(newEnd.getTime() + deltaMs);
  
//         return {
//           _id: originalEvent._id,
//           start_time: newStart.toISOString(),
//           end_time: newEnd.toISOString(),
//           color: originalEvent.color,
//           title: originalEvent.title
//         };
//       }).filter(Boolean);
  
//       await onMultipleEventUpdate(updatedEvents);
//       clearEventSelection();
      
//       return true;
//     } catch (error) {
//       console.error('Error in week bulk update:', error);
//       info.revert();
//       toast.error('Failed to update events');
//       return false;
//     }
//   };
export const handleWeekBulkUpdate = async ({
    info,
    deltaMs,
    selectedEventIds,
    events,
    onMultipleEventUpdate,
    clearEventSelection,
    calendarRef
  }) => {
    try {
      // Store current date in ref before updates
      const currentDate = calendarRef.current.view.currentStart;
      calendarRef.current.setOption('date', currentDate);
  
      // Update calendar UI first for smooth transition
      selectedEventIds.forEach(eventId => {
        const event = calendarRef.current.getEventById(eventId);
        if (event) {
          const newStart = new Date(event.start.getTime() + deltaMs);
          const newEnd = new Date(event.end.getTime() + deltaMs);
          calendarRef.current.updateEvent({
            id: eventId,
            start: newStart,
            end: newEnd
          });
        }
      });
  
      const updatedEvents = selectedEventIds.map(eventId => {
        const originalEvent = events.find(e => e._id === eventId);
        if (!originalEvent) return null;
  
        const newStart = new Date(originalEvent.start);
        const newEnd = new Date(originalEvent.end);
        
        newStart.setTime(newStart.getTime() + deltaMs);
        newEnd.setTime(newEnd.getTime() + deltaMs);
  
        return {
          _id: originalEvent._id,
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
          color: originalEvent.color,
          title: originalEvent.title
        };
      }).filter(Boolean);
  
      await onMultipleEventUpdate(updatedEvents);
      clearEventSelection();
  
      // Let datesSet handler manage the date preservation
      calendarRef.current.setOption('date', currentDate);
      
      return true;
    } catch (error) {
      console.error('Error in week bulk update:', error);
      info.revert();
      toast.error('Failed to update events');
      return false;
    }
  };
export const handleSingleEventUpdate = async ({
    info,
    onEventUpdate,
    adjustTimeForBackend,
    calendarRef
  }) => {
    const { event } = info;
    const timezoneOffset = 3;
    
    // Store current view state
    // const currentDate = calendarRef.current.view.currentStart;
    // const currentViewType = calendarRef.current.view.type;
    
    const updatedEvent = {
      _id: event.extendedProps._id,
      start_time: adjustTimeForBackend(event.start, timezoneOffset),
      end_time: adjustTimeForBackend(event.end, timezoneOffset),
      title: event.title,
      color: event.backgroundColor
    };
  
    try {
      await onEventUpdate(updatedEvent);
      // Restore calendar view
      // calendarRef.current.setOption('view', currentViewType);
      // calendarRef.current.setOption('date', currentDate);
    } catch (error) {
      console.error('Error updating event:', error);
      info.revert();
      toast.error('Failed to update event');
    }
  }; 