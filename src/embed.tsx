
import { createRoot } from 'react-dom/client';
import EmbedReservationSystem from './components/EmbedReservationSystem';
import './index.css';

// Height tracking and communication with parent window
let lastReportedHeight = 0;
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;

function getContentHeight(): number {
  const body = document.body;
  const html = document.documentElement;
  
  const height = Math.max(
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight
  );
  
  return height;
}

function reportHeight() {
  const currentHeight = getContentHeight();
  
  // Only report if height changed significantly (more than 5px difference)
  if (Math.abs(currentHeight - lastReportedHeight) > 5) {
    lastReportedHeight = currentHeight;
    
    // Send height to parent window with better error handling
    if (window.parent !== window) {
      try {
        window.parent.postMessage({
          type: 'heightUpdate',
          height: currentHeight + 20 // Add small buffer
        }, '*');
        
        console.log('Height reported to parent:', currentHeight + 20);
      } catch (error) {
        console.error('Failed to send height to parent:', error);
      }
    }
  }
}

function setupHeightObservers() {
  // ResizeObserver to watch for element size changes
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      setTimeout(reportHeight, 50); // Faster response
    });
    
    // Observe the root element
    const root = document.getElementById('root');
    if (root) {
      resizeObserver.observe(root);
    }
    
    // Also observe the body
    resizeObserver.observe(document.body);
  }
  
  // MutationObserver to watch for DOM changes
  mutationObserver = new MutationObserver(() => {
    setTimeout(reportHeight, 100);
  });
  
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
}

function handleParentMessages(event: MessageEvent) {
  if (event.data && event.data.type === 'requestHeight') {
    reportHeight();
  }
}

// Listen for height requests from parent
window.addEventListener('message', handleParentMessages);

// Setup the React app
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<EmbedReservationSystem />);
  
  // Setup height tracking after React renders
  setTimeout(() => {
    setupHeightObservers();
    reportHeight(); // Initial height report
  }, 100);
}

// Report height on window load and resize
window.addEventListener('load', () => {
  setTimeout(reportHeight, 200);
});

window.addEventListener('resize', () => {
  setTimeout(reportHeight, 100);
});

// Clean up observers on unload
window.addEventListener('beforeunload', () => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (mutationObserver) {
    mutationObserver.disconnect();
  }
});

// Add iframe-specific styles for better embedding
const style = document.createElement('style');
style.textContent = `
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
    overflow-y: hidden !important;
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
  
  .reservation-embed .medical-container {
    max-width: none !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 2rem !important;
    background: white !important;
    overflow: visible !important;
    min-height: auto !important;
  }
  
  /* Ensure all containers have white background and proper overflow */
  .reservation-embed * {
    box-sizing: border-box !important;
  }
  
  /* Remove any blue/slate backgrounds */
  .reservation-embed .bg-slate-50,
  .reservation-embed .bg-gray-50,
  .reservation-embed .bg-slate-100,
  .reservation-embed .bg-blue-50,
  .reservation-embed .bg-blue-100 {
    background-color: white !important;
  }
  
  /* Fix any potential scrolling containers */
  .reservation-embed .overflow-auto,
  .reservation-embed .overflow-y-auto {
    overflow: visible !important;
  }
  
  /* Ensure consistent styling */
  .reservation-embed h2 {
    font-size: 1.5rem !important;
    line-height: 2rem !important;
    color: #1f2937 !important;
  }
  
  .reservation-embed h3 {
    font-size: 1.125rem !important;
    line-height: 1.75rem !important;
    color: #1f2937 !important;
  }
  
  .reservation-embed p {
    font-size: 0.875rem !important;
    line-height: 1.25rem !important;
    color: #4b5563 !important;
  }
  
  /* Button styling */
  .reservation-embed button {
    border: 1px solid #d1d5db !important;
    transition: all 0.2s ease !important;
  }
  
  .reservation-embed button:hover:not(:disabled) {
    background-color: #f9fafb !important;
    border-color: #9ca3af !important;
  }
  
  .reservation-embed button:focus {
    outline: 2px solid #10b981 !important;
    outline-offset: 2px !important;
  }
  
  .reservation-embed .bg-green-600 {
    background-color: #059669 !important;
    color: white !important;
  }
  
  .reservation-embed .bg-green-600:hover {
    background-color: #047857 !important;
  }
`;
document.head.appendChild(style);
