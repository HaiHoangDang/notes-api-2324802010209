# Bài 3 – Kết quả thực nghiệm và minh chứng

## 1. Đo hiệu quả chỉ mục MongoDB

Số liệu do người thực hiện cung cấp từ lần chạy `npm run explain`:

| Phương pháp | docsExamined | returned | ms |
|---|---:|---:|---:|
| Quét toàn bộ (ép `$natural`) | 2.000 | 571 | 1 |
| Dùng chỉ mục `{ tags: 1 }` | 571 | 571 | 1 |

Hai truy vấn trả về cùng 571 tài liệu. Thời gian thực thi đều hiển thị 1 ms; với 2.000 tài liệu chưa thể kết luận tốc độ khác biệt chỉ từ con số thời gian này.

### Tính toán

- Số lần giảm khối lượng quét: `2.000 / 571 = 3,50 lần`
- Tỷ lệ giảm `docsExamined`: `(2.000 - 571) / 2.000 × 100 = 71,45%`

**Kết luận:** chỉ mục đa khóa `{ tags: 1 }` giảm số tài liệu phải kiểm tra từ 2.000 xuống 571, giảm 3,50 lần hoặc 71,45%. Đây là kết quả về số tài liệu được kiểm tra, không phải cam kết thời gian truy vấn giảm cùng tỷ lệ.

Lưu ý: ảnh minh họa SVG được dựng lại từ log người thực hiện cung cấp; cần bổ sung ảnh chụp trực tiếp Codespaces nếu giảng viên yêu cầu ảnh gốc.

## 2. Ngoại suy cho 2 triệu tài liệu

Giả sử tỷ lệ tag `docker` vẫn giống tập mẫu:

- Quét toàn bộ: khoảng 2.000.000 tài liệu
- Dùng chỉ mục: khoảng `2.000.000 × 571 / 2.000 = 571.000` tài liệu

Đây là phép ngoại suy theo giả định phân bố và độ chọn lọc không đổi, không phải phép đo trên 2 triệu tài liệu. Chỉ mục giảm công việc cho mỗi truy vấn, không làm tăng quota 100 thao tác/giây nêu trong đề.

## 3. Quan sát nhân bản Atlas

Lệnh MongoDB `hello` trả về replica set `atlas-83vxvw-shard-0` và 3 địa chỉ trong trường `hosts`. Trường `primary` xác định máy chủ Primary; hai địa chỉ còn lại là các thành viên khác của replica set. Kết quả xác nhận số thành viên là 3. Cần ảnh Atlas Overview/Metrics nếu cần minh chứng giao diện về vai trò từng member.

## 4. Trả lời phản biện

1. Khi collection tăng lên 2 triệu tài liệu, với giả định tỷ lệ tag giữ nguyên, quét toàn bộ ước tính kiểm tra 2.000.000 tài liệu còn dùng chỉ mục kiểm tra khoảng 571.000. Chỉ mục giảm khoảng 3,50 lần khối lượng kiểm tra, nhưng không tăng giới hạn 100 thao tác/giây. Đây là ước lượng, không phải benchmark 2 triệu tài liệu.
2. Supabase Storage chuyên lưu tệp nhị phân; MongoDB lưu thông tin ghi chú và URL tham chiếu. Cách tách này tránh làm tài liệu nghiệp vụ phình to, giảm dữ liệu cần đọc/ghi khi truy vấn ghi chú và tận dụng dịch vụ chuyên lưu trữ object.
3. Cả Atlas và HDFS nhân bản nhằm tăng tính sẵn sàng và khả năng chịu lỗi. Atlas đồng bộ dữ liệu replica set giữa các thành viên Primary/Secondary; HDFS nhân bản từng block tệp trên các DataNode, còn NameNode quản lý metadata và vị trí block.

## 5. Sơ đồ Atlas – HDFS

Xem [sơ đồ so sánh](./so-do-atlas-hdfs.md).
