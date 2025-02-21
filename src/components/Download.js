import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import OpenAI from 'openai';
import Header from './Header';

const Download = ({ genAI }) => {
    const location = useLocation();
    const [report, setReport] = useState('');
    const [loading, setLoading] = useState(true);
    const interviewResults = location.state?.interviewResults || [];

    const fetchReportWithRetry = async (prompt, retries = 3) => {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        for (let i = 0; i < retries; i++) {
            try {
                const result = await model.generateContent(prompt);
                return result;
            } catch (error) {
                if (error.message.includes('429') && i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
                } else {
                    throw error; // Rethrow if it's not a 429 error or no retries left
                }
            }
        }
    };

    useEffect(() => {
        console.log('Received Interview Results:', interviewResults);
        const fetchReport = async () => {
            if (!interviewResults.length) {
                setReport('No interview results available.');
                setLoading(false);
                return;
            }

            const prompt = `Evaluate the following interview results and provide a report and score:\n\n${interviewResults.map(result => `${result.question}\n${result.answer}`).join('\n\n')}`;
            
            try {
                const result = await fetchReportWithRetry(prompt);
                setReport(result.response.text().trim());
                displayEvaluation(result.response.evaluation);
            } catch (error) {
                console.error('Error fetching report:', error);
                setReport('Failed to generate report.');
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [interviewResults, genAI]);

    function displayEvaluation(evaluation) {
        if (evaluation) {
            console.log("Evaluation:", evaluation);
            document.getElementById("evaluationDisplay").innerText = evaluation;
        } else {
            console.log("No evaluation to display.");
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Header />
            <h1 className="text-2xl font-bold mb-4">Interview Report</h1>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold">Report</h2>
                    <pre>{report}</pre>
                    {interviewResults.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mt-4">Interview Results</h2>
                            {interviewResults.map((result, index) => (
                                <div key={index}>
                                    <p><strong>Question:</strong> {result.question}</p>
                                    <p><strong>Answer:</strong> {result.answer}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    <div id="evaluationDisplay" className="mt-4"></div>
                </div>
            )}
        </div>
    );
};

export default Download;
