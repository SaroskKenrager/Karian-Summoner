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

## Giới hạn bản thử nghiệm

- Máy chưa dùng Công trình & Xe. Hiệu ứng Nhà/Xe của bạn thì tự áp dụng tay (bộ đếm 🎲 trên ô, nút *Dùng xe*).
- Di nguyện, Ngưỡng ❤, Tinh linh, Gai, Sấm truyền được xử lý tự động (tự chọn mục tiêu), kể cả với quái của bạn.

Hình Tatari, icon hệ/vai trò © Farlight Games (Clash of Critters): chỉ dùng tạm để playtest, không thương mại.
