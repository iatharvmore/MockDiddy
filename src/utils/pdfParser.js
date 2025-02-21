import { PDFDocument } from 'pdf-lib';

export const readPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const paragraphs = [];

    for (const page of pages) {
        const text = await page.getTextContent();
        const textItems = text.items.map(item => item.str);
        const formattedText = textItems.join('\n').replace(/\n+/g, '\n').trim();
        paragraphs.push(formattedText);
    }

    return paragraphs.join('\n\n'); // Join paragraphs with double line breaks
};
