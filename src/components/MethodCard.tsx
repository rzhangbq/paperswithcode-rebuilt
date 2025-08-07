import React from 'react';
import { Layers, Calendar, Tag, BookOpen } from 'lucide-react';
import { Method } from '../types';

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
        {method.introduced_year && (
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{method.introduced_year}</span>
          </div>
        )}
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {method.description}
      </p>

      <div className="space-y-3">
        {method.categories.length > 0 && (
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
      </div>
    </div>
  );
};