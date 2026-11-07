import sys, re
sys.path.insert(0, '/tmp/claude-0/-home-claude/27a985b6-0162-505e-a158-bc5bd05af075/scratchpad')
src = open('lam_anh_t1.py').read()
# lấy phần định nghĩa (đến trước '# T1-01')
exec(src.split('# T1-01 giới thiệu')[0])

# ---- Minigame (poster)
def minigame(name, title2, sub, photo_n=426, deadline='Kết thúc 20h ngày 21/11'):
    c = fit(photo(photo_n), W, H, fy=0.45).convert('RGBA')
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    for i in range(H):
        a = int(235 * min(1, (i / H) ** 0.9 * 1.15)); od.line([(0, i), (W, i)], fill=(16, 11, 7, a))
    c.alpha_composite(ov); d = ImageDraw.Draw(c)
    y = 330
    tag(c, (M, y), 'MINIGAME', F('EuclidCircularAVN-SemiBold.ttf', 30)); y += 84; d = ImageDraw.Draw(c)
    y = text_block(d, (M, y), title2, F('Phudu-Bold.ttf', 84), CREAM, W - 2 * M, lh=1.06) + 14
    d.line([(M, y), (M + 120, y)], fill=GOLD, width=5); y += 28
    y = text_block(d, (M, y), sub, F('EuclidCircularAVN-SemiBold.ttf', 34), (230, 216, 190), W - 2 * M, lh=1.3) + 22
    steps = ['Theo dõi trang Trầm Hương Mỗi Ngày', 'Thích bài viết này', 'Bình luận "Tham gia" + size muốn đeo (6, 7 hay 8 li)']
    for k, s in enumerate(steps, 1):
        d.rounded_rectangle((M, y, W - M, y + 78), 22, fill=(52, 38, 26))
        d.ellipse((M + 14, y + 14, M + 64, y + 64), fill=GOLD); d.text((M + 39 - d.textlength(str(k), font=F('Phudu-Bold.ttf', 34)) / 2, y + 16), str(k), font=F('Phudu-Bold.ttf', 34), fill=DARK)
        text_block(d, (M + 86, y + 20), s, F('EuclidCircularAVN-SemiBold.ttf', 30 if len(s) > 40 else 33), CREAM, W - 2 * M - 100, lh=1.1)
        y += 92
    d.text((M, y + 8), deadline, font=F('EuclidCircularAVN-SemiBold.ttf', 30), fill=GOLD)
    logo_goc(c, 'tr', h=96, pad=M - 20); watermark(c, (0, 0, W, 320), k=1)
    d.text((M, H - M - 10), 'Trầm Hương Mỗi Ngày — Sơn Mộc Hương', font=F('EuclidCircularAVN-SemiBold.ttf', 26), fill=GOLD)
    return save(c, name)

minigame('T1-M0.jpg', 'Tặng 3 chuỗi\n108 hạt trầm hương', 'Để mộc, không keo, không sáp. Bốc thăm ngẫu nhiên 3 người trong số bình luận.', 426)
minigame('T1-M1.jpg', 'Chưa tham gia?\nChuỗi trầm đang chờ', 'Chưa tham gia? Làm 3 bước dưới đây. Bốc thăm 3 người, công bố ngay trên trang.', 293, 'Kết thúc 20h ngày 21/11')

# ---- Bài tương tác: câu hỏi ngắn
def hoi(name, photo_n, kick, q, sub, fy=0.4, tsize=84):
    c = fit(photo(photo_n), W, H, fy=fy).convert('RGBA')
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    for i in range(H):
        a = int(215 * (i / H) ** 1.6); od.line([(0, i), (W, i)], fill=(16, 11, 7, a))
    c.alpha_composite(ov); watermark(c, (0, 0, W, H - 640), k=2); d = ImageDraw.Draw(c)
    ft = F('Phudu-Bold.ttf', tsize); fb = F('EuclidCircularAVN-SemiBold.ttf', 34)
    ht = len(wrap(d, q, ft, W - 2 * M)) * ft.size * 1.08 + 40; hb = len(wrap(d, sub, fb, W - 2 * M)) * 34 * 1.3
    y = H - M - 70 - (80 + ht + hb)
    tag(c, (M, y), kick.upper(), F('EuclidCircularAVN-SemiBold.ttf', 26)); y += 80; d = ImageDraw.Draw(c)
    y = text_block(d, (M, y), q, ft, CREAM, W - 2 * M, lh=1.08) + 14
    d.line([(M, y), (M + 120, y)], fill=GOLD, width=5); y += 24
    text_block(d, (M, y), sub, fb, (230, 216, 190), W - 2 * M, lh=1.3)
    logo_goc(c, 'br', h=90, pad=M - 20)
    d.text((M, H - M - 40), 'Trầm Hương Mỗi Ngày', font=F('EuclidCircularAVN-SemiBold.ttf', 26), fill=GOLD)
    return save(c, name)

hoi('T1-A1.jpg', 288, 'Chọn một', 'Hạt 6 li\nhay 8 li?', 'Bình luận 6 hoặc 8. Anh chị thích gọn nhẹ hay hạt nổi?', 0.5)
hoi('T1-A2.jpg', 272, 'Hỏi nhanh', 'Anh chị đeo vòng\ntrầm bên tay nào?', 'Trái hay phải, bình luận cho Sơn Mộc Hương biết nhé.', 0.45, 76)
hoi('T1-A3.jpg', 285, 'Hiểu lầm', 'Thơm nồng ngay\nlà trầm tốt?', 'Không hẳn. Đừng đánh giá chất lượng chỉ bằng độ nồng lúc mới ngửi. Anh chị đã từng bị "thơm quá" đánh lừa chưa?', 0.5, 76)
hoi('T1-A4.jpg', 329, 'Thứ Sáu', 'Hôm nay anh chị\nđã có một chút trầm chưa?', 'Bình luận "rồi" hoặc "chưa" nhé.', 0.4, 70)
hoi('T1-A5.jpg', 442, 'Soi hạt', 'Đoán xem\nhạt này để mộc hay phủ?', 'Nhìn kỹ sớ gỗ và vân dầu, rồi bình luận đáp án của anh chị.', 0.5, 70)
print('ok')
