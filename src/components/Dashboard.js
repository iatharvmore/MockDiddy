import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  ArrowDownTrayIcon, 
  PlayIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  UserCircleIcon,
  AcademicCapIcon,
  FireIcon
} from '@heroicons/react/24/solid';
import Header from './Header';

function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    completionRate: 0,
    lastInterview: null
  });
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      if (user) {
        await fetchUserData(user.uid);
      } else {
        // Implement auth persistence check before redirecting
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            await fetchUserData(firebaseUser.uid);
          } else {
            navigate('/', { replace: true });
          }
          unsubscribe();
        });
      }
      
      // Faster auth check
      setTimeout(() => setAuthLoading(false), 300);
    };
    
    checkAuth();
  }, [auth, navigate]);

  const fetchUserData = async (userId) => {
    try {
      setLoading(true);
      const reportsRef = collection(db, 'interviews');
      const q = query(reportsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const reportsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp?.toDate() || new Date(),
      }));

      const sortedReports = reportsList.sort((a, b) => b.date - a.date);
      setReports(sortedReports);
      
      // Calculate dashboard stats
      if (sortedReports.length > 0) {
        const complete = sortedReports.filter(r => r.status !== 'incomplete').length;
        const completionRate = sortedReports.length > 0 ? 
          Math.round((complete / sortedReports.length) * 100) : 0;
          
        // Calculate average score (if you have a scoring system)
        // This is a placeholder - modify based on your actual data structure
        const avgScore = sortedReports.reduce((acc, report) => {
          const score = report.score || 0;
          return acc + score;
        }, 0) / sortedReports.length || 0;
        
        setStats({
          totalInterviews: sortedReports.length,
          averageScore: Math.round(avgScore * 10) / 10,
          completionRate: completionRate,
          lastInterview: sortedReports[0]?.date
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewInterview = () => {
    if (!auth.currentUser) {
      navigate('/');
      return;
    }
    navigate('/input');
  };

  const downloadReport = (report) => {
    const reportText = `MockDiddy Interview Report
Date: ${report.date.toLocaleDateString()}
Position: ${report.jobRole}
Experience Level: ${report.experienceLevel}

${report.questions.map((question, index) => `
Question ${index + 1}:
${question.question}

Your Answer:
${question.answer}

Feedback:
${question.feedback}
-------------------`).join('\n')}

Overall Performance:
${report.overallFeedback}`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockdiddy-report-${report.date.toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const viewReport = (reportId) => {
    navigate(`/report/${reportId}`);
  };

  // Calculate progress over time for chart (simplified version)
  const getActivityData = () => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Count interviews per month in the last 6 months
    const monthCounts = {};
    reports.forEach(report => {
      if (report.date >= sixMonthsAgo) {
        const monthYear = `${report.date.getMonth()+1}/${report.date.getFullYear()}`;
        monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
      }
    });
    
    return monthCounts;
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 relative">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-blue-600 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-indigo-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-xl mb-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-3">Welcome back, {auth.currentUser?.displayName || 'Professional'}</h1>
              <p className="text-blue-100 max-w-xl">
                Perfect your interview skills with MockDiddy. Track your progress, review past interviews, and continue building your career success.
              </p>
              <button 
                onClick={startNewInterview} 
                className="mt-6 bg-white text-indigo-700 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg shadow-md transition-all flex items-center space-x-2"
              >
                <PlayIcon className="h-5 w-5" />
                <span>Start New Interview</span>
              </button>
            </div>
            <div className="hidden md:block">
              <img src="/dashboard-illustration.svg" alt="Interview preparation" className="w-60 h-60" />
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        {reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-blue-500">
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Interviews</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.totalInterviews}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-green-500">
              <div className="flex items-start">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <AcademicCapIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Average Score</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {stats.totalInterviews > 0 ? `${stats.averageScore}/10` : 'N/A'}
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-purple-500">
              <div className="flex items-start">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <FireIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Completion Rate</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.completionRate}%</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-amber-500">
              <div className="flex items-start">
                <div className="bg-amber-100 p-3 rounded-lg mr-4">
                  <CalendarIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Last Interview</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {stats.lastInterview ? stats.lastInterview.toLocaleDateString() : 'N/A'}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <ClockIcon className="h-6 w-6 mr-2 text-indigo-600" />
              Interview History
            </h2>
            
            {reports.length > 0 && (
              <div className="flex space-x-2">
                <select className="form-select rounded-lg border-gray-300 text-gray-700 pr-10">
                  <option>All Interviews</option>
                  <option>Completed</option>
                  <option>Incomplete</option>
                </select>
                <button onClick={startNewInterview} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow transition-colors flex items-center space-x-2">
                  <PlayIcon className="h-5 w-5" />
                  <span>New Interview</span>
                </button>
              </div>
            )}
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <img src="/empty-dashboard.svg" alt="No interviews yet" className="w-64 h-64 mx-auto" />
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">No Interviews Yet</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">Start your first mock interview to practice your skills and get AI-powered feedback!</p>
              <button 
                onClick={startNewInterview} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-colors inline-flex items-center space-x-2"
              >
                <PlayIcon className="h-5 w-5" />
                <span>Take Your First Interview</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {reports.map((report) => (
                <div key={report.id} className="relative bg-white rounded-xl border border-gray-100 overflow-hidden shadow-md hover:shadow-lg transition-all group">
                  {/* Status Badge */}
                  {report.status === 'incomplete' && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                      Incomplete
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                          <UserCircleIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{report.jobRole}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <span>{report.date.toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{report.experienceLevel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Performance Summary</h4>
                      <p className="text-gray-700 line-clamp-3">{report.overallFeedback}</p>
                    </div>
                    
                    {/* Stats/Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Questions</p>
                        <p className="text-lg font-semibold">{report.questions?.length || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Score</p>
                        <p className="text-lg font-semibold">{report.score || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <button 
                        onClick={() => viewReport(report.id)}
                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 rounded-lg transition-colors text-sm"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => downloadReport(report)} 
                        className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 p-2 rounded-lg transition-colors"
                        title="Download Report"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;