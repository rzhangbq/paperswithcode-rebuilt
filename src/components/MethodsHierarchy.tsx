import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Layers, Folder, FolderOpen } from 'lucide-react';

interface MethodsHierarchyProps {
  hierarchy: any;
  onAreaSelect?: (area: string) => void;
  onCategorySelect?: (category: string) => void;
  selectedArea?: string;
  selectedCategory?: string;
}

export const MethodsHierarchy: React.FC<MethodsHierarchyProps> = ({
  hierarchy,
  onAreaSelect,
  onCategorySelect,
  selectedArea,
  selectedCategory
}) => {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  const toggleArea = (area: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(area)) {
      newExpanded.delete(area);
    } else {
      newExpanded.add(area);
    }
    setExpandedAreas(newExpanded);
  };

  const handleAreaClick = (area: string) => {
    if (onAreaSelect) {
      onAreaSelect(area);
    }
  };

  const handleCategoryClick = (category: string) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const sortedAreas = Object.entries(hierarchy).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Layers className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Methods by Area</h3>
      </div>
      
      <div className="space-y-2">
        {sortedAreas.map(([areaName, categories]) => {
          const isExpanded = expandedAreas.has(areaName);
          const isSelected = selectedArea === areaName;
          const totalMethods = (categories as any[]).reduce((sum: number, cat: any) => sum + cat.method_count, 0);
          const totalPapers = (categories as any[]).reduce((sum: number, cat: any) => sum + cat.paper_count, 0);

          return (
            <div key={areaName} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleArea(areaName)}
                className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-purple-50 border-purple-200' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Folder className="w-4 h-4 text-purple-600" />
                  )}
                  <span className="font-medium text-gray-900">{areaName}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{totalMethods} methods</span>
                  <span>{totalPapers.toLocaleString()} papers</span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="p-3">
                    <button
                      onClick={() => handleAreaClick(areaName)}
                      className="w-full text-left p-2 rounded hover:bg-white transition-colors text-sm font-medium text-purple-700"
                    >
                      View all methods in {areaName}
                    </button>
                  </div>
                  <div className="space-y-1 px-3 pb-3">
                    {(categories as any[])
                      .sort((a: any, b: any) => b.paper_count - a.paper_count)
                      .map((category: any) => {
                        const isCategorySelected = selectedCategory === category.name;
                        return (
                          <button
                            key={category.name}
                            onClick={() => handleCategoryClick(category.name)}
                            className={`w-full flex items-center justify-between p-2 rounded text-left text-sm transition-colors ${
                              isCategorySelected
                                ? 'bg-purple-100 text-purple-800'
                                : 'hover:bg-white text-gray-700'
                            }`}
                          >
                            <span className="truncate">{category.name}</span>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{category.method_count}</span>
                              <span>•</span>
                              <span>{category.paper_count.toLocaleString()}</span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 