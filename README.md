# Zanee Store

Zanee Store is a full-stack demo e-commerce project for computers and PC parts.

Core stack:
- Frontend: React
- Backend: Express
## Zanee Store

Zanee Store là một dự án demo thương mại điện tử toàn diện cho linh kiện máy tính và PC.

Ngăn xếp chính:
- Frontend: React
- Backend: Express
- Cơ sở dữ liệu: SQL Server
- Triển khai cloud: Fly.io
- Đóng gói: Docker
- Tích hợp CRM / nền tảng cloud: Salesforce

## Mô hình triển khai

Dự án đã được chuẩn bị để triển khai lên môi trường cloud thực tế:
- Một Docker image biên dịch frontend React và backend Express
- Fly.io chạy ứng dụng công khai
- Salesforce làm nền tảng tích hợp dữ liệu/CRM
- SQL Server vẫn là nguồn dữ liệu chính

## Các file chính

- `Dockerfile`: xây dựng image production toàn stack
- `fly.toml`: cấu hình ứng dụng Fly.io
- `docker-compose.yml`: chạy toàn bộ ứng dụng cục bộ (kèm SQL Server)
- `README_DEPLOY.md`: hướng dẫn triển khai rút gọn
- `DEPLOY_CLOUD.md`: checklist nộp báo cáo / cloud

## Phát triển cục bộ

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm start
```

Frontend có thể dùng `frontend/.env.example` làm mẫu để cấu hình API khi phát triển cục bộ.
