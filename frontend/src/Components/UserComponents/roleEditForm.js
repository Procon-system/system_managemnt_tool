// src/components/RoleEditForm.js
import React, { useState, useEffect } from 'react';
import { PERMISSION_DEFINITIONS } from '../../Constants/permissions'; 
// import api from '../services/api';

const RoleEditForm = ({ roleId, onSaveSuccess, onCancel }) => {
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setLoading(true);
        // const response = await api.get(`/roles/${roleId}`);
        // setRole(response.data.data);
        // setPermissions(response.data.data.permissions || {});
        setError('');
      } catch (err) {
        setError('Failed to load role data.');
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [roleId]);

  const handlePermissionChange = (resource, action) => {
    const currentActions = permissions[resource] || [];
    const isChecked = currentActions.includes(action);
    const newActions = isChecked
      ? currentActions.filter(act => act !== action) // Remove action
      : [...currentActions, action]; // Add action

    setPermissions({ ...permissions, [resource]: newActions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // await api.put(`/roles/${roleId}`, { permissions });
      alert('Role updated successfully!');
      // Call the success callback passed from the parent
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err) {
      alert('Failed to update role.');
    }
  };

  if (loading) return <div>Loading permissions...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ marginTop: 0 }}>Edit Permissions for: {role?.name}</h3>
      
      {/* ... (The permission mapping logic remains the same) ... */}
      {Object.entries(PERMISSION_DEFINITIONS).map(([resource, def]) => (
        <div key={resource} style={{ marginBottom: '15px', border: '1px solid #ddd', padding: '10px' }}>
          <h4>{def.label}</h4>
          {def.actions.map((action) => (
            <div key={action.id}>
              <label>
                <input
                  type="checkbox"
                  checked={permissions[resource]?.includes(action.id) || false}
                  onChange={() => handlePermissionChange(resource, action.id)}
                />
                {action.label}
              </label>
            </div>
          ))}
        </div>
      ))}
      
      {/* Add Save and Cancel buttons */}
      <div>
        <button type="submit" style={{ marginRight: '10px' }}>Save Changes</button>
        {/* The cancel button simply calls the onCancel callback */}
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default RoleEditForm;