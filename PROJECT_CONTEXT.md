# PREDRIVE AI — PROJECT CONTEXT (TỔNG QUAN CHUNG)

> Phiên bản: 1.0 | Ngày: 02/11/2026 | Trạng thái: **Đang thiết kế / MVP nghiên cứu**, chưa có mô hình hay sản phẩm được kiểm chứng.
>
> **Nguồn thông tin chung cho cả ba thành viên và Codex.** Đọc file này trước, sau đó đọc `AI_CONTEXT.md`, `FRONTEND_CONTEXT.md` hoặc `BACKEND_CONTEXT.md` theo vai trò. Nếu có xung đột về API, tài liệu chuẩn là `docs/api-contract.md` sau khi cả nhóm thống nhất.

## 1. Tầm nhìn và bài toán

**PREDRIVE AI** là nền tảng nghiên cứu giám sát dấu hiệu buồn ngủ và mất tập trung của người điều khiển **ô tô con, xe buýt/xe khách, xe tải, xe đầu kéo/container** (không nhắm tới xe máy). Điện thoại gắn cố định hướng camera về người lái; trình duyệt mở giao diện PWA và chủ động bắt đầu/kết thúc phiên giám sát. Dữ liệu hình ảnh được truyền đến máy chủ Python để phân tích. Khi phát hiện dấu hiệu cần chú ý, hệ thống phản hồi để PWA cảnh báo âm thanh và ghi sự kiện. Trong tương lai, quản trị viên có thể xem thống kê và nhận thông báo các sự kiện nghiêm trọng.

**Hai nhiệm vụ AI phải phân biệt:**
1. **Detection hiện tại (MVP AI):** phát hiện dấu hiệu quan sát được như mắt nhắm kéo dài, gật đầu, hướng đầu lệch bất thường, mất tập trung; chưa khẳng định buồn ngủ chỉ từ một chỉ số.
2. **Early risk prediction (nghiên cứu nâng cao):** ước lượng nguy cơ suy giảm tỉnh táo trong một khoảng thời gian *tương lai*, chỉ triển khai sau khi có dữ liệu thời gian và nhãn tham chiếu đáng tin cậy. Không gọi EAR threshold là 'dự đoán sớm'.

## 2. Phạm vi MVP và ngoài phạm vi

**MVP ưu tiên:** một PWA responsive chạy Safari iPhone/Chrome Android (foreground), quyền camera trước, nút bắt đầu/kết thúc, stream frame thử nghiệm, FastAPI/WebSocket, trạng thái kết nối, phản hồi AI/mô phỏng được đánh dấu rõ, cảnh báo âm thanh khi có kết quả thật, lưu tối thiểu metadata sau khi xây xong pipeline, rồi mở rộng dashboard.

**Chưa làm ngay:** app native iOS/Android, nhận diện bằng camera nhiệt/NIR chuyên dụng, huấn luyện mô hình nền tảng từ đầu, Mamba/Transformer quy mô lớn, website admin đầy đủ từ tuần đầu, AI hoàn toàn offline, giám sát liên tục khi khóa màn hình, dự đoán trước 5 phút chưa được kiểm chứng, chức năng can thiệp điều khiển xe.

**Ràng buộc:** mọi AI inference ở **server**, điện thoại chủ yếu cung cấp UI/camera/truyền frame/âm thanh. Frontend không cần mang trọng số PyTorch. Server thử nghiệm ban đầu chạy trên PC/laptop trong mạng kiểm soát; cloud GPU và phí vận hành chỉ đánh giá khi cần.

## 3. Kiến trúc tổng thể

```text
[Safari iOS / Chrome Android]
         React + TypeScript + PWA
  getUserMedia(camera) | Start/Stop | Audio
                  |
          HTTPS + WSS (khi public)
                  v
          [FastAPI Gateway]
   Session | Validation | Rate Limit | Timeout
                  |
                  v
           [Python AI Module]
     Image quality -> Face/eyes/head
       -> Current state/temporal state
          -> Alert decision
                  |
        results via WebSocket
                  v
          [PWA - local alert]

    FastAPI -> [DB: trips/events/alerts]
                   |
                   v
          [Admin web dashboard]
                   |
          [Notification worker]
                 Telegram/Push
```

**Quy tắc quan trọng:** cảnh báo tại điện thoại không chờ Telegram hay admin. Tuy nhiên phiên bản server-only **không nhận diện được buồn ngủ khi mất mạng**: lúc đó phải thông báo `MONITORING_UNAVAILABLE`, không đánh tráo là `NORMAL`. PWA cũng không đảm bảo camera chạy khi tắt màn hình/chuyển nền; đây là prototype nghiên cứu, **không** phải thiết bị an toàn đã được chứng nhận.

## 4. Công nghệ đã thống nhất

| Khối | Stack | Ghi chú |
|---|---|---|
| PWA/Driver + Admin | React, TypeScript, Vite, Tailwind CSS | Một frontend, giao diện theo role |
| Camera | `navigator.mediaDevices.getUserMedia` | Camera trước, HTTPS/secure context |
| Live transport | WebSocket | MVP JSON/JPEG base64 giới hạn 3–5 FPS để kiểm thử kết nối; sau đánh giá có thể dùng binary/WebRTC |
| API / session | FastAPI, Pydantic, Uvicorn | Python, WebSocket + REST |
| AI | OpenCV, MediaPipe (nếu tương thích), PyTorch, NumPy | Module Python độc lập backend |
| Temporal | GRU/TCN sau baseline | Chỉ train với dữ liệu có nhãn thích hợp |
| Low-light | original vs CLAHE vs Zero-DCE++ | Chạy có điều kiện; so sánh ảnh gốc và downstream metrics |
| Database | PostgreSQL/Supabase về sau; SQLite nội bộ nếu cần | Chỉ lưu metadata mặc định |
| Admin | React + Recharts | Thống kê theo giờ giám sát hợp lệ |
| Alerts admin | Telegram qua backend / push | Secret server-side, có retry/ack |

## 5. Phân công 3 thành viên — không chồng chéo

| Thành viên | Chịu trách nhiệm | Khu vực source | Bàn giao đầu tiên |
|---|---|---|---|
| TV1 — AI/Deep Learning | Dataset, baseline, inference, training/evaluation, low-light | `ai/` | Hàm phân tích frame + test + README; trả `NOT_EVALUATED` nếu chưa có AI đủ điều kiện |
| TV2 — Frontend/PWA | UI tài xế, camera, truyền frame, trạng thái/âm thanh, admin UI sau | `frontend/` | PWA camera + WS mock rõ nhãn + xử lý mất mạng |
| TV3 — Backend/System | REST, WebSocket, quản lý phiên, DB/Auth, AI adapter, notification | `backend/`, `database/`, `docs/api-contract.md` cùng nhóm | FastAPI health/session/WS + kiểm tra payload + mock response |

Mỗi người làm nhánh riêng: `feature/ai-model`, `feature/frontend`, `feature/backend`. Mọi thay đổi schema/enum phải trao đổi cả nhóm. Các tài liệu chung do cả nhóm review trước khi merge.

## 6. API contract MVP v0.1 — bắt buộc đồng nhất

- `GET /health`: kiểm tra backend đang chạy.
- `POST /api/v1/sessions`: tạo phiên giám sát và trả về `session_id` UUID.
- `WS /ws/monitor?session_id=<uuid>`: truyền frame và nhận kết quả (chỉ ở môi trường dev có kiểm soát; cần auth trước khi public).
- Mỗi message frame chứa JPEG **base64** để debug dễ trong MVP, không ghi video thô ở server.

**Client → Server**

```json
{
  "type": "frame",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "frame_id": 12,
  "captured_at": "2026-11-02T03:00:00.000Z",
  "image_format": "jpeg",
  "image_base64": "<base64-jpeg>"
}
```

**Server → Client khi CHƯA tích hợp mô hình AI**

```json
{
  "type": "analysis_result",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "frame_id": 12,
  "captured_at": "2026-11-02T03:00:00.000Z",
  "processed_at": "2026-11-02T03:00:00.120Z",
  "model_version": "mock-v0",
  "state": "NOT_EVALUATED",
  "alert_level": "NONE",
  "face_visible": null,
  "image_quality": "UNKNOWN",
  "risk_score": null,
  "processing_ms": 25
}
```

**Enums**
- `state`: `NOT_EVALUATED | NORMAL | DISTRACTED | DROWSINESS_SIGNS | CRITICAL | MONITORING_UNAVAILABLE`
- `alert_level`: `NONE | INFO | WARNING | CRITICAL`
- `image_quality`: `GOOD | LOW_LIGHT | BLURRY | TOO_DARK | UNKNOWN`
- `risk_score`: `null` cho đến khi có mô hình được hiệu chỉnh, nếu có thì số trong `[0,1]`. Không mặc định đó là xác suất đã được xác thực.
- `MONITORING_UNAVAILABLE` kèm mã lý do rõ như `camera_denied`, `camera_stopped`, `network_lost`, `stale_result`, `server_error` tại lớp thông báo trạng thái.

Mọi timestamp theo ISO 8601 UTC. Client phải kiểm tra `session_id`, `frame_id`, thời gian nhận và bỏ kết quả cũ/hết hạn. Server giới hạn kích thước/độ phân giải/FPS, không tin role/driver_id chỉ do client tự cung cấp. Schema chỉ thay đổi theo phiên bản và được cập nhật ở `docs/api-contract.md`.

## 7. Dữ liệu dự định lưu & mục đích

- `users`: tài khoản, role, tổ chức — xác thực và phân quyền.
- `drivers`, `vehicles`: liên kết tài xế/phương tiện, **không** dùng AI nhận diện danh tính từ khuôn mặt.
- `trips`: `trip_id`, `driver_id`, `started_at`, `ended_at`, `valid_monitoring_seconds`, `model_version` — theo dõi chuyến và mức độ bao phủ giám sát.
- `events`: `event_id`, `trip_id`, `event_type`, `severity`, `detected_at`, `image_quality`, `model_version`, `review_status` — lưu cảnh báo/kiểm tra lỗi mô hình.
- `alerts`: `alert_id`, `event_id`, `delivery_status`, `acknowledged_at` — quản lý thông báo admin và chống gửi trùng.

Mục đích: thống kê sự kiện / **giờ giám sát hợp lệ** thay vì đếm thô, phát hiện các khung giờ có nhiều cảnh báo, phân tích lỗi theo ánh sáng/phiên bản AI, đánh giá mô hình và hỗ trợ admin xem xét. **Không tự động kết luận lỗi tài xế hay dùng điểm AI chưa kiểm định để xử phạt.**

Không lưu/upload video khuôn mặt mặc định. Nếu nghiên cứu cần lưu mẫu khó, phải có đồng ý rõ ràng, giới hạn mục đích, thời hạn lưu, quyền truy cập/xóa và mã hóa. Không commit token, secrets, `.env` thật hoặc dữ liệu mặt lên GitHub.

## 8. Lộ trình tích hợp (tuần tự)

1. **M1: Camera PWA ↔ FastAPI** — quyền camera, preview, create session, gửi frame, mock `NOT_EVALUATED`, đo latency, xử lý disconnect. Không cần AI/DB/admin.
2. **M2: AI baseline** — thay mock bằng phân tích dấu hiệu có kiểm thử; UI chỉ cảnh báo theo kết quả được xác thực là thật. Kiểm tra cả `MONITORING_UNAVAILABLE`.
3. **M3: Database & auth** — account, role, chuyến đi/sự kiện, bảo mật và đồng bộ metadata.
4. **M4: Dashboard & Telegram** — thống kê, xử lý sự kiện, thông báo server-side với idempotency.
5. **M5: Low-light research** — original/CLAHE/Zero-DCE++, đánh giá trên tập thiếu sáng theo người lái mới; đo FPS/latency/recall.
6. **M6: Early prediction** — dữ liệu có nhãn tương lai; GRU/TCN; đo lead time, false alarms/hour, calibration.

**M1 nghiệm thu khi:** website chạy mobile-first qua HTTPS, camera cấp quyền và dừng đúng lúc; server xử lý WS, echo metadata đúng contract, frame lỗi không crash; UI hiển thị rõ `NOT_EVALUATED`; đo độ trễ thực tế; mất mạng/camera dừng không còn hiển thị giám sát bình thường.

## 9. Quy tắc kiểm thử, chất lượng và an toàn

- Tách demo/mock khỏi output AI thật bằng `model_version` và UI rõ ràng.
- AI evaluation chia tập train/validation/test theo người hoặc phiên độc lập, không trộn frame cùng video; báo Precision, Recall, F1, false alarms/hour, lead time khi phù hợp, độ trễ, và kết quả thiếu sáng riêng. Không bịa số liệu.
- Khi ảnh quá tối, mất mặt, tab ẩn hoặc mất Internet: giám sát không khả dụng, không kết luận `NORMAL`.
- PWA bị giới hạn khi khóa màn hình/đưa vào nền. Server-only không bảo đảm cảnh báo khi không có mạng; demo chưa thích hợp làm hệ thống an toàn độc lập ngoài đường.
- Chỉ kiểm thử bằng video ghi sẵn, mô phỏng hoặc người tham gia có đồng ý khi xe đứng yên. Không thử bằng cách cố tình ngủ gật khi đang điều khiển phương tiện.
- Thiết kế ít gây xao nhãng; chỉ sử dụng âm thanh cảnh báo trong các phiên thử nghiệm phù hợp, không khuyến nghị sử dụng thuốc để chống buồn ngủ.

## 10. Quy tắc làm việc với Codex

1. Đọc `PROJECT_CONTEXT.md` trước và file Context theo vai trò; xem `docs/api-contract.md` là chuẩn chung sau khi được chốt.
2. Kiểm tra trạng thái repository trước khi sửa; không tạo cả hệ thống trong một lệnh.
3. Trước mỗi milestone, nêu danh sách file dự kiến tạo/sửa và tiêu chí nghiệm thu.
4. Không sửa module sở hữu bởi người khác nếu không có thống nhất; dùng interface đã chốt.
5. Thực hiện test thực tế có thể chạy trong môi trường; nếu không chạy được thì báo chính xác giới hạn.
6. Cuối mỗi milestone cập nhật README, tài liệu trạng thái và yêu cầu tích hợp còn thiếu.

**Prompt khởi động chung cho cả nhóm:**

> Hãy đọc `PROJECT_CONTEXT.md`, file Context đúng vai trò của tôi và `docs/api-contract.md` (nếu tồn tại). Kiểm tra mã nguồn hiện có, trình bày một kế hoạch ngắn cho milestone hiện tại, sau đó chỉ thực hiện phần việc tôi phụ trách, tuân thủ API contract v0.1. Không tự tích hợp tính năng tương lai hoặc giả lập AI như kết quả thật. Chạy các phép kiểm thử có thể chạy và báo cáo cách chạy, danh sách file thay đổi, kết quả, lỗi và việc cần phối hợp với hai thành viên còn lại.
