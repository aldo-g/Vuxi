"use client";

import { useState, useEffect } from 'react';

interface FormattedDateProps {
  dateString: string;
  format?: 'short' | 'long' | 'medium';
}

export function FormattedDate({ dateString, format = 'short' }: FormattedDateProps) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (!dateString) return;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return;
      
      let formatOptions: Intl.DateTimeFormatOptions;
      
      switch (format) {
        case 'long':
          formatOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          };
          break;
        case 'medium':
          formatOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          };
          break;
        default:
          formatOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          };
      }
      
      setFormattedDate(date.toLocaleDateString(undefined, formatOptions));
    } catch (error) {
      console.error('Error formatting date:', error);
      setFormattedDate('');
    }
  }, [dateString, format]);

  return <>{formattedDate || null}</>;
}