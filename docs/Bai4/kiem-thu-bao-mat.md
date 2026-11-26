# Bài 4 – Hướng dẫn kiểm thử và minh chứng

## 1. Chuẩn bị môi trường

Sau khi cập nhật repository:

```bash
git pull --ff-only origin main
npm install
```

Tạo một JWT secret ngẫu nhiên 32 byte:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Thêm `MONGODB_URI`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` và `JWT_SECRET` trong GitHub → Settings → Codespaces → Secrets; cấp quyền sử dụng cho repository này. Sau đó Rebuild Codespace để các biến được đưa vào môi trường. Sau khi xác minh biến đã có, xóa tệp `.env` cục bộ. Không in giá trị bí mật ra terminal hoặc ảnh chụp.

Kiểm tra chỉ tên biến:

```bash
node -e "for (const k of ['MONGODB_URI','SUPABASE_URL','SUPABASE_SERVICE_KEY','JWT_SECRET']) console.log(k, process.env[k] ? 'OK' : 'MISSING')"
```

Yêu cầu `JWT_SECRET` có ít nhất 32 byte. `dotenv` chỉ dùng làm fallback cho môi trường local; biến môi trường Codespaces có sẵn được ưu tiên vì dotenv không ghi đè mặc định.

## 2. Kiểm tra bí mật trong lịch sử Git

Chạy lệnh theo đề bài:

```bash
git log --all -p | grep -iE "mongodb\\+srv|supabase|secret"
```

Lệnh này có thể tìm thấy tên biến và chuỗi mẫu có placeholder. Đọc kết quả để phân biệt placeholder như `<password>`, `<cluster>`, `<secret-key>` với credential thật. Không chụp hoặc dán dòng có credential thật. Nếu phát hiện credential thật trong bất kỳ commit nào, phải thu hồi/đổi credential trước; xóa file hoặc tạo commit mới không làm vô hiệu credential đã lộ.

Kiểm tra tệp local:

```bash
git check-ignore -v .env
git ls-files .env
git status --short
```

Kết quả mong đợi: `git check-ignore` chỉ ra quy tắc ignore; `git ls-files .env` không in gì; `.env` không xuất hiện trong `git status`.

## 3. Khởi động và xác nhận bảo vệ HTTP

```bash
npm start
```

Trong terminal khác:

```bash
curl -i http://localhost:3000/
```

GET / vẫn công khai và phải trả HTTP 200. Quan sát các response header như `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy` hoặc các header Helmet phù hợp.

## 4. Đăng ký hai người dùng và kiểm thử quyền sở hữu

Thực hiện các lệnh dưới đây trong cùng một terminal shell thứ hai để giữ các biến `TOKEN_A`, `TOKEN_B`, `NOTE_A_ID`. Mỗi email cần là duy nhất trong database. Dùng hậu tố thời gian để tránh trùng:

```bash
SUFFIX=$(date +%s)
EMAIL_A="sv1-$SUFFIX@tdmu.edu.vn"
EMAIL_B="sv2-$SUFFIX@tdmu.edu.vn"
PASSWORD='matkhau123'

curl -i -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_A\",\"password\":\"$PASSWORD\"}"

TOKEN_A=$(curl -sS -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_A\",\"password\":\"$PASSWORD\"}" \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

curl -i -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_B\",\"password\":\"$PASSWORD\"}"

TOKEN_B=$(curl -sS -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_B\",\"password\":\"$PASSWORD\"}" \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")
```

Mong đợi: mỗi đăng ký HTTP 201 và mỗi đăng nhập trả JSON có `token`. Không in token ra màn hình hoặc chụp ảnh chứa token.

Tạo một ghi chú thuộc người dùng A:

```bash
NOTE_A_ID=$(curl -sS -X POST http://localhost:3000/notes \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"title":"Ghi chú riêng của A","content":"Dữ liệu kiểm thử phân quyền","tags":["security"]}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8'))._id")

echo "Đã tạo ghi chú kiểm thử cho A"
```

Kiểm tra không token, người A và người B:

```bash
# Không token: phải là 401
curl -sS -o /dev/null -w "Khong token: %{http_code}\\n" \
  http://localhost:3000/notes

# A đọc ghi chú của A: phải là 200
curl -sS -o /dev/null -w "A doc ghi chu A: %{http_code}\\n" \
  "http://localhost:3000/notes/$NOTE_A_ID" \
  -H "Authorization: Bearer $TOKEN_A"

# B đọc ghi chú của A: phải là 404, không phải 403
curl -sS -o /dev/null -w "B doc ghi chu A: %{http_code}\\n" \
  "http://localhost:3000/notes/$NOTE_A_ID" \
  -H "Authorization: Bearer $TOKEN_B"

# Token giả: phải là 401
curl -sS -o /dev/null -w "Token gia: %{http_code}\\n" \
  http://localhost:3000/notes \
  -H "Authorization: Bearer token-khong-hop-le"
```

Mong đợi lần lượt: 401, 200, 404, 401. Có thể kiểm tra thêm GET danh sách của B để xác nhận danh sách không chứa ghi chú của A.

## 5. Kiểm tra NoSQL injection ở đăng nhập

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$gt":""},"password":"x"}'
```

Mong đợi HTTP 401 với thông báo chung `Sai email hoặc mật khẩu`. API không chấp nhận object thay cho email/password dạng chuỗi.

## 6. Kiểm tra rate limit

Limiter áp dụng riêng cho endpoint đăng nhập, giới hạn 20 lần đăng nhập thất bại trong 15 phút và bỏ qua các lần đăng nhập thành công. Để minh chứng rõ lần thứ 21 nhận 429, hãy khởi động lại tiến trình API trước phép thử để xóa bộ đếm MemoryStore trong môi trường lab, rồi không thực hiện đăng nhập nào khác trước vòng lặp:

```bash
for i in $(seq 1 25); do
  code=$(curl -sS -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"sai@tdmu.edu.vn","password":"saimatkhau"}')
  printf "%s " "$code"
done
echo
```

Mong đợi: 20 lần đầu trả 401, từ lần thứ 21 trở đi trả 429. Bộ nhớ rate limit mặc định chỉ tồn tại trong tiến trình Node; với nhiều instance production cần dùng store dùng chung như Redis để bộ đếm không bị tách giữa các instance.

## 7. Quét dependency và image

Sau khi `npm install` cập nhật `package-lock.json`:

```bash
npm audit --omit=dev
```

Lưu lại tổng số vulnerability theo mức độ và các package bị ảnh hưởng. Không mặc định chạy `npm audit fix --force`; đọc advisory và đánh giá breaking changes trước.

Build image Alpine và image Node Debian:

```bash
docker build -t notes-api:alpine .
sed 's/node:22-alpine/node:22/' Dockerfile > Dockerfile.full
docker build -f Dockerfile.full -t notes-api:full .
```

Quét HIGH và CRITICAL bằng Trivy:

```bash
for t in alpine full; do
  echo "===== notes-api:$t ====="
  docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy:latest image --quiet --severity HIGH,CRITICAL \
    notes-api:$t | grep "Total:"
done
```

Lấy kích thước image:

```bash
for t in alpine full; do
  printf "%s: " "$t"
  docker image inspect --format='{{.Size}}' "notes-api:$t" \
    | awk '{printf "%.2f MB\\n", $1/1024/1024}'
done
```

Điền số liệu quan sát được vào bảng:

| Image | Kích thước | HIGH | CRITICAL |
|---|---:|---:|---:|
| `notes-api:alpine` | Điền số đo | Điền số đo | Điền số đo |
| `notes-api:full` | Điền số đo | Điền số đo | Điền số đo |

Không tự điền số liệu minh họa. Kết quả phụ thuộc thời điểm build, digest base image, package lock và cơ sở dữ liệu lỗ hổng Trivy.

Sau khi quét:

```bash
rm -f Dockerfile.full
```

## 8. GitHub Secret Protection và Dependabot

Trên GitHub repository:

1. Mở Settings → Advanced Security (hoặc Code security)
2. Bật Secret Protection/Secret scanning
3. Bật Push protection
4. Bật Dependabot alerts
5. Mở tab Security → Dependabot để xem cảnh báo dependency (nếu có)

Repository đã có `.github/dependabot.yml` để Dependabot kiểm tra cập nhật npm và Docker hàng tuần. File cấu hình không tự bật Dependabot alerts hoặc Push protection; cần bật trong Settings.

Với repository public, GitHub hiện cung cấp các tính năng security phù hợp theo trang tài liệu GitHub. Ghi lại trạng thái bật và chụp ảnh trang Settings/Security để làm minh chứng.

## 9. Minh chứng cần lưu

- Ảnh Codespaces Secrets có tên biến nhưng che toàn bộ giá trị
- Ảnh `git check-ignore`, `git ls-files .env` và `git status --short`
- Ảnh đăng ký/đăng nhập thành công (che token)
- Ảnh các status: không token 401; A đọc dữ liệu A 200; B đọc dữ liệu A 404; token giả 401
- Ảnh object injection bị từ chối 401
- Ảnh vòng lặp rate limit cho thấy 401 rồi 429
- Ảnh `npm audit --omit=dev`
- Ảnh hai lần Trivy và bảng kích thước image
- Ảnh GitHub Settings thể hiện Secret Protection, Push protection, Dependabot alerts đã bật
- Ảnh bảng phân tích rủi ro ở `phan-tich-rui-ro.md`

Không chụp token, JWT_SECRET, MONGODB_URI hoặc khóa Supabase trong bất kỳ minh chứng nào.
