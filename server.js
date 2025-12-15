import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { VertexAI } from '@google-cloud/aiplatform';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// --- Server & Path Setup ---
const app = express();
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Google Cloud Vertex AI Setup ---
const project = process.env.GCLOUD_PROJECT;
const location = 'us-central1';

const vertex_ai = new VertexAI({ project: project, location: location });
const ttsClient = new TextToSpeechClient();


// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));


// --- API Endpoints ---

// 1. Analyze Script
app.post('/api/analyze-script', async (req, res) => {
    const { script, timingRule } = req.body;
    if (!script) return res.status(400).json({ error: 'Script content is required.' });

    const generativeModel = vertex_ai.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
    const prompt = `Analyze the following script and split it into scenes. Each scene should be a maximum of ${timingRule} seconds long based on a typical reading pace. Return a JSON array of strings, where each string is a scene. Do not include any other text or markdown. Script:\n\n${script}`;

    try {
        const result = await generativeModel.generateContent(prompt);
        const response = result.response;
        const text = response.candidates[0].content.parts[0].text;
        const cleanedText = text.replace(/```json\n|\n```/g, '').trim();
        const scenes = JSON.parse(cleanedText);
        res.json({ scenes });
    } catch (error) {
        console.error('Vertex AI Script Analysis Error:', error);
        res.status(500).json({ error: 'Failed to analyze script with Vertex AI.' });
    }
});

// 2. Generate Image (Imagen)
app.post('/api/generate-image', async (req, res) => {
    const { scene, promptSuffix } = req.body;
    if (!scene || !promptSuffix) return res.status(400).json({ error: 'Scene and prompt suffix are required.' });

    const fullPrompt = `${scene}${promptSuffix}`;
    const imageModel = vertex_ai.preview.getGenerativeModel({ model: 'imagegeneration@006' });

    try {
        const resp = await imageModel.generateContent({ parts: [{ text: fullPrompt }] });
        const imageBase64 = resp.response.candidates[0].content.parts[0].fileData.data;
        const dataUri = `data:image/png;base64,${imageBase64}`;
        res.json({ imageUrl: dataUri });
    } catch (error) {
        console.error('Vertex AI Imagen Error:', error.message);
        res.status(500).json({ error: 'Failed to generate image with Vertex AI.' });
    }
});


// 3. Generate Speech (TTS)
app.post('/api/generate-speech', async (req, res) => {
    const { scene, voice } = req.body;
    if (!scene || !voice) return res.status(400).json({ error: 'Scene and voice are required.' });

    // Voice mapping from preset to Google Cloud TTS voice names
    const voiceMap = {
        "Deep Male (Fenrir)": "en-US-Wavenet-D",
        "Fast/Crisp Male (Puck)": "en-US-Wavenet-B",
        "Calm Female (Zephyr)": "en-US-Wavenet-F"
    };

    const request = {
        input: { text: scene },
        voice: { languageCode: 'en-US', name: voiceMap[voice] || 'en-US-Standard-A' },
        audioConfig: { audioEncoding: 'MP3' },
    };

    try {
        const [response] = await ttsClient.synthesizeSpeech(request);
        const audioBase64 = response.audioContent.toString('base64');
        const audioUri = `data:audio/mp3;base64,${audioBase64}`;
        res.json({ audioUrl: audioUri });
    } catch (error) {
        console.error('Vertex AI TTS Error:', error);
        res.status(500).json({ error: 'Failed to generate speech with Vertex AI.' });
    }
});


// --- Serve Frontend ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (!project) {
        console.warn('GCLOUD_PROJECT environment variable is not set. API calls will likely fail.');
    }
});
