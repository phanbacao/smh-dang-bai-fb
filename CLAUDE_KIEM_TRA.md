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
2. Mã nguồn — **(6.28.1) LUÔN lấy bản mới nhất trên GitHub trước khi sửa** (bản phát hành ban ngày được đưa thẳng lên GitHub, `du-an\` trên máy có thể đã cũ):
   - Đọc số bản trên GitHub: `https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/trangthai.json` (`chinhThuc`) và dòng `const PHIEN_BAN = '…'` trong `https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/smh.user.js`.
   - So với `PHIEN_BAN` trong `du-an\v6\p1_dau.js`. GitHub mới hơn (hoặc chưa có `du-an\`) → tải `https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/du-an.tar.gz`, đổi tên `du-an\` cũ thành `du-an-cu-<bản>\` (không xoá), giải nén bản mới vào `du-an\` (`tar -xzf` có sẵn trên Windows 10/11), chép lại `bimat.json` (bước 3).
   - Bằng nhau → dùng `du-an\` đang có. Máy cũ hơn GitHub mà không tải được → KHÔNG sửa code tối nay (chỉ đọc báo cáo + ghi sổ), ghi lý do vào tin nhắn cuối.
   - Sổ theo dõi: nếu `so-theo-doi.json` trên GitHub có `capNhat` mới hơn bản trong THƯ MỤC DỰ ÁN → gộp (giữ mục của cả 2, cùng mục thì lấy bản mới hơn) rồi mới ghi tiếp.
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
5. **Có bản sửa** → tăng số bản (`PHIEN_BAN` trong `p1_dau.js`; từ 6.28.1 `build6.py` tự chép số này vào `@version` để Tampermonkey tự cập nhật; GIỮ NGUYÊN `@name`), ghép, chạy toàn bộ giả lập (phải "TẤT CẢ ĐẠT"), rồi chép `smh6.public.user.js` → `cho-duyet\smh.user.js` và viết `cho-duyet\tom-tat.txt` (lỗi gì → sửa gì; "Đã tối ưu: cũ → mới").
6. Ghi **sổ theo dõi** trong THƯ MỤC DỰ ÁN (lỗi mới, lặp lại, mức kiểm, `nhatKyNgay` 1 dòng/ngày). Lượt tối **chỉ cập nhật sổ theo dõi** (và bản chờ duyệt nếu có sửa) — không đẩy lên GitHub ở bước này.
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

## 6.20.1 (15/10/2026) — sửa gấp
- Sự cố sáng 15/10: bản 6.19.x dọn dữ liệu lúc 0h đã xoá `bimat6` (mã Lark) → Lark báo mã 10003, script hiểu nhầm "Lark tạm lỗi kết nối". 6.20 đã giữ `bimat6`; 6.20.1 báo đúng "Máy này chưa có mã Lark (bị mất mã)". Cách nạp lại: cài bản riêng có mã một lần (bản riêng tự cất mã vào máy).
- `khungKhop` (dò bài trên trang trước khi đăng) so dài hơn: trùng tới ~100 ký tự hoặc tới chỗ Facebook cắt "Xem thêm". Trước đây chỉ so 35–40 ký tự nên Kênh 2 · Video 1 ("Cách phân biệt vòng trầm hương 108 hạt thật giả…") bị nhận nhầm là đã có trên trang.
- Ô bị nhận nhầm "máy khác / đăng tay" (tt `co_san`) có nút "↺ Thật ra chưa đăng — đăng lại".
- Nút ⬆ trên thanh popup: hỏi GitHub ngay; có bản mới thì mở trang cài (GM_openInTab), đang mới nhất thì báo, lỗi thì mở thẳng trang cài; đang đăng/soạn thì nhắc chờ xong mới F5.
- Bản riêng cất mã vào máy cả khi máy đã có bimat6 nhưng thiếu appId (vd đã bấm 🔑 Cài nhóm Lark trước).

## 6.20.2 (15/10/2026) — so khớp chặt
- `soChat(text, chuBai, biCat)`: so từ đầu, chỉ bỏ qua xuống dòng/khoảng trắng/dấu câu/icon/hoa-thường, sai tối đa 2 ký tự (Levenshtein giới hạn). Na ná = 2 bài khác nhau (Cao chốt: không hỏi, không chờ). Bị cắt "Xem thêm": phần hiện ≥ 60 ký tự, sai ≤ 1. Bài trên trang dài hơn (hashtag cuối) chỉ chấp nhận khi kịch bản ≥ 80 ký tự.
- Dùng cho: khungKhop (DOM), dauKhop/baiKhop (API). Bỏ nhánh so "40 ký tự có nằm trong bài".
- Na ná ghi nhật ký "So khớp: … giống phần đầu N ký tự nhưng khác nội dung".
- Kiểm tra bài (doTrang): ô `co_san` không link/id mà API không thấy bài → đưa lại hàng chờ + báo lỗi Lark.
- Có lại mã Lark → xoá cổng chờ 10003 ngay.
- Ảnh comment cố định: O2 (cả 3 kênh) + 1 ảnh ngẫu nhiên — kênh 1 từ P2:P10, kênh 2/3 từ Q2:Q10 (tab Bài viết kênh 1, ô trống bỏ qua).
- Kiểm tra bài 3 kênh: trước đây nếu đang có lượt dò kênh khác thì kênh 2/3 nhận luôn kết quả kênh kia (không được dò) → nay chờ rồi dò đúng kênh; bấm tay ghi lý do từng ô chưa thấy.
- Soạn khi còn dang_do mà không có gì đang chạy (vd Tạm dừng): hỏi bỏ phần dở thay vì chặn cứng.

## 6.20.3 — gửi bù kẹt quá 8 phút (kẹt chuyển tư cách) → bỏ lượt, buHong+1, ghi ❌ + báo Lark.

## 6.20.4 — MA_TAB giữ nguyên khi Facebook xoá window.name → hết chờ ~2,5 phút nhận quyền từ chính tab mình. Gửi bù: giới hạn 8 phút tính từ batDauBu.

## 6.20.5 — Kênh 1 mặc định
- Kênh 2/3: bài máy tự đăng không kiểm comment định kỳ (đã comment+kiểm lúc đăng); bài máy khác/đăng tay kiểm 1 lần, chỉ khi còn ≥15 phút trước bài kế tiếp; không kiểm 19:00.
- Facebook đưa sang video lạ (id reel khác) → mở lại đúng bài tối đa 2 lần, rồi dừng + báo (không comment bậy).
- Sửa nền Bài 2: đã Lưu, hộp đóng mà vẫn hiện ảnh → coi như xong (không sửa lại 3 lần).
- Mỗi bài: comment thử tối đa 3 lần (tải lại/mở link) rồi bỏ qua; không kiểm/gửi bù định kỳ cho bài máy tự đăng (cả 3 kênh); bài máy khác/đăng tay kiểm 1 lần; bỏ lượt kiểm 19:00.

## 6.20.6 — Chỉ số tuần bấm tay chạy ngay (chỉ nhường khi đang đăng/comment/đếm ngược); không chờ 'bạn đang dùng trang' / 15 phút.

## 6.20.7 — Thẻ chỉ số tuần ghi kỳ so sánh (kỳ liền trước cùng độ dài) + chú thích.
- Báo cáo cuối ngày dạng thẻ: mỗi kênh, mỗi loại bài 1 hàng (Bài viết → Manifest → Video), link gắn vào tên bài + giờ; bài thiếu chữ đỏ; Lark không nhận thẻ thì gửi chữ (đã xếp theo loại).

## 6.20.8 — giảm lượt Lark: đọc sheet gộp 1 lượt (4 tab + Z3:Z4, docNhieu/values_batch_get, lỗi thì đọc từng tab); Máy Cao bỏ lượt 13:30 + đọc mỗi giờ khi thiếu; ĐÃ ĐĂNG gom ghi 12:30/19:30/22:40 (ghigom6, mỗi tab 1 đọc + 1 ghi); báo cáo lỗi Z6 tối đa 4 tiếng/lần; bộ đếm lượt theo loại (lark_dem.loai, tab Hệ thống).

## 6.20.9 (16/10) — sửa: demLark() không url (tải tệp Lark) lỗi "reading 'split'" làm hỏng đăng video khi phải tải video (Máy Cao K3); demLark bọc try. damBaoTuCach: xử lý hộp xác nhận "Chuyển trang cá nhân" (bấm Chuyển nếu đúng trang, đóng nếu sai) — Máy Giao K3 báo không tìm thấy nút chuyển.

## 6.20.10 — rời trang (pagehide) thì ghi nha vào khoa_dang_bai_that; trang mới nhận quyền ngay nếu nha < 120s (Facebook xoá sessionStorage khi chuyển tư cách → mã tab đổi → trước đây chờ ~2,5 phút).

## 6.20.11 — soChat: chữ ngắn (≥30 ký tự, vd manifest) trùng trọn phần đầu (sai ≤1) mà bài trên trang có thêm chữ ở cuối → coi là cùng bài (6.20.2 chỉ cho khi ≥80 ký tự → Manifest 1 không tìm thấy để gắn thẻ).

## 6.21 (17/10) — KÊNH 1 MỚI
- Kênh 1 = trang "Vòng Trầm Hương Sơn Mộc Hương" (/vongtramhuongsonmochuong1, profile 61595055137817, mã trang Graph tự tìm qua /me/accounts theo tên đúng cả dấu chấm + khác id cũ 1196332230224812 → kenh_id6[1]); tab video/manifest t79PeC, video cột M (COT_VIDEO_K1=12); bài viết vẫn tab apU3Ne.
- Kênh 1 cũ "…Hương ." tạm dừng; công tắc tab Hệ thống (GM that_k1_cu). Đổi trang → đặt lại lịch kênh 1 hôm nay + mai (giữ K2/K3), xoá du_lieu6/dang_do/cho_tay6/ghigom6/ghij_cho6 (k1_trang6).
- chuanTen giữ dấu chấm cuối; chuaTenTrang() cho hộp "Chuyển trang cá nhân"; ô "Bình luận dưới tên" so bằng chuanTen; kênh 1 mới mà userID trang = 61590895435527 (kênh cũ) → coi là sai tư cách.
- tokenTrang(1) kênh mới dùng mã trang riêng (fb_tok_trang6[id]); tuDoMaKenh lấy cả kênh 1.
- Sim: kịch bản cũ seed that_k1_cu=true.

## 6.22 (17/10) — đếm ngược mọi việc trên trang
- batDemNguoc(ten, giay): 10s việc lâu (đăng, comment, gửi bù, gắn thẻ/cảm xúc), 3s bấm tay; nút Làm ngay + Tạm dừng/Tiếp tục (tự tiếp tục sau 10 phút); bỏ Hoãn 10 phút.
- Comment (dang_do cho_binh_luan): đếm ngược 10s lần đầu, 3s sau mỗi lần tải lại; tab ẩn thì chờ.
- Tab ẩn: không còn thông báo trên máy (thongBaoMay chỉ ghi nhật ký); trễ ≥ 1 tiếng mới báo Lark 1 tin/bài (khoa tab_an_<slot>).
- binhLuan: không thấy ô comment sau 10s mà có vòng tải (progressbar/aria-busy) → LoiChuaGui → tải lại (tối đa 3 lần) rồi bỏ qua.

## 6.23 (17/10/2026)
- Sửa nền đỏ Bài 2: hộp "Chỉnh sửa bài viết" kiểu mới (Tiếp → Cài đặt bài viết → Lưu), vẫn hiểu kiểu cũ có Lưu ngay; đóng hộp đúng nút mới khi lỗi. Đã thử trực tiếp trên trang kênh 1 mới.
- Mọi nút Tạm dừng tự chạy lại sau 10 phút (giữ cả khi tải lại trang, ô tam_dung_luc).

## 6.23.1 (17/10/2026)
- Sửa vòng lặp: sheet ghi ĐÃ ĐĂNG (không link) nhưng trang chưa có → trước đây đánh dấu co_san rồi dò trang trả lại hàng chờ, lặp mãi (Làm ngay không ăn). Nay giữ co_san (nguon=sheet) chừng nào sheet còn ghi ĐÃ ĐĂNG; log chỉ rõ hàng.
- Bỏ nút Hoãn 10 phút ở thanh chờ nhân sự; không hiện "Xong: đăng bài" khi chỉ đang chờ.

## 6.24 (17/10/2026)
- Gắn thẻ + cảm xúc video: hiểu hộp "Chỉnh sửa bài viết" kiểu mới (Gắn thẻ người khác → option aria-label "Gắn thẻ Sơn Mộc Hương," → Xong; Cảm xúc/hoạt động → listbox; Tiếp → Cài đặt bài viết → Lưu). File p16_suamoi.js. Đã thử trực tiếp trên Video 5 trang mới.
- Đóng hộp kiểu mới khi lỗi (Đóng hộp thoại của công cụ tạo → Bỏ).
- Chờ người: bỏ tính bấm chuột/cuộn; chỉ chờ khi gõ dở hoặc có hộp soạn/sửa do người mở.
- Nhật ký: (+Ns) mỗi bước, "⏱ … xong sau N giây" mỗi việc, ngưỡng NGUONG_GIAY → "⚠️ Bước quá lâu" (vào báo lỗi + tab Hệ thống, ô cham6).
- Lịch hôm nay: đã đăng trên (gọn 1 dòng) → Bài kế tiếp → Chưa đăng theo giờ dự kiến (duKienLich); trái 60%/phải 40%; >12 bài thu nhỏ; "Chờ đến giờ" → "Xếp hàng sau … · dự kiến ~…".
- Sim: fakefb6 openEditReelMoi (INIT.reelMoi, goiYKhongCo); kịch bản reelmoi, reelmoitim, uitre.

## 6.24.1 (17/10/2026)
- soChat (biCat): chữ bị cắt trước "Xem thêm" chỉ cần ≥ 30 ký tự (trước ≥ 60) — trang mới chỉ hiện ~2 dòng nên không tìm thấy bài để gắn thẻ/cảm xúc. Thử: M4 đúng, M2/V3 khác bài không nhận nhầm.
- vongSuaVideo cuộn tìm bài 10 lần × 1000px (trước 6 × 900).

## 6.24.2 (17/10/2026)
- Hộp sửa kiểu mới: sau Tiếp, video/thước phim hiện "Cài đặt thước phim" (bài viết là "Cài đặt bài viết") → hopCaiDatMoi nhận cả hai (loại màn đăng thước phim có nút Đăng). Thử trực tiếp trên Manifest 6 máy Giao.
- Lỗi Tiếp ghi rõ các hộp đang thấy.
- Một lần: cho thử lại các bài đã dừng vì lỗi Cài đặt / chưa thấy bài (sua6242).
- Sim: fakefb6 hộp mới mặc định "Cài đặt thước phim"; kịch bản reelmoibv cho "Cài đặt bài viết".

## 6.24.3 (18/10/2026)
- Gắn thẻ + cảm xúc: thử tới 23:30 (GIO_CHOT + 120 phút, trước +60).
- Lỗi 4 lần: không gửi Lark nữa, chỉ ghi "⚠️ … cần gắn tay … (không báo Lark)" vào nhật ký + Báo lỗi.
- Vẫn gắn cho mọi video/manifest trong lịch, kể cả nhân sự đăng tay.
- Sim: kịch bản suahong (INIT.suaHongHet).

## 6.24.4 (18/10/2026)
- luuHopMoi.timLuu: máy thật — khung dialog "Cài đặt thước phim" chỉ có tiêu đề + Quay lại, nút Lưu nằm ở khung cha → leo lên tối đa 6 bậc. Thử trực tiếp trên máy Giao (manifest đầu ngày 18/10): Lưu được, hộp đóng sau ~4 giây.
- Sim: fakefb6 đặt nút Lưu ngoài dialog Cài đặt thước phim (giống máy thật).

## 6.25 (18/10/2026)
- Tải tệp (Máy Giao): ảnh tải sẵn từ đầu ngày; video chỉ tải trước giờ đăng 90 phút; mỗi file tải sẵn 1 lần, lỗi thì không tải lại, lúc đăng tải 1 lần nữa (tai6.boQua). ≥2 file → gộp 1 lượt Lark (drive/v1/medias/batch_get_tmp_download_url, ≤5 file); Lark không cho (mã khác lỗi mã khoá) → lo_batch6 = hôm nay, tải lẻ ngay. Video tải > 90 giây → "⚠️ Tải … chậm". Máy Cao chỉ tải khi đăng thay. Thêm @connect larksuite.com, larksuitecdn.com (Tampermonkey có thể hỏi quyền 1 lần). Tải gộp chưa thử với Lark thật.
- Máy Cao đọc sheet: chỉ 16:00 ('cao16') + 1 lần trước khi đăng thay ('thay', r.caoDoc). Tự kiểm tra sáng chỉ đọc khi máy chưa có dữ liệu hôm nay (dữ liệu 16:00 đã gồm 3 ngày tới).
- Giảm lượt Lark: bỏ liếc Z1 khi Giao đăng đúng giờ; đọc lại sheet vì thiếu nội dung chỉ khi bài đó còn ≤ 30 phút; ghi ĐÃ ĐĂNG gộp vào mốc 13:40/18:40/22:40 (dùng dữ liệu ≤ 60 phút); Z5 tối đa 6 tiếng/lần. Giả lập cả ngày Giao ~21–27 lượt (thực tế 17/10: 87).
- Bài thêm: sau giờ hẹn bài trước 30–45 phút (ngẫu nhiên theo ngày, 2 máy cùng lịch), tối đa 1 bài thêm giữa 2 bài thường, muộn nhất 21:00 (GIO_THEM_MUON_NHAT).
- Lark tối giản: baoLoi chỉ gửi khoá nguy cấp (KHOA_NGUY_CAP: thieu_, lark_, suckhoe, loitrang, giahan, tab_an_, thay_, loi_, trung_, tong12_, tongtoi_, nhacsheet_), còn lại chỉ ghi nhật ký. Nhắc sheet 16:00 chuyển sang nhóm lỗi. Tab ẩn chỉ báo khi trễ > 2 tiếng.
- Mới: báo ngay khi trang có 2 bài trùng nội dung hôm nay (trung6); 12:00 tổng kết bài buổi sáng lỗi/trễ > 30 phút (tk12_); thiếu bài cuối ngày → nhóm lỗi trước (tongtoi_bc), rồi Marketing.
- Báo cáo Marketing dạng thẻ gọn: dòng "Đã đăng X/Y bài" cỡ heading, mỗi kênh 1 khối, mỗi loại 1 dòng (B1/M1/V1 bấm mở bài), bài thiếu chữ đỏ, không ghi lý do.
- Máy Giao tự đưa tab Facebook lên trước lúc 05:00 / 12:30 / 19:00 (MOC_NHAY_TAB, @grant window.focus, nhay6), chỉ trong 15 phút sau mốc, mỗi mốc 1 lần; nhật ký ghi đã chuyển được hay chưa. Chưa thử trên Chrome thật.
- Nhật ký: bỏ (+Ns) khi khoảng cách > 900 giây (bước cũ bị treo).
- Sim: kịch bản trungbai, tong12, taibh (C.batchHong), ngay2may, nhaytab, nhaytab2; in GIỜ từng máy, ĐỌC SHEET THEO MÁY, BATCH.

## 6.26 (19/10/2026)
- Kênh 4 Trầm Hương Hà Xá (KENH[4], hx/anSo/ganThe/khongDuyet): tab ZSDDld — E chữ đăng (chỉ cột E), H trạng thái, I ngày đăng, J video, K ghi link; có video là đăng (kể cả ĐÃ QUAY), dòng ĐÃ ĐĂNG giữ chỗ. Đăng như kênh 2/3 (trước bài đầu kênh 1 5–15 phút, cách 30 phút), Máy Giao chính/Máy Cao dự phòng. Không gắn vị trí Sơn Mộc Hương; kho thẻ video4 trống → bỏ bước thẻ. Comment riêng CMT_HX (4 dòng, sửa ở tab Comment & Thẻ, cmt6.gocHx) — không CTA Zalo/ảnh SMH. Gắn thẻ "Trầm Hương Hà Xá" + cảm xúc qua màn "Chỉnh sửa thước phim" kiểu cũ (TAG_TEN theo kênh); bỏ nếu rời trang quá 40 phút. Trang không có tên riêng: duongNay() đổi /profile.php?id=… → /100092534930523. Tên hiển thị tenKenh()/tenKenhDai() (không ghi "Kênh 4"; nhãn HX·n). KENH_PHU=[2,3,4], KENH_ALL=[1,2,3,4]; regex k[2-4]. Mã đọc trang lấy tự động từ mã người dùng (/me/accounts, theo tên). Đã kiểm thực tế trên Máy Cao 19/10: chuyển tư cách sang trang Hà Xá được; hộp gắn thẻ tìm ra "Gắn thẻ Trầm Hương Hà Xá, Trang"; cảm xúc li[role=option] > [role=button][aria-label].
- Nhiều hàng bài viết cùng ngày: hàng thứ r → Bài 3r+1/3r+2/3r+3 (loai b1/b2/b3, hangSo, baiThem), d.ngay[].bais; ganGioBaiThem rải đều 06:30–21:00 vào khoảng trống rộng nhất, cách mọi bài kênh 1 ≥ 30 phút, ngẫu nhiên theo ngày, giờ tăng dần theo số bài.
- Báo thiếu: bỏ nhắc "hàng … cột H còn trống"; chỉ kiểm ngày mai + ngày kia, bảng kênh × ngày (bangThieu, ô xanh đủ / đỏ thiếu N).
- ĐĂNG BÀI: TẮT = tắt hẳn (tatDang trong nhip): không đăng/đăng thay, không comment/gửi bù, không gắn thẻ/cảm xúc, không tải tệp, không chạy chuẩn bị; việc dở dừng (trừ video đang chờ Facebook xác nhận). Còn: đọc sheet, dò trang, báo cáo, nhắc thiếu.
- Báo cáo tuần thêm "Video nổi bật (kênh 1)": dsVideoK1 (/posts + reactions/comments khách/shares), soVideo (video_insights blue_reels_play_count, post_video_followers; dự phòng total_video_views), xếp 7 & 28 ngày; top 3 xem, xem nhiều nhất không #manifest, 24h đầu thấp/cao (ghiXem24h trên Máy Cao 30 phút/lần, ô v24_6 giữ 40 ngày), follow, tương tác top 3. Không có số thì bỏ phần này + báo nhóm lỗi. Chưa thử với Facebook thật → dùng "Soạn thử" ở tab Chỉ số tuần.
- Sim: TRANG tramhuonghaxa, TAB ZSDDld; kịch bản hx, bai4, tatdang, bangthieu, chisovid; mock video_insights; thẻ tìm theo tên trang.

## 6.26.1 (19/10/2026)
- Đổi tư cách sang trang Hà Xá bị treo: menu tài khoản không có trang Hà Xá → script mở trang, bấm "Chuyển" trên trang, nhưng Facebook hỏi lại hộp "Chuyển trang cá nhân" mà script không bấm (lần sau phải chờ 5 phút, hộp có thể bị đóng như "hộp lạ") → lặp mãi ở tư cách kênh 1. Nay: xacNhanChuyen() bấm "Chuyển" trong hộp ngay sau khi bấm nút trên trang / trong menu, và đầu lượt nếu hộp còn mở; không đóng hộp "Chuyển trang cá nhân" như hộp lạ.
- Sim: INIT.chuyenHoi (hộp xác nhận như máy thật), kịch bản hxchuyen (menu không có trang Hà Xá).

## 6.26.2 (19/10/2026)
- Máy Giao 18:29–18:38 vẫn lỗi "không tìm thấy nút chuyển sang Trầm Hương Hà Xá (cả trong menu lẫn trên trang)" ở /profile.php: (1) menu tài khoản chỉ có 2 mục chuyển nhanh; nút "Xem tất cả trang cá nhân" chỉ có aria-label (không có chữ) nên code cũ (tìm theo innerText) không bấm; danh sách "Chọn trang cá nhân" có nút aria-label "Trầm Hương Hà Xá, 10 thông báo" (không có "Chuyển sang …") nên timNutChuyen không thấy. (2) Nút "Chuyển" trên trang nằm ở khung trái — cửa sổ hẹp thì khung thu lại, dangHien = false. Đã kiểm DOM thật trên Máy Cao.
- Sửa: tìm "Xem tất cả trang cá nhân" theo cả aria-label; timNutChuyen nhận nút trong danh sách "Chọn trang cá nhân" (bỏ đuôi ", N thông báo"); nút "Chuyển" trên trang nhận cả khi khung trái đang ẩn; nhật ký ghi từng bước.
- Sim: menu có "Xem tất cả trang cá nhân" (aria-label) + danh sách "Chọn trang cá nhân"; INIT.khongNutTrang; kịch bản hxmenu.

## 6.26.3 (19/10/2026)
- 21:48:15 Máy Cao có người bấm "✓ Đã đăng tay" cho Trầm Hương Hà Xá · Video 1 → panel hiện "Đã lên 21:48 · đánh dấu tay" dù trang chưa có bài (nhật ký: "Bấm Đánh dấu đã đăng"). Claude đã bấm "Bỏ đánh dấu" (bài đã quá 21:30 → về "Đã bỏ"), không ghi ĐÃ ĐĂNG vào sheet.
- Báo cáo Marketing 21:46 (13/20) gửi trước lúc đánh dấu tay (panel 14/20 = 13 + Hà Xá V1 đánh dấu tay) → báo cáo đúng tại thời điểm gửi.
- Sửa: nút "Đã đăng tay" hỏi Facebook trước (bài hôm nay trên trang của kênh đó); không thấy → cảnh báo, mặc định Huỷ; thấy → lấy giờ đăng + link thật, để script kiểm comment.
- Sim: kịch bản danhdau.

## 6.26.4 (19/10/2026)
- Máy kia đang giữ chỗ (ô Z1) vẫn đăng được bằng tay: bấm "Đăng ngay"/"Soạn" → script đọc Z1; máy kia giữ (< NHUONG_PHUT) → hỏi "⚠ Máy Giao đã giữ chỗ … Bạn có muốn đăng không?" → OK: ghiDe (slot.ghiDe) → giuCho(k, true) ghi đè Z1 rồi đăng; Huỷ: không làm gì. Panel chi tiết bài hiện "🔒 Máy Giao đang giữ chỗ từ HH:MM" (slot.khoaKhac khi bị nhường).
- Chống trùng: vẫn dò trang qua Facebook ngay trước khi bấm Đăng (như cũ). Thêm kiemKhoaTruocDang(slot): máy nào đã giữ chỗ bài này (đăng trễ) thì ngay trước khi bấm Đăng đọc lại Z1 — máy kia đã nhận bài (người bấm Đăng tay) → không bấm Đăng, đóng hộp, 15 phút sau kiểm lại trang (e.nhuong).
- Sim: kịch bản ghide (Z1 = KHOA|…|v1|GIAO → Máy Cao bấm Đăng ngay → ghi đè → đăng).

## 6.26.5 (19/10/2026)
- Trang chưa tham gia nhóm nào (Trầm Hương Hà Xá): hộp "Chia sẻ lên nhóm" hiện "Không tìm thấy nhóm nào" → script bấm 4 cách mở danh sách rồi kẹt "Chưa quay lại được màn Cài đặt thước phim". Nay ganNhom nhận ra hộp trống → bấm Xong/← → bỏ qua bước nhóm, vẫn đăng; nhớ 3 ngày (khong_nhom6) để khỏi mở lại. Bước phụ lỗi: quay lại màn Cài đặt bằng Xong → nút ← → Esc.
- Kiểm bài đã có trước khi đăng: hỏi được Facebook (mã khoá) thì chỉ dùng kết quả đó, bỏ việc lướt trang (trước: kênh phụ trễ > 1 giờ vẫn lướt); không hỏi được → F5 trang (mỗi bài 1 lần, f5_kiem6) rồi mới nhìn trang.
- Tin nhóm lỗi gọn: tinTongKet() — tiêu đề 1 dòng + mỗi bài 1 dòng "• giờ hẹn  tên — lý do ngắn" (lyDoNgan: thiếu nội dung / không chuyển được tư cách / kẹt màn Cài đặt / lỗi bước nhóm / máy chưa đăng tới) cho Tổng kết 12:00, 21:30, cuối ngày. Máy Cao chỉ gửi khi chính nó đăng thay và Máy Giao không có bài nào 3 giờ qua (caoNenBao) → hết cảnh 2 máy gửi trùng.
- Sim: INIT.khongNhom (hộp nhóm trống), kịch bản hxnhom.

## 6.26.6 (20/10/2026)
- Sửa nền đỏ Bài 2 lỗi trên Máy Giao (nhân sự sửa tay). Kiểm DOM thật trên Máy Cao (mở hộp sửa bài cũ, đóng KHÔNG lưu):
  - Kênh 1 mới: hộp nổi "Chỉnh sửa bài viết" (không aria-label; có thêm 1 hộp nhỏ aria-label "Chỉnh sửa bài viết"). Nút gỡ là "Gỡ file đính kèm trong bài viết" (1 nút gỡ hết ảnh), gỡ xong hiện bản đồ check-in cũng có nút đó → gỡ tiếp (vị trí "đang ở Sơn Mộc Hương" vẫn giữ). Nút Aa chỉ hiện khi hết đính kèm → code cũ chờ "Gỡ ảnh"/Aa nên báo "không mở được hộp". Tiếp → Cài đặt bài viết → Lưu. Đóng: "Đóng hộp thoại của công cụ tạo" → "Thay đổi chưa lưu" → Bỏ.
  - Kênh 1 cũ: màn sửa toàn trang /post/edit/ (không phải hộp): form "Bài viết", "Gỡ ảnh" từng ảnh, Aa hiện sau khi gỡ, Lưu ở cuối cột trái (ngoài form). Lần mở đầu có thể đứng mãi ở khung xám → F5 thì tải được. Thoát: Quay lại → "Rời khỏi trang?" → Rời khỏi.
- Viết lại suaNenDo (p17_suanen.js, thay đoạn suaNenDo/dongHopSua trong build): gocSuaNen() nhận cả 2 kiểu; thaoTacNen() gỡ hết đính kèm → Aa → Đỏ đậm → Lưu (hoặc Tiếp → Lưu). Màn toàn trang tải > 35 giây → luu('suanen_url6') + F5; khi tải lại, xuLyDangDo2 gọi suaNenSauTaiLai(dd) làm tiếp trên màn sửa rồi về bài. dongHopSua theo đúng kiểu. nguoiDangThaoTac không coi màn sửa do script mở là "người đang thao tác" (__smhMoSua 4 phút) → hết cảnh chờ 10 phút (treo) sau khi sửa nền lỗi.
- Mọi đếm ngược 3 giây (batDemNguoc luôn 3, DEM_NGUOC_GIAY 3).
- Tư cách: mỗi lần tìm được ô bình luận ghi tên "Bình luận dưới tên …" vào dòng "Tư cách Facebook" (ghiTuCachO, 30 giây/lần) → bảng không còn hiện tên tư cách cũ của lần kiểm trước.
- Sim: INIT.suaMoi / suaCu / suaCuCham; kịch bản suamoi, suacu, suacucham.

## 6.26.7 (20/10/2026)
- "Comment và sửa nền đỏ Bài 2 chạy cùng lúc": code chạy tuần tự (sửa nền xong mới comment), nhưng ở 6.26.5 sửa nền lỗi "không mở được hộp" trong khi hộp sửa THẬT đang mở (kiểu mới không có "Gỡ ảnh"/Aa lúc đầu), dongHopSua bắt nhầm hộp nhỏ aria-label "Chỉnh sửa bài viết" nên không đóng → thử 3 lần rồi comment khi hộp sửa vẫn mở. 6.26.6 đã sửa nhận hộp; 6.26.7 thêm chốt: trước khi comment nếu còn hộp/màn sửa (gocSuaNen / Cài đặt bài viết / /post/edit/) → đóng hẳn (chờ 12 giây), không đóng được → tải lại trang rồi mới comment.
- Tab "Bài viết kênh 1" cột G (Trạng thái, danh sách "Đã đăng"/"Chưa đăng"): script trước giờ KHÔNG ghi cột này (19/10, 20/10 còn "Chưa đăng"). Nay ghiTTBai(): ở mốc gom 13:40 / 18:40 / 22:40 (Máy Cao trễ 20 phút), hàng nào cả 3 bài (theo LICH, kể cả hàng bài 4–6) đã lên trang → đọc lại tab (A:H) xác nhận đúng ngày + đúng chữ cột B → ghi G = "Đã đăng".
- Nhật ký Máy Cao 20/10:
  - Hà Xá gắn thẻ chính trang mình: Facebook KHÔNG hiện thẻ tự gắn trên bài (chỉ "đang cảm thấy …") → vongSuaVideo kiểm "chưa đủ" → làm lại 4 lần (08:11–08:28). Nay: thẻ = tên trang mình (tuGan), đã Lưu 1 lần + có cảm xúc → xong. Sim: fake không hiện thẻ tự gắn của Hà Xá.
  - Kênh 2 · Video 1: 8 thẻ đều "không được nhận sau 3 cách" (mất 2 phút). Nay 2 thẻ đầu đều hỏng → bỏ các thẻ còn lại. (Chưa rõ nguyên nhân thẻ không nhận trên Máy Cao — cần xem thêm.)
  - 07:06–07:08 Máy Cao nhận Kênh 3 · Video 1 → chuyển tư cách (trang tải lại) → sau khi tải lại lại chọn Hà Xá · Video 1 (giờ hẹn sớm hơn) → chuyển tư cách lần nữa; Kênh 3 bị bỏ dở (Máy Giao đăng 07:17). Nay: luu('dang_tiep6') lúc bắt đầu đăng; trong 6 phút sau, vongDang ưu tiên làm tiếp đúng bài đó.
  - Máy Giao giữ chỗ Hà Xá · Video 1 lúc 06:30 / 06:52 / 06:58 nhưng không đăng (Máy Cao đăng thay 07:09) → cần nhật ký Máy Giao.

## 6.26.8 (20/10/2026)
- Cao báo tab "Kênh 1 Vòng Trầm Hương SMH mới" hàng 132 (19/10) và 137 (20/10) còn "ĐÃ DUYỆT":
  - Hàng 137 KHÔNG sót: là Video 3 hôm nay, hẹn 18:10 (panel: Video 3 · cột M 137.mp4). Video 4/5/6 (bài thêm) đăng buổi sáng nên các hàng sau đã "ĐÃ ĐĂNG" trước.
  - Hàng 132 (Video 3 ngày 19/10, "4 lý do khiến ngày càng nhiều…") bị sót thật: 18:06:47 nhật ký Máy Cao "thấy Video 3 (đăng tay lúc 18:06, nhận theo thứ tự)" — 1 video lên trang lúc 18:06 có chữ khác sheet → luật dự phòng "nhận theo thứ tự" gán nó vào ô Video 3 → script coi Video 3 đã đăng, không đăng hàng 132. Trên trang không có bài "4 lý do…".
- Sửa: luật "nhận theo thứ tự" bỏ qua bài có chữ giống bất kỳ bài nào trong sheet hôm nay (vd đăng lại / đăng trùng 1 video đã có) và bài người đã gỡ (s.boTT); mỗi lần lấp theo thứ tự thì báo nhóm lỗi để người kiểm; ô lấp theo thứ tự có nút "↺ Không phải bài này" (đưa lại hàng chờ, nhớ id để không gán lại).
- Sim: kịch bản trungtt (video 1 đăng lại lúc 18:06 → Video 3 vẫn chờ đăng; checker báo LỖI do dữ liệu cố tình có 1 bài trùng).

## 6.26.9 (20/10/2026)
- Quy trình đăng video Hà Xá theo Cao làm mẫu (ghi trên Máy Giao): Ảnh/video → gắn video (không chờ 100%) → chữ mô tả → Vị trí: gõ "trầm hương hà xá" → chọn "Trầm Hương HÀ XÁ 15/15 Làng Tăng Phú…" → Tiếp → Thêm thẻ (mỗi thẻ gõ + dấu phẩy) → Tiếp → hình thu nhỏ: Chỉnh sửa → khung 0 → Lưu → (không có nhóm) → Đăng.
- Máy Giao lúc đó chạy 6.26.4 (chưa có bản sửa nhóm trống 6.26.5) → kẹt bước nhóm.
- Sửa: KENH[4].viTri; viTriKenh() dùng cho ganViTri (tự đăng + nút "Gắn vị trí & thẻ"); Hà Xá không còn bỏ vị trí. THE_VIDEO_K4 = 8 thẻ Hà Xá (kho Hà Xá trống → dùng kho mặc định). Mỗi video bốc 8 thẻ ngẫu nhiên (SO_THE 8).
- Nút "Gắn vị trí & thẻ": theo kênh của trang đang mở (kenhCuaDuong) → vị trí + kho thẻ kênh đó (bài có #manifest → kho Manifest), bốc thẻ ngẫu nhiên; kho trống → bỏ bước thẻ.
- Bước phụ (vị trí / thẻ / nhóm / hình thu nhỏ) mọi kênh: thử các cách bên trong bước, không được → bỏ bước, vẫn đăng ngay lần đầu (__smhNhe = true), báo nhóm lỗi 1 lần/bài/bước.
- Nhắc kiểm tra thẻ: kho thẻ 7 ngày chưa sửa/xác nhận (hanKiemThe, mốc = the6.luc) → mục "🏷 Đã N ngày chưa kiểm tra thẻ" trong việc cần xử lý; tab Comment & Thẻ có nút "✓ Xác nhận vẫn dùng" (lưu lại kho, luc = bây giờ, đồng bộ Z4; dongBoThe nhận cả bản chỉ đổi mốc).
- Chưa làm: gắn bù vị trí/thẻ sau khi đăng (màn sửa thước phim không có ô thẻ) — bước bị bỏ được báo nhóm để người xử lý.
- Sim: fake vị trí trả "Trầm Hương HÀ XÁ" khi gõ "hà xá"; hx/hxnhom: V3 vị trí Hà Xá + 8 thẻ.

## 6.26.10 (20/10/2026)
- Cao soạn thử Hà Xá bằng nút "Gắn vị trí & thẻ" trên Máy Giao (6.26.9): (1) nút gắn vị trí "Sơn Mộc Hương" — trang Hà Xá mở dạng /profile.php KHÔNG kèm mã trang nên kenhCuaDuong() = 0 → kênh 1; (2) màn Cài đặt thước phim của Hà Xá KHÔNG có mục "Chia sẻ lên nhóm" (trang chưa tham gia nhóm) → ganNhom báo "không thấy mục Chia sẻ lên nhóm" và nút dừng, chưa làm hình thu nhỏ.
- Sửa: kenhCuaDuong ở /profile.php không mã → nhận kênh theo tên trang (h1/h2) rồi theo tư cách vừa kiểm (suc_khoe.tuCach). ganNhom: đang ở màn Cài đặt mà không có mục nhóm → coi là trang chưa có nhóm, bỏ bước, nhớ khong_nhom6 3 ngày (lần sau không chờ tìm mục). Nút hiện "Trang chưa có nhóm → bỏ qua" và làm tiếp hình thu nhỏ.
- Sim: INIT.khongMucNhom (Hà Xá không có mục nhóm), kịch bản hxkhongmuc.

## 6.27 (21/10/2026) — (thay tên cho 6.26.11)
- Báo cáo chỉ số tuần (Máy Cao, tự động thứ 6): tới giờ mà tab Facebook đang ẩn → window.focus() tự chuyển về tab (mỗi lần tải trang 1 lần). Chrome không cho → nhacMayCS(): GM_notification (bấm vào → focus tab) + chuông 3 tiếng (AudioContext), thứ 6 07:45–09:00 cứ 15 phút 1 lần (csnhac6), mỗi lần nhắc thử focus lại. Kiểm tab ẩn trước các lý do bận khác (vd "sắp tới giờ đăng bài"). Xem xong về trang kênh 1 như cũ.
- Tiêu đề khung "📊 Báo cáo chỉ số tuần" chữ sáng khi Facebook giao diện tối.
- Sim: window.focus giả có cờ __focusHong; kịch bản chisoan (tự chuyển tab → xem 6 trang), chisoanhong (07:00 thử chuyển + 6 lần thông báo 07:45→09:00).
- Ghi chú: số 7 ngày = 28 ngày (▲100%) trên tab Chỉ số tuần ngày 21/10 nhiều khả năng do trang kênh 1 mới lập < 28 ngày — đối chiếu lại khi chạy thật thứ 6.

## 6.27.1 (21/10/2026) — Cao cài tay, chưa lên GitHub
- 21/10 Video 4 (bài thêm) hẹn 07:22 trước Video 1 (07:58) vì ganGioThem rải vào khoảng trống, không theo số. Nay: bài thêm giữ số thứ tự trong cùng loại (v4 sau v3, v5 sau v4; m tương tự; b4 sau b3…), vẫn rải khoảng trống ≥ 30 phút; hết chỗ thì nối tiếp (giờ luôn tăng). Bài viết hàng thêm (b4–b6) được tới GIO_CHOT_THEM (22:30) như video/manifest thêm. Lịch đã có: xếp lại 1 lần trong ngày (s.thuTu27) các bài thêm chưa đăng.
- Ô chi tiết bài thêm hiện "bài thêm theo sheet · hẹn HH:MM" (trước: "khung undefined–undefined").
- Đếm ngược đã Tạm dừng: không nhấp nháy (khung, viền bảng, tiêu đề tab), chỉ còn 1 nút "▶ Tiếp tục", ghi giờ tự tiếp tục.
- Tab Comment & Thẻ: 2 nút chọn "💬 Comment" / "🏷 Thẻ" (thẻ đến hạn kiểm tra có chấm đỏ), tiêu đề các khung chữ sáng khi giao diện tối.
- Sim: themvideo, bai4, hx, uicmt (ảnh kq/uicmt_*.png), demnguoc.

## 6.28 (21/10/2026) — tổng rà soát (2 lượt soát song song: đăng/comment và lịch/sheet/báo cáo)
1. Chờ video lên trang: qua mốc 20 phút vẫn hỏi 4 phút/lần; kênh chưa có mã khoá quá CHO_VIDEO_LEN_PHUT+2 thì thôi tải lại trang, đi tới kết luận (trước: treo việc dở cả ngày).
2. Trước khi đăng lại video (Facebook chưa trả bài sau hạn): tab ẩn → chờ tab hiện để nhìn trang (tối đa +30 phút), không đăng lại mù.
3. kiemKhoaTruocDang: mọi lần đăng (kể cả đúng giờ) đọc ô giữ chỗ 1 lần trước khi bấm Đăng; máy kia giữ chỗ bài này còn hạn → nhường.
4. Ô Z1 chứa nhiều khoá ("KHOA|ngày|slot|máy|lúc ; …", dsKhoa/docKhoa(v, slot)/ghiKhoaO) → 2 máy giữ 2 bài khác nhau không đè nhau; giuCho xác nhận đúng khoá của bài mình.
5. Bài viết ghim theo dòng (s.ganB, hangBaiGhim: số dòng + 40 ký tự đầu) → chèn/đổi ngày dòng khác giữa ngày không lấy nhầm chữ bài đã đăng. Sim chendong.
6. Báo "2 bài trùng": cùng link thì bỏ (Facebook trả 1 thước phim 2 lần); Máy Cao chỉ báo khi caoNenBao.
7. Số ngẫu nhiên theo ngày bị tràn số (seed*31 không cắt 32 bit) → thẻ manifest/kênh phụ và câu CTA ngày nào cũng giống nhau. Sửa ">>> 0".
8. Đếm lần chuyển tư cách: riêng từng trang ('lan_chuyen|tên trang'), xoá khi đã đúng tư cách.
9. dongBoLich: kênh 2/3/Hà Xá đang đọc tab lỗi → giữ ghim dòng cũ của kênh đó.
10. ganGioBaiThem: chỗ trống SỚM NHẤT sau bài liền trước (trước: giữa khoảng rộng nhất → dồn về tối, dễ bị bỏ 22:30). ganGioThem tính cả giờ Bài 4–6.
11. Bản Soạn chờ bấm Đăng: 15 phút ghi lại ô giữ chỗ (khoá không hết hạn ở phút 40).
12. Sửa nền đỏ tải lại màn sửa qua roiTrang (gỡ hộp "Rời khỏi trang?").
13. Hoãn 10 phút áp cho cả comment và gắn thẻ + cảm xúc.
14. Lệnh "về trang" hẹn 4 giây không chạy khi vừa bắt đầu chuẩn bị đăng bài (__smhChuanBi 90 giây).
15. Tổng kết cuối ngày: chỉ coi tổng kết 21:30 là đã gửi khi gửi được.
16. 'the6_bd', 'csnhac6' vào danh sách giữ khi dọn dữ liệu (nhắc kiểm thẻ 7 ngày không bị reset mỗi ngày).
17. ghiTTBai: đánh dấu mốc chỉ khi ghi xong; nhớ dòng đã ghi/đã thấy "Đã đăng" (ttbai6_) để khỏi đọc lại tab.
18. Tổng kết 12:00: gửi được mới đánh dấu (lỗi thì 5 phút thử lại trong khung 12–13h).
19. (thêm) Tin "nhận theo thứ tự" (6.26.8) và "bỏ bước phụ" (6.26.9) không lọt KHOA_NGUY_CAP nên chưa từng gửi nhóm → thêm theothutu_, boqua_.
- Sim đạt: ngay, haimay, ghide, bai4, themvideo, khongan, videodung, kenh, caothay, tranh, chendong (mới).

## 6.28.1 (22/10/2026) — Soạn thử chỉ số tuần + video nổi bật đủ 4 mục
1. Soạn thử: tab Chỉ số tuần hiện khung "Xem trước tin Lark" dựng bằng chính hàm gửi (`theCS`) → giống hệt thẻ sắp gửi (bảng 7/28 ngày, video nổi bật có link bấm được). Dòng "Soạn lúc HH:MM — dùng lại được tới HH:MM".
2. Ô "📝 Ghi chú thêm" (khoá `csghichu6`): có chữ → thêm 1 dòng ở cuối tin; Gửi ngay / gửi tự động xong thì tự xoá.
3. Gửi thử / Gửi ngay trong 30 phút sau lần soạn (`kqCuoi`, cùng tuần, Gửi ngay cần đủ số) → gửi đúng bản đó (`guiLaiCS`), không xem lại 6 trang.
4. Mục video không đọc được → vẫn gửi, ghi "chưa đọc được (lý do)"; thêm 1 tin vào NHÓM LỖI liệt kê mục thiếu (`loiVideoCS`).
5. Video nổi bật: 1 Lượt xem (top 3 7/28, không tính #manifest, 24h thấp/cao) · 2 Follow · 3 Nhắn tin (ước tính: comment khách hỏi giá/ib/tư vấn/còn không…, `HOI_MUA_RE`) · 4 Tương tác.
6. Mã đọc trang không trả lượt xem từng video → ghi lý do Facebook vào nhật ký; mở Thư viện nội dung (`/professional_dashboard/content/content_library`) đọc bảng (cột "Lượt xem"/"Lượt theo dõi", cuộn hết, số "1,2K", dòng chia sẻ nhóm lấy số lớn nhất), khớp theo 40 ký tự đầu (`khoaSo`). Bước này là `chay.buoc = 7`, `chay.tv` 1→2.
7. Lượt xem 24h: Facebook không trả → ghi vào `tv24_6`; Máy Cao rảnh (điều kiện như chỉ số tự động) mở Thư viện nội dung đọc, 60 phút/lần, tối đa 3 lần/video, quá 40h thì bỏ (`vongTV24`, chạy sau `vongChiSo`).
8. Lỗi "Cannot read properties of undefined (reading 'ten')": bị ngắt sau bước 6 (buoc = 7) → lượt sau đọc CS.BUOC[6]. Sửa: buoc > 6 → làm tiếp phần video; trangThaiCS chặn chỉ số.
9. `@version` tự lấy từ PHIEN_BAN khi ghép (trước kẹt 6.22 → 2 máy không tự cập nhật). `@name` giữ nguyên.
10. Quy trình tối: luôn so bản GitHub với `du-an\` và tải bản mới hơn trước khi sửa; lượt tối chỉ cập nhật sổ theo dõi.
- Sim đạt: chisolai (mới: soạn → ghi chú → gửi thử/gửi ngay dùng lại, Thư viện nội dung), chisotv (mới: tự động thứ 6, mã không trả lượt xem), tv24 (mới: lượt xem 24h đọc ở Thư viện nội dung), chisobuoc7 (mới: lỗi "ten"), chisonut, chisovid, chiso, chisoloi, chisoan, ngay, haimay, ui, uicmt.

## 6.28.2 (22/10/2026) — báo cáo tuần chỉ video chính + lịch 2 máy
1. Báo cáo tuần — Video nổi bật chỉ tính video chính: bỏ manifest theo #manifest HOẶC chữ trùng 40 ký tự đầu với 1 hàng Manifest (cột G tab Kênh 1, `khoaManifestSheet`, đọc 1 lần khi soạn). Bỏ mục "Nhắn tin (comment hỏi mua)" và dòng "Video xem nhiều nhất (không tính #manifest)". Còn 3 mục: Lượt xem (top 3 + 24h đầu) · Follow · Tương tác.
2. Lỗi số "10": Thư viện nội dung có nhiều video cùng câu mở đầu ("Cách phân biệt vòng trầm hương 108 hạt thật giả…") → khớp theo chữ bị nhầm. Nay khớp theo MÃ BÀI: dòng gốc có link "Thông tin chi tiết" `content_id` = base64 "S:_I<id trang>:<mã bài>:<mã bài>" (`maBaiTV`); dòng chia sẻ vào nhóm (không có link) bỏ qua. Không có mã thì chỉ khớp chữ khi đúng 1 dòng gốc (120 ký tự).
3. Giao diện thẻ (tin Lark + khung xem trước giống hệt, `theCS`/`oCS`): mỗi kỳ 1 hàng `column_set` 3 ô (👁 Lượt xem / 💬 Nhắn tin / 👥 Theo dõi; số `text_size: heading`, % xanh/đỏ); video mỗi dòng "🥇 **số** · tên (link)", 7 ngày trên – 28 ngày dưới. Lark từ chối thẻ thì tự gửi dạng chữ (như cũ).
4. Lịch 2 máy (`dongBoLichThem`, ô Z8 tab Bài viết kênh 1, dạng `LICH6|{ngay,ban,may,luc,gio:{v4:phút,…}}`): mỗi lần đọc sheet (lượt gộp có thêm Z8) — ô chưa có lịch hôm nay / lịch bản cũ hơn → ghi lịch bài thêm của máy mình; ô có lịch hôm nay cùng bản hoặc mới hơn → làm theo cho bài CHƯA đăng. 2 máy ghi cùng lúc: 20–30 giây sau đọc lại; Máy Giao ưu tiên (đã ghi hôm nay thì không theo Máy Cao, trừ khi Cao chạy bản mới hơn — `lichghi6`). Dự phòng: 1 máy tắt / ô trống / đọc ô lỗi / ô có chữ khác → máy còn lại tự xếp như cũ.
5. Đổi bản → tự xếp lại giờ bài thêm chưa đăng theo luật mới (s.banLich; chỉ khi đã có dữ liệu sheet của ngày). Nguyên nhân 22/10: lịch Máy Giao tạo từ bản cũ (6.26.10, Video 4 07:xx, Video 5 08:40), Máy Cao bản mới (Video 5 20:43) → 2 máy lệch thứ tự.
6. Ngay trước khi bấm Đăng (`kiemCachTruocDang`, kênh 1, không áp cho "Đăng ngay"): hỏi Facebook 3 bài mới nhất; có bài lên SAU lúc mình bắt đầu soạn chưa đủ 20 phút (máy kia / đăng tay) → đóng hộp, chờ đủ 20 phút rồi đăng (choDen). Trước đây chỉ kiểm lúc bắt đầu nên 2 máy có thể đăng sát nhau.
- Sim đạt: chisolai (giao diện mới, bỏ manifest kể cả không hashtag, khớp mã bài), lich2may (Giao lịch cũ → xếp lại + ghi Z8, Cao làm theo), lich1may (chỉ Máy Cao, ô của hôm khác → tự xếp + ghi), cach20 (bài chen 08:11 → Video 1 chờ tới 08:32), cùng các kịch bản cũ liên quan.

## 6.28.3 (22/10/2026) — lịch kênh 1 rải đều trước 20:00 + 3 khung Sáng/Chiều/Tối
1. `xepDeuK1` (p6_core): mọi bài kênh 1 trong ngày (kể cả bài thêm) xếp xen kẽ Bài 1 → Video 1 → Manifest 1 → Bài 2 → … → Bài 4 → Video 4 → Manifest 4 … rải đều 06:30–20:00 (lệch ngẫu nhiên theo ngày, 2 máy ra cùng giờ). Chỉ xếp lại bài CHƯA đăng; giữa ngày (thêm bài / lên bản mới) rải từ giờ hiện tại (cách bài vừa đăng ≥ 30 phút) tới 20:00. Không đủ chỗ cách 30 phút → rút còn 15; vẫn không đủ → kéo tới 21:00 (cách 15). Chạy lại khi danh sách bài đổi (s.sigK1), đổi bản (s.banXep) hoặc có bài mất giờ.
2. `cachK1`: khoảng cách đăng bù / cách bài gần nhất trên trang = 15 phút khi số bài kênh 1 còn lại × 30 phút vượt 20:00, còn lại 30 phút (kênh 2/3/HX không đổi). Giờ chốt giữ nguyên (bài thường 21:30, bài thêm 22:30).
3. Lịch 2 máy (ô Z8) nay chứa giờ TOÀN BỘ bài kênh 1 + `sig` (danh sách bài); máy kia cùng sig thì làm theo; khác sig thì Máy Cao chờ lịch Máy Giao tối đa 60 phút rồi mới tự ghi.
4. Panel tab Hôm nay: lịch chia 3 khung (Sáng < 12:00, Chiều 12–18, Tối ≥ 18:00; bài đã lên tính theo giờ lên, chưa lên theo giờ dự kiến), mỗi khung viền màu + "x/n đã đăng" + thanh tiến độ; bài kế tiếp nằm trong khung của nó. Nút "↗ Mở bài" của bài đã đăng rộng bằng nút Soạn (min-width 84px). Ô chi tiết bài kênh 1 ghi "xếp đều trong ngày · hẹn HH:MM" (bỏ "khung 07:45–08:05").
- Nguyên nhân 22/10 lịch tới 22:31: luật giữ số thứ tự đẩy Manifest 4/5, Bài 6 ra sau Manifest 3 (19:20) + bài thêm được tới 22:30 + bài trễ buổi trưa dồn 30 phút/bài.
- Sim đạt: xep9 (9 bài 06:32 → 19:59), xep16 (18 bài, cách ~45 phút, 2 máy cùng giờ), xeptre (mở máy 17:30 còn 18 bài → cách 15 phút), xepanh (ảnh 3 khung), ngay, haimay, themvideo, lich2may, lich1may, cach20, caothay, tranh, bai4, chendong, ngay2may.

## 6.28.4 (22/10/2026) — báo cáo tuần: đọc số từng video qua trang Thông tin chi tiết
- Nguyên nhân "chưa đọc được": mã đọc trang thiếu quyền `read_insights` (#200). Đã thêm quyền vào trường hợp sử dụng của ứng dụng "SMH Doc Bai Trang" (Trường hợp sử dụng → Tùy chỉnh → read_insights → Thêm), tạo mã mới, dán 🔑 Đổi mã khoá → Soạn thử 22:30 đọc đủ lượt xem/follow.
1. Dự phòng khi mã thiếu quyền: `buocTVCS` mở trang `/content/insights/?content_id=base64("S:_I<mã trang>:<mã bài>:<mã bài>")` (`linkTTCT`, `dangOTTCTCua` so mã bài sau khi giải base64) của TỪNG video chính (tối đa 20, ≤ 20 giây/trang, tổng ≤ 18 phút), đọc `docTTCT` (số đứng trước nhãn "Lượt xem"; "Lượt theo dõi" số đứng sau). Vẫn thiếu → Thư viện nội dung 1 lần. chay.tv: 1 = đang mở từng trang, 3 = Thư viện, 4 = xong.
2. Lượt xem 24h (`vongTV24`): thay Thư viện nội dung bằng trang Thông tin chi tiết từng video (tv24_6.dangK = video đang mở, tối đa 3 lần/video, 60 phút/lượt, mỗi lượt ≤ 8 phút).
3. Thẻ: lỗi 1 dòng ngắn (`ngan`: thiếu quyền / hết hạn / không khớp); ▲100% (kỳ trước = 0) → "mới"; 7 ngày = 28 ngày → ghi chú "page mới lập từ 17/10". Tên video trống → chữ dòng sheet theo link (`tenTuSheet`), không có → "Video đăng HH:MM dd/mm".
- Sim: fake trang /content/insights (số theo mã bài). Đạt: chisotv (6 trang chi tiết), tv24 (2 video ghi qua trang chi tiết), chisolai, chiso, chisobuoc7.

## 6.28.5 (23/10/2026) — tiết kiệm lượt Lark
- Hạn mức cả tổ chức 10.000 lượt/tháng (gói Starter, gồm cả bot KPI "CAO's AI Assistant"). 1–22/10 đã dùng 8.801 (bot 6.209 phần lớn do lỗi đầu tháng, script 2.590).
1. `kiemKhoaTruocDang`: Máy Giao đăng đúng giờ (≤ GIAO_GIU_CHO_SAU_PHUT sau giờ hẹn, không phải bấm tay) hoặc vừa giữ chỗ < 5 phút (`__smhKhoaLuc`) → không đọc ô Z1 (trước: mỗi bài 1 lượt, 11–20 lượt/ngày).
2. Trần mềm/ngày (`TRAN_LARK_NGAY`: Giao 35, Cao 15; `larkTietKiem`): chạm trần thì bỏ việc phụ — ghi báo cáo lỗi Z5/Z6 (trừ khi bấm 🛟), ghi lại ô lịch Z8, ghi cột G. Việc chính vẫn chạy.
3. Báo cáo lỗi: 8 tiếng/lần (trước 6). ghiTTBai: Máy Cao chỉ ghi dự phòng 1 lần sau 23:00.
4. Đếm lượt tháng mỗi máy (`lark_thang6`) hiện ở tab Hệ thống.
- Sim: ngay 36 → 24 lượt/ngày, themvideo 47 → 32; caothay, ngay2may đạt.

## 6.28.6 (24/10/2026) — sửa gấp: Facebook đổi nhãn nút tài khoản
- 24/10 sáng không đăng được bài nào cần chuyển trang: nút ảnh đại diện góc trên phải đổi aria-label "Trang cá nhân của bạn" → "Account, your profile" (nhãn cũ chỉ còn ở svg bên trong). Lỗi: "Không mở được menu tài khoản Facebook".
- `vu6286.py`: `nutTaiKhoan()` tìm theo NHAN_TK (nhãn cũ/mới, vi/en) → svg bên trong nút → nút cuối của vùng "Cài đặt và kiểm soát tài khoản"; ghi nhật ký cách đã tìm thấy (`ghiCachTK`). Thay mọi chỗ chờ nút theo nhãn cũ.
- Sim: fake nút mang nhãn mới (C.nhanCu = nhãn cũ). Đạt: kenh, caothay, ngay, hxmenu. Facebook thật: mở + đóng menu chuyển trang OK.

## 6.28.7 (24/10/2026) — hộp "Trang mới" + gỡ kẹt "Đang làm"
1. `dongHopTrangMoi` (p18_them, 2,5 giây/lần): thấy nút "Dùng Trang"/"Use Page" nằm trong hộp có tiêu đề "Chào mừng bạn đến với Trang mới!" / "Đã cập nhật Trang của bạn!" → bấm, giữ nguyên công tắc mặc định (email quảng cáo tắt), ghi nhật ký. Hộp này hiện 1 lần mỗi trang khi Facebook chuyển trang sang kiểu Trang mới (24/10 gặp ở kênh 2, Hà Xá) và che trang.
2. `goKetDangLam` (mở trang + 60 giây/lần): bài tt='dang' quá 8 phút (batDau) mà không có dang_do / đếm ngược / cho_tay6 của bài đó → tt='cho', thuLai +30 giây, lyDo 'gỡ kẹt "Đang làm"'. Lượt đăng sau kiểm trang đã có bài chưa (không trùng). 24/10: Bài 1 kênh 1 và Video 1 kênh 2 kẹt "Đang làm…" sau khi trang tải lại giữa lúc đăng.
- Sim: trangmoi (hộp hiện → tự bấm, Bài 1 vẫn đăng), ketdang (b1 kẹt 20 phút → gỡ, đăng 07:38). Facebook thật: dò nút 1 ms/lần.

## 6.28.8 (24/10/2026) — chặn tốn lượt Lark ở ô giữ chỗ Z1
- 24/10 Máy Cao 349 lượt/ngày (đọc Z1 240, ghi Z1 79): Máy Giao kẹt cả sáng → Máy Cao đăng thay ~10 bài, mỗi bài hỏng nhiều lần, mỗi lần thử lại giuCho từ đầu (đọc + đọc/ghi + chờ 20 giây + đọc = 4 lượt) + mỗi lần bấm Soạn + bản soạn chờ bấm Đăng ghi lại 15 phút/lần.
1. Nhớ khoá của máy (`khoa_minh6`, `coKhoaMinh`/`nhoKhoa`, 25 phút): giuCho / ghiKhoaO / kiemKhoaTruocDang dùng lại khoá còn hạn, không gọi Lark; giữ chỗ hỏng (máy kia giành) thì xoá nhớ. Bản soạn chờ bấm Đăng ghi lại khoá 25 phút/lần (ghiKhoaO(k, true)).
2. Trần cứng/ngày (`TRAN_CUNG_LARK`: Cao 60, Giao 100) trong goiLark: vượt thì chỉ cho việc chính (đọc sheet/tab, tải tệp, ghi tab kênh, lấy mã); việc khác ném LoiMem có e.tranCung. Giữ chỗ bị trần cứng → Máy Cao vẫn đăng (đã kiểm trang). Báo 1 tin nhóm (khoá trancung_ trong KHOA_NGUY_CAP).
- Sim z1cao (chỉ Máy Cao, Video 1 hỏng liên tục): 6.28.7 49 lượt (Z1 28) → 6.28.8 33 lượt (Z1 12), cùng số bài đăng. trancung: chạm trần → vẫn đăng Bài 1, báo nhóm. Đạt: ngay, haimay, caothay, kenh, ketdang, trangmoi.

## 6.28.9 (24/10/2026) — chống gửi trùng báo cáo ngày + rà trần cứng
- 24/10: nhóm "Báo cáo fb kênh 1" nhận 2 thẻ: Máy Giao 20/20, Máy Cao 19/19 lúc 22:31 (nhánh 21:45+20). Máy Cao đã chạm trần cứng 60 → đọc ô Z2 bị chặn → "vẫn gửi". Máy Cao không có Hà Xá V2 vì lần đọc sheet cuối 16:01.
1. `laViecChinhLark` viết lại: việc chính = đọc sheet / tải / lấy mã / đọc-ghi mọi tab không phải ô Z / đọc-ghi ô Z2 (O_BAO_CAO). Việc phụ = các ô Z khác + "ghi Bài viết (gộp)" (ghiTTBai). `TEN_TAB_DEM` thêm tab Hà Xá (trước đó "ghi ZSDDld" bị chặn khi chạm trần).
2. `xemDauBaoCao()` (đọc Z2, thử 2 lần): dùng cho cả 2 nhánh. Nhánh "đủ bài, bài cuối của máy này": cả 2 máy xem Z2 trước; Máy Cao chờ 5 phút sau bài cuối; Máy Cao không đọc được Z2 thì chờ tới 22:05 rồi mới gửi.
3. `canGhiBC`: chạm trần cứng → false (1 dòng nhật ký) — hết lặp "Ghi báo cáo lỗi lên Lark chưa được" mỗi 15 giây.
4. `choDD`: việc dở phải chờ (người đang thao tác, không phải tab chính, tạm dừng, đếm ngược bị hoãn, chờ nhân sự) → ghi nhật ký tối đa 2 phút/lần (22:22–22:30 gửi bù comment 19:30 im lặng 8 phút).
- Sim: bccao (Cao đăng thay bài cuối 19:59 → báo cáo 20:04, ghi Z2), bccaoz2 (Cao chạm trần + Z2 đã có GIAO → không gửi), bccaomuon (22:05, chạm trần, Z2 GIAO → không gửi), baocao (Giao gửi như cũ), trancung.

## 6.29 (26/10/2026) — dự phòng khi Lark hết lượt API
- 26/10: cả công ty hết hạn mức 10.000 lượt/tháng (mã 99991403, cấp lại 1/11). Bài chữ vẫn đăng bằng dữ liệu đọc lúc 20:14 25/10; video/manifest hỏng vì tải file qua API (`taiTepLark` → `chanLark` gate quota).
1. `taiTepWeb` (p5_kho): GET `https://internal-api-drive-stream-sg.larksuite.com/space/api/box/stream/download/all/<fileToken>/?mount_point=sheet` (dự phòng: miền LINK_SHEET), GM_xmlhttpRequest anonymous:false → dùng cookie Lark web của Chrome, không tính lượt API. Đã thử thật trên trang Lark (video Hà Xá 53,6 MB, mã 200, video/mp4). Nhận biết chưa đăng nhập: 401/403 hoặc trả html/json → `lark_web6.hong`, nghỉ cách web 30 phút (trừ khi hết lượt API thì luôn thử web) + báo nhóm 1 lần/ngày `larkweb_`.
2. `taiTepLark`: kho → Lark web → API (như cũ). Tab Hệ thống có dòng trạng thái Lark web.
3. Tải sẵn (`dsTaiSan`/`taiSan`): hôm nay + 2 ngày tới (ảnh, video; video manifest hôm nay + mai), cả 2 máy (Máy Cao chỉ khi Lark web chạy, ĐĂNG BÀI bật), chạy cả khi hết lượt API; bỏ qua khi có bài đến giờ ±5 phút; gộp link tạm API chỉ khi Lark web hỏng.
4. Cảnh báo lượt: chạm trần mềm ngày → báo `tranmem_`; lượt tháng của máy chạm 1500 (Giao) / 700 (Cao) → báo `tranthang_`.
- CHƯA làm được: đọc nội dung sheet qua Lark web (dữ liệu sheet tải về dạng khối mã hoá client_vars/sub_block) → hết lượt API thì nội dung sửa/thêm sau lần đọc cuối không thấy.
- Sim: quotaweb/quotadang/taisan2 (19 file tải qua web, 0 lượt API cho file), quotalogin (web trả trang đăng nhập → báo nhóm, rơi về API/hết lượt → báo chưa tải được).

## 6.30 (26/10/2026) — đọc sheet qua tab Lark web khi hết lượt API
- Script có thêm @match `https://zgml41unmm8.sg.larksuite.com/wiki/*` và `/sheets/*`: trên trang Lark chỉ chạy `larkWebHelper` (p0_larkweb.js) rồi dừng.
1. Trợ lý (tab sheet Lark): khi tab Facebook đặt cờ `lark_webcan6` (Lark hết lượt API, `datCoLarkWeb`, 5 phút/lần) → 20–30 phút/lần đọc các tab cần (TAB_BAI, TAB_VIDEO, kênh 2/3/Hà Xá): `POST /space/api/v3/sheet/client_vars` (header `x-csrftoken` = cookie `_csrf_token`, `x-command: api.sheet.rce.message`, body {sheetRange:{sheetId}, openType:0, memberId: số bất kỳ, token, schemaVersion:9, clientVersion:'v0.0.1'}) → `snapshot.gzipBlockMeta` (JSON gzip: cellBlockMetas từng tab) + `snapshot.blocks` (base64 gzip protobuf); khối thiếu thì `GET /space/api/v3/sheet/block?token&block_token=<id>&schema_version=9&blockIds=<id>`.
2. Giải mã khối (đã đối chiếu với dữ liệu API cũ: hàng 35–37 tab Bài viết khớp từng ký tự; kênh 2 hàng 138/139 thiếu video, Hà Xá 26–31/10 đủ video): 1.2.12.1 = {1 hàng đầu, 2 cột đầu, 3 số hàng, 4 số cột, 5 sheetId}; 1.2.12.2 = bảng giá trị {1: số (float64 nối liền), 2: chuỗi, 3: chữ nhiều đoạn {1: chỉ số chuỗi, 2: đoạn {1 kiểu (1 chữ, 3 tệp đính kèm, 4 link), 2 độ dài UTF-16, 4 chỉ số bảng}}}; 1.2.12.3 = bảng phụ {1 ảnh nhúng [mã], 5 link [url], 6 tệp [mã, mime, dung lượng]}; 1.2.12.6 = {1: lưới hàng×cột (varint nối liền, chỉ số bản ghi), 2: bản ghi ô {1 kiểu (2 số, 3 chuỗi, 6 nhiều đoạn, 7 ảnh nhúng), 2 chỉ số, 6 định dạng}}. Đổi ra đúng dạng API (chuỗi, số ngày, [{type:url|text|attachment}], {type:'embed-image'}). Lưới không khớp số ô → báo lỗi, không lưu.
3. Lưu `lark_webdata6` {luc, tabs:{sheetId: values}}, trạng thái `lark_webtt6`; nhãn nhỏ góc trái dưới trang Lark. Thử thật trên Chrome: 5 tab 1,3 giây, ~1,4 MB.
4. Tab Facebook: `goi()` khi Lark bị chặn (hoặc vừa bị chặn) và là GET đọc ô → `webDocUrl` trả dữ liệu Lark web (tuổi ≤ 6 giờ) như API. `chanDocLark()` thay `chanLark()` ở các cổng đọc sheet (đọc theo lịch, đọc khi đăng, nhắc điền). Ghi lên sheet vẫn bị chặn như cũ. Nút Đọc ngay khi hết lượt: đặt `lark_webyc6`, chờ trợ lý ≤ 2 phút. Báo nhóm 1 lần/ngày `larkwebtab_` nếu hết lượt > 30 phút mà chưa có tab Lark nào đọc giúp.
5. Sửa: các khoá lark_web6/lark_webdata6/lark_webtt6/lark_webcan6/lark_webyc6 thêm vào GIU (6.29 bị dọn lark_web6 mỗi lần khởi động).
- Sim: webdoc (hết lượt từ đầu ngày, có dữ liệu Lark web → đọc sheet, đăng Video 1, tải file qua web, 0 lượt API), webkhong (không có tab Lark → báo nhóm), quotaweb.

## 6.31 (27/10/2026) — tạo ảnh manifest từ chữ nhập trực tiếp (Demo 1)
- Tab Manifest bước 2: nút chọn "✍ Nhập trực tiếp / ▦ Lấy từ sheet" (`mf_nguon6`; chưa chọn → Lark hết lượt thì mặc định nhập trực tiếp). Ô `textarea.mfnhap` (`mf_chu6`, lưu khi gõ, không vẽ lại khi đang gõ), đếm "N khối → N ảnh" (`tachKhoiMF`: tách theo dòng trống).
- `taoAnhXemTruoc(vung, chuTay)`: có chuTay thì không đọc sheet (không gọi Lark), mỗi khối = 1 ảnh (x.tay, nhãn "Ảnh i"), dùng cùng `taoAnhManifest`/font/ảnh nền; Tạo lại và Vẽ lại font dùng như cũ.
- Tải: `taiAnhMF` (thẻ a download, tên `manifest-ddmm-i.jpg|png`), `taiTatCaMF` (lần lượt, cách 0,7 giây). Nút "⬇ Tải" trên mọi ảnh (cả ảnh lấy từ sheet), "⬇ Tải tất cả (N)" cạnh nút Tạo. Ảnh nhập tay: ẩn "Dán vào sheet".
- Sim: taoanhtay (3 khối → 3 ảnh, không gọi Lark khi tạo, tải 1 ảnh + tải tất cả = 4 file), taoanh (lấy từ sheet + dán 2/2 vẫn đạt).

## 6.31.1 (27/10/2026) — sửa: Đọc lại sheet khi hết lượt vẫn lỗi 99991403
- Máy Cao 10:26: tab Lark web đã đọc xong (nhãn ✓ 10:26) nhưng Đọc ngay báo "Lark đã hết hạn mức API tháng — đang chờ kiểm tra lại", "Đọc lúc" vẫn 20:14 25/10. Nguyên nhân: `goiLark` gọi `larkToken()` trước; mã truy cập cũ hết hạn (2 giờ) → xin mã mới đi qua `goi()` → cổng chặn ném lỗi trước khi tới bước dùng dữ liệu Lark web.
- Sửa: đầu `goiLark`, nếu GET và `chanLark()` → `webDocUrl(url)` trước.
- Sim webdoc2 (đã hết lượt từ trước, không có mã Lark, bấm Đọc ngay): bản cũ lỗi đúng như máy thật; bản mới "Đọc lúc 09:50".

## 6.31.2 (28/10/2026) — báo cáo tuần: 28 ngày = 0 trong khi 7 ngày = 8.418
- Thẻ 23/10: Lượt xem 7 ngày 8.418 (▲280.500%), 28 ngày 0 (—). Nguyên nhân: `docTrangCS` trang views: chưa tìm thấy con số (trang đang tải) nhưng trong trang có chữ "Chưa đủ dữ liệu" (biểu đồ con / mục khác) → trả `{so: 0}` ngay, không chờ hết 25 giây, không tải lại.
- Sửa (p15_chiso): (1) không trả 0 khi có chữ "Chưa đủ dữ liệu" — chờ hết 25 giây, tải lại 1 lần; vẫn không có số mà trang ghi "Chưa đủ dữ liệu" → `{so: null, khongRo}` hiển thị "Không xác định được" (thẻ, tin chữ, bảng xem trước). (2) Kiểm hợp lý: 28 ngày views/messaging < 7 ngày → tải lại 1 lần; vẫn nhỏ hơn → "Không xác định được". (3) `trungKy` bỏ qua khi so null.
- Sim: chiso28 (lần 1 trang 28 ngày chưa có số → tải lại → 41.337), chiso28k (mãi không có số → "Không xác định được" trong thẻ; bản 6.31.1 ghi 0).

## 6.32 (29/10/2026) — mức đặt số bài/ngày + cảnh báo thiếu mới
- Mức đặt (`mucDat`, `muc_dat6`, mặc định K1 1 video + 1 hàng bài, K2 0, K3 1, HX 1): nút "⚙ Mức đặt" trên khung việc → `khungMucDat` → `luuMucDat` (máy này + ô Z9 `MUCDAT|{…}`; ô Z9 có chữ khác hoặc Lark hết lượt → chỉ lưu máy này). Đọc Z8:Z9 cùng lượt đọc sheet → `dongBoMuc` (lấy bản có `luc` mới hơn).
- Kênh 1 theo sheet: `ganDong` bỏ 3 ô v/m cố định (chỉ giữ khi ngày đó chưa có dữ liệu); `lichNgay` chỉ có Bài 1–3 khi có hàng bài viết; `dongBoLich` giữ ô b1–b3 đã làm. Manifest chỉ thành ô khi dòng có đủ chữ (G) + ảnh (H), không báo thiếu.
- `thieuCuaNgay`: bỏ ô manifest; thêm cột J chưa "ĐÃ DUYỆT" (vẫn đăng, `videoCuaNgay` có tt/duyet); `canhBaoMuc`: ít hơn mức → thiếu N; ≥ 3× mức → quá nhiều. `canhBaoKenh`: bỏ "chưa có dòng nào" (theo mức), mức 0 → không nhắc gì (kể cả lỗi đọc tab).
- Giao diện: dòng "Hôm nay: …" (ít/quá nhiều so với mức); bảng: ngày mai ô đỏ (tính vào việc), ngày kia ô vàng `bt-vang` (nhắc sớm, `khongDem`); chỉ có nhắc sớm → khung vàng "💡 Nhắc sớm". Cột kênh ghi mức/ngày, kênh mức 0 ghi "tạm dừng".
- Sim: mucdat (mở ⚙, sửa K1 = 3, K2 = 1 → ghi Z9, cảnh báo đổi theo), ngay 9/9, thieu, ui, kenh, chuanbi, ngaymai, haimay, baocao, chot, lich2may, kenhtay, hx đạt.
