# MockDiddy

## Description
A brief overview of what your project does.

## Installation Instructions
1. Clone the repository: `git clone <repository-url>`
2. Navigate to the project directory: `cd MockDiddy`
3. Install dependencies: `npm install`

## Usage
Instructions on how to use the project.

## Contributing
Guidelines for contributing to the project.

## License
This project is licensed under the MIT License.
# AI-Powered Mock Interview Application

This application helps students prepare for technical interviews using AI-powered question generation and feedback. It uses the Google Gemini API for natural language processing and Firebase for authentication and storage.

## Features

- Google Authentication
- AI-generated interview questions based on job role and experience level
- Real-time feedback on answers
- Speech-to-text capabilities (coming soon)
- Downloadable interview reports
- Modern, responsive UI with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Platform account (for Gemini API)
- Firebase account

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd interview-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your API keys:
```
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id_here
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. Sign in using your Google account
2. Fill in the job details form
3. Start the interview process
4. Answer questions either by typing or speaking (speech feature coming soon)
5. Receive AI-generated feedback for each answer
6. Download your interview report at the end

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

