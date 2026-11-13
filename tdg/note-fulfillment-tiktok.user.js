// ==UserScript==
// @name         Note fulfillment tiktok
// @namespace    sonmochuong.ntt
// @version      1.5.1
// @description  PC in đơn — TikTok Shop: banner cảnh báo giữa-trên màn hình (hoả tốc, Note khách, Note shop, SL nhiều, giá trị cao) + tô màu và dải Note trên bảng đơn + đèn trạng thái + số đơn trên tên tab. Không in, không có nút Báo lỗi.
// @match        https://seller-vn.tiktok.com/*
// @run-at       document-start
// @noframes
// @updateURL    https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/note-fulfillment-tiktok.user.js
// @downloadURL  https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/note-fulfillment-tiktok.user.js
// @grant        none
// ==/UserScript==

/* Lưu ý cài đặt: mỗi bản có TÊN RIÊNG ("Note fulfillment tiktok 1.3", "1.4"...), Tampermonkey coi là
   script khác nhau -> cài bản mới xong phải TẮT/XOÁ bản cũ. Quên tắt thì bản khởi động
   sau sẽ tự tắt và hiện dòng đỏ nhắc. */

(function () {
  'use strict';

  const PHIEN_BAN = '1.5.1';
  const TEN_SCRIPT = 'Note fulfillment tiktok';

  if (window.__NOTE_FULFILLMENT_TIKTOK) {
    const banKia = 'bản ' + window.__NOTE_FULFILLMENT_TIKTOK;
    const nhac = () => {
      if (!document.body || document.getElementById('ntt-trung-ban')) return;
      const d = document.createElement('div');
      d.id = 'ntt-trung-ban';
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
  window.__NOTE_FULFILLMENT_TIKTOK = PHIEN_BAN;

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

  

  /* =================================================================== */

  const APP_ID = '4068';        // mã ứng dụng Seller Center VN (đã thấy trong mọi lệnh của trang)
  const KEY = {
    shop: 'ntt_SHOP_V1',
    so: 'ntt_SO_V1',
    log: 'ntt_LOG_V1',
    thuGon: 'ntt_THUGON',
    job: 'ntt_JOB_V1'
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
      if (!goc || goc.nttNghe) return;
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
      moi.nttNghe = true;
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
    @keyframes nttChop{
      0%,100%{border-color:var(--tc,#d32f2f);box-shadow:0 8px 24px rgba(0,0,0,.25),0 0 0 0 transparent}
      50%{border-color:var(--ts,#ff5252);
        box-shadow:0 8px 24px rgba(0,0,0,.25),0 0 22px 5px color-mix(in srgb,var(--tc,#d32f2f) 45%,transparent)}}
    #ntt-banner{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483600;
      max-width:min(720px,82vw);width:max-content;font-family:__FONT__}
    #ntt-banner .ntt-rows{border:3px solid var(--tc,#d32f2f);border-radius:12px;background:#fff;
      padding:6px 8px;max-height:26vh;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.32);
      animation:nttChop .9s ease-in-out infinite}
    #ntt-banner .ntt-r{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;padding:6px 10px;
      border-radius:8px;background:var(--rn,#fdeceb);border:1px solid var(--rv,#f1b5ae)}
    #ntt-banner .ntt-r + .ntt-r{margin-top:6px}
    #ntt-banner .ntt-nh{flex:none;font-size:10.5px;font-weight:900;color:#fff;border-radius:4px;
      padding:1px 6px;letter-spacing:.2px;line-height:1.5;white-space:nowrap}
    .ntt-nh.ht,.ntt-mk-b .ht{background:#c62828}
    .ntt-nh.tnk,.ntt-mk-b .tnk{background:#1565c0}
    .ntt-nh.tns,.ntt-mk-b .tns{background:#00897b}
    .ntt-nh.sl,.ntt-mk-b .sl{background:#6a1b9a}
    .ntt-nh.gt,.ntt-mk-b .gt{background:#e65100}
    #ntt-banner a.ntt-ma{font-size:13.5px;font-weight:900;color:var(--rc,#c62828);text-decoration:none;
      letter-spacing:.2px;flex:none}
    #ntt-banner a.ntt-ma:hover{text-decoration:underline}
    button.ntt-cp{all:unset;display:inline-block;cursor:pointer;background:#d32f2f;color:#fff;
      font-size:11px;font-weight:800;padding:2px 8px;border-radius:5px;line-height:1.5;flex:none}
    button.ntt-cp:hover{background:#b71c1c}
    button.ntt-cp.ok{background:#1a9e5a}
    #ntt-banner .ntt-t{font-size:13px;color:#3d2b28;font-weight:700;word-break:break-word;
      flex:1 1 260px;min-width:0}
    #ntt-banner .ntt-t .k{color:#0d47a1}
    #ntt-banner .ntt-t .s{color:#00695c}
    #ntt-banner button.ntt-cp{background:var(--rc,#d32f2f)}
    #ntt-banner button.ntt-cp:hover{background:var(--rc,#d32f2f);filter:brightness(.85)}
    #ntt-banner .ntt-them{margin:4px auto 0;width:max-content;font-size:11px;font-weight:800;
      color:#fff;background:var(--tc,#8d1616);border-radius:9px;padding:1px 10px}
    #ntt-banner .ntt-st{margin:4px auto 0;width:max-content;max-width:100%;font-size:11.5px;
      font-weight:800;line-height:1.4;padding:2px 10px;border-radius:9px;color:#8a8a8a;
      background:rgba(255,255,255,.94);border:1px solid #e3e3e3;box-shadow:0 1px 4px rgba(0,0,0,.1)}
    #ntt-banner .ntt-st.canh{color:#fff;background:#e65100;border-color:#e65100}
    #ntt-banner .ntt-st.hong{color:#fff;background:#c62828;border-color:#c62828;
      animation:nttNhay .9s ease-in-out infinite}
    #ntt-banner .ntt-st .den{display:inline-block;width:8px;height:8px;border-radius:50%;
      margin-right:6px;background:#bdbdbd}
    #ntt-banner .ntt-st.xanh .den{background:#1a9e5a}
    #ntt-banner .ntt-st.canh .den{background:#fff}
    #ntt-banner .ntt-st.hong .den{background:#ffeb3b}
    @keyframes nttNhay{0%,100%{opacity:1}50%{opacity:.5}}

    /* Tô màu dòng đơn cần chú ý ngay trong bảng Quản lý đơn hàng của TikTok */
    /* Bản 1.4 (phương án B như Shopee): bỏ vạch bên trái (từng đè ô tick) — cả dòng nền nhạt
       + khung bo góc theo MÀU LOẠI ĐƠN (đỏ hoả tốc · xanh dương Note khách · xanh ngọc Note shop
       · tím SL nhiều · cam giá trị cao) */
    tr.ntt-mk > td{background:var(--ntt-n,#fdeceb) !important;
      box-shadow:inset 0 2px 0 var(--ntt-c,#c62828),inset 0 -2px 0 var(--ntt-c,#c62828) !important}
    tr.ntt-mk > td:first-child{border-radius:8px 0 0 8px;
      box-shadow:inset 2px 0 0 var(--ntt-c,#c62828),inset 0 2px 0 var(--ntt-c,#c62828),inset 0 -2px 0 var(--ntt-c,#c62828) !important}
    tr.ntt-mk > td:last-child{border-radius:0 8px 8px 0;
      box-shadow:inset -2px 0 0 var(--ntt-c,#c62828),inset 0 2px 0 var(--ntt-c,#c62828),inset 0 -2px 0 var(--ntt-c,#c62828) !important}
    .ntt-mk-b{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
    .ntt-mk-b span{font:900 10.5px/1.6 __FONT__;color:#fff;border-radius:4px;padding:0 6px;white-space:nowrap}
    .ntt-mk-note{position:relative;z-index:3;margin-top:6px;padding:7px 12px;border-radius:6px;
      background:#d6e7fb;color:#0d2f5e;word-break:break-word;
      white-space:normal;font:600 13.5px/1.45 __FONT__;box-sizing:border-box}
    .ntt-mk-note b{color:#1565c0;font-weight:800}
    .ntt-mk-note.s{background:#d2efeb;color:#004d40}
    .ntt-mk-note.s b{color:#00796b}
    
  `).replace(/__FONT__/g, FONT);

  function chenCSS() {
    if (document.getElementById('ntt-css')) return;
    const s = document.createElement('style');
    s.id = 'ntt-css';
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
    c.className = 'ntt-cp';
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
    
     const hienSt = true; 
    let p = document.getElementById('ntt-banner');
    if (!ds.length && !hienSt) { if (p) p.remove(); chuKyBanner = ''; return; }
    const stChu =  den.mau === 'xanh' && du ? 'Note: đã kiểm ' + du.tongCho + ' đơn lúc ' + hhmm(du._ts) :  den.chu;
    const ck = JSON.stringify(ds.map((o) => [o.id, o.tnK, o.tnS, o.ht, o.slNhieu, o.gt, o.spChinh, o.dvTen])) + '#' + den.mau + stChu;
    if (p && ck === chuKyBanner) return;
    if (!p) { p = document.createElement('div'); p.id = 'ntt-banner'; document.body.appendChild(p); }
    chuKyBanner = ck;
    p.innerHTML = '';
    if (ds.length) {
      const rows = document.createElement('div');
      rows.className = 'ntt-rows';
      const coLoai = new Set(ds.map(loaiChinh));
      datMau(p, THU_TU_LOAI.find((l) => coLoai.has(l)) || 'ht', '--t');
      ds.forEach((o) => {
        const r = document.createElement('div');
        r.className = 'ntt-r';
        datMau(r, loaiChinh(o), '--r');
        nhanCua(o).forEach(([l, c]) => {
          const s = document.createElement('span');
          s.className = 'ntt-nh ' + l;
          s.textContent = c;
          r.appendChild(s);
        });
        const a = document.createElement('a');
        a.className = 'ntt-ma';
        a.textContent = o.ma;
        a.href = o.href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.title = 'Mở đơn này trong tab mới';
        r.appendChild(a);
        r.appendChild(nutCopy(o.ma));
        const t = document.createElement('span');
        t.className = 'ntt-t';
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
          m.className = 'ntt-them';
          m.textContent = '▼ Tổng ' + ds.length + ' đơn cần chú ý — cuộn trong khung để xem hết';
          p.insertBefore(m, rows.nextSibling);
        }
      });
    }
    if (hienSt) {
      const st = document.createElement('div');
      st.className = 'ntt-st ' + (den.mau === 'do' ? 'hong' : den.mau === 'cam' ? 'canh' : 'xanh');
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
      const coB = hop.querySelector('.ntt-mk-b');
      const coNote = hop.querySelectorAll('.ntt-mk-note').length;
      // Bản 1.1: nhãn "Note khách/Note shop" không gắn dưới mã đơn nữa (dải Note ngay bên dưới
      // đã ghi rõ) — chỉ giữ nhãn Hoả tốc / SL nhiều / Giá trị cao.
      const nhanDong = nhan.filter((n) => n[0] !== 'tnk' && n[0] !== 'tns');
      const canNote = o ? (o.tnK ? 1 : 0) + (o.tnS ? 1 : 0) : 0;
      const bang = tr.closest('table');
      const rong = Math.max(240, ((bang && bang.parentElement) ? bang.parentElement.clientWidth : 900) - 70);
      if ((tr.dataset.nttMk || '') === sig &&
          (!sig ? !coB && !tr.classList.contains('ntt-mk')
                : !!coB === nhanDong.length > 0 && tr.classList.contains('ntt-mk') && coNote === canNote)) {
        hop.querySelectorAll('.ntt-mk-note').forEach((n) => { n.style.width = rong + 'px'; });
        return;
      }
      tr.dataset.nttMk = sig;
      if (coB) coB.remove();
      hop.querySelectorAll('.ntt-mk-note').forEach((n) => n.remove());
      if (!sig) {
        tr.classList.remove('ntt-mk');
        ['c', 'n', 'v', 's'].forEach((k) => tr.style.removeProperty('--ntt-' + k));
        hop.style.removeProperty('overflow');
        return;
      }
      tr.classList.add('ntt-mk');
      datMau(tr, nhan[0][0], '--ntt-');
      hop.style.setProperty('overflow', 'visible', 'important');
      if (nhanDong.length) {
        const b = document.createElement('div');
        b.className = 'ntt-mk-b';
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
        n.className = 'ntt-mk-note' + (l ? ' ' + l : '');
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

  

  /* ---------- Vẽ lại mọi thứ ---------- */
  function ve() {
    if (!document.body) return;
    chenCSS();
    datTieuDe();
    try { veBanner(); } catch (e) { log('Vẽ banner lỗi:', e.message); }
    try { danhDauHang(); } catch (e) {}
    
  }

  /* ---------- Khởi động ---------- */
  // Chạy từ lúc trang vừa bắt đầu tải để kịp nghe lệnh của trang (và bắt file PDF ở bản In đơn);
  // phần giao diện đợi trang dựng xong mới vẽ.
  ngheTrang();
  

  function khoiDong() {
    // Bản 1.3: KHÔNG hiện lại dữ liệu cũ khi vừa tải trang (Note đã xoá sẽ bị hiện nhầm vài giây).
    // Dữ liệu cũ chỉ để dự phòng: lần đọc đầu tiên mà lỗi thì mới dùng tạm, kèm cảnh báo.
    try { duCu = JSON.parse(localStorage.getItem(KEY.so) || 'null'); } catch (e) { duCu = null; }
    du = null;
    kiemTraShop();
    chenCSS();
    theoDoiBang();
    
    ve();
    log('Khởi động bản ' + PHIEN_BAN + ' tại ' + location.pathname);

    

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
      if (!document.getElementById('ntt-css')) chenCSS();
    }, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiDong);
  else khoiDong();

  /* ---------- Bản 1.5: nút "👁 Xem ngay" trên popup đơn hoả tốc ----------
     Bấm -> mở trang Đơn hàng › Cần gửi (lọc Hoả tốc), lọc đơn hoả tốc và TICK SẴN tất cả đơn hoả tốc đang chờ.
     Script KHÔNG bấm in / giao hàng — người dùng tự bấm. */
  const XN = { POPUP: 'ntt-banner', NHAN: '.ntt-nh.ht', KEY: 'xemngay_job_ntt', P: 'ntt' };
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
