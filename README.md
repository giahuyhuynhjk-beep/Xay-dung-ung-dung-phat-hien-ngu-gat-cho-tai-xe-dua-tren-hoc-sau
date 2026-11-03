# PREDRIVE AI

PREDRIVE AI là dự án nghiên cứu thử nghiệm ứng dụng PWA kết nối với backend Python để giám sát tài xế. Backend hiện kiểm tra các khung hình gửi lên và trả về trạng thái `NOT_EVALUATED` (`mock-v0`). Dự án **chưa tích hợp mô hình AI** để nhận diện tình trạng tài xế và không lưu ảnh/video.

## Chạy dự án trên Windows

Cài backend một lần:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..
```

Cài frontend một lần:

```powershell
cd frontend
npm.cmd ci
cd ..
```

Từ thư mục gốc, khởi động frontend và backend cùng lúc:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Mở giao diện tại [http://127.0.0.1:5173](http://127.0.0.1:5173). Frontend gọi API tại cổng `8000` và kết nối tới backend theo hostname hiện tại. Chạy kiểm thử backend bằng lệnh:

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests -q
```

## Phạm vi và an toàn

Đây là bản thử nghiệm, **không phải thiết bị an toàn giao thông đã được chứng nhận**. Chỉ thử bằng video ghi sẵn, dữ liệu mô phỏng hoặc người tham gia đã đồng ý khi phương tiện đang đứng yên. Trình duyệt trên điện thoại yêu cầu HTTPS để truy cập camera. Nếu triển khai công khai, cần HTTPS/WSS, xác thực và phân quyền người dùng cùng các biện pháp bảo vệ quyền riêng tư phù hợp.

Không đưa bí mật, file `.env` hoặc hình ảnh riêng tư của tài xế lên Git.

## Tài liệu

- [Tổng quan dự án](PROJECT_CONTEXT.md)
- [Tài liệu backend](BACKEND_CONTEXT.md)
- [Tài liệu frontend](FRONTEND_CONTEXT.md)
- [Quy ước API](docs/api-contract.md)
