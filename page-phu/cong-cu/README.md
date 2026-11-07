# Bộ công cụ dựng nội dung page phụ (Claude dùng)
1. Thư mục làm việc: `export PP_DIR=~/page-phu-lam/` (tự tạo `full/` để tải ảnh, `kho/` để ra file).
2. Font + logo vuông: tải `anh-cuon-tai-nguyen.zip` trên Google Drive của Cao (id `1ZFcJ419UQdY2xfmAqXPRiCuQel3Uzp_j`, bằng công cụ Google Drive `download_file_content`, nội dung base64) → giải nén vào `$PP_DIR/tn/` (phải có `$PP_DIR/tn/anh-cuon-tai-nguyen/font/…`). Font KHÔNG đưa lên GitHub (bản quyền).
3. `index.tsv`: số thứ tự → id ảnh Drive → tên file (kho ảnh Cao gửi). Phân nhóm ảnh: `GHI_CHU_KHO_ANH.md`. `tk.photo(n)` tự tải ảnh 2000px và chuyển hồ sơ màu về sRGB (ảnh gốc có ProPhoto / Display P3 → không chuyển sẽ bị tối, xỉn).
4. Mẫu: `lam_anh_t1.py` (ảnh 1080x1350: mau_A nền kem, mau_B ảnh tràn; ảnh bình chọn 4 ô; manifest 1080x1080), `lam_reel.py` (Reels 1080x1920, chữ trong vùng an toàn, Ken Burns + chuyển cảnh, nhạc nền tự tạo). Mọi ảnh có logo vàng góc + 1–2 logo chìm (`wm_ngang.png`, ~35%).
5. Tên tệp tuần N: `TN-xx.jpg/.mp4`; thêm bài vào `../lich.json` (giữ các bài cũ, ngày `dd-mm-yyyy`, giờ `HH:MM`, loại `anh|cuon|reel`).
6. Cần ffmpeg + Pillow.
