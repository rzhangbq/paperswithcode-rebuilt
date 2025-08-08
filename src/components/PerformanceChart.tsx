import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { getYear } from '../utils/dateUtils';

interface CumulativeBest {
  year: number;
  bestScore: number;
  model: string;
  paper: string;
  date: string;
  isNewRecord: boolean;
}

interface PerformanceChartProps {
  cumulativeBest: CumulativeBest[];
  metricName: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  cumulativeBest, 
  metricName 
}) => {
  // Debug: Log the cumulative best data
  console.log('PerformanceChart received cumulativeBest:', cumulativeBest);
  const validRecords = cumulativeBest.filter(record => record.year > 1900);
  console.log('Valid records for chart:', validRecords);

  if (cumulativeBest.length === 0) {
    return null;
  }

  const maxScore = Math.max(...cumulativeBest.map(record => record.bestScore));
  const minScore = Math.min(...cumulativeBest.map(record => record.bestScore));
  const scoreRange = maxScore - minScore;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          Performance Progress Over Time
        </h3>
      </div>
      
      <div className="space-y-4">
        {cumulativeBest
          .filter(record => record.year > 1900) // Filter out invalid years
          .map((record, index) => {
          const progress = scoreRange > 0 ? ((record.bestScore - minScore) / scoreRange) * 100 : 0;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{record.year}</span>
                  <span className="text-gray-600">-</span>
                  <span className="text-gray-700 max-w-xs truncate">{record.model}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-green-600">
                    {record.bestScore.toFixed(2)}
                  </span>
                  <span className="text-gray-500 text-xs">{metricName}</span>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="absolute -top-1 right-0 transform translate-x-1/2">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                </div>
              </div>
              
              <div className="text-xs text-gray-500 pl-4">
                {record.paper}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          {(() => {
            const validRecords = cumulativeBest.filter(record => record.year > 1900);
            const improvement = validRecords.length > 0 ? 
              ((validRecords[validRecords.length - 1]?.bestScore - validRecords[0]?.bestScore) || 0).toFixed(2) : '0.00';
            const timeSpan = validRecords.length > 0 ? 
              (validRecords[validRecords.length - 1]?.year - validRecords[0]?.year) : 0;
            return (
              <>
                <span>Improvement: {improvement} points</span>
                <span>Time span: {timeSpan} years</span>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}; 