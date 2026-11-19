# Bài 3 – Kết quả thực nghiệm và minh chứng

## 1. Đo hiệu quả chỉ mục MongoDB

Dữ liệu được cung cấp từ lần chạy thực tế `npm run explain` trên Codespaces:

| Phương pháp | docsExamined | returned | executionTimeMillis |
|---|---:|---:|---:|
| Quét toàn bộ (ép `$natural`) | 2.000 | 571 | 1 |
| Dùng chỉ mục `{ tags: 1 }` | 571 | 571 | 1 |

Hai truy vấn trả về cùng 571 tài liệu. Chênh lệch thời gian đo được là 0 ms theo giá trị làm tròn mà MongoDB báo cáo; với tập dữ liệu 2.000 tài liệu, chưa thể kết luận chỉ mục làm truy vấn nhanh hơn về thời gian chỉ từ lần đo này.

### Tính toán

- Số lần giảm khối lượng quét: `2.000 / 571 = 3,50 lần`
- Tỷ lệ giảm `docsExamined`: `(2.000 - 571) / 2.000 × 100 = 71,45%`

**Kết luận:** trong lần đo này, chỉ mục đa khóa `{ tags: 1 }` giảm số tài liệu phải kiểm tra từ 2.000 xuống 571, tương đương giảm 3,50 lần hoặc 71,45%. Đây là kết quả `docsExamined`, không phải cam kết thời gian truy vấn giảm cùng tỷ lệ.

Ảnh `explain-output.svg` trong thư mục này là bản trình bày lại từ log terminal do người thực hiện cung cấp, không phải ảnh chụp trực tiếp Codespaces. Nếu giảng viên yêu cầu ảnh chụp màn hình gốc, cần bổ sung ảnh chụp trực tiếp terminal hiển thị kết quả `npm run explain`.

## 2. Ước lượng cho 2 triệu tài liệu

Giả sử tỷ lệ tài liệu khớp truy vấn vẫn tương tự lần đo 2.000 tài liệu:

- Quét toàn bộ có thể kiểm tra khoảng 2.000.000 tài liệu
- Sử dụng chỉ mục có thể kiểm tra khoảng `2.000.000 × 571 / 2.000 = 571.000` tài liệu

Đây là phép ngoại suy theo giả định phân bố tag và độ chọn lọc của truy vấn không đổi, không phải kết quả benchmark trên collection 2 triệu tài liệu. Chỉ mục giảm lượng tài liệu cần kiểm tra cho mỗi truy vấn; nó không làm thay đổi quota 100 thao tác/giây được nêu trong đề bài. Nếu số yêu cầu vượt quota, giới hạn dịch vụ vẫn có thể bị chạm dù từng truy vấn đã dùng chỉ mục.

## 3. Quan sát nhân bản Atlas

Kết quả lệnh `hello` từ cluster:

- Replica set: `atlas-83vxvw-shard-0`
- Số thành viên trong trường `hosts`: **3**
- Thành viên Primary được chỉ ra trong trường `primary`
- Hai địa chỉ còn lại là các thành viên khác trong cùng replica set

Kết quả này xác nhận replica set có 3 thành viên. Ảnh Atlas Overview/Metrics nên được bổ sung nếu báo cáo cần minh chứng trực quan vai trò Primary và Secondary.

## 4. Giải thích mô hình Atlas – HDFS

Cả hai mô hình đều dùng nhiều bản sao để tăng độ tin cậy, tính sẵn sàng và khả năng chịu lỗi. Tuy nhiên, đơn vị nhân bản khác nhau:

- MongoDB Atlas sao chép dữ liệu của replica set giữa các thành viên database: một Primary và các Secondary
- HDFS chia tệp thành các block và nhân bản từng block lên các DataNode; NameNode quản lý metadata và vị trí các block

Sơ đồ chi tiết: [so-do-atlas-hdfs.md](./so-do-atlas-hdfs.md)

## 5. Trả lời câu hỏi phản biện

### Câu 1

Kết quả đo với 2.000 tài liệu cho thấy quét toàn bộ kiểm tra 2.000 tài liệu, còn truy vấn có chỉ mục kiểm tra 571 tài liệu. Nếu collection tăng lên 2 triệu tài liệu và phân bố tag giữ nguyên, có thể ước lượng tương ứng khoảng 2.000.000 so với 571.000 tài liệu được kiểm tra. Chỉ mục giảm khoảng 3,50 lần lượng kiểm tra trong giả định này. Với gói miễn phí giới hạn 100 thao tác/giây theo đề bài, chỉ mục không tăng quota đó; nó giúp giảm công việc trên mỗi truy vấn và có thể giảm áp lực CPU/I/O, nhưng hệ thống vẫn chịu giới hạn số thao tác/giây. Đây là ước lượng, không phải phép đo trên 2 triệu tài liệu.

### Câu 2

Supabase Storage được dùng để lưu tệp nhị phân, còn MongoDB lưu dữ liệu ghi chú và URL tham chiếu đến tệp. Cách tách này tránh làm tài liệu nghiệp vụ phình to, giảm dữ liệu phải đọc/ghi khi truy vấn ghi chú và dùng đúng dịch vụ chuyên lưu trữ/ phục vụ object. MongoDB chỉ cần giữ `attachmentUrl` để ứng dụng truy xuất tệp khi cần.

### Câu 3

Mục tiêu chung của nhân bản ba bản là tăng khả năng chịu lỗi và duy trì khả năng truy cập khi một máy hoặc bản sao gặp sự cố. MongoDB Atlas nhân bản dữ liệu ở cấp replica set giữa các thành viên database; HDFS nhân bản ở cấp từng block của tệp trên các DataNode. Vì vậy, một thành viên Atlas không tương đương với một block HDFS.

## 6. Tệp minh chứng

- `explain-output.svg`: trình bày lại bảng số liệu từ log người thực hiện cung cấp
- `so-do-atlas-hdfs.md`: sơ đồ Mermaid và bảng so sánh
- Ảnh chụp trực tiếp Codespaces và Atlas Overview/Metrics: cần người thực hiện chụp bổ sung nếu yêu cầu nộp bài bắt buộc ảnh gốc
