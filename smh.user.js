// ==UserScript==
// @name         Smh dang bai fb kenh 1 CHAY THAT 6.15
// @name:vi      Smh đăng bài FB kênh 1 (tự cập nhật — xem số bản trên popup)
// @namespace    smh-dang-bai-fb-kenh1-chay-that
// @version      6.18.1
// @description  Tự đăng 9 bài mỗi ngày (3 bài viết, 3 video, 3 manifest) lên fanpage "Vòng Trầm Hương Sơn Mộc Hương ." — 1 file dùng chung cho Máy Giao (máy chính) và Máy Cao (máy dự phòng)
// @match        https://www.facebook.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM_notification
// @grant        unsafeWindow
// @grant        GM_addElement
// @connect      open.larksuite.com
// @connect      graph.facebook.com
// @connect      raw.githubusercontent.com
// @connect      drive.usercontent.google.com
// @connect      drive.google.com
// @connect      googleusercontent.com
// @updateURL    https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/smh.user.js
// @downloadURL  https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/smh.user.js
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';
  // Chặn chạy trùng: bản cũ (5.x) và bản này dùng chung dấu → máy nào lỡ còn bật cả 2 bản thì chỉ 1 bản chạy.
  const DA_CHAY = 'data-smhfb-runtime-200';
  if (document.documentElement.hasAttribute(DA_CHAY)) return;
  document.documentElement.setAttribute(DA_CHAY, '6');

  // =====================================================================
  //  CÀI ĐẶT
  // =====================================================================
  const K = (s) => 'that_' + s;
  const lay = (k, macDinh) => GM_getValue(K(k), macDinh);
  const luu = (k, v) => GM_setValue(K(k), v);
  const capNhat = (k, doi) => { const v = Object.assign({}, lay(k, {}) || {}, doi); luu(k, v); return v; };
  // Máy nào? Chọn 1 lần trên popup (lưu trong Tampermonkey của máy đó)
  const MAY = lay('may6', '');                 // 'GIAO' | 'CAO' | '' (chưa chọn)
  const LA_GIAO = MAY === 'GIAO', LA_CAO = MAY === 'CAO';
  const TEN_MAY = LA_GIAO ? 'Máy Giao' : LA_CAO ? 'Máy Cao' : 'Máy chưa chọn';
  const PHIEN_BAN = '6.18.1';
  const TEN_HE_THONG = 'Đăng bài fb kênh 1';
  // mã riêng của tab này (giữ nguyên khi tải lại chính tab này; tab mới mở → mã mới)
  const MA_TAB = (() => { let id = null; try { id = sessionStorage.getItem('smhdb_ma_tab'); } catch (e) { /* */ }
    const wn = String(window.name || '').match(/smhdb:(\w+)/);
    if (!id || !wn || wn[1] !== id) { id = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('smhdb_ma_tab', id); } catch (e) { /* */ } }
    try { window.name = 'smhdb:' + id; } catch (e) { /* */ }
    return id; })();

  // (6.16) mã bí mật (mã Lark, link nhóm Lark) KHÔNG nằm trong file (file để công khai cho Tampermonkey tự cập nhật) — lưu riêng trong từng máy
  const BIMAT = (() => { try { return GM_getValue('that_bimat6', null) || {}; } catch (e) { return {}; } })();
  const CAI_DAT = {
    // Nhóm Lark nhận BÁO CÁO cuối ngày (nhóm Marketing, từ khoá "fb") — cũng nhận báo cáo tuần Khanh Trầm Hương
    WEBHOOK_BAO_CAO: BIMAT.hookBaoCao || '',
    // Nhóm Lark "Đăng bài fb" nhận BÁO LỖI khi đăng (giai đoạn mới chuyển sang tự động)
    WEBHOOK_LOI: BIMAT.hookLoi || '',

    // App Lark "Script Dang Bai Kenh 1"
    LARK_APP_ID: BIMAT.appId || '',
    LARK_APP_SECRET: BIMAT.appSecret || '',
    SHEET_TOKEN: 'WPhusx4UJhvTbstKQHFlNkWHggd',   // tài liệu "MKT 10. KỊCH BẢN MARTKETING"
    TAB_BAI: 'apU3Ne',                              // tab "Bài viết kênh 1" (Bài 1/2/3)
    TAB_VIDEO: 'e2f139',                            // tab "Kênh 1 Vòng Trầm Hương SMH" (video + manifest)
    LINK_SHEET: 'https://zgml41unmm8.sg.larksuite.com/wiki/G9gOwWa7OiQxuCkYWKJlkHt4g2f?sheet=apU3Ne',
    LINK_SHEET_VIDEO: 'https://zgml41unmm8.sg.larksuite.com/wiki/G9gOwWa7OiQxuCkYWKJlkHt4g2f?sheet=e2f139',
    O_KHOA: 'Z1',     // ô "giữ chỗ" chung của 2 máy (tab Bài viết kênh 1) — chỉ dùng khi máy chính trễ
    O_BAO_CAO: 'Z2',  // ô ghi dấu "đã gửi báo cáo ngày" (để 2 máy không gửi trùng)

    TEN_TRANG: 'Vòng Trầm Hương Sơn Mộc Hương .',
    TEN_NGAN: 'Vòng Trầm Hương SMH',
    TIEN_TO_TIN: '[fb kênh 1]',
    URL_TRANG: 'https://www.facebook.com/vongtramhuongsonmochuong/',
    DUONG_DAN_TRANG: '/vongtramhuongsonmochuong',

    // ---- LỊCH 9 BÀI/NGÀY (giờ ngẫu nhiên trong khung, xen kẽ Bài → Video → Manifest) ----
    LICH: [
      { k: 'b1', ten: 'Bài 1', tenBC: 'Bài 1 twist', loai: 'b1', tu: '06:30', den: '06:50' },
      { k: 'v1', ten: 'Video 1', tenBC: 'Video 1', loai: 'video', so: 0, tu: '07:45', den: '08:05' },
      { k: 'm1', ten: 'Manifest 1', tenBC: 'Manifest 1', loai: 'manifest', so: 0, tu: '09:00', den: '09:20' },
      { k: 'b2', ten: 'Bài 2', tenBC: 'Bài 2 twist + ảnh', loai: 'b2', tu: '10:15', den: '10:35' },
      { k: 'v2', ten: 'Video 2', tenBC: 'Video 2', loai: 'video', so: 1, tu: '11:30', den: '11:50' },
      { k: 'm2', ten: 'Manifest 2', tenBC: 'Manifest 2', loai: 'manifest', so: 1, tu: '12:45', den: '13:05' },
      { k: 'b3', ten: 'Bài 3', tenBC: 'Bài 3 storytelling', loai: 'b3', tu: '16:30', den: '16:50' },
      { k: 'v3', ten: 'Video 3', tenBC: 'Video 3', loai: 'video', so: 2, tu: '17:45', den: '18:15' },
      { k: 'm3', ten: 'Manifest 3', tenBC: 'Manifest 3', loai: 'manifest', so: 2, tu: '19:15', den: '19:40' },
    ],
    CACH_LICH_PHUT: 60,        // 2 bài liền nhau theo lịch cách ít nhất 1 tiếng
    CACH_BU_PHUT: 30,          // bài trễ thì đăng bù lần lượt, cách nhau 30 phút
    CACH_TRANG_PHUT: 20,       // cách bài gần nhất trên trang (kể cả bài đăng tay) ít nhất 20 phút
    GIO_CHOT: '21:30',         // quá giờ này bài chưa đăng thì bỏ, ghi vào báo cáo ngày
    GIO_BAO_CAO_THIEU: '21:45',// chưa đủ 9 bài thì 21:45 vẫn gửi báo cáo (ghi rõ bài chưa đăng)
    CAO_TRE_PHUT: 25,          // Máy Cao (dự phòng) chỉ ra tay khi quá giờ 25 phút mà trang vẫn chưa có bài
    CAO_CHO_MO_PHUT: 15,       // Máy Cao vừa mở lại tab: chờ 15 phút cho Máy Giao làm trước
    GIAO_GIU_CHO_SAU_PHUT: 15, // Máy Giao đăng trễ quá 15 phút thì phải "giữ chỗ" trước (tránh trùng với Máy Cao)
    NHUONG_PHUT: 20,           // (6.15) máy kia giữ chỗ quá 20 phút mà bài chưa lên = máy đó kẹt → máy này được làm thay
    THU_LAI_PHUT: 5,           // lỗi khi đăng → 5 phút sau thử lại
    SO_LAN_THU: 3,             // mỗi vòng thử tối đa 3 lần (cách nhau 5 phút)
    SO_VONG_THU: 3,            // (6.10) hết 1 vòng vẫn lỗi → nghỉ rồi thử vòng mới; tối đa 3 vòng (9 lần) trước giờ chốt
    NGHI_GIUA_VONG_PHUT: 20,   // nghỉ giữa 2 vòng thử (trong lúc nghỉ, các bài khác vẫn đăng bình thường)
    CHO_NGUOI_TOI_DA_PHUT: 10, // đến giờ mà nhân sự đang dùng trang: chờ tối đa 10 phút rồi vẫn đăng
    RANH_SAU_PHUT: 3,          // nhân sự ngừng thao tác 3 phút thì coi như trang rảnh
    DEM_NGUOC_GIAY: 10,        // trước mỗi việc chạm vào trang: đếm ngược 10 giây
    // ---- đọc Lark sheet: chỉ 2 lần/ngày ----
    GIO_DOC_NHE: '13:30',      // đọc để báo thiếu nội dung (còn cả buổi chiều để bổ sung)
    GIO_DOC_CHOT: '18:30',     // đọc chốt + tải sẵn đồ đăng ngày mai + tạo sẵn video manifest
    // ---- kiểm comment ----
    KIEM_CMT_SAU_PHUT: [2, 10, 20], // sau khi đăng: kiểm ngay (chờ ~2 phút cho bài hiện), 10 phút, 20 phút
    KIEM_CMT_TOI_DA: 3,        // mỗi bài kiểm tối đa 3 lần (tính cả kiểm tay)
    GIO_KIEM_CMT_CUOI: '19:00',// 19:00 kiểm 1 lượt các bài còn thiếu comment
    GUI_BU_TOI_DA: 2,          // mỗi bài gửi bù tối đa 2 lần, vẫn thiếu thì báo nhóm
    DO_TRANG_PHUT: 10,         // dò bài trên trang (qua Facebook, không tốn Lark) 10 phút/lần
    GIO_DO_TU: '06:00', GIO_DO_DEN: '22:30',
    GIO_NHAN_TU: '06:00', GIO_NHAN_DEN: '23:00', // khung gửi tin Lark
    // ---- đăng ----
    VI_TRI: 'Sơn Mộc Hương',
    VI_TRI_DIA_CHI: 'Vạn Phúc',
    NEN: 'Đỏ đậm',
    SO_NHOM_TOI_DA: 9,
    GIOI_HAN_KY_TU_NEN: 130,
    ANH_CANH_TOI_DA: 2048,
    SUA_NEN_B2: true,          // Bài 2: đăng xong sửa bài sang nền đỏ (gỡ ảnh)
    TAI_LAI_SAU_CMT: false,
    THA_CAM_XUC: true, THA_CAM_XUC_CMT: true,
    NGUONG_BAI: 0.9, NGUONG_CMT: 0.6,
    MA_KHOA_HAN_NGAY: 90,
    CHO_VIDEO_LEN_PHUT: 8,     // video/manifest bấm Đăng xong: chờ tối đa 8 phút cho Facebook xử lý rồi mới kết luận
    CHO_VIDEO_XU_LY_PHUT: 20,  // (6.15) có mã khoá: hộp đã đóng mà Facebook chưa có bài → chờ tới 20 phút, vẫn không có thì đăng lại (có dò trùng trước khi bấm Đăng)
    TREO_PHUT: 4,              // (6.15) đang soạn/đăng mà 4 phút không có bước mới → coi là kẹt: đóng hộp, tải lại trang, thử lại
    // ---- manifest ----
    MF_GIAY: 15,
    O_NHAC_DU_PHONG: 'G217',   // ô chứa file nhạc dự phòng (tab Kênh 1) — sửa được trên popup
    // Comment cố định (Bài 3, video, manifest)
    CMT_BAI3: 'Sơn Mộc Hương - Trầm Chuẩn - Giá Chuẩn\n• Zalo: 0762222448\n• Web: sonmochuong.com\n• Showroom: 76 đường 2, Khu Đô Thị Vạn Phúc, Phường Hiệp Bình, TP.HCM\n• Đổi trả trong 30 ngày khi không còn nhu cầu.\n• Thương hiệu chính hãng đã được Cục SHTT bảo hộ.\n• Đánh giá 5 sao shop hỗ trợ 100% phí ship đổi size.\n• Cam kết sản phẩm đúng mô tả.\n• Nói không với trầm nấu dầu.',
    // ---- (6.9) lời kêu gọi vào nhóm Zalo, nối vào cuối comment chữ — sửa được ở tab "Comment" trên popup ----
    O_CMT: 'Z3',      // ô lưu cài đặt comment chung của 2 máy (tab Bài viết kênh 1)
    LINK_ZALO: 'https://zalo.me/g/glqz9fnh7pcfx2gffmdh',
    CTA_MAC_DINH: [
      'Vào nhóm Zalo của Sơn Mộc Hương để hỏi trực tiếp trước khi chọn vòng trầm hương nhé',
      'Người mới chơi trầm muốn được tư vấn chọn size, chọn loại thì vào nhóm Zalo này',
      'Còn phân vân chưa biết chọn vòng nào? Vào nhóm Zalo Sơn Mộc Hương để được hướng dẫn',
      'Muốn xem thêm hình thật, video thật vòng trầm hương để mộc thì vào nhóm Zalo nhé',
      'Có câu hỏi về trầm mà chưa ai giải đáp? Vào nhóm Zalo Sơn Mộc Hương hỏi ngay',
      'Tham gia nhóm Zalo để nhận kiến thức phân biệt vòng trầm hương 108 hạt thật giả',
      'Sợ mua nhầm trầm? Vào nhóm Zalo để hỏi kỹ trước khi xuống tiền',
      'Đang tìm vòng trầm hương làm quà? Vào nhóm Zalo để được gợi ý mẫu phù hợp',
      'Nhóm Zalo Sơn Mộc Hương — nơi hỏi đáp về vòng trầm hương, nhang trầm và cách bảo quản',
      'Muốn biết cách đo tay chọn size chuỗi 108 hạt? Vào nhóm Zalo xem hướng dẫn',
      'Vào nhóm Zalo để xem trước các mẫu vòng trầm hương đang có tại showroom Thủ Đức',
      'Mới đeo trầm, chưa biết bảo quản sao cho đúng? Vào nhóm Zalo hỏi nhé',
    ],
    // ---- (6.11) kho thẻ cho video / manifest: mỗi bài bốc ngẫu nhiên 8 thẻ — sửa ở tab "Comment & Thẻ" ----
    O_BC_GIAO: 'Z5',  // (6.16) báo cáo lỗi kỹ thuật của Máy Giao (Claude đọc mỗi tối)
    O_BC_CAO: 'Z6',   // (6.16) báo cáo lỗi kỹ thuật của Máy Cao
    O_DUYET: 'Z7',    // (6.16) Máy Cao bấm "Duyệt bản mới"
    LINK_TRANG_THAI: 'https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/trangthai.json',
    LINK_CAP_NHAT: 'https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/smh.user.js', // (6.18) nơi Tampermonkey tự tải bản mới đã duyệt
    LINK_THU_DRIVE: 'https://drive.usercontent.google.com/download?id=1S8X7GJEaVGBPGMf1Eu5UHPvh5m_BVOQj&export=download', // (6.18) thử: Tampermonkey có đọc được file phát hành trên Google Drive không
    O_THE: 'Z4',      // ô lưu kho thẻ chung của 2 máy (tab Bài viết kênh 1)
    SO_THE: 8,
    THE_VIDEO: [
      'Bí kíp chọn vòng trầm hương 108 hạt giá bao nhiêu cho người mua lần đầu',
      'Vì sao cùng là vòng trầm hương 108 hạt nhưng giá lại chênh lệch rất lớn',
      'Làm sao biết giá vòng trầm hương 108 hạt có hợp lý hay không',
      'Hướng dẫn cách xem giá vòng trầm hương 108 hạt chuẩn xác để không bị mua hớ',
      'Vòng trầm hương 108 hạt tự nhiên giá bao nhiêu là hợp lý',
      'Vòng trầm hương 108 hạt giá bao nhiêu mới đúng giá trị',
      'Hướng dẫn cách xem giá vòng trầm hương 108 hạt cho người mới chơi trầm',
      'Tại sao cùng là vòng trầm hương 108 hạt nhưng giá lại khác nhau?',
      'Cách phân biệt vòng trầm hương 108 hạt thật giả',
      'Vòng trầm hương 108 hạt để mộc không phủ keo sáp',
      'Cách chọn size vòng trầm hương 108 hạt',
      'Người mới chơi trầm nên chọn vòng nào',
      'Cách bảo quản vòng trầm hương khi đeo hằng ngày',
      'Vòng trầm hương làm quà tặng ý nghĩa',
      'Sơn Mộc Hương trầm chuẩn giá chuẩn',
      'Kinh nghiệm mua vòng trầm hương lần đầu',
    ],
    THE_MANIFEST: [
      'Manifest tài lộc mỗi ngày', 'Năng lượng tích cực thu hút tài chính', 'Câu khẳng định đón nhận tiền bạc', 'Manifest bình an và may mắn',
      'Lời chúc tài lộc đầu ngày', 'Năng lượng tốt đang tìm đến bạn', 'Đón nhận vận may và thịnh vượng', 'Sơn Mộc Hương manifest năng lượng',
      'Manifest tiền bạc tự tìm đến', 'Câu nói năng lượng tích cực mỗi ngày', 'Thu hút tài lộc và bình an', 'Manifest công việc thuận lợi',
      'Lời khẳng định thịnh vượng', 'Đón nhận năng lượng tốt lành', 'Manifest may mắn trong tuần mới', 'Năng lượng tài chính dồi dào',
    ],
    // ---- báo cáo tuần Khanh Trầm Hương (chỉ Máy Cao) ----
    KHANH_BAT: true,
    KHANH_URL: 'https://www.facebook.com/100063806572484',
    KHANH_TEN: 'Khanh Trầm Hương',
    KHANH_GIO: '19:00',
    KHANH_THU: 5,
    KHANH_MOC_GIO: [0, 1, 2, 3, 12.84, 18, 24, 27],
    KHANH_TOI_DA_BAI: 20,
    // Facebook Graph API — CHỈ ĐỌC. Mã khoá là BÍ MẬT, cài bằng nút "Cài mã khoá" trên popup.
    FB_PAGE_ID: '1196332230224812',
    FB_TOKEN: '',
    TAG_TEN: 'Sơn Mộc Hương',
    CAM_XUC_CHON: ['hạnh phúc', 'hào hứng', 'tuyệt vời', 'tích cực', 'biết ơn', 'cảm kích', 'vui vẻ', 'thư giãn', 'hân hoan'],
    SUA_VIDEO_SAU_DANG: true,  // (6.11) video/manifest đăng xong: mở "Chỉnh sửa thước phim" gắn thẻ Trang Sơn Mộc Hương + cảm xúc
  };
  const LICH = CAI_DAT.LICH;
  const tenSlot = (k) => (LICH.find((x) => x.k === k) || {}).ten || k;

  // =====================================================================
  //  Tiện ích chung
  // =====================================================================
  const HE_SO_CHAM = LA_GIAO ? 1.8 : 1; // Máy Giao chạy chậm hơn → mỗi lần chờ dài hơn 1,8 lần cho chắc
  const sleep = (ms) => new Promise((r) => setTimeout(r, Math.round(ms * HE_SO_CHAM)));
  const sleepThat = (ms) => new Promise((r) => setTimeout(r, ms));
  const chuan = (s) => String(s == null ? '' : s).normalize('NFC').replace(/\s+/g, ' ').trim();
  const thuong = (s) => chuan(s).toLowerCase();
  const pad = (n) => String(n).padStart(2, '0');
  const ngayStr = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  const gioStr = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const phutStr = (p) => `${pad(Math.floor(p / 60))}:${pad(p % 60)}`;
  const phutTrongNgay = (d) => d.getHours() * 60 + d.getMinutes();
  const docGio = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const homNay = () => ngayStr(new Date());
  const congNgay = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
  const ngayMai = () => ngayStr(congNgay(1));
  const THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const lucPhut = (phut) => { const d = new Date(); d.setHours(Math.floor(phut / 60), phut % 60, 0, 0); return d.getTime(); };
  const trongGioNhan = () => { const m = phutTrongNgay(new Date()); return m >= docGio(CAI_DAT.GIO_NHAN_TU) && m < docGio(CAI_DAT.GIO_NHAN_DEN); };
  const bam = (s) => { let h = 0; for (const ch of chuan(s)) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h.toString(36); };
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const conLai = (ms) => { const g = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(g / 3600), p = Math.floor((g % 3600) / 60), s = g % 60;
    return h ? `${h} giờ ${pad(p)} phút` : `${pad(p)}:${pad(s)}`; };
  const gioNgan = (t) => (t ? gioStr(new Date(t)).replace(':', 'h') : '--h--');

  async function cho(fn, timeout = 8000, buoc = 300) {
    const han = Date.now() + timeout * HE_SO_CHAM;
    while (Date.now() < han) {
      if (window.__smhHuyLuot) { const ly = window.__smhHuyLuot; window.__smhHuyLuot = 0; const e = new LoiMem(ly); e.taiLai = true; throw e; } // (6.15) bộ canh treo: dừng bước đang kẹt
      try { const v = fn(); if (v) return v; } catch (e) { /* bỏ qua */ }
      await sleepThat(buoc);
    }
    return null;
  }

  class LoiMem extends Error {}   // lỗi có thể thử lại
  class LoiCung extends Error {}  // lỗi không được thử lại (tránh đăng trùng)
  class LoiDung extends Error {} // yêu cầu dừng hoặc mất quyền làm việc
  class LoiLark extends LoiMem {}
  class LoiTuChoi extends Error {} // Facebook báo rõ là KHÔNG nhận comment
  class LoiTamHoan extends LoiDung {} // tab bị ẩn / tạm mất quyền: lát nữa làm tiếp
  class LoiTrung extends LoiDung { constructor(m, p) { super(m); this.p = p; } } // phát hiện bài đã có ngay trước khi bấm Đăng
  class LoiChuaGui extends Error {} // comment CHƯA được gửi đi (an toàn để thử lại)
  class LoiLarkToken extends LoiMem {} // mã truy cập Lark hết hạn
  class LoiThieu extends LoiMem {} // thiếu nội dung trong sheet
  const khoaSo = (s) => thuong(s).replace(/[^\p{L}\p{N}]+/gu, '');
  const chuanTen = (s) => khoaSo(s);

  // ---------------- nhật ký ----------------
  function anBiMat(msg) {
    let t = String(msg);
    const secrets = [CAI_DAT.LARK_APP_SECRET, CAI_DAT.WEBHOOK_BAO_CAO, CAI_DAT.WEBHOOK_LOI, lay('fb_token', ''), CAI_DAT.FB_TOKEN].filter(Boolean);
    for (const x of secrets) t = t.split(x).join('[ĐÃ ẨN]');
    return t.replace(/EAA[A-Za-z0-9]{40,}/g, '[MÃ FB ĐÃ ẨN]')
      .replace(/https:\/\/open\.larksuite\.com\/open-apis\/bot\/v2\/hook\/[^\s"']+/g, '[WEBHOOK ĐÃ ẨN]')
      .replace(/((?:access_token|app_secret|Authorization)["']?\s*[:=]\s*["']?)[^\s,"'}&]+/gi, '$1[ĐÃ ẨN]');
  }
  const laMocQuanTrong = (m) => /Đăng|đăng|comment|Lỗi|lỗi|dừng|Tạm dừng|giữ chỗ|nhường|Khởi động|Lark tạm ngừng|phục hồi|Báo cáo|báo nhóm/.test(m);
  function khoaNK(d) { return 'nk6_' + ngayStr(d); }
  function gioNK(t) { const d = new Date(t); return ngayStr(d).slice(0, 5) + ' ' + gioStr(d) + ':' + pad(d.getSeconds()); }
  function dongNK(e) { return gioNK(e.luc) + ' ' + e.msg + (e.so > 1 ? ' [lặp ' + e.so + ' lần; cuối ' + gioNK(e.cuoi) + ']' : ''); }
  function docNhatKy(soNgay = 3) {
    const ds = [];
    for (let i = soNgay - 1; i >= 0; i--) ds.push(...lay(khoaNK(congNgay(-i)), []));
    return ds.sort((a, b) => a.luc - b.luc);
  }
  function luuNK(msg, quanTrong = false, tab = MA_TAB) {
    const now = Date.now(), k = khoaNK(new Date());
    const ds = lay(k, []);
    const text = anBiMat(msg).slice(0, 2200) + (tab ? ' [tab ' + tab + ']' : '');
    const lap = ds.slice().reverse().find((e) => e.msg === text && now - e.cuoi < 30 * 60000);
    if (lap) { lap.so++; lap.cuoi = now; }
    else ds.push({ luc: now, cuoi: now, msg: text, so: 1, quanTrong });
    while (ds.length > 1500 || JSON.stringify(ds).length > 220000) {
      const i = ds.findIndex((e) => !e.quanTrong);
      ds.splice(i < 0 ? 0 : i, 1);
    }
    luu(k, ds);
  }
  function chupLoi(tieuDe) {
    try {
      const ds = Array.from(document.querySelectorAll('div[role="dialog"]')).map((d, i) => { const r = d.getBoundingClientRect(); return i + ':' + Math.round(r.width) + 'x' + Math.round(r.height) + (d.closest('[aria-hidden="true"]') ? ':ẩn' : '') + ':' + (d.innerText || '').replace(/\s+/g, ' ').slice(0, 70); });
      ghi('Lỗi chi tiết [' + tieuDe + '] bản ' + PHIEN_BAN + ' | tab ' + (document.visibilityState) + ' | hộp: ' + (ds.join(' ¦ ') || 'không có') + ' | trang: ' + location.pathname.slice(0, 60));
    } catch (e) { /* */ }
  }
  window.addEventListener('error', (ev) => { try { if (/ResizeObserver/.test(ev.message || '')) return; ghi('Lỗi script: ' + (ev.message || '') + ' @' + String(ev.filename || '').slice(-30) + ':' + ev.lineno); } catch (e) { /* */ } });
  window.addEventListener('unhandledrejection', (ev) => { try { ghi('Lỗi script (promise): ' + String((ev.reason && ev.reason.message) || ev.reason || '').slice(0, 160)); } catch (e) { /* */ } });
  // Script tự tải lại / chuyển trang: dọn chữ gõ dở + chặn hộp hỏi "Tải lại trang web?" của trình duyệt (hộp này làm cả trang đứng chờ người bấm)
  let roiTrangLuc = 0;
  window.addEventListener('beforeunload', (e) => { if (Date.now() - roiTrangLuc < 20000) { try { e.stopImmediatePropagation(); } catch (er) { /* */ } } }, true);
  try {
    if (typeof GM_addElement === 'function') GM_addElement('script', { textContent: "(function(){document.addEventListener('smhfb-roi-trang',function(){try{window.onbeforeunload=null;var P=window.BeforeUnloadEvent&&BeforeUnloadEvent.prototype;if(P){Object.defineProperty(P,'returnValue',{configurable:true,get:function(){return '';},set:function(){}});P.preventDefault=function(){};}window.addEventListener('beforeunload',function(e){e.stopImmediatePropagation();},true);}catch(e){}});})();" });
  } catch (er) { /* */ }
  function donNhapDo() {
    let n = 0;
    for (const ed of document.querySelectorAll('div[contenteditable="true"], textarea')) {
      if (ed.closest && ed.closest('#smhfb,#smhfb-nho,#smhfb-soan-w,#smhfb-gan-w,#smhfb-gan-modal')) continue;
      const v = ed.tagName === 'TEXTAREA' ? ed.value : ed.innerText;
      if (!String(v || '').trim()) continue;
      try { if (ed.tagName === 'TEXTAREA') { ed.value = ''; } else { ed.focus(); document.execCommand('selectAll', false); document.execCommand('delete', false); } n++; } catch (er) { /* */ }
    }
    return n;
  }
  function roiTrang(url) {
    roiTrangLuc = Date.now();
    try { document.dispatchEvent(new CustomEvent('smhfb-roi-trang')); } catch (er) { /* */ }
    try { donNhapDo(); } catch (er) { /* */ }
    for (const w of [typeof unsafeWindow !== 'undefined' ? unsafeWindow : null, window]) {
      if (!w) continue;
      try { w.onbeforeunload = null; } catch (er) { /* */ }
      try { const P = w.BeforeUnloadEvent && w.BeforeUnloadEvent.prototype; if (P) { Object.defineProperty(P, 'returnValue', { configurable: true, get() { return ''; }, set() { /* chặn */ } }); P.preventDefault = function () { /* chặn */ }; } } catch (er) { /* */ }
    }
    if (url) location.href = url; else location.reload();
  }
  // phần comment chính (bỏ khối "CTA:… Link:…" ở cuối) — dùng khi so comment trên trang, để comment cũ chưa có CTA vẫn tính là đủ
  // (6.10) lần thử lại (từ lần 2): bước phụ (nền đỏ, vị trí, thẻ, nhóm, hình thu nhỏ) lỗi thì BỎ QUA bước đó và vẫn đăng — ghi chú vào báo cáo
  const thuNhe = () => (window.__smhLan || 0) >= 1;
  function boQuaBuoc(ten, e) { (window.__smhBoQua = window.__smhBoQua || []).push(ten); ghi(`Bỏ qua bước ${ten} (${e && e.message ? e.message : 'lỗi'}) — đây là lần thử lại nên vẫn đăng bài, ghi chú vào báo cáo`); }
  function boCTA(t) { return String(t || '').split(/\n\s*CTA:/)[0]; }
  function ghi(msg) {
    const safe = anBiMat(msg);
    window.__smhGhiLuc = Date.now(); window.__smhGhiCuoi = safe; // (6.15) bộ canh treo: lúc có bước mới gần nhất
    try { thuBaoCao(safe); if (hdChay && TK_KQ_RE.test(safe)) hdChay.coKQ = true; } catch (e) { /* */ } // (6.16) gom lỗi cho báo cáo kỹ thuật + thống kê việc
    luuNK(safe, laMocQuanTrong(safe));
    try { if (hdChay && !/^(Nhận quyền|Khởi động|Gửi yêu cầu)/.test(safe)) { hdChay.chi = safe; hdChay.cuoi = safe; hdChay.soDong = (hdChay.soDong || 0) + 1; hdChay.cap = Date.now(); if (!hdChay.hien) { hdChay.hien = true; } luu('hoat_dong', hdChay); } } catch (e) { /* */ }
    console.log('[' + TEN_HE_THONG + ']', safe);
    try { theoDoiSoan(safe); } catch (e) { /* */ }
    try { if (/^(Bấm|Nhân sự bấm|Chọn font|Đã chọn|Đã thêm font|Đã xoá font|Tự đăng:|Chạy thử:|Bỏ đánh dấu|Đặt máy|Đã dán ảnh|Tạo lại ảnh|Đã kiểm|Đã gửi|Đã đọc)/.test(safe)) nhacNho(safe); } catch (e) { /* */ }
    try { veBang(); } catch (e) { /* */ }
  }
  function thongBaoMay(tieuDe, noiDung) {
    try {
      GM_notification({ title: tieuDe, text: noiDung, timeout: 0, highlight: true, onclick: () => { try { window.focus(); } catch (e) { /* */ } } });
      ghi('Đã hiện thông báo trên máy: ' + tieuDe);
    } catch (e) { ghi('Không hiện được thông báo trên máy: ' + e.message); }
  }

  // =====================================================================
  //  Gọi API Lark (sheet + webhook) — gọi càng ít càng tốt
  // =====================================================================
  function thangHienTai() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1); }
  function chanLark() {
    const g = lay('lark_gate', null);
    if (!g) return null;
    if (g.loai === 'quota' && g.thang !== thangHienTai()) return null;
    return g.den > Date.now() ? g : null;
  }
  const MA_TOKEN_LARK = ['99991663', '99991664', '99991665', '99991661'];
  function loiLark(ma, msg) {
    const g0 = lay('lark_gate', {}) || {};
    const lan = (g0.lan || 0) + 1;
    const code = String(ma), d = new Date();
    let loai = 'tam', moTa = 'Lark tạm lỗi kết nối/dịch vụ', den = Date.now() + Math.min(30, Math.pow(2, Math.min(lan - 1, 5))) * 60000;
    if (code === '99991403') { loai = 'quota'; moTa = 'Lark đã hết hạn mức API tháng'; den = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(); }
    else if (['91403', '99991672', '99991676', '99991679', '99991668', '10014'].includes(code)) { loai = 'quyen'; moTa = 'Lark từ chối quyền truy cập hoặc thông tin ứng dụng'; den = Date.now() + 60 * 60000; }
    else if (MA_TOKEN_LARK.includes(code)) { moTa = 'Mã truy cập Lark cần làm mới'; boTokenLark(); }
    else if (code === '99991400' || code === '429') { moTa = 'Lark giới hạn tốc độ gọi API'; den = Date.now() + Math.min(60, 5 * lan) * 60000; }
    const g = { loai, ma: code, msg: moTa + ' (mã ' + code + ')', detail: anBiMat(msg || '').slice(0, 350), den, lan, luc: Date.now(), tu: (g0.loai === loai && g0.tu) ? g0.tu : Date.now(), thang: thangHienTai(), bao: g0.ma === code && g0.thang === thangHienTai() ? g0.bao : false };
    luu('lark_gate', g);
    capNhat('suc_khoe', { larkOk: false, larkLuc: Date.now(), larkLoi: g.msg });
    if (!g0.msg || g0.ma !== code) ghi('Lark tạm ngừng: ' + g.msg);
    return new LoiLark(g.msg);
  }
  async function baoTinhTrangLark() {
    const g = lay('lark_gate', null);
    if (!g || g.bao || !trongGioNhan() || !laTabChinh()) return;
    if (!(g.loai === 'quota' || g.loai === 'quyen' || Date.now() - (g.tu || g.luc) >= 30 * 60000)) return;
    luu('lark_gate', Object.assign({}, g, { bao: true }));
    await baoLoi(`${g.msg} — script vẫn đăng bằng dữ liệu đã tải sẵn; cần kiểm tra hạn mức/quyền Lark`, 'lark_' + g.ma);
  }
  function goiTho(method, url, body, headers, timeout = 25000) {
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        method, url,
        headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers),
        data: body ? JSON.stringify(body) : undefined,
        timeout,
        onload: (r) => { let j = null; try { j = JSON.parse(r.responseText); } catch (e) { /* */ } resolve({ status: r.status, json: j }); },
        onerror: () => resolve({ status: 0, json: null, mang: 'network' }),
        ontimeout: () => resolve({ status: 0, json: null, mang: 'timeout' }),
      });
    });
  }
  const demLark = () => capNhat('lark_dem', { ngay: homNay(), so: (lay('lark_dem', {}).ngay === homNay() ? lay('lark_dem', {}).so || 0 : 0) + 1 });
  // lỗi mạng / quá lâu / máy chủ 5xx / giới hạn tốc độ: tự thử lại tối đa 2 lần (cách 3–8 giây) rồi mới tính là lỗi
  async function goi(method, url, body, headers = {}, timeout) {
    const duLieu = url.startsWith('https://open.larksuite.com/open-apis/') && !url.includes('/bot/v2/hook/');
    const gate = duLieu && chanLark();
    if (gate) throw new LoiLark(gate.msg + ' — đang chờ kiểm tra lại');
    for (let lan = 0; ; lan++) {
      if (duLieu) demLark();
      const r = await goiTho(method, url, body, headers, timeout);
      const j = r.json;
      if (!duLieu) {
        if (r.mang) throw new LoiMem(r.mang === 'timeout' ? 'Gửi tin Lark quá lâu' : 'Mất kết nối khi gửi tin Lark');
        return r;
      }
      const loi = r.mang || !j || r.status >= 400 || (j.code != null && j.code !== 0);
      if (!loi) { if (lay('lark_gate', null)) { luu('lark_gate', null); ghi('Kết nối Lark phục hồi'); } capNhat('suc_khoe', { larkOk: true, larkLuc: Date.now(), larkLoi: '' }); return r; }
      const ma = String(r.mang || (j && j.code) || r.status || 'network');
      if (MA_TOKEN_LARK.includes(ma)) { boTokenLark(); throw new LoiLarkToken('Mã truy cập Lark cần làm mới (mã ' + ma + ')'); }
      const tam = r.mang || r.status >= 500 || ma === '99991400' || ma === '429' || !j;
      if (tam && lan < 2) { await sleepThat(3000 + Math.floor(Math.random() * 5000)); continue; }
      throw loiLark(ma, r.mang ? (r.mang === 'timeout' ? 'Phản hồi quá lâu' : 'Mất kết nối') : (j && j.msg));
    }
  }
  async function goiLark(method, url, body, timeout) {
    for (let lan = 0; ; lan++) {
      const t = await larkToken();
      try { return await goi(method, url, body, { Authorization: 'Bearer ' + t }, timeout); }
      catch (e) { if (e instanceof LoiLarkToken && lan === 0) continue; throw e; }
    }
  }
  function boTokenLark() { tokenCache = null; try { luu('lark_tok', null); } catch (e) { /* */ } }
  let tokenCache = null, tokenCho = null;
  async function larkToken() {
    if (tokenCho) return tokenCho;
    tokenCho = layLarkToken();
    try { return await tokenCho; } finally { tokenCho = null; }
  }
  async function layLarkToken() {
    if (!tokenCache) { const c = lay('lark_tok', null); if (c && c.t && c.het > Date.now() + 5 * 60000) tokenCache = c; }
    if (tokenCache && tokenCache.het > Date.now() + 60000) return tokenCache.t;
    const r = await goi('POST', 'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', { app_id: CAI_DAT.LARK_APP_ID, app_secret: CAI_DAT.LARK_APP_SECRET });
    if (!r.json || r.json.code !== 0) throw new LoiMem('Không lấy được quyền đọc Lark (mã ' + (r.json ? r.json.code : r.status) + ')');
    tokenCache = { t: r.json.tenant_access_token, het: Date.now() + r.json.expire * 1000 };
    luu('lark_tok', tokenCache);
    return tokenCache.t;
  }
  const URL_SHEET = () => 'https://open.larksuite.com/open-apis/sheets/v2/spreadsheets/' + CAI_DAT.SHEET_TOKEN;
  // đọc 1 vùng ô → mảng 2 chiều
  async function docBang(tab, vung) {
    const r = await goiLark('GET', `${URL_SHEET()}/values/${tab}!${vung}`, null, 60000);
    if (!r.json || r.json.code !== 0 || !r.json.data || !r.json.data.valueRange) throw new LoiMem('Không đọc được sheet (' + tab + '!' + vung + ')');
    return r.json.data.valueRange.values || [];
  }
  async function docO(tab, o) { const v = await docBang(tab, o + ':' + o); return (v[0] || [])[0]; }
  async function ghiO(tab, o, giaTri) {
    const r = await goiLark('PUT', `${URL_SHEET()}/values`, { valueRange: { range: `${tab}!${o}:${o}`, values: [[giaTri]] } });
    if (!r.json || r.json.code !== 0) throw new LoiMem('Ghi ô ' + o + ' chưa được (mã ' + (r.json ? r.json.code : r.status) + ')');
  }
  async function ghiNhieuO(tab, ds) { // ds: [[ô, giá trị], ...] — gộp 1 lượt gọi
    const r = await goiLark('POST', `${URL_SHEET()}/values_batch_update`, { valueRanges: ds.map(([o, v]) => ({ range: `${tab}!${o}:${o}`, values: [[v]] })) });
    if (!r.json || r.json.code !== 0) throw new LoiMem('Ghi ô ' + ds.map((x) => x[0]).join(', ') + ' chưa được (mã ' + (r.json ? r.json.code : r.status) + ')');
  }
  // dán ảnh vào ô (ảnh nằm trong ô, giống dán tay)
  async function ghiAnhVaoO(tab, o, blob, ten) {
    const u8 = new Uint8Array(await blob.arrayBuffer());
    const r = await goiLark('POST', `${URL_SHEET()}/values_image`, { range: `${tab}!${o}:${o}`, image: Array.from(u8), name: ten || ('manifest-' + homNay() + '.jpg') }, 120000);
    if (!r.json || r.json.code !== 0) throw new LoiMem('Lark không nhận ảnh ô ' + o + ' (mã ' + (r.json ? r.json.code : r.status) + ')');
  }

  // ---------------- tin nhắn Lark: chỉ 2 loại ----------------
  //  'baocao' → nhóm Marketing (báo cáo cuối ngày + báo cáo tuần Khanh)   'loi' → nhóm "Đăng bài fb" (lỗi khi đăng, ghi rõ máy nào)
  async function guiLark(nhom, noiDung, { khoa = '', toiDa = 1 } = {}) {
    const hook = nhom === 'baocao' ? CAI_DAT.WEBHOOK_BAO_CAO : CAI_DAT.WEBHOOK_LOI;
    let tin = String(noiDung).replace(/^\n/, '');
    if (!/fb/i.test(tin)) tin = (tin.includes('\n') ? `${CAI_DAT.TIEN_TO_TIN}\n` : `${CAI_DAT.TIEN_TO_TIN} `) + tin;
    const kk = 'tin6_' + homNay(); const k = khoa || bam(tin.replace(/\d{1,2}[:h]\d{2}/g, ''));
    const dem = lay(kk, {}) || {};
    if ((dem[k] || 0) >= toiDa) { ghi('(hôm nay đã gửi tin này rồi, không gửi lại) ' + tin.replace(/\s+/g, ' ').slice(0, 120)); return true; }
    dem[k] = (dem[k] || 0) + 1; luu(kk, dem);
    let loiCuoi = '';
    for (let lan = 0; lan < 3; lan++) {
      try {
        const r = await goi('POST', hook, { msg_type: 'text', content: { text: tin } });
        if (r.json && (r.json.code === 0 || r.json.StatusCode === 0)) { capNhat('suc_khoe', { tinOk: true, tinLuc: Date.now(), tinLoi: '' }); ghi('Đã báo Lark (' + (nhom === 'baocao' ? 'nhóm Marketing' : 'nhóm Đăng bài fb') + '): ' + tin.replace(/\s+/g, ' ').slice(0, 300)); return true; }
        loiCuoi = 'mã ' + (r.json ? (r.json.code || r.json.StatusCode) : r.status);
        if (!(r.status >= 500 || !r.json)) break;
      } catch (e) {
        loiCuoi = e.message;
        if (/quá lâu/.test(e.message)) { ghi('Gửi tin Lark phản hồi quá lâu (tin có thể đã tới nhóm) → không gửi lặp'); return true; }
      }
      if (lan < 2) await sleepThat(4000 + Math.floor(Math.random() * 6000));
    }
    const d2 = lay(kk, {}) || {}; if (d2[k]) d2[k]--; luu(kk, d2);
    capNhat('suc_khoe', { tinOk: false, tinLuc: Date.now(), tinLoi: loiCuoi });
    ghi('Báo Lark lỗi: ' + loiCuoi + ' — ' + tin.replace(/\s+/g, ' ').slice(0, 160));
    return false;
  }
  // báo lỗi vào nhóm "Đăng bài fb" — luôn ghi rõ máy nào; mỗi khoá tối đa 1 lần/ngày
  async function baoLoi(noiDung, khoa, toiDa = 1) {
    if (!laTabChinh()) return false;
    if (!trongGioNhan()) { ghi('(ngoài giờ gửi tin) ' + noiDung); return false; }
    return guiLark('loi', `[fb][${TEN_MAY}] ${noiDung}`, { khoa: khoa || '', toiDa });
  }

  // =====================================================================
  //  Đọc dữ liệu sheet (2 tab) — chỉ đọc 13:30 + 18:30 (và khi bấm nút)
  // =====================================================================
  function chuO(cell) {
    if (cell == null) return '';
    if (typeof cell === 'string') return cell;
    if (typeof cell === 'number') return String(cell);
    if (Array.isArray(cell)) return cell.map((s) => (typeof s === 'string' ? s : (s && !s.fileToken && (s.text != null ? s.text : (s.link || ''))) || '')).join('');
    if (typeof cell === 'object' && cell.text != null && !cell.fileToken) return String(cell.text);
    return '';
  }
  const coTep = (c) => !!c && (Array.isArray(c) ? c.some((x) => x && x.fileToken) : !!c.fileToken);
  function ngayO(cell) {
    if (typeof cell === 'number' && cell > 20000 && cell < 80000) {
      const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(cell + 1e-6) * 86400000);
      return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
    }
    const s = chuO(cell);
    const m = s.match(/(\d{1,2})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*(\d{4})/);
    return m ? `${pad(m[1])}-${pad(m[2])}-${m[3]}` : '';
  }
  const COT_BAT_BUOC = [
    { cot: 'A', chiSo: 0, chua: 'từ khóa', ten: 'Từ khóa chính' },
    { cot: 'B', chiSo: 1, chua: 'không có ảnh', ten: 'Bài twist (không có ảnh)' },
    { cot: 'C', chiSo: 2, chua: 'cmt bài 1', ten: 'Cmt bài 1' },
    { cot: 'H', chiSo: 7, chua: 'ngày đăng', ten: 'Ngày đăng' },
  ];
  function kiemTenCot(values) {
    const h = values[0] || [];
    for (const c of COT_BAT_BUOC) {
      if (!thuong(chuO(h[c.chiSo])).includes(c.chua)) return `Tên cột ${c.cot} tab "Bài viết kênh 1" không còn là "${c.ten}" (đang là "${chuan(chuO(h[c.chiSo])) || 'trống'}") — script không đọc để tránh đăng nhầm cột`;
    }
    return null;
  }
  // ô ảnh của Lark: { fileToken, ... } hoặc danh sách → danh sách mã ảnh
  function tokenAnh(c) {
    if (!c) return [];
    if (Array.isArray(c)) return c.reduce((a, x) => a.concat(tokenAnh(x)), []);
    if (typeof c === 'object' && c.fileToken && (c.type === 'embed-image' || /^image\//.test(c.mimeType || '') || /\.(jpe?g|png|webp|heic|gif)$/i.test(c.text || '') || !c.mimeType)) return [String(c.fileToken)];
    return [];
  }
  const anhNhieuO = (r, tu, den) => { let a = []; for (let i = tu; i <= den; i++) a = a.concat(tokenAnh(r[i])); return a; };
  function tepVideo(c) {
    const ds = Array.isArray(c) ? c : (c && c.fileToken ? [c] : []);
    const t = ds.find((x) => x && x.fileToken && (/^video\//.test(x.mimeType || '') || /\.(mp4|mov|m4v|webm)$/i.test(x.text || '')));
    return t ? { fileToken: t.fileToken, size: t.size || 0, ten: t.text || 'video.mp4', mime: t.mimeType || 'video/mp4' } : null;
  }
  function tepNhac(c) {
    const ds = Array.isArray(c) ? c : (c && c.fileToken ? [c] : []);
    const t = ds.find((x) => x && x.fileToken && (/^audio\//.test(x.mimeType || '') || /\.(mp3|m4a|aac|wav|ogg)$/i.test(x.text || '')));
    return t ? { fileToken: t.fileToken, size: t.size || 0, ten: t.text || 'nhac.mp3', mime: t.mimeType || 'audio/mpeg' } : null;
  }
  // ảnh cố định cho comment (Bài 3, video, manifest): ô O2 + 1 ảnh ngẫu nhiên trong P2, Q2, O3, P3, Q3 (tab Bài viết kênh 1)
  function anhChung(v) {
    const r2 = v[1] || [], r3 = v[2] || [];
    return { co: tokenAnh(r2[14])[0] || '', pool: [r2[15], r2[16], r3[14], r3[15], r3[16]].reduce((a, x) => a.concat(tokenAnh(x)), []) };
  }
  function hangCuaNgay(values, ngay) {
    const out = [];
    for (let i = 1; i < values.length; i++) {
      const r = values[i] || [];
      if (ngayO(r[7]) === ngay) {
        out.push({ hang: i + 1, bai: chuO(r[1]).trim(), cmt: chuO(r[2]).trim(), bai2: chuO(r[3]).trim(), cmt2: chuO(r[4]).trim(), bai3: chuO(r[5]).trim(),
          anh2: anhNhieuO(r, 8, 10), anh3: anhNhieuO(r, 11, 13), anhCmt: anhNhieuO(r, 14, 16), trangThai: chuO(r[6]).trim() });
      }
    }
    return out;
  }
  // tab "Kênh 1 Vòng Trầm Hương SMH": K = ngày đăng, N = file video, E = chữ đăng video, G = chữ manifest, H = ảnh manifest, J = trạng thái, B = link
  function videoCuaNgay(values, ngay) {
    const v = [], m = [];
    for (let i = 1; i < values.length; i++) {
      const r = values[i] || [];
      if (ngayO(r[10]) !== ngay) continue;
      const tep = tepVideo(r[13]); const cap = chuO(r[4]).trim();
      if (tep || cap) v.push({ hang: i + 1, cap, tep, daDang: /đã đăng/i.test(chuO(r[9])), link: chuO(r[1]).trim() });
      const chu = coTep(r[6]) ? '' : chuO(r[6]).trim(); const anh = tokenAnh(r[7])[0] || '';
      if (chu || anh) m.push({ hang: i + 1, chu, anh });
    }
    return { v, m };
  }
  // hàng mới (nằm dưới hàng cuối cùng có ngày) đã có nội dung nhưng CHƯA ghi ngày đăng → script chưa biết đăng ngày nào
  function hangChuaNgay(values, cotNgay, coNoiDung, cotTT) {
    let cuoi = 0, ngayXa = '';
    const soNgay = (n) => { const m = n.match(/^(\d{2})-(\d{2})-(\d{4})$/); return m ? `${m[3]}${m[2]}${m[1]}` : ''; };
    for (let i = 1; i < values.length; i++) { const n = ngayO((values[i] || [])[cotNgay]); if (n) { cuoi = i; if (soNgay(n) > ngayXa) ngayXa = soNgay(n); } }
    // sheet đã ghi ngày cho hơn 3 ngày tới → chưa cần nhắc (các hàng chưa ghi ngày còn lâu mới tới lượt)
    if (ngayXa && ngayXa > soNgay(ngayStr(congNgay(3)))) return [];
    const out = [];
    for (let i = cuoi + 1; i < values.length; i++) {
      const r = values[i] || [];
      if (ngayO(r[cotNgay]) || /đã đăng/i.test(chuO(r[cotTT]))) continue;
      if (coNoiDung(r)) out.push(i + 1);
    }
    return out;
  }
  function gonHang(ds) { // [220,221,222,223,230] → "220–223, 230"
    const out = []; let a = null, b = null;
    for (const x of ds) { if (b !== null && x === b + 1) { b = x; continue; } if (a !== null) out.push(a === b ? String(a) : `${a}–${b}`); a = b = x; }
    if (a !== null) out.push(a === b ? String(a) : `${a}–${b}`);
    return out.join(', ');
  }

  // dữ liệu đã đọc (lưu trong Tampermonkey) — dùng cho cả ngày, không đọc lại
  const duLieu = () => lay('du_lieu6', null);
  function phanTich(vB, vV, loai) {
    const loiCot = kiemTenCot(vB);
    const out = { luc: Date.now(), loai, ban: 2, loiCot, chung: anhChung(vB), ngay: {},
      chuaNgayV: hangChuaNgay(vV, 10, (r) => !!(tepVideo(r[13]) || tokenAnh(r[7]).length || (!coTep(r[6]) && chuO(r[6]).trim())), 9),
      chuaNgayB: loiCot ? [] : hangChuaNgay(vB, 7, (r) => !!(chuO(r[1]).trim() || chuO(r[3]).trim() || chuO(r[5]).trim()), 6) };
    for (let i = 0; i <= 3; i++) {
      const ngay = ngayStr(congNgay(i));
      const hs = loiCot ? [] : hangCuaNgay(vB, ngay);
      const vm = videoCuaNgay(vV, ngay);
      out.ngay[ngay] = { bai: hs[0] || null, soHangBai: hs.length, v: vm.v, m: vm.m };
    }
    return out;
  }
  let docDLCho = null;
  async function docDuLieu(loai) {
    if (docDLCho) return docDLCho;
    docDLCho = (async () => {
      const vB = await docBang(CAI_DAT.TAB_BAI, 'A1:Q3000');
      const vV = await docBang(CAI_DAT.TAB_VIDEO, 'A1:N3000');
      const d = phanTich(vB, vV, loai);
      luu('du_lieu6', d);
      await dongBoCmt();
      await dongBoThe();
      try { thuLaiBaiThieu(d); } catch (e) { /* */ }
      const n = d.ngay[homNay()] || {};
      ghi(`Đọc Lark sheet (${({ nhe: 'lượt 13:30', chot: 'lượt 18:30', tay: 'bấm tay', thieu: 'chưa có dữ liệu hôm nay', thieuGio: 'có bài thiếu nội dung, đọc lại mỗi giờ', sang: 'đầu ngày, dữ liệu cũ từ hôm qua', suckhoe: 'tự kiểm tra sáng', nhacmai: 'trước khi nhắc điền sheet ngày mai' })[loai] || loai}): hôm nay có ${n.bai ? 'bài viết' : 'CHƯA có bài viết'}, ${(n.v || []).length} video, ${(n.m || []).length} manifest${d.chuaNgayV.length + d.chuaNgayB.length ? ` · ${d.chuaNgayV.length + d.chuaNgayB.length} hàng có nội dung nhưng chưa ghi ngày đăng (${[d.chuaNgayV.length ? 'tab Kênh 1 hàng ' + gonHang(d.chuaNgayV) : '', d.chuaNgayB.length ? 'tab Bài viết hàng ' + gonHang(d.chuaNgayB) : ''].filter(Boolean).join('; ')})` : ''}${d.loiCot ? ' — ' + d.loiCot : ''}`);
      return d;
    })();
    try { return await docDLCho; } finally { docDLCho = null; }
  }
  // nội dung của 1 bài trong lịch (k = b1…m3) theo dữ liệu đã đọc
  function noiDungSlot(ngay, k, d = duLieu()) {
    const it = LICH.find((x) => x.k === k); const n = d && d.ngay && d.ngay[ngay];
    if (!n) return { thieu: ['chưa đọc được sheet của ngày này'] };
    const b = n.bai; const th = [];
    if (it.loai === 'b1') { if (!b) th.push('bài viết (cột H chưa có hàng ghi ngày này)'); else if (!b.bai) th.push('chữ Bài 1 (cột B)'); if (b && b.bai && !b.cmt) th.push('comment Bài 1 (cột C)'); return { thieu: th, text: b ? b.bai : '', cmt: b ? b.cmt : '', hang: b ? b.hang : 0 }; }
    if (it.loai === 'b2') { if (!b) th.push('bài viết (cột H chưa có hàng ghi ngày này)'); else if (!b.bai2) th.push('chữ Bài 2 (cột D)'); else { if (!b.anh2.length) th.push('ảnh Bài 2 (cột I–K)'); if (!b.cmt2) th.push('comment Bài 2 (cột E)'); } return { thieu: th, text: b ? b.bai2 : '', cmt: b ? b.cmt2 : '', anh: b ? b.anh2 : [], hang: b ? b.hang : 0 }; }
    if (it.loai === 'b3') { if (!b) th.push('bài viết (cột H chưa có hàng ghi ngày này)'); else if (!b.bai3) th.push('chữ Bài 3 (cột F)'); else { if (!b.anh3.length) th.push('ảnh Bài 3 (cột L–N)'); } return { thieu: th, text: b ? b.bai3 : '', anh: b ? b.anh3 : [], anhCmt: b ? b.anhCmt : [], hang: b ? b.hang : 0 }; }
    if (it.loai === 'video') { const x = n.v[it.so]; if (!x) th.push(`video (cột K chưa có hàng thứ ${it.so + 1} ghi ngày này)`); else { if (!x.tep) th.push(`file video ${it.ten} (cột N hàng ${x.hang})`); if (!x.cap) th.push(`chữ đăng ${it.ten} (cột E hàng ${x.hang})`); } return { thieu: th, text: x ? x.cap : '', tep: x ? x.tep : null, hang: x ? x.hang : 0, daDang: x ? x.daDang : false }; }
    const x = n.m[it.so]; if (!x) th.push(`manifest (cột K chưa có hàng thứ ${it.so + 1} ghi ngày này)`); else { if (!x.chu) th.push(`chữ ${it.ten} (cột G hàng ${x.hang})`); if (!x.anh) th.push(`ảnh ${it.ten} (cột H hàng ${x.hang})`); }
    return { thieu: th, text: x ? x.chu : '', anh: x ? x.anh : '', hang: x ? x.hang : 0 };
  }
  // danh sách thiếu của 1 ngày (cho cảnh báo vàng/đỏ trên popup)
  function thieuCuaNgay(ngay, d = duLieu()) {
    if (!d || !d.ngay || !d.ngay[ngay]) return null;
    const ds = [];
    for (const it of LICH) { const nd = noiDungSlot(ngay, it.k, d); if (nd.thieu.length) ds.push({ k: it.k, ten: it.ten, thieu: nd.thieu }); }
    return ds;
  }

  // =====================================================================
  //  Facebook: tư cách, đúng trang, hộp soạn bài (dùng lại từ bản 5.9)
  // =====================================================================
  const dangHien = (d) => { const r = d.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false;
    return d.checkVisibility ? d.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true; };
  const tieuDeHien = (chu) => Array.from(document.querySelectorAll('div[role="dialog"]')).some((h) => (h.innerText || '').trim() === chu && h.getBoundingClientRect().height > 0 && !h.closest('[aria-hidden="true"]'));
  const laCaiDat = (d) => {
    const t = d.innerText || '';
    if (t.startsWith('Cài đặt bài viết') && d.getBoundingClientRect().height > 100) return true; // kiểu cũ
    if (!(t.includes('Xem trước bài viết') && t.includes('Chia sẻ lên nhóm'))) return false; // kiểu mới: màn Cài đặt nằm chung hộp với màn soạn bài
    const e = d.querySelector('div[contenteditable="true"][data-lexical-editor]');
    if (e && !e.closest('[aria-hidden="true"]')) return false;
    return tieuDeHien('Cài đặt bài viết');
  };
  const laNhom = (d) => { const t = d.innerText || ''; if (t.startsWith('Chia sẻ lên nhóm') && d.getBoundingClientRect().height > 100) return true; return t.includes('Chọn nhóm') && tieuDeHien('Chia sẻ lên nhóm') && !!d.querySelector('input[type="checkbox"]'); };
  const hopThoai = (dk) => Array.from(document.querySelectorAll('div[role="dialog"]')).find((d) => dangHien(d) && dk(d));
  const nutTheoChu = (goc, chu) => Array.from(goc.querySelectorAll('[role="button"]')).find((b) => chuan(b.innerText) === chu);
  function nutTaiKhoan() { const ds = Array.from(document.querySelectorAll('div[role="button"][aria-label="Trang cá nhân của bạn"]')); return ds.find(dangHien) || ds[0] || null; }
  async function moMenuTaiKhoan() {
    const dk = () => hopThoai((d) => d.querySelector('a[href^="/me/"]'));
    const dongPopup = async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true })); await sleep(600); };
    for (let lan = 0; lan < 4; lan++) {
      const dangMo = dk(); if (dangMo) return dangMo;
      const nut = await cho(() => nutTaiKhoan() || Array.from(document.querySelectorAll('[role="button"][aria-label="Trang cá nhân của bạn"]')).find(dangHien) || null, 8000, 400);
      if (!nut) { await sleep(1500); continue; }
      // có bảng khác đang mở (Thông báo, Messenger…) thì đóng trước, kẻo bấm lần này chỉ để đóng bảng đó
      let nut2 = nut;
      if (lan && hopThoai(() => true)) { await dongPopup(); nut2 = nutTaiKhoan() || nut; }
      if (lan % 2 && dangHien(nut2)) { try { ganBam(nut2); } catch (e) { nut2.click(); } } else nut2.click(); // lần chẵn: click thường; lần lẻ: chuỗi sự kiện chuột đầy đủ
      const m = await cho(dk, 9000, 400); // menu hiện chậm → chờ tới 9 giây, KHÔNG bấm thêm (bấm thêm sẽ đóng menu lại)
      if (m) return m;
      await sleep(1000);
    }
    return null;
  }
  async function dongMenuTaiKhoan() {
    if (hopThoai((d) => d.querySelector('a[href^="/me/"]'))) { const nut = nutTaiKhoan(); if (nut) nut.click(); await sleep(500); }
  }
  async function damBaoTuCach() {
    kiemDung();
    const menu = await moMenuTaiKhoan();
    if (!menu) {
      // phương án 2: ô bình luận ghi "Bình luận dưới tên <Page>" = Facebook đang ở tư cách Page → đủ tin cậy để làm tiếp
      const tenOCmt = Array.from(document.querySelectorAll('div[contenteditable="true"][aria-label^="Bình luận dưới tên"]')).map((e) => chuan(e.getAttribute('aria-label'))).find(Boolean) || '';
      if (tenOCmt && tenOCmt.startsWith(chuan('Bình luận dưới tên ' + CAI_DAT.TEN_TRANG))) {
        capNhat('suc_khoe', { tuCach: CAI_DAT.TEN_TRANG + ' (xác nhận qua ô bình luận)', tuCachLuc: Date.now(), tuCachDung: true });
        ghi('Menu tài khoản không mở được, nhưng ô bình luận đang ghi "dưới tên ' + CAI_DAT.TEN_TRANG + '" → đúng tư cách Page, làm tiếp');
        return true;
      }
      // phương án 3: tải lại trang 1 lần rồi thử lại (tối đa 1 lần / 10 phút)
      if (Date.now() - lay('tc_reload_luc', 0) > 10 * 60000) {
        luu('tc_reload_luc', Date.now()); ghi('Không mở được menu tài khoản → tải lại trang rồi thử lại');
        await sleep(800); roiTrang(); return false;
      }
      throw new LoiMem('Không mở được menu tài khoản Facebook (đã thử bấm 4 lần + tải lại trang; có thể đã bị đăng xuất)');
    }
    // (4.5) tên đọc lại cho chắc (menu vừa mở có thể chưa vẽ xong); so tên bỏ dấu câu/khoảng trắng
    const ten = chuan(await cho(() => { const m2 = hopThoai((d) => d.querySelector('a[href^="/me/"]')) || menu; const a = m2.querySelector('a[href^="/me/"]'); return a && chuan(a.innerText); }, 4000, 300) || '');
    const dungTen = chuanTen(ten) === chuanTen(CAI_DAT.TEN_TRANG);
    capNhat('suc_khoe', { tuCach: ten || '(chưa đọc được tên)', tuCachLuc: Date.now(), tuCachDung: dungTen });
    ghi('Tư cách hiện tại: "' + ten + '"');
    if (dungTen) { await dongMenuTaiKhoan(); return true; }
    const timNutChuyen = () => Array.from(document.querySelectorAll('[aria-label^="Chuyển sang"]')).find((e) => chuanTen(e.getAttribute('aria-label')) === chuanTen('Chuyển sang ' + CAI_DAT.TEN_TRANG));
    let nut = timNutChuyen();
    if (!nut) { // phương án 2: mở "Xem tất cả trang cá nhân" rồi tìm lại
      const xem = Array.from(menu.querySelectorAll('[role="button"], a')).find((b) => /^Xem tất cả trang cá nhân/.test(chuan(b.innerText)));
      if (xem) { xem.click(); nut = await cho(timNutChuyen, 6000, 400); }
    }
    if (!nut) { // (6.18) menu không có nút chuyển (Facebook chỉ hiện vài trang) → dùng nút "Chuyển ngay" ngay trên trang Vòng Trầm Hương
      await dongMenuTaiKhoan();
      const nutTrang = dungTrang() && Array.from(document.querySelectorAll('[role="button"],button')).find((b) => /^(Chuyển ngay|Chuyển|Switch now|Switch)$/i.test(chuan(b.innerText || b.getAttribute('aria-label') || '')) && !b.closest('[role="dialog"]') && !b.closest('#smhfb') && dangHien(b));
      if (nutTrang && Date.now() - lay('tc_trang_luc', 0) > 5 * 60000) { luu('tc_trang_luc', Date.now()); ghi(`Menu không có nút chuyển sang "${CAI_DAT.TEN_TRANG}" → bấm nút "${chuan(nutTrang.innerText || nutTrang.getAttribute('aria-label'))}" ngay trên trang`); try { ganBam(nutTrang); } catch (e) { nutTrang.click(); } return false; }
      if (!dungTrang() && Date.now() - lay('tc_trang_luc', 0) > 5 * 60000) { luu('tc_trang_luc', Date.now()); ghi('Menu không có nút chuyển trang → mở trang ' + CAI_DAT.TEN_NGAN + ' để dùng nút "Chuyển ngay" trên trang'); veTrang(); return false; }
      throw new LoiMem(`Đang dùng tư cách "${ten}", không tìm thấy nút chuyển sang "${CAI_DAT.TEN_TRANG}" (cả trong menu lẫn trên trang)`);
    }
    const lan = lay('lan_chuyen', []).filter((t) => Date.now() - t < 15 * 60000);
    if (lan.length >= 4) { await dongMenuTaiKhoan(); throw new LoiMem(`Đã thử chuyển sang "${CAI_DAT.TEN_TRANG}" 4 lần nhưng vẫn đang là "${ten}"`); }
    lan.push(Date.now()); luu('lan_chuyen', lan);
    ghi(`Đang là "${ten}" → chuyển sang "${CAI_DAT.TEN_TRANG}"`);
    kiemDung();
    const cachKhac = lan.length % 2 === 0; // lần chẵn dùng chuỗi sự kiện chuột đầy đủ
    if (cachKhac) { try { ganBam(nut); } catch (e) { nut.click(); } } else nut.click();
    // trang không chuyển sau 8 giây → bấm lại bằng cách còn lại
    if (!(await cho(() => !document.contains(nut) || document.readyState === 'loading', 8000, 400))) {
      ghi('Bấm chuyển tư cách chưa ăn → bấm lại bằng cách khác');
      try { if (cachKhac) nut.click(); else ganBam(nut); } catch (e) { /* */ }
    }
    return false;
  }
  const dungTrang = () => location.pathname.toLowerCase().replace(/\/+$/, '') === CAI_DAT.DUONG_DAN_TRANG;
  function veTrang() { ghi('Chuyển tab về trang ' + CAI_DAT.TEN_NGAN); roiTrang(CAI_DAT.URL_TRANG); }
  const hopSoanBai = () => hopThoai((d) => d.querySelector('div[contenteditable="true"][data-lexical-editor]') && d.innerText.includes('Tạo bài viết') && !laCaiDat(d));
  function timNutSoanBai() {
    const anh = Array.from(document.querySelectorAll('[role="button"]')).find((b) => chuan(b.innerText) === 'Ảnh/video' && !b.closest('[role="dialog"]'));
    const boQua = ['Ảnh/video', 'Thước phim', 'Video trực tiếp', 'Sự kiện trong đời'];
    if (anh) {
      let p = anh;
      for (let i = 0; i < 8 && p; i++) {
        p = p.parentElement;
        const bs = Array.from(p.querySelectorAll('[role="button"]')).filter((b) => { const t = chuan(b.innerText); return t && !boQua.includes(t); });
        if (bs.length) return bs[0];
      }
    }
    return Array.from(document.querySelectorAll('[role="button"]')).find((b) => chuan(b.innerText) === 'Bạn đang nghĩ gì?');
  }
  async function datChu(ed, text) {
    const dong = text.split('\n');
    ed.focus(); await sleep(200);
    const sel = window.getSelection(); const rg = document.createRange();
    rg.selectNodeContents(ed); sel.removeAllRanges(); sel.addRange(rg);
    await sleep(300);
    document.execCommand('insertText', false, dong[0]);
    if (dong.length > 1) {
      await sleep(300);
      const dt = new DataTransfer(); dt.setData('text/plain', '\n' + dong.slice(1).join('\n'));
      ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    }
    await sleep(800);
    return chuan(ed.innerText) === chuan(text);
  }
  const hopDangDo = () => hopThoai((d) => laCaiDat(d) || laNhom(d));
  function choTabAn(ten) {
    const now = Date.now(); const k = lay('cho_tab_an', null);
    if (!k || k.ten !== ten) { luu('cho_tab_an', { ten, tu: now, bao: 0 }); ghi(`Đang chờ: tab Facebook bị ẩn/thu nhỏ nên chưa làm tiếp được ${ten} — mở tab này lên màn hình để script chạy tiếp`); return; }
    if (!k.bao && now - k.tu > 5 * 60000) { luu('cho_tab_an', Object.assign(k, { bao: now })); ghi(`Lỗi: ${ten} đã phải chờ ${Math.round((now - k.tu) / 60000)} phút vì tab Facebook bị ẩn/thu nhỏ`); thongBaoMay('Cần mở tab Facebook', `Script đang chờ để làm tiếp ${ten} — hãy mở tab Facebook lên màn hình`); }
  }
  function hetChoTabAn() { const k = lay('cho_tab_an', null); if (!k) return; luu('cho_tab_an', null); ghi(`Tab đã hiện lại sau ${Math.max(1, Math.round((Date.now() - k.tu) / 60000))} phút chờ → làm tiếp ${k.ten}`); }

  // =====================================================================
  //  Facebook Graph API — CHỈ ĐỌC (dùng lại từ bản 5.9)
  // =====================================================================
  const fbToken = () => lay('fb_token', '') || CAI_DAT.FB_TOKEN;
  const coApi = () => !!(fbToken() && CAI_DAT.FB_PAGE_ID);
  const tuCua = (s) => String(s == null ? '' : s).normalize('NFC').toLowerCase().replace(/https?:\/\/\S+/g, ' ').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const linkCua = (s) => (String(s == null ? '' : s).match(/https?:\/\/\S+/g) || []).map((u) => u.replace(/[?#].*$/, '').replace(/[)\].,]+$/, '').replace(/\/+$/, '').replace(/^https?:\/\/(www\.|m\.)?/, '').toLowerCase());
  function doGiong(msg, text) {
    const a = tuCua(text); if (!a.length) return 0;
    const dem = new Map(); for (const w of tuCua(msg)) dem.set(w, (dem.get(w) || 0) + 1);
    let co = 0; for (const w of a) { const n = dem.get(w) || 0; if (n > 0) { co++; dem.set(w, n - 1); } }
    return co / a.length;
  }
  const doDaiHop = (msg, text) => tuCua(msg).length <= tuCua(text).length * 1.6 + 6; // bài dài gấp rưỡi trở lên thì không phải cùng bài
  const khopBai = (msg, text) => tuCua(text).length >= 3 && doDaiHop(msg, text) && doGiong(msg, text) >= CAI_DAT.NGUONG_BAI;
  const khopCmt = (msg, text0) => { const text = boCTA(text0); const l = linkCua(text); if (l.length && linkCua(msg).some((x) => l.includes(x))) return true; return tuCua(text).length >= 2 && doGiong(msg, text) >= CAI_DAT.NGUONG_CMT; };
  function baiGiongNhat(ds, text, daDung) {
    let tot = null; let diem = 0;
    for (const p of ds) { if (daDung && daDung.has(p.id)) continue; if (!doDaiHop(p.text, text)) continue; const d = doGiong(p.text, text); if (d > diem) { diem = d; tot = p; } }
    return tot && tuCua(text).length >= 3 && diem >= CAI_DAT.NGUONG_BAI ? Object.assign({ diem }, tot) : null;
  }
  function goiFbMot(duongDan, token) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET', url: 'https://graph.facebook.com' + duongDan,
        headers: { Authorization: 'OAuth ' + (token || fbToken()) }, timeout: 20000,
        onload: (r) => {
          let j = null; try { j = JSON.parse(r.responseText); } catch (e) { /* */ }
          if (j && !j.error && r.status < 400) resolve(j);
          else { const e = new LoiMem('Facebook API từ chối: ' + (j && j.error ? `${j.error.message || ''} (mã ${j.error.code})` : 'mã ' + r.status)); e.ma = j && j.error ? j.error.code : r.status; e.tam = !j || r.status >= 500 || [1, 2, 4, 17, 32, 341, 368, 613].includes(e.ma); e.maKhoa = [190, 102, 463, 467].includes(e.ma); reject(e); }
        },
        onerror: () => { const e = new LoiMem('Mất kết nối khi gọi Facebook API'); e.tam = true; reject(e); },
        ontimeout: () => { const e = new LoiMem('Facebook API phản hồi quá lâu'); e.tam = true; reject(e); },
      });
    });
  }
  async function goiFb(duongDan, token) {
    for (let lan = 0; ; lan++) {
      try { return await goiFbMot(duongDan, token); }
      catch (e) { if (e.tam && lan < 2) { await sleep(2000 + Math.floor(Math.random() * 3000)); continue; } throw e; }
    }
  }
  async function caiMaKhoa() {
    const nhap = prompt('Dán mã khoá Facebook (chỉ đọc) của trang vào đây:\n(Để trống rồi bấm OK = xoá mã khoá đang cài)');
    if (nhap == null) return;
    const t = nhap.replace(/\s/g, '');
    if (!t) { luu('fb_token', ''); ghi('Đã xoá mã khoá Facebook'); veBang(); return; }
    if (!/^EAA[A-Za-z0-9]{50,}$/.test(t)) { alert('Mã khoá không đúng dạng (phải bắt đầu bằng EAA...). Cao copy lại giúp nhé.'); return; }
    try {
      // Nếu dán mã của NGƯỜI DÙNG (dài hạn) thì tự đổi sang mã của TRANG (không hết hạn)
      let maTrang = t;
      try {
        const acc = await goiFb('/me/accounts?fields=id,name,access_token&limit=100', t);
        const pg = (acc.data || []).find((x) => x.id === CAI_DAT.FB_PAGE_ID);
        if (pg && pg.access_token) { maTrang = pg.access_token; ghi('Mã dán vào là mã người dùng → đã đổi sang mã của trang ' + pg.name); }
      } catch (e) { /* mã của trang thì không có danh sách trang — dùng luôn */ }
      const j = await goiFb(`/${CAI_DAT.FB_PAGE_ID}?fields=name`, maTrang);
      let cmtOk = null;
      try { const ps = await goiFb(`/${CAI_DAT.FB_PAGE_ID}/posts?fields=id&limit=1`, maTrang); if (ps.data && ps.data[0]) { await goiFb(`/${ps.data[0].id}/comments?fields=message&limit=1`, maTrang); cmtOk = true; } } catch (e) { cmtOk = false; }
      luu('fb_token', maTrang); luu('fb_token_luc', Date.now()); luu('fb_token_nhac', 0);
      capNhat('suc_khoe', cmtOk === null ? {} : { cmtOk, cmtLuc: Date.now(), cmtLoi: cmtOk ? '' : 'mã khoá chưa có quyền đọc comment' });
            capNhat('suc_khoe', { apiOk: true, apiLuc: Date.now(), apiLoi: '' });
      ghi('Đã cài mã khoá Facebook cho trang ' + j.name);
      alert(`Đã kết nối: "${j.name}".\nĐọc bài: được · Đọc comment: ${cmtOk === false ? 'CHƯA được (mã khoá thiếu quyền đọc comment)' : 'được'}.`);
      yeuCau('dotrang');
    } catch (e) { alert('Mã khoá chưa dùng được: ' + e.message); }
    veBang();
  }
  async function kiemMaKhoa() {
    if (!coApi()) { alert('Chưa cài mã khoá Facebook.'); return; }
    const kq = []; let ok = true;
    try { const j = await goiFb(`/${CAI_DAT.FB_PAGE_ID}?fields=name`); kq.push(`Đọc trang "${j.name}": được`); } catch (e) { ok = false; kq.push('Đọc trang: KHÔNG được — ' + e.message); }
    try { const ps = await goiFb(`/${CAI_DAT.FB_PAGE_ID}/posts?fields=id&limit=1`); if (ps.data && ps.data[0]) await cmtCuaBaiApi(ps.data[0].id); kq.push('Đọc comment: được'); capNhat('suc_khoe', { cmtOk: true, cmtLuc: Date.now(), cmtLoi: '' }); } catch (e) { ok = false; kq.push('Đọc comment: KHÔNG được — ' + e.message); }
    const luc = lay('fb_token_luc', 0);
    if (luc) { const n = Math.floor((Date.now() - luc) / 864e5); kq.push(`Mã khoá đã dùng ${n} ngày (cài ${ngayStr(new Date(luc))}) · nên lấy mã mới trước ${ngayStr(new Date(luc + CAI_DAT.MA_KHOA_HAN_NGAY * 864e5))}`); }
    capNhat('suc_khoe', { apiOk: ok, apiLuc: Date.now(), apiLoi: ok ? '' : 'xem nút Kiểm tra mã khoá' });
    ghi('Kiểm tra mã khoá: ' + kq.join(' · '));
    alert((ok ? '✅ Mã khoá dùng tốt' : '⚠ Mã khoá có vấn đề') + '\n\n' + kq.join('\n'));
    veBang();
  }
  async function nhacGiaHanMa() {
    if (!coApi()) return;
    let luc = lay('fb_token_luc', 0);
    if (!luc) { luc = Date.now(); luu('fb_token_luc', luc); } // mã cài từ bản cũ: tính từ lúc lên bản này
    const n = Math.floor((Date.now() - luc) / 864e5);
    const moc = [CAI_DAT.MA_KHOA_HAN_NGAY - 10, CAI_DAT.MA_KHOA_HAN_NGAY - 3].filter((x) => n >= x);
    if (!moc.length || !trongGioNhan()) return;
    const daNhac = lay('fb_token_nhac', 0);
    if (daNhac >= moc[moc.length - 1]) return;
    luu('fb_token_nhac', moc[moc.length - 1]);
    await baoLoi(`Mã khoá Facebook đã dùng ${n} ngày, sắp hết hạn (~${ngayStr(new Date(luc + CAI_DAT.MA_KHOA_HAN_NGAY * 864e5))}) — cần đổi mã mới ("Đổi mã khoá" ở tab Hệ thống trên popup)`, 'giahan');
  }
  async function baiTrenTrangApi(tuMs) {
    let url = `/${CAI_DAT.FB_PAGE_ID}/posts?fields=id,message,created_time,permalink_url&limit=50&since=${Math.floor(tuMs / 1000)}`;
    const out = [];
    try {
      for (let i = 0; i < 4 && url; i++) {
        const j = await goiFb(url);
        for (const p of j.data || []) {
          out.push({ id: p.id, text: p.message || '', luc: Date.parse(String(p.created_time).replace(/([+-]\d\d)(\d\d)$/, '$1:$2')), link: p.permalink_url || '' });
        }
        const next = j.paging && j.paging.next;
        url = next ? next.replace(/^https:\/\/graph\.facebook\.com(\/v[\d.]+)?/, '') : null;
      }
      capNhat('suc_khoe', { apiOk: true, apiLuc: Date.now(), apiLoi: '' });
      return out;
    } catch (e) {
      capNhat('suc_khoe', { apiOk: false, apiLuc: Date.now(), apiLoi: e.message });
      throw e;
    }
  }
  async function cmtChiTietApi(id) {
    const j = await goiFb(`/${id}/comments?fields=message,from{id},attachment{type}&limit=100&filter=stream`);
    let ds = j.data || [];
    // (4.5) chỉ tính comment của CHÍNH trang — ảnh/chữ khách gửi không được tính là "đủ"
    if (ds.some((c) => c.from && c.from.id)) ds = ds.filter((c) => c.from && String(c.from.id) === String(CAI_DAT.FB_PAGE_ID));
    return { msgs: ds.map((c) => c.message || ''), anh: ds.filter((c) => c.attachment && /photo|image/.test(c.attachment.type || '')).length };
  }
  async function cmtCuaBaiApi(id) {
    const j = await goiFb(`/${id}/comments?fields=message&limit=100&filter=stream`);
    return (j.data || []).map((c) => c.message || '');
  }

  // =====================================================================
  //  Facebook: đăng bài chữ/ảnh, comment, sửa nền đỏ (dùng lại từ bản 5.9)
  // =====================================================================
  async function dangLenFacebook(bai, { soanThu = false } = {}) {
    kiemDung();
    if (!soanThu) window.__smhMoHop = Date.now(); // (4.5) hộp soạn từ đây trở đi là do script mở
    window.scrollTo(0, 0); await sleep(800);
    let dlg = await moHopSoanNhieuDuong((m) => ghi('B1. ' + m));
    ghi('B1. Đã mở hộp soạn bài: ' + chuan(dlg.innerText.split('\n').slice(0, 3).join(' | ')));
    try { await choTenHop(() => hopSoanBai() || dlg); }
    catch (eT) {
      if (!(eT instanceof LoiMem)) throw eT;
      ghi('B1. Hộp soạn không đứng tên ' + CAI_DAT.TEN_TRANG + ' → đóng hộp, chuyển tư cách rồi mở lại');
      await dongHopSoan();
      if (!(await damBaoTuCach())) throw new LoiDung('đang chuyển sang tư cách ' + CAI_DAT.TEN_TRANG + ' — trang tải lại xong sẽ đăng tiếp');
      dlg = await moHopSoanNhieuDuong((m) => ghi('B1. ' + m));
      await choTenHop(() => hopSoanBai() || dlg);
      ghi('B1. Mở lại hộp soạn: đã đứng tên ' + CAI_DAT.TEN_TRANG);
    }
    const ed = () => Array.from(hopSoanBai().querySelectorAll('div[contenteditable="true"][data-lexical-editor]')).pop();

    kiemDung();
    await xoaAnhCu(); // bản nháp cũ còn ảnh thì gỡ
    // nội dung (thay toàn bộ, kể cả bản nháp cũ)
    if (!(await datChu(ed(), bai.bai))) {
      ghi('B2. Điền nội dung lần 1 chưa khớp → điền lại');
      await sleep(800);
      if (!(await datChu(ed(), bai.bai))) throw new LoiMem('Điền nội dung vào ô đăng bài không khớp (đang có: "' + chuan(ed().innerText).slice(0, 60) + '")');
    }
    ghi('B2. Đã điền nội dung (' + bai.bai.length + ' ký tự)');

    kiemDung();
    if (bai.files && bai.files.length) {
      // Bài 2 / Bài 3: gắn ảnh, không dùng nền đỏ
      await ganAnhVaoHop(bai.files);
      ghi('B3. Đã gắn ' + bai.files.length + ' ảnh');
    } else {
    // nền đỏ
    dlg = hopSoanBai();
    const moNen = dlg.querySelector('[aria-label="Hiển thị các tùy chọn phông nền"]');
    if (moNen) { moNen.click(); await sleep(1000); }
    const nen = await cho(() => hopSoanBai().querySelector(`[aria-label^="${CAI_DAT.NEN}"]`), 8000);
    if (!nen && !thuNhe()) throw new LoiMem('Không thấy nền "' + CAI_DAT.NEN + '" (bài có thể dài quá ' + CAI_DAT.GIOI_HAN_KY_TU_NEN + ' ký tự)');
    if (!nen) boQuaBuoc('nền đỏ', { message: 'không thấy nền ' + CAI_DAT.NEN });
    else { nen.click(); await sleep(900);
    ghi('B3. Đã chọn nền ' + CAI_DAT.NEN); }
    }

    kiemDung();
    try {
    // vị trí
    const coViTri = () => chuan(hopSoanBai().innerText.split('\n').slice(0, 3).join(' ')).includes('đang ở ' + CAI_DAT.VI_TRI);
    if (!coViTri()) {
      const nutViTri = hopSoanBai().querySelector('[aria-label="Vị trí"], [aria-label="Check in"]');
      if (!nutViTri) throw new LoiMem('Không thấy nút Vị trí');
      nutViTri.click();
      const o = await cho(() => Array.from(document.querySelectorAll('div[role="dialog"] input')).find((i) =>
        (i.getAttribute('aria-label') === 'Bạn đang ở đâu?' || i.placeholder === 'Bạn đang ở đâu?') && i.getBoundingClientRect().width > 0), 20000);
      if (!o) throw new LoiMem('Không mở được ô tìm vị trí');
      o.focus(); document.execCommand('insertText', false, CAI_DAT.VI_TRI);
      const lc = await cho(() => Array.from(document.querySelectorAll('div[role="dialog"] [role="option"], div[role="dialog"] li'))
        .find((x) => chuan(x.innerText.split('\n')[0]) === CAI_DAT.VI_TRI && x.innerText.includes(CAI_DAT.VI_TRI_DIA_CHI)), 20000);
      if (!lc) throw new LoiMem('Không tìm thấy vị trí ' + CAI_DAT.VI_TRI);
      const oChon = lc.querySelector('[role="button"]') || lc.querySelector('div[tabindex]') || lc;
      oChon.click();
      if (!(await cho(() => hopSoanBai() && coViTri(), 10000))) {
        ghi('B4. Chọn vị trí lần 1 chưa ăn → bấm lại');
        if (oChon.isConnected) { try { ganBam(oChon); } catch (e) { oChon.click(); } }
        if (!(await cho(() => hopSoanBai() && coViTri(), 10000))) throw new LoiMem('Chọn vị trí không thành công');
      }
    }
    ghi('B4. Vị trí: đang ở ' + CAI_DAT.VI_TRI);
    } catch (eVT) {
      if (!thuNhe() || eVT instanceof LoiDung) throw eVT;
      boQuaBuoc('vị trí', eVT);
      for (let k = 0; k < 2 && !hopSoanBai(); k++) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true })); await sleep(1200); }
      if (!hopSoanBai()) throw eVT;
    }
    if (chuan(ed().innerText) !== chuan(bai.bai)) throw new LoiMem('Nội dung bị thay đổi trong lúc soạn');

    kiemDung();
    // Tiếp
    const tiep = hopSoanBai().querySelector('[aria-label="Tiếp"]');
    if (!tiep || tiep.getAttribute('aria-disabled') === 'true') throw new LoiMem('Nút "Tiếp" đang bị khoá');
    tiep.click();
    let caiDat = await cho(() => hopThoai((d) => laCaiDat(d)), 12000);
    if (!caiDat && hopSoanBai()) { ghi('B5. Bấm Tiếp lần 1 chưa ăn → bấm lại'); const t2 = hopSoanBai().querySelector('[aria-label="Tiếp"]') || tiep; try { ganBam(t2); } catch (e) { t2.click(); } caiDat = await cho(() => hopThoai((d) => laCaiDat(d)), 12000); }
    if (!caiDat) throw new LoiMem('Không mở được bước Cài đặt bài viết');
    ghi('B5. Đã bấm Tiếp → Cài đặt bài viết');

    kiemDung();
    let soNhom = 0, caiDat2 = null;
    try {
    // chia sẻ lên nhóm
    const chuNhom = await cho(() => { const h = hopThoai((d) => laCaiDat(d));
      return h && Array.from(h.querySelectorAll('span')).find((s) => chuan(s.textContent) === 'Chia sẻ lên nhóm'); }, 15000);
    if (!chuNhom) throw new LoiMem('Không thấy mục "Chia sẻ lên nhóm"');
    const hangNhom = chuNhom.closest('[role="button"]') || chuNhom.closest('[tabindex]');
    const timHopNhom = () => hopThoai((d) => laNhom(d)) || (() => {
      const c = Array.from(document.querySelectorAll('div[role="dialog"] input[type="checkbox"]')).find((x) => x.getAttribute('role') !== 'switch' && x.parentElement && x.parentElement.getClientRects().length);
      return c ? c.closest('div[role="dialog"]') : null; })();
    ganBam(hangNhom);
    let hopNhom = await cho(timHopNhom, 8000);
    if (!hopNhom) { ghi('B6. Bấm lần 1 chưa mở được danh sách nhóm → bấm lại'); hangNhom.click(); hopNhom = await cho(timHopNhom, 12000); }
    if (!hopNhom) { // (4.5) lần 3: Facebook vẽ lại màn Cài đặt → tìm lại mục "Chia sẻ lên nhóm" rồi bấm
      const h3 = hopThoai((d) => laCaiDat(d));
      const c3 = h3 && Array.from(h3.querySelectorAll('span')).find((s) => chuan(s.textContent) === 'Chia sẻ lên nhóm');
      const n3 = c3 && (c3.closest('[role="button"]') || c3.closest('[tabindex]') || c3);
      if (n3) { ghi('B6. Bấm lần 3 (tìm lại mục Chia sẻ lên nhóm)'); try { ganBam(n3); } catch (e) { n3.click(); } hopNhom = await cho(timHopNhom, 12000); }
    }
    if (!hopNhom) throw new LoiMem('Không mở được danh sách nhóm');
    await cho(() => hopNhom.querySelector('input[type="checkbox"]') || hopNhom.innerText.includes('Không tìm thấy nhóm'), 15000);
    await sleep(800);
    const oNhom = () => Array.from(hopNhom.querySelectorAll('input[type="checkbox"]'))
      .filter((c) => !['Tắt', 'Bật'].includes(c.getAttribute('aria-label') || '') && c.getAttribute('role') !== 'switch' && !c.disabled);
    if (!oNhom().length) throw new LoiMem('Danh sách nhóm trống (trang không còn trong nhóm nào?)');
    const tenNhom = (c) => chuan(((c.closest('[role="listitem"]') || c.parentElement.parentElement.parentElement).innerText || '').split('\n')[0]);
    ghi('B6. Danh sách có ' + oNhom().length + ' nhóm, đang tick sẵn ' + oNhom().filter((x) => x.checked).length);
    for (const c of oNhom().filter((x) => x.checked).reverse()) {
      if (oNhom().filter((x) => x.checked).length <= CAI_DAT.SO_NHOM_TOI_DA) break;
      kiemDung(); c.click(); await sleep(400);
    }
    for (const c of oNhom()) {
      if (oNhom().filter((x) => x.checked).length >= CAI_DAT.SO_NHOM_TOI_DA) break;
      if (!c.checked) { kiemDung(); c.click(); await sleep(400); }
    }
    // (4.5) tick chưa đủ (Facebook vẽ lại danh sách / click bị bỏ qua) → tick lại bằng chuỗi sự kiện chuột
    const canNhom = Math.min(CAI_DAT.SO_NHOM_TOI_DA, oNhom().length);
    if (oNhom().filter((x) => x.checked).length < canNhom) {
      ghi('B7. Tick nhóm chưa đủ → tick lại');
      for (const c of oNhom()) {
        if (oNhom().filter((x) => x.checked).length >= canNhom) break;
        if (!c.checked) { kiemDung(); const o = c.closest('[role="listitem"]') || c; try { ganBam(o); } catch (e) { c.click(); } await sleep(500); if (!c.checked) { c.click(); await sleep(400); } }
      }
    }
    soNhom = oNhom().filter((x) => x.checked).length;
    ghi('B7. Đã chọn ' + soNhom + ' nhóm: ' + oNhom().filter((x) => x.checked).map(tenNhom).join(' ; '));
    if (soNhom > CAI_DAT.SO_NHOM_TOI_DA) throw new LoiMem('Không bỏ bớt được nhóm (đang chọn ' + soNhom + ')');
    const xong = nutTheoChu(hopNhom, 'Xong');
    if (!xong) throw new LoiMem('Không thấy nút "Xong" ở danh sách nhóm');
    xong.click();
    caiDat2 = await cho(() => hopThoai((d) => laCaiDat(d) && (!soNhom || d.innerText.includes(`Đã chọn ${soNhom} nhóm`))), 8000)
      || hopThoai((d) => laCaiDat(d));
    if (!caiDat2 && xong.isConnected) { ghi('B8. Bấm Xong lần 1 chưa ăn → bấm lại'); try { ganBam(xong); } catch (e) { xong.click(); } caiDat2 = await cho(() => hopThoai((d) => laCaiDat(d)), 8000); }
    if (!caiDat2) throw new LoiMem('Không quay lại được bước Cài đặt bài viết');
    if (soNhom && !caiDat2.innerText.includes(`Đã chọn ${soNhom} nhóm`)) throw new LoiMem('Chọn nhóm không thành công (màn Cài đặt ghi: ' + chuan(caiDat2.innerText).slice(0, 120) + ')');
    ghi('B8. Màn Cài đặt xác nhận ' + soNhom + ' nhóm');
    } catch (eN) {
      if (!thuNhe() || eN instanceof LoiDung) throw eN;
      boQuaBuoc('chọn nhóm', eN);
      const hn = hopThoai((d) => laNhom(d)); if (hn) { const x = nutTheoChu(hn, 'Xong'); if (x) x.click(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true })); await sleep(1500); }
      caiDat2 = await cho(() => hopThoai((d) => laCaiDat(d)), 10000); soNhom = 0;
      if (!caiDat2) throw eN;
    }

    kiemDung();
    // Đăng
    const dang = await cho(() => Array.from(caiDat2.querySelectorAll('[role="button"]')).find((b) => (chuan(b.innerText) === 'Đăng' || b.getAttribute('aria-label') === 'Đăng') && b.getAttribute('aria-disabled') !== 'true'), 6000);
    if (!dang) throw new LoiMem('Không thấy nút "Đăng"');
    if (soanThu) {
      dang.style.outline = '3px solid #f7b928'; dang.style.outlineOffset = '2px';
      ghi('Soạn thử xong — đã dừng trước nút "Đăng". Cao tự bấm Đăng hoặc đóng hộp để huỷ');
      return -1;
    }
    kiemDung();
    if (!soanThu && coApi()) {
      // (4.5) dò trùng lần cuối: API lỗi thì KHÔNG bỏ cả bài — dò bằng trang (bài đã lên thường thấy ngay ở đầu trang)
      let trung = null;
      try { const tuLuc = new Date(new Date().setHours(0, 0, 0, 0)).getTime() - 6 * 3600e3; trung = baiGiongNhat((await baiTrenTrangApi(tuLuc)).filter((p) => p.luc >= tuLuc), bai.bai); }
      catch (e) { ghi('Dò trùng lần cuối qua API lỗi (' + e.message + ') → dò trên trang'); const x = timBai(bai.bai); if (x) trung = { link: linkBai(x.khung), luc: Date.now(), id: '' }; }
      kiemDung();
      if (trung) throw new LoiTrung('Phát hiện bài đã có ngay trước khi Đăng — không bấm Đăng', trung);
    }
    kiemDung();
    const lucBam = Date.now();
    luu('dang_do', Object.assign({ khoa: bai.khoa, ngay: bai.ngay, hang: bai.hang, bai: bai.bai, cmt: bai.cmt, luc: lucBam, buoc: 'kiem_bai', soNhom }, bai.ddThem || {}));
    try { dang.click(); } catch (e) { throw new LoiCung('Không rõ kết quả thao tác Đăng — script sẽ tải lại trang để kiểm tra'); }
    ghi(`Đã bấm Đăng (hàng ${bai.hang}, ${soNhom} nhóm)`);
    // (4.8) Facebook hay chen hộp gợi ý "Chat trực tiếp với khách hàng" (Lúc khác / Thêm nút) sau khi bấm Đăng bài có ảnh — hộp này chặn bài, phải bấm "Lúc khác"
    let lucHopPhu = 0, soLanHopPhu = 0;
    // các nút "để sau" an toàn (không đồng ý/không huỷ bài) — chỉ bấm khi trùng đúng chữ
    const CHU_BO_QUA = ['Lúc khác', 'Để sau', 'Không phải bây giờ', 'Không phải lúc này', 'Bỏ qua', 'Không, cảm ơn', 'Không cảm ơn', 'Đăng bài viết gốc', 'Đăng bài gốc'];
    const laBoSoanB9 = (d) => laCaiDat(d) || d.innerText.includes('Tạo bài viết');
    const nhanNutB9 = (x) => chuan(x.innerText || x.getAttribute('aria-label') || '');
    const nutCuaHop = (goc) => Array.from(goc.querySelectorAll('[role="button"],button,[role="link"],a[tabindex]')).filter(dangHien);
    // (5.1) nhận diện RỘNG: mọi hộp/khung nổi ngoài hộp soạn bài có nút "Lúc khác"-kiểu, hoặc bất kỳ nút "Lúc khác / Để sau / Không phải bây giờ" nằm đâu đó trên trang
    const nutHopPhu = () => {
      const lop = Array.from(document.querySelectorAll('div[role="dialog"],[role="alertdialog"],[aria-modal="true"]')).filter((d) => dangHien(d) && !laBoSoanB9(d));
      for (const d of lop) for (const chu of CHU_BO_QUA) { const n = nutCuaHop(d).find((x) => nhanNutB9(x) === chu); if (n) return { n, chu, hop: chuan(d.innerText).slice(0, 80) }; }
      for (const chu of CHU_BO_QUA.slice(0, 4)) {
        const n = Array.from(document.querySelectorAll('[role="button"],button')).find((x) => dangHien(x) && chuan(x.innerText) === chu);
        if (n) { const dl = n.closest('div[role="dialog"],[aria-modal="true"]') || n.parentElement || n; return { n, chu, hop: chuan(dl.innerText).slice(0, 80) }; }
      }
      // 3) chữ nằm trong phần tử không phải nút chuẩn (span/div/a…): tìm phần tử lá có đúng chữ rồi bấm phần tử bấm được gần nhất
      for (const chu of CHU_BO_QUA.slice(0, 4)) {
        const e = Array.from(document.querySelectorAll('span,div,a,li')).find((x) => x.children.length === 0 && chuan(x.textContent) === chu && dangHien(x));
        if (e) { const n = e.closest('[role="button"],button,a,[tabindex]') || e; const dl = n.closest('div[role="dialog"],[aria-modal="true"]') || n.parentElement || n; return { n, chu, hop: chuan(dl.innerText).slice(0, 80) }; }
      }
      return null;
    };
    const dongHopPhu = () => {
      const x = nutHopPhu(); if (!x) return false;
      if (Date.now() - lucHopPhu < 2500) return true;
      if (soLanHopPhu >= 8) return true;
      lucHopPhu = Date.now(); soLanHopPhu++;
      ghi(`B9. Facebook hiện hộp chặn bài («${x.hop}») → bấm "${x.chu}" để bài được đăng`);
      try { ganBam(x.n); } catch (e) { x.n.click(); }
      return true;
    };
    // ghi lại những gì đang hiện trên màn hình (để lần sau biết đúng hộp nào chặn nút Đăng)
    const chupHop = (nhan) => {
      try {
        const ds = Array.from(document.querySelectorAll('div[role="dialog"],[role="alertdialog"],[aria-modal="true"],[role="alert"]')).filter(dangHien);
        const mo = ds.slice(0, 5).map((d) => '«' + chuan(d.innerText).slice(0, 110) + '» nút: ' + (nutCuaHop(d).map(nhanNutB9).filter((t) => t && t.length < 28).slice(0, 8).join(' | ') || '-'));
        const quay = document.querySelectorAll('[role="progressbar"]').length;
        ghi(`B9. (${nhan}) đang hiện ${ds.length} hộp/khung${quay ? ', ' + quay + ' vòng xoay' : ''}: ` + (mo.join(' ;; ') || 'không có'));
      } catch (e) { /* */ }
    };
    const daDong0 = () => !hopThoai((d) => laCaiDat(d) || d.innerText.includes('Tạo bài viết'));
    let daChup15 = false;
    const daDong = () => { dongHopPhu(); const x = daDong0(); if (!x && !daChup15 && Date.now() - lucBam > 15000) { daChup15 = true; chupHop('sau 15 giây chưa đóng'); } return x; };
    let dong = await cho(daDong, 25000, 500);
    if (!dong) {
      // (4.5) phương án 2: hỏi Facebook (API) xem bài đã lên chưa; chưa lên mà nút Đăng vẫn bấm được (không có vòng xoay) → bấm lại bằng chuỗi sự kiện chuột
      let daLen = null, apiDoc = false;
      const hoiApi = async () => { apiDoc = false; if (!coApi()) return; try { daLen = baiGiongNhat(await baiTrenTrangApi(lucBam - 120000), bai.bai); apiDoc = true; } catch (e) { ghi('B9. Hỏi Facebook (API) lỗi: ' + e.message); } };
      await hoiApi();
      const nutLai = () => { if (nutHopPhu()) return null; const h = hopThoai((d) => laCaiDat(d)); if (!h || h.querySelector('[role="progressbar"]')) return null; return Array.from(h.querySelectorAll('[role="button"]')).find((b) => (chuan(b.innerText) === 'Đăng' || b.getAttribute('aria-label') === 'Đăng') && b.getAttribute('aria-disabled') !== 'true') || null; };
      if (!daLen && apiDoc && nutLai()) { await sleep(5000); if (!daDong()) await hoiApi(); } // hỏi lại lần 2 cho chắc (Facebook có thể chậm vài giây)
      if (daLen) { ghi('B9. Hộp đăng chưa đóng nhưng Facebook (API) đã có bài → coi như đã đăng'); dong = true; await dongHopSoan(); }
      else {
        const n2 = nutLai();
        if (n2 && !daDong() && apiDoc) { const dd2 = lay('dang_do', null); if (dd2) { dd2.lanBam = 2; luu('dang_do', dd2); } ghi('B9. Bấm Đăng lần 1 chưa ăn (nút vẫn còn, Facebook API xác nhận bài chưa lên) → bấm lại'); try { ganBam(n2); } catch (e) { n2.click(); } }
        else if (n2 && !daDong()) ghi('B9. Hộp đăng chưa đóng, chưa hỏi được Facebook (API) → KHÔNG bấm lại (tránh đăng trùng), chờ thêm rồi tải lại trang kiểm tra');
        dong = await cho(daDong, 35000, 1000);
        if (!dong && !daLen) {
          chupHop('sau khi bấm lại');
          await hoiApi();
          if (daLen) { ghi('B9. Hộp chưa đóng nhưng Facebook (API) đã có bài → coi như đã đăng'); dong = true; await dongHopSoan(); }
          else {
            const n3 = nutLai();
            if (n3 && apiDoc && !daDong()) { ghi('B9. Vẫn chưa đăng → thử bấm bằng bàn phím (Enter) lên nút Đăng'); try { n3.focus(); for (const t of ['keydown', 'keypress', 'keyup']) n3.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true })); } catch (e) { /* */ } }
          }
        }
        if (!dong) dong = await cho(daDong, 55000, 1000);
      }
    }
    if (!dong) chupHop('hết giờ chờ');
    ghi(dong ? 'B9. Hộp đăng bài đã đóng' : 'B9. Hộp đăng bài KHÔNG đóng sau ~2 phút');
    if (!dong) throw new LoiCung(`Đã bấm Đăng hàng ${bai.hang} nhưng hộp đăng bài không đóng — script tải lại trang để kiểm tra bài đã lên chưa`);
    return soNhom;
  }
  const nutCuaBai = (khung, nhan) => Array.from(khung.querySelectorAll('[role="button"][aria-label]')).find((b) => {
    const l = b.getAttribute('aria-label'); if (!(typeof nhan === 'string' ? l === nhan : nhan.test(l))) return false;
    const a = b.closest('[role="article"]'); return (!a || !khung.contains(a) || a === khung) && dangHien(b);
  });
  const nutCuaCmt = (art, nhan) => Array.from(art.querySelectorAll('[role="button"],button')).find((b) => {
    const l = chuan(b.getAttribute('aria-label') || b.innerText);
    const phuHop = typeof nhan === 'string' ? (l === nhan || (nhan === 'Thích' && /^Thích bình luận/.test(l)) || (nhan === 'Bày tỏ cảm xúc' && /^Bày tỏ cảm xúc/.test(l))) : nhan.test(l);
    return phuHop && b.closest('[role="article"]') === art && dangHien(b) && !b.querySelector('[role="button"],button');
  });
  const nhanArt = (a) => (a.getAttribute('aria-label') || '').replace(/ (vào|lúc) .*$/, '');
  const laCmtArt = (a) => { const l = a.getAttribute('aria-label') || ''; if (!l && !chuan(a.innerText) && !a.querySelector('[role="button"],button')) return false; if (l) return /bình luận|phản hồi|trả lời/i.test(l); return !a.querySelector('[aria-label^="Hành động đối với bài viết này"]'); };
  function taoTimArt(art0, tapHop) {
    const khoaA = chuan(art0.innerText).slice(0, 25), nhan0 = nhanArt(art0);
    const tt = Math.max(0, tapHop().filter((a) => nhanArt(a) === nhan0).indexOf(art0));
    return () => {
      if (art0.isConnected) return art0;
      const ds = tapHop();
      const c = nhan0 ? ds.filter((a) => nhanArt(a) === nhan0) : [];
      if (c.length === 1) return c[0];
      if (c.length > 1) return c.find((a) => chuan(a.innerText).startsWith(khoaA)) || c[Math.min(tt, c.length - 1)];
      return ds.find((a) => chuan(a.innerText).startsWith(khoaA)) || art0;
    };
  }
  async function thichMotCmt(tim) {
    const nc = (n) => nutCuaCmt(tim(), n);
    try { tim().scrollIntoView({ block: 'center' }); } catch (e) { /* */ }
    await sleep(400);
    if (nc(DA_CO_CAM_XUC)) return { tt: 'co_san' };
    const co = await cho(() => nc('Thích') || nc('Bày tỏ cảm xúc'), 2500, 400);
    if (!co) {
      const a = tim();
      if (!chuan(a.innerText) && !a.querySelector('[role="button"],button')) return { tt: 'rong' }; // (5.6.1) khung trống (Facebook chưa vẽ nội dung) → bỏ qua, không phải lỗi
      const ds = Array.from(a.querySelectorAll('[role="button"],button')).map((b) => (dangHien(b) ? '' : '(ẩn) ') + chuan(b.getAttribute('aria-label') || b.innerText)).filter((x) => x.trim()).slice(0, 10).join(' | ');
      return { tt: 'khong_nut', chiTiet: `${chuan(a.getAttribute('aria-label') || chuan(a.innerText).slice(0, 30)).slice(0, 50)} → ${ds || 'không thấy nút nào'}` };
    }
    if (cheDoThu) return { tt: 'thu' };
    let loi = '';
    for (let lan = 0; lan < 2; lan++) {
      try { kiemDung(); const r0 = await thaCamXuc(nc, 'Comment', tim()); return { tt: r0 === 'co_san' ? 'co_san' : 'ok' }; }
      catch (e) { if (e instanceof LoiDung) throw e; loi = e.message; await sleep(1500); if (nc(DA_CO_CAM_XUC)) return { tt: 'ok' }; }
    }
    return { tt: 'loi', loi };
  }
  const DA_CO_CAM_XUC = /^(Gỡ |Thay đổi cảm xúc)/;
  async function thaCamXuc(timNut, ten, goc, chuaMs = 8000) {
    if (!CAI_DAT.THA_CAM_XUC) return;
    if (goc && goc.scrollIntoView) { try { goc.scrollIntoView({ block: 'center' }); } catch (e) { /* */ } await sleep(600); }
    // thanh nút Thích/Bình luận hiện chậm → chờ tới 8 giây
    const thay = await cho(() => timNut(DA_CO_CAM_XUC) || timNut('Thích') || timNut('Bày tỏ cảm xúc'), chuaMs, 400);
    if (!thay) {
      const ds = goc ? Array.from(goc.querySelectorAll('[role="button"],button')).filter(dangHien).map((b) => chuan(b.getAttribute('aria-label') || b.innerText)).filter(Boolean).slice(0, 12).join(' | ') : '';
      throw new Error('không tìm thấy nút Thích' + (ds ? ' (nút đang thấy: ' + ds + ')' : ''));
    }
    if (timNut(DA_CO_CAM_XUC)) { ghi(`${ten}: đã có cảm xúc sẵn, không bấm thêm`); return 'co_san'; }
    kiemDung();
    let chon = Math.random() < 0.5 ? 'Thích' : 'Yêu thích';
    if (chon === 'Yêu thích' && !timNut('Bày tỏ cảm xúc')) chon = 'Thích'; // không có nút mở bảng cảm xúc → Thích
    if (chon === 'Thích') {
      const nut = timNut('Thích'); if (!nut) throw new Error('không thấy nút "Thích"');
      nut.click();
    } else {
      const nut = timNut('Bày tỏ cảm xúc');
      nut.click();
      const yt = await cho(() => Array.from(document.querySelectorAll('[role="dialog"] [role="button"][aria-label="Yêu thích"]')).find(dangHien), 5000);
      if (!yt) { // (4.5) bảng cảm xúc không mở → đóng lại rồi bấm Thích
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true })); await sleep(500);
        chon = 'Thích'; const nt = timNut('Thích'); if (!nt) throw new Error('không mở được bảng cảm xúc và không thấy nút "Thích"');
        kiemDung(); nt.click();
      } else { kiemDung(); yt.click(); }
    }
    let ok = await cho(() => timNut(DA_CO_CAM_XUC), 6000);
    if (!ok) { // phương án 2: Facebook chậm → chờ thêm; nút vẫn còn "Thích" (chưa nhận) thì bấm lại đúng 1 lần
      ok = await cho(() => timNut(DA_CO_CAM_XUC), 3000);
      if (!ok) { const lai = timNut('Thích'); if (lai) { kiemDung(); ghi(`${ten}: bấm lần 1 chưa được Facebook nhận → bấm lại`); try { ganBam(lai); } catch (e) { lai.click(); } ok = await cho(() => timNut(DA_CO_CAM_XUC), 6000); } }
    }
    if (!ok) throw new Error('đã bấm cảm xúc nhưng chưa xác nhận được');
    ghi(ok ? `${ten}: đã thả "${chon}"` : `${ten}: đã bấm "${chon}" nhưng chưa thấy Facebook ghi nhận`);
    return true;
  }
  async function thaCamXucBai(text) {
    if (!CAI_DAT.THA_CAM_XUC) return { tt: 'tat' };
    try {
      kiemDung(); const b = await cho(() => timBai(text), 10000);
      if (!b) throw new Error('không thấy bài trên trang');
      await thaCamXuc((n) => { const x = timBai(text); return nutCuaBai(x ? x.khung : b.khung, n); }, 'Cảm xúc cho bài', b.khung);
      return { tt: 'ok' };
    } catch (e) { ghi('Chưa thả được cảm xúc cho bài: ' + e.message); return { tt: 'chua', loi: e.message }; }
  }
  async function thaCamXucCmt(text, cmt) {
    if (!CAI_DAT.THA_CAM_XUC || CAI_DAT.THA_CAM_XUC_CMT === false) return { tt: 'tat' };
    try {
      kiemDung();
      const dong1 = chuan(String(cmt).split('\n')[0]).slice(0, 40);
      const k1 = khoaSo(dong1).slice(0, 25);
      // Facebook vẽ lại khung comment sau khi gửi (nhất là comment có link xem trước) → luôn tìm lại khung mới nhất
      const cacArt = () => {
        const b = timBai(text); const goc = b ? b.khung : document.body;
        return Array.from(goc.querySelectorAll('[role="article"]')).filter((a) => (!b || !a.contains(b.ed)) && (chuan(a.innerText).includes(dong1) || (k1.length >= 8 && khoaSo(a.innerText).includes(k1))));
      };
      const coNut = (a) => nutCuaCmt(a, DA_CO_CAM_XUC) || nutCuaCmt(a, 'Thích') || nutCuaCmt(a, 'Bày tỏ cảm xúc');
      const timArt = () => { const ds = cacArt(); const L = ds.filter(coNut).length ? ds.filter(coNut) : ds; return L.find((a) => !L.some((o) => o !== a && a.contains(o))) || null; };
      const art = await cho(timArt, 12000, 500);
      if (!art) throw new Error('không thấy comment vừa đăng');
      // (4.5) comment vừa gửi có thể đang "Đang đăng…" (chưa có nút Thích) → chờ tới 20 giây
      await cho(() => { const a = timArt(); return a && coNut(a); }, 20000, 500);
      const r = await thichMotCmt(() => timArt() || art);
      if (r.tt === 'ok' || r.tt === 'co_san') { if (r.tt === 'co_san') ghi('Cảm xúc cho comment: đã có sẵn'); return { tt: 'ok' }; }
      throw new Error(r.loi || r.chiTiet || 'không tìm thấy nút Thích');
    } catch (e) { if (e instanceof LoiDung) return { tt: 'chua', loi: e.message }; ghi('Chưa thả được cảm xúc cho comment: ' + e.message + ''); return { tt: 'chua', loi: e.message }; }
  }
  const oCuaNguoiKhac = (ed) => { const l = chuan(ed.getAttribute('aria-label') || ''); const m = l.match(/dưới tên (.+)$/); return !!(m && chuanTen(m[1]) !== chuanTen(CAI_DAT.TEN_TRANG)); };
  function timBai(text) {
    const khoa = chuan(text).slice(0, 60);
    const khoa2 = khoaSo(text).slice(0, 45); // (4.5) dự phòng: so chữ bỏ emoji / dấu câu / link rút gọn
    if (khoa2) for (const ed of document.querySelectorAll('div[contenteditable="true"][data-lexical-editor][aria-label^="Bình luận"]')) {
      if (oCuaNguoiKhac(ed)) { window.__smhSaiTuCach = Date.now(); continue; }
      let p = ed.parentElement;
      for (let i = 0; i < 30 && p; i++, p = p.parentElement) {
        if (p === document.body || p === document.documentElement || p.querySelector('#smhfb')) break;
        const t = p.innerText;
        if (t && (chuan(t).includes(khoa) || (khoa2.length >= 12 && khoaSo(t).includes(khoa2)))) {
          if (p.querySelectorAll('div[contenteditable="true"][aria-label^="Bình luận"]').length === 1) return { ed, khung: p };
          break;
        }
      }
    }
    // (4.2) trang riêng của reel/video: ô bình luận nằm trong khung bên phải, hay không chứa chữ của bài (chữ bị cắt "… Xem thêm")
    // → trang chỉ có đúng 1 ô bình luận thì lấy ô đó; khung bình luận đang đóng thì bấm nút "Bình luận" để mở
    if (/\/(reel|reels|videos)\//.test(location.pathname) || /^\/watch/.test(location.pathname)) {
      const eds = Array.from(document.querySelectorAll('div[contenteditable="true"][data-lexical-editor][aria-label^="Bình luận"]')).filter((e) => dangHien(e) && !oCuaNguoiKhac(e));
      if (eds.length === 1) return { ed: eds[0], khung: document.body };
      if (!eds.length && Date.now() - (window.__smhMoCmt || 0) > 4000) {
        window.__smhMoCmt = Date.now();
        const b = Array.from(document.querySelectorAll('[aria-label="Bình luận"][role="button"]')).find(dangHien);
        if (b) { try { ganBam(b); } catch (e) { b.click(); } }
      }
    }
    return null;
  }
  function linkBai(khung) {
    const a = Array.from(khung.querySelectorAll('a[href]')).map((x) => x.href)
      .find((h) => /\/posts\/|story_fbid=|\/permalink/.test(h) && !/comment_id=/.test(h));
    if (!a) return '';
    try { const u = new URL(a); const giu = new URLSearchParams();
      ['story_fbid', 'id'].forEach((k) => { if (u.searchParams.get(k)) giu.set(k, u.searchParams.get(k)); });
      return u.origin + u.pathname + (giu.toString() ? '?' + giu : ''); } catch (e) { return ''; }
  }
  function loiTuFacebook(khung) {
    const hop = hopThoai((d) => /Bài viết đã bị gỡ|không thể được bình luận/i.test(d.innerText));
    if (hop) {
      const ok = nutTheoChu(hop, 'OK') || hop.querySelector('[aria-label="Đóng"]');
      const noiDung = chuan(hop.innerText).slice(0, 120);
      if (ok) ok.click();
      return 'Facebook báo: ' + noiDung;
    }
    if (khung && /Không thể đăng bình luận/i.test(khung.innerText)) return 'Facebook báo: Không thể đăng bình luận';
    return null;
  }
  async function xoaO(ed) {
    try { ed.focus(); await sleep(150); const sel = window.getSelection(); const rg = document.createRange(); rg.selectNodeContents(ed); sel.removeAllRanges(); sel.addRange(rg); document.execCommand('delete'); await sleep(300); } catch (e) { /* */ }
  }
  async function dienCmt(ed, cmt) {
    ed.focus(); await sleep(300);
    if (chuan(ed.innerText)) await xoaO(ed); // (4.5) còn chữ nháp cũ → xoá trước
    const dt = new DataTransfer(); dt.setData('text/plain', cmt);
    ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    await sleep(1200);
    return chuan(ed.innerText) === chuan(cmt);
  }
  async function binhLuan(text, cmt, truocGui = () => {}) {
    kiemDung();
    let b = await cho(() => timBai(text), 15000);
    if (!b && window.__smhSaiTuCach && Date.now() - window.__smhSaiTuCach < 20000) { // ô bình luận đang đứng tên người khác → chuyển tư cách trước
      ghi('Ô bình luận đang đứng tên tài khoản khác → chuyển sang tư cách trang'); if (!(await damBaoTuCach())) { const e0 = new LoiChuaGui('đang chuyển tư cách trang — comment sau khi trang tải lại'); e0.doiTuCach = true; throw e0; }
      b = await cho(() => timBai(text), 8000);
    }
    if (!b) throw new LoiChuaGui('không tìm thấy ô bình luận của bài');
    ghi('C1. Đã thấy ô bình luận của bài');
    kiemDung();
    if (!(await dienCmt(b.ed, cmt))) {
      ghi('C2. Điền comment lần 1 chưa khớp → xoá và điền lại');
      const b2 = timBai(text) || b;
      if (!(await dienCmt(b2.ed, cmt))) { await xoaO(b2.ed); throw new LoiChuaGui('nội dung comment điền vào không khớp (đang có: "' + chuan(b2.ed.innerText).slice(0, 60) + '")'); }
      b = b2;
    }
    ghi('C2. Đã điền comment (' + cmt.split('\n').length + ' dòng)');
    const dong1 = chuan(cmt.split('\n')[0]).slice(0, 40);
    const soLanCo = () => { const x = timBai(text); return x ? chuan(x.khung.innerText).split(dong1).length - 1 : -1; };
    const soTruoc = soLanCo();
    const enter = (ed) => ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    const oHienTai = () => { const x = timBai(text); return x ? x.ed : null; };
    const daTrong = () => { const e = oHienTai(); return (e && chuan(e.innerText) === '') || (!b.ed.isConnected && !e) || chuan(b.ed.innerText) === ''; };
    kiemDung(); truocGui(); enter(b.ed);
    let trong = await cho(daTrong, 6000);
    if (!trong) {
      // (4.5) Enter chưa ăn: ô vẫn còn nguyên chữ và chưa có comment mới → chưa gửi gì → bấm nút Gửi (chuỗi sự kiện chuột)
      const e2 = oHienTai() || b.ed;
      const conNguyen = chuan(e2.innerText) === chuan(cmt) && soLanCo() <= soTruoc;
      if (!conNguyen) throw new Error('bấm gửi comment không rõ kết quả');
      const form = e2.closest('form') || e2.parentElement;
      const nutGui = form && Array.from(form.querySelectorAll('[role="button"][aria-label], div[aria-label][tabindex]')).find((x) => /^(Bình luận|Gửi|Đăng)$/.test(chuan(x.getAttribute('aria-label'))) && dangHien(x));
      ghi('C3. Enter chưa gửi được → ' + (nutGui ? 'bấm nút Gửi' : 'nhấn Enter lại'));
      if (nutGui) { try { ganBam(nutGui); } catch (e) { nutGui.click(); } } else { e2.focus(); enter(e2); }
      trong = await cho(daTrong, 6000);
      if (!trong) {
        const e3 = oHienTai() || e2;
        if (chuan(e3.innerText) === chuan(cmt) && soLanCo() <= soTruoc) { await xoaO(e3); const e0 = new LoiChuaGui('bấm gửi comment không được (đã thử Enter và nút Gửi, comment chưa đi)'); e0.sauEnter = true; throw e0; }
        throw new Error('bấm gửi comment không rõ kết quả');
      }
    }
    ghi('C3. Đã gửi comment, chờ Facebook xác nhận');
    const han = Date.now() + 10000;
    while (Date.now() < han) {
      const x = timBai(text);
      const loi = loiTuFacebook(x && x.khung);
      if (loi) throw new LoiTuChoi(loi);
      await sleep(500);
    }
    let x = timBai(text);
    if (!x) { // ô bình luận có thể bị "treo" (biến mất) sau khi gửi → hỏi Facebook xem comment đã lên chưa
      await sleep(2500); x = timBai(text);
      if (!x && coApi()) {
        try {
          const p = baiGiongNhat(await baiTrenTrangApi(Date.now() - 864e5), text);
          if (p) { const cs = await cmtChiTietApi(p.id); if (cs.msgs.some((c) => khopCmt(c, cmt))) { ghi('C4. Ô bình luận biến mất nhưng Facebook (API) xác nhận comment đã lên'); return; } }
        } catch (e) { /* */ }
      }
      if (!x) throw new Error('sau khi gửi comment, ô bình luận biến mất và chưa xác nhận được comment đã lên — không tự gửi lại, lượt kiểm comment sau sẽ xem lại');
    }
    if (chuan(x.khung.innerText).split(dong1).length <= 1) throw new Error('đã gửi nhưng chưa thấy comment hiện lên');
    ghi('C4. Facebook đã nhận comment');
  }
  const demAnhLon = (d) => Array.from(d.querySelectorAll('img')).filter((i) => { const r = i.getBoundingClientRect(); return r.width > 80 && r.height > 80; }).length;
  async function xoaAnhCu(dlg) {
    for (let i = 0; i < 5; i++) {
      const h = hopSoanBai(); if (!h) return;
      const x = h.querySelector('[aria-label="Gỡ file đính kèm trong bài viết"]'); if (!x) return;
      x.click(); await sleep(900);
    }
  }
  async function ganAnhVaoHop(files) {
    await xoaAnhCu();
    const dlg = hopSoanBai(); if (!dlg) throw new LoiMem('Hộp soạn bài đã đóng');
    const truoc = demAnhLon(dlg);
    const inp = Array.from(dlg.querySelectorAll('input[type="file"]')).find((i) => /image/.test(i.accept || '') && i.multiple) || dlg.querySelector('input[type="file"]');
    if (!inp) throw new LoiMem('Không thấy ô chọn ảnh trong hộp soạn bài');
    const dt = new DataTransfer(); files.forEach((f) => dt.items.add(f));
    inp.files = dt.files;
    inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
    let ok = await cho(() => { const h = hopSoanBai(); return h && demAnhLon(h) >= truoc + files.length; }, 45000, 500);
    if (!ok && hopSoanBai()) { // (5.4) lần 1 chưa hiện → gắn lại ảnh lần 2
      ghi('Ảnh: lần 1 chưa hiện đủ → gắn lại ảnh lần 2');
      try { const dt2 = new DataTransfer(); files.forEach((f) => dt2.items.add(f)); inp.files = dt2.files; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) { ghi('Lỗi gắn ảnh lần 2: ' + e.message); }
      ok = await cho(() => { const h = hopSoanBai(); return h && demAnhLon(h) >= truoc + files.length; }, 45000, 500);
    }
    if (!ok) { const h = hopSoanBai(); throw new LoiMem(`Facebook chưa hiện đủ ${files.length} ảnh trong bài soạn (đang thấy ${h ? demAnhLon(h) - truoc : 0})`); }
    await sleep(1500);
  }
  const coHopDang = () => hopThoai((d) => d.innerText.includes('Tạo bài viết') || laCaiDat(d) || laNhom(d));
  async function dongHopSoan() {
    for (let lan = 0; lan < 3 && coHopDang(); lan++) {
      const h = coHopDang();
      const x = h.querySelector('[aria-label="Đóng hộp thoại của công cụ tạo"], [aria-label="Đóng"], [aria-label="Quay lại"]');
      if (x) { if (lan) { try { ganBam(x); } catch (e) { x.click(); } } else x.click(); }
      else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      await sleep(1200);
      const hoi = hopThoai((d) => /Bỏ bài viết|Rời khỏi|bỏ những thay đổi/i.test(d.innerText));
      if (hoi) { const bo = Array.from(hoi.querySelectorAll('[role="button"]')).find((b) => /^(Bỏ|Bỏ bài viết|Rời khỏi|Rời khỏi trang|Bỏ thay đổi)$/i.test(chuan(b.innerText))); if (bo) bo.click(); await sleep(900); }
    }
    return !coHopDang();
  }
  async function binhLuanAnh(text, file) {
    kiemDung();
    const b = await cho(() => timBai(text), 15000);
    if (!b) throw new LoiChuaGui('không tìm thấy ô bình luận của bài');
    const hopO = () => { const x = timBai(text); const f = x && x.ed.closest('form'); return f ? f.parentElement : null; };
    const coAnh = () => { const o = hopO(); return !!(o && o.querySelector('[aria-label="Gỡ ảnh"]')); };
    const goAnh = async () => { for (let i = 0; i < 3 && coAnh(); i++) { const o = hopO(); const g = o && o.querySelector('[aria-label="Gỡ ảnh"]'); if (g) { try { ganBam(g); } catch (e) { g.click(); } } await sleep(900); } return !coAnh(); };
    if (coAnh()) { ghi('C2. Ô bình luận còn ảnh cũ chưa gửi → gỡ ra trước'); if (!(await goAnh())) throw new LoiChuaGui('ô bình luận đang còn ảnh cũ chưa gửi, gỡ không được'); }
    const ganVao = async () => {
      const x = timBai(text) || b; const f0 = x.ed.closest('form');
      const inp = f0 && Array.from(f0.querySelectorAll('input[type="file"]')).find((i) => /image/.test(i.accept || ''));
      if (!inp) throw new LoiChuaGui('không thấy ô chọn ảnh của ô bình luận');
      x.ed.focus(); await sleep(300);
      const dt = new DataTransfer(); dt.items.add(file); inp.files = dt.files;
      inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
      return cho(coAnh, 25000, 400);
    };
    if (!(await ganVao())) { // (4.5) Facebook chưa hiện ảnh xem trước → gắn lại 1 lần
      ghi('C2. Ảnh chưa hiện trong ô bình luận → gắn lại');
      if (!(await ganVao())) throw new LoiChuaGui('Facebook không hiện ảnh xem trước trong ô bình luận');
    }
    ghi('C2. Đã gắn ảnh vào ô bình luận');
    await sleep(2000); // chờ ảnh tải lên
    kiemDung();
    const x = timBai(text); if (!x) throw new LoiChuaGui('bài biến mất khỏi trang trước khi gửi comment ảnh');
    x.ed.focus(); await sleep(200);
    x.ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    if (!(await cho(() => !coAnh(), 20000, 500))) {
      // (4.5) Enter chưa ăn (ảnh xem trước vẫn còn = chưa gửi) → bấm nút Gửi bằng chuỗi sự kiện chuột
      const o = hopO(); const nutGui = o && Array.from(o.querySelectorAll('[role="button"][aria-label], div[aria-label][tabindex]')).find((n) => /^(Bình luận|Gửi|Đăng)$/.test(chuan(n.getAttribute('aria-label'))) && dangHien(n));
      ghi('C3. Enter chưa gửi được ảnh → ' + (nutGui ? 'bấm nút Gửi' : 'nhấn Enter lại'));
      if (nutGui) { try { ganBam(nutGui); } catch (e) { nutGui.click(); } } else { const x2 = timBai(text); if (x2) { x2.ed.focus(); x2.ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true })); } }
      if (!(await cho(() => !coAnh(), 15000, 500))) { await goAnh(); const e0 = new LoiChuaGui('đã bấm gửi comment ảnh (Enter + nút Gửi) nhưng ảnh xem trước vẫn còn — chưa gửi được'); e0.sauEnter = true; throw e0; }
    }
    ghi('C3. Đã gửi comment ảnh, chờ Facebook xác nhận');
    const han = Date.now() + 6000;
    while (Date.now() < han) {
      const y = timBai(text); const loi = loiTuFacebook(y && y.khung);
      if (loi) throw new LoiTuChoi(loi);
      await sleep(500);
    }
  }
  async function cmtDaCoApi(dd, it) {
    if (!coApi()) return null;
    try {
      let id = dd.id;
      if (!id) { const p = baiGiongNhat(await baiTrenTrangApi(Date.now() - 864e5), dd.bai); if (!p) return null; id = p.id; dd.id = id; }
      const cs = await cmtChiTietApi(id);
      if (it.k === 'text') return cs.msgs.some((c) => khopCmt(c, it.v));
      const soAnhDaGui = dd.cmts.slice(0, dd.cmtIdx + 1).filter((x) => x.k === 'anh').length - (dd.anhLoi || 0) + (dd.anhCoSan || 0);
      return cs.anh >= soAnhDaGui;
    } catch (e) { return null; }
  }
  async function suaNenDo(b) {
    const thuLai = (fn, ms) => cho(fn, ms);
    const art = b.khung.closest('[role="article"]') || b.khung;
    const nutBa = () => art.querySelector('[aria-label^="Hành động đối với bài viết này"]') || b.khung.querySelector('[aria-label^="Hành động đối với bài viết này"]');
    const n1 = await thuLai(nutBa, 10000); if (!n1) throw new Error('không thấy nút ⋯ của bài');
    ganBam(n1);
    const timMenu = () => Array.from(document.querySelectorAll('[role="menuitem"]')).find((x) => dangHien(x) && /Chỉnh sửa bài viết/.test(x.innerText));
    let mn = await thuLai(timMenu, 6000);
    if (!mn) { n1.click(); mn = await thuLai(timMenu, 6000); }
    if (!mn) throw new Error('không thấy mục "Chỉnh sửa bài viết"');
    ganBam(mn);
    const hop = await thuLai(() => hopThoai((d) => /Chỉnh sửa bài viết/.test(d.innerText) && (d.querySelector('[aria-label="Gỡ ảnh"]') || d.querySelector('[aria-label="Hiển thị các tùy chọn phông nền"]'))), 15000);
    if (!hop) throw new Error('không mở được hộp chỉnh sửa bài viết');
    ghi('Sửa nền: đã mở hộp chỉnh sửa');
    await sleep(1200);
    for (let i = 0; i < 20; i++) { const x = hop.querySelector('[aria-label="Gỡ ảnh"]'); if (!x) break; ganBam(x); await sleep(900); }
    if (hop.querySelector('[aria-label="Gỡ ảnh"]')) throw new Error('chưa gỡ hết ảnh');
    ghi('Sửa nền: đã gỡ ảnh');
    const aa = await thuLai(() => hop.querySelector('[aria-label="Hiển thị các tùy chọn phông nền"]'), 10000);
    if (!aa) throw new Error('không thấy nút Aa (bài có thể dài quá ' + CAI_DAT.GIOI_HAN_KY_TU_NEN + ' ký tự)');
    ganBam(aa); await sleep(800);
    let sw = await thuLai(() => hop.querySelector(`[aria-label^="${CAI_DAT.NEN}"]`), 6000);
    if (!sw) { ganBam(aa); sw = await thuLai(() => hop.querySelector(`[aria-label^="${CAI_DAT.NEN}"]`), 6000); }
    if (!sw) throw new Error('không thấy nền "' + CAI_DAT.NEN + '"');
    ganBam(sw); await sleep(900);
    ghi('Sửa nền: đã chọn nền ' + CAI_DAT.NEN);
    const luuNut = () => Array.from(hop.querySelectorAll('[role="button"],[aria-label="Lưu"]')).find((x) => dangHien(x) && (chuan(x.innerText) === 'Lưu' || x.getAttribute('aria-label') === 'Lưu') && x.getAttribute('aria-disabled') !== 'true');
    const nl = await thuLai(luuNut, 8000); if (!nl) throw new Error('không thấy nút Lưu');
    ganBam(nl);
    if (!(await cho(() => !hop.isConnected || !dangHien(hop), 15000))) { // (4.5) Lưu chưa ăn → bấm lại bằng cách khác
      const nl2 = luuNut(); if (nl2) { ghi('Sửa nền: bấm Lưu lần 1 chưa ăn → bấm lại'); nl2.click(); }
      if (!(await cho(() => !hop.isConnected || !dangHien(hop), 20000))) throw new Error('bấm Lưu nhưng hộp chưa đóng');
    }
    await sleep(4000);
    // kiểm lại trên bài: không còn ảnh lớn (ngoài phần comment)
    const conAnhF = () => { const b2 = timBai(b.bai || '') || b; return !!(b2 && b2.khung && Array.from(b2.khung.querySelectorAll('img')).some((im) => { const a = im.closest('[role="article"]'); return (!a || a === b2.khung || !b2.khung.contains(a)) && im.getBoundingClientRect().width > 150; })); };
    if (conAnhF()) { ghi('Sửa nền: đã Lưu nhưng trang chưa vẽ lại → chờ thêm (tối đa 25 giây)'); if (!(await cho(() => !conAnhF(), 25000, 1500))) { const api = await baiConAnhApi(b.bai || ''); if (api === false) { ghi('Sửa nền: trang chưa cập nhật nhưng Facebook (API) xác nhận bài KHÔNG còn ảnh → coi như đã sửa xong'); } else { try { const b2 = timBai(b.bai || '') || b; const ds = Array.from(b2.khung.querySelectorAll('img')).filter((im) => im.getBoundingClientRect().width > 100).map((im) => Math.round(im.getBoundingClientRect().width) + 'x' + Math.round(im.getBoundingClientRect().height) + ':' + (im.alt || '').slice(0, 30)); ghi('Sửa nền: ảnh còn thấy trên bài: ' + (ds.join(' | ') || 'không rõ') + (api === null ? ' · chưa hỏi được Facebook (API)' : ' · Facebook (API) cũng báo còn ảnh')); } catch (e) { /* */ } throw new Error('đã Lưu nhưng trên bài vẫn còn ảnh'); } } }
    ghi('Sửa nền: đã Lưu bài (nền đỏ, không còn ảnh)');
  }
  function dongHopSua() {
    try {
      const h = hopThoai((d) => /Chỉnh sửa bài viết/.test(d.innerText)); if (!h) return;
      const x = h.querySelector('[aria-label="Đóng"]'); if (x) ganBam(x);
      setTimeout(() => { const h2 = hopThoai((d) => /Bỏ|Hủy bỏ|Huỷ bỏ/.test(d.innerText) && /thay đổi|chỉnh sửa/i.test(d.innerText)); const bo = h2 && Array.from(h2.querySelectorAll('[role="button"]')).find((y) => /^(Bỏ|Hủy bỏ|Huỷ bỏ)$/.test(chuan(y.innerText))); if (bo) ganBam(bo); }, 1500);
    } catch (e) { /* */ }
  }
  async function lenLaiCmtThieu(dd) {
    if ((dd.suaLan || 0) >= 1 || !coApi() || !(dd.cmts || []).length) return false;
    const goc = dd.cmtsGoc || dd.cmts;
    try {
      let id = dd.id;
      if (!id) { const p = baiGiongNhat(await baiTrenTrangApi(Date.now() - 864e5), dd.bai); if (!p) return false; id = p.id; }
      const textCans = goc.filter((x) => x.k === 'text');
      const anhs = goc.filter((x) => x.k === 'anh');
      let cs = null, thieuText = false, thieuAnh = 0;
      for (let lan = 0; lan < 3; lan++) { // (4.5) comment ảnh hay lên chậm → hỏi tối đa 3 lần cách 10 giây
        await sleep(lan ? 10000 : 6000);
        cs = await cmtChiTietApi(id);
        thieuText = textCans.filter((t) => !cs.msgs.some((c) => khopCmt(c, t.v)));
        if (!thieuText.length) thieuText = false;
        thieuAnh = Math.max(0, anhs.length - cs.anh);
        if (!thieuText && !thieuAnh) return false;
      }
      const ds = []; if (thieuText) ds.push(...thieuText);
      if (thieuAnh) { // ưu tiên đúng những ảnh chưa gửi được; không biết thì lấy các ảnh cuối
        const ok = new Set(dd.anhOk || []);
        let chon = anhs.filter((x) => !ok.has(x.v));
        if (chon.length < thieuAnh) chon = chon.concat(anhs.filter((x) => !chon.includes(x)).slice(-(thieuAnh - chon.length)));
        ds.push(...chon.slice(0, thieuAnh));
      }
      dd.cmtsGoc = goc; dd.cmts = ds; dd.cmtIdx = 0; dd.anhLoi = 0; dd.dungAnh = false; dd.dangGui = null;
      /* giữ ghi chú không liên quan comment (vd nền đỏ) */ dd.ghiChuLan1 = (dd.ghiChu || []).filter((x) => !/comment/.test(x)); dd.ghiChu = []; dd.anhCoSan = cs.anh; dd.suaLan = 1; dd.reloadLan = 0; dd.reloadCmt = -1;
      dd.buoc = 'cho_binh_luan'; dd.luc = Date.now(); luu('dang_do', dd);
      ghi(`Kiểm tra: thiếu ${thieuText ? thieuText.length + ' comment chữ' : ''}${thieuText && thieuAnh ? ' + ' : ''}${thieuAnh ? thieuAnh + ' comment ảnh' : ''} → tải lại trang và gửi bù`);
      await sleep(2500); roiTrang();
      return true;
    } catch (e) { ghi('Không kiểm tra bù comment được: ' + e.message); return false; }
  }
  async function chayComment(dd) {
    if ((hopDangDo() || hopSoanBai() || dangODuongSua()) && nguoiDangThaoTac()) return true; // (5.4) người đang soạn bài → không tải lại trang, đợi họ xong
    const ngay = dd.ngay;
    window.scrollTo(0, 0); await sleep(1500);
    const b = await cho(() => timBai(dd.bai), 25000, 1000);
    if (!b) {
      // (4.5) đếm số lần (không tính giờ): tải lại → mở thẳng link bài → tải lại trang bài → mới chốt
      dd.timLan = (dd.timLan || 0) + 1; luu('dang_do', dd);
      if (dd.timLan === 1 && !dd.viaLink) { ghi('Chưa thấy ô bình luận của bài → tải lại trang'); roiTrang(); return true; }
      if (!dd.viaLink) {
        let lk = dd.link; try { if (!lk && coApi()) { const p = baiGiongNhat(await baiTrenTrangApi(Date.now() - 864e5), dd.bai); lk = p && p.link; if (p) dd.id = dd.id || p.id; } } catch (e3) { /* */ }
        if (lk && /^https?:/.test(lk)) { dd.viaLink = lk; dd.link = lk; dd.luc = Date.now(); luu('dang_do', dd); ghi('Không thấy bài trên trang → mở thẳng link bài: ' + lk); await sleep(1000); roiTrang(lk); return true; }
      }
      if (dd.timLan >= 4) await hoanTatSlot(dd, ['đã tải lại trang và mở thẳng link bài nhưng không tìm được ô bình luận nên chưa comment xong — lượt kiểm comment sau sẽ xem lại']);
      else { ghi('Chưa thấy ô bình luận → tải lại'); roiTrang(); }
      return true;
    }
    dd.link = dd.link || linkBai(b.khung);
    if (dd.ngoai) { dd.camXucCmt = dd.camXucCmt || { tt: 'bo' }; if (!dd.daThaBai) { dd.camXucBai = await thaCamXucReel(dd.bai); dd.daThaBai = true; luu('dang_do', dd); } }
    if (!dd.daThaBai) { dd.camXucBai = await thaCamXucBai(dd.bai); dd.daThaBai = true; luu('dang_do', dd); }
    const ghiChu = dd.ghiChu || (dd.ghiChu = []);
    // dự phòng: thả Thích cho comment lần trước thất bại → sau khi tải lại trang thử lại 1 lần
    if (dd.camXucCmt && dd.camXucCmt.tt === 'chua' && !dd.thuLaiCx) {
      dd.thuLaiCx = true; const tcx = (dd.cmtsGoc || dd.cmts || []).find((x) => x.k === 'text');
      if (tcx) { try { dd.camXucCmt = await thaCamXucCmt(dd.bai, tcx.v); ghi('Thử lại thả cảm xúc cho comment: ' + (dd.camXucCmt.tt === 'ok' ? 'được' : 'vẫn chưa được')); } catch (e) { /* */ } }
      luu('dang_do', dd);
    }
    if (dd.loai === 2 && !dd.ngoai && !dd.raSoat && !dd.daSuaNen && !dd.suaNenXong && (dd.suaNenLan || 0) < 3 && CAI_DAT.SUA_NEN_B2 !== false) {
      // (4.5) đếm số lần thử (qua cả các lần tải lại); thử tối đa 3 lần (lần 3 sau khi tải lại trang)
      dd.suaNenLan = (dd.suaNenLan || 0) + 1; luu('dang_do', dd);
      try {
        b.bai = dd.bai;
        try { await suaNenDo(b); }
        catch (e1) { ghi('Sửa nền đỏ lần ' + dd.suaNenLan + ' lỗi: ' + e1.message + ' → thử lại'); dongHopSua(); await sleep(4000); const b2 = await cho(() => timBai(dd.bai), 15000, 1000); if (b2) b2.bai = dd.bai; await suaNenDo(b2 || b); }
        dd.suaNenXong = true; luu('dang_do', dd);
      }
      catch (e) {
        ghi('Sửa nền đỏ Bài 2 lỗi: ' + e.message); dongHopSua(); await sleep(3000);
        if (dd.suaNenLan < 3) { luu('dang_do', dd); ghi('Sửa nền đỏ chưa được → tải lại trang thử lại'); roiTrang(); return true; }
        ghiChu.push('chưa sửa được nền đỏ cho Bài 2 (đã thử 3 lần): ' + e.message + ' — cần sửa tay');
      }
      luu('dang_do', dd);
      if (!(await cho(() => timBai(dd.bai), 20000, 1000))) { ghi('Sau khi sửa nền chưa thấy ô bình luận → tải lại trang'); roiTrang(); return true; }
    }
    // trang vừa tải lại giữa lúc đang gửi 1 comment → hỏi API xem comment đó lên chưa, KHÔNG tự gửi lại
    if (dd.dangGui != null && dd.dangGui === dd.cmtIdx) {
      const it = dd.cmts[dd.cmtIdx];
      let co = await cmtDaCoApi(dd, it);
      if (co === false) { await sleep(10000); co = await cmtDaCoApi(dd, it); } // hỏi lại cho chắc (Facebook có thể chậm)
      if (co === false) { ghi(`Comment thứ ${dd.cmtIdx + 1} chưa lên (API xác nhận) → gửi lại`); dd.dangGui = null; luu('dang_do', dd); }
      else {
        if (co !== true) ghiChu.push(`comment thứ ${dd.cmtIdx + 1} (${it.k === 'text' ? 'chữ' : 'ảnh'}) không rõ đã lên chưa — không gửi lại, lượt kiểm comment sau sẽ xem lại`);
        else if (it.k === 'anh') dd.anhOk = (dd.anhOk || []).concat(it.v);
        dd.cmtIdx++; dd.dangGui = null; luu('dang_do', dd);
      }
    }
    while (dd.cmtIdx < dd.cmts.length) {
      kiemDung();
      const it = dd.cmts[dd.cmtIdx];
      dd.dangGui = dd.cmtIdx; dd.buoc = 'dang_binh_luan'; luu('dang_do', dd);
      try {
        if (it.k === 'text' && coApi()) { let coSan = false; try { if (!dd.id) { const p0 = baiGiongNhat(await baiTrenTrangApi(Date.now() - 6 * 3600e3), dd.bai); if (p0) { dd.id = p0.id; dd.link = dd.link || p0.link; } } if (dd.id) coSan = (await cmtChiTietApi(dd.id)).msgs.some((c) => khopCmt(c, it.v)); } catch (e) { /* */ } if (coSan) { ghi(`Comment thứ ${dd.cmtIdx + 1} đã có sẵn dưới bài (máy khác / tab khác đã gửi) → không gửi trùng`); dd.cmtIdx++; dd.dangGui = null; luu('dang_do', dd); continue; } }
        if (it.k === 'text') await binhLuan(dd.bai, it.v);
        else {
          const f = await taiAnhKho(it.v, 'cmt-' + (dd.cmtIdx + 1));
          kiemDung();
          await binhLuanAnh(dd.bai, f);
        }
        if (it.k === 'text' && !dd.camXucCmt) dd.camXucCmt = await thaCamXucCmt(dd.bai, it.v);
        ghi(`C4. Đã gửi comment ${dd.cmtIdx + 1}/${dd.cmts.length} (${it.k === 'text' ? 'chữ' : 'ảnh'})`);
        if (it.k === 'anh') dd.anhOk = (dd.anhOk || []).concat(it.v);
        dd.dangGui = null; dd.cmtIdx++; dd.buoc = 'cho_binh_luan'; luu('dang_do', dd);
        await sleep(1800 + Math.floor(Math.random() * 1400));
        if (CAI_DAT.TAI_LAI_SAU_CMT !== false && dd.cmtIdx < dd.cmts.length) { ghi('Tải lại trang (F5) trước comment kế để ô bình luận không bị treo'); await sleep(1500); roiTrang(); return true; }
      } catch (e) {
        if (e instanceof LoiDung || (e && e.doiTuCach)) { dd.dangGui = null; dd.buoc = 'cho_binh_luan'; luu('dang_do', dd); ghi('Comment còn chờ: ' + e.message); return true; }
        if ((e instanceof LoiChuaGui || /không tìm thấy ô bình luận/.test(e.message)) && (dd.taiLaiTong || 0) < 8) { // chưa gửi gì (tối đa 8 lần tải lại cho cả lượt comment) (ô treo / ảnh không gắn được / Enter không ăn) → F5 rồi thử lại đúng comment này
          if (dd.reloadCmt !== dd.cmtIdx) { dd.reloadCmt = dd.cmtIdx; dd.reloadLan = 0; }
          if ((dd.reloadLan || 0) >= 2 && !dd.viaLink) { // phương án 2: mở thẳng trang riêng của bài rồi comment ở đó
            let lk = dd.link; try { if (!lk && coApi()) { const p = baiGiongNhat(await baiTrenTrangApi(Date.now() - 864e5), dd.bai); lk = p && p.link; } } catch (e3) { /* */ }
            if (lk && /^https?:/.test(lk)) { dd.viaLink = lk; dd.reloadLan = 0; dd.taiLaiTong = (dd.taiLaiTong || 0) + 1; dd.dangGui = e.sauEnter ? dd.cmtIdx : null; dd.buoc = 'cho_binh_luan'; luu('dang_do', dd); ghi('Tải lại vẫn chưa được → mở thẳng link bài để comment: ' + lk); await sleep(1500); roiTrang(lk); return true; }
          }
          if ((dd.reloadLan || 0) < 3) { dd.reloadLan = (dd.reloadLan || 0) + 1; dd.taiLaiTong = (dd.taiLaiTong || 0) + 1; dd.dangGui = e.sauEnter ? dd.cmtIdx : null; dd.buoc = 'cho_binh_luan'; luu('dang_do', dd); ghi(`Ô bình luận bị treo → tải lại trang rồi thử lại comment ${dd.cmtIdx + 1} (lần ${dd.reloadLan}/3)`); await sleep(2000); roiTrang(); return true; }
        }
        if (e instanceof LoiLark || (it.k === 'anh' && !(e instanceof LoiTuChoi) && /tải ảnh|Ô này không phải ảnh|Mất kết nối khi tải|Ô ảnh này Lark báo lỗi|Mã truy cập Lark/.test(e.message))) {
          // chưa gửi gì cả → được phép bỏ qua mục này và đi tiếp
          dd.anhLoi = (dd.anhLoi || 0) + 1;
          ghiChu.push(`comment ảnh thứ ${dd.cmtIdx + 1} bỏ qua vì không tải được ảnh: ${e.message}`);
          dd.dangGui = null; dd.cmtIdx++; dd.buoc = 'cho_binh_luan'; luu('dang_do', dd); continue;
        }
        ghi('Lỗi comment: ' + e.message);
        if (it.k === 'anh') { // (4.5) không còn "bỏ hết các ảnh sau" — chỉ ảnh này tính là lỗi, ảnh sau vẫn gửi; gửi bù/rà soát sẽ lo ảnh này
          dd.anhLoi = (dd.anhLoi || 0) + 1;
          try { const x = timBai(dd.bai); const rm = x && x.ed.closest('form') && x.ed.closest('form').parentElement.querySelector('[aria-label="Gỡ ảnh"]'); if (rm) rm.click(); } catch (e2) { /* */ }
        }
        ghiChu.push(`comment thứ ${dd.cmtIdx + 1} (${it.k === 'text' ? 'chữ' : 'ảnh'}) lỗi: ${e.message} — không tự gửi lại`);
        dd.dangGui = null; dd.cmtIdx++; dd.buoc = 'cho_binh_luan'; luu('dang_do', dd);
        if (e instanceof LoiTuChoi) { ghiChu.push('Facebook từ chối comment → dừng các comment còn lại'); break; }
        await sleep(2500);
      }
    }
    await hoanTatSlot(dd, ghiChu);
    return true;
  }

  // =====================================================================
  //  Kho tải sẵn (trên ổ cứng của trình duyệt — không chiếm RAM) + tải file từ Lark
  // =====================================================================
  let khoDb = null;
  const khoMo = () => khoDb || (khoDb = new Promise((res, rej) => { const q = indexedDB.open('smh6_kho', 1); q.onupgradeneeded = () => q.result.createObjectStore('tep'); q.onsuccess = () => res(q.result); q.onerror = () => { khoDb = null; rej(q.error); }; }));
  async function khoLay(k) { try { const d = await khoMo(); return await new Promise((res) => { const r = d.transaction('tep').objectStore('tep').get(k); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); }); } catch (e) { return null; } }
  async function khoLuu(k, blob, them) { try { const d = await khoMo(); await new Promise((res) => { const t = d.transaction('tep', 'readwrite'); t.objectStore('tep').put(Object.assign({ blob, luc: Date.now(), size: blob.size, type: blob.type }, them || {}), k); t.oncomplete = () => res(); t.onerror = () => res(); t.onabort = () => res(); }); } catch (e) { /* kho lỗi thì thôi, lúc dùng tải trực tiếp */ } }
  async function khoXoa(k) { try { const d = await khoMo(); await new Promise((res) => { const t = d.transaction('tep', 'readwrite'); t.objectStore('tep').delete(k); t.oncomplete = () => res(); t.onerror = () => res(); }); } catch (e) { /* */ } }
  async function khoDon(giuGio = 72) { // xoá đồ cũ hơn 3 ngày
    try {
      const d = await khoMo(); let tong = 0, xoa = 0, n = 0;
      await new Promise((res) => { const t = d.transaction('tep', 'readwrite'); const cur = t.objectStore('tep').openCursor();
        cur.onsuccess = () => { const c = cur.result; if (!c) return; if (Date.now() - (c.value.luc || 0) > giuGio * 3600e3) { c.delete(); xoa++; } else { tong += c.value.size || 0; n++; } c.continue(); };
        t.oncomplete = () => res(); t.onerror = () => res(); t.onabort = () => res(); });
      return { tong, xoa, n };
    } catch (e) { return { tong: 0, xoa: 0, n: 0 }; }
  }
  const MA_KHOA_LARK = ['99991403', '99991400', '429', '91403', '99991672', '99991676', '99991679', '99991668', '10014'];
  // tải 1 file trong ô sheet (ảnh / video / nhạc) — có trong kho thì lấy kho, không gọi Lark
  async function taiTepLark(token, { ten = 'tep', loai = '', size = 0, timeout = 180000 } = {}) {
    const trongKho = await khoLay('tep|' + token);
    if (trongKho && trongKho.blob && trongKho.blob.size > 500) return trongKho.blob;
    const gate = chanLark(); if (gate) throw new LoiLark(gate.msg + ' — đang chờ kiểm tra lại');
    let loiCuoi = null;
    for (let lan = 0; lan < 3; lan++) {
      if (lan) await sleepThat(3000 + Math.floor(Math.random() * 4000));
      const t = await larkToken(); demLark();
      const t0 = Date.now();
      const r = await new Promise((resolve) => GM_xmlhttpRequest({ method: 'GET', url: 'https://open.larksuite.com/open-apis/drive/v1/medias/' + encodeURIComponent(token) + '/download', headers: { Authorization: 'Bearer ' + t }, responseType: 'blob', timeout,
        onload: (x) => resolve({ status: x.status, blob: x.response }), onerror: () => resolve({ mang: 'mất kết nối' }), ontimeout: () => resolve({ mang: 'quá lâu' }) }));
      if (r.mang) { loiCuoi = new LoiMem(`tải ${ten} lỗi: ${r.mang}`); continue; }
      const blob = r.blob;
      const laJson = !blob || blob.size < 2000 || /json/.test(blob.type || '');
      if (laJson) { let j = null; try { j = JSON.parse(await blob.text()); } catch (e) { /* */ }
        if (j && j.code != null && j.code !== 0) { const ma = String(j.code); if (MA_TOKEN_LARK.includes(ma)) { boTokenLark(); loiCuoi = new LoiMem('Mã truy cập Lark hết hạn'); continue; } if (MA_KHOA_LARK.includes(ma)) throw loiLark(ma, j.msg); throw new LoiMem(`Lark báo lỗi khi tải ${ten} (mã ${ma}) — file có thể đã bị xoá`); }
        if (!blob || blob.size < 500) { loiCuoi = new LoiMem(`tải ${ten} chưa được (${blob ? blob.size : 0} byte)`); continue; } }
      if (r.status >= 500) { loiCuoi = new LoiMem(`tải ${ten} lỗi máy chủ (mã ${r.status})`); continue; }
      if (size && Math.abs(blob.size - size) > 1024) { loiCuoi = new LoiMem(`tải ${ten} chưa đủ (${blob.size}/${size} byte)`); continue; }
      if (loai && blob.size > 1e6) ghi(`Đã tải ${ten} (${(blob.size / 1048576).toFixed(1)} MB) trong ${((Date.now() - t0) / 1000).toFixed(0)} giây`);
      await khoLuu('tep|' + token, blob, { loai });
      return blob;
    }
    throw loiCuoi || new LoiMem('Không tải được ' + ten);
  }
  async function thuNhoAnh(blob, ten) { // ảnh quá lớn (ảnh gốc điện thoại ~5MB) thì thu nhỏ cho Facebook tải lên nhanh
    const duoi = /png/.test(blob.type) ? 'png' : 'jpg';
    try {
      const bm = await createImageBitmap(blob);
      const lon = Math.max(bm.width, bm.height); const cap = CAI_DAT.ANH_CANH_TOI_DA;
      if (lon <= cap && blob.size <= 3.5e6) { if (bm.close) bm.close(); return new File([blob], ten + '.' + duoi, { type: blob.type || 'image/jpeg' }); }
      const k = Math.min(1, cap / lon);
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bm.width * k)); c.height = Math.max(1, Math.round(bm.height * k));
      c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height); if (bm.close) bm.close();
      const out = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
      if (out && out.size > 500) return new File([out], ten + '.jpg', { type: 'image/jpeg' });
    } catch (e) { /* dùng ảnh gốc */ }
    return new File([blob], ten + '.' + duoi, { type: blob.type || 'image/jpeg' });
  }
  async function taiAnhKho(token, ten) { return thuNhoAnh(await taiTepLark(token, { ten: 'ảnh ' + ten, loai: 'anh' }), ten); }
  async function taiVideoKho(tep) {
    const b = await taiTepLark(tep.fileToken, { ten: 'video "' + tep.ten + '"', loai: 'video', size: tep.size, timeout: 300000 });
    const ten = /\.(mp4|mov|m4v|webm)$/i.test(tep.ten || '') ? tep.ten : (tep.ten || 'video') + '.mp4';
    return new File([b], ten, { type: (b.type && /^video\//.test(b.type)) ? b.type : (tep.mime || 'video/mp4') });
  }

  // ---------------- nhạc nền manifest: lưu trong Tampermonkey (khởi động lại máy / Chrome vẫn còn) ----------------
  const nhacInfo = () => lay('nhac6_info', null); // { ten, size, luc, tu }
  function nhacBlob() {
    const b64 = lay('nhac6', ''); if (!b64) return null;
    try { const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return new Blob([u8], { type: (nhacInfo() || {}).mime || 'audio/mpeg' }); } catch (e) { return null; }
  }
  async function luuNhac(blob, ten, tu) {
    if (blob.size > 4 * 1048576) throw new Error('file nhạc lớn quá (' + (blob.size / 1048576).toFixed(1) + ' MB) — dùng bài ~15–30 giây, dưới 4 MB');
    try { const ac = new OfflineAudioContext(1, 44100, 44100); await ac.decodeAudioData(await blob.arrayBuffer()); } catch (e) { throw new Error('file này không đọc được như nhạc (mp3/m4a/wav)'); }
    const u8 = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
    luu('nhac6', btoa(s)); luu('nhac6_info', { ten, size: blob.size, luc: Date.now(), tu, mime: blob.type || 'audio/mpeg' });
    ghi(`Đã lưu nhạc nền manifest "${ten}" (${(blob.size / 1024).toFixed(0)} KB, ${tu === 'o' ? 'lấy từ ô dự phòng' : 'tải lên trên popup'})`);
  }
  // máy chưa có nhạc → lấy file ở ô dự phòng (1 lần), lưu lại
  async function damBaoNhac() {
    const b = nhacBlob(); if (b) return b;
    const o = lay('o_nhac6', CAI_DAT.O_NHAC_DU_PHONG);
    ghi(`Máy này chưa có nhạc nền manifest → lấy nhạc ở ô dự phòng ${o}`);
    const c = await docO(CAI_DAT.TAB_VIDEO, o); const t = tepNhac(c);
    if (!t) throw new LoiThieu(`chưa có nhạc nền: máy này chưa tải nhạc lên, và ô ${o} (tab Kênh 1) không có file mp3`);
    const blob = await taiTepLark(t.fileToken, { ten: 'nhạc ' + t.ten, loai: 'nhac', size: t.size });
    await luuNhac(blob, t.ten, 'o');
    return nhacBlob();
  }

  // ---------------- video manifest: ảnh cột H + nhạc → video 15 giây (tạo sẵn, cất kho) ----------------
  async function videoManifest(ngay, so, anhToken, bao = () => {}) {
    const k = `mf|${ngay}|${so}|${anhToken}`;
    const c = await khoLay(k);
    if (c && c.blob && c.blob.size > 50000) return new File([c.blob], `manifest-${so + 1}.mp4`, { type: 'video/mp4' });
    const nhac = await damBaoNhac();
    const anh = await taiTepLark(anhToken, { ten: 'ảnh manifest', loai: 'anh' });
    const f = await ghepManifestWC(anh, nhac, CAI_DAT.MF_GIAY, bao, '');
    await khoLuu(k, f, { loai: 'mf' });
    ghi(`Đã tạo video manifest ${so + 1} ngày ${ngay.slice(0, 5)} (${(f.size / 1048576).toFixed(1)} MB · hiệu ứng ${f.hieuUng || '?'})`);
    return f;
  }

  // =====================================================================
  //  Manifest: font chữ, tạo ảnh, ghép video (dùng lại từ bản 5.9.7)
  // =====================================================================
  const FONT_MF = { 'UTM American Sans': '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', 'UTM Aptima': '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ACQASAAmACQASf/cACQAVP/cACQAV//cACQAWP+3ACQAWf+QACQAWv+3ACQAXP+3ACQA8v/cACUAEAA5ACUAJgAmACUAKgAmACUAOf/cACUAOv/cACUAPP+tACYAJP/cACYANv/cACYAPP+3ACcAJP/cACcAOf/cACcAPP+3ACkAD/8DACkAEf8DACkAHf+tACkAHv+tACkAJP+QACkANwAmACkARP+IACkASP+aACkATP+3ACkAUv+aACkAVf+kACkAWP+kACkAXP+3ACkAaf+IACoAEAAvACoAJP/cACoAN//cACoAOv/cACoAPP+QACsAHf/cACsAHv/cAC0AEP/cAC0AJP/cAC4AEP8pAC4AJP+3AC4AJv+QAC4AMv+QAC4AN//cAC4AOP+3AC4AOv+QAC4APP+QAC4ARP/cAC4ASP/cAC4AUv+3AC4AWP9rAC4AXP+QAC4Aaf/cAC8AJP/cAC8AN/9rAC8AOP/cAC8AOf+QAC8AOv+3AC8APP9rAC8AWP/cAC8AXP+3ADIAD/+tADIAEAA5ADIAEf+tADIAJP/cADIAOf+3ADIAO/+3ADIAPP+3ADMAD/7TADMAEP/TADMAEf7TADMAJP+QADMARP+IADMASP+kADMAUv+aADMAVf/cADMAVv+3ADMAWP+3ADMAaf+IADUAEP/JADUAHf+3ADUAHv+3ADUAJP+3ADUAN//cADUAOf/cADUAPP9rADUASP/cADUAUv/cADUAWP/cADUAXP/cADYAJP+3ADYAJgAmADYAKgAmADcAD/8fADcAEP9rADcAEf8fADcAHf99ADcAHv99ADcAJP9EADcARP9EADcARv8fADcASP9EADcATP+3ADcAUv9EADcAVf/cADcAVv8fADcAWP9ZADcAWv9rADcAXP9rADcAaf9EADgAJP+QADkAD/6tADkAEP99ADkAEf6tADkAHf9OADkAHv9OADkAJP+QADkAMv/cADkARP9hADkASP9ZADkATP+3ADkAUv99ADkAWP9rADkAXP+QADkAaf9hADoAD/7cADoAEP9hADoAEf7cADoAHf+IADoAHv+IADoAJP+3ADoARP+IADoASP99ADoATP+QADoAUv+QADoAVf+kADoAWP99ADoAXP+QADoAaf+IADsAEP9OADsAJP+3ADsAJv/cADsAMv+3ADsAN/+3ADsASP+3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' };
  let fontMFXong = null;
  function napFontMF() {
    if (!fontMFXong) fontMFXong = (async () => {
      for (const [ten, b64] of Object.entries(FONT_MF)) {
        const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const f = new FontFace(ten, u8.buffer); await f.load(); document.fonts.add(f);
      }
    })().catch((e) => { fontMFXong = null; throw new LoiMem('không nạp được font chữ (' + e.message + ')'); });
    return fontMFXong;
  }
  async function taoAnhManifest(nenBlob, chuO, font, fontCmt, fontTd, fontThan) {
    const W = 1080, H = 1920, LE = 130; // (5.9.7) lề 2 bên 12% → điện thoại cắt bớt 2 bên hay hiệu ứng phóng to 3% đều không mất chữ
    const RONG = W - LE * 2;
    const F = font || 'UTM American Sans', FC = fontCmt || 'UTM Aptima', FT = fontTd || F, FB = fontThan || F;
    // 1) tách chữ: câu đầu = tiêu đề; các câu giữa = thân; câu "Cmt…" = lời kêu gọi; dòng toàn hashtag cuối = bỏ (dùng làm chữ bài đăng)
    const dong = chuO.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (dong.length && /^(#\S+\s*)+$/.test(dong[dong.length - 1])) dong.pop();
    if (dong.length && /^#manifest$/i.test(dong[0])) dong.shift();
    const tieuDe = (dong.shift() || '').toLocaleUpperCase('vi');
    const than = [], cta = [];
    for (const s of dong) (/^cmt\b/i.test(s) || cta.length ? cta : than).push(s);
    // 2) nền: phủ kín khung 9:16
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const bm = await createImageBitmap(nenBlob); const k = Math.max(W / bm.width, H / bm.height);
    g.drawImage(bm, (W - bm.width * k) / 2, (H - bm.height * k) / 2, bm.width * k, bm.height * k);
    // 3) ngắt dòng theo bề rộng
    const ngat = (txt, px, ff) => { g.font = `${px}px "${ff || F}"`; const ra = []; let cur = ''; for (const w of txt.split(/\s+/)) { const th = cur ? cur + ' ' + w : w; if (!cur || g.measureText(th).width <= RONG) cur = th; else { ra.push(cur); cur = w; } } if (cur) ra.push(cur);
      // tránh dòng cuối chỉ còn 1 chữ: kéo bớt 1 chữ từ dòng trên xuống
      if (ra.length > 1 && !/\s/.test(ra[ra.length - 1])) { const tr = ra[ra.length - 2].split(' '); if (tr.length > 2) { const m = tr.pop(); const moi = m + ' ' + ra[ra.length - 1]; if (g.measureText(moi).width <= RONG) { ra[ra.length - 2] = tr.join(' '); ra[ra.length - 1] = moi; } } }
      return ra; };
    // 4) cỡ chữ + khoảng cách đo theo ảnh mẫu (khung 1080x1920); chữ dài thì tự thu nhỏ đều cho vừa
    const DAY_DUOI = 1480; // dòng chữ cuối không thấp hơn mức này (chừa chỗ cho #sonmochuong)
    let bo;
    for (let tl = 1; tl >= 0.55; tl -= 0.02) {
      const kh = [
        { ds: ['#MANIFEST'], px: 47 * tl, mau: '#ffffff', cach: 0, dong: 0 },
        { ds: ngat(tieuDe, 73 * tl, FT), px: 73 * tl, mau: '#f8ef3b', cach: 87 * tl, dong: 84 * tl, ff: FT },
      ];
      if (than.length) kh.push({ ds: than.flatMap((s) => ngat(s, 68 * tl, FB)), px: 68 * tl, mau: '#ffffff', cach: 156 * tl, dong: 77 * tl, ff: FB });
      if (cta.length) kh.push({ ds: cta.flatMap((s) => ngat(s, 57 * tl, FC)), px: 57 * tl, mau: '#ffffff', cach: 177 * tl, dong: 96 * tl, ff: FC });
      let y = 350, toaDo = [];
      for (const k2 of kh) { y += k2.cach; k2.ds.forEach((d, i) => { if (i) y += k2.dong; toaDo.push([k2, d, y]); }); }
      bo = { toaDo, tl }; if (y <= DAY_DUOI) break;
    }
    // 5) vẽ chữ (bóng mờ nhẹ cho dễ đọc)
    g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 10; g.shadowOffsetY = 3;
    let tran = 0;
    for (const [k2, d, y] of bo.toaDo) { g.font = `${k2.px}px "${k2.ff || F}"`; g.fillStyle = k2.mau; g.fillText(d, LE, y); tran = Math.max(tran, LE + g.measureText(d).width); }
    g.shadowColor = 'transparent';
    g.textAlign = 'center'; g.font = `italic 56px "${F}"`; g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillText('#sonmochuong', W / 2, 1589);
    // kiểm tra không chữ nào tràn lề
    return { blob: await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.93)), tl: bo.tl, phaiNhat: Math.round(tran) };
  }
  var Mp4Muxer=(()=>{var e=Object.defineProperty,t=Object.getOwnPropertyDescriptor,i=Object.getOwnPropertyNames,s=Object.prototype.hasOwnProperty,a=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},r=(e,t,i)=>(a(e,t,"read from private field"),i?i.call(e):t.get(e)),n=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},o=(e,t,i,s)=>(a(e,t,"write to private field"),s?s.call(e,i):t.set(e,i),i),h=(e,t,i)=>(a(e,t,"access private method"),i),l={};((t,i)=>{for(var s in i)e(t,s,{get:i[s],enumerable:!0})})(l,{ArrayBufferTarget:()=>Me,FileSystemWritableFileStreamTarget:()=>Oe,Muxer:()=>Rt,StreamTarget:()=>We});var d,f,u,m,p,c,w,g,b=new Uint8Array(8),y=new DataView(b.buffer),k=e=>[(e%256+256)%256],T=e=>(y.setUint16(0,e,!1),[b[0],b[1]]),C=e=>(y.setUint32(0,e,!1),[b[1],b[2],b[3]]),v=e=>(y.setUint32(0,e,!1),[b[0],b[1],b[2],b[3]]),S=e=>(y.setUint32(0,Math.floor(e/2**32),!1),y.setUint32(4,e,!1),[b[0],b[1],b[2],b[3],b[4],b[5],b[6],b[7]]),x=e=>(y.setInt16(0,256*e,!1),[b[0],b[1]]),z=e=>(y.setInt32(0,65536*e,!1),[b[0],b[1],b[2],b[3]]),E=e=>(y.setInt32(0,2**30*e,!1),[b[0],b[1],b[2],b[3]]),A=(e,t=!1)=>{let i=Array(e.length).fill(null).map((t,i)=>e.charCodeAt(i));return t&&i.push(0),i},M=e=>e&&e[e.length-1],W=e=>{let t;for(let i of e)(!t||i.presentationTimestamp>t.presentationTimestamp)&&(t=i);return t},O=(e,t,i=!0)=>{let s=e*t;return i?Math.round(s):s},B=e=>{let t=e*(Math.PI/180),i=Math.cos(t),s=Math.sin(t);return[i,s,0,-s,i,0,0,0,1]},U=B(0),D=e=>[z(e[0]),z(e[1]),E(e[2]),z(e[3]),z(e[4]),E(e[5]),z(e[6]),z(e[7]),E(e[8])],j=e=>e?"object"!=typeof e?e:Array.isArray(e)?e.map(j):Object.fromEntries(Object.entries(e).map(([e,t])=>[e,j(t)])):e,R=e=>e>=0&&e<2**32,I=(e,t,i)=>({type:e,contents:t&&new Uint8Array(t.flat(10)),children:i}),N=(e,t,i,s,a)=>I(e,[k(t),C(i),s??[]],a),V=e=>({type:"mdat",largeSize:e}),F=(e,t,i=!1)=>I("moov",null,[L(t,e),...e.map(e=>$(e,t)),i?me(e):null]),L=(e,t)=>{let i=O(Math.max(0,...t.filter(e=>e.samples.length>0).map(e=>{const t=W(e.samples);return t.presentationTimestamp+t.duration})),Bt),s=Math.max(...t.map(e=>e.id))+1,a=!R(e)||!R(i),r=a?S:v;return N("mvhd",+a,0,[r(e),r(e),v(Bt),r(i),z(1),x(1),Array(10).fill(0),D(U),Array(24).fill(0),v(s)])},$=(e,t)=>I("trak",null,[P(e,t),H(e,t)]),P=(e,t)=>{let i,s=W(e.samples),a=O(s?s.presentationTimestamp+s.duration:0,Bt),r=!R(t)||!R(a),n=r?S:v;return i="video"===e.info.type?"number"==typeof e.info.rotation?B(e.info.rotation):e.info.rotation:U,N("tkhd",+r,3,[n(t),n(t),v(e.id),v(0),n(a),Array(8).fill(0),T(0),T(0),x("audio"===e.info.type?1:0),T(0),D(i),z("video"===e.info.type?e.info.width:0),z("video"===e.info.type?e.info.height:0)])},H=(e,t)=>I("mdia",null,[_(e,t),q("video"===e.info.type?"vide":"soun"),G(e)]),_=(e,t)=>{let i=W(e.samples),s=O(i?i.presentationTimestamp+i.duration:0,e.timescale),a=!R(t)||!R(s),r=a?S:v;return N("mdhd",+a,0,[r(t),r(t),v(e.timescale),r(s),T(21956),T(0)])},q=e=>N("hdlr",0,0,[A("mhlr"),A(e),v(0),v(0),v(0),A("mp4-muxer-hdlr",!0)]),G=e=>I("minf",null,["video"===e.info.type?J():K(),Q(),Z(e)]),J=()=>N("vmhd",0,1,[T(0),T(0),T(0),T(0)]),K=()=>N("smhd",0,0,[T(0),T(0)]),Q=()=>I("dinf",null,[X()]),X=()=>N("dref",0,0,[v(1)],[Y()]),Y=()=>N("url ",0,1),Z=e=>{const t=e.compositionTimeOffsetTable.length>1||e.compositionTimeOffsetTable.some(e=>0!==e.sampleCompositionTimeOffset);return I("stbl",null,[ee(e),oe(e),he(e),le(e),de(e),fe(e),t?ue(e):null])},ee=e=>N("stsd",0,0,[v(1)],["video"===e.info.type?te(Se[e.info.codec],e):ne(ze[e.info.codec],e)]),te=(e,t)=>{return I(e,[Array(6).fill(0),T(1),T(0),T(0),Array(12).fill(0),T(t.info.width),T(t.info.height),v(4718592),v(4718592),v(0),T(1),Array(32).fill(0),T(24),(i=65535,y.setInt16(0,i,!1),[b[0],b[1]])],[xe[t.info.codec](t),t.info.decoderConfig.colorSpace?re(t):null]);var i},ie={bt709:1,bt470bg:5,smpte170m:6},se={bt709:1,smpte170m:6,"iec61966-2-1":13},ae={rgb:0,bt709:1,bt470bg:5,smpte170m:6},re=e=>I("colr",[A("nclx"),T(ie[e.info.decoderConfig.colorSpace.primaries]),T(se[e.info.decoderConfig.colorSpace.transfer]),T(ae[e.info.decoderConfig.colorSpace.matrix]),k((e.info.decoderConfig.colorSpace.fullRange?1:0)<<7)]),ne=(e,t)=>I(e,[Array(6).fill(0),T(1),T(0),T(0),v(0),T(t.info.numberOfChannels),T(16),T(0),T(0),z(t.info.sampleRate)],[Ee[t.info.codec](t)]),oe=e=>N("stts",0,0,[v(e.timeToSampleTable.length),e.timeToSampleTable.map(e=>[v(e.sampleCount),v(e.sampleDelta)])]),he=e=>{if(e.samples.every(e=>"key"===e.type))return null;let t=[...e.samples.entries()].filter(([,e])=>"key"===e.type);return N("stss",0,0,[v(t.length),t.map(([e])=>v(e+1))])},le=e=>N("stsc",0,0,[v(e.compactlyCodedChunkTable.length),e.compactlyCodedChunkTable.map(e=>[v(e.firstChunk),v(e.samplesPerChunk),v(1)])]),de=e=>N("stsz",0,0,[v(0),v(e.samples.length),e.samples.map(e=>v(e.size))]),fe=e=>e.finalizedChunks.length>0&&M(e.finalizedChunks).offset>=2**32?N("co64",0,0,[v(e.finalizedChunks.length),e.finalizedChunks.map(e=>S(e.offset))]):N("stco",0,0,[v(e.finalizedChunks.length),e.finalizedChunks.map(e=>v(e.offset))]),ue=e=>N("ctts",0,0,[v(e.compositionTimeOffsetTable.length),e.compositionTimeOffsetTable.map(e=>[v(e.sampleCount),v(e.sampleCompositionTimeOffset)])]),me=e=>I("mvex",null,e.map(pe)),pe=e=>N("trex",0,0,[v(e.id),v(1),v(0),v(0),v(0)]),ce=(e,t)=>I("moof",null,[we(e),...t.map(be)]),we=e=>N("mfhd",0,0,[v(e)]),ge=e=>{let t=0,i=0,s="delta"===e.type;return i|=+s,t|=s?1:2,t<<24|i<<16},be=e=>I("traf",null,[ye(e),ke(e),Te(e)]),ye=e=>{let t=0;t|=8,t|=16,t|=32,t|=131072;let i=e.currentChunk.samples[1]??e.currentChunk.samples[0],s={duration:i.timescaleUnitsToNextSample,size:i.size,flags:ge(i)};return N("tfhd",0,131128,[v(e.id),v(s.duration),v(s.size),v(s.flags)])},ke=e=>N("tfdt",1,0,[S(O(e.currentChunk.startTimestamp,e.timescale))]),Te=e=>{let t=e.currentChunk.samples.map(e=>e.timescaleUnitsToNextSample),i=e.currentChunk.samples.map(e=>e.size),s=e.currentChunk.samples.map(ge),a=e.currentChunk.samples.map(t=>O(t.presentationTimestamp-t.decodeTimestamp,e.timescale)),r=new Set(t),n=new Set(i),o=new Set(s),h=new Set(a),l=2===o.size&&s[0]!==s[1],d=r.size>1,f=n.size>1,u=!l&&o.size>1,m=h.size>1||[...h].some(e=>0!==e),p=0;return p|=1,p|=4*+l,p|=256*+d,p|=512*+f,p|=1024*+u,p|=2048*+m,N("trun",1,p,[v(e.currentChunk.samples.length),v(e.currentChunk.offset-e.currentChunk.moofOffset||0),l?v(s[0]):[],e.currentChunk.samples.map((e,r)=>{return[d?v(t[r]):[],f?v(i[r]):[],u?v(s[r]):[],m?(n=a[r],y.setInt32(0,n,!1),[b[0],b[1],b[2],b[3]]):[]];var n})])},Ce=(e,t)=>N("tfra",1,0,[v(e.id),v(63),v(e.finalizedChunks.length),e.finalizedChunks.map(i=>[S(O(i.startTimestamp,e.timescale)),S(i.moofOffset),v(t+1),v(1),v(1)])]),ve=()=>N("mfro",0,0,[v(0)]),Se={avc:"avc1",hevc:"hvc1",vp9:"vp09",av1:"av01"},xe={avc:e=>e.info.decoderConfig&&I("avcC",[...new Uint8Array(e.info.decoderConfig.description)]),hevc:e=>e.info.decoderConfig&&I("hvcC",[...new Uint8Array(e.info.decoderConfig.description)]),vp9:e=>{if(!e.info.decoderConfig)return null;let t=e.info.decoderConfig;if(!t.colorSpace)throw new Error("'colorSpace' is required in the decoder config for VP9.");let i=t.codec.split("."),s=Number(i[1]),a=Number(i[2]),r=0+(Number(i[3])<<4)+Number(t.colorSpace.fullRange);return N("vpcC",1,0,[k(s),k(a),k(r),k(2),k(2),k(2),T(0)])},av1:()=>I("av1C",[129,0,0,0])},ze={aac:"mp4a",opus:"Opus"},Ee={aac:e=>{let t=new Uint8Array(e.info.decoderConfig.description);return N("esds",0,0,[v(58753152),k(32+t.byteLength),T(1),k(0),v(75530368),k(18+t.byteLength),k(64),k(21),C(0),v(130071),v(130071),v(92307584),k(t.byteLength),...t,v(109084800),k(1),k(2)])},opus:e=>{let t=3840,i=0;const s=e.info.decoderConfig?.description;if(s){if(s.byteLength<18)throw new TypeError("Invalid decoder description provided for Opus; must be at least 18 bytes long.");const e=ArrayBuffer.isView(s)?new DataView(s.buffer,s.byteOffset,s.byteLength):new DataView(s);t=e.getUint16(10,!0),i=e.getInt16(14,!0)}return I("dOps",[k(0),k(e.info.numberOfChannels),T(t),v(e.info.sampleRate),x(i),k(0)])}},Ae=(Symbol("isTarget"),class{}),Me=class extends Ae{constructor(){super(...arguments),this.buffer=null}},We=class extends Ae{constructor(e){if(super(),this.options=e,"object"!=typeof e)throw new TypeError("StreamTarget requires an options object to be passed to its constructor.");if(e.onData){if("function"!=typeof e.onData)throw new TypeError("options.onData, when provided, must be a function.");if(e.onData.length<2)throw new TypeError("options.onData, when provided, must be a function that takes in at least two arguments (data and position). Ignoring the position argument, which specifies the byte offset at which the data is to be written, can lead to broken outputs.")}if(void 0!==e.chunked&&"boolean"!=typeof e.chunked)throw new TypeError("options.chunked, when provided, must be a boolean.");if(void 0!==e.chunkSize&&(!Number.isInteger(e.chunkSize)||e.chunkSize<1024))throw new TypeError("options.chunkSize, when provided, must be an integer and not smaller than 1024.")}},Oe=class extends Ae{constructor(e,t){if(super(),this.stream=e,this.options=t,!(e instanceof FileSystemWritableFileStream))throw new TypeError("FileSystemWritableFileStreamTarget requires a FileSystemWritableFileStream instance.");if(void 0!==t&&"object"!=typeof t)throw new TypeError("FileSystemWritableFileStreamTarget's options, when provided, must be an object.");if(t&&void 0!==t.chunkSize&&(!Number.isInteger(t.chunkSize)||t.chunkSize<=0))throw new TypeError("options.chunkSize, when provided, must be a positive integer")}},Be=class{constructor(){this.pos=0,n(this,d,new Uint8Array(8)),n(this,f,new DataView(r(this,d).buffer)),this.offsets=new WeakMap}seek(e){this.pos=e}writeU32(e){r(this,f).setUint32(0,e,!1),this.write(r(this,d).subarray(0,4))}writeU64(e){r(this,f).setUint32(0,Math.floor(e/2**32),!1),r(this,f).setUint32(4,e,!1),this.write(r(this,d).subarray(0,8))}writeAscii(e){for(let t=0;t<e.length;t++)r(this,f).setUint8(t%8,e.charCodeAt(t)),t%8==7&&this.write(r(this,d));e.length%8!=0&&this.write(r(this,d).subarray(0,e.length%8))}writeBox(e){if(this.offsets.set(e,this.pos),e.contents&&!e.children)this.writeBoxHeader(e,e.size??e.contents.byteLength+8),this.write(e.contents);else{let t=this.pos;if(this.writeBoxHeader(e,0),e.contents&&this.write(e.contents),e.children)for(let t of e.children)t&&this.writeBox(t);let i=this.pos,s=e.size??i-t;this.seek(t),this.writeBoxHeader(e,s),this.seek(i)}}writeBoxHeader(e,t){this.writeU32(e.largeSize?1:t),this.writeAscii(e.type),e.largeSize&&this.writeU64(t)}measureBoxHeader(e){return 8+(e.largeSize?8:0)}patchBox(e){let t=this.pos;this.seek(this.offsets.get(e)),this.writeBox(e),this.seek(t)}measureBox(e){if(e.contents&&!e.children){return this.measureBoxHeader(e)+e.contents.byteLength}{let t=this.measureBoxHeader(e);if(e.contents&&(t+=e.contents.byteLength),e.children)for(let i of e.children)i&&(t+=this.measureBox(i));return t}}};d=new WeakMap,f=new WeakMap;var Ue=class extends Be{constructor(e){super(),n(this,w),n(this,u,void 0),n(this,m,new ArrayBuffer(65536)),n(this,p,new Uint8Array(r(this,m))),n(this,c,0),o(this,u,e)}write(e){h(this,w,g).call(this,this.pos+e.byteLength),r(this,p).set(e,this.pos),this.pos+=e.byteLength,o(this,c,Math.max(r(this,c),this.pos))}finalize(){h(this,w,g).call(this,this.pos),r(this,u).buffer=r(this,m).slice(0,Math.max(r(this,c),this.pos))}};u=new WeakMap,m=new WeakMap,p=new WeakMap,c=new WeakMap,w=new WeakSet,g=function(e){let t=r(this,m).byteLength;for(;t<e;)t*=2;if(t===r(this,m).byteLength)return;let i=new ArrayBuffer(t),s=new Uint8Array(i);s.set(r(this,p),0),o(this,m,i),o(this,p,s)};var De,je,Re,Ie,Ne,Ve,Fe,Le,$e,Pe,He,_e,qe,Ge=class extends Be{constructor(e){super(),n(this,Ve),n(this,Le),n(this,Pe),n(this,_e),n(this,De,void 0),n(this,je,[]),n(this,Re,void 0),n(this,Ie,void 0),n(this,Ne,[]),o(this,De,e),o(this,Re,e.options?.chunked??!1),o(this,Ie,e.options?.chunkSize??16777216)}write(e){r(this,je).push({data:e.slice(),start:this.pos}),this.pos+=e.byteLength}flush(){if(0===r(this,je).length)return;let e=[],t=[...r(this,je)].sort((e,t)=>e.start-t.start);e.push({start:t[0].start,size:t[0].data.byteLength});for(let i=1;i<t.length;i++){let s=e[e.length-1],a=t[i];a.start<=s.start+s.size?s.size=Math.max(s.size,a.start+a.data.byteLength-s.start):e.push({start:a.start,size:a.data.byteLength})}for(let t of e){t.data=new Uint8Array(t.size);for(let e of r(this,je))t.start<=e.start&&e.start<t.start+t.size&&t.data.set(e.data,e.start-t.start);r(this,Re)?(h(this,Ve,Fe).call(this,t.data,t.start),h(this,_e,qe).call(this)):r(this,De).options.onData?.(t.data,t.start)}r(this,je).length=0}finalize(){r(this,Re)&&h(this,_e,qe).call(this,!0)}};De=new WeakMap,je=new WeakMap,Re=new WeakMap,Ie=new WeakMap,Ne=new WeakMap,Ve=new WeakSet,Fe=function(e,t){let i=r(this,Ne).findIndex(e=>e.start<=t&&t<e.start+r(this,Ie));-1===i&&(i=h(this,Pe,He).call(this,t));let s=r(this,Ne)[i],a=t-s.start,n=e.subarray(0,Math.min(r(this,Ie)-a,e.byteLength));s.data.set(n,a);let o={start:a,end:a+n.byteLength};if(h(this,Le,$e).call(this,s,o),0===s.written[0].start&&s.written[0].end===r(this,Ie)&&(s.shouldFlush=!0),r(this,Ne).length>2){for(let e=0;e<r(this,Ne).length-1;e++)r(this,Ne)[e].shouldFlush=!0;h(this,_e,qe).call(this)}n.byteLength<e.byteLength&&h(this,Ve,Fe).call(this,e.subarray(n.byteLength),t+n.byteLength)},Le=new WeakSet,$e=function(e,t){let i=0,s=e.written.length-1,a=-1;for(;i<=s;){let r=Math.floor(i+(s-i+1)/2);e.written[r].start<=t.start?(i=r+1,a=r):s=r-1}for(e.written.splice(a+1,0,t),(-1===a||e.written[a].end<t.start)&&a++;a<e.written.length-1&&e.written[a].end>=e.written[a+1].start;)e.written[a].end=Math.max(e.written[a].end,e.written[a+1].end),e.written.splice(a+1,1)},Pe=new WeakSet,He=function(e){let t={start:Math.floor(e/r(this,Ie))*r(this,Ie),data:new Uint8Array(r(this,Ie)),written:[],shouldFlush:!1};return r(this,Ne).push(t),r(this,Ne).sort((e,t)=>e.start-t.start),r(this,Ne).indexOf(t)},_e=new WeakSet,qe=function(e=!1){for(let t=0;t<r(this,Ne).length;t++){let i=r(this,Ne)[t];if(i.shouldFlush||e){for(let e of i.written)r(this,De).options.onData?.(i.data.subarray(e.start,e.end),i.start+e.start);r(this,Ne).splice(t--,1)}}};var Je,Ke,Qe,Xe,Ye,Ze,et,tt,it,st,at,rt,nt,ot,ht,lt,dt,ft,ut,mt,pt,ct,wt,gt,bt,yt,kt,Tt,Ct,vt,St,xt,zt,Et,At,Mt,Wt,Ot=class extends Ge{constructor(e){super(new We({onData:(t,i)=>e.stream.write({type:"write",data:t,position:i}),chunked:!0,chunkSize:e.options?.chunkSize}))}},Bt=1e3,Ut=["avc","hevc","vp9","av1"],Dt=["aac","opus"],jt=["strict","offset","cross-track-offset"],Rt=class{constructor(e){if(n(this,nt),n(this,ht),n(this,dt),n(this,ut),n(this,pt),n(this,wt),n(this,bt),n(this,kt),n(this,Ct),n(this,St),n(this,zt),n(this,At),n(this,Je,void 0),n(this,Ke,void 0),n(this,Qe,void 0),n(this,Xe,void 0),n(this,Ye,null),n(this,Ze,null),n(this,et,Math.floor(Date.now()/1e3)+2082844800),n(this,tt,[]),n(this,it,1),n(this,st,[]),n(this,at,[]),n(this,rt,!1),h(this,nt,ot).call(this,e),e.video=j(e.video),e.audio=j(e.audio),e.fastStart=j(e.fastStart),this.target=e.target,o(this,Je,{firstTimestampBehavior:"strict",...e}),e.target instanceof Me)o(this,Ke,new Ue(e.target));else if(e.target instanceof We)o(this,Ke,new Ge(e.target));else{if(!(e.target instanceof Oe))throw new Error(`Invalid target: ${e.target}`);o(this,Ke,new Ot(e.target))}h(this,ut,mt).call(this),h(this,ht,lt).call(this)}addVideoChunk(e,t,i,s){if(!(e instanceof EncodedVideoChunk))throw new TypeError("addVideoChunk's first argument (sample) must be of type EncodedVideoChunk.");if(t&&"object"!=typeof t)throw new TypeError("addVideoChunk's second argument (meta), when provided, must be an object.");if(void 0!==i&&(!Number.isFinite(i)||i<0))throw new TypeError("addVideoChunk's third argument (timestamp), when provided, must be a non-negative real number.");if(void 0!==s&&!Number.isFinite(s))throw new TypeError("addVideoChunk's fourth argument (compositionTimeOffset), when provided, must be a real number.");let a=new Uint8Array(e.byteLength);e.copyTo(a),this.addVideoChunkRaw(a,e.type,i??e.timestamp,e.duration,t,s)}addVideoChunkRaw(e,t,i,s,a,n){if(!(e instanceof Uint8Array))throw new TypeError("addVideoChunkRaw's first argument (data) must be an instance of Uint8Array.");if("key"!==t&&"delta"!==t)throw new TypeError("addVideoChunkRaw's second argument (type) must be either 'key' or 'delta'.");if(!Number.isFinite(i)||i<0)throw new TypeError("addVideoChunkRaw's third argument (timestamp) must be a non-negative real number.");if(!Number.isFinite(s)||s<0)throw new TypeError("addVideoChunkRaw's fourth argument (duration) must be a non-negative real number.");if(a&&"object"!=typeof a)throw new TypeError("addVideoChunkRaw's fifth argument (meta), when provided, must be an object.");if(void 0!==n&&!Number.isFinite(n))throw new TypeError("addVideoChunkRaw's sixth argument (compositionTimeOffset), when provided, must be a real number.");if(h(this,At,Mt).call(this),!r(this,Je).video)throw new Error("No video track declared.");if("object"==typeof r(this,Je).fastStart&&r(this,Ye).samples.length===r(this,Je).fastStart.expectedVideoChunks)throw new Error(`Cannot add more video chunks than specified in 'fastStart' (${r(this,Je).fastStart.expectedVideoChunks}).`);let o=h(this,wt,gt).call(this,r(this,Ye),e,t,i,s,a,n);if("fragmented"===r(this,Je).fastStart&&r(this,Ze)){for(;r(this,at).length>0&&r(this,at)[0].decodeTimestamp<=o.decodeTimestamp;){let e=r(this,at).shift();h(this,bt,yt).call(this,r(this,Ze),e)}o.decodeTimestamp<=r(this,Ze).lastDecodeTimestamp?h(this,bt,yt).call(this,r(this,Ye),o):r(this,st).push(o)}else h(this,bt,yt).call(this,r(this,Ye),o)}addAudioChunk(e,t,i){if(!(e instanceof EncodedAudioChunk))throw new TypeError("addAudioChunk's first argument (sample) must be of type EncodedAudioChunk.");if(t&&"object"!=typeof t)throw new TypeError("addAudioChunk's second argument (meta), when provided, must be an object.");if(void 0!==i&&(!Number.isFinite(i)||i<0))throw new TypeError("addAudioChunk's third argument (timestamp), when provided, must be a non-negative real number.");let s=new Uint8Array(e.byteLength);e.copyTo(s),this.addAudioChunkRaw(s,e.type,i??e.timestamp,e.duration,t)}addAudioChunkRaw(e,t,i,s,a){if(!(e instanceof Uint8Array))throw new TypeError("addAudioChunkRaw's first argument (data) must be an instance of Uint8Array.");if("key"!==t&&"delta"!==t)throw new TypeError("addAudioChunkRaw's second argument (type) must be either 'key' or 'delta'.");if(!Number.isFinite(i)||i<0)throw new TypeError("addAudioChunkRaw's third argument (timestamp) must be a non-negative real number.");if(!Number.isFinite(s)||s<0)throw new TypeError("addAudioChunkRaw's fourth argument (duration) must be a non-negative real number.");if(a&&"object"!=typeof a)throw new TypeError("addAudioChunkRaw's fifth argument (meta), when provided, must be an object.");if(h(this,At,Mt).call(this),!r(this,Je).audio)throw new Error("No audio track declared.");if("object"==typeof r(this,Je).fastStart&&r(this,Ze).samples.length===r(this,Je).fastStart.expectedAudioChunks)throw new Error(`Cannot add more audio chunks than specified in 'fastStart' (${r(this,Je).fastStart.expectedAudioChunks}).`);let n=h(this,wt,gt).call(this,r(this,Ze),e,t,i,s,a);if("fragmented"===r(this,Je).fastStart&&r(this,Ye)){for(;r(this,st).length>0&&r(this,st)[0].decodeTimestamp<=n.decodeTimestamp;){let e=r(this,st).shift();h(this,bt,yt).call(this,r(this,Ye),e)}n.decodeTimestamp<=r(this,Ye).lastDecodeTimestamp?h(this,bt,yt).call(this,r(this,Ze),n):r(this,at).push(n)}else h(this,bt,yt).call(this,r(this,Ze),n)}finalize(){if(r(this,rt))throw new Error("Cannot finalize a muxer more than once.");if("fragmented"===r(this,Je).fastStart){for(let e of r(this,st))h(this,bt,yt).call(this,r(this,Ye),e);for(let e of r(this,at))h(this,bt,yt).call(this,r(this,Ze),e);h(this,St,xt).call(this,!1)}else r(this,Ye)&&h(this,Ct,vt).call(this,r(this,Ye)),r(this,Ze)&&h(this,Ct,vt).call(this,r(this,Ze));let e=[r(this,Ye),r(this,Ze)].filter(Boolean);if("in-memory"===r(this,Je).fastStart){let t;for(let i=0;i<2;i++){let i=F(e,r(this,et)),s=r(this,Ke).measureBox(i);t=r(this,Ke).measureBox(r(this,Xe));let a=r(this,Ke).pos+s+t;for(let e of r(this,tt)){e.offset=a;for(let{data:i}of e.samples)a+=i.byteLength,t+=i.byteLength}if(a<2**32)break;t>=2**32&&(r(this,Xe).largeSize=!0)}let i=F(e,r(this,et));r(this,Ke).writeBox(i),r(this,Xe).size=t,r(this,Ke).writeBox(r(this,Xe));for(let e of r(this,tt))for(let t of e.samples)r(this,Ke).write(t.data),t.data=null}else if("fragmented"===r(this,Je).fastStart){let t=r(this,Ke).pos,i=(e=>I("mfra",null,[...e.map(Ce),ve()]))(e);r(this,Ke).writeBox(i);let s=r(this,Ke).pos-t;r(this,Ke).seek(r(this,Ke).pos-4),r(this,Ke).writeU32(s)}else{let t=r(this,Ke).offsets.get(r(this,Xe)),i=r(this,Ke).pos-t;r(this,Xe).size=i,r(this,Xe).largeSize=i>=2**32,r(this,Ke).patchBox(r(this,Xe));let s=F(e,r(this,et));if("object"==typeof r(this,Je).fastStart){r(this,Ke).seek(r(this,Qe)),r(this,Ke).writeBox(s);let e=t-r(this,Ke).pos;r(this,Ke).writeBox({type:"free",size:e})}else r(this,Ke).writeBox(s)}h(this,zt,Et).call(this),r(this,Ke).finalize(),o(this,rt,!0)}};return Je=new WeakMap,Ke=new WeakMap,Qe=new WeakMap,Xe=new WeakMap,Ye=new WeakMap,Ze=new WeakMap,et=new WeakMap,tt=new WeakMap,it=new WeakMap,st=new WeakMap,at=new WeakMap,rt=new WeakMap,nt=new WeakSet,ot=function(e){if("object"!=typeof e)throw new TypeError("The muxer requires an options object to be passed to its constructor.");if(!(e.target instanceof Ae))throw new TypeError("The target must be provided and an instance of Target.");if(e.video){if(!Ut.includes(e.video.codec))throw new TypeError(`Unsupported video codec: ${e.video.codec}`);if(!Number.isInteger(e.video.width)||e.video.width<=0)throw new TypeError(`Invalid video width: ${e.video.width}. Must be a positive integer.`);if(!Number.isInteger(e.video.height)||e.video.height<=0)throw new TypeError(`Invalid video height: ${e.video.height}. Must be a positive integer.`);const t=e.video.rotation;if("number"==typeof t&&![0,90,180,270].includes(t))throw new TypeError(`Invalid video rotation: ${t}. Has to be 0, 90, 180 or 270.`);if(Array.isArray(t)&&(9!==t.length||t.some(e=>"number"!=typeof e)))throw new TypeError(`Invalid video transformation matrix: ${t.join()}`);if(void 0!==e.video.frameRate&&(!Number.isInteger(e.video.frameRate)||e.video.frameRate<=0))throw new TypeError(`Invalid video frame rate: ${e.video.frameRate}. Must be a positive integer.`)}if(e.audio){if(!Dt.includes(e.audio.codec))throw new TypeError(`Unsupported audio codec: ${e.audio.codec}`);if(!Number.isInteger(e.audio.numberOfChannels)||e.audio.numberOfChannels<=0)throw new TypeError(`Invalid number of audio channels: ${e.audio.numberOfChannels}. Must be a positive integer.`);if(!Number.isInteger(e.audio.sampleRate)||e.audio.sampleRate<=0)throw new TypeError(`Invalid audio sample rate: ${e.audio.sampleRate}. Must be a positive integer.`)}if(e.firstTimestampBehavior&&!jt.includes(e.firstTimestampBehavior))throw new TypeError(`Invalid first timestamp behavior: ${e.firstTimestampBehavior}`);if("object"==typeof e.fastStart){if(e.video){if(void 0===e.fastStart.expectedVideoChunks)throw new TypeError("'fastStart' is an object but is missing property 'expectedVideoChunks'.");if(!Number.isInteger(e.fastStart.expectedVideoChunks)||e.fastStart.expectedVideoChunks<0)throw new TypeError("'expectedVideoChunks' must be a non-negative integer.")}if(e.audio){if(void 0===e.fastStart.expectedAudioChunks)throw new TypeError("'fastStart' is an object but is missing property 'expectedAudioChunks'.");if(!Number.isInteger(e.fastStart.expectedAudioChunks)||e.fastStart.expectedAudioChunks<0)throw new TypeError("'expectedAudioChunks' must be a non-negative integer.")}}else if(![!1,"in-memory","fragmented"].includes(e.fastStart))throw new TypeError("'fastStart' option must be false, 'in-memory', 'fragmented' or an object.");if(void 0!==e.minFragmentDuration&&(!Number.isFinite(e.minFragmentDuration)||e.minFragmentDuration<0))throw new TypeError("'minFragmentDuration' must be a non-negative number.")},ht=new WeakSet,lt=function(){var e;if(r(this,Ke).writeBox((e={holdsAvc:"avc"===r(this,Je).video?.codec,fragmented:"fragmented"===r(this,Je).fastStart}).fragmented?I("ftyp",[A("iso5"),v(512),A("iso5"),A("iso6"),A("mp41")]):I("ftyp",[A("isom"),v(512),A("isom"),e.holdsAvc?A("avc1"):[],A("mp41")])),o(this,Qe,r(this,Ke).pos),"in-memory"===r(this,Je).fastStart)o(this,Xe,V(!1));else if("fragmented"===r(this,Je).fastStart);else{if("object"==typeof r(this,Je).fastStart){let e=h(this,dt,ft).call(this);r(this,Ke).seek(r(this,Ke).pos+e)}o(this,Xe,V(!0)),r(this,Ke).writeBox(r(this,Xe))}h(this,zt,Et).call(this)},dt=new WeakSet,ft=function(){if("object"!=typeof r(this,Je).fastStart)return;let e=0,t=[r(this,Je).fastStart.expectedVideoChunks,r(this,Je).fastStart.expectedAudioChunks];for(let i of t)i&&(e+=8*Math.ceil(2/3*i),e+=4*i,e+=12*Math.ceil(2/3*i),e+=4*i,e+=8*i);return e+=4096,e},ut=new WeakSet,mt=function(){if(r(this,Je).video&&o(this,Ye,{id:1,info:{type:"video",codec:r(this,Je).video.codec,width:r(this,Je).video.width,height:r(this,Je).video.height,rotation:r(this,Je).video.rotation??0,decoderConfig:null},timescale:r(this,Je).video.frameRate??57600,samples:[],finalizedChunks:[],currentChunk:null,firstDecodeTimestamp:void 0,lastDecodeTimestamp:-1,timeToSampleTable:[],compositionTimeOffsetTable:[],lastTimescaleUnits:null,lastSample:null,compactlyCodedChunkTable:[]}),r(this,Je).audio&&(o(this,Ze,{id:r(this,Je).video?2:1,info:{type:"audio",codec:r(this,Je).audio.codec,numberOfChannels:r(this,Je).audio.numberOfChannels,sampleRate:r(this,Je).audio.sampleRate,decoderConfig:null},timescale:r(this,Je).audio.sampleRate,samples:[],finalizedChunks:[],currentChunk:null,firstDecodeTimestamp:void 0,lastDecodeTimestamp:-1,timeToSampleTable:[],compositionTimeOffsetTable:[],lastTimescaleUnits:null,lastSample:null,compactlyCodedChunkTable:[]}),"aac"===r(this,Je).audio.codec)){let e=h(this,pt,ct).call(this,2,r(this,Je).audio.sampleRate,r(this,Je).audio.numberOfChannels);r(this,Ze).info.decoderConfig={codec:r(this,Je).audio.codec,description:e,numberOfChannels:r(this,Je).audio.numberOfChannels,sampleRate:r(this,Je).audio.sampleRate}}},pt=new WeakSet,ct=function(e,t,i){let s=[96e3,88200,64e3,48e3,44100,32e3,24e3,22050,16e3,12e3,11025,8e3,7350].indexOf(t),a=i,r="";r+=e.toString(2).padStart(5,"0"),r+=s.toString(2).padStart(4,"0"),15===s&&(r+=t.toString(2).padStart(24,"0")),r+=a.toString(2).padStart(4,"0");let n=8*Math.ceil(r.length/8);r=r.padEnd(n,"0");let o=new Uint8Array(r.length/8);for(let e=0;e<r.length;e+=8)o[e/8]=parseInt(r.slice(e,e+8),2);return o},wt=new WeakSet,gt=function(e,t,i,s,a,r,n){let o=s/1e6,l=(s-(n??0))/1e6,d=a/1e6,f=h(this,kt,Tt).call(this,o,l,e);return o=f.presentationTimestamp,l=f.decodeTimestamp,r?.decoderConfig&&(null===e.info.decoderConfig?e.info.decoderConfig=r.decoderConfig:Object.assign(e.info.decoderConfig,r.decoderConfig)),{presentationTimestamp:o,decodeTimestamp:l,duration:d,data:t,size:t.byteLength,type:i,timescaleUnitsToNextSample:O(d,e.timescale)}},bt=new WeakSet,yt=function(e,t){"fragmented"!==r(this,Je).fastStart&&e.samples.push(t);const i=O(t.presentationTimestamp-t.decodeTimestamp,e.timescale);if(null!==e.lastTimescaleUnits){let s=O(t.decodeTimestamp,e.timescale,!1),a=Math.round(s-e.lastTimescaleUnits);if(e.lastTimescaleUnits+=a,e.lastSample.timescaleUnitsToNextSample=a,"fragmented"!==r(this,Je).fastStart){let t=M(e.timeToSampleTable);1===t.sampleCount?(t.sampleDelta=a,t.sampleCount++):t.sampleDelta===a?t.sampleCount++:(t.sampleCount--,e.timeToSampleTable.push({sampleCount:2,sampleDelta:a}));const s=M(e.compositionTimeOffsetTable);s.sampleCompositionTimeOffset===i?s.sampleCount++:e.compositionTimeOffsetTable.push({sampleCount:1,sampleCompositionTimeOffset:i})}}else e.lastTimescaleUnits=0,"fragmented"!==r(this,Je).fastStart&&(e.timeToSampleTable.push({sampleCount:1,sampleDelta:O(t.duration,e.timescale)}),e.compositionTimeOffsetTable.push({sampleCount:1,sampleCompositionTimeOffset:i}));e.lastSample=t;let s=!1;if(e.currentChunk){let i=t.presentationTimestamp-e.currentChunk.startTimestamp;if("fragmented"===r(this,Je).fastStart){let a=r(this,Ye)??r(this,Ze);const n=r(this,Je).minFragmentDuration??1;e===a&&"key"===t.type&&i>=n&&(s=!0,h(this,St,xt).call(this))}else s=i>=.5}else s=!0;s&&(e.currentChunk&&h(this,Ct,vt).call(this,e),e.currentChunk={startTimestamp:t.presentationTimestamp,samples:[]}),e.currentChunk.samples.push(t)},kt=new WeakSet,Tt=function(e,t,i){const s="strict"===r(this,Je).firstTimestampBehavior,a=-1===i.lastDecodeTimestamp;if(s&&a&&0!==t)throw new Error(`The first chunk for your media track must have a timestamp of 0 (received DTS=${t}).Non-zero first timestamps are often caused by directly piping frames or audio data from a MediaStreamTrack into the encoder. Their timestamps are typically relative to the age of thedocument, which is probably what you want.\n\nIf you want to offset all timestamps of a track such that the first one is zero, set firstTimestampBehavior: 'offset' in the options.\n`);if("offset"===r(this,Je).firstTimestampBehavior||"cross-track-offset"===r(this,Je).firstTimestampBehavior){let s;void 0===i.firstDecodeTimestamp&&(i.firstDecodeTimestamp=t),s="offset"===r(this,Je).firstTimestampBehavior?i.firstDecodeTimestamp:Math.min(r(this,Ye)?.firstDecodeTimestamp??1/0,r(this,Ze)?.firstDecodeTimestamp??1/0),t-=s,e-=s}if(t<i.lastDecodeTimestamp)throw new Error(`Timestamps must be monotonically increasing (DTS went from ${1e6*i.lastDecodeTimestamp} to ${1e6*t}).`);return i.lastDecodeTimestamp=t,{presentationTimestamp:e,decodeTimestamp:t}},Ct=new WeakSet,vt=function(e){if("fragmented"===r(this,Je).fastStart)throw new Error("Can't finalize individual chunks if 'fastStart' is set to 'fragmented'.");if(e.currentChunk)if(e.finalizedChunks.push(e.currentChunk),r(this,tt).push(e.currentChunk),0!==e.compactlyCodedChunkTable.length&&M(e.compactlyCodedChunkTable).samplesPerChunk===e.currentChunk.samples.length||e.compactlyCodedChunkTable.push({firstChunk:e.finalizedChunks.length,samplesPerChunk:e.currentChunk.samples.length}),"in-memory"!==r(this,Je).fastStart){e.currentChunk.offset=r(this,Ke).pos;for(let t of e.currentChunk.samples)r(this,Ke).write(t.data),t.data=null;h(this,zt,Et).call(this)}else e.currentChunk.offset=0},St=new WeakSet,xt=function(e=!0){if("fragmented"!==r(this,Je).fastStart)throw new Error("Can't finalize a fragment unless 'fastStart' is set to 'fragmented'.");let t=[r(this,Ye),r(this,Ze)].filter(e=>e&&e.currentChunk);if(0===t.length)return;let i=(s=this,a=it,{set _(e){o(s,a,e,n)},get _(){return r(s,a,l)}})._++;var s,a,n,l;if(1===i){let e=F(t,r(this,et),!0);r(this,Ke).writeBox(e)}let d=r(this,Ke).pos,f=ce(i,t);r(this,Ke).writeBox(f);{let e=V(!1),i=0;for(let e of t)for(let t of e.currentChunk.samples)i+=t.size;let s=r(this,Ke).measureBox(e)+i;s>=2**32&&(e.largeSize=!0,s=r(this,Ke).measureBox(e)+i),e.size=s,r(this,Ke).writeBox(e)}for(let e of t){e.currentChunk.offset=r(this,Ke).pos,e.currentChunk.moofOffset=d;for(let t of e.currentChunk.samples)r(this,Ke).write(t.data),t.data=null}let u=r(this,Ke).pos;r(this,Ke).seek(r(this,Ke).offsets.get(f));let m=ce(i,t);r(this,Ke).writeBox(m),r(this,Ke).seek(u);for(let e of t)e.finalizedChunks.push(e.currentChunk),r(this,tt).push(e.currentChunk),e.currentChunk=null;e&&h(this,zt,Et).call(this)},zt=new WeakSet,Et=function(){r(this,Ke)instanceof Ge&&r(this,Ke).flush()},At=new WeakSet,Mt=function(){if(r(this,rt))throw new Error("Cannot add new video or audio chunks after the file has been finalized.")},Wt=l,((a,r,n,o)=>{if(r&&"object"==typeof r||"function"==typeof r)for(let h of i(r))s.call(a,h)||h===n||e(a,h,{get:()=>r[h],enumerable:!(o=t(r,h))||o.enumerable});return a})(e({},"__esModule",{value:!0}),Wt)})();"object"==typeof module&&"object"==typeof module.exports&&Object.assign(module.exports,Mp4Muxer);
  const HIEU_UNG_MF = [
    ['nhiptho', 'Nhịp thở nhẹ'], ['anhsang', 'Ánh sáng lướt nhẹ'], ['hatsang', 'Hạt sáng bay nhẹ'],
    ['lapanh', 'Bụi vàng lấp lánh'], ['domdom', 'Đom đóm bay lượn'], ['khoitram', 'Khói trầm bay nhẹ'],
    ['hatroi', 'Hạt vàng rơi nhẹ'], ['bokeh', 'Đốm sáng mờ trôi'],
  ];
  const ngauMF = (i, n) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); };
  const HAT_MF = Array.from({ length: 26 }, (_, i) => ({ x: ngauMF(i, 1), y: ngauMF(i, 2), v: 0.025 + ngauMF(i, 3) * 0.035, kt: 1.6 + ngauMF(i, 4) * 2.4, pha: ngauMF(i, 5) * 6.28, lac: 8 + ngauMF(i, 6) * 14 }));
  const LAP_MF = Array.from({ length: 28 }, (_, i) => ({ x: 0.04 + ngauMF(i + 50, 1) * 0.92, y: 0.04 + ngauMF(i + 50, 2) * 0.92, w: 0.7 + ngauMF(i + 50, 3) * 1.1, pha: ngauMF(i + 50, 4) * 6.28, kt: 3 + ngauMF(i + 50, 5) * 4 }));
  const DOM_MF = Array.from({ length: 13 }, (_, i) => ({ x: 0.08 + ngauMF(i + 90, 1) * 0.84, y: 0.1 + ngauMF(i + 90, 2) * 0.8, f1: 0.18 + ngauMF(i + 90, 3) * 0.2, f2: 0.14 + ngauMF(i + 90, 4) * 0.2, p1: ngauMF(i + 90, 5) * 6.28, p2: ngauMF(i + 90, 6) * 6.28, nhay: 0.8 + ngauMF(i + 90, 7) * 0.9 }));
  const KHOI_MF = Array.from({ length: 7 }, (_, i) => ({ x: 0.1 + ngauMF(i + 130, 1) * 0.8, chu: 7 + ngauMF(i + 130, 2) * 4, lech: ngauMF(i + 130, 3), lac: 0.03 + ngauMF(i + 130, 4) * 0.05, pha: ngauMF(i + 130, 5) * 6.28 }));
  const ROI_MF = Array.from({ length: 24 }, (_, i) => ({ x: ngauMF(i + 170, 1), y: ngauMF(i + 170, 2), v: 0.03 + ngauMF(i + 170, 3) * 0.035, kt: 2 + ngauMF(i + 170, 4) * 2.6, pha: ngauMF(i + 170, 5) * 6.28, lac: 10 + ngauMF(i + 170, 6) * 18 }));
  const BOK_MF = Array.from({ length: 9 }, (_, i) => { const canh = i % 2 === 0; return { x: canh ? (ngauMF(i + 210, 1) < 0.5 ? 0.02 + ngauMF(i + 210, 2) * 0.16 : 0.82 + ngauMF(i + 210, 2) * 0.16) : ngauMF(i + 210, 2), y: ngauMF(i + 210, 3), r: 45 + ngauMF(i + 210, 4) * 70, vx: (ngauMF(i + 210, 5) - 0.5) * 0.008, vy: -0.004 - ngauMF(i + 210, 6) * 0.008, pha: ngauMF(i + 210, 7) * 6.28 }; });
  function dotMF(g, x, y, r, mau, a) {
    if (a <= 0.002) return;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${mau},${a.toFixed(3)})`); gr.addColorStop(1, `rgba(${mau},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function veKhungMF(g, nen, bm, W, H, t, hu, giay) {
    giay = giay || 15;
    const s = t * giay; // giây hiện tại
    const st = s - 1; // thời gian tính từ lúc hiệu ứng bắt đầu (sau giây thứ 1)
    const vao = Math.max(0, Math.min(1, st / 1.2)); // hiệu ứng "vào" từ từ trong 1,2 giây
    const em = (x) => x * x * (3 - 2 * x);
    const fit = Math.min(W / bm.width, H / bm.height);
    let k = fit;
    if (hu === 'nhiptho') k = fit * (1 + 0.015 * (1 - Math.cos(st * Math.PI * 2 / 5)) * vao); // 0 → 3% → 0, chu kỳ 5 giây
    if (s < 1) k = fit;
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.drawImage(nen, 0, 0);
    const fx = (W - bm.width * fit) / 2, fy = (H - bm.height * fit) / 2, fw = bm.width * fit, fh = bm.height * fit;
    g.save(); g.beginPath(); g.rect(fx, fy, fw, fh); g.clip();
    const w = bm.width * k, h = bm.height * k; g.drawImage(bm, (W - w) / 2, (H - h) / 2, w, h);
    if (s >= 1) {
      g.globalCompositeOperation = 'screen';
      if (hu === 'anhsang') { // 1 dải sáng rất mờ, lướt trọn từ trái sang phải, từ giây 2 đến giây ~9
        const p = (s - 2) / 7;
        if (p > 0 && p < 1) {
          const goc = 0.35, bang = 260; const tran = Math.tan(goc) * H / 2 + bang;
          const cx = fx - tran + p * (fw + 2 * tran); const nx = Math.cos(goc), ny = -Math.sin(goc);
          const gr = g.createLinearGradient(cx - nx * bang, H / 2 - ny * bang, cx + nx * bang, H / 2 + ny * bang);
          const doSang = 0.13 * Math.sin(p * Math.PI); // sáng dần rồi mờ dần, không bị cắt ngang
          gr.addColorStop(0, 'rgba(255,240,205,0)'); gr.addColorStop(0.5, `rgba(255,240,205,${doSang.toFixed(3)})`); gr.addColorStop(1, 'rgba(255,240,205,0)');
          g.fillStyle = gr; g.fillRect(fx, fy, fw, fh);
        }
      } else if (hu === 'hatsang') { // vài hạt sáng vàng nhỏ bay lên chậm, rất mờ
        for (const p of HAT_MF) {
          const y = (((p.y - st * p.v) % 1) + 1) % 1; const x = p.x + Math.sin(st * 0.8 + p.pha) * p.lac / W;
          const a = 0.33 * vao * Math.min(1, y * 6, (1 - y) * 6) * (0.65 + 0.35 * Math.sin(s * 2 + p.pha));
          dotMF(g, fx + x * fw, fy + y * fh, p.kt * 3, '255,225,150', a);
        }
      } else if (hu === 'lapanh') { // bụi vàng đứng yên, lấp lánh lúc ẩn lúc hiện như kim tuyến
        for (const p of LAP_MF) {
          const nh = Math.pow(Math.max(0, Math.sin(st * p.w * 1.6 + p.pha)), 6) * vao; if (nh < 0.01) continue;
          const px = fx + p.x * fw, py = fy + p.y * fh;
          dotMF(g, px, py, p.kt * 3.2, '255,228,160', 0.42 * nh);
          g.strokeStyle = `rgba(255,240,200,${(0.38 * nh).toFixed(3)})`; g.lineWidth = 1.2; const d = p.kt * 3.2 * (0.7 + 0.5 * nh);
          g.beginPath(); g.moveTo(px - d, py); g.lineTo(px + d, py); g.moveTo(px, py - d); g.lineTo(px, py + d); g.stroke();
        }
      } else if (hu === 'domdom') { // vài đom đóm vàng ấm bay lượn chậm, chớp sáng dịu
        for (const p of DOM_MF) {
          const x = p.x + Math.sin(st * p.f1 + p.p1) * 0.05 + Math.sin(st * p.f1 * 2.3 + p.p2) * 0.015;
          const y = p.y + Math.sin(st * p.f2 + p.p2) * 0.04 - st * 0.004;
          const a = vao * (0.16 + 0.2 * (0.5 + 0.5 * Math.sin(st * p.nhay * 2 + p.p1)));
          const px = fx + x * fw, py = fy + y * fh;
          dotMF(g, px, py, 22, '255,214,120', a * 0.55); dotMF(g, px, py, 6, '255,245,200', a * 1.6);
        }
      } else if (hu === 'khoitram') { // vài làn khói trầm rất mờ bốc lên từ đáy ảnh rồi tan dần
        for (const p of KHOI_MF) {
          const q = (((st / p.chu + p.lech) % 1) + 1) % 1; // 0..1 vòng đời 1 làn khói
          const y = 1.08 - q * 0.6, x = p.x + Math.sin(st * 0.45 + p.pha) * p.lac + q * 0.04;
          const a = 0.075 * vao * Math.sin(q * Math.PI); const r = (70 + q * 200) * (fw / 1080);
          dotMF(g, fx + x * fw, fy + y * fh, r, '235,225,215', a);
          dotMF(g, fx + (x + 0.03 * Math.sin(st + p.pha)) * fw, fy + (y + 0.04) * fh, r * 0.6, '235,225,215', a * 0.8);
        }
      } else if (hu === 'hatroi') { // hạt vàng nhỏ rơi chậm từ trên xuống, đung đưa nhẹ
        for (const p of ROI_MF) {
          const y = (((p.y + st * p.v) % 1) + 1) % 1; const x = p.x + Math.sin(st * 0.9 + p.pha) * p.lac / W;
          const a = 0.34 * vao * Math.min(1, y * 6, (1 - y) * 6) * (0.7 + 0.3 * Math.sin(s * 1.7 + p.pha));
          dotMF(g, fx + x * fw, fy + y * fh, p.kt * 3, '255,215,130', a);
        }
      } else if (hu === 'bokeh') { // vài đốm sáng to, rất mờ (như ống kính nhoè) trôi chậm, chủ yếu ở 2 bên
        for (const p of BOK_MF) {
          const x = p.x + st * p.vx + Math.sin(st * 0.3 + p.pha) * 0.01; const y = (((p.y + st * p.vy) % 1.2) + 1.2) % 1.2 - 0.1;
          const a = vao * (0.05 + 0.025 * Math.sin(st * 0.7 + p.pha));
          const px = fx + x * fw, py = fy + y * fh, r = p.r * (fw / 1080);
          const gr = g.createRadialGradient(px, py, r * 0.55, px, py, r); gr.addColorStop(0, `rgba(255,220,160,${a.toFixed(3)})`); gr.addColorStop(0.85, `rgba(255,220,160,${(a * 0.8).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,220,160,0)');
          g.fillStyle = gr; g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
        }
      }
      g.globalCompositeOperation = 'source-over';
    }
    g.restore();
    if (t > 0.95) { g.fillStyle = `rgba(0,0,0,${((t - 0.95) / 0.05 * 0.25).toFixed(3)})`; g.fillRect(0, 0, W, H); } // tối rất nhẹ ở cuối lúc nhạc nhỏ dần
  }
  async function ghepManifestWC(anhBlob, nhacBlob, giay, bao, hieuUng) {
    const hu = HIEU_UNG_MF.some(([m]) => m === hieuUng) ? hieuUng : HIEU_UNG_MF[Math.floor(Math.random() * HIEU_UNG_MF.length)][0];
    bao('hiệu ứng: ' + HIEU_UNG_MF.find(([m]) => m === hu)[1]);
    if (typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined') throw new Error('trình duyệt chưa hỗ trợ tạo video (cần Chrome mới)');
    const W = 1080, H = 1920, FPS = 30, SR = 44100, KENH = 2;
    // 1) nhạc: giải mã + cắt đúng `giay` giây + nhỏ dần ở giây cuối (xử lý ngoại tuyến, không phát ra loa)
    bao('đang xử lý nhạc');
    const oac = new OfflineAudioContext(KENH, Math.round(SR * giay), SR);
    const goc = await oac.decodeAudioData(await nhacBlob.arrayBuffer());
    const src = oac.createBufferSource(); src.buffer = goc; src.loop = goc.duration < giay;
    const gain = oac.createGain(); gain.gain.setValueAtTime(1, 0); gain.gain.setValueAtTime(1, Math.max(0, giay - 1)); gain.gain.linearRampToValueAtTime(0, giay);
    src.connect(gain); gain.connect(oac.destination); src.start(0);
    const am = await oac.startRendering();
    // 2) ảnh: vẽ sẵn nền mờ 1 lần
    const bm = await createImageBitmap(anhBlob);
    const nen = document.createElement('canvas'); nen.width = W; nen.height = H; const gn = nen.getContext('2d');
    gn.fillStyle = '#000'; gn.fillRect(0, 0, W, H);
    const kn = Math.max(W / bm.width, H / bm.height) * 1.1;
    gn.filter = 'blur(40px) brightness(0.55)'; gn.drawImage(bm, (W - bm.width * kn) / 2, (H - bm.height * kn) / 2, bm.width * kn, bm.height * kn); gn.filter = 'none';
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const ve = (t) => veKhungMF(g, nen, bm, W, H, t, hu, giay);
    // 3) chọn kiểu mã hoá video được hỗ trợ
    let vcfg = null;
    for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.42003e']) {
      const c = { codec, width: W, height: H, bitrate: 4000000, framerate: FPS, avc: { format: 'avc' } };
      try { if ((await VideoEncoder.isConfigSupported(c)).supported) { vcfg = c; break; } } catch (e) { /* */ }
    }
    if (!vcfg) throw new Error('trình duyệt không mã hoá được video H.264');
    const acfg = { codec: 'mp4a.40.2', sampleRate: SR, numberOfChannels: KENH, bitrate: 128000 };
    if (!(await AudioEncoder.isConfigSupported(acfg)).supported) throw new Error('trình duyệt không mã hoá được âm thanh AAC');
    const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H }, audio: { codec: 'aac', sampleRate: SR, numberOfChannels: KENH }, fastStart: 'in-memory', firstTimestampBehavior: 'offset' });
    let loiMa = null;
    const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { loiMa = e; } });
    const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => { loiMa = e; } });
    venc.configure(vcfg); aenc.configure(acfg);
    const choBotHang = () => new Promise((r) => { if (venc.encodeQueueSize <= 4) return r(); let xong = false; const het = () => { if (!xong && venc.encodeQueueSize <= 4) { xong = true; venc.removeEventListener('dequeue', het); r(); } }; venc.addEventListener('dequeue', het); setTimeout(() => { if (!xong) { xong = true; venc.removeEventListener('dequeue', het); r(); } }, 3000); });
    // 4) mã hoá âm thanh (từng gói 1024 mẫu)
    const L = am.getChannelData(0), R = am.numberOfChannels > 1 ? am.getChannelData(1) : am.getChannelData(0);
    for (let i = 0; i < am.length; i += 1024) {
      const n = Math.min(1024, am.length - i); const d = new Float32Array(n * 2); d.set(L.subarray(i, i + n), 0); d.set(R.subarray(i, i + n), n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / SR * 1e6), data: d });
      aenc.encode(ad); ad.close();
    }
    // 5) mã hoá hình (30 khung/giây)
    const tong = Math.round(giay * FPS);
    for (let i = 0; i < tong; i++) {
      if (loiMa) throw loiMa;
      ve(i / (tong - 1));
      const fr = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
      venc.encode(fr, { keyFrame: i % (FPS * 2) === 0 }); fr.close();
      if (venc.encodeQueueSize > 8) await choBotHang(); // chờ bằng sự kiện của bộ mã hoá (tab ẩn vẫn chạy nhanh, không bị trình duyệt làm chậm)
      if (i % FPS === 0) bao(`đang tạo video ${Math.round(i / FPS)}/${giay} giây`);
    }
    await venc.flush(); await aenc.flush(); if (loiMa) throw loiMa;
    venc.close(); aenc.close(); if (bm.close) bm.close();
    muxer.finalize();
    const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
    if (blob.size < 50000) throw new Error('video tạo ra quá nhỏ (' + blob.size + ' byte)');
    const fOut = new File([blob], 'manifest-' + Date.now() + '.mp4', { type: 'video/mp4' }); fOut.hieuUng = HIEU_UNG_MF.find(([m]) => m === hu)[1];
    return fOut;
  }

  // =====================================================================
  //  LỊCH 9 BÀI / NGÀY + TRẠNG THÁI
  // =====================================================================
  const XONG = ['xong', 'co_san'];                                   // đã lên trang
  const KET = XONG.concat(['bo', 'thieu', 'loi', 'khong_ro']);        // đã kết thúc (không đăng nữa)
  function taoGio() { // giờ ngẫu nhiên trong khung, 2 bài liền nhau cách ít nhất 1 tiếng
    let truoc = -1e9; const g = {};
    for (const it of LICH) { const a = docGio(it.tu), b = docGio(it.den); let x = a + Math.floor(Math.random() * (b - a + 1)); x = Math.max(x, truoc + CAI_DAT.CACH_LICH_PHUT); g[it.k] = x; truoc = x; }
    return g;
  }
  function trangThai(ngay = homNay()) {
    let s = lay('ngay6_' + ngay, null);
    if (!s || !s.gio) { s = { gio: taoGio(), s: {}, ngoai: {}, tao: Date.now() }; luu('ngay6_' + ngay, s); ghi(`Lịch đăng ${ngay === homNay() ? 'hôm nay' : ngay}: ` + LICH.map((it) => it.ten + ' ' + phutStr(s.gio[it.k])).join(' · ')); }
    s.s = s.s || {}; s.ngoai = s.ngoai || {};
    return s;
  }
  const capNhatTT = (f, ngay = homNay()) => { const s = trangThai(ngay); f(s); luu('ngay6_' + ngay, s); return s; };
  const ttSlot = (s, k) => s.s[k] || (s.s[k] = { tt: 'cho' });
  function tinhLich(s = trangThai()) {
    let truocXong = 0, daCoKe = false;
    return LICH.map((it) => {
      const r = s.s[it.k] || { tt: 'cho' };
      const x = Object.assign({}, it, { r, gioKH: s.gio[it.k], ket: KET.includes(r.tt), xong: XONG.includes(r.tt) });
      if (!x.ket && !daCoKe) { x.keTiep = true; daCoKe = true; x.den = Math.max(lucPhut(s.gio[it.k]), truocXong ? truocXong + CAI_DAT.CACH_BU_PHUT * 60000 : 0); }
      if (x.xong && r.luc) truocXong = Math.max(truocXong, r.luc);
      return x;
    });
  }
  const keTiep = () => tinhLich().find((x) => x.keTiep) || null;
  // "máy mở lại lúc nào" (để Máy Cao chờ Máy Giao làm trước khi cả hai cùng có mạng lại)
  let moLuc = Date.now();
  { const song = lay('song6', 0); const m0 = lay('mo6', 0); moLuc = Date.now() - song < 5 * 60000 && m0 ? m0 : Date.now(); luu('mo6', moLuc); }
  const tamDung = () => !!lay('tam_dung', false);
  const tuDong = () => lay('tu_dong6', true) !== false;
  const chayThu = () => !!lay('chay_thu6', false);
  const dangHoan = () => lay('hoan6', 0) > Date.now();

  // =====================================================================
  //  DÒ BÀI TRÊN TRANG (qua Facebook — không tốn lượt Lark)
  // =====================================================================
  const loaiSo = { b1: 1, b2: 2, b3: 3, video: 4, manifest: 5 };
  // khớp bài trên trang với chữ trong sheet: so từng từ (≥ 90%); dự phòng khi Facebook dính chữ ở chỗ xuống dòng → so chuỗi chữ-số liền (40 ký tự đầu)
  // (6.17) 2 video khác nhau có thể giống nhau gần hết phần thân (chỉ khác câu mở đầu) → bắt buộc câu mở đầu cũng phải khớp;
  // 1 thước phim có thể hiện 2 lần trong danh sách Facebook (2 mã khác nhau, cùng 1 link) → coi là 1 bài, không gán cho 2 ô
  const linkGon = (l) => String(l || '').replace(/[?#].*$/, '').replace(/\/+$/, '').replace(/^https?:\/\/(www\.|m\.|web\.)?/, '').toLowerCase();
  const dongDau = (s) => (String(s || '').split('\n').map((x) => x.trim()).find((x) => tuCua(x).length >= 2) || '');
  function dauKhop(p, text) {
    const d = dongDau(text); const a = tuCua(d); if (a.length < 3) return true;
    const b = tuCua(p.text).slice(0, a.length + 8).join(' ');
    return doGiong(b, d) >= 0.75;
  }
  function baiKhop(ds, text, daDung) {
    const ok = ds.filter((x) => !(daDung && (daDung.has(x.id) || (x.link && daDung.has('L:' + linkGon(x.link))))) && dauKhop(x, text));
    const p = baiGiongNhat(ok, text); if (p) return p;
    const k = khoaSo(text).slice(0, 40); if (k.length < 20) return null;
    return ok.find((x) => khoaSo(x.text).includes(k)) || null;
  }
  const dungBai = (set, p) => { set.add(p.id); if (p.link) set.add('L:' + linkGon(p.link)); };
  // ---- (6.9) cài đặt comment: comment mặc định + link Zalo + danh sách câu CTA (lưu trong máy + ô Z3 của sheet cho cả 2 máy) ----
  function cauHinhCmt() {
    const c = lay('cmt6', null) || {};
    const cta = Array.isArray(c.cta) ? c.cta.map((x) => String(x).trim()).filter(Boolean) : CAI_DAT.CTA_MAC_DINH.slice();
    return { goc: typeof c.goc === 'string' && c.goc.trim() ? c.goc : CAI_DAT.CMT_BAI3, link: (c.link || CAI_DAT.LINK_ZALO).trim(), cta, bat: c.bat !== false,
      loai: Object.assign({ b1: true, b2: true, b3: true, video: true, manifest: true }, c.loai || {}), luc: c.luc || 0, may: c.may || '' };
  }
  function soNgau(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function chonCTA(k, ngay = homNay()) { // mỗi bài trong ngày 1 câu khác nhau (xáo theo ngày), hết câu thì quay vòng
    const c = cauHinhCmt(); if (!c.cta.length) return '';
    let seed = 0; for (const ch of ngay) seed = seed * 31 + ch.charCodeAt(0);
    const r = soNgau(seed); const thu = c.cta.map((x, i) => [r(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const vt = LICH.findIndex((x) => x.k === k);
    return c.cta[thu[(vt >= 0 ? vt : Math.floor(Math.random() * 9)) % thu.length]];
  }
  // (6.12) CTA nhóm Zalo là 1 comment RIÊNG, đăng ngay sau comment chữ chính (trước các comment ảnh)
  function cmtCTA(it, ngay) {
    const c = cauHinhCmt(); if (!c.bat || !c.loai[it.loai] || !c.link || !c.cta.length) return '';
    return `${chonCTA(it.k, ngay)}\n>>> ${c.link}`; // (6.12) không ghi chữ "CTA:" / "Link:"
  }
  function canCmt(it, nd, chung, ngay) { // các comment cần có dưới bài (để kiểm và gửi bù)
    chung = chung || ((duLieu() || {}).chung) || { co: '', pool: [] };
    const it2 = it.k ? it : { loai: it.loai || 'video' };
    const cta = cmtCTA(it2, ngay);
    if (it.loai === 'b1' || it.loai === 'b2') return { text: nd.cmt ? [nd.cmt].concat(cta ? [cta] : []) : [], anh: [] };
    const anh = []; if (chung.co) anh.push(chung.co); if (chung.pool.length) anh.push(chung.pool[Math.floor(Math.random() * chung.pool.length)]);
    if (it.loai === 'b3') (nd.anhCmt || []).forEach((t) => anh.push(t));
    return { text: [cauHinhCmt().goc].concat(cta ? [cta] : []), anh };
  }
  async function luuCauHinhCmt(c) {
    const moi = { goc: c.goc, link: c.link, cta: c.cta, bat: c.bat, loai: c.loai, luc: Date.now(), may: MAY };
    luu('cmt6', moi);
    ghi(`Đã lưu cài đặt comment (${moi.cta.length} câu CTA, CTA ${moi.bat ? 'BẬT' : 'TẮT'})`);
    await ghiO(CAI_DAT.TAB_BAI, CAI_DAT.O_CMT, JSON.stringify(moi));
    luu('cmt6_dongbo', Date.now());
    return moi;
  }
  // ---- (6.11) kho thẻ: video / manifest — mỗi bài bốc 8 thẻ, các bài cùng loại trong ngày lấy bộ khác nhau ----
  function khoThe() {
    const c = lay('the6', null) || {}; const sach = (a, md) => (Array.isArray(a) ? a.map((x) => String(x).trim()).filter(Boolean) : md.slice());
    return { video: sach(c.video, CAI_DAT.THE_VIDEO), manifest: sach(c.manifest, CAI_DAT.THE_MANIFEST), luc: c.luc || 0, may: c.may || '' };
  }
  function chonThe(loai, so, ngay = homNay(), kho) {
    const ds = (kho || khoThe())[loai === 'manifest' ? 'manifest' : 'video']; const n = Math.min(CAI_DAT.SO_THE, ds.length); if (!n) return [];
    let seed = 7; for (const ch of ngay + loai) seed = seed * 31 + ch.charCodeAt(0);
    const r = soNgau(seed); const thu = ds.map((x, i) => [r(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const out = []; for (let j = 0; j < n; j++) out.push(ds[thu[((so || 0) * n + j) % thu.length]]);
    return [...new Set(out)];
  }
  async function luuKhoThe(c) {
    const moi = { video: c.video, manifest: c.manifest, luc: Date.now(), may: MAY };
    luu('the6', moi); ghi(`Đã lưu kho thẻ (video ${moi.video.length} thẻ, manifest ${moi.manifest.length} thẻ)`);
    await ghiO(CAI_DAT.TAB_BAI, CAI_DAT.O_THE, JSON.stringify(moi)); luu('the6_dongbo', Date.now());
    return moi;
  }
  async function dongBoThe() {
    try {
      const t = chuO(await docO(CAI_DAT.TAB_BAI, CAI_DAT.O_THE)).trim(); if (!t || t[0] !== '{') return false;
      const z = JSON.parse(t); const cu = lay('the6', null) || {}; luu('the6_dongbo', Date.now());
      if ((z.luc || 0) > (cu.luc || 0) && JSON.stringify([z.video, z.manifest]) !== JSON.stringify([cu.video, cu.manifest])) { luu('the6', z); ghi(`Cập nhật kho thẻ từ sheet (bản lưu lúc ${gioStr(new Date(z.luc))})`); return true; }
    } catch (e) { /* */ }
    return false;
  }
  async function baiConAnhApi(text) { // true = còn ảnh · false = không còn ảnh · null = chưa hỏi được
    if (!coApi() || !text) return null;
    try {
      const p = baiKhop(await baiTrenTrangApi(Date.now() - 12 * 3600e3), text); if (!p || !p.id) return null;
      const j = await goiFb(`/${p.id}?fields=attachments{type,media_type,subattachments{type,media_type}}`);
      const ds = ((j.attachments || {}).data || []); const anh = (x) => /photo|album|image/i.test((x.type || '') + ' ' + (x.media_type || ''));
      return ds.some((x) => anh(x) || ((x.subattachments || {}).data || []).some(anh));
    } catch (e) { return null; }
  }
  async function dongBoCmt() { // đọc bản trên sheet (ô Z3): mới hơn bản trong máy thì dùng bản sheet
    try {
      const t = chuO(await docO(CAI_DAT.TAB_BAI, CAI_DAT.O_CMT)).trim(); if (!t || t[0] !== '{') return false;
      const z = JSON.parse(t); const cu = lay('cmt6', null) || {};
      luu('cmt6_dongbo', Date.now());
      const khac = JSON.stringify([z.goc, z.link, z.cta, z.bat, z.loai]) !== JSON.stringify([cu.goc, cu.link, cu.cta, cu.bat, cu.loai]);
      if ((z.luc || 0) > (cu.luc || 0) && khac) { luu('cmt6', z); ghi(`Cập nhật cài đặt comment từ sheet (bản lưu lúc ${gioStr(new Date(z.luc))}${z.may ? ' ở ' + (z.may === 'GIAO' ? 'Máy Giao' : 'Máy Cao') : ''})`); return true; }
    } catch (e) { /* */ }
    return false;
  }
  let doTrangCho = null;
  async function doTrang(lyDo = '') {
    if (!coApi()) return null;
    if (doTrangCho) return doTrangCho;
    doTrangCho = (async () => {
      const tu = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
      const ds = await baiTrenTrangApi(tu - 6 * 3600e3);
      const homNayDs = ds.filter((p) => p.luc >= tu);
      luu('trang6', { luc: Date.now(), n: homNayDs.length, moiNhat: Math.max(0, ...ds.map((p) => p.luc || 0)) });
      const d = duLieu(); const ngay = homNay(); let moi = [];
      const dd = lay('dang_do', null);
      capNhatTT((s) => {
        // (6.17) sửa ô đã nhận nhầm: 2 ô cùng 1 link bài → ô "máy khác / có sẵn" là nhận nhầm → trả về chờ để dò lại
        const theoLink = {};
        for (const it of LICH) { const r = s.s[it.k]; if (r && XONG.includes(r.tt) && r.link) (theoLink[linkGon(r.link)] = theoLink[linkGon(r.link)] || []).push(it); }
        for (const ds2 of Object.values(theoLink)) {
          if (ds2.length < 2) continue;
          const sai = ds2.filter((it) => ['khac', 'tay'].includes(s.s[it.k].may) || s.s[it.k].tt === 'co_san');
          const bo = sai.length < ds2.length ? sai : sai.slice(1);
          for (const it of bo) { const r = s.s[it.k]; moi.push(`${it.ten}: trước đó nhận nhầm bài của ô khác (cùng link) → dò lại`); s.s[it.k] = { tt: 'cho', lan: r.lan || 0, vong: r.vong || 0, can: r.can, lyDo: '' }; }
        }
        const daDung = new Set(); for (const r of Object.values(s.s)) if (r && r.id) dungBai(daDung, r);
        for (const it of LICH) {
          const r = ttSlot(s, it.k); if (XONG.includes(r.tt) && r.id) continue;
          const nd = noiDungSlot(ngay, it.k, d); if (!nd.text) continue;
          let p = baiKhop(homNayDs, nd.text, daDung);
          if (p && (it.loai === 'video' || it.loai === 'manifest') && laVideoApi(p) === false) p = null;
          if (!p) continue;
          dungBai(daDung, p);
          { const ng0 = s.ngoai[p.id]; if (ng0) { Object.assign(r, { kiem: ng0.kiem || r.kiem, cmtOk: ng0.cmtOk, guiBu: ng0.guiBu, kiem19: ng0.kiem19 }); delete s.ngoai[p.id]; } }
          if (XONG.includes(r.tt)) { Object.assign(r, { id: p.id, link: p.link || r.link }); continue; }
          if (dd && dd.slot === it.k) { Object.assign(r, { id: p.id, link: p.link }); continue; } // máy này đang làm dở bài đó
          s.s[it.k] = Object.assign(r, { tt: 'xong', luc: p.luc, id: p.id, link: p.link || '', may: 'khac', kiem: r.kiem || [], can: r.can || canCmt(it, nd), lyDo: '' });
          moi.push(`${it.ten} (đăng lúc ${gioStr(new Date(p.luc))})`);
        }
        // dự phòng: manifest / video đăng tay mà chữ khác sheet (hoặc sheet thiếu chữ) → gán vào ô còn trống theo thứ tự giờ đăng
        const giu = (p) => Object.values(s.ngoai).some((g) => g.giu && (g.id === p.id || (!g.id && baiGiongNhat([p], g.text))));
        const chuaDung = (p) => !daDung.has(p.id) && !(p.link && daDung.has('L:' + linkGon(p.link)));
        const conMf = homNayDs.filter((p) => chuaDung(p) && !giu(p) && /#manifest/i.test(p.text || '')).sort((a, b) => a.luc - b.luc);
        const conVd = homNayDs.filter((p) => chuaDung(p) && !giu(p) && !/#manifest/i.test(p.text || '') && laVideoApi(p) === true).sort((a, b) => a.luc - b.luc);
        for (const it of LICH) {
          if (it.loai !== 'manifest' && it.loai !== 'video') continue;
          const r = ttSlot(s, it.k); if (XONG.includes(r.tt) || r.tt === 'dang' || (dd && dd.slot === it.k)) continue;
          const p = (it.loai === 'manifest' ? conMf : conVd).shift(); if (!p) continue;
          dungBai(daDung, p);
          const ng = s.ngoai[p.id]; if (ng) { Object.assign(r, { kiem: ng.kiem || [], cmtOk: ng.cmtOk, guiBu: ng.guiBu, kiem19: ng.kiem19 }); delete s.ngoai[p.id]; }
          s.s[it.k] = Object.assign(r, { tt: 'xong', luc: p.luc, id: p.id, link: p.link || '', may: 'khac', kiem: r.kiem || [], can: r.can || canCmt(it, noiDungSlot(ngay, it.k, d)), lyDo: '' });
          moi.push(`${it.ten} (đăng tay lúc ${gioStr(new Date(p.luc))}, nhận theo thứ tự)`);
        }
        for (const kg of Object.keys(s.ngoai)) { const g = s.ngoai[kg]; if (g.giu && !g.id) { const p = homNayDs.find((q) => !daDung.has(q.id) && baiGiongNhat([q], g.text)); if (p) { delete s.ngoai[kg]; s.ngoai[p.id] = Object.assign(g, { id: p.id, link: p.link || g.link, luc: p.luc }); daDung.add(p.id); } } }
        const linkNgoai = new Set(Object.values(s.ngoai).map((g) => linkGon(g.link)).filter(Boolean));
        for (const p of homNayDs) { // video/manifest đăng tay (không thuộc lịch) → cũng cần comment
          if (!chuaDung(p) || s.ngoai[p.id] || (p.link && linkNgoai.has(linkGon(p.link)))) continue;
          if (laVideoApi(p) === true || /#manifest/i.test(p.text || '')) { s.ngoai[p.id] = { luc: p.luc, id: p.id, link: p.link || '', text: String(p.text || '').slice(0, 300), kiem: [], can: canCmt({ loai: 'video' }, {}) }; moi.push('bài đăng tay lúc ' + gioStr(new Date(p.luc))); }
        }
      });
      if (moi.length) ghi('Dò trang' + (lyDo ? ' (' + lyDo + ')' : '') + ': thấy ' + moi.join(', '));
      return ds;
    })();
    try { return await doTrangCho; } catch (e) { ghi('Dò trang qua Facebook lỗi: ' + e.message); return null; } finally { doTrangCho = null; }
  }
  // Máy Giao thấy bài trong lịch do "máy khác" đăng → xem ô giữ chỗ: nếu Máy Cao đã nhận bài đó thì để Máy Cao lo comment (tránh 2 máy cùng gửi bù)
  async function xacDinhMayKhac() {
    if (!LA_GIAO || chanLark()) return;
    const s = trangThai(); const cac = LICH.filter((it) => { const r = s.s[it.k]; return r && r.may === 'khac' && !r.daXemKhoa; });
    if (!cac.length) return;
    let v = ''; try { v = chuO(await docO(CAI_DAT.TAB_BAI, CAI_DAT.O_KHOA)); } catch (e) { return; }
    const x = docKhoa(v);
    capNhatTT((s2) => { for (const it of cac) { const r = s2.s[it.k]; r.daXemKhoa = true; if (x && x.ngay === homNay() && x.slot === it.k && x.may === 'CAO') { r.may = 'CAO'; ghi(`${it.ten} do Máy Cao đăng thay → Máy Cao lo phần comment`); } } });
  }

  // =====================================================================
  //  Ô GIỮ CHỖ (chỉ dùng khi Máy Giao trễ hoặc Máy Cao đăng thay) — 3 lượt gọi Lark
  // =====================================================================
  const docKhoa = (v) => { const m = String(v || '').match(/^KHOA\|(\d{2}-\d{2}-\d{4})\|(\w+)\|(GIAO|CAO)\|(\d+)$/); return m ? { ngay: m[1], slot: m[2], may: m[3], luc: +m[4] } : null; };
  async function giuCho(k) {
    const doc = async () => { const c = await docO(CAI_DAT.TAB_BAI, CAI_DAT.O_KHOA); const t = chuO(c).trim(); if (t && !/^KHOA\|/.test(t)) throw new LoiMem(`ô ${CAI_DAT.O_KHOA} (tab Bài viết kênh 1) đang có chữ khác — script không dùng ô này để giữ chỗ`); return docKhoa(t); };
    const x = await doc();
    if (x && x.ngay === homNay() && x.slot === k && x.may !== MAY && Date.now() - x.luc < CAI_DAT.NHUONG_PHUT * 60000) { ghi(`${tenSlot(k)}: máy ${x.may === 'CAO' ? 'Cao' : 'Giao'} đã giữ chỗ lúc ${gioStr(new Date(x.luc))} → nhường, không đăng`); return false; }
    await ghiO(CAI_DAT.TAB_BAI, CAI_DAT.O_KHOA, `KHOA|${homNay()}|${k}|${MAY}|${Date.now()}`);
    await sleepThat(20000);
    const y = await doc();
    const ok = !!(y && y.ngay === homNay() && y.slot === k && y.may === MAY);
    ghi(ok ? `${tenSlot(k)}: đã giữ chỗ (ô ${CAI_DAT.O_KHOA}) → ${TEN_MAY} đăng` : `${tenSlot(k)}: máy kia vừa giữ chỗ cùng lúc → nhường`);
    return ok;
  }

  // =====================================================================
  //  ĐẾM NGƯỢC 10 GIÂY trước mỗi việc chạm vào trang (nhấp nháy + Tạm dừng/Tiếp tục + Hoãn 10 phút)
  // =====================================================================
  let demNguoc = null; // { ten, den, dung, dungLuc, hoan }
  function batDemNguoc(ten) {
    demNguoc = { ten, den: Date.now() + CAI_DAT.DEM_NGUOC_GIAY * 1000, dung: false, hoan: false };
    veBang();
    return new Promise((resolve) => {
      const iv = setInterval(() => {
        const d = demNguoc;
        if (!d) { clearInterval(iv); resolve('hoan'); return; }
        if (d.hoan) { clearInterval(iv); demNguoc = null; resolve('hoan'); veBang(); return; }
        if (d.dung) { if (Date.now() - d.dungLuc > 10 * 60000) { d.dung = false; d.den = Date.now() + CAI_DAT.DEM_NGUOC_GIAY * 1000; ghi('Đếm ngược: tạm dừng quá 10 phút → tự tiếp tục'); } veDemNguoc(); return; }
        if (Date.now() >= d.den) { clearInterval(iv); demNguoc = null; resolve('ok'); veBang(); return; }
        veDemNguoc();
      }, 250);
    });
  }
  // chờ nhân sự dùng xong trang (tối đa 10 phút) — trả về true nếu được làm ngay
  function choNhanSu(khoaCho, ten) { // ten: việc sắp làm (để popup nói rõ "Sắp …")
    const ly = nhanSuDangDung();
    const k = 'cho_ns_' + khoaCho; const tu = window[k] || 0;
    ten = ten || (khoaCho.startsWith('dang') ? 'đăng bài' : 'làm việc trên trang');
    if (!ly) { window[k] = 0; return true; }
    if (Date.now() - (lay('lam_ngay6', 0) || 0) < 60000) { window[k] = 0; luu('lam_ngay6', 0); luu('cho_nguoi', null); ghi(`Bạn bấm "Làm ngay" → ${ten} luôn`); return true; }
    if (!tu) { window[k] = Date.now(); ghi(`Sắp ${ten}, nhưng ${ly} → chờ tối đa ${CAI_DAT.CHO_NGUOI_TOI_DA_PHUT} phút (có đếm ngược 10 giây) — bấm "Làm ngay" trên popup để làm luôn`); }
    luu('cho_nguoi', { ly, luc: window[k], viec: khoaCho, ten });
    if (Date.now() - (window[k] || Date.now()) >= CAI_DAT.CHO_NGUOI_TOI_DA_PHUT * 60000) { window[k] = 0; return true; }
    return false;
  }

  // =====================================================================
  //  ĐĂNG 1 BÀI TRONG LỊCH
  // =====================================================================
  let dangBan = false;
  function tabAnNhac(it) { // đến giờ mà tab Facebook bị ẩn: thông báo trên máy (15 phút/lần) + báo nhóm 1 lần/ngày
    const k = 'an6_' + homNay(); const a = lay(k, { luc: 0, so: 0 });
    if (Date.now() - a.luc >= 15 * 60000 && a.so < 6) { luu(k, { luc: Date.now(), so: a.so + 1 }); thongBaoMay(`Đến giờ ${it.ten} — cần mở tab Facebook`, 'Tab Facebook đang bị che/thu nhỏ nên chưa đăng được. Mở cửa sổ Facebook lên là script đăng ngay.'); }
    baoLoi(`Đến giờ ${it.ten} nhưng tab Facebook đang bị ẩn/thu nhỏ — mở tab lên là script đăng ngay`, 'tab_an');
  }
  async function vongDang() {
    if (!MAY || tamDung() || !laTabChinh() || dangBan || lay('dang_do', null) || lay('cho_tay6', null)) return false;
    if (lay('nghi_loi6', 0) > Date.now()) return false; // (6.15) Facebook báo lỗi 3 lần liền → nghỉ 10 phút
    const L = tinhLich();
    // bấm "Đăng ngay" trên popup: bài đó được làm trước (kể cả chưa phải bài kế tiếp)
    const epIt = L.find((x) => !x.ket && x.r.tt !== 'dang' && x.r.ep && Date.now() - x.r.ep < 15 * 60000);
    if (!epIt && (await soanBaiMai())) return true;
    let it = epIt || L.find((x) => x.keTiep); if (!it) return false;
    // (6.10) bài kế tiếp đang chờ thử lại (lỗi) → các bài sau tới giờ vẫn đăng, không đứng chờ bài lỗi
    const sanSang = (x) => !x.ket && x.r.tt !== 'dang' && !(x.r.thuLai && Date.now() < x.r.thuLai) && !(x.r.choDen && Date.now() < x.r.choDen);
    if (!epIt && !sanSang(it) && it.r.thuLai && Date.now() < it.r.thuLai) {
      const truocXong = Math.max(0, ...L.filter((x) => x.xong && x.r.luc).map((x) => x.r.luc));
      const khac = L.find((x) => x.k !== it.k && sanSang(x) && Date.now() >= Math.max(lucPhut(x.gioKH), truocXong ? truocXong + CAI_DAT.CACH_BU_PHUT * 60000 : 0));
      if (khac) { if (it.r.thuLai - Date.now() > 60000 && !window['__vuot_' + khac.k]) { window['__vuot_' + khac.k] = 1; ghi(`${it.ten} đang chờ thử lại lúc ${gioStr(new Date(it.r.thuLai))} → đăng ${khac.ten} trước (không để bài lỗi chặn các bài khác)`); } it = Object.assign({}, khac, { den: Math.max(lucPhut(khac.gioKH), truocXong ? truocXong + CAI_DAT.CACH_BU_PHUT * 60000 : 0) }); }
    }
    if (!it.den) it.den = Date.now();
    const now = Date.now(), ngay = homNay(), mm = phutTrongNgay(new Date());
    const r = it.r; const ep = r.ep && now - r.ep < 15 * 60000;
    // quá giờ chót: các bài còn lại bỏ, ghi vào báo cáo ngày
    if (!ep && mm >= docGio(CAI_DAT.GIO_CHOT)) {
      const con = L.filter((x) => !x.ket);
      capNhatTT((s) => { for (const x of con) Object.assign(ttSlot(s, x.k), { tt: 'bo', lyDo: `quá ${CAI_DAT.GIO_CHOT} chưa đăng được${x.r.loi ? ' (' + x.r.loi + ')' : ''}` }); });
      ghi(`Quá ${CAI_DAT.GIO_CHOT}: bỏ ${con.map((x) => x.ten).join(', ')} — ghi vào báo cáo ngày`);
      if (LA_GIAO || L.some((x) => x.r.may === MAY)) await baoLoi(`Quá ${CAI_DAT.GIO_CHOT} chưa đăng được: ${con.map((x) => x.ten).join(', ')} — đã bỏ, ghi vào báo cáo ngày`, 'chot');
      return true;
    }
    if (!tuDong() && !ep) return false;
    if (!ep && r.thuLai && now < r.thuLai) return false;
    if (!ep && r.choDen && now < r.choDen) return false;
    // giờ bắt đầu theo vai trò của máy
    let batDau = it.den;
    if (LA_CAO && !ep) batDau = Math.max(it.den + CAI_DAT.CAO_TRE_PHUT * 60000, moLuc + CAI_DAT.CAO_CHO_MO_PHUT * 60000);
    if (!ep && now < batDau) return false;
    if (document.visibilityState !== 'visible') { tabAnNhac(it); return false; }
    if (!ep && dangHoan()) return false;
    if (!ep && !choNhanSu('dang_' + it.k, `đăng ${it.ten} (hẹn ${gioStr(new Date(it.den))})`)) return false;
    // nội dung trong sheet
    let nd = noiDungSlot(ngay, it.k);
    if (nd.thieu.length) {
      const d0 = duLieu();
      if (!chanLark() && (!d0 || !d0.ngay || !d0.ngay[ngay] || now - (d0.luc || 0) > 30 * 60000) && now - (r.docLai || 0) > 30 * 60000) {
        capNhatTT((s) => { ttSlot(s, it.k).docLai = now; });
        ghi(`${it.ten}: thiếu ${nd.thieu.join(', ')} → đọc lại sheet 1 lần xem đã bổ sung chưa`);
        try { await docDuLieu('thieu'); } catch (e) { ghi('Đọc lại sheet lỗi: ' + e.message); }
        nd = noiDungSlot(ngay, it.k);
      }
      if (nd.thieu.length) {
        capNhatTT((s) => { Object.assign(ttSlot(s, it.k), { tt: 'thieu', lyDo: 'thiếu ' + nd.thieu.join(', ') }); });
        ghi(`Bỏ qua ${it.ten}: thiếu ${nd.thieu.join(', ')}`);
        if (LA_GIAO) await baoLoi(`${it.ten} hôm nay chưa đăng được vì sheet thiếu ${nd.thieu.join(', ')} — đã bỏ qua, đăng bài kế tiếp`, 'thieu_' + it.k);
        return true;
      }
    }
    // trang đã có bài này chưa (máy kia / đăng tay) + giãn cách với bài gần nhất trên trang
    if (coApi()) {
      const ds = await doTrang('trước khi đăng ' + it.ten);
      const r2 = trangThai().s[it.k] || {};
      if (XONG.includes(r2.tt)) { ghi(`${it.ten} đã có trên trang (${r2.may === 'khac' ? 'máy khác/đăng tay' : 'đã ghi nhận'}) → không đăng`); return true; }
      if (ds && !ep) {
        const moiNhat = Math.max(0, ...ds.map((p) => p.luc || 0));
        if (moiNhat && now - moiNhat < CAI_DAT.CACH_TRANG_PHUT * 60000) {
          const den = moiNhat + CAI_DAT.CACH_TRANG_PHUT * 60000 + 30000;
          capNhatTT((s) => { ttSlot(s, it.k).choDen = den; });
          ghi(`${it.ten}: bài gần nhất trên trang mới ${Math.round((now - moiNhat) / 60000)} phút → chờ đến ${gioStr(new Date(den))}`);
          return false;
        }
      }
    }
    // 2 máy cùng bật: Máy Cao (dự phòng) hoặc Máy Giao trễ quá 15 phút phải giữ chỗ trước
    if (LA_CAO || now > it.den + CAI_DAT.GIAO_GIU_CHO_SAU_PHUT * 60000) {
      try {
        if (!(await giuCho(it.k))) { capNhatTT((s) => { ttSlot(s, it.k).choDen = Date.now() + 5 * 60000; }); return false; }
      } catch (e) { ghi(`${it.ten}: chưa giữ chỗ được (${e.message}) → ${LA_CAO ? 'Máy Cao không đăng để tránh trùng' : 'vẫn đăng (đã kiểm trang chưa có bài)'}`); if (LA_CAO) { capNhatTT((s) => { ttSlot(s, it.k).choDen = Date.now() + 10 * 60000; }); return false; } }
      if (LA_CAO && !ep) await baoLoi(`Máy Giao chưa đăng ${it.ten} (quá ${Math.round((now - it.den) / 60000)} phút so với giờ hẹn ${gioStr(new Date(it.den))}) → Máy Cao đăng thay`, 'thay_' + it.k);
    }
    // đếm ngược 10 giây (bấm "Đăng ngay" trên popup thì không cần)
    if (!ep) { const kq = await batDemNguoc('đăng ' + it.ten); if (kq !== 'ok') { ghi(`Hoãn đăng ${it.ten} (nhân sự bấm Hoãn)`); return false; } }
    if (tamDung() || lay('dang_do', null) || !laTabChinh()) return false;
    const soan = chayThu() || !!(ep && r.soan); // bấm "Soạn": làm hết mọi thứ, dừng trước nút Đăng
    dangBan = true; giuKhoa();
    window.__smhLan = (r.lan || 0) + ((r.vong || 1) - 1) * CAI_DAT.SO_LAN_THU; window.__smhBoQua = []; window.__smhHuyLuot = 0; window.__smhTreoLuc = 0; // lần thử thứ mấy (để bật chế độ bỏ bước phụ khi thử lại)
    if (window.__smhLan) ghi(`${it.ten}: lần thử ${window.__smhLan + 1} — bước phụ nào lỗi sẽ bỏ qua để bài vẫn lên`);
    capNhatTT((s) => { const x = ttSlot(s, it.k); x.tt = 'dang'; x.batDau = Date.now(); x.may = MAY; x.ep = 0; x.soan = false; });
    try { await dangSlot(it, nd, soan); }
    catch (e) { await xuLyLoiDang(it, e); }
    finally { dangBan = false; giuKhoa(); veBang(); }
    return true;
  }

  // bấm "Soạn" ở tab Ngày mai: soạn thử bài của ngày mai NGAY HÔM NAY (làm hết, dừng trước nút Đăng) — để kiểm tra trước, không đăng
  async function soanBaiMai() {
    const nm = ngayMai(); const sM = lay('ngay6_' + nm, null); if (!sM || !sM.s) return false;
    const k = Object.keys(sM.s).find((x) => sM.s[x].ep && Date.now() - sM.s[x].ep < 15 * 60000 && sM.s[x].soan && !XONG.includes(sM.s[x].tt));
    if (!k) return false;
    const it = LICH.find((x) => x.k === k); if (!it) return false;
    if (document.visibilityState !== 'visible') return false;
    capNhatTT((s) => { const x = ttSlot(s, k); x.ep = 0; x.soan = false; x.soanThu = Date.now(); }, nm);
    const nd = noiDungSlot(nm, k);
    if (nd.thieu.length) { ghi(`Soạn thử ${it.ten} ngày mai: sheet còn thiếu ${nd.thieu.join(', ')} → chưa soạn được`); thongBaoMay(`Chưa soạn được ${it.ten} ngày mai`, 'Sheet còn thiếu ' + nd.thieu.join(', ')); return true; }
    dangBan = true; giuKhoa(); veBang();
    try { await dangSlot(it, nd, true, nm); }
    catch (e) { ghi(`Soạn thử ${it.ten} ngày mai lỗi: ${e.message}`); chupLoi(it.ten); try { await dongHopSoan(); } catch (e2) { /* */ } thongBaoMay(`Soạn thử ${it.ten} ngày mai chưa được`, e.message); }
    finally { dangBan = false; giuKhoa(); veBang(); }
    return true;
  }
  // (6.10) bài bị bỏ vì sheet thiếu nội dung: đọc sheet thấy đã bổ sung → tự đưa lại hàng chờ (đăng bù, cách bài trước 30 phút)
  function thuLaiBaiThieu(d) {
    const ngay = homNay(); const s0 = trangThai(); const dua = [];
    for (const it of LICH) { const r = s0.s[it.k]; if (r && r.tt === 'thieu' && !noiDungSlot(ngay, it.k, d).thieu.length) dua.push(it); }
    if (!dua.length) return;
    capNhatTT((s) => { for (const it of dua) Object.assign(ttSlot(s, it.k), { tt: 'cho', lyDo: '', loi: '', lan: 0, thuLai: 0, docLai: 0 }); });
    ghi(`Sheet đã bổ sung nội dung cho ${dua.map((x) => x.ten).join(', ')} → đưa lại hàng chờ để đăng bù`);
  }
  // (6.10) thả cảm xúc cho thước phim (trang /reel/…): nút Thích nằm ở cột nút bên phải, không nằm trong khung bài như bài thường
  async function thaCamXucReel(text) {
    if (!CAI_DAT.THA_CAM_XUC) return { tt: 'tat' };
    try {
      kiemDung();
      if (!/^\/reel\//.test(location.pathname) && timBai(text)) return await thaCamXucBai(text);
      const timNut = (n) => [...document.querySelectorAll('[role="button"],button')].find((b) => {
        if (!dangHien(b) || b.closest('[role="article"]') || b.closest('#smhfb,#smhfb-soan-w,#smhfb-nho')) return false;
        const l = b.getAttribute('aria-label') || ''; return n instanceof RegExp ? n.test(l) : l === n; });
      await thaCamXuc(timNut, 'Cảm xúc cho thước phim', null);
      return { tt: 'ok' };
    } catch (e) { ghi('Chưa thả được cảm xúc cho thước phim: ' + e.message); return { tt: 'chua', loi: e.message }; }
  }
  // ---- (6.11) sau khi đăng video / manifest: gắn thẻ Trang "Sơn Mộc Hương" + cảm xúc (màn Chỉnh sửa thước phim) ----
  // chạy khi bài đã lên + comment xong; mỗi bài thử tối đa 4 lần (cách nhau 5–10 phút), có kiểm lại trên trang sau khi Lưu
  async function vongSuaVideo() {
    if (!CAI_DAT.SUA_VIDEO_SAU_DANG || !MAY || tamDung() || !laTabChinh() || dangBan || lay('dang_do', null) || lay('cho_tay6', null)) return false;
    if (document.visibilityState !== 'visible' || !dungTrang() || dangODuongSua()) return false;
    const mm = phutTrongNgay(new Date()); if (mm >= docGio(CAI_DAT.GIO_CHOT) + 60) return false;
    const s = trangThai(); const now = Date.now();
    const it = LICH.find((x) => { const r = s.s[x.k]; return (x.loai === 'video' || x.loai === 'manifest') && r && XONG.includes(r.tt) && (r.may === MAY || ((r.may === 'tay' || r.may === 'khac') && (LA_GIAO || now - (r.luc || 0) > 30 * 60000))) && r.link && !r.suaXong && (r.suaLan || 0) < 4 && now - (r.luc || 0) > 3 * 60000 && now >= (r.suaHen || 0); });
    if (!it) return false;
    if (!choNhanSu('suavideo_' + it.k, `kiểm tra / gắn thẻ ${CAI_DAT.TAG_TEN} + cảm xúc cho ${it.ten}`)) return false;
    const r = s.s[it.k]; const text = noiDungSlot(homNay(), it.k).text || '';
    const ghiSua = (o) => capNhatTT((s1) => Object.assign(ttSlot(s1, it.k), o));
    const p = { link: r.link, text, luc: r.luc };
    const timK = () => cacKhungBai().find((k) => khungKhopP(k, p));
    dangBan = true; giuKhoa(); bamNutLuc = Date.now(); // hiện thông báo ngay từ bước tìm bài
    try {
      await theoDoi('suavideo', async () => {
        ghi(`Kiểm tra thẻ ${CAI_DAT.TAG_TEN} + cảm xúc của ${it.ten}: tìm bài trên trang…`);
        let k = timK();
        for (let i = 0; i < 6 && !k; i++) { window.scrollBy(0, 900); await sleep(1500); k = timK(); if (!k) ghi(`${it.ten}: chưa thấy bài, cuộn tìm tiếp (${i + 1}/6)…`); }
        if (!k) { window.scrollTo(0, 0); ghiSua({ suaLan: (r.suaLan || 0) + 1, suaHen: now + 10 * 60000, suaLoi: 'chưa thấy bài trên trang' }); ghi(`Gắn thẻ + cảm xúc ${it.ten}: chưa thấy bài trên trang (lần ${(r.suaLan || 0) + 1}/4) → thử lại sau 10 phút`); return; }
        const dg = baiDaGan(k);
        if (dg.du) { ghiSua({ suaXong: Date.now(), suaLoi: '' }); ghi(`${it.ten}: đã có thẻ ${CAI_DAT.TAG_TEN} + cảm xúc trên bài → không cần sửa`); return; }
        if ((r.suaLan || 0) >= 1 && r.suaDaLuu) ghi(`${it.ten}: lần trước đã Lưu nhưng trên bài chưa hiện đủ thẻ/cảm xúc → làm lại`);
        ghi(`Bắt đầu gắn thẻ "${CAI_DAT.TAG_TEN}" + cảm xúc cho ${it.ten}`);
        const d = await moManHinhSua(k, text);
        let daLuu = false;
        try {
          if (!/^Chỉnh sửa thước phim/.test(chuan(d.innerText))) { ghiSua({ suaXong: Date.now(), suaLoi: 'không phải thước phim' }); ghi(`${it.ten}: màn sửa không phải thước phim → bỏ qua`); return; }
          const c = chipsSua(d); const canThe = !daGanThe(c), canCx = chuaCamXuc(c);
          let nhan = '';
          if (canThe) { try { await ganTheSua(); } catch (e) { if (e instanceof LoiDung) throw e; ghi(`${it.ten}: gắn thẻ chưa được (${e.message}) → vẫn gắn cảm xúc, lần sau thử thẻ lại`); } }
          if (canCx) {
            try { nhan = await camXucSua(0); }
            catch (e1) { if (e1 instanceof LoiDung || !hopSua()) throw e1; ghi('Cảm xúc lần 1 chưa xác nhận (' + e1.message + ') → thử lại lần 2'); dongBangCamXuc(); await sleep(1500); try { nhan = await camXucSua(1); } catch (e2) { if (e2 instanceof LoiDung) throw e2; ghi(`${it.ten}: cảm xúc chưa được (${e2.message})`); } }
          }
          const c2 = chipsSua(hopSua() || d);
          if ((canThe || canCx) && !(canThe && daGanThe(c2)) && !nhan) throw new Error('chưa gắn được thẻ lẫn cảm xúc');
          const nutLuu = await cho(() => { const n = nutTheoChu(hopSua() || d, 'Lưu'); return n && n.getAttribute('aria-disabled') !== 'true' ? n : null; }, 8000, 400);
          if (!nutLuu) throw new Error('nút "Lưu" không bấm được');
          nutLuu.click();
          let dong = await cho(() => !hopSua(), 12000, 500);
          if (!dong) { const n2 = nutTheoChu(hopSua() || d, 'Lưu'); if (n2) { ghi('Bấm Lưu lần 1 chưa ăn → bấm lại'); try { ganBam(n2); } catch (e) { n2.click(); } } dong = await cho(() => !hopSua(), 20000, 500); }
          if (!dong) throw new Error('đã bấm Lưu nhưng màn hình chỉnh sửa không đóng');
          daLuu = true;
          await cho(() => !dangODuongSua(), 10000); await sleep(2500);
          const k2 = timK(); const ok = k2 && baiDaGan(k2).du;
          ghiSua({ suaDaLuu: Date.now(), suaLan: (r.suaLan || 0) + 1, suaHen: Date.now() + 5 * 60000, suaXong: ok ? Date.now() : 0, suaLoi: '' });
          ghi(`${it.ten}: đã lưu ${daGanThe(c2) ? 'thẻ "' + CAI_DAT.TAG_TEN + '"' : ''}${nhan ? ' + cảm xúc "' + nhan + '"' : ''}${ok ? ' — trên bài đã hiện đủ' : ' — sẽ kiểm lại trên bài sau 5 phút'}`);
        } finally { if (!daLuu) await dongManHinhSua(); }
      }, 'Đang kiểm tra / gắn thẻ + cảm xúc cho ' + it.ten);
    } catch (e) {
      const lan = (r.suaLan || 0) + 1;
      ghiSua({ suaLan: lan, suaHen: Date.now() + (lan >= 2 ? 10 : 5) * 60000, suaLoi: e.message });
      ghi(`Gắn thẻ + cảm xúc ${it.ten} lỗi (lần ${lan}/4): ${e.message}${lan >= 4 ? ' — dừng, ghi vào báo cáo' : ' → thử lại sau'}`);
      if (lan >= 4) baoLoi(`${it.ten}: chưa gắn được thẻ ${CAI_DAT.TAG_TEN} + cảm xúc sau 4 lần (${e.message}) — cần gắn tay${r.link ? ' — ' + r.link : ''}`, 'suavid_' + it.k);
    } finally { dangBan = false; giuKhoa(); veBang(); }
    return true;
  }
  async function xuLyLoiDang(it, e) {
    const dd0 = lay('dang_do', null);
    if (e instanceof LoiTrung) { await dongHopSoan(); capNhatTT((s) => { Object.assign(ttSlot(s, it.k), { tt: 'co_san', luc: (e.p && e.p.luc) || Date.now(), id: (e.p && e.p.id) || '', link: (e.p && e.p.link) || '', may: 'khac' }); }); ghi(`${it.ten} đã có trên trang (phát hiện ngay trước khi bấm Đăng) → không đăng`); return; }
    if (dd0) { ghi(`${it.ten}: đã bấm Đăng — giữ việc dở để xác minh (${e.message})`); if (e instanceof LoiCung && !dd0.video) { dd0.buoc = 'kiem_bai'; dd0.luc = Date.now(); luu('dang_do', dd0); setTimeout(() => roiTrang(CAI_DAT.URL_TRANG), 1500); } return; }
    if (e instanceof LoiDung) { await dongHopSoan().catch(() => {}); capNhatTT((s) => { const x = ttSlot(s, it.k); if (x.tt === 'dang') x.tt = 'cho'; x.thuLai = Date.now() + 60000; }); ghi(`Hoãn đăng ${it.ten}: ${e.message}`); return; }
    if (e instanceof LoiLark) { capNhatTT((s) => { const x = ttSlot(s, it.k); x.tt = 'cho'; x.thuLai = Date.now() + 15 * 60000; x.loi = e.message; }); ghi(`${it.ten}: ${e.message} — thử lại sau 15 phút`); await baoLoi(`Chưa đăng được ${it.ten}: ${e.message}`, 'lark_' + it.k); return; }
    if (!e.daChup) tuChupHienTruong(`Lỗi khi đăng ${it.ten}: ${e.message}`);
    ghi(`Lỗi khi đăng ${it.ten}: ${e.message}`); chupLoi(it.ten);
    let dong = true; try { dong = await dongHopSoan(); if (dangODuongSua()) await dongManHinhSua(); } catch (e2) { /* */ }
    let vongMoi = false;
    const chot = lucPhut(docGio(CAI_DAT.GIO_CHOT));
    const s = capNhatTT((s1) => {
      const x = ttSlot(s1, it.k); x.lan = (x.lan || 0) + 1; x.loi = e.message; x.vong = x.vong || 1; x.thuLai = Date.now() + CAI_DAT.THU_LAI_PHUT * 60000; x.tt = 'cho';
      if (x.lan >= CAI_DAT.SO_LAN_THU) {
        const hen = Date.now() + CAI_DAT.NGHI_GIUA_VONG_PHUT * 60000;
        if (x.vong < CAI_DAT.SO_VONG_THU && hen < chot - 10 * 60000) { x.vong++; x.lan = 0; x.thuLai = hen; vongMoi = true; } else x.tt = 'loi';
      }
    });
    const x = s.s[it.k]; const lanTong = (x.vong - 1) * CAI_DAT.SO_LAN_THU + x.lan;
    if (x.tt === 'loi') await baoLoi(`❌ Không đăng được ${it.ten} sau ${x.vong} vòng thử (${x.vong * CAI_DAT.SO_LAN_THU} lần): ${e.message} — các bài khác vẫn đăng bình thường. Cần đăng tay (bấm Soạn hoặc Đăng lại trên popup).`, 'loi_' + it.k);
    else if (vongMoi && x.vong >= 3) await baoLoi(`🚨 ${it.ten} đã hỏng ${x.vong - 1} vòng thử (${(x.vong - 1) * CAI_DAT.SO_LAN_THU} lần, lỗi cuối: ${e.message}) → nghỉ ${CAI_DAT.NGHI_GIUA_VONG_PHUT} phút rồi thử vòng cuối ${x.vong}/${CAI_DAT.SO_VONG_THU} lúc ${gioStr(new Date(x.thuLai))} — nên vào kiểm tra máy ${TEN_MAY}; trong lúc chờ các bài khác vẫn đăng`, 'vong' + x.vong + '_' + it.k);
    else if (vongMoi) await baoLoi(`⚠️ ${it.ten} lỗi ${CAI_DAT.SO_LAN_THU} lần liền (${e.message}) → nghỉ ${CAI_DAT.NGHI_GIUA_VONG_PHUT} phút rồi thử vòng ${x.vong}/${CAI_DAT.SO_VONG_THU} lúc ${gioStr(new Date(x.thuLai))}, bước phụ lỗi sẽ được bỏ qua; trong lúc chờ các bài khác vẫn đăng`, 'vong' + x.vong + '_' + it.k);
    else await baoLoi(`⚠️ Lỗi khi đăng ${it.ten}: ${e.message} — script tự thử lại sau ${CAI_DAT.THU_LAI_PHUT} phút (lần ${lanTong + 1}, bước phụ lỗi sẽ được bỏ qua)`, 'loi1_' + it.k);
    window.__smhHuyLuot = 0;
    if (!dong || vongMoi || x.lan % 2 === 0 || e.taiLai) { if (e.taiLai) ghi(`${it.ten}: tải lại trang cho sạch rồi thử lại lúc ${gioStr(new Date(x.thuLai))}`); setTimeout(() => { if (!dangBan && !lay('dang_do', null)) roiTrang(); }, 3000); } // tải lại trang cho sạch trước lần thử sau
  }

  async function dangSlot(it, nd, thu, ngayBai) {
    const ngay = homNay(); const mai = ngayBai && ngayBai !== ngay ? ngayBai : ''; const ngayTT = mai || ngay;
    const chung = (duLieu() || {}).chung || { co: '', pool: [] };
    const can = canCmt(it, nd, chung, ngayTT);
    const cmts = can.text.map((v) => ({ k: 'text', v })).concat(can.anh.map((v) => ({ k: 'anh', v })));
    capNhatTT((s) => { ttSlot(s, it.k).can = can; }, ngayTT);
    const luiCho = () => capNhatTT((s) => { ttSlot(s, it.k).tt = 'cho'; }, ngayTT);
    const choTay = (them) => { capNhatTT((s) => { const x = ttSlot(s, it.k); if (x.tt === 'dang') x.tt = 'cho'; x.daSoan = Date.now(); x.thuLai = Date.now() + 60 * 60000; }, ngayTT); luu('cho_tay6', Object.assign({ slot: it.k, ten: it.ten + (mai ? ' (ngày mai)' : ''), loai: loaiSo[it.loai], text: nd.text, hang: nd.hang, cmts, luc: Date.now(), ngay, mai, soan: !chayThu() }, them)); thongBaoMay(`Đã soạn ${mai ? 'thử' : 'sẵn'} ${it.ten}${mai ? ' của ngày mai' : ''}`, mai ? 'Xem kỹ rồi bấm Huỷ / đóng hộp. Nếu bấm Đăng thì bài lên trang NGAY HÔM NAY và ngày mai không đăng lại.' : 'Kiểm tra rồi bấm Đăng. Sau khi đăng, script tự comment.'); };
    if (hdChay) hdChay.ten = `Đang ${thu ? 'soạn' : 'đăng'} ${it.ten}${mai ? ' (ngày mai)' : ''}`;
    ghi(`Bắt đầu ${thu ? 'soạn' : 'đăng'} ${it.ten}${mai ? ' (bài của ngày mai, soạn thử)' : ''}${thu ? ' (dừng trước nút Đăng, chờ bạn bấm Đăng)' : ''}`);
    if (it.loai === 'b1' || it.loai === 'b2' || it.loai === 'b3') {
      const files = [];
      for (let i = 0; i < (nd.anh || []).length; i++) { kiemDung(); files.push(await taiAnhKho(nd.anh[i], 'anh-' + (i + 1))); }
      if (!(await damBaoTuCach())) { luiCho(); return; }
      if (!dungTrang()) { luiCho(); veTrang(); return; }
      if (hopDangDo() || hopSoanBai()) { ghi('Có hộp đăng bài mở dở → đóng lại'); if (!(await dongHopSoan())) { luiCho(); roiTrang(); return; } }
      const bai = { ngay, hang: nd.hang, khoa: ngay + '|' + it.k, bai: nd.text, cmt: '', files,
        ddThem: { slot: it.k, loai: loaiSo[it.loai], ten: it.ten, cmts, cmtIdx: 0, soAnh: files.length, ghiChuTruoc: window.__smhBoQua || [] } };
      const soNhom = await dangLenFacebook(bai, { soanThu: thu });
      if (thu) { choTay({}); return; }
      const thay = await cho(() => timBai(nd.text), 60000, 1000);
      if (!thay) { ghi('Chưa thấy bài trên trang → tải lại để kiểm tra'); roiTrang(CAI_DAT.URL_TRANG); return; }
      ghi('B10. Đã thấy bài trên trang');
      const dd = lay('dang_do', null) || Object.assign({ ngay, hang: nd.hang, khoa: bai.khoa, bai: nd.text, soNhom }, bai.ddThem);
      await sauKhiDangSlot(dd);
      return;
    }
    // video / manifest
    const file = it.loai === 'video' ? await taiVideoKho(nd.tep) : await videoManifest(ngayTT, it.so, nd.anh, (m) => { if (hdChay) { hdChay.chi = m; hdChay.cap = Date.now(); } });
    if (!(await damBaoTuCach())) { luiCho(); return; }
    if (!dungTrang()) { luiCho(); veTrang(); return; }
    if (hopDangDo() || hopSoanBai() || ganManHinh()) { ghi('Có hộp đăng bài mở dở → đóng lại'); if (!(await dongHopSoan()) || ganManHinh()) { await dongHopVideo(); if (ganManHinh() || hopSoanBai()) { luiCho(); roiTrang(); return; } } }
    window.__smhThe = chonThe(it.loai, it.so, ngayTT); window.__smhTheDuoc = 0;
    const kq = await dangVideoFb({ slot: it.k, ten: it.ten, loai: loaiSo[it.loai], text: nd.text, file, cmts, hang: nd.hang, ngay }, { soanThu: thu });
    if (thu) { choTay({ video: true }); return; }
    void kq; // việc dở 'kiem_bai' (dò bài qua Facebook) chạy tiếp ở nhịp sau
  }

  // ---------------- video / manifest: soạn thước phim → vị trí → thẻ → nhóm → hình thu nhỏ → Đăng ----------------
  const nutHopPhuChung = () => {
    const CHU = ['Lúc khác', 'Để sau', 'Không phải bây giờ', 'Không phải lúc này', 'Bỏ qua', 'Không, cảm ơn', 'Không cảm ơn', 'Đăng bài viết gốc', 'Đăng bài gốc'];
    const lop = Array.from(document.querySelectorAll('div[role="dialog"],[role="alertdialog"],[aria-modal="true"]')).filter((d) => dangHien(d) && (!/Tạo bài viết|Cài đặt thước phim|Chỉnh sửa thước phim|Cài đặt bài viết/.test(d.innerText || '') || (d.innerText || '').length < 500));
    for (const d of lop) for (const chu of CHU) { const n = Array.from(d.querySelectorAll('[role="button"],button')).filter(dangHien).find((x) => chuan(x.innerText || x.getAttribute('aria-label')) === chu); if (n) return { n, chu, hop: chuan(d.innerText).slice(0, 80) }; }
    return null;
  };
  const oMoTaVideo = () => Array.from(document.querySelectorAll('[role="dialog"] [contenteditable="true"]')).find((e) => ganThay(e) && /^Mô tả/i.test(e.getAttribute('aria-label') || ''));
  const laNutDang = (b) => !b.closest('#smhfb') && (b.getAttribute('aria-label') === 'Đăng' || chuan(b.innerText) === 'Đăng') && b.getAttribute('aria-disabled') !== 'true' && !b.disabled;
  const nutDangVideo = () => { // (6.9) nút Đăng bị cuộn khuất trong khung Cài đặt → cuộn tới rồi trả về
    const b = Array.from(document.querySelectorAll('[role="button"],button')).find((x) => ganThay(x) && laNutDang(x)); if (b) return b;
    const k = Array.from(document.querySelectorAll('[role=dialog] [role="button"],[role=dialog] button')).find((x) => laNutDang(x) && x.getClientRects().length && !x.closest('[aria-hidden="true"]'));
    if (k) { try { k.scrollIntoView({ block: 'center' }); } catch (e) { /* */ } if (ganThay(k)) return k; }
    return null;
  };
  async function dongHopVideo() {
    for (let lan = 0; lan < 4 && (ganManHinh() || hopSoanBai()); lan++) {
      const nut = Array.from(document.querySelectorAll('[aria-label="Đóng"], [aria-label="Quay lại"], [aria-label="Đóng hộp thoại của công cụ tạo"]')).find(ganThay);
      if (nut) { try { ganBam(nut); } catch (e) { nut.click(); } } else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      await sleep(1500);
      const hoi = hopThoai((d) => /Bỏ|Rời khỏi|bỏ những thay đổi|Hủy thước phim/i.test(d.innerText) && d.innerText.length < 400);
      if (hoi) { const bo = Array.from(hoi.querySelectorAll('[role="button"]')).find((b) => /^(Bỏ|Bỏ bài viết|Rời khỏi|Rời khỏi trang|Bỏ thay đổi|Hủy)$/i.test(chuan(b.innerText))); if (bo) bo.click(); await sleep(1000); }
    }
    return !ganManHinh() && !hopSoanBai();
  }
  const tenHopDung = (d) => !!d && chuan(String(d.innerText || '').replace(/\s+/g, ' ').slice(0, 400)).includes(chuan(CAI_DAT.TEN_TRANG)); // (6.9) không đếm dòng: dòng "100%" của video cũ chen vào đầu hộp
  async function choTenHop(layHop) { // hộp soạn phải đứng tên trang; mới mở có thể chưa hiện tên → đợi tối đa 8 giây
    const ok = await cho(() => tenHopDung(layHop()), 8000, 400);
    if (ok) return;
    const d = layHop(); const dau = d ? chuan(d.innerText.split('\n').slice(0, 4).join(' | ')) : '(không có hộp)';
    const e = new LoiMem('Hộp soạn bài không đứng tên ' + CAI_DAT.TEN_TRANG + ' (đang hiện: ' + dau.slice(0, 70) + ')'); e.taiLai = true; throw e;
  }
  // (6.15) mở hộp soạn bằng nhiều đường: ô "Bạn đang nghĩ gì?" (2 cách bấm) → nút "Ảnh/video" → báo lỗi để tải lại trang
  async function moHopSoanNhieuDuong(B) {
    let dlg = hopSoanBai(); if (dlg) return dlg;
    const nut = timNutSoanBai();
    if (nut) {
      nut.click(); dlg = await cho(hopSoanBai, 10000);
      if (!dlg) { const n2 = timNutSoanBai() || nut; try { ganBam(n2); } catch (e) { n2.click(); } dlg = await cho(hopSoanBai, 12000); }
      if (dlg) return dlg;
    }
    const av = Array.from(document.querySelectorAll('[role="button"]')).find((b) => (chuan(b.innerText) === 'Ảnh/video' || b.getAttribute('aria-label') === 'Ảnh/video') && !b.closest('[role="dialog"]') && !b.closest('#smhfb') && dangHien(b));
    if (av) {
      B((nut ? 'Ô "Bạn đang nghĩ gì?" không mở được hộp soạn' : 'Không thấy ô "Bạn đang nghĩ gì?"') + ' → thử nút "Ảnh/video"');
      try { ganBam(av); } catch (e) { av.click(); }
      dlg = await cho(hopSoanBai, 12000); if (dlg) return dlg;
    }
    const e = new LoiMem(nut || av ? 'Không mở được hộp soạn bài (đã thử ô "Bạn đang nghĩ gì?" và nút "Ảnh/video")' : 'Không tìm thấy ô "Bạn đang nghĩ gì?" lẫn nút "Ảnh/video" trên trang');
    e.taiLai = true; throw e;
  }
  // (6.15) chờ nút Đăng sáng lên: mỗi phút ghi tiến độ; video đứng yên ở cùng 1 mức % suốt 3 phút → làm lại (tải lại trang)
  const phanTramVideo = () => { let m = null; for (const d of document.querySelectorAll('[role="dialog"]')) { if (!dangHien(d)) continue; const r = String(d.innerText || '').match(/(^|\s)(\d{1,3})\s?%/); if (r) m = +r[2]; } return m; };
  async function choNutDangVideo(B) {
    const t0 = Date.now(); let pt = phanTramVideo(), ptLuc = Date.now(), baoLuc = Date.now();
    for (;;) {
      const nd = await cho(nutDangVideo, 1500, 500); if (nd) return nd;
      const x = nutHopPhuChung() || nutHopLa(); if (x) { B(`Facebook hiện hộp «${x.hop}» che nút Đăng → bấm "${x.chu}"`); try { ganBam(x.n); } catch (e) { x.n.click(); } await sleep(1500); }
      const p = phanTramVideo(); if (p !== pt) { pt = p; ptLuc = Date.now(); }
      if (pt !== null && pt < 100 && Date.now() - ptLuc > 180000) { const e = new LoiMem(`Video đứng yên ở ${pt}% suốt 3 phút (Facebook không xử lý tiếp)`); e.taiLai = true; throw e; }
      if (Date.now() - t0 > 240000) { const e = new LoiMem('Nút Đăng chưa bấm được sau 4 phút (Facebook có thể còn đang kiểm tra video)'); e.taiLai = true; throw e; }
      if (Date.now() - baoLuc > 60000) { baoLuc = Date.now(); B(`Chờ nút Đăng sáng lên (Facebook đang xử lý video${pt !== null ? ' · ' + pt + '%' : ''}) — đã ${Math.round((Date.now() - t0) / 60000)} phút`); }
    }
  }
  // (6.15) hộp lạ của Facebook (chưa có trong danh sách chữ quen) che hộp đăng → bấm nút X "Đóng" của chính hộp đó. KHÔNG đụng hộp hỏi Bỏ/Xoá/Rời khỏi
  const HOP_LA_DA_GHI = {};
  const nutHopLa = () => {
    const lop = Array.from(document.querySelectorAll('div[role="dialog"],[role="alertdialog"]')).filter((d) => dangHien(d) && !d.closest('#smhfb,#smhfb-nho,#smhfb-soan-w,#smhfb-gan-w,#smhfb-gan-modal'));
    for (const d of lop) {
      const tx = String(d.innerText || '');
      if (!tx.trim() || tx.length > 500 || /Tạo bài viết|Cài đặt thước phim|Chỉnh sửa thước phim|Cài đặt bài viết|Tạo thước phim/.test(tx)) continue;
      if (/Bỏ|Xóa|Xoá|Rời khỏi|bỏ những thay đổi|Hủy|Huỷ|Thanh toán|Mật khẩu/i.test(tx)) continue;
      const k = chuan(tx).slice(0, 80); if (!HOP_LA_DA_GHI[k]) { HOP_LA_DA_GHI[k] = 1; ghi(`Gặp hộp lạ của Facebook: «${k}»`); }
      const n = Array.from(d.querySelectorAll('[role="button"],button')).filter(dangHien).find((x) => x.getAttribute('aria-label') === 'Đóng' || chuan(x.innerText) === 'Đóng');
      if (n) return { n, chu: 'Đóng', hop: k };
    }
    return null;
  };
  async function dangVideoFb(v, { soanThu = false } = {}) {
    const B = (m) => ghi(`${v.ten}: ${m}`);
    kiemDung(); window.__smhMoHop = Date.now();
    window.scrollTo(0, 0); await sleep(800);
    let dlg = await moHopSoanNhieuDuong(B);
    try { await choTenHop(() => hopSoanBai() || dlg); }
    catch (eT) { // (6.15) hộp đứng sai tên → đóng hộp, chuyển sang tư cách trang, mở lại 1 lần
      if (!(eT instanceof LoiMem)) throw eT;
      B('Hộp soạn không đứng tên ' + CAI_DAT.TEN_TRANG + ' → đóng hộp, chuyển tư cách rồi mở lại');
      await dongHopVideo();
      if (!(await damBaoTuCach())) throw new LoiDung('đang chuyển sang tư cách ' + CAI_DAT.TEN_TRANG + ' — trang tải lại xong sẽ đăng tiếp');
      dlg = await moHopSoanNhieuDuong(B);
      await choTenHop(() => hopSoanBai() || dlg);
      B('Mở lại hộp soạn: đã đứng tên ' + CAI_DAT.TEN_TRANG);
    }
    await xoaAnhCu();
    const ed = () => { const d = hopSoanBai(); return d ? Array.from(d.querySelectorAll('div[contenteditable="true"][data-lexical-editor]')).pop() : null; };
    if (!(await datChu(ed(), v.text))) { await sleep(800); if (!(await datChu(ed(), v.text))) throw new LoiMem('Điền chữ mô tả chưa khớp'); }
    B('V1. Đã điền chữ mô tả (' + v.text.length + ' ký tự)');
    kiemDung();
    const d0 = hopSoanBai(); if (!d0) throw new LoiMem('Hộp soạn bài đã đóng');
    const inps = Array.from(d0.querySelectorAll('input[type="file"]'));
    const inp = inps.find((i) => /video/.test(i.accept || '')) || inps[0];
    if (!inp) throw new LoiMem('Không thấy ô chọn ảnh/video trong hộp soạn bài');
    const gan = () => { const dt = new DataTransfer(); dt.items.add(v.file); inp.files = dt.files; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };
    gan();
    const coVideo = () => Array.from(document.querySelectorAll('div[role="dialog"] video')).some((x) => x.getBoundingClientRect().width > 60);
    let ok = await cho(coVideo, 60000, 1000);
    if (!ok && hopSoanBai()) { B('Facebook chưa hiện video sau 60 giây → gắn lại lần 2'); try { gan(); } catch (e) { /* */ } ok = await cho(coVideo, 90000, 1000); }
    if (!ok) { const eV = new LoiMem('Facebook chưa nhận video sau 2 lần gắn'); eV.taiLai = true; throw eV; }
    B(`V2. Đã gắn video (${(v.file.size / 1048576).toFixed(1)} MB)`);
    const bao = (m) => { if (hdChay) { hdChay.chi = v.ten + ': ' + m; hdChay.cap = Date.now(); } };
    // vị trí (trong hộp soạn) → Tiếp → màn "Chỉnh sửa thước phim"
    kiemDung();
    const phu = async (ten, fn, gocLai) => { // bước phụ: lần đầu lỗi thì báo lỗi (thử lại cả bài); từ lần thử lại thì bỏ qua bước đó, vẫn đăng
      try { return await fn(); } catch (e) { if (!thuNhe() || e instanceof LoiDung) throw e; boQuaBuoc(ten, e); try { await gocLai(); } catch (e2) { /* */ } return null; }
    };
    const thoatLop = async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true })); await sleep(1200); };
    if (ganManHinh() === 'soan') { const vt = await phu('vị trí', async () => { await ganViTri(bao); return 1; }, async () => { if (ganManHinh() === 'vitri-tim') await thoatLop(); const t = ganNutTiep(); if (t) ganBamCu(t); }); if (vt) B('V3. Đã gắn vị trí ' + CAI_DAT.VI_TRI); }
    else { const t0 = ganNutTiep(); if (t0) ganBamCu(t0); }
    if (!(await ganCho(() => ganManHinh() === 'the' || ganManHinh() === 'caidat', 60000, 500))) {
      const t1 = ganNutTiep(); if (t1) { B('Chưa sang màn Chỉnh sửa thước phim → bấm Tiếp lại'); ganBam(t1); }
      if (!(await ganCho(() => ganManHinh() === 'the' || ganManHinh() === 'caidat', 60000, 500))) throw new LoiMem('Không sang được màn Chỉnh sửa thước phim');
    }
    kiemDung();
    if (ganManHinh() === 'the') { const th = await phu('thẻ', async () => { await ganThe(bao); return 1; }, async () => { const t = ganNutTiep(); if (t) ganBamCu(t); }); if (th) B('V4. Đã gắn ' + (window.__smhTheDuoc || ganDsThe().length) + ' thẻ'); }
    if (!(await ganCho(() => ganManHinh() === 'caidat', 30000, 500))) throw new LoiMem('Không sang được màn Cài đặt thước phim');
    // chữ mô tả còn không
    await sleep(1200);
    const mt = oMoTaVideo();
    if (mt && !khoaSo(mt.innerText).includes(khoaSo(v.text).slice(0, 30))) { B('Chữ mô tả bị mất khi Facebook chuyển màn → điền lại'); await datChu(mt, v.text); }
    kiemDung();
    const veCaiDat = () => ganManHinh() === 'caidat' && ![...document.querySelectorAll('input[type=checkbox]')].some((x) => x.getAttribute('role') !== 'switch' && ganThay(x));
    const n = (await phu('chọn nhóm', async () => {
      const k = await ganNhom(bao);
      if (!(await ganCho(veCaiDat, 15000, 300))) throw new LoiMem('Chưa quay lại được màn Cài đặt thước phim sau khi chọn nhóm');
      return k;
    }, async () => { const x = ganNut('Xong'); if (x) ganBamCu(x); else await thoatLop(); await ganCho(veCaiDat, 8000, 300); })) || { tong: 0 };
    if (!veCaiDat() && !(await ganCho(veCaiDat, 8000, 300))) throw new LoiMem('Chưa quay lại được màn Cài đặt thước phim');
    if (n.tong) B('V5. Đã chọn ' + n.tong + ' nhóm');
    kiemDung();
    { const tn = await phu('hình thu nhỏ', () => ganThuNho(bao), async () => { const l = ganNutLuuAnh(); if (l) ganBamCu(l); else if (ganManHinh() !== 'caidat') await thoatLop(); await ganCho(veCaiDat, 15000, 300); }); B(tn === null ? 'V6. Bỏ qua hình thu nhỏ — giữ hình mặc định' : 'V6. Đã chọn hình thu nhỏ là khung hình đầu'); }
    kiemDung();
    const nd = await choNutDangVideo(B);
    if (soanThu) { nd.style.outline = '4px solid #f7b928'; nd.style.outlineOffset = '2px'; B('đã soạn xong, dừng trước nút "Đăng" — bấm Đăng tay, script sẽ comment tiếp'); return -1; }
    if (coApi()) {
      let trung = null;
      try { const tu = new Date(new Date().setHours(0, 0, 0, 0)).getTime(); trung = baiKhop((await baiTrenTrangApi(tu)).filter((p) => p.luc >= tu && laVideoApi(p) !== false), v.text); } catch (e) { B('Dò trùng lần cuối lỗi (' + e.message + ') → vẫn đăng'); }
      if (trung) { await dongHopVideo(); throw new LoiTrung('Bài đã có trên trang ngay trước khi bấm Đăng', trung); }
    }
    kiemDung();
    luu('dang_do', { video: true, slot: v.slot, loai: v.loai, ten: v.ten, ngay: v.ngay, hang: v.hang, khoa: v.ngay + '|' + v.slot, bai: v.text, luc: Date.now(), buoc: 'kiem_bai', cmts: v.cmts, cmtIdx: 0, soAnh: 0, ghiChuTruoc: (window.__smhBoQua || []).map((t) => 'bỏ qua bước ' + t + ' (lần thử lại)'), soNhom: n.tong, ngoai: true });
    try { ganBamCu(nd); } catch (e) { nd.click(); }
    B('V7. Đã bấm Đăng');
    let lucPhu = 0;
    const daDong = () => { const x = nutHopPhuChung() || nutHopLa(); if (x && Date.now() - lucPhu > 2500) { lucPhu = Date.now(); ghi(`${v.ten}: Facebook hiện hộp «${x.hop}» → bấm "${x.chu}"`); try { ganBam(x.n); } catch (e) { x.n.click(); } } return !ganManHinh() && !hopSoanBai(); };
    let dong = await cho(daDong, 60000, 800);
    if (!dong) { const n2 = nutDangVideo(); if (n2) { B('Bấm Đăng lần 1 chưa ăn → bấm lại'); try { ganBam(n2); } catch (e) { n2.click(); } } dong = await cho(daDong, 60000, 1000); }
    if (!dong && nutDangVideo()) { // (6.15) bấm 2 lần mà hộp vẫn mở, nút Đăng vẫn còn → nhịp sau hỏi Facebook ngay, chưa có bài thì đóng hộp + tải lại + đăng lại
      const dd2 = lay('dang_do', null); if (dd2 && dd2.slot === v.slot) { dd2.khongAn = Date.now(); luu('dang_do', dd2); }
      B('V8. Bấm Đăng 2 lần không ăn (hộp vẫn mở, nút Đăng vẫn còn) → hỏi Facebook xem bài đã lên chưa; chưa có thì tải lại trang và đăng lại');
    } else B(dong ? 'V8. Hộp đăng thước phim đã đóng — chờ Facebook xử lý video' : 'V8. Hộp đăng thước phim chưa đóng sau ~2 phút — sẽ dò trên trang');
    return n.tong;
  }

  // =====================================================================
  //  SAU KHI ĐĂNG: ghi nhận → (sửa nền đỏ Bài 2) → comment → kiểm qua Facebook
  // =====================================================================
  async function sauKhiDangSlot(dd) {
    const s0 = trangThai(); const r0 = s0.s[dd.slot] || {};
    const coLoiTruoc = !!r0.loi;
    capNhatTT((s) => { Object.assign(ttSlot(s, dd.slot), { tt: 'xong', luc: dd.lucApi || Date.now(), may: MAY, link: dd.link || r0.link || '', id: dd.id || r0.id || '', kiem: [], loi: '', daSoan: 0 }); });
    luu('bai_cuoi6', Date.now());
    ghi(`Đã đăng ${dd.ten} lúc ${gioStr(new Date())}`);
    if (coLoiTruoc) baoLoi(`✅ ${dd.ten} đã đăng được lúc ${gioStr(new Date())} (sau lỗi trước đó)`, 'hoi_' + dd.slot);
    Object.assign(dd, { buoc: 'cho_binh_luan', luc: Date.now(), lucDang: gioStr(new Date()), cmtIdx: dd.cmtIdx || 0 });
    const canSuaNen = dd.loai === 2 && CAI_DAT.SUA_NEN_B2 !== false;
    if ((!dd.cmts || !dd.cmts.length) && !canSuaNen) { await hoanTatSlot(dd, dd.ghiChuTruoc || []); return; }
    dd.cmts = dd.cmts || [];
    luu('dang_do', dd);
    ghi(dd.cmts.length ? 'Chờ vài giây rồi tải lại trang để comment' : 'Chờ vài giây rồi tải lại trang để sửa nền đỏ');
    await sleep(2500);
    if (dd.viaLink) roiTrang(dd.viaLink); else roiTrang();
  }
  // video: đã thấy bài → ghi "ĐÃ ĐĂNG" (cột J) + link (cột B) vào đúng hàng — gộp 1 lượt ghi
  async function ghiKetQuaVideo(dd) {
    if (dd.loai !== 4 || !dd.hang || !dd.link) return;
    try {
      const tab = CAI_DAT.TAB_VIDEO; let hang = dd.hang;
      const r = (await docBang(tab, `A${hang}:N${hang}`))[0] || [];
      if (khoaSo(chuO(r[4])).slice(0, 40) !== khoaSo(dd.bai).slice(0, 40)) {
        const v = await docBang(tab, 'A1:N3000'); hang = 0;
        for (let i = 1; i < v.length; i++) if (khoaSo(chuO((v[i] || [])[4])).slice(0, 40) === khoaSo(dd.bai).slice(0, 40)) { hang = i + 1; break; }
        if (!hang) throw new Error('không còn thấy hàng có chữ của video trong tab Kênh 1');
      }
      await ghiNhieuO(tab, [['J' + hang, 'ĐÃ ĐĂNG'], ['B' + hang, dd.link]]);
      ghi(`${dd.ten}: đã ghi "ĐÃ ĐĂNG" (ô J${hang}) và link (ô B${hang}) vào sheet`);
    } catch (e) { ghi(`${dd.ten}: chưa ghi được kết quả vào sheet (${e.message})`); baoLoi(`${dd.ten} đã đăng nhưng chưa ghi được "ĐÃ ĐĂNG"/link vào sheet (${e.message}) — link: ${dd.link}`, 'ghij_' + dd.slot); }
  }

  async function xuLyDangDo() {
    const dd = lay('dang_do', null);
    if (!dd) return false;
    dangBan = true; giuKhoa();
    try { return await xuLyDangDo2(dd); } finally { dangBan = false; giuKhoa(); }
  }
  async function xuLyDangDo2(dd) {
    if ((hopDangDo() || hopSoanBai() || dangODuongSua()) && nguoiDangThaoTac()) return true;
    if (!laTabChinh()) return true;
    if (dd.ngay !== homNay() && Date.now() - dd.luc > 6 * 3600e3) { luu('dang_do', null); ghi('Bỏ việc dở của ngày cũ'); return false; }
    if (tamDung() && dd.buoc !== 'kiem_bai') return true;
    // video / manifest vừa bấm Đăng: dò qua Facebook đến khi thấy bài (không cần tab hiện)
    if (dd.video && dd.buoc === 'kiem_bai') {
      // (6.15) hỏi Facebook ở các mốc 1-2-3-5-8-12-16-20 phút sau khi bấm Đăng (nhẹ, không hỏi liên tục); bấm Đăng 2 lần không ăn thì hỏi ngay
      const phut = (Date.now() - dd.luc) / 60000;
      const moc = [1, 2, 3, 5, 8, 12, 16, 20].filter((m) => phut >= m).length;
      const gap = dd.khongAn && !dd.khongAnDaHoi;
      if (!gap && (moc <= (dd.mocDo || 0) || Date.now() - (dd.lanDo || 0) < 20000)) return true;
      dd.mocDo = moc; dd.lanDo = Date.now(); if (gap) dd.khongAnDaHoi = Date.now(); luu('dang_do', dd);
      let p = null, hoiDuoc = false;
      try {
        const ds = await baiTrenTrangApi(dd.luc - 10 * 60000); hoiDuoc = true;
        p = baiKhop(ds.filter((x) => x.luc >= dd.luc - 10 * 60000 && laVideoApi(x) !== false), dd.bai);
        if (!p) { dd.apiKhong = (dd.apiKhong || 0) + 1; luu('dang_do', dd); }
      } catch (e) { ghi(`${dd.ten}: dò bài qua Facebook lỗi (${e.message})`); }
      if (p) {
        Object.assign(dd, { id: p.id, link: p.link, lucApi: p.luc, viaLink: p.link || '' });
        ghi(`${dd.ten}: Facebook xác nhận đã lên trang lúc ${gioStr(new Date(p.luc))}`);
        if (ganManHinh() || hopSoanBai()) await dongHopVideo().catch(() => {});
        await ghiKetQuaVideo(dd);
        await sauKhiDangSlot(dd); return true;
      }
      // hộp đăng vẫn mở + nút Đăng vẫn còn = Facebook chưa nhận lệnh Đăng → đóng hộp, tải lại trang, đăng lại (tính 1 lần thử; trước khi bấm Đăng lần sau vẫn dò trùng)
      const hopCon = !!(ganManHinh() || hopSoanBai()) && !!nutDangVideo();
      if (hopCon && document.visibilityState === 'visible') { const x = nutHopPhuChung() || nutHopLa(); if (x) { ghi(`${dd.ten}: hộp «${x.hop}» đang che hộp đăng → bấm "${x.chu}"`); try { ganBam(x.n); } catch (e) { x.n.click(); } await sleep(2500); } }
      if (hopCon && document.visibilityState === 'visible' && (dd.khongAn || phut >= 3) && (hoiDuoc || !coApi())) {
        ghi(`${dd.ten}: đã ${Math.max(1, Math.round(phut))} phút mà hộp đăng vẫn mở, nút Đăng vẫn còn${hoiDuoc ? ', Facebook chưa có bài' : ''} → bấm Đăng không ăn: đóng hộp, tải lại trang rồi đăng lại`);
        tuChupHienTruong(`${dd.ten}: bấm Đăng nhưng Facebook không nhận (hộp đăng vẫn mở sau ${Math.round(phut)} phút)`);
        luu('dang_do', null);
        await dongHopVideo().catch(() => {});
        const eK = new LoiMem('bấm Đăng nhưng Facebook không nhận (hộp đăng vẫn mở)'); eK.taiLai = true; eK.daChup = true;
        await xuLyLoiDang({ k: dd.slot, ten: dd.ten }, eK);
        return true;
      }
      const hanPhut = coApi() ? CAI_DAT.CHO_VIDEO_XU_LY_PHUT : CAI_DAT.CHO_VIDEO_LEN_PHUT;
      if (coApi() && !hopCon && phut >= hanPhut && (dd.apiKhong || 0) >= 3) {
        ghi(`${dd.ten}: hộp đăng đã đóng nhưng sau ${hanPhut} phút Facebook vẫn không có bài → coi như chưa lên, đăng lại (trước khi bấm Đăng sẽ dò trùng lần nữa)`);
        luu('dang_do', null); chupLoi(dd.ten);
        if (ganManHinh() || hopSoanBai()) await dongHopVideo().catch(() => {});
        await xuLyLoiDang({ k: dd.slot, ten: dd.ten }, new LoiMem(`đã bấm Đăng nhưng sau ${hanPhut} phút Facebook vẫn không có bài`));
        return true;
      }
      if (phut >= hanPhut) {
        luu('dang_do', null);
        capNhatTT((s) => { Object.assign(ttSlot(s, dd.slot), { tt: 'khong_ro', luc: dd.luc, lyDo: `đã bấm Đăng nhưng sau ${hanPhut} phút Facebook vẫn chưa thấy bài` }); });
        ghi(`${dd.ten}: đã bấm Đăng nhưng sau ${hanPhut} phút chưa thấy bài trên trang — không đăng lại để tránh trùng`); chupLoi(dd.ten);
        await baoLoi(`❓ ${dd.ten}: đã bấm Đăng nhưng sau ${hanPhut} phút chưa thấy bài trên trang${coApi() ? ' (chưa hỏi được Facebook)' : ' (chưa cài mã khoá)'} — script KHÔNG đăng lại (tránh trùng), cần vào trang kiểm tra`, 'kr_' + dd.slot);
        if (ganManHinh() || hopSoanBai()) await dongHopVideo().catch(() => {});
      }
      return true;
    }
    if (document.visibilityState !== 'visible') { choTabAn(dd.ten || 'bài đang làm dở'); return true; }
    hetChoTabAn();
    if (!dungTrang() && !(dd.viaLink && /(^|\.)facebook\.com$/.test(location.hostname))) { veTrang(); return true; }
    if (dd.buoc === 'kiem_bai') { // bài chữ/ảnh: vừa bấm Đăng thì trang tải lại
      dd.kiemLan = (dd.kiemLan || 0) + 1; luu('dang_do', dd);
      const thay = await cho(() => timBai(dd.bai), 30000, 1000);
      if (thay) { await sauKhiDangSlot(dd); return true; }
      if (coApi()) {
        try {
          const p = baiKhop(await baiTrenTrangApi(dd.luc - 10 * 60000), dd.bai);
          if (p) { ghi(`Facebook (API) xác nhận ${dd.ten} đã lên (trang chưa hiện) → tiếp tục comment`); Object.assign(dd, { id: p.id, link: p.link, lucApi: p.luc }); await sauKhiDangSlot(dd); return true; }
          dd.apiKhong = (dd.apiKhong || 0) + 1; luu('dang_do', dd);
        } catch (e) { ghi('Kiểm bài qua API lỗi: ' + e.message); }
      }
      if (dd.kiemLan === 2 || dd.kiemLan === 4 || dd.kiemLan === 8) { ghi(`Chưa thấy ${dd.ten} vừa đăng → tải lại trang kiểm tra lần nữa`); roiTrang(); return true; }
      if (dd.kiemLan >= 6 && coApi() && (dd.apiKhong || 0) < 4 && dd.kiemLan < 12) return true;
      if (dd.kiemLan >= 6) {
        luu('dang_do', null);
        if (coApi() && (dd.apiKhong || 0) >= 4) {
          const s = capNhatTT((s1) => { const x = ttSlot(s1, dd.slot); x.lan = (x.lan || 0) + 1; x.tt = x.lan >= CAI_DAT.SO_LAN_THU ? 'loi' : 'cho'; x.thuLai = Date.now(); x.loi = 'đã bấm Đăng nhưng bài không lên trang'; });
          ghi(`Đã bấm Đăng ${dd.ten} nhưng kiểm nhiều lần vẫn không có bài → coi như chưa đăng${s.s[dd.slot].tt === 'loi' ? ' (đã thử đủ số lần — bỏ qua)' : ', sẽ tự đăng lại (có dò trùng trước khi bấm Đăng)'}`);
          if (s.s[dd.slot].tt === 'loi') await baoLoi(`❌ ${dd.ten}: bấm Đăng ${s.s[dd.slot].lan} lần nhưng bài không lên trang — đã bỏ qua`, 'loi_' + dd.slot);
        } else {
          capNhatTT((s1) => { Object.assign(ttSlot(s1, dd.slot), { tt: 'khong_ro', luc: dd.luc, lyDo: 'đã bấm Đăng nhưng không thấy bài trên trang' }); });
          await baoLoi(`❓ ${dd.ten}: đã bấm Đăng nhưng không thấy bài trên trang${coApi() ? '' : ' (chưa cài mã khoá)'} — script không đăng lại để tránh trùng, cần vào trang kiểm tra`, 'kr_' + dd.slot);
        }
      }
      return true;
    }
    if (dd.buoc === 'cho_binh_luan' || dd.buoc === 'dang_binh_luan') return chayComment(dd);
    return false;
  }
  // Facebook cho biết comment đã đủ chưa
  async function kiemCmtApi(id, can) {
    const cs = await cmtChiTietApi(id);
    const thieuText = (can.text || []).filter((t) => !cs.msgs.some((c) => khopCmt(c, t)));
    const thieuAnh = Math.max(0, (can.anh || []).length - cs.anh);
    return { ok: !thieuText.length && !thieuAnh, thieuText, thieuAnh, anhCo: cs.anh };
  }
  async function hoanTatSlot(dd, ghiChu = []) {
    if (dd.raSoat) { await hoanTatRaSoat(dd, [...new Set((dd.ghiChuTruoc || []).concat(ghiChu))]); return; }
    if (await lenLaiCmtThieu(dd)) return;
    ghiChu = [...new Set((dd.ghiChuTruoc || []).concat(dd.ghiChuLan1 || [], ghiChu))];
    let id = dd.id || '', link = dd.link || '', kq = null;
    const can = (trangThai().s[dd.slot] || {}).can || { text: (dd.cmtsGoc || dd.cmts || []).filter((x) => x.k === 'text').map((x) => x.v), anh: (dd.cmtsGoc || dd.cmts || []).filter((x) => x.k === 'anh').map((x) => x.v) };
    if (coApi()) {
      for (let lan = 0; lan < 3; lan++) {
        if (lan) await sleepThat(10000);
        try {
          if (!id) { const p = baiKhop(await baiTrenTrangApi(Date.now() - 864e5), dd.bai); if (!p) continue; id = p.id; link = p.link || link; }
          kq = await kiemCmtApi(id, can); if (kq.ok) break;
        } catch (e) { ghi('Không xác nhận được comment qua API: ' + e.message); break; }
      }
    }
    capNhatTT((s) => {
      const r = ttSlot(s, dd.slot);
      Object.assign(r, { id: id || r.id || '', link: link || r.link || '', ghiChu, soNhom: dd.soNhom || r.soNhom || 0 });
      r.kiem = (r.kiem || []).concat(kq ? [{ luc: Date.now(), ok: kq.ok }] : []);
      r.cmtOk = !!(kq && kq.ok);
    });
    luu('dang_do', null);
    if (dd.viaLink) setTimeout(() => { if (!dangBan && !lay('dang_do', null)) veTrang(); }, 4000);
    ghi(kq && kq.ok ? `Xong ${dd.ten}: đã đủ comment (Facebook xác nhận)` : `Xong ${dd.ten}${kq ? `: Facebook thấy còn thiếu ${kq.thieuText.length ? 'comment chữ' : ''}${kq.thieuText.length && kq.thieuAnh ? ' + ' : ''}${kq.thieuAnh ? kq.thieuAnh + ' comment ảnh' : ''} — lượt kiểm sau 10 phút sẽ gửi bù` : ' (chưa kiểm được comment — lượt kiểm sau sẽ xem lại)'}${ghiChu.length ? ' · lưu ý: ' + ghiChu.join('; ') : ''}`);
  }

  // =====================================================================
  //  KIỂM COMMENT: ngay sau đăng (~2 phút), 10 phút, 20 phút (tối đa 3 lần/bài) + 1 lượt 19:00
  // =====================================================================
  function mucKiem(s = trangThai()) { // các bài máy này lo comment
    const out = [];
    for (const it of LICH) {
      const r = s.s[it.k]; if (!r || !XONG.includes(r.tt) || !r.id) continue;
      if (r.may === 'CAO' ? !LA_CAO : r.may === 'GIAO' ? !LA_GIAO : false) continue; // máy nào đăng thì máy đó lo; bài máy khác/đăng tay → cả 2 máy (Máy Cao chậm hơn 30 phút)
      out.push({ key: it.k, ten: it.ten, r, laSlot: true });
    }
    for (const id of Object.keys(s.ngoai)) { const r = s.ngoai[id]; if (!r.id) continue; out.push({ key: 'n|' + id, ten: r.ten ? r.ten + ' (đăng trước)' : 'bài đăng tay ' + gioStr(new Date(r.luc)), r, laSlot: false }); }
    return out;
  }
  function luuKiem(key, f) { capNhatTT((s) => { const r = key.startsWith('n|') ? s.ngoai[key.slice(2)] : s.s[key]; if (r) f(r); }); }
  async function vongKiemCmt() {
    if (!MAY || tamDung() || !laTabChinh() || dangBan || lay('dang_do', null) || !coApi()) return false;
    const now = Date.now(); const mm = phutTrongNgay(new Date()); const cuoi = docGio(CAI_DAT.GIO_KIEM_CMT_CUOI);
    // hàng đợi gửi bù do bấm tay
    const hang = lay('hang_bu6', []) || [];
    let t = null;
    for (const m of mucKiem()) {
      const r = m.r; if (r.cmtOk) continue; const n = (r.kiem || []).length;
      const moc = CAI_DAT.KIEM_CMT_SAU_PHUT[n];
      const khac = m.r.may === 'khac' || !m.laSlot; // bài máy khác / đăng tay: bắt đầu kiểm từ 10 phút (để máy kia comment xong trước)
      const tre = khac ? (LA_CAO ? 30 : 10) : 0; // Máy Cao kiểm bài máy khác chậm hơn để Máy Giao làm trước, tránh 2 máy cùng gửi bù
      if (n < CAI_DAT.KIEM_CMT_TOI_DA && moc != null && now >= r.luc + (moc + tre) * 60000) { t = m; break; }
      if (mm >= cuoi + (khac && LA_CAO ? 30 : 0) && !r.kiem19 && now - r.luc > 10 * 60000) { t = Object.assign({ cuoi: true }, m); break; }
    }
    if (!t && hang.length) { const h = hang[0]; const m = mucKiem().find((x) => x.key === h.key); luu('hang_bu6', hang.slice(1)); if (m && !m.r.cmtOk) t = Object.assign({ tay: true }, m); }
    if (!t) return false;
    const r = t.r; const can = r.can || canCmt({ loai: 'video' }, {});
    let kq;
    try { kq = await kiemCmtApi(r.id, can); } catch (e) { ghi(`Kiểm comment ${t.ten}: chưa đọc được (${e.message})`); luuKiem(t.key, (x) => { x.kiem = (x.kiem || []).concat([{ luc: Date.now(), loi: true }]); if (t.cuoi) x.kiem19 = Date.now(); }); return false; }
    luuKiem(t.key, (x) => { x.kiem = (x.kiem || []).concat([{ luc: Date.now(), ok: kq.ok, tay: !!t.tay }]); x.cmtOk = kq.ok; if (t.cuoi) x.kiem19 = Date.now(); });
    ghi(`Kiểm comment ${t.ten} (lần ${(r.kiem || []).length + 1}${t.cuoi ? ', lượt 19:00' : t.tay ? ', bấm tay' : ''}): ${kq.ok ? 'đủ' : `thiếu ${kq.thieuText.length ? 'comment chữ' : ''}${kq.thieuText.length && kq.thieuAnh ? ' + ' : ''}${kq.thieuAnh ? kq.thieuAnh + ' ảnh' : ''}`}`);
    if (kq.ok) return true;
    if ((r.guiBu || 0) >= CAI_DAT.GUI_BU_TOI_DA) { await baoLoi(`${t.ten}: đã gửi bù ${r.guiBu} lần vẫn thiếu comment — cần comment tay${r.link ? ' — ' + r.link : ''}`, 'bu_' + t.key); return true; }
    if (!tuDong() && !t.tay) return true;
    // gửi bù: cần chạm vào trang → chờ nhân sự rảnh + đếm ngược
    if (!t.tay && (dangHoan() || !choNhanSu('bu_' + t.key, `gửi bù comment cho ${t.ten}`))) { luuKiem(t.key, (x) => { x.kiem.pop(); }); return false; }
    const cmts = kq.thieuText.map((v) => ({ k: 'text', v }));
    const anhCan = can.anh || []; anhCan.slice(Math.max(0, anhCan.length - kq.thieuAnh)).forEach((v) => cmts.push({ k: 'anh', v }));
    if (!cmts.length) return true;
    if (!t.tay) { const k2 = await batDemNguoc('gửi bù comment ' + t.ten); if (k2 !== 'ok') { luuKiem(t.key, (x) => { x.kiem.pop(); }); return false; } }
    luuKiem(t.key, (x) => { x.guiBu = (x.guiBu || 0) + 1; });
    let text = r.text || ''; let lk = r.link;
    if (t.laSlot) { const nd = noiDungSlot(homNay(), t.key); text = nd.text || text; }
    const dd = { loai: 9, slot: t.key, ten: t.ten, ngay: homNay(), hang: 0, khoa: homNay() + '|rs|' + t.key, bai: text, id: r.id, link: lk || '', cmts, cmtIdx: 0, soAnh: 0, ghiChuTruoc: [], luc: Date.now(), buoc: 'cho_binh_luan', raSoat: true, rsKey: t.key, anhCoSan: kq.anhCo, daThaBai: true, daSuaNen: true, camXucCmt: { tt: 'bo' }, suaLan: 1, ngoai: true };
    if (lk && /^https?:/.test(lk)) dd.viaLink = lk;
    luu('dang_do', dd);
    ghi(`Gửi bù comment cho ${t.ten} (${cmts.length} comment) — mở thẳng bài để thấy bài mới nhất`);
    await sleep(1200);
    if (dd.viaLink) roiTrang(dd.viaLink); else roiTrang();
    return true;
  }
  async function hoanTatRaSoat(dd, ghiChu) {
    let kq = null;
    const m = mucKiem().find((x) => x.key === dd.rsKey); const can = (m && m.r.can) || { text: [], anh: [] };
    if (coApi() && dd.id) for (let lan = 0; lan < 2; lan++) { if (lan) await sleepThat(10000); try { kq = await kiemCmtApi(dd.id, can); if (kq.ok) break; } catch (e) { break; } }
    luuKiem(dd.rsKey, (x) => { if (kq) x.cmtOk = kq.ok; });
    luu('dang_do', null);
    if (dd.viaLink) setTimeout(() => { if (!dangBan && !lay('dang_do', null)) veTrang(); }, 4000);
    ghi(kq && kq.ok ? `Gửi bù xong: ${dd.ten} đã đủ comment` : `Gửi bù cho ${dd.ten} xong nhưng chưa xác nhận đủ${ghiChu.length ? ' — ' + ghiChu.join('; ') : ''}`);
  }
  // bấm tay: kiểm comment bài mới nhất / 3 bài gần nhất / video trong 24 giờ qua (luôn hỏi Facebook danh sách mới nhất)
  async function kiemTay(kieu) {
    if (!coApi()) { ghi('Kiểm comment: chưa cài mã khoá Facebook'); return; }
    await doTrang('bấm kiểm comment');
    let ds;
    try { ds = await baiTrenTrangApi(Date.now() - 24 * 3600e3); } catch (e) { ghi('Kiểm comment: chưa đọc được bài trên trang (' + e.message + ')'); return; }
    const s = trangThai(); const theoId = {};
    for (const m of mucKiem(s)) theoId[m.r.id] = m;
    const tu = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    let chon = ds.slice().sort((a, b) => b.luc - a.luc);
    if (kieu === 'kiem24') chon = chon.filter((p) => laVideoApi(p) === true || /#manifest/i.test(p.text || ''));
    else chon = chon.filter((p) => p.luc >= tu).slice(0, kieu === 'kiem1' ? 1 : 3);
    // bài video trong 24h (cả hôm qua) chưa có trong danh sách → thêm vào "bài đăng tay" để kiểm
    capNhatTT((s1) => { for (const p of chon) if (!theoId[p.id] && !s1.ngoai[p.id] && (laVideoApi(p) === true || /#manifest/i.test(p.text || ''))) s1.ngoai[p.id] = { luc: p.luc, id: p.id, link: p.link || '', text: String(p.text || '').slice(0, 300), kiem: [], can: canCmt({ loai: 'video' }, {}) }; });
    const muc = mucKiem(); const ketQua = []; const can = [];
    for (const p of chon) {
      const m = muc.find((x) => x.r.id === p.id);
      if (!m) { ketQua.push(`${gioStr(new Date(p.luc))} bài chữ không thuộc lịch hôm nay → bỏ qua`); continue; }
      if (m.r.cmtOk) { ketQua.push(`${m.ten}: đã đủ comment`); continue; }
      can.push({ key: m.key });
      ketQua.push(`${m.ten}: sẽ kiểm${(m.r.kiem || []).length >= CAI_DAT.KIEM_CMT_TOI_DA ? ' (đã kiểm ' + m.r.kiem.length + ' lần, bấm tay vẫn kiểm)' : ''}`);
    }
    luu('hang_bu6', (lay('hang_bu6', []) || []).concat(can.filter((x) => !(lay('hang_bu6', []) || []).some((y) => y.key === x.key))));
    ghi(`Kiểm comment (${kieu === 'kiem1' ? 'bài mới nhất' : kieu === 'kiem3' ? '3 bài gần nhất' : 'video trong 24 giờ qua'}): ${ketQua.join(' · ') || 'không có bài nào'}`);
  }

  // =====================================================================
  //  CHẠY THỬ: script soạn sẵn rồi dừng trước nút Đăng → người bấm Đăng → script comment tiếp
  // =====================================================================
  let hopThayTrangNay = false, hopMatTuLuc = 0; // trạng thái hộp soạn kể từ lúc tải trang này (không lưu, F5 là về 0)
  async function tiepChoTay() {
    const p = lay('cho_tay6', null); if (!p) return false;
    if (!laTabChinh() || tamDung() || lay('dang_do', null) || dangBan) return true;
    if (p.ngay !== homNay()) { luu('cho_tay6', null); return true; }
    const hopMo = hopDangDo() || hopSoanBai() || ganManHinh();
    if (hopMo) hopThayTrangNay = true; // (6.8) tính theo lần tải trang này: F5 xong mà không còn hộp → 45 giây là bỏ
    if (hopMo) {
      if (Date.now() - p.luc > 45 * 60000) { luu('cho_tay6', null); capNhatTT((s) => { Object.assign(ttSlot(s, p.slot), p.soan ? { tt: 'cho', thuLai: p.mai ? 0 : Date.now() + 15 * 60000, daSoan: 0 } : { tt: 'bo', lyDo: 'chạy thử: quá 45 phút chưa bấm Đăng' }); }, p.mai || homNay()); ghi(`${p.ten} ${p.soan ? 'đã soạn' : 'chạy thử'}: quá 45 phút chưa bấm Đăng → ${p.soan ? 'để lại hàng chờ' : 'bỏ lượt này'}`); }
      return true;
    }
    if (!p.dongLuc) { p.dongLuc = Date.now(); luu('cho_tay6', p); }
    if (Date.now() - (p.doLuc || 0) < 15000) return true;
    p.doLuc = Date.now(); luu('cho_tay6', p);
    let thay = null;
    if (!p.video && !p.mai) { const x = timBai(p.text); if (x) thay = { link: linkBai(x.khung), id: '' }; }
    if (!thay && coApi()) { try { const q = baiKhop(await baiTrenTrangApi(p.luc - 5 * 60000), p.text); if (q) thay = q; } catch (e) { /* */ } }
    if (!thay && p.mai && !p.video) { const x = timBai(p.text); if (x) thay = { link: linkBai(x.khung), id: '' }; }
    if (!thay) {
      if (!hopMatTuLuc) hopMatTuLuc = Date.now();
      const gioiHan = hopThayTrangNay ? (p.video ? 8 : 3) * 60000 : 45000; // trang vừa tải lại mà không còn hộp soạn (F5) → 45 giây là coi như mất
      if (Date.now() - (hopThayTrangNay ? p.dongLuc : hopMatTuLuc) > gioiHan) { luu('cho_tay6', null); if (!hopThayTrangNay) { ghi(`${p.ten}: hộp soạn không còn trên trang (trang đã tải lại?) và chưa thấy bài → bỏ bản soạn, bấm Soạn lại nếu cần`); thongBaoMay(`${p.ten}: bản soạn đã mất`, 'Trang đã tải lại nên hộp soạn không còn. Bấm Soạn lại nếu cần.'); } capNhatTT((s) => { Object.assign(ttSlot(s, p.slot), p.soan ? { tt: 'cho', thuLai: p.mai ? 0 : Date.now() + 15 * 60000, daSoan: 0 } : { tt: 'bo', lyDo: 'chạy thử: hộp đã đóng mà không thấy bài (đã huỷ?)' }); }, p.mai || homNay()); if (p.mai) ghi(`${p.ten}: hộp soạn thử đã đóng, không thấy bài → coi như bạn đã huỷ (ngày mai vẫn đăng bình thường)`); if (hopThayTrangNay) ghi(`${p.ten}: hộp soạn đã đóng mà không thấy bài → coi như huỷ${p.soan ? ' (bài để lại hàng chờ)' : ''}`); }
      return true;
    }
    luu('cho_tay6', null);
    if (p.mai) { // bài của ngày mai được bấm Đăng hôm nay: ghi vào "đăng ngoài lịch" hôm nay để kiểm/gửi comment, và đánh dấu ngày mai đã đăng (không đăng lại)
      const can = (lay('ngay6_' + p.mai, { s: {} }).s[p.slot] || {}).can || canCmt({ loai: 'video' }, {});
      const id = thay.id || 'mai_' + p.slot + '_' + Date.now();
      capNhatTT((s) => { s.ngoai[id] = { luc: thay.luc || Date.now(), id: thay.id || '', link: thay.link || '', text: String(p.text || '').slice(0, 300), kiem: [], can, giu: true, mai: p.mai, ten: p.ten }; });
      capNhatTT((s) => { Object.assign(ttSlot(s, p.slot), { tt: 'xong', luc: Date.now(), may: 'tay', link: thay.link || '', id: thay.id || '', kiem: [], cmtOk: false, lyDo: 'đã đăng trước (soạn thử hôm ' + homNay().slice(0, 5).replace('-', '/') + ')' }); }, p.mai);
      ghi(`${p.ten} đã được bấm Đăng hôm nay → ghi là bài đăng ngoài lịch (script kiểm và gửi bù comment sau ${CAI_DAT.KIEM_CMT_SAU_PHUT[0] + 10} phút); ngày mai không đăng lại`);
      thongBaoMay(`${p.ten} đã lên trang`, 'Ngày mai script sẽ không đăng lại bài này. Comment được kiểm và gửi bù sau ít phút.');
      return true;
    }
    ghi(`Thấy ${p.ten} đã được bấm Đăng → script comment tiếp`);
    const dd = { slot: p.slot, loai: p.loai, ten: p.ten, ngay: p.ngay, hang: p.hang, khoa: p.ngay + '|' + p.slot, bai: p.text, cmts: p.cmts, cmtIdx: 0, soAnh: 0, ghiChuTruoc: [], id: thay.id || '', link: thay.link || '', lucApi: thay.luc, ngoai: !!p.video, viaLink: p.video ? (thay.link || '') : '' };
    if (p.video && p.loai === 4) await ghiKetQuaVideo(dd);
    await sauKhiDangSlot(dd);
    return true;
  }

  // =====================================================================
  //  ĐỌC SHEET THEO LỊCH + TẢI SẴN ĐỒ ĐĂNG (Máy Giao)
  // =====================================================================
  async function docSheetTheoLich() {
    if (!MAY || chanLark()) return false;
    const mm = phutTrongNgay(new Date()); const ngay = homNay(); const d = duLieu();
    const k = 'doc6_' + ngay; const st = lay(k, {}) || {};
    const lech = (g) => docGio(g) + (parseInt(bam(ngay + g + MAY), 36) % 9); // lệch 0–8 phút cố định trong ngày
    const thu = async (loai) => { st[loai] = Date.now(); luu(k, st); try { await docDuLieu(loai); st[loai + 'Ok'] = Date.now(); luu(k, st); if (loai === 'chot') luu('tai6', null); } catch (e) { ghi(`Đọc Lark sheet (${loai}) lỗi: ${e.message} — 30 phút sau thử lại`); } veBang(); return true; };
    if (mm >= lech(CAI_DAT.GIO_DOC_CHOT) && mm < 22 * 60 && !st.chotOk && Date.now() - (st.chot || 0) > 30 * 60000) return thu('chot');
    if (mm >= lech(CAI_DAT.GIO_DOC_NHE) && mm < docGio(CAI_DAT.GIO_DOC_CHOT) && !st.nheOk && Date.now() - (st.nhe || 0) > 30 * 60000) return thu('nhe');
    const coHomNay = d && d.ngay && d.ngay[ngay];
    // (6.10) hôm nay có bài bị bỏ vì thiếu nội dung → mỗi giờ đọc lại sheet 1 lần (06:00–21:00) xem đã bổ sung chưa
    const coThieu = Object.values(trangThai().s).some((r) => r.tt === 'thieu');
    if (coThieu && mm >= 6 * 60 && mm < 21 * 60 && Date.now() - (d ? d.luc : 0) > 60 * 60000 && Date.now() - (st.thieuGio || 0) > 60 * 60000) { st.thieuGio = Date.now(); luu(k, st); return thu('thieuGio'); }
    if (!coHomNay && mm >= 6 * 60 && mm < 22 * 60 && Date.now() - (st.thieu || 0) > 30 * 60000) return thu('thieu');
    // dữ liệu đang giữ là của hôm qua (đọc trước 0h, chưa biết các sửa đổi mới) → sáng sớm đọc lại 1 lần cho đúng
    if (d && ngayStr(new Date(d.luc)) !== ngay && mm >= 5 * 60 && mm < 22 * 60 && !st.sang && Date.now() - (st.thieu || 0) > 30 * 60000) { st.sang = Date.now(); luu(k, st); return thu('sang'); }
    return false;
  }
  function dsTaiSan() { // đồ cần tải sẵn: hôm nay (bài chưa đăng) + ngày mai (sau 18:30)
    const d = duLieu(); if (!d || !d.ngay) return [];
    const out = []; const s = trangThai(); const mm = phutTrongNgay(new Date());
    const cacNgay = [homNay()]; if (mm >= docGio(CAI_DAT.GIO_DOC_CHOT)) cacNgay.push(ngayMai());
    const them = (k, x) => { if (!out.some((y) => y.k === k)) out.push(Object.assign({ k }, x)); };
    if (d.chung) { if (d.chung.co) them('tep|' + d.chung.co, { loai: 'anh', token: d.chung.co }); (d.chung.pool || []).forEach((t) => them('tep|' + t, { loai: 'anh', token: t })); }
    for (const ngay of cacNgay) {
      for (const it of LICH) {
        if (ngay === homNay()) { const r = s.s[it.k]; if (r && KET.includes(r.tt)) continue; }
        const nd = noiDungSlot(ngay, it.k, d); if (nd.thieu && nd.thieu.length && !nd.tep && !nd.anh) continue;
        (Array.isArray(nd.anh) ? nd.anh : []).forEach((t) => them('tep|' + t, { loai: 'anh', token: t }));
        (nd.anhCmt || []).forEach((t) => them('tep|' + t, { loai: 'anh', token: t }));
        if (it.loai === 'video' && nd.tep) them('tep|' + nd.tep.fileToken, { loai: 'video', tep: nd.tep });
        if (it.loai === 'manifest' && nd.anh) them(`mf|${ngay}|${it.so}|${nd.anh}`, { loai: 'mf', ngay, so: it.so, anh: nd.anh });
      }
    }
    return out;
  }
  async function taiSan() {
    if (!LA_GIAO || tamDung() || !laTabChinh() || dangBan || lay('dang_do', null) || chanLark()) return false;
    const mm = phutTrongNgay(new Date()); if (mm < 5 * 60 + 30 || mm > 22 * 60 + 30) return false;
    const st = lay('tai6', null) || {}; if (st.xongLuc && Date.now() - st.xongLuc < 30 * 60000) return false;
    if (st.loiLuc && Date.now() - st.loiLuc < 10 * 60000) return false;
    const ds = dsTaiSan(); let con = null, daCo = 0;
    for (const x of ds) { const c = await khoLay(x.k); if (c && c.blob && c.blob.size > 500) daCo++; else { con = x; break; } }
    if (!con) { luu('tai6', { xongLuc: Date.now(), n: ds.length }); if (ds.length && !st.xongLuc) { const kd = await khoDon(); ghi(`Tải sẵn xong ${ds.length} file (kho đang giữ ${kd.n} file, ~${(kd.tong / 1048576).toFixed(0)} MB${kd.xoa ? `, đã dọn ${kd.xoa} file cũ` : ''})`); } return false; }
    luu('tai6', { dang: con.k, daCo, tong: ds.length, luc: Date.now() });
    try {
      if (con.loai === 'anh') await taiTepLark(con.token, { ten: 'ảnh', loai: 'anh' });
      else if (con.loai === 'video') await taiTepLark(con.tep.fileToken, { ten: 'video "' + con.tep.ten + '"', loai: 'video', size: con.tep.size, timeout: 300000 });
      else if (con.loai === 'mf') await videoManifest(con.ngay, con.so, con.anh);
    } catch (e) {
      ghi('Tải sẵn: một file chưa tải được (' + e.message + ') — lúc đăng sẽ tải lại');
      luu('tai6', Object.assign({}, lay('tai6', {}), { loiLuc: Date.now(), loi: e.message, boQua: (st.boQua || []).concat(con.k).slice(-30) }));
      if (e instanceof LoiThieu) { luu('tai6', Object.assign({}, lay('tai6', {}), { loiLuc: Date.now() + 50 * 60000 })); }
    }
    return true;
  }

  // =====================================================================
  //  BÁO CÁO CUỐI NGÀY (nhóm Marketing) — 1 tin khi xong các bài; chưa đủ thì 21:45
  // =====================================================================
  function noiDungBaoCao(s) {
    const d = new Date(); const ngayBC = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const ds = LICH.map((it) => ({ it, r: s.s[it.k] || { tt: 'cho' } }));
    const xong = ds.filter((x) => XONG.includes(x.r.tt)).sort((a, b) => (a.r.luc || 0) - (b.r.luc || 0));
    const chua = ds.filter((x) => !XONG.includes(x.r.tt));
    const dong = xong.map((x) => `${gioNgan(x.r.luc)} ${x.it.tenBC}: ${/^https?:/.test(x.r.link || '') ? x.r.link : '(chưa lấy được link)'}`);
    chua.forEach((x) => dong.push(`--h-- ${x.it.tenBC}: chưa đăng${x.r.lyDo ? ' (' + x.r.lyDo + ')' : x.r.loi ? ' (' + x.r.loi + ')' : ''}`));
    const dau = chua.length ? `Báo cáo ${ngayBC}: đã đăng ${xong.length}/${LICH.length} bài fb (chưa đăng: ${chua.map((x) => x.it.ten).join(', ')}):` : `Báo cáo ${ngayBC}: đã đăng xong ${LICH.length} bài fb:`;
    return dau + '\n' + dong.join('\n');
  }
  async function baoCaoNgay() {
    if (!MAY || !laTabChinh()) return false;
    const s = trangThai(); if (s.baoCao) return false;
    const L = tinhLich(s); const mm = phutTrongNgay(new Date());
    const tatCaKet = L.every((x) => x.ket); const du9 = L.every((x) => x.xong);
    const cuoi = L.filter((x) => x.xong).sort((a, b) => (b.r.luc || 0) - (a.r.luc || 0))[0];
    let gui = false;
    if (du9 && cuoi && cuoi.r.may === MAY) {
      const thieuLink = L.some((x) => !/^https?:/.test(x.r.link || ''));
      if (thieuLink && Date.now() - (cuoi.r.luc || 0) < 10 * 60000) { if (Date.now() - (window.__smhLinkDo || 0) > 60000) { window.__smhLinkDo = Date.now(); await doTrang('lấy link cho báo cáo'); } return false; }
      gui = true;
    } else if ((LA_GIAO && mm >= docGio(CAI_DAT.GIO_BAO_CAO_THIEU)) || (LA_CAO && L.some((x) => x.r.may === 'CAO') && mm >= docGio(CAI_DAT.GIO_BAO_CAO_THIEU) + 20)) { // Máy Cao chỉ báo cáo khi hôm nay chính nó đã đăng thay
      if (!tatCaKet && mm < docGio(CAI_DAT.GIO_CHOT)) return false;
      if (Date.now() - (s.baoCaoThu || 0) < 15 * 60000) return false;
      capNhatTT((x) => { x.baoCaoThu = Date.now(); });
      try { const m = String(chuO(await docO(CAI_DAT.TAB_BAI, CAI_DAT.O_BAO_CAO))); if (m.startsWith('BAOCAO|' + homNay())) { capNhatTT((x) => { x.baoCao = Date.now(); x.baoCaoMay = m.split('|')[2]; }); ghi('Báo cáo ngày: máy kia đã gửi rồi'); return false; } } catch (e) { ghi('Báo cáo ngày: chưa đọc được ô ' + CAI_DAT.O_BAO_CAO + ' (' + e.message + ') → vẫn gửi'); }
      await doTrang('trước báo cáo ngày');
      gui = true;
    }
    if (!gui || !trongGioNhan()) return false;
    const ok = await guiLark('baocao', noiDungBaoCao(trangThai()), { khoa: 'baocao_' + homNay() });
    if (ok) { capNhatTT((x) => { x.baoCao = Date.now(); x.baoCaoMay = MAY; }); try { await ghiO(CAI_DAT.TAB_BAI, CAI_DAT.O_BAO_CAO, `BAOCAO|${homNay()}|${MAY}|${Date.now()}`); } catch (e) { ghi('Chưa ghi được dấu báo cáo vào ô ' + CAI_DAT.O_BAO_CAO + ': ' + e.message); } }
    return true;
  }

  // =====================================================================
  //  YÊU CẦU TỪ POPUP (tab nào bấm cũng được, tab đang làm việc sẽ làm)
  // =====================================================================
  function yeuCau(loai, them) {
    const ds = (lay('yc6', []) || []).filter((x) => Date.now() - x.luc < 10 * 60000 && x.loai !== loai);
    ds.push(Object.assign({ loai, luc: Date.now(), tu: MA_TAB }, them || {}));
    luu('yc6', ds); luu('yc6_kq_' + loai, { tt: 'cho', luc: Date.now() });
    ghi('Bấm: ' + (TEN_YC[loai] || loai)); veBang();
    setTimeout(nhip, 300);
  }
  const TEN_YC = { docsheet: 'Đọc lại Lark sheet', kiem1: 'Kiểm comment bài mới nhất', kiem3: 'Kiểm comment 3 bài gần nhất', kiem24: 'Kiểm comment video 24 giờ qua', dotrang: 'Kiểm tra bài trên trang', taoanh: 'Tạo ảnh manifest', khanhthu: 'Kiểm thử Khanh Trầm Hương', tinthu: 'Gửi tin thử', taisan: 'Tải sẵn đồ đăng' };
  async function xuLyYeuCau() {
    const ds = lay('yc6', []) || []; if (!ds.length || !laTabChinh()) return false;
    luu('yc6', []);
    for (const y of ds) {
      if (Date.now() - y.luc > 10 * 60000) continue;
      luu('yc6_kq_' + y.loai, { tt: 'dang', luc: Date.now() }); if (hdChay) { hdChay.ten = 'Đang ' + (TEN_YC[y.loai] || 'làm việc bạn vừa bấm').replace(/^./, (c) => c.toLowerCase()); } veBang();
      let kq = 'Xong';
      try {
        if (y.loai === 'docsheet') { const d = await docDuLieu('tay'); luu('tai6', null); kq = `Đã đọc lúc ${gioStr(new Date())}`; void d; }
        else if (y.loai === 'dotrang') { const x = await doTrang('bấm tay'); kq = x ? `Đã kiểm: hôm nay trang có ${(lay('trang6', {}) || {}).n || 0} bài` : 'Chưa kiểm được (xem nhật ký)'; }
        else if (y.loai === 'kiem1' || y.loai === 'kiem3' || y.loai === 'kiem24') { await kiemTay(y.loai); kq = 'Đã kiểm — bài nào thiếu sẽ được gửi bù ngay'; }
        else if (y.loai === 'khanhthu') { await khanhThuNgay(); kq = 'Đang mở trang để đọc'; }
        else if (y.loai === 'tinthu') { const ok = await guiLark('loi', `[fb][${TEN_MAY}] Tin thử từ popup — kết nối nhóm Đăng bài fb hoạt động`, { khoa: 'thu' + Date.now(), toiDa: 9 }); kq = ok ? 'Đã gửi tin thử' : 'Gửi chưa được'; }
        else if (y.loai === 'taisan') { luu('tai6', null); kq = 'Sẽ tải sẵn ngay'; }
      } catch (e) { kq = 'Lỗi: ' + e.message; ghi(`Lỗi khi ${TEN_YC[y.loai] || y.loai}: ${e.message}`); }
      luu('yc6_kq_' + y.loai, { tt: /^Lỗi/.test(kq) ? 'loi' : 'xong', luc: Date.now(), kq }); if (hdChay) hdChay.cuoi = kq;
      veBang();
    }
    return true;
  }

  // =====================================================================
  //  TẠO ẢNH MANIFEST (bấm tay ở tab Manifest): tạo xem trước trong popup → chọn → dán vào sheet
  //  chữ cột G → ảnh dán vào cột bên phải cùng hàng. Ảnh tạo ra chỉ giữ trong tab này cho tới khi dán.
  // =====================================================================
  let anhNenTam = []; // ảnh nền vừa chọn trên popup
  const mf = { ds: [], tien: null, chay: false, dan: false };
  function mfBuoc(buoc, chu, i, n) {
    mf.tien = { buoc, chu, i: i || 0, n: n || 0, luc: Date.now(), bd: (mf.tien && mf.tien.bd) || Date.now() };
    if (hdChay) { hdChay.chi = chu; hdChay.cap = Date.now(); if (hdChay.hien) luu('hoat_dong', hdChay); }
    veBang();
  }
  function docVungMF(vung) {
    const m = String(vung || '').toUpperCase().replace(/\s+/g, '').match(/^([A-Z]{1,2})(\d+)(?::([A-Z]{1,2})?(\d+))?$/);
    if (!m) throw new Error('vùng ô không đúng dạng (ví dụ G220:G223)');
    const cot = m[1], tu = +m[2], den = +(m[4] || m[2]);
    if (m[3] && m[3] !== cot) throw new Error('chỉ chọn 1 cột (ví dụ G220:G223)');
    if (den < tu || den - tu > 60) throw new Error('vùng ô từ 1 đến 60 hàng');
    if (cot.length > 1 || cot >= 'Z') throw new Error('cột chữ phải từ A đến Y');
    return { cot, tu, den, cotKQ: String.fromCharCode(cot.charCodeAt(0) + 1) };
  }
  // ---- font chữ ảnh manifest: 2 font có sẵn + font tải thêm (lưu trong Tampermonkey của máy này) ----
  const FONT_GOC = ['UTM American Sans', 'UTM Aptima'];
  const FONT_MAC_DINH = { td: 'UTM American Sans', than: 'UTM American Sans', cmt: 'UTM Aptima' };
  const fontThem = () => lay('mf_fonts6', {}) || {};
  const dsFont = () => FONT_GOC.concat(Object.keys(fontThem()));
  function fontChon() { const c = Object.assign({}, FONT_MAC_DINH, lay('mf_font6', {}) || {}); const ds = dsFont(); for (const k of Object.keys(FONT_MAC_DINH)) if (!ds.includes(c[k])) c[k] = FONT_MAC_DINH[k]; return c; }
  const fontDaNap = new Set();
  async function napFontChon() {
    await napFontMF();
    for (const [ten, b64] of Object.entries(fontThem())) {
      if (fontDaNap.has(ten)) continue;
      const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const f = new FontFace(ten, u8.buffer); await f.load(); document.fonts.add(f); fontDaNap.add(ten);
    }
  }
  async function themFont(file) {
    if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) throw new Error('chỉ nhận file font .ttf, .otf, .woff, .woff2');
    if (file.size > 3 * 1024 * 1024) throw new Error(`file font nặng ${(file.size / 1048576).toFixed(1)} MB — tối đa 3 MB`);
    const ds = fontThem(); if (Object.keys(ds).length >= 6) throw new Error('đã có 6 font tải thêm — xoá bớt rồi thêm');
    let ten = file.name.replace(/\.(ttf|otf|woff2?)$/i, '').replace(/[^\p{L}\p{N} _-]/gu, ' ').replace(/\s+/g, ' ').trim() || 'Font';
    if (FONT_GOC.includes(ten)) ten += ' (tải)';
    const buf = await file.arrayBuffer();
    try { const f = new FontFace(ten, buf.slice(0)); await f.load(); document.fonts.add(f); fontDaNap.add(ten); } catch (e) { throw new Error('file này không phải font hợp lệ'); }
    const u8 = new Uint8Array(buf); let bin = ''; for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    ds[ten] = btoa(bin); luu('mf_fonts6', ds);
    ghi(`Đã thêm font "${ten}" (${(file.size / 1024).toFixed(0)} KB) cho ảnh manifest`);
    return ten;
  }
  function xoaFont(ten) { const ds = fontThem(); delete ds[ten]; luu('mf_fonts6', ds); fontDaNap.delete(ten); const c = lay('mf_font6', {}) || {}; for (const k of Object.keys(c)) if (c[k] === ten) delete c[k]; luu('mf_font6', c); ghi(`Đã xoá font "${ten}"`); }
  function datFont(vai, ten) { const c = lay('mf_font6', {}) || {}; c[vai] = ten; luu('mf_font6', c); }
  const nenNgauNhien = (tru) => { const ds = anhNenTam.filter((f) => f !== tru); const L = ds.length ? ds : anhNenTam; return L[Math.floor(Math.random() * L.length)]; };
  async function veMotAnh(x) {
    const f = fontChon();
    const kq = await taoAnhManifest(x.nen, x.chu, f.than, f.cmt, f.td, f.than);
    if (!kq.blob || kq.blob.size < 20000) throw new Error('ảnh tạo ra bị lỗi');
    if (kq.phaiNhat > 1080 - 128) throw new Error('chữ sát mép quá, cần rút ngắn');
    if (x.url) URL.revokeObjectURL(x.url);
    Object.assign(x, { blob: kq.blob, url: URL.createObjectURL(kq.blob), tl: kq.tl, tt: 'moi', loi: '' });
  }
  async function taoAnhXemTruoc(vung) {
    if (mf.chay || mf.dan) throw new Error('đang tạo/dán ảnh, đợi xong đã');
    if (!anhNenTam.length) throw new Error('chưa chọn ảnh nền');
    const v0 = docVungMF(vung);
    mf.chay = true; mf.ds.forEach((x) => { if (x.url) URL.revokeObjectURL(x.url); }); mf.ds = []; mf.tien = null;
    try {
      mfBuoc('doc', `Bước 1/3 · Đọc chữ trong sheet (ô ${vung})`);
      const v = await docBang(CAI_DAT.TAB_VIDEO, `${v0.cot}${v0.tu}:${v0.cot}${v0.den}`);
      const hangs = [];
      for (let h = v0.tu; h <= v0.den; h++) { const chu = chuO((v[h - v0.tu] || [])[0]).trim(); if (chu) hangs.push({ h, chu }); }
      if (!hangs.length) throw new Error(`các ô ${vung} chưa có chữ`);
      ghi(`Tạo ảnh manifest: đọc được ${hangs.length} ô có chữ trong ${vung}`);
      { const f = fontChon(); mfBuoc('font', `Bước 2/3 · Nạp font chữ (tiêu đề: ${f.td} · thân: ${f.than} · kêu gọi: ${f.cmt})`); } await napFontChon();
      // chia đều ảnh nền (xáo trộn) cho các ảnh
      const tron = anhNenTam.slice().sort(() => Math.random() - 0.5);
      for (let i = 0; i < hangs.length; i++) {
        const { h, chu } = hangs[i];
        mfBuoc('tao', `Bước 3/3 · Tạo ảnh ${i + 1}/${hangs.length} (chữ ô ${v0.cot}${h})`, i, hangs.length);
        const x = { h, oChu: v0.cot + h, oKQ: v0.cotKQ + h, chu, nen: tron[i % tron.length], chon: true, tt: 'moi' };
        try { await veMotAnh(x); } catch (e) { x.tt = 'loi'; x.loi = e.message; x.chon = false; ghi(`Tạo ảnh manifest ô ${x.oChu} lỗi: ${e.message}`); }
        mf.ds.push(x); veBang(); await sleepThat(30);
      }
      const ok = mf.ds.filter((x) => x.tt !== 'loi').length;
      mfBuoc('xong', `Đã tạo ${ok}/${hangs.length} ảnh — bấm vào từng ảnh để xem trước, rồi bấm "Dán vào sheet"`, hangs.length, hangs.length);
      ghi(`Tạo ảnh manifest: đã tạo ${ok}/${hangs.length} ảnh xem trước (chưa dán vào sheet)`);
      return `đã tạo ${ok}/${hangs.length} ảnh xem trước`;
    } catch (e) { mfBuoc('loi', 'Chưa tạo được: ' + e.message); throw e; } finally { mf.chay = false; veBang(); }
  }
  async function taoLaiAnh(i) {
    const x = mf.ds[i]; if (!x || mf.chay || mf.dan) return;
    mf.chay = true; x.tt = 'dangtao'; veBang();
    try { x.nen = nenNgauNhien(x.nen); await napFontChon(); await veMotAnh(x); x.chon = true; ghi(`Tạo lại ảnh manifest ô ${x.oKQ} (đổi ảnh nền)`); }
    catch (e) { x.tt = 'loi'; x.loi = e.message; } finally { mf.chay = false; veBang(); }
  }
  async function veLaiFont() { // đổi font → vẽ lại tất cả ảnh chưa dán, giữ nguyên ảnh nền
    if (mf.chay || mf.dan) throw new Error('đang tạo/dán ảnh, đợi xong đã');
    const ds = mf.ds.filter((x) => x.nen && x.tt !== 'xong');
    if (!ds.length) throw new Error('không còn ảnh nào chưa dán để vẽ lại');
    mf.chay = true; mf.tien = null;
    try {
      const f = fontChon(); mfBuoc('font', `Nạp font chữ (tiêu đề: ${f.td} · thân: ${f.than} · kêu gọi: ${f.cmt})`); await napFontChon();
      let ok = 0;
      for (let i = 0; i < ds.length; i++) {
        const x = ds[i]; x.tt = 'dangtao';
        mfBuoc('tao', `Vẽ lại ảnh ${i + 1}/${ds.length} với font mới (ô ${x.oKQ})`, i, ds.length);
        try { await veMotAnh(x); x.chon = true; ok++; } catch (e) { x.tt = 'loi'; x.loi = e.message; x.chon = false; }
        veBang(); await sleepThat(30);
      }
      mfBuoc('xong', `Đã vẽ lại ${ok}/${ds.length} ảnh với font mới — xem lại rồi bấm "Dán vào sheet"`, ds.length, ds.length);
      ghi(`Vẽ lại ${ok}/${ds.length} ảnh manifest với font: ${f.td} / ${f.than} / ${f.cmt}`);
      return `đã vẽ lại ${ok}/${ds.length} ảnh với font mới`;
    } catch (e) { mfBuoc('loi', 'Chưa vẽ lại được: ' + e.message); throw e; } finally { mf.chay = false; veBang(); }
  }
  async function danAnhVaoSheet() {
    if (mf.chay || mf.dan) throw new Error('đang tạo/dán ảnh, đợi xong đã');
    const ds = mf.ds.filter((x) => x.chon && x.blob && x.tt !== 'xong');
    if (!ds.length) throw new Error('chưa chọn ảnh nào để dán');
    mf.dan = true; mf.tien = null;
    try {
      let ok = 0;
      for (let i = 0; i < ds.length; i++) {
        const x = ds[i]; x.tt = 'dang';
        mfBuoc('dan', `Dán ảnh ${i + 1}/${ds.length} vào ô ${x.oKQ}`, i, ds.length);
        try { await ghiAnhVaoO(CAI_DAT.TAB_VIDEO, x.oKQ, x.blob, `manifest-h${x.h}.jpg`); x.tt = 'xong'; ok++; ghi(`Đã dán ảnh manifest vào ô ${x.oKQ}`); }
        catch (e) { x.tt = 'loi'; x.loi = e.message; ghi(`Dán ảnh manifest vào ô ${x.oKQ} lỗi: ${e.message}`); }
        veBang();
      }
      const kq = `đã dán ${ok}/${ds.length} ảnh vào sheet${ok < ds.length ? ' — ảnh lỗi có thể bấm Dán lại' : ''}`;
      mfBuoc('daxong', 'Xong: ' + kq, ds.length, ds.length);
      return kq;
    } finally { mf.dan = false; veBang(); }
  }

  // ===== 2.6: nút "Gắn vị trí & thẻ" trong khung đăng Thước phim (KHÔNG bấm Đăng) =====
  const GAN = {
    VI_TRI: 'Sơn Mộc Hương',
    THE: [
      'Bí kíp chọn vòng trầm hương 108 hạt giá bao nhiêu cho người mua lần đầu',
      'Vì sao cùng là vòng trầm hương 108 hạt nhưng giá lại chênh lệch rất lớn',
      'Làm sao biết giá vòng trầm hương 108 hạt có hợp lý hay không',
      'Hướng dẫn cách xem giá vòng trầm hương 108 hạt chuẩn xác để không bị mua hớ',
      'Vòng trầm hương 108 hạt tự nhiên giá bao nhiêu là hợp lý',
      'Vòng trầm hương 108 hạt giá bao nhiêu mới đúng giá trị',
      'Hướng dẫn cách xem giá vòng trầm hương 108 hạt cho người mới chơi trầm',
      'Tại sao cùng là vòng trầm hương 108 hạt nhưng giá lại khác nhau?',
    ],
  };
  const ganDsThe = () => { if (Array.isArray(window.__smhThe) && window.__smhThe.length) return window.__smhThe; const v = lay('gan_the', null); return Array.isArray(v) && v.length ? v : GAN.THE; };
  // (5.4) "thấy được" = có kích thước, không ẩn, KHÔNG nằm trong lớp aria-hidden và nằm trong khung nhìn (Facebook giữ nhiều lớp màn cũ chồng ngoài khung nên có nhiều nút "Tiếp"/"Lưu" trùng tên)
  const ganThay = (el) => {
    if (!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')) return false;
    if (el.closest('[aria-hidden="true"]')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < window.innerWidth && r.top < window.innerHeight;
  };
  const ganNut = (txt) => [...document.querySelectorAll('[role=button],button')].find((b) => ganThay(b) && (chuan(b.innerText) === txt || b.getAttribute('aria-label') === txt));
  const ganNutLuuAnh = () => { const ds = [...document.querySelectorAll('[role=button],button')].filter((b) => ganThay(b) && !b.closest('#smhfb') && (chuan(b.innerText) === 'Lưu' || b.getAttribute('aria-label') === 'Lưu') && !/nháp/i.test(b.getAttribute('aria-label') || '')); return ds[ds.length - 1] || null; };
  const ganNutTiep = () => {
    const nfc = (t) => String(t || '').normalize('NFC').replace(/\s+/g, ' ').trim();
    const ung = [...document.querySelectorAll('[aria-label],[role=button],button,span,div')].filter((e) => ganThay(e) && (nfc(e.getAttribute('aria-label')) === 'Tiếp' || (e.children.length === 0 && nfc(e.innerText) === 'Tiếp')));
    const ds = [];
    for (const e of ung.reverse()) { const b = e.closest('[role=button],button') || e; if (b.getAttribute('aria-disabled') === 'true' || b.disabled || ds.includes(b)) continue; ds.push(b); }
    const tren = ds.find((b) => { const r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return t && (b.contains(t) || t.contains(b)); }); // nút nằm trên cùng (không bị lớp khác che)
    return tren || ds[0] || null;
  };
  const ganNutChua = (txt) => [...document.querySelectorAll('[role=button]')].find((b) => ganThay(b) && chuan(b.innerText).startsWith(txt));
  const ganO = (aria) => [...document.querySelectorAll('input')].find((i) => ganThay(i) && i.getAttribute('aria-label') === aria);
  const ganGan = (el, v) => { const p = Object.getPrototypeOf(el); const d = Object.getOwnPropertyDescriptor(p, 'value'); (d && d.set ? d.set : (x) => { el.value = x; }).call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
  const ganPhim = (el, key) => { for (const t of ['keydown', 'keypress', 'keyup']) el.dispatchEvent(new KeyboardEvent(t, { key, code: key === 'Enter' ? 'Enter' : 'Comma', keyCode: key === 'Enter' ? 13 : 188, which: key === 'Enter' ? 13 : 188, bubbles: true, cancelable: true })); };
  const ganBam = (el) => {
    if (!el) return;
    try { el.scrollIntoView({ block: 'center' }); } catch (e) { /* */ }
    const b = el.getBoundingClientRect();
    if (!(b.width > 0 && b.height > 0)) { el.click(); return; } // phần tử không có kích thước → bấm thường
    const x = b.left + b.width / 2, y = b.top + b.height / 2;
    const t0 = document.elementFromPoint(x, y);
    const t = t0 && (el.contains(t0) || t0.contains(el)) && !(t0.closest && t0.closest('#smhfb,#smhfb-gan-w')) ? t0 : el; // (4.5) điểm giữa bị thứ khác che (vd khung popup) → bắn sự kiện thẳng vào phần tử
    const base = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 };
    let ok = 0;
    for (const [n, C] of [['pointerover', PointerEvent], ['mouseover', MouseEvent], ['pointerdown', PointerEvent], ['mousedown', MouseEvent], ['pointerup', PointerEvent], ['mouseup', MouseEvent], ['click', MouseEvent]]) {
      try { t.dispatchEvent(new C(n, { ...base, pointerId: 1, isPrimary: true, pointerType: 'mouse' })); ok++; } catch (e) { /* */ }
    }
    if (!ok) el.click();
  };
  // cách bấm của bản cũ (đã chạy tốt trên Facebook thật): bắn chuỗi sự kiện vào đúng thứ đang nằm tại điểm giữa nút
  const ganBamCu = (el) => { el.scrollIntoView({ block: 'center' }); const b = el.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2; const t0 = document.elementFromPoint(x, y); const t = t0 && (el.contains(t0) || t0.contains(el)) && !(t0.closest && t0.closest('#smhfb,#smhfb-gan-w')) ? t0 : el; const base = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }; for (const [n, C] of [['pointerover', PointerEvent], ['mouseover', MouseEvent], ['pointerdown', PointerEvent], ['mousedown', MouseEvent], ['pointerup', PointerEvent], ['mouseup', MouseEvent], ['click', MouseEvent]]) { try { t.dispatchEvent(new C(n, { ...base, pointerId: 1, isPrimary: true, pointerType: 'mouse' })); } catch (e) { /* */ } } };
  const ganGo = (el, v) => { el.focus(); el.select(); document.execCommand('insertText', false, v); };
  const ganCoText = (t) => [...document.querySelectorAll('span,div,h2,h1')].some((e) => ganThay(e) && e.children.length === 0 && chuan(e.innerText) === t);
  function ganManHinh() {
    if (ganCoText('Cài đặt thước phim')) return 'caidat';
    if (ganO('Thêm thẻ')) return 'the';
    if (ganO('Bạn đang ở đâu?')) return 'vitri-tim';
    const vt = [...document.querySelectorAll('[aria-label="Vị trí"]')].find(ganThay);
    if (vt && vt.closest('[role=dialog]')) return 'soan';
    return '';
  }

  // Máy Giao: gắn vị trí & thẻ làm chậm và kỹ hơn — mỗi bước chậm ~1,7 lần; thấy nút rồi đợi thêm 1–2s mới bấm; không thấy thì đợi thêm rồi tìm lại
  const ganCham = (ms) => sleep(ms >= 3000 ? 3000 : Math.max(120, Math.round(ms * 0.5))); // (5.6) nhanh gấp đôi; riêng bước chờ lưu hình thu nhỏ giữ ~3s
  async function ganCho(fn, t, step) { // chờ nút xuất hiện (không thêm nghỉ sau khi thấy) — hết hạn thì thử lại 1 lần sau 1,5s
    let r = await cho(fn, t || 8000, step);
    if (!r) { await sleep(1500); r = fn(); }
    return r;
  }
  async function ganViTri(bao) {
    if (ganManHinh() === 'soan') { bao('Gắn vị trí…'); ganBamCu([...document.querySelectorAll('[aria-label="Vị trí"]')].find(ganThay)); }
    const o = await ganCho(() => ganO('Bạn đang ở đâu?'), 8000);
    if (!o) throw new Error('không thấy ô tìm vị trí');
    ganGo(o, GAN.VI_TRI + ' ');
    const op = await ganCho(() => [...document.querySelectorAll('[role=option]')].find((x) => ganThay(x) && /Sơn Mộc Hương/i.test(x.innerText)), 8000);
    if (!op) throw new Error('không thấy kết quả "' + GAN.VI_TRI + '"');
    ganBamCu(op); await ganCham(1500);
    if (ganO('Bạn đang ở đâu?')) { // (4.5) chọn chưa ăn → bấm lại kiểu thường
      const op2 = [...document.querySelectorAll('[role=option]')].find((x) => ganThay(x) && /Sơn Mộc Hương/i.test(x.innerText));
      if (op2) { (op2.querySelector('[role=button]') || op2).click(); await ganCham(1500); }
    }
    const tiep = await ganCho(() => ganNutTiep() || ((ganManHinh() === 'the' || ganManHinh() === 'caidat') ? true : null), 12000);
    if (!tiep) throw new Error('không thấy nút Tiếp sau khi chọn vị trí');
    if (tiep === true) return;
    ganBamCu(tiep);
    await ganCham(1200);
    if (ganO('Bạn đang ở đâu?') || ganManHinh() === 'soan') { const t2 = ganNutTiep(); if (t2) { ghi('Gắn vị trí: Tiếp chưa ăn → bấm lại'); ganBam(t2); } }
  }
  async function ganThe(bao) {
    const o0 = await ganCho(() => ganO('Thêm thẻ'), 10000); if (!o0) throw new Error('không thấy ô Thêm thẻ');
    let i = 0;
    const dsThe = ganDsThe();
    let duoc = 0; const hong = [];
    await ganCham(800); // ô thẻ vừa hiện: chờ Facebook sẵn sàng nhận chữ
    for (const the of dsThe) {
      i++; bao(`Gắn thẻ ${i}/${dsThe.length}…`);
      const rong = () => { const x = ganO('Thêm thẻ'); return x && x.value === ''; };
      let xong = false;
      for (let cach = 0; cach < 3 && !xong; cach++) {
        const o = ganO('Thêm thẻ') || (await ganCho(() => ganO('Thêm thẻ'), 4000)); if (!o) throw new Error('mất ô Thêm thẻ ở thẻ ' + i);
        if (cach === 2) { try { ganBamCu(o); } catch (e) { o.click(); } await ganCham(400); ganGan(o, ''); await ganCham(200); ganGan(o, the); } // cách 3: bấm vào ô, gán chữ trực tiếp
        else { if (cach) { ganGan(o, ''); await ganCham(300); } ganGo(o, the); }
        await ganCham(cach ? 800 : 500); ganPhim(o, cach === 1 ? ',' : 'Enter');
        xong = await ganCho(rong, cach ? 3000 : 2000, 150);
      }
      if (!xong) { hong.push(i); const o = ganO('Thêm thẻ'); if (o) { ganGan(o, ''); await ganCham(300); } ghi(`Gắn thẻ: thẻ ${i} («${String(the).slice(0, 40)}») không được nhận sau 3 cách → bỏ thẻ này, gắn tiếp thẻ sau`); }
      else duoc++;
      await ganCham(350);
    }
    if (!duoc) throw new Error('không gắn được thẻ nào (' + dsThe.length + ' thẻ đều không được nhận)');
    if (hong.length) ghi(`Gắn thẻ: đã gắn ${duoc}/${dsThe.length} thẻ (bỏ thẻ ${hong.join(', ')})`);
    window.__smhTheDuoc = duoc;
    const tiep = await ganCho(() => ganNutTiep(), 8000); if (!tiep) throw new Error('không thấy nút Tiếp sau khi gắn thẻ');
    ganBamCu(tiep);
  }
  function ganCuonLenDau() { // cuộn mọi khung cuộn trong hộp Cài đặt lên đầu
    let n = 0;
    for (const d of document.querySelectorAll('[role=dialog]')) for (const e of [d, ...d.querySelectorAll('*')]) { if (e.scrollTop > 0 && e.scrollHeight > e.clientHeight + 10) { e.scrollTop = 0; n++; } }
    return n;
  }
  function ganNutKhuat(txt) { // nút có thật nhưng đang nằm ngoài màn hình (bị cuộn khuất) → cuộn tới giữa màn hình
    const ds = [...document.querySelectorAll('[role=button],button')].filter((b) => (chuan(b.innerText) === txt || b.getAttribute('aria-label') === txt) && b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden' && !b.closest('[aria-hidden="true"]') && !b.closest('#smhfb') && b.closest('[role=dialog]'));
    for (const b of ds) { try { b.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) { /* */ } if (ganThay(b)) return b; }
    return null;
  }
  async function ganThuNho(bao) {
    bao('Chỉnh hình thu nhỏ…');
    let sua = await ganCho(() => ganNut('Chỉnh sửa'), 3000, 300);
    if (!sua) { const n = ganCuonLenDau(); if (n) ghi('Gắn thẻ: màn Cài đặt đang bị cuộn xuống → cuộn lên đầu để tìm nút Chỉnh sửa hình thu nhỏ'); await ganCham(700); sua = await ganCho(() => ganNut('Chỉnh sửa') || ganNutKhuat('Chỉnh sửa'), 5000, 300); }
    if (!sua) { await ganCham(1500); sua = ganNut('Chỉnh sửa') || ganNutKhuat('Chỉnh sửa'); }
    if (!sua) { ghi('Gắn thẻ: không thấy nút Chỉnh sửa hình thu nhỏ (đã cuộn tìm) → giữ hình thu nhỏ mặc định của Facebook, đăng tiếp'); return null; }
    ganBamCu(sua);
    const luuNut = await ganCho(() => ganNutLuuAnh(), 8000); if (!luuNut) throw new Error('không mở được khung chỉnh hình thu nhỏ');
    await ganCham(900);
    const r = [...document.querySelectorAll('input[type=range]')].find(ganThay);
    if (r) { ganGan(r, r.min || '0'); r.dispatchEvent(new Event('change', { bubbles: true })); await ganCham(700); }
    else ghi('Gắn thẻ: không thấy thanh kéo hình thu nhỏ — giữ khung hình mặc định');
    const nutLuu = (luuNut.isConnected && ganThay(luuNut)) ? luuNut : (ganNutLuuAnh() || luuNut);
    ganBamCu(nutLuu);
    // khung chỉnh hình đã đóng = đúng cái nút Lưu đó biến mất (không dò chữ 'Lưu' chung vì màn Cài đặt có thể có nút Lưu khác), hết chữ 'Đang lưu', và đã về màn Cài đặt
    const daLuu = () => !(nutLuu.isConnected && ganThay(nutLuu)) && !ganCoText('Đang lưu') && ganManHinh() === 'caidat';
    let ok = await ganCho(daLuu, 15000, 300);
    if (!ok) { const l2 = (nutLuu.isConnected && ganThay(nutLuu)) ? nutLuu : null; if (l2 && !ganCoText('Đang lưu')) { ghi('Gắn thẻ: hình thu nhỏ chưa lưu xong → bấm Lưu lại'); ganBam(l2); ok = await ganCho(daLuu, 15000, 300); } }
    if (!ok) throw new Error('hình thu nhỏ chưa lưu xong (khung chỉnh hình vẫn đang mở)');
    await ganCham(3500); // Facebook cần ~2s để lưu xong hình thu nhỏ → đứng yên, không làm gì thêm
    return !!r;
  }
  async function ganNhom(bao) {
    bao('Chọn nhóm…');
    const chuaKhuat = () => { const b = [...document.querySelectorAll('[role=button]')].find((x) => chuan(x.innerText).startsWith('Chia sẻ lên nhóm') && x.getClientRects().length && !x.closest('[aria-hidden="true"]') && x.closest('[role=dialog]')); if (b) { try { b.scrollIntoView({ block: 'center' }); } catch (e) { /* */ } } return b && ganThay(b) ? b : null; };
    let hang = await ganCho(() => ganNutChua('Chia sẻ lên nhóm'), 5000);
    if (!hang) { hang = await ganCho(() => ganNutChua('Chia sẻ lên nhóm') || chuaKhuat(), 6000, 400); if (hang) ghi('Gắn thẻ: mục Chia sẻ lên nhóm bị cuộn khuất → đã cuộn tới'); }
    if (!hang) throw new Error('không thấy mục Chia sẻ lên nhóm');
    const timDs = () => { const c = [...document.querySelectorAll('input[type=checkbox]')].filter((x) => ganThay(x.parentElement) && x.getAttribute('role') !== 'switch'); return c.length ? c : null; };
    let ds = null;
    const cach = [() => ganBamCu(hang), () => ganBam(hang), () => { const h = ganNutChua('Chia sẻ lên nhóm') || hang; h.click(); }, () => { const h = ganNutChua('Chia sẻ lên nhóm') || hang; const con = h.querySelector('[role=button],div,span'); (con || h).click(); }];
    for (let i = 0; i < cach.length && !ds; i++) { // (4.6) bấm bằng nhiều cách cho tới khi danh sách nhóm hiện ra
      if (i) ghi('Gắn thẻ: danh sách nhóm chưa mở → thử cách bấm khác (' + (i + 1) + '/' + cach.length + ')');
      try { cach[i](); } catch (e) { /* */ }
      ds = await ganCho(timDs, i === 0 ? 8000 : 5000);
    }
    if (!ds) throw new Error('không thấy danh sách nhóm');
    await ganCham(800);
    let moi = 0;
    for (const c of [...document.querySelectorAll('input[type=checkbox]')].filter((x) => x.getAttribute('role') !== 'switch')) { if (!c.checked) { c.click(); moi++; await ganCham(350); } }
    await ganCham(600);
    const tong = [...document.querySelectorAll('input[type=checkbox]')].filter((x) => x.getAttribute('role') !== 'switch' && x.checked).length;
    const xong = await ganCho(() => ganNut('Xong'), 5000); if (!xong) throw new Error('không thấy nút Xong của danh sách nhóm');
    ganBamCu(xong); await ganCham(900);
    return { moi, tong };
  }

  let ganDangChay = false;
  // trạng thái hiển thị của nút (5.5): từng bước có màu riêng — xong: xanh lá + dấu ✓, đang làm: vàng + vòng xoay, lỗi: đỏ + dấu ✕
  let ganTT = null; // { buoc:{vitri,the,nhom,thunho: 'cho'|'chay'|'xong'|'loi'}, chu:{}, cur, tien, loai:'chay'|'xong'|'loi', loi, mat }
  const GAN_BUOC = [['vitri', 'Vị trí'], ['the', 'Thẻ'], ['nhom', 'Nhóm'], ['thunho', 'Hình thu nhỏ']];
  const GAN_DANG = { vitri: 'gắn vị trí', the: 'gắn thẻ', nhom: 'chọn nhóm', thunho: 'sửa hình thu nhỏ' };
  const ganLam = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const ganHoa = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const ganNhan = (k) => ganHoa(String(ganTT.chu[k] || '').replace(/^Đã (gắn|chọn|sửa) /, ''));
  function ganDongChinh() {
    const t = ganTT; if (!t) return '';
    const xongK = GAN_BUOC.filter(([k]) => t.buoc[k] === 'xong' && t.chu[k]);
    const ngan = (k) => ganNhan(k);
    if (t.loai === 'xong') return 'Xong: ' + xongK.map(([k]) => ganLam(ngan(k))).join(', ') + '. Hãy kiểm tra lại rồi bấm Đăng.';
    if (t.loai === 'loi') { const k = (GAN_BUOC.find(([k2]) => t.buoc[k2] === 'loi') || [])[0]; return 'Lỗi khi ' + (k ? GAN_DANG[k] : 'thao tác') + ': ' + t.loi + '. Bấm vào đây để thử lại.'; }
    const m = (t.tien || '').match(/\d+\/\d+/);
    const cuoi = xongK.length ? xongK[xongK.length - 1][0] : null; // việc vừa xong gần nhất
    const dang = 'đang ' + (t.cur ? GAN_DANG[t.cur] : 'chuẩn bị') + (m ? ' (' + m[0] + ')' : '');
    return ganHoa((cuoi ? ganLam(t.chu[cuoi]) + ', ' : '') + dang);
  }
  async function ganChay() {
    if (ganDangChay) return; ganDangChay = true;
    ganTT = { buoc: { vitri: 'cho', the: 'cho', nhom: 'cho', thunho: 'cho' }, chu: {}, cur: null, tien: '', loai: 'chay', loi: '', mat: 0 };
    const dat = (k, tt, chu) => { ganTT.buoc[k] = tt; if (chu) ganTT.chu[k] = chu; if (tt === 'chay') ganTT.cur = k; else if (ganTT.cur === k) ganTT.cur = null; ganTT.tien = ''; ganVe(); };
    const bao = (t) => { if (ganTT) { ganTT.tien = t; ganVe(); } };
    const kq = [];
    ghi('Gắn vị trí & thẻ: bắt đầu');
    try {
      let mh = ganManHinh();
      if (mh === 'soan' || mh === 'vitri-tim') {
        dat('vitri', 'chay'); await ganViTri(bao); kq.push('vị trí'); dat('vitri', 'xong', 'Đã gắn vị trí ' + GAN.VI_TRI); ghi('Gắn vị trí & thẻ: đã gắn vị trí'); await ganCham(1500); mh = ganManHinh();
      } else dat('vitri', 'xong', 'Vị trí đã có sẵn');
      if (mh === 'the' || (await ganCho(() => ganManHinh() === 'the', 6000))) {
        dat('the', 'chay'); await ganThe(bao); const nt = ganDsThe().length; kq.push(nt + ' thẻ'); dat('the', 'xong', 'Đã gắn ' + nt + ' thẻ'); ghi('Gắn vị trí & thẻ: đã gắn ' + nt + ' thẻ'); await ganCham(1800);
      } else dat('the', 'xong', 'Thẻ đã có sẵn');
      if (!(await ganCho(() => ganManHinh() === 'caidat', 10000))) throw new Error('chưa sang được màn Cài đặt thước phim');
      dat('nhom', 'chay'); const n = await ganNhom(bao); kq.push(n.tong + ' nhóm');
      if (!(await ganCho(() => ganManHinh() === 'caidat' && ![...document.querySelectorAll('input[type=checkbox]')].some((x) => x.getAttribute('role') !== 'switch' && ganThay(x)), 12000, 300))) throw new Error('chưa quay lại được màn Cài đặt thước phim sau khi chọn nhóm');
      dat('nhom', 'xong', 'Đã chọn ' + n.tong + ' nhóm'); ghi('Gắn vị trí & thẻ: đã chọn ' + n.tong + ' nhóm'); await ganCham(900);
      dat('thunho', 'chay'); const coRange = await ganThuNho(bao); kq.push(coRange ? 'hình thu nhỏ' : 'hình thu nhỏ (bỏ qua)');
      dat('thunho', 'xong', coRange ? 'Đã sửa hình thu nhỏ' : 'Hình thu nhỏ giữ mặc định'); ghi('Gắn vị trí & thẻ: đã xử lý hình thu nhỏ');
      ganTT.loai = 'xong';
      ghi('Gắn vị trí & thẻ xong: ' + kq.join(', ') + ' — chưa bấm Đăng');
    } catch (e) {
      const k = ganTT && ganTT.cur; if (ganTT) { if (k) ganTT.buoc[k] = 'loi'; ganTT.cur = null; ganTT.loai = 'loi'; ganTT.loi = e.message; }
      ghi('Lỗi gắn vị trí & thẻ ở bước "' + (k ? GAN_DANG[k] : 'không rõ') + '": ' + e.message + (kq.length ? ' (đã xong: ' + kq.join(', ') + ')' : '')); chupLoi('gắn vị trí & thẻ');
    } finally { ganDangChay = false; if (ganTT) ganTT.mat = 0; ganVe(); }
  }
  function ganMoSua() {
    if (document.getElementById('smhfb-gan-modal')) return;
    const m = document.createElement('div'); m.id = 'smhfb-gan-modal';
    const macDinh = !(Array.isArray(lay('gan_the', null)) && lay('gan_the', null).length);
    m.innerHTML = `<div class="hop"><h3>✎ Sửa các thẻ</h3>
      <p>Mỗi thẻ một dòng — nhấn <b>Enter</b> để xuống dòng tạo thẻ mới. Nút sẽ gắn lần lượt từng thẻ theo đúng thứ tự này.</p>
      <textarea spellcheck="false"></textarea>
      <div class="dem"></div>
      <div class="nut-h"><button class="mac">Khôi phục mặc định</button><span style="flex:1"></span><button class="huy">Hủy</button><button class="luu">Lưu thẻ</button></div></div>`;
    document.body.appendChild(m);
    const ta = m.querySelector('textarea'), dem = m.querySelector('.dem');
    ta.value = ganDsThe().join('\n');
    const doc = () => [...new Set(ta.value.split('\n').map((x) => chuan(x)).filter(Boolean))];
    const cap = () => { const n = doc().length; dem.textContent = n + ' thẻ' + (macDinh && n === GAN.THE.length ? ' (đang dùng danh sách mặc định)' : ''); };
    cap(); ta.addEventListener('input', cap);
    for (const t of ['keydown', 'keyup', 'keypress']) m.addEventListener(t, (e) => { e.stopPropagation(); if (t === 'keydown' && e.key === 'Escape') m.remove(); }, true);
    const dong = () => m.remove();
    m.addEventListener('click', (e) => { if (e.target === m) dong(); });
    m.querySelector('.huy').addEventListener('click', dong);
    m.querySelector('.mac').addEventListener('click', () => { luu('gan_the', null); ghi('Gắn thẻ: khôi phục danh sách thẻ mặc định'); ta.value = GAN.THE.join('\n'); cap(); });
    m.querySelector('.luu').addEventListener('click', () => { const ds = doc(); if (!ds.length) { dem.textContent = 'Cần ít nhất 1 thẻ'; return; } luu('gan_the', ds); ghi('Gắn thẻ: đã lưu ' + ds.length + ' thẻ mới'); dong(); ghi('Gắn thẻ: đã lưu ' + ds.length + ' thẻ mới'); });
    setTimeout(() => ta.focus(), 50);
  }
  const ganCoHop = () => !!ganManHinh() || Array.from(document.querySelectorAll('div[role="dialog"]')).some((d) => d.getBoundingClientRect().height > 100 && !d.closest('[aria-hidden="true"]') && /Tạo bài viết|Cài đặt|Chia sẻ lên nhóm|thước phim/i.test(d.innerText || ''));
  let ganHtmlCu = '';
  // người dùng bấm "Đăng" → xoá thông báo (trước đó thông báo "Xong…" được giữ nguyên)
  document.addEventListener('click', (e) => { try { if (!ganTT || ganDangChay) return; const b = e.target && e.target.closest && e.target.closest('[role=button],button'); if (b && !b.closest('#smhfb-gan-w') && chuan(b.innerText) === 'Đăng') setTimeout(() => { if (!ganDangChay) { ganTT = null; ganVe(); } }, 800); } catch (er) { /* */ } }, true);
  function ganVe() {
    let w = document.getElementById('smhfb-gan-w');
    const hien = !!ganManHinh() && !dangBan;
    if (ganTT && !ganDangChay) { if (!ganCoHop()) { ganTT.mat = (ganTT.mat || 0) + 1; if (ganTT.mat >= 3) ganTT = null; } else ganTT.mat = 0; } // hộp đã đóng (đăng xong / đóng bỏ) → mới xoá thông báo
    if (!w) {
      const st = document.createElement('style');
      st.textContent = `#smhfb-gan-w{position:fixed;left:50%;transform:translateX(-50%);width:max-content;bottom:15.3px;z-index:2147483000;display:none;align-items:flex-end;gap:8.5px;max-width:calc(100vw - 20.4px);font-family:"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif}
#smhfb-gan{display:flex;flex-direction:column;gap:7.6px;min-width:min(255px,90vw);max-width:min(780px,calc(100vw - 70px));padding:11px 17px;border-radius:13.6px;border:1.7px solid #c2418a;background:#fff;color:#7a1f55;font:700 13.9px/1.35 "Segoe UI Variable Text","Segoe UI",system-ui,sans-serif;box-shadow:0 6.8px 22.1px rgba(0,0,0,.28);cursor:pointer;transition:background .2s,border-color .2s}
#smhfb-gan:hover{background:#fdf0f7}
#smhfb-gan .gh{display:flex;align-items:center;gap:8.5px;justify-content:center}#smhfb-gan .gh i{font-style:normal;font-size:20.4px}
#smhfb-gan .gx{margin-left:auto;border:0;background:transparent;color:inherit;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px;opacity:.75}#smhfb-gan .gx:hover{background:rgba(0,0,0,.06)}#smhfb-gan .gx:hover{opacity:1}
#smhfb-gan .gb{display:flex;flex-wrap:wrap;gap:6.8px;justify-content:center}
#smhfb-gan .gc{display:inline-flex;align-items:center;gap:6px;padding:4.2px 10.2px 4.2px 6px;border-radius:849.1px;border:1.7px solid #d8d2c4;background:#faf8f3;color:#6b665a;font-size:12.8px;font-weight:700;white-space:nowrap}
#smhfb-gan .gc .ic{width:18.7px;height:18.7px;border-radius:50%;flex:none;display:inline-flex;align-items:center;justify-content:center;font-size:11.9px;line-height:1;color:#fff;border:1.7px solid #cfc8b8;background:#fff}
#smhfb-gan .gc.xong{border-color:#2e9d57;background:#e6f6ec;color:#1c6b3a}#smhfb-gan .gc.xong .ic{background:#2e9d57;border-color:#2e9d57}
#smhfb-gan .gc.chay{border-color:#e0a21a;background:#fff3d1;color:#7a5410}#smhfb-gan .gc.chay .ic{border:2.5px solid #f1d38a;border-top-color:#e0a21a;background:transparent;animation:smhfbGan .9s linear infinite}
#smhfb-gan .gc.loi{border-color:#d93a3a;background:#fdeaea;color:#9c2323}#smhfb-gan .gc.loi .ic{background:#d93a3a;border-color:#d93a3a}
#smhfb-gan .gd{font-size:13.9px;font-weight:700;text-align:center;white-space:normal}
#smhfb-gan.chay{background:#fff9e8;border-color:#e0a21a;color:#7a5410;cursor:progress}
#smhfb-gan.xong{background:#eefaf2;border-color:#2e9d57;color:#1c6b3a;cursor:default}
#smhfb-gan.loi{background:#fff1f0;border-color:#d93a3a;color:#9c2323}
#smhfb-gan.chay .gd:after{content:"";display:inline-block;width:1.4em;text-align:left;animation:smhfbCham 1.2s steps(4,end) infinite}
@keyframes smhfbGan{to{transform:rotate(360deg)}}@keyframes smhfbCham{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}
#smhfb-gan-sua{width:44px;height:44px;border-radius:50%;border:1.7px solid #c2418a;background:#fff;color:#7a1f55;font-size:20px;line-height:1;cursor:pointer;box-shadow:0 3.4px 10.2px rgba(0,0,0,.22);padding:0;display:flex;align-items:center;justify-content:center;flex:none}
#smhfb-gan-sua:hover{background:#fdf0f7}#smhfb-gan-sua:disabled{opacity:.45;cursor:not-allowed}
#smhfb-gan-modal{position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px}
#smhfb-gan-modal .hop{background:#fff;color:#222;border-radius:16px;padding:20px 22px;width:min(640px,100%);box-shadow:0 12px 40px rgba(0,0,0,.35);font:15px/1.45 system-ui,sans-serif}
#smhfb-gan-modal h3{margin:0 0 6px;font-size:19px;color:#7a1f55}#smhfb-gan-modal p{margin:0 0 10px;color:#555;font-size:14px}
#smhfb-gan-modal textarea{width:100%;box-sizing:border-box;height:260px;resize:vertical;border:2px solid #d9d2c4;border-radius:12px;padding:10px 12px;font:15px/1.5 system-ui,sans-serif;color:#222;background:#fffdf8}
#smhfb-gan-modal textarea:focus{outline:none;border-color:#c2418a}#smhfb-gan-modal .dem{margin:6px 2px 12px;font-size:13.5px;color:#7a5410;font-weight:700}
#smhfb-gan-modal .nut-h{display:flex;gap:10px;align-items:center}#smhfb-gan-modal button{font:700 14.5px system-ui,sans-serif;border-radius:10px;padding:9px 16px;border:2px solid #d9d2c4;background:#f6f3ec;color:#444;cursor:pointer}
#smhfb-gan-modal button.luu{background:#c2418a;border-color:#c2418a;color:#fff}#smhfb-gan-modal button:hover{filter:brightness(.96)}`;
      document.head.appendChild(st);
      w = document.createElement('div'); w.id = 'smhfb-gan-w';
      w.innerHTML = '<div id="smhfb-gan"></div><button id="smhfb-gan-sua" title="Sửa nội dung các thẻ" aria-label="Sửa nội dung các thẻ">✎</button>';
      w.querySelector('#smhfb-gan').addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('.gx')) { if (!ganDangChay) { ganTT = null; ganVe(); } return; }
        if (ganDangChay) return;
        if (ganTT && ganTT.loai === 'xong') return; // đã xong: giữ nguyên thông báo, tránh gắn thẻ trùng
        ganChay();
      });
      w.querySelector('#smhfb-gan-sua').addEventListener('click', () => { if (!ganDangChay) ganMoSua(); });
      document.body.appendChild(w);
    }
    const nut = document.getElementById('smhfb-gan');
    let html, lop;
    if (ganTT) {
      lop = ganTT.loai;
      const chip = (k, ten) => { const tt = ganTT.buoc[k]; const ic = tt === 'xong' ? '✓' : tt === 'loi' ? '✕' : tt === 'chay' ? '' : ''; const nhan = tt === 'xong' && ganTT.chu[k] ? ganNhan(k) : ten; return `<span class="gc ${tt === 'cho' ? '' : tt}"><span class="ic">${ic}</span>${esc(nhan)}</span>`; };
      html = `<div class="gh"><i>${lop === 'xong' ? '✅' : lop === 'loi' ? '⚠️' : '📍'}</i><span>Gắn vị trí &amp; thẻ</span>${lop === 'chay' ? '' : '<button class="gx" title="Ẩn thông báo">✕</button>'}</div><div class="gb">${GAN_BUOC.map(([k, ten]) => chip(k, ten)).join('')}</div><div class="gd">${esc(ganDongChinh())}</div>`;
    } else { lop = ''; html = '<div class="gh"><i>📍</i><span>Gắn vị trí &amp; thẻ</span></div>'; }
    if (html !== ganHtmlCu) { nut.innerHTML = html; ganHtmlCu = html; }
    nut.className = lop;
    w.querySelector('#smhfb-gan-sua').disabled = ganDangChay;
    w.querySelector('#smhfb-gan-sua').style.display = (ganTT && ganTT.loai === 'xong') ? 'none' : '';
    w.style.display = (hien || ganDangChay || ganTT || document.getElementById('smhfb-gan-modal')) ? 'flex' : 'none';
  }

  // ===== sửa thước phim sau khi đăng: thẻ + cảm xúc (dùng lại từ bản 5.9) =====
  const khungKhop = (k, text) => { const kk = chuan(text).slice(0, 40); if (!kk) return false; if (chuan(k.khung.innerText).includes(kk)) return true; const k2 = khoaSo(text).slice(0, 35); return k2.length >= 12 && khoaSo(k.khung.innerText).includes(k2); };
  const idVideo = (p) => { const m = String((p && p.link) || '').match(/\/(?:reel|reels|videos)\/(\d{6,})/); return m ? m[1] : ''; };
  const khungKhopP = (k, p) => { const vid = idVideo(p); if (vid && k.khung.querySelector(`a[href*="${vid}"]`)) return true; return khungKhop(k, p.text); };
  const dauBai = (k) => thuong(chuan(k.khung.innerText).replace(/(Facebook\s*)+/g, ' ')).slice(0, 300);
  const baiDaGan = (k) => { const t = dauBai(k); const cx = /đang[^a-zà-ỹ]{0,6}cảm thấy/.test(t); return { cx, the: new RegExp('cùng với[^.]{0,80}' + thuong(CAI_DAT.TAG_TEN)).test(t), du: cx && new RegExp('đang[^a-zà-ỹ]{0,6}cảm thấy[^.]{0,60}cùng với[^.]{0,80}' + thuong(CAI_DAT.TAG_TEN)).test(t) }; };
  function chipsSua(d) {
    const bs = Array.from(d.querySelectorAll('[role="button"]')).filter((b) => chuan(b.innerText) && !/^(Đóng|Quay lại|Close)$/i.test(b.getAttribute('aria-label') || '')); // bỏ nút Đóng / Quay lại
    // (4.5) ô cảm xúc nhận theo chữ: "Cảm xúc/hoạt động" (chưa có) hoặc "Đang …" (đã có cảm xúc/hoạt động)
    const camXuc = bs.find((b) => /^(Cảm xúc|Đang cảm thấy)/i.test(chuan(b.innerText))) || bs.slice(1).find((b) => /^Đang\s(?!ở(\s|$))/i.test(chuan(b.innerText))) || bs.slice(2, 7).find((b) => { const t = chuan(b.innerText); return t.length <= 40 && !/^(Cộng tác viên|Thêm file khác|Chỉnh sửa|Mọi người|Lưu|Hủy|Nhận |Thêm )/i.test(t) && !(CAI_DAT.TAG_TEN && thuong(t).includes(thuong(CAI_DAT.TAG_TEN))); }) || null; // (4.8) Facebook đã có cảm xúc thì ô chỉ hiện đúng tên cảm xúc (vd "tuyệt vời"), không có chữ "Đang"
    return { the: bs[0] || null, viTri: bs[1] || null, camXuc, chu: bs.slice(0, 6).map((b) => chuan(b.innerText)) };
  }
  const daGanThe = (c) => !!c.the && thuong(chuan(c.the.innerText)).includes(thuong(CAI_DAT.TAG_TEN));
  const chuaCamXuc = (c) => !!c.camXuc && /^cảm xúc/i.test(chuan(c.camXuc.innerText)); // ô còn là "Cảm xúc/hoạt động" mới cần chọn
  async function moManHinhSua(k, text) {
    kiemDung();
    const MUC_SUA = /^Chỉnh sửa (bài viết|thước phim|video|reel)/i;
    let muc = null;
    for (let lanMo = 0; lanMo < 3 && !muc; lanMo++) {
      if (lanMo) { // lần 2: Facebook có thể đã vẽ lại bài → tìm lại khung, đóng menu mở dở, cuộn giữa màn hình rồi bấm lại
        if (document.querySelector('[role="menu"]')) { k.menu.click(); await sleep(700); }
        await sleep(1500); kiemDung();
      }
      if (text && !k.menu.isConnected) { const k2 = cacKhungBai().find((x) => khungKhop(x, text)); if (k2) k = k2; }
      k.khung.scrollIntoView({ block: 'center' }); await sleep(700);
      if (lanMo) { try { ganBam(k.menu); } catch (e) { k.menu.click(); } } else k.menu.click(); // lần 2-3: chuỗi sự kiện chuột đầy đủ như người bấm
      muc = await cho(() => Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"]')).find((x) => MUC_SUA.test(chuan(x.innerText))) || (!dungTrang() && !dangODuongSua() ? 'roi' : null), lanMo ? 6000 : 5000);
      if (muc === 'roi') throw new Error('Facebook chuyển sang trang khác sau khi bấm ⋯');
    }
    if (!muc) {
      const ds = Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"]')).map((x) => chuan(x.innerText).slice(0, 30)).slice(0, 8).join(' | ');
      if (document.querySelector('[role="menu"]')) k.menu.click();
      throw new Error('không thấy mục sửa trong menu ⋯ của bài' + (ds ? ' (menu có: ' + ds + ')' : ' (menu không mở, đã thử 3 lần)'));
    }
    luu('quet_dang_sua', Date.now());
    muc.click();
    let d = await cho(() => hopSua() || (!dungTrang() && !dangODuongSua() ? 'roi' : null), 10000, 400);
    if (!d && muc.isConnected) { ghi('Quét: bấm "Chỉnh sửa" lần 1 chưa ăn → bấm lại'); try { ganBam(muc); } catch (e) { muc.click(); } d = await cho(() => hopSua() || (!dungTrang() && !dangODuongSua() ? 'roi' : null), 10000, 400); }
    if (d === 'roi') throw new Error('Facebook chuyển sang trang khác khi mở màn hình chỉnh sửa');
    if (!d) throw new Error('không mở được màn hình chỉnh sửa');
    await cho(() => { const h = hopSua(); return h && (chipsSua(h).camXuc || !/^Chỉnh sửa thước phim/.test(chuan(h.innerText))); }, 8000, 400); // chờ các nút hiện đủ
    await sleep(800);
    return hopSua() || d;
  }
  async function ganTheSuaMot(lan) {
    kiemDung();
    const bam2 = (el) => { if (lan) { try { ganBam(el); } catch (e) { el.click(); } } else el.click(); };
    const c = chipsSua(hopSua()); if (!c.the) throw new Error('không thấy nút gắn thẻ (ô "Mọi người")');
    bam2(c.the);
    const inp = await cho(() => document.querySelector('input[aria-label="Tìm kiếm bạn bè"]'), 8000);
    if (!inp) throw new Error('không mở được bảng "Gắn thẻ người khác"');
    inp.focus(); document.execCommand('insertText', false, CAI_DAT.TAG_TEN);
    if (!inp.value) { // execCommand không ăn → đặt giá trị kiểu React
      try { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, CAI_DAT.TAG_TEN); inp.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { /* */ }
    }
    const hang = await cho(() => Array.from(document.querySelectorAll('li[role="option"]')).find((li) => dangHien(li) && /Trang\s*·/.test(chuan(li.innerText)) && chuan(li.innerText).startsWith(chuan(CAI_DAT.TAG_TEN))), 9000, 400);
    if (!hang) throw new Error(`không thấy Trang "${CAI_DAT.TAG_TEN}" trong kết quả tìm`);
    kiemDung(); bam2(hang.querySelector('[role="none"]') || hang);
    const duoc = await cho(() => Array.from(document.querySelectorAll('span,div')).some((e) => !e.childElementCount && chuan(e.textContent) === 'Được gắn thẻ' && dangHien(e)), 6000);
    if (!duoc) throw new Error('đã bấm chọn nhưng chưa thấy mục "Được gắn thẻ"');
    const xong = Array.from(document.querySelectorAll('[role="button"]')).filter((b) => chuan(b.innerText) === 'Xong' && dangHien(b)).pop();
    if (!xong) throw new Error('không thấy nút "Xong"');
    bam2(xong);
    if (!(await cho(() => !document.querySelector('input[aria-label="Tìm kiếm bạn bè"]'), 6000))) { const x2 = Array.from(document.querySelectorAll('[role="button"]')).filter((b) => chuan(b.innerText) === 'Xong' && dangHien(b)).pop(); if (x2) { try { ganBam(x2); } catch (e) { x2.click(); } } }
    // (4.5) xác nhận có chờ: Facebook vẽ lại màn sửa mất vài giây
    if (!(await cho(() => { const d2 = hopSua(); return d2 && daGanThe(chipsSua(d2)); }, 8000, 400))) throw new Error('đã chọn thẻ nhưng màn hình chỉnh sửa chưa hiện thẻ');
  }
  async function ganTheSua() {
    try { await ganTheSuaMot(0); }
    catch (e1) {
      if (e1 instanceof LoiDung || !hopSua()) throw e1;
      ghi('Gắn thẻ lần 1 chưa được (' + e1.message + ') → thử lại bằng cách bấm khác');
      if (document.querySelector('input[aria-label="Tìm kiếm bạn bè"]')) { // bảng gắn thẻ còn mở → đóng
        const x = Array.from(document.querySelectorAll('[role="button"]')).filter((b) => /^(Xong|Quay lại)$/.test(chuan(b.innerText || b.getAttribute('aria-label'))) && dangHien(b)).pop() || Array.from(document.querySelectorAll('[aria-label="Quay lại"]')).find(dangHien);
        if (x) x.click(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
        await sleep(1200);
      }
      const d = hopSua(); if (d && daGanThe(chipsSua(d))) return; // lần 1 thật ra đã được
      await ganTheSuaMot(1);
    }
  }
  async function camXucSua(lan = 0) {
    kiemDung();
    const bam2 = (el) => { if (lan) { try { ganBam(el); } catch (e) { el.click(); } } else el.click(); };
    const c = chipsSua(hopSua()); if (!c.camXuc) throw new Error('không thấy nút cảm xúc');
    bam2(c.camXuc);
    const lb = await cho(() => { const u = document.querySelector('ul[role="listbox"]'); return u && u.querySelectorAll('li[role="option"]').length > 10 ? u : null; }, 9000, 400);
    if (!lb) throw new Error('không mở được bảng cảm xúc');
    const lis = Array.from(lb.querySelectorAll('li[role="option"]'));
    const coSan = CAI_DAT.CAM_XUC_CHON.filter((n) => lis.some((x) => chuan(x.innerText) === n)); // (4.5) chỉ chọn cảm xúc thật sự có trong bảng
    const ds = coSan.length ? coSan : ['hạnh phúc'];
    const nhan0 = ds[Math.floor(Math.random() * ds.length)];
    const li = lis.find((x) => chuan(x.innerText) === nhan0) || lis[0];
    const nhan = chuan(li.innerText);
    kiemDung(); li.scrollIntoView({ block: 'center' }); await sleep(400);
    bam2(li.querySelector('[role="button"]') || li);
    if (!(await cho(() => !document.querySelector('ul[role="listbox"]'), 6000))) { // bấm chưa ăn → bấm lại kiểu khác
      const li2 = Array.from(document.querySelectorAll('ul[role="listbox"] li[role="option"]')).find((x) => chuan(x.innerText) === nhan);
      if (li2) { try { ganBam(li2.querySelector('[role="button"]') || li2); } catch (e) { li2.click(); } }
      await cho(() => !document.querySelector('ul[role="listbox"]'), 6000);
    }
    // xác nhận: ô cảm xúc chuyển từ "Cảm xúc/hoạt động" sang "Đang cảm thấy …"
    const daChon = () => { const d2 = hopSua(); if (!d2) return null; const c2 = chipsSua(d2); const t = c2.camXuc ? chuan(c2.camXuc.innerText) : ''; return t && !/^cảm xúc/i.test(t) ? t : null; };
    const t = await cho(daChon, 8000, 400);
    if (!t) { dongBangCamXuc(); const d3 = hopSua(); const c3 = d3 && chipsSua(d3); throw new Error(`đã chọn "${nhan}" nhưng màn hình chỉnh sửa chưa hiện (ô hiện đang là: ${(c3 && c3.chu ? c3.chu.join(' | ') : '?').slice(0, 120)})`); }
    if (!thuong(t).includes(thuong(nhan))) ghi(`Cảm xúc trên màn sửa: "${t.slice(0, 40)}" (đã chọn "${nhan}") → coi như đã gắn`);
    return t;
  }

  // =====================================================================
  //  (6.0) Khanh: bỏ bài ghim + mục "Đáng chú ý" ở đầu trang — chỉ đếm bài mới trong dòng thời gian 7 ngày qua
  // =====================================================================
  function neoFeedKhanh() { // tiêu đề dòng thời gian (nút "Bộ lọc" / chữ "Bài viết") — khung đứng TRƯỚC nó là mục nổi bật/ghim
    const loc = Array.from(document.querySelectorAll('[role="button"]')).find((b) => chuan(b.innerText || b.getAttribute('aria-label') || '') === 'Bộ lọc' && dangHien(b));
    if (loc) return loc;
    return Array.from(document.querySelectorAll('h2')).find((e) => chuan(e.textContent) === 'Bài viết' && dangHien(e)) || null;
  }
  const tieuDeNoiBat = (p) => Array.from(p.querySelectorAll('h2,h3,span')).find((e) => e.children.length === 0 && /^(Đáng chú ý|Bài viết nổi bật|Nổi bật)$/i.test(chuan(e.textContent)));
  function laKhungNoiBat(khung, neo) {
    const dau = chuan(khung.innerText).slice(0, 200);
    if (/Bài viết đã ghim|Đã ghim/i.test(dau) || khung.querySelector('[aria-label*="ghim" i]')) return 'ghim';
    if (neo && !khung.contains(neo) && (khung.compareDocumentPosition(neo) & Node.DOCUMENT_POSITION_FOLLOWING)) return 'truoc';
    for (let p = khung.parentElement, i = 0; p && i < 16; p = p.parentElement, i++) {
      if (tieuDeNoiBat(p)) return (neo ? !p.contains(neo) : i < 6) ? 'noibat' : '';
    }
    return '';
  }
  // không đọc trang Khanh khi: tab phụ, tạm dừng, đang đăng/comment, đang đếm ngược, hoặc sắp/đang tới giờ đăng 1 bài
  const khanhBan = () => !laTabChinh() || tamDung() || !!lay('dang_do', null) || dangBan || !!demNguoc || !!lay('cho_tay6', null)
    || (() => { const kt = keTiep(); return !!(kt && Date.now() > kt.den - 15 * 60000 && Date.now() < kt.den + 60 * 60000); })();

  // =====================================================================
  //  Báo cáo tuần Khanh Trầm Hương (chỉ Máy Cao) — dùng lại từ bản 5.9, sửa: bỏ bài ghim / "Đáng chú ý"
  // =====================================================================
  const dangODuongKhanh = () => /nhangtramnuquangnam/i.test(location.pathname) || location.pathname.replace(/\/+$/, '') === '/100063806572484' || /[?&]id=100063806572484/.test(location.search);
  function moc0Khanh(now) {
    const d = new Date(now); const ph = docGio(CAI_DAT.KHANH_GIO);
    d.setDate(d.getDate() - ((d.getDay() - CAI_DAT.KHANH_THU + 7) % 7)); d.setHours(Math.floor(ph / 60), ph % 60, 0, 0);
    if (d.getTime() > now) d.setDate(d.getDate() - 7);
    return d.getTime();
  }
  function gioKhanh(txt, lenient) {
    const t = chuan(String(txt).replace(/(Facebook\s*)+/g, ' ')).slice(0, 400);
    const now = Date.now(); const ds = [];
    const cach = (d, h, m) => { const x = new Date(d); x.setHours(h == null ? 12 : +h, m == null ? 0 : +m, 0, 0); return Math.max(0, (now - x.getTime()) / 864e5); };
    let m = t.match(/(\d+)\s*(giây|phút|giờ|ngày|tuần|tháng|năm)\s*trước/i);
    if (!m && lenient) m = t.match(/(?:^|[\s·])(\d+)\s*(giây|phút|giờ|ngày|tuần)(?=\s|·|$)/i);
    if (m) { const n = +m[1], u = m[2].toLowerCase(); ds.push({ i: m.index, len: m[0].length, tuoi: u === 'giây' ? 0 : u === 'phút' ? n / 1440 : u === 'giờ' ? n / 24 : u === 'ngày' ? n : u === 'tuần' ? n * 7 : u === 'tháng' ? n * 30 : n * 365 }); }
    m = t.match(/vừa xong/i); if (m) ds.push({ i: m.index, len: m[0].length, tuoi: 0 });
    m = t.match(/hôm qua(?:\s*lúc\s*(\d{1,2}):(\d{2}))?/i); if (m) { const d = new Date(now); d.setDate(d.getDate() - 1); ds.push({ i: m.index, len: m[0].length, tuoi: cach(d, m[1], m[2]) }); }
    m = t.match(/(\d{1,2})\s*tháng\s*(\d{1,2})(?:\s*,\s*(\d{4}))?(?:\s*lúc\s*(\d{1,2}):(\d{2}))?/i);
    if (m) { const nam = m[3] ? +m[3] : new Date(now).getFullYear(); let x = new Date(nam, +m[2] - 1, +m[1]); if (!m[3] && x.getTime() > now + 864e5) x = new Date(nam - 1, +m[2] - 1, +m[1]); ds.push({ i: m.index, len: m[0].length, tuoi: cach(x, m[4], m[5]) }); }
    if (lenient) {
      m = t.match(/thứ\s*(hai|ba|tư|năm|sáu|bảy)(?:\s*lúc\s*(\d{1,2}):(\d{2}))?|chủ nhật(?:\s*lúc\s*(\d{1,2}):(\d{2}))?/i);
      if (m) { const mp = { hai: 1, ba: 2, 'tư': 3, 'năm': 4, 'sáu': 5, 'bảy': 6 }; const tg = m[1] ? mp[m[1].toLowerCase()] : 0; const d = new Date(now); let lui = (d.getDay() - tg + 7) % 7; if (lui === 0) lui = 7; d.setDate(d.getDate() - lui); ds.push({ i: m.index, len: m[0].length, tuoi: cach(d, m[2] || m[4], m[3] || m[5]) }); }
    }
    if (!ds.length) return null;
    ds.sort((x, y) => x.i - y.i); const g = ds[0];
    return g.i > 300 ? null : { tuoi: g.tuoi, den: g.i + g.len };
  }
  const KHANH_LINK_BAI = /\/posts\/|\/permalink\.php|\/reels?\/\d|\/videos\/\d|story_fbid=|\/watch\/?\?v=/;
  function sachLinkKhanh(h, kieu) {
    try {
      const u = new URL(h, location.href); if (!/(^|\.)facebook\.com$/.test(u.hostname)) return '';
      if (/comment_id=|reply_comment_id=/.test(u.search)) return '';
      const tp = u.pathname + u.search;
      const laAnh = /^\/photo\/?$|\/photo\.php|\/photos\//.test(u.pathname) && /fbid=|\/photos\/.+\/\d{6,}/.test(tp);
      const laBai = KHANH_LINK_BAI.test(tp) && !laAnh;
      if (kieu === 'bai' ? !laBai : !laAnh) return '';
      const giu = new URLSearchParams(); ['story_fbid', 'id', 'v', 'fbid'].forEach((k) => { if (u.searchParams.get(k)) giu.set(k, u.searchParams.get(k)); });
      return u.origin + u.pathname + (giu.toString() ? '?' + giu : '');
    } catch (e) { return ''; }
  }
  const gioTuNeoKhanh = (goc) => {
    const ds = [];
    for (const a of goc.querySelectorAll('a[href]')) { const sp = a.querySelector('[aria-labelledby]'); if (!sp) continue; const el = document.getElementById((sp.getAttribute('aria-labelledby') || '').split(/\s+/)[0]); if (el) ds.push(chuan(el.textContent)); if (ds.length >= 6) break; }
    return ds.join(' · ');
  };
  const idMenuKhanh = new WeakMap(); let demMenuKhanh = 0;
  async function docKhungKhanh(co) {
    const ds = []; const ten = chuan(CAI_DAT.KHANH_TEN);
    const sach = (s) => chuan(String(s).replace(/(Facebook\s*)+/g, ' '));
    const neoFeed = neoFeedKhanh();
    for (const { khung, menu } of cacKhungBai()) {
      if (laKhungNoiBat(khung, neoFeed)) continue; // (6.0) bài ghim / mục nổi bật: không đếm
      let hang = null, g = null;
      // hàng đầu bài = khung nhỏ (cao ≤ 200px) đầu tiên quanh nút ⋯ có chữ giờ đăng; Facebook giấu chữ giờ (nhất là ngày tháng cũ) trong phần tử aria-labelledby của neo giờ, innerText không có
      for (let p = menu.parentElement, i = 0; p && khung.contains(p) && i < 10; p = p.parentElement, i++) {
        if (p.getBoundingClientRect().height > 200) break;
        const lb = gioTuNeoKhanh(p); const x = gioKhanh((lb ? lb + ' · ' : '') + p.innerText, true); if (x) { hang = p; g = x; break; }
      }
      if (!g) continue; // chưa đọc được giờ (bài chưa vẽ xong) → bỏ qua, lượt sau đọc lại; KHÔNG đoán theo giờ của comment
      const tk = sach(khung.innerText), th = hang ? sach(hang.innerText) : ''; const ix = th ? tk.indexOf(th) : -1;
      const txt = (ix >= 0 ? tk.slice(ix + th.length) : tk.slice(g.den)).trim().slice(0, 70);
      if (!idMenuKhanh.has(menu)) idMenuKhanh.set(menu, ++demMenuKhanh);
      const key = txt.length >= 12 ? txt : (txt + '|m' + idMenuKhanh.get(menu));
      const cu = co && co.get(key);
      if (cu && cu.loai === 2) { ds.push({ key, tuoi: g.tuoi, link: cu.link, loai: 2 }); continue; }
      const neo = Array.from(khung.querySelectorAll('a[href]')); const trongHang = hang ? neo.filter((a) => hang.contains(a)) : [];
      const tim = (arr, kieu) => { for (const a of arr) { const l = sachLinkKhanh(a.href, kieu); if (l) return l; } return ''; };
      let link = tim(trongHang, 'bai'), loai = link ? 2 : 0;
      if (!link && hang) {
        const ung = trongHang.filter((a) => { const r = a.getBoundingClientRect(); return r.width >= 8 && r.width <= 170 && r.height >= 8 && r.height <= 30 && !chuan(a.textContent).includes(ten); });
        for (const a of ung.slice(0, 5)) { try { a.focus({ preventScroll: true }); } catch (e) { /* */ } await sleep(220); link = sachLinkKhanh(a.href, 'bai'); try { a.blur(); } catch (e) { /* */ } if (link) { loai = 2; break; } }
      }
      if (!link) { link = tim(neo, 'bai'); if (link) loai = 2; }
      if (!link) { link = tim(neo, 'anh'); if (link) loai = 1; }
      ds.push({ key, tuoi: g.tuoi, link, loai });
    }
    return ds;
  }
  async function docTrangKhanh() {
    const t0 = Date.now(); const gom = []; const co = new Map(); let khongTang = 0;
    const gop = async () => {
      let moi = 0;
      for (const p of await docKhungKhanh(co)) {
        const cu = co.get(p.key);
        if (!cu) { const it = { key: p.key, link: p.link, loai: p.loai, tuoi: p.tuoi }; co.set(p.key, it); gom.push(it); moi++; }
        else if (p.loai > cu.loai) { cu.link = p.link; cu.loai = p.loai; }
      }
      return moi;
    };
    while (Date.now() - t0 < 80000) {
      const moi = await gop();
      const cu7 = gom.filter((p) => p.tuoi >= 7).length;
      if (gom.length >= CAI_DAT.KHANH_TOI_DA_BAI || (cu7 >= 2 && gom.some((p) => p.tuoi < 7)) || cu7 >= 3) break;
      khongTang = moi === 0 ? khongTang + 1 : 0;
      if (khongTang >= 7) break;
      window.scrollBy(0, Math.round(window.innerHeight * 0.8)); await sleep(1300 + Math.floor(Math.random() * 900));
    }
    // bài trong tuần mà chưa có link bài thật (bị trống lúc cuộn / chưa chạm được giờ đăng) → về đầu trang, đi xuống lại và thử tiếp
    for (let r = 0; r < 2 && gom.some((p) => p.tuoi < 7 && p.loai < 2); r++) {
      window.scrollTo(0, 0); await sleep(1600);
      for (let k = 0; k < 14; k++) {
        await gop(); if (!gom.some((p) => p.tuoi < 7 && p.loai < 2)) break;
        window.scrollBy(0, Math.round(window.innerHeight * 0.7)); await sleep(1300 + Math.floor(Math.random() * 700));
      }
    }
    // cùng một bài đọc ra hai lần (Facebook vẽ bài chia sẻ 2 lần) → gộp theo link bài thật
    const thay = new Set(); const day = [];
    for (const p of gom.slice().sort((x, y) => x.tuoi - y.tuoi)) { const k = p.loai === 2 && p.link ? p.link.replace(/\/$/, '') : null; if (k && thay.has(k)) continue; if (k) thay.add(k); day.push(p); }
    return day;
  }
  const ngayThangKhanh = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
  function tinKhanh(tuan, now) {
    const dong = tuan.map((p, i) => `Bài ${i + 1}: ${p.link || '(chưa lấy được link)'}`);
    return `${ngayThangKhanh(new Date(now))} ${CAI_DAT.KHANH_TEN} 7 ngày qua đã lên ${tuan.length} bài` + (dong.length ? '\n' + dong.join('\n') : '');
  }
  function khanhDenHan() {
    const now = Date.now(); const t0 = moc0Khanh(now); const M = CAI_DAT.KHANH_MOC_GIO;
    const st = lay('khanh', null) || {}; const s = st.t0 === t0 ? st : { t0, slot: -1, xong: false };
    if (s.xong) return null;
    let cur = -1; M.forEach((h, i) => { if (t0 + h * 3600e3 <= now) cur = i; });
    if (cur < 0 || cur <= s.slot) return null;
    if (now > t0 + (M[M.length - 1] + 6) * 3600e3) { if (!s.boQua) { luu('khanh', Object.assign({}, s, { boQua: true })); if ((s.lan || 0) > 0) ghi(`${CAI_DAT.KHANH_TEN}: tuần này không đọc được trang sau ${M.length} lần → bỏ qua, chờ thứ Sáu tuần sau`); } return null; }
    return { t0, cur, s };
  }
  async function khanhTuan() {
    if (CAI_DAT.KHANH_BAT === false || lay('khanh_dang', null)) return false;
    const dh = khanhDenHan(); if (!dh) return false;
    if (khanhBan() || !trongGioNhan() || dangHoan()) return false;
    if ((await batDemNguoc('mở trang ' + CAI_DAT.KHANH_TEN + ' (báo cáo tuần)')) !== 'ok') { ghi(`${CAI_DAT.KHANH_TEN}: nhân sự bấm Hoãn → để lượt sau`); return false; }
    luu('khanh', Object.assign({}, dh.s, { t0: dh.t0, slot: dh.cur, lan: (dh.s.lan || 0) + 1, luc: Date.now() }));
    luu('khanh_dang', { luc: Date.now(), t0: dh.t0, slot: dh.cur, slotTruoc: dh.s.slot, nav: 0 });
    ghi(`${CAI_DAT.KHANH_TEN}: đến giờ báo cáo tuần (lần ${(dh.s.lan || 0) + 1}/${CAI_DAT.KHANH_MOC_GIO.length}) → mở trang để đọc 7 ngày gần nhất`);
    await sleep(800); roiTrang(CAI_DAT.KHANH_URL); return true;
  }
  async function khanhThuNgay() { // nút "Kiểm thử ngay": chỉ đọc + hiển thị trong popup, KHÔNG gửi Lark
    if (khanhBan()) { ghi(`${CAI_DAT.KHANH_TEN}: tab đang bận việc khác nên chưa kiểm thử được — thử lại sau`); return; }
    luu('khanh_dang', { luc: Date.now(), thu: true, nav: 0, slot: -9, slotTruoc: -9 });
    ghi(`${CAI_DAT.KHANH_TEN}: kiểm thử (chỉ đọc và hiện trong popup, không gửi Lark)`);
    await sleep(500); roiTrang(CAI_DAT.KHANH_URL);
  }
  async function tiepKhanh() {
    const kd = lay('khanh_dang', null); if (!kd) return false;
    const huy = (lyDo, giuSlot) => { luu('khanh_dang', null); if (giuSlot && !kd.thu) { const s = lay('khanh', null) || {}; luu('khanh', Object.assign({}, s, { slot: kd.slotTruoc })); } ghi(`${CAI_DAT.KHANH_TEN}: ${lyDo}`); if (!dungTrang()) setTimeout(() => { if (!dangBan && !lay('dang_do', null)) veTrang(); }, 1500); };
    if (Date.now() - kd.luc > 12 * 60000) { huy('quá thời gian → chờ lần thử sau'); return true; }
    if (!laTabChinh()) return false;
    if (lay('dang_do', null) || dangBan) { huy('có việc đăng bài đang chạy → nhường, thử lại sau', true); return false; }
    if (lay('tam_dung', false)) return false;
    if (!dangODuongKhanh()) {
      if ((kd.nav || 0) >= 2) { huy('không mở được trang → thử lại ở lần sau'); return true; }
      kd.nav = (kd.nav || 0) + 1; luu('khanh_dang', kd); await sleep(600); roiTrang(CAI_DAT.KHANH_URL); return true;
    }
    if (document.visibilityState !== 'visible') return true; // tab ẩn: Facebook không vẽ bài → chờ
    dangBan = true; giuKhoa(); let ds = null, loi = '';
    try { await cho(() => cacKhungBai().length > 0, 25000, 700); ds = await docTrangKhanh(); } catch (e) { loi = e.message; }
    finally { dangBan = false; giuKhoa(); }
    const now = Date.now();
    if (!ds || !ds.length) {
      kd.that = (kd.that || 0) + 1; luu('khanh_dang', kd);
      if (kd.that < 2) { ghi(`${CAI_DAT.KHANH_TEN}: chưa đọc được bài nào${loi ? ' (' + loi + ')' : ''} → tải lại trang đọc lần 2`); await sleep(1500); roiTrang(); return true; }
      huy('đọc trang lỗi 2 lần (không thấy bài nào) → thử lại ở lần sau');
      if (!kd.thu) luu('khanh_kq', Object.assign({}, lay('khanh_kq', {}) || {}, { loi: 'Lần đọc ' + gioStr(new Date(now)) + ' chưa được — script sẽ tự thử lại theo lịch', loiLuc: now }));
      return true;
    }
    const tuan = ds.filter((p) => p.tuoi < 7).sort((x, y) => x.tuoi - y.tuoi); // bài mới nhất = Bài 1
    const nd = tinKhanh(tuan, now);
    const nBai = tuan.filter((p) => p.loai === 2).length, nAnh = tuan.filter((p) => p.loai === 1).length, nThieu = tuan.length - nBai - nAnh;
    ghi(`${CAI_DAT.KHANH_TEN}: ${tuan.length} bài trong 7 ngày — link bài ${nBai}, chỉ có link ảnh ${nAnh}, chưa lấy được link ${nThieu}`);
    if (kd.thu) { luu('khanh_thu', { luc: now, nd }); luu('khanh_dang', null); ghi(`${CAI_DAT.KHANH_TEN}: kiểm thử xong — ${tuan.length} bài trong 7 ngày (xem tab "Khanh TH")`); setTimeout(veTrang, 2500); return true; }
    ghi(`${CAI_DAT.KHANH_TEN}: đọc được ${ds.length} bài, ${tuan.length} bài trong 7 ngày qua`);
    const ok = await guiLark('baocao', nd, { khoa: 'khanh_' + kd.t0 });
    const hoan = !ok && !trongGioNhan(); // ngoài giờ nhắn: tin được để dành, đến giờ nhắn sẽ gửi
    if (ok || hoan) {
      const s = lay('khanh', null) || {}; luu('khanh', Object.assign({}, s, { t0: kd.t0, xong: true, xongLuc: now }));
      luu('khanh_kq', { luc: now, nd, n: tuan.length, gui: ok ? 'da_gui' : 'cho_gio_nhan' });
      luu('khanh_dang', null); setTimeout(veTrang, 2500);
    } else {
      luu('khanh_kq', Object.assign({}, lay('khanh_kq', {}) || {}, { loi: 'Đọc được nhưng chưa gửi được vào Lark lúc ' + gioStr(new Date(now)) + ' — script sẽ thử lại theo lịch', loiLuc: now }));
      huy('đọc xong nhưng gửi Lark chưa được → thử lại ở lần sau');
    }
    return true;
  }

  // =====================================================================
  //  NHIỀU TAB FACEBOOK: chỉ 1 tab làm việc
  // =====================================================================
  const cuHon = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0); } return false; };
  let dangChay = false, nhipBatDau = 0, baoTreo = 0, dungMoc = lay('dung_moc', 0), choNhanKhoa = false;
  function giuKhoa() {
    const k = GM_getValue('khoa_dang_bai_that', null);
    const now = Date.now();
    const hienThi = document.visibilityState === 'visible';
    const cu = !k || now - k.ts > 150000;
    const cuaMinh = k && k.id === MA_TAB;
    const gianhDuoc = k && !k.ghim && !k.ban && !k.hien && hienThi && now - (k.anTu || k.ts) > 90000;
    const banCu = k && !k.ghim && !k.ban && cuHon(k.v || '0', PHIEN_BAN) && (hienThi || !k.hien);
    if (cu || cuaMinh || gianhDuoc || banCu) {
      if (banCu && !cuaMinh) ghi('Tab khác đang chạy bản cũ ' + (k.v || '') + ' → tab này (bản ' + PHIEN_BAN + ') nhận làm việc');
      if (!cuaMinh) luuNK('Nhận quyền làm việc từ tab ' + ((k && k.id) || '(chưa có)'), false);
      const anTu = hienThi ? 0 : ((cuaMinh && k.anTu && !k.hien) ? k.anTu : now);
      GM_setValue('khoa_dang_bai_that', { id: MA_TAB, ts: now, hien: hienThi, anTu, ban: dangBan || dangChay, v: PHIEN_BAN, ghim: !!(cuaMinh && k.ghim) });
      return true;
    }
    return false;
  }
  const laTabChinh = () => { const k = GM_getValue('khoa_dang_bai_that', {}) || {}; return k.id === MA_TAB && Date.now() - k.ts <= 150000; };
  function kiemDung() {
    if (!laTabChinh()) throw new LoiTamHoan('Tạm mất quyền làm việc — lượt này hoãn, lát nữa làm tiếp');
    if (tamDung() || lay('dung_moc', 0) > dungMoc) throw new LoiDung('Đã nhận yêu cầu Tạm dừng');
    if (document.visibilityState !== 'visible') throw new LoiTamHoan('Tab bị ẩn trong lúc thao tác — chờ tab hiện lại sẽ làm tiếp');
  }
  async function nhanQuyen() {
    if (dangChay || choNhanKhoa) return false;
    choNhanKhoa = true;
    try {
      if (!giuKhoa()) return false;
      await sleepThat(180 + Math.floor(Math.random() * 120));
      if (!laTabChinh()) return false;
      dangChay = true; nhipBatDau = Date.now(); giuKhoa();
      dungMoc = lay('dung_moc', 0);
      return true;
    } finally { choNhanKhoa = false; }
  }

  // =====================================================================
  //  Nhận biết trang Facebook (khung bài, video, màn sửa)
  // =====================================================================
  const cheDoThu = false; // (bản cũ có "quét thử"; 6.0 không còn)
  const dangODuongSua = () => /\/post\/edit/.test(location.pathname);
  // Mỗi bài trên trang có đúng 1 nút ⋯ "Hành động đối với bài viết này" → leo lên đến khung chỉ chứa 1 bài
  function cacKhungBai() {
    const out = [];
    for (const b of document.querySelectorAll('[aria-label^="Hành động đối với bài viết này"][role="button"]')) {
      let p = b, best = null;
      for (let i = 0; i < 30 && p; i++) {
        p = p.parentElement; if (!p) break;
        if (p.querySelectorAll('[aria-label^="Hành động đối với bài viết này"][role="button"]').length > 1) break;
        best = p;
      }
      if (best) out.push({ khung: best, menu: b });
    }
    return out;
  }
  // link bài: /reel/ /videos/ = video; /posts/ /photos/ = không phải; còn lại = chưa biết (null)
  const laVideoApi = (p) => { const l = String(p.link || ''); if (/\/(reel|reels|videos|watch)\b/i.test(l)) return true; if (/\/(posts|photos?|permalink)\b|story_fbid/i.test(l)) return false; return null; };
  const hopSua = () => hopThoai((d) => /^Chỉnh sửa/.test(chuan(d.innerText)) && nutTheoChu(d, 'Lưu'));
  // hộp soạn bài / màn chỉnh sửa đang mở mà KHÔNG phải script mở → có thể nhân viên đang thao tác tay: chờ; để nguyên ≥ 10 phút → coi là bỏ quên
  function nguoiDangThaoTac() {
    const sua = dangODuongSua();
    const el = sua ? hopSua() : (hopSoanBai() || hopDangDo());
    if (!sua && !el) { window.__smhNguoi = null; return false; }
    if (!sua && window.__smhMoHop) return false; // script tự mở → script tự đóng được
    const chu = location.pathname + '|' + (el ? chuan(el.innerText).slice(0, 500) : '');
    const w = window.__smhNguoi; const bg = Date.now();
    if (!w) { window.__smhNguoi = { luc: bg, chu }; ghi((sua ? 'Đang có màn chỉnh sửa bài' : 'Đang có hộp soạn bài') + ' do người mở (không phải script) — có thể nhân viên đang thao tác → script chờ, không đóng ngang'); return true; }
    if (w.chu !== chu) { w.chu = chu; w.luc = bg; w.boQuen = false; return true; }
    if (w.boQuen) return false;
    if (bg - w.luc >= 10 * 60000) { w.boQuen = true; ghi((sua ? 'Màn chỉnh sửa bài' : 'Hộp soạn bài') + ' để nguyên hơn 10 phút không thay đổi → coi như bỏ quên, script đóng lại để làm tiếp'); return false; }
    return true;
  }
  async function dongManHinhSua() {
    for (let lan = 0; lan < 3 && dangODuongSua(); lan++) {
      dongBangCamXuc();
      const x = Array.from(document.querySelectorAll('[aria-label="Đóng"]')).filter(dangHien).sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)[0];
      if (x && lan < 2) { if (lan) { try { ganBam(x); } catch (e) { x.click(); } } else x.click(); }
      else history.back();
      const hoi = await cho(() => hopThoai((d) => d.innerText.startsWith('Rời khỏi trang')), 3000);
      if (hoi) { const bo = nutTheoChu(hoi, 'Rời khỏi'); if (bo) { if (lan) { try { ganBam(bo); } catch (e) { bo.click(); } } else bo.click(); } }
      await cho(() => !dangODuongSua(), 8000);
    }
    return !dangODuongSua();
  }
  function dongBangCamXuc() {
    const lb = document.querySelector('ul[role="listbox"]'); if (!lb) return;
    const hop = lb.closest('[role="dialog"]');
    const nut = hop && Array.from(hop.querySelectorAll('[aria-label="Quay lại"], [aria-label="Đóng"]')).find(dangHien);
    if (nut) nut.click(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
  }

  // =====================================================================
  //  Nhân sự đang dùng trang?
  // =====================================================================
  let nguoiLuc = 0, nguoiPhim = 0;
  const trongPopup = (t) => !!(t && t.closest && t.closest('#smhfb,#smhfb-nho,#smhfb-soan-w,#smhfb-gan-w,#smhfb-gan-modal'));
  for (const ten of ['keydown', 'mousedown', 'wheel', 'touchstart']) {
    document.addEventListener(ten, (e) => { if (!e.isTrusted || trongPopup(e.target)) return; nguoiLuc = Date.now(); if (ten === 'keydown') nguoiPhim = nguoiLuc; }, { capture: true, passive: true });
  }
  function oDangGoDo() {
    const a = document.activeElement; if (!a || trongPopup(a) || Date.now() - nguoiPhim > 15 * 60000) return false;
    if (!(a.isContentEditable || a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /^(text|search|)$/.test(a.type || '')))) return false;
    return !!chuan(a.isContentEditable ? a.innerText : a.value);
  }
  function nhanSuDangDung() {
    if (nguoiLuc && Date.now() - nguoiLuc < CAI_DAT.RANH_SAU_PHUT * 60000) return 'bạn đang thao tác trên trang';
    if (oDangGoDo()) return 'bạn đang gõ dở bài viết/bình luận';
    if (nguoiDangThaoTac()) return 'đang có hộp soạn bài do người mở';
    return '';
  }

  // =====================================================================
  //  Thanh "đang làm gì" (dưới thanh trên cùng của popup)
  // =====================================================================
  const HD_TEN = {
    dangdo: 'Đang làm tiếp việc dở', dang: 'Đang đăng bài', chotay: 'Chạy thử: chờ bấm Đăng', khanh: 'Đang đọc trang ' + CAI_DAT.KHANH_TEN,
    docsheet: 'Đang đọc Lark sheet', dotrang: 'Đang kiểm tra bài trên trang', kiemcmt: 'Đang kiểm tra comment', taisan: 'Đang tải sẵn đồ đăng',
    baocao: 'Đang gửi báo cáo ngày', suavideo: 'Đang kiểm tra / gắn thẻ + cảm xúc video', danmf: 'Đang dán ảnh manifest vào sheet', yeucau: 'Đang làm việc bạn vừa bấm trên popup', taoanh: 'Đang tạo ảnh manifest', nhac: 'Đang lấy nhạc nền',
    suckhoe: 'Đang tự kiểm tra buổi sáng (mã khoá Facebook, Lark sheet, trang)', baocaoloi: 'Đang ghi báo cáo lỗi lên Lark sheet', duyet: 'Đang ghi duyệt bản mới', baoclaude: 'Đang gửi lỗi cho Claude', chuanbi: 'Đang kiểm tra chuẩn bị cho bài sắp đăng', doichieu: 'Đang đối chiếu bài vừa đăng với sheet', nhacsheet: 'Đang nhắc nhóm bổ sung sheet ngày mai', thunap: 'Đang thử nạp bản qua Lark (cách 2)',
  };
  const tenDangDo = (dd) => (dd ? (dd.buoc === 'kiem_bai' ? `Đang chờ Facebook xác nhận ${dd.ten || 'bài vừa đăng'}` : dd.raSoat ? `Đang gửi bù comment ${dd.ten || ''}` : `Đang comment ${dd.ten || ''}`) : HD_TEN.dangdo);
  let hdChay = null; // việc tab này đang chạy
  let bamNutLuc = 0; // lúc người dùng bấm nút gần nhất → việc bắt đầu ngay sau đó hiện thanh hoạt động NGAY (không chờ 0,7 giây)
  // ước lượng thời gian 1 việc (mili giây): học từ 5 lần gần nhất của chính việc đó (theo tên), chưa có thì dùng mức mặc định theo loại
  const UOC_MAC_DINH = { thunap: 60000, chuanbi: 15000, doichieu: 4000, nhacsheet: 15000, suckhoe: 8000, baocaoloi: 5000, duyet: 4000, docsheet: 15000, dotrang: 6000, taisan: 60000, suavideo: 60000, yeucau: 25000, dang: 90000, dangdo: 60000, kiemcmt: 30000, khanh: 120000, chotay: 60000, taoanh: 20000, danmf: 15000, nhac: 10000, baocao: 8000, nhac_dang: 10000, dang_do: 60000 };
  const UOC_THEO_TEN = [[/đọc lại lark sheet|đọc sheet/i, 15000], [/kiểm comment 3 bài/i, 45000], [/kiểm comment video 24/i, 60000], [/kiểm comment/i, 25000], [/kiểm tra bài trên trang/i, 20000], [/tải sẵn/i, 90000], [/gửi tin thử/i, 5000], [/manifest/i, 240000], [/video/i, 150000], [/bài 1|bài 2|bài 3|twist/i, 60000]];
  function uocLuong(key, ten) {
    const hoc = (lay('tg_hoc6', {}) || {})[String(ten || key).replace(/\s+\(.*$/, '')];
    if (hoc && hoc.length) { const a = hoc.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; }
    if (['yeucau', 'dang', 'dangdo', 'dang_do', 'kiemcmt', 'chotay'].includes(key)) for (const [re, ms] of UOC_THEO_TEN) if (re.test(ten || '')) return ms;
    return UOC_MAC_DINH[key] || 30000;
  }
  // (6.16) dự kiến thời gian cho việc SẮP làm (dòng đếm ngược / chờ nhân sự) — để nhân sự biết nên Hoãn hay để script làm
  function uocDem(ten) {
    const t = String(ten || '').replace(/\s*\(hẹn [^)]*\)/, '').trim(); let m;
    if ((m = t.match(/^đăng (.+)$/i))) return uocLuong('dang', 'Đang đăng ' + m[1]);
    if ((m = t.match(/^comment tiếp cho (.+)$/i))) return uocLuong('dangdo', 'Đang comment ' + m[1]);
    if (/gửi bù comment/i.test(t)) return 90000;
    if ((m = t.match(/cảm xúc cho (.+)$/i))) return uocLuong('suavideo', 'Đang kiểm tra / gắn thẻ + cảm xúc cho ' + m[1]);
    if (/Khanh|báo cáo tuần/i.test(t)) return uocLuong('khanh', HD_TEN.khanh);
    if (/tải lại trang/i.test(t)) return 15000;
    return 60000;
  }
  function hocThoiGian(ten, ms) {
    if (!ten || ms < 1500 || ms > 60 * 60000) return;
    const all = lay('tg_hoc6', {}) || {}; const k = String(ten).replace(/\s+\(.*$/, '');
    all[k] = ((all[k] || []).concat([ms])).slice(-5); luu('tg_hoc6', all);
  }
  async function theoDoi(key, fn, ten) {
    const hd0 = lay('hoat_dong', null);
    const tiep = !!(hd0 && hd0.key === key && Date.now() - (hd0.cap || 0) < 4 * 60000); // việc đang làm dở từ trước khi trang tải lại
    const rec = { key, ten: ten || HD_TEN[key] || 'Đang chạy', bd: tiep ? hd0.bd : Date.now(), chi: tiep ? hd0.chi : '', cuoi: '', soDong: 0, cap: Date.now(), hien: tiep };
    hdChay = rec;
    if (tiep) luu('hoat_dong', rec);
    const doBam = Date.now() - bamNutLuc < 3000 && ['yeucau', 'taoanh', 'danmf', 'nhac', 'khanh', 'suavideo'].includes(key); // người dùng vừa bấm → hiện ngay
    const hen = setTimeout(() => { if (hdChay === rec && !rec.hien) { rec.hien = true; luu('hoat_dong', rec); veBang(); } }, 250); // (6.16) việc nào chạy quá 0,25 giây hoặc vừa ghi 1 bước là hiện ngay (lượt kiểm "không có gì làm" thì không nháy)
    if (doBam) { rec.hien = true; luu('hoat_dong', rec); try { nhacNho(rec.ten + '…', 'cho'); } catch (e) { /* */ } }
    let kq;
    try { kq = await fn(); return kq; } finally {
      clearTimeout(hen);
      if (hdChay === rec) hdChay = null;
      try { if (rec.hien) demViec(key, Date.now() - rec.bd, rec.coKQ); } catch (e) { /* */ }
      const conDo = kq === true && ((key === 'dangdo' && lay('dang_do', null)) || (key === 'khanh' && lay('khanh_dang', null)));
      if (!conDo && rec.hien && !/Lỗi|lỗi|chưa được|không được|thất bại/.test(rec.cuoi || '')) hocThoiGian(rec.ten, Date.now() - rec.bd);
      if (conDo) { if (rec.hien) luu('hoat_dong', Object.assign(rec, { cap: Date.now() })); }
      else {
        const h = lay('hoat_dong', null); if (h && h.bd === rec.bd) luu('hoat_dong', null);
        // thanh "Xong: … lúc …" cho các việc người dùng bấm hoặc việc lớn (đăng, comment)
        const ketCu = lay('hd_ket', null); const ketLon = ketCu && !ketCu.ngan && !ketCu.dong && Date.now() - ketCu.luc < 3 * 60000;
        if (rec.hien && (rec.soDong || Date.now() - rec.bd > 1000) && !ketLon && !['yeucau', 'nhac', 'dangdo', 'dang', 'kiemcmt', 'khanh', 'chotay'].includes(key)) luu('hd_ket', { key, ten: rec.ten, chu: rec.cuoi, luc: Date.now(), tg: Date.now() - rec.bd, mau: 'ok', ngan: true }); // (6.16) việc nhanh: hiện "✓ Xong …" vài giây để kịp thấy
        if (rec.hien && (rec.soDong || rec.cuoi) && ['yeucau', 'nhac', 'dangdo', 'dang', 'kiemcmt', 'khanh', 'chotay'].includes(key)) luu('hd_ket', { key, ten: rec.ten, chu: rec.cuoi, luc: Date.now(), tg: Date.now() - rec.bd, mau: /Lỗi|lỗi|chưa được|không được|thất bại/.test(rec.cuoi || '') ? 'vang' : 'ok' });
        if (rec.hien) veBang();
      }
    }
  }
  // việc chạm vào trang mà KHÔNG gấp (Khanh): chỉ chạy khi nhân sự không dùng trang
  async function chayRanh(key, fn, ten) {
    const ly = nhanSuDangDung();
    if (ly) return false;
    return theoDoi(key, fn, ten);
  }

  // =====================================================================
  //  Dọn dữ liệu cũ (1 lần/ngày) — xoá cả các mục của bản 5.x không còn dùng
  // =====================================================================
  function donDuLieuCu6() {
    if (typeof GM_listValues !== 'function' || lay('don6', '') === homNay()) return;
    luu('don6', homNay());
    const giuNgay = new Set(Array.from({ length: 8 }, (_, i) => ngayStr(congNgay(-i))));
    const GIU = new Set(['fb_token', 'fb_token_luc', 'fb_token_nhac', 'gan_the', 'khanh', 'khanh_kq', 'khanh_thu', 'khanh_dang', 'may6', 'nhac6', 'nhac6_info', 'o_nhac6', 'tam_dung', 'dung_moc', 'tu_dong6', 'chay_thu6', 'lark_gate', 'lark_tok', 'suc_khoe', 'mf_vung6', 'lam_ngay6', 'mf_font6', 'mf_fonts6', 'tg_hoc6', 'cmt6', 'cmt6_dongbo', 'the6', 'the6_dongbo', 'ui_tab6', 'ui_co_chu6', 'du_lieu6', 'dang_do', 'cho_tay6', 'trang6', 'mo6', 'song6', 'hoan6', 'lark_dem', 'tai6', 'yc6', 'hang_bu6', 'hoat_dong', 'cho_nguoi', 'bai_cuoi6', 'mf_tien6', 'don6', 'ui_co_chu', 'hd_ket', 'lan_chuyen', 'tc_reload_luc', 'cho_tab_an', 'sk6', 'loi_trang6', 'nghi_loi6']);
    let xoa = 0;
    for (const k0 of GM_listValues()) {
      const k = String(k0); if (!k.startsWith('that_')) continue;
      const ten = k.slice(5);
      if (GIU.has(ten) || ten.startsWith('yc6_kq_') || ten.startsWith('datlai_')) continue;
      const m = ten.match(/^(ngay6|nk6|doc6|tin6|an6)_(\d{2}-\d{2}-\d{4})$/);
      if (m && giuNgay.has(m[2])) continue;
      GM_deleteValue(k0); xoa++;
    }
    if (xoa) ghi(`Dọn dữ liệu: đã xoá ${xoa} mục cũ (của bản cũ hoặc quá 7 ngày)`);
    khoDon().catch(() => {});
  }

  // =====================================================================
  //  NHỊP CHÍNH (15 giây/lần)
  // =====================================================================
  const trongGioDo = () => { const m = phutTrongNgay(new Date()); return m >= docGio(CAI_DAT.GIO_DO_TU) && m < docGio(CAI_DAT.GIO_DO_DEN); };
  async function nhip() {
    if (!MAY) { veBang(); return; } // chưa chọn máy → không làm gì
    if (!(await nhanQuyen())) { veBang(); return; }
    try {
      luu('song6', Date.now());
      { const y0 = (lay('yc6', []) || []).find((y) => Date.now() - y.luc < 10 * 60000); if (y0) await theoDoi('yeucau', () => xuLyYeuCau(), 'Đang ' + (TEN_YC[y0.loai] || y0.loai).replace(/^./, (c) => c.toLowerCase())); }
      donDuLieuCu6();
      await baoTinhTrangLark();
      const dd = lay('dang_do', null);
      if (tamDung()) { // tạm dừng: chỉ chờ Facebook xác nhận video vừa bấm Đăng (không chạm vào trang)
        if (dd && dd.video && dd.buoc === 'kiem_bai') await theoDoi('dangdo', () => xuLyDangDo(), tenDangDo(dd));
        return;
      }
      if (!dangBan && !hopSoanBai() && !hopDangDo() && !ganManHinh()) window.__smhMoHop = 0;
      if (lay('cho_nguoi', null) && !nhanSuDangDung()) luu('cho_nguoi', null);
      // 1) việc dở (đã bấm Đăng → xác nhận → comment)
      if (dd) {
        if (!(dd.video && dd.buoc === 'kiem_bai') && !choNhanSu('dangdo', `comment tiếp cho ${dd.ten || 'bài vừa đăng'}`)) return;
        if (await theoDoi('dangdo', () => xuLyDangDo(), tenDangDo(dd))) return;
      }
      // 2) chạy thử: chờ người bấm Đăng
      if (lay('cho_tay6', null) && (await theoDoi('chotay', () => tiepChoTay()))) return;
      // 3) Khanh đang đọc dở (Máy Cao)
      if (LA_CAO && lay('khanh_dang', null)) { if (await chayRanh('khanh', () => tiepKhanh()).catch((e) => { luu('khanh_dang', null); ghi(CAI_DAT.KHANH_TEN + ' lỗi: ' + e.message); return false; })) return; }
      // 4) đọc sheet theo lịch (13:30, 18:30)
      await theoDoi('docsheet', () => docSheetTheoLich());
      // 5) dò bài trên trang qua Facebook (10 phút/lần, không tốn Lark)
      if (coApi() && trongGioDo() && Date.now() - ((lay('trang6', null) || {}).luc || 0) > phutDoTrang() * 60000) {
        await theoDoi('dotrang', () => doTrang('định kỳ'));
        await xacDinhMayKhac().catch(() => {});
      }
      // 6) đăng bài đến giờ
      if (await theoDoi('dang', () => vongDang())) return;
      // 7) kiểm comment (+2 / +10 / +20 phút, 19:00) và gửi bù
      if (await theoDoi('kiemcmt', () => vongKiemCmt())) return;
      if (await vongSuaVideo().catch((e) => { ghi('Gắn thẻ + cảm xúc video lỗi: ' + e.message); return false; })) return;
      // (6.18) chuẩn bị trước giờ đăng ~10 phút · đối chiếu bài sau khi đăng ~15 phút · 16:00 nhắc sheet ngày mai
      if (await theoDoi('chuanbi', () => chuanBiTruoc()).catch((e) => { ghi('Chuẩn bị trước giờ đăng lỗi: ' + e.message); return false; })) return;
      await theoDoi('doichieu', () => doiChieuSauDang()).catch((e) => ghi('Đối chiếu sau đăng lỗi: ' + e.message));
      await theoDoi('nhacsheet', () => nhacSheetMai()).catch((e) => ghi('Nhắc điền sheet lỗi: ' + e.message));
      // 8) tải sẵn đồ đăng (Máy Giao)
      await theoDoi('taisan', () => taiSan());
      // 9) báo cáo cuối ngày
      await theoDoi('baocao', () => baoCaoNgay().catch((e) => ghi('Báo cáo ngày lỗi: ' + e.message)));
      // 10) báo cáo tuần Khanh (Máy Cao)
      if (LA_CAO) await chayRanh('khanh', () => khanhTuan()).catch((e) => { luu('khanh_dang', null); ghi(CAI_DAT.KHANH_TEN + ' lỗi: ' + e.message); return false; });
      await nhacGiaHanMa().catch(() => {});
      // 11) (6.16) báo cáo lỗi kỹ thuật lên Lark (khi có lỗi mới) + xem có bản mới chờ duyệt (Máy Cao)
      if (canGhiBC() && !dangBan && !lay('dang_do', null)) await theoDoi('baocaoloi', () => ghiBaoCaoLark()).catch((e) => ghi('Ghi báo cáo lỗi lên Lark chưa được: ' + e.message));
      docTrangThaiGit(); docNguonCapNhat(); nhipBaoCaoToi();
    } catch (e) {
      if (e instanceof LoiTamHoan) ghi('Tạm hoãn: ' + e.message); else { ghi('Lỗi không lường trước: ' + e.message); chupLoi('nhịp chính'); }
    } finally {
      { const h = lay('hoat_dong', null); if (h && !hdChay && Date.now() - (h.cap || 0) > 4 * 60000) luu('hoat_dong', null); }
      dangChay = false; if (laTabChinh()) giuKhoa(); veBang();
    }
  }

  // Tab vừa hiện lại → nhận việc và chạy ngay (đăng bù bài trễ ngay lúc mở tab)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    giuKhoa(); veBang(); setTimeout(nhip, 800);
  });

  // ===== giao diện bản 5.9 (dùng lại nguyên: màu, khung, kéo thả, tab Khanh TH) =====
  function taoCSS(Z) {
    const p = (n) => (Math.round(n * Z * 10) / 10) + 'px';
    return `
  #smhfb{--nen:#fdfcf9;--chu:#1c1a15;--phu:#6b665a;--vien:#e6e0d2;--vien2:#efeadf;--the:#ffffff;--the-vien:#ece6d8;--nut:#efeadf;--nut-chu:#1c1a15;--icon:#ffffff;
    --chinh-nen:#2a8a4f;--chinh-chu:#ffffff;--acc:#2e9d57;
    --xanh-nen:#e6f3ea;--xanh-chu:#1f6b3a;--do-nen:#fbe9e7;--do-chu:#b3261e;--vang-nen:#fbf0d6;--vang-chu:#7a5a12;--xam-nen:#efeadf;--xam-chu:#5f5a4e;--thieu:#fff6f4;--link:#1f7a44;--bong:rgba(40,30,10,.28);
    --khung:#9b9588;--dau:#f4f1e9}
  #smhfb.toi{--nen:#1a1916;--chu:#f3efe6;--phu:#aaa497;--vien:#38342b;--vien2:#2e2b24;--the:#22201b;--the-vien:#34312a;--nut:#2f2c25;--nut-chu:#f3efe6;--icon:#2a2721;
    --chinh-nen:#3fae6a;--chinh-chu:#0d1f15;--acc:#3fae6a;
    --xanh-nen:#1c3326;--xanh-chu:#8fdca9;--do-nen:#472225;--do-chu:#ff9e98;--vang-nen:#40340f;--vang-chu:#f3d27c;--xam-nen:#2f2c25;--xam-chu:#c4beb0;--thieu:#35231f;--link:#6fd39b;--bong:rgba(0,0,0,.65);--dau:#24221d}
  #smhfb.k-xanh{--khung:#2e9d57;--dau:#eef6f0}#smhfb.k-vang{--khung:#e0a21a;--dau:#fbf3de}#smhfb.k-do{--khung:#d93a3a;--dau:#fbecea}#smhfb.k-xam{--khung:#9b9588;--dau:#f1eee6}
  #smhfb.k-xanh{--vang-nen:var(--xanh-nen);--vang-chu:var(--xanh-chu)} /* trạng thái ổn: mọi chip/nút 'đang chờ' hiện xanh lá, chỉ khi có việc/lỗi mới sang vàng-đỏ */
  #smhfb.toi.k-xanh{--dau:#1d2a22}#smhfb.toi.k-vang{--dau:#2e2813}#smhfb.toi.k-do{--dau:#36201f}#smhfb.toi.k-xam{--dau:#25231e}
  #smhfb{position:fixed;box-sizing:border-box;z-index:2147483600;font:${p(14)}/1.5 "Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:var(--chu);
    background:var(--nen);border:3px solid var(--khung);border-radius:${p(18)};box-shadow:0 18px 48px var(--bong),0 2px 6px rgba(0,0,0,.08);
    width:${p(1033)};max-width:calc(100vw - 16px);user-select:none;-webkit-font-smoothing:antialiased;overflow:hidden;display:flex;flex-direction:column}
  #smhfb.ghim{border-top-width:0;border-radius:0 0 ${p(18)} ${p(18)}}
  #smhfb>*{flex:none}#smhfb>.nd{flex:1 1 auto;min-height:0}
  #smhfb *{box-sizing:border-box}
  #smhfb .bar{position:relative;padding:${p(7)} calc(50px + 34px + var(--ext,0px)) ${p(7)} ${p(16)};min-height:53px;display:flex;align-items:center;cursor:move;background:var(--dau)}
  /* thu gọn: cao đúng bằng thanh ngang của Facebook (56px = 53px + viền 3px), 1 hàng duy nhất */
  #smhfb:not(.mo-rong) .bar{height:53px;padding-top:0;padding-bottom:0;overflow:hidden}
  #smhfb:not(.mo-rong) .h1{flex-wrap:nowrap}
  #smhfb:not(.mo-rong) .tt{flex:1 1 0}
  #smhfb:not(.mo-rong) .grip{display:none}
  #smhfb:not(.mo-rong) .h1{gap:0 ${p(8)}}
  #smhfb:not(.mo-rong) .h2{gap:${p(4)}}
  #smhfb:not(.mo-rong) .h2 .tg{padding:${p(2)} ${p(8)};font-size:${p(12)}}
  #smhfb:not(.mo-rong) .nsheet{padding:${p(2)} ${p(12)};font-size:${p(17)}}
  #smhfb:not(.mo-rong) .h2{flex:0 1 auto;flex-wrap:nowrap;min-width:0;overflow:hidden}
  #smhfb .ten,#smhfb .grip,#smhfb .den,#smhfb .nsheet{flex:none}
  #smhfb.keo .bar{cursor:grabbing}
  #smhfb .h1{display:flex;flex-wrap:wrap;align-items:center;gap:${p(6)} ${p(10)};width:100%}
  #smhfb .h2{display:flex;flex-wrap:wrap;align-items:center;gap:${p(6)};margin:0;padding:0}
  #smhfb .act{position:absolute;right:calc(14px + var(--ext,0px));top:0;height:53px;display:flex;align-items:center;gap:${p(8)}}
  #smhfb .grip{color:var(--phu);font-size:${p(15)};line-height:1;letter-spacing:-1px;flex:none;opacity:.55}
  #smhfb .den{width:${p(11)};height:${p(11)};border-radius:50%;flex:none;box-shadow:0 0 0 ${p(4)} rgba(127,127,127,.14)}
  #smhfb .den.xanh{background:#2e9d57}#smhfb .den.vang{background:#e0a21a}#smhfb .den.do{background:#d93a3a}#smhfb .den.xam{background:#9b9588}
  #smhfb .den.nhay{animation:smhfbNhay 1.2s infinite}
  @keyframes smhfbNhay{50%{opacity:.3}}
  @keyframes smhfbQuay{to{transform:rotate(360deg)}}
  #smhfb .ten{font-weight:700;font-size:${p(14.5)};white-space:nowrap;letter-spacing:.2px}
  #smhfb .the{font-size:${p(11.5)};font-weight:700;color:#fff;background:#8a5a00;border-radius:${p(6)};padding:1px ${p(7)}}
  #smhfb .tt{flex:1 1 ${p(70)};min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:${p(13.5)};font-weight:600;color:var(--phu)}
  #smhfb .tt b{font-variant-numeric:tabular-nums;color:var(--chu)}
  #smhfb .icon{border:1px solid var(--vien);background:var(--icon);color:var(--chu);width:${p(32)};height:${p(32)};border-radius:50%;cursor:pointer;font-size:${p(14)};flex:none;
    display:inline-flex;align-items:center;justify-content:center;padding:0;font-family:inherit;transition:background .15s,border-color .15s}
  #smhfb .icon.lon{width:50px;height:50px;font-size:${p(21)};border:1px solid color-mix(in srgb,var(--chu) 55%,transparent)}
  #smhfb .icon:hover{border-color:var(--acc);color:var(--acc)}
  #smhfb .nsheet{border:1px solid var(--acc);background:var(--icon);color:var(--chu);border-radius:999px;padding:${p(2)} ${p(15)};line-height:1.15;font-family:inherit;font-size:${p(18.75)};font-weight:700;cursor:pointer;flex:none;white-space:nowrap;transition:background .15s}
  #smhfb .nsheet:hover{background:var(--acc);color:var(--chinh-chu)}
  #smhfb .nsheet.canh{background:var(--do-nen);color:var(--do-chu);border-color:#d93a3a88}
  #smhfb .icon.quay span{display:inline-block;animation:smhfbQuay .9s linear infinite}
  #smhfb .tg{font-size:${p(12.5)};font-weight:600;border-radius:999px;padding:${p(2)} ${p(11)};background:var(--icon);color:var(--xam-chu);border:1px solid var(--vien);white-space:nowrap;
    font-family:inherit;line-height:1.5;cursor:default}
  #smhfb .tg.ok{color:var(--xanh-chu);border-color:#2e9d5755;background:var(--xanh-nen)}#smhfb .tg.cho{color:var(--vang-chu);border-color:color-mix(in srgb,var(--vang-chu) 40%,transparent);background:var(--vang-nen)}#smhfb .tg.loi{color:var(--do-chu);border-color:#d93a3a66;background:var(--do-nen)}
  #smhfb button.tg{cursor:pointer;transition:filter .15s}#smhfb button.tg:hover{filter:brightness(.95)}
  #smhfb .tabs{display:flex;gap:${p(6)};padding:0 ${p(16)};border-bottom:1px solid var(--vien2);background:var(--nen)}
  #smhfb .tab{border:0;background:none;padding:${p(11)} ${p(14)};font-family:inherit;font-size:${p(14)};font-weight:600;color:var(--phu);cursor:pointer;border-bottom:${p(2.5)} solid transparent;margin-bottom:-1px;transition:color .15s}
  #smhfb .tab:hover{color:var(--chu)}
  #smhfb .tab.chon{color:var(--link);border-bottom-color:var(--acc)}
  #smhfb .nd{padding:${p(14)} ${p(16)} ${p(4)};max-height:none;overflow:auto;user-select:text;scrollbar-width:thin;background:var(--dau);background:color-mix(in srgb,var(--nen) 60%,var(--vien2))}
  #smhfb .nd.cot2{display:grid;grid-template-columns:1fr 1fr;gap:0 ${p(16)};align-items:start}
  #smhfb .cot{min-width:0}
  @media (max-width:1100px){#smhfb .nd.cot2{display:block}}
  #smhfb .the-nd{background:var(--the);border:1px solid var(--the-vien);border-radius:${p(14)};padding:${p(12)} ${p(16)};margin-bottom:${p(12)};box-shadow:0 1px 2px rgba(40,30,10,.05)}
  #smhfb .nhan{font-size:${p(11.5)};color:var(--phu);font-weight:700;text-transform:uppercase;letter-spacing:.9px;margin-bottom:${p(6)}}
  #smhfb .dong{display:flex;justify-content:space-between;gap:${p(12)};align-items:baseline;margin:${p(4)} 0}
  #smhfb .dong>span:first-child{color:var(--phu);flex:none}
  #smhfb .dong>span:last-child{text-align:right}
  #smhfb .noidung{font-size:${p(14.5)};line-height:1.6;white-space:pre-wrap;word-break:break-word}
  #smhfb .noidung.phu{font-size:${p(13.5)};color:var(--phu)}
  #smhfb .chip{display:inline-block;font-size:${p(12.5)};font-weight:600;border-radius:999px;padding:1px ${p(10)};margin-left:${p(6)};vertical-align:middle;text-transform:none;letter-spacing:0}
  #smhfb .chip.ok{background:var(--xanh-nen);color:var(--xanh-chu)}#smhfb .chip.loi{background:var(--do-nen);color:var(--do-chu)}#smhfb .chip.cho{background:var(--vang-nen);color:var(--vang-chu)}#smhfb .chip.xam{background:var(--xam-nen);color:var(--xam-chu)}
  #smhfb .buoc{display:flex;flex-wrap:wrap;gap:${p(6)}}
  #smhfb .b{font-size:${p(12.5)};border-radius:${p(9)};padding:${p(3)} ${p(10)};background:var(--xam-nen);color:var(--xam-chu);font-weight:600}
  #smhfb .b.xong{background:var(--xanh-nen);color:var(--xanh-chu)}#smhfb .b.dang{background:var(--vang-nen);color:var(--vang-chu)}#smhfb .b.loi{background:var(--do-nen);color:var(--do-chu)}
  #smhfb .skhoe{display:grid;grid-template-columns:1fr 1fr;gap:${p(8)} ${p(16)};font-size:${p(13.5)}}
  #smhfb table{width:100%;border-collapse:collapse;font-size:${p(13.5)}}
  #smhfb th{text-align:left;color:var(--phu);font-weight:600;font-size:${p(12)};padding:${p(5)} ${p(8)};border-bottom:1px solid var(--vien);text-transform:uppercase;letter-spacing:.5px}
  #smhfb td{padding:${p(8)} ${p(8)};border-bottom:1px solid var(--vien2);vertical-align:top}
  #smhfb tr.thieu td{background:var(--thieu)}
  #smhfb td:first-child,#smhfb table.ls td:nth-child(2),#smhfb table.ls .chip{white-space:nowrap}
  #smhfb .nk{font:${p(12.5)}/1.65 ui-monospace,Consolas,monospace;white-space:pre-wrap}
  #smhfb .foot{display:flex;flex-wrap:wrap;align-items:center;gap:${p(8)} ${p(14)};padding:${p(10)} ${p(16)};border-top:1px solid var(--vien2);background:var(--nen)}
  #smhfb .chan{display:flex;flex-wrap:wrap;gap:${p(8)};padding:0;border:0}
  #smhfb .chan.vua{padding:0}
  #smhfb .nut{border:0;border-radius:${p(12)};padding:${p(9)} ${p(18)};font-family:inherit;font-size:${p(14.5)};white-space:nowrap;font-weight:700;cursor:pointer;background:var(--nut);color:var(--nut-chu);transition:filter .15s,transform .05s}
  #smhfb .nut:hover{filter:brightness(.93)}#smhfb .nut:active{transform:translateY(1px)}
  #smhfb .nut.chinh{background:var(--chinh-nen);color:var(--chinh-chu)}#smhfb .nut.do{background:#c0392b;color:#fff}#smhfb .nut.vang{background:#e8b64a;color:#1c1a15}
  #smhfb .nut.nho{padding:${p(5)} ${p(13)};font-size:${p(13)};border-radius:${p(9)}}
  #smhfb .chan2{display:flex;flex-wrap:wrap;align-items:center;gap:${p(2)} ${p(4)};padding:0;margin-left:auto}
  #smhfb .phu-nut{border:0;background:none;color:var(--phu);font-family:inherit;font-size:${p(12.5)};font-weight:600;padding:${p(4)} ${p(8)};border-radius:${p(7)};cursor:pointer;transition:background .15s}
  #smhfb .phu-nut:hover{background:var(--xam-nen);color:var(--chu)}
  #smhfb .phu-nut.do{color:var(--do-chu)}
  #smhfb .co{margin-left:${p(8)};display:inline-flex;align-items:center;gap:${p(2)};color:var(--phu);font-size:${p(12.5)}}
  #smhfb .co b{min-width:${p(40)};text-align:center;font-variant-numeric:tabular-nums}
  #smhfb a{color:var(--link);text-decoration:none;font-weight:600}
  #smhfb .mo{color:var(--phu);font-size:${p(12.5)}}
  #smhfb .ghichu{color:var(--do-chu);font-size:${p(12.5)};margin-top:2px}

  /* ===== 2.1: giao diện mới ===== */
  #smhfb .bar{height:53px;padding-top:0;padding-bottom:0;overflow:hidden}
  #smhfb .bar .h1{flex-wrap:nowrap;gap:0 ${p(8)}}
  #smhfb .bar .grip{display:none}
  #smhfb .bar .tt{flex:1 1 0}
  #smhfb .bar .h2{flex:none;flex-wrap:nowrap;gap:${p(4)}}
  #smhfb .bar .h2 .tg{padding:${p(2)} ${p(8)};font-size:${p(12)};flex:none}
  #smhfb .bar .nsheet{padding:${p(2)} ${p(11)};font-size:${p(14)}}
  #smhfb .tg.viec-pill{flex:none;background:#d93a3a;color:#fff;border-color:#d93a3a;font-weight:800;font-size:${p(13)};padding:${p(3)} ${p(12)}}
  #smhfb .tg.viec-pill:hover{filter:brightness(1.08)}
  #smhfb .tab{font-size:${p(15)};padding:${p(12)} ${p(15)}}
  #smhfb .tab .chip{margin-left:${p(5)};padding:0 ${p(7)}}
  #smhfb .strip{display:flex;align-items:center;gap:${p(10)};padding:${p(11)} ${p(16)};border-radius:${p(14)};margin-bottom:${p(12)};font-size:${p(16)};font-weight:700;background:var(--the);border:1px solid var(--the-vien);border-left:${p(7)} solid var(--khung)}
  #smhfb .strip .den{flex:none}
  #smhfb .strip.s-xanh{border-left-color:#2e9d57}#smhfb .strip.s-vang{border-left-color:#e0a21a}#smhfb .strip.s-do{border-left-color:#d93a3a}#smhfb .strip.s-xam{border-left-color:#9b9588}
  #smhfb .viec{background:var(--do-nen);border:1px solid #d93a3a66;border-radius:${p(14)};padding:${p(12)} ${p(16)};margin-bottom:${p(12)}}
  #smhfb .viec h3{margin:0 0 ${p(4)};font-size:${p(15.5)};color:var(--do-chu);font-weight:800}
  #smhfb .viec .vr{display:flex;gap:${p(12)};align-items:center;justify-content:space-between;padding:${p(7)} 0;border-top:1px solid #d93a3a30}
  #smhfb .viec .vr.dau{border-top:0}
  #smhfb .viec .vt{flex:1 1 ${p(200)};font-size:${p(14.5)};line-height:1.45}
  #smhfb .viec .vn{white-space:nowrap;display:flex;gap:${p(6)}}
  #smhfb .viec.ok{background:var(--xanh-nen);border-color:#2e9d5755;color:var(--xanh-chu);font-weight:700;padding:${p(8)} ${p(16)};font-size:${p(14.5)}}
  #smhfb .luoi{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${p(12)};margin-bottom:${p(12)}}
  #smhfb .luoi.hai{grid-template-columns:repeat(2,minmax(0,1fr))}
  @media (max-width:1100px){#smhfb .luoi,#smhfb .luoi.hai{grid-template-columns:1fr}}
  #smhfb .bai{background:var(--the);border:1px solid var(--the-vien);border-top:${p(5)} solid var(--mau,#999);border-radius:${p(14)};padding:${p(12)} ${p(15)} ${p(8)};box-shadow:0 1px 2px rgba(40,30,10,.05);min-width:0}
  #smhfb .bai.b1{--mau:#2e9d57}#smhfb .bai.b2{--mau:#2f7fd1}#smhfb .bai.b3{--mau:#d98a1f}
  #smhfb .bai-h{display:flex;align-items:center;justify-content:space-between;gap:${p(8)};flex-wrap:wrap;margin-bottom:${p(6)}}
  #smhfb .bai-t{font-size:${p(20)};font-weight:800;color:var(--mau)}
  #smhfb .bai-t small{font-size:${p(12)};font-weight:600;color:var(--phu);margin-left:${p(6)}}
  #smhfb .kq{font-size:${p(14)};font-weight:800;border-radius:999px;padding:${p(3)} ${p(13)};white-space:nowrap}
  #smhfb .kq.ok{background:var(--xanh-nen);color:var(--xanh-chu)}#smhfb .kq.cho{background:var(--vang-nen);color:var(--vang-chu)}#smhfb .kq.loi{background:var(--do-nen);color:var(--do-chu)}#smhfb .kq.xam{background:var(--xam-nen);color:var(--xam-chu)}
  #smhfb .r{padding:${p(7)} 0;border-top:1px dashed var(--vien)}
  #smhfb .rl{font-size:${p(11.5)};color:var(--phu);font-weight:700;text-transform:uppercase;letter-spacing:.6px}
  #smhfb .tb-quet{display:flex;align-items:center;justify-content:space-between;gap:${p(10)};padding:${p(7)} ${p(16)};font-size:${p(13.5)};line-height:1.45;border-top:1px solid var(--vien2);cursor:default;user-select:text}
  #smhfb .tb-quet>span{min-width:0;white-space:normal;word-break:break-word}
  #smhfb .tb-quet.ok{background:var(--xanh-nen);color:var(--xanh-chu)}#smhfb .tb-quet.vang{background:var(--vang-nen);color:var(--vang-chu)}#smhfb .tb-quet.loi{background:var(--do-nen);color:var(--do-chu)}#smhfb .tb-quet.cho{background:var(--xam-nen);color:var(--xam-chu)}
  #smhfb .tb-quet .phu-nut{flex:none;white-space:nowrap}
  #smhfb .hdg{position:relative;display:flex;align-items:center;gap:${p(12)};padding:${p(8)} ${p(16)} ${p(10)};border-top:1px solid var(--vien2);font-size:${p(13.5)};line-height:1.4;cursor:default}
  #smhfb .hdg.chay{background:var(--vang-nen);color:var(--vang-chu)}#smhfb .hdg.cho{background:var(--xam-nen);color:var(--xam-chu)}
  #smhfb .hd-den{flex:none;width:${p(11)};height:${p(11)};border-radius:50%;background:#e0a21a;animation:smhHdDen 1.6s ease-out infinite}
  #smhfb .hd-den.cho{background:#9a9384;animation:smhHdNhe 2.4s ease-in-out infinite}
  @keyframes smhHdDen{0%{box-shadow:0 0 0 0 rgba(224,162,26,.6)}70%{box-shadow:0 0 0 ${p(8)} rgba(224,162,26,0)}100%{box-shadow:0 0 0 0 rgba(224,162,26,0)}}
  @keyframes smhHdNhe{0%,100%{opacity:1}50%{opacity:.35}}
  #smhfb .hd-noi{flex:1 1 auto;min-width:0}
  #smhfb .hd-ten{font-weight:700}
  #smhfb .hd-cham::after{content:"";display:inline-block;width:1.5em;text-align:left;animation:smhHdCham 1.2s steps(4,end) infinite}
  @keyframes smhHdCham{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}
  #smhfb .hd-chi{font-size:${p(12.5)};opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #smhfb .hd-gio{flex:none;text-align:right;font-weight:700;font-size:${p(14)};font-variant-numeric:tabular-nums;white-space:nowrap}
  #smhfb .hd-gio small{display:block;font-size:${p(11.5)};font-weight:600;opacity:.8}
  #smhfb .hdg .phu-nut{flex:none}
  #smhfb .hd-tien{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(224,162,26,.2)}
  #smhfb .hd-tien i{display:block;height:100%;background:#e0a21a;transition:width 1s linear}
  #smhfb .tn3{display:grid;grid-template-columns:minmax(${p(170)},.7fr) minmax(${p(260)},1.3fr) minmax(${p(240)},1fr);gap:${p(10)};margin:0 0 ${p(12)}}
  @media (max-width:900px){#smhfb .tn3{grid-template-columns:1fr}}
  #smhfb .tn.bam{cursor:pointer}#smhfb .tn.bam:hover{border-color:var(--acc);box-shadow:0 6px 16px rgba(40,30,10,.14)}#smhfb .tn.bam:active{transform:translateY(1px)}#smhfb .tn.bam.run{pointer-events:none}
  #smhfb .tn.bam .tn-nut .nut{display:flex;align-items:center;justify-content:center;pointer-events:none}
  #smhfb .tn{display:flex;flex-direction:column;gap:${p(6)};padding:${p(12)} ${p(14)};border:1.5px solid var(--vien);border-radius:${p(14)};background:var(--the);min-width:0;transition:border-color .2s,background .2s}
  #smhfb .tn-dau{display:flex;align-items:center;gap:${p(10)};min-width:0}
  #smhfb .tn-ic{flex:none;width:${p(36)};height:${p(36)};border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--xanh-nen);font-size:${p(17)};font-weight:800;line-height:1}
  #smhfb .tn-ten{display:flex;flex-direction:column;min-width:0}
  #smhfb .tn-ten b{font-size:${p(15)};font-weight:800}
  #smhfb .tn-ten span{font-size:${p(13)};font-weight:700;color:var(--chu);opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #smhfb .tn-mo{font-size:${p(12)};color:var(--phu);line-height:1.4;min-height:2.8em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  #smhfb .tn-mo.live{color:var(--vang-chu);font-weight:600}#smhfb .tn-mo.canh{color:var(--do-chu)}
  #smhfb .tn-nut{display:flex;gap:${p(6)};margin-top:auto;flex-wrap:wrap}
  #smhfb .tn-nut .nut{flex:1;min-height:${p(42)};padding:${p(9)} ${p(14)};font-size:${p(15)};border-radius:${p(11)}}
  #smhfb .seg{display:flex;flex:1;border:1.5px solid var(--vien);border-radius:${p(10)};overflow:hidden}
  #smhfb .seg button{flex:1;min-height:${p(84)};border:0;background:var(--the);padding:${p(14)} ${p(8)};font-family:inherit;font-weight:800;font-size:${p(20)};color:var(--chu);cursor:pointer;white-space:nowrap}
  #smhfb .seg button+button{border-left:1.5px solid var(--vien)}
  #smhfb .seg button:hover{background:var(--xanh-nen);color:var(--xanh-chu)}
  #smhfb .tn.run{border-color:#e0a21a;background:var(--vang-nen)}#smhfb .tn.run .tn-ic{background:#fff6dd}
  #smhfb .tn.run .tn-nut{opacity:.45;pointer-events:none}
  #smhfb .tn.xong{border-color:#2e9d57;background:var(--xanh-nen)}#smhfb .tn.xong .tn-ic{background:#2e9d57;color:#fff;animation:smhfbNay .5s ease-out}
  #smhfb .tn.vang{border-color:#d93a3a88}#smhfb .tn.vang .tn-ic{background:#d93a3a;color:#fff}
  #smhfb .xoay{display:block;width:${p(18)};height:${p(18)};border:3px solid rgba(224,162,26,.3);border-top-color:#e0a21a;border-radius:50%;animation:smhfbQuay .8s linear infinite}
  #smhfb .rv{font-size:${p(14.5)};margin-top:${p(2)};word-break:break-word;line-height:1.5}
  #smhfb .rv.phu{color:var(--phu);font-size:${p(13.5)}}
  #smhfb .rv .chip{margin-left:0;margin-right:${p(6)}}
  #smhfb .mk{font-size:${p(13)};font-weight:600;white-space:nowrap;line-height:1.6}
  #smhfb .mk.ok{color:var(--xanh-chu)}#smhfb .mk.loi{color:var(--do-chu);font-weight:800}#smhfb .mk.cho{color:var(--vang-chu);font-weight:700}#smhfb .mk.xam{color:var(--phu)}
  #smhfb table.st td{padding:${p(8)} ${p(10)}}
  #smhfb table.st tr.dau td{border-top:2px solid var(--vien)}
  #smhfb table.st tr.xa td{background:color-mix(in srgb,var(--vang-nen) 40%,transparent)}
  #smhfb table.st td.ng{white-space:nowrap;min-width:${p(118)}}
  #smhfb .ghi{font-size:${p(13)};color:var(--phu);margin:${p(2)} 0 ${p(10)}}
  #smhfb .the-nd h4{margin:0 0 ${p(8)};font-size:${p(16)};font-weight:800}
  #smhfb .kq{white-space:normal;text-align:right;line-height:1.3}
  #smhfb .tlay{display:grid;grid-template-columns:${p(400)} minmax(0,1fr);gap:${p(16)};align-items:start}
  @media (max-width:1100px){#smhfb .tlay{grid-template-columns:1fr}}
  #smhfb .tl{background:var(--nen);border:1px solid var(--the-vien);border-radius:${p(14)};padding:${p(12)} ${p(10)} ${p(6)}}
  #smhfb .tl h4{margin:0 0 ${p(10)} ${p(8)};font-size:${p(12.5)};color:var(--phu);text-transform:uppercase;letter-spacing:.8px;font-weight:800}
  #smhfb .it{position:relative;padding:${p(7)} ${p(10)} ${p(13)} ${p(56)};cursor:pointer;border-radius:${p(12)};border:2px solid transparent}
  #smhfb .it:before{content:"";position:absolute;left:${p(27)};top:${p(40)};bottom:${p(-6)};width:3px;background:var(--vien)}
  #smhfb .it:last-child:before{display:none}
  #smhfb .it .dm{position:absolute;left:${p(10)};top:${p(7)};width:${p(34)};height:${p(34)};border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:${p(13.5)};padding:0;background:#b3ad9f;overflow:visible;max-height:none}
  #smhfb .it .dm.ok{background:#2e9d57}#smhfb .it .dm.cho{background:#e0a21a}#smhfb .it .dm.loi{background:#d93a3a}#smhfb .it .dm.xam{background:#b3ad9f}
  #smhfb .it .h{font-weight:800;font-size:${p(16)};line-height:1.3}
  #smhfb .it .h .who{font-size:${p(11)};font-weight:700;color:var(--phu);background:var(--xam-nen);border-radius:99px;padding:0 ${p(7)};margin-left:${p(4)}}
  #smhfb .it .t{font-size:${p(13)};color:var(--phu)}
  #smhfb .it .tk{position:absolute;right:${p(8)};top:${p(9)};background:var(--xam-nen)}
  #smhfb .it .tk.dang{background:var(--acc);color:#fff;font-weight:800}
  #smhfb .it.sel{background:var(--the);border-color:var(--acc);box-shadow:0 4px 14px rgba(0,0,0,.08)}
  #smhfb .bai.bv{--mau:#7c5cd6}#smhfb .bai.bm{--mau:#c2418a}
  #smhfb .tg.xam{color:var(--xam-chu)}
  #smhfb .acts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${p(12)};margin-bottom:${p(8)}}
  #smhfb .acts.hai{grid-template-columns:repeat(2,minmax(0,1fr))}#smhfb .acts.mot{grid-template-columns:minmax(0,1fr)}
  @media (max-width:1100px){#smhfb .acts{grid-template-columns:1fr}}
  #smhfb .big{display:flex;align-items:center;gap:${p(14)};text-align:left;border:2px solid var(--vien);background:var(--the);color:var(--chu);border-radius:${p(16)};padding:${p(10)} ${p(16)};min-height:${p(66)};font-family:inherit;cursor:pointer;box-shadow:0 2px 6px rgba(40,30,10,.07);transition:transform .08s,box-shadow .15s,border-color .15s,background .15s}
  #smhfb .big:hover{border-color:var(--acc);box-shadow:0 6px 16px rgba(40,30,10,.14)}
  #smhfb .big:active{transform:translateY(1px)}
  #smhfb .big .bi{flex:none;width:${p(46)};height:${p(46)};border-radius:50%;background:var(--xanh-nen);color:var(--xanh-chu);display:flex;align-items:center;justify-content:center;font-size:${p(24)};line-height:1}
  #smhfb .big .bi span{display:inline-block}
  #smhfb .big .bt{display:flex;flex-direction:column;min-width:0}
  #smhfb .big .bt b{font-size:${p(16.5)};font-weight:800}
  #smhfb .big .bt small{font-size:${p(12.5)};color:var(--phu);margin-top:2px;line-height:1.35}
  #smhfb .big.run{border-color:#e0a21a;background:var(--vang-nen);cursor:progress;pointer-events:none}
  #smhfb .big.run .bi{background:#e0a21a;color:#fff}
  #smhfb .big.run .bi span{animation:smhfbQuay .9s linear infinite}
  #smhfb .big.xong{border-color:#2e9d57;background:var(--xanh-nen)}
  #smhfb .big.xong .bi{background:#2e9d57;color:#fff;animation:smhfbNay .5s ease-out}
  @keyframes smhfbNay{0%{transform:scale(.6)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
  #smhfb .big.sheet .bi{background:var(--xam-nen);color:var(--chu)}
  `;
  }
  const CSS_THEM = `
#smhfb .cdang{border:2px solid #1d7a3e;background:#1fa152;color:#fff;font-weight:800;border-radius:999px;padding:.3em .9em;cursor:pointer;white-space:nowrap;font-size:inherit}
#smhfb .cdang.tat{background:#8a8578;border-color:#5f5a4e;color:#fff}#smhfb .cdang:hover{filter:brightness(1.12)}
#smhfb .cdang{flex:none}
/* (5.5) thanh thu gọn: nhóm chip có thể co lại, nút "Mở sheet" luôn hiện đủ (không bị nút Thu gọn che) */
#smhfb .bar .h2.chips{flex:0 1 auto;min-width:0;overflow:hidden}
#smhfb .bar .nsheet{flex:none;position:relative;z-index:1}
#smhfb .bar .tt{min-width:0}
#smhfb .bar .h1{padding-right:6px}
#smhfb.gon1 .bar .h2 .tg{padding-left:6px;padding-right:6px}#smhfb.gon1 .bar .h2.chips{gap:3px}#smhfb.gon1 .bar .h1{gap:0 6px}`;
  const CO_CHU_MAC_DINH = 1.2;
  const coChu = () => { const z = +lay('ui_co_chu', CO_CHU_MAC_DINH); return z >= 0.8 && z <= 1.8 ? z : CO_CHU_MAC_DINH; };
  const vt = { keo: null, lamMoi: false };
  const uiTab = { viTri: null, moRong: false };
  const rongKhung = () => Math.min(Math.round(1033 * coChu()), window.innerWidth - 16);
  function viTriMacDinh() { return { x: Math.max(8, Math.round((window.innerWidth - rongKhung()) / 2)), y: 0 }; /* sát mép trên, che luôn thanh nút Facebook */ }
  function datViTri(el, p) {
    const Z = coChu(); const toiDa = window.innerWidth - 16;
    const wC = Math.min(Math.round(1033 * Z), toiDa), wE = Math.min(Math.round(1033 * 1.2 * Z), toiDa);
    const moRong = el.classList.contains('mo-rong'); const w = moRong ? wE : wC;
    const bx = Math.min(Math.max(0, p.x), Math.max(0, window.innerWidth - wC - 8));
    const y = Math.min(Math.max(0, p.y), Math.max(0, window.innerHeight - 40));
    const left = moRong ? Math.min(Math.max(0, bx - (wE - wC) / 2), Math.max(0, window.innerWidth - wE - 8)) : bx;
    el.dataset.bx = String(Math.round(bx));
    el.style.width = w + 'px'; el.style.left = Math.round(left) + 'px'; el.style.top = y + 'px';
    el.style.setProperty('--ext', (moRong ? Math.round(left + wE - (bx + wC)) : 0) + 'px');
    el.classList.toggle('ghim', y <= 2);
    el.style.height = moRong ? Math.max(160, window.innerHeight - y) + 'px' : '';
    el.style.maxHeight = Math.max(160, window.innerHeight - y) + 'px';
  }
  function fbToi() {
    const h = document.documentElement;
    if (h.classList.contains('__fb-dark-mode')) return true;
    if (h.classList.contains('__fb-light-mode')) return false;
    const m = (getComputedStyle(document.body).backgroundColor || '').match(/\d+/g);
    return !!m && (+m[0] + +m[1] + +m[2]) / 3 < 80;
  }
  const linkHoaKhanh = (s) => esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');
  function tabKhanh() {
    const kq = lay('khanh_kq', null), th = lay('khanh_thu', null), st = lay('khanh', null) || {}, kd = lay('khanh_dang', null);
    const now = Date.now(); const t0 = moc0Khanh(now); const M = CAI_DAT.KHANH_MOC_GIO;
    const dd = (t) => `${THU[new Date(t).getDay()]} ${ngayThangKhanh(new Date(t))} ${gioStr(new Date(t))}`;
    let tt;
    if (kd) tt = `<span class="chip cho" style="margin:0">Đang đọc trang${kd.thu ? ' (kiểm thử)' : ''}…</span>`;
    else if (st.t0 === t0 && st.xong) tt = `<span class="chip ok" style="margin:0">Tuần này đã xong</span> ${kq && kq.gui === 'cho_gio_nhan' ? 'tin để dành, đến giờ nhắn sẽ gửi' : 'đã gửi vào nhóm Lark'} lúc ${gioStr(new Date(st.xongLuc || (kq && kq.luc) || now))}`;
    else if (st.t0 === t0 && st.boQua) tt = '<span class="chip xam" style="margin:0">Tuần này bỏ qua</span> không đọc được sau mọi lần thử — chờ tuần sau';
    else if (st.t0 === t0 && (st.lan || 0) > 0) tt = `<span class="chip cho" style="margin:0">Đã thử ${st.lan}/${M.length} lần</span> chưa xong — script tự thử lại theo lịch (thứ Sáu đến 22:00, rồi thứ Bảy 07:50, 13:00, 19:00, 22:00)`;
    else tt = '<span class="chip xam" style="margin:0">Chờ đến giờ</span>';
    const tiep = (st.t0 === t0 && (st.xong || st.boQua)) || now >= t0 + (M[M.length - 1] + 6) * 3600e3 ? t0 + 7 * 86400e3 : null;
    let h = `<div class="acts mot"><button class="nut chinh" data-a="khanhthu" title="Mở trang và đọc ngay, chỉ hiện kết quả ở đây, không gửi Lark">🔎 Kiểm thử ngay (không gửi Lark)</button></div><div class="the-nd"><div class="nhan">Báo cáo tuần · ${esc(CAI_DAT.KHANH_TEN)}</div>
      <div class="mo" style="margin:4px 0 8px">Mỗi ${['Chủ nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'][CAI_DAT.KHANH_THU]} ${CAI_DAT.KHANH_GIO}: script mở trang, đếm các bài trong 7 ngày qua và gửi vào nhóm Lark. ${tiep ? 'Lần tới: <b>' + dd(tiep) + '</b>.' : ''}</div>
      <div>${tt}</div>`;
    if (kq && kq.loi && !(st.t0 === t0 && st.xong)) h += `<div class="ghichu">⚠ ${esc(kq.loi)}</div>`;
    h += '</div>';
    const hien = (x, nhan) => x ? `<div class="the-nd"><div class="nhan">${nhan} · ${dd(x.luc)}</div><div style="white-space:pre-wrap;user-select:text;line-height:1.55;margin-top:6px">${linkHoaKhanh(x.nd)}</div></div>` : '';
    h += hien(kq, 'Tin gần nhất đã gửi vào Lark') || '<div class="the-nd"><div class="mo">Chưa có báo cáo nào được gửi.</div></div>';
    if (th && (!kq || th.luc > kq.luc)) h += hien(th, 'Kết quả kiểm thử (chưa gửi Lark)');
    return h;
  }

  // =====================================================================
  //  GIAO DIỆN — giữ đúng giao diện bản 5.9 (thanh màu kéo thả + tab), chỉ bổ sung tính năng 6.0
  //  (taoCSS, CSS_THEM, datViTri, fbToi, tabKhanh… lấy nguyên từ bản 5.9)
  // =====================================================================
  const CSS_MOI = `
#smhfb .hdg.dem{background:#fff1d6;color:#7a4a05;animation:smh6Vien 1s step-end infinite}
#smhfb .hdg.dem .hd-so{flex:none;font-size:30px;font-weight:900;min-width:44px;text-align:center;color:#a5560a}
@keyframes smh6Vien{0%{background:#fff1d6}50%{background:#ffd98a}}
#smhfb .it .tk.soan{background:#7c5cd6;color:#fff;font-weight:800}
#smhfb .it .tk.soan:hover{filter:brightness(1.1)}
#smhfb .nut.tim{background:#7c5cd6;color:#fff}
#smhfb .chay{opacity:.75;pointer-events:none}
#smhfb .nut .xoay,#smhfb .tg .xoay,#smhfb .seg .xoay{display:inline-block;vertical-align:-3px;margin-right:6px;width:16px;height:16px}
#smhfb .anhs{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}#smhfb .anhs img{width:34px;height:60px;object-fit:cover;border-radius:5px;border:1px solid var(--vien)}
#smhfb .xem{width:110px;aspect-ratio:9/16;object-fit:cover;border-radius:8px;border:1px solid var(--vien)}
#smhfb .thanh{height:8px;background:var(--vien2);border-radius:6px;overflow:hidden;margin:6px 0}#smhfb .thanh i{display:block;height:100%;background:#2e9d57}
#smhfb input[type=text]{font:inherit;font-size:15px;padding:7px 10px;border:1.5px solid var(--vien);border-radius:10px;width:160px;background:var(--the);color:var(--chu)}
#smhfb .hang{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0}
#smhfb.tudong{pointer-events:none}#smhfb.tudong .tabs,#smhfb.tudong .nd,#smhfb.tudong .foot{display:none}#smhfb.tudong .hdg button,#smhfb.tudong .bar .cdang{pointer-events:auto}
#smhfb table.st .mk{white-space:normal}
#smhfb .mfp{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 2px}
#smhfb .mfb{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:var(--xam-nen);color:var(--xam-chu);font-weight:700;font-size:14px}
#smhfb .mfb.dang{background:var(--vang-nen);color:var(--vang-chu)}#smhfb .mfb.xong{background:var(--xanh-nen);color:var(--xanh-chu)}#smhfb .mfb.loi{background:var(--do-nen);color:var(--do-chu)}
#smhfb .mfb .xoay{width:14px;height:14px;margin:0}
#smhfb-nho{position:fixed;z-index:2147483647;left:50%;bottom:28px;transform:translateX(-50%) translateY(20px);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;background:#1d1a17;color:#fff;font:600 14px/1.35 system-ui,Segoe UI,Arial,sans-serif;padding:10px 16px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.35);max-width:min(560px,90vw);display:flex;gap:10px;align-items:center;white-space:pre-line}
#smhfb-nho.hien{opacity:1;transform:translateX(-50%) translateY(0)}
#smhfb-nho .d{flex:none;width:10px;height:10px;border-radius:50%;background:#3fbf5a}
#smhfb-nho.cho .d{background:#f0b429;animation:smhHdDen 1s ease-out infinite}
#smhfb-nho.vang .d{background:#e55b3c}
#smhfb .hd-tien{position:absolute;left:0;bottom:0;height:4px;background:#e0a21a;border-radius:0 2px 2px 0;transition:width 1s linear;max-width:100%}
#smhfb .hdg.chay{position:relative;overflow:hidden}
#smhfb .hd-gio small{display:block;font-weight:600;opacity:.75;font-size:.85em}
#smhfb-soan-w{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:2147483100;display:none;flex-direction:column;gap:8px;min-width:min(320px,90vw);max-width:min(820px,calc(100vw - 40px));padding:12px 18px;border-radius:14px;border:2px solid #e0a21a;background:#fff9e8;color:#7a5410;font:700 14px/1.35 "Segoe UI Variable Text","Segoe UI",system-ui,sans-serif;box-shadow:0 8px 26px rgba(0,0,0,.22);pointer-events:none}
#smhfb-soan-w.cho{border-color:#7c5cd6;background:#f3efff;color:#3f2a86}
#smhfb-soan-w.xong{border-color:#2e9d57;background:#eefaf2;color:#1c6b3a}
#smhfb-soan-w.loi{border-color:#d93a3a;background:#fff1f0;color:#9c2323}
#smhfb-soan-w .gh{display:flex;align-items:center;gap:12px;justify-content:space-between}#smhfb-soan-w .gt{font-weight:600;opacity:.8;font-variant-numeric:tabular-nums}
#smhfb-soan-w .gb{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
#smhfb-soan-w .gc{display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;border-radius:999px;border:1.5px solid #d8d2c4;background:#faf8f3;color:#6b665a;font-size:12.5px;font-weight:700;white-space:nowrap}
#smhfb-soan-w .gc .ic{width:18px;height:18px;border-radius:50%;flex:none;display:inline-flex;align-items:center;justify-content:center;font-size:11px;line-height:1;color:#6b665a;border:1.5px solid #cfc8b8;background:#fff}
#smhfb-soan-w .gc.xong{border-color:#2e9d57;background:#e6f6ec;color:#1c6b3a}#smhfb-soan-w .gc.xong .ic{background:#2e9d57;border-color:#2e9d57;color:#fff}
#smhfb-soan-w .gc.chay{border-color:#e0a21a;background:#fff3d1;color:#7a5410}#smhfb-soan-w .gc.chay .ic{border:2.5px solid #f1d38a;border-top-color:#e0a21a;background:transparent;animation:smhfbGan .9s linear infinite;color:transparent}
#smhfb-soan-w .gc.cho{border-color:#7c5cd6;background:#ebe4ff;color:#3f2a86}#smhfb-soan-w .gc.cho .ic{background:#7c5cd6;border-color:#7c5cd6;color:#fff}
#smhfb-soan-w .gc.loi{border-color:#d93a3a;background:#fdeaea;color:#9c2323}#smhfb-soan-w .gc.loi .ic{background:#d93a3a;border-color:#d93a3a;color:#fff}
#smhfb-soan-w .gd{font-size:13px;font-weight:600;text-align:center;white-space:normal}
#smhfb-soan-w.chay .gd:after{content:"";display:inline-block;width:1.4em;text-align:left;animation:smhfbCham 1.2s steps(4,end) infinite}
@keyframes smh6VienNhay{0%,100%{border-color:var(--khung,#e0a21a);box-shadow:0 18px 48px var(--bong,rgba(0,0,0,.2)),0 0 0 0 rgba(240,180,41,0)}50%{border-color:#f0b429;box-shadow:0 18px 48px var(--bong,rgba(0,0,0,.2)),0 0 0 4px rgba(240,180,41,.45)}}
#smhfb.banviec{animation:smh6VienNhay 1.4s ease-in-out infinite}
@keyframes smh6NhaySap{0%,100%{box-shadow:0 18px 48px var(--bong,rgba(0,0,0,.2)),0 0 0 0 rgba(240,180,41,0);border-color:var(--khung,#e0a21a)}50%{box-shadow:0 18px 48px var(--bong,rgba(0,0,0,.2)),0 0 0 7px rgba(240,180,41,.55),inset 0 0 0 9999px rgba(255,214,90,.16);border-color:#f0b429}}
@keyframes smh6NhayDang{0%,100%{box-shadow:0 18px 48px var(--bong,rgba(0,0,0,.2)),0 0 0 0 rgba(46,157,87,0);border-color:var(--khung,#2e9d57)}50%{box-shadow:0 18px 48px var(--bong,rgba(0,0,0,.2)),0 0 0 7px rgba(46,157,87,.5),inset 0 0 0 9999px rgba(80,200,120,.13);border-color:#2e9d57}}
#smhfb.sap{animation:smh6NhaySap 1.1s ease-in-out infinite!important}
#smhfb.dang{animation:smh6NhayDang 1.3s ease-in-out infinite!important}
#smhfb .chip-duyet{background:#fff3d1;border-color:#e0a21a;color:#7a5410;font-weight:800}
#smhfb .hd-uoc{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:rgba(0,0,0,.07);font-weight:700;font-size:.92em}
#smhfb .it .tk.link{background:#e8f3ec;color:#1f6b3a;font-weight:800}
#smhfb textarea.cmtta{width:100%;box-sizing:border-box;font:13.5px/1.5 "Segoe UI",system-ui,sans-serif;padding:10px 12px;border-radius:10px;border:1px solid var(--vien,#ccc);background:var(--the,#fff);color:inherit;resize:vertical;user-select:text}
#smhfb input.cmtlink{flex:1;min-width:240px;font-size:13.5px;padding:6px 10px;border-radius:8px;border:1px solid var(--vien,#ccc)}
#smhfb .cmtck{display:inline-flex;align-items:center;gap:4px;font-weight:600;margin-right:10px;cursor:pointer}
#smhfb .cmtluu{position:sticky;bottom:0;z-index:2;box-shadow:0 -6px 16px rgba(0,0,0,.06)}
#smhfb .cmt2cot{display:grid;grid-template-columns:1fr 1fr;gap:12px}
#smhfb .cmtxem{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
#smhfb .cmtmau{border:1px solid var(--vien2,#eee);border-radius:10px;padding:8px 10px;background:var(--the,#fff)}
#smhfb .cmtmau pre{white-space:pre-wrap;font:12.5px/1.45 "Segoe UI",system-ui,sans-serif;margin:4px 0 0;user-select:text}
#smhfb .mfchon{display:inline-flex;flex-direction:column;gap:2px;font-size:11px;font-weight:700;opacity:.95}
#smhfb .mfchon select{font-size:13px;padding:5px 6px;border-radius:8px;border:1px solid var(--vien,#ccc);background:var(--nen,#fff);color:inherit;max-width:190px;cursor:pointer}
#smhfb .mffont{background:#1d1a17;color:#fff;border-radius:10px;padding:10px 14px;margin:6px 0 8px;line-height:1.45;display:flex;flex-direction:column;gap:4px}
#smhfb .mfluoi{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin:10px 0}
#smhfb .mfo{border:2px solid var(--vien);border-radius:12px;padding:6px;background:var(--the);display:flex;flex-direction:column;gap:4px}
#smhfb .mfo.chon{border-color:#2e9d57}
#smhfb .mfo img{width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:8px;cursor:zoom-in;display:block}
#smhfb .mfrong{aspect-ratio:9/16;display:flex;align-items:center;justify-content:center;background:var(--do-nen);color:var(--do-chu);border-radius:8px}
#smhfb .mft{display:flex;justify-content:space-between;align-items:center;gap:4px;font-size:13px}#smhfb .mft .chip{margin:0;white-space:nowrap}#smhfb .mft b{white-space:nowrap}#smhfb .mfn .phu-nut{white-space:nowrap}
#smhfb .mfc{font-size:12px;color:var(--phu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#smhfb .mfn{display:flex;justify-content:space-between}
#smhfb .mfxem{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;pointer-events:auto}
#smhfb .mfxk{background:var(--nen);border-radius:16px;padding:14px 16px;max-height:96vh;display:flex;flex-direction:column;gap:8px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
#smhfb .mfxd{display:flex;align-items:center;gap:10px}
#smhfb .mfxa{display:flex;align-items:center;gap:12px}#smhfb .mfxa img{height:min(78vh,900px);aspect-ratio:9/16;object-fit:contain;border-radius:10px;background:#000}
#smhfb .mfxa .nut{font-size:28px;padding:8px 16px}
#smhfb .seg.nho button{min-height:0;font-size:15px;padding:10px 6px}
`;
  const ui6 = { nhan: false, htmlCu: '', locNK: 'quan', xem: null };
  let veHen = 0, gocTitle = document.title;
  function veBang() { if (veHen) return; veHen = setTimeout(() => { veHen = 0; try { veBangNgay(); } catch (e) { console.log('[smh6] vẽ popup lỗi', e); } }, 120); }
  const dangSap = () => !!demNguoc || (() => { const c = lay('cho_nguoi', null); return !!(c && Date.now() - c.luc < 11 * 60000 && nhanSuDangDung()); })();
  const hdHien = () => { const h = lay('hoat_dong', null); return h && Date.now() - (h.cap || 0) < 4 * 60000 ? h : null; };
  const dongHo = (ms) => { const g = Math.max(0, Math.round(ms / 1000)); return Math.floor(g / 60) + ':' + pad(g % 60); };
  const boTab = (m) => String(m || '').replace(/\s*\[tab [^\]]+\]\s*$/, '');
  const cat = (t, n) => { t = String(t || ''); return t.length > n ? t.slice(0, n) + '…' : t; };
  const hang_ = (nhan, nd) => `<div class="r"><div class="rl">${nhan}</div><div class="rv">${nd}</div></div>`;
  const KY = (it) => it.k.toUpperCase();
  const MAU = { b1: 'b1', b2: 'b2', b3: 'b3', video: 'bv', manifest: 'bm' };
  const tenMay = (m) => (m === MAY ? 'máy này' : m === 'CAO' ? 'Máy Cao' : m === 'GIAO' ? 'Máy Giao' : m === 'tay' ? 'đánh dấu tay' : 'máy khác / đăng tay');

  // trạng thái 1 nút bấm (yêu cầu gửi cho tab làm việc): '' | 'run' | 'xong' | 'vang'
  function ttYC(loai) {
    const k = lay('yc6_kq_' + loai, null); if (!k) return { tt: '' };
    if ((k.tt === 'cho' || k.tt === 'dang') && Date.now() - k.luc < 6 * 60000) return { tt: 'run', k };
    if ((k.tt === 'xong' || k.tt === 'loi') && Date.now() - k.luc < 15000) return { tt: k.tt === 'loi' ? 'vang' : 'xong', k };
    return { tt: '', k };
  }
  const kqYC = (loai) => { const k = lay('yc6_kq_' + loai, null); return k && k.kq && Date.now() - k.luc < 6 * 3600e3 ? `${k.tt === 'loi' ? '⚠' : '✓'} ${gioStr(new Date(k.luc))} · ${k.kq}` : ''; };

  // ---------------- trạng thái chung (đèn + chữ trên thanh) ----------------
  function trangThaiChung() {
    if (!MAY) return { den: 'vang', chu: 'Chọn máy này là Máy Giao hay Máy Cao →' };
    const L = tinhLich(); const nXong = L.filter((x) => x.xong).length; const kt = L.find((x) => x.keTiep);
    const dd = lay('dang_do', null); const ct = lay('cho_tay6', null);
    if (tamDung()) return { den: 'xam', chu: `⏸ Đang tạm dừng — bấm Chạy lại để tiếp tục · đã lên ${nXong}/9 bài` };
    if (demNguoc) return { den: 'vang', nhay: true, chu: `Sắp ${esc(demNguoc.ten)}…` };
    if (dd) return { den: 'vang', nhay: true, chu: esc(tenDangDo(dd)) + (dd.cmts && dd.buoc !== 'kiem_bai' ? ` · comment ${Math.min((dd.cmtIdx || 0) + 1, dd.cmts.length)}/${dd.cmts.length}` : '') + '…' };
    if (ct) return { den: 'vang', nhay: true, chu: ct.mai ? `Đã soạn thử ${esc(ct.ten)} — xem xong bấm Huỷ (bấm Đăng thì bài lên trang ngay hôm nay)` : `Đã soạn sẵn ${esc(ct.ten)} — kiểm tra rồi bấm Đăng, script sẽ tự comment` };
    if (dangBan) return { den: 'vang', nhay: true, chu: 'Đang làm việc trên trang…' };
    const hdx = hdHien(); if (hdx) return { den: 'vang', nhay: true, chu: esc(hdx.ten) + '…' };
    const loi = L.filter((x) => ['loi', 'khong_ro', 'thieu'].includes(x.r.tt));
    if (!kt) return { den: loi.length ? 'vang' : 'xanh', chu: nXong === 9 ? '✅ Đã lên đủ 9/9 bài hôm nay' : `Hôm nay xong lịch · đã lên <b>${nXong}/9</b> bài` };
    let bd = kt.den; if (LA_CAO) bd = Math.max(kt.den + CAI_DAT.CAO_TRE_PHUT * 60000, moLuc + CAI_DAT.CAO_CHO_MO_PHUT * 60000);
    const dau = `<b>${nXong}/9</b> bài · `;
    if (!tuDong()) return { den: 'xam', chu: dau + `⏸ Tự đăng đang TẮT trên máy này · bài kế tiếp ${kt.ten}` };
    if (dangHoan()) return { den: 'vang', chu: dau + `Đang hoãn đến ${gioStr(new Date(lay('hoan6', 0)))}` };
    if (kt.r.loi && kt.r.thuLai > Date.now()) return { den: 'do', chu: dau + `⚠ ${kt.ten} lỗi — thử lại lúc ${gioStr(new Date(kt.r.thuLai))}` };
    if (Date.now() < bd) return { den: loi.length ? 'vang' : 'xanh', chu: dau + `${kt.ten} lúc <b>${gioStr(new Date(bd))}</b>${LA_CAO ? ' (nếu Máy Giao chưa đăng)' : ''} · còn <b data-hen="${bd}"></b>` };
    return { den: 'vang', nhay: true, chu: dau + `Đến giờ ${kt.ten} — đang chuẩn bị…` };
  }
  function thieuNgay() { // các ngày (hôm nay + 2 ngày tới) còn thiếu nội dung
    const d = duLieu(); if (!d) return [];
    const out = []; const s = trangThai();
    for (let i = 0; i <= 2; i++) {
      const ngay = ngayStr(congNgay(i)); let t = thieuCuaNgay(ngay, d); if (!t) continue;
      if (i === 0) t = t.filter((x) => !KET.includes((s.s[x.k] || {}).tt));
      if (t.length) out.push({ ngay, i, t });
    }
    return out;
  }
  // hàng đã có nội dung nhưng chưa ghi ngày đăng (lý do hay gặp khiến popup báo "thiếu")
  function chuaNgay(d = duLieu()) {
    const out = [];
    if (d && (d.ban || 0) < 2) return out; // dữ liệu đọc bằng bản cũ (chưa lọc "còn xa") → không nhắc, đợi lần đọc kế
    if (d && (d.chuaNgayV || []).length) out.push({ k: 'v', chu: `Tab "Kênh 1 Vòng Trầm Hương SMH": hàng ${gonHang(d.chuaNgayV)} đã có video/manifest nhưng cột K (Ngày đăng) còn trống`, nut: 'mosheetvideo' });
    if (d && (d.chuaNgayB || []).length) out.push({ k: 'b', chu: `Tab "Bài viết kênh 1": hàng ${gonHang(d.chuaNgayB)} đã có bài nhưng cột H (Ngày đăng) còn trống`, nut: 'mosheet' });
    return out;
  }
  // ---------------- việc cần bạn xử lý ----------------
  function viecCanXuLy() {
    const ds = []; const s = trangThai();
    for (const it of LICH) {
      const r = s.s[it.k] || {};
      if (['loi', 'khong_ro', 'thieu'].includes(r.tt)) ds.push({ k: 'sl|' + it.k + r.tt, chu: `${it.ten} chưa đăng được: ${r.lyDo || r.loi || r.tt}`, nut: [['✎ Soạn', 'soan', `data-k="${it.k}"`, 'tim'], ['↺ Đăng lại', 'khoiphuc', `data-k="${it.k}"`], ['✓ Đã đăng tay', 'danhdau', `data-k="${it.k}"`]] });
      if (XONG.includes(r.tt) && !r.cmtOk && (r.kiem || []).length >= CAI_DAT.KIEM_CMT_TOI_DA) ds.push({ k: 'cm|' + it.k, chu: `${it.ten}: đã kiểm ${(r.kiem || []).length} lần vẫn thiếu comment`, nut: [r.link ? ['↗ Mở bài', 'mobai', `data-link="${esc(r.link)}"`] : null, ['💬 Kiểm lại', 'kiemlai', `data-k="${it.k}"`, 'chinh']].filter(Boolean) });
    }
    for (const c of chuaNgay()) ds.push({ k: 'cn|' + c.chu, chu: c.chu + ' → script chưa biết đăng ngày nào, hãy điền ngày', nut: [['▦ Mở sheet', c.nut, '', 'chinh']] });
    const tn = thieuNgay();
    if (tn.length) ds.push({ k: 'thieu|' + tn.map((x) => x.ngay + x.t.length).join(), chu: `Cập nhật nội dung cho ${tn.map((x) => (x.i === 0 ? 'hôm nay' : x.i === 1 ? 'ngày mai' : x.ngay.slice(0, 5).replace('-', '/'))).join(', ')} (${tn.reduce((a, x) => a + x.t.length, 0)} bài còn thiếu — theo sheet đọc lúc ${gioStr(new Date(duLieu().luc))}${ngayStr(new Date(duLieu().luc)) !== homNay() ? ' ' + ngayStr(new Date(duLieu().luc)).slice(0, 5).replace('-', '/') : ''}; vừa sửa sheet thì bấm Đọc lại)`, tip: tn.map((x) => x.ngay + ': ' + x.t.map((y) => y.ten + ' thiếu ' + y.thieu.join(', ')).join('; ')).join('\n'), nut: [['▦ Mở sheet', 'mosheet', ''], ['Xem', 'xemsaptoi', '']] });
    if (MAY && !nhacInfo()) ds.push({ k: 'nhac', chu: 'Máy này chưa có nhạc nền cho video manifest', nut: [['🎵 Tải nhạc', 'xemmanifest', '', 'chinh']] });
    if (!coApi()) ds.push({ k: 'chuama', chu: 'Chưa cài mã khoá Facebook (script chưa dò được bài trên trang)', nut: [['🔑 Cài mã khoá', 'caima', '', 'chinh']] });
    else { const luc = lay('fb_token_luc', 0); const n = luc ? Math.floor((Date.now() - luc) / 864e5) : 0; if (n >= CAI_DAT.MA_KHOA_HAN_NGAY - 10) ds.push({ k: 'hetma', chu: `Mã khoá Facebook đã dùng ${n} ngày — nên lấy mã mới`, nut: [['🔑 Đổi mã khoá', 'caima', '', 'chinh']] }); }
    const g = chanLark(); if (g) ds.push({ k: 'lark', chu: g.msg + ' — script vẫn đăng bằng dữ liệu đã tải sẵn', nut: [] });
    else if (!duLieu()) ds.push({ k: 'chuadoc', chu: 'Chưa đọc được Lark sheet lần nào', nut: [['📥 Đọc sheet', 'docsheet', '', 'chinh']] });
    return ds;
  }
  function theViec() {
    const ds = viecCanXuLy();
    if (!ds.length) return '<div class="viec ok">✓ Không có việc nào cần bạn xử lý</div>';
    return `<div class="viec"><h3>⚠ ${ds.length} việc cần bạn xử lý</h3>${ds.map((v, i) => `<div class="vr${i ? '' : ' dau'}" title="${esc(v.tip || '')}"><span class="vt">${esc(v.chu)}</span><span class="vn">${v.nut.map(([t, a, x, l]) => `<button class="nut nho ${l || ''}" data-a="${a}" ${x}>${t}</button>`).join(' ')}</span></div>`).join('')}</div>`;
  }

  // ---------------- thanh trên cùng ----------------
  const lopTt = (x) => (x.xong ? 'ok' : ['loi', 'khong_ro', 'thieu'].includes(x.r.tt) ? 'loi' : x.r.tt === 'dang' || (x.keTiep && Date.now() >= (x.den || 0)) ? 'cho' : '');
  function chips() {
    return tinhLich().map((x) => {
      const coLink = x.xong && /^https?:/.test(x.r.link || '');
      const mo = x.xong ? `đã lên lúc ${gioStr(new Date(x.r.luc))} (${tenMay(x.r.may)})` : x.r.tt === 'bo' ? 'đã bỏ' : `dự kiến ${phutStr(x.gioKH)}`;
      return `<button class="tg ${lopTt(x)}" style="${x.r.tt === 'bo' ? 'text-decoration:line-through;opacity:.6' : ''}" data-a="${coLink ? 'mobai' : 'chon'}" data-k="${x.k}"${coLink ? ` data-link="${esc(x.r.link)}"` : ''} title="${esc(x.ten + ' · ' + mo + (coLink ? ' · bấm để mở bài' : ''))}">${x.xong ? '✓ ' : ''}${KY(x)}</button>`;
    }).join('');
  }
  // thông báo nhỏ nổi dưới màn hình (4 giây) — mọi thao tác bấm nút đều có 1 dòng báo
  function nhacNho(chu, mau, ms) { ui6.nho = { chu: String(chu || '').replace(/\s*\[tab [^\]]+\]\s*$/, ''), mau: mau || 'ok', den: Date.now() + (ms || 4000) }; veNhacNho(); }
  function veNhacNho() {
    let el = document.getElementById('smhfb-nho'); const n = ui6.nho;
    if (!n || Date.now() > n.den) { if (el) el.classList.remove('hien'); return; }
    if (!el) { el = document.createElement('div'); el.id = 'smhfb-nho'; document.body.appendChild(el); }
    const html = `<span class="d"></span><span>${esc(n.chu)}</span>`; if (el.innerHTML !== html) el.innerHTML = html;
    el.className = n.mau + ' hien';
  }
  function thanhHoatDong() {
    if (demNguoc) {
      const con = Math.max(0, Math.ceil((demNguoc.den - Date.now()) / 1000));
      const u = uocDem(demNguoc.ten);
      return `<div class="hdg dem"><span class="hd-so" data-demso>${demNguoc.dung ? '⏸' : con}</span><div class="hd-noi"><div class="hd-ten">⏳ Sắp ${esc(demNguoc.ten)} — ${demNguoc.dung ? 'đã tạm dừng' : 'bắt đầu sau <span data-demchu>' + con + '</span> giây'}<span class="hd-uoc">dự kiến ~${dongHo(u)}</span></div><div class="hd-chi">${demNguoc.dung ? 'Bấm Tiếp tục khi bạn dùng trang xong (tự tiếp tục sau 10 phút)' : (u >= 60000 ? 'Việc này dùng trang Facebook khoảng ' + Math.round(u / 60000) + ' phút — đang cần dùng trang thì bấm Hoãn 10 phút' : 'Việc nhanh trên trang Facebook — để script làm, hoặc bấm Hoãn nếu đang cần trang')}</div></div><button class="nut ${demNguoc.dung ? 'chinh' : 'vang'}" data-a="${demNguoc.dung ? 'dntiep' : 'dndung'}">${demNguoc.dung ? '▶ Tiếp tục' : '⏸ Tạm dừng'}</button><button class="nut" data-a="dnhoan">Hoãn 10 phút</button></div>`;
    }
    const hd = hdHien();
    if (hd) { const uoc = uocLuong(hd.key, hd.ten); return `<div class="hdg chay"><span class="hd-den"></span><div class="hd-noi"><div class="hd-ten">${esc(hd.ten)}<span class="hd-cham"></span></div>${hd.chi ? `<div class="hd-chi">${esc(boTab(hd.chi))}</div>` : ''}</div><div class="hd-gio" data-hdbd="${hd.bd}" data-uoc="${uoc}"></div><i class="hd-tien" data-tien="1" style="width:${Math.min(96, Math.round(((Date.now() - hd.bd) / uoc) * 100))}%"></i>${dangBan && !tamDung() ? '<button class="phu-nut do" data-a="tamdung">⏸ Tạm dừng</button>' : ''}</div>`; }
    const c = lay('cho_nguoi', null);
    if (c && Date.now() - c.luc < 11 * 60000 && nhanSuDangDung()) { const con = Math.max(0, c.luc + CAI_DAT.CHO_NGUOI_TOI_DA_PHUT * 60000 - Date.now()); return `<div class="hdg cho"><span class="hd-den cho"></span><div class="hd-noi"><div class="hd-ten">⏳ Sắp ${esc(c.ten || 'làm việc trên trang')} — đang chờ bạn dùng xong trang<span class="hd-uoc">dự kiến ~${dongHo(uocDem(c.ten || ''))}</span></div><div class="hd-chi">${esc(c.ly)} → còn tối đa <b data-hen="${c.luc + CAI_DAT.CHO_NGUOI_TOI_DA_PHUT * 60000}">${dongHo(con)}</b>, hết giờ sẽ đếm ngược 10 giây rồi mới làm</div></div><button class="nut chinh" data-a="lamngay">▶ Làm ngay</button><button class="nut" data-a="dnhoan">⏸ Hoãn 10 phút</button></div>`; }
    const k = lay('hd_ket', null);
    if (k && k.ngan && !k.dong && Date.now() - k.luc < 60000) return `<div class="tb-quet ok"><span>✓ <b>Xong: ${esc(String(k.ten).replace(/^Đang /, ''))}</b> <span class="mo">(mất ${dongHo(k.tg)})</span>${k.chu ? ' — ' + esc(boTab(k.chu)).slice(0, 140) : ''}</span></div>`;
    if (k && !k.ngan && !k.dong && Date.now() - k.luc < 60000) return `<div class="tb-quet ${k.mau}"><span>${k.mau === 'ok' ? '✅' : '⚠️'} <b>Xong: ${esc(String(k.ten).replace(/^Đang /, ''))} lúc ${gioStr(new Date(k.luc))}</b> <span class="mo">(mất ${dongHo(k.tg)})</span>${k.chu ? ' — ' + esc(boTab(k.chu)) : ''} <span class="mo">· tự ẩn sau 1 phút</span></span><button class="phu-nut" data-a="donghd" title="Ẩn ngay">✕</button></div>`;
    return '';
  }

  // ---------------- tab Hôm nay ----------------
  function oThaoTac(loai, ic, ten, tt, mo, nut, bam) {
    const { tt: st } = ttYC(loai); const hd = hdHien();
    const live = st === 'run' ? ((hd && hd.key === 'yeucau' && hd.chi) ? boTab(hd.chi) : 'Đang làm…') : '';
    const kq = kqYC(loai);
    const icon = st === 'run' ? '<span class="xoay"></span>' : st === 'xong' ? '✓' : st === 'vang' ? '!' : ic;
    const dong = live || kq || mo;
    return `<div class="tn ${st}${bam ? ' bam' : ''}"${bam ? ` data-a="${bam}" role="button" tabindex="0"` : ''}><div class="tn-dau"><span class="tn-ic">${icon}</span><div class="tn-ten"><b>${ten}</b><span>${esc(tt)}</span></div></div><div class="tn-mo${live ? ' live' : ''}" title="${esc(dong)}">${esc(dong)}</div><div class="tn-nut">${nut}</div></div>`;
  }
  function khuThaoTac() {
    const L = tinhLich(); const nX = L.filter((x) => x.xong).length; const d = duLieu(); const tr = lay('trang6', null) || {};
    const kiem = ['kiem1', 'kiem3', 'kiem24'].map((k) => ttYC(k)).find((x) => x.tt) || { tt: '' };
    const o1 = oThaoTac('docsheet', '📥', 'Đọc lại sheet', d ? `Đọc lúc ${gioStr(new Date(d.luc))} ${ngayStr(new Date(d.luc)).slice(0, 5).replace('-', '/')}` : 'Chưa đọc lần nào', `Tự đọc ${CAI_DAT.GIO_DOC_NHE} và ${CAI_DAT.GIO_DOC_CHOT} · bấm khi vừa sửa sheet`, '<span class="nut nho chinh">Đọc ngay</span>', 'docsheet');
    const rs = LICH.map((it) => trangThai().s[it.k]).filter((r) => r && XONG.includes(r.tt)); const du = rs.filter((r) => r.cmtOk).length;
    const o2 = `<div class="tn ${kiem.tt}"><div class="tn-dau"><span class="tn-ic">${kiem.tt === 'run' ? '<span class="xoay"></span>' : kiem.tt === 'xong' ? '✓' : '💬'}</span><div class="tn-ten"><b>Kiểm comment</b><span>${du}/${rs.length} bài đã đủ comment</span></div></div><div class="tn-mo${kiem.tt === 'run' ? ' live' : ''}">${esc(kiem.tt === 'run' ? 'Đang kiểm…' : kqYC('kiem1') || kqYC('kiem3') || kqYC('kiem24') || `Tự kiểm sau đăng ~2, 10, 20 phút và lúc ${CAI_DAT.GIO_KIEM_CMT_CUOI} · thiếu thì gửi bù`)}</div><div class="tn-nut"><div class="seg nho"><button data-a="kiem1" title="Kiểm comment bài mới nhất trên trang">Bài mới nhất</button><button data-a="kiem3" title="Kiểm comment 3 bài gần nhất hôm nay">3 bài</button><button data-a="kiem24" title="Kiểm comment video/manifest trong 24 giờ qua">Video 24 giờ</button></div></div></div>`;
    const o3 = oThaoTac('dotrang', '🔍', 'Kiểm tra bài đã đăng', `${nX}/9 bài hôm nay đã lên trang`, tr.luc ? `Dò lần cuối ${gioStr(new Date(tr.luc))} · tự dò ${CAI_DAT.DO_TRANG_PHUT} phút/lần` : `Tự dò ${CAI_DAT.DO_TRANG_PHUT} phút/lần`, '<span class="nut nho chinh">Kiểm ngay</span>', 'lammoi');
    return `<div class="tn3">${o1}${o2}${o3}</div>`;
  }
  function nhanSlot(x) {
    const r = x.r;
    if (x.xong) return { gio: gioStr(new Date(r.luc)), mo: `Đã lên lúc ${gioStr(new Date(r.luc))} · ${tenMay(r.may)}${r.cmtOk ? ' · comment ✓' : r.id ? ` · comment ${(r.kiem || []).length ? 'còn thiếu' : 'chờ kiểm'}` : ''}` };
    const g = x.keTiep && x.den && x.den > lucPhut(x.gioKH) + 60000 ? gioStr(new Date(x.den)) : phutStr(x.gioKH);
    if (r.tt === 'dang') return { gio: g, mo: 'Đang đăng…' };
    if (r.daSoan && (lay('cho_tay6', null) || {}).slot === x.k) return { gio: g, mo: `Đã soạn sẵn lúc ${gioStr(new Date(r.daSoan))} — chờ bạn bấm Đăng` };
    if (r.tt === 'bo') return { gio: g, mo: 'Đã bỏ: ' + (r.lyDo || '') };
    if (['loi', 'khong_ro', 'thieu'].includes(r.tt)) return { gio: g, mo: '⚠ ' + (r.lyDo || r.loi || 'lỗi') };
    if (r.loi) return { gio: g, mo: `Lỗi, thử lại lúc ${gioStr(new Date(r.thuLai || Date.now()))}` };
    return { gio: g, mo: x.keTiep ? (g !== phutStr(x.gioKH) ? `Bài kế tiếp · dời ${g} (cách bài trước ${CAI_DAT.CACH_BU_PHUT} phút)` : `Bài kế tiếp · tự động ${g}`) : `Tự động · hẹn ${g}` };
  }
  function theSlot(x) {
    const r = x.r; const nd = noiDungSlot(homNay(), x.k);
    const kq = x.xong ? ['ok', `✓ Đã lên ${gioStr(new Date(r.luc))}`] : r.tt === 'dang' ? ['cho', 'Đang đăng…'] : r.tt === 'bo' ? ['xam', 'Đã bỏ'] : ['loi', 'khong_ro', 'thieu'].includes(r.tt) ? ['loi', r.tt === 'thieu' ? 'Thiếu nội dung' : r.tt === 'khong_ro' ? 'Chưa rõ đã lên chưa' : 'Lỗi — đã bỏ qua'] : x.keTiep ? ['cho', 'Bài kế tiếp'] : ['xam', 'Chờ đến giờ'];
    let h = `<div class="bai ${MAU[x.loai]}"><div class="bai-h"><span class="bai-t">${esc(x.ten)}<small>khung ${x.tu}–${x.den && typeof x.den === 'string' ? x.den : (LICH.find((y) => y.k === x.k) || {}).den}</small></span><span class="kq ${kq[0]}">${kq[1]}</span></div>`;
    h += hang_('Giờ đăng', x.xong ? `<b>${gioStr(new Date(r.luc))}</b> · ${tenMay(r.may)}` : `<b>${nhanSlot(x).gio}</b>`);
    const cot = { b1: 'cột B', b2: 'cột D', b3: 'cột F', video: 'cột E (tab Kênh 1)', manifest: 'cột G (tab Kênh 1)' }[x.loai];
    h += hang_(`Nội dung · ${cot}`, nd.text ? `<span class="rv phu">${esc(cat(nd.text, 160))}</span>` : '<span class="chip loi">Trống</span>');
    if (x.loai === 'b2' || x.loai === 'b3') h += hang_('Ảnh của bài', (nd.anh || []).length ? `<span class="chip ok">${nd.anh.length} ảnh</span>` : '<span class="chip loi">Chưa có ảnh</span>');
    if (x.loai === 'video') h += hang_('File video · cột N', nd.tep ? `<span class="chip ok">${esc(nd.tep.ten)} · ${(nd.tep.size / 1048576).toFixed(1)} MB</span>` : (x.xong ? '<span class="chip xam">—</span>' : '<span class="chip loi">Chưa có file</span>'));
    if (x.loai === 'manifest') h += hang_('Ảnh manifest · cột H', nd.anh ? '<span class="chip ok">Có ảnh — script tự ghép video 15 giây + nhạc</span>' : (x.xong ? '<span class="chip xam">—</span>' : '<span class="chip loi">Chưa có ảnh</span>'));
    const can = r.can || (nd.text ? canCmt(x, nd) : null);
    const cm = !x.xong ? '<span class="chip xam">Chờ đăng bài</span>' : r.cmtOk ? `<span class="chip ok">✓ Đủ comment</span><span class="mo">kiểm ${(r.kiem || []).length} lần</span>` : `<span class="chip cho">${(r.kiem || []).length ? 'Còn thiếu' : 'Chưa kiểm'}</span><span class="mo">kiểm ${(r.kiem || []).length}/${CAI_DAT.KIEM_CMT_TOI_DA}${r.guiBu ? ' · đã gửi bù ' + r.guiBu : ''}</span>`;
    h += hang_(`Comment${can ? ` · ${can.text.length} chữ + ${can.anh.length} ảnh` : ''}`, cm);
    if (!x.xong && nd.thieu && nd.thieu.length) h += `<div class="ghichu">⚠ Thiếu: ${esc(nd.thieu.join(', '))}</div>`;
    if (!x.xong && (r.lyDo || r.loi)) h += `<div class="ghichu">⚠ ${esc(r.lyDo || r.loi)}</div>`;
    const nut = [];
    if (x.xong && r.link) nut.push(`<a href="#" data-a="mobai" data-link="${esc(r.link)}">Mở bài ↗</a>`);
    if (!x.xong && r.tt !== 'dang') nut.push(`<button class="nut nho tim" data-a="soan" data-k="${x.k}" title="Làm hết mọi thứ (chữ, ảnh/video, vị trí, thẻ, nhóm…) rồi DỪNG trước nút Đăng — bạn bấm Đăng, script tự comment">✎ Soạn</button>`, `<button class="nut nho chinh" data-a="dangngay" data-k="${x.k}" title="Đăng ngay, không chờ giờ hẹn">▶ Đăng ngay</button>`);
    if (!x.ket && r.tt !== 'dang') nut.push(`<button class="phu-nut" data-a="boqua" data-k="${x.k}">Bỏ qua hôm nay</button>`);
    if (['bo', 'loi', 'thieu', 'khong_ro'].includes(r.tt)) nut.push(`<button class="phu-nut" data-a="khoiphuc" data-k="${x.k}">↺ Đưa lại vào hàng chờ</button>`);
    if (!x.xong && r.tt !== 'dang') nut.push(`<button class="phu-nut" data-a="danhdau" data-k="${x.k}" title="Bài đã lên trang mà script chưa nhận ra">✓ Đánh dấu đã đăng</button>`);
    if (r.may === 'tay') nut.push(`<button class="phu-nut" data-a="bodanhdau" data-k="${x.k}">Bỏ đánh dấu</button>`);
    if (nut.length) h += `<div class="r">${nut.join(' ')}</div>`;
    return h + '</div>';
  }
  // nút bên phải mỗi dòng trong lịch: chưa đăng → "Soạn" · đã đăng → "Mở link"
  function nutTimeline(x, ngay) {
    if (x.xong) return x.r.link ? `<button class="phu-nut tk link" data-a="mobai" data-link="${esc(x.r.link)}" title="Mở bài đã đăng ở tab mới">↗ Mở link</button>` : '';
    if (x.r.tt === 'dang') return '<span class="phu-nut tk dang"><span class="xoay"></span>Đang làm…</span>';
    if (x.r.daSoan && (lay('cho_tay6', null) || {}).slot === x.k) return '<span class="phu-nut tk dang">✎ Đã soạn — chờ bấm Đăng</span>';
    if (x.ket && !ngay) return '';
    return `<button class="phu-nut tk soan" data-a="soan" data-k="${x.k}"${ngay ? ` data-ngay="${ngay}"` : ''} title="${ngay ? 'Soạn thử bài của ngày mai ngay bây giờ (dừng trước nút Đăng)' : `Soạn sẵn ${esc(x.ten)} (dừng trước nút Đăng)`}">✎ Soạn</button>`;
  }
  // ---------------- tab Ngày mai ----------------
  function tabNgayMai() {
    const nm = ngayMai(); const dt = congNgay(1); const d = duLieu(); const s = trangThai(nm); const L = tinhLich(s);
    const ct = lay('cho_tay6', null);
    let html = `<div class="mo" style="margin:0 0 10px"><b>${THU[dt.getDay()]} ${nm.replace(/-/g, '/')}</b> · giờ dự kiến đã bốc ngẫu nhiên trong khung (ngày mai script tự đăng đúng giờ này). Bấm <b>✎ Soạn</b> để soạn thử ngay bây giờ: script làm hết mọi bước rồi dừng trước nút Đăng — bạn xem kỹ rồi bấm <b>Huỷ</b>.</div>`;
    if (ct && ct.mai) html += `<div class="ghichu">⚠ Đang có ${esc(ct.ten)} soạn thử dở trên trang — xem xong bấm Huỷ / đóng hộp. Nếu bấm Đăng thì bài lên trang NGAY HÔM NAY và ngày mai không đăng lại.</div>`;
    if (!d || !d.ngay || !d.ngay[nm]) html += '<div class="ghichu">Chưa đọc được nội dung ngày mai trong sheet — bấm "Đọc lại Lark sheet" ở tab Sắp tới.</div>';
    const tl = L.map((x) => {
      const nd = noiDungSlot(nm, x.k, d); const r = x.r;
      const lop = x.xong ? 'ok' : nd.thieu.length ? 'loi' : 'xam';
      const mo = x.xong ? `Đã lên ${gioStr(new Date(r.luc))}${r.lyDo ? ' · ' + r.lyDo : ''}` : nd.thieu.length ? '⚠ thiếu ' + nd.thieu.join(', ') : r.soanThu ? `Đã soạn thử lúc ${gioStr(new Date(r.soanThu))} · đủ nội dung` : '✓ đủ nội dung · tự động ' + phutStr(x.gioKH);
      return `<div class="it" data-a="chonmai" data-k="${x.k}"><div class="dm ${lop}">${x.xong ? '✓' : KY(x)}</div><div class="h">${phutStr(x.gioKH)} · ${esc(x.ten)}</div><div class="t">${esc(mo)}</div>${nd.thieu.length && !x.xong ? '' : nutTimeline(x, nm)}</div>`;
    }).join('');
    const chon = L.find((x) => x.k === uiTab.chonMai) || L[0];
    return html + `<div class="tlay"><div class="tl"><h4>Lịch ngày mai</h4>${tl}</div><div class="ct">${theSlotMai(chon, nm, d)}</div></div>`;
  }
  function theSlotMai(x, nm, d) {
    const nd = noiDungSlot(nm, x.k, d); const r = x.r;
    const cot = { b1: 'cột B', b2: 'cột D', b3: 'cột F', video: 'cột E (tab Kênh 1)', manifest: 'cột G (tab Kênh 1)' }[x.loai];
    let h = `<div class="bai ${MAU[x.loai]}"><div class="bai-h"><span class="bai-t">${esc(x.ten)}<small>ngày mai · khung ${x.tu}–${(LICH.find((y) => y.k === x.k) || {}).den}</small></span><span class="kq ${x.xong ? 'ok' : nd.thieu.length ? 'loi' : 'xam'}">${x.xong ? '✓ Đã lên' : nd.thieu.length ? 'Thiếu nội dung' : 'Chờ ngày mai'}</span></div>`;
    h += hang_('Giờ dự kiến', `<b>${phutStr(x.gioKH)}</b>`);
    h += hang_(`Nội dung · ${cot}`, nd.text ? `<span class="rv phu">${esc(cat(nd.text, 160))}</span>` : '<span class="chip loi">Trống</span>');
    if (x.loai === 'b2' || x.loai === 'b3') h += hang_('Ảnh của bài', (nd.anh || []).length ? `<span class="chip ok">${nd.anh.length} ảnh</span>` : '<span class="chip loi">Chưa có ảnh</span>');
    if (x.loai === 'video') h += hang_('File video · cột N', nd.tep ? `<span class="chip ok">${esc(nd.tep.ten)} · ${(nd.tep.size / 1048576).toFixed(1)} MB</span>` : '<span class="chip loi">Chưa có file</span>');
    if (x.loai === 'manifest') h += hang_('Ảnh manifest · cột H', nd.anh ? '<span class="chip ok">Có ảnh</span>' : '<span class="chip loi">Chưa có ảnh</span>');
    if (nd.thieu.length) h += `<div class="ghichu">⚠ Thiếu: ${esc(nd.thieu.join(', '))} — bổ sung trong sheet rồi bấm Đọc lại Lark sheet</div>`;
    if (r.lyDo) h += `<div class="ghichu">${esc(r.lyDo)}</div>`;
    const nut = [];
    if (x.xong && r.link) nut.push(`<a href="#" data-a="mobai" data-link="${esc(r.link)}">Mở bài ↗</a>`);
    if (!x.xong && !nd.thieu.length && r.tt !== 'dang') nut.push(`<button class="nut nho tim" data-a="soan" data-k="${x.k}" data-ngay="${nm}">✎ Soạn thử ngay (không đăng)</button>`);
    if (x.xong && r.may === 'tay') nut.push(`<button class="phu-nut" data-a="bodanhdau" data-k="${x.k}" data-ngay="${nm}">Bỏ đánh dấu (ngày mai đăng lại)</button>`);
    return h + `<div class="hang" style="margin-top:8px">${nut.join('')}</div></div>`;
  }
  function tabHomNay() {
    const L = tinhLich(); const t = trangThaiChung(); const xongN = L.filter((x) => x.xong).length;
    const chon = L.find((x) => x.k === uiTab.chon) || L.find((x) => x.keTiep) || L[L.length - 1];
    let html = theViec() + khuThaoTac();
    html += `<div class="strip s-${t.den}"><span class="den ${t.den}${t.nhay ? ' nhay' : ''}"></span><span style="flex:1">${t.chu}</span><span class="kq ${xongN === 9 ? 'ok' : 'xam'}">${xongN}/9 bài đã lên trang</span></div>`;
    { const sk = lay('sk6', null); if (sk && sk.ngay === homNay() && sk.loi && sk.loi.length) html += `<div class="ghichu" style="border-color:#e0245e;color:#e0245e"><b>🩺 Tự kiểm tra sáng ${gioStr(new Date(sk.luc))} phát hiện:</b> ${sk.loi.map(esc).join(' · ')}</div>`; } // (6.15)
    const khoa = (x) => (x.xong && x.r.luc ? phutTrongNgay(new Date(x.r.luc)) : x.keTiep && x.den ? phutTrongNgay(new Date(x.den)) : x.gioKH);
    const tl = L.slice().sort((a, b) => khoa(a) - khoa(b)).map((x) => {
      const nl = nhanSlot(x); const lop = lopTt(x) || 'xam';
      const nutSoan = nutTimeline(x, '');
      return `<div class="it${x.k === chon.k ? ' sel' : ''}" data-a="chon" data-k="${x.k}"><div class="dm ${lop}">${x.xong ? '✓' : KY(x)}</div><div class="h">${nl.gio} · ${esc(x.ten)}</div><div class="t">${esc(nl.mo)}</div>${nutSoan}</div>`;
    }).join('');
    const ng = Object.values(trangThai().ngoai || {});
    const ngoai = ng.length ? `<div class="the-nd"><div class="nhan">Video/manifest đăng ngoài lịch hôm nay (${ng.length})</div>${ng.map((r) => `<div class="dong"><span>${gioStr(new Date(r.luc))}</span><span>${esc(cat(r.text, 60) || '(không có chữ)')} · ${r.cmtOk ? '<span class="chip ok">đủ comment</span>' : `<span class="chip cho">kiểm ${(r.kiem || []).length}/3</span>`}${r.link ? ` <a href="#" data-a="mobai" data-link="${esc(r.link)}">Mở ↗</a>` : ''}</span></div>`).join('')}</div>` : '';
    const d = new Date(); const dl = duLieu();
    const mo = `<div class="mo" style="margin:0 0 10px">${THU[d.getDay()]} ${homNay().replace(/-/g, '/')} · 9 bài/ngày, giờ ngẫu nhiên trong khung · bài trễ đăng bù cách nhau ${CAI_DAT.CACH_BU_PHUT} phút · quá ${CAI_DAT.GIO_CHOT} thì bỏ${dl ? ` · sheet đọc lúc ${gioStr(new Date(dl.luc))}` : ''}</div>`;
    return html + `<div class="tlay"><div class="tl"><h4>Lịch hôm nay</h4>${tl}</div><div class="ct">${mo}${theSlot(chon)}${ngoai}</div></div>`;
  }

  // ---------------- tab Sắp tới ----------------
  function nutLon(loai, ic, ten, tt, mo, tip) {
    const { tt: st } = ttYC(loai);
    return `<button class="big${st === 'run' ? ' run' : st === 'xong' ? ' xong' : ''}" data-a="${loai}" title="${esc(tip)}"><span class="bi"><span>${st === 'run' ? '↻' : st === 'xong' ? '✓' : ic}</span></span><span class="bt"><b>${st === 'run' ? tt.dang : st === 'xong' ? tt.xong : ten}</b><small>${mo}</small></span></button>`;
  }
  function tabSapToi() {
    const d = duLieu();
    let html = `<div class="acts">${nutLon('docsheet', '↻', 'Đọc lại Lark sheet', { dang: 'Đang đọc sheet…', xong: 'Đã đọc xong!' }, d ? `Đọc lúc <b>${gioStr(new Date(d.luc))}</b> · tự đọc ${CAI_DAT.GIO_DOC_NHE} và ${CAI_DAT.GIO_DOC_CHOT}` : 'Chưa đọc — bấm để đọc', 'Đọc lại cả 2 tab trong Lark sheet (2 lượt gọi Lark)')}
      <button class="big sheet" data-a="mosheet"><span class="bi"><span>▦</span></span><span class="bt"><b>Mở sheet Bài viết</b><small>Tab "Bài viết kênh 1" (Bài 1/2/3)</small></span></button>
      <button class="big sheet" data-a="mosheetvideo"><span class="bi"><span>▦</span></span><span class="bt"><b>Mở sheet Video/Manifest</b><small>Tab "Kênh 1 Vòng Trầm Hương SMH"</small></span></button></div>`;
    if (!d) return html;
    if (d.loiCot) html += `<div class="ghichu">${esc(d.loiCot)}</div>`;
    for (const c of chuaNgay(d)) html += `<div class="ghichu"><b>⚠ ${esc(c.chu)}.</b> Script chỉ đăng những hàng có ghi ngày đăng, nên các hàng này đang bị tính là "thiếu". Điền ngày vào ô đó rồi bấm "Đọc lại Lark sheet". <button class="nut nho chinh" data-a="${c.nut}">▦ Mở sheet</button></div>`;
    html += '<div class="ghi">Đỏ = còn thiếu (hôm nay / ngày mai cần bổ sung sớm) · vàng = ngày xa hơn.</div><table class="st"><tr><th>Ngày</th><th>Bài viết</th><th>Video</th><th>Manifest</th></tr>';
    const s = trangThai();
    for (let i = 0; i <= 3; i++) {
      const dt = congNgay(i); const ngay = ngayStr(dt); if (!d.ngay[ngay]) continue;
      const lop = i <= 1 ? 'loi' : 'cho';
      const o = (loais) => LICH.filter((it) => loais.includes(it.loai)).map((it) => {
        if (i === 0 && XONG.includes((s.s[it.k] || {}).tt)) return `<div class="mk ok">✓ ${it.ten}: đã lên</div>`;
        const nd = noiDungSlot(ngay, it.k, d); return nd.thieu.length ? `<div class="mk ${lop}" title="${esc(nd.thieu.join(', '))}">✕ ${it.ten}: thiếu ${esc(cat(nd.thieu.join(', '), 40))}</div>` : `<div class="mk ok">✓ ${it.ten}</div>`;
      }).join('');
      let t = thieuCuaNgay(ngay, d) || []; if (i === 0) t = t.filter((x) => !XONG.includes((s.s[x.k] || {}).tt));
      const tag = i === 0 ? ' <span class="chip ok" style="margin:0">Hôm nay</span>' : i === 1 ? ' <span class="chip xam" style="margin:0">Ngày mai</span>' : '';
      if (t.length === 9) { html += `<tr class="dau ${i <= 1 ? 'thieu' : 'xa'}"><td class="ng"><b>${THU[dt.getDay()]}</b> ${ngay.slice(0, 5).replace('-', '/')}${tag}</td><td colspan="3"><div class="mk ${lop}">✕ Chưa nhập bài nào cho ngày này (tab Bài viết cột H / tab Kênh 1 cột K)</div></td></tr>`; continue; }
      html += `<tr class="dau ${t.length ? (i <= 1 ? 'thieu' : 'xa') : ''}"><td class="ng"><b>${THU[dt.getDay()]}</b> ${ngay.slice(0, 5).replace('-', '/')}${tag}<div class="mk ${t.length ? lop : 'ok'}">${t.length ? '⚠ Thiếu ' + t.length + ' bài' : '✓ Đủ'}</div></td><td>${o(['b1', 'b2', 'b3'])}</td><td>${o(['video'])}</td><td>${o(['manifest'])}</td></tr>`;
    }
    return html + '</table>';
  }

  // ---------------- tab Hôm qua / Lịch sử ----------------
  function tabHomQua() {
    const d = congNgay(-1); const ngay = ngayStr(d); const s = lay('ngay6_' + ngay, null);
    let h = `<div class="mo" style="margin:0 0 10px"><b>${THU[d.getDay()]} ${ngay.replace(/-/g, '/')}</b> — các bài hôm qua</div>`;
    if (!s) return h + '<div class="the-nd"><div class="mo">Hôm qua bản 6.0 chưa chạy nên chưa có dữ liệu.</div></div>';
    h += '<table class="ls"><tr><th>Giờ</th><th>Bài</th><th>Kết quả</th></tr>';
    LICH.map((it) => ({ it, r: (s.s || {})[it.k] || { tt: 'cho' } })).sort((a, b) => (a.r.luc || 9e15) - (b.r.luc || 9e15)).forEach(({ it, r }) => {
      const ok = XONG.includes(r.tt);
      h += `<tr><td>${ok ? gioStr(new Date(r.luc)) : '—'}</td><td><b>${it.ten}</b></td><td>${ok ? `<span class="chip ok" style="margin:0">Đã lên</span> ${tenMay(r.may)} · ${r.cmtOk ? 'đủ comment' : 'comment chưa xác nhận'}${r.link ? ` · <a href="#" data-a="mobai" data-link="${esc(r.link)}">Mở ↗</a>` : ''}` : `<span class="chip loi" style="margin:0">Chưa lên</span> ${esc(r.lyDo || r.loi || '')}`}</td></tr>`;
    });
    return h + `</table><div class="mo" style="margin-top:8px">Báo cáo cuối ngày: ${s.baoCao ? 'đã gửi lúc ' + gioStr(new Date(s.baoCao)) + (s.baoCaoMay ? ' (' + tenMay(s.baoCaoMay) + ')' : '') : 'chưa gửi'}</div>`;
  }
  function tabLichSu() {
    let h = '<table class="ls"><tr><th>Ngày</th><th>Kết quả</th><th>Chi tiết</th></tr>';
    for (let i = 0; i < 7; i++) {
      const d = congNgay(-i); const ngay = ngayStr(d); const s = lay('ngay6_' + ngay, null);
      const nh = `<b>${THU[d.getDay()]}</b> ${ngay.slice(0, 5)}${i ? '' : '<br><span class="mo">hôm nay</span>'}`;
      if (!s) { h += `<tr><td>${nh}</td><td><span class="chip xam" style="margin:0">Chưa có dữ liệu</span></td><td class="mo">bản 6.0 chưa chạy ngày này</td></tr>`; continue; }
      const xong = LICH.filter((it) => XONG.includes(((s.s || {})[it.k] || {}).tt));
      const chua = LICH.filter((it) => !XONG.includes(((s.s || {})[it.k] || {}).tt));
      h += `<tr><td>${nh}</td><td><span class="chip ${xong.length === 9 ? 'ok' : i ? 'loi' : 'cho'}" style="margin:0">${xong.length}/9 bài</span></td><td>${chua.length ? (i ? 'Chưa lên: ' : 'Còn chờ: ') + chua.map((x) => x.ten).join(', ') : 'Đủ cả 9 bài'}${s.baoCao ? '<div class="mo">Đã gửi báo cáo ' + gioStr(new Date(s.baoCao)) + '</div>' : ''}</td></tr>`;
    }
    return h + '</table>';
  }

  // ---------------- tab Manifest ----------------
  function buocMF(ten, trangThai) { // trangThai: '' chưa · 'dang' · 'xong' · 'loi'
    const ic = trangThai === 'xong' ? '✓' : trangThai === 'dang' ? '<span class="xoay"></span>' : trangThai === 'loi' ? '✕' : '○';
    return `<div class="mfb ${trangThai}"><span class="mfi">${ic}</span><span>${ten}</span></div>`;
  }
  let fontNapUI = null;
  function khuFont() {
    if (!fontNapUI) fontNapUI = napFontChon().catch(() => { fontNapUI = null; }); // nạp font để xem mẫu
    const c = fontChon(); const ds = dsFont(); const them = Object.keys(fontThem());
    const chon = (vai, nhan) => `<label class="mfchon"><span>${nhan}</span><select data-o="font_${vai}">${ds.map((f) => `<option value="${esc(f)}"${f === c[vai] ? ' selected' : ''}>${esc(f)}${FONT_GOC.includes(f) ? '' : ' (tải thêm)'}</option>`).join('')}</select></label>`;
    const ff = (f) => `font-family:'${esc(f).replace(/'/g, '')}',sans-serif`;
    const veLai = mf.ds.some((x) => x.nen && x.tt !== 'xong');
    return `<div class="hang"><b>3.</b> Font chữ ${chon('td', 'Tiêu đề')}${chon('than', 'Thân bài')}${chon('cmt', 'Lời kêu gọi (Cmt…)')}<label class="nut nho">⬆ Thêm font…<input type="file" accept=".ttf,.otf,.woff,.woff2" data-a="themfont" style="display:none"></label></div>
      <div class="mffont"><div style="${ff(c.td)};color:#f8ef3b;font-size:22px">TIÊU ĐỀ MẪU: ĐÓN NHẬN TÀI LỘC</div><div style="${ff(c.than)};font-size:19px">Thân bài mẫu: năng lượng tốt đang tìm đến bạn</div><div style="${ff(c.cmt)};font-size:17px">Cmt "đón nhận" để đón nhận năng lượng</div></div>
      ${them.length ? `<div class="hang"><span class="mo">Font đã tải thêm:</span>${them.map((f) => `<span class="chip xam">${esc(f)} <button class="phu-nut" data-a="xoafont" data-ten="${esc(f)}" title="Xoá font này">✕</button></span>`).join(' ')}</div>` : ''}
      ${veLai ? `<div class="hang"><button class="nut nho${mf.chay ? ' chay' : ''}" data-a="velaifont" ${mf.chay || mf.dan ? 'disabled' : ''}>🔤 Vẽ lại các ảnh bên dưới bằng font đang chọn (giữ ảnh nền)</button></div>` : ''}`;
  }
  function tabManifest() {
    const ni = nhacInfo(); const vung = lay('mf_vung6', 'G220:G223'); const t = mf.tien || {};
    const ban = mf.chay || mf.dan;
    let cotKQ = 'H'; try { cotKQ = docVungMF(vung).cotKQ; } catch (e) { /* */ }
    let h = `<div class="the-nd"><h4>🖼 Tạo ảnh manifest</h4><div class="mo">Tạo ảnh xem trước ngay trong popup → bấm từng ảnh để xem → chọn ảnh ưng ý → bấm Dán vào sheet (tab "Kênh 1 Vòng Trầm Hương SMH", cột bên phải ô chữ, ghi đè ảnh cũ).</div>
      <div class="hang"><b>1.</b><label class="nut nho${ui6.canhNen && !anhNenTam.length ? ' do' : ''}">📂 Chọn ảnh nền…<input type="file" accept="image/*" multiple data-a="chonnen" style="display:none"></label>${anhNenTam.length ? `<b>${anhNenTam.length} ảnh nền</b>` : '<span class="mo">chưa chọn (chọn nhiều ảnh một lúc, script dùng ngẫu nhiên)</span>'}</div>
      ${anhNenTam.length ? `<div class="anhs">${anhNenTam.slice(0, 30).map((f) => `<img src="${f.__url || (f.__url = URL.createObjectURL(f))}">`).join('')}</div>` : ''}
      <div class="hang"><b>2.</b> Vùng ô chữ <input type="text" data-o="vung" value="${esc(vung)}" placeholder="G220:G223"><span class="mo">→ ảnh sẽ dán vào cột ${esc(cotKQ)} cùng hàng</span></div>
      ${khuFont()}
      <div class="hang"><b>4.</b><button class="nut chinh${ban ? ' chay' : ''}" data-a="taoanh" ${ban ? 'disabled' : ''}>${mf.chay ? '<span class="xoay"></span>Đang tạo ảnh…' : '🖼 Tạo ảnh xem trước'}</button>${ui6.canhNen && !anhNenTam.length ? '<b style="color:var(--do-chu)">⚠ Bạn chưa chọn ảnh nền — bấm "📂 Chọn ảnh nền…" ở bước 1 trước</b>' : ''}</div>`;
    if (mf.tien) {
      const st = (b) => { const thu = ['doc', 'font', 'tao', 'xong']; const ti = thu.indexOf(t.buoc), bi = thu.indexOf(b); if (t.buoc === 'loi') return b === 'doc' && !mf.ds.length ? 'loi' : ''; if (t.buoc === 'dan' || t.buoc === 'daxong') return 'xong'; return ti > bi ? 'xong' : ti === bi ? (b === 'xong' ? 'xong' : 'dang') : ''; };
      const pt = t.n ? Math.round(((t.buoc === 'xong' || t.buoc === 'daxong' ? t.n : t.i) / t.n) * 100) : 0;
      h += `<div class="mfp">${buocMF('Đọc chữ trong sheet', st('doc'))}${buocMF('Nạp font chữ', st('font'))}${buocMF(`Tạo ảnh${t.n && (t.buoc === 'tao' || t.buoc === 'xong') ? ` ${t.buoc === 'xong' ? t.n : t.i + 1}/${t.n}` : ''}`, st('tao'))}${t.buoc === 'dan' || t.buoc === 'daxong' ? buocMF(`Dán vào sheet ${t.buoc === 'daxong' ? t.n : t.i + 1}/${t.n}`, t.buoc === 'daxong' ? 'xong' : 'dang') : ''}</div>
        ${t.n ? `<div class="thanh"><i style="width:${pt}%"></i></div>` : ''}<div class="mo" style="font-weight:700;color:${t.buoc === 'loi' ? 'var(--do-chu)' : 'var(--chu)'}">${esc(t.chu || '')}</div>`;
    }
    if (mf.ds.length) {
      const chon = mf.ds.filter((x) => x.chon && x.blob && x.tt !== 'xong').length; const daDan = mf.ds.filter((x) => x.tt === 'xong').length;
      h += `<div class="mfluoi">${mf.ds.map((x, i) => {
        const chip = x.tt === 'xong' ? '<span class="chip ok">✓ Đã dán</span>' : x.tt === 'dang' ? '<span class="chip cho">Đang dán…</span>' : x.tt === 'dangtao' ? '<span class="chip cho">Đang tạo lại…</span>' : x.tt === 'loi' ? `<span class="chip loi" title="${esc(x.loi)}">⚠ ${esc(cat(x.loi, 30))}</span>` : '<span class="chip xam">Chưa dán</span>';
        return `<div class="mfo${x.chon ? ' chon' : ''}">${x.url ? `<img src="${x.url}" data-a="xemanh" data-i="${i}" title="Bấm để xem lớn">` : '<div class="mfrong">Lỗi</div>'}<div class="mft"><b>Ô ${x.oKQ}</b>${chip}</div><div class="mfc" title="${esc(x.chu)}">${esc(cat(x.chu.split('\n').find((l) => l && !/^#manifest$/i.test(l.trim())) || '', 40))}</div><div class="mfn">${x.blob && x.tt !== 'xong' ? `<button class="phu-nut" data-a="chonanh" data-i="${i}">${x.chon ? '☑ Dán' : '☐ Không dán'}</button>` : ''}<button class="phu-nut" data-a="taolai" data-i="${i}" ${ban ? 'disabled' : ''}>↻ Tạo lại</button></div></div>`;
      }).join('')}</div>
      <div class="hang"><button class="nut chinh${mf.dan ? ' chay' : ''}" data-a="dananh" ${chon && !ban ? '' : 'disabled'}>${mf.dan ? '<span class="xoay"></span>Đang dán vào sheet…' : `📋 Dán ${chon} ảnh đã chọn vào sheet`}</button><span class="mo">${daDan ? `Đã dán ${daDan} ảnh · ` : ''}Bấm ảnh để xem lớn · ↻ Tạo lại = đổi ảnh nền khác</span></div>`;
    }
    h += '</div>';
    h += `<div class="the-nd"><h4>🎵 Nhạc nền video manifest ${ni ? '<span class="chip ok">đã có</span>' : '<span class="chip loi">chưa có</span>'}</h4>
      ${ni ? `<div><b>${esc(ni.ten)}</b> · ${(ni.size / 1024).toFixed(0)} KB · lưu ${gioStr(new Date(ni.luc))} ${ngayStr(new Date(ni.luc)).slice(0, 5).replace('-', '/')}${ni.tu === 'o' ? ' (lấy từ ô dự phòng)' : ''}</div>` : '<div class="ghichu">Máy này chưa có nhạc — tới giờ đăng manifest script sẽ lấy nhạc ở ô dự phòng.</div>'}
      <div class="hang"><label class="nut nho chinh">⬆ Tải nhạc lên…<input type="file" accept="audio/*,.mp3,.m4a,.wav" data-a="chonnhac" style="display:none"></label>${ni ? `<button class="nut nho${ui6.nhac ? ' do' : ''}" data-a="nghenhac">${ui6.nhac ? '■ Dừng' : '▶ Nghe thử'}</button>` : ''}<span class="mo">Ô nhạc dự phòng</span><input type="text" data-o="onhac" value="${esc(lay('o_nhac6', CAI_DAT.O_NHAC_DU_PHONG))}"><button class="nut nho" data-a="laynhac">Lấy nhạc từ ô này</button></div>
      <div class="mo">Nhạc lưu trong Tampermonkey của máy này (khởi động lại máy vẫn còn). Mỗi máy cần tải 1 lần.</div></div>`;
    return h;
  }
  // ---------------- tab Comment (6.9): sửa comment mặc định + câu CTA nhóm Zalo ----------------
  const TEN_LOAI_CMT = { b1: 'Bài 1', b2: 'Bài 2', b3: 'Bài 3', video: 'Video', manifest: 'Manifest' };
  function nhapCmt() { if (!ui6.cmt) { const c = cauHinhCmt(); ui6.cmt = { goc: c.goc, link: c.link, cta: c.cta.join('\n'), bat: c.bat, loai: Object.assign({}, c.loai), sua: false }; } return ui6.cmt; }
  function cmtTuNhap(n) { return { goc: n.goc.replace(/\s+$/, ''), link: n.link.trim(), cta: n.cta.split('\n').map((x) => x.trim()).filter(Boolean), bat: !!n.bat, loai: n.loai }; }
  function nhapThe() { if (!ui6.the) { const k = khoThe(); ui6.the = { video: k.video.join('\n'), manifest: k.manifest.join('\n'), sua: false }; } return ui6.the; }
  function tabComment() {
    const n = nhapCmt(); const c = cauHinhCmt(); const db = lay('cmt6_dongbo', 0);
    const soCau = n.cta.split('\n').map((x) => x.trim()).filter(Boolean).length;
    let h = `<div class="the-nd"><h4>💬 Comment mặc định <span class="mo">(Bài 3 · Video · Manifest)</span></h4>
      <textarea class="cmtta" rows="9" data-o="cmt_goc">${esc(n.goc)}</textarea>
      <div class="hang"><button class="nut nho" data-a="cmtgoc">↺ Về bản gốc</button><span class="mo">Bài 1 / Bài 2 vẫn lấy comment trong sheet (cột C / cột E)</span></div></div>`;
    h += `<div class="the-nd"><h4>📣 Lời kêu gọi vào nhóm Zalo <span class="chip ${n.bat ? 'ok' : 'xam'}">${n.bat ? 'đang BẬT' : 'đang TẮT'}</span></h4>
      <div class="hang"><label class="nut nho ${n.bat ? 'chinh' : ''}"><input type="checkbox" data-o="cmt_bat" ${n.bat ? 'checked' : ''}> Đăng thêm 1 comment CTA riêng</label></div>
      <div class="hang"><b>Link:</b><input type="text" class="cmtlink" data-o="cmt_link" value="${esc(n.link)}"></div>
      <div class="hang"><b>Áp cho:</b>${Object.keys(TEN_LOAI_CMT).map((k) => `<label class="cmtck"><input type="checkbox" data-o="cmt_loai" data-k="${k}" ${n.loai[k] ? 'checked' : ''}> ${TEN_LOAI_CMT[k]}</label>`).join('')}</div>
      <div class="mo" style="margin:6px 0 4px"><b>Câu CTA</b> — mỗi dòng 1 câu (${soCau} câu). Mỗi bài trong ngày tự lấy 1 câu khác nhau, hết câu thì quay vòng.</div>
      <textarea class="cmtta" rows="12" data-o="cmt_cta">${esc(n.cta)}</textarea>
      <div class="hang"><button class="nut nho" data-a="ctamd">↺ Dùng lại 12 câu mẫu</button></div></div>`;
    h += `<div class="the-nd cmtluu"><div class="hang"><button class="nut chinh${n.dangLuu ? ' chay' : ''}" data-a="luucmt" ${n.dangLuu ? 'disabled' : ''}>${n.dangLuu ? '<span class="xoay"></span>Đang lưu…' : '💾 Lưu (áp dụng cho bài kế tiếp)'}</button><button class="nut nho" data-a="xemcmt">🎲 Xem thử</button>${n.sua ? '<button class="nut nho" data-a="huycmt">Huỷ thay đổi</button><b style="color:var(--do-chu)">● Có thay đổi chưa lưu</b>' : ''}</div>
      <div class="mo">Bản đang dùng: lưu lúc ${c.luc ? gioStr(new Date(c.luc)) + ' ' + ngayStr(new Date(c.luc)).slice(0, 5).replace('-', '/') + (c.may ? ' (' + (c.may === MAY ? 'máy này' : c.may === 'GIAO' ? 'Máy Giao' : 'Máy Cao') + ')' : '') : '— chưa sửa lần nào (đang dùng mặc định)'} · ${db ? 'đã đồng bộ với sheet (ô ' + CAI_DAT.O_CMT + ') lúc ' + gioStr(new Date(db)) : 'chưa đồng bộ với sheet'}. Lưu ở máy nào thì máy kia nhận bản mới ở lần đọc sheet kế tiếp (hoặc bấm Đọc lại Lark sheet).</div></div>`;
    // ---- kho thẻ video / manifest ----
    const t = nhapThe(); const kt = khoThe(); const dbt = lay('the6_dongbo', 0);
    const dem = (x) => x.split('\n').map((y) => y.trim()).filter(Boolean).length;
    h += `<div class="the-nd"><h4>🏷 Kho thẻ <span class="mo">(Video · Manifest — mỗi bài tự bốc ${CAI_DAT.SO_THE} thẻ, các bài trong ngày lấy bộ khác nhau)</span></h4>
      <div class="cmt2cot"><div><div class="mo"><b>Thẻ cho Video</b> — mỗi dòng 1 thẻ (${dem(t.video)} thẻ)</div><textarea class="cmtta" rows="12" data-o="the_video">${esc(t.video)}</textarea><button class="nut nho" data-a="themd" data-k="video">↺ Dùng lại kho mẫu</button></div>
      <div><div class="mo"><b>Thẻ cho Manifest</b> — mỗi dòng 1 thẻ (${dem(t.manifest)} thẻ)</div><textarea class="cmtta" rows="12" data-o="the_manifest">${esc(t.manifest)}</textarea><button class="nut nho" data-a="themd" data-k="manifest">↺ Dùng lại kho mẫu</button></div></div>
      <div class="hang"><button class="nut chinh${t.dangLuu ? ' chay' : ''}" data-a="luuthe" ${t.dangLuu ? 'disabled' : ''}>${t.dangLuu ? '<span class="xoay"></span>Đang lưu…' : '💾 Lưu kho thẻ'}</button><button class="nut nho" data-a="xemthe">🎲 Xem thử thẻ hôm nay</button>${t.sua ? '<button class="nut nho" data-a="huythe">Huỷ thay đổi</button><b style="color:var(--do-chu)">● Có thay đổi chưa lưu</b>' : ''}</div>
      <div class="mo">Bản đang dùng: ${kt.luc ? 'lưu lúc ' + gioStr(new Date(kt.luc)) + ' ' + ngayStr(new Date(kt.luc)).slice(0, 5).replace('-', '/') : 'kho mẫu (chưa sửa)'} · ${dbt ? 'đã đồng bộ với sheet (ô ' + CAI_DAT.O_THE + ') lúc ' + gioStr(new Date(dbt)) : 'chưa đồng bộ với sheet'}. Thẻ nào Facebook không nhận thì script bỏ thẻ đó, gắn tiếp thẻ sau.</div>`;
    if (ui6.xemThe) { const kho = { video: t.video.split('\n').map((y) => y.trim()).filter(Boolean), manifest: t.manifest.split('\n').map((y) => y.trim()).filter(Boolean) }; h += `<div class="cmtxem">${LICH.filter((it) => it.loai === 'video' || it.loai === 'manifest').map((it) => `<div class="cmtmau"><b>${esc(it.ten)}</b><pre>${esc(chonThe(it.loai, it.so, homNay(), kho).map((x, i) => (i + 1) + '. ' + x).join('\n'))}</pre></div>`).join('')}</div><button class="phu-nut" data-a="dongxemthe">✕ Đóng xem thử</button>`; }
    h += '</div>';
    if (ui6.xemCmt) {
      const c2 = Object.assign(cauHinhCmt(), cmtTuNhap(n)); const ngay = homNay(); const d = duLieu(); const nd0 = d && d.ngay && d.ngay[ngay];
      const mau = (it) => { const goc = it.loai === 'b1' ? ((nd0 && nd0.bai && nd0.bai.cmt) || '(comment cột C trong sheet)') : it.loai === 'b2' ? ((nd0 && nd0.bai && nd0.bai.cmt2) || '(comment cột E trong sheet)') : c2.goc;
        if (!c2.bat || !c2.loai[it.loai] || !c2.cta.length) return goc;
        let seed = 0; for (const ch of ngay) seed = seed * 31 + ch.charCodeAt(0); const r = soNgau(seed); const thu = c2.cta.map((x, i) => [r(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
        return `${goc}\n\n——— comment riêng ———\n${c2.cta[thu[LICH.findIndex((x) => x.k === it.k) % thu.length]]}\n>>> ${c2.link}`; };
      h += `<div class="the-nd"><h4>🎲 Xem thử comment hôm nay <button class="phu-nut" data-a="dongxemcmt">✕ Đóng</button></h4><div class="cmtxem">${LICH.map((it) => `<div class="cmtmau"><b>${esc(it.ten)}</b><pre>${esc(mau(it))}</pre></div>`).join('')}</div></div>`;
    }
    return h;
  }
  function khungXemAnh() {
    const i = ui6.xem; const x = mf.ds[i]; if (i == null || !x || !x.url) return '';
    return `<div class="mfxem" data-a="dongxem"><div class="mfxk"><div class="mfxd"><b>Ảnh ${i + 1}/${mf.ds.length} · dán vào ô ${x.oKQ}</b>${x.tt === 'xong' ? '<span class="chip ok">✓ Đã dán</span>' : ''}<span style="flex:1"></span><button class="nut nho" data-a="dongxem">✕ Đóng</button></div>
      <div class="mfxa"><button class="nut" data-a="xemanh" data-i="${(i - 1 + mf.ds.length) % mf.ds.length}">‹</button><img src="${x.url}"><button class="nut" data-a="xemanh" data-i="${(i + 1) % mf.ds.length}">›</button></div>
      <div class="hang" style="justify-content:center">${x.blob && x.tt !== 'xong' ? `<button class="nut nho ${x.chon ? 'chinh' : ''}" data-a="chonanh" data-i="${i}">${x.chon ? '☑ Sẽ dán ảnh này' : '☐ Không dán ảnh này'}</button>` : ''}<button class="nut nho" data-a="taolai" data-i="${i}" ${mf.chay || mf.dan ? 'disabled' : ''}>${x.tt === 'dangtao' ? '<span class="xoay"></span>Đang tạo lại…' : '↻ Tạo lại (đổi ảnh nền)'}</button>${x.tl < 1 ? `<span class="mo">chữ dài nên thu nhỏ còn ${Math.round(x.tl * 100)}%</span>` : ''}</div></div></div>`;
  }

  // ---------------- tab Hệ thống / Nhật ký ----------------
  function tabHeThong() {
    const sk = lay('suc_khoe', {}) || {}; const g = chanLark(); const ld = lay('lark_dem', {}) || {}; const d = duLieu();
    const hien = document.visibilityState === 'visible';
    const o = (ten, ok, chu) => `<div>${ok === null ? '⚪' : ok ? '🟢' : '🔴'} <b>${ten}</b><br><span class="mo">${chu}</span></div>`;
    const k = GM_getValue('khoa_dang_bai_that', {}) || {};
    const tai = lay('tai6', null) || {};
    const trai = `<div class="cot">
      <div class="the-nd"><h4>${g || sk.larkOk === false ? '🔴' : '🟢'} Lark: ${esc(g ? g.msg : sk.larkOk === false ? (sk.larkLoi || 'lỗi') : 'hoạt động bình thường')}</h4><div class="mo">Sheet đọc lúc ${d ? ngayStr(new Date(d.luc)) + ' ' + gioStr(new Date(d.luc)) : 'chưa có'} · hôm nay đã gọi ${ld.ngay === homNay() ? ld.so || 0 : 0} lượt</div></div>
      <div class="the-nd"><h4>Kiểm tra hệ thống</h4><div class="skhoe">
      ${o('Tư cách Facebook', sk.tuCach ? !!sk.tuCachDung : null, sk.tuCach ? `${esc(sk.tuCach)} · ${gioStr(new Date(sk.tuCachLuc))}` : 'chưa kiểm')}
      ${o('Đúng trang', dungTrang(), dungTrang() ? CAI_DAT.TEN_NGAN : 'đang ở trang khác (đến giờ sẽ tự chuyển)')}
      ${o('Tab đang hiện', hien, hien ? 'tốt' : 'bị ẩn — đến giờ đăng sẽ không đăng được')}
      ${o('Tab làm việc', laTabChinh(), laTabChinh() ? (k.ghim ? 'tab này · ⭐ Main' : 'tab này <button class="phu-nut" data-a="dungtab">⭐ Đặt làm Main</button>') : 'một tab Facebook khác đang làm <button class="phu-nut" data-a="dungtab">Dùng tab này</button>')}
      ${o('Gửi tin Lark', sk.tinLuc ? !!sk.tinOk : null, sk.tinLuc ? `${sk.tinOk ? 'ổn' : esc(sk.tinLoi)} · ${gioStr(new Date(sk.tinLuc))}` : 'chưa gửi')}
      ${o('Đọc bài qua Facebook API', !coApi() ? false : sk.apiLuc ? !!sk.apiOk : null, (!coApi() ? 'chưa cài mã khoá' : sk.apiLuc ? `${sk.apiOk ? 'ổn' : esc(sk.apiLoi)} · ${gioStr(new Date(sk.apiLuc))}` : 'chưa đọc') + (coApi() && lay('fb_token_luc', 0) ? ` · mã dùng ${Math.floor((Date.now() - lay('fb_token_luc', 0)) / 864e5)}/${CAI_DAT.MA_KHOA_HAN_NGAY} ngày` : ''))}
      ${o('Nhạc nền manifest', !!nhacInfo(), nhacInfo() ? esc(nhacInfo().ten) : 'chưa có (tab Manifest)')}
      ${o('Tải sẵn đồ đăng', LA_GIAO ? !!tai.xongLuc : null, LA_GIAO ? (tai.xongLuc ? 'xong lúc ' + gioStr(new Date(tai.xongLuc)) : 'đang/chưa tải') : 'chỉ Máy Giao tải sẵn')}
      </div></div></div>`;
    const yc = (l) => ttYC(l).tt === 'run';
    const phai = `<div class="cot">
      <div class="the-nd"><h4>Máy này</h4><div class="hang"><button class="nut nho ${LA_GIAO ? 'chinh' : ''}" data-a="chonmay" data-may="GIAO">${LA_GIAO ? '● ' : ''}Máy Giao (chính)</button><button class="nut nho ${LA_CAO ? 'chinh' : ''}" data-a="chonmay" data-may="CAO">${LA_CAO ? '● ' : ''}Máy Cao (dự phòng)</button></div><div class="mo">Máy Giao đăng đúng giờ. Máy Cao chỉ đăng thay khi quá ${CAI_DAT.CAO_TRE_PHUT} phút mà trang vẫn chưa có bài (giữ chỗ ở ô ${CAI_DAT.O_KHOA} để 2 máy không đăng trùng).</div>
        <div class="hang"><button class="nut nho ${chayThu() ? 'vang' : ''}" data-a="chaythu" title="Bật: mọi bài đều chỉ soạn sẵn, dừng trước nút Đăng">${chayThu() ? '🧪 Chạy thử (mọi bài chỉ soạn): BẬT' : '🧪 Chạy thử (mọi bài chỉ soạn): TẮT'}</button>${dangHoan() ? '<button class="nut nho" data-a="bohoan">Bỏ hoãn</button>' : ''}</div></div>
      <div class="the-nd"><h4>Công cụ</h4><div style="display:flex;flex-wrap:wrap;gap:8px">
        <button class="nut nho${yc('tinthu') ? ' chay' : ''}" data-a="tinthu">${yc('tinthu') ? '<span class="xoay"></span>' : '✉ '}Gửi tin thử</button>
        <button class="nut nho${yc('taisan') ? ' chay' : ''}" data-a="taisan">${yc('taisan') ? '<span class="xoay"></span>' : '⬇ '}Tải sẵn đồ đăng</button>
        <button class="nut nho${coApi() ? '' : ' do'}" data-a="caima">🔑 ${coApi() ? 'Đổi mã khoá FB' : 'Cài mã khoá FB'}</button>
        ${coApi() ? '<button class="nut nho" data-a="kiemma">Kiểm tra mã khoá</button>' : ''}
        <button class="nut nho do" data-a="baoloi">📋 Báo lỗi</button></div>
        <div class="mo" style="margin-top:6px">${esc(kqYC('tinthu') || kqYC('taisan') || '')}</div></div>
      <div class="mo">Báo cáo cuối ngày → nhóm Marketing · lỗi khi đăng → nhóm Đăng bài fb · Bản ${PHIEN_BAN} · ${TEN_MAY}</div></div>`;
    return trai + phai + khungTuNang();
  }
  function tabNhatKy() {
    const loc = ui6.locNK;
    const laLoi = (m) => /lỗi|Lỗi|không (thấy|đọc|mở|được|tìm)|chưa (thấy|đọc|xác nhận)|⚠|❌|❓/.test(m);
    const ds = docNhatKy(7).filter((e) => (loc === 'qt' ? e.quanTrong : loc === 'loi' ? laLoi(e.msg) : true)).slice(-150).reverse().map(dongNK);
    const nutLoc = (k, ten) => `<button class="tg ${loc === k ? 'ok' : ''}" data-a="locnk" data-k="${k}">${ten}</button>`;
    return `<div style="display:flex;gap:6px;margin-bottom:6px">${nutLoc('tatca', 'Tất cả')}${nutLoc('quan', 'Quan trọng')}${nutLoc('loi', 'Lỗi')}<button class="tg" data-a="baoloi">📋 Báo lỗi</button></div><div class="mo" style="margin-bottom:6px">Mới nhất ở trên · giữ 7 ngày</div><div class="nk">${esc(ds.join('\n')) || '(không có dòng nào)'}</div>`;
  }

  // ---------------- vẽ toàn bộ khung ----------------
  function veBangNgay() {
    if (!document.body || vt.keo) return;
    if (ui6.nhan || Date.now() < (ui6.nhanDen || 0)) { veBang(); return; } // đang nhấn chuột trong khung → vẽ sau (tránh mất cú bấm)
    const Z = coChu();
    let css = document.getElementById('smhfb-css');
    if (!css) { css = document.createElement('style'); css.id = 'smhfb-css'; document.head.appendChild(css); }
    if (css.getAttribute('data-z') !== String(Z)) { css.textContent = taoCSS(Z) + CSS_THEM + CSS_MOI; css.setAttribute('data-z', String(Z)); }
    let el = document.getElementById('smhfb');
    if (!el) { el = document.createElement('div'); el.id = 'smhfb'; document.body.appendChild(el); }
    const dangGo = el.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !/^(checkbox|file|radio|button)$/.test(document.activeElement.type || '');
    const moRong = uiTab.moRong && !!MAY;
    const tabs = [['homnay', 'Hôm nay'], ['ngaymai', 'Ngày mai'], ['saptoi', 'Sắp tới'], ['homqua', 'Hôm qua'], ['manifest', 'Manifest'], ['comment', 'Comment & Thẻ'], ['lichsu', 'Lịch sử'], ['hethong', 'Hệ thống'], ['nhatky', 'Nhật ký'], ['khanh', 'Khanh TH']].filter(([k]) => !(k === 'khanh' && !LA_CAO));
    const tabLuu = lay('ui_tab6', 'homnay'); const tab = tabs.some(([k]) => k === tabLuu) ? tabLuu : 'homnay';
    const t = trangThaiChung(); const dsViec = MAY ? viecCanXuLy() : [];
    if (t.den === 'xanh' && dsViec.length) t.den = 'vang';
    el.className = `k-${t.den}${fbToi() ? ' toi' : ''}${moRong ? ' mo-rong' : ''}${dangBan ? ' tudong' : ''}${dangSap() ? ' sap' : (dangBan || hdHien() || lay('dang_do', null)) ? ' dang' : ''}`;
    const tn = MAY ? thieuNgay() : [];
    let html = `<div class="bar" data-keo="1"><div class="h1">
        <span class="den ${t.den}${t.nhay ? ' nhay' : ''}"></span>
        <span class="ten" title="Đăng bài fb kênh 1 · bản ${PHIEN_BAN}">${LA_GIAO ? 'GIAO' : LA_CAO ? 'CAO' : '?'}<small style="font-weight:600;opacity:.6;margin-left:4px">${PHIEN_BAN}</small></span>`;
    if (!MAY) html += `<span class="tt">${t.chu}</span><button class="cdang" data-a="chonmay" data-may="GIAO">Máy Giao (chính)</button><button class="cdang tat" data-a="chonmay" data-may="CAO">Máy Cao (dự phòng)</button>`;
    else html += `<button class="cdang ${tuDong() ? 'bat' : 'tat'}" data-a="tudong" title="Công tắc tự đăng của máy này (kiểm comment, báo cáo… vẫn chạy)">${tuDong() ? '⏻ ĐĂNG BÀI: BẬT' : '⏻ ĐĂNG BÀI: TẮT'}</button>
        ${dsViec.length ? `<button class="tg viec-pill" data-a="moviec" title="${esc(dsViec.map((v) => '• ' + v.chu).join('\n'))}">⚠ ${dsViec.length} việc</button>` : ''}
        <span class="tt">${t.chu}</span>
        <div class="h2 chips">${chips()}</div>
        <button class="nsheet${tn.length ? ' canh' : ''}" data-a="mosheet" title="${tn.length ? esc('Mở Lark sheet — còn thiếu:\n' + tn.map((x) => x.ngay + ': ' + x.t.map((y) => y.ten).join(', ')).join('\n')) : 'Mở Lark sheet'}">▦ Mở sheet${tn.length ? ` · ${tn.reduce((a, x) => a + x.t.length, 0)} thiếu` : ''}</button>`;
    if (MAY) html += nutTuNangBar();
    html += `<div class="act"><button class="icon lon" data-a="morong" title="${moRong ? 'Thu gọn' : 'Mở rộng'}">${moRong ? '▴' : '▾'}</button></div></div></div>`;
    html += thanhHoatDong();
    if (moRong && tab === 'manifest') html += khungXemAnh();
    if (moRong) {
      const huy = (n) => (n ? ` <span class="chip loi">${n}</span>` : '');
      const dem = { homnay: dsViec.length, saptoi: tn.filter((x) => x.i > 0).length, manifest: nhacInfo() ? 0 : '!' };
      const noiDung = tab === 'saptoi' ? tabSapToi() : tab === 'ngaymai' ? tabNgayMai() : tab === 'homqua' ? tabHomQua() : tab === 'manifest' ? tabManifest() : tab === 'comment' ? tabComment() : tab === 'lichsu' ? tabLichSu() : tab === 'hethong' ? tabHeThong() : tab === 'nhatky' ? tabNhatKy() : tab === 'khanh' ? tabKhanh() : tabHomNay();
      html += `<div class="tabs">${tabs.map(([k, ten]) => `<button class="tab ${tab === k ? 'chon' : ''}" data-tab="${k}">${ten}${huy(dem[k])}</button>`).join('')}</div>
        <div class="nd${tab === 'hethong' ? ' cot2' : ''}">${noiDung}</div>
        <div class="foot"><div class="chan"><button class="nut ${tamDung() ? 'vang' : ''}" data-a="tamdung">${tamDung() ? '▶ Chạy lại' : '⏸ Tạm dừng'}</button></div>
        <div class="chan vua"><button class="nut nho chinh" data-a="xemmanifest">🖼 Tạo ảnh manifest</button><button class="nut nho" data-a="xemmanifest">🎵 Nhạc nền</button><button class="nut nho" data-a="docsheet">📥 Đọc lại sheet</button></div>
        <div class="chan2"><span class="co">Cỡ chữ <button class="phu-nut" data-a="chunho">A−</button><b>${Math.round(Z * 100)}%</b><button class="phu-nut" data-a="chuto">A+</button></span></div></div>`;
    }
    if (dangGo && el.querySelector('.nd')) { const b = el.querySelector('.bar'); const tmp = document.createElement('div'); tmp.innerHTML = html; const b2 = tmp.querySelector('.bar'); if (b && b2 && b.innerHTML !== b2.innerHTML) b.innerHTML = b2.innerHTML; capNhatDongHo(); return; }
    if (html !== ui6.htmlCu) { const cuon = el.querySelector('.nd') ? el.querySelector('.nd').scrollTop : 0; el.innerHTML = html; ui6.htmlCu = html; if (el.querySelector('.nd')) el.querySelector('.nd').scrollTop = cuon; }
    datViTri(el, uiTab.viTri || viTriMacDinh());
    try { el.classList.remove('gon1'); const c = el.querySelector('.bar .h2.chips'); if (c && c.scrollWidth > c.clientWidth + 1) el.classList.add('gon1'); } catch (e) { /* */ }
    capNhatDongHo();
  }
  // cập nhật đồng hồ mỗi giây tại chỗ (không vẽ lại cả khung → bấm nút không bị mất)
  function capNhatDongHo() {
    const el = document.getElementById('smhfb'); if (!el) return;
    el.querySelectorAll('[data-hen]').forEach((x) => { x.textContent = conLai(+x.getAttribute('data-hen') - Date.now()); });
    el.querySelectorAll('[data-hdbd]').forEach((x) => { const tg = Date.now() - +x.getAttribute('data-hdbd'); const uoc = +x.getAttribute('data-uoc') || 0; x.innerHTML = '⏱ ' + dongHo(tg) + (uoc ? `<small>${tg > uoc * 1.5 ? 'lâu hơn dự kiến (~' + dongHo(uoc) + ')' : 'dự kiến ~' + dongHo(uoc)}</small>` : ''); const tien = x.parentElement && x.parentElement.querySelector('[data-tien]'); if (tien && uoc) tien.style.width = Math.min(96, Math.round((tg / uoc) * 100)) + '%'; });
    veNhacNho(); try { veSoanW(); } catch (e) { /* */ }
    if (demNguoc) {
      const con = Math.max(0, Math.ceil((demNguoc.den - Date.now()) / 1000));
      const so = el.querySelector('[data-demso]'); if (so && !demNguoc.dung) so.textContent = con;
      const ch = el.querySelector('[data-demchu]'); if (ch) ch.textContent = con;
      if (!el.querySelector('.hdg.dem')) veBang();
      if (!document.title.startsWith('⏳')) gocTitle = document.title;
      document.title = (Math.floor(Date.now() / 600) % 2 ? '⏳ ' + (demNguoc.dung ? 'tạm dừng' : con + 's') + ' · ' : '⏳ ⚠ ') + 'Sắp ' + demNguoc.ten;
    } else { if (/^⏳/.test(document.title)) document.title = gocTitle; if (el.querySelector('.hdg.dem')) veBang(); }
  }
  const veDemNguoc = () => capNhatDongHo();
  const veHoatDong = () => veBang();

  // ---------------- kéo thả · tự thu gọn (như bản 5.9) ----------------
  document.addEventListener('mousedown', (ev) => {
    if (ev.target.closest && ev.target.closest('#smhfb')) { ui6.nhan = true; uiTab.moLuc = Date.now(); }
    const bar = ev.target.closest && ev.target.closest('#smhfb [data-keo]');
    if (!bar || ev.target.closest('button,a,input,label') || ev.button !== 0) return;
    const el = document.getElementById('smhfb'); const r = el.getBoundingClientRect();
    vt.keo = { dx: ev.clientX - (parseInt(el.dataset.bx, 10) || r.left), dy: ev.clientY - r.top }; el.classList.add('keo'); ev.preventDefault();
  }, true);
  document.addEventListener('mousemove', (ev) => { if (!vt.keo) return; datViTri(document.getElementById('smhfb'), { x: ev.clientX - vt.keo.dx, y: ev.clientY - vt.keo.dy }); }, true);
  document.addEventListener('mouseup', () => {
    if (ui6.nhan) { ui6.nhan = false; ui6.nhanDen = Date.now() + 300; }
    if (!vt.keo) return;
    const el = document.getElementById('smhfb'); el.classList.remove('keo');
    uiTab.viTri = { x: parseInt(el.dataset.bx, 10) || 0, y: parseInt(el.style.top, 10) };
    vt.keo = null; veBang();
  }, true);
  document.addEventListener('dblclick', (ev) => { if (!(ev.target.closest && ev.target.closest('#smhfb [data-keo]')) || ev.target.closest('button,a')) return; uiTab.viTri = null; veBang(); }, true);
  ['mousemove', 'keydown', 'wheel', 'touchstart', 'click'].forEach((e) => document.addEventListener(e, (ev) => { if (ev.target && ev.target.closest && ev.target.closest('#smhfb')) uiTab.moLuc = Date.now(); }, true));
  // ---------------- thẻ tiến trình soạn/đăng bài (giống thẻ "Gắn vị trí & thẻ"): hiện dưới màn hình từng bước đang làm ----------------
  let soanTT = null;
  const BUOC_BAI = ['Mở hộp soạn', 'Điền chữ', 'Nền đỏ / ảnh', 'Vị trí', 'Tiếp', 'Chọn nhóm', 'Xác nhận', 'Đăng'];
  const BUOC_VIDEO = ['Điền chữ', 'Gắn video', 'Vị trí', 'Thẻ', 'Nhóm', 'Hình thu nhỏ', 'Đăng'];
  const MAP_B = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 5, 8: 6, 9: 7 }, MAP_V = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 6 };
  function theoDoiSoan(msg) {
    const bd = msg.match(/^Bắt đầu (soạn|đăng) (.+?)(?: \(|$)/);
    if (bd) { soanTT = { ten: bd[2], soan: bd[1] === 'soạn', loai: '', buoc: -1, tt: 'chay', chi: 'Đang chuẩn bị (tải ảnh/video, kiểm tư cách)…', luc: Date.now(), bd: Date.now() }; return; }
    if (!soanTT) return;
    const m = msg.match(/^(?:[^:]{1,40}: )?([BV])(\d)\. (.*)$/);
    if (m) { soanTT.loai = m[1]; soanTT.buoc = (m[1] === 'B' ? MAP_B : MAP_V)[+m[2]] || 0; soanTT.chi = m[3]; soanTT.luc = Date.now(); if (/chưa ăn|chưa khớp|chưa mở được|chưa đủ|lỗi/i.test(m[3])) soanTT.thu = m[3]; else soanTT.thu = ''; return; }
    if (/Soạn thử xong|đã soạn xong, dừng/.test(msg)) { soanTT.tt = 'cho'; soanTT.buoc = (soanTT.loai === 'V' ? BUOC_VIDEO : BUOC_BAI).length - 1; soanTT.chi = 'Đã dừng trước nút Đăng — bạn kiểm tra rồi tự bấm Đăng (hoặc đóng hộp để huỷ)'; soanTT.luc = Date.now(); return; }
    if (/^Đã đăng /.test(msg) || /^Thấy .* đã được bấm Đăng/.test(msg)) { soanTT.tt = 'xong'; soanTT.buoc = 99; soanTT.chi = msg; soanTT.luc = Date.now(); return; }
    if (/^(Lỗi khi đăng|Hoãn đăng|Soạn thử .* lỗi|Chưa đăng được)/.test(msg)) { soanTT.tt = 'loi'; soanTT.chi = msg; soanTT.luc = Date.now(); return; }
    if (/Bỏ bản soạn dở|hộp soạn không còn|hộp soạn đã đóng|đã có trên trang/.test(msg)) { soanTT = null; }
  }
  function veSoanW() {
    let w = document.getElementById('smhfb-soan-w');
    const s = soanTT; const het = s && (s.tt === 'xong' || s.tt === 'loi') && Date.now() - s.luc > 90000;
    const hien = s && !het && (s.tt !== 'cho' || lay('cho_tay6', null)) && !(s.tt === 'chay' && !dangBan && Date.now() - s.luc > 120000);
    if (!hien) { if (w) w.style.display = 'none'; return; }
    if (!w) { w = document.createElement('div'); w.id = 'smhfb-soan-w'; document.body.appendChild(w); }
    const ds = s.loai === 'V' ? BUOC_VIDEO : BUOC_BAI;
    const chips = ds.map((t, i) => { const lop = s.tt === 'xong' || i < s.buoc ? 'xong' : i === s.buoc ? (s.tt === 'loi' ? 'loi' : s.tt === 'cho' ? 'cho' : 'chay') : ''; return `<span class="gc ${lop}"><span class="ic">${lop === 'xong' ? '✓' : lop === 'loi' ? '!' : lop === 'cho' ? '⏸' : i + 1}</span>${t}</span>`; }).join('');
    const tieu = s.tt === 'xong' ? `✅ ${esc(s.ten)} đã đăng xong` : s.tt === 'loi' ? `⚠ ${esc(s.ten)}: chưa xong` : s.tt === 'cho' ? `⏸ ${esc(s.ten)} đã soạn xong — chờ bạn bấm Đăng` : `${s.soan ? '✎ Đang soạn' : '▶ Đang đăng'} ${esc(s.ten)}`;
    const html = `<div class="gh"><b>${tieu}</b><span class="gt">⏱ ${dongHo(Date.now() - s.bd)}</span></div><div class="gb">${chips}</div><div class="gd">${esc(s.thu || s.chi || '')}</div>`;
    if (w.innerHTML !== html) w.innerHTML = html;
    w.className = s.tt; w.style.display = 'flex';
  }
  // mở rộng / thu gọn có chuyển động mượt (kiểu Apple: ease-out nhanh đầu, chậm cuối)
  function datMoRong(mo, lyDo) { // (6.9) bỏ chuyển động: đóng/mở ngay
    uiTab.moRong = mo; uiTab.moLuc = mo ? Date.now() : 0; veBangNgay(); if (!mo && lyDo) nhacNho(lyDo);
  }
  const dangChoNut = () => mf.chay || mf.dan || ui6.xem != null || !!(ui6.cmt && (ui6.cmt.sua || ui6.cmt.dangLuu)) || !!(ui6.the && (ui6.the.sua || ui6.the.dangLuu)) || ['docsheet', 'kiem1', 'kiem3', 'kiem24', 'dotrang', 'tinthu', 'taisan', 'khanhthu'].some((l) => ttYC(l).tt === 'run');
  setInterval(() => { // mở rộng xong 60 giây không đụng tới thì tự thu gọn (không thu khi đang chờ kết quả nút vừa bấm)
    if (!uiTab.moRong) { uiTab.moLuc = 0; return; }
    const el = document.getElementById('smhfb'); if (!el) return;
    if (!uiTab.moLuc || vt.keo || (el.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) || dangChoNut()) { uiTab.moLuc = Date.now(); return; }
    if (Date.now() - uiTab.moLuc > 60000) datMoRong(false);
  }, 1000);
  setInterval(() => { // script bắt đầu soạn/đăng bài trên trang → tự thu gọn popup để không che hộp soạn (bạn vẫn mở lại được)
    const ban = dangBan || !!lay('dang_do', null);
    if (!ban) { uiTab.daThuVi = false; return; }
    if (uiTab.moRong && !uiTab.daThuVi && !vt.keo) { uiTab.daThuVi = true; datMoRong(false, 'Script đang làm việc trên trang → popup tự thu gọn (bấm ▾ để mở lại)'); }
  }, 500);
  window.addEventListener('resize', () => { const el = document.getElementById('smhfb'); if (el) datViTri(el, uiTab.viTri || viTriMacDinh()); });

  // ---------------- các nút ----------------
  // bấm xong là có phản hồi ngay: nút quay vòng "đang làm" → thanh "Xong: …" khi làm xong
  function phanHoi(a) { try { if (a.classList.contains('chay')) return; a.classList.add('chay'); a.insertAdjacentHTML('afterbegin', '<span class="xoay"></span>'); } catch (e) { /* */ } }
  document.addEventListener('change', async (e) => {
    const a = e.target.closest && e.target.closest('#smhfb') && e.target.getAttribute('data-a'); if (!a) return;
    if (a === 'chonnen') { anhNenTam = Array.from(e.target.files || []).filter((f) => /^image\//.test(f.type)); ghi(`Đã chọn ${anhNenTam.length} ảnh nền cho manifest`); veBang(); }
    if (a === 'themfont') { const f = (e.target.files || [])[0]; e.target.value = ''; if (!f) return; try { const ten = await themFont(f); luu('hd_ket', { key: 'font', ten: 'Đang thêm font', chu: `Đã thêm font "${ten}" — chọn nó ở ô Tiêu đề / Thân bài / Lời kêu gọi`, luc: Date.now(), tg: 0, mau: 'ok' }); } catch (er) { alert('Chưa thêm được font: ' + er.message); } veBangNgay(); return; }
    if (a === 'chonnhac') { const f = (e.target.files || [])[0]; if (!f) return; try { await luuNhac(f, f.name, 'tay'); luu('hd_ket', { key: 'nhac', ten: 'Đang lưu nhạc nền', chu: f.name, luc: Date.now(), tg: 0, mau: 'ok' }); } catch (er) { alert('Chưa lưu được nhạc: ' + er.message); } veBang(); }
  }, true);
  document.addEventListener('change', (e) => { if (!(e.target.closest && e.target.closest('#smhfb'))) return; const o = e.target.getAttribute('data-o') || ''; const m = o.match(/^font_(td|than|cmt)$/); if (!m) return; datFont(m[1], e.target.value); ghi(`Chọn font ${({ td: 'tiêu đề', than: 'thân bài', cmt: 'lời kêu gọi' })[m[1]]}: ${e.target.value}`); e.target.blur(); veBangNgay(); }, true);
  document.addEventListener('input', (e) => { if (!(e.target.closest && e.target.closest('#smhfb'))) return; const o = e.target.getAttribute('data-o') || ''; if (o === 'the_video' || o === 'the_manifest') { const t = nhapThe(); t[o.slice(4)] = e.target.value; t.sua = true; return; }
    if (/^cmt_/.test(o)) { const n = nhapCmt(); if (o === 'cmt_goc') n.goc = e.target.value; if (o === 'cmt_link') n.link = e.target.value; if (o === 'cmt_cta') n.cta = e.target.value; if (o === 'cmt_bat') n.bat = e.target.checked; if (o === 'cmt_loai') n.loai[e.target.getAttribute('data-k')] = e.target.checked; n.sua = true; if (e.target.type === 'checkbox') veBangNgay(); return; } if (o === 'vung') luu('mf_vung6', e.target.value.trim()); if (o === 'onhac') luu('o_nhac6', e.target.value.trim().toUpperCase()); }, true);
  document.addEventListener('click', async (ev) => {
    const tabBtn = ev.target.closest && ev.target.closest('#smhfb [data-tab]');
    if (tabBtn) { luu('ui_tab6', tabBtn.getAttribute('data-tab')); uiTab.moLuc = Date.now(); veBangNgay(); return; }
    const a = ev.target.closest && ev.target.closest('#smhfb [data-a]'); if (!a || a.tagName === 'INPUT') return;
    const hd = a.getAttribute('data-a'); const k = a.getAttribute('data-k'); ui6.nhanDen = 0; bamNutLuc = Date.now();
    try { const ae = document.activeElement; if (ae && ae !== a && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && ae.closest('#smhfb')) ae.blur(); } catch (e) { /* */ } // bấm nút → bỏ con trỏ khỏi ô chữ để popup vẽ lại ngay
    const NHO = { morong: () => (uiTab.moRong ? 'Đã thu gọn' : 'Đã mở rộng'), chon: () => 'Xem chi tiết ' + tenSlot(k), moviec: 'Mở danh sách việc cần xử lý', xemsaptoi: 'Mở tab Sắp tới', xemmanifest: 'Mở tab Manifest', mobai: 'Đang mở bài ở tab mới…', mosheet: 'Đang mở Lark sheet ở tab mới…', mosheetvideo: 'Đang mở Lark sheet Video/Manifest ở tab mới…', locnk: 'Đã lọc nhật ký', donghd: 'Đã ẩn thông báo', bohoan: 'Đã bỏ hoãn — script làm tiếp theo lịch', xemanh: 'Xem ảnh lớn — bấm ‹ › để xem ảnh khác', dongxem: 'Đã đóng ảnh',  chuto: 'Chữ to hơn', chunho: 'Chữ nhỏ hơn', caima: 'Mở hộp cài mã khoá', kiemma: 'Đang kiểm tra mã khoá…', baoloi: 'Đang tạo file báo lỗi…' };
    if (NHO[hd]) nhacNho(typeof NHO[hd] === 'function' ? NHO[hd]() : NHO[hd]);
    if (a.tagName === 'A') ev.preventDefault();
    if (hd === 'morong') { datMoRong(!uiTab.moRong); return; }
    if (hd === 'chon') { uiTab.chon = k; uiTab.moRong = true; uiTab.moLuc = Date.now(); luu('ui_tab6', 'homnay'); veBangNgay(); return; }
    if (hd === 'moviec') { uiTab.moRong = true; uiTab.moLuc = Date.now(); luu('ui_tab6', 'homnay'); veBangNgay(); return; }
    if (hd === 'xemsaptoi' || hd === 'xemmanifest') { uiTab.moRong = true; uiTab.moLuc = Date.now(); luu('ui_tab6', hd === 'xemsaptoi' ? 'saptoi' : 'manifest'); veBangNgay(); return; }
    if (hd === 'mobai') { window.open(a.getAttribute('data-link'), '_blank', 'noopener'); return; }
    if (hd === 'mosheet') { window.open(CAI_DAT.LINK_SHEET, '_blank', 'noopener'); return; }
    if (hd === 'mosheetvideo') { window.open(CAI_DAT.LINK_SHEET_VIDEO, '_blank', 'noopener'); return; }
    if (hd === 'locnk') { ui6.locNK = k; veBangNgay(); return; }
    if (hd === 'donghd') { const x = lay('hd_ket', null); if (x) { x.dong = true; luu('hd_ket', x); } veBangNgay(); return; }
    if (hd === 'chonmay') { const m = a.getAttribute('data-may'); if (m === MAY) return; if (!confirm(`Đặt máy này là ${m === 'GIAO' ? 'MÁY GIAO (máy chính, đăng đúng giờ)' : 'MÁY CAO (máy dự phòng, chỉ đăng thay khi Máy Giao trễ)'}?\n\nTrang sẽ tải lại.`)) return; luu('may6', m); ghi('Đặt máy này là ' + (m === 'GIAO' ? 'Máy Giao' : 'Máy Cao')); roiTrang(); return; }
    if (hd === 'lamngay') { luu('lam_ngay6', Date.now()); luu('cho_nguoi', null); nhacNho('Script sẽ làm ngay (đếm ngược 10 giây)', 'cho'); setTimeout(nhip, 300); veBangNgay(); return; }
    if (hd === 'dndung') { if (demNguoc) { demNguoc.dung = true; demNguoc.dungLuc = Date.now(); ghi('Nhân sự bấm Tạm dừng đếm ngược'); } veBangNgay(); return; }
    if (hd === 'dntiep') { if (demNguoc) { demNguoc.dung = false; demNguoc.den = Date.now() + 3000; ghi('Nhân sự bấm Tiếp tục'); } veBangNgay(); return; }
    if (hd === 'dnhoan') { luu('hoan6', Date.now() + 10 * 60000); if (demNguoc) demNguoc.hoan = true; ghi('Nhân sự bấm Hoãn 10 phút'); veBangNgay(); return; }
    if (hd === 'bohoan') { luu('hoan6', 0); veBangNgay(); return; }
    if (hd === 'lammoi') { phanHoi(a); yeuCau('dotrang'); return; }
    if (['docsheet', 'kiem1', 'kiem3', 'kiem24', 'tinthu', 'taisan', 'khanhthu'].includes(hd)) { phanHoi(a); yeuCau(hd); return; }
    if (hd === 'kiemlai' && k) { capNhatTT((s) => { const x = ttSlot(s, k); x.kiem = (x.kiem || []).slice(0, CAI_DAT.KIEM_CMT_TOI_DA - 1); x.cmtOk = false; }); luu('hang_bu6', (lay('hang_bu6', []) || []).concat([{ key: k }])); ghi('Bấm Kiểm lại comment: ' + tenSlot(k)); phanHoi(a); setTimeout(nhip, 300); return; }
    if (hd === 'tamdung') { const v = !tamDung(); luu('tam_dung', v); if (v) luu('dung_moc', Math.max(Date.now(), lay('dung_moc', 0) + 1)); ghi(v ? 'Bấm Tạm dừng — script ngừng mọi việc trên máy này' : 'Bấm Chạy lại'); veBangNgay(); if (!v) setTimeout(nhip, 300); return; }
    if (hd === 'tudong') { const moi = !tuDong(); if (moi && !confirm('Bật tự đăng trên máy này?')) return; luu('tu_dong6', moi); ghi('Tự đăng: ' + (moi ? 'BẬT' : 'TẮT')); veBangNgay(); if (moi) setTimeout(nhip, 300); return; }
    if (hd === 'chaythu') { luu('chay_thu6', !chayThu()); ghi('Chạy thử: ' + (chayThu() ? 'BẬT (mọi bài chỉ soạn sẵn, dừng trước nút Đăng)' : 'TẮT')); veBangNgay(); return; }
    if (hd === 'chonmai') { uiTab.chonMai = k; veBangNgay(); return; }
    if (hd === 'soan' && k && a.getAttribute('data-ngay') && a.getAttribute('data-ngay') !== homNay()) {
      const nm = a.getAttribute('data-ngay');
      if (!boSoanDo()) return;
      if (!confirm(`Soạn thử ${tenSlot(k)} của NGÀY MAI ngay bây giờ?\n\nScript làm hết mọi bước (chữ, ảnh/video, vị trí, thẻ, nhóm…) rồi DỪNG trước nút Đăng.\nBạn xem kỹ rồi bấm Huỷ / đóng hộp.\n\n⚠ Nếu bạn bấm Đăng thì bài lên trang NGAY HÔM NAY (ngày mai sẽ không đăng lại).`)) return;
      if (tamDung()) luu('tam_dung', false);
      capNhatTT((s) => { const x = ttSlot(s, k); x.ep = Date.now(); x.soan = true; }, nm);
      if (!laTabChinh()) { const kh = GM_getValue('khoa_dang_bai_that', null); if (!(kh && kh.ban)) GM_setValue('khoa_dang_bai_that', { id: MA_TAB, ts: Date.now(), hien: document.visibilityState === 'visible', anTu: 0, ban: false, v: PHIEN_BAN }); }
      ghi(`Bấm Soạn thử bài ngày mai: ${tenSlot(k)}`); phanHoi(a); setTimeout(nhip, 300); return;
    }
    if (hd === 'bodanhdau' && k && a.getAttribute('data-ngay')) { capNhatTT((s) => { const x = ttSlot(s, k); x.tt = 'cho'; x.may = ''; x.luc = 0; x.cmtOk = false; x.lyDo = ''; }, a.getAttribute('data-ngay')); ghi('Bỏ đánh dấu (ngày mai): ' + tenSlot(k)); veBangNgay(); return; }
    if ((hd === 'dangngay' || hd === 'soan') && k) {
      const soan = hd === 'soan';
      if (!boSoanDo()) return;
      if (!confirm(soan ? `Soạn sẵn ${tenSlot(k)} ngay bây giờ?\n\nScript làm hết mọi bước (chữ, ảnh/video, vị trí, thẻ, nhóm, hình thu nhỏ…) rồi DỪNG trước nút Đăng.\nBạn kiểm tra rồi tự bấm Đăng — script sẽ tự comment tiếp.` : `Đăng ${tenSlot(k)} ngay bây giờ (không chờ giờ hẹn)?`)) return;
      if (tamDung()) luu('tam_dung', false);
      capNhatTT((s) => { const x = ttSlot(s, k); x.ep = Date.now(); x.soan = soan; x.thuLai = 0; x.choDen = 0; if (KET.includes(x.tt) && !XONG.includes(x.tt)) { x.tt = 'cho'; x.lan = 0; x.lyDo = ''; } });
      if (!laTabChinh()) { const kh = GM_getValue('khoa_dang_bai_that', null); if (!(kh && kh.ban)) GM_setValue('khoa_dang_bai_that', { id: MA_TAB, ts: Date.now(), hien: document.visibilityState === 'visible', anTu: 0, ban: false, v: PHIEN_BAN }); }
      ghi(`Bấm ${soan ? 'Soạn' : 'Đăng ngay'}: ${tenSlot(k)}`); phanHoi(a); setTimeout(nhip, 300); return;
    }
    if (hd === 'boqua' && k) { if (!confirm(`Bỏ qua ${tenSlot(k)} hôm nay?`)) return; capNhatTT((s) => { Object.assign(ttSlot(s, k), { tt: 'bo', lyDo: 'bấm Bỏ qua trên popup' }); }); ghi('Bấm Bỏ qua: ' + tenSlot(k)); veBangNgay(); return; }
    if (hd === 'khoiphuc' && k) { capNhatTT((s) => { const x = ttSlot(s, k); x.tt = 'cho'; x.lan = 0; x.loi = ''; x.lyDo = ''; x.thuLai = 0; }); ghi('Bấm Đưa lại vào hàng chờ: ' + tenSlot(k)); veBangNgay(); return; }
    if (hd === 'danhdau' && k) { if (!confirm(`Đánh dấu ${tenSlot(k)} hôm nay ĐÃ ĐĂNG?\n(Dùng khi bài đã lên trang mà script không nhận ra)`)) return; capNhatTT((s) => { Object.assign(ttSlot(s, k), { tt: 'xong', luc: Date.now(), may: 'tay', lyDo: '', cmtOk: true }); }); ghi('Bấm Đánh dấu đã đăng: ' + tenSlot(k)); veBangNgay(); return; }
    if (hd === 'bodanhdau' && k) { capNhatTT((s) => { const x = ttSlot(s, k); x.tt = 'cho'; x.may = ''; x.luc = 0; x.cmtOk = false; }); ghi('Bỏ đánh dấu: ' + tenSlot(k)); veBangNgay(); return; }
    if (hd === 'taoanh') { const vung = lay('mf_vung6', 'G220:G223'); if (!anhNenTam.length) { ui6.canhNen = true; veBangNgay(); alert('Bạn chưa chọn ảnh nền.\n\nBấm "📂 Chọn ảnh nền…" ở bước 1, chọn 1 hoặc nhiều ảnh, rồi bấm Tạo ảnh lại.'); return; } try { docVungMF(vung); } catch (er) { alert(er.message); return; } phanHoi(a); ghi(`Bấm Tạo ảnh manifest (${vung})`); theoDoi('taoanh', async () => { const bd = Date.now(); try { const kq = await taoAnhXemTruoc(vung); luu('hd_ket', { key: 'taoanh', ten: 'Đang tạo ảnh manifest', chu: kq + ' — bấm từng ảnh để xem, rồi bấm Dán vào sheet', luc: Date.now(), tg: Date.now() - bd, mau: 'ok' }); } catch (er) { ghi('Tạo ảnh manifest chưa được: ' + er.message); luu('hd_ket', { key: 'taoanh', ten: 'Đang tạo ảnh manifest', chu: 'Lỗi: ' + er.message, luc: Date.now(), tg: Date.now() - bd, mau: 'vang' }); } veBang(); }, 'Đang tạo ảnh manifest'); return; }
    if (hd === 'themd') { const t = nhapThe(); t[k] = (k === 'manifest' ? CAI_DAT.THE_MANIFEST : CAI_DAT.THE_VIDEO).join('\n'); t.sua = true; nhacNho('Đã điền lại kho thẻ mẫu cho ' + (k === 'manifest' ? 'Manifest' : 'Video') + ' — bấm Lưu kho thẻ để áp dụng'); veBangNgay(); return; }
    if (hd === 'huythe') { ui6.the = null; nhacNho('Đã huỷ thay đổi kho thẻ'); veBangNgay(); return; }
    if (hd === 'xemthe') { ui6.xemThe = true; nhacNho('Xem thử 8 thẻ mỗi video / manifest hôm nay (chưa lưu)'); veBangNgay(); return; }
    if (hd === 'dongxemthe') { ui6.xemThe = false; veBangNgay(); return; }
    if (hd === 'luuthe') {
      const t = nhapThe(); const c = { video: t.video.split('\n').map((y) => y.trim()).filter(Boolean), manifest: t.manifest.split('\n').map((y) => y.trim()).filter(Boolean) };
      if (!c.video.length || !c.manifest.length) { alert('Mỗi kho cần ít nhất 1 thẻ (mỗi dòng 1 thẻ).'); return; }
      t.dangLuu = true; phanHoi(a); veBangNgay();
      try { await luuKhoThe(c); ui6.the = null; nhacNho(`Đã lưu kho thẻ (video ${c.video.length}, manifest ${c.manifest.length}) và đồng bộ lên sheet — áp dụng từ bài kế tiếp`); }
      catch (er) { ui6.the = null; nhacNho('Đã lưu trên máy này, nhưng chưa lưu được lên sheet (' + er.message + ')', 'vang', 8000); }
      veBangNgay(); return;
    }
    if (hd === 'cmtgoc') { const n = nhapCmt(); n.goc = CAI_DAT.CMT_BAI3; n.sua = true; nhacNho('Đã đưa comment mặc định về bản gốc — bấm Lưu để áp dụng'); veBangNgay(); return; }
    if (hd === 'ctamd') { const n = nhapCmt(); n.cta = CAI_DAT.CTA_MAC_DINH.join('\n'); n.sua = true; nhacNho('Đã điền lại 12 câu CTA mẫu — bấm Lưu để áp dụng'); veBangNgay(); return; }
    if (hd === 'huycmt') { ui6.cmt = null; nhacNho('Đã huỷ thay đổi, quay về bản đang dùng'); veBangNgay(); return; }
    if (hd === 'xemcmt') { ui6.xemCmt = true; nhacNho('Xem thử comment của 9 bài hôm nay (chưa lưu)'); veBangNgay(); return; }
    if (hd === 'dongxemcmt') { ui6.xemCmt = false; veBangNgay(); return; }
    if (hd === 'luucmt') {
      const n = nhapCmt(); const c = cmtTuNhap(n);
      if (!c.goc.trim()) { alert('Comment mặc định đang trống — điền nội dung rồi Lưu lại.'); return; }
      if (c.bat && !/^https?:\/\//i.test(c.link)) { alert('Link nhóm Zalo chưa đúng (phải bắt đầu bằng https://).'); return; }
      if (c.bat && !c.cta.length) { alert('Chưa có câu CTA nào — mỗi dòng 1 câu.'); return; }
      n.dangLuu = true; phanHoi(a); veBangNgay();
      try { await luuCauHinhCmt(c); ui6.cmt = null; nhacNho(`Đã lưu comment (${c.cta.length} câu CTA) và đồng bộ lên sheet — áp dụng từ bài kế tiếp`); }
      catch (er) { ui6.cmt = null; nhacNho('Đã lưu trên máy này, nhưng chưa lưu được lên sheet (' + er.message + ') — máy kia chưa nhận bản mới', 'vang', 8000); }
      veBangNgay(); return;
    }
    if (hd === 'xoafont') { const ten = a.getAttribute('data-ten'); if (!confirm(`Xoá font "${ten}" khỏi máy này?`)) return; xoaFont(ten); veBangNgay(); return; }
    if (hd === 'velaifont') { phanHoi(a); theoDoi('taoanh', async () => { const bd = Date.now(); try { const kq = await veLaiFont(); luu('hd_ket', { key: 'taoanh', ten: 'Đang vẽ lại ảnh với font mới', chu: kq, luc: Date.now(), tg: Date.now() - bd, mau: 'ok' }); } catch (er) { luu('hd_ket', { key: 'taoanh', ten: 'Đang vẽ lại ảnh với font mới', chu: 'Lỗi: ' + er.message, luc: Date.now(), tg: Date.now() - bd, mau: 'vang' }); } veBang(); }, 'Đang vẽ lại ảnh với font mới'); return; }
    if (hd === 'xemanh') { ui6.xem = +a.getAttribute('data-i'); veBangNgay(); return; }
    if (hd === 'dongxem') { if (ev.target.closest('.mfxk') && a.classList.contains('mfxem')) return; ui6.xem = null; veBangNgay(); return; }
    if (hd === 'chonanh') { const x = mf.ds[+a.getAttribute('data-i')]; if (x) { x.chon = !x.chon; nhacNho(x.chon ? `Sẽ dán ảnh ô ${x.oKQ}` : `Không dán ảnh ô ${x.oKQ}`); } veBangNgay(); return; }
    if (hd === 'taolai') { phanHoi(a); theoDoi('taoanh', () => taoLaiAnh(+a.getAttribute('data-i')), 'Đang tạo lại ảnh manifest'); veBangNgay(); return; }
    if (hd === 'dananh') { const n = mf.ds.filter((x) => x.chon && x.blob && x.tt !== 'xong').length; if (!n) return; if (!confirm(`Dán ${n} ảnh vào sheet (tab "Kênh 1 Vòng Trầm Hương SMH", ghi đè ảnh cũ trong các ô ${mf.ds.filter((x) => x.chon && x.blob && x.tt !== 'xong').map((x) => x.oKQ).join(', ')})?`)) return; phanHoi(a); theoDoi('danmf', async () => { const bd = Date.now(); try { const kq = await danAnhVaoSheet(); luu('hd_ket', { key: 'danmf', ten: 'Đang dán ảnh manifest vào sheet', chu: kq, luc: Date.now(), tg: Date.now() - bd, mau: /\/(\d+)/.test(kq) && kq.match(/đã dán (\d+)\/(\d+)/) && kq.match(/đã dán (\d+)\/(\d+)/)[1] === kq.match(/đã dán (\d+)\/(\d+)/)[2] ? 'ok' : 'vang' }); } catch (er) { alert('Dán chưa được: ' + er.message); } veBang(); }, 'Đang dán ảnh manifest vào sheet'); return; }
    if (hd === 'nghenhac') {
      if (ui6.nhac) { ui6.nhac.pause(); ui6.nhac = null; nhacNho('Đã dừng nhạc'); veBangNgay(); return; }
      const b = nhacBlob(); if (!b) return;
      const au = new Audio(URL.createObjectURL(b)); ui6.nhac = au; au.play().catch(() => {}); nhacNho('Đang phát thử 15 giây nhạc nền — bấm lại để dừng');
      const dung = () => { if (ui6.nhac === au) { au.pause(); ui6.nhac = null; veBangNgay(); } };
      au.onended = dung; setTimeout(dung, 15000); veBangNgay(); return;
    }
    if (hd === 'laynhac') { phanHoi(a); const cu = lay('nhac6', ''), cuI = lay('nhac6_info', null); luu('nhac6', ''); luu('nhac6_info', null); theoDoi('nhac', async () => { try { await damBaoNhac(); if (hdChay) hdChay.cuoi = 'đã lấy nhạc từ ô ' + lay('o_nhac6', CAI_DAT.O_NHAC_DU_PHONG); } catch (er) { luu('nhac6', cu); luu('nhac6_info', cuI); alert('Chưa lấy được nhạc: ' + er.message); } veBang(); }, 'Đang lấy nhạc từ ô dự phòng'); return; }
    if (hd === 'baoloi') { await xuatBaoLoi(); return; }
    if (hd === 'caima') { await caiMaKhoa(); return; }
    if (hd === 'kiemma') { await kiemMaKhoa(); return; }
    if (hd === 'chuto' || hd === 'chunho') { luu('ui_co_chu', Math.min(1.6, Math.max(0.9, Math.round((coChu() + (hd === 'chuto' ? 0.1 : -0.1)) * 10) / 10))); veBangNgay(); return; }
    if (hd === 'dungtab') { const kh = GM_getValue('khoa_dang_bai_that', null); if (kh && kh.ban && kh.id !== MA_TAB) { alert('Tab kia đang làm dở — đợi xong rồi bấm lại.'); return; } GM_setValue('khoa_dang_bai_that', { id: MA_TAB, ts: Date.now(), hien: true, anTu: 0, ban: false, v: PHIEN_BAN, ghim: true }); ghi('Đặt tab này làm Main (tab chính)'); veBangNgay(); setTimeout(nhip, 300); return; }
  }, true);
  // đang có bài soạn dở (chờ bấm Đăng) mà bấm Soạn/Đăng bài khác → hỏi bỏ bản cũ
  function boSoanDo() {
    if (dangBan || lay('dang_do', null)) { alert('Script đang đăng/comment dở một bài — đợi xong (xem thanh hoạt động) rồi bấm lại.'); return false; }
    const p = lay('cho_tay6', null); if (!p) return true;
    if (!confirm(`Đang có ${p.ten} soạn sẵn từ ${gioStr(new Date(p.luc))} (chưa bấm Đăng).\n\nBỏ bản soạn đó để làm bài mới?\n(Nếu hộp soạn còn mở trên trang, script sẽ đóng nó.)`)) return false;
    luu('cho_tay6', null);
    capNhatTT((s) => { const x = ttSlot(s, p.slot); if (!XONG.includes(x.tt)) { x.tt = 'cho'; x.thuLai = 0; x.daSoan = 0; } }, p.mai || homNay());
    ghi(`Bỏ bản soạn dở ${p.ten} (bạn bấm làm bài khác)`);
    dongHopSoan().catch(() => {});
    return true;
  }
  async function xuatBaoLoi() {
    const s = trangThai();
    const txt = anBiMat([`BÁO LỖI — ${TEN_HE_THONG} bản ${PHIEN_BAN} · ${TEN_MAY} · ${ngayStr(new Date())} ${gioStr(new Date())}`, `Trang: ${location.pathname} · tab ${laTabChinh() ? 'làm việc' : 'phụ'} · ${document.visibilityState}`, 'Lịch hôm nay: ' + JSON.stringify(s), 'Việc dở: ' + JSON.stringify(lay('dang_do', null)), 'Soạn chờ: ' + JSON.stringify(lay('cho_tay6', null)), 'Sức khoẻ: ' + JSON.stringify(lay('suc_khoe', {})), 'Lark: ' + JSON.stringify(lay('lark_gate', null)) + ' ' + JSON.stringify(lay('lark_dem', null)), '— NHẬT KÝ —', ...docNhatKy(3).map(dongNK)].join('\n'));
    let daCopy = false;
    try { await navigator.clipboard.writeText(txt); daCopy = true; } catch (e) { /* */ }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); a.download = `bao-loi-dang-bai-6.0-${homNay()}-${gioStr(new Date()).replace(':', 'h')}.txt`; document.body.appendChild(a); a.click(); a.remove();
    alert((daCopy ? 'Đã copy bản báo lỗi và ' : '') + 'đã tải file báo lỗi về máy — gửi file đó để kiểm tra.');
  }

  // =====================================================================
  //  (6.16) TỰ NÂNG CẤP
  //  · gom lỗi + thống kê từng việc → ghi báo cáo kỹ thuật lên Lark sheet (Z5 Máy Giao / Z6 Máy Cao) để Claude đọc mỗi tối
  //  · tự điều chỉnh việc lặp lại mà không có kết quả (giữ mức tối thiểu)
  //  · Máy Cao: nút "🛟 Báo lỗi này cho Claude" + chip "🆕 Bản mới chờ duyệt" (✅ Duyệt → ô Z7)
  //  · nạp mã bí mật (mã Lark, nhóm Lark) — file công khai không chứa mã
  // =====================================================================
  const coBiMat = () => !!(CAI_DAT.LARK_APP_ID && CAI_DAT.LARK_APP_SECRET && CAI_DAT.WEBHOOK_LOI);
  // bản cài tay lần đầu (có sẵn mã) → tự cất mã vào máy, để các bản tự cập nhật sau (không chứa mã) vẫn chạy được
  try { if (!lay('bimat6', null) && coBiMat() && CAI_DAT.WEBHOOK_BAO_CAO) luu('bimat6', { appId: CAI_DAT.LARK_APP_ID, appSecret: CAI_DAT.LARK_APP_SECRET, hookLoi: CAI_DAT.WEBHOOK_LOI, hookBaoCao: CAI_DAT.WEBHOOK_BAO_CAO, luc: Date.now(), tu: 'ban-cai-tay' }); } catch (e) { /* */ }
  window.addEventListener('message', (e) => { // Claude nạp mã qua Chrome lúc cài đặt; chỉ nhận khi máy CHƯA có mã
    try {
      const d = e && e.data; if (!d || !d.smhBiMat || e.origin !== location.origin) return;
      const b = d.smhBiMat; if (!b.appId || !b.appSecret || !b.hookLoi || !b.hookBaoCao) return;
      const cu = lay('bimat6', null); if (cu && cu.appId) { ghi('Có yêu cầu nạp mã bí mật nhưng máy này đã có mã → bỏ qua'); return; }
      luu('bimat6', { appId: String(b.appId), appSecret: String(b.appSecret), hookLoi: String(b.hookLoi), hookBaoCao: String(b.hookBaoCao), luc: Date.now() });
      ghi('Đã nạp mã bí mật (mã Lark, nhóm Lark) vào máy này → tải lại trang để dùng');
      setTimeout(() => { if (!dangBan && !lay('dang_do', null)) roiTrang(); }, 2000);
    } catch (er) { /* */ }
  });

  // ---------- gom lỗi ----------
  const BC_LOI_RE = /lỗi|Lỗi|kẹt|treo|không ăn|hộp lạ|Bỏ qua bước|chưa được|không được|thất bại|không thấy|không mở được|không sang được|chưa nhận|đứng yên|trắng trang|❌|⚠️|❓|🚨|bấm Đăng nhưng/;
  const BC_BO_RE = /^(Đã báo Lark|Lỗi chi tiết|Đã hiện thông báo|Khởi động bản|Đã nạp mã|Đã ghi báo cáo lỗi|Ghi báo cáo lỗi|🛟|Báo cáo tối:|Tự chụp hiện trường|Chuẩn bị cho .*: ổn|Đối chiếu .*: đúng)|lần thử \d+ — bước phụ/;
  const BC_DC_RE = /^Tự điều chỉnh:/;
  const khoaBC = (m) => String(m).replace(/\s*\[tab [^\]]+\]\s*$/, '').replace(/\d{1,2}:\d{2}(:\d{2})?/g, '#').replace(/\d+([.,]\d+)?/g, '#').slice(0, 150);
  const ngayGanDay = (n) => Array.from({ length: n }, (_, i) => ngayStr(congNgay(-i)));
  function layBC() { const b = lay('bc6', null) || {}; b.d = b.d || {}; b.uuTien = b.uuTien || []; return b; }
  function catBC(b) { const giu = new Set(ngayGanDay(3)); for (const n of Object.keys(b.d)) if (!giu.has(n)) delete b.d[n]; b.uuTien = b.uuTien.filter((x) => Date.now() - x.luc < 3 * 864e5).slice(-5); return b; }
  function thuBaoCao(msg) {
    if (!MAY || BC_BO_RE.test(msg)) return;
    const laDC = BC_DC_RE.test(msg); if (!laDC && !BC_LOI_RE.test(msg)) return;
    const b = layBC(); const ng = homNay(); const d = b.d[ng] || (b.d[ng] = { loi: {}, dc: [] });
    d.loi = d.loi || {}; d.dc = d.dc || [];
    if (laDC) { d.dc.push(gioStr(new Date()) + ' ' + String(msg).slice(0, 200)); d.dc = d.dc.slice(-20); }
    else {
      const k = khoaBC(msg); const x = d.loi[k];
      if (x) { x.n++; x.cuoi = Date.now(); }
      else { if (Object.keys(d.loi).length >= 80) return; d.loi[k] = { n: 1, dau: Date.now(), cuoi: Date.now(), vd: String(msg).replace(/\s*\[tab [^\]]+\]\s*$/, '').slice(0, 300) }; }
    }
    b.ban = PHIEN_BAN; b.doi = Date.now();
    luu('bc6', catBC(b));
  }
  // ---------- thống kê từng việc (theoDoi gọi sau mỗi lần chạy) ----------
  const TK_KQ_RE = /thiếu|gửi bù|lỗi|thử lại|Bỏ qua|kẹt|máy khác|đăng tay|ngoài lịch|đã có trên trang|đọc lại|bổ sung/i;
  function demViec(key, ms, coKQ) {
    if (!MAY || !key) return;
    const t = lay('tk6', {}) || {}; const ng = homNay(); const d = t[ng] || (t[ng] = {});
    const x = d[key] || (d[key] = { c: 0, ms: 0, kq: 0 }); x.c++; x.ms += Math.max(0, Math.round(ms)); if (coKQ) x.kq++;
    const giu = new Set(ngayGanDay(14)); for (const n of Object.keys(t)) if (!giu.has(n)) delete t[n];
    luu('tk6', t);
  }
  function tkTong(key, soNgay) { const t = lay('tk6', {}) || {}; let c = 0, kq = 0, ms = 0; for (const n of ngayGanDay(soNgay)) { const x = (t[n] || {})[key]; if (x) { c += x.c; kq += x.kq; ms += x.ms; } } return { c, kq, ms }; }
  // ---------- tự điều chỉnh (tầng 1): việc chạy nhiều mà 7 ngày không ra kết quả → giãn ra; có kết quả lại → về mức cũ ----------
  function phutDoTrang() {
    const s = tkTong('dotrang', 7); const goc = CAI_DAT.DO_TRANG_PHUT;
    const thua = s.c >= 200 && s.kq === 0;
    const v = thua ? goc * 2 : goc;
    if ((lay('tn_dotrang', goc) || goc) !== v) { luu('tn_dotrang', v); ghi(`Tự điều chỉnh: dò bài trên trang ${goc} → ${v} phút/lần (${thua ? '7 ngày qua chạy ' + s.c + ' lần không phát hiện gì mới' : 'vừa có phát hiện mới → về mức cũ'})`); }
    return v;
  }

  // ---------- ghi báo cáo lên Lark (khi có lỗi mới; tối đa 30 phút/lần; nút 🛟 thì ghi ngay) ----------
  const oBC = () => (LA_CAO ? CAI_DAT.O_BC_CAO : CAI_DAT.O_BC_GIAO);
  const canGhiBC = () => { if (!MAY || !coBiMat() || lay('bc6_kiem', '') === 'khoa') return false; const b = layBC(); if (!b.doi || b.doi <= (b.daGhi || 0)) return false; return b.gap || Date.now() - (b.daGhi || 0) >= 30 * 60000; };
  function tomTatSlot() { const s = trangThai(); const o = {}; for (const it of LICH) { const r = s.s[it.k]; if (r) o[it.k] = [r.tt, r.may || '', r.lan || 0, r.vong || 0, String(r.loi || r.lyDo || '').slice(0, 80)].join('|'); } return o; }
  async function ghiBaoCaoLark() {
    if (!canGhiBC() || chanLark()) return false;
    const o = oBC();
    if (lay('bc6_kiem', '') !== homNay()) {
      const c = String(chuO(await docO(CAI_DAT.TAB_BAI, o)) || '').trim();
      if (c && !/^BC6\|/.test(c)) { ghi(`Ô ${o} (tab Bài viết kênh 1) đang có chữ khác — script không ghi báo cáo lỗi vào ô này`); luu('bc6_kiem', 'khoa'); return false; }
      luu('bc6_kiem', homNay());
    }
    const b = catBC(layBC()); const t = lay('tk6', {}) || {}; const tk = {}; for (const n of ngayGanDay(3)) if (t[n]) tk[n] = t[n];
    const goi = { may: MAY, ban: PHIEN_BAN, luc: Date.now(), d: b.d, uuTien: b.uuTien, drive: lay('drive6', null), tk, tn: { dotrang: lay('tn_dotrang', CAI_DAT.DO_TRANG_PHUT) }, slot: tomTatSlot() };
    let s = 'BC6|' + JSON.stringify(goi);
    if (s.length > 40000) { for (const n of Object.keys(goi.d)) for (const k of Object.keys(goi.d[n].loi || {})) goi.d[n].loi[k].vd = String(goi.d[n].loi[k].vd).slice(0, 120); s = 'BC6|' + JSON.stringify(goi); }
    while (s.length > 40000 && goi.uuTien.length) { goi.uuTien.shift(); s = 'BC6|' + JSON.stringify(goi); }
    if (s.length > 40000) { goi.tk = {}; s = 'BC6|' + JSON.stringify(goi).slice(0, 39990); }
    await ghiO(CAI_DAT.TAB_BAI, o, s);
    const b2 = layBC(); b2.daGhi = Date.now(); b2.gap = false; luu('bc6', b2);
    ghi(`Đã ghi báo cáo lỗi kỹ thuật lên Lark sheet (ô ${o}) cho Claude kiểm tra tối nay`);
    return true;
  }

  // ---------- Máy Cao: 🛟 báo lỗi này cho Claude ----------
  function chupHienTruong() {
    const hop = Array.from(document.querySelectorAll('[role="dialog"],[role="alertdialog"]')).filter((d) => dangHien(d) && !d.closest('#smhfb,#smhfb-nho,#smhfb-soan-w')).slice(0, 6)
      .map((d) => ({ chu: chuan(d.innerText).slice(0, 300), nut: Array.from(d.querySelectorAll('[role="button"],button')).filter(dangHien).map((x) => chuan(x.innerText || x.getAttribute('aria-label') || '')).filter((t) => t && t.length < 30).slice(0, 12) }));
    const nk = (lay(khoaNK(new Date()), []) || []).filter((e) => Date.now() - e.cuoi < 40 * 60000).slice(-80).map((e) => gioStr(new Date(e.luc)) + ' ' + String(e.msg).replace(/\s*\[tab [^\]]+\]$/, '').slice(0, 220) + (e.so > 1 ? ' [x' + e.so + ']' : ''));
    const dd = lay('dang_do', null);
    return { luc: Date.now(), may: MAY, ban: PHIEN_BAN, url: location.pathname, hd: (lay('hoat_dong', null) || {}).ten || '', dangDo: dd ? { ten: dd.ten, buoc: dd.buoc, luc: dd.luc } : null, hop, nk };
  }
  function baoLoiChoClaude() {
    const x = chupHienTruong();
    const b = layBC(); b.uuTien.push(x); b.doi = Date.now(); b.gap = true; b.ban = PHIEN_BAN; luu('bc6', catBC(b));
    ghi(`🛟 Bạn bấm "Báo lỗi này cho Claude" — đã chụp lại tình trạng (${x.hop.length} hộp đang mở, ${x.nk.length} dòng nhật ký) → ưu tiên kiểm tra tối nay`);
    nhacNho('Đã ghi lại lỗi — tối nay Claude kiểm tra lỗi này trước tiên. Script vẫn tự xử lý tiếp để không bỏ bài.', 'ok', 7000);
    setTimeout(() => { if (!dangBan) nhip(); }, 500);
  }

  // ---------- Máy Cao: bản mới chờ duyệt (đọc trangthai.json trên GitHub, 3 giờ/lần) ----------
  const ttGit = () => lay('tt_git6', null) || {};
  function docTrangThaiGit(ep) {
    if (!LA_CAO || (!ep && Date.now() - (ttGit().hoi || 0) < 3 * 3600e3)) return;
    luu('tt_git6', Object.assign({}, ttGit(), { hoi: Date.now() }));
    try {
      GM_xmlhttpRequest({ method: 'GET', url: CAI_DAT.LINK_TRANG_THAI + '?t=' + Date.now(), timeout: 20000,
        onload: (r) => { try { if (r.status !== 200) return; const j = JSON.parse(r.responseText); luu('tt_git6', Object.assign(j, { hoi: Date.now() })); veBang(); } catch (e) { /* */ } } });
    } catch (e) { /* */ }
  }
  const banChoDuyet = () => { const c = ttGit().choDuyet; if (!c || !c.ban || !cuHon(PHIEN_BAN, c.ban)) return null; if (lay('duyet6', '') === c.ban) return null; return c; };
  const anChip = () => { const a = lay('desau6', null); const c = banChoDuyet(); return !!(a && c && a.ban === c.ban && a.ngay === homNay()); };
  async function duyetBanMoi(ban) {
    await ghiO(CAI_DAT.TAB_BAI, CAI_DAT.O_DUYET, `DUYET|${ban}|${Date.now()}|CAO`);
    luu('duyet6', ban);
    ghi(`✅ Đã duyệt bản ${ban} — tối nay Claude chuyển thành bản chính thức, 2 máy tự cập nhật`);
    nhacNho(`Đã duyệt bản ${ban}. Tối nay Claude chuyển thành bản chính thức, Tampermonkey trên 2 máy tự cập nhật.`, 'ok', 7000);
  }
  // nút trên thanh popup (chỉ Máy Cao)
  function nutTuNangBar() {
    const c = LA_CAO ? banChoDuyet() : null;
    return nutCapNhatNgay() + (c && !anChip() ? `<button class="tg chip-duyet" data-a="moduyet" title="${esc(c.tomTat || '')}">🆕 Bản ${esc(c.ban)} chờ duyệt</button>` : '')
      + `<button class="tg" data-a="baoclaude" title="Thấy lỗi? Bấm để script chụp lại tình trạng lúc này — tối nay Claude kiểm tra lỗi này trước tiên (script vẫn tự xử lý tiếp)">🛟</button>`;
  }
  // khung trong tab Hệ thống
  function khungTuNang() {
    const b = layBC(); const ng = b.d[homNay()] || {}; const soLoi = Object.values(ng.loi || {}).reduce((a, x) => a + x.n, 0);
    const c = banChoDuyet(); const tt = ttGit();
    let h = `<div class="the-nd" style="margin-top:10px"><div class="nhan">🔄 Tự nâng cấp</div>`;
    h += `<div class="dong"><span>Đang chạy</span><span><b>bản ${PHIEN_BAN}</b>${tt.chinhThuc ? ' · bản chính thức trên GitHub: ' + esc(tt.chinhThuc) : ''}</span></div>`;
    h += `<div class="dong"><span>Mã bí mật</span><span>${coBiMat() ? '🟢 đã có trong máy' : '🔴 máy này chưa có mã Lark — Claude sẽ nạp khi kiểm tra tối'}</span></div>`;
    h += `<div class="dong"><span>Báo cáo lỗi hôm nay</span><span>${soLoi} dòng lỗi · ${b.uuTien.length ? b.uuTien.length + ' lần bấm 🛟 · ' : ''}${b.daGhi ? 'ghi lên Lark lúc ' + gioStr(new Date(b.daGhi)) : 'chưa cần ghi'}</span></div>`;
    if ((ng.dc || []).length) h += `<div class="dong"><span>Tự điều chỉnh</span><span>${ng.dc.map(esc).join('<br>')}</span></div>`;
    if (LA_CAO && c) h += `<div class="dong" style="flex-direction:column;align-items:flex-start;gap:6px"><b>🆕 Bản ${esc(c.ban)} đang chờ anh duyệt</b><span class="mo" style="white-space:pre-wrap">${esc(c.tomTat || '(không có tóm tắt)')}</span><span><button class="nut chinh" data-a="duyetban" data-ban="${esc(c.ban)}">✅ Duyệt</button> <button class="nut" data-a="desau" data-ban="${esc(c.ban)}">Để sau</button></span></div>`;
    else if (LA_CAO && lay('duyet6', '') && cuHon(PHIEN_BAN, lay('duyet6', ''))) h += `<div class="dong"><span>Đã duyệt</span><span>bản ${esc(lay('duyet6', ''))} — chờ Claude chuyển thành bản chính thức tối nay, sau đó Tampermonkey tự cập nhật</span></div>`;
    { const cn = lay('capnhat6', null); h += `<div class="dong"><span>Nguồn cập nhật</span><span>${cn ? (cn.ok ? '🟢 đọc được · bản trên nguồn: ' + esc(cn.ban || '?') + ' (kiểm lúc ' + gioStr(new Date(cn.luc)) + ')' : '🔴 chưa đọc được (' + esc(cn.loi || '') + ')') : 'chưa kiểm'}</span></div>`; }
    { const dv = lay('drive6', null); h += `<div class="dong"><span>Thử nguồn Google Drive</span><span>${dv ? (dv.ok ? '🟢 Tampermonkey đọc được file trên Drive (bản ' + esc(dv.ban) + ')' : '🔴 chưa đọc được: ' + esc(dv.loi || '')) : 'chưa thử'}</span></div>`; }
    h += khungThuNap();
    h += `<div class="dong"><span>Thấy lỗi?</span><span><button class="nut" data-a="baoclaude">🛟 Báo lỗi này cho Claude</button></span></div>`;
    return h + '</div>';
  }
  document.addEventListener('click', async (ev) => {
    const a = ev.target.closest && ev.target.closest('#smhfb [data-a]'); if (!a) return;
    const hd = a.getAttribute('data-a'); const ban = a.getAttribute('data-ban');
    if (hd === 'baoclaude') { baoLoiChoClaude(); veBangNgay(); return; }
    if (hd === 'capnhatngay') { const u = a.getAttribute('data-link'); ghi('Bấm Cập nhật ngay → mở trang cài bản mới của Tampermonkey'); nhacNho('Đang mở trang cập nhật — bấm "Cập nhật" trên trang Tampermonkey vừa mở'); window.open(u, '_blank'); return; }
    if (hd === 'moduyet') { uiTab.moRong = true; uiTab.moLuc = Date.now(); luu('ui_tab6', 'hethong'); nhacNho('Xem bản mới ở tab Hệ thống → mục Tự nâng cấp'); veBangNgay(); return; }
    if (hd === 'desau' && ban) { luu('desau6', { ban, ngay: homNay() }); nhacNho(`Để sau — mai nhắc lại bản ${ban}`); veBangNgay(); return; }
    if (hd === 'duyetban' && ban) {
      if (!LA_CAO) return;
      if (!confirm(`Duyệt bản ${ban}?\n\nTối nay Claude chuyển bản này thành bản chính thức, Tampermonkey trên cả 2 máy tự cập nhật.`)) return;
      try { await theoDoi('duyet', () => duyetBanMoi(ban), 'Đang ghi duyệt bản ' + ban); } catch (e) { ghi('Ghi duyệt chưa được: ' + e.message); nhacNho('Ghi duyệt chưa được (' + e.message + ') — thử lại sau ít phút', 'vang', 7000); }
      veBangNgay();
    }
  });
  // ---------- Claude (lượt kiểm tra tối) lấy báo cáo của CẢ 2 máy qua máy đang bật: đọc ô Z5:Z7 (1 lượt Lark) → để vào khung ẩn #smhfb-bc ----------
  window.addEventListener('message', async (e) => {
    try {
      const d = e && e.data; if (!d || !d.smhLayBaoCao || e.origin !== location.origin) return;
      let out;
      try { const v = await docBang(CAI_DAT.TAB_BAI, CAI_DAT.O_BC_GIAO + ':' + CAI_DAT.O_DUYET); out = { ok: true, luc: Date.now(), may: MAY, ban: PHIEN_BAN, giao: chuO((v[0] || [])[0]) || '', cao: chuO((v[1] || [])[0]) || '', duyet: chuO((v[2] || [])[0]) || '', sk: lay('sk6', null), coBiMat: coBiMat() }; }
      catch (er) { out = { ok: false, loi: er.message, may: MAY, ban: PHIEN_BAN, coBiMat: coBiMat() }; }
      let el = document.getElementById('smhfb-bc'); if (!el) { el = document.createElement('textarea'); el.id = 'smhfb-bc'; el.style.display = 'none'; document.body.appendChild(el); }
      el.value = JSON.stringify(out);
      ghi('Claude đã lấy báo cáo lỗi của 2 máy để kiểm tra');
    } catch (er) { /* */ }
  });

  // =====================================================================
  //  (6.18) TỰ CHỤP HIỆN TRƯỜNG khi một bước lỗi / kẹt (giống bấm 🛟, tối đa 4 lần/ngày/máy)
  // =====================================================================
  function tuChupHienTruong(ly) {
    try {
      const b = layBC(); const hn = homNay();
      const daChup = b.uuTien.filter((x) => x.tu && ngayStr(new Date(x.luc)) === hn).length; if (daChup >= 4) return;
      const x = chupHienTruong(); x.tu = true; x.ly = String(ly || '').slice(0, 200);
      b.uuTien.push(x); b.doi = Date.now(); b.ban = PHIEN_BAN; luu('bc6', catBC(b));
      luuNK(`Tự chụp hiện trường (${x.hop.length} hộp đang mở, ${x.nk.length} dòng nhật ký) để Claude kiểm tra tối nay: ${x.ly}`, true);
    } catch (e) { /* */ }
  }
  // =====================================================================
  //  (6.18) MỖI TỐI 21:30 mỗi máy ghi 1 dòng "đã chạy" lên Lark (kể cả ngày không có lỗi)
  // =====================================================================
  function nhipBaoCaoToi() {
    if (!MAY || phutTrongNgay(new Date()) < 21 * 60 + 30 || lay('bc6_hb', '') === homNay()) return;
    const s = trangThai(); const xong = LICH.filter((it) => XONG.includes((s.s[it.k] || {}).tt)).length;
    const b = layBC(); const d = b.d[homNay()] || (b.d[homNay()] = { loi: {}, dc: [] });
    const soLoi = Object.values(d.loi || {}).reduce((a, x) => a + x.n, 0);
    d.hb = { luc: Date.now(), xong, soLoi };
    b.doi = Date.now(); b.gap = true; b.ban = PHIEN_BAN; luu('bc6', catBC(b)); luu('bc6_hb', homNay());
    ghi(`Báo cáo tối: ${TEN_MAY} đã chạy cả ngày — ${xong}/9 bài đã lên, ${soLoi} dòng lỗi → ghi lên Lark cho Claude`);
  }
  // =====================================================================
  //  (6.18) 16:00 NHẮC ĐIỀN SHEET — chỉ cho bài của NGÀY MAI (Máy Giao gửi, nhóm Marketing)
  // =====================================================================
  async function nhacSheetMai() {
    if (!LA_GIAO || !coBiMat() || phutTrongNgay(new Date()) < 16 * 60 || lay('nhacsheet6', '') === homNay()) return false;
    if (dangBan || lay('dang_do', null)) return false;
    luu('nhacsheet6', homNay());
    try { if (!chanLark()) await docDuLieu('nhacmai'); } catch (e) { ghi('Nhắc điền sheet: đọc sheet chưa được (' + e.message + ') → dùng dữ liệu đọc gần nhất'); }
    const mai = ngayMai(); const d = duLieu(); if (!d) return false;
    const ds = [];
    for (const it of LICH) { const nd = noiDungSlot(mai, it.k, d); if (nd.thieu && nd.thieu.length) ds.push(`• ${it.ten}: thiếu ${nd.thieu.join(', ')}`); }
    if (!ds.length) { ghi(`Nhắc điền sheet: ngày mai ${mai} đã đủ nội dung 9 bài → không cần nhắc`); return true; }
    const nd = `📝 Nhắc bổ sung sheet cho NGÀY MAI ${mai.replace(/-/g, '/')} (${ds.length}/9 bài còn thiếu):\n${ds.join('\n')}\nSheet: ${CAI_DAT.LINK_SHEET}`;
    await guiLark('baocao', nd, { khoa: 'nhacsheet_' + mai });
    ghi(`Đã nhắc nhóm Marketing bổ sung sheet cho ngày mai (${ds.length} bài còn thiếu)`);
    return true;
  }
  // =====================================================================
  //  (6.18) CHUẨN BỊ TRƯỚC GIỜ ĐĂNG ~10 PHÚT: sheet đủ chưa, file đã tải sẵn chưa, đúng trang chưa, có ô soạn bài không
  // =====================================================================
  async function chuanBiTruoc() {
    if (!MAY || !tuDong() || tamDung() || dangBan || lay('dang_do', null) || lay('cho_tay6', null) || !laTabChinh()) return false;
    const L = tinhLich(); const it = L.find((x) => x.keTiep); if (!it || !it.den) return false;
    const con = it.den - Date.now(); if (con < 6 * 60000 || con > 12 * 60000 || it.r.cbLuc === it.den) return false;
    if (LA_CAO && it.r.may !== 'CAO') return false; // Máy Cao chỉ chuẩn bị khi nó là máy đăng (dự phòng)
    capNhatTT((s) => { ttSlot(s, it.k).cbLuc = it.den; });
    const loi = []; const ok = [];
    let nd = noiDungSlot(homNay(), it.k);
    if (nd.thieu.length) { try { if (!chanLark()) { await docDuLieu('thieu'); nd = noiDungSlot(homNay(), it.k); } } catch (e) { /* */ } }
    if (nd.thieu.length) loi.push('sheet còn thiếu ' + nd.thieu.join(', ')); else ok.push('sheet đủ nội dung');
    if (it.loai === 'video' && nd.tep) { try { await taiVideoKho(nd.tep); ok.push('video đã tải sẵn'); } catch (e) { loi.push('chưa tải được video (' + String(e.message).slice(0, 60) + ')'); } }
    if (document.visibilityState === 'visible' && dungTrang() && !nhanSuDangDung() && !hopSoanBai() && !ganManHinh()) {
      try { const tc = await damBaoTuCach(); if (tc) ok.push('đang đúng trang ' + CAI_DAT.TEN_NGAN); else ok.push('đang chuyển sang đúng trang (trang tải lại)'); }
      catch (e) { if (e instanceof LoiDung) throw e; loi.push('chưa chuyển được sang trang ' + CAI_DAT.TEN_NGAN + ' (' + String(e.message).slice(0, 80) + ')'); }
      if (!timNutSoanBai() && !Array.from(document.querySelectorAll('[role="button"]')).some((b) => chuan(b.innerText) === 'Ảnh/video')) loi.push('không thấy ô soạn bài trên trang');
      else ok.push('có ô soạn bài');
    }
    ghi(`Chuẩn bị cho ${it.ten} (đăng lúc ${gioStr(new Date(it.den))}): ${loi.length ? '⚠ ' + loi.join(' · ') + (ok.length ? ' | ổn: ' + ok.join(', ') : '') : 'ổn — ' + ok.join(', ')}`);
    if (loi.length) await baoLoi(`⚠️ Còn khoảng ${Math.round(con / 60000)} phút nữa đăng ${it.ten} nhưng: ${loi.join(' · ')} — script sẽ vẫn thử đăng đúng giờ`, 'cb_' + it.k);
    return true;
  }
  // =====================================================================
  //  (6.18) ĐỐI CHIẾU BÀI SAU KHI ĐĂNG ~15 PHÚT (chỉ hỏi Facebook, không chạm trang)
  // =====================================================================
  async function doiChieuSauDang() {
    if (!MAY || !coApi() || tamDung()) return false;
    const s = trangThai(); const now = Date.now();
    const it = LICH.find((x) => { const r = s.s[x.k]; return r && XONG.includes(r.tt) && r.id && !r.dcLuc && now - (r.luc || 0) > 15 * 60000 && now - (r.luc || 0) < 6 * 3600e3 && (r.may === MAY || (LA_GIAO && ['khac', 'tay'].includes(r.may))); });
    if (!it) return false;
    const r = s.s[it.k]; const nd = noiDungSlot(homNay(), it.k);
    capNhatTT((s1) => { ttSlot(s1, it.k).dcLuc = Date.now(); });
    let ds; try { ds = await baiTrenTrangApi((r.luc || now) - 30 * 60000); } catch (e) { capNhatTT((s1) => { ttSlot(s1, it.k).dcLuc = 0; }); return false; }
    const p = ds.find((x) => x.id === r.id);
    const loi = [];
    if (!p) loi.push('Facebook không còn thấy bài này trên trang');
    else {
      if (nd.text && !(dauKhop(p, nd.text) && doGiong(p.text, nd.text) >= CAI_DAT.NGUONG_BAI)) loi.push('chữ trên bài không khớp với sheet');
      if ((it.loai === 'video' || it.loai === 'manifest') && laVideoApi(p) === false) loi.push('bài không phải thước phim/video');
      const trungLink = LICH.find((x) => x.k !== it.k && s.s[x.k] && s.s[x.k].link && r.link && linkGon(s.s[x.k].link) === linkGon(r.link));
      if (trungLink) loi.push('trùng link với ' + trungLink.ten);
    }
    capNhatTT((s1) => { Object.assign(ttSlot(s1, it.k), { dcLuc: Date.now(), dcLoi: loi.join(' · ') }); });
    ghi(`Đối chiếu ${it.ten} sau khi đăng: ${loi.length ? '⚠ ' + loi.join(' · ') : 'đúng chữ, đúng loại bài, không trùng link'}`);
    if (loi.length) await baoLoi(`⚠️ Đối chiếu ${it.ten} sau khi đăng: ${loi.join(' · ')}${r.link ? ' — ' + r.link : ''} — cần xem lại`, 'dc_' + it.k);
    return true;
  }
  // =====================================================================
  //  (6.18) NÚT "CẬP NHẬT NGAY": 3 giờ/lần hỏi nguồn cập nhật xem có bản mới hơn bản đang chạy không
  // =====================================================================
  function docNguonCapNhat(ep) {
    const cn = lay('capnhat6', null);
    if (!MAY || (!ep && cn && Date.now() - cn.luc < 3 * 3600e3)) return;
    luu('capnhat6', Object.assign({}, cn || {}, { luc: Date.now() }));
    try {
      GM_xmlhttpRequest({ method: 'GET', url: CAI_DAT.LINK_CAP_NHAT + (CAI_DAT.LINK_CAP_NHAT.includes('?') ? '&' : '?') + 't=' + Date.now(), timeout: 30000,
        onload: (r) => { const m = String(r.responseText || '').match(/@version\s+([\d.]+)/); luu('capnhat6', m && r.status < 400 ? { luc: Date.now(), ok: true, ban: m[1] } : { luc: Date.now(), ok: false, loi: 'mã ' + r.status }); veBang(); },
        onerror: () => { luu('capnhat6', { luc: Date.now(), ok: false, loi: 'mất kết nối' }); },
        ontimeout: () => { luu('capnhat6', { luc: Date.now(), ok: false, loi: 'quá lâu' }); } });
    } catch (e) { luu('capnhat6', { luc: Date.now(), ok: false, loi: e.message }); }
    // thử đọc file phát hành trên Google Drive (để quyết định có chuyển nguồn cập nhật sang Drive không)
    try {
      GM_xmlhttpRequest({ method: 'GET', url: CAI_DAT.LINK_THU_DRIVE + '&t=' + Date.now(), timeout: 30000,
        onload: (r) => { const tx = String(r.responseText || ''); const m = tx.match(/@version\s+([\d.]+)/); const kq = m ? { luc: Date.now(), ok: true, ban: m[1] } : { luc: Date.now(), ok: false, loi: /quét vi-rút|virus/i.test(tx) ? 'Drive hiện trang cảnh báo vi-rút' : /accounts\.google|Đăng nhập|Sign in/i.test(tx) ? 'file chưa chia sẻ công khai' : 'mã ' + r.status }; luu('drive6', kq); try { const b = layBC(); b.drive = kq; luu('bc6', b); } catch (e) { /* */ } veBang(); },
        onerror: () => luu('drive6', { luc: Date.now(), ok: false, loi: 'mất kết nối' }), ontimeout: () => luu('drive6', { luc: Date.now(), ok: false, loi: 'quá lâu' }) });
    } catch (e) { /* */ }
  }
  function nutCapNhatNgay() {
    const cn = lay('capnhat6', null); if (!cn || !cn.ok || !cn.ban || !cuHon(PHIEN_BAN, cn.ban)) return '';
    return `<button class="tg chip-duyet" data-a="capnhatngay" data-link="${esc(CAI_DAT.LINK_CAP_NHAT)}" title="Bản ${esc(cn.ban)} đã được duyệt. Tampermonkey sẽ tự cập nhật trong vòng 6 tiếng — bấm để cập nhật ngay">⬆ Bản ${esc(cn.ban)} — Cập nhật ngay</button>`;
  }

  // =====================================================================
  //  (6.18.1) THỬ "CÁCH 2": cất bản mới trong Lark → các máy tự nạp sau khi anh Cao duyệt
  //  Chỉ THỬ, không đổi cách chạy hiện tại. Chạy trên Máy Cao, 1 lần (hoặc khi bấm nút trong tab Hệ thống).
  //  Kiểm 4 việc: (1) Tampermonkey có cho chạy mã nạp về không  (2) nén/giải nén mã
  //               (3) cất mã vào ô sheet (Z20:Z29, thử xong xoá sạch)  (4) cất mã thành file trong Lark Drive của ứng dụng
  // =====================================================================
  const O_NAP = ['Z20', 'Z21', 'Z22', 'Z23', 'Z24', 'Z25', 'Z26', 'Z27', 'Z28', 'Z29'];
  const ketThuNap = () => lay('thunap6', null);
  async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 16); }
  async function nenB64(s) {
    const st = new Blob([s]).stream().pipeThrough(new CompressionStream('gzip'));
    const u8 = new Uint8Array(await new Response(st).arrayBuffer());
    let bin = ''; for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  async function giaiNenB64(b64) {
    const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const st = new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(st).text();
  }
  function goiTep(method, url, data, responseType) { // gọi Lark có tệp (multipart) / tải tệp về
    return new Promise(async (resolve) => {
      let t; try { t = await larkToken(); } catch (e) { resolve({ status: 0, loi: e.message }); return; }
      GM_xmlhttpRequest({ method, url, data, responseType, timeout: 120000, headers: { Authorization: 'Bearer ' + t },
        onload: (r) => resolve({ status: r.status, text: responseType ? null : r.responseText, resp: r.response }),
        onerror: () => resolve({ status: 0, loi: 'mất kết nối' }), ontimeout: () => resolve({ status: 0, loi: 'quá lâu' }) });
    });
  }
  async function thuNapBan() {
    const kq = { luc: Date.now(), may: MAY, ban: PHIEN_BAN, buoc: {} };
    const xong = (k, ok, chi) => { kq.buoc[k] = { ok, chi: String(chi || '').slice(0, 300) }; ghi(`Thử nạp bản — ${k}: ${ok ? 'ĐƯỢC' : 'CHƯA ĐƯỢC'}${chi ? ' (' + chi + ')' : ''}`); luu('thunap6', kq); };
    ghi('Thử nạp bản (cách 2): bắt đầu — chỉ thử, không đổi cách chạy hiện tại');
    // (1) chạy mã nạp về
    let src = '';
    try {
      const f = new Function('a', 'b', 'return a + b'); if (f(40, 2) !== 42) throw new Error('kết quả sai');
      src = (GM_info && GM_info.scriptSource) || '';
      const t0 = Date.now(); if (src) new Function(src); // chỉ dịch thử, KHÔNG chạy
      xong('1. Tampermonkey cho chạy mã nạp về', true, src ? `dịch thử ${Math.round(src.length / 1024)} KB mã trong ${Date.now() - t0} ms` : 'không đọc được mã gốc để dịch thử (chỉ thử mã nhỏ)');
    } catch (e) { xong('1. Tampermonkey cho chạy mã nạp về', false, e.message); }
    if (!src) src = 'thu-nap-' + 'x'.repeat(600000);
    // (2) nén / giải nén
    let b64 = '', h0 = '';
    try {
      h0 = await sha(src); b64 = await nenB64(src); const lai = await giaiNenB64(b64);
      if (await sha(lai) !== h0) throw new Error('giải nén ra khác bản gốc');
      xong('2. Nén mã', true, `${Math.round(src.length / 1024)} KB → ${Math.round(b64.length / 1024)} KB`);
    } catch (e) { xong('2. Nén mã', false, e.message); }
    // (3) cất vào ô sheet Z20:Z29 rồi đọc lại, xong xoá sạch
    if (b64) {
      try {
        const cu = await docBang(CAI_DAT.TAB_BAI, 'Z20:Z29');
        if (cu.some((r) => chuO((r || [])[0]))) throw new Error('ô Z20:Z29 đang có chữ khác — không ghi đè');
        const manh = []; for (let i = 0; i < b64.length; i += 40000) manh.push(b64.slice(i, i + 40000));
        if (manh.length > O_NAP.length) throw new Error(`mã nén cần ${manh.length} ô, chỉ dành ${O_NAP.length} ô`);
        const t0 = Date.now();
        for (let i = 0; i < manh.length; i++) await ghiO(CAI_DAT.TAB_BAI, O_NAP[i], 'NAP|' + manh[i]);
        const tGhi = Date.now() - t0, t1 = Date.now();
        const v = await docBang(CAI_DAT.TAB_BAI, 'Z20:Z29');
        const ghep = v.map((r) => chuO((r || [])[0])).filter((s) => s.startsWith('NAP|')).map((s) => s.slice(4)).join('');
        const tDoc = Date.now() - t1;
        let dung = false; try { dung = (await sha(await giaiNenB64(ghep))) === h0; } catch (e) { /* */ }
        try { await ghiNhieuO(CAI_DAT.TAB_BAI, O_NAP.slice(0, manh.length).map((o) => [o, ''])); } catch (e) { ghi('Thử nạp bản: xoá ô Z20:Z29 chưa được — ' + e.message); }
        xong('3. Cất mã vào ô sheet', dung, `${manh.length} ô · ghi ${Math.round(tGhi / 1000)} giây · đọc lại ${Math.round(tDoc / 1000)} giây${dung ? ' · đọc lại khớp 100%' : ' · đọc lại KHÔNG khớp'} · đã xoá ô thử`);
      } catch (e) { xong('3. Cất mã vào ô sheet', false, e.message); }
    }
    // (4) cất thành file trong Lark Drive của ứng dụng rồi tải lại
    try {
      const r0 = await goiLark('GET', 'https://open.larksuite.com/open-apis/drive/explorer/v2/root_folder/meta');
      const thuMuc = r0.json && r0.json.data && r0.json.data.token; if (!thuMuc) throw new Error('không lấy được thư mục của ứng dụng');
      const fd = new FormData(); const tep = new Blob([src], { type: 'text/plain' });
      fd.append('file_name', 'smh-thu-nap.txt'); fd.append('parent_type', 'explorer'); fd.append('parent_node', thuMuc); fd.append('size', String(tep.size)); fd.append('file', tep, 'smh-thu-nap.txt');
      const t0 = Date.now(); const up = await goiTep('POST', 'https://open.larksuite.com/open-apis/drive/v1/files/upload_all', fd);
      let j = null; try { j = JSON.parse(up.text); } catch (e) { /* */ }
      if (!j || j.code !== 0) throw new Error('tải lên chưa được (mã ' + (j ? j.code + ' ' + (j.msg || '') : up.status + ' ' + (up.loi || '')) + ')');
      const ma = j.data.file_token; const tUp = Date.now() - t0, t1 = Date.now();
      const dl = await goiTep('GET', 'https://open.larksuite.com/open-apis/drive/v1/files/' + ma + '/download', null, 'text');
      const dung = dl.status === 200 && (await sha(String(dl.resp || ''))) === h0;
      luu('thunap_tep6', ma);
      xong('4. Cất mã thành file Lark Drive', dung, `tải lên ${Math.round(tUp / 1000)} giây · tải về ${Math.round((Date.now() - t1) / 1000)} giây${dung ? ' · khớp 100%' : ' · tải về KHÔNG khớp (mã ' + dl.status + ')'}`);
    } catch (e) { xong('4. Cất mã thành file Lark Drive', false, e.message); }
    kq.xong = Date.now(); luu('thunap6', kq);
    const ok = Object.values(kq.buoc).filter((b) => b.ok).length;
    ghi(`Thử nạp bản (cách 2): xong — ${ok}/${Object.keys(kq.buoc).length} việc được`);
    return true;
  }
  function chayThuNap(tay) {
    if (!LA_CAO || dangChay || dangBan) return false;
    if (!tay && ketThuNap()) return false;
    if (!coBiMat()) return false;
    theoDoi('thunap', thuNapBan, 'Đang thử nạp bản qua Lark (cách 2)').catch((e) => ghi('Thử nạp bản lỗi: ' + e.message)).finally(() => { try { veBangNgay(); } catch (e) { /* */ } });
    return true;
  }
  function khungThuNap() {
    if (!LA_CAO) return '';
    const k = ketThuNap();
    let h = `<div class="dong" style="flex-direction:column;align-items:flex-start;gap:4px"><span><b>🧪 Thử cập nhật qua Lark (cách 2)</b> — chỉ thử, không đổi cách chạy</span>`;
    if (k) for (const [ten, b] of Object.entries(k.buoc)) h += `<span>${b.ok ? '🟢' : '🔴'} ${esc(ten)}: ${esc(b.chi)}</span>`;
    h += `<span>${k ? (k.xong ? 'Thử lúc ' + gioStr(new Date(k.luc)) : '⏳ đang thử…') : 'chưa thử — script tự thử khi rảnh'} <button class="nut" data-a="thunap">${k ? 'Thử lại' : 'Thử ngay'}</button></span></div>`;
    return h;
  }
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('#smhfb [data-a="thunap"]'); if (!a) return;
    if (chayThuNap(true)) nhacNho('Đang thử nạp bản qua Lark — khoảng 1 phút', 'cho'); else nhacNho('Script đang bận việc khác — thử lại sau ít phút', 'vang', 6000);
  });
  window.addEventListener('message', (e) => { // Claude gọi thử từ xa + đọc kết quả
    const d = e && e.data; if (!d || e.origin !== location.origin) return;
    if (d.smhThuNap) chayThuNap(true);
    if (d.smhThuNap || d.smhKetThuNap) { let el = document.getElementById('smhfb-thunap'); if (!el) { el = document.createElement('textarea'); el.id = 'smhfb-thunap'; el.style.display = 'none'; document.body.appendChild(el); } el.value = JSON.stringify({ ban: PHIEN_BAN, kq: ketThuNap() }); }
  });
  // tự thử 1 lần khi rảnh (Máy Cao, tab chính, không đang chạy việc nào) — kiểm mỗi 2 phút, bắt đầu sau 3 phút từ lúc mở trang
  setTimeout(() => { setInterval(() => { try { if (laTabChinh() && !hdChay) chayThuNap(false); } catch (e) { /* */ } }, 120000); }, 60000);

  // =====================================================================
  //  KHỞI ĐỘNG
  // =====================================================================
  try { GM_registerMenuCommand('🔑 Cài mã khoá Facebook', () => { caiMaKhoa(); }); } catch (e) { /* */ }
  setInterval(() => { // chống treo: 1 lượt làm việc kẹt quá 20 phút → tải lại trang
    try {
      if (!dangChay || !nhipBatDau || Date.now() - nhipBatDau < 20 * 60000) return;
      if (Date.now() - baoTreo > 10 * 60000) { baoTreo = Date.now(); ghi('Lỗi: một lượt làm việc bị treo hơn 20 phút' + (lay('dang_do', null) ? ' (đang dở: ' + tenDangDo(lay('dang_do', null)).replace(/^Đang /, '') + ')' : '') + ' → tải lại trang để làm tiếp'); }
      if (document.visibilityState === 'visible' && !nhanSuDangDung() && !demNguoc) roiTrang();
    } catch (e) { /* */ }
  }, 30000);
  let demGiay = 0;
  setInterval(() => { // 1 giây: đếm ngược + thanh hoạt động + giữ quyền làm việc
    demGiay++;
    try { if (demGiay % 5 === 0 || document.visibilityState !== 'visible') giuKhoa(); } catch (e) { /* */ }
    if (document.visibilityState !== 'visible') return;
    try { capNhatDongHo(); if (demGiay % 5 === 0) veBang(); } catch (e) { /* */ }
  }, 1000);
  setInterval(() => { try { ganVe(); } catch (e) { /* */ } }, 1000);
  // (6.10) hộp nhắc của Facebook ("Lúc khác", "Để sau"…) hiện ra giữa lúc script đang soạn/đăng → tự bấm bỏ qua, không để treo
  const CHU_BO_QUA_FB = ['Lúc khác', 'Để sau', 'Không phải bây giờ', 'Không phải lúc này', 'Không, cảm ơn', 'Không cảm ơn', 'Để lúc khác', 'Đăng bài viết gốc', 'Đăng bài gốc', 'Tiếp tục đăng bài viết gốc']; // (6.11) "Bạn đang tổ chức sự kiện?" → chọn Đăng bài viết gốc (KHÔNG bấm Tiếp tục)
  let lucBoQuaFB = 0;
  setInterval(() => {
    try {
      if (!(dangBan || lay('dang_do', null))) return;
      if (Date.now() - lucBoQuaFB < 2500) return;
      const n = [...document.querySelectorAll('[role="button"],button')].find((b) => !b.closest('#smhfb,#smhfb-nho,#smhfb-soan-w,#smhfb-gan-w,#smhfb-gan-modal') && CHU_BO_QUA_FB.includes(chuan(b.innerText || b.getAttribute('aria-label') || '')) && b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden' && !b.closest('[aria-hidden="true"]'));
      if (!n) return;
      lucBoQuaFB = Date.now();
      const lop = n.closest('[role="dialog"],[role="alertdialog"],[aria-modal="true"]');
      ghi(`Facebook hiện hộp nhắc «${chuan(lop ? lop.innerText : '').slice(0, 90)}» → tự bấm "${chuan(n.innerText || n.getAttribute('aria-label'))}" để đăng tiếp`);
      try { ganBam(n); } catch (e) { n.click(); }
    } catch (e) { /* */ }
  }, 1000);
  // (6.15) BỘ CANH TREO: đang soạn/đăng (hộp soạn đang mở, chưa bấm Đăng) mà TREO_PHUT phút không có bước mới → dừng bước kẹt (script tự đóng hộp + tải lại + thử lại)
  setInterval(() => {
    try {
      if (!dangBan) { window.__smhTreoLuc = 0; window.__smhHuyLuot = 0; return; }
      if (lay('dang_do', null) || lay('cho_tay6', null) || demNguoc || !(hopSoanBai() || ganManHinh())) { window.__smhTreoLuc = 0; return; }
      const cuoi = Math.max(window.__smhGhiLuc || 0, (hdChay && hdChay.cap) || 0);
      const treo = Date.now() - cuoi;
      if (treo < CAI_DAT.TREO_PHUT * 60000) { window.__smhTreoLuc = 0; return; }
      const giuLai = () => { window.__smhGhiLuc = cuoi; if (hdChay) hdChay.cap = cuoi; }; // lời ghi của bộ canh treo không tính là "có bước mới"
      if (!window.__smhTreoLuc) {
        window.__smhTreoLuc = Date.now();
        ghi(`Bộ canh treo: ${Math.round(treo / 60000)} phút không có bước mới (bước cuối: «${String(window.__smhGhiCuoi || '').slice(0, 90)}») → dừng bước đang kẹt, đóng hộp, tải lại trang rồi thử lại`);
        try { chupLoi('kẹt'); tuChupHienTruong('Bộ canh treo: kẹt ' + Math.round(treo / 60000) + ' phút ở bước «' + String(window.__smhGhiCuoi || '').slice(0, 90) + '»'); } catch (e) { /* */ }
        window.__smhHuyLuot = `kẹt ${Math.round(treo / 60000)} phút không có bước mới`; giuLai(); return;
      }
      if (Date.now() - window.__smhTreoLuc < 90000) return;
      // bước kẹt không nằm trong vòng chờ nào (script không tự dừng được) → ghi 1 lần thử rồi tải lại thẳng
      window.__smhTreoLuc = Date.now() + 10 * 60000;
      let ten = '';
      capNhatTT((s) => { for (const it of LICH) { const x = s.s[it.k]; if (x && x.tt === 'dang') { ten = it.ten; x.lan = (x.lan || 0) + 1; x.vong = x.vong || 1; x.loi = 'kẹt khi soạn/đăng'; x.tt = 'cho'; x.thuLai = Date.now() + 60000; if (x.lan >= CAI_DAT.SO_LAN_THU) { if (x.vong < CAI_DAT.SO_VONG_THU) { x.vong++; x.lan = 0; x.thuLai = Date.now() + CAI_DAT.NGHI_GIUA_VONG_PHUT * 60000; } else x.tt = 'loi'; } } } });
      ghi(`Bộ canh treo: ${ten || 'việc đang làm'} vẫn kẹt → tải lại trang ngay (tính 1 lần thử)`);
      roiTrang();
    } catch (e) { /* */ }
  }, 15000);
  // (6.15) Facebook báo lỗi / trắng trang liên tục 30 giây → tải lại; 3 lần trong 30 phút → nghỉ 10 phút rồi tải lại (có báo nhóm)
  { let thayLoi = 0;
    setInterval(() => {
      try {
        if (!MAY || !laTabChinh() || dangBan || document.visibilityState !== 'visible' || !/(^|\.)facebook\.com$/.test(location.hostname) || performance.now() < 40000) return;
        if (lay('nghi_loi6', 0) > Date.now()) return;
        let tx = ''; for (const c of Array.from(document.body ? document.body.children : [])) { if (/^smhfb/.test(c.id || '') || c.tagName === 'SCRIPT' || c.tagName === 'STYLE') continue; tx += (c.innerText || '') + '\n'; if (tx.length > 4000) break; }
        const main = document.querySelector('[role="main"]');
        const coLoi = /Đã xảy ra lỗi|Có lỗi xảy ra|Rất tiếc, đã xảy ra sự cố|Something went wrong|Bạn đang ngoại tuyến|Không có kết nối Internet|You're offline|Trang này hiện không hiển thị|This page isn't available/i.test(tx.slice(0, 4000)) && (!main || String(main.innerText || '').length < 400);
        const trang = tx.trim().length < 30;
        if (!coLoi && !trang) { thayLoi = 0; return; }
        if (++thayLoi < 3) return;
        thayLoi = 0;
        const n0 = lay('loi_trang6', null); const n = (n0 && Date.now() - n0.luc < 30 * 60000 ? n0.n : 0) + 1;
        luu('loi_trang6', { n: n >= 3 ? 0 : n, luc: Date.now() });
        if (n >= 3) {
          luu('nghi_loi6', Date.now() + 10 * 60000);
          ghi(`Facebook báo lỗi / trắng trang ${n} lần liền → nghỉ 10 phút rồi tải lại`);
          baoLoi(`⚠️ Trang Facebook trên ${TEN_MAY} báo lỗi / trắng trang ${n} lần liền (${coLoi ? 'có chữ báo lỗi' : 'trang trắng'}) → script nghỉ 10 phút rồi tải lại. Nếu vẫn vậy cần kiểm tra mạng hoặc đăng nhập Facebook.`, 'loitrang');
          setTimeout(() => { if (!dangBan) roiTrang(CAI_DAT.URL_TRANG); }, 10 * 60000);
          return;
        }
        ghi(`Trang Facebook đang ${coLoi ? 'báo lỗi' : 'trắng'} (lần ${n}) → chờ 30 giây đã qua, tải lại trang`);
        if (!demNguoc) batDemNguoc(`tải lại trang (Facebook đang ${coLoi ? 'báo lỗi' : 'trắng'})`).then((kq) => { if (kq === 'ok') roiTrang(); else ghi('Bạn bấm Hoãn → chưa tải lại trang'); });
      } catch (e) { /* */ }
    }, 10000);
  }
  // (6.15) TỰ KIỂM TRA BUỔI SÁNG (từ 6h, trước Bài 1; máy mở muộn thì kiểm lúc mở): mã khoá Facebook, đọc Lark, đúng trang, có ô soạn bài → hỏng gì báo ngay
  { let dangKiem = false;
    setInterval(async () => {
      try {
        if (dangKiem || dangChay || !MAY || !laTabChinh() || dangBan || lay('dang_do', null)) return;
        const mm = phutTrongNgay(new Date()); if (mm < 360 || mm > docGio(CAI_DAT.GIO_CHOT)) return;
        const sk0 = lay('sk6', null); if (sk0 && sk0.ngay === homNay() && sk0.xong) return;
        if (document.visibilityState !== 'visible' || performance.now() < 30000) return;
        dangKiem = true; const loi = []; let boQuaLuot = false;
        await theoDoi('suckhoe', async () => {
        if (!coApi()) loi.push('chưa cài mã khoá Facebook (script không hỏi được bài đã lên chưa)');
        else { try { await baiTrenTrangApi(Date.now() - 3600e3); } catch (e) { loi.push('mã khoá Facebook không dùng được (' + String(e.message).slice(0, 60) + ') — cần đổi mã mới'); } }
        const d = duLieu();
        if (!d || !d.ngay || !d.ngay[homNay()]) { try { await docDuLieu('suckhoe'); } catch (e) { loi.push('không đọc được Lark sheet (' + String(e.message).slice(0, 60) + ')'); } }
        if (dungTrang() && !hopSoanBai() && !ganManHinh()) {
          if (!timNutSoanBai() && !Array.from(document.querySelectorAll('[role="button"]')).some((b) => chuan(b.innerText) === 'Ảnh/video')) {
            if (!window.__skThieuO || Date.now() - window.__skThieuO < 180000) { window.__skThieuO = window.__skThieuO || Date.now(); boQuaLuot = true; return; } // trang có thể đang tải / đang lỗi: 3 phút sau vẫn không thấy mới báo
            loi.push('trên trang không thấy ô "Bạn đang nghĩ gì?" (có thể bị đăng xuất hoặc Facebook đổi giao diện)');
          } else window.__skThieuO = 0;
        }
        if (!coBiMat()) loi.push('máy này chưa có mã bí mật (mã Lark) — script chưa đọc/ghi được Lark sheet');
        });
        if (boQuaLuot) return;
        luu('sk6', { ngay: homNay(), luc: Date.now(), xong: true, loi });
        if (loi.length) { ghi('Tự kiểm tra sáng: ' + loi.join(' · ')); thongBaoMay('Tự kiểm tra sáng phát hiện lỗi', loi.join(' · ')); await baoLoi(`🩺 Tự kiểm tra sáng ${TEN_MAY}: ${loi.join(' · ')} — cần xử lý trước giờ đăng`, 'suckhoe'); }
        else ghi('Tự kiểm tra sáng: mã khoá Facebook, Lark sheet, trang và ô soạn bài đều ổn');
        veBang();
      } catch (e) { /* */ } finally { dangKiem = false; }
    }, 60000);
  }
  // (6.10) ghi mọi lỗi ngầm của script vào nhật ký để dễ kiểm tra
  { const daGhi = {};
    const ghiLoiNgam = (msg) => { try { const k = String(msg).slice(0, 120); if (daGhi[k] && Date.now() - daGhi[k] < 10 * 60000) return; daGhi[k] = Date.now(); ghi('Lỗi ngầm trong script: ' + k); } catch (e) { /* */ } };
    window.addEventListener('error', (e) => { if (e && e.filename && !/userscript|tampermonkey|smh/i.test(e.filename + (e.error && e.error.stack || ''))) return; ghiLoiNgam((e && e.message) || 'lỗi'); });
    window.addEventListener('unhandledrejection', (e) => { const r = e && e.reason; const st = (r && r.stack) || ''; if (st && !/userscript|tampermonkey|smh/i.test(st)) return; ghiLoiNgam((r && r.message) || String(r)); });
  }
  setInterval(nhip, 15000);
  setTimeout(nhip, 4000);
  if (MAY) trangThai(homNay()); // tạo sẵn giờ đăng hôm nay để hiện trên popup
  if (MAY) { // (6.9) bài bị bỏ vì 2 lỗi đã sửa (kiểm tên hộp soạn / nút hình thu nhỏ bị cuộn khuất) → đưa lại hàng chờ
    const dua = [];
    capNhatTT((s) => { for (const it of LICH) { const r = s.s[it.k]; if (r && ((['loi', 'cho'].includes(r.tt) && /không đứng tên|Chỉnh sửa hình thu nhỏ/.test(r.loi || '')) || (r.tt === 'loi' && lay('datlai_' + PHIEN_BAN, '') !== homNay()))) { Object.assign(r, { tt: 'cho', lan: 0, loi: '', thuLai: 0, lyDo: '' }); dua.push(it.ten); } } });
    luu('datlai_' + PHIEN_BAN, homNay());
    if (dua.length) ghi(`Bản ${PHIEN_BAN}: đưa lại hàng chờ các bài đang lỗi hôm nay để thử lại theo cách mới: ${dua.join(', ')}`);
  }
  veBang();
  { let kieu = ''; try { const nv = performance.getEntriesByType('navigation')[0]; kieu = nv ? ({ reload: 'tải lại', navigate: 'mở trang', back_forward: 'quay lại' }[nv.type] || nv.type) : ''; } catch (e) { /* */ }
    ghi(`Khởi động bản ${PHIEN_BAN} (${TEN_MAY}) · ${location.pathname.slice(0, 40)}${kieu ? ' · ' + kieu : ''}`); }
})();
