// Test date handling in browser console
// Run this in browser console to test date utilities

// Mock the date utilities
const parseDate = (dateString) => {
  if (!dateString) return new Date('1900-01-01');
  
  try {
    const date = new Date(dateString);
    const currentYear = new Date().getFullYear();
    const dateYear = date.getTime();
    
    if (isNaN(dateYear) || date.getFullYear() > currentYear + 1) {
      console.warn(`Invalid or future date detected: ${dateString}, using fallback date`);
      return new Date('1900-01-01');
    }
    
    return date;
  } catch (error) {
    console.warn(`Error parsing date: ${dateString}`, error);
    return new Date('1900-01-01');
  }
};

const isValidDate = (dateString) => {
  const date = parseDate(dateString);
  return date.getTime() > new Date('1900-01-01').getTime();
};

// Test cases
const testCases = [
  '2024-12-20',
  '2025-03-24', // Future date
  '2023-12-20',
  'invalid-date',
  undefined,
  '2024-01-01',
  '2024-06-15'
];

console.log('Testing date utilities...');
testCases.forEach(dateStr => {
  const parsed = parseDate(dateStr);
  const valid = isValidDate(dateStr);
  console.log(`Date: "${dateStr}" -> Parsed: ${parsed.toISOString()}, Valid: ${valid}`);
});

// Test chart data structure
const mockEvaluations = [
  { date: '2024-12-20', model_name: 'Model A', metrics: { 'Top 1 Accuracy': '85.5%' } },
  { date: '2025-03-24', model_name: 'Model B', metrics: { 'Top 1 Accuracy': '82.1%' } },
  { date: '2023-12-20', model_name: 'Model C', metrics: { 'Top 1 Accuracy': '80.2%' } },
];

const validEvaluations = mockEvaluations.filter(evaluation => isValidDate(evaluation.date));
console.log('Valid evaluations:', validEvaluations.length);

const chartData = validEvaluations.map((evaluation, index) => ({
  x: parseDate(evaluation.date),
  y: 85.5 - index * 2
}));

console.log('Chart data structure:', chartData);
console.log('Date utilities test completed.'); 