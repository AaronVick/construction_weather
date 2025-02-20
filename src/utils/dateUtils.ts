// src/utils/dateUtils.ts

/**
 * Formats a date string to locale date format
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
  
  /**
   * Formats a date string to locale date and time format
   */
  export function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  /**
   * Returns a relative time string (e.g., "2 hours ago", "yesterday")
   */
  export function getRelativeTimeString(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSecs < 60) {
      return 'just now';
    } else if (diffInMins < 60) {
      return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  }
  
  /**
   * Formats a time string (e.g., "14:30:00" to "2:30 PM")
   */
  export function formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hoursNum = parseInt(hours, 10);
    const ampm = hoursNum >= 12 ? 'PM' : 'AM';
    const formattedHours = hoursNum % 12 || 12;
    
    return `${formattedHours}:${minutes} ${ampm}`;
  }
  
  /**
   * Returns a formatted date range string (e.g., "Jan 1 - Jan 15, 2023")
   */
  export function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startMonth = start.toLocaleString('default', { month: 'short' });
    const endMonth = end.toLocaleString('default', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    
    if (startYear !== endYear) {
      return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
    } else if (startMonth !== endMonth) {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
    } else {
      return `${startMonth} ${startDay} - ${endDay}, ${endYear}`;
    }
  }
  
  /**
   * Returns true if the date is today
   */
  export function isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }
  
  /**
   * Adds days to a date and returns the new date
   */
  export function addDays(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }
  
  /**
   * Returns a formatted date string for weather forecasts
   */
  export function formatWeatherDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    ) {
      return 'Tomorrow';
    }
    
    // Return day of week for dates within the next week
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const diffInDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 7) {
      return dayOfWeek;
    }
    
    // Return formatted date for dates more than a week away
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }