
import { useEffect, useRef } from 'react';

export function useHeightReporting() {
  const reportedHeightRef = useRef(0);
  
  const reportHeight = () => {
    // Only run in iframe context
    if (window.parent === window) return;
    
    const body = document.body;
    const html = document.documentElement;
    
    const height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );
    
    // Only report if height changed significantly
    if (Math.abs(height - reportedHeightRef.current) > 5) {
      reportedHeightRef.current = height;
      
      window.parent.postMessage({
        type: 'heightUpdate',
        height: height
      }, '*');
    }
  };
  
  useEffect(() => {
    // Report height on mount and after each render
    const timer = setTimeout(reportHeight, 100);
    return () => clearTimeout(timer);
  });
  
  return reportHeight;
}
