// ==UserScript==
// @name         SMH thu vung rieng (xoa sau khi thu)
// @namespace    smh-thu-vung-rieng
// @version      1.0
// @description  Chi thu: Tampermonkey co cho chay ma nap ve tren Facebook khong khi chay trong vung rieng. Khong dang bai, khong doi gi.
// @match        https://www.facebook.com/*
// @sandbox      JavaScript
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_info
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// @noframes
// ==/UserScript==
(function () {
  'use strict';
  const kq = { luc: new Date().toLocaleTimeString('vi-VN'), cheDo: (typeof GM_info !== 'undefined' && (GM_info.sandboxMode || GM_info.injectInto)) || '?', tm: (typeof GM_info !== 'undefined' && GM_info.version) || '?' };
  const ghi = () => { let el = document.getElementById('smh-thu-vung-rieng'); if (!el) { el = document.createElement('textarea'); el.id = 'smh-thu-vung-rieng'; el.style.display = 'none'; document.documentElement.appendChild(el); } el.value = JSON.stringify(kq); };
  try { const f = new Function('a', 'b', 'return a + b'); kq.maNho = f(40, 2) === 42 ? 'DUOC' : 'SAI'; } catch (e) { kq.maNho = 'BI CHAN: ' + String(e.message).slice(0, 160); }
  try { const t0 = Date.now(); const s = 'var x = 0;\n' + 'x = x + 1;\n'.repeat(60000); const g = new Function(s + 'return x;'); kq.maLon = g() === 60000 ? 'DUOC (' + Math.round(s.length / 1024) + ' KB, ' + (Date.now() - t0) + ' ms)' : 'SAI'; } catch (e) { kq.maLon = 'BI CHAN: ' + String(e.message).slice(0, 160); }
  try { GM_setValue('thu', 1); kq.luuTru = GM_getValue('thu') === 1 ? 'DUOC' : 'SAI'; } catch (e) { kq.luuTru = 'LOI: ' + e.message; }
  ghi();
  try {
    GM_xmlhttpRequest({ method: 'GET', url: 'https://raw.githubusercontent.com/phanbacao/smh-dang-bai-fb/main/trangthai.json', timeout: 20000,
      onload: (r) => { kq.taiVe = r.status === 200 ? 'DUOC' : 'MA ' + r.status;
        try { const g = new Function('d', 'return JSON.parse(d).chinhThuc'); kq.chayMaTaiVe = 'DUOC (' + g(r.responseText) + ')'; } catch (e) { kq.chayMaTaiVe = 'BI CHAN: ' + String(e.message).slice(0, 120); }
        ghi(); },
      onerror: () => { kq.taiVe = 'MAT KET NOI'; ghi(); }, ontimeout: () => { kq.taiVe = 'QUA LAU'; ghi(); } });
  } catch (e) { kq.taiVe = 'LOI: ' + e.message; ghi(); }
})();
