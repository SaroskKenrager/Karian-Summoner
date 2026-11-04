/* Karian's Summoner · Sách luật trong game (3 trang): Luật chơi · Lượt mẫu · Hỏi đáp
 * Nội dung theo GDD v6.5 (D36–D38) + các chú giải đã thống nhất khi dựng bản digital v7.x–v8.x.
 * Sửa chữ ở đây, không cần đụng script.js.
 */
const RULEBOOK = {
  rules: `
<p class="rb-lead">Bản luật hiện hành = GDD v6.5 (luật lõi đóng băng). 1v1 với Máy · ~30 phút. Ô <b class="dg">Bản digital</b> ghi cách game này xử lý những chỗ luật in để người chơi tự làm.</p>

<h4>1. Mục tiêu</h4>
<p>Bạn là Triệu hồi sư: gọi 3 Tatari lên lưới 3×3 và thảy 5 xí ngầu màu để kích hoạt kỹ năng. Hạ quái đối thủ để lấy điểm 🍇. Trận kết thúc sau <b>8 vòng</b> hoặc khi một bên hết quái.</p>

<h4>2. Ba tầng chơi</h4>
<ul>
<li><b>Ván 0</b>: đội in sẵn (Khiên Băng vs Lửa Sấm). Chỉ 3 xí ngầu đúng màu đội; không trạng thái, không thảy lại, không khắc hệ, không ✦, không dự bị. Người đi trước thảy 2 viên tự chọn.</li>
<li><b>Tập chơi</b>: 1 bộ khởi động 15 🍇 / người. Luật đầy đủ trừ ✦ đổi màu, ✦ dời quái và Công trình.</li>
<li><b>Chuẩn</b>: Draft A — tách 41 thẻ thành 4 chồng giá (2·3·4·5 🍇), mỗi người rút 2 thẻ mỗi chồng (8 thẻ), giữ đội 3–6 quái ≤ 15 🍇. Đủ luật + bản mở rộng Công trình & Xe.</li>
</ul>

<h4>3. Chuẩn bị</h4>
<p>Đặt 3 quái úp vào 3 ô bất kỳ trong 9 ô, rồi hai bên lật cùng lúc. Quái còn lại là <b>dự bị</b> (sau vách che). Lượt đầu: người đi trước thảy <b>3 viên tự chọn màu, không thảy lại</b>; người đi sau bắt đầu với <b>1 ✦</b>.</p>
<div class="dg">kéo quái từ <b>Vách che</b> vào 3 hàng dưới, bấm <b>Sẵn sàng</b>. Kéo quái trên sân về Vách che để đặt lại. Lượt đầu bấm icon hệ để chọn 3 màu.</div>

<h4>4. Lượt chơi — 5 bước + Thuật triệu hồi</h4>
<ol>
<li><b>Đầu lượt</b>: bỏ hết Khiên trên quái mình. Quái mang Đau mất 2 ❤ thẳng rồi bỏ token. Nội tại / đặc tính / Nhà đầu lượt chạy.</li>
<li><b>Thảy xí ngầu</b>: thảy 5 viên (mỗi hệ 1), được thảy lại <b>1 lần</b> các viên tùy chọn.</li>
<li><b>Gán xí ngầu</b>: viên hệ X kích hoạt 1 quái hệ X theo mặt vừa ra; mỗi quái tối đa 1 lần/lượt. <b>Viên gán được thì phải dùng.</b></li>
<li><b>Thi triển</b>: làm các dòng kỹ năng theo thứ tự tùy chọn (Hỗ trợ trước thường có lợi).</li>
<li><b>Cuối lượt</b>: bỏ Choáng, Yếu, Hăng hái trên quái mình; Nhà cuối lượt chạy.</li>
</ol>
<p>✨ <b>Thuật triệu hồi</b> — bất cứ lúc nào trong lượt mình: sân dưới 3 quái → gọi <b>1 quái dự bị/lượt</b> vào ô trống; quái vừa gọi dùng xí ngầu ngay. Nên gọi <b>trước</b> khi gán.</p>
<div class="dg">cột <b>Lượt</b> sáng đúng bước đang chạy (của bạn và của Máy). Kéo quái vừa gọi về Vách che để <b>hoàn tác</b> (khi nó chưa kích hoạt; phần ❤ đặc tính Kiến thiết vừa hồi cũng được trả lại).</div>

<h4>5. Xí ngầu & Năng lượng ✦</h4>
<ul>
<li>Mặt 6 tô đậm; ★ = Tuyệt kỹ. Mặt không có trên thẻ (<b>mặt trống</b>) → không kích hoạt và không đổi thành ✦.</li>
<li><b>Viên dư → +1 ✦</b>. Giữ tối đa <b>3 ✦</b>; nhận thêm khi đầy thì bỏ.</li>
<li>Tiêu ✦ bất cứ lúc nào trong lượt: <b>1 ✦</b> thảy lại 1 viên · <b>2 ✦</b> +2 Khiên 1 quái · <b>2 ✦</b> dời 1 quái sang ô trống (Chuẩn) · <b>2 ✦</b> rút 1 Công trình (mở rộng) · <b>3 ✦</b> đổi màu 1 viên (Chuẩn).</li>
<li><b>Đa sắc</b>: ô khác màu trên thẻ = viên màu đó ra đúng mặt cũng phải có để kích hoạt; ô ngũ sắc = mặt 6 của bất kỳ viên nào.</li>
</ul>
<div class="dg"><b>Viên dư</b> là viên không thể gán một cách khách quan: <b>không có quái cùng màu</b> trên sân, hoặc <b>mọi quái cùng màu đang Choáng / đã kích hoạt</b> lượt này. Viên dư có nút tím <b>+✦</b> (bấm để đổi ngay); nếu không bấm, nó tự thành ✦ ở <b>cuối bước Gán</b> (khi bạn bấm Kết thúc lượt). Viên mặt trống của quái còn dùng được thì không phải viên dư. Game nhắc nếu bạn kết thúc lượt khi còn viên gán được.</div>

<h4>6. Tấn công</h4>
<ul>
<li>Sát thương trừ <b>Khiên</b> trước rồi mới trừ ❤. ❤ về 0 → bị hạ.</li>
<li><b>Khắc hệ</b>: Nước → Hỏa → Cỏ → Đất → Điện → Nước. Đánh hệ mình khắc <b>+1</b>, đánh hệ khắc mình <b>−1</b> (tối thiểu 1).</li>
<li><b>Cận chiến</b>: chỉ đánh hàng gần nhất còn quái của đối thủ. <b>Tầm xa</b>: ô nào cũng được.</li>
<li><b>Khiêu khích</b> (chỉ quái Đỡ đòn): che đồng đội đứng kề (trên/dưới/trái/phải) khỏi đòn <b>1 mục tiêu</b> — đòn phải chuyển sang quái Khiêu khích nếu kẻ đánh tới được nó. Đòn diện rộng không bị kéo. Quái Khiêu khích bị Choáng vẫn che.</li>
<li><b>Xuyên</b>: chỉ bỏ qua Khiêu khích, không bỏ qua giới hạn hàng của Cận chiến.</li>
<li>Diện rộng: <b>Hàng</b> · <b>Cột</b> · <b>Đánh lan</b> (mục tiêu + mọi địch kề) · <b>Địch kề</b> · <b>Toàn sân</b>. Đòn 2 mục tiêu phải là 2 quái khác nhau.</li>
</ul>
<div class="dg"><b>mọi lần gán xí ngầu đều bật dải vàng</b> để chọn / xác nhận mục tiêu (kể cả mục tiêu tự động); ô sáng đỏ là mục tiêu hợp lệ, có ghi trước số ❤ sẽ mất. Đưa dải vào ô <b>↶ Huỷ gán</b> (hoặc nhấn <b>Esc</b>) để trả xí ngầu về khay. Khi nhắm đòn 1 mục tiêu, quái Khiêu khích nổi lên, quái được che thu nhỏ lại.</div>

<h4>7. Khiên, hồi máu, trạng thái</h4>
<ul>
<li><b>Khiên</b> đỡ sát thương, bỏ ở đầu lượt chủ quái. Hồi ❤ không vượt số ❤ in trên thẻ.</li>
<li><b>Đau</b>: đầu lượt chủ quái mất 2 ❤ thẳng (không qua Khiên, không cộng trừ), rồi bỏ token. Không cộng dồn.</li>
<li><b>Choáng</b>: không kích hoạt kỹ năng. Hết ở cuối lượt chủ quái.</li>
<li><b>Yếu</b>: đòn kế tiếp −1 (tối thiểu 1). <b>Hăng hái</b>: đòn kế tiếp trong lượt +1. Hết khi dùng hoặc cuối lượt chủ quái. Đòn nhiều mục tiêu: ±1 tính cho mỗi mục tiêu.</li>
</ul>

<h4>8. Dòng đặc biệt</h4>
<ul>
<li><b>Nội tại</b>: luôn có hiệu lực, không cần xí ngầu.</li>
<li><b>Đặc tính</b> (quái chỉ có 2 kỹ năng): Kiến thiết, Độc lập, Kiên định (đầu thẻ) · Kế thừa, Tinh linh, Thiên phú (cuối thẻ).</li>
<li><b>Ngưỡng ≤X</b>: mỗi lần ❤ tụt từ trên X xuống ≤X thì chạy ngay, kể cả trong lượt đối thủ.</li>
<li><b>Di nguyện</b>: chạy ngay khi quái bị hạ.</li>
</ul>
<div class="dg">Nội tại, Đặc tính, Ngưỡng, Di nguyện chạy <b>tự động</b> và hiện dòng tím trong Nhật ký; lá bài đang ghim có nút <b>▶ Chạy</b> để chạy tay. Ngưỡng chạy <b>mỗi lần</b> tụt qua X (kể cả do Đau). Thiên phú (Flarevix) được hỏi khi bạn gán xí ngầu.</div>

<h4>9. Quái bị hạ</h4>
<p>① ❤ về 0 → ② đọc Di nguyện (nếu có) → ③ bỏ mọi token, thẻ về <b>chồng chiến lợi phẩm</b> của người hạ → ④ chủ quái gọi dự bị trong lượt của mình. Mỗi quái chỉ cho điểm hạ <b>1 lần</b>.</p>
<div class="dg">Charflutter (Di nguyện <i>Tro tàn tái sinh</i>): hồi sinh <b>1 đồng đội khác</b> (không phải chính nó) với 4 ❤ vào ô trống; đối thủ vẫn giữ điểm hạ; quái được hồi sinh không cho điểm lần 2. Tinh linh (Frostique, Popagrind): lần đầu bị hạ, loại 1 dự bị để quay lại; đối thủ không được điểm.</div>

<h4>10. Công trình & Xe (bản mở rộng · chỉ tầng Chuẩn)</h4>
<ul>
<li>Trả <b>2 ✦</b> rút 1 lá (<b>1 lá/lượt</b>), đặt vào ô trống. Tối đa <b>2 Nhà, 1 Xe</b>.</li>
<li><b>Nhà</b> chạy mỗi Đầu/Cuối lượt của bạn; xí ngầu trắng đếm số lần còn lại. Khi Nhà còn xí ngầu: cuối lượt bạn chỉ giữ tối đa <b>2 ✦</b> và <b>không đổi màu</b> được.</li>
<li><b>Xe</b> đi 1 ô miễn phí mỗi lượt, giúp 1 lần rồi rời sân.</li>
</ul>
<div class="dg">bấm <b>chồng Thẻ Công Trình</b> ở góc phải trên bàn chơi để rút. Nhà hết lượt hiện <b>0 lần kích hoạt</b>, vẫn ở lại sân và không tính vào giới hạn 2 Nhà. Xe: bấm <b>▶ Dùng xe</b> → chọn mục tiêu → hiệu ứng xong xe mới rời sân về mục "Đã dùng" (bấm Bỏ qua thì xe ở lại). Frost Coach tự chặn 1 đòn đơn vào đồng đội kề. Ở màn hình Ván mới, bật <b>Máy dùng Expansion Super</b> để Máy cũng rút &amp; dùng Công trình: Máy dùng nhiều nhất ở giữa trận (vòng 3–5), cuối trận ưu tiên giữ ✦ để đổi màu / thảy lại.</div>

<h4>11. Kết thúc & tính điểm</h4>
<p>Hết 8 vòng, hoặc chỉ còn 1 bên có quái. <b>Điểm</b> = 🍇 quái đối thủ mình đã hạ + 🍇 quái mình còn sống (kể cả dự bị). <b>Hòa</b>: ai còn nhiều quái trên sân hơn thắng; vẫn bằng thì hòa.</p>
`,
  turns: [
    { h: 'Lượt 1 · Bạn', img: '01-place', t: '<b>Đặt quân.</b> Kéo Frostique (Trước), Charflutter và Donscarab (Giữa) từ Vách che vào sân rồi bấm <b>Sẵn sàng</b>. Thẻ của Máy còn úp.' },
    { img: '02-colors', t: '<b>Lượt đầu, bạn đi trước:</b> chỉ thảy 3 viên tự chọn màu, không thảy lại. Bấm 3 icon Nước · Hỏa · Cỏ (icon được chọn phóng to). Máy đi sau nên được +1 ✦.' },
    { img: '03-roll', t: '<b>Thảy xí ngầu.</b> Bàn đá giữa sân hiện 3 viên. Rê chuột lên 1 viên: quái dùng được viên đó viền xanh, ghi tên kỹ năng sẽ kích hoạt.' },
    { img: '04-aim', t: '<b>Gán Nước 3 → Frostique</b> (Mảnh băng: 2 sát thương + Yếu). Dải vàng bật lên để chọn mục tiêu. Frostique có <b>Xuyên</b> nên bỏ qua Khiêu khích của Stoodbeak, nhắm thẳng Chronerva ở hàng Giữa; ô sáng đỏ ghi trước số ❤ sẽ mất. Lỡ tay thì đưa dải vào <b>↶ Huỷ gán</b>.' },
    { img: '05-hit', t: '<b>Trúng đòn:</b> Chronerva rung, ửng đỏ, mất 2 ❤ (thanh máu chớp và tụt dần) và bị <b>Yếu</b>.' },
    { img: '06-endturn', t: '<b>Gán nốt 2 viên:</b> Hỏa 5 → Charflutter (Cánh bướm lửa — xác nhận hồi cả đội, chưa ai mất máu), Cỏ 2 → Donscarab (Sừng bọ: Stoodbeak −2 ❤). Hết viên → bấm <b>Kết thúc lượt</b>.' },
    { h: 'Lượt 1 · Máy', img: '07-bot-roll', t: '<b>Máy thảy 5 viên</b>, thảy lại Cỏ 3 → 5. Đất và Điện không có quái cùng màu → <b>viên dư</b>, thành +2 ✦. Cột Lượt sáng đỏ theo từng bước của Máy; Nhật ký ghi mọi hành động.' },
    { img: '07-bot-attack', t: '<b>Máy nhắm Frostique</b> (ô sáng đỏ): Chronerva <i>Ngưng đọng</i> gây 1 sát thương (Yếu −1) và làm Frostique <b>Choáng</b>; Taiglow <i>Vuốt đôi</i> −1 ❤ (bị khắc −1).' },
    { img: '08-back', t: '<b>Máy phòng thủ:</b> Stoodbeak <i>Giáp băng</i> +2 Khiên cho mình và đồng đội kề, rồi trả 2 ✦ thêm Khiên cho Stoodbeak. Số Khiên ghi ngay trong ký hiệu khiên trên quái.' },
    { h: 'Lượt 2 · Bạn', img: '09-stun', t: '<b>Viên dư khách quan:</b> Frostique đang <b>Choáng</b> nên viên Nước không gán được → viên đó có nút tím <b>+✦</b> (bấm để đổi ngay thành năng lượng; nếu không, nó tự thành ✦ khi bạn kết thúc lượt). Đất và Điện cũng là viên dư vì không có quái cùng màu.' }
  ],
  faq: [
    ['Tôi thả xí ngầu lên quái mà không có gì xảy ra?', 'Viên hệ X chỉ kích hoạt quái hệ X. Ngoài ra quái phải chưa kích hoạt lượt này, không bị Choáng, và mặt vừa ra phải có trên thẻ (mặt trống không làm gì). Rê chuột lên viên xí ngầu để thấy quái nào dùng được và kỹ năng gì.'],
    ['"Viên dư" là gì, khi nào nó thành năng lượng?', 'Viên dư là viên không thể gán một cách khách quan: không có quái cùng màu trên sân, hoặc mọi quái cùng màu đang Choáng / đã kích hoạt. Bấm nút tím +✦ để đổi ngay (dùng được trong lượt), hoặc để nó tự thành ✦ khi bạn bấm Kết thúc lượt. Giữ tối đa 3 ✦.'],
    ['Lỡ gán nhầm xí ngầu, hoàn tác được không?', 'Được, trước khi bạn chọn / xác nhận mục tiêu: đưa dải vàng vào ô ↶ Huỷ gán (dưới Kết thúc lượt) hoặc nhấn Esc. Xí ngầu về khay, quái chưa kích hoạt. Khi đòn đã đánh trúng thì không hoàn tác.'],
    ['Khi nào nên gọi quái dự bị? Gọi nhầm thì sao?', 'Gọi trước khi gán xí ngầu để quái mới dùng được viên vừa thảy (luật: 1 quái/lượt, chỉ khi sân dưới 3 quái). Gọi nhầm: kéo quái đó về Vách che khi nó chưa kích hoạt.'],
    ['Khiêu khích, Xuyên và Cận chiến khác nhau thế nào?', 'Cận chiến chỉ đánh hàng gần nhất còn quái. Khiêu khích che đồng đội đứng kề khỏi đòn 1 mục tiêu (đòn bị kéo về quái Khiêu khích). Xuyên bỏ qua Khiêu khích nhưng vẫn theo luật hàng của Cận chiến. Đòn diện rộng (Hàng, Cột, Đánh lan, Toàn sân) không bị kéo.'],
    ['Khiên và Đau tương tác ra sao?', 'Khiên đỡ sát thương trước ❤ và bị bỏ ở đầu lượt chủ quái. Đau trừ thẳng 2 ❤ ở đầu lượt chủ quái, không qua Khiên, không cộng trừ, không cộng dồn.'],
    ['Ngưỡng ❤ (vd Ninjaguana ≤4) chạy mấy lần?', 'Mỗi lần ❤ tụt từ trên ngưỡng xuống ≤ ngưỡng thì chạy một lần — kể cả trong lượt đối thủ và khi mất máu do Đau. Được hồi lên trên ngưỡng rồi tụt lại thì chạy tiếp.'],
    ['Charflutter hồi sinh ai? Đối thủ có mất điểm không?', 'Hồi sinh 1 đồng đội khác đã bị hạ (lấy lại từ chồng chiến lợi phẩm của đối thủ) với 4 ❤ vào ô trống. Đối thủ vẫn giữ điểm hạ; quái đó bị hạ lần nữa không cho thêm điểm.'],
    ['Nhà hết lượt và Xe đã dùng thì sao?', 'Nhà hết xí ngầu trắng hiện "0 lần kích hoạt", vẫn ở lại sân và không tính vào giới hạn 2 Nhà. Xe chỉ rời sân sau khi hiệu ứng làm xong, rồi nằm ở mục "Đã dùng" (xám) trong khu Công trình & Xe.'],
    ['Điểm và hòa tính thế nào?', 'Hết 8 vòng (hoặc một bên hết quái): điểm = 🍇 quái đối thủ bạn đã hạ + 🍇 quái của bạn còn sống, kể cả dự bị. Bằng điểm thì ai còn nhiều quái trên sân hơn thắng; vẫn bằng thì hòa.']
  ]
};
