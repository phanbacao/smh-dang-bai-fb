// ==UserScript==
// @name         Smh in don shopee
// @namespace    sonmochuong.print
// @version      8.7.1
// @description  Bảng in đơn Shopee (in hoả tốc riêng, ghi theo tên phân loại) + banner cảnh báo giữa-trên màn hình + tô màu dòng đơn và hiện nội dung Note trên trang Giao Hàng Loạt + đèn trạng thái + số đơn trên tên tab + nút Báo lỗi
// @match        https://banhang.shopee.vn/*
// @run-at       document-idle
// @noframes
// @updateURL    https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/in-don-shopee.user.js
// @downloadURL  https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/in-don-shopee.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Chặn chạy nhiều bản cùng lúc: nếu lỡ cài 2 bản trong Tampermonkey,
  // bản thứ hai sẽ tự tắt thay vì nhân đôi mọi bộ đếm giờ và khung ẩn.
  // Từ bản 7.0 mỗi bản có TÊN RIÊNG ("Smh in don shopee 7.0", "... 7.1"...), nên
  // Tampermonkey coi mỗi bản là 1 script khác nhau: cài bản mới mà quên tắt bản cũ
  // thì 2 bản cùng chạy. Khi đó bản khởi động sau sẽ tự tắt VÀ hiện dòng đỏ nhắc tắt
  // bản cũ, để không ai tưởng mình đang dùng bản mới trong khi bản cũ đang chạy.
  if (window.__SMH_IN_DON) {
    const banKia = window.__SMH_IN_DON === true ? 'bản cũ' : 'bản ' + window.__SMH_IN_DON;
    console.log('%c[Smh in don shopee 8.6]', 'color:#ee4d2d;font-weight:bold',
      'Đã có ' + banKia + ' đang chạy — bản 8.6 tự tắt.');
    const nhac = () => {
      if (!document.body || document.getElementById('smh-trung-ban')) return;
      const d = document.createElement('div');
      d.id = 'smh-trung-ban';
      d.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;background:#c62828;' +
        'color:#fff;font:800 13px system-ui,sans-serif;padding:8px 12px;border-radius:8px;' +
        'box-shadow:0 4px 14px rgba(0,0,0,.3);max-width:420px;line-height:1.4';
      d.textContent = '⚠ Đang có 2 bản In Đơn cùng cài: ' + banKia + ' đang chạy nên bản 8.6 KHÔNG chạy. ' +
        'Vào Tampermonkey tắt/xoá bản cũ rồi tải lại trang.';
      document.body.appendChild(d);
    };
    if (document.body) nhac(); else document.addEventListener('DOMContentLoaded', nhac);
    return;
  }
  window.__SMH_IN_DON = '8.7.1';


  /* ===================================================================
     PHẦN CÀI ĐẶT
     =================================================================== */

  // Bản 7.1: Cao chọn KHÔNG hỏi xác nhận trước khi gửi yêu cầu lấy hàng — bấm nút
  // ĐVVC là chạy luôn. Muốn bật lại hộp hỏi thì đổi false thành true.
  const HOI_TRUOC_KHI_GUI = false;
  const NHAP_NHAY_KHI_CO_DON = true;
  const CHU_KY_DOC_SO     = 45000;  // tự đọc lại số đơn + Note mỗi 45 giây

  // Bản 8.0: API của Shopee lỗi LIÊN TIẾP bao nhiêu lần thì mới chuyển sang "cách cũ"
  // (mở trang Giao Hàng Loạt trong khung ẩn để đếm). Lỗi 1–2 lần chỉ thử lại nhanh.
  const SO_LAN_LOI_TRUOC_CACH_CU = 3;

  // Tối đa bao nhiêu dòng sản phẩm hiện trên mỗi nút. 0 = hiện hết, không giới hạn
  const TOI_DA_DONG_SP    = 0;

  // Mã hàng có đơn giá từ mức này trở lên sẽ được đóng khung cho dễ nhận ra
  const NGUONG_HANG_DAT   = 1000000;

  // Banner cảnh báo giữa-trên màn hình (bản 7.0):
  const NGUONG_SO_LUONG     = 10;       // 1 mã sản phẩm trong đơn có số lượng từ mức này
  const NGUONG_GIA_TRI_DON  = 3000000;  // tổng tiền hàng của đơn (giá bán × SL, bỏ quà) từ mức này

  // HẠN XỬ LÝ ĐƠN (giờ trong ngày; 18.5 nghĩa là 18h30)
  // Đơn phát sinh TRƯỚC 18h  -> hạn ngay trong ngày.
  // Đơn phát sinh TỪ 18h trở đi -> hạn sáng ngày làm việc kế tiếp.
  // Chủ nhật không tính: hạn rơi vào chủ nhật thì dời sang thứ Hai.
  const HAN_XL_TRONG_NGAY = 18.5;  // chưa xử lý — mốc trong ngày
  const HAN_XL_HOM_SAU    = 10;    // chưa xử lý — mốc sáng hôm sau
  const HAN_BG_TRONG_NGAY = 19;    // chưa bàn giao — mốc trong ngày
  const HAN_BG_HOM_SAU    = 11.5;  // chưa bàn giao — mốc sáng hôm sau (11h30)

  // Mã hàng từ mức này trở lên sẽ nhấp nháy: hàng giá cao Shop hay không
  // có sẵn, nhân sự phải kiểm tồn trước khi nhận soạn.
  const NGUONG_HANG_HIEM  = 3000000;

  const MAU_QUEN = [
    { ten: 'SPX Express',     mau: '#ee4d2d' },
    { ten: 'Giao Hàng Nhanh', mau: '#2f6fb5' },
  ];
  const MAU_MAC_DINH = '#00897b';

  /* =================================================================== */

  const PHIEN_BAN   = '8.7.1';
  const KEY_SHOP    = 'SMH_SHOP_V1';
  const TRANG_GHL   = '/portal/sale/mass/ship';
  const KEY_JOB     = 'SMH_JOB_V21';
  const KEY_PRINT   = 'SMH_PRINT_V21';
  const KEY_COUNTS  = 'SMH_COUNTS_V80';   // bản 8.0 đổi cấu trúc dữ liệu nên dùng khoá mới
  const KEY_LOG     = 'SMH_LOG_V80';      // nhật ký cho nút 📋 Báo lỗi
  const KEY_TENSHOP = 'SMH_TENSHOP_V80';
  // Bộ nhớ của các bản cũ, bản 8.0 không dùng nữa -> dọn cho nhẹ trình duyệt
  const KEY_BO_CU   = ['SMH_COUNTS_V21', 'SMH_SP_V23', 'SMH_GIA_V25', 'SMH_QH_V34'];
  const TOI_DA_LOG  = 300;

  let dangDoc = false, dangChay = false, lanDocCuoi = 0;
  let mocDoc = 0, mocChay = 0;   // lúc bắt đầu, để cứu khi treo
  let henVeLai = null;           // bộ đếm giờ vẽ lại, chỉ giữ đúng một cái
  let tinDoiSo = null;
  // { ds:[{k, ten, ht, n, qh, tn, sl, gt, sp:[{v,n,gia}]}], tn:[...], bg:{n,qh,ds}, thieuCT, cheDo:'api'|'cu', _ts }
  let soHienTai = null;
  let dsChuaBG = { n: 0, qh: 0, ds: [] };   // đơn đã xử lý, đang chờ bàn giao
  let khoTN = [];          // [{id, ma, tn, href, loi, ht, spChinh, slNhieu, gt}] — đơn cần chú ý
  let khoCT = {};          // { order_id: chi tiết đơn đã đọc thành công } — nhớ trong phiên
  let trangThaiTN = null;  // { muc:'canh'|'hong', chu } — cảnh báo tự kiểm tra của phần Note
  let soLanThuNhanh = 0;
  let canDocLai = false;   // có yêu cầu đọc mới trong lúc đang đọc -> đọc xong đọc tiếp
  let idsLanCuoi = new Set();
  const trenTrang = new Map();   // đơn trang Giao Hàng Loạt đang hiện ở mục chưa xử lý -> lúc thấy
  let soLanAPIHong = 0;    // API lỗi liên tiếp mấy lần
  let loiCuoi = null;      // { chu, matDN, ts } — lỗi gần nhất, cho đèn trạng thái + báo lỗi
  let tenShop = '';        // chữ viết tắt tên Shop: SMH / THHX

  const hai = (n) => (n < 10 ? '0' : '') + n;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Nhật ký (cho nút 📋 Báo lỗi) ----------
     Mọi dòng log vừa in ra console vừa ghi vào 1 "sổ" trong trình duyệt, giữ 300
     dòng gần nhất. Bấm 📋 là copy cả sổ + tình trạng hiện tại để dán gửi Claude.
     Không ghi Note của khách, không ghi khoá đăng nhập. */
  let logCho = [], henLuuLog = null;
  function chuLog(a) {
    return a.map((x) => {
      if (x instanceof Error) return x.message;
      if (x && typeof x === 'object') { try { return JSON.stringify(x); } catch (e) { return String(x); } }
      return String(x);
    }).join(' ').replace(/SPC_CDS=[^&\s"]+/g, 'SPC_CDS=…').slice(0, 300);
  }
  function luuLog() {
    henLuuLog = null;
    if (!logCho.length) return;
    try {
      let cu = JSON.parse(localStorage.getItem(KEY_LOG) || '[]');
      if (!Array.isArray(cu)) cu = [];
      localStorage.setItem(KEY_LOG, JSON.stringify(cu.concat(logCho).slice(-TOI_DA_LOG)));
    } catch (e) {}
    logCho = [];
  }
  const log = (...a) => {
    console.log('%c[In Đơn Shopee v' + PHIEN_BAN + ']', 'color:#ee4d2d;font-weight:bold', ...a);
    try {
      const d = new Date();
      logCho.push(hai(d.getDate()) + '/' + hai(d.getMonth() + 1) + ' ' + hai(d.getHours()) + ':' +
                  hai(d.getMinutes()) + ':' + hai(d.getSeconds()) + ' ' + chuLog(a));
      if (!henLuuLog) henLuuLog = setTimeout(luuLog, 2000);
    } catch (e) {}
  };

  /* ---------- Công cụ chung ---------- */

  async function doiCho(fn, { timeout = 25000, moi = 300, ten = '' } = {}) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      try { const v = fn(); if (v) return v; } catch (e) {}
      await sleep(moi);
    }
    throw new Error('Không thấy: ' + ten);
  }

  function nhinThay(e) {
    if (!e) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function khoiLoc(doc, nhan) {
    return Array.from(doc.querySelectorAll('.mass-ship-filter-item')).find((d) => {
      const l = d.querySelector('.label');
      return l && l.textContent.trim() === nhan;
    });
  }

  // Biểu tượng máy in vẽ bằng SVG. Không dùng emoji vì Windows hiển thị
  // ký tự máy in thành hình xám đơn sắc, trông như lỗi font.
  const ICON_IN = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
    'style="vertical-align:-4px;flex:none"><path d="M7 9V3h10v6"/>' +
    '<path d="M7 19H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/>' +
    '<rect x="7" y="15" width="10" height="6" rx="1"/></svg>';

  const dong1 = (el) => (el.textContent || '').trim().split('\n')[0].trim();

  // Mã đơn Shopee luôn 14 ký tự: 6 số + 8 ký tự hoa/số.
  // Dùng độ dài cố định vì trong trang mã dính liền chữ khác
  // ("...F9B3minhtuvina", "...F9B3Nhang cây trầm") nên dò ranh giới từ sẽ sai.
  function layMaDon(chu) {
    const m = String(chu || '').match(/\d{6}[A-Z0-9]{8}/);
    return m ? m[0] : '';
  }

  function docSo(el) {
    const m = (el.textContent || '').match(/\((\d+)\)/);
    return m ? parseInt(m[1], 10) : null;
  }

  function timNut(chu) {
    return Array.from(document.querySelectorAll('button')).find(
      (b) => (b.textContent || '').includes(chu) && nhinThay(b)
    );
  }

  const mauCua = (ten) => (MAU_QUEN.find((x) => x.ten === ten) || {}).mau || MAU_MAC_DINH;
  const thuTuCua = (ten) => {
    const i = MAU_QUEN.findIndex((x) => x.ten === ten);
    return i === -1 ? 99 : i;
  };

  async function chonO(doc, nhanHang, dauChu) {
    const khoi = await doiCho(() => khoiLoc(doc, nhanHang), { ten: 'bộ lọc "' + nhanHang + '"' });
    const o = await doiCho(
      () => Array.from(khoi.querySelectorAll('label.eds-radio-button')).find((l) => dong1(l).startsWith(dauChu)),
      { ten: 'ô "' + dauChu + '"' }
    );
    if (!o.classList.contains('checked')) {
      o.click();
      await sleep(400);
      if (!o.classList.contains('checked')) {
        const inp = o.querySelector('input');
        if (inp) inp.click();
      }
      await sleep(900);
    }
    return o;
  }

  function daChon(doc, nhanHang, dauChu) {
    const k = khoiLoc(doc, nhanHang);
    if (!k) return false;
    const o = Array.from(k.querySelectorAll('label.eds-radio-button')).find((l) => dong1(l).startsWith(dauChu));
    return !!(o && o.classList.contains('checked'));
  }

  /* ---------- Đọc danh sách ĐVVC + số đơn ---------- */

  function docBangDVVC(doc) {
    const k = khoiLoc(doc, 'Đơn vị vận chuyển');
    if (!k) return null;
    const oo = Array.from(k.querySelectorAll('label.eds-radio-button'));
    if (!oo.length) return null;
    const ds = [], daCo = new Set();
    oo.forEach((l) => {
      const m = dong1(l).match(/^(.*?)\s*\((\d+)\)\s*$/);
      if (!m) return;
      const ten = m[1].trim();
      if (!ten || daCo.has(ten) || laTenDieuPhoi(ten)) return;   // bản 8.3: bỏ "Đang Điều Phối ĐVVC"
      daCo.add(ten);
      ds.push({ ten: ten, n: parseInt(m[2], 10) });
    });
    return ds.length ? ds : null;
  }

  // Quá hạn = phát sinh ngày N, đã qua GIỜ_CẢNH_BÁO của ngày N+1
  const laChuNhat = (d) => d.getDay() === 0;

  // Dời tới ngày làm việc gần nhất — chủ nhật Shop không làm nên bỏ qua
  function ngayLamViec(y, thang, ngay) {
    const d = new Date(y, thang, ngay);
    while (laChuNhat(d)) d.setDate(d.getDate() + 1);
    return d;
  }

  function datGio(d, gio) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(),
                    Math.floor(gio), Math.round((gio % 1) * 60), 0);
  }

  // Hạn của một đơn, tính từ giờ đơn phát sinh:
  //   Trước 18h ngày n -> phải bàn giao TRONG NGÀY n  (18h30 / 20h)
  //   Từ 18h đến 23h59 -> bàn giao TRƯỚC 12H TRƯA ngày n+1 (10h / 11h30)
  //   Chủ nhật không tính, dời sang thứ Hai.
  function tinhHan(luc, gioTrongNgay, gioHomSau) {
    if (!luc) return null;
    // Đơn phát sinh TRƯỚC 18h là đơn của chính ngày hôm đó -> hạn trong ngày,
    // kể cả đơn đặt lúc rạng sáng.
    if (luc.getHours() < 18 && !laChuNhat(luc)) return datGio(luc, gioTrongNgay);
    // Từ 18h, hoặc đơn phát sinh chủ nhật: hạn trưa ngày làm việc kế tiếp
    return datGio(ngayLamViec(luc.getFullYear(), luc.getMonth(), luc.getDate() + 1), gioHomSau);
  }

  function quaHanXL(luc) {
    const h = tinhHan(luc, HAN_XL_TRONG_NGAY, HAN_XL_HOM_SAU);
    return !!h && Date.now() > h.getTime();
  }

  function quaHanBG(luc) {
    const h = tinhHan(luc, HAN_BG_TRONG_NGAY, HAN_BG_HOM_SAU);
    return !!h && Date.now() > h.getTime();
  }

  const gioNgan = (d) => !d ? '' :
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') +
    ' ' + String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');

  /* ---------- Lưu số đơn ---------- */

  function luuSo(d) {
    d._ts = Date.now();
    soHienTai = d;
    try { localStorage.setItem(KEY_COUNTS, JSON.stringify(d)); } catch (e) {}
  }

  const tenNgan = (m) => (m.ht ? '⚡' : '') + String(m.ten || '?').replace(' Express', '').replace('Giao Hàng ', '');

  function ghiNhanSo(kq) {
    const cu = soHienTai;
    const doi = [];
    if (cu && Array.isArray(cu.ds)) {
      const khoa = new Set(kq.ds.map((m) => m.k).concat(cu.ds.map((m) => m.k)));
      khoa.forEach((k) => {
        const m = kq.ds.find((x) => x.k === k), c = cu.ds.find((x) => x.k === k);
        const truoc = c ? c.n : 0, sau = m ? m.n : 0;
        if (truoc !== sau) doi.push(tenNgan(m || c) + ' ' + truoc + '→' + sau);
      });
    }
    tinDoiSo = {
      txt: doi.length ? 'Vừa cập nhật: ' + doi.join(', ') : '',
      doi: doi.length > 0,
      ts: Date.now()
    };
    if (doi.length) log(tinDoiSo.txt);
    luuSo(kq);
  }

  const tomTat = (ds) => (ds || []).length
    ? ds.map((m) => tenNgan(m) + ' ' + m.n).join(', ') : 'không có đơn';

  async function docOnDinh(d, layDuLieu) {
    let ky = null, tu = 0;
    return await doiCho(
      () => {
        const data = layDuLieu();
        if (!data) return null;
        const sig = JSON.stringify(data);
        const now = Date.now();
        if (sig !== ky) { ky = sig; tu = now; return null; }
        if (now - tu < 1000) return null;
        return data;
      },
      { timeout: 40000, moi: 250, ten: 'số đơn trong khung ẩn' }
    );
  }

  // CÁCH CŨ (dự phòng) — bản 8.0 chỉ dùng khi API của Shopee lỗi liên tiếp
  // SO_LAN_LOI_TRUOC_CACH_CU lần. Mở trang Giao Hàng Loạt trong khung ẩn rồi đọc
  // số đơn từng ĐVVC: lượt 1 ô "Đơn thường", lượt 2 ô "Đơn Hoả Tốc" (in riêng).
  // Cách này KHÔNG có tên phân loại và Note, bảng sẽ ghi rõ "chế độ dự phòng".
  async function docBangKhungAn() {
    let f = null;
    try {
      f = document.createElement('iframe');
      f.style.cssText = 'position:fixed;left:-10000px;top:0;width:1400px;height:1200px;opacity:0;border:0';
      f.dataset.smh = '1';
      f.src = TRANG_GHL;
      document.body.appendChild(f);
      await new Promise((r) => { f.onload = r; setTimeout(r, 25000); });

      const d = f.contentDocument;
      if (!d) throw new Error('không mở được khung ẩn');

      await chonO(d, 'Loại Đơn hàng', 'Đơn thường');
      await chonO(d, 'Hạn giao hàng', 'Tất cả');
      const thuong = await docOnDinh(d, () =>
        (daChon(d, 'Hạn giao hàng', 'Tất cả') && daChon(d, 'Loại Đơn hàng', 'Đơn thường')) ? docBangDVVC(d) : null
      );

      let ht = [];
      try {
        await chonO(d, 'Loại Đơn hàng', 'Đơn Hoả Tốc');
        ht = await docOnDinh(d, () => daChon(d, 'Loại Đơn hàng', 'Đơn Hoả Tốc') ? docBangDVVC(d) : null);
      } catch (e) {
        log('Cách cũ: không đọc được phần hoả tốc:', e.message);
      }

      const ds = [];
      const them = (m, laHT) => {
        if (m.n > 0) ds.push({ k: (laHT ? '⚡' : '') + m.ten, ten: m.ten, ht: laHT, n: m.n,
                               qh: 0, tn: 0, sl: 0, gt: 0, sp: [] });
      };
      thuong.forEach((m) => them(m, false));
      ht.forEach((m) => them(m, true));
      log('Số đơn (cách cũ): ' + tomTat(ds));
      return ds;
    } finally {
      if (f) { try { f.remove(); } catch (e) {} }
    }
  }

  /* ---------- Đọc bằng API của Shopee (nhanh gấp hàng chục lần) ---------- */

  const layCDS = () => (document.cookie.match(/(?:^|;\s*)SPC_CDS=([^;]+)/) || [])[1] || '';

  async function goiAPI(duong, body) {
    const cds = layCDS();
    if (!cds) { const e = new Error('chưa đăng nhập (thiếu khoá phiên)'); e.matDN = true; throw e; }
    // Bắt buộc có hạn giờ: một lệnh treo mà không có hạn thì cả script chết theo
    const ac = new AbortController();
    const hen = setTimeout(() => ac.abort(), 15000);
    try {
      // "_src=smh": đánh dấu lệnh của script, để phân biệt với lệnh của chính trang
      // Shopee (đã thử thật: sàn chấp nhận tham số này).
      const url = duong + (duong.indexOf('?') >= 0 ? '&' : '?') + 'SPC_CDS=' + cds + '&SPC_CDS_VER=2&_src=smh';
      const r = await fetch(url, body ? {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: ac.signal
      } : { signal: ac.signal });
      if (r.redirected && /accounts\.shopee/.test(r.url)) {
        const e = new Error('mất đăng nhập'); e.matDN = true; throw e;
      }
      const j = await r.json();
      if (j.code) {
        const e = new Error('API báo lỗi ' + j.code + ' ' + (j.message || ''));
        e.maSan = j.code;
        throw e;
      }
      return j;
    } finally {
      clearTimeout(hen);
    }
  }


  // Đổi Shop (SMH <-> THHX) trong cùng trình duyệt thì xoá bộ nhớ của Shop cũ,
  // tránh hiện nhầm số đơn / Note của Shop này sang Shop kia.
  function kiemTraDoiShop(shopMoi) {
    if (!shopMoi) return;
    shopMoi = String(shopMoi);
    let shopCu = null;
    try { shopCu = localStorage.getItem(KEY_SHOP); } catch (e) {}
    if (shopCu === shopMoi) return;
    try { localStorage.setItem(KEY_SHOP, shopMoi); } catch (e) {}
    if (!shopCu) return;
    log('Đổi Shop (' + shopCu + ' → ' + shopMoi + ') — xoá bộ nhớ của Shop cũ');
    soHienTai = null;
    dsChuaBG = { n: 0, qh: 0, ds: [] };
    khoTN = []; khoCT = {};
    trangThaiTN = null;
    tenShop = '';
    try { localStorage.removeItem(KEY_COUNTS); } catch (e) {}
  }

  // Chữ viết tắt tên Shop cho góc bảng: "Sơn Mộc Hương" -> SMH, "Trầm Hương HÀ XÁ" -> THHX
  function vietTat(ten) {
    return String(ten || '').replace(/[đĐ]/g, 'D').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase()).join('').slice(0, 6);
  }

  async function layTenShop() {
    try {
      const j = await goiAPI('/api/selleraccount/shop_info/');
      const d = j.data || {};
      if (d.shop_id) kiemTraDoiShop(d.shop_id);
      const vt = vietTat(d.name || d.username || '');
      if (vt) {
        tenShop = vt;
        try { localStorage.setItem(KEY_TENSHOP, JSON.stringify({ id: String(d.shop_id || ''), vt: vt })); } catch (e) {}
      }
    } catch (e) {
      log('Không lấy được tên Shop: ' + e.message);
    }
  }

  // Tìm đơn theo trạng thái trong mục "Chờ lấy hàng":
  //   1 = Chưa xử lý      2 = Đã xử lý (đã có mã vận đơn, đang chờ bàn giao)
  // Không đoán sàn xếp đơn vào nhóm nào: hỏi nhiều bộ lọc rồi gộp (trùng thì bỏ).
  //  - Loại đơn 1 kèm ưu tiên trống / 1 / 2 (đơn hoả tốc nằm ở nhóm ưu tiên riêng).
  //  - Loại đơn 2 và 3: từng gặp ở script khác; Shop khác nhau có thể dùng loại khác.
  //  - moRong = true (chỉ khi số đếm không khớp với sàn): thêm mọi tổ hợp còn lại.
  // Mỗi bộ lọc đi hết các trang cho tới khi gom đủ "total" (đã thử thật: trang 1
  // và trang 2 của Shopee trả trùng nhau, nên không dừng chỉ vì 1 trang trống).
  const LOC_THUONG = [
    [1, {}], [1, { shipping_priority: 1 }], [1, { shipping_priority: 2 }], [2, {}], [3, {}]
  ];
  const LOC_MO_RONG = [
    [0, {}], [0, { shipping_priority: 1 }], [0, { shipping_priority: 2 }],
    [2, { shipping_priority: 1 }], [2, { shipping_priority: 2 }],
    [3, { shipping_priority: 1 }], [3, { shipping_priority: 2 }]
  ];
  // Bộ lọc phụ sàn từ chối (trả mã lỗi) -> tạm bỏ qua 30 phút rồi thử lại.
  // Bỏ qua vẫn an toàn vì phía sau còn bước đối chiếu với số đếm của sàn.
  const locSanTuChoi = new Map();

  async function hoiBoLoc(et, loc) {
    const gap = new Map();
    let total = null, rong = 0;
    for (let trang = 1; trang <= 40; trang++) {
      const body = {
        order_list_tab: 300,
        pagination: { from_page_number: 1, page_number: trang, page_size: 200 },
        filter: loc, sort: { sort_type: 1 }, current_time: Math.floor(Date.now() / 1000)
      };
      if (et) body.entity_type = et;
      const j = await goiAPI('/api/v3/order/search_order_list_index', body);
      const d = j.data || {};
      const ds = d.index_list || [];
      if (d.pagination && typeof d.pagination.total === 'number') total = d.pagination.total;
      let moi = 0;
      ds.forEach((x) => {
        if (!x.order_id || gap.has(String(x.order_id))) return;
        if (x.shop_id) kiemTraDoiShop(x.shop_id);
        gap.set(String(x.order_id), { order_id: x.order_id, shop_id: x.shop_id, region_id: x.region_id,
                                      ht: et === 3 });
        moi++;
      });
      if (!ds.length || total === null || gap.size >= total) break;
      rong = moi ? 0 : rong + 1;
      if (rong >= 3) break;
    }
    return { ds: [...gap.values()], du: total === null || gap.size >= total };
  }

  async function timDon(trangThai, moRong) {
    const boLoc = moRong ? LOC_THUONG.concat(LOC_MO_RONG) : LOC_THUONG;
    const daCo = new Set();
    const idx = [];
    idx.hong = 0; idx.hongChinh = false; idx.thieuTrang = false;
    for (let i = 0; i < boLoc.length; i++) {
      const [et, them] = boLoc[i];
      const khoa = et + JSON.stringify(them);
      if (i > 0 && (locSanTuChoi.get(khoa) || 0) > Date.now()) continue;
      try {
        const kq = await hoiBoLoc(et, Object.assign({ order_to_ship_status: trangThai }, them));
        if (!kq.du) idx.thieuTrang = true;
        kq.ds.forEach((x) => {
          if (daCo.has(String(x.order_id))) {
            // Đơn đã có từ bộ lọc khác: nếu nhóm này là hoả tốc thì đánh dấu thêm
            if (x.ht) { const c = idx.find((y) => String(y.order_id) === String(x.order_id)); if (c) c.ht = true; }
            return;
          }
          daCo.add(String(x.order_id));
          idx.push(x);
        });
      } catch (e) {
        if (i > 0 && e.maSan && !e.matDN) {
          locSanTuChoi.set(khoa, Date.now() + 30 * 60000);
          log('Sàn không nhận bộ lọc ' + khoa + ' (' + e.message + ') — tạm bỏ qua 30 phút');
          continue;
        }
        idx.hong++;
        if (i === 0) { idx.hongChinh = true; idx.loiChinh = e; }
        log('Bộ lọc ' + khoa + ' (trạng thái ' + trangThai + ') lỗi: ' + e.message);
      }
    }
    return idx;
  }

  // Số "Chờ Lấy Hàng" (chưa xử lý) trên trang chủ Kênh Người Bán — nguồn đếm độc
  // lập của chính Shopee, dùng để tự đối chiếu xem script có đọc sót đơn không.
  async function demCuaSan() {
    try {
      const j = await goiAPI('/api/miscellaneous/homepage/get_to_do_list_summary/');
      const n = (j.data || {}).shipment_to_process;
      return typeof n === 'number' ? n : null;
    } catch (e) {
      log('Không lấy được số đếm của sàn: ' + e.message);
      return null;
    }
  }

  async function docQuaAPI() {
    let [chuaXL, daXL, dem] = await Promise.all([timDon(1), timDon(2), demCuaSan()]);

    // Bộ lọc chính hỏng -> ném lỗi để chuyển sang cách cũ (cách cũ giữ nguyên Note cũ)
    if (chuaXL.hongChinh) throw (chuaXL.loiChinh || new Error('không đọc được đơn chưa xử lý'));
    if (daXL.hongChinh) throw (daXL.loiChinh || new Error('không đọc được đơn đã xử lý'));

    // TỰ KIỂM TRA 1: số đơn chưa xử lý đọc được phải >= số sàn báo trên trang chủ.
    // Thiếu -> hỏi mọi bộ lọc mở rộng; vẫn thiếu -> đợi 4 giây hỏi lại (phòng đơn
    // đang được xử lý giữa chừng); vẫn thiếu -> báo cam trên banner Note.
    let thieu = null;
    if (dem !== null && chuaXL.length < dem) {
      log('Đọc được ' + chuaXL.length + ' đơn chưa xử lý nhưng sàn báo ' + dem + ' — hỏi mở rộng');
      chuaXL = await timDon(1, true);
      if (chuaXL.length < dem) {
        await sleep(4000);
        const [c2, d2] = await Promise.all([timDon(1, true), demCuaSan()]);
        chuaXL = c2;
        if (d2 !== null && chuaXL.length < d2) thieu = { san: d2, doc: chuaXL.length };
      }
    }
    const tronVen = !chuaXL.hong && !chuaXL.thieuTrang && !thieu;

    // TỰ KIỂM TRA 4: đơn CHÍNH TRANG Giao Hàng Loạt đang hiện ở mục chưa xử lý mà
    // bộ lọc của script không thấy -> vẫn kiểm Note cho đơn đó.
    //  - Trang thấy SAU lúc vòng đọc này bắt đầu: chắc chắn còn chưa xử lý -> giữ.
    //  - Trang thấy TRƯỚC, mà vòng đọc trọn vẹn không còn thấy -> đã xử lý -> bỏ.
    const thayDs = new Set(chuaXL.map((x) => String(x.order_id)));
    const ngoai = [];
    trenTrang.forEach((luc, id) => {
      if (thayDs.has(id)) return;
      if (tronVen && luc < mocDoc) { trenTrang.delete(id); return; }
      ngoai.push(id);
    });
    if (ngoai.length) log('Trang Shopee đang hiện ' + ngoai.length + ' đơn mà bộ lọc chưa thấy: ' + ngoai.join(', '));

    // Không có đơn nào là KẾT QUẢ HỢP LỆ, không phải lỗi — nhưng CHỈ khi mọi
    // bộ lọc đều trả lời trọn vẹn. Chưa trọn vẹn mà ra 0 đơn thì không tin.
    if (!chuaXL.length && !daXL.length && !ngoai.length) {
      if (!tronVen || daXL.hong) throw new Error('đọc ra 0 đơn nhưng có bộ lọc lỗi — không tin kết quả này');
      khoTN = [];
      trangThaiTN = null;
      return { ds: [], thieuCT: 0, chuaBG: { n: 0, qh: 0, ds: [] } };
    }

    // Ba lệnh độc lập nhau -> hỏi song song cho nhanh
    const dsNgoai = ngoai.map((id) => ({ order_id: id }));
    const [them, them2, them3] = await Promise.all([
      docThemDon(chuaXL), docThemDon(daXL), docThemDon(dsNgoai)
    ]);
    Object.keys(them3).forEach((k) => { them[k] = them3[k]; });

    // Bản 8.5: đơn hoả tốc nào đang "Tìm lại Tài xế" (lỗi thì giữ kết quả lần trước)
    try {
      await docTimLai(chuaXL.concat(dsNgoai).filter((x) => {
        const o = them[x.order_id];
        return o && laDonHoaToc(x, o) && !laDieuPhoi(o);
      }));
    } catch (e) { log('Đọc trạng thái "Tìm lại Tài xế" lỗi: ' + e.message + ' — giữ kết quả lần trước'); }

    // TỰ KIỂM TRA 2: đơn nào đọc chi tiết hỏng cả 3 lần vẫn hiện 1 dòng cảnh báo
    // trên banner để tự mở đơn xem Note — không bao giờ lặng lẽ bỏ qua.
    const tnMoi = [];
    let hongCT = 0, soDieuPhoi = 0;
    chuaXL.concat(dsNgoai).forEach((x) => {
      const o = them[x.order_id];
      if (!o) {
        hongCT++;
        tnMoi.push({ id: String(x.order_id), ma: '', tn: '', loi: true, ht: laDonHoaToc(x, null),
                     href: '/portal/sale/order/' + x.order_id });
        return;
      }
      if (laDieuPhoi(o)) { soDieuPhoi++; return; }
      if (daGui.has(String(x.order_id))) return;     // bản 8.6: đã bấm "Tìm lại Tài xế" -> coi như đã xử lý   // bản 8.3: Shopee đang điều phối -> bỏ qua
      const cb = xetCanhBao(o, laDonHoaToc(x, o));
      if (timLai.has(String(x.order_id))) cb.timLai = true;
      if (cb.ht || cb.tn || cb.slNhieu || cb.gt) {
        tnMoi.push(Object.assign({ id: String(x.order_id), ma: o.ma, href: o.href }, cb));
      }
    });

    // TỰ KIỂM TRA 3: lần đọc chưa trọn vẹn thì GIỮ các dòng Note đang hiện,
    // không xoá dòng nào (chỉ xoá khi chắc chắn đơn đã rời "chưa xử lý").
    // Chỉ giữ dòng của đơn lần này KHÔNG nhìn thấy; đơn nhìn thấy rồi thì dùng tin mới.
    if (!tronVen) {
      const thay = new Set(chuaXL.map((x) => String(x.order_id)).concat(ngoai));
      (khoTN || []).forEach((o) => { if (o.id && !thay.has(o.id)) tnMoi.push(o); });
    }
    // Đơn hoả tốc lên đầu (gấp nhất), còn lại giữ thứ tự của sàn
    tnMoi.sort((a, b) => (b.ht ? 1 : 0) - (a.ht ? 1 : 0));
    khoTN = tnMoi;
    if (soDieuPhoi) log(soDieuPhoi + ' đơn "Đang Điều Phối ĐVVC" — bỏ qua (không in, không báo Note, không tính quá hạn)');
    idsLanCuoi = new Set(chuaXL.map((x) => String(x.order_id)).concat(ngoai));

    trangThaiTN = thieu
      ? { muc: 'canh', chu: '⚠ Sàn báo ' + thieu.san + ' đơn chờ xử lý, script mới đọc được ' + thieu.doc + ' — kiểm tra tay trang Chờ lấy hàng' }
      : hongCT ? { muc: 'canh', chu: '⚠ ' + hongCT + ' đơn chưa đọc được chi tiết — sẽ thử lại' }
      : !tronVen ? { muc: 'canh', chu: '⚠ Lần đọc chưa trọn vẹn — đang giữ nguyên các dòng Note cũ' }
      : ngoai.length ? { muc: 'canh', chu: '⚠ Trang Shopee có ' + ngoai.length + ' đơn bộ lọc của script không thấy — đã tự kiểm Note các đơn này' }
      : null;
    // Chưa trọn vẹn thì 15 giây sau đọc lại cho nhanh — tối đa 2 lần liền,
    // sau đó về nhịp thường để không hỏi sàn dồn dập.
    if (trangThaiTN && soLanThuNhanh < 2) {
      soLanThuNhanh++;
      setTimeout(() => { if (!dangDoc && !dangChay) docSoChuan(); }, 15000);
    } else if (!trangThaiTN) {
      soLanThuNhanh = 0;
    }

    // Đơn đã có mã vận đơn nhưng shipper chưa tới lấy. Trước đây không ai canh
    // nhóm này — đơn nằm im tới hạn là sàn tự huỷ.
    // Bản 8.4: đơn "Đang Điều Phối ĐVVC" (Shopee đang treo) không tính vào "Chờ shipper lấy" / quá hạn bàn giao
    const daXLThat = daXL.filter((x) => !laDieuPhoi(them2[x.order_id]));
    const treDs = Object.keys(them2).map((k) => them2[k])
      .filter((o) => !laDieuPhoi(o))
      .filter((o) => quaHanBG(o.luc))
      .sort((a, b) => (a.luc ? a.luc.getTime() : 0) - (b.luc ? b.luc.getTime() : 0))
      .map((o) => ({ ma: o.ma, luc: o.luc ? o.luc.getTime() : 0, href: o.href }));

    // Bản 8.0: nút in dựng từ chính chi tiết từng đơn (cùng nguồn với banner)
    const nut = gomTheoNut(chuaXL.concat(dsNgoai), them);
    return {
      ds: nut.ds,
      thieuCT: nut.thieu,
      chuaBG: { n: daXLThat.length, qh: treDs.length, ds: treDs }
    };
  }

  // Lời nhắn của người mua, GIỜ PHÁT SINH đơn, ĐVVC và tên phân loại đều lấy từ
  // lệnh xem một đơn (get_one_order). GIỜ PHÁT SINH dùng để tính hạn KHÔNG PHẢI
  // "create_time" (= giờ khách bấm đặt) mà là "shipping_confirm_time"
  // (= "Thời gian xác nhận đặt đơn" trên trang Giao Hàng Loạt).
  // Đơn rất mới có thể chưa có shipping_confirm_time thì tạm lấy create_time.
  //
  // Bản 8.0: bảng in đơn cũng dựng từ CHÍNH dữ liệu này (một nguồn duy nhất với
  // banner) — ĐVVC = fulfillment_carrier_name (đã thử thật: trùng đúng chữ trên
  // nút lọc, ví dụ "SPX Express"), tên hàng = TÊN PHÂN LOẠI (item_model.name,
  // ví dụ "1 HỘP NỤ TRẦM MIX BX"), đơn giá = order_price (giá 1 món).
  //
  // Chống sót Note:
  //  - Sàn trả lỗi / trả rỗng (không có mã đơn) thì coi là THẤT BẠI, không bao giờ
  //    coi là "đơn không có Note". Mỗi đơn thử tối đa 3 lần.
  //  - Đơn đã đọc thành công (và đã có giờ xác nhận) thì nhớ lại trong phiên.
  async function doc1Don(id) {
    const j = await goiAPI('/api/v3/order/get_one_order?order_id=' + encodeURIComponent(id));
    const d = j.data || {};
    if (!d.order_sn) throw new Error('sàn trả dữ liệu rỗng');
    const hang = [];
    (d.order_items || []).forEach((it) => {
      const im = it.item_model || {}, pr = it.product || {};
      const sku = String(im.sku || '').trim();
      const ten = String(im.name || '').trim() || String(pr.name || '').trim().slice(0, 40) || sku;
      // Không có giá thì để "chưa rõ" (null) — tuyệt đối không coi là 0đ (0đ = quà tặng)
      const coGia = it.order_price !== undefined && it.order_price !== null && String(it.order_price).trim() !== '';
      const g = Number(it.order_price);
      const gia = coGia && isFinite(g) ? g : null;
      const sl = parseInt(it.amount, 10) || 1;
      hang.push({ ten: ten, sku: sku, sl: sl, gia: gia, qua: laQuaTang(ten, sku, gia) });
    });
    return {
      id: id,
      ma: String(d.order_sn),
      tn: String(d.remark || '').trim(),
      hang: hang,
      dv: String(d.fulfillment_carrier_name || '').trim(),
      dvAn: String(d.masking_carrier_name || '').trim(),
      luc: d.shipping_confirm_time ? new Date(d.shipping_confirm_time * 1000)
           : (d.create_time ? new Date(d.create_time * 1000) : null),
      coGioXN: !!d.shipping_confirm_time,
      href: '/portal/sale/order/' + id
    };
  }

  // Quà tặng — MỘT quy tắc duy nhất cho cả bảng in lẫn banner:
  //  - đơn giá 0đ (đã thử thật: quà của cả SMH và THHX đều 0đ), hoặc
  //  - tên bắt đầu "Quà tặng", hoặc
  //  - mã (SKU; không có thì tên) bắt đầu "1 nụ" hoặc viết thường 100%.
  function laQuaTang(ten, sku, gia) {
    if (gia === 0) return true;
    const t = String(ten || '').trim();
    if (/^quà\s*tặng/i.test(t)) return true;
    const c = String(sku || '').trim() || t;
    if (!c) return true;
    if (c.indexOf('1 nụ') === 0) return true;
    return c === c.toLowerCase() && c !== c.toUpperCase();
  }

  // Xét 1 đơn có thuộc loại cần cảnh báo không. Trả về các lý do (có thể nhiều).
  function xetCanhBao(o, laHoaToc) {
    const chinh = (o.hang || []).filter((h) => !h.qua);
    const gop = {};
    chinh.forEach((h) => { gop[h.ten] = gop[h.ten] || { ten: h.ten, sl: 0 }; gop[h.ten].sl += h.sl; });
    const ma = Object.keys(gop).map((k) => gop[k]);
    const moTa = (ds) => ds.map((h) => h.ten + ' x' + h.sl).join(', ');
    const tong = chinh.reduce((a, h) => a + (h.gia || 0) * h.sl, 0);
    const slNhieu = ma.filter((h) => h.sl >= NGUONG_SO_LUONG);
    return {
      ht: !!laHoaToc,
      tn: o.tn || '',
      spChinh: moTa(ma),
      slNhieu: slNhieu.length ? moTa(slNhieu) : '',
      gt: tong >= NGUONG_GIA_TRI_DON ? tong : 0
    };
  }

  // Đơn hoả tốc: đơn nằm trong nhóm "Đơn Hoả Tốc" của sàn (entity_type 3 — đã thử
  // thật, đúng nút "Đơn Hoả Tốc" trên trang Giao Hàng Loạt). Đơn không rõ nhóm (đơn
  // chỉ thấy trên trang) thì xét theo tên ĐVVC.
  const LA_HOA_TOC = /h[oỏọảốồ]a\s*t[oốộ]c|instant/i;

  // Bản 8.3: đơn "Đang Điều Phối ĐVVC" = Shopee đang tự tìm đơn vị vận chuyển, chưa phải
  // đơn thường -> KHÔNG có nút in, KHÔNG báo Note, KHÔNG tính quá hạn, KHÔNG tô màu.
  // Khi Shopee gán xong ĐVVC thật, đơn tự hiện lại như đơn bình thường.
  const LA_DIEU_PHOI = /đi[eềệ]u\s*ph[oốồ]i/i;
  const laTenDieuPhoi = (t) => LA_DIEU_PHOI.test(String(t || '').normalize('NFC'));
  const laDieuPhoi = (o) => !!o && (laTenDieuPhoi(o.dv) || laTenDieuPhoi(o.dvAn));

  // Bản 8.5: đơn hoả tốc Shopee đang ở trạng thái "Tìm lại Tài xế" (lấy hàng không thành
  // công, phải tìm tài xế khác) -> KHÔNG có nút in; banner hiện nút cam "TÌM LẠI TÀI XẾ" giống nút
  // thật của Shopee, bấm vào thì mở đơn và tự bấm nút đó. Trạng thái đọc từ lệnh
  // get_order_arrange_shipment_info (đã kiểm thật 12/10: chính lệnh trang Shopee dùng để vẽ nút).
  const LA_TIM_LAI = /t[iì]m\s*l[aạ]i\s*t[aà]i\s*x[eế]/i;
  let timLai = new Set();
  // Bản 8.6/3.5: đơn ĐÃ bấm "Tìm lại Tài xế" — Shopee vẫn để trong mục "Tìm lại Tài xế" nhưng nút trên
  // đơn đã đổi thành "Thông tin vận chuyển" (đã kiểm thật 12/10, đơn 261011BTW9AYJQ) -> coi như đã xử lý:
  // không banner, không nút in, không tô màu, không tính số đơn.
  let daGui = new Set();
  const LA_CHUAN_BI = /chu[aẩ]n\s*b[iị]\s*h[aà]ng/i;
  const LA_TT_VC = /th[oô]ng\s*tin\s*v[aậ]n\s*chuy[eể]n/i;
  async function docTimLai(ds) {
    const ra = new Set(), gui = new Set();
    for (let i = 0; i < ds.length; i += 20) {
      const j = await goiAPI('/api/v3/shipment/get_order_arrange_shipment_info', {
        orders: ds.slice(i, i + 20).map((x) => ({ order_id: Number(x.order_id), region_id: 'VN',
                                                  shop_id: Number(x.shop_id) || Number((localStorage.getItem(KEY_SHOP) || 0)) || 0 })),
        ui_type: 'order_package', data_source: 1, version: 2
      });
      (((j || {}).data || {}).list || []).forEach((o) => {
        const chu = [];
        (o.package_list || []).forEach((p) => (p.btn_info_list || []).forEach((b) =>
          chu.push(String((b.btn_style || {}).btn_text || '').normalize('NFC'))));
        const id = String(o.order_id);
        if (chu.some((c) => LA_TIM_LAI.test(c))) ra.add(id);
        else if (chu.some((c) => LA_TT_VC.test(c)) && !chu.some((c) => LA_CHUAN_BI.test(c))) gui.add(id);
      });
    }
    timLai = ra;
    daGui = gui;
  }

  // Tab đơn hàng mở từ nút "TÌM LẠI TÀI XẾ" trên banner: tự bấm nút thật của Shopee, rồi kiểm tra lại.
  async function tuBamTimLai() {
    if (!/^\/portal\/sale\/order\/\d+/.test(location.pathname) || location.hash !== '#smh-timlai') return;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    const bao = (chu, mau) => {
      let t = document.getElementById('smh-tl-bao');
      if (!t) { t = document.createElement('div'); t.id = 'smh-tl-bao'; document.body.appendChild(t); }
      t.style.cssText = 'position:fixed;left:50%;top:120px;transform:translateX(-50%);z-index:2147483646;' +
        'padding:10px 18px;border-radius:10px;font:800 14px/1.4 system-ui,Segoe UI,Roboto,arial,sans-serif;color:#fff;' +
        'box-shadow:0 8px 24px rgba(0,0,0,.3);max-width:80vw;background:' + (mau === 'xanh' ? '#1a9e5a' : mau === 'do' ? '#c62828' : '#ee4d2d');
      t.textContent = chu;
    };
    const timNut = () => Array.from(document.querySelectorAll('button')).find((b) =>
      LA_TIM_LAI.test((b.textContent || '').normalize('NFC')) && b.offsetParent !== null &&
      !b.closest('#smh-tn-popup,#ntf-box,#smh-tl-bao'));
    bao('🔄 Đang tìm nút "Tìm lại Tài xế" của Shopee…');
    let nut = null;
    for (let i = 0; i < 40 && !nut; i++) { await sleep(500); nut = timNut(); }
    if (!nut) {
      bao('Không thấy nút "Tìm lại Tài xế" trên đơn này — có thể Shopee đã tìm được tài xế. Anh kiểm tra lại đơn giúp.', 'do');
      return;
    }
    try { nut.scrollIntoView({ block: 'center' }); } catch (e) {}
    nut.click();
    bao('🔄 Đã bấm "Tìm lại Tài xế" — đang kiểm tra lại…');
    await sleep(5000);
    const hop = Array.from(document.querySelectorAll('.eds-modal, [role="dialog"]')).find((m) => m.offsetParent !== null);
    if (hop) bao('Shopee đang hỏi xác nhận — anh bấm xác nhận trong hộp thoại giúp.', 'cam');
    else if (timNut()) bao('Nút "Tìm lại Tài xế" vẫn còn — anh bấm tay nút cam trên trang giúp.', 'do');
    else bao('✓ Đã gửi yêu cầu Tìm lại Tài xế cho đơn này.', 'xanh');
  }
  function laDonHoaToc(x, o) {
    if (typeof x.ht === 'boolean') return x.ht;
    return !!o && LA_HOA_TOC.test((o.dv || '') + ' ' + (o.dvAn || ''));
  }

  async function docThemDon(idx) {
    const ra = {};
    if (!layCDS() || !idx.length) return ra;
    let can = [];
    idx.forEach((x) => {
      const c = khoCT[x.order_id];
      if (c) ra[x.order_id] = c; else can.push(x.order_id);
    });
    for (let lan = 1; lan <= 3 && can.length; lan++) {
      if (lan > 1) await sleep(1200 * lan);
      const hong = [];
      for (let i = 0; i < can.length; i += 8) {
        await Promise.all(can.slice(i, i + 8).map(async (id) => {
          try {
            const k = await doc1Don(id);
            ra[id] = k;
            if (k.coGioXN && !laDieuPhoi(k)) khoCT[id] = k;   // đơn đang điều phối: đọc lại mỗi vòng
          } catch (e) {
            hong.push(id);
            if (lan === 3) log('Đơn ' + id + ' đọc chi tiết hỏng 3 lần: ' + e.message);
          }
        }));
      }
      can = hong;
    }
    // Dọn bộ nhớ: bỏ các đơn đã không còn trong "Chờ lấy hàng" từ lâu
    const keys = Object.keys(khoCT);
    if (keys.length > 3000) keys.slice(0, keys.length - 2000).forEach((k) => delete khoCT[k]);
    return ra;
  }

  // Gom đơn chưa xử lý thành các nút in: mỗi ĐVVC 1 nút đơn thường, và nếu có đơn
  // hoả tốc thì thêm 1 nút ĐỎ riêng cho ĐVVC hoả tốc đó (in riêng, không dính đơn thường).
  // Hàng trong nút = tên phân loại, cộng dồn số lượng, bỏ quà tặng.
  function gomTheoNut(ds, them) {
    const theo = {};
    let thieu = 0;
    ds.forEach((x) => {
      const o = them[x.order_id];
      if (!o) { thieu++; return; }            // chưa đọc được chi tiết -> báo riêng, không đoán
      if (laDieuPhoi(o)) return;              // bản 8.3: Shopee đang điều phối ĐVVC -> không có nút in
      if (timLai.has(String(x.order_id))) return;   // bản 8.5: đang "Tìm lại Tài xế" -> không có nút in
      if (daGui.has(String(x.order_id))) return;    // bản 8.6: đã bấm "Tìm lại Tài xế" -> không có nút in
      const ht = laDonHoaToc(x, o);
      const dv = o.dv || '';
      const k = (ht ? '⚡' : '') + (dv || '?');
      const g = theo[k] = theo[k] || { k: k, ten: dv, ht: ht, n: 0, qh: 0, tn: 0, sl: 0, gt: 0, bang: {}, don: [] };
      g.n++;
      // Bản 8.3: nút HOẢ TỐC ghi từng đơn: mã đơn + mã hàng
      if (ht) g.don.push({ ma: o.ma, hang: (o.hang || []).filter((h) => !h.qua).map((h) => ({ v: h.ten, n: h.sl })) });
      // Đơn hoả tốc đã có nút đỏ riêng nên KHÔNG tính vào cảnh báo quá hạn
      if (!ht && quaHanXL(o.luc)) g.qh++;
      const cb = xetCanhBao(o, ht);
      if (cb.tn) g.tn++;
      if (cb.slNhieu) g.sl++;
      if (cb.gt) g.gt++;
      (o.hang || []).forEach((h) => {
        if (h.qua) return;
        const b = g.bang[h.ten] = g.bang[h.ten] || { v: h.ten, n: 0, gia: null };
        b.n += h.sl;
        if (h.gia !== null && (b.gia === null || h.gia > b.gia)) b.gia = h.gia;
      });
    });
    const ra = Object.keys(theo).map((k) => {
      const g = theo[k];
      const r = { k: g.k, ten: g.ten, ht: g.ht, n: g.n, qh: g.qh, tn: g.tn, sl: g.sl, gt: g.gt,
                  sp: Object.keys(g.bang).map((v) => g.bang[v]) };
      if (g.ht && g.don.length) r.don = g.don;
      return r;
    });
    return { ds: ra, thieu: thieu };
  }

  async function docSoChuan() {
    if (dangChay) return;
    if (dangDoc) { canDocLai = true; return; }   // đang đọc -> đọc xong sẽ đọc thêm 1 lần
    canDocLai = false;
    dangDoc = true;
    const batDauLuc = Date.now();
    mocDoc = batDauLuc;
    try { veSo(); } catch (e) { log('Vẽ bảng lỗi:', e.message); }
    try {
      if (!tenShop) await layTenShop();
      try {
        const kq = await docQuaAPI();
        if (soLanAPIHong) log('API đọc lại được sau ' + soLanAPIHong + ' lần lỗi');
        soLanAPIHong = 0;
        loiCuoi = null;
        dsChuaBG = kq.chuaBG;
        ghiNhanSo({ ds: kq.ds, tn: khoTN, bg: dsChuaBG, thieuCT: kq.thieuCT, cheDo: 'api' });
        log('Đọc xong sau ' + (Date.now() - batDauLuc) + 'ms — ' + tomTat(kq.ds) +
            (kq.thieuCT ? ', ' + kq.thieuCT + ' đơn chưa đọc được' : '') +
            ', banner ' + khoTN.filter(coCanhBao).length + ' đơn, chờ shipper ' + dsChuaBG.n);
      } catch (e) {
        soLanAPIHong++;
        loiCuoi = { chu: e.message, matDN: !!e.matDN, ts: Date.now() };
        log('API lỗi (lần ' + soLanAPIHong + ' liên tiếp): ' + e.message);
        const tu = (soHienTai && soHienTai._ts) ? ' từ ' + gioNgan(new Date(soHienTai._ts)) : '';
        trangThaiTN = e.matDN
          ? { muc: 'hong', chu: '⚠ Mất đăng nhập Shopee — Note KHÔNG được cập nhật' + tu }
          : { muc: soLanAPIHong >= SO_LAN_LOI_TRUOC_CACH_CU ? 'hong' : 'canh',
              chu: '⚠ Không đọc được Note mới' + tu + ' — đang giữ Note cũ, đang thử lại' };
        if (!e.matDN && soLanAPIHong >= SO_LAN_LOI_TRUOC_CACH_CU) {
          // Lỗi liên tiếp nhiều lần -> đếm tạm bằng cách cũ để vẫn in được.
          // Mất đăng nhập thì cách cũ cũng không chạy được nên không thử.
          log('API lỗi ' + soLanAPIHong + ' lần liền — chuyển sang cách cũ (khung ẩn)');
          const ds = await Promise.race([
            docBangKhungAn(),
            new Promise((_, loi) => setTimeout(() => loi(new Error('cách cũ quá hạn 90 giây')), 90000))
          ]);
          const cu = soHienTai || {};
          ghiNhanSo({ ds: ds, tn: cu.tn || [], bg: cu.bg || { n: 0, qh: 0, ds: [] }, thieuCT: 0, cheDo: 'cu' });
        } else if (!e.matDN) {
          // Lỗi 1–2 lần: giữ nguyên bảng cũ, 10 giây sau thử lại (không đợi hết 45 giây)
          setTimeout(() => { if (!dangDoc && !dangChay) docSoChuan(); }, 10000);
        }
      }
    } catch (e) {
      log('Đọc số lỗi:', e.message);
    } finally {
      const troi = Date.now() - batDauLuc;
      if (troi < 900) await sleep(900 - troi);
      dangDoc = false;
      lanDocCuoi = Date.now();
      veSo();
      if (canDocLai) { canDocLai = false; setTimeout(docSoChuan, 300); }
    }
  }

  /* ---------- Đồng bộ với trang Shopee ----------
     Đã kiểm tra thật: trang Giao Hàng Loạt KHÔNG tự cập nhật; chỉ khi bấm một
     nút lọc (Tất cả, Hạn giao hàng hôm nay, SPX...) thì trang mới tải danh sách
     mới. Vì vậy MỖI LẦN trang tải danh sách, script đọc lại ngay lúc đó: đơn
     mới nào hiện lên trang thì bảng in + Note cũng vừa cập nhật theo. Ngoài ra
     "nghe" danh sách đơn trang vừa tải để kiểm Note đúng các đơn đang hiện.
     Chỉ nghe, không sửa gì của trang. Lúc script đang tự bấm in thì bỏ qua. */

  let henTrang = null, lanTrangCuoi = 0;
  function trangVuaTaiDanhSach(idsMoi) {
    if (dangChay) return;
    let coMoi = false;
    (idsMoi || []).forEach((id) => { if (!idsLanCuoi.has(id) && !khoCT[id]) coMoi = true; });
    clearTimeout(henTrang);   // gom nhiều lệnh tải của 1 cú bấm thành 1 lần đọc
    henTrang = setTimeout(() => {
      if (dangChay) return;
      if (!coMoi && Date.now() - lanTrangCuoi < 3000) return;
      lanTrangCuoi = Date.now();
      docSoChuan();
    }, 600);
  }

  function ngheTrangShopee() {
    try {
      const X = XMLHttpRequest.prototype;
      if (!X.__smhNghe) {
        X.__smhNghe = true;
        const moGoc = X.open, guiGoc = X.send;
        const goiChuaXL = new Set();   // mã kiện của các lượt tải mục "chưa xử lý"
        X.open = function (m, u) {
          try { this.__smhUrl = String(u || ''); } catch (e) {}
          return moGoc.apply(this, arguments);
        };
        X.send = function (body) {
          try {
            const u = this.__smhUrl || '';
            const laDs = /search_mass_shipment_index/.test(u);
            const laThe = /get_mass_shipment_card_list/.test(u);
            if (laDs || laThe) {
              const xhr = this;
              let chuaXL = false;
              if (laDs) { try { chuaXL = ((JSON.parse(body).filter || {}).process_status) === 1; } catch (e) {} }
              xhr.addEventListener('load', () => {
                try {
                  const d = (JSON.parse(xhr.responseText) || {}).data || {};
                  if (laDs) {
                    if (!chuaXL) return;
                    (d.index_list || []).forEach((x) => { if (x.package_number) goiChuaXL.add(x.package_number); });
                    trangVuaTaiDanhSach([]);
                  } else {
                    const ids = [];
                    (d.card_list || []).forEach((c) => {
                      (((c.package_group_card || {}).package_card_list) || []).forEach((p) => {
                        const ext = p.ext_info || {};
                        if (ext.order_id && goiChuaXL.has(ext.package_number)) {
                          trenTrang.set(String(ext.order_id), Date.now());
                          ids.push(String(ext.order_id));
                        }
                      });
                    });
                    if (ids.length) trangVuaTaiDanhSach(ids);
                  }
                } catch (e) {}
              });
            }
          } catch (e) {}
          return guiGoc.apply(this, arguments);
        };
      }
    } catch (e) { log('Không nghe được trang Giao Hàng Loạt:', e.message); }

    // Dự phòng: trang nào của Shopee tải danh sách đơn thì cũng đọc lại ngay.
    // Bỏ qua lệnh do script gửi (có "_src=").
    try {
      new PerformanceObserver((l) => {
        l.getEntries().forEach((e) => {
          const n = e.name || '';
          if (n.indexOf('_src=') >= 0) return;
          if (/search_mass_shipment_index|search_order_list_index|get_order_list_card_list/.test(n)) trangVuaTaiDanhSach([]);
        });
      }).observe({ type: 'resource', buffered: false });
    } catch (e) {}
  }

  /* ---------- Bảng nút (giao diện mới bản 8.0) ---------- */

  let elPanel, elStatus;

  const FONT = 'system-ui,-apple-system,"Segoe UI","Helvetica Neue",Roboto,arial,' +
    '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif';

  const CSS = (`
    /* system-ui trước: trên Windows là Segoe UI, đặt dấu tiếng Việt chuẩn. */
    #smh-print-panel,#smh-nho{font-family:__FONT__}
    #smh-print-panel{position:fixed;right:18px;bottom:18px;z-index:2147483000;width:348px;
      background:#fff;border:1px solid #ececec;border-radius:14px;overflow:hidden;
      box-shadow:0 12px 34px rgba(0,0,0,.2),0 2px 6px rgba(0,0,0,.06);color:#333}
    #smh-print-panel *{box-sizing:border-box}

    /* ----- đầu bảng ----- */
    #smh-print-panel .smh-hd{display:flex;align-items:center;gap:7px;padding:9px 10px 9px 12px;
      border-bottom:1px solid #f1f1f1;background:linear-gradient(#fff,#fbfbfb)}
    #smh-print-panel .smh-den{width:10px;height:10px;border-radius:50%;flex:none;background:#bdbdbd;
      box-shadow:0 0 0 3px rgba(0,0,0,.05);cursor:help}
    #smh-print-panel .smh-den.xanh{background:#1a9e5a;box-shadow:0 0 0 3px rgba(26,158,90,.18)}
    #smh-print-panel .smh-den.cam{background:#f57c00;box-shadow:0 0 0 3px rgba(245,124,0,.2);
      animation:smhDenNhip 1.6s ease-in-out infinite}
    #smh-print-panel .smh-den.do{background:#d32f2f;box-shadow:0 0 0 3px rgba(211,47,47,.22);
      animation:smhDenNhip .8s ease-in-out infinite}
    @keyframes smhDenNhip{0%,100%{opacity:1}50%{opacity:.35}}
    #smh-print-panel .smh-tde{display:flex;align-items:center;gap:5px;font-size:15px;font-weight:900;
      color:#ee4d2d;letter-spacing:.3px;white-space:nowrap}
    #smh-print-panel .smh-shop{font-size:10.5px;font-weight:900;color:#555;background:#f1f1f1;
      border-radius:5px;padding:2px 6px;letter-spacing:.3px}
    #smh-print-panel .smh-shop:empty{display:none}
    #smh-print-panel .smh-ver{font-size:10.5px;color:#aaa;font-weight:700}
    #smh-print-panel .smh-nutbar{margin-left:auto;display:flex;gap:5px}
    #smh-print-panel button.smh-ic{all:unset;box-sizing:border-box;width:28px;height:28px;
      border:1px solid #e3e3e3;border-radius:8px;display:flex;align-items:center;justify-content:center;
      cursor:pointer;color:#555;font-size:15px;line-height:1;background:#fff;transition:background .15s}
    #smh-print-panel button.smh-ic:hover{background:#f3f3f3}
    #smh-print-panel button.smh-ic.ok{background:#1a9e5a;border-color:#1a9e5a;color:#fff}
    #smh-print-panel button.smh-ic.xoay > span{display:inline-block;animation:smhXoay .9s linear infinite}
    @keyframes smhXoay{to{transform:rotate(360deg)}}

    /* ----- thân: các nút in ----- */
    #smh-print-panel .smh-body{padding:10px 10px 2px;max-height:64vh;overflow-y:auto;overflow-x:hidden}
    #smh-print-panel .smh-body.dangdoc{opacity:.9;transition:opacity .2s}
    #smh-print-panel button.smh-btn{all:unset;box-sizing:border-box;display:flex;align-items:flex-start;
      justify-content:space-between;gap:10px;width:100%;margin-bottom:8px;padding:11px 13px;
      border-radius:12px;color:#fff;cursor:pointer;text-align:left;line-height:1.2;
      box-shadow:0 4px 12px rgba(0,0,0,.22);transition:filter .15s,transform .15s}
    #smh-print-panel button.smh-btn:hover{filter:brightness(1.07)}
    #smh-print-panel button.smh-btn:active{transform:scale(.99)}
    #smh-print-panel button.smh-btn:disabled{cursor:not-allowed;opacity:.6}
    #smh-print-panel .smh-trai{display:flex;flex-direction:column;gap:5px;min-width:0}
    #smh-print-panel .smh-dau{display:flex;align-items:center;flex-wrap:wrap;gap:5px}
    #smh-print-panel .smh-ten{font-size:14.5px;font-weight:900;text-shadow:0 1px 2px rgba(0,0,0,.25)}
    #smh-print-panel .smh-chip{font-size:10px;font-weight:900;border-radius:9px;padding:1px 7px;
      background:#fff;color:#c62828;letter-spacing:.2px;white-space:nowrap;line-height:1.6}
    #smh-print-panel .smh-chip.tn{color:#1565c0}
    #smh-print-panel .smh-chip.sl{color:#6a1b9a}
    #smh-print-panel .smh-chip.gt{color:#e65100}
    #smh-print-panel .smh-chip.qh{background:#ffeb3b;color:#b71c1c}
    #smh-print-panel .smh-sku{display:flex;flex-direction:column;align-items:flex-start;gap:3px;
      font-size:11.5px;font-weight:800;line-height:1.35;opacity:.97;word-break:break-word}
    #smh-print-panel .smh-dong{word-break:break-word}
    #smh-print-panel .smh-sl{font-weight:900;white-space:nowrap}
    #smh-print-panel .smh-mad{font-weight:900;letter-spacing:.3px;background:rgba(0,0,0,.22);border-radius:4px;
      padding:0 5px;margin-right:2px}
    #smh-print-panel .smh-sl.nhieu{font-size:1.45em;line-height:1}
    #smh-print-panel .smh-dong.dat{border:2px solid rgba(255,255,255,.95);background:rgba(0,0,0,.25);
      border-radius:6px;padding:2px 7px;font-size:12.5px;font-weight:900;box-shadow:0 1px 3px rgba(0,0,0,.3)}
    @keyframes smhHiem{
      0%,100%{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.9)}
      50%{background:rgba(255,255,255,.6);border-color:#fff}}
    #smh-print-panel .smh-dong.hiem{animation:smhHiem .9s ease-in-out infinite}
    #smh-print-panel .smh-canh{font-size:11.5px;font-weight:800;background:rgba(0,0,0,.2);
      border-radius:5px;padding:3px 6px;display:inline-block}
    #smh-print-panel .smh-so{display:flex;flex-direction:column;align-items:center;flex:none;
      text-shadow:0 2px 5px rgba(0,0,0,.28)}
    #smh-print-panel .smh-so .smh-con{font-size:34px;font-weight:900;line-height:1;letter-spacing:-1px}
    #smh-print-panel .smh-so .smh-dv{font-size:10.5px;font-weight:800;opacity:.9}

    @keyframes smhNhip{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}
    #smh-print-panel button.smh-btn.nhip{animation:smhNhip 2.4s ease-in-out infinite}
    /* hoả tốc / quá hạn: viền đỏ toả liên tục */
    @keyframes smhToa{0%,100%{box-shadow:0 4px 12px rgba(0,0,0,.22),0 0 0 0 rgba(211,47,47,.75)}
      50%{box-shadow:0 4px 12px rgba(0,0,0,.22),0 0 0 7px rgba(211,47,47,0)}}
    #smh-print-panel button.smh-btn.gap{animation:smhToa .85s ease-in-out infinite}

    #smh-print-panel .smh-trong{padding:18px 10px;text-align:center;font-size:13.5px;font-weight:700;
      color:#1a9e5a;background:#f3fbf6;border:1px dashed #bfe5cf;border-radius:12px;margin-bottom:8px}
    #smh-print-panel .smh-trong.cho{color:#8a8a8a;background:#fafafa;border-color:#e0e0e0}
    #smh-print-panel .smh-bao{font-size:12px;font-weight:800;line-height:1.4;border-radius:9px;
      padding:6px 9px;margin-bottom:8px;color:#8a4b00;background:#fff4e5;border:1px solid #ffd8a8}

    /* Đơn đã có mã vận đơn, quá hạn bàn giao mà shipper chưa lấy */
    @keyframes smhBgChop{
      0%,100%{border-color:#e65100;box-shadow:0 0 0 0 rgba(230,81,0,.55)}
      50%{border-color:#ff9800;box-shadow:0 0 0 6px rgba(230,81,0,0)}}
    #smh-print-panel .smh-bg{border:3px solid #e65100;border-radius:12px;background:#fff5ec;
      padding:8px 10px;margin-bottom:8px;animation:smhBgChop .95s ease-in-out infinite}
    #smh-print-panel .smh-bg-h{color:#fff;background:#e65100;border-radius:7px;padding:4px 9px;
      text-align:center;font-size:13px;font-weight:900}
    #smh-print-panel .smh-bg-i{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:6px}
    #smh-print-panel a.smh-bg-ma{font-size:13.5px;font-weight:900;color:#bf360c;text-decoration:none;letter-spacing:.3px}
    #smh-print-panel a.smh-bg-ma:hover{text-decoration:underline}
    #smh-print-panel .smh-bg-gio{font-size:12px;font-weight:700;color:#8d6e63}
    #smh-print-panel button.smh-tn-cp{all:unset;display:inline-block;cursor:pointer;background:#d32f2f;
      color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:5px;line-height:1.5}
    #smh-print-panel button.smh-tn-cp.ok{background:#1a9e5a}

    /* ----- dòng tiến trình in + chân bảng ----- */
    #smh-print-panel .smh-st{font-size:13px;font-weight:700;line-height:1.4;padding:0 12px 8px;
      word-break:break-word}
    #smh-print-panel .smh-st:empty{display:none}
    #smh-print-panel .smh-ft{display:flex;align-items:center;justify-content:space-between;gap:8px;
      padding:8px 12px;border-top:1px solid #f1f1f1;background:#fafafa;font-size:12px;font-weight:800}
    #smh-print-panel .smh-pill{color:#6d4c41;background:#fff3e0;border-radius:10px;padding:3px 9px;
      white-space:nowrap}
    #smh-print-panel .smh-pill.qh{color:#fff;background:#e65100}
    #smh-print-panel .smh-pill:empty{display:none}
    #smh-print-panel .smh-gio{color:#1a9e5a;white-space:nowrap;margin-left:auto}
    #smh-print-panel .smh-gio.dang{color:#888}
    #smh-print-panel .smh-gio.cu{color:#c62828}

    /* ----- huy hiệu khi thu gọn ----- */
    #smh-nho{position:fixed;right:18px;bottom:18px;z-index:2147483000;cursor:pointer;
      display:flex;align-items:center;gap:8px;padding:10px 15px;border-radius:24px;white-space:nowrap;
      background:linear-gradient(135deg,#ee4d2d,#d73211);color:#fff;font-size:14px;font-weight:900;
      border:none;box-shadow:0 6px 18px rgba(0,0,0,.28)}
    #smh-nho:hover{filter:brightness(1.07)}
    #smh-nho .smh-den{width:9px;height:9px;border-radius:50%;background:#fff;opacity:.9}
    #smh-nho .smh-den.cam{background:#ffcc80}
    #smh-nho .smh-den.do{background:#ffeb3b;animation:smhDenNhip .8s ease-in-out infinite}
    #smh-nho .smh-nho-so{font-size:22px;line-height:1}
    #smh-nho .smh-nho-ht{font-size:12px;background:#fff;color:#c62828;border-radius:9px;padding:1px 7px}
    #smh-nho.codo{background:linear-gradient(135deg,#e53935,#b71c1c);animation:smhToaNho .85s ease-in-out infinite}
    @keyframes smhToaNho{0%,100%{box-shadow:0 6px 18px rgba(0,0,0,.28),0 0 0 0 rgba(211,47,47,.75)}
      50%{box-shadow:0 6px 18px rgba(0,0,0,.28),0 0 0 9px rgba(211,47,47,0)}}

    /* Banner nhỏ gọn giữa - trên màn hình (giữ nguyên từ bản 7.x): đơn hoả tốc,
       đơn có Note, SL nhiều, giá cao. Không có nút tắt: đơn nào xử lý xong thì
       dòng của đơn đó tự biến mất, còn chưa xử lý thì cứ nhấp nháy tiếp. */
    @keyframes smhTnChop{
      0%,100%{border-color:var(--tc,#d32f2f);box-shadow:0 8px 24px rgba(0,0,0,.25),0 0 0 0 transparent}
      50%{border-color:var(--ts,#ff5252);
        box-shadow:0 8px 24px rgba(0,0,0,.25),0 0 22px 5px color-mix(in srgb,var(--tc,#d32f2f) 45%,transparent)}}
    #smh-tn-popup{position:fixed;top:8px;left:50%;transform:translateX(-50%);
      z-index:2147483600;max-width:min(680px,80vw);width:max-content;font-family:__FONT__}
    #smh-tn-popup .smh-tn-rows{border:3px solid var(--tc,#d32f2f);border-radius:12px;
      background:#fff;padding:6px 8px;max-height:26vh;overflow-y:auto;
      box-shadow:0 8px 24px rgba(0,0,0,.32);
      animation:smhTnChop .9s ease-in-out infinite}
    #smh-tn-popup .smh-tn-r{display:flex;align-items:baseline;gap:7px;
      flex-wrap:wrap;padding:6px 10px;border-radius:8px;background:var(--rn,#fdeceb);
      border:1px solid var(--rv,#f1b5ae)}
    #smh-tn-popup .smh-tn-r + .smh-tn-r{margin-top:6px}
    #smh-tn-popup .smh-tn-r.loi .smh-tn-t{color:#b45309}
    #smh-tn-popup .smh-tn-nh{flex:none;font-size:10.5px;font-weight:900;color:#fff;
      border-radius:4px;padding:1px 6px;letter-spacing:.2px;line-height:1.5;white-space:nowrap}
    #smh-tn-popup .smh-tn-nh.ht{background:#c62828}
    #smh-tn-popup .smh-tn-nh.tn{background:#1565c0}
    #smh-tn-popup .smh-tn-nh.sl{background:#6a1b9a}
    #smh-tn-popup .smh-tn-nh.gt{background:#e65100}
    #smh-tn-popup .smh-tn-nh.loi{background:#b45309}
    #smh-tn-popup .smh-tn-them{margin:4px auto 0;width:max-content;font-size:11px;
      font-weight:800;color:#fff;background:var(--tc,#8d1616);border-radius:9px;padding:1px 10px}
    #smh-tn-popup .smh-tn-st{margin:4px auto 0;width:max-content;max-width:100%;
      font-size:11.5px;font-weight:800;line-height:1.4;padding:2px 10px;border-radius:9px;
      color:#fff;background:#e65100;box-shadow:0 1px 4px rgba(0,0,0,.15)}
    #smh-tn-popup .smh-tn-st.hong{background:#c62828;animation:smhTnSt .9s ease-in-out infinite}
    @keyframes smhTnSt{0%,100%{opacity:1}50%{opacity:.55}}
    #smh-tn-popup a.smh-tn-ma{font-size:13.5px;font-weight:900;color:var(--rc,#c62828);
      text-decoration:none;letter-spacing:.2px;flex:none}
    #smh-tn-popup a.smh-tn-ma:hover{text-decoration:underline}
    #smh-tn-popup button.smh-tn-cp{all:unset;display:inline-block;cursor:pointer;
      background:var(--rc,#d32f2f);color:#fff;font-size:11px;font-weight:800;padding:2px 8px;
      border-radius:5px;line-height:1.5;flex:none}
    #smh-tn-popup button.smh-tn-cp:hover{filter:brightness(.85)}
    #smh-tn-popup button.smh-tn-cp.ok{background:#1a9e5a}
    /* Bản 8.5: nút cam "TÌM LẠI TÀI XẾ" giống nút thật của Shopee */
    #smh-tn-popup button.smh-tn-tl{all:unset;display:inline-block;cursor:pointer;background:#ee4d2d;color:#fff;
      font-size:12px;font-weight:900;padding:3px 11px;border-radius:5px;line-height:1.5;flex:none;letter-spacing:.3px;
      box-shadow:0 1px 4px rgba(238,77,45,.45)}
    #smh-tn-popup button.smh-tn-tl:hover{background:#d73211}
    .smh-mk-b .tl,.smh-mk-tags .tl{background:#ee4d2d !important}
    /* Bản 8.2: Note nằm DƯỚI mã đơn, trong ô nền xanh dương nhạt giống ô "Tin nhắn" của Shopee */
    #smh-tn-popup .smh-tn-note{flex:1 1 100%;margin-top:2px;background:#d6e7fb;border-radius:6px;padding:5px 10px;
      font-size:13px;font-weight:600;color:#1f2d3d;line-height:1.45;word-break:break-word}
    #smh-tn-popup .smh-tn-note b{color:#1565c0;font-weight:800}
    #smh-tn-popup .smh-tn-t{font-size:13px;color:#3d2b28;font-weight:700;
      word-break:break-word;flex:1 1 260px;min-width:0}

    /* Bản 8.0: tô màu dòng đơn cần chú ý ngay trong bảng của trang Giao Hàng Loạt */
    /* Bản 8.3 (phương án B): không còn vạch bên trái (từng đè ô tick) — cả hàng có nền nhạt
       + khung bo góc theo MÀU LOẠI ĐƠN (đỏ = hoả tốc, xanh dương = Note, tím = SL nhiều, cam = giá trị cao) */
    .mass-ship-card.smh-mk{background:var(--smh-n,#fdeceb) !important;border-radius:8px;
      box-shadow:inset 0 0 0 2px var(--smh-c,#c62828) !important}
    .smh-mk-b{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
    .smh-mk-b span{font:900 10.5px/1.6 __FONT__;color:#fff;border-radius:4px;padding:0 6px;
      white-space:nowrap}
    .smh-mk-b .ht{background:#c62828}
    .smh-mk-b .tn{background:#1565c0}
    .smh-mk-b .sl{background:#6a1b9a}
    .smh-mk-b .gt{background:#e65100}
    .smh-mk-b .loi{background:#b45309}
    /* Bản 8.2: tô đơn thật trên trang Đơn hàng (Tất cả / Chờ lấy hàng) — phương án B */
    /* Bản 8.3: nền + vạch theo MÀU LOẠI ĐƠN (giống banner và trang Giao Hàng Loạt) */
    a.order-card.smh-mk2{position:relative;background:var(--smh-n,#fdeceb) !important;border-color:var(--smh-v,#f1b5ae) !important}
    a.order-card.smh-mk2::before{content:"";position:absolute;left:-1px;top:-1px;bottom:-1px;width:7px;
      background:var(--smh-c,#c62828);border-radius:4px 0 0 4px;z-index:2}
    a.order-card.smh-mk2 .order-card-header{background:color-mix(in srgb,var(--smh-c,#c62828) 9%,#fff) !important}
    a.order-card.smh-mk2 .order-card-body,a.order-card.smh-mk2 .package-card-info{background:transparent !important}
    .smh-mk-tags{display:inline-flex;gap:5px;margin-left:10px;vertical-align:1px}
    .smh-mk-tags span{font:900 11px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,arial,sans-serif;color:#fff;border-radius:4px;padding:0 7px;white-space:nowrap}
    .smh-mk-tags .ht{background:#c62828}.smh-mk-tags .tn{background:#1565c0}.smh-mk-tags .sl{background:#6a1b9a}
    .smh-mk-tags .gt{background:#e65100}.smh-mk-tags .loi{background:#b45309}
    .smh-mk-note{margin:0 14px 12px 44px;padding:7px 12px;border-radius:6px;
      background:#d6e7fb;color:#0d2f5e;word-break:break-word;
      font:600 13.5px/1.45 __FONT__}
    .smh-mk-note b{color:#1565c0;font-weight:800}
    .smh-mk-note.loi{background:#ffe8c2;color:#7a3e00}
    .smh-mk-note.loi b{color:#b45309}
  `).replace(/__FONT__/g, FONT);

  // CSS đặt vào <head> một lần (không nằm trong bảng) để banner, huy hiệu và phần
  // tô màu dòng đơn vẫn đúng kiểu khi bảng đang thu gọn.
  function chenCSS() {
    if (document.getElementById('smh-css-80')) return;
    const s = document.createElement('style');
    s.id = 'smh-css-80';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function taoPanel() {
    chenCSS();
    if (document.getElementById('smh-print-panel')) return;
    const p = document.createElement('div');
    p.id = 'smh-print-panel';
    p.innerHTML =
      '<div class="smh-hd">' +
        '<span class="smh-den" title="Đang đọc lần đầu…"></span>' +
        '<span class="smh-tde">' + ICON_IN + '<span>IN ĐƠN</span></span>' +
        '<span class="smh-shop"></span>' +
        '<span class="smh-ver">' + PHIEN_BAN + '</span>' +
        '<span class="smh-nutbar">' +
          '<button type="button" class="smh-ic smh-rf" title="Đọc lại số đơn ngay"><span>⟳</span></button>' +
          '<button type="button" class="smh-ic smh-bl" title="Báo lỗi: copy nhật ký + tình trạng hiện tại để dán gửi Claude">📋</button>' +
          '<button type="button" class="smh-ic smh-x" title="Thu gọn">–</button>' +
        '</span>' +
      '</div>' +
      '<div class="smh-body"></div>' +
      '<div class="smh-st"></div>' +
      '<div class="smh-ft"><span class="smh-pill"></span><span class="smh-gio"></span></div>';
    document.body.appendChild(p);
    elPanel = p;
    elStatus = p.querySelector('.smh-st');
    try { if (localStorage.getItem('SMH_THUGON') === '1') p.style.display = 'none'; } catch (e) {}

    p.querySelector('.smh-rf').onclick = () => docSoChuan();
    p.querySelector('.smh-bl').onclick = (ev) => chepBaoLoi(ev.currentTarget);
    p.querySelector('.smh-x').onclick = () => thuGon(true);
    veSo();
  }

  function thuGon(an) {
    const p = document.getElementById('smh-print-panel');
    if (p) p.style.display = an ? 'none' : 'block';
    try { localStorage.setItem('SMH_THUGON', an ? '1' : '0'); } catch (e) {}
    veHuyHieu();
  }

  const tongDon = (d) => d ? ((d.ds || []).reduce((a, x) => a + x.n, 0) + (d.thieuCT || 0)) : 0;
  const donHoaToc = (d) => d ? (d.ds || []).filter((x) => x.ht).reduce((a, x) => a + x.n, 0) : 0;

  // Huy hiệu khi thu gọn: đèn trạng thái + tổng số đơn chờ in + số đơn hoả tốc
  function veHuyHieu() {
    let an = false;
    try { an = localStorage.getItem('SMH_THUGON') === '1'; } catch (e) {}
    let b = document.getElementById('smh-nho');

    if (!an) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('button');
      b.id = 'smh-nho';
      b.type = 'button';
      b.onclick = () => thuGon(false);
      document.body.appendChild(b);
    }
    const d = soHienTai;
    const ht = donHoaToc(d);
    const coDo = ht > 0 || ((d && d.ds) || []).some((x) => x.qh > 0);
    const den = trangThaiDen();
    const sig = [tongDon(d), ht, coDo, den.mau].join('|');
    b.title = 'Mở bảng in đơn — ' + den.chu;
    if (b.dataset.sig === sig) return;
    b.dataset.sig = sig;
    b.className = coDo ? 'codo' : '';
    b.innerHTML = '<span class="smh-den ' + den.mau + '"></span>' + ICON_IN + '<span>IN ĐƠN</span>' +
      '<span class="smh-nho-so"></span>' + (ht ? '<span class="smh-nho-ht">⚡ ' + ht + '</span>' : '');
    b.querySelector('.smh-nho-so').textContent = String(tongDon(d));
  }

  function trangThai(txt, mau) {
    if (elStatus) {
      elStatus.dataset.busy = '1';
      elStatus.textContent = txt;
      elStatus.style.color = mau || '#666';
    }
    log(txt);
  }

  function khoaNut(khoa) {
    if (!elPanel) return;
    elPanel.querySelectorAll('button.smh-btn').forEach((b) => { if (!b.dataset.khoa) b.disabled = khoa; });
  }

  function chepTay(ma, xong) {
    try {
      const o = document.createElement('textarea');
      o.value = ma;
      o.style.cssText = 'position:fixed;top:-9999px;opacity:0';
      document.body.appendChild(o);
      o.select();
      document.execCommand('copy');
      o.remove();
      xong();
    } catch (e) { log('Copy mã lỗi:', e.message); }
  }

  function chepMa(ma, nut) {
    const cu = nut.textContent;
    const xong = () => {
      nut.textContent = '✓ Đã copy';
      nut.classList.add('ok');
      setTimeout(() => { nut.textContent = cu; nut.classList.remove('ok'); }, 1600);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ma).then(xong, () => chepTay(ma, xong));
        return;
      }
    } catch (e) {}
    chepTay(ma, xong);
  }

  // Đơn có lời nhắn của khách: 1 banner nhỏ gọn, cố định giữa - trên màn hình,
  // tách khỏi bảng in đơn, nhấp nháy như cảnh báo hoả tốc để không ai bỏ sót.
  // Đúng 1 việc: mã đơn + nút copy + nội dung Note, mỗi đơn 1 dòng. Không có
  // nút tắt — đơn nào xử lý xong (rời khỏi danh sách chưa xử lý) thì dòng của
  // đơn đó tự biến mất, còn chưa xử lý thì cứ nhấp nháy tiếp.
  // Ngoài ra có dòng trạng thái nhỏ (cam/đỏ) CHỈ hiện khi phần tự kiểm tra thấy
  // bất thường: sàn báo nhiều đơn hơn script đọc được, đơn đọc không ra chi tiết,
  // mất đăng nhập... Bình thường không hiện gì thêm (bảng in đơn đã có giờ đọc).
  // Bản 7.0: banner báo 4 loại — Hoả tốc / Note / SL nhiều / Giá cao. Mỗi đơn đúng
  // 1 dòng, đơn khớp nhiều loại thì hiện nhiều nhãn màu trên cùng dòng đó.
  const coCanhBao = (o) => !!(o && (o.loi || o.ht || o.tn || o.slNhieu || o.gt));

  function chuKyTN(ds) {
    return ds.map((o) => [o.id || o.ma || '', o.tn || '', o.loi ? 1 : 0, o.ht ? 1 : 0, o.timLai ? 1 : 0,
                          o.slNhieu || '', o.gt || 0, o.spChinh || ''].join('::'))
      .sort().join('|') + '#' + (trangThaiTN ? trangThaiTN.muc + trangThaiTN.chu : '');
  }

  // Nội dung chi tiết sau mã đơn: danh sách mã hàng chỉ ghi 1 lần cho gọn.
  function chiTietDong(o) {
    if (o.loi) return 'Chưa đọc được nội dung đơn — bấm mở đơn kiểm tra bằng mắt';
    const phan = [];
    let dsDaGhi = false;
    if ((o.ht || o.gt) && o.spChinh) { phan.push('(' + o.spChinh + ')'); dsDaGhi = true; }
    else if (o.slNhieu) { phan.push('(' + o.slNhieu + ')'); dsDaGhi = true; }
    if (o.gt) phan[phan.length - 1] = (dsDaGhi ? phan[phan.length - 1] + ' ' : '') +
      Number(o.gt).toLocaleString('vi-VN') + 'đ';
    return phan.join(' · ');
  }

  // Bản 8.5: nút cam "TÌM LẠI TÀI XẾ" trên banner — mở đơn trong tab mới và tự bấm nút thật của Shopee
  function nutTimLai(o, P) {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = P + '-tn-tl';
    t.textContent = '🔄 TÌM LẠI TÀI XẾ';
    t.title = 'Shopee lấy hàng không thành công — bấm để mở đơn và bấm "Tìm lại Tài xế"';
    t.onclick = (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      t.textContent = '⏳ Đang mở đơn…';
      window.open((o.href || ('/portal/sale/order/' + o.id)) + '#' + P + '-timlai', '_blank');
      setTimeout(() => { t.textContent = '🔄 TÌM LẠI TÀI XẾ'; }, 4000);
    };
    return t;
  }

  function veTinNhanPopup(tn) {
    const ds = (tn || []).filter(coCanhBao);
    let p = document.getElementById('smh-tn-popup');

    if (!ds.length && !trangThaiTN) { if (p) p.remove(); return; }

    const chuKy = chuKyTN(ds);
    if (p && p.dataset.sig === chuKy) return;   // chưa đổi gì, khỏi vẽ lại cho đỡ giật

    if (!p) {
      p = document.createElement('div');
      p.id = 'smh-tn-popup';
      document.body.appendChild(p);
    }
    p.dataset.sig = chuKy;
    p.innerHTML = '';
    // Bản 8.3: khung ngoài lấy màu của loại gấp nhất đang có (có hoả tốc -> đỏ; chỉ có Note -> xanh dương...)
    const coLoai = new Set(ds.map(loaiChinh));
    datMau(p, THU_TU_LOAI.find((l) => coLoai.has(l)) || 'ht', '--t');

    const rows = document.createElement('div');
    rows.className = 'smh-tn-rows';
    if (ds.length) p.appendChild(rows);

    if (trangThaiTN) {
      const st = document.createElement('div');
      st.className = 'smh-tn-st' + (trangThaiTN.muc === 'hong' ? ' hong' : '');
      st.textContent = trangThaiTN.chu;
      p.appendChild(st);
    }

    ds.forEach((o) => {
      const hang = document.createElement('div');
      hang.className = 'smh-tn-r' + (o.loi ? ' loi' : '');
      datMau(hang, loaiChinh(o), '--r');   // bản 8.3: mỗi dòng mang màu loại của nó

      const nhan = [];
      if (o.ht) nhan.push(['ht', '⚡ Hoả tốc']);
      if (o.loi) nhan.push(['loi', '⚠ Chưa đọc được']);
      if (o.tn) nhan.push(['tn', '💬 Note']);
      if (o.slNhieu) nhan.push(['sl', 'SL nhiều']);
      if (o.gt) nhan.push(['gt', 'Giá trị cao']);
      nhan.forEach(([loai, chu]) => {
        const n = document.createElement('span');
        n.className = 'smh-tn-nh ' + loai;
        n.textContent = chu;
        hang.appendChild(n);
      });

      const a = document.createElement('a');
      a.className = 'smh-tn-ma';
      a.textContent = o.ma || (o.id ? 'Đơn ' + o.id : '(chưa rõ mã đơn)');
      if (o.href) {
        a.href = o.href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.title = 'Mở đơn này trong tab mới';
      }
      hang.appendChild(a);

      if (o.ma) {
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'smh-tn-cp';
        c.textContent = '⧉';
        c.title = 'Copy mã đơn ' + o.ma;
        c.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); chepMa(o.ma, c); };
        hang.appendChild(c);
      }
      if (o.timLai) hang.appendChild(nutTimLai(o, 'smh'));

      const noi = document.createElement('span');
      noi.className = 'smh-tn-t';
      noi.textContent = chiTietDong(o);
      hang.appendChild(noi);
      if (o.tn) {
        // Bản 8.2: Note xuống dòng riêng, ô nền xanh dương nhạt như ô "Tin nhắn" của Shopee
        const nt = document.createElement('div');
        nt.className = 'smh-tn-note';
        const b = document.createElement('b');
        b.textContent = 'Tin nhắn: ';
        nt.appendChild(b);
        nt.appendChild(document.createTextNode(o.tn));
        hang.appendChild(nt);
      }

      rows.appendChild(hang);
    });

    // Tự kiểm tra hiển thị: nhiều dòng quá phải cuộn thì báo rõ còn dòng bị che
    if (ds.length) requestAnimationFrame(() => {
      if (rows.scrollHeight > rows.clientHeight + 4) {
        const m = document.createElement('div');
        m.className = 'smh-tn-them';
        m.textContent = '▼ Tổng ' + ds.length + ' đơn cần chú ý — cuộn trong khung để xem hết';
        p.insertBefore(m, rows.nextSibling);   // đặt NGOÀI vùng cuộn để luôn nhìn thấy
      }
    });
  }


  // Nhãn của 1 đơn cần chú ý — dùng chung cho banner và phần tô màu dòng đơn
  const MAU_NHAN = { ht: '#c62828', loi: '#b45309', tn: '#1565c0', sl: '#6a1b9a', gt: '#e65100' };
  // Bản 8.3: MÀU THEO LOẠI ĐƠN — nhìn màu là biết đơn thuộc trường hợp nào.
  // c = màu chính (viền, mã đơn) · n = nền nhạt · v = viền nhạt · s = màu sáng lúc nhấp nháy.
  // Đơn có nhiều loại thì lấy loại gấp nhất: Hoả tốc > Chưa đọc được > Note > SL nhiều > Giá trị cao.
  const MAU_LOAI = {
    ht:  { c: '#c62828', n: '#fdeceb', v: '#f1b5ae', s: '#ff5252' },
    loi: { c: '#b45309', n: '#fff4e2', v: '#efcd97', s: '#f59e0b' },
    tn:  { c: '#1565c0', n: '#eaf3fe', v: '#aecdf2', s: '#42a5f5' },
    sl:  { c: '#6a1b9a', n: '#f6edfb', v: '#d6bbe8', s: '#ab47bc' },
    gt:  { c: '#e65100', n: '#fff2e7', v: '#f5c49a', s: '#ff9800' }
  };
  const THU_TU_LOAI = ['ht', 'loi', 'tn', 'sl', 'gt'];
  function loaiChinh(o) {
    const nh = nhanCua(o);
    return nh.length ? nh[0][0] : 'ht';
  }
  function datMau(el, loai, tien) {
    const m = MAU_LOAI[loai] || MAU_LOAI.ht;
    el.style.setProperty(tien + 'c', m.c);
    el.style.setProperty(tien + 'n', m.n);
    el.style.setProperty(tien + 'v', m.v);
    el.style.setProperty(tien + 's', m.s);
  }
  function nhanCua(o) {
    const nhan = [];
    if (o.ht) nhan.push(['ht', '⚡ Hoả tốc']);
    if (o.timLai) nhan.push(['tl', '🔄 Tìm lại tài xế']);
    if (o.loi) nhan.push(['loi', '⚠ Chưa đọc được']);
    if (o.tn) nhan.push(['tn', '💬 Note']);
    if (o.slNhieu) nhan.push(['sl', 'SL nhiều']);
    if (o.gt) nhan.push(['gt', 'Giá trị cao']);
    return nhan;
  }

  // Đơn đã có mã vận đơn nhưng QUÁ HẠN bàn giao mà shipper chưa tới lấy: hiện
  // khung cam nhấp nháy kèm danh sách mã đơn. Chưa quá hạn thì chỉ hiện số ở chân bảng.
  function veChuaBanGiao(body, bg) {
    if (!bg || !bg.qh) return;
    const h = document.createElement('div');
    h.className = 'smh-bg';

    const t = document.createElement('div');
    t.className = 'smh-bg-h';
    t.textContent = '⚠ ' + bg.qh + '/' + bg.n + ' ĐƠN QUÁ HẠN BÀN GIAO';
    h.appendChild(t);

    (bg.ds || []).slice(0, 12).forEach((o) => {
      const r = document.createElement('div');
      r.className = 'smh-bg-i';
      const a = document.createElement('a');
      a.className = 'smh-bg-ma';
      a.textContent = o.ma || '(chưa rõ mã đơn)';
      if (o.href) { a.href = o.href; a.target = '_blank'; a.rel = 'noopener'; }
      r.appendChild(a);
      if (o.ma) {
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'smh-tn-cp';
        c.textContent = '⧉ Copy mã';
        c.title = 'Copy mã đơn ' + o.ma;
        c.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); chepMa(o.ma, c); };
        r.appendChild(c);
      }
      if (o.luc) {
        const g = document.createElement('span');
        g.className = 'smh-bg-gio';
        g.textContent = 'đơn lúc ' + gioNgan(new Date(o.luc));
        r.appendChild(g);
      }
      h.appendChild(r);
    });

    if ((bg.ds || []).length > 12) {
      const m = document.createElement('div');
      m.className = 'smh-bg-gio';
      m.textContent = '… và ' + (bg.ds.length - 12) + ' đơn nữa';
      h.appendChild(m);
    }
    body.appendChild(h);
  }

  function tronDen(hex, t) {
    const n = parseInt(String(hex).slice(1), 16);
    const f = (x) => Math.round(x * (1 - t));
    return 'rgb(' + f((n >> 16) & 255) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')';
  }
  const mauNen = (m) => m.ht
    ? 'linear-gradient(135deg,#e53935,#b71c1c)'
    : 'linear-gradient(135deg,' + mauCua(m.ten) + ',' + tronDen(mauCua(m.ten), 0.16) + ')';

  function chip(cha, loai, chu) {
    const c = document.createElement('span');
    c.className = 'smh-chip' + (loai ? ' ' + loai : '');
    c.textContent = chu;
    cha.appendChild(c);
  }

  function veNut(body, ds, d) {
    body.innerHTML = '';
    if (d && d.cheDo === 'cu') {
      const t = document.createElement('div');
      t.className = 'smh-bao';
      t.textContent = '⚠ Chế độ dự phòng: API Shopee đang lỗi nên chỉ đếm được số đơn — ' +
        'chưa có tên phân loại và Note. Script vẫn tự thử lại API.';
      body.appendChild(t);
    }
    if (!ds.length && !(d && d.thieuCT)) {
      const t = document.createElement('div');
      t.className = 'smh-trong' + (d ? '' : ' cho');
      t.textContent = d ? '✓ Không có đơn nào cần in' : 'Đang đọc số đơn…';
      body.appendChild(t);
    }
    ds.forEach((m) => {
      const laHT = !!m.ht;
      const laQH = m.qh > 0;
      const chuaRo = !m.ten;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'smh-btn' + ((laHT || laQH) ? ' gap' : (NHAP_NHAY_KHI_CO_DON && !dangDoc ? ' nhip' : ''));
      b.style.background = chuaRo ? '#757575' : mauNen(m);

      const trai = document.createElement('div');
      trai.className = 'smh-trai';
      const dau = document.createElement('div');
      dau.className = 'smh-dau';
      const ten = document.createElement('span');
      ten.className = 'smh-ten';
      ten.textContent = chuaRo ? 'Chưa rõ ĐVVC' : (laHT ? '⚡ ' : '') + m.ten;
      dau.appendChild(ten);
      if (laHT) chip(dau, '', 'HOẢ TỐC');
      if (laQH) chip(dau, 'qh', '⚠ ' + m.qh + ' quá hạn');
      if (m.tn) chip(dau, 'tn', '💬 ' + m.tn + ' Note');
      if (m.sl) chip(dau, 'sl', 'SL nhiều');
      if (m.gt) chip(dau, 'gt', 'Giá trị cao');
      trai.appendChild(dau);

      if (laHT && m.don && m.don.length) {
        // Bản 8.3: đơn hoả tốc ghi từng đơn — "mã đơn · mã hàng xSL"
        const hop = document.createElement('div');
        hop.className = 'smh-sku';
        m.don.forEach((dn) => {
          const dg = document.createElement('span');
          dg.className = 'smh-dong';
          const md = document.createElement('span');
          md.className = 'smh-mad';
          md.textContent = dn.ma || '?';
          dg.appendChild(md);
          dg.appendChild(document.createTextNode(' '));
          (dn.hang.length ? dn.hang : [{ v: '⚠ chưa rõ sản phẩm', n: 0 }]).forEach((x, i) => {
            if (i) dg.appendChild(document.createTextNode(', '));
            dg.appendChild(document.createTextNode(x.v + ' '));
            if (x.n) {
              const sl = document.createElement('span');
              sl.className = 'smh-sl' + (x.n >= 2 ? ' nhieu' : '');
              sl.textContent = 'x' + x.n;
              dg.appendChild(sl);
            }
          });
          hop.appendChild(dg);
        });
        trai.appendChild(hop);
      } else if (m.sp && m.sp.length) {
        // Sắp theo ĐƠN GIÁ cao → thấp (giá lấy thẳng từ đơn). Chưa biết giá xếp cuối.
        const xep = m.sp.slice().sort((a, c) => {
          const ga = a.gia, gc = c.gia;
          if (ga === null && gc === null) return c.n - a.n;
          if (ga === null) return 1;
          if (gc === null) return -1;
          return gc - ga || c.n - a.n;
        });
        const hien = (TOI_DA_DONG_SP > 0 && xep.length > TOI_DA_DONG_SP) ? xep.slice(0, TOI_DA_DONG_SP) : xep;
        const hop = document.createElement('div');
        hop.className = 'smh-sku';
        hien.forEach((x) => {
          const gia = x.gia;
          const dat = gia !== null && gia >= NGUONG_HANG_DAT;
          const hiem = gia !== null && gia >= NGUONG_HANG_HIEM;
          const dg = document.createElement('span');
          dg.className = 'smh-dong' + (dat ? ' dat' : '') + (hiem ? ' hiem' : '');
          const ma = document.createElement('span');
          ma.textContent = x.v + ' ';
          const sl = document.createElement('span');
          sl.className = 'smh-sl' + (x.n >= 2 ? ' nhieu' : '');   // x2 trở lên thì to hẳn
          sl.textContent = 'x' + x.n;
          dg.appendChild(ma); dg.appendChild(sl);
          if (hiem) dg.title = 'Hàng giá rất cao (' + gia.toLocaleString('vi-VN') + 'đ) — kiểm tồn trước khi nhận soạn';
          else if (dat) dg.title = 'Hàng giá trị cao: ' + gia.toLocaleString('vi-VN') + 'đ';
          hop.appendChild(dg);
        });
        if (hien.length < xep.length) {
          const dg = document.createElement('span');
          dg.className = 'smh-dong';
          dg.textContent = '… và ' + (xep.length - hien.length) + ' loại khác';
          hop.appendChild(dg);
        }
        trai.appendChild(hop);
      } else {
        // Không bịa tên hàng. Nhưng cũng không im lặng: nói rõ là chưa có.
        const canh = document.createElement('span');
        canh.className = 'smh-canh';
        canh.textContent = d && d.cheDo === 'cu' ? 'Chế độ dự phòng — chưa có tên phân loại'
                                                 : '⚠ chưa đọc được sản phẩm — bấm ⟳ để thử lại';
        trai.appendChild(canh);
      }

      const so = document.createElement('span');
      so.className = 'smh-so';
      so.innerHTML = '<span class="smh-con"></span><span class="smh-dv">đơn</span>';
      so.querySelector('.smh-con').textContent = String(m.n);

      b.appendChild(trai);
      b.appendChild(so);
      if (chuaRo) {
        b.disabled = true;
        b.dataset.khoa = '1';
        b.title = 'Sàn chưa trả tên đơn vị vận chuyển của ' + m.n + ' đơn này — in tay trên trang Giao Hàng Loạt';
      } else {
        const ghi = [];
        if (laQH) ghi.push(m.qh + ' đơn QUÁ HẠN');
        b.title = 'In ' + m.n + ' đơn ' + (laHT ? 'HOẢ TỐC ' : 'thường ') + m.ten + (ghi.length ? ' — ' + ghi.join(', ') : '');
        b.onclick = () => batDau(m.ten, laHT);
      }
      body.appendChild(b);
    });
    if (d && d.thieuCT) {
      const t = document.createElement('div');
      t.className = 'smh-bao';
      t.textContent = '⚠ ' + d.thieuCT + ' đơn chưa đọc được chi tiết nên chưa xếp vào nút in — đang tự thử lại';
      body.appendChild(t);
    }
    veChuaBanGiao(body, (d && d.bg) || null);
  }

  /* ---------- Đèn trạng thái (bản 8.0) ----------
     Xanh = mọi thứ ổn · Cam = có điều cần để ý (đọc chưa trọn vẹn, số hơi cũ,
     đang dùng cách dự phòng) · Đỏ = hỏng (mất đăng nhập, lâu không cập nhật). */
  function trangThaiDen() {
    const d = soHienTai;
    if (loiCuoi && loiCuoi.matDN) return { mau: 'do', chu: 'Mất đăng nhập Shopee — đăng nhập lại' };
    if (!d || !d._ts) return { mau: soLanAPIHong ? 'cam' : 'xam', chu: soLanAPIHong ? 'Chưa đọc được lần nào — đang thử lại' : 'Đang đọc lần đầu…' };
    const phut = (Date.now() - d._ts) / 60000;
    if (phut >= 5) return { mau: 'do', chu: 'Đã ' + Math.round(phut) + ' phút chưa cập nhật được số đơn' };
    if (trangThaiTN && trangThaiTN.muc === 'hong') return { mau: 'do', chu: trangThaiTN.chu.replace(/^⚠\s*/, '') };
    if (d.cheDo === 'cu') return { mau: 'cam', chu: 'API Shopee lỗi — đang đếm bằng cách dự phòng (không có Note, tên phân loại)' };
    if (soLanAPIHong) return { mau: 'cam', chu: 'Lần đọc gần nhất bị lỗi (' + soLanAPIHong + ' lần liền) — đang thử lại' };
    if (phut >= 2) return { mau: 'cam', chu: 'Số đơn đã ' + Math.round(phut) + ' phút chưa cập nhật' };
    if (d.thieuCT) return { mau: 'cam', chu: d.thieuCT + ' đơn chưa đọc được chi tiết — đang thử lại' };
    if (trangThaiTN) return { mau: 'cam', chu: trangThaiTN.chu.replace(/^⚠\s*/, '') };
    const t = new Date(d._ts);
    return { mau: 'xanh', chu: 'Mọi thứ ổn — đọc lúc ' + hai(t.getHours()) + ':' + hai(t.getMinutes()) };
  }

  /* ---------- Số đơn trên tên tab (bản 8.0) ----------
     "[7] ⚡1 💬2 · Shopee…": 7 đơn chờ in, 1 đơn hoả tốc, 2 đơn có Note —
     để ở tab khác vẫn liếc thấy. */
  const TIEN_TO_TAB = /^\[\d+\](?: ⚡\d+)?(?: 💬\d+)? · /;
  function datTieuDe() {
    try {
      if (location.pathname.indexOf('/awbprint') === 0) return;
      const goc = document.title.replace(TIEN_TO_TAB, '');
      const d = soHienTai;
      let tien = '';
      if (d && d._ts) {
        const ht = donHoaToc(d);
        const tn = (d.tn || []).filter((o) => o.tn).length;
        tien = '[' + tongDon(d) + ']' + (ht ? ' ⚡' + ht : '') + (tn ? ' 💬' + tn : '') + ' · ';
      }
      if (document.title !== tien + goc) document.title = tien + goc;
    } catch (e) {}
  }

  /* ---------- Tô màu dòng đơn trên trang Giao Hàng Loạt (bản 8.0) ----------
     Đã thử thật: mỗi đơn là 1 khối ".mass-ship-card", trong có link
     "/portal/sale/order/<order_id>". Đơn nào đang hiện trên banner thì khối đó
     được tô nền hồng + vạch màu bên trái + nhãn ngay dưới mã đơn.
     Chỉ thêm màu và nhãn, không sửa/bấm gì của trang. */
  // Bản 8.2: trang Đơn hàng (portal/sale/order) — mỗi đơn là 1 khối "a.order-card" có link
  // "/portal/sale/order/<order_id>" (đã kiểm thật 29/09). Đơn cần chú ý: nền hồng + vạch đỏ
  // bên trái + nhãn ngay cạnh "Mã đơn hàng". Chỉ thêm màu, không sửa/bấm gì của trang.
  function danhDauTheDon(map) {
    document.querySelectorAll('a.order-card').forEach((card) => {
      const id = ((card.getAttribute('href') || '').match(/\/order\/(\d+)/) || [])[1];
      const o = id ? map[id] : null;
      const nhan = o ? nhanCua(o) : [];
      const sig = nhan.length ? id + ':' + nhan.map((n) => n[0]).join(',') : '';
      const cu = card.querySelector('.smh-mk-tags');
      if ((card.dataset.smhMk2 || '') === sig && (!sig ? !cu && !card.classList.contains('smh-mk2')
                                                   : cu && card.classList.contains('smh-mk2'))) return;
      card.dataset.smhMk2 = sig;
      if (cu) cu.remove();
      if (!sig) { card.classList.remove('smh-mk2'); return; }
      card.classList.add('smh-mk2');
      datMau(card, nhan[0][0], '--smh-');
      const b = document.createElement('span');
      b.className = 'smh-mk-tags';
      nhan.forEach(([l, c]) => { const x = document.createElement('span'); x.className = l; x.textContent = c; b.appendChild(x); });
      if (o.tn) b.title = 'Note của khách: ' + o.tn;
      (card.querySelector('.order-identifiers') || card.querySelector('.order-card-header') || card).appendChild(b);
    });
  }

  function danhDauHang() {
    if (!document.body) return;
    if (/^\/portal\/sale\/order\/?$/.test(location.pathname)) {
      const m = {};
      ((soHienTai && soHienTai.tn) || []).filter(coCanhBao).forEach((o) => { if (o.id) m[String(o.id)] = o; });
      danhDauTheDon(m);
      return;
    }
    if (location.pathname.indexOf(TRANG_GHL) !== 0) return;
    const map = {};
    ((soHienTai && soHienTai.tn) || []).filter(coCanhBao).forEach((o) => { if (o.id) map[String(o.id)] = o; });
    document.querySelectorAll('.mass-ship-card').forEach((card) => {
      const a = card.querySelector('a[href*="/portal/sale/order/"]');
      const id = a ? ((a.getAttribute('href') || '').match(/\/order\/(\d+)/) || [])[1] : null;
      const o = id ? map[id] : null;
      const nhan = o ? nhanCua(o) : [];
      // Bản 8.3: dưới mã đơn chỉ còn nhãn Hoả tốc / SL nhiều / Giá trị cao. Note và
      // "chưa đọc được" đã có ô riêng bên dưới nên KHÔNG lặp chữ thêm 1 lần nữa.
      const nhanNho = nhan.filter((n) => n[0] !== 'tn' && n[0] !== 'loi');
      const canDai = !!(o && (o.tn || o.loi));      // có ô Note ngang dưới hàng đơn
      const sig = nhan.length ? id + ':' + nhan.map((n) => n[0]).join(',') + ':' + ((o && o.tn) || '') : '';
      const dangCo = card.querySelector('.smh-mk-b');
      const daiCu = card.querySelector('.smh-mk-note');
      if ((card.dataset.smhMk || '') === sig &&
          card.classList.contains('smh-mk') === !!sig &&
          !!dangCo === !!(sig && nhanNho.length) && !!daiCu === !!(sig && canDai)) {
        if (daiCu) canhLe(card, a, daiCu);
        return;
      }
      card.dataset.smhMk = sig;
      if (dangCo) dangCo.remove();
      card.querySelectorAll('.smh-mk-note').forEach((x) => x.remove());
      if (!sig) {
        card.classList.remove('smh-mk');
        ['c', 'n', 'v', 's'].forEach((k) => card.style.removeProperty('--smh-' + k));
        return;
      }
      card.classList.add('smh-mk');
      datMau(card, nhan[0][0], '--smh-');
      if (nhanNho.length) {
        const b = document.createElement('div');
        b.className = 'smh-mk-b';
        nhanNho.forEach(([loai, chu]) => {
          const s = document.createElement('span');
          s.className = loai;
          s.textContent = chu;
          b.appendChild(s);
        });
        (card.querySelector('.order-id-column') || a.parentElement || card).appendChild(b);
      }
      // Ô Note xanh dương nhạt nằm ngang dưới hàng đơn, thẳng cột với mã đơn.
      // Đơn chưa đọc được chi tiết thì ô cam nhắc mở đơn xem, không để trống.
      if (canDai) {
        const n = document.createElement('div');
        n.className = 'smh-mk-note' + (o.tn ? '' : ' loi');
        const t = document.createElement('b');
        t.textContent = o.tn ? '💬 Note: ' : '⚠ ';
        n.appendChild(t);
        n.appendChild(document.createTextNode(o.tn || 'Chưa đọc được nội dung đơn — bấm mã đơn để mở và xem Note'));
        card.appendChild(n);
        canhLe(card, a, n);
      }
    });
  }

  // Bản 8.3: ô Note bắt đầu thẳng cột "Mã đơn hàng" (không nằm dưới ô tick / ảnh sản phẩm)
  function canhLe(card, a, n) {
    try {
      const cot = card.querySelector('.order-id-column') || (a && a.parentElement);
      if (!cot) return;
      const x = Math.round(cot.getBoundingClientRect().left - card.getBoundingClientRect().left);
      const ml = (x > 20 && x < card.clientWidth * 0.6 ? x : 44) + 'px';
      if (n.style.marginLeft !== ml) n.style.marginLeft = ml;
    } catch (e) {}
  }

  function theoDoiBangDon() {
    let hen = null;
    try {
      new MutationObserver(() => {
        if (hen || !(location.pathname.indexOf(TRANG_GHL) === 0 || /^\/portal\/sale\/order\/?$/.test(location.pathname))) return;
        hen = setTimeout(() => { hen = null; try { danhDauHang(); } catch (e) {} }, 250);
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) { log('Không theo dõi được bảng đơn:', e.message); }
  }

  /* ---------- Nút 📋 Báo lỗi (chỉ có ở máy Cao) ---------- */
  function noiDungBaoLoi() {
    luuLog();
    let dong = [];
    try { dong = JSON.parse(localStorage.getItem(KEY_LOG) || '[]'); } catch (e) {}
    const d = soHienTai || {};
    const bg = d.bg || { n: 0, qh: 0 };
    const den = trangThaiDen();
    let shopId = '';
    try { shopId = localStorage.getItem(KEY_SHOP) || ''; } catch (e) {}
    const now = new Date();
    return [
      '=== BÁO LỖI – IN ĐƠN SHOPEE ' + PHIEN_BAN + ' ===',
      'Lúc: ' + hai(now.getHours()) + ':' + hai(now.getMinutes()) + ':' + hai(now.getSeconds()) + ' ' +
        hai(now.getDate()) + '/' + hai(now.getMonth() + 1) + '/' + now.getFullYear(),
      'Shop: ' + (tenShop || '?') + ' (' + shopId + ') · Trang: ' + location.pathname,
      'Đèn: ' + den.mau + ' — ' + den.chu,
      'Cách đọc: ' + (d.cheDo === 'cu' ? 'DỰ PHÒNG (khung ẩn)' : 'API') +
        ' · API lỗi liên tiếp: ' + soLanAPIHong + (loiCuoi ? ' · lỗi gần nhất: ' + loiCuoi.chu : ''),
      'Số đơn lúc: ' + (d._ts ? gioNgan(new Date(d._ts)) : 'chưa đọc được') +
        ' · Đang đọc: ' + (dangDoc ? 'có' : 'không') + ' · Đang in: ' + (dangChay ? 'có' : 'không'),
      'Nút in: ' + tomTat(d.ds) + (d.thieuCT ? ' · chưa đọc được ' + d.thieuCT + ' đơn' : ''),
      'Banner: ' + (d.tn || []).filter(coCanhBao).length + ' đơn' + (trangThaiTN ? ' · ' + trangThaiTN.chu : ''),
      'Chờ shipper lấy: ' + bg.n + ' (quá hạn ' + bg.qh + ')',
      'Trình duyệt: ' + navigator.userAgent.slice(0, 140),
      '--- Nhật ký ' + dong.length + ' dòng gần nhất ---'
    ].concat(dong).join('\n');
  }

  function chepBaoLoi(nut) {
    const van = noiDungBaoLoi();
    const xong = () => {
      nut.classList.add('ok');
      nut.textContent = '✓';
      trangThai('📋 Đã copy báo lỗi — dán (Ctrl+V) gửi Claude', '#1a9e5a');
      setTimeout(() => {
        nut.classList.remove('ok');
        nut.textContent = '📋';
        if (elStatus && !dangChay) { delete elStatus.dataset.busy; elStatus.textContent = ''; }
      }, 4000);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(van).then(xong, () => chepTay(van, xong));
        return;
      }
    } catch (e) {}
    chepTay(van, xong);
  }

  function veSo() {
    veHuyHieu();
    datTieuDe();
    // Popup tin nhắn tách riêng khỏi bảng in đơn, phải vẽ độc lập với bảng luôn
    // mở hay đang thu gọn, nên không được return sớm trước dòng này.
    veTinNhanPopup((soHienTai && soHienTai.tn) || []);
    try { danhDauHang(); } catch (e) {}
    if (!elPanel) return;
    const d = soHienTai;
    const body = elPanel.querySelector('.smh-body');

    const ds = (d && Array.isArray(d.ds) ? d.ds : [])
      .filter((x) => x.n > 0)
      .sort((a, b) => (b.ht ? 1 : 0) - (a.ht ? 1 : 0) || (b.qh > 0) - (a.qh > 0) ||
                      (thuTuCua(a.ten) - thuTuCua(b.ten)) || (b.n - a.n));

    const sig = JSON.stringify(ds) + '#' + dangDoc + '#' + (d ? 1 : 0) + '#' + (d ? d.cheDo + d.thieuCT : '') +
                '#' + JSON.stringify((d && d.bg) || {});
    // Đang chạy quy trình in thì giữ nguyên nút, không dựng lại giữa chừng
    if (body.dataset.sig !== sig && !dangChay) {
      body.dataset.sig = sig;
      veNut(body, ds, d);
    }
    body.className = 'smh-body' + (dangDoc ? ' dangdoc' : '');

    // Đầu bảng: đèn, tên Shop, nút đọc lại đang xoay
    const den = trangThaiDen();
    const elDen = elPanel.querySelector('.smh-den');
    elDen.className = 'smh-den ' + den.mau;
    elDen.title = den.chu;
    elPanel.querySelector('.smh-shop').textContent = tenShop;
    const rf = elPanel.querySelector('.smh-rf');
    rf.classList.toggle('xoay', dangDoc);
    rf.title = dangDoc ? 'Đang kiểm tra…' : 'Đọc lại số đơn ngay';

    // Chân bảng: chờ shipper lấy + giờ cập nhật
    const bg = (d && d.bg) || { n: 0, qh: 0 };
    const pill = elPanel.querySelector('.smh-pill');
    pill.className = 'smh-pill' + (bg.qh ? ' qh' : '');
    pill.textContent = bg.n ? (bg.qh ? '⚠ ' + bg.qh + '/' + bg.n + ' quá hạn bàn giao' : '🚚 Chờ shipper lấy: ' + bg.n) : '';
    const gio = elPanel.querySelector('.smh-gio');
    if (dangDoc) {
      gio.className = 'smh-gio dang';
      gio.textContent = '⟳ Đang kiểm tra…';
    } else if (d && d._ts) {
      const t = new Date(d._ts);
      const phut = Math.round((Date.now() - d._ts) / 60000);
      const hhmm = hai(t.getHours()) + ':' + hai(t.getMinutes());
      gio.className = 'smh-gio' + (phut >= 5 ? ' cu' : '');
      gio.textContent = phut >= 5 ? '⚠ ' + hhmm + ' — ' + phut + ' phút chưa cập nhật' : '✓ Cập nhật ' + hhmm;
    } else {
      gio.className = 'smh-gio dang';
      gio.textContent = 'Chưa đọc';
    }

    // Dòng tiến trình: lúc đang in thì trangThai() giữ chỗ này; không in thì hiện
    // thông báo "Vừa cập nhật: SPX 3→4" trong 8 giây rồi tự ẩn.
    if (elStatus && !elStatus.dataset.busy) {
      if (tinDoiSo && tinDoiSo.doi && Date.now() - tinDoiSo.ts < 8000) {
        elStatus.textContent = tinDoiSo.txt;
        elStatus.style.color = '#1565c0';
        clearTimeout(henVeLai);              // tránh dồn hàng chục bộ đếm giờ
        henVeLai = setTimeout(veSo, 8200);
      } else {
        elStatus.textContent = '';
      }
    }
  }

  /* ---------- Menu tạo phiếu ---------- */

  // Các dòng trong menu "Tạo" (chỉ lấy dòng có chữ "Phiếu"/"PDF" để không nhầm với
  // menu khác trên trang như "50 / Trang").
  function dongPhieu() {
    return Array.from(document.querySelectorAll('li.eds-dropdown-item, .eds-dropdown-item, [role="menuitem"]'))
      .filter((e) => /Phiếu|PDF/i.test(e.textContent || ''));
  }
  // Chọn dòng cần bấm: ưu tiên đúng "Phiếu gửi hàng và Phiếu đóng gói" như trước.
  // Bản 7.2: đơn hoả tốc / Shop khác có thể có menu khác chữ -> chọn dòng gần nghĩa
  // nhất, và nếu không có dòng nào hợp thì DỪNG, ghi rõ menu đang có những dòng gì.
  const THU_TU_UU_TIEN = [/Phiếu gửi hàng và Phiếu đóng gói/i, /Phiếu gửi hàng/i, /Phiếu giao hàng/i];
  function chonDongIn(ds) {
    for (const re of THU_TU_UU_TIEN) {
      const hop = ds.filter((e) => re.test(e.textContent || ''));
      if (hop.length) return hop.find(nhinThay) || hop[0];
    }
    return null;
  }
  function dongPDF() {
    const d = chonDongIn(dongPhieu());
    return d ? [d] : [];
  }
  const dongPDFDangHien = () => dongPDF().find(nhinThay) || null;

  // Trước đây bước này ngốn tới 17 giây. Lý do: Shopee DỰNG dòng menu ngay khi
  // bấm "Tạo" nhưng không phải lúc nào cũng cho nó hiện ra. Script cũ chờ đến khi
  // "nhìn thấy được" — chờ hụt 4 giây rồi bấm "Tạo" lần nữa, mà bấm lần nữa là
  // đóng menu lại. Cứ thế mở–đóng bốn lượt mới xong.
  // Giờ chỉ chờ dòng menu CÓ MẶT trong trang là bấm, vì bấm vào nó vẫn ăn
  // kể cả khi nó chưa bung ra.
  async function moMenuTaoPhieu(nutTao) {
    const t0 = Date.now();
    const xong = (dong) => {
      log('Mở menu tạo phiếu mất ' + (Date.now() - t0) + 'ms');
      return dong;
    };

    const dangMo = dongPDFDangHien();
    if (dangMo) return xong(dangMo);

    const coDong = () => (dongPhieu().length ? true : null);
    nutTao.click();
    try {
      await doiCho(coDong, { timeout: 6000, moi: 120, ten: 'dòng menu tạo phiếu' });
    } catch (e) {
      log('Menu chưa dựng, bấm "Tạo" thêm một lần');
      nutTao.click();
      await doiCho(coDong, { timeout: 8000, moi: 120, ten: 'dòng menu tạo phiếu' });
    }

    // Có rồi thì nhường thêm chút cho nó bung ra, nhưng không chờ dai.
    for (let i = 0; i < 8; i++) {
      const h = dongPDFDangHien();
      if (h) return xong(h);
      await sleep(100);
    }
    const ds = dongPDF();
    if (ds.length) return xong(ds[0]);
    const coGi = [...new Set(dongPhieu().map((e) => (e.textContent || '').trim().replace(/\s+/g, ' ')))];
    log('Menu "Tạo" đang có các dòng:', coGi);
    throw new Error('Menu "Tạo" không có dòng "Phiếu gửi hàng và Phiếu đóng gói". ' +
      (coGi.length ? 'Menu đang có: ' + coGi.join(' | ') : 'Không thấy dòng nào trong menu.') +
      ' — anh chụp màn hình menu này gửi Claude để sửa.');
  }

  /* ---------- Chạy quy trình in ---------- */

  function batDau(tenDVVC, laHT) {
    // Bấm in lúc nào cũng được, kể cả đang đọc số.
    // Dọn khung ẩn đang chạy nền để nhường máy cho việc in.
    try {
      document.querySelectorAll('iframe[data-smh]').forEach((f) => f.remove());
    } catch (e) {}
    if (location.pathname.indexOf(TRANG_GHL) === 0) {
      chayQuyTrinh(tenDVVC, laHT);
    } else {
      try { localStorage.setItem(KEY_JOB, JSON.stringify({ ten: tenDVVC, ht: !!laHT, ts: Date.now() })); } catch (e) {}
      trangThai('Đang mở trang Giao Hàng Loạt…');
      location.href = TRANG_GHL;
    }
  }

  // Bản 8.0: đơn thường và đơn hoả tốc in RIÊNG: nút thường chọn ô "Đơn thường",
  // nút đỏ hoả tốc chọn ô "Đơn Hoả Tốc" — không bao giờ in lẫn hai loại.
  async function chayQuyTrinh(tenDVVC, laHT) {
    const loai = laHT ? 'Đơn Hoả Tốc' : 'Đơn thường';
    dangChay = true;
    mocChay = Date.now();
    khoaNut(true);
    try {
      trangThai('Lọc: Loại đơn → ' + loai + '…');
      await chonO(document, 'Loại Đơn hàng', loai);
      await sleep(600);

      trangThai('Lọc: Hạn giao hàng → Tất cả…');
      await chonO(document, 'Hạn giao hàng', 'Tất cả');
      await sleep(700);

      trangThai('Lọc: ' + (laHT ? '⚡ hoả tốc ' : '') + tenDVVC + '…');
      const o = await chonO(document, 'Đơn vị vận chuyển', tenDVVC);
      await sleep(1800);

      const n = docSo(o);
      if (n === 0) { trangThai('Không có ' + loai.toLowerCase() + ' nào của ' + tenDVVC, '#c62828'); return; }
      trangThai('Có ' + (n === null ? '?' : n) + ' đơn. Đang chọn tất cả…');

      const tick = await doiCho(
        () => document.querySelector('.mass-ship-list-header .mass-ship-header.checkbox label.eds-checkbox'),
        { ten: 'ô chọn tất cả' }
      );
      const daTick = () =>
        tick.classList.contains('eds-checkbox--checked') || !!tick.querySelector('input:checked');
      if (!daTick()) { tick.click(); await sleep(1000); }

      const nutGui = await doiCho(
        () => { const b = timNut('Yêu cầu đơn vị vận chuyển đến lấy hàng'); return b && !b.disabled ? b : null; },
        { ten: 'nút "Yêu cầu đơn vị vận chuyển đến lấy hàng" (bật)' }
      );

      if (HOI_TRUOC_KHI_GUI) {
        const ok = confirm(
          'IN ĐƠN – ' + (laHT ? 'HOẢ TỐC ' : '') + tenDVVC + '\n\n' +
          'Sắp gửi yêu cầu lấy hàng cho ' + (n === null ? 'các' : n) + ' đơn.\n' +
          'Thao tác này KHÔNG hoàn tác được.\n\nTiếp tục?'
        );
        if (!ok) { trangThai('Đã huỷ.', '#c62828'); return; }
      }

      trangThai('Đang gửi yêu cầu lấy hàng…');
      nutGui.click();
      trangThai('Đang chờ Shopee tạo mã vận đơn…');

      let chuKy = null, onDinhTu = 0;
      const ketQua = await doiCho(
        () => {
          const txt = document.body.innerText;
          const m = txt.match(/thành công cho\s*(\d+)\s*\/\s*(\d+)\s*đơn hàng/i);
          if (!m) { chuKy = null; return null; }
          const nut = Array.from(document.querySelectorAll('button')).find(
            (b) => b.textContent.trim().replace(/\s+/g, ' ').startsWith('Tạo') && nhinThay(b)
          );
          if (!nut || nut.disabled) { chuKy = null; return null; }
          const ok = parseInt(m[1], 10), tong = parseInt(m[2], 10);
          const sig = ok + '/' + tong, now = Date.now();
          if (sig !== chuKy) {
            chuKy = sig; onDinhTu = now;
            trangThai('Đang tạo mã vận đơn: ' + sig + '…');
            return null;
          }
          if (ok === tong && tong > 0) {
            if (now - onDinhTu < 800) return null;
            return { ok: ok, tong: tong, nut: nut, dayDu: true };
          }
          if (now - onDinhTu < 10000) return null;
          return { ok: ok, tong: tong, nut: nut, dayDu: false };
        },
        { timeout: 180000, moi: 200, ten: 'tất cả đơn tạo xong mã vận đơn (X phải bằng Y)' }
      );

      if (!ketQua.dayDu) {
        const tiep = confirm(
          'CHƯA ĐỦ ĐƠN\n\n' +
          'Shopee chỉ tạo được mã vận đơn cho ' + ketQua.ok + '/' + ketQua.tong + ' đơn ' +
          'và con số này đã đứng yên 10 giây — nhiều khả năng có đơn bị lỗi.\n\n' +
          'Bấm OK để in ' + ketQua.ok + ' đơn đã thành công.\n' +
          'Bấm Cancel để dừng lại và kiểm tra thủ công.'
        );
        if (!tiep) { trangThai('Đã dừng ở bước tạo phiếu.', '#c62828'); return; }
        trangThai('⚠️ In ' + ketQua.ok + '/' + ketQua.tong + ' đơn…', '#e65100');
      } else {
        trangThai('Xong toàn bộ ' + ketQua.tong + '/' + ketQua.tong + ' đơn. Đang tạo phiếu…');
      }

      await sleep(400);
      trangThai('Đang mở menu tạo phiếu…');
      const dong = await moMenuTaoPhieu(ketQua.nut);

      log('Bấm dòng menu: ' + (dong.textContent || '').trim().replace(/\s+/g, ' '));
      try { localStorage.setItem(KEY_PRINT, String(Date.now())); } catch (e) {}
      dong.click();
      await sleep(600);
      if (dongPDFDangHien()) {
        (dong.querySelector('.detail') || dong.firstElementChild || dong).click();
        await sleep(600);
      }
      trangThai('Đã bấm tạo phiếu. Đang chờ tab in mở ra…');

      // TỰ KIỂM TRA (bản 7.2): tab in phiếu khi mở ra sẽ "nhận việc" (xoá dấu KEY_PRINT).
      // Quá 20 giây mà chưa có tab nào nhận -> tab in KHÔNG mở được. Lý do hay gặp nhất
      // trên máy/Shop mới: Chrome đang chặn cửa sổ bật lên (pop-up) của Shopee.
      let daMo = false;
      for (let i = 0; i < 100; i++) {
        let con = null;
        try { con = localStorage.getItem(KEY_PRINT); } catch (e) { con = null; }
        if (!con) { daMo = true; break; }
        await sleep(200);
      }
      if (daMo) {
        trangThai('✅ Tab in đã mở ra.', '#1a9e5a');
      } else {
        try { localStorage.removeItem(KEY_PRINT); } catch (e) {}
        const loi = 'Đã bấm tạo phiếu nhưng 20 giây rồi chưa thấy tab in mở ra.\n\n' +
          'Hay gặp nhất: Chrome đang CHẶN cửa sổ bật lên của Shopee. Nhìn góc phải thanh địa chỉ, ' +
          'nếu có biểu tượng cửa sổ bị gạch đỏ thì bấm vào → chọn "Luôn cho phép banhang.shopee.vn" ' +
          '→ Xong, rồi bấm lại nút "Tạo" trên màn hình để in.\n\n' +
          'Đơn vẫn an toàn: mã vận đơn đã tạo xong, chỉ còn bước in phiếu.';
        trangThai('⚠️ Tab in chưa mở — có thể Chrome đang chặn pop-up', '#c62828');
        log('Tab in không mở trong 20 giây');
        alert(loi);
      }
    } catch (err) {
      trangThai('⚠️ ' + err.message, '#c62828');
      log('LỖI:', err);
      alert('Script dừng lại:\n\n' + err.message +
            '\n\nCó thể Shopee đổi giao diện, hoặc trang tải chậm. Anh thử lại, hoặc làm nốt bằng tay.');
    } finally {
      khoaNut(false);
      dangChay = false;
      setTimeout(() => {
        if (elStatus) delete elStatus.dataset.busy;
        docSoChuan();
      }, 8000);
    }
  }

  /* ---------- Tab xem trước bản in ---------- */

  async function tuBamInPhieu() {
    let mark = null;
    try { mark = localStorage.getItem(KEY_PRINT); } catch (e) {}
    if (!mark || Date.now() - Number(mark) > 180000) return;
    try { localStorage.removeItem(KEY_PRINT); } catch (e) {}
    log('Tab in phiếu – bấm ngay khi nút xuất hiện.');
    const b = await doiCho(
      () => Array.from(document.querySelectorAll('button,a'))
              .find((x) => /In phiếu/.test(x.textContent || '') && nhinThay(x)),
      { timeout: 60000, moi: 100, ten: 'nút "In phiếu"' }
    );
    b.click();
  }


  /* ---------- Khởi động ---------- */

  function khoiDong() {
    if (location.pathname.indexOf('/awbprint') === 0) {
      tuBamInPhieu().catch((e) => log('Tab in:', e.message));
      return;
    }

    tuBamTimLai().catch((e) => log('Tự bấm Tìm lại Tài xế lỗi:', e.message));
    try { KEY_BO_CU.forEach((k) => localStorage.removeItem(k)); } catch (e) {}
    try { soHienTai = JSON.parse(localStorage.getItem(KEY_COUNTS) || 'null'); } catch (e) {}
    try { if (soHienTai && soHienTai.ds) soHienTai.ds = soHienTai.ds.filter((m) => !laTenDieuPhoi(m.ten)); } catch (e) {}
    try {
      const t = JSON.parse(localStorage.getItem(KEY_TENSHOP) || 'null');
      if (t && t.vt && t.id === localStorage.getItem(KEY_SHOP)) tenShop = t.vt;
    } catch (e) {}

    taoPanel();
    ngheTrangShopee();
    theoDoiBangDon();
    setInterval(taoPanel, 2000);
    setInterval(docSoChuan, CHU_KY_DOC_SO);
    setInterval(veSo, 15000);     // cập nhật đèn / giờ "chưa cập nhật" dù không có gì mới

    // Bộ tự cứu: nếu một vòng đọc treo quá lâu thì gỡ kẹt, dọn khung ẩn và đọc lại.
    // Không có cái này thì chỉ cần một lệnh treo là bảng đứng hình mãi mãi.
    setInterval(() => {
      const gio = Date.now();
      if (dangDoc && mocDoc && gio - mocDoc > 120000) {
        log('Vòng đọc treo quá 2 phút — tự gỡ kẹt');
        dangDoc = false;
        try { document.querySelectorAll('iframe[data-smh]').forEach((f) => f.remove()); } catch (e) {}
        try { if (elStatus) delete elStatus.dataset.busy; } catch (e) {}
        docSoChuan();
      }
      if (dangChay && mocChay && gio - mocChay > 600000) {
        log('Quy trình in treo quá 10 phút — tự gỡ kẹt');
        dangChay = false;
        try { khoaNut(false); } catch (e) {}
      }
      // dọn khung ẩn mồ côi khi không có việc gì đang chạy
      if (!dangDoc && !dangChay) {
        try { document.querySelectorAll('iframe[data-smh]').forEach((f) => f.remove()); } catch (e) {}
      }
    }, 20000);

    const docLaiNeuCu = () => { if (Date.now() - lanDocCuoi > 15000) docSoChuan(); };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) docLaiNeuCu(); });
    window.addEventListener('focus', docLaiNeuCu);
    window.addEventListener('online', docLaiNeuCu);

    let urlCu = location.href;
    setInterval(() => {
      if (location.href !== urlCu) { urlCu = location.href; docLaiNeuCu(); }
      datTieuDe();              // Shopee đổi tên tab khi chuyển trang -> gắn lại số đơn
    }, 1500);

    let job = null;
    try { job = JSON.parse(localStorage.getItem(KEY_JOB) || 'null'); } catch (e) {}
    if (job) { try { localStorage.removeItem(KEY_JOB); } catch (e) {} }

    log('Khởi động bản ' + PHIEN_BAN + ' tại ' + location.pathname);
    if (location.pathname.indexOf(TRANG_GHL) === 0 && job && Date.now() - job.ts < 120000) {
      setTimeout(() => chayQuyTrinh(job.ten, !!job.ht), 3000);
      return;
    }
    // Đọc NGAY khi trang vừa tải xong (không đợi hết chu kỳ 45 giây).
    // Lần đầu lỗi (trang chưa sẵn sàng) thì đọc lại sau 6 giây.
    setTimeout(docSoChuan, 300);
    setTimeout(() => { if (!soHienTai || !soHienTai._ts || Date.now() - soHienTai._ts > 20000) docSoChuan(); }, 6000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiDong);
  } else {
    khoiDong();
  }

  /* ---------- Bản 8.7: nút "👁 Xem ngay" trên popup đơn hoả tốc ----------
     Bấm -> mở trang Giao Hàng Loạt, lọc đơn hoả tốc và TICK SẴN tất cả đơn hoả tốc đang chờ.
     Script KHÔNG bấm in / giao hàng — người dùng tự bấm. */
  const XN = { POPUP: 'smh-tn-popup', NHAN: '.smh-tn-nh.ht', KEY: 'xemngay_job_smh', P: 'smh' };
  const xnNghi = (ms) => new Promise((r) => setTimeout(r, ms));
  async function xnCho(fn, ms, ten) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await xnNghi(300); }
    throw new Error('quá ' + Math.round(ms / 1000) + ' giây chưa thấy ' + ten);
  }
  function xnBao(chu, mau) {
    let t = document.getElementById(XN.P + '-xn-tb');
    if (!t) {
      t = document.createElement('div'); t.id = XN.P + '-xn-tb';
      t.style.cssText = 'position:fixed;top:96px;left:50%;transform:translateX(-50%);z-index:2147483647;color:#fff;padding:9px 16px;border-radius:8px;font:700 14px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35);max-width:80vw';
      document.body.appendChild(t);
    }
    t.style.background = mau || '#1565c0'; t.textContent = chu;
    clearTimeout(t._h); if (mau && mau !== '#1565c0') t._h = setTimeout(function () { t.remove(); }, 15000);
  }
  // Gắn 1 nút chung vào dòng hoả tốc đầu tiên của popup (popup vẽ lại thì gắn lại)
  function xnGanNut() {
    try {
      const p = document.getElementById(XN.POPUP);
      if (!p) return;
      const nhan = p.querySelector(XN.NHAN);
      const cu = p.querySelector('.' + XN.P + '-xn');
      if (!nhan) { if (cu) cu.remove(); return; }
      const hang = nhan.parentElement;
      if (cu && cu.parentElement === hang) return;
      if (cu) cu.remove();
      const b = document.createElement('button');
      b.type = 'button'; b.className = XN.P + '-xn';
      b.textContent = '👁 Xem ngay';
      b.title = 'Mở trang đơn hoả tốc và tick sẵn tất cả đơn hoả tốc đang chờ — anh tự bấm in';
      b.style.cssText = 'margin-left:10px;border:0;border-radius:6px;padding:3px 12px;font-weight:800;font-size:13px;cursor:pointer;color:#fff;background:#1565c0;vertical-align:middle;box-shadow:0 1px 3px rgba(0,0,0,.25)';
      b.onclick = function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        b.textContent = '⏳ Đang mở…';
        try { localStorage.setItem(XN.KEY, JSON.stringify({ t: Date.now() })); } catch (e) {}
        log('Bấm "Xem ngay" trên popup hoả tốc');
        if (xnLaTrangDich()) xnChay(); else location.href = xnDuongDich();
      };
      hang.appendChild(b);
    } catch (e) {}
  }
  function xnJob() { try { const j = JSON.parse(localStorage.getItem(XN.KEY) || 'null'); return j && Date.now() - j.t < 90000 ? j : null; } catch (e) { return null; } }
  let xnDangChay = false;
  async function xnChay() {
    if (xnDangChay) return;
    xnDangChay = true;
    try { localStorage.removeItem(XN.KEY); } catch (e) {}
    try {
      xnBao('⏳ Đang lọc đơn hoả tốc…');
      const n = await xnChonHoaToc();
      if (!n) { xnBao('Không còn đơn hoả tốc nào đang chờ.', '#5b5f68'); log('Xem ngay: không có đơn hoả tốc đang chờ'); }
      else { xnBao('✔ Đã chọn ' + n + ' đơn hoả tốc — anh kiểm tra rồi tự bấm in / giao hàng', '#14853b'); log('Xem ngay: đã tick ' + n + ' đơn hoả tốc'); }
    } catch (e) { xnBao('⚠ Xem ngay chưa xong: ' + e.message + ' — anh lọc và tick tay', '#c62828'); log('Xem ngay LỖI: ' + e.message); }
    xnDangChay = false;
  }
  function xnBatDau() {
    setInterval(xnGanNut, 1000);
    if (xnJob() && xnLaTrangDich()) setTimeout(xnChay, 1500);
    else (function cho(n) { if (xnJob() && xnLaTrangDich()) { setTimeout(xnChay, 1500); return; } if (n > 0) setTimeout(function () { cho(n - 1); }, 1000); })(20);
  }

  // Shopee: Giao Hàng Loạt -> "Đơn Hoả Tốc" + hạn "Tất cả" + ĐVVC có đơn -> tick tất cả
  function xnDuongDich() { return '/portal/sale/mass/ship'; }
  function xnLaTrangDich() { return location.pathname.indexOf('/portal/sale/mass/ship') === 0; }
  function xnNhom(re) {
    return [...document.querySelectorAll('.eds-radio-group, [class*=radio-group]')].find(function (g) { return [...g.querySelectorAll('label')].some(function (l) { return re.test(l.textContent.trim()); }); });
  }
  async function xnBamRadio(g, re, ten) {
    const l = [...g.querySelectorAll('label')].find(function (x) { return re.test(x.textContent.trim()); });
    if (!l) throw new Error('không thấy lựa chọn "' + ten + '"');
    if (!l.classList.contains('checked')) { l.click(); await xnCho(function () { return l.classList.contains('checked'); }, 8000, 'lựa chọn "' + ten + '" được chọn'); await xnNghi(1200); }
  }
  const xnSo = (l) => Number((/\((\d+)\)/.exec(l.textContent) || [])[1] || 0);
  async function xnChonHoaToc() {
    const gLoai = await xnCho(function () { return xnNhom(/^Đơn Ho[aả]\s*T[oốộ]c/i); }, 20000, 'bộ lọc "Đơn Hoả Tốc"');
    const lHT = [...gLoai.querySelectorAll('label')].find(function (l) { return /^Đơn Ho[aả]\s*T[oốộ]c/i.test(l.textContent.trim()); });
    if (!xnSo(lHT)) return 0;
    await xnBamRadio(gLoai, /^Đơn Ho[aả]\s*T[oốộ]c/i, 'Đơn Hoả Tốc');
    const gHan = await xnCho(function () { return xnNhom(/^Quá hạn giao hàng/); }, 8000, 'bộ lọc Hạn giao hàng');
    await xnBamRadio(gHan, /^Tất cả/, 'Tất cả');
    // ĐVVC: Shopee chỉ cho giao loạt 1 ĐVVC mỗi lần -> giữ ĐVVC đang chọn nếu có đơn, không thì chọn ĐVVC đầu tiên có đơn
    const gVC = [...document.querySelectorAll('.eds-radio-group, [class*=radio-group]')].find(function (g) { return g !== gLoai && g !== gHan && [...g.querySelectorAll('label')].every(function (l) { return /\(\d+\)/.test(l.textContent); }); });
    if (gVC) {
      const ds = [...gVC.querySelectorAll('label')];
      const dang = ds.find(function (l) { return l.classList.contains('checked'); });
      if (!dang || !xnSo(dang)) { const co = ds.find(function (l) { return xnSo(l) > 0; }); if (co) { co.click(); await xnNghi(1500); } }
      const khac = ds.filter(function (l) { return xnSo(l) > 0 && !l.classList.contains('checked'); });
      if (khac.length) log('Xem ngay: còn đơn hoả tốc của ' + khac.map(function (l) { return l.textContent.trim(); }).join(', ') + ' — chọn ĐVVC đó để giao tiếp');
    }
    // chờ bảng đứng yên rồi tick tất cả
    let ky = '', tu = 0;
    await xnCho(function () { const n = document.querySelectorAll('.mass-ship-row').length; const k = String(n); if (k !== ky) { ky = k; tu = Date.now(); return false; } return Date.now() - tu > 1500; }, 20000, 'danh sách đơn');
    const rows = [...document.querySelectorAll('.mass-ship-row')];
    if (!rows.length) return 0;
    const hd = document.querySelector('.eds-row.content input[type=checkbox]');
    if (hd && !hd.checked) (hd.closest('label') || hd).click();
    await xnNghi(600);
    for (const r of rows) { const c = r.querySelector('input[type=checkbox]'); if (c && !c.checked) (c.closest('label') || c).click(); }
    await xnCho(function () { return rows.every(function (r) { const c = r.querySelector('input[type=checkbox]'); return c && c.checked; }); }, 6000, 'tất cả đơn được tick');
    try { rows[0].scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
    return rows.length;
  }

  setTimeout(xnBatDau, 2500);   // bản 8.7: nút Xem ngay
})();
