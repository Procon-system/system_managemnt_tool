import { toast } from 'react-toastify';
export const handleEventDuplication = async ({
  info,
  onEventCreate,
  adjustTimeForBackend,
  preserveCalendarView,
  restoreCalendarView
}) => {
  const { event } = info;
  const timezoneOffset = 3; // Adjust based on your timezone
  
  const newEvent = {
    start_time: adjustTimeForBackend(event.start, timezoneOffset),
    end_time: adjustTimeForBackend(event.end, timezoneOffset),
    title: `Copy of ${event.title}`,
    color: event.backgroundColor
  };

  try {
    const currentViewState = preserveCalendarView();
  console.log("currentviews",currentViewState)
    await onEventCreate(newEvent);// Open form with pre-filled start time

  // Restore the calendar view after form submission (assuming successful)
  if (currentViewState) {
    restoreCalendarView(currentViewState);
  }
    // await onEventCreate(newEvent);
  } catch (error) {
    console.error('Error duplicating event:', error);
    info.revert();
    toast.error('Failed to duplicate event');
  }
};
// Date click handler
export const handleDateClick = (info, user, adjustTimeForBackend, openCreateForm) => {
  if (user.access_level < 3) {
    toast.error('You do not have permission to create events. try logging in again');
    return;
  }
  const timezoneOffset = 3;
  const adjustedStartTime = adjustTimeForBackend(info.date, timezoneOffset);
  const newEvent = {
    start_time: adjustedStartTime,
    title: 'new task',
  };
  openCreateForm(newEvent);
};

// Event click handler
export const handleEventClick = (info, user, selectedEventsRef, selectedEvents, setSelectedEvents, updateEventAppearance, clearEventSelection, openForm) => {
  if (user.access_level < 2) {
    toast.error('You do not have permission to modify events.');
    return;
  }

  const eventId = info.event.extendedProps._id;
  console.log('Event clicked, ID:', eventId);

  if (info.jsEvent.shiftKey || info.jsEvent.ctrlKey) {
    info.jsEvent.preventDefault();

    const newSelected = new Set(selectedEventsRef.current);

    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
      console.log("Deselecting event:", eventId);
      updateEventAppearance(eventId, false);  // Corrected: passing the eventId to update appearance
    } else {
      newSelected.add(eventId);
      console.log("Selecting event:", eventId);
      updateEventAppearance(eventId, true);  // Corrected: passing the eventId to update appearance
    }

    selectedEventsRef.current = newSelected;
    setSelectedEvents(newSelected);  // Ensure both ref and state are updated

    console.log("Updated selected events:", Array.from(newSelected));
    console.log("selected events ref:", selectedEventsRef.current);
    console.log("selected events state:", Array.from(selectedEvents));

    return;  // Exit after processing the shift-click
  } else {
    // Single click on event (deselect all if any are selected)
    if (selectedEvents.size > 0) {
      clearEventSelection();
    }

    const { event } = info;
    const { extendedProps } = event;

    const updatedEvent = {
      _id: eventId,
      title: event.title,
      start: event.start,
      end: event.end,
      color: event.backgroundColor,
      image: extendedProps?.image || null,
      notes: extendedProps?.notes || 'No notes available',
      status: extendedProps?.status || null,
    };
    openForm(updatedEvent);
  }
};

export const handleEventDragStart = (info, calendarRef, selectedEventsRef, dragStartPositionsRef, clearEventSelection) => {
  const eventId = info.event.extendedProps._id;

  console.log("Drag started for event ID:", eventId);
  console.log("Current selected events:", selectedEventsRef.current);

  // Convert selected events from ref to an array
  const selectedEventIds = Array.from(selectedEventsRef.current);

  console.log("Selected events at drag start:", selectedEventIds);

  // Clear any previous drag start positions
  dragStartPositionsRef.current.clear();

  // Store positions of all selected events
  selectedEventIds.forEach((id) => {
    const event = calendarRef.current.getEventById(id);
    if (event) {
      dragStartPositionsRef.current.set(id, {
        start: event.start,
        end: event.end,
      });
      console.log(`Stored position for event ${id}:`, {
        start: event.start,
        end: event.end,
      });
    }
  });

  // If the dragged event is not in the selected events, clear selection
  if (!selectedEventIds.includes(eventId)) {
    console.log(`Event ${eventId} is not in the selected events, clearing selection.`);
    clearEventSelection();
  }
};


// Event did mount handler
export const handleEventDidMount = (info, selectedEvents, updateEventAppearance) => {
  const eventElement = info.el;
  const eventId = info.event.extendedProps._id;
  eventElement.setAttribute('data-event-id', eventId);
  
  if (selectedEvents.has(eventId)) {
    updateEventAppearance(eventId, true);
  }
};

// Event drag handler
export const handleEventDrag = (info, selectedEventsRef, dragStartPositionsRef, calendarRef) => {
  const mainEventId = info.event.extendedProps._id;
  const deltaMs = info.event.start.getTime() - info.event._instance.range.start.getTime();
  
  selectedEventsRef.current.forEach(eventId => {
    if (eventId !== mainEventId) {
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
};

// Event resize handler
export const handleEventResize = async (info, user, onEventUpdate, adjustTimeForBackend) => {
  if (user.access_level < 3) {
    toast.error('You do not have permission to update events.');
    return;
  }
  const { event } = info;
  const mongoId = event.extendedProps._id;
  if (!mongoId) {
    toast.error('Event ID missing. Cannot update.');
    info.revert();
    return;
  }
  const timezoneOffset = 3;
  const adjustedStartTime = adjustTimeForBackend(event.start, timezoneOffset);
  const adjustedEndTime = adjustTimeForBackend(event.end, timezoneOffset);
  const updatedEvent = {
    _id: mongoId,
    start_time: adjustedStartTime,
    end_time: adjustedEndTime,
    title: event.title,
    color: event.backgroundColor,
  };
  try {
    await onEventUpdate(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    info.revert();
    toast.error('Failed to update event. Changes reverted.');
  }
};
