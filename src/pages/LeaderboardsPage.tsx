import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { LeaderboardChart } from '../components/LeaderboardChart';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useLeaderboard, useAvailableTasks, useDatasetsForTask } from '../hooks/useData';
import { BarChart3, AlertCircle } from 'lucide-react';

export const LeaderboardsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [showChart, setShowChart] = useState(false);

  console.log('LeaderboardsPage rendered');
  console.log('Current state - selectedDataset:', selectedDataset, 'selectedTask:', selectedTask);

  // Read dataset and task from URL parameters on every render
  useEffect(() => {
    console.log('=== LeaderboardsPage useEffect triggered ===');
    console.log('Current URL:', window.location.href);
    console.log('Location search:', location.search);
    
    try {
      // Parse URL parameters manually
      const urlParams = new URLSearchParams(window.location.search);
      const datasetFromUrl = urlParams.get('dataset');
      const taskFromUrl = urlParams.get('task');
      
      console.log('Parsed URL parameters:', { datasetFromUrl, taskFromUrl });
      
      if (datasetFromUrl) {
        const decodedDataset = decodeURIComponent(datasetFromUrl);
        setSelectedDataset(decodedDataset);
        console.log('Setting selected dataset:', decodedDataset);
      }
      if (taskFromUrl) {
        try {
          const decodedTask = decodeURIComponent(taskFromUrl);
          setSelectedTask(decodedTask);
          console.log('Setting selected task:', decodedTask);
        } catch (error) {
          console.error('Failed to decode task URL parameter:', error);
          // Try to decode it manually by replacing %25 back to %
          const fixedTask = taskFromUrl.replace(/%25/g, '%');
          setSelectedTask(fixedTask);
          console.log('Setting selected task (fixed):', fixedTask);
        }
      }
    } catch (error) {
      console.error('Error parsing URL parameters:', error);
      // If URL parsing fails, try to extract parameters manually
      const search = window.location.search;
      const datasetMatch = search.match(/[?&]dataset=([^&]+)/);
      const taskMatch = search.match(/[?&]task=([^&]+)/);
      
      if (datasetMatch) {
        try {
          const decodedDataset = decodeURIComponent(datasetMatch[1]);
          setSelectedDataset(decodedDataset);
          console.log('Setting selected dataset (fallback):', decodedDataset);
        } catch (e) {
          console.error('Failed to decode dataset:', e);
        }
      }
      
      if (taskMatch) {
        try {
          const decodedTask = decodeURIComponent(taskMatch[1]);
          setSelectedTask(decodedTask);
          console.log('Setting selected task (fallback):', decodedTask);
        } catch (e) {
          console.error('Failed to decode task:', e);
          // Try to decode it manually by replacing %25 back to %
          const fixedTask = taskMatch[1].replace(/%25/g, '%');
          setSelectedTask(fixedTask);
          console.log('Setting selected task (fallback fixed):', fixedTask);
        }
      }
    }
  }); // No dependency array - runs on every render

  const { evaluations, loading: leaderboardLoading } = useLeaderboard(selectedDataset, selectedTask);
  const { tasks: availableTasks, loading: availableTasksLoading } = useAvailableTasks();
  const { datasets: taskDatasets, loading: taskDatasetsLoading } = useDatasetsForTask(selectedTask);

  // Update URL when task or dataset changes
  const updateURL = (task: string, dataset: string) => {
    const newSearchParams = new URLSearchParams();
    if (task) {
      newSearchParams.set('task', task);
    }
    if (dataset) {
      newSearchParams.set('dataset', dataset);
    }
    setSearchParams(newSearchParams);
  };

  // Handle task selection
  const handleTaskChange = (task: string) => {
    setSelectedTask(task);
    setSelectedDataset(''); // Clear dataset when task changes
    setShowChart(false);
    updateURL(task, '');
  };

  // Handle dataset selection
  const handleDatasetChange = (dataset: string) => {
    setSelectedDataset(dataset);
    updateURL(selectedTask, dataset);
  };



  if (availableTasksLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Task and Dataset Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Leaderboard Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task
            </label>
            {availableTasksLoading ? (
              <div className="text-sm text-gray-500">Loading tasks...</div>
            ) : (
              <select
                value={selectedTask}
                onChange={(e) => handleTaskChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a task</option>
                {availableTasks.map((task) => (
                  <option key={task} value={task}>
                    {task}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dataset
            </label>
            {!selectedTask ? (
              <select
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
              >
                <option value="">Select a task first</option>
              </select>
            ) : taskDatasetsLoading ? (
              <div className="text-sm text-gray-500">Loading datasets...</div>
            ) : (
              <select
                value={selectedDataset}
                onChange={(e) => handleDatasetChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a dataset</option>
                {taskDatasets.map((dataset) => (
                  <option key={dataset.name} value={dataset.name}>
                    {dataset.full_name || dataset.name} ({dataset.paper_count} papers)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Clear Selection Button */}
        {(selectedTask || selectedDataset) && (
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                setSelectedTask('');
                setSelectedDataset('');
                setShowChart(false);
                updateURL('', '');
              }}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {!selectedTask || !selectedDataset ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select Task and Dataset</h3>
            <p className="text-gray-600">
              {!selectedTask 
                ? "First, select a task to see available datasets"
                : "Now select a dataset to view the leaderboard"
              }
            </p>
          </div>
          
          {/* Popular Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Popular Tasks</h4>
            {availableTasksLoading ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">Loading tasks...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTasks.slice(0, 6).map((task) => (
                  <div 
                    key={task}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => handleTaskChange(task)}
                  >
                    <h5 className="font-medium text-gray-900">{task}</h5>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Datasets for Selected Task */}
          {selectedTask && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Datasets for {selectedTask}</h4>
              {taskDatasetsLoading ? (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500">Loading datasets...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taskDatasets.map((dataset) => (
                    <div 
                      key={dataset.name}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => setSelectedDataset(dataset.name)}
                    >
                      <h5 className="font-medium text-gray-900">{dataset.full_name || dataset.name}</h5>
                      <p className="text-sm text-gray-500">{dataset.paper_count} papers</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart Toggle Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowChart(!showChart)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {showChart ? 'Hide Chart' : 'Show Chart'}
            </button>
          </div>

          {/* Leaderboard Content */}
          {leaderboardLoading ? (
            <LoadingSpinner />
          ) : evaluations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600">
                No evaluation results found for {selectedTask} on {selectedDataset}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {showChart && evaluations.length > 0 && (
                <div className="space-y-4">
                  {/* Chart Component */}
                  <LeaderboardChart
                    evaluations={evaluations}
                    dataset={selectedDataset}
                    task={selectedTask}
                  />
                </div>
              )}

              {/* Leaderboard Table */}
              <LeaderboardTable 
                evaluations={evaluations}
                dataset={selectedDataset}
                task={selectedTask}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 