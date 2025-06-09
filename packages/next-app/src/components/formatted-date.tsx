"use client";

import { useState, useEffect } from 'react';

export function FormattedDate({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // This code runs only in the browser, after the component has mounted
    setFormattedDate(new Date(dateString).toLocaleDateString());
  }, [dateString]);

  // Render the formatted date, or null if it hasn't been set yet
  return <>{formattedDate || null}</>;
}