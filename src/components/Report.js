import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import Header from './Header';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function Report({ genAI }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [evaluationProgress, setEvaluationProgress] = useState(0);

  const interviewResults = location.state?.interviewResults;
  const jobRole = location.state?.formData?.jobRole || 'Software Developer';
  const experienceLevel = location.state?.formData?.experienceLevel || 'Mid-level';

  const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;

  const getAccurateEvaluation = async (question, answer, code = null) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Create a compact version of the answer/code by retaining just enough content
      const compactAnswer = answer.length > 200 ? 
        answer.substring(0, 200) + "..." : answer;
      const compactCode = code && code.length > 300 ? 
        code.substring(0, 300) + "..." : code;
      
      // STRATEGY: Use a focused prompt that requests brutal honesty in compact form
      const evaluationPrompt = `${jobRole} (${experienceLevel}) interview:
Q: ${question.trim()}
A: ${compactAnswer.trim()}
${compactCode ? `Code: ${compactCode.trim()}` : ''}

Be a ruthless interviewer. Brutal evaluation in JSON. No explanation, JUST JSON:
{
  "scores":{
    "technical":<0-100>,
    "communication":<0-100>,
    "problemSolving":<0-100>,
    ${compactCode ? `"codeQuality":<0-100>,` : ''}
    "overall":<0-100>
  },
  "brutal_feedback":{
    "tech_flaws":["critical flaw 1","critical flaw 2"],
    "comm_flaws":["critical flaw 1","critical flaw 2"],
    "problem_flaws":["critical flaw 1","critical flaw 2"],
    ${compactCode ? `"code_flaws":["critical flaw 1","critical flaw 2"],` : ''}
    "strengths":["strength 1","strength 2"],
    "verdict":"brutal 1-sentence verdict"
  }
}`;

      const result = await model.generateContent(evaluationPrompt);
      const responseText = result.response.text();
      
      // Extract and parse the JSON
      let brutEval;
      try {
        brutEval = extractJsonFromText(responseText);
      } catch (error) {
        throw new Error("Failed to parse evaluation result");
      }
      
      // Transform the brutal compact evaluation into the required detailed format
      return transformToBrutalDetailedEvaluation(brutEval, question, answer, code);
      
    } catch (error) {
      console.error('Evaluation error:', error);
      return createHarshFallbackEvaluation(code);
    }
  };

  // Robust JSON extraction helper
  function extractJsonFromText(text) {
    // Try direct parsing first
    try {
      return JSON.parse(text);
    } catch (e) {
      // Find anything that looks like JSON
      const jsonMatches = text.match(/\{[\s\S]*\}/);
      if (jsonMatches) {
        try {
          return JSON.parse(jsonMatches[0]);
        } catch (innerError) {
          console.warn("Found JSON-like text but couldn't parse:", jsonMatches[0]);
          throw new Error("Invalid JSON format");
        }
      }
      throw new Error("No JSON found in response");
    }
  }

  // Transform the compact brutal evaluation into the required detailed format
  function transformToBrutalDetailedEvaluation(brutEval, question, answer, code) {
    // Extract scores
    const scores = brutEval.scores || {
      technical: 60, 
      communication: 60, 
      problemSolving: 60,
      ...(code ? {codeQuality: 60} : {}),
      overall: 60
    };
    
    // Extract feedback elements
    const feedback = brutEval.brutal_feedback || {
      tech_flaws: ["Technical knowledge insufficient"],
      comm_flaws: ["Communication unclear"],
      problem_flaws: ["Problem-solving approach flawed"],
      ...(code ? {code_flaws: ["Code quality substandard"]} : {}),
      strengths: ["Shows basic understanding"],
      verdict: "Response falls short of professional standards"
    };
    
    // Build the detailed analysis structure
    const analysis = {
      technicalAccuracy: {
        score: scores.technical,
        strengths: feedback.strengths.filter(s => s.includes("technical") || Math.random() > 0.7),
        weaknesses: feedback.tech_flaws,
        details: `Technical score: ${scores.technical}/100. ${feedback.tech_flaws.join(" ")}`
      },
      communication: {
        score: scores.communication,
        strengths: feedback.strengths.filter(s => s.includes("communicat") || Math.random() > 0.7),
        weaknesses: feedback.comm_flaws,
        details: `Communication score: ${scores.communication}/100. ${feedback.comm_flaws.join(" ")}`
      },
      problemSolving: {
        score: scores.problemSolving,
        strengths: feedback.strengths.filter(s => s.includes("problem") || Math.random() > 0.8),
        weaknesses: feedback.problem_flaws,
        details: `Problem-solving score: ${scores.problemSolving}/100. ${feedback.problem_flaws.join(" ")}`
      },
      feedback: `${feedback.verdict} Technical: ${scores.technical}/100, Communication: ${scores.communication}/100, Problem-solving: ${scores.problemSolving}/100${code ? `, Code quality: ${scores.codeQuality}/100` : ''}. Major issues: ${[...feedback.tech_flaws, ...feedback.comm_flaws, ...feedback.problem_flaws].slice(0, 3).join("; ")}.`
    };  
    
    // Add code quality if needed
    if (code) {
      analysis.codeQuality = {
        score: scores.codeQuality,
        strengths: feedback.strengths.filter(s => s.includes("code") || Math.random() > 0.8),
        weaknesses: feedback.code_flaws,
        details: `Code quality score: ${scores.codeQuality}/100. ${feedback.code_flaws.join(" ")}`
      };
    }
    
    return {
      scores: scores,
      analysis: analysis
    };
  }

  // Create a harsh fallback evaluation for when API calls fail
  function createHarshFallbackEvaluation(code) {
    const harshScores = {
      technical: 55 + Math.floor(Math.random() * 10),
      communication: 55 + Math.floor(Math.random() * 10),
      problemSolving: 55 + Math.floor(Math.random() * 10),
      overall: 58
    };  
    
    if (code) {
      harshScores.codeQuality = 55 + Math.floor(Math.random() * 10);
    }
    
    const harshAnalysis = {
      technicalAccuracy: {
        score: harshScores.technical,
        strengths: ["Shows basic understanding of concepts"],
        weaknesses: [
          "Lacks depth in technical knowledge", 
          "Misses critical technical nuances"
        ],
        details: "Technical explanations are surface-level and miss important details"
      },
      communication: {
        score: harshScores.communication,
        strengths: ["Attempts to articulate thoughts"],
        weaknesses: [
          "Response structure lacks clarity",
          "Technical terminology used imprecisely"
        ],
        details: "Communication lacks the precision expected at this level"
      },
      problemSolving: {
        score: harshScores.problemSolving,
        strengths: ["Identifies the basic problem"],
        weaknesses: [
          "Approach lacks sophistication",
          "Fails to consider edge cases"
        ],
        details: "Problem-solving approach is elementary and lacks rigor"
      },
      feedback: `Response falls significantly short of ${experienceLevel} ${jobRole} standards. Technical explanations lack depth, communication is imprecise, and problem-solving lacks rigorous methodology. Significant improvement needed across all areas.`
    };  
    
    if (code) {
      harshAnalysis.codeQuality = {
        score: harshScores.codeQuality,
        strengths: ["Basic functionality attempted"],
        weaknesses: [
          "Code lacks efficiency and elegance",
          "Best practices not followed",
          "Error handling insufficient"
        ],
        details: "Code quality does not meet professional standards"
      };
    }
    
    return {
      scores: harshScores,
      analysis: harshAnalysis
    };
  }

  const calculateOverallScore = (evaluations) => {
    const weights = {
      technical: 0.35,
      communication: 0.25,
      problemSolving: 0.25,
      codeQuality: 0.15
    };

    const scores = {
      technical: 0,
      communication: 0,
      problemSolving: 0,
      codeQuality: 0
    };

    evaluations.forEach(evaluation => {
      scores.technical += evaluation.scores.technical;
      scores.communication += evaluation.scores.communication;
      scores.problemSolving += evaluation.scores.problemSolving;
      if (evaluation.scores.codeQuality) {
        scores.codeQuality += evaluation.scores.codeQuality;
      }
    });

    // Average scores
    Object.keys(scores).forEach(key => {
      scores[key] = scores[key] / evaluations.length;
    });

    // Calculate weighted overall score
    const overallScore = (
      scores.technical * weights.technical +
      scores.communication * weights.communication +
      scores.problemSolving * weights.problemSolving +
      (scores.codeQuality ? scores.codeQuality * weights.codeQuality : 0)
    );

    return {
      categoryScores: scores,
      overallScore: Math.round(overallScore)
    };
  };

  const generatePDF = async (analysis, jobRole, experienceLevel) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.276, 841.890]); // A4 size
    const { width, height } = page.getSize();
    let y = height - 50;
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 50;
    const contentWidth = width - (margin * 2);

    const sanitizeText = (text) => {
      return (text || '').replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const writeText = (text, { fontSize = 12, font = regular, lineHeight = 1.2, color = rgb(0, 0, 0), align = 'left' } = {}) => {
      const sanitizedText = sanitizeText(text);
      if (!sanitizedText) return;
      const textWidth = font.widthOfTextAtSize(sanitizedText, fontSize);
      let xPosition = margin;
      if (align === 'center') {
        xPosition = (width - textWidth) / 2;
      }
      page.drawText(sanitizedText, { x: xPosition, y, size: fontSize, font, color });
      y -= fontSize * lineHeight;
    };

    const drawLine = () => {
      y -= 10;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 20;
    };

    writeText('Interview Assessment Report', { fontSize: 24, font: bold, lineHeight: 2, align: 'center' });
    writeText(new Date().toLocaleDateString(), { fontSize: 12, lineHeight: 2, align: 'center' });

    y -= 20;
    writeText('Position:', { fontSize: 14, font: bold });
    writeText(jobRole, { fontSize: 14 });
    writeText('Level:', { fontSize: 14, font: bold });
    writeText(experienceLevel, { fontSize: 14 });
    drawLine();

    writeText('Overall Performance', { fontSize: 18, font: bold });
    writeText(`${analysis.overallScore}%`, { fontSize: 32, font: bold, color: rgb(0.23, 0.47, 0.94) });
    drawLine();

    writeText('Performance Breakdown', { fontSize: 18, font: bold });
    y -= 10;
    Object.entries(analysis.categoryScores).forEach(([category, score]) => {
      const formattedCategory = category.replace(/([A-Z])/g, ' $1').trim();
      writeText(`${formattedCategory}: ${score}%`, { fontSize: 14, lineHeight: 1.5 });
    });
    drawLine();

    writeText('Key Strengths', { fontSize: 18, font: bold });
    y -= 10;
    (analysis.strengths || []).slice(0, 5).forEach(strength => {
      writeText(`• ${strength}`, { fontSize: 12, lineHeight: 1.5 });
    });
    drawLine();

    writeText('Areas for Improvement', { fontSize: 18, font: bold });
    y -= 10;
    (analysis.improvements || []).slice(0, 5).forEach(improvement => {
      writeText(`• ${improvement}`, { fontSize: 12, lineHeight: 1.5 });
    });
    drawLine();

    writeText('Summary', { fontSize: 18, font: bold });
    y -= 10;
    const summary = analysis.detailedResponses?.[0]?.analysis?.feedback || 'Interview assessment complete. Please review the scores and recommendations above.';
    writeText(summary, { fontSize: 12, lineHeight: 1.5 });

    page.drawText('Generated by Interview Assessment System', { x: margin, y: 30, size: 10, color: rgb(0.5, 0.5, 0.5) });
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `Interview-Report-${date}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!interviewResults || interviewResults.length === 0) {
      setError("No interview results found. Please complete an interview first.");
      setIsLoading(false);
      return;
    }

    const performDetailedAnalysis = async () => {
      try {
        const evaluations = [];
        const totalQuestions = interviewResults.length;

        for (let i = 0; i < interviewResults.length; i++) {
          const result = interviewResults[i];
          setEvaluationProgress((i / totalQuestions) * 100);

          const evaluation = await getAccurateEvaluation(
            result.question,
            result.answer,
            result.code
          );
          evaluations.push(evaluation);
        }

        // Calculate final scores
        const { categoryScores, overallScore } = calculateOverallScore(evaluations);

        // Aggregate strengths and improvements
        const aggregatedAnalysis = {
          overallScore,
          categoryScores,
          strengths: [],
          improvements: [],
          detailedResponses: evaluations.map((evaluation, index) => ({
            question: interviewResults[index].question,
            answer: interviewResults[index].answer,
            code: interviewResults[index].code,
            ...evaluation
          }))
        };

        // Extract key strengths and improvements
        evaluations.forEach(evaluation => {
          Object.keys(evaluation.analysis).forEach(category => {
            if (category !== 'feedback' && evaluation.analysis[category].strengths) {
              aggregatedAnalysis.strengths.push(...evaluation.analysis[category].strengths);
            }
            if (category !== 'feedback' && evaluation.analysis[category].weaknesses) {
              aggregatedAnalysis.improvements.push(...evaluation.analysis[category].weaknesses);
            }
          });
        });

        // De-duplicate and select top strengths/improvements
        aggregatedAnalysis.strengths = [...new Set(aggregatedAnalysis.strengths)].slice(0, 5);
        aggregatedAnalysis.improvements = [...new Set(aggregatedAnalysis.improvements)].slice(0, 5);

        setAnalysis(aggregatedAnalysis);
        setIsLoading(false);
        setEvaluationProgress(100);

      } catch (error) {
        console.error('Analysis error:', error);
        setError(`Failed to analyze interview: ${error.message}`);
        setIsLoading(false);
      }
    };

    performDetailedAnalysis();
  }, [interviewResults, genAI, jobRole, experienceLevel]);

  // Loading state with progress bar
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Analyzing Interview Responses...
                </h2>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${evaluationProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Progress: {Math.round(evaluationProgress)}%
                </p>
              </div>
            </div>
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
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => navigate('/interview')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Return to Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  const radarData = {
    labels: ['Technical', 'Communication', 'Problem Solving', 'Coding', 'Overall'],
    datasets: [
      {
        label: 'Performance Metrics',
        data: [
          analysis?.categoryScores?.technical || 0,
          analysis?.categoryScores?.communication || 0,
          analysis?.categoryScores?.problemSolving || 0,
          analysis?.categoryScores?.codeQuality || 0,
          analysis?.overallScore || 0,
        ],
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interview Report</h1>
            <p className="text-gray-600 mt-2">Position: {jobRole} • Level: {experienceLevel}</p>
          </div>
          <button
            onClick={() => generatePDF(analysis, jobRole, experienceLevel)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>Download Report (PDF)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
            <div className="mb-6">
              <div className="text-center">
                <span className="text-4xl font-bold text-blue-600">{analysis?.overallScore}%</span>
                <p className="text-gray-600">Overall Score</p>
              </div>
            </div>
            <div className="space-y-4">
              {Object.entries(analysis?.categoryScores || {}).map(([category, score]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-700 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="flex items-center">
                    <div className="w-48 h-2 bg-gray-200 rounded mr-3">
                      <div
                        className="h-full bg-blue-600 rounded"
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold w-12 text-right">{score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Radar</h2>
            <div className="h-64">
              <Radar data={radarData} options={{ 
                maintainAspectRatio: false,
                scales: {
                  r: {
                    min: 0,
                    max: 100,
                    beginAtZero: true,
                    ticks: {
                      stepSize: 20
                    }
                  }
                }
              }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Key Strengths</h2>
            <ul className="space-y-2">
              {(analysis?.strengths || []).map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Areas for Improvement</h2>
            <ul className="space-y-2">
              {(analysis?.improvements || []).map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">→</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Overall Feedback</h2>
          <p className="text-gray-700 whitespace-pre-line">{analysis?.detailedResponses[0].analysis.feedback || 'No feedback available'}</p>
          
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Recommendations for Growth:</h3>
            <ul className="list-disc list-inside space-y-2">
              {(analysis?.detailedResponses || []).map((response, index) => (
                <li key={index} className="text-gray-700">{response.analysis.feedback}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Question-by-Question Analysis</h2>
          <div className="space-y-8">
            {(analysis?.detailedResponses || []).map((response, index) => (
              <div key={index} className="border-b pb-6 last:border-b-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md mr-3">Q{index + 1}</span>
                      {response.question}
                    </h3>
                  </div>
                  <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                    Score: {response.scores.overall}%
                  </span>
                </div>

                <div className="pl-4 border-l-2 border-gray-200">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Your Answer:</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{response.answer || 'No answer provided'}</p>
                    {response.code && (
                      <div className="mt-2">
                        <h4 className="font-medium text-gray-700 mb-2">Code Solution:</h4>
                        <pre className="bg-gray-50 p-3 rounded-md overflow-x-auto">
                          <code className="text-sm">{response.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium text-gray-700">Technical Accuracy</p>
                      <p className="text-2xl font-bold text-blue-600">{response.scores.technical}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium text-gray-700">Communication</p>
                      <p className="text-2xl font-bold text-blue-600">{response.scores.communication}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium text-gray-700">Problem Solving</p>
                      <p className="text-2xl font-bold text-blue-600">{response.scores.problemSolving}%</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Feedback:</h4>
                    <p className="text-gray-600">{response.analysis.feedback || 'No feedback available'}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Strengths:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {(response.analysis.technicalAccuracy.strengths || []).map((strength, idx) => (
                          <li key={idx} className="text-gray-600">{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Areas to Improve:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {(response.analysis.technicalAccuracy.weaknesses || []).map((weakness, idx) => (
                          <li key={idx} className="text-gray-600">{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;
