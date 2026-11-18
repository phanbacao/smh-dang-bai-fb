# Tuần 3 (21–27/11/2026): ảnh sáng nhẹ nhàng (07:30) + chuỗi "30 ngày hiểu trầm" Ngày 8–14 (11:30)
import os
_D = os.path.dirname(os.path.abspath(__file__))
exec(open(_D + '/lam_anh_t2.py').read().split("if __name__ == '__main__':")[0].replace("os.path.dirname(os.path.abspath(__file__))", repr(_D)))

def bong(d, xy, text, font, fill, off=3, a=150):
    d.text((xy[0] + off, xy[1] + off), text, font=font, fill=(0, 0, 0, a)); d.text(xy, text, font=font, fill=fill)

def hai_anh(name, n1, n2, kicker, title, body, fy1=0.5, fy2=0.5, title_size=66):
    """Bìa cuộn: 2 ảnh cạnh nhau trên nền kem, chữ dưới (không chữ nào đè lên vòng)."""
    c = canvas_cream(); g = 24; w = (W - 2 * M - g) // 2; y1 = 700
    card_photo(c, fit(photo(n1), w, y1 - M, fy=fy1), (M, M, M + w, y1), r=36, k=1)
    card_photo(c, fit(photo(n2), w, y1 - M, fy=fy2), (M + w + g, M, W - M, y1), r=36, k=1)
    y = 740; tag(c, (M, y), kicker.upper(), F('EuclidCircularAVN-SemiBold.ttf', 26)); y += 76; d = ImageDraw.Draw(c)
    y = text_block(d, (M, y), title, F('Phudu-Bold.ttf', title_size), BROWN, W - 2 * M, lh=1.08) + 18
    d.line([(M, y), (M + 120, y)], fill=GOLD, width=5); y += 26
    text_block(d, (M, y), body, F('EuclidCircularAVN-SemiBold.ttf', 33), MUTED, W - 2 * M, lh=1.3)
    logo_goc(c, 'br', h=90, pad=M - 20)
    d.text((M, H - M - 40), 'Trầm Hương Mỗi Ngày', font=F('EuclidCircularAVN-SemiBold.ttf', 26), fill=GOLD)
    return save(c, name)

if __name__ == '__main__':
    K = 'Ngày %d/30 · Hiểu trầm'
    # 07:30 sáng nhẹ nhàng
    for n, b, t, cta in [
        ('T3-01', 302, 'Thứ Bảy,\ncho phép mình nghỉ\nmà không áy náy.', 'Lưu lại cho những tuần bận rộn'),
        ('T3-04', 396, 'Gọi cho mẹ một cuộc.\nChỉ để hỏi\ncơm chưa.', 'Gửi cho người anh chị đang nhớ'),
        ('T3-07', 312, 'Đầu tuần không cần\nhơn ai.\nChỉ cần hơn hôm qua.', 'Lưu lại để đọc vào sáng thứ Hai'),
        ('T3-10', 381, 'Đang giận thì khoan\ntrả lời tin nhắn.', 'Gửi cho người hay nóng vội'),
        ('T3-13', 437, 'Góc nhà gọn gàng,\nlòng cũng\nnhẹ hơn.', 'Dọn một góc nhỏ hôm nay'),
        ('T3-16', 415, 'Kiếm được là giỏi.\nGiữ được là khôn.\nBiết đủ là an.', 'Lưu lại để nhắc mình'),
        ('T3-19', 406, 'Cuối tháng rồi.\nMình vẫn ở đây,\nvậy là giỏi lắm.', 'Gửi cho người đang cố gắng'),
    ]: manifest(n + '.jpg', b, t, cta)

    mau_A('T3-02.jpg', photo(442), K % 8, 'Thả nước thấy chìm\nlà trầm tốt?', 'Chưa chắc. Trầm công nghệ cũng có thể chìm. Chìm nước chỉ là một dấu hiệu, không đủ để kết luận.', fy=0.5, title_size=66)
    mau_A('T3-05.jpg', photo(273), K % 9, 'Chuỗi 108 hạt\nquấn được mấy vòng?', 'Tuỳ size hạt và cổ tay. Ví dụ tay khoảng 14 cm, size 7 li quấn được khoảng 5 vòng.', fy=0.36, title_size=66)
    the_toi('T3-08.jpg', K % 10, '3 hiểu lầm\nkhi chọn nhang trầm', [
        ('Màu nhang', 'Không nên đoán lượng trầm chỉ bằng màu của cây nhang.'),
        ('Thơm mạnh', 'Vừa đốt đã thơm rất mạnh chưa nói lên chất lượng.'),
        ('Cháy bị cong', 'Cây nhang cong khi đang cháy chưa phải là nhang kém.')],
        'Nhìn nhiều yếu tố cùng lúc, đừng chấm bằng một dấu hiệu.')
    mau_A('T3-11.jpg', photo(286), K % 11, 'Có nên bôi dầu\ncho vòng bóng nhanh?', 'Không cần. Đeo thường xuyên, ma sát khô và hơi ấm cơ thể sẽ làm hạt sậm và bóng dần theo thời gian.', fy=0.5, title_size=66)
    mau_A('T3-14.jpg', photo(319), K % 12, 'Chọn màu lu thống\nthế nào?', 'Theo quan niệm, nhiều người chọn màu theo mệnh. Nhưng nhìn thấy thích, đeo thấy hợp vẫn là quan trọng nhất.', fy=0.42, title_size=68)
    the_toi('T3-17.jpg', K % 13, 'Vòng mùi nhẹ\ncó phải hàng kém?', [
        ('Chưa chắc', 'Trầm chuẩn vốn có hương nhẹ. Hàng để mộc không dùng hương liệu tạo mùi nên mùi dịu.'),
        ('Nên nhớ', 'Thơm nồng ngay lúc đầu chưa chắc đã tốt hơn.')],
        'Mùi chỉ là một phần, xem thêm sớ, gia công và nguồn gốc.', photo_n=439, fy=0.5)
    hai_anh('T3-20a.jpg', 373, 277, K % 14, 'Vòng tròn đơn\nhay chuỗi 108 hạt?', 'Lướt xem để chọn loại hợp mình →', fy1=0.5, fy2=0.45)
    mau_A('T3-20b.jpg', photo(374), 'Vòng tròn đơn', 'Một vòng là đủ', 'Hạt lớn, đeo gọn, không phải quấn. Size thường lớn hơn, khoảng 10–16 li tuỳ dòng.', fy=0.5)
    mau_A('T3-20c.jpg', photo(306), 'Chuỗi 108 hạt', 'Quấn nhiều vòng', 'Hạt nhỏ hơn, phổ biến 6 li, 7 li, 8 li. Đeo tay được, tháo ra lần hạt cũng được.', fy=0.7)
    mau_A('T3-20d.jpg', photo(280), 'Chọn thế nào?', 'Theo thói quen\ncủa mình', 'Thích gọn, đeo vào là xong: vòng tròn đơn. Thích lần hạt, thích quấn nhiều vòng: chuỗi 108 hạt.', fy=0.45, title_size=68)
    print('xong')
