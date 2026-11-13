// ==UserScript==
// @name         Cao - In don tiktok
// @namespace    sonmochuong.ctt
// @version      1.5.1
// @description  Máy Cao — TikTok Shop: bảng in đơn một chạm (⚡ Hoả tốc in riêng, GHN, ĐVVC khác, J&T; đơn thường xếp tổng giá cao trước), tự bật hộp in, banner cảnh báo (hoả tốc, Note khách, Note shop, SL nhiều, giá trị cao), tô màu + dải Note trên bảng đơn, đèn trạng thái, số đơn trên tên tab, nút Báo lỗi
// @match        https://seller-vn.tiktok.com/*
// @run-at       document-start
// @noframes
// @updateURL    https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/in-don-tiktok.user.js
// @downloadURL  https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/in-don-tiktok.user.js
// @grant        none
// ==/UserScript==

/* Lưu ý cài đặt: mỗi bản có TÊN RIÊNG ("Cao - In don tiktok 1.3", "1.4"...), Tampermonkey coi là
   script khác nhau -> cài bản mới xong phải TẮT/XOÁ bản cũ. Quên tắt thì bản khởi động
   sau sẽ tự tắt và hiện dòng đỏ nhắc. */

(function () {
  'use strict';

  const PHIEN_BAN = '1.5.1';
  const TEN_SCRIPT = 'Cao - In don tiktok';

  if (window.__CAO_IN_DON_TIKTOK) {
    const banKia = 'bản ' + window.__CAO_IN_DON_TIKTOK;
    const nhac = () => {
      if (!document.body || document.getElementById('ctt-trung-ban')) return;
      const d = document.createElement('div');
      d.id = 'ctt-trung-ban';
      d.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;background:#c62828;' +
        'color:#fff;font:800 13px system-ui,sans-serif;padding:8px 12px;border-radius:8px;' +
        'box-shadow:0 4px 14px rgba(0,0,0,.3);max-width:420px;line-height:1.4';
      d.textContent = '⚠ Đang có 2 bản "' + TEN_SCRIPT + '" cùng cài: ' + banKia + ' đang chạy nên bản ' +
        PHIEN_BAN + ' KHÔNG chạy. Vào Tampermonkey tắt/xoá bản cũ rồi tải lại trang.';
      document.body.appendChild(d);
    };
    if (document.body) nhac(); else document.addEventListener('DOMContentLoaded', nhac);
    return;
  }
  window.__CAO_IN_DON_TIKTOK = PHIEN_BAN;

  /* ===================================================================
     PHẦN CÀI ĐẶT
     =================================================================== */

  // Nhịp đọc: TikTok có chặn máy móc (hộp xác minh) nên đọc THƯA hơn Shopee.
  // Mỗi lần đọc chỉ 2 lệnh (danh sách "Cần gửi" + số đếm của sàn).
  const CHU_KY_KHI_XEM  = 90000;    // tab đang mở trước mắt: 90 giây đọc 1 lần
  const CHU_KY_KHI_AN   = 300000;   // tab bị ẩn: 5 phút đọc 1 lần
  const NGHI_KHI_BI_CHAN = 600000;  // TikTok đòi xác minh / báo lỗi liên tiếp: dừng đọc 10 phút

  const NGUONG_SO_LUONG    = 10;       // 1 mã sản phẩm trong đơn có số lượng từ mức này
  const NGUONG_GIA_TRI_DON = 3000000;  // tổng tiền hàng của đơn (giá bán × SL, bỏ quà) từ mức này

  // HẠN XỬ LÝ — dùng CHUNG bộ mốc cố định với Shopee (Cao đã chốt), không dùng hạn riêng TikTok ghi
  const HAN_XL_TRONG_NGAY = 18.5;  // chưa xử lý — đơn trước 18h: hạn 18h30 cùng ngày
  const HAN_XL_HOM_SAU    = 10;    // chưa xử lý — đơn từ 18h: hạn 10h ngày làm việc kế tiếp
  const HAN_BG_TRONG_NGAY = 19;    // chưa bàn giao — 19h cùng ngày
  const HAN_BG_HOM_SAU    = 11.5;  // chưa bàn giao — 11h30 ngày làm việc kế tiếp

  
  const NGUONG_HANG_DAT  = 1000000;   // mã hàng có đơn giá từ mức này: đóng khung
  const NGUONG_HANG_HIEM = 3000000;   // từ mức này: nhấp nháy, kiểm tồn trước khi soạn
  // Thứ tự nút (Cao chốt): ⚡ Hoả tốc → GHN → ĐVVC khác → J&T Express
  const MAU_GHN   = '#2f6fb5';
  const MAU_JT    = '#ef6c00';
  const MAU_KHAC  = '#00897b';
  

  /* =================================================================== */

  const APP_ID = '4068';        // mã ứng dụng Seller Center VN (đã thấy trong mọi lệnh của trang)
  const KEY = {
    shop: 'ctt_SHOP_V1',
    so: 'ctt_SO_V1',
    log: 'ctt_LOG_V1',
    thuGon: 'ctt_THUGON',
    job: 'ctt_JOB_V1'
  };
  const TRANG_DON = '/order';

  const hai = (n) => (n < 10 ? '0' : '') + n;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const gioNgan = (d) => !d ? '' : hai(d.getHours()) + ':' + hai(d.getMinutes()) + ' ' + hai(d.getDate()) + '/' + hai(d.getMonth() + 1);
  const hhmm = (t) => { const d = new Date(t); return hai(d.getHours()) + ':' + hai(d.getMinutes()); };

  /* ---------- Nhật ký ---------- */
  let logCho = [], henLuuLog = null;
  function chuLog(a) {
    return a.map((x) => {
      if (x instanceof Error) return x.message;
      if (x && typeof x === 'object') { try { return JSON.stringify(x); } catch (e) { return String(x); } }
      return String(x);
    }).join(' ').slice(0, 300);
  }
  function luuLog() {
    henLuuLog = null;
    if (!logCho.length) return;
    try {
      let cu = JSON.parse(localStorage.getItem(KEY.log) || '[]');
      if (!Array.isArray(cu)) cu = [];
      localStorage.setItem(KEY.log, JSON.stringify(cu.concat(logCho).slice(-300)));
    } catch (e) {}
    logCho = [];
  }
  const log = (...a) => {
    console.log('%c[' + TEN_SCRIPT + ' ' + PHIEN_BAN + ']', 'color:#ee4d2d;font-weight:bold', ...a);
    try {
      const d = new Date();
      logCho.push(hai(d.getDate()) + '/' + hai(d.getMonth() + 1) + ' ' + hai(d.getHours()) + ':' +
                  hai(d.getMinutes()) + ':' + hai(d.getSeconds()) + ' ' + chuLog(a));
      if (!henLuuLog) henLuuLog = setTimeout(luuLog, 2000);
    } catch (e) {}
  };

  /* ---------- Hạn xử lý ---------- */
  const laChuNhat = (d) => d.getDay() === 0;
  function ngayLamViec(y, thang, ngay) {
    const d = new Date(y, thang, ngay);
    while (laChuNhat(d)) d.setDate(d.getDate() + 1);
    return d;
  }
  function datGio(d, gio) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(gio), Math.round((gio % 1) * 60), 0);
  }
  function tinhHan(luc, gioTrongNgay, gioHomSau) {
    if (!luc) return null;
    if (luc.getHours() < 18 && !laChuNhat(luc)) return datGio(luc, gioTrongNgay);
    return datGio(ngayLamViec(luc.getFullYear(), luc.getMonth(), luc.getDate() + 1), gioHomSau);
  }
  const quaHanXL = (luc) => { const h = tinhHan(luc, HAN_XL_TRONG_NGAY, HAN_XL_HOM_SAU); return !!h && Date.now() > h.getTime(); };
  const quaHanBG = (luc) => { const h = tinhHan(luc, HAN_BG_TRONG_NGAY, HAN_BG_HOM_SAU); return !!h && Date.now() > h.getTime(); };

  /* ---------- Shop đang đăng nhập ----------
     Đã kiểm thật: mã người bán nằm ở cookie "oec_seller_id_unified_seller_env";
     tên Shop nằm ở bộ nhớ trang "ecom_seller_base_account_info" (shop.shop_name). */
  function maNguoiBan() {
    const m = document.cookie.match(/(?:^|;\s*)oec_seller_id_unified_seller_env=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function tenShopDay() {
    try {
      const x = JSON.parse(localStorage.getItem('ecom_seller_base_account_info') || 'null');
      const s = (((x || {}).value || {}).data || {}).shop || {};
      return String(s.shop_name || '');
    } catch (e) { return ''; }
  }
  function vietTat(ten) {
    return String(ten || '').replace(/[đĐ]/g, 'D').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase()).join('').slice(0, 6);
  }

  /* ---------- Gọi API TikTok ----------
     Chỉ 2 lệnh, đều là lệnh CHÍNH trang Quản lý đơn hàng vẫn gọi (đã kiểm thật 27/09):
       POST /api/fulfillment/order/list          — danh sách đơn (có Note, SKU, ĐVVC, giá)
       POST /api/fulfillment/order/search_count  — số đếm của sàn: 1100 = Đang chờ vận chuyển,
                                                   1200 = Đang chờ lấy hàng
     Bị chặn (hộp xác minh, trả trang lạ, lỗi quá tải) thì DỪNG đọc 10 phút, không cố vượt. */
  let nghiToi = 0;          // đang tạm dừng đọc tới lúc nào
  let lyDoNghi = '';
  let loiLienTiep = 0;
  const tuGui = new Set();  // nội dung các lệnh do CHÍNH script gửi (để không nhầm với lệnh của trang)

  function tamDung(lyDo) {
    nghiToi = Date.now() + NGHI_KHI_BI_CHAN;
    lyDoNghi = lyDo;
    log('Tạm dừng đọc 10 phút: ' + lyDo);
  }

  function coHopXacMinh() {
    if (!document.body) return false;
    const el = document.querySelector('#captcha_container, [id*="captcha" i], [class*="captcha" i], [class*="verify-wrap" i]');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 40 && r.height > 40;
  }

  async function goi(duong, body) {
    const sid = maNguoiBan();
    if (!sid) { const e = new Error('chưa đăng nhập TikTok (thiếu mã người bán)'); e.matDN = true; throw e; }
    const ac = new AbortController();
    const hen = setTimeout(() => ac.abort(), 20000);
    try {
      const url = duong + '?aid=' + APP_ID + '&locale=vi-VN&oec_seller_id=' + encodeURIComponent(sid) +
                  '&seller_id=' + encodeURIComponent(sid);
      const chu = JSON.stringify(body);
      tuGui.add(chu);                 // đánh dấu lệnh của script để phần "nghe trang" bỏ qua
      let r;
      try {
        r = await window.fetch(url, {
          method: 'POST', credentials: 'include', signal: ac.signal,
          headers: { 'Content-Type': 'application/json' }, body: chu
        });
      } finally {
        setTimeout(() => tuGui.delete(chu), 50);
      }
      if (r.status === 401) { const e = new Error('mất đăng nhập TikTok (HTTP 401)'); e.matDN = true; throw e; }
      if (r.status === 403 || r.status === 429) { const e = new Error('TikTok chặn lệnh (HTTP ' + r.status + ')'); e.chan = true; throw e; }
      const t = await r.text();
      let j;
      try { j = JSON.parse(t); } catch (x) { const e = new Error('TikTok trả về trang lạ (có thể đang đòi xác minh)'); e.chan = true; throw e; }
      if (j.code !== 0) {
        const e = new Error('TikTok báo lỗi ' + j.code + ' ' + String(j.message || '').slice(0, 80));
        e.maSan = j.code;
        if (/login|đăng nhập|session/i.test(String(j.message || ''))) e.matDN = true;
        throw e;
      }
      return j;
    } finally {
      clearTimeout(hen);
    }
  }

  const DK_CAN_GUI = { search_tab: { value: ['101'] } };

  // Lấy HẾT mục "Cần gửi" (gồm cả Đang chờ vận chuyển + Đang chờ lấy hàng), mỗi trang 50 đơn.
  // Đã kiểm thật: lệnh này phân trang đúng theo offset, không trùng đơn.
  async function docCanGui() {
    const tat = new Map();
    let tong = null;
    for (let off = 0; off < 2000; off += 50) {
      const j = await goi('/api/fulfillment/order/list', {
        search_condition: { condition_list: DK_CAN_GUI }, offset: off, count: 50,
        sort_info: '6', search_cursor: '', pagination_type: 0
      });
      const d = j.data || {};
      const ds = d.main_orders || [];
      if (typeof d.total_count === 'number') tong = d.total_count;
      ds.forEach((m) => { if (m && m.main_order_id) tat.set(String(m.main_order_id), m); });
      if (ds.length < 50 || (tong !== null && tat.size >= tong)) break;
    }
    return { ds: [...tat.values()], tong: tong };
  }

  async function demCuaSan() {
    try {
      const j = await goi('/api/fulfillment/order/search_count', { search_key_list: ['1100', '1200'] });
      const m = (j.data || {}).count_map || {};
      return { cho: typeof m['1100'] === 'number' ? m['1100'] : null, lay: typeof m['1200'] === 'number' ? m['1200'] : null };
    } catch (e) {
      log('Không lấy được số đếm của sàn: ' + e.message);
      if (e.chan) throw e;
      return { cho: null, lay: null };
    }
  }

  /* ---------- Đọc 1 đơn ----------
     Đã kiểm thật trên đơn SMH TikTok 27/09:
       - Note khách:  note_module.buyer_note
       - Note shop:   note_module.seller_note_value.note_text  ("Test note của người bán")
       - Trạng thái:  order_status_module[].main_sub_order_status  1 = Đang chờ vận chuyển
                      (chưa xử lý), 2 = Đang chờ lấy hàng (đã xử lý)
       - ĐVVC:        delivery_module[].shipment_provider_info {id, name}  ("J&T Express", "GHN"...)
       - Hoả tốc:     logistics_service_info.logistics_service_delivery_option = 5 ("Hoả tốc")
       - Hàng:        sku_module[] seller_sku_name ("108 CHUẨN RÂU ĐỎ 6li SMH"), quantity,
                      sku_unit_price.price_val (đơn giá 1 món); quà = 0đ, SKU "1 nụ ..." */
  function laQuaTang(ten, gia) {
    if (gia === 0) return true;
    const c = String(ten || '').trim();
    if (!c) return true;
    if (/^quà\s*tặng/i.test(c)) return true;
    if (c.indexOf('1 nụ') === 0) return true;
    return c === c.toLowerCase() && c !== c.toUpperCase();
  }

  function docDon(m) {
    const id = String(m.main_order_id);
    const st = (m.order_status_module || []).map((s) => Number(s.main_sub_order_status));
    const dm = (m.delivery_module || [])[0] || {};
    const sp = dm.shipment_provider_info || {};
    const li = dm.logistics_service_info || {};
    const ht = Number(li.logistics_service_delivery_option) === 5 ||
               /h[oỏọảố]a\s*t[oốộ]c/i.test(String(li.logistics_service_name || ''));
    const hang = (m.sku_module || []).map((s) => {
      const ten = String(s.seller_sku_name || '').trim() || String(s.sku_name || '').trim() ||
                  String(s.product_name || '').trim().slice(0, 40);
      const pv = (s.sku_unit_price || {}).price_val;
      const g = Number(pv);
      const gia = pv !== undefined && pv !== null && String(pv).trim() !== '' && isFinite(g) ? g : null;
      const sl = parseInt(s.quantity, 10) || 1;
      return { ten: ten, sl: sl, gia: gia, qua: laQuaTang(ten, gia) };
    });
    const nm = m.note_module || {};
    const tnK = nm.has_buyer_note === false ? '' : String(nm.buyer_note || '').trim();
    const tnS = String(((nm.seller_note_value || {}).note_text) || '').trim();
    const tm = m.trade_order_module || {};
    const tao = Number(tm.create_time);
    return {
      id: id,
      chuaXL: st.indexOf(1) >= 0,
      daXL: st.length > 0 && st.every((x) => x === 2),
      ht: ht,
      dvId: String(sp.id || ''),
      dvTen: String(sp.name || '').trim(),
      dichVu: String(li.logistics_service_name || ''),
      hang: hang,
      tnK: tnK,
      tnS: tnS,
      luc: tao ? new Date(tao * 1000) : null,
      href: '/order/detail?order_no=' + id
    };
  }

  function xetCanhBao(o) {
    const chinh = (o.hang || []).filter((h) => !h.qua);
    const gop = {};
    chinh.forEach((h) => { gop[h.ten] = gop[h.ten] || { ten: h.ten, sl: 0 }; gop[h.ten].sl += h.sl; });
    const ma = Object.keys(gop).map((k) => gop[k]);
    const moTa = (ds) => ds.map((h) => h.ten + ' x' + h.sl).join(', ');
    const tong = chinh.reduce((a, h) => a + (h.gia || 0) * h.sl, 0);
    const slNhieu = ma.filter((h) => h.sl >= NGUONG_SO_LUONG);
    return {
      id: o.id, ma: o.id, href: o.href,
      ht: !!o.ht,
      dvTen: o.dvTen,
      tnK: o.tnK || '',
      tnS: o.tnS || '',
      spChinh: moTa(ma),
      slNhieu: slNhieu.length ? moTa(slNhieu) : '',
      gt: tong >= NGUONG_GIA_TRI_DON ? tong : 0
    };
  }
  const coCanhBao = (o) => !!(o && (o.loi || o.ht || o.tnK || o.tnS || o.slNhieu || o.gt));

  /* ---------- Trạng thái ---------- */
  // du = { canhBao:[...], tongCho, soHT, soNote, cho:{n,qh,ds}, nut:[...], thieu, _ts }
  let du = null;
  let duCu = null;               // dữ liệu lần trước (lưu trong trình duyệt) — chỉ dùng khi đọc lỗi
  let dangDoc = false, canDocLai = false, lanDocCuoi = 0, mocDoc = 0, henDocId = null;
  let dangChay = false;          // đang chạy quy trình in (chỉ bản In đơn dùng)
  let trangThai = null;          // { muc:'canh'|'hong', chu } — tự kiểm tra
  let loiCuoi = null;            // { chu, matDN, ts }
  let tenShop = '';

  function kiemTraShop() {
    const sid = maNguoiBan();
    if (!sid) return;
    let cu = null;
    try { cu = localStorage.getItem(KEY.shop); } catch (e) {}
    if (cu !== sid) {
      try { localStorage.setItem(KEY.shop, sid); } catch (e) {}
      if (cu) {
        log('Đổi Shop TikTok — xoá dữ liệu của Shop cũ');
        du = null; trangThai = null;
        try { localStorage.removeItem(KEY.so); } catch (e) {}
      }
    }
    const t = vietTat(tenShopDay());
    if (t) tenShop = t;
  }

  
  // Gom đơn chưa xử lý thành các nút in: 1 nút ⚡ Hoả tốc (in chung mọi đơn hoả tốc, ghi rõ
  // từng đơn: ĐVVC + mã hàng), rồi mỗi ĐVVC 1 nút. Thứ tự: Hoả tốc → GHN → ĐVVC khác → J&T.
  const thuTuDV = (ten) => /GHN|Giao\s*Hàng\s*Nhanh/i.test(ten) ? 0 : /J\s*&\s*T/i.test(ten) ? 2 : 1;
  function gomNut(chua) {
    const nut = [];
    const ht = chua.filter((o) => o.ht);
    if (ht.length) {
      const g = { k: 'ht', ht: true, ten: 'Hoả tốc', n: ht.length, qh: 0, tn: 0, sl: 0, gt: 0, don: [] };
      ht.forEach((o) => {
        const cb = xetCanhBao(o);
        if (cb.tnK || cb.tnS) g.tn++;
        if (cb.slNhieu) g.sl++;
        if (cb.gt) g.gt++;
        g.don.push({ id: o.id, dv: o.dvTen || '?', sp: cb.spChinh || '(chưa đọc được hàng)' });
      });
      nut.push(g);
    }
    const theo = {};
    chua.filter((o) => !o.ht).forEach((o) => {
      const k = o.dvId || ('?' + o.dvTen);
      const g = theo[k] = theo[k] || { k: k, pid: o.dvId, ten: o.dvTen || '', ht: false,
                                       n: 0, qh: 0, tn: 0, sl: 0, gt: 0, bang: {} };
      g.n++;
      if (quaHanXL(o.luc)) g.qh++;
      const cb = xetCanhBao(o);
      if (cb.tnK || cb.tnS) g.tn++;
      if (cb.slNhieu) g.sl++;
      if (cb.gt) g.gt++;
      o.hang.forEach((h) => {
        if (h.qua) return;
        const b = g.bang[h.ten] = g.bang[h.ten] || { v: h.ten, n: 0, gia: null };
        b.n += h.sl;
        if (h.gia !== null && (b.gia === null || h.gia > b.gia)) b.gia = h.gia;
      });
    });
    Object.keys(theo).map((k) => theo[k])
      .sort((a, b) => thuTuDV(a.ten) - thuTuDV(b.ten) || b.n - a.n)
      .forEach((g) => {
        const r = Object.assign({}, g, { sp: Object.keys(g.bang).map((v) => g.bang[v]) });
        delete r.bang;
        nut.push(r);
      });
    return nut;
  }
  

  // Kho đơn "Cần gửi" (dữ liệu gốc TikTok trả về), theo mã đơn. Lần đọc đầy đủ thay cả kho;
  // mỗi lần TRANG tự tải danh sách thì cập nhật ngay những đơn trang vừa tải (bản 1.2).
  let khoTho = new Map();
  let coKhoDu = false;     // đã có 1 lần đọc đầy đủ trong phiên trang này chưa

  // Dựng dữ liệu hiển thị từ danh sách đơn "Cần gửi" (dù lấy từ lệnh riêng hay từ trang).
  function xuLyKetQua(ds, giuDongCu) {
    khoTho = new Map();
    coKhoDu = true;
    ds.forEach((m) => { if (m && m.main_order_id) khoTho.set(String(m.main_order_id), m); });
    const don = ds.map(docDon);
    const chua = don.filter((o) => o.chuaXL);
    const da = don.filter((o) => !o.chuaXL && o.daXL);
    let canhBao = chua.map(xetCanhBao).filter(coCanhBao);
    // Lần đọc chưa trọn vẹn: GIỮ các dòng cũ của đơn lần này không thấy (không xoá bừa)
    if (giuDongCu && du && du.canhBao) {
      const thay = new Set(don.map((o) => o.id));
      du.canhBao.forEach((o) => { if (!thay.has(o.id)) canhBao.push(o); });
    }
    canhBao.sort((a, b) => (b.ht ? 1 : 0) - (a.ht ? 1 : 0));
    const treBG = da.filter((o) => quaHanBG(o.luc))
      .sort((a, b) => (a.luc ? a.luc.getTime() : 0) - (b.luc ? b.luc.getTime() : 0))
      .map((o) => ({ ma: o.id, luc: o.luc ? o.luc.getTime() : 0, href: o.href }));
    du = {
      canhBao: canhBao,
      tongCho: chua.length,
      soHT: chua.filter((o) => o.ht).length,
      soNote: chua.filter((o) => o.tnK || o.tnS).length,
      cho: { n: da.length, qh: treBG.length, ds: treBG },
       nut: gomNut(chua), 
      _ts: Date.now()
    };
    try { localStorage.setItem(KEY.so, JSON.stringify(du)); } catch (e) {}
    return { chua: chua, da: da };
  }

  function henDoc(ms) {
    clearTimeout(henDocId);
    henDocId = setTimeout(() => docVaVe('hẹn'), ms);
  }

  async function docVaVe(lyDo, ep) {
    if (dangChay) return;
    if (dangDoc) { canDocLai = true; return; }
    if (!ep && Date.now() < nghiToi) { ve(); return; }
    if (/login|account\/register/i.test(location.pathname)) {
      loiCuoi = { chu: 'đang ở trang đăng nhập', matDN: true, ts: Date.now() };
      trangThai = { muc: 'hong', chu: '⚠ Mất đăng nhập TikTok — đăng nhập lại để script đọc đơn' };
      ve();
      return;
    }
    if (coHopXacMinh()) { tamDung('TikTok đang hiện hộp xác minh'); ve(); return; }
    dangDoc = true;
    canDocLai = false;
    mocDoc = Date.now();
    ve();
    const t0 = Date.now();
    try {
      kiemTraShop();
      let [kq, dem] = await Promise.all([docCanGui(), demCuaSan()]);
      let r = xuLyKetQua(kq.ds, false);
      // TỰ KIỂM TRA: số đơn đọc được phải khớp số đếm của sàn. Thiếu -> đợi 4 giây đọc lại
      // 1 lần (phòng đơn đang chuyển trạng thái); vẫn thiếu -> báo cam, giữ dòng cũ.
      let thieu = null;
      if ((dem.cho !== null && r.chua.length < dem.cho) || (dem.lay !== null && r.da.length < dem.lay)) {
        log('Lệch số đếm: đọc ' + r.chua.length + '/' + r.da.length + ', sàn báo ' + dem.cho + '/' + dem.lay + ' — đọc lại');
        await sleep(4000);
        [kq, dem] = await Promise.all([docCanGui(), demCuaSan()]);
        r = xuLyKetQua(kq.ds, true);
        if (dem.cho !== null && r.chua.length < dem.cho) thieu = { san: dem.cho, doc: r.chua.length };
      }
      trangThai = thieu
        ? { muc: 'canh', chu: '⚠ Sàn báo ' + thieu.san + ' đơn chờ vận chuyển, script mới đọc được ' + thieu.doc + ' — kiểm tra tay' }
        : null;
      if (loiLienTiep) log('Đọc lại được sau ' + loiLienTiep + ' lần lỗi');
      loiLienTiep = 0;
      loiCuoi = null;
      log('Đọc xong (' + lyDo + ') sau ' + (Date.now() - t0) + 'ms — chờ vận chuyển ' + du.tongCho +
          ' (⚡' + du.soHT + '), chờ lấy hàng ' + du.cho.n + ', banner ' + du.canhBao.length + ' đơn');
    } catch (e) {
      loiLienTiep++;
      loiCuoi = { chu: e.message, matDN: !!e.matDN, ts: Date.now() };
      log('Đọc lỗi (lần ' + loiLienTiep + '): ' + e.message);
      if (e.chan) tamDung(e.message);
      else if (!e.matDN && loiLienTiep >= 2) tamDung('lỗi ' + loiLienTiep + ' lần liền: ' + e.message);
      const tu = du && du._ts ? ' từ ' + hhmm(du._ts) : '';
      trangThai = e.matDN
        ? { muc: 'hong', chu: '⚠ Mất đăng nhập TikTok — Note KHÔNG được cập nhật' + tu }
        : { muc: loiLienTiep >= 2 ? 'hong' : 'canh', chu: '⚠ Chưa đọc được đơn mới' + tu + ' — đang giữ dữ liệu cũ' };
      if (!e.matDN && !e.chan && loiLienTiep < 2) henDoc(20000);
      // Vừa mở trang mà đọc lỗi -> hiện tạm dữ liệu lần trước (đèn cam/đỏ báo là dữ liệu cũ)
      if (!du && duCu && duCu._ts) {
        du = duCu;
        trangThai = { muc: trangThai && trangThai.muc === 'hong' ? 'hong' : 'canh',
                      chu: '⚠ Chưa đọc được đơn mới — đang hiện tạm dữ liệu lúc ' + hhmm(duCu._ts) };
      }
    } finally {
      dangDoc = false;
      lanDocCuoi = Date.now();
      ve();
      if (canDocLai) { canDocLai = false; henDoc(500); }
    }
  }

  /* ---------- Đọc "ké" trang TikTok ----------
     Mỗi lần CHÍNH trang Quản lý đơn hàng tải danh sách (anh bấm lọc, chuyển mục...), script
     nghe câu trả lời đó: nếu là đúng toàn bộ mục "Cần gửi" thì dùng luôn, KHÔNG gửi thêm lệnh
     nào; nếu là 1 phần (đang lọc) thì chỉ hẹn đọc lại khi lần đọc trước đã quá 30 giây.
     Chỉ nghe, không sửa gì của trang. */
  function ngheTrang() {
    try {
      const goc = window.fetch;
      if (!goc || goc.cttNghe) return;
      const moi = async function (input, init) {
        const r = await goc.apply(this, arguments);
        try {
          const u = String((input && input.url) || input || '');
          const body = String((init && init.body) || '');
          const cuaScript = tuGui.has(body);
          if (/\/api\/fulfillment\/order\/list(\?|$)/.test(u) && !cuaScript && !dangChay) {
            r.clone().json().then((j) => trangVuaTai(body, j)).catch(() => {});
          } else if (!cuaScript && /note|remark|memo/i.test(u.split('?')[0]) &&
                     /post|put/i.test(String((init && init.method) || (input && input.method) || ''))) {
            // Anh vừa thêm/sửa Note shop trên trang -> đọc lại ngay (không đợi nhịp 90 giây)
            log('Trang vừa lưu ghi chú — đọc lại ngay');
            henDoc(1200);
          }
        } catch (e) {}
        return r;
      };
      moi.cttNghe = true;
      window.fetch = moi;
    } catch (e) {}
  }

  // Bản 1.2: MỖI LẦN trang tải danh sách đơn (tải lại trang, bấm tab, bấm lọc, chuyển trang...),
  // script lấy ngay dữ liệu của chính các đơn trang vừa tải (có sẵn Note khách, Note shop, hàng)
  // để hiện Note NGAY LẬP TỨC — không cần gửi thêm lệnh nào. Sau đó mới đọc lại toàn bộ mục
  // "Cần gửi" 1 lần để đối chiếu (cách lần đọc trước ít nhất 10 giây, tránh TikTok chặn).
  function trangVuaTai(body, j) {
    if (dangChay) return;
    let b = null;
    try { b = JSON.parse(body); } catch (e) { return; }
    const cl = ((b.search_condition || {}).condition_list) || {};
    const d = j && j.code === 0 ? (j.data || {}) : null;
    if (!d) return;
    const ds = d.main_orders || [];
    kiemTraShop();
    const tab = ((cl.search_tab || {}).value || [])[0];
    if (tab === '101' && Object.keys(cl).length === 1 && Number(b.offset) === 0 &&
        typeof d.total_count === 'number' && ds.length >= d.total_count) {
      // Trang vừa tải ĐỦ mục "Cần gửi" -> dùng luôn làm lần đọc đầy đủ
      xuLyKetQua(ds, false);
      trangThai = null;
      lanDocCuoi = Date.now();
      log('Dùng luôn danh sách trang vừa tải (' + ds.length + ' đơn Cần gửi) — không gửi thêm lệnh');
      ve();
      return;
    }
    // Chưa có lần đọc đầy đủ nào (trang vừa mở) -> đọc đầy đủ ngay
    if (!coKhoDu) {
      // Trang vừa mở, chưa có lần đọc đầy đủ. Nếu trang vừa tải ĐỦ mục "Đang chờ vận chuyển"
      // (đường dẫn quen dùng: Cần gửi > Đang chờ vận chuyển) thì hiện Note ngay từ dữ liệu đó;
      // phần "Chờ lấy hàng" tạm giữ số cũ tới khi lần đọc đầy đủ xong.
      const chiLoc = Object.keys(cl).filter((k) => k !== 'search_tab' && k !== 'order_status');
      const laCho1 = tab === '101' && JSON.stringify(((cl.order_status || {}).value) || []) === '["1"]' &&
                     !chiLoc.length && Number(b.offset) === 0 && typeof d.total_count === 'number' &&
                     ds.length >= d.total_count;
      if (laCho1) {
        const choCu = (du && du.cho) || (duCu && duCu.cho) || { n: 0, qh: 0, ds: [] };
        xuLyKetQua(ds, false);
        coKhoDu = false;
        khoTho = new Map();
        du.cho = choCu;
        try { localStorage.setItem(KEY.so, JSON.stringify(du)); } catch (e) {}
        trangThai = null;
        log('Dùng ngay danh sách "Đang chờ vận chuyển" trang vừa tải (' + ds.length + ' đơn)');
        ve();
      }
      if (!dangDoc) henDoc(200);
      return;
    }
    // Trang tải 1 phần (đang lọc / tab khác): cập nhật ngay đúng các đơn đó vào kho
    let doi = 0;
    ds.forEach((m) => {
      if (!m || !m.main_order_id) return;
      const id = String(m.main_order_id);
      const st = (m.order_status_module || []).map((s) => Number(s.main_sub_order_status));
      const trongCanGui = st.some((x) => x === 1 || x === 2);
      if (trongCanGui) { khoTho.set(id, m); doi++; }
      else if (khoTho.has(id)) { khoTho.delete(id); doi++; }
    });
    if (doi) {
      const giuTrangThai = trangThai;
      xuLyKetQua([...khoTho.values()], false);
      trangThai = giuTrangThai;
      ve();
    }
    if (Date.now() - lanDocCuoi > 10000) henDoc(1500);
  }

  /* ---------- Giao diện ---------- */

  const FONT = 'system-ui,-apple-system,"Segoe UI","Helvetica Neue",Roboto,arial,' +
    '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif';

  const CSS = (`
    /* Banner nhỏ gọn giữa - trên màn hình: đơn hoả tốc, Note khách, Note shop, SL nhiều,
       giá trị cao. Không có nút tắt: đơn nào xử lý xong thì dòng tự biến mất. */
    /* Bản 1.4: MÀU THEO LOẠI ĐƠN — khung ngoài theo loại gấp nhất, mỗi dòng mang màu loại của nó */
    @keyframes cttChop{
      0%,100%{border-color:var(--tc,#d32f2f);box-shadow:0 8px 24px rgba(0,0,0,.25),0 0 0 0 transparent}
      50%{border-color:var(--ts,#ff5252);
        box-shadow:0 8px 24px rgba(0,0,0,.25),0 0 22px 5px color-mix(in srgb,var(--tc,#d32f2f) 45%,transparent)}}
    #ctt-banner{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483600;
      max-width:min(720px,82vw);width:max-content;font-family:__FONT__}
    #ctt-banner .ctt-rows{border:3px solid var(--tc,#d32f2f);border-radius:12px;background:#fff;
      padding:6px 8px;max-height:26vh;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.32);
      animation:cttChop .9s ease-in-out infinite}
    #ctt-banner .ctt-r{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;padding:6px 10px;
      border-radius:8px;background:var(--rn,#fdeceb);border:1px solid var(--rv,#f1b5ae)}
    #ctt-banner .ctt-r + .ctt-r{margin-top:6px}
    #ctt-banner .ctt-nh{flex:none;font-size:10.5px;font-weight:900;color:#fff;border-radius:4px;
      padding:1px 6px;letter-spacing:.2px;line-height:1.5;white-space:nowrap}
    .ctt-nh.ht,.ctt-mk-b .ht{background:#c62828}
    .ctt-nh.tnk,.ctt-mk-b .tnk{background:#1565c0}
    .ctt-nh.tns,.ctt-mk-b .tns{background:#00897b}
    .ctt-nh.sl,.ctt-mk-b .sl{background:#6a1b9a}
    .ctt-nh.gt,.ctt-mk-b .gt{background:#e65100}
    #ctt-banner a.ctt-ma{font-size:13.5px;font-weight:900;color:var(--rc,#c62828);text-decoration:none;
      letter-spacing:.2px;flex:none}
    #ctt-banner a.ctt-ma:hover{text-decoration:underline}
    button.ctt-cp{all:unset;display:inline-block;cursor:pointer;background:#d32f2f;color:#fff;
      font-size:11px;font-weight:800;padding:2px 8px;border-radius:5px;line-height:1.5;flex:none}
    button.ctt-cp:hover{background:#b71c1c}
    button.ctt-cp.ok{background:#1a9e5a}
    #ctt-banner .ctt-t{font-size:13px;color:#3d2b28;font-weight:700;word-break:break-word;
      flex:1 1 260px;min-width:0}
    #ctt-banner .ctt-t .k{color:#0d47a1}
    #ctt-banner .ctt-t .s{color:#00695c}
    #ctt-banner button.ctt-cp{background:var(--rc,#d32f2f)}
    #ctt-banner button.ctt-cp:hover{background:var(--rc,#d32f2f);filter:brightness(.85)}
    #ctt-banner .ctt-them{margin:4px auto 0;width:max-content;font-size:11px;font-weight:800;
      color:#fff;background:var(--tc,#8d1616);border-radius:9px;padding:1px 10px}
    #ctt-banner .ctt-st{margin:4px auto 0;width:max-content;max-width:100%;font-size:11.5px;
      font-weight:800;line-height:1.4;padding:2px 10px;border-radius:9px;color:#8a8a8a;
      background:rgba(255,255,255,.94);border:1px solid #e3e3e3;box-shadow:0 1px 4px rgba(0,0,0,.1)}
    #ctt-banner .ctt-st.canh{color:#fff;background:#e65100;border-color:#e65100}
    #ctt-banner .ctt-st.hong{color:#fff;background:#c62828;border-color:#c62828;
      animation:cttNhay .9s ease-in-out infinite}
    #ctt-banner .ctt-st .den{display:inline-block;width:8px;height:8px;border-radius:50%;
      margin-right:6px;background:#bdbdbd}
    #ctt-banner .ctt-st.xanh .den{background:#1a9e5a}
    #ctt-banner .ctt-st.canh .den{background:#fff}
    #ctt-banner .ctt-st.hong .den{background:#ffeb3b}
    @keyframes cttNhay{0%,100%{opacity:1}50%{opacity:.5}}

    /* Tô màu dòng đơn cần chú ý ngay trong bảng Quản lý đơn hàng của TikTok */
    /* Bản 1.4 (phương án B như Shopee): bỏ vạch bên trái (từng đè ô tick) — cả dòng nền nhạt
       + khung bo góc theo MÀU LOẠI ĐƠN (đỏ hoả tốc · xanh dương Note khách · xanh ngọc Note shop
       · tím SL nhiều · cam giá trị cao) */
    tr.ctt-mk > td{background:var(--ctt-n,#fdeceb) !important;
      box-shadow:inset 0 2px 0 var(--ctt-c,#c62828),inset 0 -2px 0 var(--ctt-c,#c62828) !important}
    tr.ctt-mk > td:first-child{border-radius:8px 0 0 8px;
      box-shadow:inset 2px 0 0 var(--ctt-c,#c62828),inset 0 2px 0 var(--ctt-c,#c62828),inset 0 -2px 0 var(--ctt-c,#c62828) !important}
    tr.ctt-mk > td:last-child{border-radius:0 8px 8px 0;
      box-shadow:inset -2px 0 0 var(--ctt-c,#c62828),inset 0 2px 0 var(--ctt-c,#c62828),inset 0 -2px 0 var(--ctt-c,#c62828) !important}
    .ctt-mk-b{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
    .ctt-mk-b span{font:900 10.5px/1.6 __FONT__;color:#fff;border-radius:4px;padding:0 6px;white-space:nowrap}
    .ctt-mk-note{position:relative;z-index:3;margin-top:6px;padding:7px 12px;border-radius:6px;
      background:#d6e7fb;color:#0d2f5e;word-break:break-word;
      white-space:normal;font:600 13.5px/1.45 __FONT__;box-sizing:border-box}
    .ctt-mk-note b{color:#1565c0;font-weight:800}
    .ctt-mk-note.s{background:#d2efeb;color:#004d40}
    .ctt-mk-note.s b{color:#00796b}
    
    /* ----- Bảng In đơn TikTok (máy Cao) ----- */
    #ctt-panel,#ctt-nho{font-family:__FONT__}
    #ctt-panel{position:fixed;right:18px;bottom:18px;z-index:2147483000;width:348px;background:#fff;
      border:1px solid #ececec;border-radius:14px;overflow:hidden;color:#333;
      box-shadow:0 12px 34px rgba(0,0,0,.2),0 2px 6px rgba(0,0,0,.06)}
    #ctt-panel *{box-sizing:border-box}
    #ctt-panel .hd{display:flex;align-items:center;gap:7px;padding:9px 10px 9px 12px;
      border-bottom:1px solid #f1f1f1;background:linear-gradient(#fff,#fbfbfb)}
    #ctt-panel .den,#ctt-nho .den{width:10px;height:10px;border-radius:50%;flex:none;background:#bdbdbd;cursor:help}
    #ctt-panel .den.xanh{background:#1a9e5a;box-shadow:0 0 0 3px rgba(26,158,90,.18)}
    #ctt-panel .den.cam{background:#f57c00;box-shadow:0 0 0 3px rgba(245,124,0,.2);animation:cttNhay 1.6s ease-in-out infinite}
    #ctt-panel .den.do{background:#d32f2f;box-shadow:0 0 0 3px rgba(211,47,47,.22);animation:cttNhay .8s ease-in-out infinite}
    #ctt-panel .tde{display:flex;align-items:center;gap:5px;font-size:14.5px;font-weight:900;color:#111;white-space:nowrap}
    #ctt-panel .tde i{font-style:normal;color:#fe2c55}
    #ctt-panel .shop{font-size:10.5px;font-weight:900;color:#555;background:#f1f1f1;border-radius:5px;padding:2px 6px}
    #ctt-panel .shop:empty{display:none}
    #ctt-panel .ver{font-size:10.5px;color:#aaa;font-weight:700}
    #ctt-panel .bar{margin-left:auto;display:flex;gap:5px}
    #ctt-panel button.ic{all:unset;box-sizing:border-box;width:28px;height:28px;border:1px solid #e3e3e3;
      border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#555;
      font-size:15px;line-height:1;background:#fff}
    #ctt-panel button.ic:hover{background:#f3f3f3}
    #ctt-panel button.ic.ok{background:#1a9e5a;border-color:#1a9e5a;color:#fff}
    #ctt-panel button.ic.xoay > span{display:inline-block;animation:cttXoay .9s linear infinite}
    @keyframes cttXoay{to{transform:rotate(360deg)}}
    #ctt-panel .body{padding:10px 10px 2px;max-height:64vh;overflow-y:auto;overflow-x:hidden}
    #ctt-panel button.btn{all:unset;box-sizing:border-box;display:flex;align-items:flex-start;
      justify-content:space-between;gap:10px;width:100%;margin-bottom:8px;padding:11px 13px;border-radius:12px;
      color:#fff;cursor:pointer;text-align:left;line-height:1.2;box-shadow:0 4px 12px rgba(0,0,0,.22)}
    #ctt-panel button.btn:hover{filter:brightness(1.07)}
    #ctt-panel button.btn:disabled{cursor:not-allowed;opacity:.6}
    #ctt-panel .trai{display:flex;flex-direction:column;gap:5px;min-width:0}
    #ctt-panel .dau{display:flex;align-items:center;flex-wrap:wrap;gap:5px}
    #ctt-panel .ten{font-size:14.5px;font-weight:900;text-shadow:0 1px 2px rgba(0,0,0,.25)}
    #ctt-panel .chip{font-size:10px;font-weight:900;border-radius:9px;padding:1px 7px;background:#fff;
      color:#c62828;white-space:nowrap;line-height:1.6}
    #ctt-panel .chip.tn{color:#1565c0}
    #ctt-panel .chip.sl{color:#6a1b9a}
    #ctt-panel .chip.gt{color:#e65100}
    #ctt-panel .chip.qh{background:#ffeb3b;color:#b71c1c}
    #ctt-panel .sku{display:flex;flex-direction:column;align-items:flex-start;gap:3px;font-size:11.5px;
      font-weight:800;line-height:1.35;word-break:break-word}
    #ctt-panel .sl{font-weight:900;white-space:nowrap}
    #ctt-panel .sl.nhieu{font-size:1.45em;line-height:1}
    #ctt-panel .dong.dat{border:2px solid rgba(255,255,255,.95);background:rgba(0,0,0,.25);border-radius:6px;
      padding:2px 7px;font-size:12.5px;font-weight:900}
    @keyframes cttHiem{0%,100%{background:rgba(255,255,255,.14)}50%{background:rgba(255,255,255,.6)}}
    #ctt-panel .dong.hiem{animation:cttHiem .9s ease-in-out infinite}
    #ctt-panel .dong.dht{background:rgba(0,0,0,.22);border-radius:6px;padding:3px 7px}
    #ctt-panel .dong.dht b{font-weight:900;color:#ffeb3b}
    #ctt-panel .dong.dht .mad{font-weight:900;letter-spacing:.3px;background:rgba(255,255,255,.2);border-radius:4px;padding:0 5px}
    #ctt-panel .so{display:flex;flex-direction:column;align-items:center;flex:none;text-shadow:0 2px 5px rgba(0,0,0,.28)}
    #ctt-panel .so .con{font-size:34px;font-weight:900;line-height:1;letter-spacing:-1px}
    #ctt-panel .so .dv{font-size:10.5px;font-weight:800;opacity:.9}
    @keyframes cttToa{0%,100%{box-shadow:0 4px 12px rgba(0,0,0,.22),0 0 0 0 rgba(211,47,47,.75)}
      50%{box-shadow:0 4px 12px rgba(0,0,0,.22),0 0 0 7px rgba(211,47,47,0)}}
    #ctt-panel button.btn.gap{animation:cttToa .85s ease-in-out infinite}
    #ctt-panel .trong{padding:18px 10px;text-align:center;font-size:13.5px;font-weight:700;color:#1a9e5a;
      background:#f3fbf6;border:1px dashed #bfe5cf;border-radius:12px;margin-bottom:8px}
    #ctt-panel .trong.cho{color:#8a8a8a;background:#fafafa;border-color:#e0e0e0}
    #ctt-panel .bao{font-size:12px;font-weight:800;line-height:1.4;border-radius:9px;padding:6px 9px;
      margin-bottom:8px;color:#8a4b00;background:#fff4e5;border:1px solid #ffd8a8}
    #ctt-panel .bao.do{color:#fff;background:#c62828;border-color:#c62828}
    #ctt-panel button.pdf{all:unset;box-sizing:border-box;display:block;width:100%;text-align:center;
      margin-bottom:8px;padding:10px;border-radius:10px;background:#1565c0;color:#fff;font-weight:900;
      font-size:13.5px;cursor:pointer}
    @keyframes cttBgChop{0%,100%{border-color:#e65100}50%{border-color:#ff9800}}
    #ctt-panel .bg{border:3px solid #e65100;border-radius:12px;background:#fff5ec;padding:8px 10px;
      margin-bottom:8px;animation:cttBgChop .95s ease-in-out infinite}
    #ctt-panel .bg-h{color:#fff;background:#e65100;border-radius:7px;padding:4px 9px;text-align:center;
      font-size:13px;font-weight:900}
    #ctt-panel .bg-i{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:6px}
    #ctt-panel a.bg-ma{font-size:13px;font-weight:900;color:#bf360c;text-decoration:none}
    #ctt-panel .bg-gio{font-size:12px;font-weight:700;color:#8d6e63}
    #ctt-panel .st{font-size:13px;font-weight:700;line-height:1.4;padding:0 12px 8px;word-break:break-word}
    #ctt-panel .st:empty{display:none}
    #ctt-panel .ft{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;
      border-top:1px solid #f1f1f1;background:#fafafa;font-size:12px;font-weight:800}
    #ctt-panel .pill{color:#6d4c41;background:#fff3e0;border-radius:10px;padding:3px 9px;white-space:nowrap}
    #ctt-panel .pill.qh{color:#fff;background:#e65100}
    #ctt-panel .pill:empty{display:none}
    #ctt-panel .gio{color:#1a9e5a;white-space:nowrap;margin-left:auto}
    #ctt-panel .gio.dang{color:#888}
    #ctt-panel .gio.cu{color:#c62828}
    #ctt-nho{position:fixed;right:18px;bottom:18px;z-index:2147483000;cursor:pointer;display:flex;
      align-items:center;gap:8px;padding:10px 15px;border-radius:24px;white-space:nowrap;border:none;
      background:linear-gradient(135deg,#222,#000);color:#fff;font-size:14px;font-weight:900;
      box-shadow:0 6px 18px rgba(0,0,0,.28)}
    #ctt-nho .den{width:9px;height:9px;background:#1a9e5a}
    #ctt-nho .den.cam{background:#ffb74d}
    #ctt-nho .den.do{background:#ffeb3b;animation:cttNhay .8s ease-in-out infinite}
    #ctt-nho .so{font-size:22px;line-height:1}
    #ctt-nho .ht{font-size:12px;background:#fff;color:#c62828;border-radius:9px;padding:1px 7px}
    #ctt-nho.codo{background:linear-gradient(135deg,#e53935,#b71c1c);animation:cttToaNho .85s ease-in-out infinite}
    @keyframes cttToaNho{0%,100%{box-shadow:0 0 0 0 rgba(211,47,47,.75)}50%{box-shadow:0 0 0 9px rgba(211,47,47,0)}}
    
  `).replace(/__FONT__/g, FONT);

  function chenCSS() {
    if (document.getElementById('ctt-css')) return;
    const s = document.createElement('style');
    s.id = 'ctt-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ---------- Copy mã đơn ---------- */
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
    } catch (e) { log('Copy lỗi:', e.message); }
  }
  function chep(ma, xong) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ma).then(xong, () => chepTay(ma, xong));
        return;
      }
    } catch (e) {}
    chepTay(ma, xong);
  }
  function nutCopy(ma) {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'ctt-cp';
    c.textContent = '⧉';
    c.title = 'Copy mã đơn ' + ma;
    c.onclick = (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      chep(ma, () => { c.textContent = '✓'; c.classList.add('ok'); setTimeout(() => { c.textContent = '⧉'; c.classList.remove('ok'); }, 1600); });
    };
    return c;
  }

  /* ---------- Nhãn của 1 đơn (dùng chung banner + tô dòng) ---------- */
  const MAU_NHAN = { ht: '#c62828', tnk: '#1565c0', tns: '#00897b', sl: '#6a1b9a', gt: '#e65100' };
  // Bản 1.4: MÀU THEO LOẠI ĐƠN (giống Shopee) — nhìn màu là biết đơn thuộc trường hợp nào.
  // c = màu chính · n = nền nhạt · v = viền nhạt · s = màu sáng lúc nhấp nháy.
  // Đơn nhiều loại thì lấy loại gấp nhất: Hoả tốc > Note khách > Note shop > SL nhiều > Giá trị cao.
  const MAU_LOAI = {
    ht:  { c: '#c62828', n: '#fdeceb', v: '#f1b5ae', s: '#ff5252' },
    tnk: { c: '#1565c0', n: '#eaf3fe', v: '#aecdf2', s: '#42a5f5' },
    tns: { c: '#00897b', n: '#e8f6f4', v: '#a5d9d2', s: '#26a69a' },
    sl:  { c: '#6a1b9a', n: '#f6edfb', v: '#d6bbe8', s: '#ab47bc' },
    gt:  { c: '#e65100', n: '#fff2e7', v: '#f5c49a', s: '#ff9800' }
  };
  const THU_TU_LOAI = ['ht', 'tnk', 'tns', 'sl', 'gt'];
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
    const n = [];
    if (o.ht) n.push(['ht', '⚡ Hoả tốc']);
    if (o.tnK) n.push(['tnk', '💬 Note khách']);
    if (o.tnS) n.push(['tns', '📝 Note shop']);
    if (o.slNhieu) n.push(['sl', 'SL nhiều']);
    if (o.gt) n.push(['gt', 'Giá trị cao']);
    return n;
  }

  // Chữ sau mã đơn: bản 1.1 LUÔN ghi mã hàng + số lượng của đơn (cả đơn chỉ có Note), để
  // nhân sự biết ngay hàng gì cần chuẩn bị. Đơn hoả tốc ghi kèm tên ĐVVC (tài xế hãng nào tới).
  function chiTietDong(o) {
    let ds = o.spChinh ? '(' + o.spChinh + ')' : '';
    if (o.ht && o.dvTen) ds = o.dvTen + (ds ? ' · ' + ds : '');
    if (o.gt) ds += (ds ? ' ' : '') + Number(o.gt).toLocaleString('vi-VN') + 'đ';
    return ds;
  }

  /* ---------- Banner giữa - trên ---------- */
  function trangThaiDen() {
    if (loiCuoi && loiCuoi.matDN) return { mau: 'do', chu: 'Mất đăng nhập TikTok — đăng nhập lại' };
    if (Date.now() < nghiToi) return { mau: 'do', chu: 'Tạm dừng đọc tới ' + hhmm(nghiToi) + ' vì ' + lyDoNghi + ' — nếu có hộp xác minh, anh xác minh giúp' };
    if (!du || !du._ts) return { mau: loiLienTiep ? 'cam' : 'xam', chu: loiLienTiep ? 'Chưa đọc được lần nào — đang thử lại' : 'Đang đọc lần đầu…' };
    const phut = (Date.now() - du._ts) / 60000;
    if (phut >= 12) return { mau: 'do', chu: 'Đã ' + Math.round(phut) + ' phút chưa cập nhật được đơn' };
    if (trangThai && trangThai.muc === 'hong') return { mau: 'do', chu: trangThai.chu.replace(/^⚠\s*/, '') };
    if (loiLienTiep) return { mau: 'cam', chu: 'Lần đọc gần nhất bị lỗi — đang thử lại' };
    if (trangThai) return { mau: 'cam', chu: trangThai.chu.replace(/^⚠\s*/, '') };
    if (phut >= 4 && !document.hidden) return { mau: 'cam', chu: 'Đơn đã ' + Math.round(phut) + ' phút chưa cập nhật' };
    return { mau: 'xanh', chu: 'Mọi thứ ổn — đọc lúc ' + hhmm(du._ts) };
  }

  let chuKyBanner = '';
  function veBanner() {
    if (!document.body) return;
    const ds = (du && du.canhBao) || [];
    const den = trangThaiDen();
     const hienSt = den.mau === 'do' || !!trangThai; 
    
    let p = document.getElementById('ctt-banner');
    if (!ds.length && !hienSt) { if (p) p.remove(); chuKyBanner = ''; return; }
    const stChu =  den.chu;
    const ck = JSON.stringify(ds.map((o) => [o.id, o.tnK, o.tnS, o.ht, o.slNhieu, o.gt, o.spChinh, o.dvTen])) + '#' + den.mau + stChu;
    if (p && ck === chuKyBanner) return;
    if (!p) { p = document.createElement('div'); p.id = 'ctt-banner'; document.body.appendChild(p); }
    chuKyBanner = ck;
    p.innerHTML = '';
    if (ds.length) {
      const rows = document.createElement('div');
      rows.className = 'ctt-rows';
      const coLoai = new Set(ds.map(loaiChinh));
      datMau(p, THU_TU_LOAI.find((l) => coLoai.has(l)) || 'ht', '--t');
      ds.forEach((o) => {
        const r = document.createElement('div');
        r.className = 'ctt-r';
        datMau(r, loaiChinh(o), '--r');
        nhanCua(o).forEach(([l, c]) => {
          const s = document.createElement('span');
          s.className = 'ctt-nh ' + l;
          s.textContent = c;
          r.appendChild(s);
        });
        const a = document.createElement('a');
        a.className = 'ctt-ma';
        a.textContent = o.ma;
        a.href = o.href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.title = 'Mở đơn này trong tab mới';
        r.appendChild(a);
        r.appendChild(nutCopy(o.ma));
        const t = document.createElement('span');
        t.className = 'ctt-t';
        const ct = chiTietDong(o);
        if (ct) t.appendChild(document.createTextNode(ct));
        [['k', '💬 ', o.tnK], ['s', '📝 ', o.tnS]].forEach(([l, ic, v]) => {
          if (!v) return;
          if (t.childNodes.length) t.appendChild(document.createTextNode(' · '));
          const s = document.createElement('span');
          s.className = l;
          s.textContent = ic + v;
          t.appendChild(s);
        });
        r.appendChild(t);
        rows.appendChild(r);
      });
      p.appendChild(rows);
      requestAnimationFrame(() => {
        if (rows.scrollHeight > rows.clientHeight + 4) {
          const m = document.createElement('div');
          m.className = 'ctt-them';
          m.textContent = '▼ Tổng ' + ds.length + ' đơn cần chú ý — cuộn trong khung để xem hết';
          p.insertBefore(m, rows.nextSibling);
        }
      });
    }
    if (hienSt) {
      const st = document.createElement('div');
      st.className = 'ctt-st ' + (den.mau === 'do' ? 'hong' : den.mau === 'cam' ? 'canh' : 'xanh');
      const d = document.createElement('span');
      d.className = 'den';
      st.appendChild(d);
      st.appendChild(document.createTextNode(stChu));
      st.title = TEN_SCRIPT + ' ' + PHIEN_BAN + ' — đèn xanh: ổn · cam: cần để ý · đỏ: hỏng, kiểm tra tay';
      p.appendChild(st);
    }
  }

  /* ---------- Tô màu dòng đơn trong bảng Quản lý đơn hàng ----------
     Đã kiểm thật: mỗi đơn là 1 dòng <tr>, mã đơn nằm trong "span.order_id_number" ở cột
     mã đơn (cột dính bên trái). Nhãn + dải Note gắn vào ô đó; dải Note kéo ngang hết bảng. */
  function danhDauHang() {
    if (!document.body || location.pathname.indexOf(TRANG_DON) !== 0) return;
    const map = {};
    ((du && du.canhBao) || []).forEach((o) => { map[o.id] = o; });
    document.querySelectorAll('tbody span.order_id_number').forEach((span) => {
      const tr = span.closest('tr');
      const td = span.closest('td');
      if (!tr || !td) return;
      const id = (span.textContent || '').trim();
      const o = map[id];
      const nhan = o ? nhanCua(o) : [];
      const sig = nhan.length ? id + ':' + nhan.map((n) => n[0]).join(',') + ':' + o.tnK + '|' + o.tnS : '';
      const hop = td.firstElementChild || td;
      const coB = hop.querySelector('.ctt-mk-b');
      const coNote = hop.querySelectorAll('.ctt-mk-note').length;
      // Bản 1.1: nhãn "Note khách/Note shop" không gắn dưới mã đơn nữa (dải Note ngay bên dưới
      // đã ghi rõ) — chỉ giữ nhãn Hoả tốc / SL nhiều / Giá trị cao.
      const nhanDong = nhan.filter((n) => n[0] !== 'tnk' && n[0] !== 'tns');
      const canNote = o ? (o.tnK ? 1 : 0) + (o.tnS ? 1 : 0) : 0;
      const bang = tr.closest('table');
      const rong = Math.max(240, ((bang && bang.parentElement) ? bang.parentElement.clientWidth : 900) - 70);
      if ((tr.dataset.cttMk || '') === sig &&
          (!sig ? !coB && !tr.classList.contains('ctt-mk')
                : !!coB === nhanDong.length > 0 && tr.classList.contains('ctt-mk') && coNote === canNote)) {
        hop.querySelectorAll('.ctt-mk-note').forEach((n) => { n.style.width = rong + 'px'; });
        return;
      }
      tr.dataset.cttMk = sig;
      if (coB) coB.remove();
      hop.querySelectorAll('.ctt-mk-note').forEach((n) => n.remove());
      if (!sig) {
        tr.classList.remove('ctt-mk');
        ['c', 'n', 'v', 's'].forEach((k) => tr.style.removeProperty('--ctt-' + k));
        hop.style.removeProperty('overflow');
        return;
      }
      tr.classList.add('ctt-mk');
      datMau(tr, nhan[0][0], '--ctt-');
      hop.style.setProperty('overflow', 'visible', 'important');
      if (nhanDong.length) {
        const b = document.createElement('div');
        b.className = 'ctt-mk-b';
        nhanDong.forEach(([l, c]) => {
          const s = document.createElement('span');
          s.className = l;
          s.textContent = c;
          b.appendChild(s);
        });
        hop.appendChild(b);
      }
      [['', '💬 Note khách: ', o.tnK], ['s', '📝 Note shop: ', o.tnS]].forEach(([l, tieu, v]) => {
        if (!v) return;
        const n = document.createElement('div');
        n.className = 'ctt-mk-note' + (l ? ' ' + l : '');
        n.style.width = rong + 'px';
        const t = document.createElement('b');
        t.textContent = tieu;
        n.appendChild(t);
        n.appendChild(document.createTextNode(v));
        hop.appendChild(n);
      });
    });
  }

  function theoDoiBang() {
    let hen = null;
    try {
      new MutationObserver(() => {
        if (hen || location.pathname.indexOf(TRANG_DON) !== 0) return;
        hen = setTimeout(() => { hen = null; try { danhDauHang(); } catch (e) {} }, 300);
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* ---------- Số đơn trên tên tab: "[7] ⚡1 💬2 · …" ---------- */
  // Bóc HẾT các tiền tố cũ (kể cả khi Chrome đã cắt dấu cách cuối lúc tên tab trống)
  const TIEN_TO_TAB = /^(?:\[\d+\](?: ⚡\d+)?(?: 💬\d+)? ·\s*)+/;
  function datTieuDe() {
    try {
      const goc = document.title.replace(TIEN_TO_TAB, '').trim() || 'TikTok Shop';
      const tien = du && du._ts ? '[' + du.tongCho + ']' + (du.soHT ? ' ⚡' + du.soHT : '') +
                                  (du.soNote ? ' 💬' + du.soNote : '') + ' · ' : '';
      if (document.title !== tien + goc) document.title = tien + goc;
    } catch (e) {}
  }

  
  /* ---------- Bảng In đơn (góc dưới-phải, chỉ máy Cao) ---------- */
  let elPanel = null, elSt = null;
  let pdfDuPhong = null;       // link PDF khi không tự bật được hộp in -> hiện nút mở tay

  const ICON_IN = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;flex:none">' +
    '<path d="M7 9V3h10v6"/><path d="M7 19H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/>' +
    '<rect x="7" y="15" width="10" height="6" rx="1"/></svg>';

  function tronDen(hex, t) {
    const n = parseInt(String(hex).slice(1), 16);
    const f = (x) => Math.round(x * (1 - t));
    return 'rgb(' + f((n >> 16) & 255) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')';
  }
  const mauDV = (ten) => thuTuDV(ten) === 0 ? MAU_GHN : thuTuDV(ten) === 2 ? MAU_JT : MAU_KHAC;
  const nenNut = (g) => g.ht ? 'linear-gradient(135deg,#e53935,#b71c1c)'
    : !g.pid ? '#757575' : 'linear-gradient(135deg,' + mauDV(g.ten) + ',' + tronDen(mauDV(g.ten), 0.16) + ')';

  function taoPanel() {
    if (!document.body || document.getElementById('ctt-panel')) return;
    const p = document.createElement('div');
    p.id = 'ctt-panel';
    p.innerHTML =
      '<div class="hd"><span class="den"></span>' +
      '<span class="tde">' + ICON_IN + '<span>IN ĐƠN <i>TIKTOK</i></span></span>' +
      '<span class="shop"></span><span class="ver">' + PHIEN_BAN + '</span>' +
      '<span class="bar">' +
        '<button type="button" class="ic rf" title="Đọc lại đơn ngay"><span>⟳</span></button>' +
        '<button type="button" class="ic bl" title="Báo lỗi: copy nhật ký + tình trạng hiện tại để dán gửi Claude">📋</button>' +
        '<button type="button" class="ic x" title="Thu gọn">–</button>' +
      '</span></div>' +
      '<div class="body"></div><div class="st"></div>' +
      '<div class="ft"><span class="pill"></span><span class="gio"></span></div>';
    document.body.appendChild(p);
    elPanel = p;
    elSt = p.querySelector('.st');
    try { if (localStorage.getItem(KEY.thuGon) === '1') p.style.display = 'none'; } catch (e) {}
    p.querySelector('.rf').onclick = () => { nghiToi = 0; docVaVe('bấm ⟳', true); };
    p.querySelector('.bl').onclick = (ev) => chepBaoLoi(ev.currentTarget);
    p.querySelector('.x').onclick = () => thuGon(true);
    ve();
  }

  function thuGon(an) {
    const p = document.getElementById('ctt-panel');
    if (p) p.style.display = an ? 'none' : 'block';
    try { localStorage.setItem(KEY.thuGon, an ? '1' : '0'); } catch (e) {}
    ve();
  }

  function veHuyHieu() {
    let an = false;
    try { an = localStorage.getItem(KEY.thuGon) === '1'; } catch (e) {}
    let b = document.getElementById('ctt-nho');
    if (!an) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('button');
      b.id = 'ctt-nho';
      b.type = 'button';
      b.onclick = () => thuGon(false);
      document.body.appendChild(b);
    }
    const den = trangThaiDen();
    const n = du ? du.tongCho : 0, ht = du ? du.soHT : 0;
    const coDo = ht > 0 || ((du && du.nut) || []).some((g) => g.qh > 0);
    const sig = [n, ht, coDo, den.mau].join('|');
    b.title = 'Mở bảng in đơn TikTok — ' + den.chu;
    if (b.dataset.sig === sig) return;
    b.dataset.sig = sig;
    b.className = coDo ? 'codo' : '';
    b.innerHTML = '<span class="den ' + den.mau + '"></span>' + ICON_IN + '<span>IN TIKTOK</span><span class="so"></span>' +
      (ht ? '<span class="ht">⚡ ' + ht + '</span>' : '');
    b.querySelector('.so').textContent = String(n);
  }

  function trangThaiIn(txt, mau) {
    if (elSt) { elSt.dataset.busy = '1'; elSt.textContent = txt; elSt.style.color = mau || '#555'; }
    log(txt);
  }

  function chip(cha, loai, chu) {
    const c = document.createElement('span');
    c.className = 'chip' + (loai ? ' ' + loai : '');
    c.textContent = chu;
    cha.appendChild(c);
  }

  function veNut(body) {
    body.innerHTML = '';
    if (Date.now() < nghiToi) {
      const t = document.createElement('div');
      t.className = 'bao do';
      t.textContent = '⏸ Tạm dừng đọc tới ' + hhmm(nghiToi) + ' (' + lyDoNghi + '). Nếu TikTok hiện hộp xác minh, anh xác minh giúp rồi bấm ⟳.';
      body.appendChild(t);
    }
    if (pdfDuPhong) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pdf';
      b.textContent = '📄 Mở file nhãn vừa tạo để in (Ctrl+P)';
      b.onclick = () => { const u = pdfDuPhong; pdfDuPhong = null; moCuaSoGoc.call(window, u, '_blank'); ve(); };
      body.appendChild(b);
    }
    const ds = (du && du.nut) || [];
    if (!ds.length) {
      const t = document.createElement('div');
      t.className = 'trong' + (du ? '' : ' cho');
      t.textContent = du ? '✓ Không có đơn nào chờ vận chuyển' : 'Đang đọc đơn…';
      body.appendChild(t);
    }
    ds.forEach((g) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn' + ((g.ht || g.qh) ? ' gap' : '');
      b.style.background = nenNut(g);
      const trai = document.createElement('div');
      trai.className = 'trai';
      const dau = document.createElement('div');
      dau.className = 'dau';
      const ten = document.createElement('span');
      ten.className = 'ten';
      ten.textContent = g.ht ? '⚡ HOẢ TỐC' : (g.ten || 'Chưa rõ ĐVVC');
      dau.appendChild(ten);
      if (g.qh) chip(dau, 'qh', '⚠ ' + g.qh + ' quá hạn');
      if (g.tn) chip(dau, 'tn', '💬 ' + g.tn + ' Note');
      if (g.sl) chip(dau, 'sl', 'SL nhiều');
      if (g.gt) chip(dau, 'gt', 'Giá trị cao');
      trai.appendChild(dau);
      const hop = document.createElement('div');
      hop.className = 'sku';
      if (g.ht) {
        // Hoả tốc: ghi TỪNG ĐƠN kèm ĐVVC + mã hàng, để nhân sự biết hàng gì cần chuẩn bị
        g.don.forEach((d) => {
          const dg = document.createElement('span');
          dg.className = 'dong dht';
          const bb = document.createElement('b');
          bb.textContent = d.dv + ' · ';
          dg.appendChild(bb);
          // Bản 1.4: thêm MÃ ĐƠN trước mã hàng
          const md = document.createElement('span');
          md.className = 'mad';
          md.textContent = d.id;
          dg.appendChild(md);
          dg.appendChild(document.createTextNode(' ' + d.sp));
          hop.appendChild(dg);
        });
      } else {
        const xep = (g.sp || []).slice().sort((a, c) => {
          if (a.gia === null && c.gia === null) return c.n - a.n;
          if (a.gia === null) return 1;
          if (c.gia === null) return -1;
          return c.gia - a.gia || c.n - a.n;
        });
        xep.forEach((x) => {
          const dat = x.gia !== null && x.gia >= NGUONG_HANG_DAT;
          const hiem = x.gia !== null && x.gia >= NGUONG_HANG_HIEM;
          const dg = document.createElement('span');
          dg.className = 'dong' + (dat ? ' dat' : '') + (hiem ? ' hiem' : '');
          dg.appendChild(document.createTextNode(x.v + ' '));
          const sl = document.createElement('span');
          sl.className = 'sl' + (x.n >= 2 ? ' nhieu' : '');
          sl.textContent = 'x' + x.n;
          dg.appendChild(sl);
          hop.appendChild(dg);
        });
        if (!xep.length) hop.textContent = '⚠ chưa đọc được sản phẩm';
      }
      trai.appendChild(hop);
      const so = document.createElement('span');
      so.className = 'so';
      so.innerHTML = '<span class="con"></span><span class="dv">đơn</span>';
      so.querySelector('.con').textContent = String(g.n);
      b.appendChild(trai);
      b.appendChild(so);
      if (!g.ht && !g.pid) {
        b.disabled = true;
        b.dataset.khoa = '1';
        b.title = 'TikTok chưa trả tên đơn vị vận chuyển của các đơn này — in tay';
      } else {
        b.title = g.ht ? 'In chung ' + g.n + ' đơn HOẢ TỐC' : 'In ' + g.n + ' đơn ' + g.ten + ' (xếp tổng giá cao trước)';
        b.onclick = () => batDauIn(g);
      }
      if (dangChay) b.disabled = true;
      body.appendChild(b);
    });
    const cho = (du && du.cho) || { n: 0, qh: 0, ds: [] };
    if (cho.qh) {
      const h = document.createElement('div');
      h.className = 'bg';
      const t = document.createElement('div');
      t.className = 'bg-h';
      t.textContent = '⚠ ' + cho.qh + '/' + cho.n + ' ĐƠN QUÁ HẠN BÀN GIAO';
      h.appendChild(t);
      cho.ds.slice(0, 12).forEach((o) => {
        const r = document.createElement('div');
        r.className = 'bg-i';
        const a = document.createElement('a');
        a.className = 'bg-ma';
        a.textContent = o.ma;
        a.href = o.href; a.target = '_blank'; a.rel = 'noopener';
        r.appendChild(a);
        r.appendChild(nutCopy(o.ma));
        const gg = document.createElement('span');
        gg.className = 'bg-gio';
        gg.textContent = 'đơn lúc ' + gioNgan(new Date(o.luc));
        r.appendChild(gg);
        h.appendChild(r);
      });
      body.appendChild(h);
    }
  }

  function vePanel() {
    if (!elPanel) return;
    const body = elPanel.querySelector('.body');
    const sig = JSON.stringify((du && du.nut) || null) + '#' + dangChay + '#' + (nghiToi > Date.now()) + '#' +
                JSON.stringify((du && du.cho) || {}) + '#' + !!pdfDuPhong;
    if (body.dataset.sig !== sig && !(dangChay && body.dataset.sig && !pdfDuPhong)) {
      body.dataset.sig = sig;
      veNut(body);
    }
    const den = trangThaiDen();
    const d = elPanel.querySelector('.den');
    d.className = 'den ' + den.mau;
    d.title = den.chu;
    elPanel.querySelector('.shop').textContent = tenShop;
    elPanel.querySelector('.rf').classList.toggle('xoay', dangDoc);
    const cho = (du && du.cho) || { n: 0, qh: 0 };
    const pill = elPanel.querySelector('.pill');
    pill.className = 'pill' + (cho.qh ? ' qh' : '');
    pill.textContent = cho.n ? (cho.qh ? '⚠ ' + cho.qh + '/' + cho.n + ' quá hạn bàn giao' : '🚚 Chờ lấy hàng: ' + cho.n) : '';
    const gio = elPanel.querySelector('.gio');
    if (dangDoc) { gio.className = 'gio dang'; gio.textContent = '⟳ Đang kiểm tra…'; }
    else if (du && du._ts) {
      const phut = Math.round((Date.now() - du._ts) / 60000);
      gio.className = 'gio' + (phut >= 12 ? ' cu' : '');
      gio.textContent = phut >= 12 ? '⚠ ' + hhmm(du._ts) + ' — ' + phut + ' phút chưa cập nhật' : '✓ Cập nhật ' + hhmm(du._ts);
    } else { gio.className = 'gio dang'; gio.textContent = 'Chưa đọc'; }
  }

  /* ---------- Nút 📋 Báo lỗi ---------- */
  function noiDungBaoLoi() {
    luuLog();
    let dong = [];
    try { dong = JSON.parse(localStorage.getItem(KEY.log) || '[]'); } catch (e) {}
    const den = trangThaiDen();
    const now = new Date();
    const nut = ((du && du.nut) || []).map((g) => (g.ht ? '⚡' : '') + (g.ten || '?') + ' ' + g.n).join(', ') || 'không có';
    return [
      '=== BÁO LỖI – ' + TEN_SCRIPT + ' ' + PHIEN_BAN + ' ===',
      'Lúc: ' + hai(now.getHours()) + ':' + hai(now.getMinutes()) + ':' + hai(now.getSeconds()) + ' ' + hai(now.getDate()) + '/' + hai(now.getMonth() + 1) + '/' + now.getFullYear(),
      'Shop: ' + (tenShop || '?') + ' · Trang: ' + location.pathname,
      'Đèn: ' + den.mau + ' — ' + den.chu,
      'Lỗi liên tiếp: ' + loiLienTiep + (loiCuoi ? ' · lỗi gần nhất: ' + loiCuoi.chu : '') + (nghiToi > Date.now() ? ' · đang tạm dừng tới ' + hhmm(nghiToi) : ''),
      'Đọc lúc: ' + (du && du._ts ? gioNgan(new Date(du._ts)) : 'chưa') + ' · Đang đọc: ' + (dangDoc ? 'có' : 'không') + ' · Đang in: ' + (dangChay ? 'có' : 'không'),
      'Nút in: ' + nut,
      'Banner: ' + ((du && du.canhBao) || []).length + ' đơn' + (trangThai ? ' · ' + trangThai.chu : ''),
      'Chờ lấy hàng: ' + (du ? du.cho.n + ' (quá hạn ' + du.cho.qh + ')' : '?'),
      'Việc in đang dở: ' + (docJob() ? JSON.stringify(docJob()).slice(0, 200) : 'không'),
      'Trình duyệt: ' + navigator.userAgent.slice(0, 140),
      '--- Nhật ký ' + dong.length + ' dòng gần nhất ---'
    ].concat(dong).join('\n');
  }
  function chepBaoLoi(nut) {
    chep(noiDungBaoLoi(), () => {
      nut.classList.add('ok'); nut.textContent = '✓';
      trangThaiIn('📋 Đã copy báo lỗi — dán (Ctrl+V) gửi Claude', '#1a9e5a');
      setTimeout(() => {
        nut.classList.remove('ok'); nut.textContent = '📋';
        if (elSt && !dangChay) { delete elSt.dataset.busy; elSt.textContent = ''; }
      }, 4000);
    });
  }

  /* ---------- Quy trình in ----------
     Đã quan sát thật lần Cao in tay (27/09): tick đơn → "Sắp xếp vận chuyển và in" →
     TikTok TỰ sắp xếp vận chuyển + tạo nhãn A6 và danh sách đóng gói, không hỏi gì thêm →
     chuyển sang trang "Đã tạo N nhãn vận chuyển" và tự mở file PDF.
     Script làm y hệt nhưng CHẮC CHẮN chọn đúng đơn trước khi bấm (bấm rồi là không hoàn tác):
       1. Mở trang Cần gửi đã lọc sẵn bằng đường dẫn: "Đang chờ vận chuyển" + đúng nhóm
          (Hoả tốc: delivery_option 5 | ĐVVC: shipping_provider_id), đơn thường xếp
          "Tổng giá (cao nhất trước)" (selected_sort=8) — Cao bắt buộc.
       2. Hỏi TikTok danh sách với ĐÚNG điều kiện đó, so với các đơn đang hiện trên trang:
          lệch 1 đơn là DỪNG, không bấm.
       3. Tick "chọn tất cả", kiểm lại số đơn đã chọn = số đơn cần in.
       4. Bấm nút "Sắp xếp vận chuyển và in" ở thanh dưới cùng.
       5. Khi TikTok mở file PDF, script bắt lấy file và bật thẳng HỘP IN của Chrome
          (đã thử thật: bật được). Anh chọn "Số trang mỗi tờ: 2" rồi bấm In như thường.
          Không bắt được thì TikTok vẫn mở tab PDF như cũ, hoặc bảng hiện nút mở tay. */

  function docJob() {
    try {
      const j = JSON.parse(localStorage.getItem(KEY.job) || 'null');
      return j && Date.now() - j.ts < 5 * 60000 ? j : null;
    } catch (e) { return null; }
  }
  function ghiJob(j) { try { if (j) localStorage.setItem(KEY.job, JSON.stringify(j)); else localStorage.removeItem(KEY.job); } catch (e) {} }

  function duongDanNhom(g) {
    return TRANG_DON + '?order_status[]=1&tab=to_ship' +
      (g.ht ? '&delivery_option[]=5&selected_sort=11' : '&shipping_provider_id[]=' + encodeURIComponent(g.pid) + '&selected_sort=8');
  }
  function dieuKienNhom(g) {
    const c = { order_status: { value: ['1'] }, search_tab: { value: ['101'] } };
    if (g.ht) c.delivery_option = { value: ['5'] }; else c.shipping_provider_id = { value: [String(g.pid)] };
    return c;
  }

  function batDauIn(g) {
    if (dangChay) return;
    const job = { buoc: 'loc', ht: !!g.ht, pid: g.pid || '', ten: g.ht ? 'Hoả tốc' : g.ten, n: g.n, ts: Date.now() };
    ghiJob(job);
    log('Bấm in: ' + (g.ht ? '⚡ Hoả tốc' : g.ten) + ' — ' + g.n + ' đơn');
    trangThaiIn('Đang mở danh sách ' + job.ten + ' đã lọc sẵn…');
    location.href = duongDanNhom(g);
  }

  const doiCho = async (fn, ms, ten) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      try { const v = fn(); if (v) return v; } catch (e) {}
      await sleep(250);
    }
    throw new Error('Quá thời gian chờ: ' + ten);
  };
  const idTrenTrang = () => [...document.querySelectorAll('tbody span.order_id_number')].map((s) => (s.textContent || '').trim()).filter(Boolean);
  const chuCua = (e) => (e ? (e.innerText || e.textContent || '') : '');
  const nhinThay = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

  async function chayIn(job) {
    dangChay = true;
    ve();
    const dung = (chu) => { throw Object.assign(new Error(chu), { dung: true }); };
    try {
      trangThaiIn('Đang chờ TikTok hiện danh sách ' + job.ten + '…');
      // 1) chờ bảng hiện xong và đứng yên
      let ky = '', tu = 0;
      await doiCho(() => {
        const ds = idTrenTrang();
        const coTrong = /Không tìm thấy|Không có đơn hàng|No orders/i.test(chuCua(document.body));
        const sig = ds.join(',') + '#' + coTrong;
        if (sig !== ky) { ky = sig; tu = Date.now(); return false; }
        return (ds.length || coTrong) && Date.now() - tu > 1500;
      }, 30000, 'danh sách đơn trên trang');
      const tren = idTrenTrang();

      // 2) hỏi TikTok đúng điều kiện này để đối chiếu
      const j = await goi('/api/fulfillment/order/list', {
        search_condition: { condition_list: dieuKienNhom(job) }, offset: 0, count: 50,
        sort_info: job.ht ? '11' : '8', search_cursor: '', pagination_type: 0
      });
      const dsApi = ((j.data || {}).main_orders || []).map(docDon);
      const idApi = dsApi.map((o) => o.id);
      if (!idApi.length) { trangThaiIn('Không còn đơn ' + job.ten + ' nào chờ vận chuyển.', '#1a9e5a'); ghiJob(null); return; }
      const sai = dsApi.filter((o) => !o.chuaXL || (job.ht ? !o.ht : (o.ht || o.dvId !== String(job.pid))));
      if (sai.length) dung('TikTok trả về ' + sai.length + ' đơn không đúng nhóm ' + job.ten + ' (' + sai.map((o) => o.id).join(', ') + ') — script DỪNG, không in.');
      const a = new Set(tren), b = new Set(idApi);
      const thieu = idApi.filter((x) => !a.has(x)), thua = tren.filter((x) => !b.has(x));
      if (thieu.length || thua.length || tren.length !== idApi.length) {
        dung('Danh sách trên trang (' + tren.length + ' đơn) KHÔNG khớp với TikTok (' + idApi.length + ' đơn)' +
             (thua.length ? ' — thừa: ' + thua.join(', ') : '') + (thieu.length ? ' — thiếu: ' + thieu.join(', ') : '') +
             '. Script DỪNG, không in. Anh tải lại trang rồi bấm lại.');
      }
      const tongTT = Number((j.data || {}).total_count) || idApi.length;
      if (tongTT > idApi.length) log('Nhóm ' + job.ten + ' có ' + tongTT + ' đơn, lần này in ' + idApi.length + ' đơn trang đầu');

      // 3) tick chọn tất cả rồi kiểm lại
      trangThaiIn('Đang chọn ' + idApi.length + ' đơn…');
      const nhanHd = await doiCho(() => document.querySelector('thead label.p-checkbox') || document.querySelector('thead input[type=checkbox]'), 10000, 'ô chọn tất cả');
      const oHd = () => document.querySelector('thead input[type=checkbox]');
      if (!(oHd() && oHd().checked)) nhanHd.click();
      await doiCho(() => {
        const cb = [...document.querySelectorAll('tbody input[type=checkbox]')];
        return oHd() && oHd().checked && cb.length && cb.every((x) => x.checked);
      }, 8000, 'đã tick đủ các đơn');
      const chuChon = (chuCua(document.body).match(/Đã chọn tất cả\s*(\d+)\s*đơn/) || [])[1];
      if (chuChon && Number(chuChon) !== idApi.length) dung('TikTok báo đã chọn ' + chuChon + ' đơn nhưng cần ' + idApi.length + ' — script DỪNG, không in.');

      // 4) bấm "Sắp xếp vận chuyển và in" ở thanh dưới (không phải nút trong từng dòng)
      const nut = await doiCho(() => [...document.querySelectorAll('button')].find((x) =>
        /Sắp xếp vận chuyển và in/.test(chuCua(x)) && !x.closest('table') && nhinThay(x) && !x.disabled), 10000,
        'nút "Sắp xếp vận chuyển và in"');
      ghiJob(Object.assign({}, job, { buoc: 'in', ids: idApi, n: idApi.length, ts: Date.now() }));
      trangThaiIn('Đang sắp xếp vận chuyển + tạo nhãn cho ' + idApi.length + ' đơn ' + job.ten + '…');
      log('Bấm "Sắp xếp vận chuyển và in" cho: ' + idApi.join(', '));
      nut.click();

      // 5) chờ TikTok chuyển sang trang kết quả (trang mới sẽ tự lo phần bật hộp in)
      const t0 = Date.now();
      let hopCu = '';
      while (Date.now() - t0 < 45000) {
        if (/create-labels-result/.test(location.pathname)) {
          trangThaiIn('TikTok đã tạo nhãn — đang chờ file PDF để mở hộp in…');
          sangTrangKQ = true;   // trang đổi mà không tải lại -> tự theo dõi tiếp ở đây
          return;
        }
        const hop = [...document.querySelectorAll('[role=dialog],[class*="modal" i]')].filter(nhinThay)
          .map((d) => chuCua(d).trim().replace(/\s+/g, ' ').slice(0, 200)).filter(Boolean).join(' || ');
        if (hop && hop !== hopCu) { hopCu = hop; log('TikTok hiện hộp: ' + hop); }
        await sleep(400);
      }
      dung('Đã bấm in nhưng 45 giây chưa thấy trang "Đã tạo nhãn vận chuyển"' +
           (hopCu ? '. TikTok đang hiện: "' + hopCu.slice(0, 120) + '"' : '') + ' — anh xem màn hình và làm tiếp bằng tay.');
    } catch (e) {
      ghiJob(null);
      trangThaiIn('⚠ ' + e.message, '#c62828');
      log('LỖI in:', e.message);
      alert(TEN_SCRIPT + ' — dừng lại:\n\n' + e.message);
    } finally {
      dangChay = false;
      if (sangTrangKQ) { sangTrangKQ = false; theoDoiTrangKetQua(); }
      else setTimeout(() => { if (elSt) delete elSt.dataset.busy; ve(); }, 6000);
      ve();
    }
  }
  let sangTrangKQ = false;

  /* ---------- Bắt file PDF để bật thẳng hộp in ---------- */
  const moCuaSoGoc = window.open;
  let dangInPdf = false;

  function laLinkPdf(u) { return /easesafe|fulfillment_doc|\.pdf(\?|$)/i.test(String(u || '')); }
  function dangChoPdf() { const j = docJob(); return !!(j && j.buoc === 'in'); }

  async function inPdf(u) {
    if (dangInPdf) return;
    dangInPdf = true;
    const job = docJob();
    try {
      u = new URL(String(u), location.href).href;
      log('Bắt được file nhãn — tải về để bật hộp in');
      const r = await window.fetch(u, { credentials: 'include' });
      if (!r.ok) throw new Error('tải file nhãn lỗi HTTP ' + r.status);
      const blob = await r.blob();
      if (blob.size < 800) throw new Error('file nhãn trống (' + blob.size + ' byte)');
      await doiCho(() => document.body, 10000, 'trang');
      const cu = document.getElementById('ctt-inpdf');
      if (cu) cu.remove();
      const f = document.createElement('iframe');
      f.id = 'ctt-inpdf';
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:10px;height:10px;opacity:0;border:0;pointer-events:none';
      f.src = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      document.body.appendChild(f);
      await new Promise((ok) => { f.onload = ok; setTimeout(ok, 8000); });
      await sleep(700);
      ghiJob(null);
      trangThaiIn('🖨 Đã mở hộp in' + (job ? ' ' + job.n + ' nhãn ' + job.ten : '') + ' — chọn "Số trang mỗi tờ: 2" rồi bấm In', '#1a9e5a');
      f.contentWindow.focus();
      f.contentWindow.print();
      log('Đã bật hộp in' + (job ? ' cho ' + job.n + ' nhãn ' + job.ten : ''));
    } catch (e) {
      log('Không tự bật được hộp in: ' + e.message);
      ghiJob(null);
      pdfDuPhong = u;
      trangThaiIn('⚠ Không tự bật được hộp in (' + e.message + ') — bấm nút "📄 Mở file nhãn" trên bảng rồi Ctrl+P', '#c62828');
      ve();
    } finally {
      dangInPdf = false;
      setTimeout(() => docVaVe('sau khi in', true), 8000);
    }
  }

  // Cửa sổ giả trả về cho TikTok khi script giữ lại file PDF (để code của trang không báo lỗi)
  function cuaSoGia() {
    const w = { closed: false, opener: null, close() { this.closed = true; }, focus() {}, blur() {},
                document: { write() {}, writeln() {}, close() {}, open() {} } };
    const loc = { get href() { return ''; }, set href(v) { if (laLinkPdf(v)) inPdf(v); },
                  assign(v) { if (laLinkPdf(v)) inPdf(v); }, replace(v) { if (laLinkPdf(v)) inPdf(v); } };
    Object.defineProperty(w, 'location', { get() { return loc; }, set(v) { if (laLinkPdf(v)) inPdf(v); } });
    return w;
  }

  function batPdf() {
    try {
      window.open = function (url) {
        try {
          if (dangChoPdf()) {
            if (laLinkPdf(url)) { inPdf(url); return cuaSoGia(); }
            if (!url || url === 'about:blank') { log('TikTok mở cửa sổ trống — chờ link PDF'); return cuaSoGia(); }
          }
        } catch (e) {}
        return moCuaSoGoc.apply(this, arguments);
      };
      const clickGoc = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        try { if (dangChoPdf() && laLinkPdf(this.href)) { inPdf(this.href); return; } } catch (e) {}
        return clickGoc.apply(this, arguments);
      };
      document.addEventListener('click', (ev) => {
        try {
          const a = ev.target && ev.target.closest && ev.target.closest('a[href]');
          if (a && dangChoPdf() && laLinkPdf(a.href)) { ev.preventDefault(); ev.stopPropagation(); inPdf(a.href); }
        } catch (e) {}
      }, true);
    } catch (e) { log('Không cài được phần bắt file PDF:', e.message); }
  }

  // Trang "Đã tạo N nhãn vận chuyển": ghi nhận kết quả; quá 25 giây không thấy file PDF
  // thì báo anh in bằng tab PDF của TikTok như cũ.
  async function theoDoiTrangKetQua() {
    const job = docJob();
    if (!job || job.buoc !== 'in') return;
    dangChay = true;
    trangThaiIn('TikTok đã tạo nhãn — đang chờ file PDF để mở hộp in…');
    try {
      const n = await doiCho(() => (chuCua(document.body).match(/Đã tạo\s*(\d+)\s*nhãn/) || [])[1], 8000, 'dòng "Đã tạo N nhãn"').catch(() => null);
      if (n) {
        log('TikTok báo đã tạo ' + n + ' nhãn (cần ' + job.n + ')');
        if (Number(n) !== job.n) trangThaiIn('⚠ TikTok tạo ' + n + ' nhãn nhưng script chọn ' + job.n + ' đơn — anh kiểm tra lại', '#e65100');
      }
      const t0 = Date.now();
      while (Date.now() - t0 < 25000 && dangChoPdf()) await sleep(500);
      if (dangChoPdf()) {
        ghiJob(null);
        log('25 giây không bắt được file PDF — để tab PDF của TikTok lo');
        trangThaiIn('Nhãn đã tạo. Nếu tab PDF đã mở, anh bấm Ctrl+P ở tab đó (bản này chưa tự bật được hộp in).', '#e65100');
      }
    } finally {
      dangChay = false;
      setTimeout(() => { if (elSt) delete elSt.dataset.busy; ve(); }, 15000);
      ve();
    }
  }
  

  /* ---------- Vẽ lại mọi thứ ---------- */
  function ve() {
    if (!document.body) return;
    chenCSS();
    datTieuDe();
    try { veBanner(); } catch (e) { log('Vẽ banner lỗi:', e.message); }
    try { danhDauHang(); } catch (e) {}
    
    try { veHuyHieu(); vePanel(); } catch (e) { log('Vẽ bảng lỗi:', e.message); }
    
  }

  /* ---------- Khởi động ---------- */
  // Chạy từ lúc trang vừa bắt đầu tải để kịp nghe lệnh của trang (và bắt file PDF ở bản In đơn);
  // phần giao diện đợi trang dựng xong mới vẽ.
  ngheTrang();
   batPdf(); 

  function khoiDong() {
    // Bản 1.3: KHÔNG hiện lại dữ liệu cũ khi vừa tải trang (Note đã xoá sẽ bị hiện nhầm vài giây).
    // Dữ liệu cũ chỉ để dự phòng: lần đọc đầu tiên mà lỗi thì mới dùng tạm, kèm cảnh báo.
    try { duCu = JSON.parse(localStorage.getItem(KEY.so) || 'null'); } catch (e) { duCu = null; }
    du = null;
    kiemTraShop();
    chenCSS();
    theoDoiBang();
    
    taoPanel();
    setInterval(taoPanel, 2000);
    
    ve();
    log('Khởi động bản ' + PHIEN_BAN + ' tại ' + location.pathname);

    
    const job = docJob();
    if (job && job.buoc === 'loc' && location.pathname.indexOf(TRANG_DON) === 0 && !/create-labels/.test(location.pathname)) {
      ghiJob(Object.assign({}, job, { buoc: 'chon', ts: Date.now() }));
      setTimeout(() => chayIn(job), 1500);
    } else if (job && job.buoc === 'in' && /create-labels-result/.test(location.pathname)) {
      theoDoiTrangKetQua();
    } else if (job && job.buoc === 'chon') {
      ghiJob(null);   // lần trước dừng giữa chừng (tải lại trang...) -> bỏ, không tự bấm lại
    }
    

    // Đọc ngay khi trang vừa tải, rồi theo nhịp: 90 giây khi đang xem, 5 phút khi tab ẩn
    // Tải lại trang là đọc ngay lập tức
    docVaVe('trang vừa tải');
    setInterval(() => {
      const ck = document.hidden ? CHU_KY_KHI_AN : CHU_KY_KHI_XEM;
      if (Date.now() - lanDocCuoi >= ck) docVaVe('định kỳ');
      else ve();
      if (dangDoc && Date.now() - mocDoc > 90000) { log('Vòng đọc treo quá 90 giây — gỡ kẹt'); dangDoc = false; }
      if (coHopXacMinh() && Date.now() >= nghiToi) { tamDung('TikTok đang hiện hộp xác minh'); ve(); }
    }, 15000);
    const docLaiNeuCu = () => { if (Date.now() - lanDocCuoi > 30000) docVaVe('quay lại tab'); else ve(); };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) docLaiNeuCu(); });
    window.addEventListener('focus', docLaiNeuCu);
    let urlCu = location.href;
    setInterval(() => {
      if (location.href !== urlCu) { urlCu = location.href; setTimeout(ve, 800); }
      datTieuDe();
      if (!document.getElementById('ctt-css')) chenCSS();
    }, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiDong);
  else khoiDong();

  /* ---------- Bản 1.5: nút "👁 Xem ngay" trên popup đơn hoả tốc ----------
     Bấm -> mở trang Đơn hàng › Cần gửi (lọc Hoả tốc), lọc đơn hoả tốc và TICK SẴN tất cả đơn hoả tốc đang chờ.
     Script KHÔNG bấm in / giao hàng — người dùng tự bấm. */
  const XN = { POPUP: 'ctt-banner', NHAN: '.ctt-nh.ht', KEY: 'xemngay_job_ctt', P: 'ctt' };
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

  // TikTok: Đơn hàng -> Cần gửi, Đang chờ vận chuyển, lọc Hoả tốc (delivery_option 5) -> tick tất cả
  function xnDuongDich() { return '/order?order_status[]=1&tab=to_ship&delivery_option[]=5&selected_sort=11'; }
  function xnLaTrangDich() { return location.pathname === '/order' && /delivery_option/.test(decodeURIComponent(location.search)); }
  async function xnChonHoaToc() {
    const idTren = function () { return [...document.querySelectorAll('tbody span.order_id_number')].map(function (s) { return (s.textContent || '').trim(); }).filter(Boolean); };
    let ky = '', tu = 0;
    await xnCho(function () {
      const ds = idTren();
      const trong = /Không tìm thấy|Không có đơn hàng|Tìm thấy 0 đơn|No orders/i.test(document.body.innerText || '');
      const k = ds.join(',') + '#' + trong;
      if (k !== ky) { ky = k; tu = Date.now(); return false; }
      return (ds.length || trong) && Date.now() - tu > 1500;
    }, 30000, 'danh sách đơn hoả tốc');
    const n = idTren().length;
    if (!n) return 0;
    const oHd = function () { return document.querySelector('thead input[type=checkbox]'); };
    const nhan = await xnCho(function () { return document.querySelector('thead label.p-checkbox') || oHd(); }, 10000, 'ô chọn tất cả');
    if (!(oHd() && oHd().checked)) nhan.click();
    await xnCho(function () { const cb = [...document.querySelectorAll('tbody input[type=checkbox]')]; return oHd() && oHd().checked && cb.length && cb.every(function (x) { return x.checked; }); }, 8000, 'tất cả đơn được tick');
    return n;
  }

  setTimeout(xnBatDau, 2500);   // bản 1.5: nút Xem ngay
})();
