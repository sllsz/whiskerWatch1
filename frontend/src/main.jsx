import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CatProvider } from './context/CatContext';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CatProvider>
        <App />
      </CatProvider>
    </BrowserRouter>
  </React.StrictMode>
);
