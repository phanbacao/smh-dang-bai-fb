# Thư viện thiết kế ảnh cho page phụ Trầm Hương Mỗi Ngày - SMH
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import glob, os, urllib.request
S = os.environ.get('PP_DIR', os.path.expanduser('~/page-phu-lam/'))  # thư mục làm việc (full/, tn/, kho/)
CC = os.path.dirname(os.path.abspath(__file__)) + '/'                  # thư mục cong-cu (index.tsv, logo)
os.makedirs(S + 'full', exist_ok=True)
FD = S + 'tn/anh-cuon-tai-nguyen/font/'
OUT = S + 'kho/'
os.makedirs(OUT, exist_ok=True)
GOLD = (196, 150, 56); CREAM = (245, 236, 220); DARK = (30, 22, 16); BROWN = (74, 52, 34); MUTED = (120, 100, 80)
LOGO = Image.open(S + 'tn/anh-cuon-tai-nguyen/logo-son-moc-huong-vuong.png').convert('RGBA')
WM = Image.open(CC + 'wm_ngang.png').convert('RGBA')          # logo chìm ngang (Cao gửi 07/11)
LOGO_V = Image.open(CC + 'logo_vuong_vang.png').convert('RGBA')  # logo vuông vàng (góc)
import re
def has_wm(n):
    f = os.path.basename(glob.glob(S + f'full/{n:03d}_*.jpg')[0]); return False
NO_WM = set()  # không dùng
def photo_name(n):
    import csv
    for r in csv.reader(open(CC + 'index.tsv'), delimiter='\t'):
        if int(r[0]) == n: return r[2]
    return ''
def da_co_logo(n):
    nm = photo_name(n)
    return bool(re.match(r'^(0 \(|00 \(|0{3,}|IMG_(77|78|82|83|85|86|6[0-9])|z[abde]|IMG_(4[6-9]|5[01])\d{2})', nm))

def watermark(canvas, box, k=2, alpha=0.35):
    """Chèn k logo chìm (1–2) trong vùng box (ảnh sản phẩm), lệch chéo, không che hết sản phẩm."""
    x0, y0, x1, y1 = box; w = x1 - x0; h = y1 - y0
    wm = WM.copy(); tw = max(160, int(w * 0.30)); wm.thumbnail((tw, tw))
    a = wm.split()[3].point(lambda v: int(min(255, v * 2) * alpha)); wm.putalpha(a)
    spots = [(0.30, 0.22), (0.68, 0.64)][:k]
    for fx, fy in spots:
        px = int(x0 + w * fx - wm.width / 2); py = int(y0 + h * fy - wm.height / 2)
        px = max(x0 + 8, min(px, x1 - wm.width - 8)); py = max(y0 + 8, min(py, y1 - wm.height - 8))
        canvas.alpha_composite(wm, (px, py))

def logo_goc(canvas, corner='br', h=96, pad=36):
    lg = LOGO_V.copy(); lg.thumbnail((h, h)); W, H = canvas.size
    pos = {'br': (W - pad - lg.width, H - pad - lg.height), 'bl': (pad, H - pad - lg.height), 'tl': (pad, pad), 'tr': (W - pad - lg.width, pad)}[corner]
    canvas.alpha_composite(lg, pos)

def F(name, size): return ImageFont.truetype(FD + name, int(size))
from PIL import ImageCms
import io as _io
_SRGB = ImageCms.createProfile('sRGB')
def ve_srgb(im):
    """Chuyển ảnh có hồ sơ màu (ProPhoto, Display P3, Adobe RGB…) về sRGB để không bị tối/xỉn."""
    icc = im.info.get('icc_profile')
    if im.mode not in ('RGB', 'RGBA'): im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
    if icc:
        try:
            src = ImageCms.ImageCmsProfile(_io.BytesIO(icc))
            if 'sRGB' not in (src.profile.profile_description or ''):
                a = im.split()[3] if im.mode == 'RGBA' else None
                im = ImageCms.profileToProfile(im.convert('RGB'), src, _SRGB, renderingIntent=0, outputMode='RGB')
                if a is not None: im.putalpha(a)
        except Exception:
            pass
    return im.convert('RGB')
def _id(n):
    import csv
    for r in csv.reader(open(CC + 'index.tsv'), delimiter='\t'):
        if int(r[0]) == n: return r[1]
def photo(n):
    """Ảnh số n trong index.tsv (kho Drive của Cao). Chưa có thì tải bản 2000px từ Google (lh3), rồi chuyển về sRGB."""
    g = glob.glob(S + f'full/{n:03d}_*.jpg')
    if not g:
        i = _id(n); f = S + f'full/{n:03d}_{i}.jpg'
        urllib.request.urlretrieve(f'https://lh3.googleusercontent.com/d/{i}=w2000', f); g = [f]
    return ve_srgb(Image.open(g[0]))

def fit(im, w, h, fy=0.5, fx=0.5):
    r = max(w / im.width, h / im.height); im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1), Image.LANCZOS)
    x = int((im.width - w) * fx); y = int((im.height - h) * fy); return im.crop((x, y, x + w, y + h))

def grad(w, h, c1, c2):
    im = Image.new('RGB', (w, h)); d = ImageDraw.Draw(im)
    for i in range(h):
        t = i / max(1, h - 1); d.line([(0, i), (w, i)], fill=tuple(int(c1[k] + (c2[k] - c1[k]) * t) for k in range(3)))
    return im

def wrap(d, text, font, maxw):
    lines = []
    for para in text.split('\n'):
        words = para.split(' '); cur = ''
        for w in words:
            t = (cur + ' ' + w).strip()
            if d.textlength(t, font=font) <= maxw: cur = t
            else:
                if cur: lines.append(cur)
                cur = w
        lines.append(cur)
    return lines

def text_block(d, xy, text, font, fill, maxw, lh=1.25, align='left', anchor_center_x=None):
    x, y = xy; lines = wrap(d, text, font, maxw); h = font.size * lh
    for ln in lines:
        if align == 'center':
            w = d.textlength(ln, font=font); d.text(((anchor_center_x or x) - w / 2, y), ln, font=font, fill=fill)
        else: d.text((x, y), ln, font=font, fill=fill)
        y += h
    return y

def rounded(im, r):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    out = im.convert('RGBA'); out.putalpha(m); return out

def shadow(canvas, box, r=28, blur=30, alpha=110, off=(0, 14)):
    x0, y0, x1, y1 = box; sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((x0 + off[0], y0 + off[1], x1 + off[0], y1 + off[1]), r, fill=(0, 0, 0, alpha))
    sh = sh.filter(ImageFilter.GaussianBlur(blur)); canvas.alpha_composite(sh)

def logo_small(canvas, xy, h=70, tone=None):
    lg = LOGO.copy(); lg.thumbnail((h * 3, h))
    if tone:
        a = lg.split()[3]; lg = Image.new('RGBA', lg.size, tone + (255,)); lg.putalpha(a)
    canvas.alpha_composite(lg, (int(xy[0]), int(xy[1])))

def tag(canvas, xy, text, font, fg=CREAM, bg=GOLD, pad=(26, 12), r=40):
    d = ImageDraw.Draw(canvas); w = d.textlength(text, font=font); h = font.size
    x, y = xy; box = (x, y, x + w + 2 * pad[0], y + h + 2 * pad[1])
    d.rounded_rectangle(box, r, fill=bg)
    d.text((x + pad[0], y + pad[1] - h * 0.08), text, font=font, fill=fg)
    return box

def card_photo(canvas, im, box, r=36, wm=True, k=1):
    x0, y0, x1, y1 = box; w, h = x1 - x0, y1 - y0
    shadow(canvas, box)
    ph = rounded(fit(im, w, h), r); canvas.alpha_composite(ph, (x0, y0))
    if wm: watermark(canvas, box, k=k)

def save(canvas, name, q=92):
    canvas.convert('RGB').save(OUT + name, quality=q, optimize=True, icc_profile=ImageCms.ImageCmsProfile(_SRGB).tobytes()); return OUT + name
