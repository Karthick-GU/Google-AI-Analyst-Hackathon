# Startup Idea Experimentation Platform

A web application to capture startup project ideas (call transcripts, founder updates, emails), extract and analyze their content, and run hypothesis tests using Google Cloud AI services.

## 🏗 Architecture
- **Frontend**: Vite + React SPA (Tailwind CSS for styling)
- **Backend**: FastAPI (Python) REST API
- **Google Cloud Services**  
  - **Cloud Storage** – store raw uploads (PDF, images, audio)  
  - **Cloud SQL / Firestore** – structured data & metadata  
  - **Vertex AI** – hypothesis testing and ML experiments  
  - **Gemini API** – generate Business Model Canvas (BMC)  
  - **Vision API** – OCR for images and email screenshots  

## 🚀 Features
1. **Idea Ingestion**  
   - Upload project ideas, call transcripts, founder updates, and emails.
   - Files saved to **Google Cloud Storage**.

2. **Content Extraction**  
   - Vision API extracts text from images/screenshots.
   - (Optional) Speech-to-Text for audio transcripts.

3. **Business Model Generation**  
   - Gemini API drafts the Business Model Canvas.

4. **Hypothesis Testing**  
   - Vertex AI pipelines test and validate business hypotheses.

## 🔧 Setup
1. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
