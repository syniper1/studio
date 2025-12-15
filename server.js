import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { VertexAI } from '@google-cloud/aiplatform';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// --- Initialize Express App First ---
const app = express();
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Setup Middleware ---
app.use(cors());
app.use(express.json());

// --- Initialize Google Cloud Clients ---
// This is kept separate to isolate any potential initialization issues.
const project = process.env.GCLOUD_PROJECT;
const location = 'us-central1';
let vertex_ai, ttsClient;

try {
  if (!project) {
    throw new Error("GCLOUD_PROJECT environment variable not set.");
  }
  vertex_ai = new VertexAI({ project, location });
  ttsClient = new TextToSpeechClient();
} catch (error) {
  console.error("FATAL: Could not initialize Google Cloud clients.", error);
  // If we can't connect to Google, we can't run. Exit gracefully.
  process.exit(1); 
}


// --- Define API Endpoints ---

// 1. Analyze Script
app.post('/api/analyze-script', async (req, res) => {
  try {
    const { script, timingRule } = req.body;
    const generativeModel = vertex_ai.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
    const prompt = `Analyze and split this script into scenes. Max duration: ${timingRule}s. Return a JSON array of strings. Do not include markdown. Script: ${script}`;
    const result = await generativeModel.generateContent(prompt);
    const text = result.response.candidates[0].content.parts[0].text;
    res.json({ scenes: JSON.parse(text.replace(/```json\n|\n```/g, '').trim()) });
  } catch (error) {
    console.error('API Error in /api/analyze-script:', error);
    res.status(500).json({ error: 'Failed to analyze script.' });
  }
});

// 2. Generate Image
app.post('/api/generate-image', async (req, res) => {
  try {
    const { scene, promptSuffix } = req.body;
    const fullPrompt = `${scene}${promptSuffix}`;
    const imageModel = vertex_ai.preview.getGenerativeModel({ model: 'imagegeneration@006' });
    const resp = await imageModel.generateContent({ parts: [{ text: fullPrompt }] });
    const imageBase64 = resp.response.candidates[0].content.parts[0].fileData.data;
    res.json({ imageUrl: `data:image/png;base64,${imageBase64}` });
  } catch (error) {
    console.error('API Error in /api/generate-image:', error);
    res.status(500).json({ error: 'Failed to generate image.' });
  }
});

// 3. Generate Speech
app.post('/api/generate-speech', async (req, res) => {
  try {
    const { scene, voice } = req.body;
    const voiceMap = { "Deep Male (Fenrir)": "en-US-Wavenet-D", "Fast/Crisp Male (Puck)": "en-US-Wavenet-B", "Calm Female (Zephyr)": "en-US-Wavenet-F" };
    const request = {
      input: { text: scene },
      voice: { languageCode: 'en-US', name: voiceMap[voice] || 'en-US-Standard-A' },
      audioConfig: { audioEncoding: 'MP3' },
    };
    const [response] = await ttsClient.synthesizeSpeech(request);
    const audioBase64 = response.audioContent.toString('base64');
    res.json({ audioUrl: `data:audio/mp3;base64,${audioBase64}` });
  } catch (error) {
    console.error('API Error in /api/generate-speech:', error);
    res.status(500).json({ error: 'Failed to generate speech.' });
  }
});


// --- Serve Frontend ---
// This must be placed after all API routes.
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Production server listening on port ${PORT}`);
});
