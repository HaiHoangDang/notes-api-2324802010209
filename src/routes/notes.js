const express = require('express');
const multer = require('multer');
const Note = require('../models/note');
const { bucket } = require('../storage');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // tối đa 2 MB
});

// GET /notes hoặc GET /notes?tag=nosql
router.get('/', async (req, res) => {
  const filter = req.query.tag
    ? { tags: String(req.query.tag) }
    : {};

  const notes = await Note.find(filter)
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(notes);
});

// GET /notes/:id
router.get('/:id', async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  }

  res.json(note);
});

// POST /notes
router.post('/', async (req, res) => {
  const { title, content, tags } = req.body ?? {};
  const note = await Note.create({ title, content, tags });

  res.status(201).json(note);
});

// PUT /notes/:id
router.put('/:id', async (req, res) => {
  const { title, content, tags } = req.body ?? {};

  const note = await Note.findByIdAndUpdate(
    req.params.id,
    { title, content, tags },
    { new: true, runValidators: true }
  );

  if (!note) {
    return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  }

  res.json(note);
});

// DELETE /notes/:id
router.delete('/:id', async (req, res) => {
  const note = await Note.findByIdAndDelete(req.params.id);

  if (!note) {
    return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  }

  res.status(204).end();
});

// POST /notes/:id/attachment với multipart/form-data, trường file
router.post('/:id/attachment', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Thiếu tệp ở trường "file"' });
  }

  const note = await Note.findById(req.params.id);

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
