import sys, os, subprocess, math, struct, wave
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tk import *
RW, RH = 1080, 1920
TMP = S + 'reeltmp/'; os.makedirs(TMP, exist_ok=True)
# vùng an toàn Reels: trên 12%, dưới 20%, trái/phải 8%
SX, STOP, SBOT = 90, 240, 1920 - 400

def frame(im, lines, fy=0.5, dark=True, big=68, sub=None, pos='bottom', kicker=None):
    """Khung 1080x1920: ảnh tràn + chữ lớn. lines: tiêu đề. sub: dòng phụ."""
    c = fit(im, RW, RH, fy=fy).convert('RGBA')
    if dark:
        ov = Image.new('RGBA', (RW, RH), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
        if pos == 'bottom':
            for i in range(760):
                a = int(215 * (i / 760) ** 1.5); od.line([(0, RH - 760 + i), (RW, RH - 760 + i)], fill=(18, 12, 8, a))
        else:
            for i in range(700):
                a = int(215 * (1 - i / 700) ** 1.5); od.line([(0, i), (RW, i)], fill=(18, 12, 8, a))
        c.alpha_composite(ov)
    d = ImageDraw.Draw(c); ft = F('Phudu-Bold.ttf', big); fs = F('EuclidCircularAVN-SemiBold.ttf', 38)
    lt = wrap(d, lines, ft, RW - 2 * SX); ls = wrap(d, sub, fs, RW - 2 * SX) if sub else []
    ht = len(lt) * big * 1.1 + (len(ls) * 38 * 1.3 + 24 if ls else 0) + (70 if kicker else 0)
    y = SBOT - ht if pos == 'bottom' else STOP
    if kicker:
        tag(c, (SX, y), kicker.upper(), F('EuclidCircularAVN-SemiBold.ttf', 28)); y += 70; d = ImageDraw.Draw(c)
    for ln in lt:
        d.text((SX + 3, y + 3), ln, font=ft, fill=(0, 0, 0, 120)); d.text((SX, y), ln, font=ft, fill=CREAM); y += big * 1.1
    if ls:
        y += 24
        for ln in ls: d.text((SX, y), ln, font=fs, fill=(230, 215, 190)); y += 38 * 1.3
    watermark(c, (0, STOP, RW, SBOT), k=2, alpha=0.3); logo_goc(c, 'tr', h=96, pad=SX)
    return c

def clip(png, out, dur=3.5, zoom='in'):
    # Ken Burns: zoom nhẹ 1.0 -> 1.08 (hoặc ngược)
    n = int(dur * 30)
    z = f"min(zoom+0.0012,1.08)" if zoom == 'in' else f"if(eq(on,1),1.08,max(zoom-0.0012,1.0))"
    vf = f"scale=1296:2304,zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1080x1920:fps=30,format=yuv420p"
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-i', png, '-vf', vf, '-t', str(dur), '-r', '30', out], check=True)

def ambient(path, dur):
    sr = 44100; n = int(sr * dur); import random
    random.seed(7); fr = [110, 164.81, 220, 277.18, 329.63]; samples = []
    lp = 0.0
    for i in range(n):
        t = i / sr; env = min(1, t / 2.5) * min(1, (dur - t) / 2.5)
        v = 0
        for k, f in enumerate(fr):
            v += math.sin(2 * math.pi * f * t + k) * (0.18 - k * 0.025) * (0.75 + 0.25 * math.sin(2 * math.pi * 0.07 * t + k))
        nz = random.uniform(-1, 1); lp = lp * 0.995 + nz * 0.005; v += lp * 0.9
        samples.append(int(max(-1, min(1, v * env * 0.6)) * 32767))
    with wave.open(path, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(struct.pack('<%dh' % n, *samples))

def reel(name, slides, dur=3.6, xf=0.7):
    """slides: list of (PIL image frame). Ghép có chuyển cảnh mờ."""
    parts = []
    for i, fr in enumerate(slides):
        p = TMP + f'{name}_{i}.png'; fr.convert('RGB').save(p); o = TMP + f'{name}_{i}.mp4'
        clip(p, o, dur, 'in' if i % 2 == 0 else 'out'); parts.append(o)
    total = dur * len(parts) - xf * (len(parts) - 1)
    args = ['ffmpeg', '-y', '-loglevel', 'error']
    for p in parts: args += ['-i', p]
    aud = TMP + f'{name}_aud.wav'; ambient(aud, total + 0.5); args += ['-i', aud]
    if len(parts) == 1: fc = '[0:v]copy[v]'
    else:
        fc = ''; prev = '[0:v]'
        for i in range(1, len(parts)):
            off = dur * i - xf * i; outl = f'[v{i}]' if i < len(parts) - 1 else '[v]'
            fc += f'{prev}[{i}:v]xfade=transition=fade:duration={xf}:offset={off:.3f}{outl};'; prev = outl
        fc = fc.rstrip(';')
    out = OUT + name + '.mp4'
    args += ['-filter_complex', fc, '-map', '[v]', '-map', f'{len(parts)}:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out]
    subprocess.run(args, check=True); return out

if __name__ == '__main__':
    # T1-02: hạt để mộc nhìn gần
    reel('T1-02', [
        frame(photo(441), 'Nhìn gần một hạt trầm để mộc', fy=0.5, sub='Thấy sớ gỗ. Thấy vân dầu chạy theo thớ.', kicker='Soi hạt'),
        frame(photo(450), 'Hạt phủ keo, phủ sơn?', fy=0.5, sub='Nhìn gần chỉ thấy một lớp bóng đều. Sớ gỗ bị che mất.'),
        frame(photo(442), 'Để mộc. Không keo. Không sáp. Không sơn.', fy=0.5, sub='Trầm Hương Mỗi Ngày — Sơn Mộc Hương'),
    ])
    # T1-04: cảm hứng sáng
    reel('T1-04', [
        frame(photo(329), 'Sáng nay,', fy=0.5, pos='top', big=80),
        frame(photo(452), 'đeo vòng trầm hương lên tay,', fy=0.5, pos='top', big=70),
        frame(photo(286), 'hít một hơi thật sâu.', fy=0.5, pos='top', big=76),
        frame(photo(272), 'Ngày mới nhẹ hơn một chút.', fy=0.45, sub='Theo dõi Trầm Hương Mỗi Ngày', big=70),
    ], dur=3.0)
    # T1-06: càng đen càng bóng?
    reel('T1-06', [
        frame(photo(265), 'Càng đen, càng bóng, càng nhiều dầu?', fy=0.5, kicker='Hiểu lầm'),
        frame(photo(234), 'Hàng nấu dầu cũng đen, cũng bóng, cũng nặng tay. Thả nước cũng chìm.', fy=0.5, big=58),
        frame(photo(441), 'Đừng kết luận bằng một dấu hiệu.', fy=0.5, sub='Nhìn sớ · ngửi mùi khi đeo lâu · hỏi rõ nguồn gốc'),
    ], dur=3.8)
    # T1-08: hậu trường
    reel('T1-08', [
        frame(photo(349), 'Đằng sau mỗi chiếc vòng trầm hương', fy=0.4, kicker='Hậu trường'),
        frame(photo(213), 'là một đội nhỏ ở Thủ Đức.', fy=0.5),
        frame(photo(229), 'Chọn phôi. Xâu hạt. Kiểm từng lỗ khoan.', fy=0.5, big=60),
        frame(photo(347), 'Rồi mới đóng hộp.', fy=0.4, sub='Trầm Hương Mỗi Ngày — Sơn Mộc Hương'),
    ], dur=3.2)
    # T1-10: nụ trầm cuối ngày
    reel('T1-10', [
        frame(photo(406), 'Cuối ngày, đốt một nụ trầm.', fy=0.4, pos='top'),
        frame(photo(409), 'Khói lên chậm. Mùi dịu. Phòng ấm lại.', fy=0.5, pos='top', big=62),
        frame(photo(404), 'Bột gỗ trầm kết hợp vỏ cây bời lời. Không pha mùi.', fy=0.5, big=56, sub='Nụ trầm Sơn Mộc Hương'),
    ], dur=3.8)
    # T1-12: vài trăm vs hơn 1 triệu
    reel('T1-12', [
        frame(photo(285), 'Vòng vài trăm và vòng hơn 1 triệu khác nhau ở đâu?', fy=0.5, big=62, kicker='Hỏi nhanh'),
        frame(photo(440), 'Khác ở phôi.', fy=0.5, sub='Trầm chuẩn: tia dầu nâu mảnh, hương nhẹ. Tốc kiến: vân dầu sắc hơn, hương ngọt sâu hơn.', big=84),
        frame(photo(215), 'Không khác ở màu đen hay độ bóng.', fy=0.5, sub='Biết mình mua loại gì thì không sợ mua hớ.'),
    ], dur=3.8)
    # T1-14: cảm ơn tuần 1
    reel('T1-14', [
        frame(photo(91), 'Một tuần đầu của Trầm Hương Mỗi Ngày', fy=0.4, kicker='Cảm ơn anh chị'),
        frame(photo(282), 'Tuần sau: phân biệt vòng phủ keo chỉ bằng móng tay', fy=0.5, big=60),
        frame(photo(292), 'Theo dõi để không bỏ lỡ.', fy=0.45, sub='Trầm Hương Mỗi Ngày — Sơn Mộc Hương'),
    ], dur=3.4)
    print('xong')
