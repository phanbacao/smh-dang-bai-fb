# Việc hằng tuần (thứ 4, 14:37 giờ VN): soạn nội dung tuần kế tiếp cho page phụ
- Tuần kế tiếp = 7 ngày nối tiếp ngày cuối trong page-phu/lich.json. Mỗi ngày 3 bài: 07:30 ảnh manifest/bình an/mẹo thở (nền mờ, chữ vàng, chỉ #sonmochuong, lam_manifest.py), 11:30 bài ảnh kiến thức (anh/cuon 4 ảnh), 15:30 ảnh tương tác (chọn một, hỏi nhanh, đoán hạt; lam_anh_mini.py), 19:30 Reels. Tức 4 bài/ngày khi đủ sức.
- Nguyên tắc (Cao dặn 07/11): giai đoạn đầu ƯU TIÊN nội dung giúp ích/cảm xúc để page được đề xuất cho người mới: ≥50% bài là manifest, bình an, phong thuỷ nhẹ ("theo quan niệm…"), mẹo hữu ích, tương tác; sản phẩm chỉ làm nền, không rao bán, không giá.
- Minigame tặng 3 chuỗi 108 hạt chạy đến 20h 21/11/2026 (đăng nhắc 1 bài/3–4 ngày, kết hợp bài ghim). Luật: theo dõi + thích + bình luận "Tham gia" + size; bốc thăm ngẫu nhiên; KHÔNG bắt chia sẻ cá nhân/gắn tên bạn (vi phạm quy định Facebook). Cao đã quyết: không kéo người từ page/nhân viên khác, quảng cáo dưới 1 triệu.
- Cơ cấu tuần: ~3 kiến thức ngắn, ~7 manifest/mẹo, ~4 tương tác, ~3 Reels cảm hứng, ~2 hậu trường, ~2 quà tặng/mùa lễ. Không trùng chủ đề tuần trước.
- Lời: văn nói, câu ngắn, mở bằng hiểu lầm/băn khoăn; "anh chị", "Sơn Mộc Hương", đủ cụm "vòng trầm hương", "để mộc / không keo, không sáp, không phủ sơn"; Trầm chuẩn = trầm tốc vườn (không gọi trầm tự nhiên), Tốc kiến = trầm tự nhiên; Gió trắng, bach xanh không phải trầm; nhang/nụ "bột gỗ trầm kết hợp vỏ cây bời lời"; không bịa giá/chính sách/công dụng; phong thuỷ "theo quan niệm…"; không kết luận thật-giả bằng 1 dấu hiệu; chưa bán hàng: không giá, không kêu gọi mua. Hashtag #tramhuongmoingay + 1–3 hashtag liên quan.
- Hình: dùng cong-cu (README.md); vùng an toàn 10% (Reels trên 12%, dưới 20%); vòng là trung tâm, không bị chữ đè/cắt; logo vàng góc + 1–2 logo chìm; không ảnh hộp đỏ; không đăng lại ảnh thiết kế sẵn của kênh 1; không đánh số trang; tự xem lại trước khi đưa lên.
- Thêm vào lich.json (không xoá bài cũ < 30 ngày), kiểm JSON + đủ tệp, commit + push main, kiểm lại raw link.
- Không sửa smh.user.js, du-an.tar.gz, CLAUDE_KIEM_TRA.md.
- Báo cáo 4–6 dòng: tuần nào, chủ đề, link https://github.com/phanbacao/smh-dang-bai-fb/tree/main/page-phu, lỗi nếu có; nhắc Cao gửi số người theo dõi để chỉnh hướng + cân nhắc quảng cáo (dưới 1 triệu).
- (07/11) Lời kêu tương tác: dùng "gửi cho người thân/bạn bè qua tin nhắn" và câu hỏi thật (size, tay nào, kể trải nghiệm). KHÔNG dùng "bình luận đón nhận / bình luận số / gắn tên bạn" (Meta coi là câu tương tác). Đọc page-phu/CHIEN_LUOC.md trước khi soạn tuần mới và theo mục "Điều đã học" mới nhất.

## Quy tắc làm ảnh (Cao góp ý 07/11, từ bài minigame)
- Chữ tiêu đề lớn trên ảnh nền có hoa văn/vòng (VD "Tặng 3 chuỗi 108 hạt trầm hương") phải có viền mảnh hoặc bóng đổ nhẹ để nổi bật; không để chữ trơn.
- Làm xong ảnh phải tự xem lại một lượt: chữ có lệch không, có đủ nổi không, có che vòng/mặt không — rồi mới đưa vào lịch.

## Bình luận đầu (Cao 07/11)
- Mọi bài page phụ phải có "cmt": 1 ảnh + 1 câu nhắc minigame (khi minigame còn mở), không link, không rao bán.
- (09/11) Reels phải tự quay (hạt/vòng thật, có tay người), không dùng lại clip có watermark hay clip của người khác: Meta giảm phân phối nội dung không gốc từ 3/2026. Mỗi Reels có phụ đề + hook trong 3 giây đầu. (https://www.socialpilot.co/blog/facebook-algorithm — nguồn tham khảo)

## Cách mới tăng follow (Cao duyệt 11/11) — áp dụng từ tuần 2
1. **Reels mỗi ngày 1 bài**: video thật từ kho (đeo tay, cận hạt), 10–15 giây, chữ ngắn ở vùng an toàn, câu cuối "Theo dõi Trầm Hương Mỗi Ngày để xem tiếp". Dùng lam_reel_that.py.
2. **Chuỗi "30 ngày hiểu trầm – Ngày X/30"**: mỗi ngày 1 bài ảnh gốc + 1 kiến thức ngắn đã duyệt (để mộc, size, bảo quản, phân biệt nấu dầu, 108 hạt...). Câu mở đầu luôn khác nhau (bắt đầu bằng "Ngày X/30:" + chủ đề), cuối bài "Theo dõi trang để không lỡ ngày tiếp theo".
3. Bình luận đầu: 1 ảnh vòng thật + 1 mẹo, KHÔNG nhắc minigame (đã dừng 11/11).
4. Cơ cấu mỗi ngày (thay cơ cấu cũ): 1 Reels + 1 bài chuỗi 30 ngày + 1 bài ảnh gốc/hỏi đáp + 1 bài sáng nhẹ nhàng.

## Nhật ký
- (11/11) Tuần 2 (14–20/11): 21 bài/ngày 3 khung 07:30 ảnh sáng nhẹ nhàng, 11:30 chuỗi "30 ngày hiểu trầm" Ngày 1–7/30, 19:30 Reels video thật (lam_anh_t2.py, lam_reel_t2.py). Tuần 3 tiếp từ Ngày 8/30. Clip đã dùng tuần 2: 108,17,9,40,4,27,49,96,15,23,84,65,13,68,53,26,42,57,88,1,16,75,46,14,18,29,71. Tránh clip soi gương (chữ trên áo bị ngược): 33,34,36,38,44,52,80,83,86,93,104,112.
