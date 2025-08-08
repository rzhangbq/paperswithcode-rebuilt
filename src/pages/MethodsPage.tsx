import React, { useState } from 'react';
import { MethodCard } from '../components/MethodCard';
import { MethodsHierarchy } from '../components/MethodsHierarchy';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  useMethods, 
  useMethodsHierarchy
} from '../hooks/useData';
import { 
  Layers, 
  AlertCircle, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  List,
  X,
  Filter
} from 'lucide-react';

export const MethodsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'hierarchy'>('hierarchy');
  const pageSize = 20;

  // Fetch methods hierarchy
  const { hierarchy, loading: hierarchyLoading, error: hierarchyError } = useMethodsHierarchy();

  // Fetch methods based on current filters
  const { 
    methods, 
    pagination, 
    loading: methodsLoading, 
    error: methodsError 
  } = useMethods(currentPage, pageSize, searchQuery, selectedArea, selectedCategory);

  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    setSelectedCategory('');
    setCurrentPage(1);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedArea('');
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedArea('');
    setSelectedCategory('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedArea || selectedCategory || searchQuery;

  if (hierarchyLoading) return <LoadingSpinner />;
  
  if (hierarchyError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{hierarchyError}</p>
        </div>
      </div>
    );
  }

  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Layers className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Methods</h2>
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
            {pagination?.totalItems || methods?.length || 0} methods
          </span>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'hierarchy' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search methods by name, description, or categories..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filters:</span>
            {selectedArea && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                Area: {selectedArea}
              </span>
            )}
            {selectedCategory && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                Category: {selectedCategory}
              </span>
            )}
            {searchQuery && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                Search: "{searchQuery}"
              </span>
            )}
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'hierarchy' && !hasActiveFilters ? (
        // Show hierarchy view when no filters are active
        <MethodsHierarchy
          hierarchy={hierarchy}
          onAreaSelect={handleAreaSelect}
          onCategorySelect={handleCategorySelect}
          selectedArea={selectedArea}
          selectedCategory={selectedCategory}
        />
      ) : (
        // Show methods grid/list view
        <div className="space-y-6">
          {methodsLoading ? (
            <LoadingSpinner />
          ) : methodsError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{methodsError}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Methods Grid */}
              <div className="grid gap-6">
                {methods && methods.length > 0 ? (
                  methods.map((method) => (
                    <MethodCard key={`${method.id}-${method.name}`} method={method} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No methods found</h3>
                    <p className="text-gray-600">
                      {hasActiveFilters 
                        ? `No methods match your current filters` 
                        : 'No methods available'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}; 