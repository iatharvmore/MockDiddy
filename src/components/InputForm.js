import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Header from './Header';
import { parseResume } from '../utils/resumeParser';
import { readPdf } from '../utils/pdfParser';
import { toast } from 'react-toastify'; // For notifications

function InputForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    jobRole: '',
    jobDescription: '',
    experienceLevel: '',
    resume: null,
    resumeText: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!['application/pdf', 'text/plain'].includes(file.type)) {
      toast.error('Unsupported file type. Please upload a PDF or TXT file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size too large. Please upload a file smaller than 5MB.');
      return;
    }

    setIsLoading(true);
    try {
      let extractedText = '';
      if (file.type === 'application/pdf') {
        extractedText = await readPdf(file);
      } else {
        extractedText = await parseResume(file);
      }
      setFormData((prev) => ({ ...prev, resume: file, resumeText: extractedText }));
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      console.error('Error parsing resume:', error);
      toast.error('Failed to parse resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.jobRole || !formData.jobDescription || !formData.experienceLevel) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Store the data in localStorage
      const dataToStore = {
        jobRole: formData.jobRole.trim(),
        jobDescription: formData.jobDescription.trim(),
        experienceLevel: formData.experienceLevel,
        resumeText: formData.resumeText || ''
      };

      console.log('Storing interview data:', dataToStore);
      localStorage.setItem('interviewData', JSON.stringify(dataToStore));
      
      toast.success('Interview data saved successfully!');
      navigate('/interview');
    } catch (error) {
      console.error('Error saving interview data:', error);
      toast.error('Failed to save interview data');
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="max-w-md mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 animate-fade-in">
          <div className="flex items-center justify-center mb-8">
            <img src="/Twemoji_1f351.svg.png" alt="MockDiddy Logo" className="h-12 w-12 mr-3" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Interview Details
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Role</label>
              <input
                type="text"
                name="jobRole"
                value={formData.jobRole}
                onChange={handleInputChange}
                className="input mt-1"
                placeholder="e.g., Software Engineer"
                required
              />
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Description</label>
              <textarea
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleInputChange}
                rows="4"
                className="input mt-1"
                placeholder="Describe the job role..."
                required
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Experience Level</label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleInputChange}
                className="input mt-1"
                required
              >
                <option value="">Select Experience Level</option>
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior Level (5+ years)</option>
              </select>
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Resume (PDF/TXT)</label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                disabled={isLoading}
                required
              />
              {isLoading && <p className="text-sm text-gray-500 mt-2">Parsing resume...</p>}
            </div>

            {/* Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 btn btn-secondary flex items-center justify-center space-x-2"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back</span>
              </button>
              <button type="submit" className="flex-1 btn btn-primary" disabled={isLoading}>
                Start Interview
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

<<<<<<< HEAD
export default InputForm;
=======
export default InputForm;
>>>>>>> 823f4530310154a5166386f91a69e854893b7924
