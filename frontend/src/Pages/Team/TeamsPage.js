import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiUsers } from 'react-icons/fi';
import {
  fetchOrganizationTeams,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  clearCurrentTeam,
  resetTeamError
} from '../../features/teamSlice';
import { io } from 'socket.io-client';
import TeamCreateModal from '../../Components/teamComponents/teamCreateModal'; // We'll create this component next

const TeamsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;
  
  // Get state from Redux store
  const { user, access_level } = useSelector((state) => state.auth);
  const { teams, currentTeam, loading, error } = useSelector((state) => state.teams);
  console.log("teams",teams)
  // Local state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all teams and setup socket
  useEffect(() => {
    dispatch(fetchOrganizationTeams({ search: searchTerm }));

    const socket = io(API_URL, {
      query: { organizationId: user?.organization }
    });

    // Handle real-time updates
    socket.on('team:created', (data) => {
      dispatch(fetchOrganizationTeams()); // Refresh list
      showToast('success', `New team "${data.team.name}" created`);
    });

    socket.on('team:updated', (data) => {
      dispatch(fetchOrganizationTeams()); // Refresh list
    });

    socket.on('team:deleted', (data) => {
      dispatch(fetchOrganizationTeams()); // Refresh list
      showToast('info', 'Team deleted');
    });

    return () => {
      socket.disconnect();
      dispatch(clearCurrentTeam());
      dispatch(resetTeamError());
    };
  }, [dispatch, user?.organization, searchTerm, API_URL]);

  const showToast = (type, message) => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg text-white ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await dispatch(deleteTeam(id)).unwrap();
        showToast('success', 'Team deleted successfully');
      } catch (err) {
        showToast('error', err.message || 'Failed to delete team');
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/teams/edit/${id}`);
  };

  const handleViewDetails = (id) => {
    navigate(`/teams/${id}`);
  };

  const filteredTeams = Array.isArray(teams)
  ? teams.filter(team => 
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  : [];

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-100 text-red-700 rounded-md max-w-md mx-auto mt-8">
      Error: {error}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Create Team Modal */}
      <TeamCreateModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Teams</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search teams..."
              className="pl-10 pr-4 py-2 border rounded-md text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {access_level >= 3 && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <FiPlus className="mr-2" size={16} />
              Create Team
            </button>
          )}
        </div>
      </div>
  
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredTeams.map((team) => (
              <div 
                key={team._id} 
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                  <h3 className="font-medium text-gray-800">{team.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-3">
                    <FiUsers className="text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      {team.members.slice(0, 3).map(m => m.user.name).join(', ')}
                      {team.members.length > 3 && ` +${team.members.length - 3} more`}
                    </span>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2 border-t">
                    <button
                      onClick={() => handleViewDetails(team._id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </button>
                    {access_level >= 3 && (
                      <>
                        <button
                          onClick={() => handleEdit(team._id)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(team._id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto w-24 h-24 text-gray-300 mb-4">
              <FiUsers size={96} className="opacity-30" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">No teams found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try a different search term' : 'Get started by creating a new team'}
            </p>
            {access_level >= 3 && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <FiPlus className="mr-2" size={16} />
                Create Team
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;