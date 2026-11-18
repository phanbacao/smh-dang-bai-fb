# Bộ thiết kế mới (từ 18/11/2026): dựng ảnh bằng HTML + Chromium, tông xanh hộp mới + vàng + kem.
# Font mở (Playfair Display, Be Vietnam Pro) tự tải từ npm vào $PP_DIR/web/, không đưa lên GitHub.
import os, subprocess, glob, shutil, html as _h
from tk import photo, S, OUT, CC
from playwright.sync_api import sync_playwright
WEB = S + 'web/'; os.makedirs(WEB, exist_ok=True)

def _fonts():
    if glob.glob(WEB + 'playfair-display-vietnamese-700-normal.woff2'): return
    t = WEB + 'npm/'; os.makedirs(t, exist_ok=True)
    subprocess.run(['npm', 'pack', '--silent', '@fontsource/playfair-display', '@fontsource/be-vietnam-pro'], cwd=t, check=True, stdout=subprocess.DEVNULL)
    for f in glob.glob(t + '*.tgz'): subprocess.run(['tar', 'xzf', f, '-C', t, '--one-top-level=' + os.path.basename(f)[:-4]], check=True)
    for f in glob.glob(t + '*/package/files/*-vietnamese-*.woff2') + glob.glob(t + '*/package/files/*-latin-[4-8]00-*.woff2'): shutil.copy(f, WEB)
_fonts()
for n in ('wm_ngang.png', 'logo_vuong_vang.png'): shutil.copy(CC + n, WEB + n)

def _ff(fam, slug, ws):
    o = ''
    for w in ws:
        for st in ('normal', 'italic'):
            for sub, rng in (('vietnamese', 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB'), ('latin', 'U+0000-00FF,U+2000-206F,U+2190-2193')):
                o += f"@font-face{{font-family:'{fam}';font-weight:{w};font-style:{st};src:url('{slug}-{sub}-{w}-{st}.woff2');unicode-range:{rng}}}"
    return o
CSS = _ff('PF', 'playfair-display', (600, 700, 800)) + _ff('BV', 'be-vietnam-pro', (400, 600, 700, 800)) + '''
:root{--xanh:#0f2f6e;--xanh2:#17438f;--dem:#0a1c44;--vang:#d9ab4f;--vang2:#f3d58c;--kem:#f8f3e8;--kem2:#efe6d3;--muc:#1b2a4a;--xam:#5b6478}
*{box-sizing:border-box;margin:0;padding:0}html,body{width:100%;height:100%}
#k{position:relative;overflow:hidden;font-family:BV;color:var(--muc);-webkit-font-smoothing:antialiased}
.kem{background:radial-gradient(120% 80% at 80% 0,#fffdf8 0,var(--kem) 55%,var(--kem2) 100%)}
.xanh{background:radial-gradient(110% 75% at 85% 0,#1d4fa6 0,var(--xanh) 52%,var(--dem) 100%);color:#f6f0e2}
.abs{position:absolute}.tag{display:inline-block;font:700 25px BV;letter-spacing:.09em;text-transform:uppercase;color:var(--xanh2);padding-bottom:10px;border-bottom:3px solid var(--vang)}
.xanh .tag{color:var(--vang2)}
h1{font:800 84px/1.14 PF;letter-spacing:-.01em;color:var(--xanh);text-wrap:balance}.xanh h1{color:#fff8e8}
h1 em{font-style:italic;color:#b5842a}.xanh h1 em{color:var(--vang2)}
p{font:400 34px/1.42 BV;color:var(--xam)}.xanh p{color:#d8dff0}p b{font-weight:700;color:var(--muc)}.xanh p b{color:#fff}
.ph{position:absolute;overflow:hidden;background-size:cover;background-repeat:no-repeat;box-shadow:0 22px 50px rgba(15,47,110,.22)}
.vom{border-radius:999px 999px 28px 28px}.bo{border-radius:30px}
.vien{position:absolute;border:2px solid var(--vang);pointer-events:none}
.wm{position:absolute;filter:brightness(0) invert(1);opacity:.42}.wm.toi{filter:brightness(0);opacity:.13}
.chan{position:absolute;left:108px;right:108px;bottom:108px;height:76px;display:flex;align-items:center;justify-content:space-between;font:600 25px BV;color:#a57a28}.xanh .chan{color:var(--vang2)}
.chan img{height:76px}
.dong{display:flex;align-items:center;gap:26px}.the{border-radius:24px;padding:26px 32px}
.nut{display:inline-flex;align-items:center;gap:16px;font:700 30px BV;color:var(--dem);background:var(--vang2);border-radius:99px;padding:15px 20px 15px 34px}
.nut i{width:42px;height:42px;border-radius:50%;background:var(--dem);position:relative;display:block}
.nut i:after{content:"";position:absolute;left:12px;top:15px;width:11px;height:11px;border-top:3px solid var(--vang2);border-right:3px solid var(--vang2);transform:rotate(45deg)}
.vangkim{background:linear-gradient(178deg,#fff0c2 8%,#e9c678 46%,#c79a45 92%);-webkit-background-clip:text;background-clip:text;color:transparent}
'''
_pw = _br = None
def br():
    global _pw, _br
    if not _br: _pw = sync_playwright().start(); _br = _pw.chromium.launch()
    return _br
def dong(): 
    global _pw, _br
    if _br: _br.close(); _pw.stop(); _br = _pw = None
def anh(n):
    f = f'p{n}.jpg'
    if not os.path.exists(WEB + f): photo(n).save(WEB + f, quality=94)
    return f
def ph(n, x, y, w, h, pos='50% 50%', cls='bo', zoom=None, wm=None, extra=''):
    sz = f'background-size:{zoom};' if zoom else ''
    m = ''
    for fx, fy in (wm or []):
        m += f'<img class="wm" src="wm_ngang.png" style="left:{int(w*fx)}px;top:{int(h*fy)}px;width:{max(150,int(w*.27))}px">'
    return f'<div class="ph {cls}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;background-image:url({anh(n)});background-position:{pos};{sz}{extra}">{m}</div>'
def chan(): return '<div class="chan"><span>Trầm Hương Mỗi Ngày</span><img src="logo_vuong_vang.png"></div>'
def render(name, inner, w=1080, h=1350, cls='kem', q=93, css='', trong=False, out=None):
    doc = f'<!doctype html><meta charset=utf-8><style>{CSS}{css}{"html,body{background:transparent}" if trong else ""}</style><div id=k class="{cls}" style="width:{w}px;height:{h}px">{inner}</div>'
    p = WEB + '_t.html'; open(p, 'w', encoding='utf-8').write(doc)
    pg = br().new_page(viewport={'width': w, 'height': h}); pg.goto('file://' + p); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(120)
    f = out or OUT + name
    if trong: pg.screenshot(path=f, omit_background=True)
    else: pg.screenshot(path=f, type='jpeg', quality=q)
    pg.close(); return f

def khoi(seed, mau='#f0d9a4'):
    """Làn khói trầm mềm bốc lên từ đáy khung, vẽ bằng SVG."""
    x = 300 + seed * 37 % 480
    d = [f'M{x} 1120 C {x-190} 900, {x+230} 720, {x-40} 500 S {x+150} 180, {x+30} -60', f'M{x+40} 1120 C {x+240} 930, {x-170} 700, {x+90} 470 S {x-120} 170, {x+120} -60']
    pa = ''.join(f'<path d="{q}" fill="none" stroke="{mau}" stroke-width="{34+i*26}" opacity="{.15-.05*i}"/>' for i, q in enumerate(d))
    return f'<svg class="abs" style="inset:0" width="1080" height="1080"><filter id="s" x="-40%" y="-20%" width="180%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".0035 .007" numOctaves="3" seed="{seed}"/><feDisplacementMap in="SourceGraphic" scale="170"/><feGaussianBlur stdDeviation="30"/></filter><g filter="url(#s)">{pa}</g></svg><div class="abs" style="left:0;right:0;bottom:0;height:420px;background:radial-gradient(60% 100% at 50% 100%,rgba(233,198,120,.2),transparent)"></div>'
NEN = ['#0f2f6e,#081a40', '#10295e,#070f2a', '#123a78,#0a1c44', '#0d2a55,#06142e', '#143f7d,#0a1f4b', '#0f2a66,#071536', '#163f86,#0a1c44']
def manifest(name, i, text, cta):
    a, b = NEN[i % 7].split(',')
    h = f'''<div class="abs" style="inset:0;background:radial-gradient(90% 80% at 50% 38%,{a},{b})"></div>{khoi(i * 7 + 3)}
    <div class="abs" style="left:150px;right:150px;top:118px;bottom:118px;border:1.5px solid rgba(233,198,120,.55);border-radius:400px 400px 22px 22px"></div>
    <div class="abs" style="left:190px;right:190px;top:236px;height:560px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
    <div class="vangkim" style="font:800 70px/1.24 PF;padding:8px 0;filter:drop-shadow(0 2px 6px rgba(0,0,0,.45))">{text}</div>
    <div style="width:84px;height:2px;background:#e9c678;margin:30px 0 26px"></div><div style="font:600 31px/1.35 BV;color:#eef0f6">{cta}</div></div>
    <div class="abs" style="left:0;right:0;bottom:152px;text-align:center;font:600 27px BV;letter-spacing:.04em;color:#e9c678">#sonmochuong</div>'''
    return render(name, h, 1080, 1080, 'xanh')

def phu_de(path, text, sub=None, kicker=None, hook=False):
    """Lớp chữ Reels nền trong: từng dòng chữ nằm trên thẻ tối riêng, không làm tối cả khung. *từ* = tô vàng."""
    import re
    t = re.sub(r'\*(.+?)\*', r'<b style="color:#f3d58c;font-weight:800">\1</b>', text)
    s_ = 74 if hook else 62
    k = f'<div style="display:inline-block;font:700 28px BV;letter-spacing:.06em;text-transform:uppercase;color:#0a1c44;background:#f3d58c;border-radius:12px;padding:9px 18px;margin-bottom:16px">{kicker}</div><br>' if kicker else ''
    u = f'<div style="margin-top:18px"><span style="font:600 34px/1.7 BV;color:#fff;background:rgba(10,28,68,.86);border-radius:10px;padding:8px 16px;-webkit-box-decoration-break:clone;box-decoration-break:clone">{sub}</span></div>' if sub else ''
    h_ = f"""<div class="abs" style="left:90px;right:90px;bottom:400px">{k}<div style="font:800 {s_}px/1.5 BV;color:#fff"><span style="background:rgba(10,28,68,.88);border-radius:16px;padding:7px 20px;-webkit-box-decoration-break:clone;box-decoration-break:clone">{t}</span></div>{u}</div>"""
    return render('', h_, 1080, 1920, cls='', trong=True, out=path)
