import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Manager from './Manager';

// Create a function to initialize the editor
window.initLayoutEditor = function(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found`);
    return;
  }

  createRoot(container).render(
    <StrictMode>
      <Manager />
    </StrictMode>
  );
};