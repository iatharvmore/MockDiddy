import gradio as gr
import PyPDF2
import re

def read_pdf(file):
    with open(file.name, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        paragraphs = []
        for page in reader.pages:
            extracted_text = page.extract_text()
            formatted_text = re.sub(r'\n+', '\n', extracted_text)  # Replace multiple consecutive line breaks with a single line break
            paragraphs.append(formatted_text.strip())
    formatted_text = '\n\n'.join(paragraphs)  # Join paragraphs with double line breaks
    return formatted_text

iface = gr.Interface(
    read_pdf,
    gr.inputs.File(label="Upload a PDF file"),
    gr.outputs.Textbox(label="Extracted Text"),
    title="PDF Text Extractor",
    description="A smooth app that gets text from PDF files🧠",
    theme="ParityError/Anime"
)
iface.launch()
