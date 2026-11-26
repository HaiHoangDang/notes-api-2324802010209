require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./db');

const PORT = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || Buffer.byteLength(jwtSecret, 'utf8') < 32) {
  console.error('JWT_SECRET chưa được cấu hình hoặc ngắn hơn 32 byte.');
  console.error('Tạo bằng: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API đang chạy tại cổng ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Không kết nối được cơ sở dữ liệu:', err.message);
    process.exit(1);
  });
