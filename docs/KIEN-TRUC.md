# Kiến trúc Karian's Summoner (bản digital) — giải thích cho người mới

Tài liệu này giải thích code đang được tổ chức thế nào, vì sao, và cách sửa giao diện mà không làm vỡ bố cục.
Không cần biết lập trình trước. Đọc theo thứ tự 1 → 5.

---

## 1. Bức tranh lớn: 3 lớp tách nhau

Một card game 2D luôn nên chia làm **3 lớp**, mỗi lớp chỉ làm 1 việc:

```
┌───────────────────────────┐
│ ① DỮ LIỆU (Data)          │  data/karian_data.json  → "thẻ ghi gì"
│   41 quái, 16 Công trình, │  (giống tờ thẻ in: tên, hệ, ❤, kỹ năng)
│   tham số luật            │  Sửa số ở đây, KHÔNG cần sửa code.
└────────────┬──────────────┘
             ▼
┌───────────────────────────┐
│ ② LUẬT + TRẠNG THÁI       │  script.js (phần "engine")
│   (Engine / State)        │  "Trên bàn đang có gì, luật xử lý ra sao"
│   S = { sides, round,     │  Không vẽ gì cả, chỉ tính toán.
│   turn, step, dice… }     │
└────────────┬──────────────┘
             ▼
┌───────────────────────────┐
│ ③ GIAO DIỆN (View/UI)     │  index.html (khung) + style.css (trang trí)
│   vẽ lại từ S, nhận click │  + các hàm render…() trong script.js
└───────────────────────────┘
```

**Nguyên tắc vàng:** giao diện *không bao giờ tự giữ số liệu*. Muốn đổi ❤ của một quái, ta đổi trong `S`,
rồi gọi `render()` để vẽ lại. Nhờ vậy màn hình luôn đúng với luật, và Máy (AI) dùng chung đúng một bộ luật với bạn.

So sánh với bàn chơi thật:

| Bàn chơi thật | Trong code |
|---|---|
| Thẻ in, sách luật | `data/karian_data.json` |
| Vị trí thẻ, token ❤/Khiên, xí ngầu đang có trên bàn | biến `S` (state) |
| Người chơi nhìn bàn | các hàm `render…()` |
| Tay người chơi kéo thẻ / bấm | sự kiện chuột: `bindUI()`, `bindDnD()` |
| Trọng tài đọc luật | `runEffects()`, `damage()`, `startTurn()`, `endTurn()` |

---

## 2. Bản đồ file

```
index.html        Khung trang: các vùng (cột trái, cột thứ tự lượt, bàn chơi, cột phải)
style.css         Màu, kích thước, bố cục, hiệu ứng
script.js         Toàn bộ logic, chia theo khối có tiêu đề /* ===== … ===== */
data/karian_data.json   Dữ liệu thẻ + luật (dùng chung với bản in)
assets/           Ảnh thẻ, token, icon, nền
tools/extract_cards.js  Script tách ảnh thẻ từ file in
```

Các khối trong `script.js` (tìm theo tiêu đề):

| Khối | Việc |
|---|---|
| `hằng số` | Tên hệ, màu, các bước lượt (`STEPS`), tầng chơi (`TIERS`) |
| `trạng thái ván` | Biến `S` và các hàm hỏi nhanh: `side()`, `monsOf()`, `adjIdx()`… |
| `xí ngầu` | Vẽ xí ngầu, tìm kỹ năng theo mặt (`findSkill`) |
| `sát thương & hiệu ứng` | `damage`, `heal`, Ngưỡng, bị hạ (`ko`), Công trình, Xe |
| `mục tiêu` | Cận chiến / Khiêu khích / Xuyên / Hàng / Cột / Đánh lan |
| `AI chọn mục tiêu` | Máy chấm điểm từng lựa chọn rồi chọn cái tốt nhất |
| `vòng lượt` | `beginTurn → startTurn → … → endTurn → nextTurn` |
| `MÁY` | `botTurn`: gọi dự bị, thảy, gán, thi triển |
| `render` | Vẽ bàn từ `S` |
| `sự kiện` | Nhận click, kéo thả |

### Vòng đời một lượt (khớp với bàn thứ tự lượt)

```
beginTurn()
  └─ setStep(1) startTurn()   bỏ Khiên, Đau −2❤, nội tại, Nhà đầu lượt
  └─ setStep(2)               Bạn: chờ bấm "Thảy" · Máy: tự thảy
  └─ setStep(3)               gán xí ngầu
  └─ setStep(4) runEffects()  thi triển kỹ năng
nextTurn()
  └─ setStep(5) endTurn()     bỏ Choáng/Yếu/Hăng hái, Nhà cuối lượt, viên dư → ✦
  └─ đổi người → beginTurn()
```

Mỗi kỹ năng trong JSON là một danh sách hiệu ứng, ví dụ:
`{"k":"d","v":2,"t":"row"}` = gây **2** sát thương (**d**amage) lên **1 hàng**.
`runEffects()` đọc lần lượt từng dòng như trọng tài đọc thẻ. Thêm quái mới chỉ cần thêm dữ liệu JSON và ảnh.

---

## 3. Bố cục giao diện: vì sao có thứ "chạy" và thứ "đứng im"

Trang được chia bằng **CSS Grid** thành 4 cột có độ rộng cố định:

```
┌──────────┬──────────┬────────────────────────┬────────────┐
│ 250px    │ 200px    │ phần còn lại (1fr)     │ 300px      │
│ Máy      │ Thứ tự   │ Lưới Máy               │ Bạn · ✦    │
│ Nhật ký  │ lượt     │ Khay xí ngầu           │ Vách che   │
│          │ Khắc hệ  │ Lưới Bạn               │ Xem thẻ    │
└──────────┴──────────┴────────────────────────┴────────────┘
   .layout { grid-template-columns: 250px 200px minmax(0,1fr) 300px }
```

**Lỗi bạn gặp trước đây:** bàn thứ tự lượt nằm *chung một hộp* với lưới và khay xí ngầu, và hộp đó được căn giữa.
Khay xí ngầu đổi độ rộng (5 viên ↔ 3 viên, có/không có nút) thì cả hộp rộng ra/hẹp lại, căn giữa lại từ đầu,
nên bàn thứ tự lượt bị đẩy qua lại.

**Cách sửa (nguyên tắc chung):**
1. Thứ cần **đứng im** → cho vào **cột riêng có độ rộng cố định** (giống Nhật ký). Bây giờ bàn thứ tự lượt là cột 2.
2. Thứ có nội dung **thay đổi** (khay xí ngầu) → đặt **độ rộng cố định** (`width: min(100%, 600px)`),
   để nội dung bên trong xuống dòng thay vì làm khung phình ra.
3. Hiệu ứng "nổi lên" dùng `transform: scale(...)`: không chiếm thêm chỗ nên không đẩy hàng xóm.
   Tránh đổi `width`, `margin`, `padding` khi làm hiệu ứng.

Đã kiểm tra: ở 1280×720, 1440×900 và 1920×1080, bàn thứ tự lượt nằm đúng một chỗ trong mọi bước
(đặt quân, chọn màu, đã thảy, lượt Máy).

---

## 4. Mẹo tối ưu giao diện card game

- **Kích thước theo màn hình:** ô thẻ dùng biến `--ch` (chiều cao ô) tính từ chiều cao cửa sổ:
  `--ch: clamp(80px, calc((100vh - …) / 6), 200px)`, còn chiều rộng = `--ch × 63/88` (đúng tỉ lệ thẻ poker).
  Muốn thẻ to hơn → sửa số `6` hoặc `200px` trong `style.css`.
- **Một nguồn màu:** màu đặt trong `:root { --ink, --sun, --mint… }`. Đổi một chỗ, cả trang đổi theo.
- **Thẻ nhỏ + khung xem lớn:** ô lưới chỉ cần nhận ra thẻ; chi tiết đọc ở khung "xem thẻ" bên phải.
- **Phản hồi rõ:** mọi hành động đều để lại dấu vết: ô rung khi trúng đòn, viền đỏ cho mục tiêu hợp lệ,
  dòng tím trong Nhật ký cho Nội tại, bước lượt nổi lên.
- **Điện thoại:** dưới 1100px các cột xếp chồng (`@media (max-width:1100px)`); kéo thả thay bằng chạm-rồi-chạm.
- **Ảnh:** thẻ là PNG 63×88 mm đã cắt sẵn (~250 KB/thẻ). Nếu trang tải chậm có thể đổi sang WebP.

---

## 5. Muốn sửa gì thì mở đâu

| Muốn… | Mở | Tìm |
|---|---|---|
| Đổi ❤, sát thương, mặt xí ngầu của quái | `data/karian_data.json` | tên quái |
| Đổi ảnh thẻ | `assets/cards/monsters/` | tên file = tên quái |
| Đổi chữ các bước lượt | `script.js` | `const STEPS` |
| Đổi màu / cỡ chữ / độ rộng cột | `style.css` | `:root`, `.layout` |
| Đổi cách Máy chọn mục tiêu | `script.js` | `function valueOf` |
| Đổi cách Máy chọn kỹ năng | `script.js` | `function skillValue` |

**Chạy thử trên máy:** mở terminal trong thư mục dự án → `python3 -m http.server 8000` → mở `http://localhost:8000`.
Sửa file, lưu, nhấn F5 là thấy thay đổi.

---

## 6. Quy trình chuẩn khi thêm một loại đối tượng mới

Ví dụ: màn hình thắng/thua, lá bài mới, token mới, hiệu ứng mới. Làm đúng **5 bước**, mỗi bước xong mới sang bước sau:

| Bước | Câu hỏi | Ở đâu | Ví dụ: màn hình kết quả (v7.2) |
|---|---|---|---|
| ① Đặc tả | Nó là gì, khi nào xuất hiện, khi nào biến mất, người chơi bấm được gì? | Ghi 5–10 dòng vào ô góp ý / issue | Hiện khi hết 8 vòng hoặc 1 bên hết quái; 3 dạng thắng/thua/hòa; nút Ván mới / Xem bàn / Tải số liệu |
| ② Dữ liệu | Nó cần biết những số liệu nào? Có đưa vào JSON được không? | `data/karian_data.json` hoặc `S` | Điểm, số quái trên sân, thời gian, ✦ (đã có trong `S.stats`) |
| ③ Tài nguyên | Ảnh, icon, âm thanh? Đặt tên thế nào? | `assets/<loại>/<tên>.png` | Dùng lại `Fruit.webp`, mặt lưng thẻ |
| ④ Thành phần | Một hàm vẽ riêng + một nhóm CSS riêng, có tiêu đề | `script.js` (khối riêng) + `style.css` (khối riêng) | `showResultScene(kind)` + `.result.win/.lose/.draw` |
| ⑤ Kiểm tra | Chạy thử đủ các trường hợp, chụp màn hình | trình duyệt / script kiểm thử | Ép `gameOver()` với điểm thắng, thua, hòa |

Quy ước đặt tên giúp code luôn "quy củ":
- Lớp CSS của một thành phần bắt đầu bằng tên thành phần: `.result`, `.result h2`, `.result.win`.
- Trạng thái dùng **lớp phụ** chứ không sửa style trực tiếp: `.win` / `.lose`, `.on` / `.done`, `.fx-hit`.
- Mỗi màn hình hay hiệu ứng có **một hàm mở** (`showX`) và **một cách đóng** rõ ràng.
- Không bao giờ lưu số liệu trong giao diện, chỉ trong `S` (xem mục 1).

## 7. Hệ hiệu ứng (FX)

Bàn chơi được vẽ lại rất nhiều lần mỗi giây khi có thao tác. Nếu gắn hiệu ứng thẳng vào ô, lần vẽ sau sẽ xóa mất.
Vì vậy dùng một bảng ghi `FX`:

```js
fx('B', 4, 'fx-hit', 650);   // ô số 4 của Máy: hiệu ứng "trúng đòn" trong 650 ms
```

Mỗi lần vẽ, ô tự đọc `FX`, gắn lớp `fx-hit` và đặt `--fxd` = thời gian đã trôi (số âm), nên hiệu ứng **chạy tiếp**, không giật lại từ đầu.

| Lớp | Khi nào | Trông thế nào |
|---|---|---|
| `fx-hit` | mất ❤ | rung nhẹ + ửng đỏ; thanh máu chớp đỏ, phần vừa mất (vàng nhạt) tụt dần |
| `fx-heal` | hồi ❤ / +Khiên | ánh xanh lá |
| `fx-aim` | Máy chuẩn bị đánh ô này | viền đỏ sáng lên ~0,5 giây |
| `taunt-up` / `covered` | bạn nhắm đòn 1 mục tiêu | quái Khiêu khích to ra + nhãn, quái được che nhỏ lại; rê vào quái được che thì quái Khiêu khích "giật" về |
| dải sáng `#beam` | chọn mục tiêu cho ✦ / kỹ năng | đường cong "thở" từ nút ✦ (tím) hoặc quái ra đòn (đỏ) tới con trỏ, bắt dính vào ô hợp lệ |
| `.flycard` | rút Công trình | thẻ bay ra giữa màn hình, lật mặt, thu nhỏ bay về khu dự bị |

Thêm hiệu ứng mới = thêm 1 lớp CSS + 1 `@keyframes` dùng `var(--fxd)` làm delay, rồi gọi `fx(o, i, 'tên-lớp', ms)`.
Người dùng bật "giảm chuyển động" trong hệ điều hành thì mọi hiệu ứng tự tắt (`prefers-reduced-motion`).

## 8. Mẫu viết yêu cầu (prompt) cho hiệu ứng

Một yêu cầu tốt có đủ **5 ý: Khi nào · Đối tượng · Trông thế nào · Bao lâu · Kết thúc ra sao**.

```
[Hiệu ứng] Trúng đòn
- Khi nào: quái mất ❤ (cả do Đau, Gai, Nhà).
- Đối tượng: ô của quái bị đánh + thanh máu của nó.
- Trông thế nào: rung trái–phải 3 nhịp (±4px), phủ đỏ mờ rồi tắt; thanh máu chớp đỏ 2 lần,
  phần máu vừa mất hiện vàng nhạt rồi tụt dần về số mới.
- Bao lâu: rung 0,45 s, đỏ 0,65 s, tụt máu 0,7 s (bắt đầu sau 0,35 s).
- Kết thúc: trở về như cũ, không để lại dấu; nếu quái bị hạ thì thẻ rời sân sau hiệu ứng.
- Không được: làm xô lệch ô bên cạnh; chạy lại khi bàn vẽ lại.
```

Mẹo: gửi kèm **ảnh chụp / GIF tham khảo** từ game khác, nói rõ "giống chỗ nào" (nhịp, màu, cảm giác),
và nói điều **không** muốn (ví dụ "không lóe trắng cả màn hình").
