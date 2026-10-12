# Quy trình Claude tự kiểm tra — script "Smh đăng bài FB kênh 1"

Người dùng: **anh Cao** (không rành kỹ thuật). Luôn trả lời **tiếng Việt**, ngắn gọn, ngôn ngữ thường. Anh Cao **chỉ duyệt** — không bắt anh làm gì thêm.

## Quy tắc an toàn (bắt buộc)
- **Không bao giờ bấm "Đăng" trên Facebook thật.** Kiểm tra trực tiếp chỉ dùng "Soạn thử" (dừng trước nút Đăng) rồi đóng hộp, chọn bỏ bản nháp.
- **Không hỏi, không đọc, không dán mã khoá Facebook.** Máy nào mất mã thì nhắn anh Cao tự dán qua "🔑 Cài mã khoá".
- Lark sheet: **chỉ đọc** (qua script). Không sửa sheet bằng tay.
- Không đụng tới trang khi script đang đăng (thanh popup đang nhấp nháy xanh / có "Đang đăng…").
- Mã bí mật (mã Lark, link nhóm Lark) **không bao giờ** đưa lên GitHub. Bản công khai phải qua bước kiểm tự động trong `build6.py`.

## Chuẩn bị (mỗi lượt)
1. Tải mã nguồn về đúng đường dẫn mà trang giả lập dùng:
   ```
   mkdir -p /tmp/claude-0/v114 && cd /tmp/claude-0/v114
   curl -sSfL https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/du-an.tar.gz | tar xz
   ```
   (gồm `v6/` mã nguồn, `sim6/` giả lập, `out70_cao.js`, `out62_giao.js`, ảnh thử). Mã bí mật đã bị thay bằng `/*BI_MAT_DA_BO*/` trong 2 file out*.js — `build6.py` không dùng tới chỗ đó.
2. Mã bí mật: tìm trên Google Drive file **"SMH dang bai - ma bi mat (KHONG CHIA SE)"** (id `1Kc6_UVKSBfreLtVtKKQzVhh-L9mixQH9`), lưu nội dung JSON vào `/tmp/claude-0/v114/v6/bimat.json`.
3. `cd v6 && python3 build6.py` → ra `smh6.user.js` (bản riêng, dùng cho giả lập) và `smh6.public.user.js` (bản công khai).
4. Trang giả lập: `cd ../sim6 && sh chayhet.sh` (chạy nền, ~45 phút) — kết quả ở `kq/*.txt`. Mỗi kịch bản phải: "TRÙNG: 0", "LỖI TRANG: []".

## Lượt kiểm tra mỗi tối (khoảng 22h)
1. **Lấy báo cáo của cả 2 máy** (qua Claude trong Chrome, máy nào đang bật):
   - Tìm tab Facebook có popup `#smhfb`. Không có / extension không phản hồi → thử lại 2 lần cách 3 phút; vẫn không được thì nhắn anh Cao "tối nay không vào được máy, mai đọc bù" (báo cáo vẫn nằm trên Lark).
   - Chạy JS trong tab: `window.postMessage({smhLayBaoCao:1}, location.origin)`; chờ 5 giây; đọc `document.getElementById('smhfb-bc').value` (đọc từng đoạn 6000 ký tự). Kết quả: `giao` (ô Z5), `cao` (ô Z6), `duyet` (ô Z7), mỗi báo cáo bắt đầu bằng `BC6|` + JSON.
   - Nếu `coBiMat:false` → nạp mã: `window.postMessage({smhBiMat:<nội dung bimat.json>}, location.origin)`.
2. **Duyệt chờ chuyển**: ô Z7 = `DUYET|<bản>|...` và bản đó đúng là `trangthai.json → choDuyet.ban` → chuyển thành chính thức (mục "Cập nhật GitHub").
3. **Đọc báo cáo**: `d.<ngày>.loi` (lỗi gom theo mẫu, n = số lần), `uuTien` (anh Cao bấm 🛟 — xử lý TRƯỚC TIÊN; có `hop` = hộp đang mở, `nk` = nhật ký 40 phút), `slot` (trạng thái 9 bài), `tk` (thống kê từng việc: c lần chạy, ms, kq lần có kết quả), `d.<ngày>.dc` (script tự điều chỉnh).
4. **Chọn mức kiểm tra** theo `so-theo-doi.json`:
   - `nhanh` (7 ngày gần như không lỗi): chỉ đọc báo cáo → nhắn "ổn".
   - `vua` (có lỗi mới): tái hiện trên giả lập (thêm tuỳ chọn vào `fakefb6.js` + kịch bản vào `sim6.js`), sửa ở `v6/p*.js` hoặc bản vá trong `build6.py`, chạy toàn bộ kịch bản.
   - `ky` (lỗi đã sửa mà lặp lại / lỗi dày): như `vua` + **vào máy anh Cao soạn thử** loại bài liên quan (popup → tab Ngày mai → nút Soạn; dừng trước nút Đăng; xem bước nào khác trang giả lập; đóng hộp, bỏ nháp). Cập nhật trang giả lập cho giống Facebook thật rồi mới sửa.
   - 3 ngày liền không có lỗi mới → hạ 1 mức. Lỗi lặp lại sau khi sửa → lên `ky`.
5. **Tối ưu**: việc có `tk` chạy nhiều mà `kq = 0` suốt 7 ngày → đề xuất giảm (giữ mức tối thiểu cho: bài đã lên chưa, comment đủ chưa, chống trùng). Việc chậm bất thường → tìm cách nhanh hơn.
6. **Có thay đổi** → tăng số bản (`@version`, `PHIEN_BAN` trong `p1_dau.js`; GIỮ NGUYÊN `@name`), ghép, chạy toàn bộ giả lập, rồi đưa lên `cho-duyet.user.js` + `trangthai.json.choDuyet = {ban, tomTat, luc}` (tóm tắt dạng: lỗi gì → sửa gì; "Đã tối ưu: cũ → mới").
7. Cập nhật `so-theo-doi.json` (lỗi mới, lặp lại, mức kiểm, `nhatKyNgay` 1 dòng/ngày) và đẩy lên GitHub cùng mã nguồn (đóng gói lại `du-an.tar.gz`: `tar czf du-an.tar.gz v6/p*.js v6/build6.py v6/eslint.config.js sim6/*.js sim6/*.sh out70_cao.js out62_giao.js big.jpg small.jpg mf/nen.jpg` — KHÔNG đưa `v6/bimat.json`).
8. **Tin nhắn cuối** (anh Cao đọc trên iPhone): 3–6 dòng — hôm nay lỗi gì, đã sửa gì, đã tối ưu gì, bản chờ duyệt (nếu có: "trả lời **duyệt** để chuyển ngay, hoặc bấm ✅ trên popup Máy Cao"). Không có gì: "Hôm nay ổn, không cần làm gì."
9. Anh Cao trả lời "duyệt" trong phiên → chuyển bản chờ duyệt thành chính thức ngay.

## Đánh giá tuần (tối Chủ nhật)
Đọc `so-theo-doi.json` (nhatKyNgay 7 ngày) + báo cáo hiện có: tổng số bài lên đúng giờ / trễ / đăng tay, lỗi lặp lại nhiều nhất, việc thừa, việc chậm. Đề xuất nâng cấp → làm như mục 6 (bản chờ duyệt). Ghi `danhGiaTuan` vào sổ. Tin nhắn cho anh Cao: tóm tắt tuần + bản chờ duyệt.

## Cập nhật GitHub (qua Chrome, tài khoản phanbacao đã đăng nhập)
- Mọi file nằm ở thư mục gốc của kho. Mở `https://github.com/phanbacao/smh-dang-bai-fb/upload/main` → tìm `input[type=file]` → dùng công cụ tải file với đường dẫn file trong máy làm việc → ghi lời commit → bấm **Commit changes**. File trùng tên sẽ được thay.
- Chuyển bản chính thức: tải `smh6.public.user.js` (đặt tên `smh.user.js`) lên thư mục gốc; tải `trangthai.json` mới (`chinhThuc` = bản mới, `choDuyet` = null).
- Sau khi đẩy: kiểm `curl https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/trangthai.json` (có thể trễ ~5 phút do bộ nhớ đệm).
- Tampermonkey trên 2 máy tự kiểm tra cập nhật mỗi ngày → tự lên bản mới.
