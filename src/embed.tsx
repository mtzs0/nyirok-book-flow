
import React from 'react';
import { createRoot } from 'react-dom/client';
import ReservationSystem from './components/ReservationSystem';
import "./index.css";

function EmbedApp() {
  return (
    <div className="w-full bg-white">
      <ReservationSystem />
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<EmbedApp />);
}
