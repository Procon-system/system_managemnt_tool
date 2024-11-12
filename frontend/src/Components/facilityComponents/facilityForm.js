
import React, { useState, useEffect } from 'react';

const FacilityForm = ({ onSubmit, facility, onClose }) => {
  const [facilityName, setFacilityName] = useState(facility ? facility.facility_name : '');
  const [location, setLocation] = useState(facility ? facility.location : '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (facility) {
      setFacilityName(facility.facility_name);
      setLocation(facility.location);
    }
  }, [facility]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await onSubmit({ facility_name: facilityName, location });
      setMessage('Facility saved successfully!');
      setFacilityName('');
      setLocation('');
      onClose();
    } catch (error) {
      setMessage('Error saving facility: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 text-center">
        {facility ? 'Edit Facility' : 'Add New Facility'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm sm:text-base lg:text-lg font-medium">Facility Name</label>
          <input
            type="text"
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md text-sm sm:text-base lg:text-lg"
          />
        </div>
        <div>
          <label className="block text-sm sm:text-base lg:text-lg font-medium">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md text-sm sm:text-base lg:text-lg"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm sm:text-base lg:text-lg"
        >
          {facility ? 'Update' : 'Submit'}
        </button>
      </form>
      {message && <p className="mt-4 text-sm sm:text-base lg:text-lg text-green-600 text-center">{message}</p>}
    </div>
  );
};

export default FacilityForm;
