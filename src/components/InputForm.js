import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Header from './Header';

function InputForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    jobRole: '',
    jobDescription: '',
    experienceLevel: '',
    resume: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      resume: file
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Store form data in localStorage for use in Interview component
    localStorage.setItem('interviewData', JSON.stringify(formData));
    navigate('/interview');
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Job Role
              </label>
              <input
                type="text"
                name="jobRole"
                value={formData.jobRole}
                onChange={handleInputChange}
                className="input mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Job Description
              </label>
              <textarea
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleInputChange}
                rows="4"
                className="input mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Experience Level
              </label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Resume (PDF/TXT)
              </label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-50 file:text-purple-700
                  hover:file:bg-purple-100"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 btn btn-secondary flex items-center justify-center space-x-2"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="flex-1 btn btn-primary"
              >
                Start Interview
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InputForm; 