# Leaderboard Chart Feature

## Overview

The leaderboard now includes an interactive chart feature that visualizes metric performance over time. This allows users to see trends and progress in model performance across different tasks and datasets.

## Features

### 📊 Interactive Line Charts
- **Time-based visualization**: X-axis shows dates, Y-axis shows metric values
- **Multiple metrics support**: Display up to 5 different metrics simultaneously
- **Color-coded lines**: Each metric has a distinct color for easy identification
- **Responsive design**: Charts adapt to different screen sizes

### 🎛️ Metric Selection
- **Flexible metric selection**: Choose which metrics to display in the chart
- **Select All/Clear All**: Quick buttons to select or deselect all metrics
- **Visual feedback**: Selected metrics are highlighted with blue styling
- **Default selection**: Shows first 3 metrics by default

### 📈 Chart Controls
- **Show/Hide Chart**: Toggle chart visibility with a button
- **Data point count**: Shows how many data points are available
- **Date range display**: Shows the time span of the data
- **Interactive tooltips**: Hover over points to see detailed information

## How to Use

### 1. Navigate to Leaderboard
- Go to the "Leaderboard" tab in the application
- Select a task (e.g., "Image Classification")
- Select a dataset (e.g., "ImageNet")

### 2. Enable Chart View
- Click the "Show Chart" button to display the performance chart
- The chart will appear above the leaderboard table

### 3. Select Metrics
- Use the metric selector to choose which metrics to display
- Click on metric names to toggle them on/off
- Use "Select All" or "Clear All" for bulk operations

### 4. Interact with Chart
- Hover over data points to see detailed information
- The chart automatically sorts data by date
- Multiple metrics are displayed as separate colored lines

## Technical Implementation

### Components
- **LeaderboardChart**: Main chart component using Chart.js
- **MetricSelector**: Interactive metric selection interface
- **Chart Integration**: Seamlessly integrated with existing leaderboard table

### Dependencies
- `chart.js`: Core charting library
- `react-chartjs-2`: React wrapper for Chart.js
- `date-fns`: Date handling and formatting
- `chartjs-adapter-date-fns`: Date axis support

### Data Processing
- **Date sorting**: Evaluations are sorted chronologically
- **Metric parsing**: Handles both string and numeric metric values
- **Null handling**: Gracefully handles missing data points
- **Color assignment**: Automatic color assignment for multiple metrics

## Example Usage

```typescript
// Chart shows performance trends over time
// X-axis: Publication dates (2020-2025)
// Y-axis: Metric values (e.g., Top 1 Accuracy: 70-90%)

// Multiple metrics displayed:
// - Top 1 Accuracy (blue line)
// - Top 5 Accuracy (green line)  
// - Number of params (yellow line)
// - GFLOPs (red line)
```

## Benefits

### For Researchers
- **Trend analysis**: See how model performance has evolved over time
- **Comparison**: Compare multiple metrics simultaneously
- **Progress tracking**: Identify breakthrough papers and performance jumps

### For Developers
- **Performance insights**: Understand model efficiency trends
- **Resource planning**: See computational requirements over time
- **Benchmarking**: Compare against historical performance

### For Users
- **Visual understanding**: Intuitive visualization of complex data
- **Interactive exploration**: Customize what metrics to view
- **Historical context**: Understand the evolution of AI models

## Future Enhancements

- **Zoom and pan**: Interactive chart navigation
- **Export functionality**: Save charts as images
- **Statistical overlays**: Add trend lines and confidence intervals
- **Comparative charts**: Side-by-side dataset comparisons
- **Filtering options**: Filter by model types or conferences 