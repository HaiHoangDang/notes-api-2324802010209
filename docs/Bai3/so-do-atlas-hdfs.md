# Sơ đồ so sánh nhân bản MongoDB Atlas và HDFS

## MongoDB Atlas – Replica Set

```mermaid
flowchart TB
  P["Primary\nNhận thao tác ghi"] -->|"Oplog / replication"| S1["Secondary 1\nBản sao dữ liệu"]
  P -->|"Oplog / replication"| S2["Secondary 2\nBản sao dữ liệu"]
```

## HDFS – Replication Factor = 3

```mermaid
flowchart TB
  NN["NameNode\nQuản lý metadata và vị trí block"]
  NN -. "Theo dõi vị trí bản sao" .-> D1["DataNode 1\nBlock A"]
  NN -. "Theo dõi vị trí bản sao" .-> D2["DataNode 2\nBlock A"]
  NN -. "Theo dõi vị trí bản sao" .-> D3["DataNode 3\nBlock A"]
```

| Tiêu chí | MongoDB Atlas | HDFS |
|---|---|---|
| Cơ chế | Replica Set | Block replication |
| Đơn vị nhân bản | Dữ liệu replica set giữa các thành viên database | Từng block của tệp trên các DataNode |
| Điều phối | Primary nhận ghi; Secondary đồng bộ | NameNode quản lý metadata/vị trí; DataNode lưu block |
| Mục tiêu | Tính sẵn sàng và chịu lỗi | Độ tin cậy và chịu lỗi khi lưu tệp phân tán |

Sơ đồ mô tả nguyên lý logic, không khẳng định vị trí vật lý hoặc failure domain thực tế.
