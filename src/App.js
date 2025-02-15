import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import InputForm from './components/InputForm';
import Interview from './components/Interview';
import Report from './components/Report';
import Dashboard from './components/Dashboard';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/input" element={<InputForm />} />
        <Route path="/interview" element={<Interview genAI={genAI} />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </div>
  );
}

export default App;
