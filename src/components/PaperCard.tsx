import React from 'react';
import { ExternalLink, Calendar, Users, Github } from 'lucide-react';
import { Paper } from '../types';

interface PaperCardProps {
  paper: Paper;
  codeLinks?: Array<{ repo_url: string; is_official: boolean; framework: string }>;
}

export const PaperCard: React.FC<PaperCardProps> = ({ paper, codeLinks = [] }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateAbstract = (abstract: string, maxLength = 300) => {
    if (abstract.length <= maxLength) return abstract;
    return abstract.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {paper.title}
        </h3>
        {paper.url_abs && (
          <a
            href={paper.url_abs}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 ml-2 flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{paper.authors.slice(0, 3).join(', ')}</span>
          {paper.authors.length > 3 && <span>et al.</span>}
        </div>
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(paper.published)}</span>
        </div>
        {paper.conference && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
            {paper.conference}
          </span>
        )}
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {truncateAbstract(paper.abstract)}
      </p>

      {codeLinks.length > 0 && (
        <div className="border-t pt-3">
          <div className="flex items-center space-x-2 mb-2">
            <Github className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Code Available:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {codeLinks.slice(0, 3).map((link, index) => (
              <a
                key={index}
                href={link.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                  link.is_official
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <span>{link.framework}</span>
                {link.is_official && <span className="text-green-600">★</span>}
              </a>
            ))}
            {codeLinks.length > 3 && (
              <span className="text-xs text-gray-500">+{codeLinks.length - 3} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};