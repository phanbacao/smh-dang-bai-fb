import sys, subprocess, os, json
sys.path.insert(0, '/tmp/claude-0/-home-claude/27a985b6-0162-505e-a158-bc5bd05af075/scratchpad')
exec(open('lam_reel.py').read().split("if __name__ == '__main__':")[0])   # lấy frame/ambient... (bỏ phần chạy)
RAW = S + 'vraw/'; TT = S + 'reeltmp/'
def dur(f):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).decode().strip() or 0)
def overlay_text(path, text, sub=None, kicker=None, pos='bottom', big=70):
    c = Image.new('RGBA', (RW, RH), (0, 0, 0, 0)); od = ImageDraw.Draw(c)
    if pos == 'bottom':
        for i in range(700): od.line([(0, RH - 700 + i), (RW, RH - 700 + i)], fill=(18, 12, 8, int(200 * (i / 700) ** 1.5)))
    else:
        for i in range(620): od.line([(0, i), (RW, i)], fill=(18, 12, 8, int(200 * (1 - i / 620) ** 1.5)))
    d = ImageDraw.Draw(c); ft = F('Phudu-Bold.ttf', big); fs = F('EuclidCircularAVN-SemiBold.ttf', 38)
    lt = wrap(d, text, ft, RW - 2 * SX); ls = wrap(d, sub, fs, RW - 2 * SX) if sub else []
    ht = len(lt) * big * 1.1 + (len(ls) * 38 * 1.3 + 24 if ls else 0) + (70 if kicker else 0)
    y = SBOT - ht if pos == 'bottom' else STOP
    if kicker: tag(c, (SX, y), kicker.upper(), F('EuclidCircularAVN-SemiBold.ttf', 28)); y += 70; d = ImageDraw.Draw(c)
    for ln in lt:
        d.text((SX + 3, y + 3), ln, font=ft, fill=(0, 0, 0, 130)); d.text((SX, y), ln, font=ft, fill=CREAM); y += big * 1.1
    if ls:
        y += 24
        for ln in ls: d.text((SX, y), ln, font=fs, fill=(235, 220, 195)); y += 38 * 1.3
    c.save(path); return path
def logo_layer(path):
    c = Image.new('RGBA', (RW, RH), (0, 0, 0, 0)); watermark(c, (0, STOP, RW, SBOT), k=2, alpha=0.28); logo_goc(c, 'tr', h=96, pad=SX); c.save(path); return path
def reel_that(name, segs, d_seg=3.2, xf=0.35):
    """segs: list of (số clip, dict(text, sub, kicker, pos, ss))"""
    parts = []
    for i, (n, o) in enumerate(segs):
        src = RAW + f'{n}.mov'; L = dur(src); ss = min(o.get('ss', 0.4), max(0, L - d_seg - 0.1)); t = min(d_seg, L - ss - 0.05)
        ov = overlay_text(TT + f'{name}_t{i}.png', o['text'], o.get('sub'), o.get('kicker'), o.get('pos', 'bottom'), o.get('big', 70))
        out = TT + f'{name}_s{i}.mp4'
        fc = f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1[v];[v][1:v]overlay=0:0:enable='lt(t,{t-0.05:.2f})',format=yuv420p[o]"
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(ss), '-t', f'{t:.2f}', '-i', src, '-i', ov, '-filter_complex', fc, '-map', '[o]', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-r', '30', out], check=True)
        parts.append((out, t))
    total = sum(t for _, t in parts) - xf * (len(parts) - 1)
    args = ['ffmpeg', '-y', '-loglevel', 'error']
    for p, _ in parts: args += ['-i', p]
    lg = logo_layer(TT + f'{name}_logo.png'); args += ['-i', lg]
    aud = TT + f'{name}_aud.wav'; ambient(aud, total + 0.5); args += ['-i', aud]
    k = len(parts); fc = ''; prev = '[0:v]'; acc = parts[0][1]
    for i in range(1, k):
        off = acc - xf; outl = f'[x{i}]'; fc += f'{prev}[{i}:v]xfade=transition=fade:duration={xf}:offset={off:.3f}{outl};'; prev = outl; acc = off + parts[i][1]
    fc += f'{prev}[{k}:v]overlay=0:0,format=yuv420p[v]'
    out = OUT + name + '.mp4'
    args += ['-filter_complex', fc, '-map', '[v]', '-map', f'{k + 1}:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out]
    subprocess.run(args, check=True); print(name, round(os.path.getsize(out) / 1e6, 1), 'MB', round(total, 1), 's'); return out
if __name__ == '__main__':
    reel_that('T1-02', [
        (6, dict(text='Nhìn gần một hạt trầm để mộc', kicker='Soi hạt', sub='Thấy sớ gỗ, thấy vân dầu chạy theo thớ.')),
        (59, dict(text='Hạt phủ keo, phủ sơn thì khác', sub='Nhìn gần chỉ thấy một lớp bóng đều, sớ gỗ bị che.', big=64)),
        (98, dict(text='Để mộc. Không keo. Không sáp.', sub='Không phủ sơn.', big=68)),
        (105, dict(text='Trầm Hương Mỗi Ngày', sub='Sơn Mộc Hương · theo dõi để xem thêm mỗi ngày'))])
    reel_that('T1-04', [
        (0, dict(text='Sáng nay,', pos='top', big=84)),
        (8, dict(text='đeo vòng trầm hương lên tay,', pos='top', big=70)),
        (47, dict(text='hít một hơi thật sâu.', pos='top', big=76)),
        (55, dict(text='Ngày mới nhẹ hơn một chút.', sub='Theo dõi Trầm Hương Mỗi Ngày', big=72))])
    reel_that('T1-06', [
        (19, dict(text='3 giây nhìn vòng trầm hương trên tay', kicker='Nhìn nhanh', big=66)),
        (87, dict(text='Đừng chỉ nhìn màu đen hay độ bóng', sub='Hàng nấu dầu cũng đen, cũng bóng, cũng nặng tay.', big=62)),
        (97, dict(text='Nhìn sớ. Ngửi mùi khi đeo lâu.', big=64)),
        (111, dict(text='Hỏi rõ nguồn gốc rồi hãy chọn.', sub='Trầm Hương Mỗi Ngày — Sơn Mộc Hương', big=64))])
    reel_that('T1-08', [
        (58, dict(text='Đằng sau mỗi chiếc vòng trầm hương', kicker='Hậu trường', big=62)),
        (22, dict(text='là một đội nhỏ ở Thủ Đức.', big=70)),
        (76, dict(text='Chọn phôi. Xâu hạt.', big=72)),
        (61, dict(text='Kiểm từng lỗ khoan, rồi mới đóng hộp.', sub='Trầm Hương Mỗi Ngày — Sơn Mộc Hương', big=60))])
    reel_that('T1-10', [
        (10, dict(text='Cuối ngày, đốt một nụ trầm.', pos='top', big=74), ),
        (10, dict(text='Khói lên chậm. Mùi dịu. Phòng ấm lại.', pos='top', big=62, ss=3.5)),
        (73, dict(text='Nụ trầm Sơn Mộc Hương', sub='Bột gỗ trầm kết hợp vỏ cây bời lời. Không pha mùi.', big=68))])
    reel_that('T1-12', [
        (7, dict(text='Bàn tay nào cũng hợp một chuỗi 108 hạt', kicker='Hỏi nhanh', big=62)),
        (30, dict(text='Khác nhau ở phôi, không phải ở màu hay độ bóng.', big=56)),
        (65, dict(text='Trầm chuẩn: tia dầu nâu mảnh, hương nhẹ.', big=58)),
        (70, dict(text='Tốc kiến: vân dầu sắc, hương ngọt sâu hơn.', sub='Biết mình mua loại gì thì không sợ mua hớ.', big=56))])
    reel_that('T1-14', [
        (100, dict(text='Một tuần đầu của Trầm Hương Mỗi Ngày', kicker='Cảm ơn anh chị', big=62)),
        (64, dict(text='Tuần sau: phân biệt vòng phủ keo bằng móng tay', big=56)),
        (72, dict(text='Theo dõi để không bỏ lỡ.', sub='Trầm Hương Mỗi Ngày — Sơn Mộc Hương', big=70))])
