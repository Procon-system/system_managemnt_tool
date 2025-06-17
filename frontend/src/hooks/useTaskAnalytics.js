
import { useState, useEffect } from 'react';
import { generateMockTaskData } from '../utils/mockTaskData';

export const useTaskAnalytics = (filters) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpiData, setKpiData] = useState({
    totalTasks: 0,
    totalLaborCost: 0,
    totalHoursLogged: 0,
    averageTaskDuration: 0,
    totalResourceCost: 0,
    totalItemsProduced: 0
  });

  const refreshTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would be an API call with filters
      const mockTasks = generateMockTaskData(50);
      
      // Apply filters to mock data
      let filteredTasks = mockTasks;
      
      if (filters.dateRange.start && filters.dateRange.end) {
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.completedOn);
          return taskDate >= new Date(filters.dateRange.start) && 
                 taskDate <= new Date(filters.dateRange.end);
        });
      }
      
      if (filters.users.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.users.includes(task.assignedUser)
        );
      }
      
      if (filters.resources.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.resources.includes(task.resourceUsed)
        );
      }

      if (filters.tags.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.tags.some(tag => 
            task.title.toLowerCase().includes(tag.toLowerCase())
          )
        );
      }

      setTasks(filteredTasks);
      
      // Calculate KPIs
      const kpis = calculateKPIs(filteredTasks);
      setKpiData(kpis);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = (tasks) => {
    if (!tasks.length) {
      return {
        totalTasks: 0,
        totalLaborCost: 0,
        totalHoursLogged: 0,
        averageTaskDuration: 0,
        totalResourceCost: 0,
        totalItemsProduced: 0
      };
    }

    const totalTasks = tasks.length;
    const totalLaborCost = tasks.reduce((sum, task) => sum + task.laborCost, 0);
    const totalHoursLogged = tasks.reduce((sum, task) => sum + (task.loggedTimeMinutes / 60), 0);
    const averageTaskDuration = tasks.reduce((sum, task) => sum + task.loggedTimeMinutes, 0) / tasks.length;
    const totalResourceCost = tasks.reduce((sum, task) => sum + task.totalResourceCost, 0);
    const totalItemsProduced = tasks.reduce((sum, task) => sum + task.itemsProduced, 0);

    return {
      totalTasks,
      totalLaborCost,
      totalHoursLogged,
      averageTaskDuration,
      totalResourceCost,
      totalItemsProduced
    };
  };

  // Auto-refresh when filters change
  useEffect(() => {
    refreshTasks();
  }, [filters]);

  return {
    tasks,
    loading,
    error,
    refreshTasks,
    kpiData
  };
};