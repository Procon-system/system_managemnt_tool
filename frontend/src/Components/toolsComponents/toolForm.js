
import React, { useState, useEffect } from 'react';

const ToolForm = ({ onSubmit, tool, onClose }) => {
  const [toolName, setToolName] = useState(tool ? tool.tool_name : '');
  const [availableSince, setAvailableSince] = useState(tool ? tool.available_since : '');
  const [certification, setCertification] = useState(tool ? tool.certification : '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (tool) {
      setToolName(tool.tool_name);
      setAvailableSince(tool.available_since);
      setCertification(tool.certification);
    }
  }, [tool]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await onSubmit({ tool_name: toolName, available_since: availableSince, certification });
      setMessage('Tool saved successfully!');
      setToolName('');
      setAvailableSince('');
      setCertification('');
      onClose();
    } catch (error) {
      setMessage('Error saving tool: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 text-center">
        {tool ? 'Edit Tool' : 'Add New Tool'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm sm:text-base lg:text-lg font-medium">Tool Name</label>
          <input
            type="text"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md text-sm sm:text-base lg:text-lg"
          />
        </div>
        <div>
          <label className="block text-sm sm:text-base lg:text-lg font-medium">Available Since</label>
          <input
            type="date"
            value={availableSince}
            onChange={(e) => setAvailableSince(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm sm:text-base lg:text-lg"
          />
        </div>
        <div>
          <label className="block text-sm sm:text-base lg:text-lg font-medium">Certification</label>
          <input
            type="text"
            value={certification}
            onChange={(e) => setCertification(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm sm:text-base lg:text-lg"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm sm:text-base lg:text-lg"
        >
          {tool ? 'Update' : 'Submit'}
        </button>
      </form>
      {message && <p className="mt-4 text-sm sm:text-base lg:text-lg text-green-600 text-center">{message}</p>}
    </div>
  );
};

export default ToolForm;
