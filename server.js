import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// --- TEST API ENDPOINT ---
// This is the only API endpoint. It listens for the call from the frontend.
app.post('/api/analyze-script', (req, res) => {
  console.log("--- SUCCESS: The /api/analyze-script route was hit! ---");

  // Send back a successful, hardcoded response.
  res.status(200).json({
    scenes: [
      "This is a test scene from the server.",
      "If you are seeing this, it means the routing is now working correctly.",
      "The final problem is in the original server.js file."
    ]
  });
});

// --- Serve Frontend for all other GET requests ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Minimal routing test server listening on port ${PORT}`);
});
