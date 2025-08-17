import React from 'react';
import { Layers, Calendar, Tag, BookOpen, FileText, ExternalLink, Users } from 'lucide-react';
import { Method } from '../types';
import { ContentRenderer } from './ContentRenderer';

interface MethodCardProps {
  method: Method;
}

export const MethodCard: React.FC<MethodCardProps> = ({ method }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {method.full_name || method.name}
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          {method.num_papers && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{method.num_papers.toLocaleString()}</span>
            </div>
          )}
          {method.introduced_year && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{method.introduced_year}</span>
            </div>
          )}
        </div>
      </div>

      {method.description && (
        <div className="text-gray-700 text-sm leading-relaxed mb-4">
          <ContentRenderer content={method.description} />
        </div>
      )}

      <div className="space-y-3">
        {method.areas && method.areas.length > 0 && (
          <div className="flex items-start space-x-2">
            <Tag className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <span className="text-sm font-medium text-gray-700">Areas: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {method.areas.map((area, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {method.categories && method.categories.length > 0 && (
          <div className="flex items-start space-x-2">
            <Tag className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <span className="text-sm font-medium text-gray-700">Categories: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {method.categories.map((category, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {method.paper_title && (
          <div className="border-t pt-3">
            <div className="flex items-start space-x-2">
              <BookOpen className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <span className="text-xs text-gray-500">Introduced in: </span>
                <span className="text-sm text-gray-700">{method.paper_title}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-4 pt-3 border-t">
          {method.paper_url && (
            <a
              href={method.paper_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-800"
            >
              <FileText className="w-4 h-4" />
              <span>Paper</span>
            </a>
          )}
          {method.url && (
            <a
              href={method.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-800"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Method Page</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};