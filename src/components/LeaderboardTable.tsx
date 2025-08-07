import React from 'react';
import { Trophy, ExternalLink, TrendingUp, Calendar, Users, BarChart3 } from 'lucide-react';
import { EvaluationTable } from '../types';

interface LeaderboardTableProps {
  evaluations: EvaluationTable[];
  dataset: string;
  task: string;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ 
  evaluations, 
  dataset, 
  task 
}) => {
  if (evaluations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
        <p className="text-gray-600">
          No evaluation results found for {task} on {dataset}
        </p>
      </div>
    );
  }

  const metricNames = Object.keys(evaluations[0]?.metrics || {});

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {task} on {dataset}
            </h3>
          </div>
          <div className="text-sm text-gray-500">
            {evaluations.length} results
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paper
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Authors
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              {metricNames.map(metric => (
                <th key={metric} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {metric}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {evaluations.map((evaluation, index) => (
              <tr key={evaluation.id} className={index < 3 ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {index === 0 && <Trophy className="w-4 h-4 text-yellow-500 mr-1" />}
                    {index === 1 && <Trophy className="w-4 h-4 text-gray-400 mr-1" />}
                    {index === 2 && <Trophy className="w-4 h-4 text-orange-400 mr-1" />}
                    <span className="text-sm font-medium text-gray-900">
                      #{index + 1}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {evaluation.model_name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {evaluation.paper_title}
                    </div>
                    {evaluation.paper_url && (
                      <a
                        href={evaluation.paper_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {Array.isArray(evaluation.authors) 
                        ? evaluation.authors.slice(0, 2).join(', ') + (evaluation.authors.length > 2 ? '...' : '')
                        : 'Unknown'
                      }
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {evaluation.date ? new Date(evaluation.date).getFullYear() : 'N/A'}
                    </span>
                  </div>
                </td>
                {metricNames.map(metric => (
                  <td key={metric} className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-900">
                        {(() => {
                          const value = evaluation.metrics[metric];
                          if (value === null || value === undefined) return 'N/A';
                          const numValue = typeof value === 'string' ? parseFloat(value) : value;
                          return isNaN(numValue) ? value : numValue.toFixed(2);
                        })()}
                      </span>
                      {index === 0 && (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};