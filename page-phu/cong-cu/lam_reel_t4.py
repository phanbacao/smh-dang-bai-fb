# Tuần 4 (28/11–04/12/2026): Reels 19:30 từ video thật, phụ đề kiểu mới (chạy trong thư mục cong-cu)
import os, sys
_D = os.path.dirname(os.path.abspath(__file__)); os.chdir(_D); sys.path.insert(0, _D)
exec(open('lam_reel_that.py').read().rsplit("if __name__ == '__main__':", 1)[0].replace("exec(open('lam_reel.py')", "exec(open(_D + '/lam_reel.py')"))
import lam_thiet_ke as TK
def overlay_text(path, text, sub=None, kicker=None, pos='bottom', big=70):
    return TK.phu_de(path, text, sub, kicker, hook=big >= 90)
TD = 'Theo dõi Trầm Hương Mỗi Ngày để xem tiếp'
H = 90  # cỡ câu mở đầu
if __name__ == '__main__':
    _ONLY = os.environ.get('ONLY', '').split(); _rt = reel_that
    reel_that = lambda n, *a, **k: (_rt(n, *a, **k) if not _ONLY or n in _ONLY else None)
    reel_that('T4-03', [
        (35, dict(text='Cuối tuần, *chậm lại* một chút', big=H)),
        (30, dict(text='Đặt chuỗi 108 hạt lên tay')),
        (98, dict(text='Lăn *từng hạt*, thở thật chậm')),
        (61, dict(text='Tuần mới sẽ *nhẹ hơn*', sub=TD, ss=2))])
    reel_that('T4-06', [
        (72, dict(text='Vòng để mộc *lên nước* thế nào?', big=H)),
        (47, dict(text='Mới đeo nhìn *mộc mạc*')),
        (105, dict(text='Đeo lâu ngày, hạt *lên nước* đẹp dần', ss=2)),
        (97, dict(text='Không keo, không sáp, không phủ sơn', sub=TD, ss=2))])
    reel_that('T4-09', [
        (5, dict(text='Bàn làm việc ở *Sơn Mộc Hương*', big=H)),
        (11, dict(text='Gõ phím cả ngày, vòng vẫn *gọn tay*')),
        (60, dict(text='Thỉnh thoảng đưa lên *ngửi nhẹ*', ss=1.5)),
        (95, dict(text='Ghé showroom *Thủ Đức* xem hàng thật', sub=TD, ss=1.5))])
    reel_that('T4-12', [
        (7, dict(text='Quà cuối năm cho *bố mẹ?*', big=H)),
        (25, dict(text='Thứ đeo được *mỗi ngày*')),
        (2, dict(text='Để mộc, mùi dịu, nhẹ tay', ss=14)),
        (19, dict(text='Nhớ hỏi trước *số đo cổ tay*', sub=TD, ss=2))])
    reel_that('T4-15', [
        (58, dict(text='Đi tập thể thao có nên *đeo vòng?*', big=H)),
        (73, dict(text='*Nên tháo ra* trước khi tập', ss=1)),
        (76, dict(text='Mồ hôi muối bám vào làm *xỉn màu* vòng', ss=1)),
        (64, dict(text='Lỡ xỉn màu: lau nhẹ bằng *khăn mềm*', sub=TD, ss=0))])
    reel_that('T4-18', [
        (69, dict(text='Đầu óc căng? *Ngừng lại 1 phút*', big=H)),
        (85, dict(text='Chạm vào *từng hạt* vòng', ss=2)),
        (107, dict(text='Hít thở *chậm* lại', ss=1)),
        (28, dict(text='Rồi làm tiếp, *nhẹ đầu hơn*', sub=TD, ss=0))])
    reel_that('T4-21', [
        (87, dict(text='Đeo vòng trầm, xịt nước hoa *ở đâu?*', big=H)),
        (37, dict(text='*Né cổ tay* ra anh chị nhé', ss=1.5)),
        (78, dict(text='Nước hoa đè lên *mùi trầm*', ss=0.3)),
        (55, dict(text='Giữ mùi trầm *mộc nguyên bản*', sub=TD))])
    TK.dong()
