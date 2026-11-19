const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    throw new Error('Thiếu biến môi trường MONGODB_URI');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('Đã kết nối MongoDB Atlas');
  return mongoose.connection;
}

module.exports = { connectDB };
