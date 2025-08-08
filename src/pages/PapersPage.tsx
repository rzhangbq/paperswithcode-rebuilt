import React, { useState } from 'react';
import { PaperCard } from '../components/PaperCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { usePapers, useCodeLinksForPapers } from '../hooks/useData';
import { BookOpen, AlertCircle } from 'lucide-react';

// Helper function to generate page numbers with ellipsis
function generatePageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const delta = 2; // Number of pages to show on each side of current page
  const range = [];
  const rangeWithDots = [];

  for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
    range.push(i);
  }

  if (currentPage - delta > 2) {
    rangeWithDots.push(1, '...');
  } else {
    rangeWithDots.push(1);
  }

  rangeWithDots.push(...range);

  if (currentPage + delta < totalPages - 1) {
    rangeWithDots.push('...', totalPages);
  } else {
    rangeWithDots.push(totalPages);
  }

  return rangeWithDots;
}

interface PapersPageProps {
  searchQuery: string;
  onSearch: (query: string) => void;
}

export const PapersPage: React.FC<PapersPageProps> = ({ searchQuery, onSearch }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [jumpToPage, setJumpToPage] = useState('');

  const { papers, pagination, loading: papersLoading, error: papersError } = usePapers(searchQuery, currentPage, pageSize);

  // Get paper URLs for fetching code links
  const paperUrls = papers?.map(paper => paper.paper_url).filter((url): url is string => Boolean(url)) || [];
  const { codeLinks } = useCodeLinksForPapers(paperUrls);

  // Debug logging
  React.useEffect(() => {
    if (codeLinks && codeLinks.length > 0) {
      console.log('Total code links loaded for papers:', codeLinks.length);
      console.log('Sample code link:', codeLinks[0]);
    }
    if (papers && papers.length > 0) {
      console.log('Total papers loaded:', papers.length);
      console.log('Sample paper title:', papers[0].title);
      console.log('Sample paper URL:', papers[0].paper_url);
    }
  }, [codeLinks, papers]);

  const handleSearch = (query: string) => {
    onSearch(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  if (papersLoading) return <LoadingSpinner />;
  
  if (papersError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{papersError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Latest Papers'}
          </h2>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
            {pagination?.totalItems || 0} papers
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          {pagination && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Go to page:</span>
              <input
                type="number"
                min="1"
                max={pagination.totalPages}
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const page = parseInt(jumpToPage);
                    if (page >= 1 && page <= pagination.totalPages) {
                      setCurrentPage(page);
                      setJumpToPage('');
                    }
                  }
                }}
                placeholder="Page #"
                className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
              />
              <button
                onClick={() => {
                  const page = parseInt(jumpToPage);
                  if (page >= 1 && page <= pagination.totalPages) {
                    setCurrentPage(page);
                    setJumpToPage('');
                  }
                }}
                className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Go
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid gap-6">
        {papers?.map((paper) => {
          const paperCodeLinks = codeLinks?.filter(link => 
            link.paper_url === paper.paper_url
          ).filter((link, index, self) => 
            // Remove duplicates based on repo_url
            index === self.findIndex(l => l.repo_url === link.repo_url)
          ) || [];
          
          return (
            <PaperCard 
              key={paper.id} 
              paper={paper} 
              codeLinks={paperCodeLinks}
            />
          );
        })}
      </div>
      
      {/* Pagination Controls */}
      {pagination && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-600">
            {pagination.totalItems > 0 
              ? `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, pagination.totalItems)} of ${pagination.totalItems} papers`
              : 'No papers found'
            }
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            {/* Page List */}
            <div className="flex items-center space-x-1">
              {generatePageNumbers(currentPage, pagination.totalPages).map((pageNum, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (pageNum !== '...') {
                      setCurrentPage(pageNum as number);
                    }
                  }}
                  disabled={pageNum === '...'}
                  className={`px-3 py-1 border rounded text-sm ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : pageNum === '...'
                      ? 'border-gray-200 text-gray-400 cursor-default'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 