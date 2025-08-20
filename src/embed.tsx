
import { createRoot } from 'react-dom/client';
import EmbedReservationSystem from './components/EmbedReservationSystem';
import './index.css';

// Simple height reporting without infinite loops
let lastReportedHeight = 0;
let isReporting = false;

function getContentHeight(): number {
  const body = document.body;
  const html = document.documentElement;
  
  return Math.max(
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight
  );
}

function reportHeightOnce() {
  if (isReporting) return; // Prevent multiple simultaneous reports
  
  isReporting = true;
  
  setTimeout(() => {
    const currentHeight = getContentHeight();
    
    // Only report if height changed significantly and is reasonable
    if (Math.abs(currentHeight - lastReportedHeight) > 10 && currentHeight < 3000) {
      lastReportedHeight = currentHeight;
      
      if (window.parent !== window) {
        try {
          window.parent.postMessage({
            type: 'heightUpdate',
            height: currentHeight + 50 // Small buffer
          }, '*');
          
          console.log('Height reported:', currentHeight + 50);
        } catch (error) {
          console.error('Failed to send height:', error);
        }
      }
    }
    
    isReporting = false;
  }, 100);
}

// Setup the React app
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<EmbedReservationSystem />);
  
  // Report height only after initial render
  setTimeout(reportHeightOnce, 500);
}

// Report height only on specific events, not continuously
window.addEventListener('load', () => {
  setTimeout(reportHeightOnce, 300);
});

// Add iframe-specific styles
const style = document.createElement('style');
style.textContent = `
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    background: white !important;
    min-height: auto !important;
  }
  
  #root {
    width: 100% !important;
    overflow: visible !important;
    background: white !important;
    min-height: auto !important;
  }
  
  .reservation-embed {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 20px !important;
    box-sizing: border-box !important;
    overflow: visible !important;
    background: white !important;
    min-height: auto !important;
  }
`;
document.head.appendChild(style);
