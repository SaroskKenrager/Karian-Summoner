# Karian's Summoner · Bàn chơi ảo v7.0 (1v1 với Máy)

Web app tĩnh (HTML/CSS/JS thuần, không cần build) để chơi thử **Karian's Summoner** (luật v6.5) tại nhà: bàn chơi ảo kéo thả, thảy xí ngầu, theo dõi ❤ / Khiên / trạng thái / ✦, và một **Máy** tự chơi lượt của nó.

## Chạy

- **GitHub Pages:** Settings → Pages → Deploy from branch → chọn nhánh, thư mục `/ (root)`.
- **Máy tính:** trình duyệt chặn `fetch` khi mở trực tiếp file, nên hãy chạy server tĩnh:
  ```bash
  python3 -m http.server 8000
  ```
  rồi mở <http://localhost:8000>.

## Cấu trúc

```
index.html  style.css  script.js     # core
data/karian_data.json                # luật + 41 quái + 16 Công trình/Xe + bộ khởi động
assets/cards/monsters/*.png          # 41 thẻ quái (63×88 mm, tên file = tên quái)
assets/cards/buildings/*.png         # 16 thẻ Công trình & Xe
assets/cards/reference/*.png         # thẻ tham chiếu + bộ khởi động
assets/cards/back-monster.png, back-building.png   # mặt lưng
assets/tokens/                       # energy.png, pain/stun/weak/rage.svg, shield.svg, heal.svg, damage.svg
assets/icons/                        # icon hệ, vai trò, Trái cây
assets/board/mat-bg.jpg              # nền thảm sân
tools/extract_cards.js               # tách ảnh thẻ từ file in cards.html (Playwright)
```

## Cách chơi trên bàn

1. **Ván mới** → chọn tầng: *Ván 0* (đội in sẵn), *Tập chơi* (bộ khởi động), *Chuẩn* (Draft A: rút 2 thẻ mỗi chồng giá, giữ đội ≤ 15 🍇, có Công trình & Xe).
2. **Đặt quân:** kéo 3 quái từ *Vách che* (cột phải) vào lưới 3×3 của bạn (Trước / Giữa / Sau) → *Sẵn sàng · Lật thẻ*.
3. **Lượt của bạn:** *Thảy xí ngầu* → chạm các viên muốn thảy lại → *Thảy lại* (1 lần). Kéo xí ngầu thả lên quái cùng hệ (hoặc chạm viên rồi chạm quái) để thi triển kỹ năng theo mặt; ô viền đỏ là mục tiêu hợp lệ (Cận chiến, Khiêu khích, Xuyên, Hàng/Cột/Đánh lan được tính tự động, cùng khắc hệ ±1, Khiên, Yếu/Hăng hái, Đau).
4. Gọi dự bị bất cứ lúc nào trong lượt (kéo từ Vách che vào ô trống). Năng lượng: thảy lại 1 viên (1 ✦), +2 Khiên hoặc dời quái (2 ✦), đổi màu (3 ✦), rút Công trình (2 ✦).
5. **Kết thúc lượt:** viên dư → +1 ✦ (tối đa 3). Máy chơi lượt của nó, mọi hành động ghi vào *Nhật ký*.
6. Hết 8 vòng hoặc một bên hết quái → tính điểm (🍇 quái đã hạ + 🍇 quái còn sống; hòa thì so số quái trên sân).

Mọi chỉ số vẫn chỉnh tay được: nút −/+ ❤ trên từng thẻ, Khiên và 4 trạng thái ở khung xem thẻ, ✦ ở bảng người chơi. Nhấp đúp vòng khắc hệ (góc dưới) để thu gọn.

## Công cụ hỗ trợ (v7.1)

- **Bàn người chơi · thứ tự lượt** (cột dọc cạnh bàn): ✨ Thuật triệu hồi → 1 Đầu lượt → 2 Thảy → 3 Gán → 4 Thi triển → 5 Cuối lượt, kèm thanh Vòng 1–8. Bước đang chạy nổi lên (xanh = Bạn, đỏ = Máy); ✨ nhấp nháy khi sân còn chỗ và còn dự bị.
- **Năng lượng dạng nút chữ:** bấm là làm — 1 ✦ thảy lại 1 xí ngầu · 2 ✦ +2 Khiên · 2 ✦ dời quái sang ô trống (Chuẩn) · 3 ✦ đổi màu (Chuẩn) · 2 ✦ rút Công trình (Mở rộng). Nút mờ khi chưa đủ ✦ hoặc tầng chưa cho dùng (rê chuột để xem lý do).
- **Trợ lý:** rê/chạm xí ngầu → quái kích hoạt được viền xanh + tên kỹ năng (hoặc “mặt trống”); lúc chọn mục tiêu, mỗi ô hiện trước số ❤ sẽ mất (đã tính khắc hệ, Khiên, Yếu/Hăng hái, 💥 = hạ). Nút **💡 Gợi ý** đề xuất gọi dự bị, cách gán, viên nên thảy lại, khi nào dùng Khiên.
- **Nội tại / Ngưỡng / Di nguyện / Đặc tính / Nhà** chạy tự động và hiện thông báo tím trong Nhật ký; khung xem thẻ liệt kê từng dòng đặc biệt kèm nút **▶ Chạy** để chạy tay.
- **Xe:** ▶ Dùng xe → chọn mục tiêu → hiệu ứng xong mới rời sân (Bỏ qua = xe ở lại). Frost Coach tự chặn 1 đòn đơn vào đồng đội kề. Nhà tự kích hoạt Đầu/Cuối lượt, đếm 🎲, về 0 thành cảnh.
- **Kết thúc phiên** (luôn hiện): dừng mọi xử lý và tải `karian-session-*.json` (nhật ký, trạng thái bàn, bước cuối, lỗi). Mỗi ván lưu số liệu (kết quả, ✦ nhận/tiêu, Công trình đã dùng, thời gian) — tải ở bảng kết thúc.

## Giới hạn bản thử nghiệm

- Máy chưa dùng Công trình & Xe.
- Di nguyện, Ngưỡng ❤, Tinh linh, Gai, Sấm truyền được xử lý tự động (tự chọn mục tiêu), kể cả với quái của bạn.

Hình Tatari, icon hệ/vai trò © Farlight Games (Clash of Critters): chỉ dùng tạm để playtest, không thương mại.
