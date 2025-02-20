import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import Editor from '@monaco-editor/react';
import OpenAI from 'openai';
import { MicrophoneIcon, StopIcon, ClockIcon, SpeakerWaveIcon, XCircleIcon } from '@heroicons/react/24/solid';
import Header from './Header';
import { getFirestore, doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function Interview({ genAI }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [allResponses, setAllResponses] = useState([]);
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes per question
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isInterviewActive, setIsInterviewActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [interviewResults, setInterviewResults] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const webcamRef = useRef(null);
  const speechSynthesis = window.speechSynthesis;
  const openaiRef = useRef(null);
  const db = getFirestore();
  const auth = getAuth();
  const recognitionRef = useRef(null);

  // Initialize OpenAI for Whisper
  useEffect(() => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key is missing. Voice recording feature will be disabled.');
      return;
    }

    try {
      openaiRef.current = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
    } catch (err) {
      console.error('Failed to initialize OpenAI client. Voice recording feature will be disabled.', err);
    }
  }, []);

  // Generate the first question on component mount
  useEffect(() => {
    generateQuestion();
  }, []); // Empty dependency array means this runs once on mount

  const handleSubmitInterview = async () => {
    // Generate feedback for each question
    const updatedQuestions = allResponses.map(q => ({
        ...q,
        feedback: `Feedback for: ${q.question}` // Replace with actual feedback logic
    }));

    // Save interview results to Firestore
    await addDoc(collection(db, 'interviews'), {
        questions: updatedQuestions,
        timestamp: new Date(),
    });

    // Show summary instead of redirecting immediately
    setInterviewResults(updatedQuestions);
    setShowSummary(true);
  };

  const handleAnswerSubmit = useCallback(async () => {
    try {
        // Save the answer to the current question
        const updatedResponses = [...allResponses];
        updatedResponses[currentQuestionIndex] = {
            question: currentQuestion, // Save the current question
            answer: answer
        };
        setAllResponses(updatedResponses);

        // Check if it's the 10th question
        if (currentQuestionIndex === 9) {
            // Show summary instead of redirecting immediately
            setInterviewResults(updatedResponses);
            setShowSummary(true);
        } else {
            // Move to the next question and generate new question
            setCurrentQuestionIndex(prev => prev + 1);
            setAnswer('');
            setCode('');
            setFeedback('');
            generateQuestion(); // Generate next question
        }
    } catch (error) {
        console.error("Error submitting answer:", error);
    }
  }, [currentQuestionIndex, allResponses, answer, currentQuestion]);

  const speakText = useCallback((text) => {
    if (isMuted) {
      console.log('Muted: Not speaking the question.'); // Debugging output
      return; // Prevent speaking if muted
    }
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel(); // Stop any ongoing speech before speaking new text
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    speechSynthesis.speak(utterance);
  }, [isMuted, speechSynthesis]);

  const toggleMute = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel(); // Stop any ongoing speech when muting
    }
    setIsMuted(prev => !prev);
  }, [speechSynthesis]);

  const startRecording = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel(); // Stop any ongoing speech when starting recording
    }
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US'; // Language
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      // Update the transcript only if it is different from the previous
      if (currentTranscript.trim() !== answer.trim()) {
        setAnswer(currentTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError('Failed to recognize speech. Please try again.');
    };

    recognition.start();
    setIsRecording(true);
    recognitionRef.current = recognition;
  }, [answer]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      handleAnswerSubmit();
    }
    return () => clearInterval(interval);
  }, [timer, isTimerRunning, handleAnswerSubmit]);

  useEffect(() => {
    if (currentQuestion) {
      speakText(currentQuestion);
    }
  }, [currentQuestion, speakText]);

  const generateQuestion = async () => {
    try {
      const interviewData = JSON.parse(localStorage.getItem('interviewData'));
      if (!interviewData) {
        throw new Error("No interview data found");
      }

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `You are an expert technical interviewer. Generate a relevant ${getQuestionType(currentQuestionIndex)} question for a ${interviewData.jobRole} position.
      Experience Level: ${interviewData.experienceLevel}
      Job Description: ${interviewData.jobDescription}
      
      Rules for question generation:
      1. For technical questions, focus on ${interviewData.jobRole}-specific technical concepts
      2. For coding questions, make them relevant to real-world scenarios
      3. Keep questions clear, concise, and specific
      4. Avoid any additional formatting or explanatory text
      5. Generate only the question, nothing else
      
      Generate the question now:`;

      console.log('Generated Prompt:', prompt); // Log the prompt being sent

      const result = await model.generateContent(prompt);
      console.log('API Result:', result); // Log the result from the API

      if (!result || !result.response) {
        throw new Error("Failed to get response from Gemini API");
      }

      const response = result.response;
      const questionText = response.text().trim();
      
      if (!questionText) {
        throw new Error("Empty response from Gemini API");
      }

      setCurrentQuestion(questionText);
      setTimer(300); // Reset timer for new question
      setIsTimerRunning(true);
    } catch (error) {
      console.error('Error generating question:', error);
      setCurrentQuestion('Error generating question. Please try again.');
      // Retry after a short delay
      setTimeout(() => {
        generateQuestion();
      }, 2000);
    }
  };

  const getQuestionType = (index) => {
    if (index === 0) return 'introduction';
    if (index >= 1 && index <= 3) return 'aptitude';
    if (index >= 4 && index <= 6) return 'technical';
    return 'coding';
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Add stopwatch timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const stopInterview = async () => {
    setIsInterviewActive(false);
    // Save interview history to local storage or database
    await addDoc(collection(db, 'interviews'), {
      questions: allResponses,
      timestamp: new Date(),
    });
    navigate('/report');
  };

  // Prevent navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isInterviewActive) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isInterviewActive]);

  const finishInterview = async () => {
    // Save the interview results to Firestore if not already done
    await addDoc(collection(db, 'interviews'), {
        questions: interviewResults,
        timestamp: new Date(),
    });
    // Redirect to the report page
    navigate('/report', { state: { interviewResults } });
  };

  const handleSubmitSummary = () => {
    // Navigate to Report.js and pass interviewResults
    navigate('/report', { state: { interviewResults: interviewResults } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header disableNavigation={isInterviewActive} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
              <span className="font-medium text-gray-700">{formatElapsedTime(elapsedTime)}</span>
            </div>
          </div>
          <button
            onClick={stopInterview}
            className="btn btn-danger flex items-center space-x-2"
          >
            <XCircleIcon className="h-5 w-5" />
            <span>Stop Interview</span>
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Question and Answer */}
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Question {currentQuestionIndex + 1}/10
                  </span>
                  <span className="text-gray-600 font-medium capitalize">
                    {getQuestionType(currentQuestionIndex)}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleMute}
                    className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <SpeakerWaveIcon className="h-6 w-6 text-gray-400" /> : <SpeakerWaveIcon className="h-6 w-6" />}
                  </button>
                  <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
                    <span className="font-medium text-gray-700">{formatTime(timer)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-inner mb-6">
                <p className="text-lg text-gray-800">{currentQuestion}</p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md animate-fade-in">
                  {error}
                </div>
              )}

              {getQuestionType(currentQuestionIndex) === 'coding' ? (
                <div className="rounded-lg overflow-hidden shadow-lg">
                  <Editor
                    height="400px"
                    defaultLanguage="javascript"
                    value={code}
                    onChange={setCode}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      padding: { top: 20 },
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="input h-40 resize-none"
                  />
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={startRecording}
                      disabled={isRecording}
                      className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'} flex items-center`}
                    >
                      <MicrophoneIcon className="h-5 w-5 mr-2" />
                      {isRecording ? 'Recording...' : 'Start Recording'}
                    </button>
                    <button
                      onClick={stopRecording}
                      disabled={!isRecording}
                      className="btn btn-secondary flex items-center"
                    >
                      <StopIcon className="h-5 w-5 mr-2" />
                      Stop Recording
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleAnswerSubmit}
                disabled={isRecording}
                className="btn btn-primary w-full mt-6 flex items-center justify-center"
              >
                Submit Answer
              </button>

              {/* Show Finish Interview button after the 10th question */}
              {currentQuestionIndex === 9 && showSummary && (
                <button
                  onClick={handleSubmitSummary}
                  className="btn btn-success w-full mt-6 flex items-center justify-center"
                >
                  Submit Summary
                </button>
              )}
            </div>
          </div>

          {/* Right side - Webcam and Progress */}
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Video Preview</h3>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  className="w-full"
                  screenshotFormat="image/jpeg"
                />
              </div>
            </div>
          </div>
        </div>
        {showSummary && (
          <div className="summary">
            <h2>Interview Summary</h2>
            {interviewResults.map((result, index) => (
              <div key={index}>
                <h3>Question: {result.question}</h3>
                <p>Your Answer: {result.answer}</p>
                <p>Feedback: {result.feedback}</p>
              </div>
            ))}
            <button onClick={() => navigate('/report', { state: { interviewResults } })}>View Full Report</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Interview;
