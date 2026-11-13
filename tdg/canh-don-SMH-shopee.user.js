// ==UserScript==
// @name         Canh đơn SMH 🟠
// @namespace    sonmochuong
// @version      9.6
// @description  Canh đơn Shopee Sơn Mộc Hương → Lark: đơn hoả tốc (nhóm Hoả tốc) + đơn thường sắp quá hạn bàn giao + đơn chưa in nhãn (nhóm Quá hạn) + báo lỗi (nhóm Hệ thống), điểm danh Healthchecks
// @match        https://banhang.shopee.vn/*
// @match        https://accounts.shopee.vn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @connect      open.larksuite.com
// @connect      hc-ping.com
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// @noframes
// @updateURL    https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/canh-don-SMH-shopee.user.js
// @downloadURL  https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/canh-don-SMH-shopee.user.js
// ==/UserScript==

/* ============================================================================
   BẢN DÀNH CHO PROFILE "CANH ĐƠN HOẢ TỐC 1"  —  shop Shopee SƠN MỘC HƯƠNG
   Dán nguyên file này vào Tampermonkey, KHÔNG cần sửa gì.

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 9.5 (13/11/2026)
   - NHẮC SIZE 108 HẠT 8LI: đơn có món "108 … 8li" -> tự gửi 1 tin nhắc khách kiểm tra cổ tay qua khung
     chat của sàn (script thao tác như người gõ, trong 1 tab nền tự mở rồi tự đóng). Mỗi đơn 1 lần, tối đa
     20 tin/ngày, chạy cả ban đêm. Hỏng 2 lần -> báo nhóm Cao hệ thống kèm câu mẫu để nhắn tay.
   - Nút ✏ Tin nhắc dưới ô trạng thái: sửa câu tin (giữ khi cài bản mới), xem số tin đã gửi; mở trang chi
     tiết 1 đơn rồi bấm "🧪 Gửi thử" để gửi thật câu này cho khách đơn đó.
   - Trang chat Shopee phải dùng được "Chế độ Chăm sóc Khách hàng": script tự chuyển nếu đang ở Giám sát.

   MỚI Ở BẢN 9.4.4 (07/11/2026)
   - Tin ✅ / ❌ hoả tốc ghi đủ: "✅ Đã xử lý trong 2 phút · <hàng>" / "<mã> · SPX Instant · hoả tốc · THHX 🟠";
     "❌ Đã huỷ · <hàng>" / "<mã> · <ĐVVC> · hoả tốc · <shop>".
   - SỬA LỖI: khách huỷ đơn hoả tốc bị báo nhầm "đã xử lý" (Shopee ghi trạng thái huỷ bằng số, script cũ
     không nhận ra). Nay nhận đúng đơn huỷ: chưa báo -> im lặng; đã báo -> tin "❌ Đã huỷ".
   - Đọc dữ liệu sàn hỏng: tự tải lại trang 2 lần (trước 1 lần), vẫn hỏng mới báo nhóm Hệ thống.
   - Hết lỗi: bỏ các tin lỗi còn kẹt chưa gửi (mất mạng / đăng xuất), chỉ gửi 1 tin "✅ đã canh lại · gián
     đoạn N phút (mất mạng / đăng xuất)"; không gửi trùng tin đã canh lại.
   - Nút 🔄 Tải lại trang: mất mạng thì bấm lần 2 trong 10 giây là tải lại luôn.

   MỚI Ở BẢN 9.4.3 (04/11/2026)
   - Mốc 11:30 "chưa quét": liệt kê TOÀN BỘ đơn đang chờ lấy hàng (để khớp số hộp, shipper bắn 1 lượt),
     mỗi hãng 1 tin, chia nhóm mỗi nhóm 1 dòng:
       Hạn 12h (7): mã, …  ·  Tồn từ hôm qua (1): mã  ·  Hạn trong ngày (8): mã, …
     Không có đơn quá hạn vẫn gửi, kèm dòng "Không có đơn quá hạn". Đơn "Hạn trong ngày" chưa tính
     là đã báo -> 20:00 còn chưa quét vẫn báo. Mỗi nhóm ghi tối đa 20 mã.

   MỚI Ở BẢN 9.4.2 (27/10/2026)
   - Mốc 11:30 "chưa quét": tính chung cả đơn 0:00–8:00 sáng (in lúc 8h cùng đơn tối qua); các mã
     này ghi sau cùng, kèm "(hạn trong ngày)". Mốc 10:00 "chưa xử lý" giữ như cũ.
   - Tin 🚚 gọn: "🚚 BEST có 7 đơn chưa quét THHX ⚫" / mã (tối đa 20 mã); BEST Express ghi "BEST" (hãng khác giữ nguyên), bỏ chữ
     hạn trên tiêu đề. CẦN bot nhóm Quá hạn có từ khoá "quét".

   MỚI Ở BẢN 9.4.1 (23/10/2026)
   - Quá hạn buổi chiều "🚚 ĐVVC chưa quét": chỉ báo 1 lần lúc 20:00 (bỏ 19:30 và 20:30),
     hạn quét cũng dời thành 20:00.

   MỚI Ở BẢN 9.4 (23/10/2026)
   - Hàng nút dưới ô: 🔄 Tải lại trang (to) + 📋 Xem nhật ký + ⬇ Tải nhật ký (file 7 ngày, đầu file có tóm tắt từng ngày).
   - Tin thử khi cài bản mới: chỉ 1 tin vào nhóm Cao hệ thống ("🧪 bản 9.4 · Hệ thống OK").

   MỚI Ở BẢN 9.3 (23/10/2026)
   - NHẬT KÝ 7 NGÀY: bấm CHUỘT PHẢI vào ô trạng thái -> hiện 50 dòng mới nhất + nút tải file .txt
     (7 ngày). Ghi: lỗi, mã lỗi, tự tải lại, tin Lark đã gửi / bị từ chối, mốc quá hạn, chưa in,
     đổi trạng thái ô; các vòng kiểm ổn thì mỗi giờ gộp 1 dòng tóm tắt.

   MỚI Ở BẢN 9.2 (22/10/2026)
   - Bị đăng xuất / mất phiên: báo nhóm Hệ thống NGAY sau vòng đầu (script không tự sửa được).
   - Thêm mốc 20:30 nhắc lại đơn ĐVVC chưa quét đã báo ở 19:30 ("🚚 GHN vẫn còn 2 đơn chưa quét").
   - Tin chưa in (Shopee): "🖨 Mục "Tạo phiếu" có 1 đơn SMH 🟠 chưa in" / mã — quá 15 phút là báo,
     bot nhóm Quá hạn đã thêm từ khoá "in".
   - Dán xong gửi lại tin 🧪 thử kết nối.

   MỚI Ở BẢN 9.1 (22/10/2026)
   - Ô trạng thái to 1,5 lần, luôn 2 dòng: dòng 2 "kiểm cách đây N giây" nhảy từng giây
     + mốc quá hạn kế + số chưa in. Ký hiệu ✔ ổn · 🔥 có đơn · ⚠ đang sửa · ✖ lỗi · ⏸ nghỉ
     (bỏ chấm tròn vì lẫn với 🟠/⚫ của sàn); tên tab dùng cùng bộ ký hiệu.
   - Shopee hỏi sàn 30 giây/lần (trước 60), tối thiểu 20 giây giữa 2 lần.
   - Lâu không có đơn: 14 ngày mới nhắc, nhắc lại 14 ngày/lần (trước 5 ngày, 24 giờ/lần).
   - Tin Lark: GẤP đổi 🚨, tên shop ghi "SMH 🟠"; "✅ … đã xử lý trong N phút" ghi đúng số
     phút từ lúc phát sinh. Nhóm Quá hạn đổi từ khoá bot thành "hạn", bỏ chữ "Quá hạn":
       ⏰ SMH 🟠 · 3 đơn chưa xử lý · hạn 12h / mã, mã, mã
       🚚 GHN có 3 đơn chưa quét · hạn 12h · SMH 🟠 / mã, mã (mỗi hãng 1 tin, SPX gửi cuối)
       🖨 GHN có 1 đơn chưa in · hạn in 15 phút · SMH 🟠 / mã (chỉ Shopee)
   - Mốc chiều 19:00 đổi thành 19:30. Chủ nhật im lặng cả phần chưa in.

   MỚI Ở BẢN 9.0 — GỘP SCRIPT "CẢNH BÁO ĐƠN QUÁ HẠN" VÀO ĐÂY (21/10/2026)
   - Tên script đổi thành "Canh đơn SMH 🟠". Phải TẮT/XOÁ 2 script cũ của shop này:
     "Cảnh báo đơn hoả tốc … SMH → Lark" và "Cảnh báo đơn quá hạn … SMH → Lark".
   - Phần quá hạn: 4 mốc 10h00/11h30/18h30/19h00, mỗi đơn báo 1 lần, chủ nhật im lặng,
     bỏ đơn "Đang Điều Phối ĐVVC"; thêm kiểm đơn đã xử lý mà chưa in nhãn quá 15 phút.
     Tin về nhóm Lark "Quá hạn" (từ khoá bot: Quá hạn). Giữ khoá bộ nhớ cũ nên không báo lại.
   - Tin Lark rút gọn, nhìn biểu tượng là biết: 🔥 đơn hoả tốc · ⛔ quá hạn hoả tốc · ❌ đã huỷ
     · ✅ đã xử lý/đã canh lại · ⏰ chưa xử lý · 🚚 ĐVVC chưa lấy · 🖨 chưa in · ❌ lỗi hệ thống.
     Tên shop ghi ngắn "SMH 🟠" (Shopee) / "SMH ⚫" (TikTok). Thẻ GẤP giữ nguyên.
   - Ô trạng thái nhỏ bằng nửa, bấm giữ kéo được (tải lại trang về giữa trên):
     🟢 SMH 🟠 · đang canh / 🔥 2 đơn · SMH 🟠 / 🔴 đăng xuất · SMH 🟠 / 🟡 khi đang tự sửa.
   - Bỏ báo cáo cuối ngày. Lark từ chối tin 3 lần -> báo nhóm Hệ thống (1 lần/ngày).
   - Sau khi cài: gửi 1 tin thử vào nhóm Quá hạn và 1 tin nghiệm thu vào nhóm Hệ thống
     (KHÔNG gửi gì vào nhóm Hoả tốc).
   MỚI Ở BẢN 8.3 (phương án B)
   1. Ô trạng thái mới: giữa phía trên, tự phóng theo bề rộng cửa sổ (thu
      trang 33% vẫn đọc được), chớp theo nhịp của chính script (đứng yên =
      script đã đứng), 5 màu: xanh canh / cam có đơn / đỏ lỗi / vàng đang tự
      sửa / xám ngoài giờ. Tên tab có 🟢🔴🟡🔥⚪ ở đầu.
   2. Báo nhóm Hệ thống NGAY khi script đã tự tải lại mà vẫn hỏng, hoặc bị
      đăng xuất (không chờ 15 phút như trước).
   3. Sau 21h gửi 1 tin thống kê trong ngày: số lượt OK, lỗi, tự tải lại,
      đăng xuất, số đơn — để biết tab nào hay bệnh.

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 8.2
   1. Đơn hoả tốc báo sau 1 PHÚT kể từ khi phát sinh (trước là treo 5 phút).
   2. Đơn được xử lý xong ngay trong lúc treo -> thay tin báo đơn bằng 1 tin:
        ĐÃ XỬ LÝ trong vòng 1 phút (1 đơn hoả tốc SMH Shopee: DÂY DÙ ĐEO CỔ SMH x1 | 261001F5D510MG (SPX Instant))
      Kể cả đơn xử lý nhanh tới mức script chưa kịp thấy (đọc thêm danh sách
      "Đã xử lý" mỗi lần kiểm tra). Khách huỷ trong lúc treo vẫn im lặng.
   3. Đơn đã xử lý nhưng tài xế huỷ / sàn đang TÌM LẠI TÀI XẾ (Shopee đưa đơn
      về lại "Chưa xử lý") -> KHÔNG báo GẤP / QUÁ HẠN, và không báo lại như
      đơn mới.

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 8.1
   1. Tin báo đơn có thêm đơn vị vận chuyển, 2 dòng:
        1 đơn hoả tốc SMH Shopee: DÂY DÙ ĐEO CỔ SMH x1
        09:33 - 01/10/2026 - 261001F5D510MG (SPX Instant)
      Tin "ĐÃ HUỶ" giữ nguyên mẫu đã chốt.
   2. BỎ tin tóm tắt cuối ngày: tự tải lại mà chạy lại được thì im lặng hẳn.
      Chỉ báo khi tự sửa KHÔNG được (3 lần/giờ vẫn hỏng).
   3. Mỗi lần đọc tối đa 50 đơn hoả tốc chờ xử lý (trước là 20).

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 8.0 — LỚP TỰ KIỂM & TỰ PHỤC HỒI (chạy thử bằng mô phỏng trước khi giao)
   1. SỬA LỖI GỐC "trang vẫn hiện bình thường mà script không chạy, phải F5":
      một lần gọi sàn bị treo (không bao giờ trả lời) làm vòng kiểm tra đứng
      mãi -> ngừng điểm danh (Healthchecks báo NGỪNG) và NGỪNG CANH ĐƠN. Nay
      mọi lần gọi sàn có hạn chót 25 giây.
   2. Lớp tự kiểm chạy riêng, mỗi phút soát 1 lượt; thấy script đứng / không
      điểm danh được thì TỰ tải lại trang trước khi Healthchecks kịp báo.
      Tối đa 3 lần/giờ; quá thì báo nhóm Hệ thống. Không bao giờ tự tải lại
      lúc máy mất mạng (tránh ra trang lỗi, script chết hẳn).
   3. Gửi Lark: có hạn chót riêng (không còn kẹt mãi), tin bị Lark từ chối
      không còn chặn các tin đơn phía sau.
   4. Chỉ MỘT tab canh cho mỗi shop — lỡ mở thêm tab cũng không hỏi sàn gấp
      đôi, không báo trùng.
   5. SỬA LỖI tin "ĐÃ HUỶ" của Shopee không bao giờ gửi (tra nhầm mã kiện).
   6. Tự làm mới trang mỗi 2–3 tiếng; hết giờ canh gửi 1 tin tóm tắt các
      lần tự sửa trong ngày (chỉ khi có).

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 7.1 — gọn lại: bỏ nhật ký lỗi không ai đọc được, bỏ nhánh chết,
   gộp hai danh sách theo dõi đơn làm một, thêm @Tất cả vào tin GẤP còn hạn.

   TỪ BẢN 7.0
   ---------------------------------------------------------------------------
   1. TIN BÁO ĐƠN ĐỔI SANG 3 DÒNG, MỖI ĐƠN MỘT TIN RIÊNG
        1 đơn hoả tốc SMH Shopee
        TRÒN ĐƠN CHUẨN LU TRẮNG 8li SMH x1
        14:30 - 17/09/2026 - 2609179JSJFQ84
   2. ĐIỂM DANH VỚI HEALTHCHECKS mỗi vòng, để khi máy tắt / Chrome chết /
      đứt mạng thì Healthchecks bắn tin vào nhóm thay cho script.
   3. SỬA LỖI: mất phiên đăng nhập trước đây không đặt cờ báo lỗi, nên đăng
      nhập lại xong KHÔNG có tin "đã canh lại bình thường". Nay có.
   4. CẢNH BÁO IM LẶNG BẤT THƯỜNG: 5 ngày không thấy đơn nào thì nhắc đi đối
      chiếu tay — đề phòng sàn đổi mã bộ lọc làm script mù mà không báo lỗi.
   5. CẢNH BÁO LỆCH ĐỒNG HỒ: máy lệch quá 10 phút so với giờ máy chủ sàn thì
      báo, vì toàn bộ phép tính hạn 1h30 dựa vào đồng hồ máy.
   6. Ô góc màn hình hiện thêm "đơn gần nhất <ngày giờ>".
   7. Khung giờ canh 7h45–21h.
   8. Mọi tin KHÔNG phải báo đơn đều mở đầu bằng "(Thông báo hệ thống)".
      Riêng tin GẤP giữ nguyên vì nó là tin về đơn, không phải tin máy móc.
   ============================================================================ */

(function () {
  'use strict';

  /* ==========================================================================
     PHẦN CẤU HÌNH
     ========================================================================== */

  // Bản 9.6: link bí mật (nhóm Lark, Healthchecks) KHÔNG nằm trong bản GitHub.
  // Bản cài tay có sẵn link -> cất vào máy; các bản tự cập nhật sau dùng link đã cất.
  const BI_MAT_GOC = {};
  const BI_MAT = (function () {
    let m = {}; try { m = JSON.parse(GM_getValue('bi_mat_lark', '{}') || '{}') || {}; } catch (e) { m = {}; }
    let doi = false;
    for (const k in BI_MAT_GOC) { if (BI_MAT_GOC[k] && m[k] !== BI_MAT_GOC[k]) { m[k] = BI_MAT_GOC[k]; doi = true; } }
    if (doi) { try { GM_setValue('bi_mat_lark', JSON.stringify(m)); } catch (e) {} }
    return m;
  })();

  const CAU_HINH = {
    WEBHOOK_URL: BI_MAT.WEBHOOK_URL || '',

    // >>> WEBHOOK NHÓM "CẢNH BÁO HỆ THỐNG" <<<
    // Mọi tin [Hệ thống] đi về đây, nhóm Hoả tốc chỉ còn tin báo đơn.
    // Bot của nhóm này đặt từ khoá: Hệ thống
    WEBHOOK_URL_HE_THONG: BI_MAT.WEBHOOK_URL_HE_THONG || '',

    // >>> WEBHOOK NHÓM "QUÁ HẠN" (bản 9.0/6.0: gộp từ script "Cảnh báo đơn quá hạn") <<<
    // Bot nhóm này đặt từ khoá: Hạn / hạn
    WEBHOOK_URL_QUA_HAN: BI_MAT.WEBHOOK_URL_QUA_HAN || '',
    TU_KHOA_BAT_BUOC_QUA_HAN: 'hạn',   // bản 9.1/6.1: bot đặt "Hạn"/"hạn"; mọi tin đều có "hạn …"

    // ===== PHẦN QUÁ HẠN: 4 mốc trong ngày, mỗi đơn báo đúng 1 lần, chủ nhật im lặng =====
    QUA_HAN: {
      BAT: true,
      MOC: [
        { gio: 10, phut: 0,  loai: 'xuly',    han: 'hạn 12h' },
        { gio: 11, phut: 30, loai: 'bangiao', han: 'hạn 12h', tatCa: true },   // bản 9.4.3: toàn bộ đơn chờ lấy hàng, chia nhóm
        { gio: 18, phut: 30, loai: 'xuly',    han: 'hạn hôm nay' },
        { gio: 20, phut: 0,  loai: 'bangiao', han: 'hạn hôm nay' },   // bản 9.4.1: chỉ 1 lần lúc 20:00 (bỏ 19:30 + 20:30)
      ],
      BO_CHU_NHAT: true,
      NHIP_KIEM_GIAY: 120,
      SO_LAN_THU_LAI: 2,
      CHO_THU_LAI_GIAY: 8,
      PHUT_KIEN_NHAN_KHI_LOI: 60,   // mốc lỗi liên tục bấy nhiêu phút mới báo nhóm Hệ thống
      SO_MA_TOI_DA: 10,             // ghi tối đa bấy nhiêu mã đơn (dòng nhỏ), còn lại "…"
      SO_MA_TOI_DA_QUET: 20,        // bản 9.4.2: tin 🚚 chưa quét ghi tối đa 20 mã
    },

    // Đường điểm danh Healthchecks của ĐÚNG mục "SMH Shopee"
    PING_URL: BI_MAT.PING_URL || '',

    // >>> TÊN SHOP CỦA PROFILE NÀY <<<
    VIET_TAT: 'SMH',
    TEN_SAN: 'Shopee',

    // ===== TIN BÁO ĐƠN — mỗi đơn một tin riêng =====
    //   1 đơn hoả tốc SMH Shopee: TRÒN ĐƠN CHUẨN LU TRẮNG 8li SMH x1
    //   14:30 - 17/09/2026 - 2609179JSJFQ84 (SPX Instant)
    // {dvvc} = tên đơn vị vận chuyển trong ngoặc; sàn chưa có tên thì tự bỏ trống
    MAU_TIN: '{n} đơn hoả tốc {ten}: {hang}\n{moc}{dvvc}',
    CHUA_DOC_DUOC_HANG: '(chưa đọc được mặt hàng — mở Kênh Người Bán xem)',

    NGAN_CACH_HANG: ', ',
    DO_DAI_TOI_DA_TEN: 40,

    BO_QUA_HANG_0D: true,
    XEP_THEO_GIA_GIAM: true,

    // ===== CẢNH BÁO GẤP =====
    BAT_CANH_BAO_GAP: true,
    SLA_PHUT: 90,
    GIO_SLA_BAT_DAU: 8,
    GIO_SLA_KET_THUC: 18,
    GIO_HAN_DEM: 9,
    PHUT_HAN_DEM: 30,
    CANH_BAO_TRUOC_PHUT: 15,
    BO_GAP_KHI_HAN_CHU_NHAT: true,
    NGAY_NGHI: [], // ngày lễ muốn tắt GẤP, dạng 'dd/mm'. Để trống = vẫn báo như ngày thường
    // Chỉ tin GẤP còn hạn mới gọi @Tất cả để điện thoại nhân sự kêu.
    // Tin QUÁ HẠN cố tình KHÔNG gọi: lúc đó chỉ số đã mất, đánh thức cả nhóm
    // không cứu được gì mà chỉ làm người ta quen bị gọi vô ích rồi tắt tiếng.
    MAU_TIN_GAP: '(GẤP) {ma} {ten} chỉ còn {phut} phút để xử lý đơn hoả tốc'
      + ' <at user_id="all">Tất cả</at>',
    MAU_TIN_QUA_HAN: '(GẤP) {ma} {ten} ĐÃ QUÁ HẠN xử lý đơn hoả tốc',

    // ===== GIỮ ĐƠN TRƯỚC KHI BÁO =====
    // Đơn mới phát hiện phải "treo" đủ bấy nhiêu phút TÍNH TỪ GIỜ PHÁT SINH
    // ĐƠN mới được báo vào nhóm. Khách đặt xong huỷ ngay trong lúc treo thì
    // im lặng bỏ qua, không có tin nào cả — đỡ báo hớ những đơn chưa kịp
    // xử lý đã bị huỷ.
    PHUT_GIU_TRUOC_KHI_BAO: 1,
    // Đơn được xử lý XONG ngay trong lúc treo (trước khi kịp báo nhóm) thì
    // thay tin báo đơn bằng 1 tin này. Khách huỷ trong lúc treo thì vẫn im lặng.
    MAU_TIN_DA_XU_LY: 'ĐÃ XỬ LÝ trong vòng {phut} phút ({n} đơn hoả tốc {ten}: {hang} | {ma}{dvvc})',
    // Đơn ĐÃ báo vào nhóm rồi mới biến mất khỏi danh sách chờ xử lý — kiểm
    // tra lại, nếu đúng là khách huỷ thì báo thêm tin nhắc lại đúng tin đơn
    // đó, có chữ ĐÃ HUỶ ở đầu (xem hàm tinDaHuy bên dưới).

    // ===== KHUNG GIỜ CANH: 7h45 -> 21h00 =====
    GIO_BAT_DAU: 7, PHUT_BAT_DAU: 45,
    GIO_KET_THUC: 21, PHUT_KET_THUC: 0,
    NGAY_TRONG_TUAN: null, // null = mọi ngày, kể cả Chủ nhật

    CHU_KY_GIAY: 30,              // bản 9.1: gấp đôi (Shopee chịu được)
    CHU_KY_DAO_DONG_GIAY: 5,
    NHAC_DANG_XUAT_PHUT: 30,
    // Khoảng cách TỐI THIỂU giữa hai lần kiểm tra thật. Chuyển tab hay có mạng
    // lại đều gọi kiểm tra thêm; không chặn thì các lần gọi đó dồn sát nhau,
    // vừa tốn request với sàn vừa làm bộ đếm lỗi nhảy vọt trong vài giây.
    NHIP_TOI_THIEU_GIAY: 20,

    // ===== CHỐNG BÁO ĐỘNG GIẢ =====
    SO_LAN_THU_LAI: 2,
    CHO_THU_LAI_GIAY: 6,
    LOI_LIEN_TIEP_TAI_LAI: 3,
    GIAN_CACH_TAI_LAI_PHUT: 15,
    LOI_LIEN_TIEP_BAO: 5,
    // MỘT QUY TẮC CHUNG CHO MỌI TIN (Thông báo hệ thống): sự cố phải kéo dài
    // liên tục đủ bấy nhiêu phút mới được bắn tin vào nhóm. Nhóm này chủ yếu
    // để báo đơn — trục trặc thoáng qua thì script tự lo, không làm phiền ai.
    PHUT_TRUOC_KHI_BAO: 15,
    BAO_KHI_PHUC_HOI: true,

    // ===== HAI LỚP TỰ KIỂM =====
    BAT_CANH_BAO_IM_LANG: true,
    SO_NGAY_IM_LANG: 14,        // bấy nhiêu ngày không thấy đơn nào thì nhắc
    BAT_KIEM_LECH_GIO: true,
    LECH_GIO_TOI_DA_PHUT: 10,  // lệch quá bấy nhiêu phút thì báo


    HIEN_THI_TREN_TRANG: true,
    CO_CHU_O_TRANG_THAI: 18,   // cỡ gốc; ô tự phóng theo bề rộng cửa sổ nên thu trang 33% vẫn đọc được
    BAO_CAO_CUOI_NGAY: false,  // bản 9.0: Cao bỏ báo cáo ngày   // sau 21h gửi 1 tin thống kê trong ngày (số lượt OK/lỗi/tự tải lại…)
    NHAP_NHAY_KHI_CO_DON: true,

    // ===== TỰ KIỂM & TỰ PHỤC HỒI =====
    // Lớp này chạy RIÊNG với vòng kiểm tra đơn, mỗi phút tự soát 1 lượt. Thấy
    // script "đứng" thì tự tải lại trang (như bấm F5) — TRƯỚC khi Healthchecks
    // kịp báo "NGỪNG hoạt động" (Healthchecks báo sau 15 phút).
    HAN_GOI_MANG_GIAY: 25,          // gọi sàn quá bấy nhiêu giây chưa trả lời = coi như hỏng
    HAN_GUI_LARK_GIAY: 30,          // gửi Lark quá bấy nhiêu giây chưa xong = coi như hỏng
    TREO_VONG_PHUT: 4,              // vòng kiểm tra đứng im quá bấy nhiêu phút = bị treo
    NGUNG_VONG_PHUT: 8,             // quá bấy nhiêu phút không có vòng nào chạy xong = ngừng
    MAT_DIEM_DANH_PHUT: 9,          // quá bấy nhiêu phút Healthchecks không nhận điểm danh
    TU_TAI_LAI_TOI_DA_MOI_GIO: 3,   // tự tải lại tối đa bấy nhiêu lần/giờ, quá thì gọi người
    GIU_TAB_CHINH_GIAY: 180,        // tab chính im quá bấy nhiêu giây thì tab khác canh thay
    // Tự làm mới trang mỗi khoảng ngẫu nhiên (phút) trong giờ canh — dọn bộ
    // nhớ trang sau nhiều giờ chạy liền, giữ phiên đăng nhập tươi.
    LAM_MOI_TRANG_PHUT_MIN: 120,
    LAM_MOI_TRANG_PHUT_MAX: 180,
    TIEN_TO_HE_THONG: '[Hệ thống] ',
    // Tên hệ thống này, in ngay sau [Hệ thống]. Sau này nhiều hệ thống cùng báo
    // về một nhóm thì nhân sự nhìn dòng đầu là biết phải đi xử lý ở đâu.
    TEN_HE_THONG: 'Canh đơn hoả tốc',
    // Tin gửi vào Lark dạng THẺ màu (mẫu C). Đặt false để quay về tin chữ như cũ.
    GUI_DANG_THE: true,
    TU_KHOA_BAT_BUOC: 'hoả tốc',
    // Từ khoá bắt buộc của bot trong nhóm "Cảnh báo hệ thống". Mọi tin hệ thống
    // đều mở đầu bằng "[Hệ thống]" nên chỉ cần đặt đúng hai chữ này bên Lark.
    TU_KHOA_BAT_BUOC_HE_THONG: 'Hệ thống',
  };

  /* ==========================================================================
     TỪ ĐÂY TRỞ XUỐNG KHÔNG CẦN SỬA
     ========================================================================== */

  const KEY = 'shopee_hoatoc_state_' + CAU_HINH.VIET_TAT;
  const KEY_HANG_CHO = 'shopee_hoatoc_hangcho_' + CAU_HINH.VIET_TAT;
  const KEY_TAB_CHINH = KEY + '_tabchinh';   // tab nào đang canh
  const KEY_TU_SUA = KEY + '_tusua';         // sổ các lần tự tải lại
  const GOC = 'https://banhang.shopee.vn';
  const TRANG_DON = '/portal/sale/order?type=toship&source=to_process&sort_by=ship_by_date_asc';

  const TAB_CHO_LAY_HANG = 300;    // order_list_tab
  const LOAI_HOA_TOC = 3;          // entity_type = Đơn Hoả Tốc
  const TRANG_THAI_CHUA_XU_LY = 1; // order_to_ship_status = Chưa xử lý
  const TRANG_THAI_DA_XU_LY = 2;   // order_to_ship_status = Đã xử lý

  const TEN = CAU_HINH.VIET_TAT + ' ' + CAU_HINH.TEN_SAN;
  const TEN_NGAN = CAU_HINH.VIET_TAT + ' 🟠';   // bản 9.0: tên ngắn trong tin Lark và ô trạng thái
  const PHIEN_BAN = '9.6';
  const logGoc = (...a) => console.log('%c[hoả tốc ' + TEN + ']', 'color:#f60;font-weight:bold', ...a);
  const log = (...a) => { logGoc(...a); try { nkGhiLog(a); } catch (e) {} };   // bản 9.3: kèm nhật ký 7 ngày
  const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
  const hai = (n) => (n < 10 ? '0' : '') + n;

  // ---------- NHẬT KÝ 7 NGÀY (bản 9.3) ----------
  // Ghi sự kiện (lỗi, tự tải lại, tin Lark, mốc quá hạn, đổi trạng thái ô) + mỗi giờ 1 dòng tóm tắt
  // các vòng kiểm ổn. Lưu ở bộ nhớ riêng của Tampermonkey (không chiếm bộ nhớ trang), giữ 7 ngày.
  // Xem: bấm CHUỘT PHẢI vào ô trạng thái.
  var NK = { cho: [], dem: null, donCuoi: null, oCuoi: '', henGhi: 0 };
  const NK_KHOA = 'nhatky_7ngay_' + CAU_HINH.VIET_TAT;
  const NK_GIU_MS = 7 * 86400000;
  const NK_TOI_DA_KY_TU = 2500000;
  function nkGio(t) {
    const d = new Date(t);
    return hai(d.getDate()) + '/' + hai(d.getMonth() + 1) + ' ' + hai(d.getHours()) + ':' + hai(d.getMinutes()) + ':' + hai(d.getSeconds());
  }
  function nkChuoi(a) {
    return a.map(function (x) {
      if (typeof x === 'string') return x;
      if (x instanceof Error) return 'Lỗi: ' + x.message;
      try { return JSON.stringify(x); } catch (e) { return String(x); }
    }).join(' ')
      // không bao giờ ghi địa chỉ webhook / điểm danh vào nhật ký
      .replace(/https?:\/\/[^\s"']+/g, function (u) { return /lark|hc-ping|hook/i.test(u) ? '[địa chỉ ẩn]' : u.replace(/\?.*$/, '?…'); })
      .slice(0, 600);
  }
  function nkGet() {
    try {
      const v = (typeof GM_getValue === 'function') ? GM_getValue(NK_KHOA, '') : localStorage.getItem(NK_KHOA);
      const o = v ? (typeof v === 'string' ? JSON.parse(v) : v) : null;
      return (o && Array.isArray(o.ds)) ? o : { ds: [] };
    } catch (e) { return { ds: [] }; }
  }
  function nkSet(o) {
    const v = JSON.stringify(o);
    if (typeof GM_setValue === 'function') GM_setValue(NK_KHOA, v); else localStorage.setItem(NK_KHOA, v);
  }
  function nkLuu() {
    clearTimeout(NK.henGhi); NK.henGhi = 0;
    try {
      const o = nkGet(), cat = Date.now() - NK_GIU_MS;
      const ds = o.ds.concat(NK.cho).filter(function (x) { return x && x[0] >= cat; });
      let tong = 0;
      for (const x of ds) tong += String(x[1]).length + 20;
      while (tong > NK_TOI_DA_KY_TU && ds.length) { tong -= String(ds[0][1]).length + 20; ds.shift(); }
      nkSet({ ds: ds, dem: NK.dem });
      NK.cho = [];
    } catch (e) { try { console.log('[nhật ký] không ghi được', e); } catch (x) {} }
  }
  function nkDemGio(now) {
    const g = new Date(now);
    const khoa = g.getFullYear() * 1000000 + (g.getMonth() + 1) * 10000 + g.getDate() * 100 + g.getHours();
    if (!NK.dem) { NK.dem = { khoa: khoa, ok: 0, loi: 0 }; return; }
    if (NK.dem.khoa !== khoa) {
      const d = NK.dem, h = d.khoa % 100;
      if (d.ok || d.loi) NK.cho.push([now, '⏱ tóm tắt ' + hai(h) + ':00–' + hai((h + 1) % 24) + ':00 · ' + d.ok + ' vòng kiểm ổn · ' + d.loi + ' vòng lỗi']);
      if (!NK.henGhi) NK.henGhi = setTimeout(nkLuu, 15000);
      NK.dem = { khoa: khoa, ok: 0, loi: 0 };
    }
  }
  function nkThem(s) {
    const now = Date.now();
    nkDemGio(now);
    NK.cho.push([now, String(s)]);
    if (!NK.henGhi) NK.henGhi = setTimeout(nkLuu, 15000);
  }
  // Mọi dòng log() đều qua đây: dòng lặp lại mỗi vòng thì chỉ đếm, còn lại ghi nguyên
  function nkGhiLog(a) {
    const s = nkChuoi(a);
    if (/^(vòng trước chưa xong|vừa kiểm tra xong)/.test(s)) return;
    let m;
    if ((m = /^đơn hoả tốc (?:cần gửi|chưa xử lý): (\d+) \| đơn mới: (\d+)/.exec(s))) {
      nkDemGio(Date.now()); NK.dem.ok++;
      if (m[1] === NK.donCuoi && m[2] === '0') return;   // không đổi gì -> chỉ đếm vào tóm tắt giờ
      NK.donCuoi = m[1];
    }
    if (/^lỗi:/.test(s)) { nkDemGio(Date.now()); NK.dem.loi++; }
    nkThem(s);
  }
  // Ô trạng thái đổi màu / đổi nội dung lỗi -> ghi 1 dòng (cùng nội dung thì không ghi lại)
  function nkO(tt, d2) {
    try {
      const goc = String(d2 || '').replace(/^\d\d:\d\d:\d\d — /, '');
      const khoa = tt + '|' + ((tt === 'ok' || tt === 'canh_bao') ? '' : goc.replace(/\d+/g, 'N'));
      if (khoa === NK.oCuoi) return;
      NK.oCuoi = khoa;
      const ten = { ok: '✔ đang canh', canh_bao: '🔥 có đơn', cho: '⚠ đang tự sửa', loi: '✖ lỗi', ngoai_gio: '⏸ nghỉ' }[tt] || tt;
      nkThem('ô trạng thái → ' + ten + (goc && tt !== 'ok' ? ': ' + goc : ''));
    } catch (e) {}
  }

  // Bản 9.4: phần tóm tắt từng ngày ở đầu file nhật ký
  function nkTomTat(ds) {
    const ngay = {}, thuTu = [];
    for (const x of ds) {
      const k = nkGio(x[0]).slice(0, 5), s = String(x[1]);
      if (!ngay[k]) { ngay[k] = { ban: {}, loi: 0, tuChoi: 0, f5: 0, f5Tay: 0, larkTuChoi: 0, hop: 0, baoNhom: 0 }; thuTu.push(k); }
      const d = ngay[k];
      let m;
      if ((m = /^▶ khởi động bản (\S+)/.exec(s))) d.ban[m[1]] = 1;
      if (/^lỗi:/.test(s)) { d.loi++; if (/can_xac_minh/.test(s)) d.tuChoi++; }
      if (/^TẢI LẠI TRANG/.test(s)) { d.f5++; if (/Cao bấm/.test(s)) d.f5Tay++; }
      if (/^Lark từ chối/.test(s)) d.larkTuChoi++;
      if (/^chẩn đoán TikTok từ chối: captcha/.test(s)) d.hop++;
      if (/^đã gửi Lark \(he_thong\)/.test(s) && !/🧪/.test(s)) d.baoNhom++;
    }
    return ['TÓM TẮT THEO NGÀY'].concat(thuTu.map(function (k) {
      const d = ngay[k];
      return '  ' + k + ': bản ' + (Object.keys(d.ban).join(', ') || '—') + ' · ' + d.loi + ' vòng lỗi'
        + (d.tuChoi ? ' (TikTok từ chối ' + d.tuChoi + ')' : '')
        + ' · ' + d.f5 + ' lần tải lại' + (d.f5Tay ? ' (Cao bấm ' + d.f5Tay + ')' : '')
        + (d.hop ? ' · thấy hộp xác minh ' + d.hop + ' lần' : '')
        + ' · ' + d.baoNhom + ' tin báo nhóm Hệ thống · Lark từ chối ' + d.larkTuChoi;
    }));
  }
  function nkTatCa() { nkLuu(); return nkGet().ds; }
  function taiNhatKy() {
    const ds = nkTatCa(), d = new Date();
    const dau = ['NHẬT KÝ CANH ĐƠN ' + TEN + ' — bản ' + PHIEN_BAN,
      'Xuất lúc: ' + nkGio(Date.now()) + '/' + d.getFullYear() + ' · ' + ds.length + ' dòng (7 ngày gần nhất)',
      'Trình duyệt: ' + navigator.userAgent, ''];
    const txt = dau.concat(nkTomTat(ds), ['', 'CHI TIẾT (cũ ở trên, mới ở dưới)'], ds.map(function (x) { return nkGio(x[0]) + '  ' + x[1]; })).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + txt], { type: 'text/plain;charset=utf-8' }));
    a.download = 'nhat-ky-canh-don-' + CAU_HINH.VIET_TAT + '-' + CAU_HINH.TEN_SAN.toLowerCase() + '-ban' + PHIEN_BAN + '-'
      + d.getFullYear() + hai(d.getMonth() + 1) + hai(d.getDate()) + '-' + hai(d.getHours()) + hai(d.getMinutes()) + '.txt';
    document.body.appendChild(a); a.click();
    setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 3000);
  }
  function moNhatKy() {
    try {
      let p = document.getElementById('__hoatoc_nk');
      if (p) { p.remove(); return; }
      const ds = nkTatCa();
      p = document.createElement('div');
      p.id = '__hoatoc_nk';
      p.style.cssText = 'position:fixed;top:12%;left:50%;transform:translateX(-50%);z-index:2147483647;'
        + 'width:min(780px,92vw);max-height:72vh;display:flex;flex-direction:column;background:#1e2128;color:#e8e8e8;'
        + 'border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.55);font:13px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif';
      const dau = document.createElement('div');
      dau.style.cssText = 'display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid #3a3d45';
      const td = document.createElement('div');
      td.style.cssText = 'flex:1;font-weight:800;font-size:15px';
      td.textContent = '📋 Nhật ký ' + TEN_NGAN + ' · ' + ds.length + ' dòng / 7 ngày · 50 dòng mới nhất ở trên cùng';
      function nut(chu, nen, lam) {
        const b = document.createElement('button');
        b.textContent = chu;
        b.style.cssText = 'border:0;border-radius:6px;padding:6px 12px;font-weight:700;cursor:pointer;color:#fff;background:' + nen;
        b.addEventListener('click', function (e) { e.stopPropagation(); lam(b); });
        return b;
      }
      dau.appendChild(td);
      dau.appendChild(nut('⬇ Tải file .txt (7 ngày)', '#14853b', function (b) { b.textContent = '⏳ Đang tạo file…'; taiNhatKy(); b.textContent = '✔ Đã tải — xem thư mục Tải về'; }));
      dau.appendChild(nut('Đóng', '#5b5f68', function () { p.remove(); }));
      const than = document.createElement('div');
      than.style.cssText = 'overflow:auto;padding:8px 12px;font-family:ui-monospace,Consolas,monospace;font-size:12px;white-space:pre-wrap;user-select:text';
      than.textContent = ds.slice(-50).reverse().map(function (x) { return nkGio(x[0]) + '  ' + x[1]; }).join('\n') || '(chưa có dòng nào)';
      p.appendChild(dau); p.appendChild(than);
      document.body.appendChild(p);
    } catch (e) { log('không mở được nhật ký', e); }
  }
  (function nkKhoiDong() {
    try { const o = nkGet(); if (o.dem) NK.dem = o.dem; } catch (e) {}
    nkThem('▶ khởi động bản ' + PHIEN_BAN + ' · ' + location.hostname + location.pathname);
    window.addEventListener('pagehide', nkLuu);
    window.addEventListener('beforeunload', nkLuu);
  })();

  let dangChay = false;
  let lanChayCuoi = 0;
  let dangGui = false;
  let soTinTonDong = 0;
  // Các mốc thời gian cho lớp tự kiểm (xem hàm giamSat)
  let lanTienTrien = Date.now();   // lần gần nhất vòng kiểm tra còn "nhúc nhích"
  let lanXongVong = Date.now();    // lần gần nhất một vòng kiểm tra chạy xong
  let lanDiemDanhOk = Date.now();  // lần gần nhất Healthchecks nhận được điểm danh
  let lanBatDauGui = 0;
  let dangTaiLai = false;
  let stateBoNho = null;           // bản state mới nhất giữ trong bộ nhớ trang
  let hangChoBoNho = null;         // bản hàng chờ Lark mới nhất giữ trong bộ nhớ trang
  let lanBaoKhoDay = 0;
  let khoDay = false;              // đã có lần không ghi được bộ nhớ trình duyệt
  let laChinhTruocDo = false;

  // ---------- trạng thái ----------

  function stateMacDinh() {
    return {
      hoSo: {},            // mã kiện -> { ma, tao, han, daGap }
      daThay: {},          // sổ các đơn đã từng thấy (3 ngày) — chống báo trùng
      lanDocOk: 0,         // lần gần nhất đọc được danh sách đơn đã xử lý
      lanCuoiThayDon: 0,   // mốc gần nhất thấy có ít nhất 1 đơn hoả tốc
      lanBaoImLang: 0,
      lanDauLechGio: 0,
      lanBaoLechGio: 0,
      loiLienTiep: 0,
      lanLoiDau: 0,
      lanBaoLoiCuoi: 0,
      dangBaoLoi: false,
      lanTaiLaiCuoi: 0,
    };
  }

  function docState() {
    if (stateBoNho) return JSON.parse(JSON.stringify(stateBoNho));
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return stateMacDinh();
      const s = Object.assign(stateMacDinh(), JSON.parse(raw));
      if (!s.hoSo || typeof s.hoSo !== 'object') s.hoSo = {};
      // Chuyển tiếp từ bản cũ: đơn từng báo nhưng chưa có hồ sơ thì tạo hồ sơ
      // rỗng, để sau khi nâng cấp không bị báo lại một lượt.
      if (Array.isArray(s.ids)) {
        for (const k of s.ids) {
          if (k && !s.hoSo[k]) s.hoSo[k] = { ma: k, han: 0, daGap: false, thieuChiTiet: true, daBao: true };
        }
        delete s.ids;
      }
      // SỬA Ở BẢN 7.8: thêm cờ daBao (đã báo vào nhóm hay chưa). Hồ sơ lập từ
      // bản cũ chưa có cờ này -> coi như đã báo rồi, khỏi bị giữ lại/báo lại.
      for (const k of Object.keys(s.hoSo)) {
        const h = s.hoSo[k];
        if (h && h.daBao === undefined) h.daBao = true;
      }
      return s;
    } catch (e) { return stateMacDinh(); }
  }

  // Giữ thêm 1 bản trong bộ nhớ trang: lỡ bộ nhớ trình duyệt đầy / ghi hỏng
  // thì trong phiên này vẫn nhớ đơn nào đã báo — không bị báo lặp mỗi vòng.
  function luuState(s) {
    stateBoNho = JSON.parse(JSON.stringify(s));
    try { localStorage.setItem(KEY, JSON.stringify(s)); }
    catch (e) { baoKhoDay(e); }
  }

  // ---------- hàng chờ gửi Lark: không để rơi tin ----------

  // SỬA Ở BẢN MỚI: hàng chờ cũng giữ 1 bản trong bộ nhớ trang. Trước đây nếu
  // bộ nhớ trình duyệt đầy (không ghi được) thì hàng chờ luôn rỗng -> KHÔNG
  // tin nào được gửi, kể cả tin báo đơn, mà không có dấu hiệu gì.
  function docHangCho() {
    if (hangChoBoNho) return JSON.parse(JSON.stringify(hangChoBoNho));
    try { const a = JSON.parse(localStorage.getItem(KEY_HANG_CHO) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function luuHangCho(a) {
    hangChoBoNho = JSON.parse(JSON.stringify(a.slice(-50)));
    try { localStorage.setItem(KEY_HANG_CHO, JSON.stringify(a.slice(-50))); } catch (e) { baoKhoDay(e); }
    soTinTonDong = a.length;
  }

  // Bộ nhớ trình duyệt của trang đầy: script vẫn chạy nhờ bản trong bộ nhớ
  // trang, nhưng tải lại trang thì mất bản đó -> báo người biết (6 tiếng/lần).
  function baoKhoDay(e) {
    log('KHÔNG ghi được vào bộ nhớ trình duyệt', e);
    khoDay = true;
    if (Date.now() - lanBaoKhoDay < 6 * 3600000) return;
    lanBaoKhoDay = Date.now();
    tinHeThong('bộ nhớ trình duyệt của trang bị đầy, không ghi được dữ liệu. Script vẫn canh bình thường,'
      + ' nhưng mỗi lần tải lại trang có thể báo lặp đơn cũ. Cần báo người phụ trách kỹ thuật.');
  }

  // HAI NHÓM LARK TÁCH RIÊNG:
  //   dich = 'don'      -> nhóm Hoả tốc, chỉ có tin báo đơn
  //   dich = 'he_thong' -> nhóm Cảnh báo hệ thống, mọi tin (Thông báo hệ thống)
  // Mỗi tin trong hàng chờ mang theo đích của nó, nên lúc gửi lại vẫn về đúng nhóm.
  function diaChiGui(dich) {
    if (dich === 'qua_han' && (CAU_HINH.WEBHOOK_URL_QUA_HAN || '').indexOf('http') === 0) return CAU_HINH.WEBHOOK_URL_QUA_HAN;
    const u = CAU_HINH.WEBHOOK_URL_HE_THONG || '';
    // Chưa dán webhook nhóm mới thì tạm về nhóm cũ, thà báo nhầm nhóm còn hơn mất tin
    if (dich === 'he_thong' && u.indexOf('http') === 0) return u;
    return CAU_HINH.WEBHOOK_URL;
  }

  function guiLark(text, dich, tienToId) {
    const heThong = dich === 'he_thong', quaHan = dich === 'qua_han';
    const tuKhoa = heThong ? CAU_HINH.TU_KHOA_BAT_BUOC_HE_THONG
      : quaHan ? CAU_HINH.TU_KHOA_BAT_BUOC_QUA_HAN : CAU_HINH.TU_KHOA_BAT_BUOC;
    if (tuKhoa && text.indexOf(tuKhoa) === -1 && !(quaHan && /chưa in|chưa quét/.test(text))) text = text + ' [' + tuKhoa + ']';   // bot Quá hạn có cả từ khoá "in"
    const a = docHangCho();
    a.push({
      id: (tienToId || '') + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      text: text, thu: 0, dich: heThong ? 'he_thong' : quaHan ? 'qua_han' : 'don',
    });
    luuHangCho(a);
    log('xếp hàng gửi Lark:', text);
    dayHangCho();
  }

  // Tin về tình trạng máy móc, không phải tin báo đơn -> luôn về nhóm hệ thống.
  // Dạng tin:  [Hệ thống] Canh đơn hoả tốc · SMH TikTok — <chuyện gì đang xảy ra>
  function tinHeThong(noiDung) {
    // Bản 9.4.4: hết lỗi -> bỏ tin lỗi còn kẹt trong hàng chờ, ghi nguyên nhân, không gửi trùng "đã canh lại"
    if (/^đã canh lại bình thường/.test(noiDung)) {
      try {
        const a = docHangCho(), giu = [];
        let boDangXuat = false, soBo = 0;
        for (const t of a) {
          const loi = t.dich === 'he_thong' && !/🧪|đã canh lại/.test(t.text)
            && /đăng xuất|mất phiên|không đọc được dữ liệu|xác minh|chặn|từ chối lượt hỏi|tự khởi động lại/.test(t.text);
          if (loi) { soBo++; if (/đăng xuất|mất phiên/.test(t.text)) boDangXuat = true; } else giu.push(t);
        }
        if (giu.some(function (t) { return /đã canh lại bình thường/.test(t.text); })) { if (soBo) luuHangCho(giu); log('bỏ tin "đã canh lại" trùng'); return; }
        const truoc = Number(localStorage.getItem(KEY + '_canhlai') || 0);
        if (Date.now() - truoc < 3 * 60000) { if (soBo) luuHangCho(giu); log('bỏ tin "đã canh lại" trùng'); return; }
        localStorage.setItem(KEY + '_canhlai', String(Date.now()));
        if (soBo) { luuHangCho(giu); soTinTonDong = giu.length; log('hết lỗi: bỏ ' + soBo + ' tin lỗi còn kẹt chưa gửi'); }
        const m = /gián đoạn khoảng (\d+) phút/.exec(noiDung), soPhut = m ? Number(m[1]) : 0;
        const mh = Number(localStorage.getItem(KEY + '_manghong') || 0);
        const lyDo = (mh && Date.now() - mh < (soPhut + 2) * 60000) ? 'mất mạng' : (boDangXuat ? 'đăng xuất' : '');
        if (lyDo) noiDung = noiDung.replace(/\.$/, '') + ' · ' + lyDo + '.';
      } catch (e) {}
    }
    guiLark(CAU_HINH.TIEN_TO_HE_THONG + CAU_HINH.TEN_HE_THONG + ' · ' + TEN
      + ' — ' + noiDung, 'he_thong');
  }

  // ---------- DỰNG THẺ LARK (message card, mẫu C — tối giản) ----------
  // Script vẫn soạn tin chữ như cũ (giữ nguyên mọi logic), tới lúc gửi mới
  // "đóng khung" thành thẻ: tiêu đề màu nói ý chính, thân 1–2 dòng, chân thẻ
  // ghi chú nhỏ. Tin nào không nhận ra mẫu thì vẫn thành thẻ chung, không mất.
  // lon = dòng chữ to (tên hàng / mã đơn), than = dòng thường, chan = dòng nhỏ xám
  function the(mau, tieuDe, than, chan, lon) {
    const el = [];
    if (lon) el.push({ tag: 'markdown', content: '**' + lon + '**', text_size: 'heading' });
    if (than) el.push({ tag: 'markdown', content: than });
    if (chan) el.push({ tag: 'markdown', content: "<font color='grey'>" + boMd(chan) + '</font>', text_size: 'notation' });
    return { msg_type: 'interactive', card: { schema: '2.0',
      header: { template: mau, title: { tag: 'plain_text', content: tieuDe, text_size: 'normal' } },
      body: { elements: el } } };
  }
  function vietHoaDau(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function boMd(s) { return String(s || '').replace(/([*_~`\[\]])/g, '\\$1'); }
  function gioPhut() { const d = new Date(); return hai(d.getHours()) + ':' + hai(d.getMinutes()); }
  // "1 đơn hoả tốc SMH Shopee: HÀNG\n09:33 - 01/10/2026 - MÃ (SPX Instant)"
  function tachTinDon(s) {
    const m = /^(\d+) đơn hoả tốc (.+?): ([\s\S]*?)\n(\d\d:\d\d) - (\d\d\/\d\d)\/\d{4} - (\S+?)(?: \(([^()]+)\))?$/.exec(s);
    return m ? { n: m[1], ten: m[2], hang: m[3].replace(/\n/g, ' '), gio: m[4], ngay: m[5], ma: m[6], vc: m[7] || '' } : null;
  }
  // Bản 9.0/6.0: thẻ NGẮN — nhìn biểu tượng là biết. Script vẫn soạn tin chữ như cũ,
  // tới lúc gửi mới dựng thẻ; Lark từ chối thẻ thì gửi lại bằng tin chữ.
  function dungThe(text) {
    const s = String(text || '').replace(/ \[(hoả tốc|Hệ thống|hạn)\]$/, '');
    let m;
    // --- tin nhóm Quá hạn / thử kết nối: "⏰ SMH 🟠 · 3 đơn chưa xử lý · hạn 12h · Quá hạn\n<mã>" ---
    if ((m = /^(⏰|🚚|🖨|🧪) (.+)(?:\n([\s\S]*))?$/u.exec(s)) && (/hạn/.test(m[2]) || m[1] === '🖨' || m[1] === '🚚')) {
      const mau = m[1] === '⏰' ? 'orange' : m[1] === '🚚' ? 'blue' : m[1] === '🖨' ? 'red' : 'turquoise';
      return the(mau, m[1] + ' ' + m[2], '', m[3] ? m[3] : gioPhut());
    }
    // --- tin hệ thống: 1 dòng "❌ SMH 🟠 · đăng xuất" ---
    if ((m = /^\[Hệ thống\] (.+?) · (.+?) — ([\s\S]*)$/.exec(s))) {
      const nd = m[3].replace(/\.$/, ''), chan = '[Hệ thống] ' + gioPhut();
      let r;
      if ((r = /^đã canh lại bình thường(?: \(gián đoạn khoảng (\d+) phút\))?(?: · (.+))?/.exec(nd)))
        return the('green', '✅ ' + TEN_NGAN + ' · đã canh lại' + (r[1] ? ' · gián đoạn ' + r[1] + ' phút' : '') + (r[2] ? ' (' + r[2] + ')' : ''), '', chan);
      if (/^🧪/.test(nd)) return the('blue', '🧪 ' + TEN_NGAN + ' · ' + nd.replace(/^🧪 /, ''), '', chan);
      const ds = [
        [/đăng xuất|mất phiên/, function () { return 'đăng xuất'; }],
        [/xác minh|captcha/i, function () { return 'cần xác minh'; }],
        [/^không đọc được dữ liệu (\d+) phút/, function (x) { return 'không đọc được ' + x[1] + ' phút'; }],
        [/tự khởi động lại/, function () { return 'tự sửa không được'; }],
        [/đồng hồ máy đang lệch khoảng (\d+) phút/, function (x) { return 'lệch giờ ' + x[1] + ' phút'; }],
        [/đã (\d+) ngày không thấy đơn/, function (x) { return x[1] + ' ngày không có đơn'; }],
        [/bộ nhớ/, function () { return 'bộ nhớ trang đầy'; }],
        [/^(quá hạn mốc \S+ lỗi \d+ phút|không kiểm được chưa in \d+ phút|Lark từ chối tin .+)/, function (x) { return x[1]; }],
      ];
      for (let i = 0; i < ds.length; i++) {
        const x = ds[i][0].exec(nd);
        if (x) return the('carmine', '❌ ' + TEN_NGAN + ' · ' + ds[i][1](x), '', chan);
      }
      return the('carmine', '❌ ' + TEN_NGAN + ' · cần kiểm tra', boMd(vietHoaDau(nd)), chan);
    }
    // --- GẤP còn hạn: giữ thẻ như 8.4 (Cao chọn) ---
    if ((m = /^\(GẤP\) (\S+) (.+?) chỉ còn (\d+) phút để xử lý đơn hoả tốc/.exec(s))) {
      return the('red', '🚨 GẤP ' + m[3] + ' phút · ' + TEN_NGAN,
        /<at /.test(s) ? '<at id=all></at>' : '', 'Đơn hoả tốc sắp hết hạn xử lý', boMd(m[1]));
    }
    // --- QUÁ HẠN hoả tốc ---
    if ((m = /^\(GẤP\) (\S+) (.+?) ĐÃ QUÁ HẠN/.exec(s))) {
      return the('red', '⛔ ' + TEN_NGAN + ' · quá hạn · ' + m[1], '', 'Đơn hoả tốc đã quá hạn xử lý');
    }
    // --- xử lý xong trong lúc giữ ---
    if ((m = /^ĐÃ XỬ LÝ trong vòng (\d+) phút \((\d+) đơn hoả tốc (.+?): ([\s\S]*) \| (\S+?)(?: \(([^()]+)\))?\)$/.exec(s))) {
      return the('green', '✅ Đã xử lý trong ' + m[1] + ' phút · ' + m[4].replace(/\s*\n\s*/g, ', '), '',   // bản 9.4.4
        m[5] + (m[6] ? ' · ' + m[6] : '') + ' · hoả tốc · ' + TEN_NGAN);
    }
    // --- khách huỷ ---
    if (/^ĐÃ HUỶ /.test(s)) {
      let g = s.slice(7).replace(/\n\(/, '\n').replace(/\)$/, '').split('\n');
      if (g.length >= 3 && g[0].indexOf(':') === -1) g = [g[0] + ': ' + g[1]].concat(g.slice(2));
      const d = tachTinDon(g.join('\n'));
      if (d) return the('grey', '❌ Đã huỷ · ' + d.hang, '', d.ma + (d.vc ? ' · ' + d.vc : '') + ' · hoả tốc · ' + TEN_NGAN);   // bản 9.4.4
      return the('grey', '❌ đã huỷ', boMd(s.slice(7)), 'hoả tốc · ' + TEN_NGAN);
    }
    // --- đơn mới ---
    const d = tachTinDon(s);
    if (d) return the('orange', '🔥 ' + TEN_NGAN + ' · ' + d.n + ' đơn', '',
      d.gio + ' ' + d.ngay + ' · ' + d.ma + (d.vc ? ' · ' + d.vc : '') + ' · hoả tốc', boMd(d.hang));
    // --- không nhận ra mẫu: vẫn gửi thành thẻ chung ---
    const dong = s.split('\n');
    return the('turquoise', dong[0].slice(0, 90), boMd(dong.slice(1).join('\n')), '');
  }

  // xong(ok, loai): loai = 'tu_choi' (Lark trả lời nhưng không nhận tin) hoặc
  // 'mang' (không liên lạc được). SỬA Ở BẢN MỚI: có hạn chót riêng — trước đây
  // nếu tiện ích Tampermonkey không bao giờ gọi lại thì cờ "đang gửi" kẹt mãi,
  // KHÔNG tin nào (kể cả tin báo đơn) được gửi nữa cho tới khi F5.
  function guiMot(text, dich, xong) {
    const DIA_CHI = diaChiGui(dich);
    const bodyChu = JSON.stringify({ msg_type: 'text', content: { text: text } });
    // Gửi dạng THẺ; nếu Lark từ chối thẻ thì gửi lại ngay bằng tin chữ cũ — không mất tin.
    let body = bodyChu, laThe = false;
    if (CAU_HINH.GUI_DANG_THE !== false) {
      try { body = JSON.stringify(dungThe(text)); laThe = true; } catch (e) { log('dựng thẻ lỗi, gửi tin chữ:', e); }
    }
    let daXong = false;
    const hen = setTimeout(function () {
      log('gửi Lark quá ' + CAU_HINH.HAN_GUI_LARK_GIAY + ' giây không phản hồi, coi như hỏng');
      ketThuc(false, 'mang');
    }, CAU_HINH.HAN_GUI_LARK_GIAY * 1000);
    function ketThuc(ok, loai) {
      if (daXong) return;
      daXong = true;
      clearTimeout(hen);
      xong(ok, loai);
    }
    function guiDi() {
      try {
        if (typeof GM_xmlhttpRequest === 'function') {
          GM_xmlhttpRequest({
            method: 'POST', url: DIA_CHI,
            headers: { 'Content-Type': 'application/json' },
            data: body, timeout: 20000,
            onload: function (r) {
              let ok = false;
              try { ok = JSON.parse(r.responseText).code === 0; } catch (e) {}
              if (!ok) log('Lark từ chối:', r.status, String(r.responseText).slice(0, 160));
              if (!ok && laThe) {
                log('Lark không nhận thẻ, gửi lại bằng tin chữ');
                laThe = false; body = bodyChu; guiDi(); return;
              }
              ketThuc(ok, ok ? '' : 'tu_choi');
            },
            onerror: function () { ketThuc(false, 'mang'); },
            ontimeout: function () { ketThuc(false, 'mang'); },
          });
        } else {
          fetch(DIA_CHI, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' }, body: body,
          }).then(function () { ketThuc(true, ''); }).catch(function () { ketThuc(false, 'mang'); });
        }
      } catch (e) { ketThuc(false, 'mang'); }
    }
    guiDi();
  }

  function dayHangCho() {
    if (dangGui) return;
    const a = docHangCho();
    if (!a.length) { soTinTonDong = 0; return; }
    // Bản 9.4.4: tin lỗi hệ thống đã từng gửi hỏng (thường do mất mạng) thì HOÃN thêm 1 nhịp kiểm đơn —
    // có mạng lại mà đọc được đơn ngay thì tin này bị bỏ (chỉ còn 1 tin "đã canh lại"), không bắn tin lỗi cũ.
    const nowG = Date.now(), hoanMs = (CAU_HINH.CHU_KY_GIAY * 1.2 + 60) * 1000;
    let iG = 0;
    for (; iG < a.length; iG++) {
      const t = a[iG];
      if (t.dich === 'he_thong' && (t.thu || 0) >= 1 && !/🧪|đã canh lại/.test(t.text)
        && /đăng xuất|mất phiên|không đọc được dữ liệu|xác minh|chặn|từ chối lượt hỏi|tự khởi động lại/.test(t.text)) {
        if (nowG - (t.lanHong || 0) < hoanMs) continue;
      }
      break;
    }
    if (iG >= a.length) { setTimeout(dayHangCho, 30000); return; }
    dangGui = true;
    lanBatDauGui = Date.now();
    const m = a[iG];
    guiMot(m.text, m.dich, function (ok, loai) {
      const b = docHangCho();
      const i = b.findIndex(function (x) { return x.id === m.id; });
      dangGui = false;
      lanBatDauGui = 0;
      if (ok) {
        if (i !== -1) b.splice(i, 1);
        luuHangCho(b);
        log('đã gửi Lark (' + (m.dich || 'don') + '):', String(m.text).split('\n')[0].slice(0, 140));
        // Tin thử kết nối nhóm Quá hạn đi được -> báo nghiệm thu vào nhóm Hệ thống
        if (String(m.id).indexOf('nt-') === 0) tinHeThong('🧪 bản ' + PHIEN_BAN + ' · Hệ thống + Quá hạn OK');
        if (docHangCho().length) setTimeout(dayHangCho, 1200);
        return;
      }
      if (i !== -1) {
        const tin = b[i];
        tin.thu = (tin.thu || 0) + 1;
        tin.lanHong = Date.now();   // bản 9.4.4
        // SỬA Ở BẢN MỚI: Lark TỪ CHỐI hẳn tin này (không phải do mạng) thì đẩy
        // nó xuống cuối hàng, để một tin hỏng không chặn mọi tin đơn phía sau.
        // Mất mạng thì giữ nguyên thứ tự (tin nào cũng sẽ hỏng như nhau).
        if (loai === 'tu_choi') {
          b.splice(i, 1);
          if (tin.thu < 30) b.push(tin);
          else log('bỏ hẳn tin sau 30 lần bị Lark từ chối:', tin.text);
          // Bản 9.0: bị từ chối 3 lần liền (sai từ khoá, webhook hỏng…) -> báo nhóm Hệ thống, 1 lần/ngày/nhóm
          if (tin.thu === 3 && tin.dich !== 'he_thong') setTimeout(function () { baoLarkTuChoi(tin.dich); }, 50);   // sau khi hàng chờ đã lưu
        }
        luuHangCho(b);
      }
      if (loai === 'mang') { try { localStorage.setItem(KEY + '_manghong', String(Date.now())); } catch (e) {} }   // bản 9.4.4: để ghi nguyên nhân "mất mạng"
      log('gửi hỏng (' + (loai || '?') + '), còn', b.length, 'tin trong hàng chờ');
      if (loai === 'tu_choi' && b.length && !b[0].thu) setTimeout(dayHangCho, 3000);
    });
  }

  function baoLarkTuChoi(dich) {
    try {
      const k = KEY + '_tuchoi_' + dich, hom = ngayHomNay();
      if (localStorage.getItem(k) === hom) return;
      localStorage.setItem(k, hom);
    } catch (e) {}
    tinHeThong('Lark từ chối tin ' + (dich === 'qua_han' ? 'Quá hạn' : 'Hoả tốc'));
  }

  // ---------- điểm danh với Healthchecks ----------
  // Mỗi vòng trong giờ canh đều điểm danh, BẤT KỂ đọc API có được hay không.
  // Ý nghĩa: "script còn sống". Còn chuyện đọc API hỏng thì script tự báo lấy.
  // Nhờ vậy hai lớp cảnh báo không giẫm chân nhau.
  function diemDanh() {
    if (!CAU_HINH.PING_URL) return;
    try {
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'GET', url: CAU_HINH.PING_URL, timeout: 15000,
          // Ghi nhận lần điểm danh THÀNH CÔNG để lớp tự kiểm biết Healthchecks
          // có đang nhận được hay không (xem giamSat).
          onload: function (r) { if (r && r.status >= 200 && r.status < 300) lanDiemDanhOk = Date.now(); },
          onerror: function () {}, ontimeout: function () {},
        });
      } else {
        fetch(CAU_HINH.PING_URL, { mode: 'no-cors' })
          .then(function () { lanDiemDanhOk = Date.now(); }).catch(function () {});
      }
    } catch (e) {}
  }

  // ---------- ô trạng thái trên trang ----------
  // Đặt GIỮA PHÍA TRÊN, cỡ chữ tính theo bề rộng cửa sổ nên trang thu 33% hay
  // 100% thì ô vẫn to bằng nhau trên màn hình. Ô "chớp" mỗi giây do chính
  // script điều khiển (xem nhipTim): script đứng thì ô đứng yên — đó là dấu
  // hiệu để biết tab còn sống thật hay chỉ là màn hình cũ.
  const O = { trangThai: 'ok', dong2: '', soDon: 0, sang: true, nhip: 0, qh: { muc: '', chu: '' } };

  function coChuO() {
    const w = Math.max(500, Math.min(6000, window.innerWidth || 1200));
    return Math.round(w * 0.019 * ((CAU_HINH.CO_CHU_O_TRANG_THAI || 18) / 18));
  }

  // Bản 9.0/6.0: ô nhỏ bằng nửa trước, KÉO ĐƯỢC (bấm giữ rồi kéo) để không che nút
  // đăng nhập; tải lại trang thì về lại giữa phía trên.
  function oTrangThai() {
    let el = document.getElementById('__hoatoc_badge');
    if (!el) {
      el = document.createElement('div');
      el.id = '__hoatoc_badge';
      el.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);'
        + 'z-index:2147483647;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;'
        + 'border-radius:10px;opacity:.97;cursor:move;user-select:none;text-align:left;'
        + 'box-shadow:0 0 0 3px rgba(255,255,255,.25),0 4px 12px rgba(0,0,0,.45);'
        + 'transition:filter .25s';
      el.title = 'Bấm giữ rồi kéo để dời ô này · Bấm CHUỘT PHẢI để xem nhật ký 7 ngày';
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); moNhatKy(); });   // bản 9.3
      let keo = null;
      el.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;   // chuột phải để mở nhật ký, không kéo
        const r = el.getBoundingClientRect();
        keo = { dx: e.clientX - r.left, dy: e.clientY - r.top };
        el.style.transform = 'none'; el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
        e.preventDefault();
      });
      document.addEventListener('mousemove', function (e) {
        if (!keo) return;
        el.style.left = Math.max(0, e.clientX - keo.dx) + 'px';
        el.style.top = Math.max(0, e.clientY - keo.dy) + 'px';
      });
      document.addEventListener('mouseup', function () { keo = null; });
      document.body.appendChild(el);
    }
    return el;
  }


  // ---------- bản 9.4: hàng nút luôn hiện dưới ô — 🔄 Tải lại trang (to) + ⬇ Tải nhật ký ----------
  function taoNutO(chu, lam) {
    const b = document.createElement('button');
    b.textContent = chu;
    b.style.cssText = 'cursor:pointer;border:2px solid rgba(255,255,255,.8);background:rgba(0,0,0,.25);color:#fff;'
      + 'border-radius:8px;font-weight:800;padding:.3em .7em;white-space:nowrap;font-family:inherit';
    b.addEventListener('mousedown', function (e) { e.stopPropagation(); });   // bấm nút không kéo ô
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); lam(b); });
    return b;
  }
  async function bamTaiLai(b) {
    if (b.disabled) return;
    b.disabled = true;
    b.textContent = '⏳ Đang lưu, sắp tải lại…';
    log('Cao bấm tải lại trang');
    // Bản 9.4.4: lần trước báo mất mạng mà bấm lại trong 10 giây -> tải lại luôn
    if (b._matMang && Date.now() - b._matMang < 10000) {
      log('Cao bấm tải lại lần 2 khi mất mạng — tải lại luôn');
      b.textContent = '⏳ Đang tải lại…';
      try { nkLuu(); } catch (e) {}
      location.href = TRANG_CANH;
      return;
    }
    let ok = false;
    try { ok = await taiLaiAnToan('Cao bấm tải lại trang'); } catch (e) {}
    if (!ok) {
      b._matMang = Date.now();
      b.disabled = false;
      b.textContent = '⚠ Mất mạng — bấm lần nữa để vẫn tải lại';
      setTimeout(function () { if (Date.now() - (b._matMang || 0) >= 9900) { b._matMang = 0; b.textContent = '🔄 Tải lại trang'; } }, 10000);
    }
  }
  function bamTaiNhatKy(b) {
    if (b.disabled) return;
    b.disabled = true;
    b.textContent = '⏳ Đang tạo file…';
    try { taiNhatKy(); b.textContent = '✔ Đã tải — thư mục Tải về'; }
    catch (e) { b.textContent = '⚠ Không tạo được file'; log('không tải được nhật ký', e); }
    setTimeout(function () { b.disabled = false; b.textContent = '⬇ Tải nhật ký'; }, 5000);
  }
  function hangNut(el, co) {
    let h = document.getElementById('__hoatoc_nut');
    if (!h) {
      h = document.createElement('div');
      h.id = '__hoatoc_nut';
      h.appendChild(taoNutO('🔄 Tải lại trang', bamTaiLai));
      h.appendChild(taoNutO('📋 Xem nhật ký', function () { moNhatKy(); }));
      h.appendChild(taoNutO('⬇ Tải nhật ký', bamTaiNhatKy));
      h.appendChild(taoNutO('✏ Tin nhắc', nsMoSua));   // bản 9.5
      el.appendChild(h);
    }
    if (h._co === co) return;
    h._co = co;
    h.style.cssText = 'display:flex;gap:' + Math.round(co * 0.45) + 'px;margin-top:' + Math.round(co * 0.5) + 'px';
    h.children[0].style.fontSize = Math.round(co * 1.15) + 'px';
    h.children[0].style.flex = '2';
    for (let i = 1; i < h.children.length; i++) { h.children[i].style.fontSize = Math.round(co * 0.85) + 'px'; h.children[i].style.flex = '1'; }
  }

  function themCssNhay() {
    if (document.getElementById('__hoatoc_css')) return;
    const st = document.createElement('style');
    st.id = '__hoatoc_css';
    st.textContent = '@keyframes hoatocNhay{0%,100%{opacity:1}50%{opacity:.45}}';
    (document.head || document.documentElement).appendChild(st);
  }

  function nhanDonGanNhat() {
    try {
      const t = docState().lanCuoiThayDon;
      if (!t) return '';
      const d = new Date(t);
      return ' · đơn gần nhất ' + hai(d.getDate()) + '/' + hai(d.getMonth() + 1)
        + ' ' + hai(d.getHours()) + ':' + hai(d.getMinutes());
    } catch (e) { return ''; }
  }

  // Tên tab: thêm 🟢/🔴/🟡/🔥/⚪ ở đầu để nhìn thanh tab là biết, kể cả khi trang bị che
  const DAU_TAB = ['✔', '✖', '⚠', '🔥', '⏸', '🟢', '🔴', '🟡', '⚪'];   // bản 9.1/6.1: bộ ký hiệu mới (vẫn gỡ được dấu cũ)
  function datTenTab(dau) {
    try {
      let t = document.title || '';
      for (const d of DAU_TAB) { if (t.indexOf(d + ' ') === 0) { t = t.slice(d.length + 1); break; } }
      const moi = dau + ' ' + t;
      if (document.title !== moi) document.title = moi;
    } catch (e) {}
  }

  // trangThai: 'ok' | 'canh_bao' | 'cho' | 'loi' | 'ngoai_gio'
  function capNhatO(trangThai, dong2, soDon) {
    nkO(trangThai, dong2);   // bản 9.3: nhật ký
    O.trangThai = trangThai; O.dong2 = dong2 || ''; O.soDon = soDon || 0;
    veO();
  }

  // Chữ ngắn cho ô khi lỗi: "🔴 đăng xuất · SMH 🟠"
  function nhanNgan(dong2) {
    const t = String(dong2 || '');
    if (/ĐĂNG XUẤT|đăng xuất|đăng nhập/.test(t)) return 'đăng xuất';
    if (/XÁC MINH|xác minh/.test(t)) return 'cần xác minh';
    if (/mất mạng/.test(t)) return 'mất mạng';
    if (/TỰ SỬA KHÔNG ĐƯỢC/.test(t)) return 'tự sửa không được';
    if (/tự thử lại/.test(t)) return 'đang tự sửa';
    if (/chưa kiểm tra được/.test(t)) return 'không kiểm tra được';
    if (/Tab phụ/.test(t)) return 'tab phụ';
    if (/ngoài giờ/.test(t)) return 'ngoài giờ';
    return 'lỗi';
  }

  function veO() {
    if (!CAU_HINH.HIEN_THI_TREN_TRANG) return;
    try {
      themCssNhay();
      const el = oTrangThai();
      const co = Math.round(coChuO() * 0.75);  // bản 9.1/6.1: to 1,5 lần so với 9.0
      const now = Date.now();
      let trangThai = O.trangThai;
      const tonDong = soTinTonDong > 0;
      const treo = (trangThai === 'ok' || trangThai === 'canh_bao')
        && (now - lanXongVong) > CAU_HINH.CHU_KY_GIAY * 2.5 * 1000;
      if (treo) trangThai = 'loi';
      const coDon = (trangThai === 'canh_bao');
      const qh = O.qh || {};
      const doHT = trangThai === 'loi' || tonDong;

      let nen, dau, nhan, chiTiet = '';
      if (coDon) {
        nen = '#ff6a00'; dau = '🔥'; nhan = O.soDon + ' đơn · ' + TEN_NGAN;
        chiTiet = (O.dong2 || '').replace(/^Kiểm tra cách đây \d+ giây · /, '').replace(/^\d\d:\d\d:\d\d — /, '');
      } else if (doHT || qh.muc === 'loi') {
        nen = '#c0341d'; dau = '✖';
        nhan = tonDong ? (TEN_NGAN + ' · ' + soTinTonDong + ' tin chưa gửi')
          : doHT ? (nhanNgan(treo ? 'chưa kiểm tra được' : O.dong2) + ' · ' + TEN_NGAN)
          : ('quá hạn lỗi · ' + TEN_NGAN);
        chiTiet = doHT ? (treo ? 'Quá ' + Math.round((now - lanXongVong) / 60000) + ' phút chưa kiểm tra được — đang chờ lớp tự kiểm xử lý' : O.dong2) : '';
      } else if (trangThai === 'cho' || qh.muc === 'cho') {
        nen = '#a87400'; dau = '⚠';
        nhan = (trangThai === 'cho' ? nhanNgan(O.dong2) : 'quá hạn đang thử lại') + ' · ' + TEN_NGAN;
        chiTiet = trangThai === 'cho' ? O.dong2 : '';
      } else if (trangThai === 'ngoai_gio') {
        nen = '#5b5f68'; dau = '⏸'; nhan = TEN_NGAN + ' · ' + nhanNgan(O.dong2);
      } else {
        nen = '#14853b'; dau = '✔'; nhan = TEN_NGAN + ' · đang canh';
      }
      // Bản 9.1/6.1: luôn có dòng 2, đầu dòng là "kiểm cách đây N giây" nhảy từng giây
      const giay = Math.max(0, Math.round((now - lanXongVong) / 1000));
      const dauDong2 = (trangThai === 'ngoai_gio') ? '' : 'kiểm cách đây ' + (giay < 120 ? giay + ' giây' : Math.round(giay / 60) + ' phút');
      const phan = [dauDong2, chiTiet.replace(/^\d\d:\d\d:\d\d — /, ''), qh.chu].filter(Boolean);
      chiTiet = phan.join(' · ');
      if (dau === '✖' || dau === '⚠') chiTiet += ghiChuTuSua() + (tonDong ? ' · ⚠ ' + soTinTonDong + ' tin chưa gửi' : '');

      el.style.background = nen;
      el.style.padding = Math.round(co * 0.5) + 'px ' + Math.round(co * 0.9) + 'px';
      el.style.maxWidth = Math.round((window.innerWidth || 1200) * 0.46) + 'px';
      el.style.animation = (coDon && CAU_HINH.NHAP_NHAY_KHI_CO_DON) ? 'hoatocNhay 0.9s ease-in-out infinite' : 'none';
      el.style.filter = O.sang ? 'brightness(1)' : 'brightness(.62)';

      let nd = document.getElementById('__hoatoc_nd');   // bản 9.4
      if (!nd) { nd = document.createElement('div'); nd.id = '__hoatoc_nd'; el.appendChild(nd); }
      nd.textContent = '';
      hangNut(el, co);
      const t1 = document.createElement('div');
      t1.style.cssText = 'font-weight:900;font-size:' + Math.round(co * (coDon ? 1.6 : 1.3))
        + 'px;line-height:1.15;letter-spacing:.2px;white-space:nowrap';
      t1.textContent = dau + ' ' + nhan;
      nd.appendChild(t1);
      if (chiTiet) {
        const t2 = document.createElement('div');
        t2.style.cssText = 'font-weight:600;font-size:' + co + 'px;margin-top:' + Math.round(co * 0.2) + 'px;opacity:.95;line-height:1.3';
        t2.textContent = chiTiet.replace(/^\d\d:\d\d:\d\d — /, '');
        nd.appendChild(t2);
      }
      datTenTab(dau);
    } catch (e) { /* trang chưa sẵn sàng */ }
  }

  // Nhịp tim: mỗi giây đảo sáng/tối một lần (ngoài giờ: 3 giây một lần) và
  // vẽ lại số giây. Chạy bằng setInterval riêng — nếu script bị treo, nhịp
  // này cũng dừng, ô đứng yên.
  function nhipTim() {
    setInterval(function () {
      try {
        O.nhip++;
        const cham = (O.trangThai === 'ngoai_gio');
        if (!cham || O.nhip % 3 === 0) O.sang = !O.sang;
        veO();
      } catch (e) {}
    }, 1000);
  }

  function gioBayGio() {
    const d = new Date();
    return hai(d.getHours()) + ':' + hai(d.getMinutes()) + ':' + hai(d.getSeconds());
  }

  // ---------- khung giờ ----------

  function trongGioLamViec() {
    const d = new Date();
    if (CAU_HINH.NGAY_TRONG_TUAN && CAU_HINH.NGAY_TRONG_TUAN.indexOf(d.getDay()) === -1) return false;
    const p = d.getHours() * 60 + d.getMinutes();
    return p >= (CAU_HINH.GIO_BAT_DAU * 60 + CAU_HINH.PHUT_BAT_DAU)
        && p <  (CAU_HINH.GIO_KET_THUC * 60 + CAU_HINH.PHUT_KET_THUC);
  }

  function nhanKhungGio() {
    return CAU_HINH.GIO_BAT_DAU + 'h' + hai(CAU_HINH.PHUT_BAT_DAU)
      + '–' + CAU_HINH.GIO_KET_THUC + 'h' + hai(CAU_HINH.PHUT_KET_THUC);
  }

  // ---------- HẠN XỬ LÝ & CẢNH BÁO GẤP ----------
  //
  //   phát sinh 08:00 -> trước 18:00 : hạn = giờ phát sinh + 90 phút
  //   phát sinh 18:00 -> trước 08:00 : hạn = 09:30 sáng hôm sau
  // GẤP chỉ tắt khi HẠN rơi vào Chủ nhật (sàn không tính trễ ngày đó), KHÔNG
  // phải khi đơn phát sinh vào Chủ nhật — đơn sinh tối CN có hạn 09:30 T2 thì
  // VẪN phải cảnh báo.
  function tinhHan(tsGiay) {
    const n = Number(tsGiay);
    if (!n || isNaN(n)) return 0;
    const t = new Date(n * 1000);
    const h = t.getHours();
    if (h >= CAU_HINH.GIO_SLA_BAT_DAU && h < CAU_HINH.GIO_SLA_KET_THUC) {
      return t.getTime() + CAU_HINH.SLA_PHUT * 60000;
    }
    const d = new Date(t.getTime());
    if (h >= CAU_HINH.GIO_SLA_KET_THUC) d.setDate(d.getDate() + 1);
    d.setHours(CAU_HINH.GIO_HAN_DEM, CAU_HINH.PHUT_HAN_DEM, 0, 0);
    return d.getTime();
  }

  function hanDuocMienTre(hanMs) {
    if (!hanMs) return true;
    const d = new Date(hanMs);
    if (CAU_HINH.BO_GAP_KHI_HAN_CHU_NHAT && d.getDay() === 0) return true;
    const nhan = hai(d.getDate()) + '/' + hai(d.getMonth() + 1);
    return (CAU_HINH.NGAY_NGHI || []).indexOf(nhan) !== -1;
  }

  async function kiemTraGap(state) {
    if (!CAU_HINH.BAT_CANH_BAO_GAP) return;
    const now = Date.now();
    const nguong = CAU_HINH.CANH_BAO_TRUOC_PHUT * 60000;
    for (const k of Object.keys(state.hoSo)) {
      const h = state.hoSo[k];
      if (!h || !h.daBao || h.daGap || !h.han) continue;
      const conLai = h.han - now;
      if (conLai > nguong) continue;
      h.daGap = true;
      if (hanDuocMienTre(h.han)) { log('bỏ qua GẤP (hạn rơi ngày không tính trễ):', h.ma || k); continue; }
      const ma = h.ma || k;
      if (await daGoiVanChuyen(h) === true) {
        log('bỏ qua GẤP: đơn đã xử lý, đang chờ / tìm lại tài xế —', ma);
        continue;
      }
      if (conLai <= 0) {
        guiLark(CAU_HINH.MAU_TIN_QUA_HAN.replace('{ma}', ma).replace('{ten}', TEN));
      } else {
        const phut = Math.max(1, Math.ceil(conLai / 60000));
        guiLark(CAU_HINH.MAU_TIN_GAP.replace('{ma}', ma).replace('{ten}', TEN).replace('{phut}', phut));
      }
    }
  }

  // ---------- hai lớp tự kiểm ----------

  // Sàn đổi mã bộ lọc thì script sẽ thấy 0 đơn MÃI MÃI mà không hề báo lỗi —
  // ô trạng thái vẫn xanh, Healthchecks vẫn xanh. Đây là lưới chặn việc đó.
  function kiemTraImLang(state) {
    if (!CAU_HINH.BAT_CANH_BAO_IM_LANG) return;
    const now = Date.now();
    if (!state.lanCuoiThayDon) { state.lanCuoiThayDon = now; return; } // lần chạy đầu
    const soNgay = (now - state.lanCuoiThayDon) / 86400000;
    if (soNgay < CAU_HINH.SO_NGAY_IM_LANG) return;
    if (now - (state.lanBaoImLang || 0) < 14 * 86400000) return;   // bản 9.1/6.1: nhắc lại 14 ngày/lần
    state.lanBaoImLang = now;
    tinHeThong('đã ' + Math.floor(soNgay) + ' ngày không thấy đơn hoả tốc nào. '
      + 'Có thể đúng là không có đơn, nhưng cũng có thể script đọc sai — vào sàn kiểm tra giúp.');
  }

  // Toàn bộ phép tính hạn 1h30 và mốc 09:30 dựa vào đồng hồ máy. Máy lệch giờ
  // là tin GẤP sai giờ mà không ai hay. Giờ máy chủ lấy sẵn từ phản hồi của sàn.
  function kiemTraLechGio(state, gioMayChu) {
    if (!CAU_HINH.BAT_KIEM_LECH_GIO || !gioMayChu) return;
    const t = Date.parse(gioMayChu);
    if (!t || isNaN(t)) return;
    const now = Date.now();
    const lech = Math.abs(now - t);
    if (lech < CAU_HINH.LECH_GIO_TOI_DA_PHUT * 60000) { state.lanDauLechGio = 0; return; }
    // Phải lệch liên tục đủ lâu mới báo — một lần đọc bất thường không tính
    if (!state.lanDauLechGio) { state.lanDauLechGio = now; return; }
    if (now - state.lanDauLechGio < CAU_HINH.PHUT_TRUOC_KHI_BAO * 60000) return;
    if (now - (state.lanBaoLechGio || 0) < 6 * 3600000) return;
    state.lanBaoLechGio = now;
    tinHeThong('đồng hồ máy đang lệch khoảng ' + Math.round(lech / 60000)
      + ' phút so với giờ của sàn, làm sai giờ cảnh báo. Cần chỉnh lại giờ máy.');
  }

  // ---------- gọi API Shopee ----------

  function thamSo() {
    const m = document.cookie.match(/SPC_CDS=([^;]+)/);
    if (!m) return null;
    return '?SPC_CDS=' + m[1] + '&SPC_CDS_VER=2';
  }

  // 'khong_co_phien' = chắc chắn mất đăng nhập (mất cookie, 401/403, bị đẩy về
  // trang đăng nhập). Mọi thứ khác là trục trặc TẠM THỜI — không đoán mò.
  async function layChiMuc() {
    const q = thamSo();
    if (!q) return { loi: 'khong_co_phien', chiTiet: 'không còn cookie SPC_CDS' };
    const body = {
      order_list_tab: TAB_CHO_LAY_HANG,
      entity_type: LOAI_HOA_TOC,
      pagination: { page_number: 1, page_size: 50 },
      filter: { order_to_ship_status: TRANG_THAI_CHUA_XU_LY },
      sort: { sort_type: 2, ascending: true },
      current_time: Math.floor(Date.now() / 1000),
    };
    const res = await fetchCoHan('/api/v3/order/search_order_list_index' + q, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    const gioMayChu = res.headers.get('date');
    if (res.redirected && String(res.url).indexOf('accounts.shopee.vn') !== -1) {
      return { loi: 'khong_co_phien', chiTiet: 'bị chuyển về trang đăng nhập' };
    }
    if (res.status === 401 || res.status === 403) {
      return { loi: 'khong_co_phien', chiTiet: 'HTTP ' + res.status };
    }
    if (!res.ok) return { loi: 'api_loi', chiTiet: 'HTTP ' + res.status };

    let j = null;
    try { j = await docJson(res); } catch (e) { j = null; }
    if (!j) return { loi: 'api_loi', chiTiet: 'không đọc được phản hồi (HTTP ' + res.status + ')' };
    if (typeof j.code === 'undefined') return { loi: 'api_loi', chiTiet: 'phản hồi lạ, thiếu trường code' };
    if (j.code !== 0) {
      return { loi: 'api_loi', chiTiet: 'mã ' + j.code + (j.message ? ' - ' + j.message : '') };
    }
    return { data: j.data || {}, gioMayChu: gioMayChu };
  }

  async function layChiMucCoThuLai() {
    let ket = null;
    for (let i = 0; i <= CAU_HINH.SO_LAN_THU_LAI; i++) {
      if (i > 0) await nghi(CAU_HINH.CHO_THU_LAI_GIAY * 1000);
      try { ket = await layChiMuc(); }
      catch (e) { ket = { loi: 'api_loi', chiTiet: 'ngoại lệ: ' + String(e && e.message) }; }
      if (!ket.loi) return ket;
      if (ket.loi === 'khong_co_phien') return ket;
      log('lần thử ' + (i + 1) + ' hỏng:', ket.chiTiet);
    }
    return ket;
  }

  async function layChiTietDon(orderId) {
    const q = thamSo();
    if (!q) return null;
    const res = await fetchCoHan('/api/v3/order/get_one_order' + q + '&order_id=' + encodeURIComponent(orderId), {
      credentials: 'include',
    });
    if (!res.ok) return null;
    let j = null;
    try { j = await docJson(res); } catch (e) { j = null; }
    if (!j || j.code !== 0) return null;
    const d = j.data || {};
    const items = d.order_items || [];
    const ra = [];
    for (const it of items) {
      const im = it.item_model || {};
      const pr = it.product || {};
      let ten = String(im.sku || '').trim();          // SKU phân loại
      if (!ten) ten = String(im.name || '').trim();
      if (!ten) ten = String(pr.name || '').trim().slice(0, CAU_HINH.DO_DAI_TOI_DA_TEN);
      if (!ten) continue;
      const g = Number(it.order_price);
      ra.push({ ten: ten, sl: it.amount || 1, gia: isNaN(g) ? null : g });
    }
    // dvvc: tên ĐVVC sàn gán cho đơn (cùng trường bảng In Đơn dùng để chia nút in)
    return { hang: ra, ma: String(d.order_sn || '').trim(), tao: d.create_time,
      dvvc: String(d.fulfillment_carrier_name || '').trim() };
  }

  async function layChiTietCoThuLai(orderId) {
    for (let i = 0; i < 2; i++) {
      if (i > 0) await nghi(3000);
      try { const ct = await layChiTietDon(orderId); if (ct) return ct; }
      catch (e) { log('lỗi lấy chi tiết đơn', orderId, e); }
    }
    return null;
  }

  // Gọi khi một đơn ĐÃ TỪNG báo vào nhóm bỗng biến mất khỏi danh sách chờ xử
  // lý — để phân biệt "khách huỷ" với "nhân sự đã xử lý xong" (trường hợp
  // sau vẫn im lặng như trước giờ). true = chắc chắn đã huỷ; false = không
  // phải; null = không xác minh được (mạng lỗi, sàn đổi cấu trúc…) -> coi
  // như bình thường, không báo, để khỏi báo nhầm.
  async function kiemTraDaHuy(orderId) {
    try {
      const q = thamSo();
      if (!q) return null;
      const res = await fetchCoHan('/api/v3/order/get_one_order' + q + '&order_id=' + encodeURIComponent(orderId), {
        credentials: 'include',
      });
      if (!res.ok) return null;
      let j = null;
      try { j = await docJson(res); } catch (e) { return null; }
      if (!j || j.code !== 0) return null;
      const d = j.data || {};
      // Bản 9.4.4 (đối chiếu thật 07/11 đơn 261107MWCYRXUD): Shopee ghi trạng thái huỷ bằng SỐ (status 5,
      // buyer_cancel_reason 9, cancel_userid ≠ 0), chữ "Đã hủy" nằm ở status_info_v2.status (chỉ đọc ô này, không đọc phần mô tả dài).
      // Đơn bình thường: các ô này đều 0 và status_info_v2 = "Chờ lấy hàng".
      let chu = '';
      try { const v = typeof d.status_info_v2 === 'string' ? JSON.parse(d.status_info_v2) : d.status_info_v2; chu = String((v && v.status) || ''); } catch (e) { chu = String(d.status_info_v2 || ''); }
      const vet = [d.order_status, d.status, d.order_status_str, d.cancel_reason, chu]
        .map(function (x) { return String(x || '').toUpperCase(); })
        .join(' ');
      if (vet.indexOf('CANCEL') !== -1 || vet.indexOf('HỦY') !== -1 || vet.indexOf('HUỶ') !== -1) return true;
      if (Number(d.buyer_cancel_reason) > 0 || Number(d.cancel_reason_ext) > 0 || Number(d.cancel_userid) > 0) return true;
      if (d.is_buyercancel_toship === true) return true;
      return false;
    } catch (e) { return null; }
  }

  // Danh sách đơn hoả tốc ĐÃ XỬ LÝ (mục "Đã xử lý" trong Chờ lấy hàng)
  async function layDonDaXuLy() {
    try {
      const q = thamSo();
      if (!q) return null;
      const body = {
        order_list_tab: TAB_CHO_LAY_HANG,
        entity_type: LOAI_HOA_TOC,
        pagination: { page_number: 1, page_size: 50 },
        filter: { order_to_ship_status: TRANG_THAI_DA_XU_LY },
        sort: { sort_type: 2, ascending: true },
        current_time: Math.floor(Date.now() / 1000),
      };
      const res = await fetchCoHan('/api/v3/order/search_order_list_index' + q, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body), credentials: 'include',
      });
      if (!res.ok) return null;
      const j = await docJson(res);
      if (!j || j.code !== 0) return null;
      return (j.data && j.data.index_list) || [];
    } catch (e) { return null; }
  }

  // Đơn nhân sự xử lý xong NHANH tới mức script chưa kịp thấy nó ở danh sách
  // chờ (giữa 2 lần kiểm tra) -> vẫn báo "ĐÃ XỬ LÝ trong vòng 1 phút".
  // Chỉ báo đơn phát sinh SAU lần đọc trước (tức đúng là đơn vừa mới có).
  async function baoDonXuLyNhanh(state, khoa) {
    const truoc = state.lanDocOk || 0;
    const now = Date.now();
    const ds = await layDonDaXuLy();
    if (!ds) return;
    state.lanDocOk = now;
    const coTheBao = lienMach(truoc, now);
    let soTra = 0;
    for (const x of ds) {
      const k = khoa(x);
      if (!k || (state.daThay && state.daThay[k])) continue;
      if (!coTheBao) { ghiDaThay(state, k, true); continue; }
      if (soTra >= 5) break;   // nhiều quá thì để vòng sau, cho nhẹ
      soTra++;
      const ct = await layChiTietCoThuLai(x.order_id);
      if (!ct) continue;       // đọc hỏng: vòng sau thử lại
      ghiDaThay(state, k, true);
      if (Number(ct.tao) * 1000 < truoc - 90000) continue; // đơn cũ, không phải đơn vừa có
      guiLark(ghiPhut(tinDaXuLy(moTaHang(ct.hang), ct.ma || k, ct.dvvc), ct.tao));
    }
  }

  // Đơn ĐÃ XỬ LÝ (đã gọi ĐVVC) mà tài xế huỷ / sàn đang TÌM LẠI TÀI XẾ thì
  // Shopee đưa đơn về lại "Chưa xử lý", dù shop đã làm xong phần mình ->
  // KHÔNG tính trễ, không báo GẤP. Nhận biết bằng logistics_status của đơn.
  // Đối chiếu thật 08/10/2026 (THHX): đơn 2610083YDABE22 lúc đang tìm lại tài
  // xế = 3, lấy hàng xong = 2; đơn đã xử lý bình thường = 1. Mã 4 = lấy hàng
  // không thành (theo bảng mã chuẩn của Shopee, chưa gặp thật).
  // Trả về true = đã xử lý; false = chưa; null = không đọc được (-> vẫn báo GẤP).
  const VAN_CHUYEN_DA_XU_LY = [1, 2, 3, 4];
  async function daGoiVanChuyen(h) {
    try {
      const q = thamSo();
      if (!q || !h.oid) return null;
      const res = await fetchCoHan('/api/v3/order/get_one_order' + q + '&order_id=' + encodeURIComponent(h.oid), {
        credentials: 'include',
      });
      if (!res.ok) return null;
      const j = await docJson(res);
      if (!j || j.code !== 0 || !j.data) return null;
      return VAN_CHUYEN_DA_XU_LY.indexOf(Number(j.data.logistics_status)) !== -1;
    } catch (e) { return null; }
  }

  // ---------- dựng nội dung tin ----------

  function moTaHang(hang) {
    let dung = CAU_HINH.BO_QUA_HANG_0D
      ? hang.filter(function (h) { return h.gia !== 0; })
      : hang.slice();
    if (!dung.length) dung = hang.slice();
    if (CAU_HINH.XEP_THEO_GIA_GIAM) {
      dung.sort(function (a, b) { return (b.gia || 0) - (a.gia || 0); });
    }
    return dung.map(function (h) { return h.ten + ' x' + h.sl; }).join(CAU_HINH.NGAN_CACH_HANG);
  }

  // Dòng 3: "14:30 - 17/09/2026 - 2609179JSJFQ84"
  function mocDon(tsGiay, ma) {
    const phan = [];
    const n = Number(tsGiay);
    if (n && !isNaN(n)) {
      const d = new Date(n * 1000);
      phan.push(hai(d.getHours()) + ':' + hai(d.getMinutes()));
      phan.push(hai(d.getDate()) + '/' + hai(d.getMonth() + 1) + '/' + d.getFullYear());
    }
    if (ma) phan.push(ma);
    return phan.join(' - ');
  }

  function tinMotDon(hang, ma, tsGiay, dvvc) {
    return CAU_HINH.MAU_TIN
      .replace('{n}', 1)
      .replace('{ten}', TEN)
      .replace('{hang}', hang || CAU_HINH.CHUA_DOC_DUOC_HANG)
      .replace('{moc}', mocDon(tsGiay, ma))
      .replace('{dvvc}', dvvc ? ' (' + dvvc + ')' : '');
  }

  // Nguồn để dựng tin "ĐÃ HUỶ": GIỮ ĐÚNG mẫu 3 dòng đã chốt cho tin huỷ
  //   ĐÃ HUỶ 1 đơn hoả tốc SMH TikTok
  //   (TRÒN ĐƠN CHUẨN TUỔI TÝ 14li SMH x4
  //   20:37 - 21/09/2026 - 586185849970656439)
  // — tin báo đơn đổi mẫu (thêm ĐVVC) không làm thay đổi tin huỷ.
  function tinGocHuy(hang, ma, tsGiay, dvvc) {
    return '1 đơn hoả tốc ' + TEN + '\n' + (hang || CAU_HINH.CHUA_DOC_DUOC_HANG) + '\n' + mocDon(tsGiay, ma) + (dvvc ? ' (' + dvvc + ')' : '');
  }

  // "ĐÃ XỬ LÝ trong vòng 1 phút (1 đơn hoả tốc SMH TikTok: 108 CHUẨN RÂU ĐỎ 7li SMH x1 | 586423828017547130 (BeDelivery))"
  // Bản 9.1/6.1: ghi đúng số phút từ lúc phát sinh đơn tới lúc thấy đã xử lý (ít nhất 1)
  function ghiPhut(tin, taoGiay) {
    const t = Number(taoGiay) || 0;
    const phut = t ? Math.max(1, Math.ceil((Date.now() - t * 1000) / 60000)) : CAU_HINH.PHUT_GIU_TRUOC_KHI_BAO;
    return String(tin || '').replace(/trong vòng \d+ phút/, 'trong vòng ' + phut + ' phút');
  }
  function tinDaXuLy(hang, ma, dvvc) {
    return CAU_HINH.MAU_TIN_DA_XU_LY
      .replace('{phut}', CAU_HINH.PHUT_GIU_TRUOC_KHI_BAO)
      .replace('{n}', 1)
      .replace('{ten}', TEN)
      .replace('{hang}', hang || CAU_HINH.CHUA_DOC_DUOC_HANG)
      .replace('{ma}', ma || '')
      .replace('{dvvc}', dvvc ? ' (' + dvvc + ')' : '');
  }

  // Sổ các đơn đã từng thấy (giữ 3 ngày). roi = đơn đã từng rời danh sách chờ
  // (đã xử lý / đã huỷ) — đơn như vậy mà QUAY LẠI danh sách chờ (vd. sàn đang
  // tìm lại tài xế) thì KHÔNG báo lại như đơn mới.
  function ghiDaThay(state, k, roi) {
    if (!state.daThay || typeof state.daThay !== 'object') state.daThay = {};
    const c = state.daThay[k] || { t: Date.now() };
    if (roi) c.roi = 1;
    state.daThay[k] = c;
  }
  function donDepDaThay(state) {
    if (!state.daThay) return;
    const han = Date.now() - 3 * 86400000;
    for (const k of Object.keys(state.daThay)) {
      if (!state.daThay[k] || state.daThay[k].t < han) delete state.daThay[k];
    }
  }
  // Lần đọc trước còn "liền mạch" (không bị gián đoạn) thì mới dám nói đơn
  // được xử lý trong vòng 1 phút; vừa mở máy / vừa gián đoạn thì chỉ ghi sổ.
  function lienMach(truoc, now) {
    return !!truoc && now - truoc <= Math.max(6, CAU_HINH.CHU_KY_GIAY * 3 / 60) * 60000;
  }

  // Dựng tin "đã huỷ" bằng cách nhắc lại NGUYÊN VĂN tin báo đơn cũ (đã lưu
  // sẵn ở h.tinDon), chỉ thêm "ĐÃ HUỶ" ở đầu dòng 1 và đóng ngoặc quanh 2
  // dòng còn lại — để nhân sự nhìn là nhận ra ngay đúng đơn nào.
  //   ĐÃ HUỶ 1 đơn hoả tốc SMH TikTok
  //   (TRÒN ĐƠN CHUẨN TUỔI TÝ 14li SMH x4
  //   20:37 - 21/09/2026 - 586185849970656439)
  function tinDaHuy(tinGoc) {
    const dong = String(tinGoc || '').split('\n');
    if (dong.length < 2) return 'ĐÃ HUỶ ' + (tinGoc || '');
    const dauDe = 'ĐÃ HUỶ ' + dong[0];
    const than = dong.slice(1);
    than[0] = '(' + than[0];
    than[than.length - 1] = than[than.length - 1] + ')';
    return [dauDe].concat(than).join('\n');
  }

  // ---------- bị đăng xuất ----------

  function dangOTrangDangNhap() { return location.host === 'accounts.shopee.vn'; }

  // SỬA Ở BẢN 7.7 — LỖI QUAN TRỌNG: trang đăng nhập nằm ở TÊN MIỀN KHÁC
  // (accounts.shopee.vn) so với trang canh đơn (banhang.shopee.vn). Mỗi tên
  // miền có ô nhớ (localStorage) RIÊNG BIỆT — cờ "đang báo lỗi" lưu lúc kẹt ở
  // trang đăng nhập sẽ KHÔNG thấy được nữa khi quay lại trang canh đơn, nên
  // tin "đã canh lại bình thường" không bao giờ gửi dù máy đã canh lại tốt.
  // Ba mốc thời gian của riêng chuyện đăng xuất này vì vậy phải lưu bằng
  // GM_setValue/GM_getValue — nơi lưu DÙNG CHUNG cho mọi tên miền của cùng
  // một script, không bị chia theo tên miền như localStorage.
  const KEY_DANG_XUAT = 'shopee_hoatoc_dangxuat_' + CAU_HINH.VIET_TAT;

  function trangThaiDangXuat() {
    try { if (typeof GM_getValue === 'function') return GM_getValue(KEY_DANG_XUAT, null) || {}; }
    catch (e) {}
    return {};
  }
  function luuTrangThaiDangXuat(s) {
    try { if (typeof GM_setValue === 'function') GM_setValue(KEY_DANG_XUAT, s); }
    catch (e) {}
  }

  function canhBaoDangXuat() {
    if (!trongGioLamViec()) return;
    const now = Date.now();
    const s = trangThaiDangXuat();
    if (!s.lanLoiDau) s.lanLoiDau = now;
    // Chờ đủ giờ như mọi tin hệ thống khác: đôi khi trang chỉ ghé qua màn đăng
    // nhập vài giây rồi tự vào lại, báo ngay là báo nhầm.
    if (now - s.lanLoiDau < 2 * 60000) { luuTrangThaiDangXuat(s); return; } // 2 phút, đủ loại trừ chuyển trang thoáng qua
    if (now - (s.lanBaoLoiCuoi || 0) <= CAU_HINH.NHAC_DANG_XUAT_PHUT * 60000) { luuTrangThaiDangXuat(s); return; }
    s.lanBaoLoiCuoi = now;
    s.dangBaoLoi = true;
    luuTrangThaiDangXuat(s);
    try { const st = docState(); thongKe(st, 'dangXuat'); luuState(st); } catch (e) {}
    tinHeThong('đã bị đăng xuất trên máy canh đơn, hiện KHÔNG canh được đơn. Cần đăng nhập lại ngay.');
  }

  // Gọi ngay sau khi một vòng ĐỌC ĐƯỢC dữ liệu bình thường trên trang canh
  // đơn — nếu trước đó từng báo "đã bị đăng xuất" (ở tên miền kia) thì báo
  // nốt tin phục hồi, rồi xoá cờ.
  function xoaLoiDangXuat() {
    const s = trangThaiDangXuat();
    if (s.dangBaoLoi && CAU_HINH.BAO_KHI_PHUC_HOI) {
      const soPhut = s.lanLoiDau ? Math.round((Date.now() - s.lanLoiDau) / 60000) : 0;
      tinHeThong('đã canh lại bình thường'
        + (soPhut ? ' (gián đoạn khoảng ' + soPhut + ' phút)' : '') + '.');
    }
    luuTrangThaiDangXuat({});
  }

  // ---------- xử lý lỗi ----------

  function xuLyLoi(state, ket) {
    const now = Date.now();
    state.loiLienTiep += 1;
    if (!state.lanLoiDau) state.lanLoiDau = now;
    thongKe(state, 'loi');

    const soPhut = Math.round((now - state.lanLoiDau) / 60000);
    const duVong = state.loiLienTiep >= CAU_HINH.LOI_LIEN_TIEP_BAO;
    // SỬA: không chờ 15 phút nữa. Báo ngay khi script ĐÃ THỬ TỰ SỬA (tải lại
    // trang) mà vẫn hỏng, hoặc lỗi thuộc loại không tự sửa được (mất phiên).
    const duLau = (state.soTaiLaiDot || 0) >= 2 || (now - state.lanLoiDau) >= CAU_HINH.PHUT_TRUOC_KHI_BAO * 60000;   // bản 9.4.4: tự tải lại 2 lần rồi mới báo
    const matPhien = (ket.loi === 'khong_co_phien');

    // Bản 9.4.4: còn lượt tự tải lại (tối đa 2 lần mỗi đợt lỗi) thì tải lại TRƯỚC, chưa báo nhóm;
    // tải lại 2 lần vẫn hỏng mới báo. (Mất phiên vẫn báo ngay.)
    const soTL = state.soTaiLaiDot || 0;
    if (!matPhien && soTL < 2 && state.loiLienTiep >= CAU_HINH.LOI_LIEN_TIEP_TAI_LAI + soTL
      && (soTL === 0 || now - (state.lanTaiLaiCuoi || 0) > 60000)) {
      state.lanTaiLaiCuoi = now;
      state.daTaiLaiDot = true;
      state.soTaiLaiDot = soTL + 1;
      capNhatO('cho', gioBayGio() + ' — trục trặc, tự tải lại trang lần ' + (soTL + 1) + '/2: ' + (ket.chiTiet || ket.loi));
      luuState(state);
      tuPhucHoi('đọc dữ liệu sàn hỏng ' + state.loiLienTiep + ' lần liền (tự tải lại lần ' + (soTL + 1) + '/2)');
      return;
    }

    // Mất phiên trước đây bắn tin NGAY từ vòng đầu. Nay cũng phải chờ đủ giờ
    // như mọi tin khác — đôi khi chỉ là một lần trả lời bất thường thoáng qua.
    if (matPhien || (duLau && duVong)) {   // bản 9.2: mất phiên báo NGAY vòng đầu
      capNhatO('loi', gioBayGio() + ' — hỏng ' + soPhut + ' phút: ' + (ket.chiTiet || ket.loi));
      if (now - state.lanBaoLoiCuoi > 30 * 60000) {
        state.lanBaoLoiCuoi = now;
        state.dangBaoLoi = true;
        if (matPhien) {
          tinHeThong('mất phiên đăng nhập trên máy canh đơn, KHÔNG còn canh được đơn. Cần đăng nhập lại ngay.');
        } else {
          tinHeThong('không đọc được dữ liệu ' + soPhut + ' phút liền ('
            + (ket.chiTiet || ket.loi)
            + '). Trong lúc này cần tự vào Kênh Người Bán kiểm tra đơn hoả tốc.');
        }
      }
    } else {
      capNhatO('cho', gioBayGio() + ' — trục trặc, đang tự thử lại ('
        + state.loiLienTiep + '/' + CAU_HINH.LOI_LIEN_TIEP_BAO + '): ' + (ket.chiTiet || ket.loi));
    }

    if (!matPhien && (state.soTaiLaiDot || 0) >= 2   // bản 9.4.4: sau 2 lần đầu, cứ 15 phút thử tải lại 1 lần
      && state.loiLienTiep >= CAU_HINH.LOI_LIEN_TIEP_TAI_LAI
      && now - state.lanTaiLaiCuoi > CAU_HINH.GIAN_CACH_TAI_LAI_PHUT * 60000) {
      state.lanTaiLaiCuoi = now;
      state.daTaiLaiDot = true;
      luuState(state);
      tuPhucHoi('đọc dữ liệu sàn hỏng ' + state.loiLienTiep + ' lần liền');
    }
  }

  function xoaLoi(state) {
    if (state.dangBaoLoi && CAU_HINH.BAO_KHI_PHUC_HOI) {
      const soPhut = state.lanLoiDau ? Math.round((Date.now() - state.lanLoiDau) / 60000) : 0;
      tinHeThong('đã canh lại bình thường'
        + (soPhut ? ' (gián đoạn khoảng ' + soPhut + ' phút)' : '') + '.');
    }
    state.dangBaoLoi = false;
    state.loiLienTiep = 0;
    state.lanLoiDau = 0;
    state.daTaiLaiDot = false;
    state.soTaiLaiDot = 0;   // bản 9.4.4
  }

  // ---------- một vòng kiểm tra ----------

  async function motVong() {
    // Mỗi shop chỉ MỘT tab được canh. Tab phụ (lỡ mở thêm) đứng yên, không gọi
    // sàn, không báo tin — tránh hỏi sàn gấp đôi và báo trùng.
    if (!laTabChinh()) {
      lanXongVong = Date.now();
      lanDiemDanhOk = Date.now();
      capNhatO('ngoai_gio', 'Tab phụ — đang có tab khác canh đơn ' + TEN + ', tab này để nghỉ');
      return;
    }
    if (dangChay) { log('vòng trước chưa xong, bỏ qua nhịp này'); return; }
    if (Date.now() - lanChayCuoi < CAU_HINH.NHIP_TOI_THIEU_GIAY * 1000) {
      log('vừa kiểm tra xong, bỏ qua lượt gọi thêm này');
      return;
    }
    lanChayCuoi = Date.now();
    dangChay = true;
    tienTrien();
    try {
      dayHangCho(); // luôn thử đẩy nốt tin còn tồn, kể cả ngoài giờ canh

      if (!trongGioLamViec()) {
        const stNgoai = docState();
        thongKe(stNgoai);
        baoCaoNgay(stNgoai);
        luuState(stNgoai);
        capNhatO('ngoai_gio', 'ngoài giờ canh (' + nhanKhungGio() + ')');
        return;
      }

      diemDanh(); // báo với Healthchecks là script còn sống

      if (dangOTrangDangNhap()) {
        capNhatO('loi', 'ĐÃ BỊ ĐĂNG XUẤT — cần đăng nhập lại');
        canhBaoDangXuat();
        return;
      }
      if (navigator.onLine === false) {
        capNhatO('cho', gioBayGio() + ' — máy đang mất mạng, chờ có mạng lại');
        return;
      }

      const state = docState();
      const ket = await layChiMucCoThuLai();
      if (ket.loi) {
        log('lỗi:', ket);
        xuLyLoi(state, ket);
        luuState(state);
        return;
      }
      kiemTraLechGio(state, ket.gioMayChu);
      xoaLoi(state);
      thongKe(state, 'ok');
      xoaLoiDangXuat();

      // MỘT NGUỒN DUY NHẤT: state.hoSo vừa là danh sách đơn đang chờ, vừa giữ
      // hạn xử lý. Bản cũ nuôi song song state.ids và state.hoSo — hai danh
      // sách lệch nhau là sinh báo trùng hoặc bỏ sót, nên đã gộp làm một.
      const idx = (ket.data && ket.data.index_list) || [];
      const khoa = function (x) { return String(x.package_number || x.order_id || ''); };
      const idHienTai = idx.map(khoa).filter(Boolean);

      if (idHienTai.length) state.lanCuoiThayDon = Date.now();

      // 1) Đơn đã rời danh sách chờ:
      //    - ĐANG TREO (chưa báo nhóm): khách huỷ -> im lặng; nhân sự đã xử lý
      //      -> 1 tin "ĐÃ XỬ LÝ trong vòng 1 phút (...)" thay cho tin báo đơn.
      //    - ĐÃ báo nhóm: khách huỷ -> tin "ĐÃ HUỶ"; xử lý xong -> im lặng.
      for (const k of Object.keys(state.hoSo)) {
        if (idHienTai.indexOf(k) !== -1) continue;
        const h = state.hoSo[k];
        delete state.hoSo[k];
        ghiDaThay(state, k, true);
        if (!h) continue;
        // Tra theo MÃ ĐƠN (order_id), không phải mã kiện hàng
        const daHuy = await kiemTraDaHuy(h.oid || k);
        if (h.daBao) {
          if (daHuy === true) guiLark(tinDaHuy(h.tinHuy || h.tinDon));
        } else if (daHuy === false) {
          guiLark(ghiPhut(h.tinXuLy || tinDaXuLy('', h.ma || k, ''), h.tao));
        }
      }

      // 1b) Đơn đã xử lý xong trước cả khi script kịp thấy
      for (const k of idHienTai) ghiDaThay(state, k);
      await baoDonXuLyNhanh(state, khoa);

      // 2) Đơn mới = có trong danh sách mà chưa có hồ sơ
      const donMoi = idx.filter(function (x) {
        const k = khoa(x);
        return k && !state.hoSo[k];
      });

      log('đơn hoả tốc chưa xử lý:', idHienTai.length, '| đơn mới:', donMoi.length);
      capNhatO(idHienTai.length ? 'canh_bao' : 'ok',
        gioBayGio() + ' — ' + idHienTai.length + ' đơn chờ xử lý', idHienTai.length);

      // 3) Lập hồ sơ cho đơn mới NGAY, nhưng CHƯA báo vào nhóm vội — phải
      //    treo đủ CAU_HINH.PHUT_GIU_TRUOC_KHI_BAO phút tính từ giờ đơn phát
      //    sinh. LUÔN lập hồ sơ ngay cả khi không đọc được chi tiết — nếu
      //    không, vòng sau lại coi là đơn mới.
      for (const d of donMoi) {
        const k = khoa(d);
        const ct = await layChiTietCoThuLai(d.order_id);
        if (ct) {
          state.hoSo[k] = {
            ma: ct.ma || k, oid: String(d.order_id || ''), tao: ct.tao, han: tinhHan(ct.tao), daGap: false,
            thieuChiTiet: false, daBao: false,
            choDenLuc: (Number(ct.tao) || Math.floor(Date.now() / 1000)) * 1000
              + CAU_HINH.PHUT_GIU_TRUOC_KHI_BAO * 60000,
            tinDon: tinMotDon(moTaHang(ct.hang), ct.ma, ct.tao, ct.dvvc),
            tinHuy: tinGocHuy(moTaHang(ct.hang), ct.ma, ct.tao, ct.dvvc),
            tinXuLy: tinDaXuLy(moTaHang(ct.hang), ct.ma || k, ct.dvvc),
          };
        } else {
          const maDuPhong = String(d.order_sn || d.package_number || d.order_id || '').trim() || k;
          state.hoSo[k] = {
            ma: maDuPhong, oid: String(d.order_id || ''), tao: 0, han: 0, daGap: false, thieuChiTiet: true, daBao: false,
            choDenLuc: Date.now() + CAU_HINH.PHUT_GIU_TRUOC_KHI_BAO * 60000,
            tinDon: tinMotDon('', maDuPhong, 0),
            tinHuy: tinGocHuy('', maDuPhong, 0),
            tinXuLy: tinDaXuLy('', maDuPhong, ''),
          };
        }
        if (state.daThay && state.daThay[k] && state.daThay[k].roi) {
          // Đơn từng rời danh sách chờ (đã xử lý) nay QUAY LẠI — vd. sàn đang
          // tìm lại tài xế. Không báo lại như đơn mới.
          state.hoSo[k].daBao = true;
          state.hoSo[k].quayLai = true;
          log('đơn quay lại danh sách chờ, không báo lại:', state.hoSo[k].ma);
        }
      }

      // 4) Hồ sơ còn thiếu chi tiết -> bổ sung để có giờ phát sinh thật, tính
      //    lại đúng mốc được phép báo. Tối đa 3 đơn mỗi vòng cho nhẹ.
      let boSung = 0;
      for (const d of idx) {
        if (boSung >= 3) break;
        const h = state.hoSo[khoa(d)];
        if (!h || !h.thieuChiTiet) continue;
        const ct = await layChiTietCoThuLai(d.order_id);
        if (!ct) continue;
        h.ma = ct.ma || h.ma;
        h.tao = ct.tao;
        h.han = tinhHan(ct.tao);
        h.thieuChiTiet = false;
        h.tinDon = tinMotDon(moTaHang(ct.hang), ct.ma || h.ma, ct.tao, ct.dvvc);
        h.tinHuy = tinGocHuy(moTaHang(ct.hang), ct.ma || h.ma, ct.tao, ct.dvvc);
        h.tinXuLy = tinDaXuLy(moTaHang(ct.hang), ct.ma || h.ma, ct.dvvc);
        if (ct.tao) h.choDenLuc = Number(ct.tao) * 1000 + CAU_HINH.PHUT_GIU_TRUOC_KHI_BAO * 60000;
        boSung += 1;
      }

      // 5) Đơn đã treo đủ giờ và vẫn còn trong danh sách -> báo vào nhóm.
      for (const k of Object.keys(state.hoSo)) {
        const h = state.hoSo[k];
        if (!h || h.daBao) continue;
        if (Date.now() < h.choDenLuc) continue;
        h.daBao = true;
        thongKe(state, 'don');
        guiLark(h.tinDon || tinMotDon('', h.ma || k, h.tao || 0));
      }

      await kiemTraGap(state);
      kiemTraImLang(state);
      donDepDaThay(state);
      luuState(state);
    } catch (e) {
      log('ngoại lệ ngoài dự kiến trong vòng kiểm tra', e);
    } finally {
      dangChay = false;
      lanXongVong = Date.now();
    }
  }

  /* ==========================================================================
     LỚP TỰ KIỂM & TỰ PHỤC HỒI
     --------------------------------------------------------------------------
     Chạy RIÊNG với vòng kiểm tra đơn, mỗi phút tự soát một lượt:
       1. Vòng kiểm tra bị treo (đứng im quá TREO_VONG_PHUT)       -> tự tải lại
       2. Quá NGUNG_VONG_PHUT không có vòng nào chạy xong           -> tự tải lại
       3. Healthchecks không nhận điểm danh quá MAT_DIEM_DANH_PHUT  -> tự tải lại
       4. Gửi Lark bị kẹt                                           -> gỡ kẹt
     Chỉ tự tải lại khi CHẮC trang tải được (máy có mạng, trang sàn đang trả
     lời), tối đa TU_TAI_LAI_TOI_DA_MOI_GIO lần/giờ. Quá số đó mà vẫn hỏng thì
     dừng tự sửa, báo nhóm Hệ thống để người vào xem.
     ========================================================================== */

  const TRANG_CANH = GOC + TRANG_DON;

  function tienTrien() { lanTienTrien = Date.now(); }

  // Mọi lần gọi mạng đều có HẠN CHÓT. Trước đây chỉ cần MỘT lần gọi sàn bị
  // "treo" (mạng chập chờn, sàn không bao giờ trả lời) là vòng kiểm tra đứng
  // mãi: mọi vòng sau đều bị bỏ qua, ngừng điểm danh, ngừng canh đơn — trang
  // vẫn hiện bình thường nhưng script đã "chết", phải F5 tay mới chạy lại.
  function coHan(p, ms, viec) {
    let hen = null;
    return Promise.race([
      p,
      new Promise(function (_, loi) {
        hen = setTimeout(function () {
          loi(new Error('quá ' + Math.round(ms / 1000) + ' giây không phản hồi (' + viec + ')'));
        }, ms);
      }),
    ]).finally(function () { clearTimeout(hen); tienTrien(); });
  }
  function fetchCoHan(url, opts) {
    let ctrl = null;
    try { ctrl = new AbortController(); } catch (e) {}
    const o = Object.assign({}, opts || {});
    if (ctrl) o.signal = ctrl.signal;
    return coHan(fetch(url, o), CAU_HINH.HAN_GOI_MANG_GIAY * 1000, 'gọi sàn')
      .catch(function (e) { try { if (ctrl) ctrl.abort(); } catch (x) {} throw e; });
  }
  function docJson(res) { return coHan(res.json(), CAU_HINH.HAN_GOI_MANG_GIAY * 1000, 'đọc dữ liệu'); }

  // ----- mỗi shop chỉ MỘT tab canh -----
  // Lỡ mở thêm tab cùng sàn trên máy canh (vd. mở chi tiết 1 đơn) thì trước
  // đây cả 2 tab cùng canh: hỏi sàn gấp đôi (dễ bị bắt xác minh), dễ báo trùng.
  const ID_TAB = (function () {
    const k = '__hoatoc_tab_' + CAU_HINH.VIET_TAT;
    try {
      let id = sessionStorage.getItem(k);
      if (!id) { id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); sessionStorage.setItem(k, id); }
      return id;
    } catch (e) { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  })();
  function docTabChinh() {
    try { return JSON.parse(localStorage.getItem(KEY_TAB_CHINH) || 'null'); } catch (e) { return null; }
  }
  function coTabChinhKhac() {
    const c = docTabChinh();
    return !!(c && c.id !== ID_TAB && Date.now() - c.t < CAU_HINH.GIU_TAB_CHINH_GIAY * 1000);
  }
  function laTabChinh() {
    if (coTabChinhKhac()) { laChinhTruocDo = false; return false; }
    try { localStorage.setItem(KEY_TAB_CHINH, JSON.stringify({ id: ID_TAB, t: Date.now() })); } catch (e) {}
    if (!laChinhTruocDo) {
      // vừa nhận canh thay tab khác: đọc lại state mới nhất, đặt lại các mốc
      laChinhTruocDo = true;
      stateBoNho = null;
      hangChoBoNho = null;
      lanTienTrien = lanXongVong = lanDiemDanhOk = Date.now();
    }
    return true;
  }
  function nhaTabChinh() {
    const c = docTabChinh();
    if (c && c.id === ID_TAB) { try { localStorage.removeItem(KEY_TAB_CHINH); } catch (e) {} }
  }

  // ----- tải lại trang AN TOÀN -----
  // Chỉ tải lại khi chắc trang sẽ tải được: máy có mạng VÀ trang sàn đang trả
  // lời. Tải lại lúc mất mạng sẽ ra trang lỗi của Chrome — ở đó script không
  // chạy được nữa, còn tệ hơn để nguyên. Trả về true nếu đã tải lại.
  async function taiLaiAnToan(lyDo, truocKhiTai) {
    if (dangTaiLai) return true;
    if (navigator.onLine === false) { log('chưa tải lại (' + lyDo + '): máy đang mất mạng'); return false; }
    dangTaiLai = true;
    try {
      await fetchCoHan('/favicon.ico?_=' + Date.now(), { cache: 'no-store', credentials: 'omit' });
    } catch (e) {
      dangTaiLai = false;
      log('chưa tải lại (' + lyDo + '): trang sàn chưa trả lời —', e && e.message);
      return false;
    }
    const bd = Date.now();
    while (dangGui && Date.now() - bd < 30000) await nghi(1000); // gửi nốt tin Lark đang dở
    try { if (truocKhiTai) truocKhiTai(); } catch (e) {}
    log('TẢI LẠI TRANG — ' + lyDo);
    nkLuu();
    location.href = TRANG_CANH;
    return true;
  }

  // ----- tự phục hồi, có giới hạn số lần -----
  function docNhatKyTuSua() {
    try { const a = JSON.parse(localStorage.getItem(KEY_TU_SUA) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function ghiNhatKyTuSua(a) {
    try { localStorage.setItem(KEY_TU_SUA, JSON.stringify(a.slice(-40))); } catch (e) {}
  }

  async function tuPhucHoi(lyDo) {
    if (dangTaiLai) return false;
    const now = Date.now();
    const gioQua = docNhatKyTuSua().filter(function (x) { return now - x.t < 3600000; });
    if (gioQua.length >= CAU_HINH.TU_TAI_LAI_TOI_DA_MOI_GIO) {
      capNhatO('loi', gioBayGio() + ' — TỰ SỬA KHÔNG ĐƯỢC: ' + lyDo);
      const tsH = Number(localStorage.getItem(KEY + '_tusuahong') || 0);   // bản 9.4.4
      if (now - tsH > 60 * 60000) {
        try { localStorage.setItem(KEY + '_tusuahong', String(now)); } catch (e) {}
        tinHeThong('đã tự khởi động lại ' + gioQua.length + ' lần trong 1 giờ mà vẫn chưa ổn ('
          + lyDo + '). Cần vào máy canh đơn kiểm tra.');
      }
      return false;
    }
    return taiLaiAnToan(lyDo, function () {
      try { const st = docState(); thongKe(st, 'taiLai'); luuState(st); } catch (e) {}
      const a = docNhatKyTuSua();
      a.push({ t: Date.now(), lyDo: lyDo });
      ghiNhatKyTuSua(a);
    });
  }

  // Dòng nhỏ trên ô trạng thái: lần tự sửa gần nhất (trong 2 giờ qua)

  // ---------- thống kê trong ngày (báo cáo 1 lần sau 21h) ----------
  function ngayHomNay() {
    const d = new Date();
    return hai(d.getDate()) + '/' + hai(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function thongKe(state, khoa, so) {
    if (!state.thongKe || state.thongKe.ngay !== ngayHomNay()) {
      state.thongKe = { ngay: ngayHomNay(), ok: 0, loi: 0, taiLai: 0, xacMinh: 0, dangXuat: 0, don: 0, daBao: false };
    }
    if (khoa) state.thongKe[khoa] = (state.thongKe[khoa] || 0) + (so || 1);
  }
  // Gọi ở vòng đầu tiên sau giờ canh: 1 tin/ngày/tab, dù ngày đó không có lỗi
  function baoCaoNgay(state) {
    if (!CAU_HINH.BAO_CAO_CUOI_NGAY) return;
    const d = new Date();
    const p = d.getHours() * 60 + d.getMinutes();
    if (p < CAU_HINH.GIO_KET_THUC * 60 + CAU_HINH.PHUT_KET_THUC) return;
    const k = state.thongKe;
    if (!k || k.ngay !== ngayHomNay() || k.daBao) return;
    k.daBao = true;
    const phan = [k.ok + ' lượt kiểm tra OK', k.loi + ' lỗi', k.taiLai + ' lần tự tải lại'];
    if (k.xacMinh) phan.push(k.xacMinh + ' lần cần xác minh');
    if (k.dangXuat) phan.push(k.dangXuat + ' lần đăng xuất');
    phan.push(k.don + ' đơn hoả tốc');
    const danhGia = (k.loi + k.xacMinh + k.dangXuat) === 0 ? 'ổn' : (k.taiLai >= 5 || k.xacMinh + k.dangXuat >= 2 ? 'hay bệnh, nên xem lại máy/tài khoản' : 'tạm ổn');
    tinHeThong('báo cáo ngày ' + k.ngay + ': ' + phan.join(', ') + ' → ' + danhGia + '.');
  }

  function ghiChuTuSua() {
    const a = docNhatKyTuSua();
    const x = a[a.length - 1];
    if (!x || Date.now() - x.t > 2 * 3600000) return '';
    const d = new Date(x.t);
    return ' · đã tự khởi động lại lúc ' + hai(d.getHours()) + ':' + hai(d.getMinutes()) + ' (' + x.lyDo + ')';
  }

  function giamSat() {
    try {
      const now = Date.now();
      // Gỡ kẹt gửi Lark (lưới an toàn thứ hai, phòng khi hạn chót trong guiMot hụt)
      if (dangGui && lanBatDauGui && now - lanBatDauGui > (CAU_HINH.HAN_GUI_LARK_GIAY + 15) * 1000) {
        log('gỡ kẹt: lần gửi Lark trước không kết thúc');
        dangGui = false;
        lanBatDauGui = 0;
        dayHangCho();
      }
      if (dangTaiLai || !laTabChinh()) return;
      // Ngoài giờ không điểm danh; mất mạng thì chờ có mạng lại — không phải lỗi
      if (!trongGioLamViec() || navigator.onLine === false) { lanDiemDanhOk = now; return; }
      const phut = function (t) { return Math.round((now - t) / 60000); };
      if (dangChay && now - lanTienTrien > CAU_HINH.TREO_VONG_PHUT * 60000) {
        tuPhucHoi('vòng kiểm tra bị treo ' + phut(lanTienTrien) + ' phút');
        return;
      }
      if (!dangChay && now - lanXongVong > CAU_HINH.NGUNG_VONG_PHUT * 60000) {
        tuPhucHoi('nhịp kiểm tra ngừng chạy ' + phut(lanXongVong) + ' phút');
        return;
      }
      if (CAU_HINH.PING_URL && now - lanDiemDanhOk > CAU_HINH.MAT_DIEM_DANH_PHUT * 60000) {
        // Điểm danh hỏng mà vòng kiểm tra vẫn chạy tốt: thường do đường nối của
        // Tampermonkey bị kẹt — tải lại trang là hết. Nhưng nếu do chính
        // Healthchecks/mạng tới Healthchecks thì tải lại cũng vô ích, nên loại
        // này chỉ thử TỐI ĐA 1 LẦN mỗi giờ.
        const daThu = docNhatKyTuSua().some(function (x) {
          return now - x.t < 3600000 && String(x.lyDo).indexOf('Healthchecks') !== -1;
        });
        if (!daThu) tuPhucHoi('Healthchecks không nhận được điểm danh ' + phut(lanDiemDanhOk) + ' phút');
      }
    } catch (e) { log('lỗi ở lớp tự kiểm', e); }
  }

  // Đang ở trang đăng nhập: 5 phút sau thử quay về trang đơn (an toàn, có mạng mới đi)
  function henQuayVeTrangDon() {
    setTimeout(function thu() {
      taiLaiAnToan('thử quay lại trang đơn').then(function (ok) { if (!ok) setTimeout(thu, 60000); });
    }, 5 * 60000);
  }

  // Tự làm mới trang định kỳ (giữ phiên đăng nhập, dọn bộ nhớ trang). Đang dở
  // vòng kiểm tra thì hoãn từng phút, nhưng KHÔNG hoãn mãi (tối đa 10 lần) —
  // trước đây một lần kẹt là không bao giờ làm mới nữa. Hàng chờ tin Lark đã
  // lưu sẵn nên tải lại không làm mất tin nào.
  function henLamMoi() {
    const min = CAU_HINH.LAM_MOI_TRANG_PHUT_MIN || 60;
    const max = Math.max(min, CAU_HINH.LAM_MOI_TRANG_PHUT_MAX || min);
    const phut = min + Math.random() * (max - min);
    let hoan = 0;
    setTimeout(function thu() {
      if (!trongGioLamViec() || coTabChinhKhac()) { setTimeout(thu, 10 * 60000); return; }
      // Bộ nhớ trình duyệt đầy: tự ý tải lại sẽ mất bản nhớ trong trang -> thôi
      if (khoDay) { setTimeout(thu, 30 * 60000); return; }
      if (dangChay && hoan < 10) { hoan++; setTimeout(thu, 60000); return; }
      taiLaiAnToan('làm mới định kỳ').then(function (ok) { if (!ok) setTimeout(thu, 5 * 60000); });
    }, phut * 60000);
  }

  // Lỗi bất ngờ lúc khởi động thì không để chết im: 1 phút sau tự tải lại

  /* ==========================================================================
     PHẦN QUÁ HẠN (bản 9.0/6.0) — gộp từ script "Cảnh báo đơn quá hạn → Lark"
     --------------------------------------------------------------------------
     - 4 mốc trong ngày (10h00, 11h30, 18h30, 19h00): đơn THƯỜNG (không hoả tốc)
       sắp quá hạn bàn giao. Mỗi đơn chỉ báo đúng 1 lần. Chủ nhật im lặng cả ngày.
     - Đơn "Đang Điều Phối ĐVVC" (Shopee treo) không tính.
     - Tin về nhóm Lark "Quá hạn"; tin lỗi về nhóm "Cảnh báo hệ thống".
     - Chỉ tab chính chạy; đang ở trang đăng nhập / mất mạng / (TikTok) đang nghỉ
       xác minh thì không hỏi sàn. Mọi lệnh có hạn giờ như phần hoả tốc.
     - Khoá bộ nhớ GIỮ NGUYÊN của script cũ -> cài bản gộp không báo lại đơn đã báo.
     ========================================================================== */

  const KEY_QH = KEY.replace('_hoatoc_', '_quahan_');            // <san>_quahan_state_<VT>
  const KEY_QH_HANG_CHO_CU = KEY_HANG_CHO.replace('_hoatoc_', '_quahan_');
  let qhDangChay = false;

  function qhStateMacDinh() { return { ngay: '', mocDaXong: {}, mocLoiTu: {}, daBao: {}, lanBaoLoi: 0 }; }
  function qhDocState() {
    try {
      const s = Object.assign(qhStateMacDinh(), JSON.parse(localStorage.getItem(KEY_QH) || '{}'));
      ['mocDaXong', 'mocLoiTu', 'daBao'].forEach(function (k) { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
      return s;
    } catch (e) { return qhStateMacDinh(); }
  }
  function qhLuuState(s) {
    const cat = Date.now() - 7 * 86400000;
    for (const k of Object.keys(s.daBao)) if (!s.daBao[k] || s.daBao[k] < cat) delete s.daBao[k];
    if (s.daNhac) for (const k of Object.keys(s.daNhac)) if (s.daNhac[k] < cat) delete s.daNhac[k];
    try { localStorage.setItem(KEY_QH, JSON.stringify(s)); } catch (e) { baoKhoDay(e); }
  }
  const qhNhanNgay = (d) => d.getFullYear() + '-' + hai(d.getMonth() + 1) + '-' + hai(d.getDate());
  const qhNhanMoc = (m) => hai(m.gio) + ':' + hai(m.phut);
  function qhSangNgayMoi(state, homNay) {
    if (state.ngay !== homNay) { state.ngay = homNay; state.mocDaXong = {}; state.mocLoiTu = {}; }
    return state;
  }
  // Tin còn tồn trong hàng chờ của script quá hạn cũ -> chuyển sang hàng chờ chung (1 lần)
  function qhChuyenHangChoCu() {
    try {
      const a = JSON.parse(localStorage.getItem(KEY_QH_HANG_CHO_CU) || '[]');
      if (Array.isArray(a)) for (const t of a) if (t && t.text) guiLark(t.text, 'qua_han');
      localStorage.removeItem(KEY_QH_HANG_CHO_CU);
    } catch (e) {}
  }
  function capNhatOQH(muc, chu) { O.qh = { muc: muc || '', chu: chu || '' }; veO(); }

  // ---- hạn của từng đơn: đơn trước 18h -> trong ngày; từ 18h hoặc chủ nhật -> trưa ngày làm việc kế
  const qhLaChuNhat = (d) => d.getDay() === 0;
  function qhNgayLamViec(y, thang, ngay) { const d = new Date(y, thang, ngay); while (qhLaChuNhat(d)) d.setDate(d.getDate() + 1); return d; }
  function qhDatGio(d, gio, phut) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), gio, phut || 0, 0); }
  function qhDonSangSom(luc) { return !!luc && luc.getHours() < 8 && !qhLaChuNhat(luc); }
  function qhTinhHan(luc, loai) {
    if (!luc) return null;
    const sang = (loai === 'xuly') ? [10, 0] : [11, 30];
    const cuoiNgay = (loai === 'xuly') ? [18, 30] : [20, 0];   // bản 9.4.1: hạn quét 20:00
    // bản 9.4.2: đơn 0:00–8:00 (ngày làm việc) được in lúc 8h cùng đơn tối qua -> chung đợt quét 11:30
    if (loai !== 'xuly' && qhDonSangSom(luc)) return qhDatGio(luc, sang[0], sang[1]);
    if (luc.getHours() < 18 && !qhLaChuNhat(luc)) return qhDatGio(luc, cuoiNgay[0], cuoiNgay[1]);
    const d = qhNgayLamViec(luc.getFullYear(), luc.getMonth(), luc.getDate() + 1);
    return qhDatGio(d, sang[0], sang[1]);
  }
  function qhQuaHan(luc, loai) { const h = qhTinhHan(luc, loai); return !!h && Date.now() >= h.getTime(); }

  // ---- chữ trong tin
  function vietTatHang(ten) {
    const t = String(ten || '');
    if (/SPX/i.test(t)) return 'SPX';
    if (/Giao Hàng Nhanh|GHN/i.test(t)) return 'GHN';
    if (/J&T/i.test(t)) return 'J&T';
    if (/Viettel/i.test(t)) return 'VTP';
    if (/Ninja/i.test(t)) return 'Ninja';
    if (/Ahamove/i.test(t)) return 'Ahamove';
    if (/BeDelivery|^Be\b/i.test(t)) return 'Be';
    if (/^BEST\s+Express$/i.test(t)) return 'BEST';   // bản 9.4.2: chỉ BEST bỏ chữ Express
    return t || 'chưa rõ';
  }
  function rutGonMa(ds, ghi) {
    const toiDa = CAU_HINH.QUA_HAN.SO_MA_TOI_DA || 2;
    const a = ds.slice(0, toiDa).map(ghi || function (o) { return o.ma; });
    if (ds.length > toiDa) a.push('…');
    return a.join(', ');
  }
  // "⏰ SMH 🟠 · 3 đơn chưa xử lý · hạn 12h · Quá hạn\n<mã>, <mã>, …"
  // "🚚 SMH 🟠 · 5 đơn chưa lấy · hạn 12h · Quá hạn\nSPX 3, GHN 2 · <mã>, <mã>, …"
  // Bản 9.1/6.1 — tin nhóm Quá hạn (bot từ khoá "hạn"):
  //   ⏰ SMH 🟠 · 3 đơn chưa xử lý · hạn 12h        / mã, mã, mã            (1 tin)
  //   🚚 GHN có 3 đơn chưa quét · hạn 12h · SMH 🟠   / mã, mã, mã            (mỗi hãng 1 tin, SPX cuối)
  function theoHang(ds) {
    const gom = {};
    ds.forEach(function (o) { const h = vietTatHang(o.dv); (gom[h] = gom[h] || []).push(o); });
    return Object.keys(gom).sort(function (a, b) {
      if (a === 'SPX') return 1; if (b === 'SPX') return -1;   // SPX luôn gửi sau cùng
      return gom[b].length - gom[a].length || a.localeCompare(b);
    }).map(function (h) { return { hang: h, ds: gom[h] }; });
  }
  // Bản 9.4.2: mã đơn hạn 12h ghi trước, đơn 0:00–8:00 (hạn trong ngày) ghi sau kèm "(hạn trong ngày)" — chỉ mốc 11:30
  function maQuet(ds, moc) {
    const sangSom = function (o) { return moc.han === 'hạn 12h' && qhDonSangSom(o.luc) && o.luc.toDateString() === new Date().toDateString(); };
    const a = ds.filter(function (o) { return !sangSom(o); }).concat(ds.filter(sangSom));
    const toiDa = CAU_HINH.QUA_HAN.SO_MA_TOI_DA_QUET || 20;
    const hien = a.slice(0, toiDa);
    let t = hien.map(function (o) { return o.ma; }).join(', ');
    if (hien.some(sangSom)) t += ' (hạn trong ngày)';
    if (a.length > toiDa) t += ', …';
    return t;
  }

  // Bản 9.4.3: mốc 11:30 — toàn bộ đơn chờ lấy hàng, chia 3 nhóm theo hạn
  function qhNhom1130(o) {
    const dauNgay = new Date(); dauNgay.setHours(0, 0, 0, 0);
    if (o.luc && o.luc.getTime() >= dauNgay.getTime()) return 'ngay';
    const h = qhTinhHan(o.luc, 'bangiao');
    if (h && h.getTime() < dauNgay.getTime()) return 'ton';
    return 'h12';
  }
  function qhTin1130(ds) {
    const toiDa = CAU_HINH.QUA_HAN.SO_MA_TOI_DA_QUET || 20;
    const dong = function (nhan, a) {
      if (!a.length) return null;
      return nhan + ' (' + a.length + '): ' + a.slice(0, toiDa).map(function (o) { return o.ma; }).join(', ') + (a.length > toiDa ? ', …' : '');
    };
    return theoHang(ds).map(function (g) {
      const n = { h12: [], ton: [], ngay: [] };
      g.ds.forEach(function (o) { n[qhNhom1130(o)].push(o); });
      const d = [];
      if (!n.h12.length && !n.ton.length) d.push('Không có đơn quá hạn');
      [dong('Hạn 12h', n.h12), dong('Tồn từ hôm qua', n.ton), dong('Hạn trong ngày', n.ngay)].forEach(function (x) { if (x) d.push(x); });
      return '🚚 ' + g.hang + ' có ' + g.ds.length + ' đơn chưa quét ' + TEN_NGAN + '\n' + d.join('\n');
    });
  }
  function qhDungTin(moc, ds) {
    if (moc.loai === 'xuly') {
      return ['⏰ ' + TEN_NGAN + ' · ' + ds.length + ' đơn chưa xử lý · ' + moc.han + '\n' + rutGonMa(ds)];
    }
    return theoHang(ds).map(function (g) {
      return '🚚 ' + g.hang + (moc.nhacLai ? ' vẫn còn ' : ' có ') + g.ds.length + ' đơn chưa quét ' + TEN_NGAN + '\n' + maQuet(g.ds, moc);   // bản 9.4.2
    });
  }

  // ---- một mốc
  async function qhChayMoc(state, moc) {
    const C = CAU_HINH.QUA_HAN, khoaMoc = qhNhanMoc(moc);
    // bản 9.4.3: mốc 11:30 chỉ chạy trong 2,5 giờ sau mốc (cài script buổi chiều không bắn tin 11:30 muộn)
    if (moc.tatCa) { const m = new Date(); m.setHours(moc.gio, moc.phut, 0, 0); if (Date.now() - m.getTime() > 150 * 60000) { state.mocDaXong[khoaMoc] = true; log('quá hạn: mốc ' + khoaMoc + ' đã qua lâu, bỏ qua'); return; } }
    let kq = null;
    for (let i = 0; i <= C.SO_LAN_THU_LAI; i++) {
      if (i > 0) await nghi(C.CHO_THU_LAI_GIAY * 1000);
      try { kq = await qhDonQuaHan(moc.loai, moc.tatCa); }
      catch (e) { kq = { loi: 'ngoại lệ: ' + String(e && e.message) }; }
      if (!kq.loi) break;
      log('quá hạn: mốc ' + khoaMoc + ' thử lần ' + (i + 1) + ' hỏng:', kq.loi);
    }
    if (kq.loi) {
      if (!state.mocLoiTu[khoaMoc]) state.mocLoiTu[khoaMoc] = Date.now();
      const phut = Math.round((Date.now() - state.mocLoiTu[khoaMoc]) / 60000);
      capNhatOQH('cho', '⏰ mốc ' + khoaMoc + ' lỗi ' + phut + ' phút');
      if (phut >= C.PHUT_KIEN_NHAN_KHI_LOI && Date.now() - state.lanBaoLoi > 3 * 3600000) {
        state.lanBaoLoi = Date.now();
        state.mocDaXong[khoaMoc] = true;   // thôi, khỏi thử nữa cho hôm nay
        capNhatOQH('loi', '⏰ mốc ' + khoaMoc + ' lỗi ' + phut + ' phút');
        tinHeThong('quá hạn mốc ' + khoaMoc + ' lỗi ' + phut + ' phút (' + kq.loi + ')');
      }
      return;
    }
    delete state.mocLoiTu[khoaMoc];
    state.mocDaXong[khoaMoc] = true;
    if (moc.tatCa) {   // bản 9.4.3: mốc 11:30
      log('quá hạn: mốc ' + khoaMoc + ': ' + kq.ds.length + ' đơn đang chờ lấy hàng');
      if (!kq.ds.length) { capNhatOQH('', '⏰ mốc ' + khoaMoc + ' xong'); return; }
      for (const o of kq.ds) if (qhNhom1130(o) !== 'ngay' && !state.daBao[o.ma]) state.daBao[o.ma] = Date.now();
      qhTin1130(kq.ds).forEach(function (t) { guiLark(t, 'qua_han'); });
      capNhatOQH('', '⏰ mốc ' + khoaMoc + ' đã báo ' + kq.ds.length + ' đơn');
      return;
    }
    // Mốc nhắc lại (20:30): chỉ nhắc đơn ĐÃ báo hôm nay mà vẫn còn; mốc thường: chỉ đơn chưa từng báo
    const dauNgay = new Date(); dauNgay.setHours(0, 0, 0, 0);
    const moi = moc.nhacLai
      ? kq.ds.filter(function (o) { return state.daBao[o.ma] && state.daBao[o.ma] >= dauNgay.getTime() && !(state.daNhac || {})[o.ma]; })
      : kq.ds.filter(function (o) { return !state.daBao[o.ma]; });
    log('quá hạn: mốc ' + khoaMoc + ': ' + kq.ds.length + ' đơn quá hạn, ' + moi.length + ' đơn ' + (moc.nhacLai ? 'cần nhắc lại' : 'chưa từng báo'));
    if (!moi.length) { capNhatOQH('', '⏰ mốc ' + khoaMoc + ' xong'); return; }
    if (moc.nhacLai) { state.daNhac = state.daNhac || {}; for (const o of moi) state.daNhac[o.ma] = Date.now(); }
    else for (const o of moi) state.daBao[o.ma] = Date.now();
    qhDungTin(moc, moi).forEach(function (t) { guiLark(t, 'qua_han'); });
    capNhatOQH('', '⏰ mốc ' + khoaMoc + ' đã báo ' + moi.length + ' đơn');
  }

  // ---- vòng ngó đồng hồ (2 phút/lần). Mỗi vòng làm đúng 1 mốc cho nhẹ.
  async function qhMotVong() {
    const C = CAU_HINH.QUA_HAN;
    if (!C.BAT || qhDangChay) return;
    if (!laTabChinh() || dangOTrangDangNhap() || dangTaiLai) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    if (typeof nghiDenKhi !== 'undefined' && Date.now() < nghiDenKhi) return;   // TikTok đang nghỉ xác minh
    qhDangChay = true;
    try {
      const gio = new Date();
      if (C.BO_CHU_NHAT && qhLaChuNhat(gio)) { capNhatOQH('', ''); return; }
      const state = qhSangNgayMoi(qhDocState(), qhNhanNgay(gio));
      const phutBayGio = gio.getHours() * 60 + gio.getMinutes();
      let conLai = null;
      for (const moc of C.MOC) {
        const khoaMoc = qhNhanMoc(moc);
        if (phutBayGio < moc.gio * 60 + moc.phut) { if (conLai === null) conLai = khoaMoc; continue; }
        if (state.mocDaXong[khoaMoc]) continue;
        await qhChayMoc(state, moc);
        qhLuuState(state);
        return;
      }
      qhLuuState(state);
      if (O.qh.muc !== 'loi') capNhatOQH('', conLai ? '⏰ chờ mốc ' + conLai : '⏰ xong 4 mốc');
    } catch (e) {
      log('quá hạn: ngoại lệ', e);
    } finally { qhDangChay = false; }
  }

  // ---- tin nghiệm thu: gửi 1 lần sau khi cài bản mới (Hệ thống + Quá hạn, KHÔNG vào nhóm Hoả tốc)
  function nghiemThu() {
    try {
      const k = KEY + '_nghiemthu';
      if (localStorage.getItem(k) === PHIEN_BAN) return;
      localStorage.setItem(k, PHIEN_BAN);
    } catch (e) { return; }
    tinHeThong('🧪 bản ' + PHIEN_BAN + ' · Hệ thống OK');   // bản 9.4: chỉ nhóm Cao hệ thống
  }

  function qhBatDau() {
    qhChuyenHangChoCu();
    setTimeout(qhMotVong, 9000);
    setInterval(qhMotVong, CAU_HINH.QUA_HAN.NHIP_KIEM_GIAY * 1000);
    if (typeof kiemChuaIn === 'function') { setTimeout(kiemChuaIn, 25000); setInterval(kiemChuaIn, 60000); }
    log('quá hạn: canh các mốc', CAU_HINH.QUA_HAN.MOC.map(qhNhanMoc).join(', '));
  }

  // ---- Shopee: đơn thường (entity_type 1, 2) ở tab Chờ lấy hàng; chi tiết từng đơn để lấy giờ + ĐVVC
  const QH_LOAI_KHONG_HOA_TOC = [1, 2];
  const QH_LA_DIEU_PHOI = /đi[eềệ]u\s*ph[oốồ]i/i;
  const qhLaDieuPhoi = (dv, dvAn) => QH_LA_DIEU_PHOI.test(String(dv || '').normalize('NFC')) || QH_LA_DIEU_PHOI.test(String(dvAn || '').normalize('NFC'));

  async function qhPost(duong, body) {
    const q = thamSo();
    if (!q) return { loi: 'không còn cookie đăng nhập' };
    const res = await fetchCoHan(duong + q, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      credentials: 'include', body: JSON.stringify(body),
    });
    if (res.redirected && String(res.url).indexOf('accounts.shopee.vn') !== -1) return { loi: 'bị chuyển về trang đăng nhập' };
    if (!res.ok) return { loi: 'HTTP ' + res.status };
    let j = null;
    try { j = await docJson(res); } catch (e) { j = null; }
    if (!j || typeof j.code === 'undefined') return { loi: 'phản hồi lạ' };
    if (j.code !== 0) return { loi: 'mã ' + j.code + (j.message ? ' - ' + j.message : '') };
    return { data: j.data || {} };
  }
  async function qhTimDon(trangThai) {
    const daCo = {}, idx = [];
    for (const loaiDon of QH_LOAI_KHONG_HOA_TOC) {
      const kq = await qhPost('/api/v3/order/search_order_list_index', {
        order_list_tab: TAB_CHO_LAY_HANG, entity_type: loaiDon,
        pagination: { page_number: 1, page_size: 100 },
        filter: { order_to_ship_status: trangThai },
        sort: { sort_type: 2, ascending: true },
        current_time: Math.floor(Date.now() / 1000),
      });
      if (kq.loi) return kq;
      for (const x of (kq.data.index_list || [])) {
        if (!x.order_id || daCo[x.order_id]) continue;
        daCo[x.order_id] = true; idx.push(x);
      }
    }
    return { idx: idx };
  }
  async function qhChiTiet(orderId) {
    const q = thamSo();
    if (!q) return null;
    const res = await fetchCoHan('/api/v3/order/get_one_order' + q + '&order_id=' + encodeURIComponent(orderId), { credentials: 'include' });
    if (!res.ok) return null;
    let j = null;
    try { j = await docJson(res); } catch (e) { j = null; }
    if (!j || j.code !== 0) return null;
    const d = j.data || {};
    return {
      ma: String(d.order_sn || '').trim(),
      luc: d.shipping_confirm_time ? new Date(d.shipping_confirm_time * 1000) : (d.create_time ? new Date(d.create_time * 1000) : null),
      dv: String(d.fulfillment_carrier_name || '').trim(),
      dieuPhoi: qhLaDieuPhoi(d.fulfillment_carrier_name, d.masking_carrier_name),
    };
  }
  async function qhDonQuaHan(loai, tatCa) {   // bản 9.4.3: tatCa = lấy cả đơn chưa quá hạn
    const kq = await qhTimDon(loai === 'xuly' ? TRANG_THAI_CHUA_XU_LY : TRANG_THAI_DA_XU_LY);
    if (kq.loi) return kq;
    const ds = [];
    for (let i = 0; i < kq.idx.length; i += 5) {
      if (i) await nghi(500);   // lô 5 đơn, nghỉ nửa giây giữa các lô cho nhẹ
      const lo = await Promise.all(kq.idx.slice(i, i + 5).map(function (x) { return qhChiTiet(x.order_id).catch(function () { return null; }); }));
      for (const ct of lo) {
        if (!ct || !ct.ma || ct.dieuPhoi) continue;
        if (!tatCa && !qhQuaHan(ct.luc, loai)) continue;
        ds.push({ ma: ct.ma, luc: ct.luc, dv: ct.dv });
      }
    }
    ds.sort(function (a, b) { return (a.luc ? a.luc.getTime() : 0) - (b.luc ? b.luc.getTime() : 0); });
    return { ds: ds };
  }

  // ---- Shopee: đơn ĐÃ XỬ LÝ mà CHƯA IN NHÃN (Giao Hàng Loạt → Tạo phiếu → Đã xử lý) quá 15 phút
  const CHUA_IN = { BAT: true, NHIP_PHUT: 5, QUA_HAN_PHUT: 15, PHUT_BAO_LOI: 60 };
  const KEY_CHUA_IN = 'shopee_chuain_state_' + CAU_HINH.VIET_TAT;   // giữ khoá của script cũ
  let dangKiemIn = false;
  function docCI() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY_CHUA_IN) || '{}');
      return { thay: s.thay || {}, daBao: s.daBao || {}, lan: s.lan || 0, loiTu: s.loiTu || 0, baoLoi: s.baoLoi || 0 };
    } catch (e) { return { thay: {}, daBao: {}, lan: 0, loiTu: 0, baoLoi: 0 }; }
  }
  function luuCI(s) {
    const cat = Date.now() - 7 * 86400000;
    for (const k of Object.keys(s.daBao)) if (!s.daBao[k] || s.daBao[k] < cat) delete s.daBao[k];
    try { localStorage.setItem(KEY_CHUA_IN, JSON.stringify(s)); } catch (e) { baoKhoDay(e); }
  }
  async function kienDaXuLy() {
    const gap = {};
    let tong = null;
    for (let trang = 1; trang <= 10; trang++) {
      const kq = await qhPost('/api/v3/order/search_mass_shipment_index', {
        mass_shipment_tab: 301, filter: { process_status: 2 },
        pagination: { from_page_number: 1, page_number: trang, page_size: 50 },
        sort: { sort_type: 2, ascending: true }, current_time: Math.floor(Date.now() / 1000),
      });
      if (kq.loi) return kq;
      const ds = kq.data.index_list || [];
      const t = ((kq.data.pagination || {}).totals || {}).packages;
      if (typeof t === 'number') tong = t;
      let moi = 0;
      for (const x of ds) if (x.package_number && !gap[x.package_number]) { gap[x.package_number] = x; moi++; }
      if (!ds.length || !moi || tong === null || Object.keys(gap).length >= tong) break;
    }
    return { ds: Object.values(gap) };
  }
  async function kienChuaIn(kien) {
    const ra = [];
    for (let i = 0; i < kien.length; i += 50) {
      const lo = kien.slice(i, i + 50);
      const kq = await qhPost('/api/v3/logistics/can_print_waybill', {
        group_list: lo.map(function (x) { return { primary_package_number: x.package_number, group_shipment_id: 0, package_list: [{ package_number: x.package_number }] }; }),
        shop_id: lo[0].shop_id, region_id: lo[0].region_id || 'VN', page_type: 2,
      });
      if (kq.loi) return kq;
      for (const it of (kq.data.list || [])) {
        if (it.is_awb_printed === false) ra.push({ kien: it.primary_package_number, orderId: (((it.package_list || [])[0]) || {}).order_id || null });
      }
    }
    return { ds: ra };
  }
  async function kiemChuaIn() {
    if (!CHUA_IN.BAT || dangKiemIn || !trongGioLamViec()) return;
    if (CAU_HINH.QUA_HAN.BO_CHU_NHAT && qhLaChuNhat(new Date())) return;   // bản 9.1: chủ nhật im lặng cả chưa in
    if (!laTabChinh() || dangOTrangDangNhap() || dangTaiLai) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    const s = docCI();
    if (Date.now() - s.lan < (CHUA_IN.NHIP_PHUT * 60 - 20) * 1000) return;
    s.lan = Date.now();
    luuCI(s);
    dangKiemIn = true;
    try {
      let kq = await kienDaXuLy();
      if (!kq.loi) kq = kq.ds.length ? await kienChuaIn(kq.ds) : { ds: [] };
      if (kq.loi) {
        if (!s.loiTu) s.loiTu = Date.now();
        const phut = Math.round((Date.now() - s.loiTu) / 60000);
        log('quá hạn: kiểm chưa in hỏng (' + phut + ' phút):', kq.loi);
        if (phut >= CHUA_IN.PHUT_BAO_LOI && Date.now() - s.baoLoi > 3 * 3600000) {
          s.baoLoi = Date.now();
          capNhatOQH('loi', '🖨 kiểm chưa in lỗi ' + phut + ' phút');
          tinHeThong('không kiểm được chưa in ' + phut + ' phút (' + kq.loi + ')');
        } else capNhatOQH('cho', '🖨 kiểm chưa in lỗi ' + phut + ' phút');
        luuCI(s);
        return;
      }
      s.loiTu = 0;
      const nay = Date.now(), conChuaIn = {};
      for (const x of kq.ds) { conChuaIn[x.kien] = true; if (!s.thay[x.kien]) s.thay[x.kien] = { tu: nay, orderId: x.orderId }; }
      for (const k of Object.keys(s.thay)) if (!conChuaIn[k]) delete s.thay[k];
      const canBao = Object.keys(s.thay).filter(function (k) { return !s.daBao[k] && nay - s.thay[k].tu >= CHUA_IN.QUA_HAN_PHUT * 60000; });
      if (canBao.length) {
        const ds = [];
        for (const k of canBao) {
          const ct = await qhChiTiet(s.thay[k].orderId).catch(function () { return null; });
          if (ct && ct.dieuPhoi) { delete s.thay[k]; continue; }   // đang điều phối -> không báo, đếm lại khi gán xong
          ds.push({ ma: (ct && ct.ma) || ('kiện ' + k), dv: (ct && ct.dv) || '' });
          s.daBao[k] = nay;
        }
        if (ds.length) {
          guiLark('🖨 Mục "Tạo phiếu" có ' + ds.length + ' đơn ' + TEN_NGAN + ' chưa in\n' + rutGonMa(ds), 'qua_han');
          log('quá hạn: đã báo ' + ds.length + ' đơn chưa in');
        }
      }
      if (O.qh.muc !== 'loi') capNhatOQH('', (O.qh.chu || '').replace(/ · 🖨.*$/, '') + ' · 🖨 chưa in: ' + Object.keys(s.thay).length);
      luuCI(s);
    } catch (e) {
      log('quá hạn: kiểm chưa in ngoại lệ', e);
    } finally { dangKiemIn = false; }
  }

  function khoiDong() {
    try { batDau(); }
    catch (e) {
      log('lỗi khi khởi động', e);
      setTimeout(function () { tuPhucHoi('lỗi khi khởi động script'); }, 60000);
    }
  }

  // ---------- khởi động ----------

  function batDau() {
    soTinTonDong = docHangCho().length;

    if (dangOTrangDangNhap()) {
      capNhatO('loi', 'ĐÃ BỊ ĐĂNG XUẤT — cần đăng nhập lại');
      canhBaoDangXuat();
      // Bị đăng xuất KHÔNG phải là máy chết: script vẫn đang chạy, chỉ là trang
      // cần đăng nhập lại. Vì vậy vẫn điểm danh đều với Healthchecks, để nhóm chỉ
      // nhận MỘT tin "đã bị đăng xuất" thay vì kèm thêm tin "máy đã NGỪNG hoạt động".
      // Mỗi phút: điểm danh + kiểm tra đã đủ giờ báo "đăng xuất" chưa (báo sau
      // 2 phút, không chờ lần tải lại kế tiếp). Ô trạng thái vẫn chớp đỏ.
      (function nhipCho() {
        if (trongGioLamViec()) {
          diemDanh();
          try { canhBaoDangXuat(); } catch (e) {}
        }
        capNhatO('loi', 'ĐÃ BỊ ĐĂNG XUẤT — cần đăng nhập lại');
        setTimeout(nhipCho, 60000);
      })();
      nhipTim();
      henQuayVeTrangDon();
      return;
    }

    log('đang canh shop:', TEN, '— khung giờ', nhanKhungGio());
    capNhatO('ok', 'đang khởi động, chờ lần kiểm tra đầu tiên…');
    motVong();

    // Nhịp xê dịch ngẫu nhiên cho đỡ giống máy quét đều tăm tắp
    (function hen() {
      const dao = CAU_HINH.CHU_KY_DAO_DONG_GIAY || 0;
      const giay = CAU_HINH.CHU_KY_GIAY + (Math.random() * 2 - 1) * dao;
      setTimeout(function () { motVong(); hen(); }, Math.max(20, giay) * 1000);
    })();

    henLamMoi();
    qhBatDau();                             // bản 9.0: phần quá hạn (4 mốc) + chưa in nhãn
    nghiemThu();
    setInterval(giamSat, 60000);            // lớp tự kiểm, mỗi phút 1 lượt
    nhipTim();
    window.addEventListener('pagehide', nhaTabChinh);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) motVong();
    });
    window.addEventListener('online', function () { setTimeout(motVong, 2000); });
  }


  /* ==========================================================================
     NHẮC SIZE 108 HẠT 8LI (bản 9.5)
     Đơn có món "108 … 8li" -> tự gửi 1 tin nhắc khách kiểm tra cổ tay, qua chính
     khung chat của sàn (script thao tác như người gõ: trang tự gắn mã bảo vệ).
     - Mỗi đơn đúng 1 lần, tối đa NS.TOI_DA_NGAY tin/ngày, chạy cả ban đêm.
     - Gửi trong 1 tab nền mở riêng, xong tự đóng; mọi bước ghi nhật ký.
     - Hỏng 2 lần -> báo nhóm Cao hệ thống kèm mã đơn + câu mẫu để nhắn tay.
     ========================================================================== */
  const NS = {
    BAT: true,
    TOI_DA_NGAY: 20,
    NHIP_PHUT: 6,            // hỏi sàn tìm đơn mới mỗi bấy nhiêu phút (± 30%)
    HAN_GUI_GIAY: 150,              // 1 lần gửi quá bấy nhiêu giây coi như hỏng
    MAC_DINH: 'Dạ bạn đã đặt vòng 108 hạt size 8li (size lớn) ạ. Cho Shop hỏi bạn có kích thước cổ tay chưa ạ? '
      + 'Nếu chưa nhờ bạn quấn tờ 100k quanh cổ tay, nếu hở 4–6cm hợp 8li; hở 2–4cm nên chọn 7li; hở 0–2cm nên chọn 6li ạ. '
      + 'Nếu bạn cần đổi size khác nhờ bạn nhắn sớm giúp Shop nhé',
  };
  const NS_K = { tin: 'nhacsize_tin', so: 'nhacsize_so_' + CAU_HINH.VIET_TAT, job: 'nhacsize_job_' + CAU_HINH.VIET_TAT, kq: 'nhacsize_kq_' + CAU_HINH.VIET_TAT };
  function nsGet(k, d) { try { const v = GM_getValue(k, null); return v === null || v === undefined ? d : (typeof v === 'string' && /^[\[{]/.test(v) ? JSON.parse(v) : v); } catch (e) { return d; } }
  function nsSet(k, v) { try { GM_setValue(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) {} }
  function nsTin() { const t = nsGet(NS_K.tin, ''); return String(t || '').trim() || NS.MAC_DINH; }
  // sổ: { xet: {id: ts}, gui: {id: {t, ma, ok, lan, loi}}, ngay: 'dd/mm', dem: n }
  function nsSo() {
    const s = nsGet(NS_K.so, {}) || {};
    s.xet = s.xet || {}; s.gui = s.gui || {};
    const cat = Date.now() - 10 * 86400000;
    for (const k of Object.keys(s.xet)) if (s.xet[k] < cat) delete s.xet[k];
    for (const k of Object.keys(s.gui)) if ((s.gui[k].t || 0) < cat) delete s.gui[k];
    const hom = ngayHomNay();
    if (s.ngay !== hom) { s.ngay = hom; s.dem = 0; }
    return s;
  }
  function nsLuu(s) { nsSet(NS_K.so, s); }
  // món khớp: "108" ở tên/SKU/phân loại VÀ "8li" ở SKU hoặc tên phân loại (không lấy tên sản phẩm
  // vì tên sản phẩm hay ghi đủ "6li 7li 8li")
  function nsKhop(phanLoai, tatCa) {
    return /(^|[^0-9])8\s*li\b/i.test(phanLoai) && /(^|[^0-9])108([^0-9]|$)/.test(tatCa);
  }
  const nsSnip = (t) => String(t).replace(/\s+/g, ' ').trim().slice(0, 40);
  const nsNghi = (ms) => new Promise((r) => setTimeout(r, ms));
  async function nsCho(fn, ms, ten) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await nsNghi(300); }
    throw new Error('quá ' + Math.round(ms / 1000) + ' giây chưa thấy ' + ten);
  }
  function nsDatChu(ta, chu) {
    const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    ta.focus(); set.call(ta, chu);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function nsBaoKetQua(id, ok, loi) { nsSet(NS_K.kq, { id: String(id), ok: !!ok, loi: loi || '', t: Date.now() }); }

  // ---- tab chính: tìm đơn khớp ----
  let nsDangChay = false;
  async function nsMotVong(lyDo) {
    if (!NS.BAT || nsDangChay) return;
    if (!laTabChinh() || dangOTrangDangNhap()) return;
    if (typeof nghiDenKhi !== 'undefined' && Date.now() < nghiDenKhi) return;   // sàn đang bắt nghỉ
    nsDangChay = true;
    try {
      const ds = await nsTimDon();
      if (ds.loi) { log('nhắc size: không đọc được đơn —', ds.loi); return; }
      const s = nsSo();
      let moi = 0;
      for (const o of ds.don) {
        if (s.xet[o.id] || s.gui[o.id]) continue;
        const ct = await nsChiTiet(o);
        if (!ct) continue;           // lần sau thử lại
        s.xet[o.id] = Date.now();
        if (ct.khop) { s.gui[o.id] = { t: Date.now(), ma: ct.ma, ok: false, lan: 0, mon: ct.mon }; moi++; log('nhắc size: đơn ' + ct.ma + ' có ' + ct.mon + ' — xếp hàng gửi tin nhắc'); }
        await nsNghi(400);
      }
      nsLuu(s);
      if (moi || lyDo) log('nhắc size: quét ' + ds.don.length + ' đơn, ' + moi + ' đơn mới cần nhắc');
      await nsGuiHangCho();
    } catch (e) { log('nhắc size: ngoại lệ', e); }
    finally { nsDangChay = false; }
  }
  async function nsGuiHangCho() {
    const s = nsSo();
    const cho = Object.keys(s.gui).filter((k) => !s.gui[k].ok && !s.gui[k].bo && (s.gui[k].lan || 0) < 2
      && Date.now() - (s.gui[k].lanCuoi || 0) > 10 * 60000);
    for (const id of cho) {
      const s2 = nsSo();
      if (s2.dem >= NS.TOI_DA_NGAY) { log('nhắc size: đã đủ ' + NS.TOI_DA_NGAY + ' tin hôm nay, để mai'); return; }
      const g = s2.gui[id];
      g.lan = (g.lan || 0) + 1; g.lanCuoi = Date.now(); nsLuu(s2);
      log('nhắc size: mở tab gửi tin cho đơn ' + g.ma + ' (lần ' + g.lan + ')');
      const kq = await nsGuiMot(id, g.ma);
      const s3 = nsSo(); const g3 = s3.gui[id] || g;
      if (kq.ok) {
        g3.ok = true; g3.tGui = Date.now(); s3.dem = (s3.dem || 0) + 1;
        log('nhắc size: ĐÃ GỬI tin nhắc cho đơn ' + g.ma + (kq.loi ? ' (' + kq.loi + ')' : ''));
      } else {
        g3.loi = kq.loi;
        log('nhắc size: gửi HỎNG đơn ' + g.ma + ' — ' + kq.loi);
        if (g3.lan >= 2) {
          g3.bo = true;
          tinHeThong('nhắc size 8li: chưa gửi được tin cho đơn ' + g.ma + ' (' + kq.loi + '). Cần nhắn tay cho khách: ' + nsTin());
        }
      }
      s3.gui[id] = g3; nsLuu(s3);
      await nsNghi(5000);
    }
  }
  function nsGuiMot(id, ma) {
    return new Promise(function (xong) {
      nsSet(NS_K.kq, {});
      nsSet(NS_K.job, { id: String(id), ma: ma, tin: nsTin(), t: Date.now(), buoc: 'mo' });
      let tab = null;
      try { tab = GM_openInTab(location.origin + nsDuongDon(id) + '#nhacsize', { active: false, insert: true, setParent: true }); }
      catch (e) { xong({ ok: false, loi: 'không mở được tab nền: ' + e.message }); return; }
      const t0 = Date.now();
      (function doi() {
        const k = nsGet(NS_K.kq, {});
        if (k && k.id === String(id) && k.t >= t0) { try { tab && tab.close(); } catch (e) {} nsSet(NS_K.job, {}); xong(k); return; }
        if (Date.now() - t0 > NS.HAN_GUI_GIAY * 1000) { try { tab && tab.close(); } catch (e) {} nsSet(NS_K.job, {}); xong({ ok: false, loi: 'quá ' + NS.HAN_GUI_GIAY + ' giây chưa gửi xong' }); return; }
        setTimeout(doi, 1500);
      })();
    });
  }
  function nsBatDau() {
    if (!NS.BAT) return;
    setTimeout(function () { nsMotVong('khởi động'); }, 30000);
    (function hen() {
      const p = NS.NHIP_PHUT * (0.7 + Math.random() * 0.6);
      setTimeout(function () { nsMotVong(); hen(); }, p * 60000);
    })();
  }

  // ---- nút ✏ Tin nhắc size (sửa câu + gửi thử trên đơn đang mở) ----
  function nsMoSua(b) {
    let p = document.getElementById('__ns_sua');
    if (p) { p.remove(); return; }
    p = document.createElement('div');
    p.id = '__ns_sua';
    p.style.cssText = 'position:fixed;top:14%;left:50%;transform:translateX(-50%);z-index:2147483647;width:min(640px,92vw);'
      + 'background:#1e2128;color:#eee;border-radius:10px;padding:14px;box-shadow:0 8px 30px rgba(0,0,0,.55);font:14px/1.45 system-ui,sans-serif';
    const s = nsSo();
    const daGui = Object.keys(s.gui).filter((k) => s.gui[k].ok).length;
    p.innerHTML = '<div style="font-weight:800;font-size:16px;margin-bottom:6px">✏ Tin nhắc size 108 hạt 8li</div>'
      + '<div style="opacity:.8;font-size:12px;margin-bottom:6px">Hôm nay đã gửi ' + (s.dem || 0) + '/' + NS.TOI_DA_NGAY + ' tin · 10 ngày qua ' + daGui + ' đơn</div>';
    const ta = document.createElement('textarea');
    ta.value = nsTin();
    ta.style.cssText = 'width:100%;height:140px;box-sizing:border-box;border-radius:6px;padding:8px;font:14px/1.4 system-ui;color:#111';
    p.appendChild(ta);
    const hang = document.createElement('div');
    hang.style.cssText = 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap';
    const tb = document.createElement('div');
    tb.style.cssText = 'margin-top:8px;font-weight:700;min-height:18px';
    function nut(chu, nen, lam) {
      const x = document.createElement('button'); x.textContent = chu;
      x.style.cssText = 'border:0;border-radius:6px;padding:7px 12px;font-weight:700;cursor:pointer;color:#fff;background:' + nen;
      x.onclick = function (e) { e.stopPropagation(); lam(x); }; hang.appendChild(x); return x;
    }
    nut('💾 Lưu', '#14853b', function () {
      const v = ta.value.trim();
      if (!v) { tb.textContent = '⚠ Câu tin đang trống'; return; }
      nsSet(NS_K.tin, v); log('nhắc size: Cao sửa câu tin nhắc thành: ' + v);
      tb.textContent = '✔ Đã lưu — các đơn sau sẽ gửi câu này';
    });
    nut('↺ Câu mặc định', '#5b5f68', function () { ta.value = NS.MAC_DINH; tb.textContent = 'Đã điền lại câu mặc định — bấm Lưu để dùng'; });
    const idDangMo = nsIdTrangDon();
    if (idDangMo) nut('🧪 Gửi thử vào đơn đang mở', '#c2410c', async function (x) {
      if (!confirm('Gửi THẬT câu tin này cho khách của đơn đang mở?')) return;
      x.disabled = true; tb.textContent = '⏳ Đang gửi thử…';
      nsSet(NS_K.job, { id: idDangMo, ma: idDangMo, tin: ta.value.trim() || nsTin(), t: Date.now(), buoc: 'mo', thu: true });
      try { const kq = await nsConGui(true); tb.textContent = kq.ok ? '✔ Đã gửi — xem trong khung chat' : '⚠ Chưa gửi được: ' + kq.loi; }
      catch (e) { tb.textContent = '⚠ ' + e.message; }
      x.disabled = false;
    });
    nut('Đóng', '#3b3f48', function () { p.remove(); });
    p.appendChild(hang); p.appendChild(tb);
    document.body.appendChild(p);
  }

  // ---- Shopee: tìm đơn, chi tiết, gửi trong tab nền ----
  function nsDuongDon(id) { return '/portal/sale/order/' + id; }
  function nsIdTrangDon() { const m = /^\/portal\/sale\/order\/(\d+)/.exec(location.pathname); return m ? m[1] : ''; }
  async function nsTimDon() {
    const don = [], co = {};
    for (const loai of [1, 2, 3]) {
      for (const st of [TRANG_THAI_CHUA_XU_LY, TRANG_THAI_DA_XU_LY]) {
        const kq = await qhPost('/api/v3/order/search_order_list_index', {
          order_list_tab: TAB_CHO_LAY_HANG, entity_type: loai,
          pagination: { page_number: 1, page_size: 100 },
          filter: { order_to_ship_status: st },
          sort: { sort_type: 2, ascending: true },
          current_time: Math.floor(Date.now() / 1000),
        });
        if (kq.loi) return kq;
        for (const x of (kq.data.index_list || [])) {
          const id = String(x.order_id || '');
          if (id && !co[id]) { co[id] = 1; don.push({ id: id }); }
        }
        await nsNghi(400);
      }
    }
    return { don: don };
  }
  async function nsChiTiet(o) {
    const q = thamSo();
    if (!q) return null;
    const res = await fetchCoHan('/api/v3/order/get_one_order' + q + '&order_id=' + encodeURIComponent(o.id), { credentials: 'include' });
    if (!res.ok) return null;
    let j = null;
    try { j = await docJson(res); } catch (e) { return null; }
    if (!j || j.code !== 0) return null;
    const d = j.data || {};
    const mon = [];
    for (const it of (d.order_items || [])) {
      const im = it.item_model || {}, pr = it.product || {};
      const pl = String(im.sku || '') + ' ' + String(im.name || '');
      if (nsKhop(pl, pl + ' ' + String(pr.name || ''))) mon.push((String(im.sku || im.name || '').trim() || 'vòng 108 hạt 8li') + ' x' + (it.amount || 1));
    }
    return { ma: String(d.order_sn || o.id).trim(), khop: mon.length > 0, mon: mon.join(', ') };
  }
  function nsChuTrang() { return (document.body ? document.body.innerText : '').replace(/\s+/g, ' '); }
  // Chạy trong tab nền đã mở trang chi tiết đơn (hoặc khi Cao bấm Gửi thử)
  async function nsConGui(thu) {
    const job = nsGet(NS_K.job, {}) || {};
    const xong = function (ok, loi) {
      log('nhắc size' + (thu ? ' (gửi thử)' : '') + ': đơn ' + (job.ma || job.id) + ' → ' + (ok ? 'đã gửi' : 'HỎNG: ' + loi));
      try { nkLuu(); } catch (e) {}
      if (!thu) nsBaoKetQua(job.id, ok, loi);
      return { ok: ok, loi: loi || '' };
    };
    try {
      if (!job.id || job.id !== nsIdTrangDon()) return xong(false, 'việc gửi không khớp đơn đang mở');
      log('nhắc size: tab gửi tin đã mở đơn ' + (job.ma || job.id));
      const nutChat = await nsCho(function () { return [...document.querySelectorAll('button')].find(function (b) { return /Chat ngay/.test(b.textContent) && b.getBoundingClientRect().width > 0; }); }, 40000, 'nút "Chat ngay"');
      nutChat.click();
      const che = await nsCho(function () { return [...document.querySelectorAll('span')].find(function (e) { return !e.children.length && /^Chế độ (Giám sát|Chăm sóc Khách hàng)$/.test(e.textContent.trim()) && e.closest('.trigger'); }); }, 25000, 'ô chọn Chế độ chat');
      if (/Giám sát/.test(che.textContent)) {
        che.closest('.trigger').click();
        const opt = await nsCho(function () { return [...document.querySelectorAll('.shopee-react-select-option')].find(function (e) { return /Chăm sóc Khách hàng/.test(e.textContent); }); }, 8000, 'lựa chọn "Chế độ Chăm sóc Khách hàng"');
        opt.click();
        log('nhắc size: đã chuyển chat sang Chế độ Chăm sóc Khách hàng');
        await nsNghi(2000);
      }
      let ta = document.querySelector('textarea[placeholder="Nhập nội dung tin nhắn"]');
      if (!ta) { nutChat.click(); ta = await nsCho(function () { return document.querySelector('textarea[placeholder="Nhập nội dung tin nhắn"]'); }, 25000, 'ô nhập tin nhắn'); }
      await nsNghi(3000);   // chờ tải tin cũ để kiểm trùng
      const sn = nsSnip(job.tin);
      if (nsChuTrang().indexOf(sn) !== -1) return xong(true, 'câu này đã có sẵn trong khung chat, không gửi lại');
      nsDatChu(ta, job.tin);
      await nsNghi(600);
      ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      const daGui = function () { return ta.value.trim() === '' && nsChuTrang().indexOf(sn) !== -1; };
      try { await nsCho(daGui, 5000, 'tin vừa gửi'); return xong(true, ''); } catch (e) {}
      // dự phòng: bấm biểu tượng gửi ở góc phải ô nhập
      const r = ta.getBoundingClientRect();
      let khung = ta; for (let i = 0; i < 4 && khung.parentElement; i++) khung = khung.parentElement;
      const icon = [...khung.querySelectorAll('i,svg,button')].filter(function (e) { const b = e.getBoundingClientRect(); return b.width > 0 && b.left >= r.right - 60 && b.top >= r.top - 40; })
        .sort(function (a, b) { return b.getBoundingClientRect().left - a.getBoundingClientRect().left; })[0];
      if (icon) { log('nhắc size: Enter chưa gửi, thử bấm biểu tượng gửi'); icon.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
      await nsCho(daGui, 10000, 'tin vừa gửi hiện trong khung chat');
      return xong(true, '');
    } catch (e) { return xong(false, e.message); }
  }
  function nsLaTabCon() {
    const job = nsGet(NS_K.job, {}) || {};
    if (!nsIdTrangDon()) return false;
    return location.hash === '#nhacsize' || (job.buoc === 'mo' && !job.thu && job.id === nsIdTrangDon() && Date.now() - (job.t || 0) < 120000);
  }
  function nsChayTabCon() { setTimeout(function () { nsConGui(false); }, 4000); }


  /* ---------- Bản 9.6: TỰ CẬP NHẬT từ GitHub ----------
     - Tampermonkey tự tải bản mới (link @updateURL). Script chỉ: ghi nhật ký,
       báo nhóm Cao hệ thống khi máy đã lên bản mới, tải lại trang (lúc rảnh, tối đa
       1 lần/giờ) để nạp bản mới, và báo nếu sau 8 tiếng máy vẫn chưa lên bản. */
  const CN_LINK = 'https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/canh-don-SMH-shopee.user.js';
  function cnCuHon(a, b) {
    const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(x.length, y.length); i++) { const p = x[i] || 0, q = y[i] || 0; if (p !== q) return p < q; }
    return false;
  }
  function cnThieuLink() {
    const thieu = ['WEBHOOK_URL', 'WEBHOOK_URL_HE_THONG', 'WEBHOOK_URL_QUA_HAN', 'PING_URL'].filter(function (k) { return !BI_MAT[k]; });
    if (!thieu.length) return;
    log('THIẾU LINK BÍ MẬT trên máy này: ' + thieu.join(', ') + ' — cần cài tay 1 lần bản Claude gửi');
    const b = document.createElement('div');
    b.textContent = '⚠ Canh đơn ' + CAU_HINH.VIET_TAT + ' ' + CAU_HINH.TEN_SAN + ': máy này CHƯA CÓ link nhóm Lark — cần cài tay 1 lần bản Claude gửi (bản có sẵn link).';
    b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;background:#c62828;color:#fff;padding:10px 14px;border-radius:8px;font:700 14px system-ui,sans-serif;max-width:420px;box-shadow:0 4px 14px rgba(0,0,0,.35)';
    (document.body || document.documentElement).appendChild(b);
  }
  function cnBaoLenBan() {
    const cu = GM_getValue('cn_ban_dang_chay', '');
    if (cu === PHIEN_BAN) return;
    GM_setValue('cn_ban_dang_chay', PHIEN_BAN);
    if (cu) { log('ĐÃ LÊN BẢN ' + PHIEN_BAN + ' (trước đó ' + cu + ')'); tinHeThong('✅ đã tự cập nhật lên bản ' + PHIEN_BAN + ' (trước đó ' + cu + ')'); }
    else log('bản ' + PHIEN_BAN + ' chạy lần đầu trên máy này');
  }
  function cnKiem() {
    const xong = function () { setTimeout(cnKiem, (50 + Math.random() * 20) * 60000); };
    try {
      GM_xmlhttpRequest({ method: 'GET', url: CN_LINK + '?t=' + Date.now(), timeout: 30000, headers: { 'Cache-Control': 'no-cache' },
        onload: function (r) {
          try {
            const m = /@version\s+([\d.]+)/.exec(String(r.responseText || ''));
            if (!m || r.status >= 400) { log('kiểm tra bản mới: không đọc được GitHub (mã ' + r.status + ')'); return; }
            const ban = m[1];
            if (!cnCuHon(PHIEN_BAN, ban)) { GM_setValue('cn_thay', ''); log('kiểm tra bản mới: đang chạy bản mới nhất ' + PHIEN_BAN); return; }
            let thay = {}; try { thay = JSON.parse(GM_getValue('cn_thay', '') || '{}') || {}; } catch (e) {}
            if (thay.ban !== ban) { thay = { ban: ban, t: Date.now() }; GM_setValue('cn_thay', JSON.stringify(thay)); }
            const gio = (Date.now() - thay.t) / 3600000;
            log('kiểm tra bản mới: GitHub có bản ' + ban + ', máy đang chạy ' + PHIEN_BAN + ' (thấy từ ' + gio.toFixed(1) + ' giờ trước) — chờ Tampermonkey tự cài');
            if (gio >= 8 && !thay.bao) {
              thay.bao = 1; GM_setValue('cn_thay', JSON.stringify(thay));
              tinHeThong('⚠ GitHub đã có bản ' + ban + ' hơn 8 tiếng mà máy này vẫn chạy bản ' + PHIEN_BAN + '. Cần mở Tampermonkey trên máy này → Kiểm tra cập nhật.');
            }
            const lan = Number(GM_getValue('cn_tai_lai', 0) || 0);
            if (Date.now() - lan > 60 * 60000 && !dangChay) {
              GM_setValue('cn_tai_lai', Date.now());
              taiLaiAnToan('nạp bản mới ' + ban + ' (nếu Tampermonkey đã cài xong)');
            }
          } catch (e) { log('kiểm tra bản mới lỗi: ' + e.message); }
        },
        onerror: function () { log('kiểm tra bản mới: mất kết nối GitHub'); },
        ontimeout: function () { log('kiểm tra bản mới: GitHub quá lâu không trả lời'); } });
    } catch (e) { log('kiểm tra bản mới lỗi: ' + e.message); }
    xong();
  }
  function cnBatDau() {
    try { cnThieuLink(); } catch (e) {}
    try { cnBaoLenBan(); } catch (e) { log('báo lên bản lỗi: ' + e.message); }
    setTimeout(cnKiem, (3 + Math.random() * 5) * 60000);
  }

  // Bản 9.5: tab nền gửi tin nhắc size thì CHỈ làm việc đó, không canh đơn
  if (NS.BAT && nsLaTabCon()) { log('nhắc size: tab này chỉ để gửi tin'); nsChayTabCon(); }
  else { setTimeout(khoiDong, 4000); setTimeout(nsBatDau, 8000); setTimeout(cnBatDau, 6000); }
})();
