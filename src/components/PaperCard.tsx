import React from 'react';
import { ExternalLink, Calendar, Users, Github, FileText, Hash, Award, Copy } from 'lucide-react';
import { Paper } from '../types';

interface PaperCardProps {
  paper: Paper;
  codeLinks?: Array<{ repo_url: string; is_official: boolean }>;
}

export const PaperCard: React.FC<PaperCardProps> = ({ paper, codeLinks = [] }) => {
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '2222-12-22') {
      return 'Date not available';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Date not available';
    }
    
    // Check if it's a generic date (like 2021-01-01, 2020-12-01, etc.)
    const day = date.getDate();
    // const month = date.getMonth();
    
    // If it's the first day of the month, show only year (common placeholder)
    if (day === 1) {
      return date.getFullYear().toString();
    }
    
    return date.toLocaleDateString('en-US', {
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

      {/* Paper IDs and Links */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
        {paper.arxiv_id && (
          <div className="flex items-center space-x-1">
            <Hash className="w-3 h-3" />
            <span>arXiv: {paper.arxiv_id}</span>
          </div>
        )}
        {paper.nips_id && (
          <div className="flex items-center space-x-1">
            <Award className="w-3 h-3" />
            <span>NeurIPS: {paper.nips_id}</span>
          </div>
        )}
        {paper.openreview_id && (
          <div className="flex items-center space-x-1">
            <FileText className="w-3 h-3" />
            <span>OpenReview: {paper.openreview_id}</span>
          </div>
        )}
      </div>

      {/* Paper Links */}
      <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
        {paper.url_abs && (
          <a
            href={paper.url_abs}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
          >
            <FileText className="w-3 h-3" />
            <span>Abstract</span>
          </a>
        )}
        {paper.url_pdf && (
          <a
            href={paper.url_pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-red-600 hover:text-red-800"
          >
            <FileText className="w-3 h-3" />
            <span>PDF</span>
          </a>
        )}
        {paper.conference_url_abs && (
          <a
            href={paper.conference_url_abs}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-green-600 hover:text-green-800"
          >
            <Award className="w-3 h-3" />
            <span>Conference</span>
          </a>
        )}
        {paper.conference_url_pdf && (
          <a
            href={paper.conference_url_pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-purple-600 hover:text-purple-800"
          >
            <FileText className="w-3 h-3" />
            <span>Conf. PDF</span>
          </a>
        )}
      </div>

      {paper.short_abstract && (
        <p className="text-gray-600 text-sm leading-relaxed mb-3 italic">
          {paper.short_abstract}
        </p>
      )}
      
      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {truncateAbstract(paper.abstract)}
      </p>

      {paper.proceeding && (
        <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
          <FileText className="w-4 h-4 text-gray-600" />
          <div>
            <span className="text-xs font-medium text-gray-700">Proceeding:</span>
            <span className="text-sm text-gray-600 ml-1">{paper.proceeding}</span>
          </div>
        </div>
      )}

      {paper.reproduces_paper && (
        <div className="flex items-center space-x-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Copy className="w-4 h-4 text-yellow-600" />
          <div>
            <span className="text-xs font-medium text-yellow-800">Reproduces:</span>
            <span className="text-sm text-yellow-700 ml-1">{paper.reproduces_paper}</span>
          </div>
        </div>
      )}

      {codeLinks.length > 0 && (
        <div className="border-t pt-3">
          <div className="flex items-center space-x-2 mb-2">
            <Github className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Code Available ({codeLinks.length}):</span>
          </div>
          <div className="space-y-2">
            {codeLinks.slice(0, 3).map((link, index) => {
              // Debug logging
              console.log('Code link data:', link);
              
              const isOfficial = Boolean(link.is_official);
              const mentionedInPaper = Boolean((link as any).mentioned_in_paper);
              
              return (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <a
                      href={link.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                        isOfficial
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <span>Repository</span>
                      {isOfficial && <span className="text-green-600">★</span>}
                    </a>
                    {mentionedInPaper && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                        In Paper
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isOfficial ? 'Official' : 'Community'}
                  </div>
                </div>
              );
            })}
            {codeLinks.length > 3 && (
              <div className="text-center">
                <span className="text-xs text-gray-500">+{codeLinks.length - 3} more repositories</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};