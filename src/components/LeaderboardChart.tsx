import React, { useMemo } from "react";
import { Line, Scatter } from "react-chartjs-2";
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
} from "chart.js";
import "chartjs-adapter-date-fns";
import { TrendingUp, Calendar } from "lucide-react";
import { EvaluationTable } from "../types";
import { parseDate, isValidDate } from "../utils/dateUtils";

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
}

export const LeaderboardChart: React.FC<LeaderboardChartProps> = ({
  evaluations,
  dataset,
  task,
}) => {
  const chartData = useMemo(() => {
    // Debug: Log the incoming evaluations
    console.log(
      `LeaderboardChart processing ${evaluations.length} evaluations for ${task} on ${dataset}`
    );
    const validCount = evaluations.filter((e) => isValidDate(e.date)).length;
    console.log(`Found ${validCount} evaluations with valid dates`);

    // Debug: Log sample dates to check format
    if (evaluations.length > 0) {
      console.log(
        "Sample dates from evaluations:",
        evaluations.slice(0, 3).map((e) => ({
          date: e.date,
          isValid: isValidDate(e.date),
          parsed: parseDate(e.date).toISOString(),
        }))
      );
    }

    if (evaluations.length === 0) return null;

    // Get the primary metric (first available metric)
    const allMetrics = Object.keys(evaluations[0]?.metrics || {});
    const primaryMetric = allMetrics[0]; // Always use the first metric

    // Sort evaluations by date and filter out invalid dates
    const sortedEvaluations = [...evaluations]
      .filter((evaluation) => {
        const isValid = isValidDate(evaluation.date);
        if (!isValid) {
          console.warn("Filtering out evaluation with invalid date:", {
            model: evaluation.model_name,
            date: evaluation.date,
            paper: evaluation.paper_title,
          });
        }
        return isValid;
      })
      .sort((a, b) => {
        const dateA = parseDate(a.date).getTime();
        const dateB = parseDate(b.date).getTime();
        return dateA - dateB;
      });

    // Filter out entries without dates
    const validEvaluations = sortedEvaluations;

    if (validEvaluations.length === 0) return null;

    // Create background scatter plot (all points)
    const backgroundData = validEvaluations.map((evaluation) => {
      const value = evaluation.metrics[primaryMetric];
      if (value === null || value === undefined) return null;
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      return isNaN(numValue) ? null : numValue;
    });

    // Debug: Log background data
    console.log("Background data created:", {
      totalPoints: backgroundData.length,
      validPoints: backgroundData.filter((v) => v !== null).length,
      sampleValues: backgroundData.slice(0, 3),
    });

    // Find top performers (cumulative best performance over time)
    const topPerformers = [];
    let currentBestValue = -Infinity;

    validEvaluations.forEach((evaluation, index) => {
      const value = evaluation.metrics[primaryMetric];
      if (value === null || value === undefined) return;
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue)) return;

      const parsedDate = parseDate(evaluation.date);
      // Double-check that the date is valid
      if (parsedDate.getTime() <= new Date("1900-01-01").getTime()) {
        console.warn("Skipping evaluation due to invalid date:", {
          model: evaluation.model_name,
          date: evaluation.date,
          parsedDate: parsedDate.toISOString(),
        });
        return;
      }

      // Check if this is a new best performance
      if (numValue > currentBestValue) {
        currentBestValue = numValue;
        topPerformers.push({
          date: parsedDate,
          value: numValue,
          model: evaluation.model_name,
          paper: evaluation.paper_title,
        });
      }
    });

    // Debug: Log the top performers selection
    console.log("Top performers selection:", {
      totalEvaluations: validEvaluations.length,
      topPerformersCount: topPerformers.length,
      finalBestValue: currentBestValue,
      topPerformers: topPerformers.map((p) => ({
        date: p.date.toISOString(),
        value: p.value,
        model: p.model,
      })),
    });

    // Ensure top performers are sorted by date
    topPerformers.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Create datasets with proper time scale data structure
    const datasets = [
      // Background scatter plot (all points)
      {
        label: "All Results",
        data: validEvaluations
          .map((evaluation, index) => ({
            x: parseDate(evaluation.date),
            y: backgroundData[index],
            model: evaluation.model_name,
            paper: evaluation.paper_title,
          }))
          .filter((point) => point.y !== null),
        type: "scatter",
        backgroundColor: "rgba(128, 128, 128, 0.3)",
        borderColor: "rgba(128, 128, 128, 0.5)",
        pointRadius: 2,
        pointHoverRadius: 4,
        showLine: false,
        order: 2,
      },
      // Main storyline (top performers)
      {
        label: "Top Performers",
        data: topPerformers.map((p) => ({
          x: p.date,
          y: p.value,
        })),
        type: "line",
        backgroundColor: "rgba(0, 255, 255, 0.1)",
        borderColor: "rgb(0, 255, 255)",
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: "rgb(0, 255, 255)",
        pointBorderColor: "white",
        pointBorderWidth: 2,
        tension: 0.1,
        fill: false,
        order: 1,
      },
    ];

    const chartDataResult = {
      datasets,
      topPerformers, // Store for annotations
    };

    // Additional validation: Ensure all dates are valid before returning
    const validatedTopPerformers = chartDataResult.topPerformers.filter(
      (performer) => {
        const isValid =
          performer.date.getTime() > new Date("1900-01-01").getTime();
        if (!isValid) {
          console.warn("Invalid date found in top performers:", performer);
        }
        return isValid;
      }
    );

    // Debug: Log the validated chart data
    console.log(
      "Validated top performers:",
      validatedTopPerformers.map((p) => ({
        date: p.date.toISOString(),
        model: p.model,
        value: p.value,
      }))
    );

    // Debug: Log the final chart data structure
    console.log("Final chart data structure:", {
      datasetsCount: chartDataResult.datasets.length,
      backgroundDataPoints: chartDataResult.datasets[0]?.data?.length || 0,
      topPerformersCount: validatedTopPerformers.length,
      sampleDataPoint: chartDataResult.datasets[0]?.data?.[0],
    });

    // Validate chart data structure
    const isValidChartData = chartDataResult.datasets.every(
      (dataset) =>
        dataset.data &&
        Array.isArray(dataset.data) &&
        dataset.data.length > 0 &&
        dataset.data.every(
          (point) =>
            point &&
            typeof point.x === "object" &&
            point.x instanceof Date &&
            typeof point.y === "number"
        )
    );

    if (!isValidChartData) {
      console.error("Invalid chart data structure detected:", chartDataResult);
      return null;
    }

    return {
      ...chartDataResult,
      topPerformers: validatedTopPerformers,
    };
  }, [evaluations]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
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
          weight: "bold" as const,
        },
        padding: 20,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(0, 255, 255, 0.5)",
        borderWidth: 1,
        callbacks: {
          title: (context: any) => {
            try {
              // Try multiple ways to get the date from the context
              let date = null;
              if (context[0]?.raw?.x) {
                date = context[0].raw.x;
              } else if (context[0]?.parsed?.x) {
                date = context[0].parsed.x;
              } else if (context[0]?.label) {
                date = new Date(context[0].label);
              }

              if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
                console.warn(
                  "No valid date found in tooltip context:",
                  context[0]
                );
                return "Invalid Date";
              }

              // Check if the date is valid (not the fallback date)
              if (date.getTime() === new Date("1900-01-01").getTime()) {
                console.warn("Invalid date in tooltip:", date);
                return "Invalid Date";
              }

              return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
            } catch (error) {
              console.error(
                "Error in tooltip title callback:",
                error,
                context[0]
              );
              return "Invalid Date";
            }
          },
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;

            if (label === "Top Performers" && chartData?.topPerformers) {
              const performer = chartData.topPerformers[context.dataIndex];
              if (performer) {
                return [
                  `Model: ${performer.model}`,
                  `Value: ${value.toFixed(2)}`,
                  `Paper: ${performer.paper.substring(0, 50)}...`,
                ];
              }
            }

            if (label === "All Results") {
              const dataPoint = context.raw;
              if (dataPoint && dataPoint.model) {
                return [
                  `Model: ${dataPoint.model}`,
                  `Value: ${value.toFixed(2)}`,
                  `Paper: ${
                    dataPoint.paper
                      ? dataPoint.paper.substring(0, 50) + "..."
                      : "N/A"
                  }`,
                ];
              }
            }

            return `${label}: ${value?.toFixed(2) || "N/A"}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "year" as const,
          displayFormats: {
            year: "yyyy",
          },
          tooltipFormat: "MMM dd, yyyy",
        },
        title: {
          display: true,
          text: "Year",
          font: {
            size: 14,
            weight: "bold" as const,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          maxTicksLimit: 10,
        },
      },
      y: {
        title: {
          display: true,
          text: "PERCENTAGE CORRECT",
          font: {
            size: 14,
            weight: "bold" as const,
          },
        },
        beginAtZero: false,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
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
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
    elements: {
      point: {
        hoverBorderWidth: 3,
      },
    },
  };

  if (
    !chartData ||
    !chartData.datasets ||
    chartData.datasets.length === 0 ||
    chartData.datasets[0].data.length === 0 ||
    chartData.topPerformers.length === 0
  ) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Valid Chart Data Available
        </h3>
        <p className="text-gray-600">
          No valid date information available for {task} on {dataset}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This might be due to missing or invalid date information in the data.
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
          {chartData.datasets[0].data.length} total results,{" "}
          {chartData.topPerformers?.length || 0} milestone models
        </div>
      </div>

      <div className="h-80 relative">
        {(() => {
          try {
            return <Line data={chartData} options={chartOptions} />;
          } catch (error) {
            console.error("Error rendering chart:", error);
            return (
              <div className="flex items-center justify-center h-full">
                <div className="text-red-500 text-center">
                  <p>Error rendering chart</p>
                  <p className="text-sm text-gray-500">{error.message}</p>
                </div>
              </div>
            );
          }
        })()}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <Calendar className="w-3 h-3 inline mr-1" />
        Showing performance trends from{" "}
        {(() => {
          const allDates = chartData.datasets[0].data
            .map((point) => point.x)
            .sort((a, b) => a.getTime() - b.getTime());
          return `${allDates[0].getFullYear()} to ${allDates[
            allDates.length - 1
          ].getFullYear()}`;
        })()}
      </div>
    </div>
  );
};
