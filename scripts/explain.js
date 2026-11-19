require('dotenv').config();

const mongoose = require('mongoose');
const Note = require('../src/models/note');

function executionStats(result) {
  return Array.isArray(result) ? result[0].executionStats : result.executionStats;
}

async function explainQueries() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Thiếu biến môi trường MONGODB_URI');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    // Đảm bảo chỉ mục { tags: 1 } trong schema đã được tạo trên collection.
    await Note.syncIndexes();

    const fullScanResult = await Note.find({ tags: 'docker' })
      .hint({ $natural: 1 })
      .explain('executionStats');

    const indexedResult = await Note.find({ tags: 'docker' })
      .explain('executionStats');

    const scan = executionStats(fullScanResult);
    const indexed = executionStats(indexedResult);

    console.table({
      'Quét toàn bộ': {
        docsExamined: scan.totalDocsExamined,
        returned: scan.nReturned,
        ms: scan.executionTimeMillis
      },
      'Dùng chỉ mục': {
        docsExamined: indexed.totalDocsExamined,
        returned: indexed.nReturned,
        ms: indexed.executionTimeMillis
      }
    });

    const scanCount = scan.totalDocsExamined;
    const indexedCount = indexed.totalDocsExamined;

    if (indexedCount === 0) {
      console.log('Không thể tính tỉ số vì docsExamined của truy vấn có chỉ mục bằng 0');
    } else {
      const timesFewer = scanCount / indexedCount;
      const reductionPercent = scanCount === 0
        ? 0
        : ((scanCount - indexedCount) / scanCount) * 100;

      console.log(`Khối lượng quét giảm ${timesFewer.toFixed(2)} lần`);
      console.log(`Tỉ lệ giảm docsExamined: ${reductionPercent.toFixed(2)}%`);
    }

    if (scan.nReturned !== indexed.nReturned) {
      console.warn('Cảnh báo: hai truy vấn trả về số tài liệu khác nhau; cần kiểm tra lại phép đo');
    }
  } finally {
    await mongoose.disconnect();
  }
}

explainQueries().catch((err) => {
  console.error('Không đo được hiệu quả chỉ mục:', err.message);
  process.exitCode = 1;
});
