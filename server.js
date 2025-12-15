import express from 'express';

const app = express();
const PORT = process.env.PORT || 8080;

console.log(`--- DEBUG: Attempting to start a simple test server on port ${PORT} ---`);

// A simple endpoint to prove the server is running.
app.get('/', (req, res) => {
  console.log("--- DEBUG: Test server '/' endpoint was successfully hit. ---");
  res.status(200).send('Test server is running successfully!');
});

app.listen(PORT, () => {
  console.log(`--- SUCCESS: Test server is listening on port ${PORT} ---`);
  console.log('If you see this message, the basic container and port configuration are correct.');
});

// Adding a catch-all for any uncaught errors during startup
process.on('uncaughtException', err => {
  console.error('--- FATAL: An uncaught exception occurred! ---', err);
  process.exit(1);
});
