import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

function Report() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [overallFeedback, setOverallFeedback] = useState('');

  useEffect(() => {
    const loadResults = () => {
      const storedResults = localStorage.getItem('interviewResults');
      if (storedResults) {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
        
        // Generate overall feedback based on all responses
        const summary = generateOverallFeedback(parsedResults);
        setOverallFeedback(summary);
      }
    };

    loadResults();
  }, []);

  const generateOverallFeedback = (results) => {
    const totalQuestions = results.length;
    const strengths = [];
    const improvements = [];

    results.forEach(result => {
      const feedback = result.feedback.toLowerCase();
      if (feedback.includes('good') || feedback.includes('excellent') || feedback.includes('great')) {
        strengths.push(result.question);
      }
      if (feedback.includes('improve') || feedback.includes('could') || feedback.includes('should')) {
        improvements.push(result.question);
      }
    });

    return `Overall Performance Summary:
    
Total Questions Answered: ${totalQuestions}

Key Strengths:
${strengths.length > 0 ? strengths.map(q => `- ${q}`).join('\n') : '- No specific strengths highlighted'}

Areas for Improvement:
${improvements.length > 0 ? improvements.map(q => `- ${q}`).join('\n') : '- No specific improvements highlighted'}`;
  };

  const downloadReport = () => {
    const report = `AI Mock Interview Report\n\n${results.map((result, index) => `
Question ${index + 1}: ${result.question}
Your Answer: ${result.answer}
Feedback: ${result.feedback}
-------------------`).join('\n')}

Overall Feedback:
${overallFeedback}`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interview-report.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const startNewInterview = () => {
    localStorage.removeItem('interviewResults');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center mb-8">
            <img src="/Twemoji_1f351.svg.png" alt="MockDiddy Logo" className="h-12 w-12 mr-3" />
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Interview Report
            </h1>
          </div>

          <div className="space-y-8">
            {results.map((result, index) => (
              <div key={index} className="border-b pb-6">
                <h3 className="text-xl font-semibold mb-4">
                  Question {index + 1}
                </h3>
                <div className="mb-4">
                  <p className="font-medium">Question:</p>
                  <p className="ml-4 text-gray-700">{result.question}</p>
                </div>
                <div className="mb-4">
                  <p className="font-medium">Your Answer:</p>
                  <p className="ml-4 text-gray-700">{result.answer}</p>
                </div>
                <div>
                  <p className="font-medium">Feedback:</p>
                  <p className="ml-4 text-gray-700">{result.feedback}</p>
                </div>
              </div>
            ))}
          </div>

          {overallFeedback && (
            <div className="mt-8 bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Overall Performance</h2>
              <pre className="whitespace-pre-wrap text-gray-700">{overallFeedback}</pre>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <button
              onClick={downloadReport}
              className="w-full btn btn-primary flex items-center justify-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>Download Report</span>
            </button>
            <button
              onClick={startNewInterview}
              className="w-full btn btn-secondary flex items-center justify-center space-x-2"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report; 