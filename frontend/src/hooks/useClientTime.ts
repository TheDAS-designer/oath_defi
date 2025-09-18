import { useState, useEffect } from 'react';

export const useClientTime = () => {
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    // Only set the time on the client side
    setCurrentTime(Date.now());
    
    // Update every minute
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return currentTime;
}; 