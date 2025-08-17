import React, { useState, useEffect } from 'react';
import { Database, Tag, Globe, BarChart3, ChevronDown } from 'lucide-react';
import { Dataset } from '../types';
import { api } from '../services/api';
import { ContentRenderer } from './ContentRenderer';

interface DatasetCardProps {
  dataset: Dataset;
}

export const DatasetCard: React.FC<DatasetCardProps> = ({ dataset }) => {
  const [hasLeaderboardData, setHasLeaderboardData] = useState<boolean | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Array<{ name: string; paper_count: number }>>([]);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  useEffect(() => {
    const checkLeaderboardData = async () => {
      try {
        const hasData = await api.checkDatasetHasLeaderboardData(dataset.name);
        setHasLeaderboardData(hasData);
        
        if (hasData) {
          const tasks = await api.getTasksForDataset(dataset.name);
          setAvailableTasks(tasks);
        }
      } catch (error) {
        console.error('Error checking leaderboard data:', error);
        setHasLeaderboardData(false);
      }
    };

    checkLeaderboardData();
  }, [dataset.name]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.leaderboard-dropdown')) {
        setShowTaskDropdown(false);
      }
    };

    if (showTaskDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTaskDropdown]);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {dataset.full_name || dataset.name}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {hasLeaderboardData && availableTasks.length > 0 && (
            <div className="relative leaderboard-dropdown">
              <button
                onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                title="View Leaderboard"
              >
                <BarChart3 className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showTaskDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 mb-2 px-2">Available Tasks:</div>
                    {availableTasks.map((task) => (
                      <button
                        key={task.name}
                        className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTaskDropdown(false);
                          // Use URLSearchParams for proper encoding
                          const params = new URLSearchParams();
                          params.set('dataset', dataset.name);
                          params.set('task', task.name);
                          const url = `/leaderboards?${params.toString()}`;
                          console.log('Navigating to:', url);
                          console.log('Task name:', task.name);
                          // Use window.location for more reliable navigation
                          window.location.href = url;
                          console.log('Navigation called');
                        }}
                      >
                        {task.name} ({task.paper_count} papers)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {dataset.homepage && (
            <a
              href={dataset.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
              title="Homepage"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}

        </div>
      </div>

      {dataset.image && (
        <div className="mb-4">
          <img 
            src={dataset.image} 
            alt={dataset.name}
            className="w-full h-32 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="text-gray-700 text-sm leading-relaxed mb-4">
        <ContentRenderer content={dataset.short_description || dataset.description} />
      </div>

      <div className="space-y-3">
        {dataset.parent_dataset && (
          <div className="flex items-start space-x-2">
            <Tag className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <span className="text-sm font-medium text-gray-700">Parent Dataset: </span>
              <span className="text-sm text-gray-600">{dataset.parent_dataset}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              ID: {dataset.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};