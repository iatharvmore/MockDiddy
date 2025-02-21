// resumeParser.js
import * as pdfjs from 'pdfjs-dist';

// Add missing functions
const readTextFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsText(file);
  });
};

const extractSkills = (text) => {
  const skillsRegex = /(skills|technical skills|key competencies):?\s*([\s\S]*?)(?=\n\n|$)/i;
  const match = text.match(skillsRegex);
  return match ? match[2].split(/\n|,|•/).map(s => s.trim()).filter(Boolean) : [];
};

const extractCareerGoals = (text) => {
  const goalsRegex = /(objectives?|goals?|career aspirations?):?\s*([\s\S]*?)(?=\n\n|$)/i;
  const match = text.match(goalsRegex);
  return match ? match[2] : '';
};

export const parseResume = async (file) => {
  const text = await (file.type === 'application/pdf' 
    ? parsePDF(file)
    : readTextFile(file));

  return {
    skills: extractSkills(text),
    careerGoals: extractCareerGoals(text)
  };
};

// Keep existing parsePDF implementation
const parsePDF = async (file) => {
  try {
    const pdf = await pdfjs.getDocument({ 
      data: new Uint8Array(await file.arrayBuffer()) 
    }).promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ');
    }
    return text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file');
  }
};