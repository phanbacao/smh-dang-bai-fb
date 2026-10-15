# Quy trình Claude tự kiểm tra — script "Smh đăng bài FB kênh 1"

Người dùng: **anh Cao** (không rành kỹ thuật). Luôn trả lời **tiếng Việt**, ngắn gọn, ngôn ngữ thường. Anh Cao **chỉ duyệt** — không bắt anh làm gì thêm.

Lượt kiểm tra chạy bằng **quy trình cục bộ** trong app Claude trên **Máy Cao (Windows)**, thư mục làm việc `D:\GOOGLE DRIVE\Claude` (thư mục này tự đồng bộ lên Google Drive = sao lưu).

## Quy tắc an toàn (bắt buộc)
- **Không bao giờ bấm "Đăng" trên Facebook thật.** Kiểm tra trực tiếp chỉ dùng "Soạn thử" (dừng trước nút Đăng) rồi đóng hộp, chọn bỏ bản nháp.
- **Không hỏi, không đọc, không dán mã khoá Facebook.** Máy nào mất mã thì nhắn anh Cao tự dán qua "🔑 Cài mã khoá".
- Lark sheet: **chỉ đọc** (qua script). Không sửa sheet bằng tay.
- Không đụng tới trang khi script đang đăng (popup nhấp nháy / có "Đang đăng…").
- Mã bí mật (mã Lark, link nhóm Lark) **không bao giờ** đưa lên GitHub. Bản công khai phải qua bước kiểm tự động trong `build6.py`.
- **GitHub chỉ được ghi khi anh Cao đã trả lời "duyệt" trong chính phiên đó** (đó là lời cho phép đăng công khai). Không tự commit hằng đêm — chế độ tự động sẽ chặn, và cũng không cần.

## Nơi lưu (để không mất giữa các lượt)
Thư mục `D:\GOOGLE DRIVE\Claude\smh-dang-bai-fb\` (gọi tắt là **THƯ MỤC DỰ ÁN**):
- `so-theo-doi.json` — **sổ theo dõi lỗi** (bản đang dùng). Lượt đầu chưa có thì tải từ GitHub về.
- `du-an\` — mã nguồn + trang giả lập (giải nén từ `du-an.tar.gz` trên GitHub nếu chưa có).
- `cho-duyet\` — bản chờ duyệt: `smh.user.js` (bản công khai) + `tom-tat.txt`.
- `mua-dung.json` — lượt chạy nặng gần nhất (để giới hạn mức dùng, xem dưới).

## Chuẩn bị (chỉ làm khi cần sửa lỗi)
1. Kiểm công cụ trên máy: `python --version`, `node --version`. Thiếu thì cài (Python 3, Node.js LTS) — cài 1 lần.
2. Mã nguồn: có sẵn `du-an\` thì dùng; chưa có thì tải `https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/du-an.tar.gz` và giải nén vào `du-an\` (`tar -xzf` có sẵn trên Windows 10/11).
3. Mã bí mật: Google Drive, file **"SMH dang bai - ma bi mat (KHONG CHIA SE)"** (id `1Kc6_UVKSBfreLtVtKKQzVhh-L9mixQH9`) → lưu thành `du-an\v6\bimat.json` (file này KHÔNG bao giờ đưa lên GitHub).
4. Ghép: `cd du-an\v6` → `python build6.py` → ra `smh6.user.js` (bản riêng, dùng cho giả lập) và `smh6.public.user.js` (bản công khai).
5. Trang giả lập (lần đầu): trong `du-an\sim6` chạy `npm i playwright` rồi `npx playwright install chromium`. Chạy: `node chay-tat-ca.js 3` (toàn bộ, khoảng 45–60 phút) hoặc `node chay-tat-ca.js 2 <tên kịch bản…>` (vài kịch bản). Kết quả ở `kq\*.txt`; cuối cùng in "TẤT CẢ ĐẠT" hoặc danh sách lỗi (chạy lại riêng từng cái để loại lỗi do máy quá tải).

## Giới hạn mức dùng
- Mức kiểm tra dùng nhiều nhất là `ky`, rồi `vua`; `nhanh` dùng rất ít.
- Trước khi làm `vua`/`ky`, đọc `mua-dung.json`: nếu **trong 24 giờ qua đã có 1 lượt nặng** (vua/ky) thì lượt này **chỉ làm mức nhanh** (đọc báo cáo, ghi sổ), dời phần sửa sang tối hôm sau — trừ khi có lỗi anh Cao bấm 🛟 hoặc bài không lên được trang (lỗi nặng).
- Làm xong lượt nặng thì ghi `mua-dung.json` = `{ "luc": "<thời gian>", "muc": "vua|ky" }`.

## Lượt kiểm tra mỗi tối (21:59)
1. **Lấy báo cáo của cả 2 máy** (Claude trong Chrome, máy này):
   - Tìm tab Facebook có popup `#smhfb`. Không có / extension không phản hồi → thử lại 2 lần cách 3 phút; vẫn không được thì nhắn anh Cao "tối nay không vào được máy, mai đọc bù" (báo cáo vẫn nằm trên Lark).
   - Chạy JS trong tab: `window.postMessage({smhLayBaoCao:1}, location.origin)`; chờ 5 giây; đọc `document.getElementById('smhfb-bc').value` (đọc từng đoạn 6000 ký tự). Kết quả: `giao` (ô Z5), `cao` (ô Z6), `duyet` (ô Z7), mỗi báo cáo bắt đầu bằng `BC6|` + JSON. Ô trống = máy đó hôm nay chưa có lỗi nào cần ghi (không phải lỗi).
   - Nếu `coBiMat:false` → nạp mã: `window.postMessage({smhBiMat:<nội dung bimat.json>}, location.origin)`.
2. **Đọc báo cáo**: `d.<ngày>.loi` (lỗi gom theo mẫu, n = số lần), `d.<ngày>.hb` (21:30 mỗi máy ghi: số bài đã lên, số dòng lỗi — không có `hb` = máy đó tắt trước 21:30), `uuTien` (hiện trường: `tu:false` = người bấm 🛟 → xử lý TRƯỚC TIÊN; `tu:true` = script tự chụp khi một bước lỗi/kẹt, `ly` = lý do; có `hop` = hộp đang mở, `nk` = nhật ký 40 phút), `drive` (kết quả thử đọc file phát hành trên Google Drive), `slot` (trạng thái 9 bài), `tk` (thống kê từng việc: c lần chạy, ms, kq lần có kết quả), `d.<ngày>.dc` (script tự điều chỉnh). Đọc thêm popup (tab Hôm nay) để biết bài nào trễ / đăng tay.
3. **Chọn mức kiểm tra** theo sổ theo dõi (và mục "Giới hạn mức dùng"):
   - `nhanh` (gần như không lỗi): chỉ đọc báo cáo → ghi sổ → nhắn "ổn".
   - `vua` (có lỗi mới): tái hiện trên giả lập (thêm tuỳ chọn vào `fakefb6.js` + kịch bản vào `sim6.js` và danh sách trong `chay-tat-ca.js`), sửa ở `v6\p*.js` hoặc bản vá trong `build6.py`, chạy toàn bộ kịch bản.
   - `ky` (lỗi đã sửa mà lặp lại / lỗi dày): như `vua` + **soạn thử trên Facebook thật** loại bài liên quan (popup → tab Ngày mai → nút Soạn; dừng trước nút Đăng; xem bước nào khác trang giả lập; đóng hộp, bỏ nháp). Cập nhật trang giả lập cho giống Facebook thật rồi mới sửa.
   - 3 ngày liền không có lỗi mới → hạ 1 mức. Lỗi lặp lại sau khi sửa → lên `ky`.
4. **Tối ưu**: việc có `tk` chạy nhiều mà `kq = 0` suốt 7 ngày → đề xuất giảm (giữ mức tối thiểu cho: bài đã lên chưa, comment đủ chưa, chống trùng). Việc chậm bất thường → tìm cách nhanh hơn.
5. **Có bản sửa** → tăng số bản (`@version`, `PHIEN_BAN` trong `p1_dau.js`; GIỮ NGUYÊN `@name`), ghép, chạy toàn bộ giả lập (phải "TẤT CẢ ĐẠT"), rồi chép `smh6.public.user.js` → `cho-duyet\smh.user.js` và viết `cho-duyet\tom-tat.txt` (lỗi gì → sửa gì; "Đã tối ưu: cũ → mới").
6. Ghi **sổ theo dõi** trong THƯ MỤC DỰ ÁN (lỗi mới, lặp lại, mức kiểm, `nhatKyNgay` 1 dòng/ngày). Không đẩy lên GitHub ở bước này.
7. **Tin nhắn cuối** (3–6 dòng): hôm nay lỗi gì, đã sửa gì, đã tối ưu gì; có bản chờ duyệt thì ghi "Trả lời **duyệt** để em đưa bản <số> lên, 2 máy sẽ tự cập nhật". Không có gì: "Hôm nay ổn, không cần làm gì." **Dòng cuối luôn ghi: "Mức kiểm tra hôm nay: nhanh / vừa / kỹ"** (để anh Cao đối chiếu với trang Mức sử dụng).
8. Anh Cao trả lời **"duyệt"** trong phiên → làm mục "Cập nhật GitHub".

## Đánh giá tuần (Chủ nhật 22:30)
Đọc sổ theo dõi (nhatKyNgay 7 ngày) + báo cáo hiện có: tổng số bài lên đúng giờ / trễ / đăng tay, lỗi lặp lại nhiều nhất, việc thừa, việc chậm, và cả quy trình kiểm tra này (thừa/thiếu bước, tốn mức dùng chỗ nào). Đề xuất nâng cấp → làm như mục 5 (bản chờ duyệt; vẫn theo "Giới hạn mức dùng"). Ghi `danhGiaTuan` vào sổ. Tin nhắn: tóm tắt tuần + bản chờ duyệt + dòng "Mức kiểm tra".

## Phát hành bản mới (CHỈ sau khi anh Cao trả lời "duyệt" trong phiên)
**Nguồn cập nhật hiện tại: GitHub** (`@updateURL` = raw GitHub). Đang thử chuyển sang Google Drive:
- File phát hành trên Drive: `D:\GOOGLE DRIVE\Claude\smh-dang-bai-fb\smh-phat-hanh.txt` (id `1S8X7GJEaVGBPGMf1Eu5UHPvh5m_BVOQj`, đã chia sẻ "Bất kỳ ai có liên kết"). Đuôi .txt là bắt buộc (đuôi .js bị Drive chặn bằng trang cảnh báo vi-rút).
- Khi báo cáo của **cả 2 máy** có `drive.ok = true` (từ bản 6.18): ở bản kế tiếp, tạo file `v6\link_cap_nhat.txt` chứa `https://drive.usercontent.google.com/download?id=1S8X7GJEaVGBPGMf1Eu5UHPvh5m_BVOQj&export=download` rồi ghép → `@updateURL` chuyển sang Drive. Bản đó vẫn phải phát hành qua GitHub 1 lần (máy đang theo GitHub).
- Từ khi nguồn là Drive: phát hành = **ghi đè nội dung** file `smh-phat-hanh.txt` trong thư mục trên bằng `smh6.public.user.js` (ghi đè tại chỗ, KHÔNG xoá/tạo file mới — để giữ nguyên đường link), chờ Drive đồng bộ, kiểm `@version` qua popup (tab Hệ thống → "Nguồn cập nhật"). Sau đó GitHub chỉ còn là bản sao lưu (làm theo mục dưới, không gấp).

## Cập nhật GitHub (CHỈ sau khi anh Cao trả lời "duyệt" trong phiên; Chrome đã đăng nhập phanbacao)
- Chuẩn bị file: `smh.user.js` (= `cho-duyet\smh.user.js`), `trangthai.json` (`{"chinhThuc":"<bản mới>","choDuyet":null,"capNhat":"<ngày>"}`), `so-theo-doi.json` (bản trong THƯ MỤC DỰ ÁN), `du-an.tar.gz` (đóng gói lại từ `du-an\`: `v6\p*.js v6\build6.py v6\eslint.config.js sim6\*.js sim6\*.sh out70_cao.js out62_giao.js big.jpg small.jpg mf\nen.jpg` — KHÔNG có `bimat.json`), và `CLAUDE_KIEM_TRA.md` nếu đã sửa quy trình.
- Kiểm lần cuối: không file nào chứa mã bí mật (tìm các giá trị trong `bimat.json`).
- Mở `https://github.com/phanbacao/smh-dang-bai-fb/upload/main` → tìm `input[type=file]` → dùng công cụ tải file (gắn đủ các file) → ghi lời commit. Nút **Commit changes**: lớp an toàn của Claude KHÔNG cho tự bấm → để nguyên tab và nhắn anh Cao đúng 1 câu: **"Anh bấm nút xanh Commit changes trên tab GitHub đang mở trên Máy Cao."** File trùng tên sẽ được thay.
- Nếu không gắn được file: chép các file đó vào `D:\GOOGLE DRIVE\Claude\smh-dang-bai-fb\tai-len-github\` và nhắn anh Cao đúng 1 câu: "Anh mở github.com/phanbacao/smh-dang-bai-fb → uploading an existing file → kéo các file trong thư mục tai-len-github vào → Commit changes."
- Sau khi đẩy: kiểm `https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/trangthai.json` (trễ ~5 phút). Tampermonkey trên 2 máy tự kiểm tra cập nhật mỗi ngày → tự lên bản mới. Xoá `cho-duyet\` sau khi đã lên.


## (6.19) 3 kênh — lưu ý khi kiểm tra
- Kênh 1 "Vòng Trầm Hương Sơn Mộc Hương ." (9 bài như cũ). Kênh 2 "Trầm Hương Thủ Đức Sơn Mộc Hương" (tab `em39qJ`: H ngày, I video, E caption, G trạng thái, J link). Kênh 3 "Sơn Mộc Hương - Trầm Chuẩn - Giá Chuẩn" (tab `4OtbFA`: H, I, D caption, G, J).
- Kênh 2/3 chỉ đăng dòng có Ngày đăng = hôm nay VÀ Trạng thái "ĐÃ DUYỆT"; đăng xong ghi "ĐÃ ĐĂNG" + link. Giờ: trước bài đầu kênh 1 khoảng 5–15 phút, cùng trang cách ≥ 30 phút.
- Mã khoá: kênh 2/3 cần mã trang riêng (lấy từ `/me/accounts` khi mã dán vào là mã NGƯỜI DÙNG). Popup báo "Mã khoá chưa đọc được trang kênh N" → nhắc anh Cao dán lại mã người dùng. Khi chưa có mã (hoặc mã lỗi): cả 2 máy NHÌN TRANG trước khi đăng để tránh trùng (6.19.2: áp dụng cho cả kênh 1 khi hỏi Facebook lỗi).
- Slot kênh 2/3 có khoá dạng `k2a, k2b…, k3a…` trong báo cáo (`tomTatSlot`).

## (6.19.2) Tổng kiểm tra 3 kênh — những điểm đã sửa (đối chiếu khi đọc nhật ký)
- Gửi bù comment: ô bình luận đứng tên nick cá nhân / trang kênh khác → script chuyển tư cách sang trang của bài (menu tài khoản, hoặc nút "Chuyển ngay" trên trang) rồi mở lại bài. Thử 2 lần không được → ghi lý do, không tải lại liên tục.
- "Đã gửi bù N lần" chỉ đếm khi comment thật sự gửi được (`guiBu`); mở bài mà chưa comment được tính riêng (`buHong`, tối đa 2 rồi báo nhóm). Bài đã báo "cần comment tay" (`baoBu`) không kiểm lại nữa (kể cả lượt 19:00) cho tới khi bấm "Kiểm lại".
- Đang chờ nhân sự rảnh để gửi bù: dùng lại kết quả kiểm vừa có (`buCho`, 20 phút) — không hỏi Facebook lại mỗi vài giây.
- Tin báo ghi rõ thiếu gì: "comment thông tin trang" / "comment mời nhóm Zalo" / "N comment ảnh".
- Dò trùng trước khi đăng: hỏi Facebook lỗi → nhìn trang; video kênh 2/3 trễ > 1 giờ → nhìn trang thêm 1 lần; sheet kênh 2/3 đã ghi "ĐÃ ĐĂNG" → không đăng lại. Dò trùng lần cuối bỏ qua các bài đã thuộc ô khác.
- Mã khoá: nút Đổi/Kiểm tra mã khoá luôn làm với trang kênh 1 (trước đây bấm lúc script đang làm kênh 2 → mã kênh 1 bị thay bằng mã trang kênh 2 → lỗi 190). Dán nhầm mã riêng của trang kênh 2/3 → chỉ lưu cho kênh đó. Facebook báo 190 → bỏ mã đó và tự lấy lại từ mã người dùng (10 phút/lần).
- Dò trang lỗi → vẫn ghi thời điểm thử (không gọi lại mỗi 15 giây). Kênh 2/3 không gán video lạ theo thứ tự.
- Nút "Kiểm tra bài trên trang" kiểm cả 3 kênh; nút kiểm comment 3 bài / 24 giờ thêm video kênh 2/3.
- Giữ chỗ (ô Z1): máy kia giữ ô của bài KHÁC thì không phải nhường.
- Kịch bản giả lập mới: `giaomuon`, `giaomuonma` (cài bản mới giữa ngày, video kênh 2/3 đã đăng tay), `bucao`, `bugiao`, `bucaomenu` (đang ở nick cá nhân, gửi bù phải chuyển tư cách; menu thiếu nút → "Chuyển ngay").

## (6.19.3) Lịch theo dòng sheet + sửa lỗi rà soát
- Kênh 1: sheet có hơn 3 video / 3 manifest trong ngày → tự thêm ô Video 4, 5… / Manifest 4… (khoá `v4`, `m4`…, `it.them = true`), xếp giờ vào khoảng trống trong ngày (đọc sheet giữa ngày thì từ giờ hiện tại), được đăng tới `GIO_CHOT_THEM` 22:30.
- Mọi ô video / manifest / kênh 2, 3 được GHIM vào dòng sheet (`ngay6_<ngày>.gan` = số dòng + 40 ký tự đầu của chữ) → thêm/xoá/đổi thứ tự dòng không làm lệch bài. Dòng của bài đã làm bị xoá → ô giữ nguyên ("mất dòng"), không gán dòng khác.
- Giờ đăng bốc theo ngày (2 máy ra cùng giờ). Máy Giao đúng giờ vẫn liếc ô giữ chỗ Z1 trước khi đăng. `NHUONG_PHUT` 40.
- Bài đăng tay chữ khác sheet chỉ được "nhận theo thứ tự" cho ô ĐÃ tới giờ (`theoThuTu`); sau đọc sheet mà chữ khớp ô khác → chuyển đúng ô.
- Soạn / Đăng ngay: giữ yêu cầu qua tải lại trang, đổi trang + tư cách trước; quá 15 phút chưa làm được → báo và huỷ. Soạn bị gián đoạn vẫn là SOẠN.
- Ghi "ĐÃ ĐĂNG": chỉ dòng cùng ngày, chưa ĐÃ ĐĂNG; lỗi → hàng chờ `ghij_cho6`, 10 phút/lần ghi bù (tối đa 6). Soạn bài ngày mai rồi đăng hôm nay → ghi ĐÃ ĐĂNG vào dòng ngày mai.
- Video >20 phút chưa thấy qua mã khoá → nhìn trang trước khi đăng lại. Comment ảnh: hỏi Facebook số ảnh đã có trước khi gửi. Máy Giao kiểm bài "máy khác" từ phút 20 (Máy Cao 35).
- Kho thẻ video riêng từng kênh (`the6.video`, `video2`, `video3`; mẫu `THE_VIDEO_K2/K3`), tab Comment & Thẻ có 3 nút chọn kênh.
- Kịch bản giả lập mới: `soanmaik`, `soanan`, `themvideo`, `themgiua`.

## (6.20) Báo cáo chỉ số tuần fb kênh 1 (Máy Cao, thứ 6)
- File `v6/p15_chiso.js`. Trạng thái tuần: khoá `cs6` (`tuan` = ngày thứ 6 của tuần, `guiLuc`, `het`, `loiDem`, `bao10`, `chay`, `yc`, `kqCuoi`). Link 2 nhóm Lark: `bimat6.csKQ` / `bimat6.csLoi` (cài bằng nút 🔑 trong tab, KHÔNG có trong code/GitHub).
- Chạy cuối nhịp khi rảnh: không việc dở / soạn / yêu cầu bấm tay, nhân sự không thao tác, tab hiện, ≥ 15 phút trước bài kế tiếp (khi Tự đăng bật). Bước 0 = `damBaoTuCach()` kênh 1; bước 1–6 = 6 trang `professional_dashboard/profile_insights/{views|messaging|audience}/?date_range=LAST_7D|LAST_28D`.
- Đọc số theo nhãn ("Lượt xem" có %, "Số người liên hệ nhắn tin", "Số người theo dõi thực"); % nhắn tin / theo dõi lấy dòng "…% từ N ngày trước"; dấu của Lượt xem theo màu chữ (xanh/đỏ).
- Nhóm KẾT QUẢ chỉ qua `guiHookCS('kq')` (chặn khi thiếu số hoặc là tin thử). Gửi thử / lỗi / 9:30 → nhóm LỖI. Chưa cài link nhóm kết quả thì không tự mở trang.
- Kịch bản giả lập: `chiso`, `chisoban`, `chisoloi`, `chisoloi10`, `chisonut`.
- Sửa kèm: `bimat6` (mã Lark lưu trong máy) được giữ lại khi dọn dữ liệu hằng ngày.
