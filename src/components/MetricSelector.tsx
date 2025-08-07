import React from 'react';
import { BarChart3, X } from 'lucide-react';

interface MetricSelectorProps {
  availableMetrics: string[];
  selectedMetrics: string[];
  onMetricToggle: (metric: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const MetricSelector: React.FC<MetricSelectorProps> = ({
  availableMetrics,
  selectedMetrics,
  onMetricToggle,
  onSelectAll,
  onClearAll,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-gray-600" />
          <h4 className="text-sm font-medium text-gray-900">Select Metrics</h4>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onSelectAll}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Select All
          </button>
          <button
            onClick={onClearAll}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {availableMetrics.map((metric) => (
          <button
            key={metric}
            onClick={() => onMetricToggle(metric)}
            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedMetrics.includes(metric)
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            <span>{metric}</span>
            {selectedMetrics.includes(metric) && (
              <X className="w-3 h-3" />
            )}
          </button>
        ))}
      </div>
      
      {selectedMetrics.length === 0 && (
        <p className="text-xs text-gray-500 mt-2">
          Select metrics to display in the chart
        </p>
      )}
    </div>
  );
}; 