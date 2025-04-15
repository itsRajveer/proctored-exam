import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Application starting...');

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('Application rendered successfully');
} catch (error) {
  console.error('Failed to render application:', error);
  const errorElement = document.createElement('div');
  errorElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    color: red;
    font-family: sans-serif;
    padding: 20px;
    text-align: center;
  `;
  errorElement.innerHTML = `
    <div>
      <h1>Application Error</h1>
      <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px;">
        Reload Page
      </button>
    </div>
  `;
  document.body.appendChild(errorElement);
}
