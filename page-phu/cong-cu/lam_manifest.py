import sys
sys.path.insert(0, '/tmp/claude-0/-home-claude/27a985b6-0162-505e-a158-bc5bd05af075/scratchpad')
exec(open('lam_anh_t1.py').read().split('# T1-01 giới thiệu')[0])
def manifest(name, bgn, text, cta, size=70):
    bg = fit(photo(bgn), 1080, 1080, fy=0.5).filter(ImageFilter.GaussianBlur(26)).convert('RGBA')
    bg.alpha_composite(Image.new('RGBA', (1080, 1080), (14, 10, 6, 195))); d = ImageDraw.Draw(bg)
    f = F('Phudu-Bold.ttf', size); lines = wrap(d, text, f, 864); h = len(lines) * size * 1.15
    y = max(180, 500 - h / 2 - 30)
    y = text_block(d, (108, y), text, f, (222, 176, 70), 864, lh=1.15, align='center', anchor_center_x=540)
    d.line([(480, y + 26), (600, y + 26)], fill=(222, 176, 70), width=4)
    if cta: text_block(d, (108, y + 66), cta, F('EuclidCircularAVN-SemiBold.ttf', 34), (235, 222, 195), 864, lh=1.3, align='center', anchor_center_x=540)
    hf = F('EuclidCircularAVN-SemiBold.ttf', 30); d.text((540 - d.textlength('#sonmochuong', font=hf) / 2, 1080 - 150), '#sonmochuong', font=hf, fill=(222, 176, 70))
    return save(bg, name)
L = [
 ('T1-N0', 286, 'Đêm nay,\nbuông bớt một điều\nmình đã mang cả ngày.', 'Lưu lại để đọc trước khi ngủ'),
 ('T1-N1', 329, 'Hít vào bình an.\nThở ra buông nhẹ.\nNgày mới bắt đầu.', 'Lưu lại, đọc mỗi sáng'),
 ('T1-N2', 272, 'Tiền đến nhẹ nhàng,\nvì mình đã sẵn sàng\nđón nhận.', 'Bình luận "đón nhận" để đón nhận năng lượng tốt'),
 ('T1-N3', 292, 'Không vội.\nĐiều thuộc về mình\nrồi sẽ tìm đến đúng lúc.', 'Bình luận "tin" nếu anh chị cũng tin như vậy'),
 ('T1-N4', 288, 'Thở 1 phút cho lòng nhẹ:\nhít 4 giây · giữ 4 giây\nthở ra 6 giây', 'Làm 5 lần ngay bây giờ. Lưu lại để dùng lúc căng thẳng'),
 ('T1-N5', 285, 'Tuần này mình chọn\nnhẹ lòng, biết ơn,\ntin vào điều lành.', 'Bình luận "đón nhận" để đón nhận năng lượng tốt tuần này'),
 ('T1-N6', 426, 'Cảm ơn một tuần đã qua.\nCảm ơn cả những điều\nchưa đến.', 'Gửi cho người anh chị muốn chúc bình an'),
]
for n, b, t, c in L: manifest(n + '.jpg', b, t, c, 68)
from PIL import Image
s = Image.new('RGB', (4 * 360, 2 * 360), 'white')
for i, (n, *_ ) in enumerate(L): s.paste(Image.open(OUT + n + '.jpg').resize((360, 360)), ((i % 4) * 360, (i // 4) * 360))
s.save(S + 'review_nn.jpg')
