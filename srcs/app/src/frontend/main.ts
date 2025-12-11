import { initApp } from './app.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initApp().catch((error) => {
    console.error('Failed to initialize app:', error);
  });
});
