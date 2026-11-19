const express = require('express');
const os = require('os');
const notesRouter = require('./routes/notes');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Xin chào từ đám mây!',
    host: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    cpus: os.cpus().length,
    memoryGB: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
    uptimeSec: Math.round(os.uptime()),
    time: new Date().toISOString()
  });
});

app.use('/notes', notesRouter);

// Express 5 tự chuyển lỗi từ các route async đến middleware này.
app.use((err, req, res, next) => {
  console.error(err);

  const clientError = [
    'ValidationError',
    'CastError',
    'SyntaxError',
    'MulterError'
  ].includes(err.name)
    || err.code === 'LIMIT_FILE_SIZE'
    || err.status === 400;

  res.status(clientError ? 400 : 500).json({
    error: err.message
  });
});

module.exports = app;
