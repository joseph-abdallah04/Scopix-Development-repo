export const checkBackendHealth = async (): Promise<boolean> => {
  const maxRetries = 2;
  const baseTimeout = 5000; // 5 second base timeout
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = baseTimeout * Math.pow(2, attempt); // Exponential backoff
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch('http://localhost:8000/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error(`Backend health check attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries) {
        return false;
      }
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return false;
};

export const getBackendErrorMessage = (): string => {
  return 'Backend service is not running. Please start the application and try again.';
}; 