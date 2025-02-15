import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ArrowDownTrayIcon, PlayIcon } from '@heroicons/react/24/solid';
import Header from './Header';

function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserData(user.uid);
      } else {
        navigate('/');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const fetchUserData = async (userId) => {
    try {
      setLoading(true);

      // Fetch interview reports
      const reportsRef = collection(db, 'interviews');
      const q = query(reportsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const reportsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
      }));

      setReports(reportsList.sort((a, b) => b.date - a.date));
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
    if (!auth.currentUser) {
      navigate('/');
      return;
    }

    const reportText = `MockDiddy Interview Report
Date: ${report.date.toLocaleDateString()}
Position: ${report.jobRole}
Experience Level: ${report.experienceLevel}

${report.responses.map(
      (response, index) => `
Question ${index + 1} (${response.type}):
${response.question}

Your Answer:
${response.answer}

Feedback:
${response.feedback}
-------------------`
    ).join('\n')}

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-8 animate-fade-in">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Your Interview History</h2>
            <button onClick={startNewInterview} className="btn btn-primary flex items-center space-x-2">
              <PlayIcon className="h-5 w-5" />
              <span>Start New Interview</span>
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12">
              <img src="/empty-state.svg" alt="No interviews yet" className="w-48 h-48 mx-auto opacity-50" />
              <h3 className="text-xl font-medium text-gray-600 mb-4">No Interviews Yet</h3>
              <p className="text-gray-500 mb-6">Start your first mock interview to practice and improve!</p>
              <button onClick={startNewInterview} className="btn btn-primary inline-flex items-center space-x-2">
                <PlayIcon className="h-5 w-5" />
                <span>Take Your First Interview</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {reports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{report.jobRole}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{report.date.toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{report.experienceLevel}</span>
                      </div>
                    </div>
                    <button onClick={() => downloadReport(report)} className="btn btn-secondary flex items-center space-x-2">
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      <span>Download Report</span>
                    </button>
                  </div>
                  <p className="mt-2 text-gray-700">{report.overallFeedback}</p>
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
