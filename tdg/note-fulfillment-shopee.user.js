// ==UserScript==
// @name         Note fulfillment shopee
// @namespace    sonmochuong.notefulfillment
// @version      3.6.1
// @description  PC in đơn (đóng gói/in đơn): banner nhỏ gọn giữa-trên màn hình báo đơn hoả tốc, đơn có Note, đơn có mã số lượng ≥10, đơn giá trị ≥3 triệu + tô màu dòng đơn và hiện nội dung Note trên trang Giao Hàng Loạt + đèn trạng thái + số đơn trên tên tab. Có tự kiểm tra để không bỏ sót.
// @match        https://banhang.shopee.vn/*
// @run-at       document-idle
// @noframes
// @updateURL    https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/note-fulfillment-shopee.user.js
// @downloadURL  https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/note-fulfillment-shopee.user.js
// @grant        none
// ==/UserScript==

/* Lưu ý cài đặt: từ bản 2.0 mỗi bản có TÊN RIÊNG ("Note fulfillment 3.2", "3.3"...),
   Tampermonkey coi là script khác nhau -> cài bản mới xong phải TẮT/XOÁ bản cũ.
   Quên tắt thì bản khởi động sau sẽ tự tắt và hiện dòng đỏ nhắc. */

(function () {
  'use strict';

  if (window.__NOTE_FULFILLMENT) {
    const banKia = window.__NOTE_FULFILLMENT === true ? 'bản cũ' : 'bản ' + window.__NOTE_FULFILLMENT;
    console.log('%c[Note fulfillment 3.5]', 'color:#ee4d2d;font-weight:bold',
      'Đã có ' + banKia + ' đang chạy — bản 3.5 tự tắt.');
    const nhac = () => {
      if (!document.body || document.getElementById('ntf-trung-ban')) return;
      const d = document.createElement('div');
      d.id = 'ntf-trung-ban';
      d.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;background:#c62828;' +
        'color:#fff;font:800 13px system-ui,sans-serif;padding:8px 12px;border-radius:8px;' +
        'box-shadow:0 4px 14px rgba(0,0,0,.3);max-width:420px;line-height:1.4';
      d.textContent = '⚠ Đang có 2 bản Note fulfillment cùng cài: ' + banKia + ' đang chạy nên bản 3.5 KHÔNG chạy. ' +
        'Vào Tampermonkey tắt/xoá bản cũ rồi tải lại trang.';
      document.body.appendChild(d);
    };
    if (document.body) nhac(); else document.addEventListener('DOMContentLoaded', nhac);
    return;
  }
  window.__NOTE_FULFILLMENT = '3.6.1';

  /* ===================================================================
     PHẦN CÀI ĐẶT
     =================================================================== */

  const PHIEN_BAN          = '3.6.1';
  const NGUONG_SO_LUONG    = 10;        // 1 mã sản phẩm trong đơn có số lượng từ mức này
  const NGUONG_GIA_TRI_DON = 3000000;   // tổng tiền hàng của đơn (giá bán × SL, bỏ quà) từ mức này
  const CHU_KY_DOC_GIAY   = 45;       // tự đọc lại mỗi 45 giây
  const HIEN_KHI_YEN      = true;     // không có note vẫn hiện 1 dòng xám nhỏ "đã kiểm lúc..."
  const DO_DAI_TOI_DA_TEN = 40;

  /* =================================================================== */

  // Bản 3.0 ghi hàng theo TÊN PHÂN LOẠI nên dùng khoá mới (bộ nhớ cũ ghi theo SKU)
  const KEY_NHO = 'NTF_NHO_V4';   // nhớ chi tiết đơn đã đọc (note + hàng trong đơn), theo từng Shop
  const TRANG_GHL = '/portal/sale/mass/ship';
  const HAN_NHO = 3 * 24 * 3600 * 1000;

  const log = (...a) => console.log('%c[Note-fulfillment v' + PHIEN_BAN + ']',
    'color:#ee4d2d;font-weight:bold', ...a);
  const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
  const hai = (n) => (n < 10 ? '0' : '') + n;
  const gioNgan = (t) => { const d = new Date(t); return hai(d.getHours()) + ':' + hai(d.getMinutes()); };

  /* ---------- Bộ nhớ chi tiết đơn ----------
     Note của khách và giá sản phẩm KHÔNG đổi sau khi đặt, nên đọc thành công
     một lần là nhớ luôn. Nhờ vậy: (1) mỗi vòng chỉ hỏi chi tiết đơn MỚI, nhẹ
     máy và ít bị sàn chặn; (2) lỡ một lần hỏi bị lỗi thì note đã biết vẫn
     còn đó, không bao giờ "biến mất" vì lỗi mạng. */

  let nho = { shop: null, don: {} };   // don: { order_id: {ma, tn, hang:[{ten,sku,sl,gia,qua}], t} }
  try { localStorage.removeItem('NTF_NHO_V3'); } catch (e) {}   // bộ nhớ của bản 2.x
  try {
    const x = JSON.parse(localStorage.getItem(KEY_NHO) || 'null');
    if (x && x.don) nho = x;
  } catch (e) {}

  function luuNho() {
    const gio = Date.now();
    Object.keys(nho.don).forEach((k) => { if (gio - (nho.don[k].t || 0) > HAN_NHO) delete nho.don[k]; });
    try { localStorage.setItem(KEY_NHO, JSON.stringify(nho)); } catch (e) {}
  }

  // Đổi sang Shop khác (SMH <-> THHX) thì xoá sạch bộ nhớ của Shop cũ,
  // tránh hiện nhầm note của Shop này lên Shop kia.
  function kiemTraShop(shopId) {
    if (!shopId) return;
    shopId = String(shopId);
    if (nho.shop && nho.shop !== shopId) {
      log('Đổi Shop ' + nho.shop + ' → ' + shopId + ': xoá bộ nhớ Shop cũ');
      nho = { shop: shopId, don: {} };
      dangHien = [];
      luuNho();
    } else if (!nho.shop) {
      nho.shop = shopId;
    }
  }

  /* ---------- Gọi API Shopee ---------- */

  const layCDS = () => (document.cookie.match(/(?:^|;\s*)SPC_CDS=([^;]+)/) || [])[1] || '';

  async function goi(duong, body) {
    const cds = layCDS();
    if (!cds) { const e = new Error('mất đăng nhập'); e.matDN = true; throw e; }
    const ac = new AbortController();
    const hen = setTimeout(() => ac.abort(), 15000);
    try {
      // "_src=ntf": đánh dấu lệnh của script, để phân biệt với lệnh của chính trang
      // Shopee (đã thử thật: sàn chấp nhận tham số này ở cả 4 loại lệnh đang dùng).
      const url = duong + (duong.indexOf('?') >= 0 ? '&' : '?') + 'SPC_CDS=' + cds + '&SPC_CDS_VER=2&_src=ntf';
      const r = await fetch(url, body ? {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: ac.signal, credentials: 'include'
      } : { signal: ac.signal, credentials: 'include' });
      if (r.redirected && /accounts\.shopee/.test(r.url)) {
        const e = new Error('mất đăng nhập'); e.matDN = true; throw e;
      }
      if (r.status === 401 || r.status === 403) {
        const e = new Error('mất đăng nhập (HTTP ' + r.status + ')'); e.matDN = true; throw e;
      }
      const j = await r.json();
      if (j && j.code) {
        const e = new Error('sàn báo lỗi ' + j.code + ' ' + (j.message || ''));
        e.maSan = j.code;
        throw e;
      }
      return j || {};
    } finally {
      clearTimeout(hen);
    }
  }

  // Hỏi một bộ lọc, đi hết các trang cho tới khi gom đủ "total" đơn sàn báo.
  // (Đã thử thật: trang 1 và trang 2 của Shopee trả trùng nhau, nên không dừng
  // chỉ vì một trang không có đơn mới — dừng khi đủ total, hết đơn, hoặc 3
  // trang liền không có gì mới.)
  async function hoiBoLoc(entityType, loc) {
    const gap = new Map();
    let total = null, rong = 0;
    for (let trang = 1; trang <= 40; trang++) {
      const body = {
        order_list_tab: 300,
        pagination: { from_page_number: 1, page_number: trang, page_size: 200 },
        filter: loc, sort: { sort_type: 1 }, current_time: Math.floor(Date.now() / 1000)
      };
      if (entityType) body.entity_type = entityType;
      const j = await goi('/api/v3/order/search_order_list_index', body);
      const d = j.data || {};
      const ds = d.index_list || [];
      if (d.pagination && typeof d.pagination.total === 'number') total = d.pagination.total;
      let moi = 0;
      ds.forEach((x) => {
        if (x.shop_id) kiemTraShop(x.shop_id);
        if (x.order_id && !gap.has(String(x.order_id))) { gap.set(String(x.order_id), 1); moi++; }
        if (x.order_id && entityType === 3) donHoaToc.add(String(x.order_id));
      });
      if (!ds.length || total === null || gap.size >= total) break;
      rong = moi ? 0 : rong + 1;
      if (rong >= 3) break;
    }
    return { ids: [...gap.keys()], du: total === null || gap.size >= total };
  }

  // Tìm TẤT CẢ đơn "Chờ lấy hàng — chưa xử lý". Không đoán sàn xếp đơn vào
  // nhóm nào: hỏi nhiều bộ lọc rồi gộp lại (trùng thì bỏ).
  //   - Bộ lọc thường: loại đơn 1 (không/ có ưu tiên 1, 2) + loại đơn 2 + loại đơn 3.
  //     Loại 2, 3 từng gặp ở các script cũ; shop khác nhau có thể dùng loại khác nhau.
  //   - Bộ lọc mở rộng (chỉ khi đếm không khớp): thêm mọi tổ hợp còn lại.
  // Đơn hoả tốc = đơn nằm trong nhóm "Đơn Hoả Tốc" của Shopee (entity_type 3).
  // Đã thử thật 27/09: nút "Đơn Hoả Tốc" trên trang Giao Hàng Loạt chính là nhóm này.
  const donHoaToc = new Set();

  const LOC_THUONG = [
    [1, {}], [1, { shipping_priority: 1 }], [1, { shipping_priority: 2 }],
    [2, {}], [3, {}]
  ];
  const LOC_MO_RONG = [
    [0, {}], [0, { shipping_priority: 1 }], [0, { shipping_priority: 2 }],
    [2, { shipping_priority: 1 }], [2, { shipping_priority: 2 }],
    [3, { shipping_priority: 1 }], [3, { shipping_priority: 2 }]
  ];

  // Bộ lọc phụ mà sàn từ chối hẳn (trả mã lỗi) ở Shop này thì ghi nhớ và bỏ qua,
  // để không báo "chưa trọn vẹn" mãi. Bộ lọc chính lỗi thì luôn coi là hỏng.
  // Đã có tự kiểm tra bằng số đếm của sàn đứng sau, nên bỏ qua như vậy vẫn an toàn.
  // (Chỉ bỏ qua 30 phút rồi thử lại, phòng trường hợp sàn lỗi thoáng qua.)
  const locSanTuChoi = new Map();   // khoá bộ lọc -> bỏ qua tới lúc nào

  async function timDonChuaXL(moRong) {
    const ds = moRong ? LOC_THUONG.concat(LOC_MO_RONG) : LOC_THUONG;
    const gop = new Set();
    let hong = 0, hongChinh = false, thieuTrang = false, matDN = false;
    for (let i = 0; i < ds.length; i++) {
      const [et, them] = ds[i];
      const khoa = et + JSON.stringify(them);
      if (i > 0 && (locSanTuChoi.get(khoa) || 0) > Date.now()) continue;
      try {
        const kq = await hoiBoLoc(et, Object.assign({ order_to_ship_status: 1 }, them));
        kq.ids.forEach((id) => gop.add(id));
        if (!kq.du) thieuTrang = true;
      } catch (e) {
        if (e.matDN) matDN = true;
        if (i > 0 && e.maSan && !e.matDN) {
          locSanTuChoi.set(khoa, Date.now() + 30 * 60000);
          log('Sàn không nhận bộ lọc ' + khoa + ' (' + e.message + ') — tạm bỏ qua 30 phút');
          continue;
        }
        hong++;
        if (i === 0) hongChinh = true;
        log('Bộ lọc ' + khoa + ' lỗi: ' + e.message);
      }
    }
    return { ids: [...gop], hong: hong, hongChinh: hongChinh, thieuTrang: thieuTrang, matDN: matDN };
  }

  // Con số "Chờ Lấy Hàng" ngay trên trang chủ Kênh Người Bán — nguồn đếm độc lập
  // của chính Shopee, dùng để tự đối chiếu xem script có đọc sót đơn nào không.
  async function demCuaSan() {
    try {
      const j = await goi('/api/miscellaneous/homepage/get_to_do_list_summary/');
      const n = (j.data || {}).shipment_to_process;
      return typeof n === 'number' ? n : null;
    } catch (e) {
      log('Không lấy được số đếm của sàn: ' + e.message);
      return null;
    }
  }

  async function layShop() {
    try {
      const j = await goi('/api/selleraccount/shop_info/');
      const d = j.data || {};
      if (d.shop_id) kiemTraShop(d.shop_id);
      return d.name || d.username || '';
    } catch (e) { return ''; }
  }

  // Chi tiết 1 đơn. Coi là THẤT BẠI nếu không có mã đơn (sàn trả rỗng / lỗi),
  // tuyệt đối không coi là "đơn không có note".
  async function chiTiet1Don(id) {
    const j = await goi('/api/v3/order/get_one_order?order_id=' + encodeURIComponent(id));
    const d = j.data || {};
    if (!d.order_sn) throw new Error('sàn trả dữ liệu rỗng');
    const hang = [];
    (d.order_items || []).forEach((it) => {
      const im = it.item_model || {}, pr = it.product || {};
      // Bản 3.0: ghi theo TÊN PHÂN LOẠI (ví dụ "1 HỘP NỤ TRẦM MIX BX"), không theo SKU
      const sku = String(im.sku || '').trim();
      const ten = String(im.name || '').trim() || String(pr.name || '').trim().slice(0, DO_DAI_TOI_DA_TEN) || sku;
      // đơn giá 1 món (đã thử thật: x3@79000). Không có giá thì để "chưa rõ" (null),
      // tuyệt đối không coi là 0đ (0đ = quà tặng).
      const coGia = it.order_price !== undefined && it.order_price !== null && String(it.order_price).trim() !== '';
      const g = Number(it.order_price);
      const gia = coGia && isFinite(g) ? g : null;
      hang.push({ ten: ten, sku: sku, sl: parseInt(it.amount, 10) || 1, gia: gia, qua: laQuaTang(ten, sku, gia) });
    });
    return {
      ma: String(d.order_sn).trim(),
      tn: String(d.remark || '').trim(),
      hang: hang,
      dv: String(d.fulfillment_carrier_name || '').trim(),     // bản 3.3: để nhận ra đơn "Đang Điều Phối ĐVVC"
      dvAn: String(d.masking_carrier_name || '').trim(),
      t: Date.now()
    };
  }

  // Bản 3.3: đơn "Đang Điều Phối ĐVVC" = Shopee đang tự tìm đơn vị vận chuyển, chưa phải
  // đơn thường -> KHÔNG báo Note, KHÔNG tô màu, KHÔNG tính vào số đơn trên tên tab.
  // Khi Shopee gán xong ĐVVC thật, đơn tự hiện lại như đơn bình thường.
  const LA_DIEU_PHOI = /đi[eềệ]u\s*ph[oốồ]i/i;
  const laTenDieuPhoi = (t) => LA_DIEU_PHOI.test(String(t || '').normalize('NFC'));
  const laDieuPhoi = (o) => !!o && (laTenDieuPhoi(o.dv) || laTenDieuPhoi(o.dvAn));

  // Bản 3.4: đơn hoả tốc Shopee đang ở trạng thái "Tìm lại Tài xế" (lấy hàng không thành
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
      const j = await goi('/api/v3/shipment/get_order_arrange_shipment_info', {
        orders: ds.slice(i, i + 20).map((x) => ({ order_id: Number(x.order_id), region_id: 'VN',
                                                  shop_id: Number(x.shop_id) || Number((nho.shop || 0)) || 0 })),
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
    if (!/^\/portal\/sale\/order\/\d+/.test(location.pathname) || location.hash !== '#ntf-timlai') return;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    const bao = (chu, mau) => {
      let t = document.getElementById('ntf-tl-bao');
      if (!t) { t = document.createElement('div'); t.id = 'ntf-tl-bao'; document.body.appendChild(t); }
      t.style.cssText = 'position:fixed;left:50%;top:120px;transform:translateX(-50%);z-index:2147483646;' +
        'padding:10px 18px;border-radius:10px;font:800 14px/1.4 system-ui,Segoe UI,Roboto,arial,sans-serif;color:#fff;' +
        'box-shadow:0 8px 24px rgba(0,0,0,.3);max-width:80vw;background:' + (mau === 'xanh' ? '#1a9e5a' : mau === 'do' ? '#c62828' : '#ee4d2d');
      t.textContent = chu;
    };
    const timNut = () => Array.from(document.querySelectorAll('button')).find((b) =>
      LA_TIM_LAI.test((b.textContent || '').normalize('NFC')) && b.offsetParent !== null &&
      !b.closest('#smh-tn-popup,#ntf-box,#ntf-tl-bao'));
    bao('🔄 Đang tìm nút "Tìm lại Tài xế" của Shopee…');
    let nut = null;
    for (let i = 0; i < 40 && !nut; i++) { await nghi(500); nut = timNut(); }
    if (!nut) {
      bao('Không thấy nút "Tìm lại Tài xế" trên đơn này — có thể Shopee đã tìm được tài xế. Anh kiểm tra lại đơn giúp.', 'do');
      return;
    }
    try { nut.scrollIntoView({ block: 'center' }); } catch (e) {}
    nut.click();
    bao('🔄 Đã bấm "Tìm lại Tài xế" — đang kiểm tra lại…');
    await nghi(5000);
    const hop = Array.from(document.querySelectorAll('.eds-modal, [role="dialog"]')).find((m) => m.offsetParent !== null);
    if (hop) bao('Shopee đang hỏi xác nhận — anh bấm xác nhận trong hộp thoại giúp.', 'cam');
    else if (timNut()) bao('Nút "Tìm lại Tài xế" vẫn còn — anh bấm tay nút cam trên trang giúp.', 'do');
    else bao('✓ Đã gửi yêu cầu Tìm lại Tài xế cho đơn này.', 'xanh');
  }

  // Quà tặng — cùng 1 quy tắc với máy In Đơn:
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

  // Xét 1 đơn có thuộc loại cần cảnh báo không (có thể nhiều lý do cùng lúc).
  function xetCanhBao(c, laHoaToc) {
    const chinh = (c.hang || []).filter((h) => !h.qua);
    const gop = {};
    chinh.forEach((h) => { gop[h.ten] = gop[h.ten] || { ten: h.ten, sl: 0 }; gop[h.ten].sl += h.sl; });
    const ma = Object.keys(gop).map((k) => gop[k]);
    const moTa = (ds) => ds.map((h) => h.ten + ' x' + h.sl).join(', ');
    const tong = chinh.reduce((a, h) => a + (h.gia || 0) * h.sl, 0);
    const slNhieu = ma.filter((h) => h.sl >= NGUONG_SO_LUONG);
    return {
      ht: !!laHoaToc,
      tn: c.tn || '',
      spChinh: moTa(ma),
      slNhieu: slNhieu.length ? moTa(slNhieu) : '',
      gt: tong >= NGUONG_GIA_TRI_DON ? tong : 0
    };
  }

  const coCanhBao = (o) => !!(o && (o.loi || o.ht || o.tn || o.slNhieu || o.gt));

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

  // Đọc chi tiết các đơn CHƯA có trong bộ nhớ, mỗi đơn thử tối đa 3 lần.
  // Trả về danh sách đơn vẫn đọc không được sau 3 lần.
  async function docChiTietMoi(ids) {
    // Bản 3.3: đơn nhớ từ bản cũ (chưa có ĐVVC) và đơn đang điều phối thì đọc lại
    // (ĐVVC của đơn điều phối sẽ đổi khi Shopee gán xong)
    let can = ids.filter((id) => !nho.don[id] || nho.don[id].dv === undefined || laDieuPhoi(nho.don[id]));
    for (let lan = 1; lan <= 3 && can.length; lan++) {
      if (lan > 1) await nghi(1200 * lan);
      const hong = [];
      for (let i = 0; i < can.length; i += 6) {
        await Promise.all(can.slice(i, i + 6).map(async (id) => {
          try { nho.don[id] = await chiTiet1Don(id); }
          catch (e) { hong.push(id); if (lan === 3) log('Đơn ' + id + ' đọc hỏng 3 lần: ' + e.message); }
        }));
      }
      can = hong;
    }
    luuNho();
    return can;
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
    } catch (e) { log('Copy mã lỗi:', e.message); }
  }

  function chepMa(ma, nut) {
    const cu = nut.textContent;
    const xong = () => {
      nut.textContent = '✓';
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

  /* ---------- Giao diện: giữa - trên màn hình, nhỏ gọn, không nút tắt ---------- */

  const CSS = `
    #ntf-box{position:fixed;top:8px;left:50%;transform:translateX(-50%);
      z-index:2147483600;max-width:min(680px,80vw);width:max-content;
      font-family:system-ui,-apple-system,"Segoe UI","Helvetica Neue",Roboto,arial,
      "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif}
    /* Bản 3.3: khung ngoài theo màu loại gấp nhất, mỗi dòng mang màu loại của nó */
    #ntf-box .ntf-rows{border:3px solid var(--tc,#d32f2f);border-radius:12px;background:#fff;
      padding:6px 8px;max-height:26vh;overflow-y:auto;
      box-shadow:0 8px 24px rgba(0,0,0,.32);animation:ntfChop .9s ease-in-out infinite}
    @keyframes ntfChop{
      0%,100%{border-color:var(--tc,#d32f2f);box-shadow:0 8px 24px rgba(0,0,0,.25),0 0 0 0 transparent}
      50%{border-color:var(--ts,#ff5252);
        box-shadow:0 8px 24px rgba(0,0,0,.25),0 0 22px 5px color-mix(in srgb,var(--tc,#d32f2f) 45%,transparent)}}
    #ntf-box .ntf-r{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;padding:6px 10px;
      border-radius:8px;background:var(--rn,#fdeceb);border:1px solid var(--rv,#f1b5ae)}
    #ntf-box .ntf-r + .ntf-r{margin-top:6px}
    #ntf-box .ntf-r.loi .ntf-t{color:#b45309}
    #ntf-box a.ntf-ma{font-size:13.5px;font-weight:900;color:var(--rc,#c62828);
      text-decoration:none;letter-spacing:.2px;flex:none}
    #ntf-box a.ntf-ma:hover{text-decoration:underline}
    #ntf-box button.ntf-cp{all:unset;display:inline-block;cursor:pointer;
      background:var(--rc,#d32f2f);color:#fff;font-size:11px;font-weight:800;padding:2px 8px;
      border-radius:5px;line-height:1.5;flex:none}
    #ntf-box button.ntf-cp:hover{filter:brightness(.85)}
    #ntf-box button.ntf-cp.ok{background:#1a9e5a}
    /* Bản 3.4: nút cam "TÌM LẠI TÀI XẾ" giống nút thật của Shopee */
    #ntf-box button.ntf-tl{all:unset;display:inline-block;cursor:pointer;background:#ee4d2d;color:#fff;
      font-size:12px;font-weight:900;padding:3px 11px;border-radius:5px;line-height:1.5;flex:none;letter-spacing:.3px;
      box-shadow:0 1px 4px rgba(238,77,45,.45)}
    #ntf-box button.ntf-tl:hover{background:#d73211}
    .ntf-mk-b .tl,.ntf-mk-tags .tl{background:#ee4d2d !important}
    /* Bản 3.2: Note nằm DƯỚI mã đơn, trong ô nền xanh dương nhạt giống ô "Tin nhắn" của Shopee */
    #ntf-box .ntf-note{flex:1 1 100%;margin-top:2px;background:#d6e7fb;border-radius:6px;padding:5px 10px;
      font-size:13px;font-weight:600;color:#1f2d3d;line-height:1.45;word-break:break-word}
    #ntf-box .ntf-note b{color:#1565c0;font-weight:800}
    #ntf-box .ntf-t{font-size:13px;color:#3d2b28;font-weight:700;word-break:break-word;
      flex:1 1 260px;min-width:0}
    #ntf-box .ntf-nh{flex:none;font-size:10.5px;font-weight:900;color:#fff;
      border-radius:4px;padding:1px 6px;letter-spacing:.2px;line-height:1.5;white-space:nowrap}
    #ntf-box .ntf-nh.ht{background:#c62828}
    #ntf-box .ntf-nh.tn{background:#1565c0}
    #ntf-box .ntf-nh.sl{background:#6a1b9a}
    #ntf-box .ntf-nh.gt{background:#e65100}
    #ntf-box .ntf-nh.loi{background:#b45309}
    #ntf-box .ntf-tag{font-size:10.5px;font-weight:900;color:#fff;background:#8d1616;
      border-radius:4px;padding:1px 6px;letter-spacing:.2px;flex:none}
    #ntf-box .ntf-them{margin:4px auto 0;width:max-content;font-size:11px;font-weight:800;
      color:#fff;background:var(--tc,#8d1616);border-radius:9px;padding:1px 10px}
    #ntf-box .ntf-st{margin:4px auto 0;width:max-content;max-width:100%;font-size:11px;
      font-weight:700;line-height:1.4;padding:2px 9px;border-radius:9px;
      background:rgba(255,255,255,.92);color:#8a8a8a;border:1px solid #e3e3e3;
      box-shadow:0 1px 4px rgba(0,0,0,.08)}
    #ntf-box .ntf-st.canh{color:#fff;background:#e65100;border-color:#e65100}
    #ntf-box .ntf-st.hong{color:#fff;background:#c62828;border-color:#c62828;
      animation:ntfSt .9s ease-in-out infinite}
    @keyframes ntfSt{0%,100%{opacity:1}50%{opacity:.55}}
    /* Bản 3.0: đèn trạng thái trong viên thuốc — xanh ổn · cam cần để ý · đỏ hỏng */
    #ntf-box .ntf-den{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;
      vertical-align:0;background:#bdbdbd}
    #ntf-box .ntf-st.yen .ntf-den{background:#1a9e5a;box-shadow:0 0 0 2px rgba(26,158,90,.22)}
    #ntf-box .ntf-st.canh .ntf-den{background:#fff}
    #ntf-box .ntf-st.hong .ntf-den{background:#ffeb3b}

    /* Bản 3.0: tô màu dòng đơn cần chú ý ngay trong bảng của trang Giao Hàng Loạt */
    /* Bản 3.3 (phương án B): không còn vạch bên trái (từng đè ô tick) — cả hàng có nền nhạt
       + khung bo góc theo MÀU LOẠI ĐƠN (đỏ = hoả tốc, xanh dương = Note, tím = SL nhiều, cam = giá trị cao) */
    .mass-ship-card.ntf-mk{background:var(--ntf-n,#fdeceb) !important;border-radius:8px;
      box-shadow:inset 0 0 0 2px var(--ntf-c,#c62828) !important}
    .ntf-mk-b{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
    .ntf-mk-b span{font:900 10.5px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,arial,
      "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif;color:#fff;
      border-radius:4px;padding:0 6px;white-space:nowrap}
    .ntf-mk-b .ht{background:#c62828}
    .ntf-mk-b .tn{background:#1565c0}
    .ntf-mk-b .sl{background:#6a1b9a}
    .ntf-mk-b .gt{background:#e65100}
    .ntf-mk-b .loi{background:#b45309}
    /* Bản 3.2: tô đơn thật trên trang Đơn hàng (Tất cả / Chờ lấy hàng) — phương án B */
    /* Bản 3.3: nền + vạch theo MÀU LOẠI ĐƠN (giống banner và trang Giao Hàng Loạt) */
    a.order-card.ntf-mk2{position:relative;background:var(--ntf-n,#fdeceb) !important;border-color:var(--ntf-v,#f1b5ae) !important}
    a.order-card.ntf-mk2::before{content:"";position:absolute;left:-1px;top:-1px;bottom:-1px;width:7px;
      background:var(--ntf-c,#c62828);border-radius:4px 0 0 4px;z-index:2}
    a.order-card.ntf-mk2 .order-card-header{background:color-mix(in srgb,var(--ntf-c,#c62828) 9%,#fff) !important}
    a.order-card.ntf-mk2 .order-card-body,a.order-card.ntf-mk2 .package-card-info{background:transparent !important}
    .ntf-mk-tags{display:inline-flex;gap:5px;margin-left:10px;vertical-align:1px}
    .ntf-mk-tags span{font:900 11px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,arial,sans-serif;color:#fff;border-radius:4px;padding:0 7px;white-space:nowrap}
    .ntf-mk-tags .ht{background:#c62828}.ntf-mk-tags .tn{background:#1565c0}.ntf-mk-tags .sl{background:#6a1b9a}
    .ntf-mk-tags .gt{background:#e65100}.ntf-mk-tags .loi{background:#b45309}
    .ntf-mk-note{margin:0 14px 12px 44px;padding:7px 12px;
      border-radius:6px;background:#d6e7fb;color:#0d2f5e;word-break:break-word;
      font:600 13.5px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,arial,
      "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif}
    .ntf-mk-note b{color:#1565c0;font-weight:800}
    .ntf-mk-note.loi{background:#ffe8c2;color:#7a3e00}
    .ntf-mk-note.loi b{color:#b45309}
  `;

  function chenCSS() {
    if (document.getElementById('ntf-css')) return;
    const s = document.createElement('style');
    s.id = 'ntf-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  // dangHien: các dòng đang hiện [{id, ma, tn, ht, spChinh, slNhieu, gt, loi}]
  let dangHien = [];
  let trangThai = { muc: 'dang', chu: 'Note: đang kiểm tra lần đầu…' };

  // Nhãn của 1 đơn cần chú ý — dùng chung cho banner và phần tô màu dòng đơn
  const MAU_NHAN = { ht: '#c62828', loi: '#b45309', tn: '#1565c0', sl: '#6a1b9a', gt: '#e65100' };
  // Bản 3.3: MÀU THEO LOẠI ĐƠN — nhìn màu là biết đơn thuộc trường hợp nào.
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

  function veDong(o) {
    const hang = document.createElement('div');
    hang.className = 'ntf-r' + (o.loi ? ' loi' : '');
    datMau(hang, loaiChinh(o), '--r');   // bản 3.3: mỗi dòng mang màu loại của nó

    nhanCua(o).forEach(([loai, chu]) => {
      const n = document.createElement('span');
      n.className = 'ntf-nh ' + loai;
      n.textContent = chu;
      hang.appendChild(n);
    });

    const a = document.createElement('a');
    a.className = 'ntf-ma';
    a.textContent = o.ma || ('Đơn ' + o.id);
    a.href = '/portal/sale/order/' + o.id;
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = 'Mở đơn này trong tab mới';
    hang.appendChild(a);

    if (o.ma) {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'ntf-cp';
      c.textContent = '⧉';
      c.title = 'Copy mã đơn ' + o.ma;
      c.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); chepMa(o.ma, c); };
      hang.appendChild(c);
    }
    if (o.timLai) {
      // Bản 3.4: nút cam "TÌM LẠI TÀI XẾ" — mở đơn trong tab mới và tự bấm nút thật của Shopee
      const t = document.createElement('button');
      t.type = 'button';
      t.className = 'ntf-tl';
      t.textContent = '🔄 TÌM LẠI TÀI XẾ';
      t.title = 'Shopee lấy hàng không thành công — bấm để mở đơn và bấm "Tìm lại Tài xế"';
      t.onclick = (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        t.textContent = '⏳ Đang mở đơn…';
        window.open('/portal/sale/order/' + o.id + '#ntf-timlai', '_blank');
        setTimeout(() => { t.textContent = '🔄 TÌM LẠI TÀI XẾ'; }, 4000);
      };
      hang.appendChild(t);
    }

    const noi = document.createElement('span');
    noi.className = 'ntf-t';
    noi.textContent = chiTietDong(o);
    hang.appendChild(noi);
    if (o.tn) {
      // Bản 3.2: Note xuống dòng riêng, ô nền xanh dương nhạt như ô "Tin nhắn" của Shopee
      const nt = document.createElement('div');
      nt.className = 'ntf-note';
      const b = document.createElement('b');
      b.textContent = 'Tin nhắn: ';
      nt.appendChild(b);
      nt.appendChild(document.createTextNode(o.tn));
      hang.appendChild(nt);
    }
    return hang;
  }

  let chuKyCu = '';
  function ve() {
    if (!document.body) return;
    let box = document.getElementById('ntf-box');
    const coDong = dangHien.length > 0;
    const hienSt = trangThai.muc !== 'yen' || HIEN_KHI_YEN;

    if (!coDong && !hienSt) { if (box) box.remove(); chuKyCu = ''; return; }
    if (!box) {
      box = document.createElement('div');
      box.id = 'ntf-box';
      document.body.appendChild(box);
      chuKyCu = '';
    }
    const ck = JSON.stringify(dangHien.map((o) => [o.id, o.tn, o.loi, o.ht, o.timLai, o.slNhieu, o.gt, o.spChinh])) + '#' +
               trangThai.muc + '#' + trangThai.chu;
    if (ck === chuKyCu) return;          // không đổi gì thì không vẽ lại cho đỡ giật
    chuKyCu = ck;
    box.innerHTML = '';

    if (coDong) {
      const rows = document.createElement('div');
      rows.className = 'ntf-rows';
      const coLoai = new Set(dangHien.map(loaiChinh));
      datMau(box, THU_TU_LOAI.find((l) => coLoai.has(l)) || 'ht', '--t');
      dangHien.forEach((o) => rows.appendChild(veDong(o)));
      box.appendChild(rows);
      // Tự kiểm tra hiển thị: nhiều dòng quá phải cuộn thì báo rõ còn dòng bị che
      requestAnimationFrame(() => {
        if (rows.scrollHeight > rows.clientHeight + 4) {
          const m = document.createElement('div');
          m.className = 'ntf-them';
          m.textContent = '▼ Tổng ' + dangHien.length + ' đơn — cuộn trong khung để xem hết';
          box.insertBefore(m, rows.nextSibling);   // đặt NGOÀI vùng cuộn để luôn nhìn thấy
        }
      });
    }
    if (hienSt) {
      const st = document.createElement('div');
      st.className = 'ntf-st ' + trangThai.muc;
      const den = document.createElement('span');
      den.className = 'ntf-den';
      st.appendChild(den);
      st.appendChild(document.createTextNode(trangThai.chu));
      st.title = 'Note fulfillment ' + PHIEN_BAN + ' — đèn xanh: ổn · cam: cần để ý · đỏ: hỏng, kiểm tra tay';
      box.appendChild(st);
    }
  }

  /* ---------- Số đơn trên tên tab (bản 3.0) ----------
     "[7] ⚡1 💬2 · Shopee…": 7 đơn chờ xử lý, 1 đơn hoả tốc, 2 đơn có Note —
     để ở tab khác vẫn liếc thấy. */
  let demTab = null;   // { n, ht, tn } của lần đọc thành công gần nhất
  const TIEN_TO_TAB = /^\[\d+\](?: ⚡\d+)?(?: 💬\d+)? · /;
  function datTieuDe() {
    try {
      if (location.pathname.indexOf('/awbprint') === 0) return;
      const goc = document.title.replace(TIEN_TO_TAB, '');
      const tien = demTab ? '[' + demTab.n + ']' + (demTab.ht ? ' ⚡' + demTab.ht : '') +
                            (demTab.tn ? ' 💬' + demTab.tn : '') + ' · ' : '';
      if (document.title !== tien + goc) document.title = tien + goc;
    } catch (e) {}
  }

  /* ---------- Tô màu dòng đơn trên trang Giao Hàng Loạt (bản 3.0) ----------
     Đã thử thật: mỗi đơn là 1 khối ".mass-ship-card", trong có link
     "/portal/sale/order/<order_id>". Đơn nào đang hiện trên banner thì khối đó
     được tô nền hồng + vạch màu bên trái + nhãn ngay dưới mã đơn.
     Chỉ thêm màu và nhãn, không sửa/bấm gì của trang. */
  // Bản 3.2: trang Đơn hàng (portal/sale/order) — mỗi đơn là 1 khối "a.order-card" có link
  // "/portal/sale/order/<order_id>" (đã kiểm thật 29/09). Đơn cần chú ý: nền hồng + vạch đỏ
  // bên trái + nhãn ngay cạnh "Mã đơn hàng". Chỉ thêm màu, không sửa/bấm gì của trang.
  function danhDauTheDon(map) {
    document.querySelectorAll('a.order-card').forEach((card) => {
      const id = ((card.getAttribute('href') || '').match(/\/order\/(\d+)/) || [])[1];
      const o = id ? map[id] : null;
      const nhan = o ? nhanCua(o) : [];
      const sig = nhan.length ? id + ':' + nhan.map((n) => n[0]).join(',') : '';
      const cu = card.querySelector('.ntf-mk-tags');
      if ((card.dataset.ntfMk2 || '') === sig && (!sig ? !cu && !card.classList.contains('ntf-mk2')
                                                   : cu && card.classList.contains('ntf-mk2'))) return;
      card.dataset.ntfMk2 = sig;
      if (cu) cu.remove();
      if (!sig) { card.classList.remove('ntf-mk2'); return; }
      card.classList.add('ntf-mk2');
      datMau(card, nhan[0][0], '--ntf-');
      const b = document.createElement('span');
      b.className = 'ntf-mk-tags';
      nhan.forEach(([l, c]) => { const x = document.createElement('span'); x.className = l; x.textContent = c; b.appendChild(x); });
      if (o.tn) b.title = 'Note của khách: ' + o.tn;
      (card.querySelector('.order-identifiers') || card.querySelector('.order-card-header') || card).appendChild(b);
    });
  }

  function danhDauHang() {
    if (!document.body) return;
    if (/^\/portal\/sale\/order\/?$/.test(location.pathname)) {
      const m = {};
      dangHien.forEach((o) => { if (o.id) m[String(o.id)] = o; });
      danhDauTheDon(m);
      return;
    }
    if (location.pathname.indexOf(TRANG_GHL) !== 0) return;
    const map = {};
    dangHien.forEach((o) => { if (o.id) map[String(o.id)] = o; });
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
      const dangCo = card.querySelector('.ntf-mk-b');
      const daiCu = card.querySelector('.ntf-mk-note');
      if ((card.dataset.ntfMk || '') === sig &&
          card.classList.contains('ntf-mk') === !!sig &&
          !!dangCo === !!(sig && nhanNho.length) && !!daiCu === !!(sig && canDai)) {
        if (daiCu) canhLe(card, a, daiCu);
        return;
      }
      card.dataset.ntfMk = sig;
      if (dangCo) dangCo.remove();
      card.querySelectorAll('.ntf-mk-note').forEach((x) => x.remove());
      if (!sig) {
        card.classList.remove('ntf-mk');
        ['c', 'n', 'v', 's'].forEach((k) => card.style.removeProperty('--ntf-' + k));
        return;
      }
      card.classList.add('ntf-mk');
      datMau(card, nhan[0][0], '--ntf-');
      if (nhanNho.length) {
        const b = document.createElement('div');
        b.className = 'ntf-mk-b';
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
        n.className = 'ntf-mk-note' + (o.tn ? '' : ' loi');
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

  /* ---------- Một vòng đọc ---------- */

  let dangDoc = false, mocDoc = 0, lanOkCuoi = 0, soLanHongLienTiep = 0, henThuLai = null;
  let canDocLai = false;          // có yêu cầu đọc mới trong lúc đang đọc -> đọc xong đọc tiếp
  let idsLanCuoi = new Set();     // các đơn chưa xử lý của lần đọc gần nhất

  // Đơn mà CHÍNH TRANG Giao Hàng Loạt của Shopee đang hiện ở mục chưa xử lý
  // (nghe từ dữ liệu trang tải về). order_id -> lúc thấy trên trang.
  const trenTrang = new Map();

  function henDocLai(ms) {
    clearTimeout(henThuLai);
    henThuLai = setTimeout(docVaVe, ms);
  }

  async function docVaVe() {
    if (dangDoc) { canDocLai = true; return; }
    dangDoc = true;
    canDocLai = false;
    mocDoc = Date.now();
    const batDauDoc = Date.now();
    try {
      await layShop();
      const [ds0, dem] = await Promise.all([timDonChuaXL(false), demCuaSan()]);
      let ds = ds0;

      if (ds.matDN) throw Object.assign(new Error('mất đăng nhập Shopee'), { matDN: true });
      if (ds.hongChinh) throw new Error('không đọc được danh sách đơn');

      // TỰ KIỂM TRA 1: số đơn đọc được phải >= số "Chờ Lấy Hàng" sàn báo.
      // Thiếu -> hỏi thêm mọi bộ lọc mở rộng; vẫn thiếu -> đợi 4 giây hỏi lại
      // (phòng lúc đơn đang được xử lý giữa chừng); vẫn thiếu -> báo cam.
      let thieu = null;
      if (dem !== null && ds.ids.length < dem) {
        log('Đọc được ' + ds.ids.length + ' đơn nhưng sàn báo ' + dem + ' — hỏi mở rộng');
        ds = await timDonChuaXL(true);
        if (ds.ids.length < dem) {
          await nghi(4000);
          const [ds2, dem2] = await Promise.all([timDonChuaXL(true), demCuaSan()]);
          ds = ds2;
          if (dem2 !== null && ds.ids.length < dem2) thieu = { san: dem2, doc: ds.ids.length };
        }
      }

      // TỰ KIỂM TRA 4: đơn trang Shopee đang hiện (mục chưa xử lý) mà bộ lọc của
      // script không thấy -> vẫn kiểm Note cho đơn đó. Nhân viên in từ trang nào
      // thì đơn trên trang đó chắc chắn đã được kiểm Note.
      //  - Trang thấy SAU lúc lần đọc này bắt đầu: chắc chắn còn chưa xử lý -> giữ.
      //  - Trang thấy TRƯỚC, mà lần đọc trọn vẹn (khớp số sàn) không còn thấy ->
      //    đơn đã được xử lý -> bỏ.
      const thayDs = new Set(ds.ids);
      const tronVenDs = !ds.hong && !ds.thieuTrang && !thieu;
      const ngoai = [];
      trenTrang.forEach((luc, id) => {
        if (thayDs.has(id)) return;
        if (tronVenDs && luc < batDauDoc) { trenTrang.delete(id); return; }
        ngoai.push(id);
      });
      if (ngoai.length) log('Trang Shopee đang hiện ' + ngoai.length + ' đơn mà bộ lọc chưa thấy: ' + ngoai.join(', '));
      const tatCa = ds.ids.concat(ngoai);

      // TỰ KIỂM TRA 2: đơn nào đọc chi tiết hỏng 3 lần -> vẫn hiện 1 dòng cảnh báo
      // để người xem tự mở đơn, không bao giờ lặng lẽ bỏ qua.
      const hongCT = await docChiTietMoi(tatCa);

      // Bản 3.4: đơn hoả tốc nào đang "Tìm lại Tài xế" (lỗi thì giữ kết quả lần trước)
      try {
        await docTimLai(tatCa.filter((id) => donHoaToc.has(id) && nho.don[id] && !laDieuPhoi(nho.don[id]))
          .map((id) => ({ order_id: id })));
      } catch (e) { log('Đọc trạng thái "Tìm lại Tài xế" lỗi: ' + e.message + ' — giữ kết quả lần trước'); }

      const moi = [];
      const dieuPhoi = new Set();
      tatCa.forEach((id) => {
        const c = nho.don[id];
        if (!c) { moi.push({ id: id, loi: true, ht: donHoaToc.has(id) }); return; }
        if (laDieuPhoi(c)) { dieuPhoi.add(id); return; }   // bản 3.3: Shopee đang điều phối -> bỏ qua
        if (daGui.has(id)) { dieuPhoi.add(id); return; }    // bản 3.5: đã bấm "Tìm lại Tài xế" -> coi như đã xử lý
        const cb = xetCanhBao(c, donHoaToc.has(id));
        if (timLai.has(id)) cb.timLai = true;
        if (coCanhBao(cb)) moi.push(Object.assign({ id: id, ma: c.ma }, cb));
      });

      // TỰ KIỂM TRA 3: lần đọc chưa trọn vẹn (1 bộ lọc phụ lỗi / thiếu trang /
      // thiếu so với sàn) thì GIỮ LẠI các dòng đang hiện, không xoá dòng nào.
      // Chỉ giữ dòng của những đơn lần này KHÔNG nhìn thấy; đơn nào nhìn thấy
      // rồi thì dùng thông tin mới nhất.
      const tronVen = tronVenDs;
      if (!tronVen) {
        const thay = new Set(tatCa);
        dangHien.forEach((o) => { if (!thay.has(o.id)) moi.push(o); });
      }
      moi.sort((a, b) => (b.ht ? 1 : 0) - (a.ht ? 1 : 0));   // hoả tốc lên đầu
      dangHien = moi;
      idsLanCuoi = new Set(tatCa);
      if (dieuPhoi.size) log(dieuPhoi.size + ' đơn "Đang Điều Phối ĐVVC" — bỏ qua (không báo Note, không tô màu)');
      const tinh = tatCa.filter((id) => !dieuPhoi.has(id));
      demTab = { n: tinh.length, ht: tinh.filter((id) => donHoaToc.has(id)).length,
                 tn: dangHien.filter((o) => o.tn).length };

      lanOkCuoi = Date.now();
      soLanHongLienTiep = 0;
      if (thieu) {
        trangThai = { muc: 'canh', chu: '⚠ Sàn báo ' + thieu.san + ' đơn chờ xử lý, script mới đọc được ' +
          thieu.doc + ' — kiểm tra tay trang Chờ lấy hàng' };
      } else if (hongCT.length) {
        trangThai = { muc: 'canh', chu: '⚠ ' + hongCT.length + ' đơn chưa đọc được chi tiết — đang tự thử lại' };
      } else if (!tronVen) {
        trangThai = { muc: 'canh', chu: '⚠ Lần đọc ' + gioNgan(lanOkCuoi) + ' chưa trọn vẹn — giữ nguyên các dòng cũ, sẽ đọc lại' };
      } else if (ngoai.length) {
        trangThai = { muc: 'canh', chu: '⚠ Trang Shopee có ' + ngoai.length + ' đơn bộ lọc của script không thấy — đã tự kiểm Note các đơn này' };
      } else {
        trangThai = { muc: 'yen', chu: 'Note: đã kiểm ' + tatCa.length + ' đơn lúc ' + gioNgan(lanOkCuoi) };
      }
      log('Xong: ' + ds.ids.length + ' đơn chưa xử lý (sàn báo ' + dem + '), ' + dangHien.length + ' dòng hiện');
      if (!tronVen || hongCT.length) henDocLai(15000);   // chưa trọn vẹn thì 15 giây sau thử lại
    } catch (e) {
      soLanHongLienTiep++;
      log('Đọc lỗi (lần ' + soLanHongLienTiep + '):', e.message);
      // Lỗi thì KHÔNG xoá dòng nào đang hiện. Chỉ báo trạng thái.
      const tu = lanOkCuoi ? ' từ ' + gioNgan(lanOkCuoi) : '';
      trangThai = e.matDN
        ? { muc: 'hong', chu: '⚠ Mất đăng nhập Shopee — Note KHÔNG được cập nhật' + tu + '. Đăng nhập lại!' }
        : { muc: soLanHongLienTiep >= 2 ? 'hong' : 'canh',
            chu: '⚠ Chưa đọc được đơn' + tu + ' — đang thử lại' + (soLanHongLienTiep >= 2 ? ', kiểm tra tay nếu kéo dài' : '') };
      // Lần đầu mở trang mà lỗi (trang chưa sẵn sàng) thì thử lại nhanh: 5s, 10s, 20s...
      henDocLai(Math.min(5000 * Math.pow(2, soLanHongLienTiep - 1), CHU_KY_DOC_GIAY * 1000));
    } finally {
      dangDoc = false;
      ve();
      datTieuDe();
      try { danhDauHang(); } catch (e) {}
      if (canDocLai) { canDocLai = false; setTimeout(docVaVe, 300); }
    }
  }

  /* ---------- Đồng bộ với trang Shopee ----------
     Đã kiểm tra thật: trang Giao Hàng Loạt KHÔNG tự cập nhật; chỉ khi bấm một
     nút lọc (Tất cả, Hạn giao hàng hôm nay, SPX...) thì trang mới tải danh sách
     mới từ Shopee. Vì vậy: MỖI LẦN trang tải danh sách, script đọc Note ngay lúc
     đó — nhân viên nhìn thấy đơn mới nào trên trang thì Note của đơn đó cũng
     vừa được kiểm. Ngoài ra còn "nghe" danh sách đơn trang vừa tải để kiểm
     Note đúng các đơn đang hiện trên màn hình. Chỉ nghe, không sửa gì của trang. */

  let henTrang = null, lanTrangCuoi = 0;
  function trangVuaTaiDanhSach(idsMoi) {
    let coMoi = false;
    (idsMoi || []).forEach((id) => { if (!idsLanCuoi.has(id) && !nho.don[id]) coMoi = true; });
    // Gom nhiều lệnh tải liên tiếp của 1 cú bấm thành 1 lần đọc
    clearTimeout(henTrang);
    henTrang = setTimeout(() => {
      if (!coMoi && Date.now() - lanTrangCuoi < 3000) return;
      lanTrangCuoi = Date.now();
      docVaVe();
    }, 600);
  }

  function ngheTrangShopee() {
    // 1) Nghe dữ liệu trang Giao Hàng Loạt tải về (để biết đúng đơn nào đang hiện)
    try {
      const X = XMLHttpRequest.prototype;
      if (!X.__ntfNghe) {
        X.__ntfNghe = true;
        const moGoc = X.open, guiGoc = X.send;
        const goiChuaXL = new Set();   // mã kiện của các lượt tải mục "chưa xử lý"
        X.open = function (m, u) {
          try { this.__ntfUrl = String(u || ''); } catch (e) {}
          return moGoc.apply(this, arguments);
        };
        X.send = function (body) {
          try {
            const u = this.__ntfUrl || '';
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

    // 2) Dự phòng: trang nào của Shopee tải danh sách đơn (kể cả trang Đơn hàng
    //    thường) thì cũng đọc lại ngay. Bỏ qua lệnh do chính script gửi (_src=).
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

  /* ---------- Khởi động ---------- */

  function batDau() {
    tuBamTimLai().catch((e) => log('Tự bấm Tìm lại Tài xế lỗi:', e.message));
    chenCSS();
    ve();
    ngheTrangShopee();
    theoDoiBangDon();
    docVaVe();                                   // đọc NGAY khi trang vừa tải xong
    setInterval(docVaVe, CHU_KY_DOC_GIAY * 1000);

    // Quay lại tab / cửa sổ / có mạng lại / đổi trang -> đọc ngay (cách nhau ít nhất 8 giây)
    let lanKichCuoi = 0;
    const docNgay = () => {
      if (Date.now() - lanKichCuoi < 8000) return;
      lanKichCuoi = Date.now();
      docVaVe();
    };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) docNgay(); });
    window.addEventListener('focus', docNgay);
    window.addEventListener('online', docNgay);
    let urlCu = location.href;

    setInterval(() => {
      if (location.href !== urlCu) { urlCu = location.href; docNgay(); }
      datTieuDe();              // Shopee đổi tên tab khi chuyển trang -> gắn lại số đơn
      // Shopee vẽ lại trang có thể làm mất banner -> tự gắn lại
      if (!document.getElementById('ntf-css')) chenCSS();
      if (!document.getElementById('ntf-box')) { chuKyCu = ''; ve(); }
      // Bộ tự cứu: một vòng đọc treo quá 90 giây thì gỡ kẹt và đọc lại
      if (dangDoc && Date.now() - mocDoc > 90000) {
        log('Vòng đọc treo quá 90 giây — tự gỡ kẹt');
        dangDoc = false;
        docVaVe();
      }
      // Quá 3 chu kỳ không đọc thành công lần nào -> trạng thái đỏ
      if (lanOkCuoi && Date.now() - lanOkCuoi > CHU_KY_DOC_GIAY * 3000 && trangThai.muc !== 'hong') {
        trangThai = { muc: 'hong', chu: '⚠ Note chưa cập nhật từ ' + gioNgan(lanOkCuoi) + ' — kiểm tra tay' };
        ve();
      }
    }, 1500);

    log('Đã chạy');
  }

  if (document.body) batDau();
  else document.addEventListener('DOMContentLoaded', batDau);

  /* ---------- Bản 3.6: nút "👁 Xem ngay" trên popup đơn hoả tốc ----------
     Bấm -> mở trang Giao Hàng Loạt, lọc đơn hoả tốc và TICK SẴN tất cả đơn hoả tốc đang chờ.
     Script KHÔNG bấm in / giao hàng — người dùng tự bấm. */
  const XN = { POPUP: 'ntf-box', NHAN: '.ntf-nh.ht', KEY: 'xemngay_job_ntf', P: 'ntf' };
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

  setTimeout(xnBatDau, 2500);   // bản 3.6: nút Xem ngay
})();
