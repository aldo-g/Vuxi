// URL validation and normalization
export const validateAndNormalizeUrl = (url: string): { 
  isValid: boolean; 
  normalizedUrl: string; 
  error?: string 
} => {
  if (!url || !url.trim()) {
    return { isValid: false, normalizedUrl: url, error: 'Please enter a website URL' };
  }

  const trimmedUrl = url.trim();
  
  // Try the URL as-is first
  try {
    const testUrl = new URL(trimmedUrl);
    return { isValid: true, normalizedUrl: trimmedUrl };
  } catch {
    // Failed, try adding https://
  }
  
  // Try adding https:// prefix
  try {
    const withHttps = `https://${trimmedUrl}`;
    const testUrl = new URL(withHttps);
    
    const hostname = testUrl.hostname;
    
    if (hostname.includes('.') && /^[a-zA-Z0-9.-]+$/.test(hostname)) {
      return { isValid: true, normalizedUrl: withHttps };
    } else {
      return { 
        isValid: false, 
        normalizedUrl: trimmedUrl, 
        error: 'Please enter a valid website URL (e.g., example.com or https://example.com)' 
      };
    }
  } catch {
    return { 
      isValid: false, 
      normalizedUrl: trimmedUrl, 
      error: 'Please enter a valid website URL (e.g., example.com or https://example.com)' 
    };
  }
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};