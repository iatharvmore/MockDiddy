import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import Editor from '@monaco-editor/react';
import OpenAI from 'openai';
import { MicrophoneIcon, StopIcon, ClockIcon, SpeakerWaveIcon, XCircleIcon } from '@heroicons/react/24/solid';
import Header from './Header';
import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function Interview({ genAI }) {
  const navigate = useNavigate();
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
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const webcamRef = useRef(null);
  const speechSynthesis = window.speechSynthesis;
  const openaiRef = useRef(null);
  const db = getFirestore();
  const auth = getAuth();

  // Initialize OpenAI for Whisper
  useEffect(() => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      setError('OpenAI API key is missing. Voice recording feature will be disabled.');
      return;
    }

    try {
      openaiRef.current = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
    } catch (err) {
      setError('Failed to initialize OpenAI client. Voice recording feature will be disabled.');
      console.error('OpenAI initialization error:', err);
    }
  }, []);

  const handleAnswerSubmit = useCallback(async () => {
    setIsTimerRunning(false);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Evaluate this answer for a ${getQuestionType(currentQuestionIndex)} question:
        Question: ${currentQuestion}
        Answer: ${getQuestionType(currentQuestionIndex) === 'coding' ? code : answer}
        Provide brief, constructive feedback focusing on key points.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const newFeedback = response.text().trim();
      setFeedback(newFeedback);

      const newResponse = {
        question: currentQuestion,
        answer: getQuestionType(currentQuestionIndex) === 'coding' ? code : answer,
        feedback: newFeedback,
        type: getQuestionType(currentQuestionIndex)
      };

      const updatedResponses = [...allResponses, newResponse];
      setAllResponses(updatedResponses);

      if (currentQuestionIndex === 9) {
        // Deduct one credit when interview is completed
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          credits: increment(-1)
        });

        localStorage.setItem('interviewResults', JSON.stringify(updatedResponses));
        navigate('/report');
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setAnswer('');
        setCode('');
        setFeedback('');
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedback('Error generating feedback. Please try again.');
    }
  }, [currentQuestionIndex, currentQuestion, code, answer, allResponses, genAI, navigate, auth.currentUser, db]);

  const speakText = useCallback((text) => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    speechSynthesis.speak(utterance);
  }, [speechSynthesis]);

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

  useEffect(() => {
    const generateQuestion = async () => {
      try {
        const interviewData = JSON.parse(localStorage.getItem('interviewData'));
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Act as a technical interviewer. Generate a ${getQuestionType(currentQuestionIndex)} question for a ${interviewData.jobRole} position. 
          Experience level: ${interviewData.experienceLevel}
          Job Description: ${interviewData.jobDescription}
          Keep the response clean and simple without any formatting or additional text.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        setCurrentQuestion(response.text().trim());
        setTimer(300); // Reset timer for new question
        setIsTimerRunning(true);
      } catch (error) {
        console.error('Error generating question:', error);
        setCurrentQuestion('Error generating question. Please try again.');
      }
    };

    generateQuestion();
  }, [currentQuestionIndex, genAI]);

  const getQuestionType = (index) => {
    if (index === 0) return 'introduction';
    if (index >= 1 && index <= 3) return 'aptitude';
    if (index >= 4 && index <= 6) return 'technical';
    return 'coding';
  };

  const startRecording = async () => {
    if (!openaiRef.current) {
      setError('Voice recording is not available due to missing OpenAI API key.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        try {
          const transcription = await openaiRef.current.audio.transcriptions.create({
            file: audioBlob,
            model: 'whisper-1',
          });
          setAnswer(transcription.text);
          setError('');
        } catch (error) {
          console.error('Error transcribing audio:', error);
          setError('Failed to transcribe audio. Please try again or type your answer.');
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError('');
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
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

  const endInterview = async () => {
    if (window.confirm('Are you sure you want to end the interview? This will save your progress, generate a report, and use one interview credit.')) {
      setIsInterviewActive(false);
      
      // Deduct one credit when interview is ended early
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        credits: increment(-1)
      });

      const updatedResponses = [...allResponses];
      localStorage.setItem('interviewResults', JSON.stringify(updatedResponses));
      navigate('/report');
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header disableNavigation={isInterviewActive} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-md">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-gray-600" />
                <span className="font-mono text-lg">{formatElapsedTime(elapsedTime)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={endInterview}
            className="btn btn-danger flex items-center space-x-2"
          >
            <XCircleIcon className="h-5 w-5" />
            <span>End Interview</span>
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
                    onClick={() => speakText(currentQuestion)}
                    disabled={isSpeaking}
                    className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
                    title={isSpeaking ? "Speaking..." : "Read Question"}
                  >
                    <SpeakerWaveIcon className="h-6 w-6" />
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
                      disabled={isRecording || !openaiRef.current}
                      className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'} flex items-center`}
                      title={!openaiRef.current ? 'Voice recording is not available' : undefined}
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
                className="btn btn-primary w-full mt-6 flex items-center justify-center"
              >
                Submit Answer
              </button>

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
      </div>
    </div>
  );
}

export default Interview; 