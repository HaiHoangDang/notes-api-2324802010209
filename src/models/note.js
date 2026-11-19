const { Schema, model } = require('mongoose');

const noteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },
    attachmentUrl: {
      type: String,
      trim: true
    },
    owner: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Chỉ mục đa khóa giúp truy vấn theo phần tử của mảng tags.
noteSchema.index({ tags: 1 });

module.exports = model('Note', noteSchema);
