# Tuần 2 (14–20/11/2026): Reels 19:30 từ video thật trong kho (chạy trong thư mục cong-cu)
import os
_D = os.path.dirname(os.path.abspath(__file__)); os.chdir(_D)
exec(open('lam_reel_that.py').read().rsplit("if __name__ == '__main__':", 1)[0].replace("exec(open('lam_reel.py')", "exec(open(_D + '/lam_reel.py')"))
END = dict(text='Theo dõi Trầm Hương Mỗi Ngày để xem tiếp', sub='Sơn Mộc Hương', big=62)
if __name__ == '__main__':
    _ONLY = os.environ.get('ONLY', '').split(); _rt = reel_that
    reel_that = lambda n, *a, **k: (_rt(n, *a, **k) if not _ONLY or n in _ONLY else None)
    reel_that('T2-03', [
        (108, dict(text='108 hạt, quấn lên tay', kicker='Chậm lại', big=74)),
        (17, dict(text='Từng vòng một. Không vội.', big=70)),
        (9, dict(text='Vừa tay là thấy nhẹ.', big=72)),
        (40, END)])
    reel_that('T2-06', [
        (4, dict(text='Một buổi sáng ở Sơn Mộc Hương', kicker='Hậu trường', big=64)),
        (27, dict(text='Kiểm từng chuỗi trước khi vào hộp', big=64)),
        (49, dict(text='Đếm hạt, xem lỗ khoan, xem độ tròn', big=62)),
        (96, dict(text='Showroom Thủ Đức, ghé xem hàng thật', sub='Theo dõi Trầm Hương Mỗi Ngày để xem tiếp', big=60))])
    reel_that('T2-09', [
        (15, dict(text='Chủ nhật, chậm lại một chút.', pos='top', big=72)),
        (23, dict(text='Nhìn sớ gỗ chạy quanh từng hạt.', pos='top', big=66)),
        (84, dict(text='Không vội. Không cần làm gì thêm.', pos='top', big=64)),
        (65, END)])
    reel_that('T2-12', [
        (13, dict(text='Soi gần một chuỗi để mộc', kicker='Soi hạt', big=70)),
        (68, dict(text='Lỗ khoan gọn, hạn chế mẻ', big=70)),
        (53, dict(text='Không keo. Không sáp. Không phủ sơn.', big=62)),
        (26, END)])
    reel_that('T2-15', [
        (42, dict(text='Anh chị đang đeo size nào?', kicker='Hỏi nhanh', big=70)),
        (57, dict(text='6 li gọn · 7 li phổ biến · 8 li hạt nổi', big=58)),
        (88, dict(text='Quấn vừa khít, không siết là đẹp.', big=64)),
        (84, dict(text='Kể size của anh chị cho Sơn Mộc Hương nghe', sub='Theo dõi Trầm Hương Mỗi Ngày để xem tiếp', big=58))])
    reel_that('T2-18', [
        (1, dict(text='Mai là 20/11', kicker='Quà tặng', big=80)),
        (16, dict(text='Tặng thầy cô một điều nhẹ nhàng', big=66)),
        (75, dict(text='Chuỗi 108 hạt để mộc, mùi dịu', big=66)),
        (46, dict(text='Chưa vừa size? Đổi trả trong 30 ngày.', sub='Theo dõi Trầm Hương Mỗi Ngày để xem tiếp', big=60))])
    reel_that('T2-21', [
        (14, dict(text='Hôm nay 20/11', kicker='Tri ân', big=80)),
        (18, dict(text='Cảm ơn những người dạy mình kiên nhẫn', big=62)),
        (29, dict(text='Như xâu một chuỗi 108 hạt: từng hạt một.', big=60)),
        (71, dict(text='Gửi video này cho thầy cô qua tin nhắn', sub='Theo dõi Trầm Hương Mỗi Ngày để xem tiếp', big=60))])
