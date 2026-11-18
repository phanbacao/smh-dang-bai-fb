# Tuần 3 (21–27/11/2026) — bản thiết kế mới, chủ đề học từ bảng "Content win 4 kênh"
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lam_thiet_ke import *
K = 'Ngày %d/30 · Hiểu trầm'
def tag(t, y=108): return f'<div class="abs" style="left:108px;top:{y}px"><span class="tag">{t}</span></div>'
def h1(t, y=176, s=84, w=864): return f'<h1 class="abs" style="left:108px;top:{y}px;width:{w}px;font-size:{s}px">{t}</h1>'
def p_(t, y, s=34, x=108, w=864, c=''): return f'<p class="abs" style="left:{x}px;top:{y}px;width:{w}px;font-size:{s}px;{c}">{t}</p>'

SANG = [
 ('T3-01', 'Thứ Bảy,<br>cho phép mình nghỉ<br>mà không áy náy.', 'Lưu lại cho những tuần bận rộn'),
 ('T3-04', 'Gọi cho mẹ một cuộc.<br>Chỉ để hỏi<br>cơm chưa.', 'Gửi cho người anh chị đang nhớ'),
 ('T3-07', 'Đầu tuần không cần<br>hơn ai. Chỉ cần<br>hơn hôm qua.', 'Lưu lại để đọc vào sáng thứ Hai'),
 ('T3-10', 'Đang giận<br>thì khoan trả lời<br>tin nhắn.', 'Gửi cho người hay nóng vội'),
 ('T3-13', 'Góc nhà gọn gàng,<br>lòng cũng<br>nhẹ hơn.', 'Dọn một góc nhỏ hôm nay'),
 ('T3-16', 'Kiếm được là giỏi.<br>Giữ được là khôn.<br>Biết đủ là an.', 'Lưu lại để nhắc mình'),
 ('T3-19', 'Cuối tháng rồi.<br>Mình vẫn ở đây,<br>vậy là giỏi lắm.', 'Gửi cho người đang cố gắng'),
]
def t02():
    h = tag(K % 8) + h1('Đeo 4 vòng thì <em>rộng</em>,<br>5 vòng thì <em>chật</em>?', 172, 80)
    h += ph(88, 108, 386, 864, 470, '50% 60%', wm=[(.06, .12), (.7, .7)])
    h += '''<div class="abs the" style="left:108px;top:880px;width:864px;height:252px;background:var(--xanh);padding:26px 40px">
    <div style="font:800 46px/1.2 PF;color:#fff8e8">Xem lại <i style="color:var(--vang2)">cỡ hạt</i></div>
    <div style="font:400 31px/1.4 BV;color:#dfe5f3;margin-top:12px">Cùng 108 hạt, cỡ hạt khác nhau thì chiều dài chuỗi cũng khác. Đo cổ tay rồi chọn lại cỡ hạt.</div></div>'''
    return render('T3-02.jpg', h + chan())
PBM = [('Tý', 'Thiên Thủ Thiên Nhãn'), ('Sửu · Dần', 'Hư Không Tạng'), ('Mão', 'Văn Thù'), ('Thìn · Tỵ', 'Phổ Hiền'), ('Ngọ', 'Đại Thế Chí'), ('Mùi · Thân', 'Như Lai Đại Nhật'), ('Dậu', 'Bất Động Minh Vương'), ('Tuất · Hợi', 'A Di Đà')]
def t05():
    h = tag(K % 9) + h1('Mỗi con giáp<br>một vị <em>Phật bản mệnh</em>', 170, 70)
    r = ''.join(f'<div style="display:flex;align-items:center;height:82px;border-top:1px solid rgba(243,213,140,.32)"><div style="width:270px;font:700 34px BV;color:var(--vang2)">{a}</div><div style="font:600 37px BV;color:#fff">{b}</div></div>' for a, b in PBM)
    h += f'<div class="abs" style="left:108px;top:356px;width:864px">{r}</div>' + p_('Theo quan niệm Phật giáo. Lưu lại để tra khi cần.', 1032, 28, c='color:#c9d3ea')
    return render('T3-05.jpg', h + chan(), cls='xanh')
def t08():
    R = [('Nhìn màu nhang để đoán lượng trầm', 'Màu không nói được điều đó'), ('Vừa đốt đã thơm mạnh là nhang tốt', 'Chưa chắc là tốt hơn'), ('Nhang cháy bị cong là nhang kém', 'Cong khi cháy chưa nói lên chất lượng')]
    h = tag(K % 10) + h1('3 hiểu lầm khi chọn<br><em>nhang trầm</em>', 172, 78)
    y = 400
    for a, b in R:
        h += f'''<div class="abs the" style="left:108px;top:{y}px;width:864px;height:204px;background:#fff;box-shadow:0 10px 30px rgba(15,47,110,.09)">
        <div class="dong" style="gap:18px;font:600 33px/1.3 BV;color:#8a8f9c"><span style="color:#c0483c;font-weight:800">✕</span><span style="text-decoration:line-through;text-decoration-thickness:2px">{a}</span></div>
        <div class="dong" style="gap:18px;font:700 38px/1.3 BV;color:var(--xanh);margin-top:18px"><span style="color:#b5842a;font-weight:800">✓</span><span>{b}</span></div></div>'''; y += 226
    return render('T3-08.jpg', h + chan())
def t11():
    h = tag(K % 11) + h1('Có nên đeo<br>vòng trầm hương<br><em>suốt ngày?</em>', 172, 72, 560)
    h += ph(89, 612, 440, 360, 650, '52% 50%', 'vom', wm=[(.05, .3), (.42, .78)]) + '<div class="vien vom" style="left:596px;top:424px;width:392px;height:682px;opacity:.7"></div>'
    L = [('Nên tháo', 'Khi tắm, khi vận động mạnh'), ('Vì sao', 'Nước, xà phòng, nước hoa ảnh hưởng tới hạt và mùi'), ('Không đeo', 'Cất vào hộp sạch, khô')]
    y = 492
    for a, b in L:
        h += f'<div class="abs" style="left:108px;top:{y}px;width:450px"><div style="font:800 38px PF;color:#b5842a">{a}</div><div style="font:400 32px/1.36 BV;color:var(--muc);margin-top:6px">{b}</div></div>'; y += 200
    return render('T3-11.jpg', h + chan())
MENH = [('Kim', 'Vàng, Trắng', ['#e8b93a', '#ffffff']), ('Thuỷ', 'Trắng, Đen', ['#ffffff', '#15161a']), ('Mộc', 'Đen, Xanh lá', ['#15161a', '#2e9b55']), ('Hoả', 'Xanh lá, Đỏ', ['#2e9b55', '#d2322d']), ('Thổ', 'Đỏ, Vàng', ['#d2322d', '#e8b93a'])]
def t14():
    h = tag(K % 12) + h1('Lu thống màu gì<br><em>hợp mệnh</em> anh chị?', 170, 70) + ph(319, 108, 356, 864, 330, '50% 42%')
    y = 708
    for m, c, d in MENH:
        ch = ''.join(f'<i style="display:block;width:38px;height:38px;border-radius:50%;background:{x};border:2px solid rgba(255,255,255,.75);margin-left:-8px"></i>' for x in d)
        h += f'<div class="abs" style="left:108px;top:{y}px;width:864px;height:72px;display:flex;align-items:center;border-top:1px solid rgba(243,213,140,.32)"><div style="width:190px;font:800 38px PF;color:var(--vang2)">{m}</div><div style="flex:1;font:600 33px BV;color:#fff">{c}</div><div style="display:flex">{ch}</div></div>'; y += 72
    h += p_('Theo quan niệm ngũ hành, chỉ để tham khảo.', 1076, 27, c='color:#c9d3ea')
    return render('T3-14.jpg', h + chan(), cls='xanh')
def t17():
    h = '<div class="abs" style="inset:0;background:#fffbf0"></div>' + ph(430, 0, 318, 1080, 720, '50% 0', '', zoom='720px auto', extra='box-shadow:none;background-color:#fffbf0;background-repeat:no-repeat')
    h += tag(K % 13) + h1('Đeo vòng trầm hương có thật sự <em>mang lại may mắn?</em>', 172, 66)
    h += p_('Theo quan niệm là <b>lời nhắc sống chậm, giữ tâm bình an</b>. Còn lại ở cách mình sống mỗi ngày.', 1056, 30)
    return render('T3-17.jpg', h + chan(), cls='')
def t20():
    a = tag(K % 14) + h1('Vòng tròn đơn<br>hay <em>chuỗi 108 hạt?</em>', 172, 80)
    a += ph(373, 108, 420, 420, 590, '50% 50%', 'vom') + ph(435, 552, 420, 420, 590, '72% 55%', 'vom', wm=[(.08, .3)])
    a += '<div class="abs" style="right:108px;top:1040px"><span class="nut">Lướt xem<i></i></span></div>'
    render('T3-20a.jpg', a + chan(), cls='xanh')
    S_ = [('b', 245, '50% 62%', 'Vòng tròn đơn', 'Gọn gàng, <em>dễ phối đồ</em>', 'Đeo một vòng quanh cổ tay, hợp người thích nhẹ nhàng, không cầu kỳ.', 'kem', None),
          ('c', 283, '50% 55%', 'Chuỗi 108 hạt', 'Đầy đặn, <em>nổi bật</em>', 'Quấn nhiều vòng quanh cổ tay. Nhiều người chọn vì ý nghĩa buông bỏ phiền não.', 'xanh', [(.06, .08)]),
          ('d', 452, '60% 55%', 'Chọn thế nào?', 'Theo <em>thói quen</em> của mình', 'Thích gọn thì vòng tròn đơn. Thích lần hạt, quấn nhiều vòng thì chuỗi 108 hạt.', 'kem', [(.05, .08)])]
    for k, n, pos, t, ti, b, c, w in S_:
        h = ph(n, 108, 108, 864, 590, pos, wm=w) + tag(t, 734) + h1(ti, 796, 64) + p_(b, 900 + (0 if len(ti) < 34 else 0), 33)
        render(f'T3-20{k}.jpg', h + chan(), cls=c)
if __name__ == '__main__':
    for i, (n, t, c) in enumerate(SANG): manifest(n + '.jpg', i, t, c)
    for f in (t02, t05, t08, t11, t14, t17, t20): f()
    dong(); print('xong')
