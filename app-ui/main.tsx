/**
 * AI RPA智能体 — 应用入口
 *
 * ReactDOM 挂载点，包裹 BrowserRouter 实现客户端路由。
 * 导入全局样式和主题变量。
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
