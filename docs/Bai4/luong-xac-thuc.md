# Luồng xác thực và phân quyền

```mermaid
flowchart TD
  C[Client] -->|POST /auth/register| R[Auth Router]
  R -->|bcrypt hash| U[(MongoDB User)]
  C -->|POST /auth/login| L[Login limiter]
  L -->|bcrypt compare| U
  L -->|jwt.sign expiresIn 1h| T[JWT]
  C -->|Authorization Bearer JWT| M[requireAuth middleware]
  M -->|jwt.verify HS256| V{Token hợp lệ?}
  V -->|Không| E[401 Unauthorized]
  V -->|Có| N[Notes Router]
  N -->|Query có owner = JWT sub| D[(MongoDB Notes)]
  D -->|Chỉ tài liệu của chủ sở hữu| C
  N -->|Object upload, sau kiểm tra owner| S[(Supabase Storage)]
```

JWT xác định người dùng qua claim `sub`. Mọi truy vấn ghi chú trong API đều lọc thêm `owner: req.user.sub`; tài nguyên không thuộc người dùng được trả 404 để tránh tiết lộ sự tồn tại.
