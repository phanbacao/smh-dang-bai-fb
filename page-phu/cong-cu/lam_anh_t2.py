# Tuần 2 (14–20/11/2026): ảnh chuỗi "30 ngày hiểu trầm" (11:30) + ảnh sáng nhẹ nhàng (07:30)
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lam_anh_t1.py')).read().split('# T1-01 giới thiệu')[0])

def the_toi(name, kicker, title, rows, note, photo_n=None, fy=0.5):
    """Thẻ nền tối: (ảnh nhỏ trên) + tiêu đề + các dòng so sánh + ghi chú."""
    c = canvas_dark(); y = M
    if photo_n is not None:
        card_photo(c, fit(photo(photo_n), W - 2 * M, 400, fy=fy), (M, M, W - M, M + 400), r=40); y = M + 440
    else: watermark(c, (M, M + 300, W - M, H - M - 200), k=2, alpha=0.18); y = M + 170
    tag(c, (M, y), kicker.upper(), F('EuclidCircularAVN-SemiBold.ttf', 26)); y += 76; d = ImageDraw.Draw(c)
    y = text_block(d, (M, y), title, F('Phudu-Bold.ttf', 62), CREAM, W - 2 * M, lh=1.08) + 22
    for a, b in rows:
        fb = F('EuclidCircularAVN-SemiBold.ttf', 30); lb = wrap(d, b, fb, W - 2 * M - 60); hh = 82 + len(lb) * 39
        d.rounded_rectangle((M, y, W - M, y + hh), 20, fill=(60, 46, 32))
        d.text((M + 30, y + 14), a, font=F('Phudu-Bold.ttf', 38), fill=GOLD)
        text_block(d, (M + 30, y + 70), b, fb, (225, 212, 190), W - 2 * M - 60, lh=1.3); y += hh + 16
    text_block(d, (M, y + 8), note, F('EuclidCircularAVN-SemiBold.ttf', 28), (200, 186, 165), W - 2 * M, lh=1.3)
    logo_goc(c, 'br', h=90, pad=M - 20)
    d.text((M, H - M - 40), 'Trầm Hương Mỗi Ngày', font=F('EuclidCircularAVN-SemiBold.ttf', 26), fill=GOLD)
    return save(c, name)

def manifest(name, bgn, text, cta, size=68):
    bg = fit(photo(bgn), 1080, 1080, fy=0.5).filter(ImageFilter.GaussianBlur(26)).convert('RGBA')
    bg.alpha_composite(Image.new('RGBA', (1080, 1080), (14, 10, 6, 195))); d = ImageDraw.Draw(bg)
    f = F('Phudu-Bold.ttf', size); lines = wrap(d, text, f, 864); h = len(lines) * size * 1.15
    y = max(180, 500 - h / 2 - 30)
    y = text_block(d, (108, y), text, f, (222, 176, 70), 864, lh=1.15, align='center', anchor_center_x=540)
    d.line([(480, y + 26), (600, y + 26)], fill=(222, 176, 70), width=4)
    if cta: text_block(d, (108, y + 66), cta, F('EuclidCircularAVN-SemiBold.ttf', 34), (235, 222, 195), 864, lh=1.3, align='center', anchor_center_x=540)
    hf = F('EuclidCircularAVN-SemiBold.ttf', 30); d.text((540 - d.textlength('#sonmochuong', font=hf) / 2, 1080 - 150), '#sonmochuong', font=hf, fill=(222, 176, 70))
    return save(bg, name)

if __name__ == '__main__':
    # 07:30 sáng nhẹ nhàng
    for n, b, t, cta in [
        ('T2-01', 301, 'Cuối tuần,\ncho mình chậm lại\nmột nhịp.', 'Lưu lại cho một ngày bận rộn'),
        ('T2-04', 395, 'Chủ nhật bình yên\nbắt đầu từ\nmột hơi thở sâu.', 'Gửi cho người thân một lời chúc bình an'),
        ('T2-07', 311, 'Thứ Hai,\nlàm từng việc một.\nKhông cần vội.', 'Lưu lại để đọc khi thấy rối'),
        ('T2-10', 379, 'Điều mình gieo hôm nay\nsẽ nở vào một ngày\nmình không ngờ.', 'Lưu lại, đọc lại vào cuối năm'),
        ('T2-13', 436, 'Biết ơn 3 điều nhỏ\ntrước khi\nmở điện thoại.', 'Thử ngay sáng nay'),
        ('T2-16', 414, 'Tiền bạc đến rồi đi.\nBình an ở lại\nmới là của mình.', 'Gửi cho người anh chị thương'),
        ('T2-19', 405, 'Cảm ơn thầy cô\nđã dạy mình\nđi đường dài.', 'Gửi lời này cho thầy cô qua tin nhắn'),
    ]: manifest(n + '.jpg', b, t, cta)

    # 11:30 chuỗi "30 ngày hiểu trầm"
    # Ngày 1: để mộc (cuộn 4 ảnh)
    mau_B('T2-02a.jpg', photo(448), '"Để mộc"\nlà gì?', 'Lướt xem →', fy=0.5, kicker='Ngày 1/30 · Hiểu trầm')
    mau_A('T2-02b.jpg', photo(449), 'Để mộc', 'Hạt giữ nguyên\nmặt gỗ', 'Không keo, không sáp, không phủ sơn. Không thêm lớp nào lên bề mặt hạt.', fy=0.5)
    mau_A('T2-02c.jpg', photo(440), 'Nhìn gần', 'Thấy sớ gỗ,\nthấy tia dầu', 'Lớp phủ bóng đều sẽ che mất sớ. Hạt để mộc thì sớ và tia dầu hiện rõ dưới ánh sáng.', fy=0.5)
    mau_A('T2-02d.jpg', photo(304), 'Khi đeo', 'Càng đeo\ncàng có nước bóng', 'Ma sát khô và hơi ấm cơ thể làm hạt sậm, bóng dần theo thời gian. Không cần phủ gì thêm.', fy=0.45)
    # Ngày 2: Trầm chuẩn & Tốc kiến
    the_toi('T2-05.jpg', 'Ngày 2/30 · Hiểu trầm', 'Trầm chuẩn và Tốc kiến\nkhác nhau ở đâu?', [
        ('Trầm chuẩn', 'Là trầm tốc vườn. Tia dầu nâu mảnh, hương nhẹ.'),
        ('Tốc kiến', 'Là trầm tự nhiên. Vân dầu sắc hơn, hương ngọt sâu hơn.')],
        'Khác nhau ở phôi, không phải ở màu đen hay độ bóng.', photo_n=380, fy=0.5)
    # Ngày 3: Gió trắng, bách xanh
    mau_A('T2-08.jpg', photo(386), 'Ngày 3/30 · Hiểu trầm', 'Gió trắng, bách xanh\ncó phải trầm?', 'Không. Gió trắng và bách xanh không phải trầm hương. Khi chọn vòng, hỏi rõ tên loại gỗ trước đã.', fy=0.45, title_size=66)
    # Ngày 4: Trầm công nghệ Indo
    the_toi('T2-11.jpg', 'Ngày 4/30 · Hiểu trầm', 'Trầm công nghệ Indo\nlà gì?', [
        ('Cách làm', 'Sợi trầm vốn đã có sớ, rồi được ép thêm dầu vào sâu bên trong bằng áp suất cao.'),
        ('Thành phẩm', 'Màu sẫm, sớ rõ, nặng tay, thả nước có thể chìm.'),
        ('Dễ nhầm', 'Người mới hay nghĩ: càng sẫm, càng nặng, chìm nước là trầm tốt.')],
        'Đừng kết luận chất lượng bằng một dấu hiệu riêng lẻ.')
    # Ngày 5: gia công
    mau_A('T2-14.jpg', photo(451), 'Ngày 5/30 · Hiểu trầm', 'Nhìn gia công\ntrước khi nhìn màu', 'Hạt tròn đều. Lỗ khoan gọn, hạn chế mẻ. Không giác trắng. Gia công chỉn chu thì chuỗi đeo lên mới đều tay.', fy=0.5, title_size=68)
    # Ngày 6: nụ trầm
    mau_A('T2-17.jpg', photo(419), 'Ngày 6/30 · Hiểu trầm', 'Nụ trầm\nlàm từ gì?', 'Bột gỗ trầm kết hợp vỏ cây bời lời. Đốt để xông, khói lên chậm, mùi dịu. Mùi đậm nhạt tuỳ sản phẩm.', fy=0.55)
    # Ngày 7: tặng vòng khi chưa biết size
    mau_A('T2-20.jpg', photo(296), 'Ngày 7/30 · Hiểu trầm', 'Tặng vòng trầm\nmà chưa biết size tay?', '7 li là size nhiều người đeo nhất. Chuỗi 108 hạt quấn nhiều vòng nên dễ đeo hơn. Chưa vừa thì có đổi trả 30 ngày.', fy=0.5, title_size=66)
    print('xong')
