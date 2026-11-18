# Tuần 3 (21–27/11/2026): Reels 19:30 từ video thật, chủ đề học từ "Content win", phụ đề kiểu mới (chạy trong thư mục cong-cu)
import os, sys
_D = os.path.dirname(os.path.abspath(__file__)); os.chdir(_D); sys.path.insert(0, _D)
exec(open('lam_reel_that.py').read().rsplit("if __name__ == '__main__':", 1)[0].replace("exec(open('lam_reel.py')", "exec(open(_D + '/lam_reel.py')"))
import lam_thiet_ke as TK
_i = {}
def overlay_text(path, text, sub=None, kicker=None, pos='bottom', big=70):
    return TK.phu_de(path, text, sub, kicker, hook=big >= 90)
TD = 'Theo dõi Trầm Hương Mỗi Ngày để xem tiếp'
END = dict(text='Theo dõi *Trầm Hương Mỗi Ngày* để xem tiếp', sub='Sơn Mộc Hương')
H = 90  # cỡ câu mở đầu
if __name__ == '__main__':
    _ONLY = os.environ.get('ONLY', '').split(); _rt = reel_that
    reel_that = lambda n, *a, **k: (_rt(n, *a, **k) if not _ONLY or n in _ONLY else None)
    reel_that('T3-03', [
        (94, dict(text='Đeo chuỗi 108 hạt để *nhắc mình* điều gì?', big=H)),
        (45, dict(text='*Khẩu thiện:* nói lời lành')),
        (31, dict(text='*Tâm thiện:* nghĩ điều lành')),
        (109, dict(text='*Hành thiện:* làm việc lành', sub=TD))])
    reel_that('T3-06', [
        (21, dict(text='Đeo vòng trầm hương *tay trái* hay *tay phải?*', big=H)),
        (63, dict(text='Mỗi người một quan niệm')),
        (74, dict(text='Không có quy tắc *cứng nhắc*')),
        (41, dict(text='Đeo bên nào thấy *thoải mái* là được', sub=TD))])
    reel_that('T3-09', [
        (66, dict(text='Hạt càng đậm có *càng tốt?*', big=H)),
        (91, dict(text='*Chưa chắc.*', ss=6)),
        (79, dict(text='Hàng nấu dầu cũng đậm, cũng bóng')),
        (51, dict(text='Xem thêm *sớ, gia công, nguồn gốc*', sub=TD, ss=8))])
    reel_that('T3-12', [
        (92, dict(text='Chọn vòng trầm hương, *hỏi 3 câu* này', big=H)),
        (77, dict(text='*1.* Đây là loại gỗ gì?')),
        (82, dict(text='*2.* Có phủ keo, sáp, sơn không?', ss=8)),
        (81, dict(text='*3.* Có bảo hành, đổi trả không?', sub=TD))])
    reel_that('T3-15', [
        (113, dict(text='Còn đúng *1 tháng* nữa là Noel', big=H)),
        (67, dict(text='Món quà đeo được *mỗi ngày*')),
        (43, dict(text='Để mộc, mùi dịu, nhẹ tay')),
        (20, dict(text='Gửi cho người đang *đau đầu chọn quà*', sub=TD))])
    reel_that('T3-18', [
        (110, dict(text='Đeo vòng mà *lúc thơm, lúc không?*', big=H)),
        (102, dict(text='Có thể mũi đã *quen mùi*')),
        (32, dict(text='Gặp hơi ấm cơ thể, hương dậy rõ hơn')),
        (106, dict(text='Thử cất *vài ngày* rồi ngửi lại', sub=TD))])
    reel_that('T3-21', [
        (90, dict(text='Khúc trầm ngoài đời *trông thế nào?*', big=H, ss=3.0)),
        (3, dict(text='Nhìn kỹ *sớ gỗ* trên từng hạt')),
        (62, dict(text='Không keo. Không sáp. Không phủ sơn.')),
        (56, END)])
    TK.dong()
