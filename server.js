// --- START: Paranoid Debugging Server ---
console.log("--- Log 0: server.js execution started. ---");

process.on('uncaughtException', (err, origin) => {
  console.error(`--- FATAL UNCAUGHT EXCEPTION --- Origin: ${origin}`);
  console.error(err);
  process.exit(1);
});

let server;

try {
  console.log("--- Log 1: Importing 'express'. ---");
  const express = await import('express');
  console.log("--- Log 2: Successfully imported 'express'. ---");

  console.log("--- Log 3: Importing 'path'. ---");
  const path = await import('path');
  console.log("--- Log 4: Successfully imported 'path'. ---");
  
  console.log("--- Log 5: Importing 'url'. ---");
  const { fileURLToPath } = await import('url');
  console.log("--- Log 6: Successfully imported 'url'. ---");

  console.log("--- Log 7: Importing '@google-cloud/aiplatform'. ---");
  const { VertexAI } = await import('@google-cloud/aiplatform');
  console.log("--- Log 8: Successfully imported '@google-cloud/aiplatform'. ---");

  console.log("--- Log 9: Importing '@google-cloud/text-to-speech'. ---");
  const { TextToSpeechClient } = await import('@google-cloud/text-to-speech');
  console.log("--- Log 10: Successfully imported '@google-cloud/text-to-speech'. ---");

  const app = express.default();
  const PORT = process.env.PORT || 8080;
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(express.default.static(path.join(__dirname, 'dist')));
  
  app.get('/', (req, res) => {
    res.status(200).send('Paranoid Debug Server is running. If you see this, the imports were successful.');
  });
  
  server = app.listen(PORT, () => {
    console.log(`--- SUCCESS: Paranoid Debug Server listening on port ${PORT}. ---`);
  });

} catch (err) {
  console.error("--- FATAL STARTUP CATCH BLOCK ---");
  console.error("The application crashed during the import/setup phase.");
  console.error(err);
  process.exit(1);
}
// --- END: Paranoid Debugging Server ---
