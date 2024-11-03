import React from 'react';
function getColorForStatus(status) {
    switch (status) {
        case 'done':
            return 'green';
        case 'in progress':
            return 'yellow';
        case 'pending':
        case 'overdue':
            return 'red';
        default:
            return 'green'; // default color if status is undefined or unexpected
    }
}

function TaskCard({ task }) {
    const color = getColorForStatus(task.status);
    
    return (
        <div style={{ borderColor: color, borderWidth: 2, padding: '10px', borderStyle: 'solid' }}>
            <h3>{task.title}</h3>
            <p>Status: {task.status}</p>
            <p>Location: {task.service_location}</p>
        </div>
    );
}
export default TaskCard;