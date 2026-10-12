# Smh đăng bài FB kênh 1 — script tự đăng bài fanpage "Vòng Trầm Hương Sơn Mộc Hương ."

## Cài trên máy mới (máy hỏng, đổi máy…)

1. Cài tiện ích **Tampermonkey** cho Chrome.
2. Mở link: **https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/smh.user.js** → bấm **Cài đặt**.
3. Mở trang Facebook của fanpage → trên popup chọn **Máy Giao** hoặc **Máy Cao**.
4. Bấm **🔑 Cài mã khoá Facebook** (menu Tampermonkey) và dán mã khoá Facebook.
5. Nhờ Claude nạp **mã bí mật** (mã Lark, nhóm Lark) — mã lưu riêng trong Google Drive của anh Cao, KHÔNG có trong kho này.

Từ đó Tampermonkey tự cập nhật bản mới mỗi khi anh Cao duyệt.

## Kho này có gì

| Mục | Nội dung |
|---|---|
| `smh.user.js` | Bản **chính thức** (đã duyệt) — Tampermonkey tự tải bản này |
| `cho-duyet.user.js` | Bản **chờ duyệt** (không máy nào chạy) |
| `trangthai.json` | Bản chính thức / bản chờ duyệt + tóm tắt thay đổi (popup Máy Cao đọc để hiện nút ✅ Duyệt) |
| `so-theo-doi.json` | Sổ theo dõi lỗi: gặp ngày nào, sửa ở bản nào, có lặp lại không, mức kiểm tra |
| `CLAUDE_KIEM_TRA.md` | Quy trình Claude kiểm tra mỗi tối và đánh giá mỗi tuần |
| `du-an.tar.gz` | Mã nguồn (`v6/p*.js` + `build6.py`), trang giả lập (`sim6/`), dữ liệu thử — bản sao lưu đầy đủ |

Không có mã bí mật nào trong kho (đã kiểm tra tự động khi ghép bản).
