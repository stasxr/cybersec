// CYBERSEC CYPRUS — i18n + services accordion + language switcher
(function () {
  "use strict";

  var SUPPORTED = ["en", "el", "ru", "uk", "kk", "de", "elv"];
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
    setText('[data-i18n="kidsBtn"]', d.kidsBtn);
    var fl = document.getElementById("footLink");
    if (fl && d.footer) {
      // build with DOM nodes (no innerHTML) so translated strings can't inject markup
      while (fl.firstChild) fl.removeChild(fl.firstChild);
      var parts = d.footer.split("PALANIT");
      fl.appendChild(document.createTextNode(parts[0]));
      var strong = document.createElement("strong");
      strong.textContent = "PALANIT";
      fl.appendChild(strong);
      fl.appendChild(document.createTextNode((parts[1] || "") + " ↗"));
    }
    updateBodyLang();
  }

  function updateBodyLang() {
    var b = document.body;
    b.className = b.className.replace(/\blang-\S+/g, "").replace(/\s+/g, " ").trim();
    b.classList.add("lang-" + lang);
    document.dispatchEvent(new CustomEvent("cybersec:lang", { detail: { lang: lang } }));
  }

  function span(cls, text) {
    var s = document.createElement("span");
    s.className = cls;
    s.textContent = text;
    return s;
  }

  function buildList() {
    var ul = document.getElementById("serviceList");
    if (!ul) return;
    while (ul.firstChild) ul.removeChild(ul.firstChild);
    var services = dict().services || [];

    services.forEach(function (s, i) {
      var li = document.createElement("li");
      li.className = "svc";

      // header: number + name + (static) chevron — values set via textContent, no injection
      var head = document.createElement("button");
      head.className = "svc__head";
      head.type = "button";
      head.setAttribute("aria-expanded", "false");
      head.appendChild(span("svc__num", pad(i + 1)));
      head.appendChild(span("svc__name", s.name));
      head.insertAdjacentHTML("beforeend", CHEV); // CHEV is a constant literal, no data

      // detail: description | price
      var body = document.createElement("div");
      body.className = "svc__body";
      body.appendChild(span("svc__desc", s.desc));
      body.appendChild(span("svc__bar", "|"));
      body.appendChild(span("svc__price", s.price));

      var inner = document.createElement("div");
      inner.className = "svc__detailInner";
      inner.appendChild(body);
      var detail = document.createElement("div");
      detail.className = "svc__detail";
      detail.appendChild(inner);

      li.appendChild(head);
      li.appendChild(detail);

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
