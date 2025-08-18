
import { createRoot } from 'react-dom/client';
import EmbedReservationSystem from './components/EmbedReservationSystem';
import './index.css';

// Ensure the app works in iframe context
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<EmbedReservationSystem />);
}

// Add iframe-specific styles
const style = document.createElement('style');
style.textContent = `
  .reservation-embed {
    width: 100%;
    max-width: none !important;
    margin: 0 !important;
    padding: 20px;
    box-sizing: border-box;
  }
  
  .reservation-embed .medical-container {
    max-width: none !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 2rem !important;
  }
  
  /* Ensure consistent text sizes */
  .reservation-embed h2 {
    font-size: 1.5rem !important;
    line-height: 2rem !important;
  }
  
  .reservation-embed h3 {
    font-size: 1.125rem !important;
    line-height: 1.75rem !important;
  }
  
  .reservation-embed p {
    font-size: 0.875rem !important;
    line-height: 1.25rem !important;
  }
  
  /* Fix calendar styling */
  .reservation-embed button {
    border: 1px solid #e2e8f0 !important;
    transition: all 0.2s ease !important;
  }
  
  .reservation-embed button:hover {
    background-color: #f1f5f9 !important;
    border-color: #cbd5e1 !important;
  }
  
  .reservation-embed button:focus {
    outline: 2px solid #3b82f6 !important;
    outline-offset: 2px !important;
  }
  
  /* Selected state */
  .reservation-embed .bg-blue-600 {
    background-color: #2563eb !important;
    color: white !important;
  }
  
  /* Remove any WordPress theme interference */
  .reservation-embed * {
    box-sizing: border-box !important;
  }
`;
document.head.appendChild(style);
