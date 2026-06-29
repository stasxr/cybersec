// CYBERSEC CYPRUS — academy page engine: EN/EL i18n, accordions, request form, scroll reveal.
(function () {
  "use strict";

  var SUPPORTED = ["en", "el"];
  var STORE = "cybersec_academy_lang";

  var lang = null;
  try {
    lang = localStorage.getItem(STORE);
    if (SUPPORTED.indexOf(lang) === -1) {
      var site = localStorage.getItem("cybersec_lang");
      lang = site === "el" ? "el" : "en";
    }
  } catch (e) { lang = "en"; }

  function dict() { return (window.ACADEMY && window.ACADEMY[lang]) || (window.ACADEMY && window.ACADEMY.en) || {}; }
  function resolve(obj, path) {
    return path.split(".").reduce(function (o, k) { return (o && o[k] !== undefined) ? o[k] : undefined; }, obj);
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  var CHEV = '<svg class="ac-mod__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  var DL = '<svg class="ac-card__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>';

  /* linkify URLs and emails inside a contact string (safe DOM nodes only) */
  function linkify(text) {
    var frag = document.createDocumentFragment();
    var re = /(https?:\/\/[^\s|]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
    var last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      var a = document.createElement("a");
      a.className = "ac-res__contact";
      if (m[1]) { a.href = m[1]; a.target = "_blank"; a.rel = "noopener"; a.textContent = m[1]; }
      else { a.href = "mailto:" + m[2]; a.textContent = m[2]; }
      frag.appendChild(a);
      last = re.lastIndex;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  function span(cls, text) { var s = document.createElement("span"); s.className = cls; s.textContent = text; return s; }

  function buildModules(container, key) {
    var data = dict()[key]; if (!data) return;
    clear(container);
    data.modules.forEach(function (m, i) {
      var li = document.createElement("li"); li.className = "ac-mod";
      var head = document.createElement("button");
      head.type = "button"; head.className = "ac-mod__head"; head.setAttribute("aria-expanded", "false");
      head.appendChild(span("ac-mod__num", pad(i + 1)));
      head.appendChild(span("ac-mod__name", m.title));
      head.insertAdjacentHTML("beforeend", CHEV);
      var inner = document.createElement("div"); inner.className = "ac-mod__detailInner";
      var p = document.createElement("p"); p.className = "ac-mod__desc"; p.textContent = m.desc;
      inner.appendChild(p);
      var detail = document.createElement("div"); detail.className = "ac-mod__detail"; detail.appendChild(inner);
      li.appendChild(head); li.appendChild(detail);
      head.addEventListener("click", function () {
        var open = li.classList.toggle("open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
      });
      container.appendChild(li);
    });
  }

  function buildCards(container) {
    var d = dict(); clear(container);
    d.materials.items.forEach(function (it) {
      var a = document.createElement("a"); a.className = "ac-card"; a.href = "#join";
      a.insertAdjacentHTML("beforeend", DL);
      a.appendChild(span("ac-card__title", it.title));
      a.appendChild(span("ac-card__desc", it.desc));
      a.appendChild(span("ac-card__cta", d.cta.button));
      container.appendChild(a);
    });
  }

  function buildResources(container) {
    var d = dict(); clear(container);
    d.resources.items.forEach(function (r) {
      var li = document.createElement("li");
      li.appendChild(span("ac-res__name", r.name));
      var meta = document.createElement("span"); meta.className = "ac-res__meta"; meta.appendChild(linkify(r.contact));
      li.appendChild(meta);
      li.appendChild(span("ac-res__note", r.note));
      container.appendChild(li);
    });
  }

  function buildOptions(select) {
    clear(select);
    dict().form.roleOptions.forEach(function (o) {
      var op = document.createElement("option"); op.value = o; op.textContent = o; select.appendChild(op);
    });
  }

  function buildParas(container, key) {
    var arr = resolve(dict(), key); if (!arr) return;
    clear(container);
    arr.forEach(function (t) { var p = document.createElement("p"); p.textContent = t; container.appendChild(p); });
  }

  function render() {
    var d = dict();
    document.documentElement.lang = lang;

    Array.prototype.forEach.call(document.querySelectorAll("[data-ac]"), function (el) {
      var v = resolve(d, el.getAttribute("data-ac"));
      if (typeof v === "string") el.textContent = v;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-ac-paras]"), function (el) { buildParas(el, el.getAttribute("data-ac-paras")); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-ac-modules]"), function (el) { buildModules(el, el.getAttribute("data-ac-modules")); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-ac-cards]"), function (el) { buildCards(el); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-ac-resources]"), function (el) { buildResources(el); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-ac-options]"), function (el) { buildOptions(el); });

    var fl = document.getElementById("acFootLink");
    if (fl && d.footer) {
      clear(fl);
      var parts = d.footer.split("PALANIT");
      fl.appendChild(document.createTextNode(parts[0]));
      var st = document.createElement("strong"); st.textContent = "PALANIT"; fl.appendChild(st);
      fl.appendChild(document.createTextNode((parts[1] || "") + " ↗"));
    }

    Array.prototype.forEach.call(document.querySelectorAll("[data-setlang]"), function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-setlang") === lang);
    });
  }

  function setLang(next) {
    if (SUPPORTED.indexOf(next) === -1 || next === lang) return;
    lang = next;
    try { localStorage.setItem(STORE, lang); } catch (e) { /* ignore */ }
    render();
  }

  /* ---- request form: validate -> open prefilled email -> show success ---- */
  function wireForm() {
    var form = document.getElementById("acForm");
    var success = document.getElementById("acSuccess");
    if (!form) return;
    var nameEl = document.getElementById("acName");
    var emailEl = document.getElementById("acEmail");
    var roleEl = document.getElementById("acRole");
    var msgEl = document.getElementById("acMsg");
    var consentEl = document.getElementById("acConsent");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      if (!nameEl.value.trim()) { nameEl.classList.add("invalid"); ok = false; } else nameEl.classList.remove("invalid");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailEl.value.trim())) { emailEl.classList.add("invalid"); ok = false; } else emailEl.classList.remove("invalid");
      if (!consentEl.checked) { ok = false; consentEl.focus(); }
      if (!ok) return;

      var subject = "Cyber-Safe Families Cyprus — materials request";
      var body =
        "Name: " + nameEl.value.trim() + "\n" +
        "Email: " + emailEl.value.trim() + "\n" +
        "Role: " + roleEl.value + "\n\n" +
        "Message:\n" + (msgEl.value.trim() || "—");
      var mailto = "mailto:manager@cybersec.cy?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

      form.hidden = true;
      success.hidden = false;
      try { window.location.href = mailto; } catch (err) { /* ignore */ }
    });
  }

  /* ---- scroll reveal ---- */
  function wireReveal() {
    var items = document.querySelectorAll(".reveal:not(.in)");
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---- init ---- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-setlang]"), function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-setlang")); });
  });
  render();
  wireForm();
  wireReveal();
})();
