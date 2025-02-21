import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import Header from './Header';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function InterviewSummary({ genAI }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [showReportButton, setShowReportButton] = useState(false);
  const db = getFirestore();

  const { responses, interviewId, jobRole, experienceLevel, showReport } = location.state || {};

  useEffect(() => {
    if (!responses) {
      navigate('/dashboard');
      return;
    }

    const analyzeInterview = async () => {
      try {
        setIsLoading(true);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Generate quick summary analysis
        const summaryPrompt = `As an expert technical interviewer, provide a quick summary analysis of this interview for a ${jobRole} position (${experienceLevel} level).
        
        Interview Responses:
        ${JSON.stringify(responses.map(r => ({
          question: r.question,
          answer: r.answer,
          code: r.code
        })))}

        Provide a brief evaluation in JSON format:
        {
          "overallScore": (number 0-100),
          "quickSummary": (2-3 sentence summary),
          "keyStrengths": [(top 2-3 strengths)],
          "keyImprovements": [(top 2-3 improvements)]
        }`;

        const result = await model.generateContent(summaryPrompt);
        const summaryAnalysis = JSON.parse(result.response.text());
        setAnalysis(summaryAnalysis);
        setShowReportButton(true);
        setIsLoading(false);

        // If showReport is true, automatically navigate to the detailed report after a brief delay
        if (showReport) {
          setTimeout(() => {
            navigate('/report', {
              state: {
                responses,
                interviewId,
                jobRole,
                experienceLevel
              }
            });
          }, 5000); // Show summary for 5 seconds before transitioning to report
        }
      } catch (error) {
        console.error('Error analyzing interview:', error);
        setError('Failed to analyze interview. Please try again.');
        setIsLoading(false);
      }
    };

    analyzeInterview();
  }, [responses, navigate, genAI, interviewId, jobRole, experienceLevel, showReport]);

  const handleViewDetailedReport = () => {
    navigate('/report', {
      state: {
        responses,
        interviewId,
        jobRole,
        experienceLevel
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-lg font-medium text-gray-700">Generating interview summary...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Interview Summary</h1>
          
          {analysis && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Overall Score: {analysis.overallScore}/100</h2>
                {showReportButton && (
                  <button
                    onClick={handleViewDetailedReport}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    View Detailed Report
                  </button>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-700">{analysis.quickSummary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 text-green-600">Key Strengths</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.keyStrengths.map((strength, index) => (
                      <li key={index} className="text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-orange-600">Areas for Improvement</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.keyImprovements.map((improvement, index) => (
                      <li key={index} className="text-gray-700">{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {showReport && (
                <div className="mt-4 text-center text-gray-600">
                  <p>Redirecting to detailed report in a few seconds...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewSummary;
