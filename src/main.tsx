import './index.css'; 
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <BrowserRouter> {/* ⬅️ 반드시 Router로 감싸야 useRoutes 사용 가능 */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
