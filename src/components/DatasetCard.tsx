import React from 'react';
import { Database, ExternalLink, Tag, Calendar, Globe } from 'lucide-react';
import { Dataset } from '../types';

interface DatasetCardProps {
  dataset: Dataset;
}

export const DatasetCard: React.FC<DatasetCardProps> = ({ dataset }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {dataset.full_name || dataset.name}
          </h3>
        </div>
        {dataset.url && (
          <a
            href={dataset.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {dataset.description}
      </p>

      <div className="space-y-3">
        {dataset.tasks.length > 0 && (
          <div className="flex items-start space-x-2">
            <Tag className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <span className="text-sm font-medium text-gray-700">Tasks: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {dataset.tasks.map((task, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                  >
                    {task}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {dataset.languages.length > 0 && (
          <div className="flex items-start space-x-2">
            <Globe className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <span className="text-sm font-medium text-gray-700">Languages: </span>
              <span className="text-sm text-gray-600">
                {dataset.languages.join(', ')}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            {dataset.size && (
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                Size: {dataset.size}
              </span>
            )}
            {dataset.introduced_year && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{dataset.introduced_year}</span>
              </div>
            )}
          </div>
        </div>

        {dataset.paper_title && (
          <div className="border-t pt-3">
            <span className="text-xs text-gray-500">Introduced in: </span>
            <span className="text-sm text-gray-700">{dataset.paper_title}</span>
          </div>
        )}
      </div>
    </div>
  );
};