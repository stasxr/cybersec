// CyberSec by Palanit — Personal Security Checklist portal.
// 100% client-side: local accounts (hashed passwords in localStorage) + per-user progress.
// No backend, no network — accounts/progress live only in this browser.
(function () {
  "use strict";

  var LS_USERS = "cybersec_csl_users";
  var LS_SESSION = "cybersec_csl_session";
  var LS_PROG = "cybersec_csl_prog_";
  var ACCENTS = ["#cdf546", "#12a4c4", "#ff4326"];
  var PRIOS = ["essential", "optional", "advanced"];
  var SECTIONS = window.CHECKLIST || [];

  /* ---------------- storage helpers ---------------- */
  function getUsers() { try { return JSON.parse(localStorage.getItem(LS_USERS) || "{}"); } catch (e) { return {}; } }
  function saveUsers(u) { localStorage.setItem(LS_USERS, JSON.stringify(u)); }
  function getProgress(user) { try { return JSON.parse(localStorage.getItem(LS_PROG + user) || "{}"); } catch (e) { return {}; } }
  function saveProgress(user, p) { localStorage.setItem(LS_PROG + user, JSON.stringify(p)); }

  /* ---------------- crypto (salted SHA-256) ---------------- */
  function toHex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function randSalt() { var a = new Uint8Array(16); crypto.getRandomValues(a); return toHex(a); }
  // PBKDF2-SHA256, 100k iterations — slow-by-design so weak passwords aren't trivially brute-forced
  function hashPw(pw, salt) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(pw), { name: "PBKDF2" }, false, ["deriveBits"])
      .then(function (key) {
        return crypto.subtle.deriveBits(
          { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, key, 256);
      })
      .then(toHex);
  }

  /* ---------------- elements ---------------- */
  var authView = document.getElementById("authView");
  var appView = document.getElementById("appView");
  var form = document.getElementById("authForm");
  var userEl = document.getElementById("cslUser");
  var passEl = document.getElementById("cslPass");
  var pass2El = document.getElementById("cslPass2");
  var confirmFld = document.getElementById("confirmFld");
  var errEl = document.getElementById("authErr");
  var submitEl = document.getElementById("authSubmit");
  var tabBtns = document.querySelectorAll(".auth__tabs button");

  var mode = "login";
  var currentUser = null;
  var progress = {};
  var built = false;

  /* ---------------- auth UI ---------------- */
  function setMode(m) {
    mode = m;
    Array.prototype.forEach.call(tabBtns, function (b) { b.classList.toggle("is-active", b.getAttribute("data-tab") === m); });
    confirmFld.hidden = m !== "register";
    submitEl.textContent = m === "register" ? "Create account" : "Log in";
    passEl.setAttribute("autocomplete", m === "register" ? "new-password" : "current-password");
    hideErr();
  }
  function showErr(msg) { errEl.textContent = msg; errEl.hidden = false; }
  function hideErr() { errEl.hidden = true; }

  Array.prototype.forEach.call(tabBtns, function (b) {
    b.addEventListener("click", function () { setMode(b.getAttribute("data-tab")); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideErr();
    var username = userEl.value.trim();
    var pw = passEl.value;
    userEl.classList.remove("invalid"); passEl.classList.remove("invalid");

    if (username.length < 2) { userEl.classList.add("invalid"); return showErr("Username must be at least 2 characters."); }
    if (pw.length < 4) { passEl.classList.add("invalid"); return showErr("Password must be at least 4 characters."); }
    if (!window.crypto || !crypto.subtle) { return showErr("This browser blocks secure hashing here. Open the site over HTTPS."); }

    var users = getUsers();
    submitEl.disabled = true;

    if (mode === "register") {
      if (users[username]) { submitEl.disabled = false; userEl.classList.add("invalid"); return showErr("That username is already taken on this device."); }
      if (pw !== pass2El.value) { submitEl.disabled = false; pass2El.classList.add("invalid"); return showErr("The two passwords don't match."); }
      var salt = randSalt();
      hashPw(pw, salt).then(function (h) {
        users[username] = { salt: salt, hash: h };
        saveUsers(users);
        finishAuth(username);
      }).catch(function () { submitEl.disabled = false; showErr("Something went wrong. Please try again."); });
    } else {
      var rec = users[username];
      if (!rec) { submitEl.disabled = false; userEl.classList.add("invalid"); return showErr("No account with that username on this device. Try Register."); }
      hashPw(pw, rec.salt).then(function (h) {
        if (h !== rec.hash) { submitEl.disabled = false; passEl.classList.add("invalid"); return showErr("Wrong password."); }
        finishAuth(username);
      }).catch(function () { submitEl.disabled = false; showErr("Something went wrong. Please try again."); });
    }
  });

  function finishAuth(username) {
    submitEl.disabled = false;
    passEl.value = ""; pass2El.value = "";
    try { localStorage.setItem(LS_SESSION, username); } catch (e) { /* ignore */ }
    showApp(username);
  }

  /* ---------------- app ---------------- */
  var CHEV = '<svg class="sec__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function itemId(slug, i) { return slug + "/" + i; }

  function buildSections() {
    var root = document.getElementById("sections");
    SECTIONS.forEach(function (sec, si) {
      var wrap = el("section", "sec"); wrap.setAttribute("data-slug", sec.slug);

      var head = el("button", "sec__head"); head.type = "button"; head.setAttribute("aria-expanded", "false");
      var accent = el("span", "sec__accent"); accent.style.background = ACCENTS[si % ACCENTS.length];
      var meta = el("span", "sec__meta");
      meta.appendChild(el("span", "sec__title", sec.title));
      meta.appendChild(el("span", "sec__desc", sec.description));
      var count = el("span", "sec__count", "0/" + sec.items.length);
      var mini = el("span", "sec__mini"); var miniFill = el("span"); mini.appendChild(miniFill);
      head.appendChild(accent); head.appendChild(meta); head.appendChild(count); head.appendChild(mini);
      head.insertAdjacentHTML("beforeend", CHEV);

      var bodyInner = el("div", "sec__bodyInner");
      if (sec.intro) { var intro = el("div", "sec__intro"); intro.innerHTML = sec.intro; bodyInner.appendChild(intro); }

      sec.items.forEach(function (it, ii) {
        var id = itemId(sec.slug, ii);
        var item = el("div", "item"); item.setAttribute("data-id", id); item.setAttribute("data-priority", it.priority);

        var row = el("label", "item__row");
        var cb = el("input", "item__cb"); cb.type = "checkbox"; cb.setAttribute("data-id", id);
        var point = el("span", "item__point", it.point);
        var badge = el("span", "badge badge--" + it.priority, it.priority.charAt(0).toUpperCase() + it.priority.slice(1));
        row.appendChild(cb); row.appendChild(point); row.appendChild(badge);

        var more = el("button", "item__more", "Details ▾"); more.type = "button";
        var details = el("div", "item__details");
        var detailsInner = el("div", "item__detailsInner");
        details.appendChild(detailsInner);

        cb.addEventListener("change", function () { toggleItem(id, cb.checked); });
        more.addEventListener("click", function () {
          if (!detailsInner.dataset.loaded) { detailsInner.innerHTML = it.details; detailsInner.dataset.loaded = "1"; }
          var open = item.classList.toggle("expanded");
          more.textContent = open ? "Hide details ▴" : "Details ▾";
        });

        item.appendChild(row); item.appendChild(more); item.appendChild(details);
        bodyInner.appendChild(item);
      });

      var body = el("div", "sec__body"); body.appendChild(bodyInner);
      head.addEventListener("click", function () {
        var open = wrap.classList.toggle("open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
      });
      wrap.appendChild(head); wrap.appendChild(body);
      root.appendChild(wrap);
    });
  }

  function applyProgressToDOM() {
    Array.prototype.forEach.call(document.querySelectorAll(".item"), function (item) {
      var on = !!progress[item.getAttribute("data-id")];
      item.classList.toggle("done", on);
      var cb = item.querySelector(".item__cb"); if (cb) cb.checked = on;
    });
    updateBars();
  }

  function toggleItem(id, checked) {
    if (checked) progress[id] = true; else delete progress[id];
    if (currentUser) saveProgress(currentUser, progress);
    var item = document.querySelector('.item[data-id="' + cssEsc(id) + '"]');
    if (item) item.classList.toggle("done", checked);
    updateBars();
  }
  function cssEsc(s) { return s.replace(/"/g, '\\"'); }

  function updateBars() {
    var total = 0, done = 0;
    var byP = { essential: [0, 0], optional: [0, 0], advanced: [0, 0] };
    SECTIONS.forEach(function (sec) {
      var sTotal = sec.items.length, sDone = 0;
      sec.items.forEach(function (it, ii) {
        var on = !!progress[itemId(sec.slug, ii)];
        total++; if (on) done++;
        byP[it.priority][0] += on ? 1 : 0; byP[it.priority][1]++;
        if (on) sDone++;
      });
      var wrap = document.querySelector('.sec[data-slug="' + sec.slug + '"]');
      if (wrap) {
        wrap.querySelector(".sec__count").textContent = sDone + "/" + sTotal;
        wrap.querySelector(".sec__mini span").style.width = (sTotal ? (sDone / sTotal * 100) : 0) + "%";
      }
    });
    var pct = total ? Math.round(done / total * 100) : 0;
    document.getElementById("progFill").style.width = pct + "%";
    var stats = document.getElementById("progStats");
    stats.textContent = "";
    stats.appendChild(makeStat(null, "<b>" + done + "</b> / " + total + " done · <b>" + pct + "%</b>"));
    PRIOS.forEach(function (p) {
      stats.appendChild(makeStat(p, '<span class="dot dot--' + p + '"></span>' + p.charAt(0).toUpperCase() + p.slice(1) + ": <b>" + byP[p][0] + "</b>/" + byP[p][1]));
    });
  }
  function makeStat(p, html) { var s = document.createElement("span"); s.innerHTML = html; return s; }

  /* filters + hide-done */
  function wireControls() {
    var root = document.getElementById("sections");
    Array.prototype.forEach.call(document.querySelectorAll("#filters button"), function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(document.querySelectorAll("#filters button"), function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        root.classList.remove("f-essential", "f-optional", "f-advanced");
        var f = b.getAttribute("data-filter");
        if (f !== "all") root.classList.add("f-" + f);
        refreshEmptySections();
      });
    });
    document.getElementById("hideDone").addEventListener("change", function (e) {
      root.classList.toggle("hide-done", e.target.checked);
      refreshEmptySections();
    });
    document.getElementById("resetBtn").addEventListener("click", function () {
      if (!confirm("Reset all your checklist progress? This can't be undone.")) return;
      progress = {};
      if (currentUser) saveProgress(currentUser, progress);
      applyProgressToDOM();
      refreshEmptySections();
    });
    document.getElementById("logoutBtn").addEventListener("click", logout);
  }

  function refreshEmptySections() {
    Array.prototype.forEach.call(document.querySelectorAll(".sec"), function (sec) {
      var visible = Array.prototype.some.call(sec.querySelectorAll(".item"), function (it) {
        return it.offsetParent !== null || getComputedStyle(it).display !== "none";
      });
      sec.classList.toggle("empty", !visible);
    });
  }

  function showApp(username) {
    currentUser = username;
    document.getElementById("appUser").textContent = username;
    if (!built) { buildSections(); wireControls(); built = true; }
    progress = getProgress(username);
    applyProgressToDOM();
    refreshEmptySections();
    authView.hidden = true;
    appView.hidden = false;
    window.scrollTo(0, 0);
  }

  function logout() {
    try { localStorage.removeItem(LS_SESSION); } catch (e) { /* ignore */ }
    currentUser = null; progress = {};
    appView.hidden = true;
    authView.hidden = false;
    setMode("login");
    userEl.value = ""; passEl.value = "";
  }

  /* ---------------- init ---------------- */
  setMode("login");
  var session = null;
  try { session = localStorage.getItem(LS_SESSION); } catch (e) { /* ignore */ }
  if (session && getUsers()[session]) showApp(session);
})();
