// CYBERSEC CYPRUS — i18n + services accordion + language switcher
(function () {
  "use strict";

  var SUPPORTED = ["en", "el", "ru", "uk", "kk", "de"];
  var STORE_KEY = "cybersec_lang";

  var lang = null;
  try { lang = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
  if (SUPPORTED.indexOf(lang) === -1) lang = "en";

  function dict() {
    return (window.I18N && window.I18N[lang]) || (window.I18N && window.I18N.en) || {};
  }

  var CHEV =
    '<svg class="svc__chev" width="20" height="20" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2.6" stroke-linecap="round" ' +
    'stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function setText(sel, val) {
    if (val == null) return;
    var el = document.querySelector(sel);
    if (el) el.textContent = val;
  }

  function applyText() {
    var d = dict();
    document.documentElement.lang = lang;
    setText('[data-i18n="eyebrow"]', d.eyebrow);
    setText('[data-i18n="fieldLabel"]', d.fieldLabel);
    setText('[data-i18n="disclaimer"]', d.disclaimer);
    setText('[data-i18n="privacy"]', d.privacy);
    setText('[data-i18n="terms"]', d.terms);
    var fl = document.getElementById("footLink");
    if (fl && d.footer) {
      fl.innerHTML = d.footer.replace("PALANIT", "<strong>PALANIT</strong>") + " ↗";
    }
  }

  function buildList() {
    var ul = document.getElementById("serviceList");
    if (!ul) return;
    ul.innerHTML = "";
    var services = dict().services || [];

    services.forEach(function (s, i) {
      var li = document.createElement("li");
      li.className = "svc";

      li.innerHTML =
        '<button class="svc__head" type="button" aria-expanded="false">' +
          '<span class="svc__num">' + pad(i + 1) + "</span>" +
          '<span class="svc__name">' + s.name + "</span>" +
          CHEV +
        "</button>" +
        '<div class="svc__detail"><div class="svc__detailInner">' +
          '<div class="svc__body">' +
            '<span class="svc__desc">' + s.desc + "</span>" +
            '<span class="svc__bar">|</span>' +
            '<span class="svc__price">' + s.price + "</span>" +
          "</div>" +
        "</div></div>";

      var head = li.querySelector(".svc__head");
      head.addEventListener("click", function () {
        var open = li.classList.toggle("open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
      });

      ul.appendChild(li);
    });
  }

  function markActiveLang() {
    var btns = document.querySelectorAll("#langMenu button[data-lang]");
    Array.prototype.forEach.call(btns, function (b) {
      b.setAttribute("aria-checked", b.getAttribute("data-lang") === lang ? "true" : "false");
    });
  }

  function setLang(next) {
    if (SUPPORTED.indexOf(next) === -1 || next === lang) return;
    lang = next;
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* ignore */ }
    applyText();
    buildList();
    markActiveLang();
  }

  /* --- services master field --- */
  var field = document.getElementById("fieldToggle");
  var panel = document.getElementById("servicesPanel");
  if (field && panel) {
    field.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      field.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* --- language menu --- */
  var langWrap = document.getElementById("lang");
  var langBtn = document.getElementById("langBtn");
  var langMenu = document.getElementById("langMenu");
  if (langWrap && langBtn && langMenu) {
    langBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = langWrap.classList.toggle("open");
      langBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    langMenu.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-lang]");
      if (!b) return;
      setLang(b.getAttribute("data-lang"));
      langWrap.classList.remove("open");
      langBtn.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("click", function (e) {
      if (!langWrap.contains(e.target)) {
        langWrap.classList.remove("open");
        langBtn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        langWrap.classList.remove("open");
        langBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* --- init --- */
  applyText();
  buildList();
  markActiveLang();
})();
