// CYBERSEC CYPRUS — Elvish-mode easter eggs: live lightning + breakable email button.
// Driven by the "cybersec:lang" event dispatched from script.js.
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =====================================================================
     1) LIVE LIGHTNING (canvas behind the content, only in Elvish mode)
     ===================================================================== */
  var canvas, ctx, raf = 0, bolts = [], active = false, lastSpawn = 0, flash = 0;

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement("canvas");
    canvas.className = "lightning";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }
  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeBolt() {
    var w = canvas.width, h = canvas.height;
    var x = Math.random() * w;
    var n = 12 + Math.floor(Math.random() * 8);
    var len = h * (0.45 + Math.random() * 0.5);
    var segs = [], cx = x;
    for (var i = 0; i <= n; i++) {
      cx += (Math.random() - 0.5) * w * 0.07;
      segs.push([cx, (len / n) * i]);
    }
    var branches = [];
    if (Math.random() < 0.75) {
      var bi = 2 + Math.floor(Math.random() * (n - 4));
      var bx = segs[bi][0], by = segs[bi][1];
      var bseg = [[bx, by]], bn = 3 + Math.floor(Math.random() * 4);
      var dir = Math.random() < 0.5 ? -1 : 1;
      for (var j = 1; j <= bn; j++) {
        bx += dir * Math.random() * w * 0.05 + (Math.random() - 0.5) * w * 0.02;
        by += Math.random() * h * 0.06;
        bseg.push([bx, by]);
      }
      branches.push(bseg);
    }
    return { segs: segs, branches: branches, born: performance.now(), life: 240 + Math.random() * 280 };
  }

  function strokePts(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }

  function drawBolt(b, a) {
    ctx.save();
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.shadowColor = "rgba(150,190,255," + a + ")"; ctx.shadowBlur = 26;
    ctx.strokeStyle = "rgba(165,205,255," + (a * 0.5) + ")"; ctx.lineWidth = 4.5;
    strokePts(b.segs);
    ctx.shadowBlur = 10;
    ctx.strokeStyle = "rgba(244,250,255," + a + ")"; ctx.lineWidth = 1.6;
    strokePts(b.segs);
    for (var i = 0; i < b.branches.length; i++) strokePts(b.branches[i]);
    ctx.restore();
  }

  function frame(t) {
    if (!active) return;
    raf = requestAnimationFrame(frame);
    if (t - lastSpawn > 550 + Math.random() * 1300) {
      lastSpawn = t;
      bolts.push(makeBolt());
      if (Math.random() < 0.45) flash = Math.max(flash, 0.06 + Math.random() * 0.08);
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (flash > 0.003) {
      ctx.fillStyle = "rgba(150,180,255," + flash + ")";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flash *= 0.8;
    } else { flash = 0; }
    for (var i = bolts.length - 1; i >= 0; i--) {
      var b = bolts[i], k = (t - b.born) / b.life;
      if (k >= 1) { bolts.splice(i, 1); continue; }
      var a = k < 0.16 ? k / 0.16 : 1 - (k - 0.16) / 0.84;
      drawBolt(b, Math.max(0, Math.min(1, a)));
    }
  }

  function startLightning() {
    if (reduce || active) return;
    ensureCanvas();
    active = true;
    canvas.classList.add("on");
    lastSpawn = 0; bolts = []; flash = 0;
    raf = requestAnimationFrame(frame);
  }
  function stopLightning() {
    active = false;
    if (raf) cancelAnimationFrame(raf);
    if (canvas) { canvas.classList.remove("on"); }
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    bolts = [];
  }

  /* =====================================================================
     2) BREAKABLE EMAIL BUTTON (Elvish mode only)
        click -> a unique crack; 5th click -> shatter into shards that fall.
        Other languages keep the normal mailto behaviour.
     ===================================================================== */
  var email = document.querySelector(".email");
  var SVGNS = "http://www.w3.org/2000/svg";
  var crackSvg = null, cracks = 0, shattered = false;

  function ensureCrackSvg() {
    if (crackSvg) return crackSvg;
    email.style.position = "relative";
    crackSvg = document.createElementNS(SVGNS, "svg");
    crackSvg.setAttribute("class", "email-cracks");
    crackSvg.setAttribute("preserveAspectRatio", "none");
    crackSvg.setAttribute("aria-hidden", "true");
    email.appendChild(crackSvg);
    return crackSvg;
  }

  function addCrack() {
    var svg = ensureCrackSvg();
    var r = email.getBoundingClientRect();
    var W = r.width, H = r.height;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    // start on a random edge, walk roughly toward (and past) a random interior point
    var edge = Math.floor(Math.random() * 4), x, y;
    if (edge === 0) { x = Math.random() * W; y = 0; }
    else if (edge === 1) { x = W; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = H; }
    else { x = 0; y = Math.random() * H; }

    var tx = W * (0.3 + Math.random() * 0.4), ty = H * (0.3 + Math.random() * 0.4);
    var dx = tx - x, dy = ty - y, dist = Math.hypot(dx, dy) || 1;
    dx /= dist; dy /= dist;
    var n = 4 + Math.floor(Math.random() * 4), step = Math.max(W, H) / (n + 1);
    var pts = [[x, y]], cx = x, cy = y;
    for (var i = 0; i < n; i++) {
      cx += dx * step * (0.5 + Math.random() * 0.8) + (-dy) * (Math.random() - 0.5) * H * 0.7;
      cy += dy * step * (0.5 + Math.random() * 0.8) + (dx) * (Math.random() - 0.5) * H * 0.7;
      pts.push([cx, cy]);
    }
    var d = "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L");

    function path(stroke, w, op) {
      var p = document.createElementNS(SVGNS, "path");
      p.setAttribute("d", d); p.setAttribute("fill", "none");
      p.setAttribute("stroke", stroke); p.setAttribute("stroke-width", w);
      p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round");
      p.setAttribute("opacity", op);
      return p;
    }
    svg.appendChild(path("rgba(10,10,10,.88)", 2.4, "1"));
    svg.appendChild(path("rgba(255,255,255,.5)", 0.8, ".85"));
  }

  function shatter() {
    if (shattered) return;
    shattered = true;
    var r = email.getBoundingClientRect();
    var layer = document.createElement("div");
    layer.id = "shardLayer";
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:80;";
    document.body.appendChild(layer);

    // radial shatter from the centre -> 8 triangular shards that tile the button
    var C = [50, 50];
    var bp = [[0, 0], [50, 0], [100, 0], [100, 50], [100, 100], [50, 100], [0, 100], [0, 50]];
    for (var i = 0; i < bp.length; i++) {
      var a = bp[i], b = bp[(i + 1) % bp.length];
      var poly = "polygon(" + C[0] + "% " + C[1] + "%, " + a[0] + "% " + a[1] + "%, " + b[0] + "% " + b[1] + "%)";
      var shard = email.cloneNode(true);
      shard.removeAttribute("href");
      shard.style.cssText = "position:fixed;margin:0;left:" + r.left + "px;top:" + r.top +
        "px;width:" + r.width + "px;height:" + r.height +
        "px;clip-path:" + poly + ";-webkit-clip-path:" + poly + ";";
      layer.appendChild(shard);

      var driftX = (((a[0] + b[0]) / 2) - C[0]) / 50 * (window.innerWidth * 0.18) + (Math.random() - 0.5) * 120;
      var fall = (window.innerHeight - r.top) + 100 + Math.random() * 160;
      var rot = (Math.random() - 0.5) * 680;
      shard.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + (driftX * 0.35) + "px," + (fall * 0.22) + "px) rotate(" + (rot * 0.3) + "deg)", opacity: 1, offset: 0.3 },
        { transform: "translate(" + driftX + "px," + fall + "px) rotate(" + rot + "deg)", opacity: 0 }
      ], { duration: 1150 + Math.random() * 750, delay: i * 35, easing: "cubic-bezier(.45,.05,.6,1)", fill: "forwards" });
    }
    email.style.visibility = "hidden";
  }

  function resetEmail() {
    cracks = 0; shattered = false;
    if (crackSvg) crackSvg.textContent = "";
    if (email) email.style.visibility = "";
    var layer = document.getElementById("shardLayer");
    if (layer) layer.remove();
  }

  if (email) {
    email.addEventListener("click", function (e) {
      if (!document.body.classList.contains("lang-elv")) return; // normal mailto otherwise
      e.preventDefault();
      if (shattered) return;
      cracks++;
      addCrack();
      email.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-3px)" },
         { transform: "translateX(3px)" }, { transform: "translateX(0)" }],
        { duration: 130 });
      if (cracks >= 5) setTimeout(shatter, 110);
    });
  }

  /* =====================================================================
     3) react to language changes
     ===================================================================== */
  document.addEventListener("cybersec:lang", function (e) {
    resetEmail();
    if (e.detail && e.detail.lang === "elv") startLightning();
    else stopLightning();
  });
})();
