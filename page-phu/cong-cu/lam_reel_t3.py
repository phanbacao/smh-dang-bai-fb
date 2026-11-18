# Tuần 3 (21–27/11/2026): Reels 19:30 từ video thật trong kho (chạy trong thư mục cong-cu)
import os
_D = os.path.dirname(os.path.abspath(__file__)); os.chdir(_D)
exec(open('lam_reel_that.py').read().rsplit("if __name__ == '__main__':", 1)[0].replace("exec(open('lam_reel.py')", "exec(open(_D + '/lam_reel.py')"))
def overlay_text(path, text, sub=None, kicker=None, pos='bottom', big=70):
    """Bản tuần 3: thêm dải tối mờ ngay sau chữ + viền chữ, để chữ nổi trên hạt sáng mà không tối cả khung."""
    c = Image.new('RGBA', (RW, RH), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    ft = F('Phudu-Bold.ttf', big); fs = F('EuclidCircularAVN-SemiBold.ttf', 38)
    lt = wrap(d, text, ft, RW - 2 * SX); ls = wrap(d, sub, fs, RW - 2 * SX) if sub else []
    ht = len(lt) * big * 1.1 + (len(ls) * 38 * 1.3 + 24 if ls else 0) + (70 if kicker else 0)
    y = SBOT - ht if pos == 'bottom' else STOP
    band = Image.new('RGBA', (RW, RH), (0, 0, 0, 0))
    ImageDraw.Draw(band).rectangle((0, y - 34, RW, y + ht + 34), fill=(18, 12, 8, 150))
    c.alpha_composite(band.filter(ImageFilter.GaussianBlur(34))); d = ImageDraw.Draw(c)
    if kicker: tag(c, (SX, y), kicker.upper(), F('EuclidCircularAVN-SemiBold.ttf', 28)); y += 70; d = ImageDraw.Draw(c)
    for ln in lt:
        d.text((SX, y), ln, font=ft, fill=CREAM, stroke_width=3, stroke_fill=(18, 12, 8, 220)); y += big * 1.1
    if ls:
        y += 24
        for ln in ls: d.text((SX, y), ln, font=fs, fill=(240, 226, 200), stroke_width=2, stroke_fill=(18, 12, 8, 200)); y += 38 * 1.3
    c.save(path); return path
END = dict(text='Theo dõi Trầm Hương Mỗi Ngày để xem tiếp', sub='Sơn Mộc Hương', big=62)
TD = 'Theo dõi Trầm Hương Mỗi Ngày để xem tiếp'
if __name__ == '__main__':
    _ONLY = os.environ.get('ONLY', '').split(); _rt = reel_that
    reel_that = lambda n, *a, **k: (_rt(n, *a, **k) if not _ONLY or n in _ONLY else None)
    reel_that('T3-03', [
        (106, dict(text='Vòng trầm hương trong lòng bàn tay', kicker='Chậm lại', big=66)),
        (66, dict(text='Hạt nào cũng có sớ riêng.', big=70)),
        (67, dict(text='Không cần nói gì. Chỉ ngồi yên.', big=66)),
        (101, END)])
    reel_that('T3-06', [
        (90, dict(text='Khúc trầm và chuỗi hạt', kicker='Hậu trường', big=72, ss=3.0)),
        (3, dict(text='Nhìn kỹ sớ gỗ trên từng hạt', big=66)),
        (91, dict(text='Để mộc nên sớ vẫn còn nguyên', big=66, ss=6)),
        (56, END)])
    reel_that('T3-09', [
        (50, dict(text='Vòng để mộc mới nhìn hơi nhạt?', kicker='Băn khoăn', big=66)),
        (51, dict(text='Vì không phủ gì lên hạt', big=70, ss=8)),
        (32, dict(text='Đeo lâu, hạt sậm và bóng dần', big=68)),
        (62, END)])
    reel_that('T3-12', [
        (92, dict(text='Chọn vòng trầm hương, hỏi 3 câu này', kicker='Trước khi chọn', big=64)),
        (77, dict(text='1. Đây là loại gỗ gì?', big=72)),
        (82, dict(text='2. Có phủ keo, sáp, sơn không?', big=66, ss=8)),
        (81, dict(text='3. Có bảo hành, đổi trả không?', sub=TD, big=64))])
    reel_that('T3-15', [
        (113, dict(text='Còn đúng 1 tháng nữa là Noel', kicker='Quà tặng', big=70)),
        (79, dict(text='Món quà đeo được mỗi ngày', big=70)),
        (43, dict(text='Để mộc, mùi dịu, nhẹ tay', big=70)),
        (20, dict(text='Gửi cho người đang đau đầu chọn quà', sub=TD, big=60))])
    reel_that('T3-18', [
        (94, dict(text='Lần một hạt, thở một nhịp', kicker='Thư giãn', big=72)),
        (45, dict(text='Hít vào chậm.', big=78)),
        (31, dict(text='Thở ra dài hơn.', big=78)),
        (109, END)])
    reel_that('T3-21', [
        (12, dict(text='Người làm trầm cũng đeo trầm', kicker='Hậu trường', big=68)),
        (102, dict(text='Gõ máy, trả lời khách, vòng vẫn trên tay', big=60)),
        (110, dict(text='Mỏi thì đưa lên ngửi một chút', big=66)),
        (21, dict(text='Cuối tuần vui nhé anh chị', sub=TD, big=66))])
