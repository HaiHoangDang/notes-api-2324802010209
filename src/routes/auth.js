const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

// Chỉ nhận chuỗi để chặn đối tượng/toán tử MongoDB trong email và password.
function readCredentials(body) {
  const { email, password } = body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return null;
  }

  // bcrypt xử lý tối đa 72 byte; từ chối mật khẩu dài hơn để tránh cắt cụt.
  const passwordBytes = Buffer.byteLength(password, 'utf8');
  if (password.length < 8 || passwordBytes > 72) {
    return null;
  }

  return { email: normalizedEmail, password };
}

router.post('/register', async (req, res) => {
  const cred = readCredentials(req.body);

  if (!cred) {
    return res.status(400).json({
      error: 'Cần email hợp lệ và mật khẩu từ 8 ký tự (tối đa 72 byte)'
    });
  }

  if (await User.exists({ email: cred.email })) {
    return res.status(409).json({ error: 'Email đã được đăng ký' });
  }

  const passwordHash = await bcrypt.hash(cred.password, 10);

  try {
    const user = await User.create({
      email: cred.email,
      passwordHash
    });

    return res.status(201).json({
      id: user._id,
      email: user.email
    });
  } catch (err) {
    // Xử lý trường hợp hai yêu cầu đăng ký cùng email chạy đồng thời.
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email đã được đăng ký' });
    }
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const cred = readCredentials(req.body);
  const user = cred
    ? await User.findOne({ email: cred.email }).select('+passwordHash')
    : null;

  const ok = user && await bcrypt.compare(cred.password, user.passwordHash);

  // Không tiết lộ email có tồn tại hay không.
  if (!ok) {
    return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    return res.status(500).json({ error: 'Máy chủ chưa cấu hình JWT_SECRET hợp lệ' });
  }

  const token = jwt.sign(
    { sub: user._id.toString(), email: user.email },
    secret,
    {
      expiresIn: '1h',
      algorithm: 'HS256'
    }
  );

  return res.json({ token });
});

module.exports = router;
