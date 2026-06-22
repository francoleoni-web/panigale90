(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var grab = function (u) { return fetch(u, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };

  // Lingua: salvata, altrimenti dedotta dal browser (default italiano).
  var saved = localStorage.getItem("lang");
  var LANG = (saved === "en" || saved === "it") ? saved
    : ((navigator.language || "it").toLowerCase().indexOf("it") === 0 ? "it" : "en");

  var I18N = {
    months: {
      it: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
      en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    },
    weekdays: {
      it: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
      en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    },
    noSel: { it: "Nessuna data selezionata", en: "No dates selected" },
    checkin: { it: "Check-in: %s — scegli il check-out", en: "Check-in: %s — choose check-out" },
    range: { it: "Dal %s al %s · %d %u", en: "From %s to %s · %d %u" },
    night: { it: ["notte", "notti"], en: ["night", "nights"] },
    title: { it: "Panigale 90 — Appartamento a Bologna | Borgo Panigale", en: "Panigale 90 — Apartment in Bologna | Borgo Panigale" },
    reqSubject: { it: "Richiesta soggiorno Panigale 90", en: "Booking request — Panigale 90" },
    reqLabels: { it: ["Nome", "Email", "Check-in", "Check-out", "Ospiti", "Messaggio"], en: ["Name", "Email", "Check-in", "Check-out", "Guests", "Message"] },
    reqSent: { it: "Si aprirà il tuo programma di posta con la richiesta precompilata.", en: "Your email app will open with the request pre-filled." }
  };

  Promise.all([grab("availability.json"), grab("gallery.json"), grab("about.json")]).then(function (res) {
    boot(res[0] || window.PANIGALE_AVAILABILITY || { booked: [], contactEmail: "" }, (res[1] && res[1].photos) || [], res[2]);
  });

  function boot(cfg, galleryPhotos, about) {
  /* ---------- DATA ---------- */
  var PHOTOS = (galleryPhotos || []).map(function (p, i) {
    return { src: p.image, cap_it: p.caption || "", cap_en: p.caption_en || p.caption || "", cls: i === 0 ? "g-big" : "" };
  });
  function cap(i) { return PHOTOS[i] ? (LANG === "en" ? PHOTOS[i].cap_en : PHOTOS[i].cap_it) : ""; }

  var AMENITIES = [
    { ic: "🅿️", it: "Parcheggio gratuito nel giardino", en: "Free parking in the garden" },
    { ic: "📶", it: "Wi-Fi", en: "Wi-Fi" },
    { ic: "🍳", it: "Angolo cottura attrezzato", en: "Equipped kitchenette" },
    { ic: "🧺", it: "Lavatrice", en: "Washing machine" },
    { ic: "🚪", it: "Ingresso indipendente", en: "Private entrance" },
    { ic: "🌳", it: "Giardino condominiale", en: "Shared garden" },
    { ic: "☕", it: "Area di ristoro comune", en: "Shared seating area" },
    { ic: "🏠", it: "Piano terra", en: "Ground floor" },
    { ic: "🧥", it: "Stenditoio per soggiorni lunghi", en: "Drying rack for longer stays" }
  ];

  /* ---------- HELPERS ---------- */
  var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
  var ymd = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var parseD = function (s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var today = new Date(); today.setHours(0, 0, 0, 0);

  var busy = {};
  (cfg.booked || []).forEach(function (r) {
    var d = parseD(r.from), end = parseD(r.to);
    while (d <= end) { busy[ymd(d)] = true; d = new Date(d.getTime() + 86400000); }
  });
  var isBusy = function (d) { return !!busy[ymd(d)]; };
  var isPast = function (d) { return d < today; };

  function esc(t) { return (t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function mdLite(s) {
    return (s || "").split(/\n{2,}/).map(function (par) {
      var h = esc(par.trim());
      h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      h = h.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      h = h.replace(/_([^_]+)_/g, "<em>$1</em>");
      h = h.replace(/\n/g, "<br>");
      return h ? "<p>" + h + "</p>" : "";
    }).join("");
  }
  function pick(o, k) { return (LANG === "en" && o[k + "_en"]) ? o[k + "_en"] : o[k]; }

  /* ---------- STATIC STRINGS (data-en) ---------- */
  function applyStatic() {
    $$("[data-en]").forEach(function (el) {
      if (el.getAttribute("data-it") === null) el.setAttribute("data-it", el.innerHTML);
      el.innerHTML = (LANG === "en") ? el.getAttribute("data-en") : el.getAttribute("data-it");
    });
    $$("[data-en-ph]").forEach(function (el) {
      if (el.getAttribute("data-it-ph") === null) el.setAttribute("data-it-ph", el.placeholder || "");
      el.placeholder = (LANG === "en") ? el.getAttribute("data-en-ph") : el.getAttribute("data-it-ph");
    });
  }

  /* ---------- HERO + GALLERY ---------- */
  var grid = $("#galleryGrid");
  function buildGallery() {
    var heroImg = $("#heroImg");
    if (heroImg && PHOTOS[0]) { heroImg.src = PHOTOS[0].src; if (cap(0)) heroImg.alt = cap(0); }
    if (!grid) return;
    grid.innerHTML = "";
    PHOTOS.forEach(function (p, i) {
      var fig = document.createElement("figure");
      if (p.cls) fig.className = p.cls;
      fig.dataset.index = i;
      var img = document.createElement("img");
      img.src = p.src; img.alt = cap(i); img.loading = "lazy";
      fig.appendChild(img);
      grid.appendChild(fig);
    });
  }

  /* ---------- LIGHTBOX ---------- */
  var lb = $("#lightbox"), lbImg = $("#lbImg"), cur = 0;
  function openLb(i) { cur = i; lbImg.src = PHOTOS[i].src; lbImg.alt = cap(i); lb.hidden = false; document.body.style.overflow = "hidden"; }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ""; }
  function stepLb(n) { cur = (cur + n + PHOTOS.length) % PHOTOS.length; lbImg.src = PHOTOS[cur].src; lbImg.alt = cap(cur); }
  if (grid && lb) {
    grid.addEventListener("click", function (e) { var f = e.target.closest("figure"); if (f) openLb(+f.dataset.index); });
    $("#lbClose").addEventListener("click", closeLb);
    $("#lbPrev").addEventListener("click", function () { stepLb(-1); });
    $("#lbNext").addEventListener("click", function () { stepLb(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") stepLb(-1);
      if (e.key === "ArrowRight") stepLb(1);
    });
  }

  /* ---------- ABOUT ---------- */
  function renderAbout() {
    var box = $(".about__text");
    if (!box || !about) return;
    var html = '<h2 class="section__title">' + esc(pick(about, "title") || "L'alloggio") + "</h2>";
    html += mdLite(pick(about, "intro"));
    (about.sections || []).forEach(function (s) {
      var h = pick(s, "heading");
      if (h) html += "<h3>" + esc(h) + "</h3>";
      html += mdLite(pick(s, "body"));
    });
    box.innerHTML = html;
  }

  /* ---------- AMENITIES ---------- */
  function buildAmenities() {
    var aGrid = $("#amenitiesGrid");
    if (!aGrid) return;
    aGrid.innerHTML = "";
    AMENITIES.forEach(function (a) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="ic">' + a.ic + '</span><span>' + (LANG === "en" ? a.en : a.it) + "</span>";
      aGrid.appendChild(li);
    });
  }

  /* ---------- CALENDAR ---------- */
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var selStart = null, selEnd = null;
  function MO() { return I18N.months[LANG]; }
  function WD() { return I18N.weekdays[LANG]; }

  function buildMonth(base) {
    var wrap = document.createElement("div"); wrap.className = "cal-grid";
    var week = document.createElement("div"); week.className = "cal-week";
    WD().forEach(function (w) { var s = document.createElement("span"); s.textContent = w; week.appendChild(s); });
    wrap.appendChild(week);
    var days = document.createElement("div"); days.className = "cal-days";
    var first = new Date(base.getFullYear(), base.getMonth(), 1);
    var startDow = (first.getDay() + 6) % 7;
    var total = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    for (var i = 0; i < startDow; i++) { var e = document.createElement("div"); e.className = "cal-day empty"; days.appendChild(e); }
    for (var dnum = 1; dnum <= total; dnum++) {
      var d = new Date(base.getFullYear(), base.getMonth(), dnum);
      var cell = document.createElement("div"); cell.className = "cal-day"; cell.textContent = dnum;
      var ds = ymd(d);
      if (isPast(d)) cell.classList.add("past");
      else if (isBusy(d)) cell.classList.add("busy");
      else {
        cell.classList.add("free"); cell.dataset.date = ds;
        if (selStart && ds === selStart) cell.classList.add("sel");
        if (selEnd && ds === selEnd) cell.classList.add("sel");
        if (selStart && selEnd && ds > selStart && ds < selEnd) cell.classList.add("inrange");
      }
      days.appendChild(cell);
    }
    wrap.appendChild(days); return wrap;
  }
  function rangeHasBusy(a, b) {
    var d = parseD(a), end = parseD(b);
    while (d < end) { if (isBusy(d)) return true; d = new Date(d.getTime() + 86400000); }
    return false;
  }
  function fmt(s) { var d = parseD(s); return d.getDate() + " " + MO()[d.getMonth()].slice(0, 3).toLowerCase() + " " + d.getFullYear(); }
  function render() {
    if (!$("#calGrids")) return;
    var m2 = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    $("#calMonths").innerHTML = "<span>" + MO()[view.getMonth()] + " " + view.getFullYear() +
      "</span><span>" + MO()[m2.getMonth()] + " " + m2.getFullYear() + "</span>";
    var grids = $("#calGrids"); grids.innerHTML = "";
    grids.appendChild(buildMonth(view)); grids.appendChild(buildMonth(m2));
    var sel = $("#calSelection");
    if (selStart && selEnd) {
      var n = Math.round((parseD(selEnd) - parseD(selStart)) / 86400000);
      var u = I18N.night[LANG][n === 1 ? 0 : 1];
      sel.textContent = I18N.range[LANG].replace("%s", fmt(selStart)).replace("%s", fmt(selEnd)).replace("%d", n).replace("%u", u);
    } else if (selStart) {
      sel.textContent = I18N.checkin[LANG].replace("%s", fmt(selStart));
    } else {
      sel.textContent = I18N.noSel[LANG];
    }
  }
  if ($("#calGrids")) {
    $("#calGrids").addEventListener("click", function (e) {
      var cell = e.target.closest(".cal-day.free");
      if (!cell || !cell.dataset.date) return;
      var ds = cell.dataset.date;
      if (!selStart || (selStart && selEnd)) { selStart = ds; selEnd = null; }
      else if (ds <= selStart) { selStart = ds; selEnd = null; }
      else if (rangeHasBusy(selStart, ds)) { selStart = ds; selEnd = null; }
      else { selEnd = ds; }
      if (selStart) { var i = $("#fIn"); if (i) i.value = selStart; }
      if (selEnd) { var o = $("#fOut"); if (o) o.value = selEnd; }
      render();
    });
    $("#calPrev").addEventListener("click", function () {
      var m = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      var floor = new Date(today.getFullYear(), today.getMonth(), 1);
      if (m >= floor) { view = m; render(); }
    });
    $("#calNext").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
  }

  /* ---------- FORM (mailto) ---------- */
  var form = $("#bookForm");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, L = I18N.reqLabels[LANG];
    var body = L[0] + ": " + f.name.value + "\n" + L[1] + ": " + f.email.value + "\n" +
      L[2] + ": " + (f.checkin.value || "—") + "\n" + L[3] + ": " + (f.checkout.value || "—") + "\n" +
      L[4] + ": " + f.guests.value + "\n\n" + L[5] + ":\n" + (f.message.value || "—");
    window.location.href = "mailto:" + (cfg.contactEmail || "") +
      "?subject=" + encodeURIComponent(I18N.reqSubject[LANG]) + "&body=" + encodeURIComponent(body);
    if ($("#bookNote")) $("#bookNote").textContent = I18N.reqSent[LANG];
  });

  /* ---------- LANGUAGE ---------- */
  function applyLang() {
    document.documentElement.lang = LANG;
    document.title = I18N.title[LANG];
    var tg = $("#langToggle"); if (tg) tg.textContent = (LANG === "it") ? "EN" : "IT";
    applyStatic();
    buildGallery();
    buildAmenities();
    renderAbout();
    render();
  }
  var toggle = $("#langToggle");
  if (toggle) toggle.addEventListener("click", function () {
    LANG = (LANG === "it") ? "en" : "it";
    localStorage.setItem("lang", LANG);
    applyLang();
  });

  applyLang();
  if ($("#year")) $("#year").textContent = new Date().getFullYear();
  } // end boot
})();
