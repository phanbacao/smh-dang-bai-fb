# Tuần 4 (28/11–04/12/2026) — thiết kế tông xanh hộp + vàng + kem, chủ đề theo "Content win", kiến thức từ kịch bản đã duyệt
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lam_thiet_ke import *
K = 'Ngày %d/30 · Hiểu trầm'
def tag(t, y=108, x=108): return f'<div class="abs" style="left:{x}px;top:{y}px"><span class="tag">{t}</span></div>'
def h1(t, y=176, s=84, w=864, x=108): return f'<h1 class="abs" style="left:{x}px;top:{y}px;width:{w}px;font-size:{s}px">{t}</h1>'
def p_(t, y, s=34, x=108, w=864, c=''): return f'<p class="abs" style="left:{x}px;top:{y}px;width:{w}px;font-size:{s}px;{c}">{t}</p>'
def so(n, x, y, nen='var(--vang2)', mau='var(--dem)'): return f'<div class="abs" style="left:{x}px;top:{y}px;width:64px;height:64px;border-radius:50%;background:{nen};color:{mau};font:800 34px/64px PF;text-align:center">{n}</div>'

SANG = [
 ('T4-01', 'Cuối tuần,<br>tắt thông báo<br>một buổi thôi.', 'Thế giới vẫn ổn. Mình cũng vậy.'),
 ('T4-04', 'Ăn một bữa<br>cơm nhà,<br>không cầm điện thoại.', 'Gửi cho người hay ăn cùng mình'),
 ('T4-07', 'Việc khó<br>làm trước.<br>Việc dễ để sau.', 'Lưu lại cho sáng đầu tuần'),
 ('T4-10', 'Tháng 12 rồi.<br>Vẫn kịp làm<br>điều mình đã hứa.', 'Gửi cho người đang cần động lực'),
 ('T4-13', 'Nói chậm<br>một nhịp,<br>người nghe hiểu nhiều hơn.', 'Lưu lại để nhắc mình'),
 ('T4-16', 'Ngủ sớm hơn<br>30 phút.<br>Mai mình sẽ cảm ơn mình.', 'Tối nay thử xem'),
 ('T4-19', 'Giữ được<br>lời hứa nhỏ,<br>người ta tin mình việc lớn.', 'Gửi cho người luôn giữ lời'),
]

def t02():  # Ngày 15: đeo chuỗi 108 hạt không bị xoắn — ảnh cuộn 4 ảnh
    a = tag(K % 15) + h1('Đeo chuỗi 108 hạt<br>cứ bị <em>xoắn?</em>', 172, 80)
    a += ph(272, 108, 400, 864, 640, '50% 55%', 'vom', wm=[(.06, .25), (.62, .7)])
    a += '<div class="abs" style="right:108px;top:1062px"><span class="nut">4 bước, lướt xem<i></i></span></div>'
    render('T4-02a.jpg', a + chan(), cls='xanh')
    B = [('b', 289, '50% 45%', 'Bước 1', 'Đặt <em>hồ lô</em> lên cổ tay', 'Giữ hồ lô ở mặt trên cổ tay rồi quấn vòng đầu tiên.', 'kem', [(.06, .1)]),
         ('c', 273, '50% 55%', 'Bước 2 · 3', 'Quấn tiếp <em>vòng 2, vòng 3</em>', 'Quấn từng vòng sát nhau vừa phải, không kéo căng dây.', 'xanh', [(.06, .1)]),
         ('d', 280, '50% 40%', 'Bước 4', 'Quấn vòng cuối, <em>chỉnh cân đối</em>', 'Vòng vừa tay là ôm nhẹ, không siết đau, không tuột.', 'kem', [(.62, .1)])]
    for k, n, pos, t, ti, b, c, w in B:
        h = ph(n, 108, 108, 864, 600, pos, wm=w) + tag(t, 744) + h1(ti, 806, 62) + p_(b, 980, 33)
        render(f'T4-02{k}.jpg', h + chan(), cls=c)

def t05():  # Ngày 16: cắt đôi hạt trầm thấy gì
    h = tag(K % 16) + h1('Cắt đôi hạt trầm,<br>bên trong <em>có gì?</em>', 170, 76)
    h += ph(441, 108, 382, 864, 360, '50% 50%', wm=[(.05, .1), (.68, .62)])
    C = [('Gió trắng', 'Ngoài đen bóng, <b>trong trắng</b>, không có tia dầu.', '#fff', 'var(--muc)'),
         ('Trầm chuẩn', 'Trong và ngoài <b>giống nhau</b>, vân trầm thành sớ.', 'var(--xanh)', '#fff8e8')]
    x = 108
    for t, b, bg, fg in C:
        h += f'<div class="abs the" style="left:{x}px;top:770px;width:420px;height:330px;background:{bg};box-shadow:0 10px 30px rgba(15,47,110,.1);color:{fg}"><div style="font:800 44px PF;color:{"#b5842a" if bg=="#fff" else "var(--vang2)"}">{t}</div><div style="font:400 32px/1.42 BV;margin-top:16px">{b.replace("<b>", "<b style=color:inherit;font-weight:800>")}</div></div>'
        x += 444
    h += p_('Gió trắng không phải trầm. Đừng kết luận chỉ bằng một dấu hiệu.', 1120, 26, c='color:var(--xam)')
    return render('T4-05.jpg', h + chan())

def t08():  # Ngày 17: vòng bị rộng — ảnh cuộn 4 ảnh
    a = ph(278, 108, 108, 864, 600, '50% 45%', wm=[(.1, .3), (.66, .62)])
    a += tag(K % 17, 750) + h1('Vòng 108 hạt bị rộng, có nên <em>tự cắt bớt hạt?</em>', 812, 66)
    a += '<div class="abs" style="right:108px;top:1040px"><span class="nut">Lướt xem<i></i></span></div>'
    render('T4-08a.jpg', a + chan())
    b = tag('Đừng vội cắt') + h1('Tự cắt ở nhà dễ <em>hỏng vòng</em>', 172, 68)
    L = ['Mất số lượng 108 hạt', 'Buộc dây không chắc, nút xấu', 'Vòng mất ý nghĩa ban đầu']
    y = 420
    for i, t in enumerate(L):
        b += so(i + 1, 108, y) + f'<div class="abs" style="left:200px;top:{y+6}px;width:772px;font:600 38px/1.3 BV;color:#fff">{t}</div>'; y += 120
    b += ph(290, 108, 800, 864, 300, '50% 55%', wm=[(.66, .3)])
    render('T4-08b.jpg', b + chan(), cls='xanh')
    c = ph(284, 108, 108, 864, 560, '50% 50%', wm=[(.06, .1)]) + tag('Nên làm gì', 704) + h1('Đo lại cổ tay, <em>xem lại size hạt</em>', 766, 62)
    c += p_('Kiểm tra vòng đang là 6 li, 7 li hay 8 li, rồi nhờ nơi bán tư vấn chỉnh dây hoặc đổi size cho vừa.', 940, 33)
    render('T4-08c.jpg', c + chan())
    d = tag('Đeo lâu bị giãn dây?') + h1('Chỉnh lại <em>ở đầu hồ lô</em>', 172, 70)
    S_ = ['Nắm đầu dây kéo ra, xem đã vừa tay chưa', 'Dàn đều các hạt để dây không chỗ căng, chỗ giãn', 'Vừa rồi thì thắt cố định dây ở đầu hồ lô']
    y = 380
    for i, t in enumerate(S_):
        d += f'<div class="abs the" style="left:108px;top:{y}px;width:864px;height:150px;background:#fff;box-shadow:0 10px 30px rgba(15,47,110,.08)"></div>' + so(i + 1, 140, y + 43, 'var(--xanh)', '#fff8e8') + f'<div class="abs" style="left:236px;top:{y}px;width:700px;height:150px;display:flex;align-items:center;font:600 34px/1.32 BV;color:var(--muc)">{t}</div>'; y += 176
    d += ph(302, 108, 920, 864, 180, '50% 50%')
    render('T4-08d.jpg', d + chan())

def t11():  # Ngày 18: lỡ để vòng dính nước
    h = tag(K % 18) + h1('Lỡ để vòng trầm hương <em>dính nước?</em>', 172, 70)
    h += ph(442, 108, 380, 864, 460, '50% 50%', wm=[(.06, .1), (.66, .66)])
    R = [('Ít nước', 'Rửa tay, vài giọt mưa: không sao'), ('Nhiều nước', 'Lau khô từng hạt, để nơi thoáng'), ('Đừng', 'Dùng máy sấy nhiệt độ cao')]
    x = 108
    for a, b in R:
        h += f'<div class="abs" style="left:{x}px;top:880px;width:270px"><div style="font:800 38px PF;color:var(--vang2)">{a}</div><div style="font:400 29px/1.36 BV;color:#eef1f8;margin-top:8px">{b}</div></div>'; x += 297
    return render('T4-11.jpg', h + chan(), cls='xanh')

def t14():  # Ngày 19: thanh tẩy vòng bằng khói nụ trầm
    h = tag(K % 19) + h1('Xông vòng trầm hương<br>bằng <em>khói nụ trầm</em>', 172, 74)
    h += ph(404, 108, 400, 500, 700, '42% 50%', 'vom', wm=[(.08, .3), (.4, .78)]) + '<div class="vien vom" style="left:92px;top:384px;width:532px;height:732px;opacity:.7"></div>'
    S_ = [('1', 'Đốt một viên nụ trầm'), ('2', 'Đưa vòng qua lại trên làn khói ấm'), ('3', 'Chừng vài phút rồi đeo lại')]
    y = 440
    for n, t in S_:
        h += so(n, 650, y) + f'<div class="abs" style="left:650px;top:{y+80}px;width:322px;font:600 33px/1.3 BV;color:var(--muc)">{t}</div>'; y += 230
    return render('T4-14.jpg', h + chan())

def t17():  # Ngày 20: 3 lưu ý khi đốt nụ trầm — ảnh cuộn 4 ảnh
    a = tag(K % 20) + h1('3 lưu ý khi đốt <em>nụ trầm</em>', 172, 84)
    a += ph(409, 108, 400, 864, 640, '50% 45%', 'vom', wm=[(.06, .3), (.64, .72)])
    a += '<div class="abs" style="right:108px;top:1062px"><span class="nut">Lướt xem<i></i></span></div>'
    render('T4-17a.jpg', a + chan(), cls='xanh')
    B = [('b', 405, '50% 55%', 'Lưu ý 1', 'Đốt ở nơi <em>thoáng</em>', 'Nụ cháy toả nhiều khói, cần không gian đủ rộng. Tránh phòng kín hoặc chỗ gió lùa.', 'kem'),
         ('c', 412, '50% 55%', 'Lưu ý 2', 'Đốt <em>vừa đủ</em>', 'Một đến hai nụ, khoảng 30 phút đến một tiếng là đủ để thưởng hương.', 'xanh'),
         ('d', 407, '50% 55%', 'Lưu ý 3', 'Để xa <em>tầm tay trẻ nhỏ</em>', 'Nụ trầm đang cháy dễ thu hút các bé. Đặt ở chỗ cao, chắc chắn.', 'kem')]
    for k, n, pos, t, ti, b, c in B:
        h = ph(n, 108, 108, 864, 600, pos, wm=[(.62, .08)]) + tag(t, 744) + h1(ti, 806, 64) + p_(b, 908, 33)
        render(f'T4-17{k}.jpg', h + chan(), cls=c)

def t20():  # Ngày 21: đi làm văn phòng đeo vòng trầm hương
    h = tag(K % 21) + h1('Dân văn phòng<br>có nên đeo<br><em>vòng trầm hương?</em>', 172, 70, 520)
    h += ph(436, 612, 172, 360, 560, '55% 50%', 'bo', wm=[(.1, .7)])
    L = [('Dễ phối', 'Mộc mạc, hợp áo sơ mi, váy công sở'), ('Dễ chịu', 'Hương thoang thoảng lúc việc dồn dập'), ('Một phút', 'Chạm từng hạt, hít thở chậm lại')]
    y = 770
    for a, b in L:
        h += f'<div class="abs" style="left:108px;top:{y}px;width:864px;display:flex;align-items:baseline;gap:28px;border-top:1px solid rgba(243,213,140,.35);padding-top:16px"><div style="width:210px;flex:none;font:800 38px PF;color:var(--vang2)">{a}</div><div style="font:400 32px/1.35 BV;color:#eef1f8">{b}</div></div>'; y += 112
    return render('T4-20.jpg', h + chan(), cls='xanh')

if __name__ == '__main__':
    ONLY = os.environ.get('ONLY', '').split()
    if not ONLY or 'sang' in ONLY:
        for i, (n, t, c) in enumerate(SANG): manifest(n + '.jpg', i + 2, t, c)
    for f in (t02, t05, t08, t11, t14, t17, t20):
        if not ONLY or f.__name__ in ONLY: f()
    dong(); print('xong')
