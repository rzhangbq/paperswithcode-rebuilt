import { parseDate, formatDate, getYear, isValidDate } from './dateUtils';

// Simple test function to verify date utilities work correctly
export const testDateUtils = () => {
  console.log('Testing date utilities...');
  
  // Test valid dates
  console.log('Valid date:', formatDate('2024-12-20')); // Should show: 12/20/2024
  console.log('Valid year:', getYear('2024-12-20')); // Should show: 2024
  console.log('Is valid:', isValidDate('2024-12-20')); // Should show: true
  
  // Test invalid dates
  console.log('Invalid date:', formatDate('2025-03-24')); // Should show: N/A (future date)
  console.log('Invalid year:', getYear('2025-03-24')); // Should show: 1900
  console.log('Is valid:', isValidDate('2025-03-24')); // Should show: false
  
  // Test missing dates
  console.log('Missing date:', formatDate(undefined)); // Should show: N/A
  console.log('Missing year:', getYear(undefined)); // Should show: 1900
  console.log('Is valid:', isValidDate(undefined)); // Should show: false
  
  // Test malformed dates
  console.log('Malformed date:', formatDate('not-a-date')); // Should show: N/A
  console.log('Malformed year:', getYear('not-a-date')); // Should show: 1900
  console.log('Is valid:', isValidDate('not-a-date')); // Should show: false
  
  console.log('Date utilities test completed.');
};

// Test cumulative best filtering
export const testCumulativeBestFiltering = () => {
  console.log('Testing cumulative best filtering...');
  
  const mockCumulativeBest = [
    { year: 2024, bestScore: 85.5, model: 'Model A', paper: 'Paper A', date: '2024-01-01', isNewRecord: true },
    { year: 1900, bestScore: 82.1, model: 'Model B', paper: 'Paper B', date: '2025-03-24', isNewRecord: true }, // Invalid year
    { year: 2023, bestScore: 80.2, model: 'Model C', paper: 'Paper C', date: '2023-12-20', isNewRecord: true },
    { year: 1900, bestScore: 78.9, model: 'Model D', paper: 'Paper D', date: 'invalid-date', isNewRecord: true }, // Invalid year
  ];
  
  const validRecords = mockCumulativeBest.filter(record => record.year > 1900);
  console.log('Original records:', mockCumulativeBest.length);
  console.log('Valid records after filtering:', validRecords.length);
  console.log('Valid records:', validRecords);
  
  console.log('Cumulative best filtering test completed.');
};

// Test chart data validation
export const testChartDataValidation = () => {
  console.log('Testing chart data validation...');
  
  const mockEvaluations = [
    { id: '1', date: '2024-12-20', model_name: 'Model A', paper_title: 'Paper A', metrics: { 'Top 1 Accuracy': '85.5%' } },
    { id: '2', date: '2025-03-24', model_name: 'Model B', paper_title: 'Paper B', metrics: { 'Top 1 Accuracy': '82.1%' } }, // Invalid date
    { id: '3', date: '2023-12-20', model_name: 'Model C', paper_title: 'Paper C', metrics: { 'Top 1 Accuracy': '80.2%' } },
    { id: '4', date: 'invalid-date', model_name: 'Model D', paper_title: 'Paper D', metrics: { 'Top 1 Accuracy': '78.9%' } }, // Invalid date
    { id: '5', date: undefined, model_name: 'Model E', paper_title: 'Paper E', metrics: { 'Top 1 Accuracy': '77.5%' } }, // Missing date
  ];
  
  // Simulate the filtering logic used in LeaderboardChart
  const validEvaluations = mockEvaluations.filter(evaluation => isValidDate(evaluation.date));
  console.log('Original evaluations:', mockEvaluations.length);
  console.log('Valid evaluations after filtering:', validEvaluations.length);
  console.log('Valid evaluations:', validEvaluations.map(e => ({ 
    date: e.date, 
    model: e.model_name, 
    isValid: isValidDate(e.date) 
  })));
  
  // Test date parsing for chart labels
  const chartLabels = validEvaluations.map(evaluation => parseDate(evaluation.date));
  console.log('Chart labels:', chartLabels.map(date => date.toISOString()));
  
  // Test chart data structure
  const chartData = validEvaluations.map((evaluation, index) => ({
    x: parseDate(evaluation.date),
    y: 85.5 - index * 2
  }));
  console.log('Chart data structure:', chartData);
  
  console.log('Chart data validation test completed.');
};

// Run all tests
export const runAllDateTests = () => {
  console.log('=== Running All Date Validation Tests ===');
  testDateUtils();
  testCumulativeBestFiltering();
  testChartDataValidation();
  console.log('=== All Tests Completed ===');
}; 