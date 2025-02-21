import { jsPDF } from 'jspdf';

export const generatePDFReport = (report) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(`MockDiddy Interview Report`, 10, 10);
  doc.setFontSize(12);
  doc.text(`Date: ${report.date.toLocaleDateString()}`, 10, 20);
  doc.text(`Position: ${report.jobRole}`, 10, 30);
  doc.text(`Experience Level: ${report.experienceLevel}`, 10, 40);

  let yPos = 50;
  report.responses.forEach((response, index) => {
    doc.text(`Question ${index + 1} (${response.type}):`, 10, yPos);
    doc.text(response.question, 15, yPos + 5);
    doc.text(`Your Answer: ${response.answer}`, 15, yPos + 15);
    doc.text(`Feedback: ${response.feedback}`, 15, yPos + 25);
    yPos += 35;
  });

  doc.text(`Overall Performance:`, 10, yPos);
  doc.text(report.overallFeedback, 15, yPos + 5);

  doc.save(`mockdiddy-report-${report.date.toISOString().split('T')[0]}.pdf`);
};