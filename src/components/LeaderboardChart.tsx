import React, { useMemo } from 'react';
import { Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { TrendingUp, Calendar } from 'lucide-react';
import { EvaluationTable } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface LeaderboardChartProps {
  evaluations: EvaluationTable[];
  dataset: string;
  task: string;
  selectedMetrics?: string[];
}

export const LeaderboardChart: React.FC<LeaderboardChartProps> = ({
  evaluations,
  dataset,
  task,
  selectedMetrics
}) => {
  const chartData = useMemo(() => {
    if (evaluations.length === 0) return null;

    // Get all available metrics
    const allMetrics = Object.keys(evaluations[0]?.metrics || {});
    const metricsToShow = selectedMetrics && selectedMetrics.length > 0 
      ? selectedMetrics 
      : allMetrics.slice(0, 1); // Show only the first metric for the main storyline

    // Sort evaluations by date
    const sortedEvaluations = [...evaluations].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });

    // Filter out entries without dates
    const validEvaluations = sortedEvaluations.filter(evaluation => evaluation.date);

    if (validEvaluations.length === 0) return null;

    // Get the primary metric for the storyline
    const primaryMetric = metricsToShow[0];
    
    // Create background scatter plot (all points)
    const backgroundData = validEvaluations.map(evaluation => {
      const value = evaluation.metrics[primaryMetric];
      if (value === null || value === undefined) return null;
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return isNaN(numValue) ? null : numValue;
    });

    // Find top performers (milestone points) - every 10th point or significant jumps
    const topPerformers = [];
    let lastBestValue = -Infinity;
    
    validEvaluations.forEach((evaluation, index) => {
      const value = evaluation.metrics[primaryMetric];
      if (value === null || value === undefined) return;
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return;
      
      // Include if it's a significant improvement or every 10th point
      if (numValue > lastBestValue * 1.02 || index % 10 === 0) {
        topPerformers.push({
          date: new Date(evaluation.date),
          value: numValue,
          model: evaluation.model_name,
          paper: evaluation.paper_title
        });
        lastBestValue = Math.max(lastBestValue, numValue);
      }
    });

    // Create datasets
    const datasets = [
      // Background scatter plot (all points)
      {
        label: 'All Results',
        data: backgroundData,
        type: 'scatter',
        backgroundColor: 'rgba(128, 128, 128, 0.3)',
        borderColor: 'rgba(128, 128, 128, 0.5)',
        pointRadius: 2,
        pointHoverRadius: 4,
        showLine: false,
        order: 2,
      },
      // Main storyline (top performers)
      {
        label: 'Top Performers',
        data: topPerformers.map(p => p.value),
        type: 'line',
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        borderColor: 'rgb(0, 255, 255)',
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(0, 255, 255)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        tension: 0.1,
        fill: false,
        order: 1,
      }
    ];

    return {
      labels: validEvaluations.map(evaluation => new Date(evaluation.date)),
      datasets,
      topPerformers, // Store for annotations
    };
  }, [evaluations, selectedMetrics]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `${task} Performance Evolution on ${dataset}`,
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: 20,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(0, 255, 255, 0.5)',
        borderWidth: 1,
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].label);
            return date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
          },
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label === 'Top Performers' && chartData?.topPerformers) {
              const performer = chartData.topPerformers[context.dataIndex];
              if (performer) {
                return [
                  `Model: ${performer.model}`,
                  `Value: ${value.toFixed(2)}`,
                  `Paper: ${performer.paper.substring(0, 50)}...`
                ];
              }
            }
            return `${label}: ${value?.toFixed(2) || 'N/A'}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'year' as const,
          displayFormats: {
            year: 'yyyy',
          },
        },
        title: {
          display: true,
          text: 'Year',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: 'PERCENTAGE CORRECT',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          callback: (value: any) => `${value}%`,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      point: {
        hoverBorderWidth: 3,
      },
    },
  };

  if (!chartData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Chart Data Available</h3>
        <p className="text-gray-600">
          No date information available for {task} on {dataset}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-cyan-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Performance Evolution Timeline
            </h3>
          </div>
          <div className="text-sm text-gray-500">
            {chartData.labels.length} total results, {chartData.topPerformers?.length || 0} milestone models
          </div>
        </div>
      
      <div className="h-80 relative">
        <Line data={chartData} options={chartOptions} />
        
        {/* Custom annotations for top performers */}
        {chartData?.topPerformers && (
          <div className="absolute inset-0 pointer-events-none">
            {chartData.topPerformers.slice(0, 8).map((performer, index) => {
              // Calculate position based on data
              const xPercent = ((performer.date.getTime() - chartData.labels[0].getTime()) / 
                               (chartData.labels[chartData.labels.length - 1].getTime() - chartData.labels[0].getTime())) * 100;
              const yPercent = 100 - ((performer.value - 50) / 50) * 100; // Assuming range 50-100%
              
              return (
                <div
                  key={index}
                  className="absolute transform -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                    marginTop: '-10px',
                  }}
                >
                  <div className="bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium text-gray-800 border border-gray-200 shadow-sm whitespace-nowrap">
                    {performer.model}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <Calendar className="w-3 h-3 inline mr-1" />
        Showing performance trends from {new Date(chartData.labels[0]).getFullYear()} to {new Date(chartData.labels[chartData.labels.length - 1]).getFullYear()}
      </div>
    </div>
  );
}; 