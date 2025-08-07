import React, { useState } from 'react';
import { Header } from './components/Header';
import { PaperCard } from './components/PaperCard';
import { LeaderboardTable } from './components/LeaderboardTable';
import { DatasetCard } from './components/DatasetCard';
import { MethodCard } from './components/MethodCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { usePapers, useCodeLinks, useLeaderboard, useDatasets, useMethods } from './hooks/useData';
import { AlertCircle, BookOpen, Code, BarChart3, Database, Layers } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('papers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('ImageNet');
  const [selectedTask, setSelectedTask] = useState('Image Classification');

  const { papers, loading: papersLoading, error: papersError } = usePapers(searchQuery);
  const { codeLinks, loading: codeLoading } = useCodeLinks();
  const { evaluations, loading: leaderboardLoading } = useLeaderboard(selectedDataset, selectedTask);
  const { datasets, loading: datasetsLoading, error: datasetsError } = useDatasets();
  const { methods, loading: methodsLoading, error: methodsError } = useMethods();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveTab('papers');
  };

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
            <div className="flex items-center space-x-2 mb-6">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {searchQuery ? `Search Results for "${searchQuery}"` : 'Latest Papers'}
              </h2>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                {papers.length} papers
              </span>
            </div>
            <div className="grid gap-6">
              {papers.map((paper) => {
                const paperCodeLinks = codeLinks.filter(link => 
                  link.paper_title === paper.title
                );
                return (
                  <PaperCard 
                    key={paper.id} 
                    paper={paper} 
                    codeLinks={paperCodeLinks}
                  />
                );
              })}
            </div>
          </div>
        );

      case 'code':
        if (codeLoading) return <LoadingSpinner />;
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Code className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Code Repositories</h2>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                {codeLinks.length} repositories
              </span>
            </div>
            <div className="grid gap-4">
              {codeLinks.slice(0, 20).map((link, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{link.paper_title}</h3>
                      <a 
                        href={link.repo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {link.repo_url}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        link.is_official 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {link.framework}
                      </span>
                      {link.is_official && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          Official
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dataset
                  </label>
                  <select
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ImageNet">ImageNet</option>
                    <option value="CIFAR-10">CIFAR-10</option>
                    <option value="MNIST">MNIST</option>
                    <option value="COCO">COCO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task
                  </label>
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Image Classification">Image Classification</option>
                    <option value="Object Detection">Object Detection</option>
                    <option value="Semantic Segmentation">Semantic Segmentation</option>
                    <option value="Instance Segmentation">Instance Segmentation</option>
                  </select>
                </div>
              </div>
            </div>

            {leaderboardLoading ? (
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