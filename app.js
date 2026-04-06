const express = require('express');
const path = require('path');
const EventEmitter = require('events');

const app = express();
const port = process.env.PORT || 3000;

const chatEmitter = new EventEmitter();

// Serve static files
app.use(express.static(__dirname + '/public'));

/**
 * Plain text
 */
function respondText(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.end('hi');
}

/**
 * JSON response
 */
function respondJson(req, res) {
  res.json({
    text: 'hi',
    numbers: [1, 2, 3],
  });
}

/**
 * 404 handler
 */
function respondNotFound(req, res) {
  res.status(404).send('Not Found');
}

/**
 * Echo endpoint
 */
function respondEcho(req, res) {
  const { input = '' } = req.query;

  res.json({
    normal: input,
    shouty: input.toUpperCase(),
    charCount: input.length,
    backwards: input.split('').reverse().join(''),
  });
}

/**
 * Serve chat page
 */
function chatApp(req, res) {
  res.sendFile(path.join(__dirname, 'chat.html'));
}

/**
 * Chat receiver
 */
function respondChat(req, res) {
  const { message } = req.query;

  if (message) {
    chatEmitter.emit('message', message);
  }

  res.end();
}

/**
 * Server-Sent Events
 */
function respondSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
  });

  const onMessage = (msg) => {
    res.write(`data: ${msg}\n\n`);
  };

  chatEmitter.on('message', onMessage);

  req.on('close', () => {
    chatEmitter.off('message', onMessage);
  });
}

// Routes
app.get('/', chatApp);
app.get('/json', respondJson);
app.get('/echo', respondEcho);
app.get('/chat', respondChat);
app.get('/sse', respondSSE);
app.get('/text', respondText);

// 404 fallback
app.use(respondNotFound);

// Start server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});