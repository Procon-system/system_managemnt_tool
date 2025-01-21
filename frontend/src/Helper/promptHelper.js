import Swal from 'sweetalert2';

const promptForStartAndEndTime = async (defaultStartTime, defaultEndTime, selectedEvents = []) => {
    const { value: times } = await Swal.fire({
        title: 'Set Event Times',
        html: `
            <div style="max-height: 400px; overflow-y: auto; text-align: left;">
                ${selectedEvents.length > 1 ? 
                    selectedEvents.map((event, index) => `
                        <div style="padding: 10px; margin: 10px 0; border-left: 3px solid ${event.color || '#3788d8'}; background: rgba(0,0,0,0.03);">
                            <div style="font-weight: bold; margin-bottom: 8px;">${event.title}</div>
                            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                <div>
                                    <label for="startTime_${index}" style="display: block; margin-bottom: 4px;">Start Time:</label>
                                    <input type="time" 
                                        id="startTime_${index}" 
                                        class="swal2-input" 
                                        style="width: auto; margin: 0;"
                                        value="${defaultStartTime.toISOString().slice(11, 16)}">
                                </div>
                                <div>
                                    <label for="endTime_${index}" style="display: block; margin-bottom: 4px;">End Time:</label>
                                    <input type="time" 
                                        id="endTime_${index}" 
                                        class="swal2-input" 
                                        style="width: auto; margin: 0;"
                                        value="${defaultEndTime.toISOString().slice(11, 16)}">
                                </div>
                            </div>
                        </div>
                    `).join('')
                    : `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                        <div>
                            <label for="startTimePicker" style="font-weight: bold; margin-right: 8px;">Start Time:</label>
                            <input type="time" id="startTimePicker" class="swal2-input" 
                                value="${defaultStartTime.toISOString().slice(11, 16)}" style="width: auto;">
                        </div>
                        <div>
                            <label for="endTimePicker" style="font-weight: bold; margin-right: 8px;">End Time:</label>
                            <input type="time" id="endTimePicker" class="swal2-input" 
                                value="${defaultEndTime.toISOString().slice(11, 16)}" style="width: auto;">
                        </div>
                    </div>
                `}
            </div>
            ${selectedEvents.length > 1 ? `
                <div style="margin-top: 15px; text-align: left;">
                    <button type="button" onclick="applyToAll()" class="swal2-confirm swal2-styled" style="margin: 0;">
                        Apply First Time to All
                    </button>
                </div>
            ` : ''}
        `,
        showCancelButton: true,
        confirmButtonText: selectedEvents.length > 1 ? 'Update All' : 'Save',
        cancelButtonText: 'Cancel',
        showCloseButton: true,
        didOpen: () => {
            // Add the applyToAll function to window scope
            window.applyToAll = () => {
                const firstStart = document.getElementById('startTime_0')?.value;
                const firstEnd = document.getElementById('endTime_0')?.value;
                if (firstStart && firstEnd) {
                    selectedEvents.forEach((_, index) => {
                        const startInput = document.getElementById(`startTime_${index}`);
                        const endInput = document.getElementById(`endTime_${index}`);
                        if (startInput && endInput) {
                            startInput.value = firstStart;
                            endInput.value = firstEnd;
                        }
                    });
                }
            };
        },
        preConfirm: () => {
            if (selectedEvents.length > 1) {
                const eventTimes = selectedEvents.map((_, index) => {
                    const startTime = document.getElementById(`startTime_${index}`).value;
                    const endTime = document.getElementById(`endTime_${index}`).value;
                    
                    if (!startTime || !endTime) {
                        Swal.showValidationMessage('All times must be set');
                        return null;
                    }
                    
                    return { startTime, endTime };
                });
                
                if (eventTimes.includes(null)) return null;
                return eventTimes;
            } else {
                const startTime = document.getElementById('startTimePicker').value;
                const endTime = document.getElementById('endTimePicker').value;

                if (!startTime || !endTime) {
                    Swal.showValidationMessage('Both start and end times are required.');
                    return null;
                }

                return [{ startTime, endTime }];
            }
        },
    });

    if (times) {
        return selectedEvents.length > 1 
            ? selectedEvents.map((event, index) => {
                const { startTime, endTime } = times[index];
                const adjustedStartTime = new Date(defaultStartTime);
                const adjustedEndTime = new Date(defaultEndTime);

                const [startHours, startMinutes] = startTime.split(':');
                const [endHours, endMinutes] = endTime.split(':');

                adjustedStartTime.setHours(startHours, startMinutes);
                adjustedEndTime.setHours(endHours, endMinutes);

                return {
                    eventId: event._id,
                    start: adjustedStartTime,
                    end: adjustedEndTime
                };
            })
            : { start: new Date(defaultStartTime), end: new Date(defaultEndTime) };
    }

    return null;
};

export default promptForStartAndEndTime;
