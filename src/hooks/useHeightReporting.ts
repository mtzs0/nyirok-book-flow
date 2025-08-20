
import { useEffect, useRef } from 'react';

export function useHeightReporting() {
  const hasReported = useRef(false);
  
  const reportHeight = () => {
    // Only report once per component to prevent loops
    if (hasReported.current || window.parent === window) return;
    
    hasReported.current = true;
    
    setTimeout(() => {
      const body = document.body;
      const html = document.documentElement;
      
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );
      
      // Cap height at reasonable maximum
      const cappedHeight = Math.min(height + 50, 2500);
      
      try {
        window.parent.postMessage({
          type: 'heightUpdate',
          height: cappedHeight
        }, '*');
        
        console.log('Component height reported:', cappedHeight);
      } catch (error) {
        console.error('Failed to report height:', error);
      }
    }, 200);
  };
  
  useEffect(() => {
    // Only report on mount, not on every render
    const timer = setTimeout(reportHeight, 300);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array - only run once
  
  return () => {}; // Return empty function to prevent external calls
}
