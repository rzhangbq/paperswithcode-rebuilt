/**
 * Safely parse a date string, handling invalid dates and future dates
 */
export const parseDate = (dateString: string | undefined): Date => {
  if (!dateString) return new Date('1900-01-01');
  
  try {
    const date = new Date(dateString);
    const currentYear = new Date().getFullYear();
    const dateYear = date.getTime();
    
    // Check if the date is valid and not too far in the future
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

/**
 * Format a date for display
 */
export const formatDate = (dateString: string | undefined): string => {
  const date = parseDate(dateString);
  if (date.getTime() === new Date('1900-01-01').getTime()) {
    return 'N/A';
  }
  return date.toLocaleDateString();
};

/**
 * Get the year from a date string
 */
export const getYear = (dateString: string | undefined): number => {
  const date = parseDate(dateString);
  return date.getFullYear();
};

/**
 * Check if a date is valid (not the fallback date)
 */
export const isValidDate = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const currentYear = new Date().getFullYear();
    
    // Check if the date is valid and not too far in the future
    if (isNaN(date.getTime()) || date.getFullYear() > currentYear + 1) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}; 