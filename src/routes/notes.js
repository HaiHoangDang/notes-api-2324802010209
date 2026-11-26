const express = require('express');
const multer = require('multer');
const Note = require('../models/note');
const { bucket } = require('../storage');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Mọi endpoint /notes đều yêu cầu JWT hợp lệ.
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // tối đa 2 MB
});

// GET /notes hoặc GET /notes?tag=nosql — chỉ lấy ghi chú của người đăng nhập.
router.get('/', async (req, res) => {
  const filter = { owner: req.user.sub };

  if (req.query.tag) {
    filter.tags = String(req.query.tag);
  }

  const notes = await Note.find(filter)
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(notes);
});

// GET /notes/:id — ghi chú của người khác được trả về 404.
router.get('/:id', async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    owner: req.user.sub
  });

  if (!note) {
    return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  }

  res.json(note);
});

// POST /notes — owner được lấy từ token, không nhận từ request body.
router.post('/', async (req, res) => {
  const { title, content, tags } = req.body ?? {};

  const note = await Note.create({
    title,
    content,
    tags,
    owner: req.user.sub
  });

  res.status(201).json(note);
});

// PUT /notes/:id — chỉ chủ sở hữu mới cập nhật được.
router.put('/:id', async (req, res) => {
  const { title, content, tags } = req.body ?? {};

  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.sub },
    { title, content, tags },
    { new: true, runValidators: true }
  );

  if (!note) {
    return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  }

  res.json(note);
});

// DELETE /notes/:id — chỉ chủ sở hữu mới xóa được.
router.delete('/:id', async (req, res) => {
  const note = await Note.findOneAndDelete({
    _id: req.params.id,
    owner: req.user.sub
  });

  if (!note) {
    return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  }

  res.status(204).end();
});

// POST /notes/:id/attachment — chỉ chủ sở hữu mới tải tệp vào ghi chú được.
router.post('/:id/attachment', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Thiếu tệp ở trường "file"' });
  }

  const note = await Note.findOne({
    _id: req.params.id,
    owner: req.user.sub
  });

  if (!note) {
    return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  }

  const safeName = req.file.originalname
    .normalize('NFD')
    .replace(/[^\w.-]/g, '_');

  const objectPath = `${note._id}/${Date.now()}-${safeName || 'attachment'}`;
  const storage = bucket();

  const { error } = await storage.upload(objectPath, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false
  });

  if (error) {
    throw error;
  }

  note.attachmentUrl = storage.getPublicUrl(objectPath).data.publicUrl;
  await note.save();

  res.json(note);
});

module.exports = router;
