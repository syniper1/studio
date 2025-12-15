import express from 'express';

// --- START: Bulletproof Startup Code ---

let vertex_ai;
let ttsClient;

try {
  console.log("--- DEBUG: Stage 1 - Attempting to import Google Cloud libraries. ---");
  const { VertexAI } = await import('@google-cloud/aiplatform');
  const { TextToSpeechClient } = await import('@google-cloud/text-to-speech');
  
  const project = process.env.GCLOUD_PROJECT;
  const location = 'us-central1';

  console.log(`--- DEBUG: Stage 2 - GCLOUD_PROJECT is '${project}'. Location is '${location}'. ---`);
  if (!project) {
    throw new Error("GCLOUD_PROJECT environment variable is not set or is undefined. This is a fatal error.");
  }

  console.log("--- DEBUG: Stage 3 - Initializing VertexAI client. ---");
  vertex_ai = new VertexAI({ project, location });

  console.log("--- DEBUG: Stage 4 - Initializing TextToSpeechClient. ---");
  ttsClient = new TextToSpeechClient();
  
  console.log("--- DEBUG: Stage 5 - All Google Cloud clients initialized successfully. ---");

} catch (err) {
  console.error("--- FATAL STARTUP ERROR ---");
  console.error("The application crashed during the initialization of Google Cloud clients.");
  console.error("Below is the specific error message:");
  console.error(err);
  
  // Exit the process with an error code to make the failure obvious.
  process.exit(1); 
}

// --- END: Bulletproof Startup Code ---


// --- Standard Express Server Setup ---
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.status(200).send('Application started, but this is the debug server. The real endpoints are disabled.');
});

app.listen(PORT, () => {
  console.log(`--- SUCCESS: Debug server is listening on port ${PORT}. ---`);
});
