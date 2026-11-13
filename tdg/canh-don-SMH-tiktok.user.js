// ==UserScript==
// @name         Canh đơn SMH ⚫
// @namespace    sonmochuong
// @version      6.6
// @description  Canh đơn TikTok Sơn Mộc Hương → Lark: đơn hoả tốc (nhóm Hoả tốc) + đơn thường sắp quá hạn bàn giao (nhóm Quá hạn) + báo lỗi (nhóm Hệ thống), điểm danh Healthchecks
// @match        https://seller-vn.tiktok.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        unsafeWindow
// @connect      open.larksuite.com
// @connect      hc-ping.com
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// @noframes
// @updateURL    https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/canh-don-SMH-tiktok.user.js
// @downloadURL  https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/canh-don-SMH-tiktok.user.js
// ==/UserScript==

/* ============================================================================
   BẢN DÀNH CHO PROFILE "CANH ĐƠN HOẢ TỐC 1"  —  shop TikTok SƠN MỘC HƯƠNG
   Dán nguyên file này vào Tampermonkey, KHÔNG cần sửa gì.

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 6.5 (13/11/2026)
   - NHẮC SIZE 108 HẠT 8LI: đơn có món "108 … 8li" -> tự gửi 1 tin nhắc khách kiểm tra cổ tay qua khung
     chat của sàn (script thao tác như người gõ, trong 1 tab nền tự mở rồi tự đóng). Mỗi đơn 1 lần, tối đa
     20 tin/ngày, chạy cả ban đêm. Hỏng 2 lần -> báo nhóm Cao hệ thống kèm câu mẫu để nhắn tay.
   - Nút ✏ Tin nhắc dưới ô trạng thái: sửa câu tin (giữ khi cài bản mới), xem số tin đã gửi; mở trang chi
     tiết 1 đơn rồi bấm "🧪 Gửi thử" để gửi thật câu này cho khách đơn đó.

   MỚI Ở BẢN 6.4.4 (07/11/2026)
   - Tin ✅ / ❌ hoả tốc ghi đủ: "✅ Đã xử lý trong 2 phút · <hàng>" / "<mã> · SPX Instant · hoả tốc · THHX 🟠";
     "❌ Đã huỷ · <hàng>" / "<mã> · <ĐVVC> · hoả tốc · <shop>".
   - Đọc dữ liệu sàn hỏng: tự tải lại trang 2 lần (trước 1 lần), vẫn hỏng mới báo nhóm Hệ thống.
   - Hết lỗi: bỏ các tin lỗi còn kẹt chưa gửi (mất mạng / đăng xuất), chỉ gửi 1 tin "✅ đã canh lại · gián
     đoạn N phút (mất mạng / đăng xuất)"; không gửi trùng tin đã canh lại.
   - Nút 🔄 Tải lại trang: mất mạng thì bấm lần 2 trong 10 giây là tải lại luôn.

   MỚI Ở BẢN 6.4.3 (04/11/2026)
   - Mốc 11:30 "chưa quét": liệt kê TOÀN BỘ đơn đang chờ lấy hàng (để khớp số hộp, shipper bắn 1 lượt),
     mỗi hãng 1 tin, chia nhóm mỗi nhóm 1 dòng:
       Hạn 12h (7): mã, …  ·  Tồn từ hôm qua (1): mã  ·  Hạn trong ngày (8): mã, …
     Không có đơn quá hạn vẫn gửi, kèm dòng "Không có đơn quá hạn". Đơn "Hạn trong ngày" chưa tính
     là đã báo -> 20:00 còn chưa quét vẫn báo. Mỗi nhóm ghi tối đa 20 mã.

   MỚI Ở BẢN 6.4.2 (27/10/2026)
   - Mốc 11:30 "chưa quét": tính chung cả đơn 0:00–8:00 sáng (in lúc 8h cùng đơn tối qua); các mã
     này ghi sau cùng, kèm "(hạn trong ngày)". Mốc 10:00 "chưa xử lý" giữ như cũ.
   - Tin 🚚 gọn: "🚚 BEST có 7 đơn chưa quét THHX ⚫" / mã (tối đa 20 mã); BEST Express ghi "BEST" (hãng khác giữ nguyên), bỏ chữ
     hạn trên tiêu đề. CẦN bot nhóm Quá hạn có từ khoá "quét".

   MỚI Ở BẢN 6.4.1 (23/10/2026)
   - Quá hạn buổi chiều "🚚 ĐVVC chưa quét": chỉ báo 1 lần lúc 20:00 (bỏ 19:30 và 20:30),
     hạn quét cũng dời thành 20:00.

   MỚI Ở BẢN 6.4 (23/10/2026)
   - Lượt hỏi danh sách đơn đi qua ĐƯỜNG CỦA TRANG: code TikTok tự gắn mã ký tên mới như lượt hỏi của
     chính trang -> TikTok khó phân biệt script, ít bị chặn hơn. Máy nào không dùng được thì tự quay về
     đường cũ (nhật ký ghi "gọi sàn: …").
   - Thấy hộp xác minh trên trang: tự F5 thêm 3 lần, cách 1 phút; hộp vẫn còn mới báo "cần xác minh".
   - Bị chặn: báo ở phút thứ 5, nhắc sau 10 phút, 15 phút, 20 phút (tối đa 3 lần nhắc) rồi thôi;
     vẫn tự thử lại 5 phút/lần, hết chặn báo "✅ đã canh lại".
   - Hàng nút dưới ô: 🔄 Tải lại trang (to) + 📋 Xem nhật ký + ⬇ Tải nhật ký (file 7 ngày, đầu file có tóm tắt từng ngày).
   - Tin thử khi cài bản mới: chỉ 1 tin vào nhóm Cao hệ thống ("🧪 bản 6.4 · Hệ thống OK").

   MỚI Ở BẢN 6.3 (23/10/2026)
   - NHẬT KÝ 7 NGÀY: bấm CHUỘT PHẢI vào ô trạng thái -> hiện 50 dòng mới nhất + nút tải file .txt
     (7 ngày). Ghi: lỗi, mã lỗi, tự tải lại, tin Lark đã gửi / bị từ chối, mốc quá hạn, đổi trạng
     thái ô; các vòng kiểm ổn thì mỗi giờ gộp 1 dòng tóm tắt.
   - TikTok trả mã 10000 (từ chối): tự F5 2 lần (ngay, sau 1 phút), rồi TỰ XEM TRANG để gọi đúng bệnh:
       có hộp xác minh            -> "cần xác minh" (bấm xác minh trên trang)
       chính trang cũng bị từ chối -> "TikTok chặn tải đơn" trên máy này
       trang vẫn tải đơn được      -> "TikTok chặn script"
     Báo nhóm Hệ thống sau 5 phút, nhắc lại sau 10 phút, rồi 15 phút/lần; cứ 5 phút thử lại 1 lần.
   - Đọc thông số trang mới nhất liên tục (trước đây trình duyệt ngừng ghi sau 250 lượt tải,
     script phải dùng thông số cũ).

   MỚI Ở BẢN 6.2 (22/10/2026)
   - Bị đăng xuất / mất phiên: báo nhóm Hệ thống NGAY sau vòng đầu (script không tự sửa được).
   - Thêm mốc 20:30 nhắc lại đơn ĐVVC chưa quét đã báo ở 19:30 ("🚚 GHN vẫn còn 2 đơn chưa quét").
   - Tin chưa in (Shopee): "🖨 Mục "Tạo phiếu" có 1 đơn SMH 🟠 chưa in" / mã — quá 15 phút là báo,
     bot nhóm Quá hạn đã thêm từ khoá "in".
   - Dán xong gửi lại tin 🧪 thử kết nối.

   MỚI Ở BẢN 6.1 (22/10/2026)
   - Ô trạng thái to 1,5 lần, luôn 2 dòng: dòng 2 "kiểm cách đây N giây" nhảy từng giây
     + mốc quá hạn kế + số chưa in. Ký hiệu ✔ ổn · 🔥 có đơn · ⚠ đang sửa · ✖ lỗi · ⏸ nghỉ
     (bỏ chấm tròn vì lẫn với 🟠/⚫ của sàn); tên tab dùng cùng bộ ký hiệu.
   - TikTok hỏi sàn 4–6 phút/lần (trước 2–3), tối thiểu 220 giây giữa 2 lần. Gặp hộp xác
     minh: tự F5 4 lần (ngay, 30 giây, 1 phút, 2 phút), vẫn kẹt mới báo nhóm; các lần F5
     này không tính vào giới hạn 3 lần tự tải lại/giờ.
   - Lâu không có đơn: 14 ngày mới nhắc, nhắc lại 14 ngày/lần (trước 5 ngày, 24 giờ/lần).
   - Tin Lark: GẤP đổi 🚨, tên shop ghi "SMH 🟠"; "✅ … đã xử lý trong N phút" ghi đúng số
     phút từ lúc phát sinh. Nhóm Quá hạn đổi từ khoá bot thành "hạn", bỏ chữ "Quá hạn":
       ⏰ SMH 🟠 · 3 đơn chưa xử lý · hạn 12h / mã, mã, mã
       🚚 GHN có 3 đơn chưa quét · hạn 12h · SMH 🟠 / mã, mã (mỗi hãng 1 tin, SPX gửi cuối)
       🖨 GHN có 1 đơn chưa in · hạn in 15 phút · SMH 🟠 / mã (chỉ Shopee)
   - Mốc chiều 19:00 đổi thành 19:30. Chủ nhật im lặng cả phần chưa in.

   MỚI Ở BẢN 6.0 — GỘP SCRIPT "CẢNH BÁO ĐƠN QUÁ HẠN" VÀO ĐÂY (21/10/2026)
   - Tên script đổi thành "Canh đơn SMH ⚫". Phải TẮT/XOÁ 2 script cũ của shop này:
     "Cảnh báo đơn hoả tốc … SMH → Lark" và "Cảnh báo đơn quá hạn … SMH → Lark".
   - Phần quá hạn: 4 mốc 10h00/11h30/18h30/19h00, mỗi đơn báo 1 lần, chủ nhật im lặng,
     bỏ đơn "Đang Điều Phối ĐVVC".
     Tin về nhóm Lark "Quá hạn" (từ khoá bot: Quá hạn). Giữ khoá bộ nhớ cũ nên không báo lại.
   - Tin Lark rút gọn, nhìn biểu tượng là biết: 🔥 đơn hoả tốc · ⛔ quá hạn hoả tốc · ❌ đã huỷ
     · ✅ đã xử lý/đã canh lại · ⏰ chưa xử lý · 🚚 ĐVVC chưa lấy · 🖨 chưa in · ❌ lỗi hệ thống.
     Tên shop ghi ngắn "SMH 🟠" (Shopee) / "SMH ⚫" (TikTok). Thẻ GẤP giữ nguyên.
   - Ô trạng thái nhỏ bằng nửa, bấm giữ kéo được (tải lại trang về giữa trên):
     🟢 SMH 🟠 · đang canh / 🔥 2 đơn · SMH 🟠 / 🔴 đăng xuất · SMH 🟠 / 🟡 khi đang tự sửa.
   - Bỏ báo cáo cuối ngày. Lark từ chối tin 3 lần -> báo nhóm Hệ thống (1 lần/ngày).
   - Sau khi cài: gửi 1 tin thử vào nhóm Quá hạn và 1 tin nghiệm thu vào nhóm Hệ thống
     (KHÔNG gửi gì vào nhóm Hoả tốc).
   MỚI Ở BẢN 5.3 (phương án B)
   1. Ô trạng thái mới: giữa phía trên, tự phóng theo bề rộng cửa sổ (thu
      trang 33% vẫn đọc được), chớp theo nhịp của chính script (đứng yên =
      script đã đứng), 5 màu: xanh canh / cam có đơn / đỏ lỗi / vàng đang tự
      sửa / xám ngoài giờ. Tên tab có 🟢🔴🟡🔥⚪ ở đầu.
   2. Mỗi lượt chỉ hỏi TikTok 1 lần thay vì 2 (gộp chờ vận chuyển + đã xử lý).
   3. Báo nhóm Hệ thống NGAY khi script đã tự tải lại mà vẫn hỏng (xác minh
      thật, không đọc được dữ liệu) hoặc bị đăng xuất — không chờ 15 phút.
      Bị bắt xác minh vẫn nghỉ 5 phút/lần như cũ.
   4. Sau 21h gửi 1 tin thống kê trong ngày: số lượt OK, lỗi, tự tải lại, cần
      xác minh, đăng xuất, số đơn — để biết tab nào hay bệnh.

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 5.2
   1. Đơn hoả tốc báo sau 1 PHÚT kể từ khi phát sinh (trước là treo 5 phút).
      TikTok vẫn hỏi 2–3 phút/lần nên thực tế tin tới sau khoảng 1–3 phút.
   2. Đơn được xử lý xong ngay trong lúc treo -> thay tin báo đơn bằng 1 tin:
        ĐÃ XỬ LÝ trong vòng 1 phút (1 đơn hoả tốc SMH TikTok: 108 CHUẨN RÂU ĐỎ 7li SMH x1 | 586423828017547130 (BeDelivery))
      Kể cả đơn xử lý nhanh tới mức script chưa kịp thấy (đọc thêm danh sách
      "Cần gửi" mỗi lần kiểm tra). Khách huỷ trong lúc treo vẫn im lặng.
   3. Đơn từng rời danh sách chờ rồi quay lại thì không báo lại như đơn mới.

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 5.1
   1. Tin báo đơn có thêm đơn vị vận chuyển, 2 dòng:
        1 đơn hoả tốc SMH TikTok: TRÒN ĐƠN CHUẨN TUỔI TÝ 14li SMH x4
        20:37 - 21/09/2026 - 586185849970656439 (BeDelivery)
      Tin "ĐÃ HUỶ" giữ nguyên mẫu đã chốt.
   2. BỎ tin tóm tắt cuối ngày: tự tải lại mà chạy lại được thì im lặng hẳn.
      Chỉ báo khi tự sửa KHÔNG được (3 lần/giờ vẫn hỏng).
   3. Mỗi lần đọc tối đa 50 đơn hoả tốc chờ xử lý (trước là 20).

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 5.0 — LỚP TỰ KIỂM & TỰ PHỤC HỒI (chạy thử bằng mô phỏng trước khi giao)
   1. SỬA LỖI GỐC "trang vẫn hiện bình thường mà script không chạy, phải F5":
      một lần gọi sàn bị treo (không bao giờ trả lời) làm vòng kiểm tra đứng
      mãi -> ngừng điểm danh (Healthchecks báo NGỪNG), NGỪNG CANH ĐƠN, và chặn
      luôn việc làm mới trang định kỳ. Nay mọi lần gọi sàn có hạn chót 25 giây.
   2. Lớp tự kiểm chạy riêng, mỗi phút soát 1 lượt; thấy script đứng / không
      điểm danh được thì TỰ tải lại trang trước khi Healthchecks kịp báo.
      Tối đa 3 lần/giờ; quá thì báo nhóm Hệ thống. Không bao giờ tự tải lại
      lúc máy mất mạng (tránh ra trang lỗi, script chết hẳn).
   3. Gửi Lark: có hạn chót riêng (không còn kẹt mãi), tin bị Lark từ chối
      không còn chặn các tin đơn phía sau.
   4. Chỉ MỘT tab canh cho mỗi shop — lỡ mở thêm tab (vd. chi tiết đơn) cũng
      không hỏi TikTok gấp đôi (dễ bị bắt xác minh), không báo trùng.
   5. Hết giờ canh gửi 1 tin tóm tắt các lần tự sửa trong ngày (chỉ khi có).

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 4.11 — sửa báo động giả "cần xác minh": nhiều lần TikTok trả mã
   này KHÔNG kèm ô captcha thật (mở trang lên không thấy gì), chỉ cần F5 là
   canh lại được ngay. Nay script TỰ tải lại trang 1 lần trước khi báo vào
   nhóm — nếu tải lại xong lại canh được bình thường thì im lặng, không báo
   gì cả (giống hệt như tự tay bấm F5). Nếu tải lại rồi vẫn lỗi mới chắc là
   captcha thật và báo vào nhóm như cũ.

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 4.10 — tối ưu cách xác minh đơn huỷ ở bản 4.9: thay vì tra riêng
   từng đơn theo mã (tốn nhiều lượt gọi nếu nhiều đơn cùng biến mất 1 lúc),
   nay gom lại và tra 1 LẦN DUY NHẤT mỗi vòng bằng đúng bộ lọc (tab Đã huỷ +
   Hoả tốc) mà trang TikTok vẫn dùng — vừa ít lượt gọi API hơn, vừa giống
   thao tác người dùng bình thường hơn.

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 4.9 — đơn ĐÃ báo vào nhóm mà sau đó biến mất khỏi danh sách chờ
   (do khách huỷ) nay tra lại đúng đơn đó bằng chính API danh sách đơn (lọc
   theo mã đơn), rồi báo thêm 1 tin "ĐÃ HUỶ ..." nhắc lại nguyên văn tin cũ —
   nhân sự khỏi phải mở máy tính kiểm tra tay. Đơn CHƯA kịp báo mà đã huỷ
   trong lúc treo 5 phút vẫn im lặng như cũ, không có tin nào cả.

   ---------------------------------------------------------------------------
   MỚI Ở BẢN 4.1 — gọn lại: bỏ nhật ký lỗi không ai đọc được, bỏ nhánh chết,
   gộp hai danh sách theo dõi đơn làm một, thêm @Tất cả vào tin GẤP còn hạn.

   TỪ BẢN 4.0
   ---------------------------------------------------------------------------
   1. TIN BÁO ĐƠN ĐỔI SANG 3 DÒNG, MỖI ĐƠN MỘT TIN RIÊNG
        1 đơn hoả tốc SMH TikTok
        108 TRẦM CHUẨN 6li SMH x1
        17:25 - 17/09/2026 - 586116802144995125
   2. ĐIỂM DANH VỚI HEALTHCHECKS mỗi vòng, để khi máy tắt / Chrome chết /
      đứt mạng thì Healthchecks bắn tin vào nhóm thay cho script.
   3. SỬA LỖI: mất phiên đăng nhập trước đây không đặt cờ báo lỗi nên đăng nhập
      lại xong KHÔNG có tin "đã canh lại bình thường". Nay có.
   4. CẢNH BÁO IM LẶNG 5 NGÀY và CẢNH BÁO LỆCH ĐỒNG HỒ quá 10 phút.
   5. GIẢM DẤU VẾT TỰ ĐỘNG — quan trọng riêng với TikTok:
      - Nhịp quét giãn còn khoảng 2 phút/lần (trước là 1 phút).
      - Gửi kèm ĐÚNG bộ tham số mà chính trang TikTok dùng khi gọi API này
        (aid, locale, oec_seller_id, seller_id). Bản cũ gọi trỏng không tham số
        nào — một request như vậy rất dễ bị lọc ra là máy tự động.
   6. Khung giờ canh 7h45–21h.
   7. Mọi tin KHÔNG phải báo đơn đều mở đầu bằng "(Thông báo hệ thống)".
      Riêng tin GẤP giữ nguyên vì là tin về đơn, không phải tin máy móc.

   GIỮ TỪ BẢN TRƯỚC: lọc quà tặng bằng cờ is_gift trong fulfill_line_module;
   mã 10000 = TikTok bắt xác minh captcha, KHÔNG phải mất phiên đăng nhập.
   ============================================================================ */

(function () {
  'use strict';

  /* ==========================================================================
     PHẦN CẤU HÌNH
     ========================================================================== */

  // Bản 6.6: link bí mật (nhóm Lark, Healthchecks) KHÔNG nằm trong bản GitHub.
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
        { gio: 11, phut: 30, loai: 'bangiao', han: 'hạn 12h', tatCa: true },   // bản 6.4.3: toàn bộ đơn chờ lấy hàng, chia nhóm
        { gio: 18, phut: 30, loai: 'xuly',    han: 'hạn hôm nay' },
        { gio: 20, phut: 0,  loai: 'bangiao', han: 'hạn hôm nay' },   // bản 6.4.1: chỉ 1 lần lúc 20:00 (bỏ 19:30 + 20:30)
      ],
      BO_CHU_NHAT: true,
      NHIP_KIEM_GIAY: 120,
      SO_LAN_THU_LAI: 2,
      CHO_THU_LAI_GIAY: 8,
      PHUT_KIEN_NHAN_KHI_LOI: 60,   // mốc lỗi liên tục bấy nhiêu phút mới báo nhóm Hệ thống
      SO_MA_TOI_DA: 10,             // ghi tối đa bấy nhiêu mã đơn (dòng nhỏ), còn lại "…"
      SO_MA_TOI_DA_QUET: 20,        // bản 6.4.2: tin 🚚 chưa quét ghi tối đa 20 mã
    },

    // Đường điểm danh Healthchecks của ĐÚNG mục "SMH TikTok"
    PING_URL: BI_MAT.PING_URL || '',

    // >>> TÊN SHOP CỦA PROFILE NÀY <<<
    VIET_TAT: 'SMH',
    TEN_SAN: 'TikTok',

    // ===== TIN BÁO ĐƠN — mỗi đơn một tin riêng =====
    // {dvvc} = tên đơn vị vận chuyển trong ngoặc; sàn chưa có tên thì tự bỏ trống
    MAU_TIN: '{n} đơn hoả tốc {ten}: {hang}\n{moc}{dvvc}',
    CHUA_DOC_DUOC_HANG: '(chưa đọc được mặt hàng — mở Trung tâm nhà bán hàng xem)',

    NGAN_CACH_HANG: ', ',
    DO_DAI_TOI_DA_TEN: 40,

    BO_QUA_QUA_TANG: true,   // bỏ mặt hàng TikTok đánh dấu is_gift — bộ lọc chính
    BO_QUA_HANG_0D: true,    // lưới an toàn, phòng khi TikTok đổi cấu trúc
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
    // im lặng bỏ qua, không có tin nào cả.
    PHUT_GIU_TRUOC_KHI_BAO: 1,
    // Đơn được xử lý XONG ngay trong lúc treo (trước khi kịp báo nhóm) thì
    // thay tin báo đơn bằng 1 tin này. Khách huỷ trong lúc treo thì vẫn im lặng.
    MAU_TIN_DA_XU_LY: 'ĐÃ XỬ LÝ trong vòng {phut} phút ({n} đơn hoả tốc {ten}: {hang} | {ma}{dvvc})',

    // ===== KHUNG GIỜ CANH: 7h45 -> 21h00 =====
    GIO_BAT_DAU: 7, PHUT_BAT_DAU: 45,
    GIO_KET_THUC: 21, PHUT_KET_THUC: 0,
    NGAY_TRONG_TUAN: null, // null = mọi ngày, kể cả Chủ nhật

    // Nhịp hỏi: mỗi lần một khoảng NGẪU NHIÊN trong quãng dưới đây, không bao
    // giờ đều tăm tắp. Hỏi thưa và không đều là cách rẻ nhất để TikTok bớt coi
    // tab này là máy quét — mà 2–3 phút vẫn quá sớm so với hạn xử lý 90 phút.
    CHU_KY_GIAY: 300,             // bản 6.1: thưa đi một nửa (4–6 phút) cho TikTok đỡ nghi
    CHU_KY_DAO_DONG_GIAY: 60,
    // Tự tải lại trang mỗi khoảng ngẫu nhiên trong quãng này (phút). Một lần
    // F5 bình thường giúp TikTok gia hạn phiên đăng nhập và dọn luôn ô xác
    // minh còn treo — đỡ bị đá ra màn đăng nhập giữa ngày.
    LAM_MOI_TRANG_PHUT_MIN: 60,
    LAM_MOI_TRANG_PHUT_MAX: 120,
    NHAC_DANG_XUAT_PHUT: 30,
    // Khoảng cách TỐI THIỂU giữa hai lần kiểm tra thật. Chuyển tab hay có mạng
    // lại đều gọi kiểm tra thêm; không chặn thì các lần gọi đó dồn sát nhau,
    // vừa tốn request với sàn vừa làm bộ đếm lỗi nhảy vọt trong vài giây.
    NHIP_TOI_THIEU_GIAY: 220,

    // ===== CHỐNG BÁO ĐỘNG GIẢ =====
    SO_LAN_THU_LAI: 2,
    CHO_THU_LAI_GIAY: 6,
    LOI_LIEN_TIEP_TAI_LAI: 3, // hỏng bấy nhiêu lượt liền thì tự tải lại trang
    LOI_LIEN_TIEP_BAO: 4,     // vẫn hỏng tới lượt này (sau khi đã tải lại) thì báo nhóm
    // MỘT QUY TẮC CHUNG CHO MỌI TIN (Thông báo hệ thống): sự cố phải kéo dài
    // liên tục đủ bấy nhiêu phút mới được bắn tin vào nhóm. Nhóm này chủ yếu
    // để báo đơn — trục trặc thoáng qua thì script tự lo, không làm phiền ai.
    PHUT_TRUOC_KHI_BAO: 15,
    BAO_KHI_PHUC_HOI: true,

    // ===== KHI TIKTOK BẮT XÁC MINH (CAPTCHA) =====
    LOI_LIEN_TIEP_BAO_XAC_MINH: 1,   // bản 6.1: nhịp đã thưa (5 phút) nên 1 vòng là F5 ngay // phải hỏng đủ bấy nhiêu vòng liên tiếp
    NGHI_KHI_XAC_MINH_PHUT: 5,
    LICH_F5_XAC_MINH_GIAY: [0, 60],   // bản 6.3: F5 2 lần (ngay, sau 1 phút) rồi mới tự xem trang
    BAO_CHAN_SAU_PHUT: 5,             // bản 6.3: bị từ chối liên tục bấy nhiêu phút thì báo nhóm Hệ thống
    THU_LAI_KHI_CHAN_PHUT: 5,         // bản 6.3: trong lúc bị chặn, cứ bấy nhiêu phút thử lại 1 lần
    NHAC_KHI_CHAN_PHUT: [10, 15, 20], // bản 6.4: nhắc sau 10, 15, 20 phút (mỗi lần dãn thêm 5 phút)
    SO_LAN_NHAC_KHI_CHAN: 3,          // bản 6.4: nhắc tối đa bấy nhiêu lần rồi thôi (vẫn tự thử lại)
    F5_KHI_THAY_HOP: 3,               // bản 6.4: thấy hộp xác minh -> tự F5 bấy nhiêu lần, cách 1 phút
    MAU_TIN_XAC_MINH: 'đang bị chặn bởi yêu cầu xác minh (hộp "Xác minh để tiếp tục")'
      + ' nên KHÔNG đọc được đơn.'
      + ' Mở tab TikTok trên máy canh đơn và bấm xác minh, script sẽ tự chạy lại.',

    // ===== HAI LỚP TỰ KIỂM =====
    BAT_CANH_BAO_IM_LANG: true,
    SO_NGAY_IM_LANG: 14,
    BAT_KIEM_LECH_GIO: true,
    LECH_GIO_TOI_DA_PHUT: 10,


    HIEN_THI_TREN_TRANG: true,
    CO_CHU_O_TRANG_THAI: 18,   // cỡ gốc; ô tự phóng theo bề rộng cửa sổ nên thu trang 33% vẫn đọc được
    BAO_CAO_CUOI_NGAY: false,  // bản 6.0: Cao bỏ báo cáo ngày   // sau 21h gửi 1 tin thống kê trong ngày (số lượt OK/lỗi/tự tải lại…)
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

  const KEY = 'tiktok_hoatoc_state_' + CAU_HINH.VIET_TAT;
  const KEY_HANG_CHO = 'tiktok_hoatoc_hangcho_' + CAU_HINH.VIET_TAT;
  const KEY_TAB_CHINH = KEY + '_tabchinh';   // tab nào đang canh
  const KEY_TU_SUA = KEY + '_tusua';         // sổ các lần tự tải lại
  const KEY_THAM_SO = 'tiktok_hoatoc_thamso_' + CAU_HINH.VIET_TAT;
  const TRANG_DON = '/order?order_status[]=1&selected_sort=11&tab=to_ship';
  const API_LIST = '/api/fulfillment/order/list';

  const TRANG_THAI_CAN_GUI = '1';  // order_status
  const TAB_CAN_GUI = '101';       // search_tab
  const GIAO_HOA_TOC = '5';        // delivery_option = Hoả tốc
  // TikTok trả mã này khi đang bắt xác minh captcha (phiên đăng nhập VẪN còn)
  const MA_CAN_XAC_MINH = [10000];
  // Bản 6.3: mỗi kiểu bị chặn một câu trên ô (o) và một tin nhóm Hệ thống (tin)
  const TIN_CHAN = {
    captcha: { o: 'TIKTOK BẮT XÁC MINH, cần bấm xác minh trên trang', tin: CAU_HINH.MAU_TIN_XAC_MINH },
    trang: { o: 'TIKTOK CHẶN TẢI ĐƠN trên máy này (trang cũng bị từ chối)',
      tin: 'TikTok chặn tải danh sách đơn trên máy canh đơn (chính trang TikTok cũng bị từ chối, không có hộp để bấm) nên KHÔNG đọc được đơn. Cần vào máy canh đơn kiểm tra, có thể phải đăng xuất rồi đăng nhập lại TikTok. Trong lúc này cần tự xem đơn hoả tốc.' },
    script: { o: 'TIKTOK CHẶN SCRIPT (trang vẫn tải đơn bình thường)',
      tin: 'TikTok từ chối lượt hỏi của script (mã 10000) dù trang vẫn tải đơn bình thường, nên script KHÔNG đọc được đơn. Script tự thử lại 5 phút/lần; trong lúc này cần tự xem đơn hoả tốc trên trang.' },
    khong_ro: { o: 'TIKTOK TỪ CHỐI lượt hỏi (mã 10000), không thấy hộp xác minh',
      tin: 'TikTok từ chối lượt hỏi (mã 10000), không thấy hộp xác minh trên trang, nên KHÔNG đọc được đơn. Cần mở tab TikTok trên máy canh đơn kiểm tra; trong lúc này cần tự xem đơn hoả tốc.' },
  };
  // search_tab của tab "Đã huỷ" trên trang TikTok (đối chiếu thực tế: mở tab
  // này lên, mọi đơn trong đó đều trả về đúng search_tab = 104).
  const TAB_DA_HUY = '104';

  const TEN = CAU_HINH.VIET_TAT + ' ' + CAU_HINH.TEN_SAN;
  const TEN_NGAN = CAU_HINH.VIET_TAT + ' ⚫';   // bản 6.0: tên ngắn trong tin Lark và ô trạng thái
  const PHIEN_BAN = '6.6';
  const logGoc = (...a) => console.log('%c[hoả tốc ' + TEN + ']', 'color:#0a8;font-weight:bold', ...a);
  const log = (...a) => { logGoc(...a); try { nkGhiLog(a); } catch (e) {} };   // bản 6.3: kèm nhật ký 7 ngày
  const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
  const hai = (n) => (n < 10 ? '0' : '') + n;

  // ---------- NHẬT KÝ 7 NGÀY (bản 6.3) ----------
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

  // Bản 6.4: phần tóm tắt từng ngày ở đầu file nhật ký
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
  let nghiDenKhi = 0; // đang bị bắt xác minh thì nghỉ tới mốc này mới hỏi lại

  // ---------- trạng thái ----------

  function stateMacDinh() {
    return {
      hoSo: {},            // mã đơn -> { ma, tao, han, daGap }
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
      daThuLamMoiXacMinh: false,
      soLanF5XacMinh: 0,          // bản 6.1: đã F5 mấy lần trong đợt xác minh này
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
      // SỬA Ở BẢN 4.8: thêm cờ daBao (đã báo vào nhóm hay chưa). Hồ sơ lập từ
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
    // Bản 6.4.4: hết lỗi -> bỏ tin lỗi còn kẹt trong hàng chờ, ghi nguyên nhân, không gửi trùng "đã canh lại"
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
        [/chặn tải danh sách đơn/, function () { return 'TikTok chặn tải đơn'; }],   // bản 6.3
        [/từ chối lượt hỏi của script/, function () { return 'TikTok chặn script'; }],
        [/từ chối lượt hỏi \(mã/, function () { return 'TikTok từ chối (mã 10000)'; }],
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
        const nhac = /\(nhắc lần (\d+)\)/.exec(nd);   // bản 6.3
        if (x) return the('carmine', '❌ ' + TEN_NGAN + ' · ' + ds[i][1](x) + (nhac ? ' · nhắc lần ' + nhac[1] : ''), '', chan);
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
      return the('green', '✅ Đã xử lý trong ' + m[1] + ' phút · ' + m[4].replace(/\s*\n\s*/g, ', '), '',   // bản 6.4.4
        m[5] + (m[6] ? ' · ' + m[6] : '') + ' · hoả tốc · ' + TEN_NGAN);
    }
    // --- khách huỷ ---
    if (/^ĐÃ HUỶ /.test(s)) {
      let g = s.slice(7).replace(/\n\(/, '\n').replace(/\)$/, '').split('\n');
      if (g.length >= 3 && g[0].indexOf(':') === -1) g = [g[0] + ': ' + g[1]].concat(g.slice(2));
      const d = tachTinDon(g.join('\n'));
      if (d) return the('grey', '❌ Đã huỷ · ' + d.hang, '', d.ma + (d.vc ? ' · ' + d.vc : '') + ' · hoả tốc · ' + TEN_NGAN);   // bản 6.4.4
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
    // Bản 6.4.4: tin lỗi hệ thống đã từng gửi hỏng (thường do mất mạng) thì HOÃN thêm 1 nhịp kiểm đơn —
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
        tin.lanHong = Date.now();   // bản 6.4.4
        // SỬA Ở BẢN MỚI: Lark TỪ CHỐI hẳn tin này (không phải do mạng) thì đẩy
        // nó xuống cuối hàng, để một tin hỏng không chặn mọi tin đơn phía sau.
        // Mất mạng thì giữ nguyên thứ tự (tin nào cũng sẽ hỏng như nhau).
        if (loai === 'tu_choi') {
          b.splice(i, 1);
          if (tin.thu < 30) b.push(tin);
          else log('bỏ hẳn tin sau 30 lần bị Lark từ chối:', tin.text);
          // Bản 6.0: bị từ chối 3 lần liền (sai từ khoá, webhook hỏng…) -> báo nhóm Hệ thống, 1 lần/ngày/nhóm
          if (tin.thu === 3 && tin.dich !== 'he_thong') setTimeout(function () { baoLarkTuChoi(tin.dich); }, 50);   // sau khi hàng chờ đã lưu
        }
        luuHangCho(b);
      }
      if (loai === 'mang') { try { localStorage.setItem(KEY + '_manghong', String(Date.now())); } catch (e) {} }   // bản 6.4.4: để ghi nguyên nhân "mất mạng"
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
  // Ý nghĩa: "script còn sống". Chuyện đọc API hỏng thì script tự báo lấy, nhờ
  // vậy hai lớp cảnh báo không giẫm chân nhau.
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
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); moNhatKy(); });   // bản 6.3
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


  // ---------- bản 6.4: hàng nút luôn hiện dưới ô — 🔄 Tải lại trang (to) + ⬇ Tải nhật ký ----------
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
    // Bản 6.4.4: lần trước báo mất mạng mà bấm lại trong 10 giây -> tải lại luôn
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
      h.appendChild(taoNutO('✏ Tin nhắc', nsMoSua));   // bản 6.5
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
    nkO(trangThai, dong2);   // bản 6.3: nhật ký
    O.trangThai = trangThai; O.dong2 = dong2 || ''; O.soDon = soDon || 0;
    veO();
  }

  // Chữ ngắn cho ô khi lỗi: "🔴 đăng xuất · SMH 🟠"
  function nhanNgan(dong2) {
    const t = String(dong2 || '');
    if (/ĐĂNG XUẤT|đăng xuất|đăng nhập/.test(t)) return 'đăng xuất';
    if (/CHẶN TẢI ĐƠN/.test(t)) return 'TikTok chặn tải đơn';   // bản 6.3
    if (/CHẶN SCRIPT/.test(t)) return 'TikTok chặn script';
    if (/TỪ CHỐI lượt hỏi/.test(t)) return 'TikTok từ chối';
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

      let nd = document.getElementById('__hoatoc_nd');   // bản 6.4
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
  // GẤP chỉ tắt khi HẠN rơi vào Chủ nhật, KHÔNG phải khi đơn phát sinh vào
  // Chủ nhật — đơn sinh tối CN có hạn 09:30 T2 thì VẪN phải cảnh báo.
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

  function kiemTraGap(state) {
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
      if (conLai <= 0) {
        guiLark(CAU_HINH.MAU_TIN_QUA_HAN.replace('{ma}', ma).replace('{ten}', TEN));
      } else {
        const phut = Math.max(1, Math.ceil(conLai / 60000));
        guiLark(CAU_HINH.MAU_TIN_GAP.replace('{ma}', ma).replace('{ten}', TEN).replace('{phut}', phut));
      }
    }
  }

  // ---------- hai lớp tự kiểm ----------

  // Sàn đổi mã bộ lọc thì script sẽ thấy 0 đơn MÃI MÃI mà không báo lỗi gì —
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

  // ---------- gọi API TikTok ----------

  // Trang TikTok tự gắn 4 tham số (aid, locale, oec_seller_id, seller_id) khi
  // gọi API này. Bản cũ gọi trỏng nên request của mình khác hẳn request của
  // trang — dấu hiệu rõ ràng của máy tự động. Ở đây đọc lại đúng chuỗi tham số
  // mà trang vừa dùng rồi tái sử dụng, và nhớ vào bộ nhớ trình duyệt phòng khi
  // không đọc được.
  // ---------- bản 6.3: NGHE TRANG + CHẨN ĐOÁN KHI TIKTOK TỪ CHỐI ----------
  // 1) Thông số trang: theo dõi LIÊN TỤC các lượt trang gọi danh sách đơn (trước đây đọc bảng ghi của
  //    trình duyệt, bảng này ngừng ghi sau 250 lượt tải nên script cứ dùng thông số cũ).
  // 2) Nghe kết quả các lượt TRANG tự tải danh sách đơn (mã 0 = trang tải được), để khi script bị
  //    từ chối thì biết là chặn cả trang hay chỉ chặn script.
  let thamSoMoi = '';
  const NGHE = { lan: 0, ma: null, t: 0, scriptDangGoi: 0, daGan: false };
  (function ngheTrang() {
    try {
      new PerformanceObserver(function (l) {
        for (const e of l.getEntries()) {
          if (e.name.indexOf(API_LIST) === -1) continue;
          try { const u = new URL(e.name); if (u.pathname === API_LIST && u.search) thamSoMoi = u.search; } catch (x) {}
        }
      }).observe({ type: 'resource', buffered: true });
    } catch (e) {}
    try {
      const w = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : null;
      if (!w || typeof w.fetch !== 'function' || w.fetch.__hoatocNghe) return;
      const goc = w.fetch;
      const boc = function (input, init) {
        const p = goc.apply(this, arguments);   // giữ nguyên cách gọi của trang
        try {
          const url = String((input && input.url) || input || '');
          if (url.indexOf(API_LIST) !== -1 && !(init && init.__hoatoc) && !NGHE.scriptDangGoi) {
            p.then(function (res) {
              try { res.clone().json().then(function (j) { NGHE.lan++; NGHE.ma = Number(j && j.code); NGHE.t = Date.now(); }).catch(function () {}); } catch (e) {}
            }).catch(function () {});
          }
        } catch (e) {}
        return p;
      };
      boc.__hoatocNghe = true;
      w.fetch = boc;
      NGHE.daGan = true;
    } catch (e) { NGHE.daGan = false; }
  })();

  function coHopXacMinh() {
    try {
      const ds = document.querySelectorAll('[id*="captcha" i],[class*="captcha" i],[id*="verify" i],[class*="verify" i],iframe[src*="captcha"],iframe[src*="verify"]');
      for (const e of ds) {
        if (/^(SCRIPT|STYLE|LINK|META)$/.test(e.tagName) || e.closest('#__hoatoc_badge,#__hoatoc_nk')) continue;
        const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
        if (r.width > 40 && r.height > 40 && cs.visibility !== 'hidden' && cs.display !== 'none') return true;
      }
      const o = document.getElementById('__hoatoc_badge');
      const chu = (document.body ? document.body.innerText : '').replace(o ? o.innerText : '', '');
      return /Xác minh để tiếp tục|Kéo thanh trượt|Verify to continue|Drag the slider/i.test(chu);
    } catch (e) { return false; }
  }
  // Nút ↻ cạnh chữ "Tìm thấy N đơn hàng" (đã đối chiếu thật 23/10: là ảnh reset.svg trong 1 thẻ div)
  function timNutLamMoi() {
    const ds = document.querySelectorAll('div,span,p');
    for (const e of ds) {
      if (e.children.length || !/^Tìm thấy \d+ đơn hàng$/.test((e.textContent || '').trim())) continue;
      let p = e.parentElement;
      for (let k = 0; k < 3 && p; k++, p = p.parentElement) {
        const i = p.querySelector('img[src*="reset"]');
        if (i) return i.parentElement || i;
        const s = p.querySelector('button svg');
        if (s) return s.closest('button');
      }
    }
    return null;
  }
  function soDonTrenTrang() {
    const m = /Tìm thấy (\d+) đơn hàng/.exec(document.body ? document.body.innerText : '');
    return m ? Number(m[1]) : -1;
  }
  // 'captcha' | 'trang' (trang cũng bị từ chối) | 'script' (trang vẫn tải được) | 'khong_ro'
  async function chanDoanChan() {
    if (coHopXacMinh()) return 'captcha';
    let nut = null;
    try { nut = timNutLamMoi(); } catch (e) {}
    let ketQua = 'khong_ro';
    if (nut) {
      const truoc = NGHE.lan;
      try { nut.click(); } catch (e) {}
      const bd = Date.now();
      while (Date.now() - bd < 10000) { await nghi(500); if (NGHE.lan > truoc) break; }
      if (coHopXacMinh()) ketQua = 'captcha';
      else if (NGHE.lan > truoc) ketQua = (NGHE.ma === 0) ? 'script' : 'trang';
      else if (soDonTrenTrang() > 0) ketQua = 'script';   // không nghe được trang nhưng trang vẫn hiện đơn
    }
    log('chẩn đoán TikTok từ chối: ' + ketQua + ' · nút làm mới ' + (nut ? 'có' : 'không thấy')
      + ' · nghe trang ' + (NGHE.daGan ? 'có' : 'không') + ' · trang trả mã ' + NGHE.ma + ' · trang hiện ' + soDonTrenTrang() + ' đơn');
    return ketQua;
  }
  let henChan = 0;
  function henThuLai(luc) {
    clearTimeout(henChan);
    henChan = setTimeout(function () { lanChayCuoi = 0; motVong(); }, Math.max(1000, luc - Date.now() + 1500));
  }
  function gioPhutCua(t) { const d = new Date(t); return hai(d.getHours()) + ':' + hai(d.getMinutes()); }

  function thamSoTrang() {
    let s = thamSoMoi;   // bản 6.3: thông số mới nhất theo dõi liên tục
    if (!s) try {
      const ds = performance.getEntriesByType('resource');
      for (let i = ds.length - 1; i >= 0; i--) {
        const n = ds[i].name;
        if (n.indexOf(API_LIST) === -1) continue;
        const u = new URL(n);
        if (u.pathname === API_LIST && u.search) { s = u.search; break; }
      }
    } catch (e) {}
    if (s) { try { localStorage.setItem(KEY_THAM_SO, s); } catch (e) {} return s; }
    try { return localStorage.getItem(KEY_THAM_SO) || ''; } catch (e) { return ''; }
  }

  // 'khong_co_phien' chỉ khi bị đẩy về trang đăng nhập hoặc bị 401/403.
  // Mã 10000 = đang bắt xác minh captcha. Mọi thứ khác là trục trặc tạm thời.
  // Đơn còn "chờ vận chuyển" (chưa xử lý). Không đọc được trường trạng thái
  // thì coi là chưa xử lý — thà báo thừa còn hơn bỏ sót.
  function choVanChuyen(don) {
    const m = don.order_status_module;
    const ds = Array.isArray(m) ? m : (m && typeof m === 'object' ? Object.values(m) : []);
    let coTruong = false;
    for (const x of ds) {
      if (!x || x.main_sub_order_status === undefined || x.main_sub_order_status === null) continue;
      coTruong = true;
      if (Number(x.main_sub_order_status) === 1) return true;
    }
    return !coTruong;
  }

  async function layDonHoaToc() {
    // SỬA Ở BẢN 5.3: hỏi CẢ tab "Cần gửi" (chờ vận chuyển + chờ lấy hàng) trong
    // MỘT lần, rồi tự chia bằng main_sub_order_status (1 = chờ vận chuyển,
    // 2 = chờ lấy hàng — đã đối chiếu thật). Trước đây hỏi 2 lần mỗi lượt.
    const dieuKien = {
      search_tab: { value: [TAB_CAN_GUI] },
      delivery_option: { value: [GIAO_HOA_TOC] },
    };
    const body = {
      search_condition: { condition_list: dieuKien },
      offset: 0, count: 50, sort_info: '11', search_cursor: '', pagination_type: 0,
    };
    const res = await fetchCoHan(API_LIST + thamSoTrang(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    const gioMayChu = res.headers.get('date');
    if (res.redirected && String(res.url).indexOf('/account/login') !== -1) {
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
    if (MA_CAN_XAC_MINH.indexOf(Number(j.code)) !== -1) {
      return { loi: 'can_xac_minh', chiTiet: 'TikTok bắt xác minh (mã ' + j.code + ')' };
    }
    if (Number(j.code) !== 0) {
      return { loi: 'api_loi', chiTiet: 'mã ' + j.code + (j.msg || j.message ? ' - ' + (j.msg || j.message) : '') };
    }
    const d = j.data || {};
    const tatCa = d.main_orders || [];
    return { donList: tatCa.filter(choVanChuyen), tatCa: tatCa, tong: d.total_count || 0, gioMayChu: gioMayChu };
  }

  async function layDonCoThuLai() {
    let ket = null;
    for (let i = 0; i <= CAU_HINH.SO_LAN_THU_LAI; i++) {
      if (i > 0) await nghi(CAU_HINH.CHO_THU_LAI_GIAY * 1000);
      try { ket = await layDonHoaToc(); }
      catch (e) { ket = { loi: 'api_loi', chiTiet: 'ngoại lệ: ' + String(e && e.message) }; }
      if (!ket.loi) return ket;
      if (ket.loi === 'khong_co_phien') return ket;
      // Bị bắt xác minh mà bắn thêm request chỉ làm TikTok nghi ngờ hơn
      if (ket.loi === 'can_xac_minh') return ket;
      log('lần thử ' + (i + 1) + ' hỏng:', ket.chiTiet);
    }
    return ket;
  }

  // Gọi tối đa 1 LẦN mỗi vòng (chỉ khi có đơn cần xác minh) để tìm TOÀN BỘ
  // đơn hoả tốc đã huỷ, thay vì tra riêng từng đơn — vừa đỡ tốn lượt gọi API
  // (dồn N đơn biến mất trong 1 vòng thành đúng 1 request), vừa dùng đúng bộ
  // điều kiện tìm kiếm (search_tab + delivery_option) giống hệt trang TikTok
  // hay dùng, tránh kiểu gọi lạ (tra theo từng ID) dễ bị chú ý hơn. Đã kiểm
  // chứng thực tế: lọc đúng 2 điều kiện này trả về ĐÚNG danh sách đơn hoả tốc
  // đã huỷ của cả shop (không lẫn đơn thường), sắp mới huỷ lên đầu — nên chỉ
  // cần 1 trang (50 đơn) là đủ phủ hết các đơn vừa biến mất ở vòng này.
  // Trả về null nếu gọi lỗi (mạng, sàn đổi cấu trúc…) -> coi như chưa xác
  // minh được, KHÔNG báo, để khỏi báo nhầm.
  async function layDonHoaTocDaHuy() {
    try {
      const body = {
        search_condition: { condition_list: {
          search_tab: { value: [TAB_DA_HUY] },
          delivery_option: { value: [GIAO_HOA_TOC] },
        } },
        offset: 0, count: 50, sort_info: '6', search_cursor: '', pagination_type: 0,
      };
      const res = await fetchCoHan(API_LIST + thamSoTrang(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (!res.ok) return null;
      let j = null;
      try { j = await docJson(res); } catch (e) { return null; }
      if (!j || Number(j.code) !== 0) return null;
      const list = (j.data && j.data.main_orders) || [];
      const bo = {};
      for (const o of list) {
        const id = String(o.main_order_id || '');
        if (id) bo[id] = true;
      }
      return bo;
    } catch (e) { return null; }
  }

  // Đơn nhân sự xử lý xong NHANH tới mức script chưa kịp thấy nó ở danh sách
  // chờ (giữa 2 lần kiểm tra) -> vẫn báo "ĐÃ XỬ LÝ trong vòng 1 phút".
  // Chỉ báo đơn phát sinh SAU lần đọc trước (tức đúng là đơn vừa mới có).
  async function baoDonXuLyNhanh(state, idHienTai, ds) {
    const truoc = state.lanDocOk || 0;
    const now = Date.now();
    if (!ds) return;
    state.lanDocOk = now;
    const coTheBao = lienMach(truoc, now);
    for (const d of ds) {
      const k = String(d.main_order_id || '');
      if (!k || idHienTai.indexOf(k) !== -1 || (state.daThay && state.daThay[k])) continue;
      ghiDaThay(state, k, true);
      if (!coTheBao) continue;
      const ts = Number(gioTaoDon(d)) || 0;
      if (ts * 1000 < truoc - 90000) continue; // đơn cũ, không phải đơn vừa có
      guiLark(ghiPhut(tinDaXuLy(moTaHang(d), k, tenDvvc(d)), ts));
    }
  }

  // ---------- đọc hàng hoá trong một đơn ----------

  function donGia(it) {
    const p = it.sku_unit_price;
    if (!p) return null;
    const v = (p.price_val !== undefined && p.price_val !== null) ? p.price_val : p.format_price;
    if (v === undefined || v === null) return null;
    const so = Number(String(v).replace(/[^0-9.]/g, ''));
    return isNaN(so) ? null : so;
  }

  function tenHang(it) {
    let ten = String(it.seller_sku_name || '').trim();
    if (!ten) ten = String(it.sku_name || '').trim();
    if (!ten) ten = String(it.product_name || '').trim().slice(0, CAU_HINH.DO_DAI_TOI_DA_TEN);
    return ten;
  }

  // Đọc từ fulfill_line_module, KHÔNG dùng sku_module: giá ở sku_module đã bị
  // phân bổ khuyến mãi nên quà tặng không còn là 0đ (đo thực tế 1.071đ, 8.032đ)
  // -> lọc theo giá vô tác dụng. fulfill_line_module có giá thật + cờ is_gift,
  // đây cũng là nguồn TikTok dùng để hiện nhãn "Quà" trên trang đơn hàng.
  function layHang(don) {
    const nguon = don.fulfill_line_module || don.sku_module || {};
    const ra = [];
    for (const k of Object.keys(nguon)) {
      const it = nguon[k];
      if (!it || typeof it !== 'object') continue;
      const ten = tenHang(it);
      if (!ten) continue;
      ra.push({ ten: ten, sl: it.quantity || 1, gia: donGia(it), qua: it.is_gift === true });
    }
    return ra;
  }

  function moTaHang(don) {
    const tatCa = layHang(don);
    let dung = tatCa.slice();
    if (CAU_HINH.BO_QUA_QUA_TANG) dung = dung.filter(function (h) { return !h.qua; });
    if (CAU_HINH.BO_QUA_HANG_0D) dung = dung.filter(function (h) { return h.gia !== 0; });
    if (!dung.length) dung = tatCa.slice();
    if (CAU_HINH.XEP_THEO_GIA_GIAM) {
      dung.sort(function (a, b) { return (b.gia || 0) - (a.gia || 0); });
    }
    return dung.map(function (h) { return h.ten + ' x' + h.sl; }).join(CAU_HINH.NGAN_CACH_HANG);
  }

  function gioTaoDon(don) { return (don.trade_order_module || {}).create_time; }

  // Tên ĐVVC: delivery_module[].shipment_provider_info.name (đã kiểm thật trên
  // đơn hoả tốc: Ahamove / BeDelivery). Không có thì để trống.
  function tenDvvc(don) {
    try {
      const dm = don.delivery_module || {};
      for (const k of Object.keys(dm)) {
        const p = dm[k] && dm[k].shipment_provider_info;
        if (p && p.name) return String(p.name).trim();
      }
    } catch (e) {}
    return '';
  }

  // Dòng 3: "17:25 - 17/09/2026 - 586116802144995125"
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

  function dangOTrangDangNhap() {
    return location.pathname.indexOf('/account/login') === 0
        || location.pathname.indexOf('/account/register') === 0;
  }

  // SỬA Ở BẢN 4.0: đặt cờ dangBaoLoi để khi đăng nhập lại còn có tin phục hồi.
  // Bản cũ bắn tin thẳng mà không ghi cờ nên nhóm không bao giờ biết đã xong.
  function canhBaoDangXuat(state) {
    if (!trongGioLamViec()) return;
    const now = Date.now();
    if (!state.lanLoiDau) state.lanLoiDau = now;
    // Chờ đủ giờ như mọi tin hệ thống khác: đôi khi trang chỉ ghé qua màn đăng
    // nhập vài giây rồi tự vào lại, báo ngay là báo nhầm.
    if (now - state.lanLoiDau < 2 * 60000) return; // 2 phút, đủ loại trừ chuyển trang thoáng qua
    if (now - (state.lanBaoLoiCuoi || 0) <= CAU_HINH.NHAC_DANG_XUAT_PHUT * 60000) return;
    state.lanBaoLoiCuoi = now;
    state.dangBaoLoi = true;
    thongKe(state, 'dangXuat');
    tinHeThong('đã bị đăng xuất trên máy canh đơn, hiện KHÔNG canh được đơn. Cần đăng nhập lại ngay.');
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
    const duLau = (state.soTaiLaiDot || 0) >= 2 || (now - state.lanLoiDau) >= CAU_HINH.PHUT_TRUOC_KHI_BAO * 60000;   // bản 6.4.4: tự tải lại 2 lần rồi mới báo
    const matPhien = (ket.loi === 'khong_co_phien');
    const xacMinh = (ket.loi === 'can_xac_minh');

    // Captcha KHÔNG tự hết — phải có người bấm. Xác nhận vài vòng là báo ngay,
    // rồi giãn nhịp quét cho nguội thay vì tiếp tục hỏi dồn.
    if (xacMinh) {
      // Bản 6.3: F5 2 lần (ngay, sau 1 phút) — vẫn bị từ chối thì đã tự xem trang (chanDoanChan) để
      // gọi đúng bệnh. Báo nhóm sau 5 phút kể từ lúc bắt đầu, nhắc lại sau 10 phút, rồi 15 phút/lần;
      // trong lúc đó cứ 5 phút thử lại 1 lần. Các lần F5 này KHÔNG tính vào giới hạn 3 lần/giờ.
      const LICH_F5 = CAU_HINH.LICH_F5_XAC_MINH_GIAY || [0, 60];
      const soF5 = state.soLanF5XacMinh || 0;
      if (soF5 < LICH_F5.length) {
        state.soLanF5XacMinh = soF5 + 1;
        if (!soF5) thongKe(state, 'xacMinh');
        luuState(state);
        const cho = LICH_F5[soF5] * 1000;
        capNhatO('cho', gioBayGio() + ' — TikTok báo cần xác minh, tự tải lại lần ' + (soF5 + 1) + '/' + LICH_F5.length
          + (cho ? ' sau ' + LICH_F5[soF5] + ' giây' : ''));
        setTimeout(function () { tuPhucHoi('TikTok báo cần xác minh (lần ' + (soF5 + 1) + ')', true); }, cho);
        return;
      }
      // Bản 6.4: THẤY hộp xác minh -> tự F5 thêm vài lần (cách 1 phút), hộp vẫn còn mới báo
      const tongH = CAU_HINH.F5_KHI_THAY_HOP || 3;
      if (ket.loaiChan === 'captcha' && (state.soF5Hop || 0) < tongH) {
        state.soF5Hop = (state.soF5Hop || 0) + 1;
        state.loaiChan = 'captcha';
        luuState(state);
        const lanH = state.soF5Hop;
        nghiDenKhi = now + 90000;
        capNhatO('cho', gioBayGio() + ' — TikTok hiện hộp xác minh, tự tải lại lần ' + lanH + '/' + tongH + ' sau 1 phút');
        setTimeout(function () { tuPhucHoi('thấy hộp xác minh (F5 ' + lanH + '/' + tongH + ')', true); }, 60000);
        return;
      }
      state.loaiChan = ket.loaiChan || 'khong_ro';
      const mo = TIN_CHAN[state.loaiChan] || TIN_CHAN.khong_ro;
      const mocBao = state.lanLoiDau + CAU_HINH.BAO_CHAN_SAU_PHUT * 60000;
      if (!state.soLanBaoChan && now < mocBao - 30000) {
        nghiDenKhi = mocBao;
        henThuLai(nghiDenKhi);
        capNhatO('cho', gioBayGio() + ' — ' + mo.o + ' · thử lại lúc ' + gioPhutCua(nghiDenKhi) + ', chưa báo nhóm');
        return;
      }
      nghiDenKhi = now + CAU_HINH.THU_LAI_KHI_CHAN_PHUT * 60000;
      henThuLai(nghiDenKhi);
      capNhatO('loi', gioBayGio() + ' — ' + mo.o + ' · thử lại lúc ' + gioPhutCua(nghiDenKhi));
      const n = state.soLanBaoChan || 0;
      const ks = CAU_HINH.NHAC_KHI_CHAN_PHUT || [10, 15, 20];
      const khoang = n ? ks[Math.min(n - 1, ks.length - 1)] * 60000 : 0;
      if (!n || (n <= (CAU_HINH.SO_LAN_NHAC_KHI_CHAN || 3) && now - (state.lanBaoChanCuoi || 0) >= khoang - 30000)) {
        state.soLanBaoChan = n + 1;
        state.lanBaoChanCuoi = now;
        state.lanBaoLoiCuoi = now;
        state.dangBaoLoi = true;
        tinHeThong(mo.tin + (n ? ' (nhắc lần ' + (n + 1) + ')' : ''));
      }
      return;
    }

    // Bản 6.4.4: còn lượt tự tải lại (tối đa 2 lần mỗi đợt lỗi) thì tải lại TRƯỚC, chưa báo nhóm;
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
    if (matPhien || (duLau && duVong)) {   // bản 6.2: mất phiên báo NGAY vòng đầu
      capNhatO('loi', gioBayGio() + ' — hỏng ' + soPhut + ' phút: ' + (ket.chiTiet || ket.loi));
      if (now - state.lanBaoLoiCuoi > 30 * 60000) {
        state.lanBaoLoiCuoi = now;
        state.dangBaoLoi = true;
        if (matPhien) {
          tinHeThong('mất phiên đăng nhập trên máy canh đơn, KHÔNG còn canh được đơn. Cần đăng nhập lại ngay.');
        } else {
          tinHeThong('không đọc được dữ liệu ' + soPhut + ' phút liền ('
            + (ket.chiTiet || ket.loi)
            + '). Trong lúc này cần tự vào Trung tâm nhà bán hàng kiểm tra đơn hoả tốc.');
        }
      }
    } else {
      capNhatO('cho', gioBayGio() + ' — trục trặc, đang tự thử lại ('
        + state.loiLienTiep + '/' + CAU_HINH.LOI_LIEN_TIEP_BAO + '): ' + (ket.chiTiet || ket.loi));
    }

    // Không đọc được dữ liệu nhiều lượt liền -> tự tải lại trang 1 lần cho đợt
    // lỗi này; sau đó vẫn hỏng thì nhánh trên báo nhóm ngay.
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
    state.soTaiLaiDot = 0;   // bản 6.4.4
    state.daThuLamMoiXacMinh = false;
    state.soLanF5XacMinh = 0;
    state.soLanBaoChan = 0;   // bản 6.3
    state.soF5Hop = 0;        // bản 6.4
    state.lanBaoChanCuoi = 0;
    state.loaiChan = '';
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
        const st = docState();
        capNhatO('loi', 'ĐÃ BỊ ĐĂNG XUẤT — cần đăng nhập lại');
        canhBaoDangXuat(st);
        luuState(st);
        return;
      }
      if (navigator.onLine === false) {
        capNhatO('cho', gioBayGio() + ' — máy đang mất mạng, chờ có mạng lại');
        return;
      }
      // Đang bị bắt xác minh: nghỉ cho nguội, hỏi dồn chỉ làm TikTok siết thêm
      if (Date.now() < nghiDenKhi) {
        const con = Math.ceil((nghiDenKhi - Date.now()) / 60000);
        const st0 = docState(), mo0 = TIN_CHAN[st0.loaiChan] || TIN_CHAN.captcha;
        capNhatO(st0.soLanBaoChan ? 'loi' : 'cho', gioBayGio() + ' — ' + mo0.o + ' (hỏi lại sau ~' + con + ' phút)');
        return;
      }

      const state = docState();
      const ket = await layDonCoThuLai();
      if (ket.loi) {
        if (ket.loi === 'can_xac_minh' && (state.soLanF5XacMinh || 0) >= (CAU_HINH.LICH_F5_XAC_MINH_GIAY || [0, 60]).length) {
          try { ket.loaiChan = await chanDoanChan(); } catch (e) { ket.loaiChan = 'khong_ro'; }
        }
        log('lỗi:', ket);
        xuLyLoi(state, ket);
        luuState(state);
        return;
      }
      nghiDenKhi = 0;
      kiemTraLechGio(state, ket.gioMayChu);
      xoaLoi(state);
      thongKe(state, 'ok');

      // MỘT NGUỒN DUY NHẤT: state.hoSo vừa là danh sách đơn đang chờ, vừa giữ
      // hạn xử lý. Bản cũ nuôi song song state.ids và state.hoSo — hai danh
      // sách lệch nhau là sinh báo trùng hoặc bỏ sót, nên đã gộp làm một.
      const idHienTai = ket.donList
        .map(function (d) { return String(d.main_order_id || ''); })
        .filter(Boolean);

      if (idHienTai.length) state.lanCuoiThayDon = Date.now();

      // 1) Đơn đã rời danh sách chờ (gom lại, tra danh sách đã huỷ 1 LẦN):
      //    - ĐANG TREO (chưa báo nhóm): khách huỷ -> im lặng; nhân sự đã xử lý
      //      -> 1 tin "ĐÃ XỬ LÝ trong vòng 1 phút (...)" thay cho tin báo đơn.
      //    - ĐÃ báo nhóm: khách huỷ -> tin "ĐÃ HUỶ"; xử lý xong -> im lặng.
      const bienMat = [];
      for (const k of Object.keys(state.hoSo)) {
        if (idHienTai.indexOf(k) !== -1) continue;
        const h = state.hoSo[k];
        delete state.hoSo[k];
        ghiDaThay(state, k, true);
        if (h) bienMat.push(h);
      }
      if (bienMat.length) {
        const daHuyBo = await layDonHoaTocDaHuy();
        if (daHuyBo) {
          for (const h of bienMat) {
            const huy = !!daHuyBo[h.ma];
            if (h.daBao) { if (huy) guiLark(tinDaHuy(h.tinHuy || h.tinDon)); }
            else if (!huy) guiLark(ghiPhut(h.tinXuLy || tinDaXuLy('', h.ma, ''), h.tao));
          }
        }
      }

      // 1b) Đơn đã xử lý xong trước cả khi script kịp thấy
      for (const k of idHienTai) ghiDaThay(state, k);
      await baoDonXuLyNhanh(state, idHienTai, ket.tatCa);

      // 2) Đơn mới = có trong danh sách mà chưa có hồ sơ
      const donMoi = ket.donList.filter(function (d) {
        const k = String(d.main_order_id || '');
        return k && !state.hoSo[k];
      });

      log('đơn hoả tốc cần gửi:', idHienTai.length, '| đơn mới:', donMoi.length);
      capNhatO(idHienTai.length ? 'canh_bao' : 'ok',
        gioBayGio() + ' — ' + idHienTai.length + ' đơn chờ xử lý', idHienTai.length);

      // 3) Lập hồ sơ cho đơn mới NGAY, nhưng CHƯA báo vào nhóm vội — phải
      //    treo đủ CAU_HINH.PHUT_GIU_TRUOC_KHI_BAO phút tính từ giờ đơn phát
      //    sinh. TikTok trả sẵn giờ phát sinh nên không tốn thêm lần gọi API.
      for (const d of donMoi) {
        const k = String(d.main_order_id || '');
        const ts = gioTaoDon(d);
        state.hoSo[k] = {
          ma: k, tao: ts, han: tinhHan(ts), daGap: false, daBao: false,
          choDenLuc: (Number(ts) || Math.floor(Date.now() / 1000)) * 1000
            + CAU_HINH.PHUT_GIU_TRUOC_KHI_BAO * 60000,
          tinDon: tinMotDon(moTaHang(d), k, ts, tenDvvc(d)),
          tinHuy: tinGocHuy(moTaHang(d), k, ts, tenDvvc(d)),
          tinXuLy: tinDaXuLy(moTaHang(d), k, tenDvvc(d)),
        };
        if (state.daThay && state.daThay[k] && state.daThay[k].roi) {
          // Đơn từng rời danh sách chờ (đã xử lý) nay QUAY LẠI — vd. sàn đang
          // tìm lại tài xế. Không báo lại như đơn mới.
          state.hoSo[k].daBao = true;
          state.hoSo[k].quayLai = true;
          state.hoSo[k].daGap = true; // đã xử lý rồi -> không tính trễ, không báo GẤP
          log('đơn quay lại danh sách chờ, không báo lại:', state.hoSo[k].ma);
        }
      }

      // 4) Đơn đã treo đủ giờ và vẫn còn trong danh sách -> báo vào nhóm.
      for (const k of Object.keys(state.hoSo)) {
        const h = state.hoSo[k];
        if (!h || h.daBao) continue;
        if (Date.now() < h.choDenLuc) continue;
        h.daBao = true;
        thongKe(state, 'don');
        guiLark(h.tinDon || tinMotDon('', h.ma || k, h.tao || 0));
      }

      kiemTraGap(state);
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

  const TRANG_CANH = TRANG_DON;

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
  // Bản 6.4: lượt hỏi danh sách đơn đi qua ĐƯỜNG CỦA TRANG — code TikTok trên trang tự gắn mã ký
  // tên mới (msToken, X-Bogus, X-Gnarly) như lượt hỏi của chính trang. Đã đối chiếu thật 23/10: gọi
  // qua đường này không cần kèm mã, trang tự ký. Máy nào không dùng được thì quay về đường riêng.
  const DUONG_TRANG = { dung: false };
  try { DUONG_TRANG.dung = typeof unsafeWindow !== 'undefined' && !!unsafeWindow && typeof unsafeWindow.fetch === 'function'; } catch (e) {}
  function boMaKy(url) {
    try {
      const u = new URL(url, location.origin);
      ['msToken', 'X-Bogus', 'X-Gnarly'].forEach(function (k) { u.searchParams.delete(k); });
      return u.pathname + u.search;
    } catch (e) { return url; }
  }
  function goiSan(url, o) {
    if (!DUONG_TRANG.dung || String(url).indexOf(API_LIST) === -1) return fetch(url, o);
    let p;
    try { p = unsafeWindow.fetch(boMaKy(url), o); } catch (e) { p = Promise.reject(e); }
    return Promise.resolve(p).catch(function (e) {
      if (e && /abort/i.test(String(e.name || '') + String(e.message || ''))) throw e;
      DUONG_TRANG.dung = false;
      log('gọi qua đường của trang hỏng, quay về đường riêng:', String(e && e.message));
      return fetch(url, o);
    });
  }
  function fetchCoHan(url, opts) {
    let ctrl = null;
    try { ctrl = new AbortController(); } catch (e) {}
    const o = Object.assign({}, opts || {});
    if (ctrl) o.signal = ctrl.signal;
    o.__hoatoc = 1;   // bản 6.3: lượt của script, phần nghe trang bỏ qua
    NGHE.scriptDangGoi++;
    return coHan(goiSan(url, o), CAU_HINH.HAN_GOI_MANG_GIAY * 1000, 'gọi sàn')   // bản 6.4
      .catch(function (e) { try { if (ctrl) ctrl.abort(); } catch (x) {} throw e; })
      .finally(function () { setTimeout(function () { NGHE.scriptDangGoi = Math.max(0, NGHE.scriptDangGoi - 1); }, 300); });
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

  async function tuPhucHoi(lyDo, khongTinhGioiHan) {
    if (dangTaiLai) return false;
    const now = Date.now();
    const gioQua = docNhatKyTuSua().filter(function (x) { return now - x.t < 3600000 && !x.xm; });
    if (!khongTinhGioiHan && gioQua.length >= CAU_HINH.TU_TAI_LAI_TOI_DA_MOI_GIO) {
      capNhatO('loi', gioBayGio() + ' — TỰ SỬA KHÔNG ĐƯỢC: ' + lyDo);
      const tsH = Number(localStorage.getItem(KEY + '_tusuahong') || 0);   // bản 6.4.4
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
      a.push({ t: Date.now(), lyDo: lyDo, xm: !!khongTinhGioiHan });
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
    const cuoiNgay = (loai === 'xuly') ? [18, 30] : [20, 0];   // bản 6.4.1: hạn quét 20:00
    // bản 6.4.2: đơn 0:00–8:00 (ngày làm việc) được in lúc 8h cùng đơn tối qua -> chung đợt quét 11:30
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
    if (/^BEST\s+Express$/i.test(t)) return 'BEST';   // bản 6.4.2: chỉ BEST bỏ chữ Express
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
  // Bản 6.4.2: mã đơn hạn 12h ghi trước, đơn 0:00–8:00 (hạn trong ngày) ghi sau kèm "(hạn trong ngày)" — chỉ mốc 11:30
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

  // Bản 6.4.3: mốc 11:30 — toàn bộ đơn chờ lấy hàng, chia 3 nhóm theo hạn
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
      return '🚚 ' + g.hang + (moc.nhacLai ? ' vẫn còn ' : ' có ') + g.ds.length + ' đơn chưa quét ' + TEN_NGAN + '\n' + maQuet(g.ds, moc);   // bản 6.4.2
    });
  }

  // ---- một mốc
  async function qhChayMoc(state, moc) {
    const C = CAU_HINH.QUA_HAN, khoaMoc = qhNhanMoc(moc);
    // bản 6.4.3: mốc 11:30 chỉ chạy trong 2,5 giờ sau mốc (cài script buổi chiều không bắn tin 11:30 muộn)
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
    if (moc.tatCa) {   // bản 6.4.3: mốc 11:30
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
    tinHeThong('🧪 bản ' + PHIEN_BAN + ' · Hệ thống OK');   // bản 6.4: chỉ nhóm Cao hệ thống
  }

  function qhBatDau() {
    qhChuyenHangChoCu();
    setTimeout(qhMotVong, 9000);
    setInterval(qhMotVong, CAU_HINH.QUA_HAN.NHIP_KIEM_GIAY * 1000);
    if (typeof kiemChuaIn === 'function') { setTimeout(kiemChuaIn, 25000); setInterval(kiemChuaIn, 60000); }
    log('quá hạn: canh các mốc', CAU_HINH.QUA_HAN.MOC.map(qhNhanMoc).join(', '));
  }

  // ---- TikTok: tab Cần gửi, lọc trạng thái; không có kiểu lọc "khác hoả tốc" nên hỏi riêng nhóm hoả tốc rồi trừ ra
  const QH_CHUA_XU_LY = '1', QH_DA_XU_LY = '2';
  async function qhGoiDanhSach(dieuKien) {
    const res = await fetchCoHan(API_LIST + thamSoTrang(), {
      method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ search_condition: { condition_list: dieuKien }, offset: 0, count: 100, sort_info: '11', search_cursor: '', pagination_type: 0 }),
    });
    if (res.redirected && String(res.url).indexOf('/account/login') !== -1) return { loi: 'bị chuyển về trang đăng nhập' };
    if (res.status === 401 || res.status === 403) return { loi: 'HTTP ' + res.status };
    if (!res.ok) return { loi: 'HTTP ' + res.status };
    let j = null;
    try { j = await docJson(res); } catch (e) { j = null; }
    if (!j || typeof j.code === 'undefined') return { loi: 'phản hồi lạ' };
    if (Number(j.code) === 10000) return { loi: 'TikTok đang bắt xác minh (mã 10000)' };
    if (Number(j.code) !== 0) return { loi: 'mã ' + j.code + (j.msg || j.message ? ' - ' + (j.msg || j.message) : '') };
    return { don: ((j.data || {}).main_orders) || [] };
  }
  async function qhDonQuaHan(loai, tatCa) {   // bản 6.4.3: tatCa = lấy cả đơn chưa quá hạn
    const trangThai = (loai === 'xuly') ? QH_CHUA_XU_LY : QH_DA_XU_LY;
    const chinh = await qhGoiDanhSach({ order_status: { value: [trangThai] }, search_tab: { value: [TAB_CAN_GUI] } });
    if (chinh.loi) return chinh;
    await nghi(500);
    const ht = await qhGoiDanhSach({ order_status: { value: [trangThai] }, search_tab: { value: [TAB_CAN_GUI] }, delivery_option: { value: [GIAO_HOA_TOC] } });
    if (ht.loi) return ht;
    const boQua = {};
    for (const d of ht.don) boQua[String(d.main_order_id || '')] = true;
    const ds = [];
    for (const d of chinh.don) {
      const ma = String(d.main_order_id || '');
      if (!ma || boQua[ma]) continue;
      const tm = d.trade_order_module || {};
      const luc = tm.create_time ? new Date(tm.create_time * 1000) : null;
      if (!tatCa && !qhQuaHan(luc, loai)) continue;
      const dm = (d.delivery_module || [])[0] || {};
      ds.push({ ma: ma, luc: luc, dv: String(((dm.shipment_provider_info || {}).name) || '').trim() });
    }
    ds.sort(function (a, b) { return (a.luc ? a.luc.getTime() : 0) - (b.luc ? b.luc.getTime() : 0); });
    return { ds: ds };
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
      const st = docState();
      canhBaoDangXuat(st);
      luuState(st);
      // Bị đăng xuất KHÔNG phải là máy chết: script vẫn đang chạy, chỉ là trang
      // cần đăng nhập lại. Vì vậy vẫn điểm danh đều với Healthchecks, để nhóm chỉ
      // nhận MỘT tin "đã bị đăng xuất" thay vì kèm thêm tin "máy đã NGỪNG hoạt động".
      // Mỗi phút: điểm danh + kiểm tra đã đủ giờ báo "đăng xuất" chưa (báo sau
      // 2 phút, không chờ lần tải lại kế tiếp). Ô trạng thái vẫn chớp đỏ.
      (function nhipCho() {
        if (trongGioLamViec()) {
          diemDanh();
          try { const s2 = docState(); canhBaoDangXuat(s2); luuState(s2); } catch (e) {}
        }
        capNhatO('loi', 'ĐÃ BỊ ĐĂNG XUẤT — cần đăng nhập lại');
        setTimeout(nhipCho, 60000);
      })();
      nhipTim();
      henQuayVeTrangDon();
      return;
    }

    if (location.pathname.indexOf('/order') !== 0) {
      // Đã có tab khác đang canh thì để yên tab này cho nhân sự dùng việc khác
      if (coTabChinhKhac()) { log('đã có tab khác canh đơn, để yên tab này'); return; }
      log('không phải trang đơn hàng, chuyển về');
      setTimeout(function () { location.href = TRANG_DON; }, 4000);
      return;
    }

    log('đang canh shop:', TEN, '— khung giờ', nhanKhungGio(), '— nhịp', CAU_HINH.CHU_KY_GIAY, 'giây');
    log('gọi sàn: ' + (DUONG_TRANG.dung ? 'qua đường của trang (TikTok tự ký tên)' : 'đường riêng (không dùng được đường của trang)'));
    capNhatO('ok', 'đang khởi động, chờ lần kiểm tra đầu tiên…');
    motVong();

    // Nhịp xê dịch ngẫu nhiên cho đỡ giống máy quét đều tăm tắp
    (function hen() {
      const dao = CAU_HINH.CHU_KY_DAO_DONG_GIAY || 0;
      const giay = CAU_HINH.CHU_KY_GIAY + (Math.random() * 2 - 1) * dao;
      setTimeout(function () { motVong(); hen(); }, Math.max(20, giay) * 1000);
    })();

    henLamMoi();                            // tự làm mới trang định kỳ
    qhBatDau();                             // bản 6.0: phần quá hạn (4 mốc)
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
     NHẮC SIZE 108 HẠT 8LI (bản 6.5)
     Đơn có món "108 … 8li" -> tự gửi 1 tin nhắc khách kiểm tra cổ tay, qua chính
     khung chat của sàn (script thao tác như người gõ: trang tự gắn mã bảo vệ).
     - Mỗi đơn đúng 1 lần, tối đa NS.TOI_DA_NGAY tin/ngày, chạy cả ban đêm.
     - Gửi trong 1 tab nền mở riêng, xong tự đóng; mọi bước ghi nhật ký.
     - Hỏng 2 lần -> báo nhóm Cao hệ thống kèm mã đơn + câu mẫu để nhắn tay.
     ========================================================================== */
  const NS = {
    BAT: true,
    TOI_DA_NGAY: 20,
    NHIP_PHUT: 10,            // hỏi sàn tìm đơn mới mỗi bấy nhiêu phút (± 30%)
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

  // ---- TikTok: tìm đơn, chi tiết, gửi trong tab nền ----
  function nsDuongDon(id) { return '/order/detail?order_no=' + id; }
  function nsIdTrangDon() { return location.pathname === '/order/detail' ? (new URLSearchParams(location.search).get('order_no') || '') : ''; }
  async function nsTimDon() {
    const don = [], co = {};
    for (const st of [QH_CHUA_XU_LY, QH_DA_XU_LY]) {
      const kq = await qhGoiDanhSach({ order_status: { value: [st] }, search_tab: { value: [TAB_CAN_GUI] } });
      if (kq.loi) return kq;
      for (const d of kq.don) { const id = String(d.main_order_id || ''); if (id && !co[id]) { co[id] = 1; don.push({ id: id, d: d }); } }
      await nsNghi(1500);
    }
    return { don: don };
  }
  async function nsChiTiet(o) {
    const nguon = (o.d && (o.d.fulfill_line_module || o.d.sku_module)) || {};
    const mon = [];
    for (const k of Object.keys(nguon)) {
      const it = nguon[k]; if (!it || typeof it !== 'object') continue;
      const pl = String(it.seller_sku_name || '') + ' ' + String(it.sku_name || '');
      if (nsKhop(pl, pl + ' ' + String(it.product_name || ''))) mon.push((String(it.seller_sku_name || it.sku_name || '').trim() || 'vòng 108 hạt 8li') + ' x' + (it.quantity || 1));
    }
    return { ma: o.id, khop: mon.length > 0, mon: mon.join(', ') };
  }
  function nsChuTrang() { return (document.body ? document.body.innerText : '').replace(/\s+/g, ' '); }
  function nsThongBao(chu, mau) {
    let t = document.getElementById('__ns_tb');
    if (!t) { t = document.createElement('div'); t.id = '__ns_tb'; t.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:2147483647;color:#fff;padding:10px 16px;border-radius:8px;font:700 14px system-ui;box-shadow:0 4px 14px rgba(0,0,0,.4)'; document.body.appendChild(t); }
    t.style.background = mau || '#1e2128'; t.textContent = chu;
  }
  // Bước 1 (trang chi tiết đơn): bấm biểu tượng chat ở "Chi tiết khách hàng"; TikTok mở trang chat
  // bằng cửa sổ mới -> chặn lại và mở ngay trong tab này.
  async function nsConGui(thu) {
    const job = nsGet(NS_K.job, {}) || {};
    const xong = function (ok, loi) {
      log('nhắc size' + (job.thu ? ' (gửi thử)' : '') + ': đơn ' + job.id + ' → ' + (ok ? 'đã gửi' : 'HỎNG: ' + loi));
      try { nkLuu(); } catch (e) {}
      if (!job.thu) nsBaoKetQua(job.id, ok, loi);
      else nsThongBao(ok ? '✔ Gửi thử xong — xem trong khung chat' : '⚠ Gửi thử chưa được: ' + loi, ok ? '#14853b' : '#c0341d');
      return { ok: ok, loi: loi || '' };
    };
    try {
      if (thu) { job.thu = true; nsSet(NS_K.job, job); }
      if (!job.id || job.id !== nsIdTrangDon()) return xong(false, 'việc gửi không khớp đơn đang mở');
      log('nhắc size: tab gửi tin đã mở đơn ' + job.id);
      const w = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;
      let daMo = false;
      w.open = function (u) {
        daMo = true;
        const j = nsGet(NS_K.job, {}) || {}; j.buoc = 'chat'; j.t = Date.now(); nsSet(NS_K.job, j);
        log('nhắc size: mở trang chat của đơn ' + job.id);
        location.href = String(u);
        return null;
      };
      const tieuDe = await nsCho(function () { return [...document.querySelectorAll('div,span,h2,h3,p')].find(function (e) { return !e.children.length && e.textContent.trim() === 'Chi tiết khách hàng'; }); }, 40000, 'mục "Chi tiết khách hàng"');
      let hang = tieuDe.parentElement;
      for (let i = 0; i < 3 && hang && !hang.querySelector('svg'); i++) hang = hang.parentElement;
      const icon = hang && [...hang.querySelectorAll('svg')].filter(function (s) { return s.getBoundingClientRect().width > 0; }).pop();
      if (!icon) return xong(false, 'không thấy biểu tượng chat ở "Chi tiết khách hàng"');
      let bam = icon; for (let i = 0; i < 3 && bam.parentElement && !(bam.onclick || getComputedStyle(bam).cursor === 'pointer'); i++) bam = bam.parentElement;
      bam.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await nsCho(function () { return daMo; }, 15000, 'trang chat mở ra');
      return { ok: true, loi: '' };   // phần còn lại chạy ở trang chat
    } catch (e) { return xong(false, e.message); }
  }
  // Bước 2 (trang chat): dán tin, bấm Gửi, kiểm tra tin đã hiện
  async function nsConChat() {
    const job = nsGet(NS_K.job, {}) || {};
    const xong = function (ok, loi) {
      log('nhắc size' + (job.thu ? ' (gửi thử)' : '') + ': đơn ' + job.id + ' → ' + (ok ? 'đã gửi' : 'HỎNG: ' + loi));
      try { nkLuu(); } catch (e) {}
      if (!job.thu) nsBaoKetQua(job.id, ok, loi);
      else nsThongBao(ok ? '✔ Gửi thử xong — tin đã hiện trong khung chat' : '⚠ Gửi thử chưa được: ' + loi, ok ? '#14853b' : '#c0341d');
      const j = nsGet(NS_K.job, {}) || {}; j.buoc = 'xong'; nsSet(NS_K.job, j);
    };
    try {
      const idUrl = new URLSearchParams(location.search).get('orderId') || '';
      if (idUrl && idUrl !== job.id) return xong(false, 'trang chat mở cho đơn khác (' + idUrl + ')');
      const ta = await nsCho(function () { return [...document.querySelectorAll('textarea')].find(function (t) { return t.getBoundingClientRect().width > 0 && !t.disabled; }); }, 40000, 'ô nhập tin nhắn');
      await nsNghi(4000);   // chờ tải tin cũ để kiểm trùng
      const sn = nsSnip(job.tin);
      if (nsChuTrang().indexOf(sn) !== -1) return xong(true, 'câu này đã có sẵn trong khung chat, không gửi lại');
      nsDatChu(ta, job.tin);
      await nsNghi(700);
      const nut = await nsCho(function () { return [...document.querySelectorAll('button')].find(function (b) { return b.textContent.trim() === 'Gửi' && !b.disabled && b.getBoundingClientRect().width > 0; }); }, 8000, 'nút "Gửi"');
      nut.click();
      await nsCho(function () { return ta.value.trim() === '' && nsChuTrang().indexOf(sn) !== -1; }, 12000, 'tin vừa gửi hiện trong khung chat');
      xong(true, '');
    } catch (e) { xong(false, e.message); }
  }
  function nsLaTabCon() {
    const job = nsGet(NS_K.job, {}) || {};
    if (nsIdTrangDon() && (location.hash === '#nhacsize' || (job.buoc === 'mo' && !job.thu && job.id === nsIdTrangDon() && Date.now() - (job.t || 0) < 120000))) return true;
    return location.pathname.indexOf('/chat') === 0 && job.buoc === 'chat' && Date.now() - (job.t || 0) < 120000;
  }
  function nsChayTabCon() {
    if (location.pathname.indexOf('/chat') === 0) setTimeout(nsConChat, 3000);
    else setTimeout(function () { nsConGui(false); }, 4000);
  }


  /* ---------- Bản 6.6: TỰ CẬP NHẬT từ GitHub ----------
     - Tampermonkey tự tải bản mới (link @updateURL). Script chỉ: ghi nhật ký,
       báo nhóm Cao hệ thống khi máy đã lên bản mới, tải lại trang (lúc rảnh, tối đa
       1 lần/giờ) để nạp bản mới, và báo nếu sau 8 tiếng máy vẫn chưa lên bản. */
  const CN_LINK = 'https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/tdg/canh-don-SMH-tiktok.user.js';
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

  // Bản 6.5: tab nền gửi tin nhắc size thì CHỈ làm việc đó, không canh đơn
  if (NS.BAT && nsLaTabCon()) { log('nhắc size: tab này chỉ để gửi tin'); nsChayTabCon(); }
  else { setTimeout(khoiDong, 4000); setTimeout(nsBatDau, 8000); setTimeout(cnBatDau, 6000); }
})();
