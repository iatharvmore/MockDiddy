import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import InputForm from './components/InputForm';
import Interview from './components/Interview';
import Report from './components/Report';
import Dashboard from './components/Dashboard';
import InterviewSummary from './components/InterviewSummary';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Download from './components/Download';

// Initialize Gemini API with proper error handling
const initializeGeminiAI = () => {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  console.log('Initializing Gemini AI with API key:', apiKey ? 'Present' : 'Missing');
  
  if (!apiKey) {
    console.error('Gemini API key is missing in .env file');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini AI initialized successfully');
    return genAI;
  } catch (error) {
    console.error('Error initializing Gemini AI:', error);
    return null;
  }
};

const genAI = initializeGeminiAI();

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard genAI={genAI} />} />
        <Route path="/input" element={<InputForm />} />
        <Route path="/interview" element={<Interview genAI={genAI} />} />
        <Route path="/interview-summary" element={<InterviewSummary genAI={genAI} />} />
        <Route path="/report" element={<Report genAI={genAI} />} />
        <Route path="/download" element={<Download genAI={genAI} />} />
      </Routes>
    </div>
  );
}

export default App;
