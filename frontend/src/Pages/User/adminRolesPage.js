// src/pages/AdminRolesPage.js
import React, { useState, useEffect } from 'react';
// import api from '../services/api';
import RoleEditForm from '../../Components/UserComponents/roleEditForm';

const AdminRolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [editingRoleId, setEditingRoleId] = useState(null);

  useEffect(() => {
    const fetchRoles = async () => {
      // It's good practice to wrap async calls in try/catch
      try {
        // const response = await api.get('/roles');
        // setRoles(response.data.data);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        // Handle error (e.g., show a toast notification)
      }
    };
    fetchRoles();
  }, []);
  
  // This function will be called by the form when it's saved or cancelled
  const handleFinishEditing = () => {
    setEditingRoleId(null);
  };

  return (
    <div>
      <h1>Manage Roles</h1>
      {/* Add a button to link to a 'Create Role' page */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid black' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Role Name</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            // Use React.Fragment to render multiple elements for each role
            <React.Fragment key={role._id}>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '8px' }}>{role.name}</td>
                <td style={{ padding: '8px' }}>{role.description}</td>
                <td style={{ padding: '8px' }}>
                  {/* The button now toggles the editing state for this specific role */}
                  <button onClick={() => setEditingRoleId(role._id)}>
                    Edit Permissions
                  </button>
                </td>
              </tr>
              {/* --- CONDITIONAL RENDERING --- */}
              {/* If the current role is the one being edited, render the form in a new row */}
              {editingRoleId === role._id && (
                <tr>
                  {/* Use colSpan to make this cell span the entire width of the table */}
                  <td colSpan="3" style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
                    <RoleEditForm 
                      roleId={role._id} 
                      onSaveSuccess={handleFinishEditing}
                      onCancel={handleFinishEditing}
                    />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminRolesPage;