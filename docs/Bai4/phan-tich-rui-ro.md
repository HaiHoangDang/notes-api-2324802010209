# Bài 4 – Phân tích rủi ro và trách nhiệm chia sẻ

## 1. Rủi ro của Network Access 0.0.0.0/0

| Nội dung | Phân tích |
|---|---|
| Cấu hình | Network Access cho phép mọi địa chỉ IPv4 kết nối đến endpoint Atlas |
| Rủi ro cụ thể | Mở rộng bề mặt tấn công: bất kỳ máy nào trên Internet có thể thử kết nối đến endpoint; nếu thông tin xác thực bị lộ hoặc cấu hình quyền quá rộng, dữ liệu có nguy cơ bị truy cập trái phép |
| Biện pháp bù trừ trong bài | Database user riêng; quyền readWrite giới hạn ở database `notes`; mật khẩu ngẫu nhiên; TLS của kết nối Atlas; bí mật được lưu trong Codespaces Secrets, không commit vào mã; ứng dụng xác thực JWT và lọc dữ liệu theo owner |
| Hạn chế còn lại | `0.0.0.0/0` vẫn cho phép mọi IPv4 gửi yêu cầu kết nối. Các biện pháp bù trừ giảm rủi ro nhưng không thay thế giới hạn nguồn mạng |
| Phương án tốt hơn | Allowlist IP egress tĩnh nếu nền tảng hỗ trợ; VPC peering hoặc Private Endpoint khi có ngân sách và kiến trúc mạng phù hợp; kết hợp xoay vòng credential, giám sát truy cập và least privilege |

Không nên viết rằng JWT thay thế bảo vệ mạng: JWT bảo vệ API ở tầng ứng dụng, không ngăn một máy Internet kết nối trực tiếp đến MongoDB endpoint.

## 2. Câu hỏi phản biện

### Câu 1 – JWT bị lộ trong thời hạn một giờ

JWT trong bài là access token stateless có thời hạn một giờ và không lưu trạng thái trên máy chủ. Nếu token bị đánh cắp, người có token có thể giả danh người dùng và gọi các endpoint trong phạm vi token cho đến khi token hết hạn. Với cách triển khai hiện tại, máy chủ không có danh sách thu hồi từng token nên không thể vô hiệu hóa ngay một JWT cụ thể.

Một biện pháp là giảm thời hạn access token và dùng refresh token rotation có lưu trạng thái phía máy chủ; khi phát hiện bất thường, thu hồi refresh token/session để không cấp access token mới. Một phương án khác là lưu `jti` trong denylist hoặc kiểm tra `tokenVersion` của user trên máy chủ.

Chi phí: cần lưu và truy vấn trạng thái session/token, thêm logic refresh/rotation và xử lý đồng bộ khi logout/thu hồi; denylist còn phát sinh dung lượng lưu trữ và độ trễ kiểm tra. Với bài lab, thời hạn một giờ là đơn giản nhưng không có thu hồi tức thời.

### Câu 2 – Vì sao Alpine thường có ít lỗ hổng được báo cáo hơn?

Alpine Linux dùng nền hệ thống tối giản và thường có ít package hệ điều hành được cài sẵn hơn image Debian đầy đủ. Ít thành phần hơn thường làm giảm bề mặt tấn công và số package mà scanner cần kiểm tra.

Tuy nhiên, số lỗ hổng được báo cáo thấp hơn không tự động chứng minh image an toàn hơn. Kết quả phụ thuộc phiên bản package, dữ liệu CVE của scanner, cách package được nhận diện, cấu hình runtime và lỗ hổng trong ứng dụng Node. Cần so sánh đúng cùng ứng dụng, cùng thời điểm quét, cùng severity và cùng scanner database; vẫn phải cập nhật base image và dependency.

### Câu 3 – Mô hình trách nhiệm chia sẻ

**Nhà cung cấp MongoDB Atlas/Supabase:** bảo vệ hạ tầng vật lý, nền tảng cloud và các thành phần dịch vụ được quản lý thuộc phạm vi của họ; duy trì vận hành, vá lỗi và cung cấp các cơ chế bảo mật của dịch vụ theo mô hình dịch vụ.

**Nhóm phát triển:** chịu trách nhiệm về mã API, kiểm tra đầu vào, mật khẩu và JWT, phân quyền theo owner, quản lý/luân chuyển secrets, quyền của database user, Network Access/IP allowlist, cấu hình bucket và chính sách truy cập, dependency, Docker image, log và phản ứng với cảnh báo bảo mật.

Ranh giới cụ thể phụ thuộc dịch vụ và cấu hình đã chọn; dùng DBaaS không chuyển toàn bộ trách nhiệm bảo mật ứng dụng sang nhà cung cấp.
