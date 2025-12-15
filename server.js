import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library'; // A stable, reliable library for auth

// --- Express App Setup ---
const app = express();
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// --- Google Auth Setup ---
const project = process.env.GCLOUD_PROJECT;
const location = 'us-central1';
const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

async function getAuthToken() {
  const client = await auth.getClient();
  const tokens = await client.getAccessToken();
  return tokens.token;
}

// --- API Endpoints using raw fetch ---

app.post('/api/analyze-script', async (req, res) => {
  try {
    const token = await getAuthToken();
    const { script, timingRule } = req.body;
    const apiUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/gemini-1.5-flash-001:generateContent`;

    const prompt = `Analyze and split this script into scenes. Max duration: ${timingRule}s. Return JSON array of strings. No markdown. Script: ${script}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    res.json({ scenes: JSON.parse(text.replace(/```json\n|\n```/g, '').trim()) });

  } catch (error) {
    console.error('Raw fetch /api/analyze-script Error:', error);
    res.status(500).json({ error: 'Failed to analyze script via fetch.' });
  }
});

// NOTE: The other two endpoints ('generate-image', 'generate-speech') would be rewritten in a similar 'fetch' style.
// For the sake of getting a successful deployment, we will comment them out for now.
app.post('/api/generate-image', (req, res) => res.status(501).json({ error: 'Not Implemented' }));
app.post('/api/generate-speech', (req, res) => res.status(501).json({ error: 'Not Implemented' }));


// --- Serve Frontend ---
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server with raw fetch listening on port ${PORT}`);
});
