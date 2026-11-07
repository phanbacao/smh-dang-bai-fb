import sys; import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tk import *
W, H = 1080, 1350
M = 108  # vùng an toàn 10%

def canvas_cream():
    return grad(W, H, (247, 240, 228), (236, 224, 204)).convert('RGBA')
def canvas_dark():
    return grad(W, H, (44, 32, 22), (22, 16, 11)).convert('RGBA')

# ---- Mẫu A: ảnh trên (bo góc), chữ dưới — nền kem
def mau_A(name, im, kicker, title, body, fy=0.5, title_size=74, tagtext=None):
    c = canvas_cream(); d = ImageDraw.Draw(c)
    card_photo(c, im, (M, M, W - M, 760), r=40) if not fy else card_photo(c, fit(im, W - 2 * M, 760 - M, fy=fy), (M, M, W - M, 760), r=40)
    d = ImageDraw.Draw(c); ft = F('Phudu-Bold.ttf', title_size); fb = F('EuclidCircularAVN-SemiBold.ttf', 33)
    ht = len(wrap(d, title, ft, W - 2 * M)) * ft.size * 1.08 + 18 + 26; hb = len(wrap(d, body, fb, W - 2 * M)) * 33 * 1.3
    total = (76 if kicker else 0) + ht + hb
    y = min(800, H - M - 70 - total)
    if kicker:
        tag(c, (M, y), kicker.upper(), F('EuclidCircularAVN-SemiBold.ttf', 26)); y += 76
    d = ImageDraw.Draw(c)
    y = text_block(d, (M, y), title, ft, BROWN, W - 2 * M, lh=1.08) + 18
    d.line([(M, y), (M + 120, y)], fill=GOLD, width=5); y += 26
    text_block(d, (M, y), body, F('EuclidCircularAVN-SemiBold.ttf', 33), MUTED, W - 2 * M, lh=1.3)
    logo_goc(c, 'br', h=90, pad=M - 20)
    d.text((M, H - M - 40), 'Trầm Hương Mỗi Ngày', font=F('EuclidCircularAVN-SemiBold.ttf', 26), fill=GOLD)
    return save(c, name)

# ---- Mẫu B: ảnh tràn nền tối + chữ dưới trên lớp mờ (không che vòng: vòng ở nửa trên)
def mau_B(name, im, title, body, fy=0.3, title_size=78, kicker=None):
    c = fit(im, W, H, fy=fy).convert('RGBA')
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    for i in range(620):
        a = int(230 * (i / 620) ** 1.4); od.line([(0, H - 620 + i), (W, H - 620 + i)], fill=(20, 14, 10, a))
    c.alpha_composite(ov); watermark(c, (0, 0, W, H - 560), k=2); d = ImageDraw.Draw(c)
    ft = F('Phudu-Bold.ttf', title_size); fb = F('EuclidCircularAVN-SemiBold.ttf', 33)
    ht = len(wrap(d, title, ft, W - 2 * M)) * ft.size * 1.08 + 16 + 24; hb = len(wrap(d, body, fb, W - 2 * M)) * 33 * 1.3
    y = H - M - 70 - ((76 if kicker else 0) + ht + hb)
    if kicker: tag(c, (M, y), kicker.upper(), F('EuclidCircularAVN-SemiBold.ttf', 26)); y += 76; d = ImageDraw.Draw(c)
    y = text_block(d, (M, y), title, F('Phudu-Bold.ttf', title_size), CREAM, W - 2 * M, lh=1.08) + 16
    d.line([(M, y), (M + 120, y)], fill=GOLD, width=5); y += 24
    text_block(d, (M, y), body, F('EuclidCircularAVN-SemiBold.ttf', 33), (225, 212, 190), W - 2 * M, lh=1.3)
    logo_goc(c, 'br', h=90, pad=M - 20)
    d.text((M, H - M - 40), 'Trầm Hương Mỗi Ngày', font=F('EuclidCircularAVN-SemiBold.ttf', 26), fill=GOLD)
    return save(c, name)

# T1-01 giới thiệu
mau_A('T1-01.jpg', photo(452), 'Chào anh chị', 'Mỗi ngày\nmột chút trầm', 'Kiến thức, cảm hứng và vòng trầm hương để mộc — từ Sơn Mộc Hương. Theo dõi để mỗi ngày biết thêm một chút.', fy=0.45)

# T1-03 cuộn: 108 hạt
mau_B('T1-03a.jpg', photo(292), 'Vì sao chuỗi\ntrầm hương là\n108 hạt?', 'Lướt xem →', fy=0.4, kicker='Kiến thức 1 phút')
mau_A('T1-03b.jpg', photo(86), '108 phiền não', 'Theo quan niệm\nPhật giáo', 'Con số 108 tượng trưng cho 108 phiền não. Lần qua đủ 108 hạt là một vòng niệm trọn vẹn — tay bận thì lòng bớt nghĩ.', fy=0.5)
mau_A('T1-03c.jpg', photo(272), 'Đeo tay', 'Quấn 4–5 vòng\nquanh cổ tay', 'Số vòng tuỳ cổ tay và size hạt. Quấn vừa khít, không siết, hạt tự xếp đều là đẹp.', fy=0.45)
mau_A('T1-03d.jpg', photo(288), 'Size hạt', '6 li · 7 li · 8 li', 'Cổ tay nhỏ hợp 6 li, phổ biến nhất là 7 li, tay to hoặc thích hạt nổi thì 8 li. Bài sau Sơn Mộc Hương chỉ cách đo bằng tờ 100 nghìn.', fy=0.5)

# T1-05 bình chọn lu thống (4 ô)
c = canvas_cream(); d = ImageDraw.Draw(c)
ids = [(337, 'Vàng', (214, 160, 40)), (335, 'Đỏ', (190, 50, 40)), (332, 'Xanh', (40, 130, 70)), (330, 'Đen', (40, 36, 34))]
gw = (W - 2 * M - 30) // 2; gh = 440
for k, (n, lab, col) in enumerate(ids):
    x = M + (k % 2) * (gw + 30); y = 150 + (k // 2) * (gh + 30)
    im = photo(n); im = fit(im, gw, gh, fy=0.42)
    card_photo(c, im, (x, y, x + gw, y + gh), r=32)
    d = ImageDraw.Draw(c)
    tag(c, (x + 22, y + 22), f'{k + 1}', F('Phudu-Bold.ttf', 40), fg=CREAM, bg=col, pad=(22, 6), r=18)
    tag(c, (x + 22, y + gh - 78), lab, F('EuclidCircularAVN-SemiBold.ttf', 30), fg=CREAM, bg=col)
d = ImageDraw.Draw(c)
t = 'Lu thống màu nào hợp mắt anh chị?'; f = F('Phudu-Bold.ttf', 46)
text_block(d, (M, 50), t, f, BROWN, W - 2 * M, align='center', anchor_center_x=W // 2)
y = 150 + 2 * gh + 30 + 30
text_block(d, (M, y), 'Bình luận số 1 · 2 · 3 · 4', F('EuclidCircularAVN-SemiBold.ttf', 40), GOLD, W - 2 * M, align='center', anchor_center_x=W // 2)
text_block(d, (M, y + 62), 'Cùng một chuỗi 108 hạt trầm hương — đổi lu thống là đổi hẳn cảm giác.', F('EuclidCircularAVN-SemiBold.ttf', 30), MUTED, W - 2 * M, align='center', anchor_center_x=W // 2)
logo_goc(c, 'br', h=90, pad=M - 20)
d.text((M, H - M - 40), 'Trầm Hương Mỗi Ngày', font=F('EuclidCircularAVN-SemiBold.ttf', 26), fill=GOLD)
save(c, 'T1-05.jpg')

# T1-07 đo size bằng tờ 100k
c = canvas_dark(); d = ImageDraw.Draw(c)
card_photo(c, fit(photo(87), W - 2 * M, 470, fy=0.5), (M, M, W - M, M + 470), r=40)
d = ImageDraw.Draw(c); y = M + 505
tag(c, (M, y), 'MẸO NHANH', F('EuclidCircularAVN-SemiBold.ttf', 26)); y += 76; d = ImageDraw.Draw(c)
y = text_block(d, (M, y), 'Đo size chuỗi 108 hạt\nbằng tờ 100 nghìn', F('Phudu-Bold.ttf', 66), CREAM, W - 2 * M, lh=1.08) + 20
rows = [('Hở 0–2 cm', '6 li'), ('Hở 2–4 cm', '7 li'), ('Hở 4–6 cm', '8 li')]
for a, b in rows:
    d.rounded_rectangle((M, y, W - M, y + 74), 20, fill=(60, 46, 32))
    d.text((M + 30, y + 18), a, font=F('EuclidCircularAVN-SemiBold.ttf', 34), fill=(225, 212, 190))
    d.text((W - M - 30 - d.textlength(b, font=F('Phudu-Bold.ttf', 44)), y + 12), b, font=F('Phudu-Bold.ttf', 44), fill=GOLD)
    y += 88
text_block(d, (M, y + 6), 'Quấn tờ 100.000đ (dài ~14,4 cm) quanh cổ tay, xem hai đầu hở bao nhiêu. Chỉ là cách ước lượng nhanh.', F('EuclidCircularAVN-SemiBold.ttf', 28), (200, 186, 165), W - 2 * M, lh=1.3)
logo_goc(c, 'br', h=90, pad=M - 20)
d.text((M, H - M - 40), 'Trầm Hương Mỗi Ngày', font=F('EuclidCircularAVN-SemiBold.ttf', 26), fill=GOLD)
save(c, 'T1-07.jpg')

# T1-09 cuộn: bảo quản
mau_B('T1-09a.jpg', photo(277), 'Giữ vòng trầm hương\nbền màu', '4 việc nên và không nên — lướt xem →', fy=0.35, kicker='Bảo quản')
mau_A('T1-09b.jpg', photo(280), 'Nên', 'Tháo ra khi\ntắm, bơi, rửa tay lâu', 'Nước và xà phòng làm hạt bạc màu, lâu ngày mất mùi. Lỡ ướt thì lau khô ngay, đừng phơi nắng gắt hay sấy nóng.', fy=0.4)
mau_A('T1-09c.jpg', photo(286), 'Nên', 'Đeo thường xuyên', 'Ma sát khô và hơi ấm cơ thể làm hạt bóng dần, màu sậm hơn theo thời gian. Vòng càng đeo càng đẹp.', fy=0.5)
mau_A('T1-09d.jpg', photo(89), 'Không nên', 'Bôi dầu, xịt\nnước hoa lên hạt', 'Hạt để mộc hút mùi lạ rất nhanh. Muốn thơm hơn, để vòng gần khói nụ trầm vài phút là đủ.', fy=0.45)

# T1-11 manifest: nền tối mờ, chữ vàng, chỉ #sonmochuong
bg = fit(photo(329), 1080, 1080, fy=0.5).filter(ImageFilter.GaussianBlur(22)).convert('RGBA')
ov = Image.new('RGBA', (1080, 1080), (14, 10, 6, 190)); bg.alpha_composite(ov); d = ImageDraw.Draw(bg)
y = 300
y = text_block(d, (108, y), 'Tuần mới,\ntay đeo vòng trầm hương,\nlòng đón điều lành.', F('Phudu-Bold.ttf', 70), (222, 176, 70), 1080 - 216, lh=1.15, align='center', anchor_center_x=540)
d.line([(480, y + 30), (600, y + 30)], fill=(222, 176, 70), width=4)
text_block(d, (108, y + 70), 'Bình luận "đón nhận" để đón nhận\nnăng lượng tốt tuần này', F('EuclidCircularAVN-SemiBold.ttf', 34), (235, 222, 195), 1080 - 216, lh=1.3, align='center', anchor_center_x=540)
d.text((540 - d.textlength('#sonmochuong', font=F('EuclidCircularAVN-SemiBold.ttf', 30)) / 2, 1080 - 150), '#sonmochuong', font=F('EuclidCircularAVN-SemiBold.ttf', 30), fill=(222, 176, 70))
save(bg, 'T1-11.jpg')

# T1-13 cuộn: quà tặng
mau_B('T1-13a.jpg', photo(426), 'Món quà\nkhông cần đoán size áo', 'Chuỗi 108 hạt trầm hương trong hộp xanh — lướt xem →', fy=0.45, kicker='Quà tặng')
mau_A('T1-13b.jpg', photo(293), 'Bên trong hộp', 'Hũ thuỷ tinh\nđựng vòng', 'Vòng nằm gọn trong hũ, không trầy, không ám mùi. Mở hộp ra là thấy chỉn chu.', fy=0.5)
mau_A('T1-13c.jpg', photo(297), 'Yên tâm', 'Bảo hành, đổi trả\n30 ngày', 'Tặng rồi mà size chưa vừa? Đổi trong 30 ngày. Hạt lỗi được bảo hành.', fy=0.45)
mau_A('T1-13d.jpg', photo(244), 'Gợi ý', 'Tặng ai dịp\ncuối năm này?', 'Bố mẹ, người đi chùa, sếp, bạn thân mới chuyển nhà… Bình luận để Sơn Mộc Hương gợi ý size.', fy=0.5)
print('xong')
