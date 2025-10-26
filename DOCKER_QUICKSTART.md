# 🚀 Quick Start - Docker

## Chạy Ứng Dụng (Development Mode)

```bash
# 1. Tạo file environment variables
copy .env.example .env

# 2. Chỉnh sửa .env với thông tin của bạn (nếu cần)

# 3. Khởi động tất cả services
docker-compose -f docker-compose.dev.yml up -d

# 4. Xem logs
docker-compose -f docker-compose.dev.yml logs -f
```

## ✅ Truy Cập Ứng Dụng

- **Frontend (Vite):** http://localhost:5173
- **Backend API:** http://localhost:5000
- **MongoDB:** localhost:27017 (admin/admin123)

## 📊 Các Lệnh Hữu Ích

```bash
# Xem trạng thái containers
docker-compose -f docker-compose.dev.yml ps

# Xem logs của một service
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs frontend

# Dừng tất cả
docker-compose -f docker-compose.dev.yml down

# Seed dữ liệu
docker exec -it vietjet_backend_dev npm run seed

# Vào container
docker exec -it vietjet_backend_dev sh
docker exec -it vietjet_frontend_dev sh
```

 