const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'Thiếu token' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    return res.status(500).json({ error: 'Máy chủ chưa cấu hình JWT_SECRET hợp lệ' });
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256']
    });

    if (!payload || typeof payload !== 'object' || typeof payload.sub !== 'string') {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
