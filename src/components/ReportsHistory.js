import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import Header from './Header';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';

function ReportsHistory() {
  const [reports, setReports] = useState([]);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchReports = async () => {
      if (!auth.currentUser) return;

      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, where('userId', '==', auth.currentUser.uid));
      
      try {
        const querySnapshot = await getDocs(q);
        const reportsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        }));
        setReports(reportsList.sort((a, b) => b.date - a.date));
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, [auth.currentUser, db]);

  const downloadReport = (report) => {
    const reportText = `AI Mock Interview Report
Date: ${report.date.toLocaleDateString()}
Position: ${report.jobRole}
Experience Level: ${report.experienceLevel}

${report.responses.map((response, index) => `
Question ${index + 1} (${response.type}):
${response.question}

Your Answer:
${response.answer}

Feedback:
${response.feedback}
-------------------`).join('\n')}

Overall Performance:
${report.overallFeedback}`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${report.date.toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-8">Interview History</h1>
          
          {reports.length === 0 ? (
            <p className="text-gray-600 text-center">No previous interview reports found.</p>
          ) : (
            <div className="space-y-6">
              {reports.map((report) => (
                <div key={report.id} className="border-b pb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{report.jobRole}</h2>
                      <p className="text-gray-600">
                        {report.date.toLocaleDateString()} • {report.experienceLevel}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadReport(report)}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Performance Summary</h3>
                    <p className="text-gray-700">{report.overallFeedback}</p>
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

export default ReportsHistory; 