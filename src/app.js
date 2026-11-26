const express = require('express');
const os = require('os');
const helmet = require('helmet');
const mongoose = require('mongoose');
const notesRouter = require('./routes/notes');
const authRouter = require('./routes/auth');

mongoose.set('sanitizeFilter', true);

const app = express();

// Codespaces/Vercel đứng sau một reverse proxy theo cấu hình bài thực hành.
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

app.use('/auth', authRouter);

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

// Express 5 tự chuyển lỗi từ route async đến middleware này.
app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Tài khoản hoặc dữ liệu đã tồn tại' });
  }

  const clientError = [
    'ValidationError',
    'CastError',
    'SyntaxError',
    'MulterError'
  ].includes(err.name)
    || err.code === 'LIMIT_FILE_SIZE'
    || err.status === 400;

  const status = clientError ? 400 : (err.status >= 400 && err.status < 500 ? err.status : 500);
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Lỗi máy chủ nội bộ'
    : err.message;

  return res.status(status).json({ error: message });
});

module.exports = app;
