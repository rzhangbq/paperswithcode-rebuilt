import React, { useMemo } from 'react';
import { Trophy, ExternalLink, TrendingUp, Calendar, Users, BarChart3, Star, Award } from 'lucide-react';
import { EvaluationTable } from '../types';
import { PerformanceChart } from './PerformanceChart';
import { parseDate, formatDate, getYear, isValidDate } from '../utils/dateUtils';

interface LeaderboardTableProps {
  evaluations: EvaluationTable[];
  dataset: string;
  task: string;
}

interface CumulativeBest {
  year: number;
  bestScore: number;
  model: string;
  paper: string;
  date: string;
  isNewRecord: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ 
  evaluations, 
  dataset, 
  task 
}) => {

  // Process evaluations to create cumulative best performance tracking
  const { processedEvaluations, cumulativeBest } = useMemo(() => {
    // Debug: Log the incoming evaluations
    console.log(`Processing ${evaluations.length} evaluations for ${task} on ${dataset}`);
    const validCount = evaluations.filter(e => isValidDate(e.date)).length;
    console.log(`Found ${validCount} evaluations with valid dates`);
    
    // Debug: Log any evaluations with invalid dates
    const invalidDates = evaluations.filter(e => !isValidDate(e.date));
    if (invalidDates.length > 0) {
      console.log(`Found ${invalidDates.length} evaluations with invalid dates:`, 
        invalidDates.map(e => ({ date: e.date, model: e.model_name })));
    }
    
    // Debug: Test some specific dates
    const testDates = evaluations.slice(0, 5).map(e => ({ date: e.date, valid: isValidDate(e.date) }));
    console.log('Test dates:', testDates);
    if (!evaluations || evaluations.length === 0) {
      return { processedEvaluations: [], cumulativeBest: [] };
    }

    // Get the primary metric (first metric in the first evaluation)
    const primaryMetric = Object.keys(evaluations[0]?.metrics || {})[0];
    if (!primaryMetric) {
      return { processedEvaluations: evaluations, cumulativeBest: [] };
    }

    // Filter out evaluations with invalid dates and sort by date (oldest first)
    const sortedEvaluations = [...evaluations]
      .sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateA.getTime() - dateB.getTime();
      });

    // Track cumulative best performance
    let currentBest = -Infinity;
    const cumulativeBest: CumulativeBest[] = [];
    const processedEvaluations = sortedEvaluations.map((evaluation, index) => {
      const score = evaluation.metrics[primaryMetric];
      if (score === null || score === undefined || score === '') {
        return { ...evaluation, isNewRecord: false, cumulativeBest: currentBest };
      }

      // Convert score to number, handling percentage strings
      let numericScore: number;
      if (typeof score === 'string') {
        numericScore = parseFloat(score.replace('%', ''));
      } else {
        numericScore = score;
      }

      if (isNaN(numericScore)) {
        return { ...evaluation, isNewRecord: false, cumulativeBest: currentBest };
      }

      const year = getYear(evaluation.date);
      const isNewRecord = numericScore > currentBest;

      // Only add to cumulative best if the year is valid (not 1900)
      if (isNewRecord && year > 1900) {
        currentBest = numericScore;
        cumulativeBest.push({
          year,
          bestScore: currentBest,
          model: evaluation.model_name,
          paper: evaluation.paper_title,
          date: evaluation.date || '',
          isNewRecord: true
        });
      }

      return { 
        ...evaluation, 
        isNewRecord, 
        cumulativeBest: currentBest,
        numericScore 
      };
    });

    return { processedEvaluations, cumulativeBest };
  }, [evaluations]);

  if (evaluations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
        <p className="text-gray-600">
          No evaluation results found for {task} on {dataset}
        </p>
      </div>
    );
  }





  const metricNames = Object.keys(evaluations[0]?.metrics || {});
  
  // Sort evaluations by performance score for leaderboard display (highest to lowest)
  const sortedForLeaderboard = [...processedEvaluations]
    .filter(evaluation => evaluation.numericScore !== undefined && !isNaN(evaluation.numericScore))
    .sort((a, b) => (b.numericScore || 0) - (a.numericScore || 0));

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      {cumulativeBest.filter(record => record.year > 1900).length > 0 && (
        <PerformanceChart 
          cumulativeBest={cumulativeBest}
          metricName={Object.keys(evaluations[0]?.metrics || {})[0] || 'Score'}
        />
      )}

      {/* Main Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {task} on {dataset}
              </h3>
            </div>
            <div className="text-sm text-gray-500">
              {sortedForLeaderboard.length} results
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paper
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {metricNames.map(metric => (
                  <th key={metric} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {metric}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cumulative Best
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedForLeaderboard.map((evaluation, index) => (
                <tr key={evaluation.id} className={`${evaluation.isNewRecord ? 'bg-green-50 border-l-4 border-green-400' : index < 3 ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {evaluation.isNewRecord && <Award className="w-4 h-4 text-green-500 mr-1" />}
                      {index === 0 && <Trophy className="w-4 h-4 text-yellow-500 mr-1" />}
                      {index === 1 && <Trophy className="w-4 h-4 text-gray-400 mr-1" />}
                      {index === 2 && <Trophy className="w-4 h-4 text-orange-400 mr-1" />}
                      <span className="text-sm font-medium text-gray-900">
                        #{index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {evaluation.model_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {evaluation.paper_title}
                      </div>
                      {evaluation.paper_url && (
                        <a
                          href={evaluation.paper_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {formatDate(evaluation.date)}
                      </span>
                    </div>
                  </td>
                  {metricNames.map(metric => (
                    <td key={metric} className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <span className={`text-sm font-medium ${evaluation.isNewRecord ? 'text-green-600' : 'text-gray-900'}`}>
                          {(() => {
                            const value = evaluation.metrics[metric];
                            if (value === null || value === undefined || value === '') return 'N/A';
                            return value;
                          })()}
                        </span>
                        {evaluation.isNewRecord && (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {evaluation.cumulativeBest !== undefined ? evaluation.cumulativeBest.toFixed(2) : 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};