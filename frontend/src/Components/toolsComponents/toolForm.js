// src/components/ToolForm.js

import React, { useState } from 'react';

const ToolForm = ({ onSubmit }) => {
  const [toolName, setToolName] = useState('');
  const [availableSince, setAvailableSince] = useState('');
  const [certification, setCertification] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit({
        tool_name: toolName,
        available_since: availableSince,
        certification: certification
      });
      setMessage('Tool created successfully!');
      setToolName('');
      setAvailableSince('');
      setCertification('');
    } catch (error) {
      setMessage('Error creating tool: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Add New Tool</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Tool Name</label>
          <input
            type="text"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Available Since</label>
          <input
            type="date"
            value={availableSince}
            onChange={(e) => setAvailableSince(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Certification</label>
          <input
            type="text"
            value={certification}
            onChange={(e) => setCertification(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
          Submit
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
    </div>
  );
};

export default ToolForm;
