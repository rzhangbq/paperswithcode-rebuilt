import React, { useState } from 'react';
import { Header } from './components/Header';
import { PaperCard } from './components/PaperCard';
import { LeaderboardTable } from './components/LeaderboardTable';
import { DatasetCard } from './components/DatasetCard';
import { MethodCard } from './components/MethodCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { usePapers, useCodeLinksForPapers, useLeaderboard, useDatasets, useMethods, useAvailableTasks, useDatasetsForTask } from './hooks/useData';
import { AlertCircle, BookOpen, BarChart3, Database, Layers } from 'lucide-react';

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

function App() {
  const [activeTab, setActiveTab] = useState('papers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [jumpToPage, setJumpToPage] = useState('');

  const { papers, pagination, loading: papersLoading, error: papersError } = usePapers(searchQuery, currentPage, pageSize);
  const { evaluations, loading: leaderboardLoading } = useLeaderboard(selectedDataset, selectedTask);
  const { datasets, loading: datasetsLoading, error: datasetsError } = useDatasets();
  const { methods, loading: methodsLoading, error: methodsError } = useMethods();
  const { tasks: availableTasks, loading: availableTasksLoading } = useAvailableTasks();
  const { datasets: taskDatasets, loading: taskDatasetsLoading } = useDatasetsForTask(selectedTask);

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
    setSearchQuery(query);
    setActiveTab('papers');
    setCurrentPage(1); // Reset to first page when searching
  };

  // Clear selected dataset when task changes
  React.useEffect(() => {
    setSelectedDataset('');
  }, [selectedTask]);

  const renderContent = () => {
    switch (activeTab) {
      case 'papers':
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
                      <label className="text-sm text-gray-600">Jump to:</label>
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

      case 'leaderboards':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">Leaderboards</h2>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Leaderboard Settings</h3>
                {(selectedTask || selectedDataset) && (
                  <button
                    onClick={() => {
                      setSelectedTask('');
                      setSelectedDataset('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear Selection
                  </button>
                )}
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
                      onChange={(e) => setSelectedTask(e.target.value)}
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
                      onChange={(e) => setSelectedDataset(e.target.value)}
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
                          onClick={() => setSelectedTask(task)}
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
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Datasets for {selectedTask}
                    </h4>
                    {taskDatasetsLoading ? (
                      <div className="text-center py-8">
                        <div className="text-sm text-gray-500">Loading datasets...</div>
                      </div>
                    ) : taskDatasets.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {taskDatasets.slice(0, 9).map((dataset) => (
                          <div 
                            key={dataset.name}
                            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                            onClick={() => setSelectedDataset(dataset.name)}
                          >
                            <h5 className="font-medium text-gray-900">{dataset.full_name || dataset.name}</h5>
                            <p className="text-sm text-gray-500 mt-1">
                              {dataset.paper_count} papers
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-sm text-gray-500">No datasets found for this task</div>
                      </div>
                    )}
                  </div>
                )}


              </div>
            ) : leaderboardLoading ? (
              <LoadingSpinner />
            ) : (
              <LeaderboardTable 
                evaluations={evaluations}
                dataset={selectedDataset}
                task={selectedTask}
              />
            )}
          </div>
        );

      case 'datasets':
        if (datasetsLoading) return <LoadingSpinner />;
        if (datasetsError) {
          return (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{datasetsError}</p>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Datasets</h2>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                {datasets.length} datasets
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {datasets.map((dataset, index) => (
                <DatasetCard key={index} dataset={dataset} />
              ))}
            </div>
          </div>
        );

      case 'methods':
        if (methodsLoading) return <LoadingSpinner />;
        if (methodsError) {
          return (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{methodsError}</p>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Layers className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Methods</h2>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                {methods.length} methods
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {methods.map((method, index) => (
                <MethodCard key={index} method={method} />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSearch={handleSearch}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;