import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { VertexAI } from '@google-cloud/aiplatform';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// --- Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Setup Middleware ---
app.use(cors());
app.use(express.json());

// --- LAZY INITIALIZATION SETUP ---
// We create placeholders for our clients. They will be null until first use.
let vertex_ai = null;
let ttsClient = null;

const project = process.env.GCLOUD_PROJECT;
const location = 'us-central1';

// This function initializes the Vertex AI client if it hasn't been already.
function getVertexClient() {
  if (!vertex_ai) {
    console.log("--- LAZY INIT: Initializing VertexAI client for the first time. ---");
    if (!project) throw new Error("GCLOUD_PROJECT environment variable not set.");
    vertex_ai = new VertexAI({ project, location });
  }
  return vertex_ai;
}

// This function initializes the TTS client if it hasn't been already.
function getTtsClient() {
  if (!ttsClient) {
    console.log("--- LAZY INIT: Initializing TextToSpeechClient for the first time. ---");
    ttsClient = new TextToSpeechClient();
  }
  return ttsClient;
}
// --- END LAZY INITIALIZATION ---


// --- Define API Endpoints ---
// Each endpoint now calls the "get" function first.

app.post('/api/analyze-script', async (req, res) => {
  try {
    const client = getVertexClient(); // Get or create client
    const { script, timingRule } = req.body;
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
    const prompt = `Analyze and split this script into scenes. Max duration: ${timingRule}s. Return JSON array of strings. No markdown. Script: ${script}`;
    const result = await model.generateContent(prompt);
    const text = result.response.candidates[0].content.parts[0].text;
    res.json({ scenes: JSON.parse(text.replace(/```json\n|\n```/g, '').trim()) });
  } catch (error) {
    console.error('API Error in /api/analyze-script:', error);
    res.status(500).json({ error: 'Failed to analyze script. Check server logs.' });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    const client = getVertexClient(); // Get or create client
    const { scene, promptSuffix } = req.body;
    const model = client.preview.getGenerativeModel({ model: 'imagegeneration@006' });
    const resp = await model.generateContent({ parts: [{ text: `${scene}${promptSuffix}` }] });
    const imageBase64 = resp.response.candidates[0].content.parts[0].fileData.data;
    res.json({ imageUrl: `data:image/png;base64,${imageBase64}` });
  } catch (error) {
    console.error('API Error in /api/generate-image:', error);
    res.status(500).json({ error: 'Failed to generate image. Check server logs.' });
  }
});

app.post('/api/generate-speech', async (req, res) => {
  try {
    const client = getTtsClient(); // Get or create client
    const { scene, voice } = req.body;
    const voiceMap = { "Deep Male (Fenrir)": "en-US-Wavenet-D", "Fast/Crisp Male (Puck)": "en-US-Wavenet-B", "Calm Female (Zephyr)": "en-US-Wavenet-F" };
    const request = {
      input: { text: scene },
      voice: { languageCode: 'en-US', name: voiceMap[voice] || 'en-US-Standard-A' },
      audioConfig: { audioEncoding: 'MP3' },
    };
    const [response] = await client.synthesizeSpeech(request);
    const audioBase64 = response.audioContent.toString('base64');
    res.json({ audioUrl: `data:audio/mp3;base64,${audioBase64}` });
  } catch (error) {
    console.error('API Error in /api/generate-speech:', error);
    res.status(500).json({ error: 'Failed to generate speech. Check server logs.' });
  }
});

// --- Serve Frontend ---
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Production server with lazy loading listening on port ${PORT}`);
});
