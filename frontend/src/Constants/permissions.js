// src/constants/permissions.js

export const PERMISSION_DEFINITIONS = {
    task: {
      label: 'Task Management',
      actions: [
        { id: 'create', label: 'Create Tasks' },
        { id: 'read', label: 'Read Tasks' },
        { id: 'update', label: 'Update Tasks' },
        { id: 'delete', label: 'Delete Tasks' },
        { id: 'import', label: 'Import Tasks (iCal)' },
        { id: 'change_status', label: 'Change Task Status' },
        { id: 'generate_report', label: 'Generate Task Reports' },
      ],
    },
    user: {
      label: 'User Management',
      actions: [
        { id: 'read_all', label: 'View All Users' },
        { id: 'update_any', label: 'Update Any User Profile' },
        { id: 'delete_any', label: 'Delete Any User' },
        { id: 'assign_role', label: 'Assign Roles to Users' },
      ],
    },
    team: {
      label: 'Team Management',
      actions: [
        { id: 'create', label: 'Create Teams' },
        { id: 'read', label: 'Read Teams' },
        { id: 'update', label: 'Update Teams' },
        { id: 'delete', label: 'Delete Teams' },
        { id: 'add_member', label: 'Add Team Members' },
        { id: 'remove_member', label: 'Remove Team Members' },
        { id: 'update_member_role', label: 'Update Member Role in Team' },
      ],
    },
    role: {
      label: 'Role & Permission Management',
      actions: [
        { id: 'create', label: 'Create Roles' },
        { id: 'read', label: 'View Roles' },
        { id: 'update', label: 'Update Roles & Permissions' },
        { id: 'delete', label: 'Delete Roles' },
      ],
    },
    // Add resource and resource_type here as well
    resource: {
      label: 'Resource Management',
      actions: [
        { id: 'create', label: 'Create Resources' },
        { id: 'read', label: 'Read Resources' },
        { id: 'update', label: 'Update Resources' },
        { id: 'delete', label: 'Delete Resources' },
        { id: 'check_availability', label: 'Check Resource Availability' },
      ],
    },
  };