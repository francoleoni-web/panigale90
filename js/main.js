(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var grab = function (u) { return fetch(u, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };

  var saved = localStorage.getItem("lang");
  var LANG = (saved === "en" || saved === "it") ? saved
    : ((navigator.language || "it").toLowerCase().indexOf("it") === 0 ? "it" : "en");

  var I18N = {
    months: {
      it: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
      en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    },
    weekdays: { it: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"], en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    noSel: { it: "Nessuna data selezionata", en: "No dates selected" },
    checkin: { it: "Check-in: %s — scegli il check-out", en: "Check-in: %s — choose check-out" },
    range: { it: "Dal %s al %s · %d %u", en: "From %s to %s · %d %u" },
    night: { it: ["notte", "notti"], en: ["night", "nights"] },
    reviewsWord: { it: "recensioni", en: "reviews" },
    title: { it: "Panigale 90 — Appartamento a Bologna | Borgo Panigale", en: "Panigale 90 — Apartment in Bologna | Borgo Panigale" },
    reqSubject: { it: "Richiesta soggiorno Panigale 90", en: "Booking request — Panigale 90" },
    reqLabels: { it: ["Nome", "Email", "Check-in", "Check-out", "Ospiti", "Messaggio"], en: ["Name", "Email", "Check-in", "Check-out", "Guests", "Message"] },
    reqSent: { it: "Si aprirà il tuo programma di posta con la richiesta precompilata.", en: "Your email app will open with the request pre-filled." }
  };

  Promise.all([
    grab("availability.json"), grab("gallery.json"), grab("about.json"), grab("amenities.json"),
    grab("reviews.json"), grab("location.json"), grab("host.json"), grab("hero.json"), grab("book.json")
  ]).then(function (d) {
    boot({
      avail: d[0] || { booked: [], contactEmail: "" }, gallery: d[1] || {}, about: d[2] || {},
      amenities: d[3] || {}, reviews: d[4] || {}, location: d[5] || {}, host: d[6] || {}, hero: d[7] || {}, book: d[8] || {}
    });
  });

  function boot(D) {
  /* ---------- HELPERS ---------- */
  var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
  var ymd = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var parseD = function (s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var EN = function () { return LANG === "en"; };
  function pick(o, k) { if (!o) return ""; return (EN() && o[k + "_en"]) ? o[k + "_en"] : (o[k] || ""); }
  function esc(t) { return (t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function bold(s) { return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>"); }
  function mdLite(s) {
    return (s || "").split(/\n{2,}/).map(function (par) {
      var h = bold(par.trim()).replace(/\n/g, "<br>");
      return h ? "<p>" + h + "</p>" : "";
    }).join("");
  }
  function setText(id, t) { var el = $("#" + id); if (el) el.textContent = t; }
  function setHtml(id, t) { var el = $("#" + id); if (el) el.innerHTML = t; }

  /* ---------- AVAILABILITY ---------- */
  var cfg = D.avail;
  var busy = {};
  (cfg.booked || []).forEach(function (r) {
    var d = parseD(r.from), end = parseD(r.to);
    while (d <= end) { busy[ymd(d)] = true; d = new Date(d.getTime() + 86400000); }
  });
  var isBusy = function (d) { return !!busy[ymd(d)]; };
  var isPast = function (d) { return d < today; };

  /* ---------- PHOTOS ---------- */
  var PHOTOS = ((D.gallery && D.gallery.photos) || []).map(function (p, i) {
    return { src: p.image, cap_it: p.caption || "", cap_en: p.caption_en || p.caption || "", cls: i === 0 ? "g-big" : "" };
  });
  function cap(i) { return PHOTOS[i] ? (EN() ? PHOTOS[i].cap_en : PHOTOS[i].cap_it) : ""; }

  /* ---------- STATIC STRINGS (data-en) ---------- */
  function applyStatic() {
    $$("[data-en]").forEach(function (el) {
      if (el.getAttribute("data-it") === null) el.setAttribute("data-it", el.innerHTML);
      el.innerHTML = EN() ? el.getAttribute("data-en") : el.getAttribute("data-it");
    });
    $$("[data-en-ph]").forEach(function (el) {
      if (el.getAttribute("data-it-ph") === null) el.setAttribute("data-it-ph", el.placeholder || "");
      el.placeholder = EN() ? el.getAttribute("data-en-ph") : el.getAttribute("data-it-ph");
    });
  }

  /* ---------- HERO ---------- */
  function renderHero() {
    var h = D.hero, r = D.reviews;
    setText("heroEyebrow", h.eyebrow || "");
    setText("heroTagline", pick(h, "tagline"));
    setText("heroCta1", pick(h, "ctaPrimary"));
    setText("heroCta2", pick(h, "ctaSecondary"));
    var meta = "";
    if (r && r.score) meta += '<span class="bk-badge"><b>' + esc(r.score) + '</b> Booking.com</span>';
    if (r && r.count) meta += '<span>' + esc(r.count) + ' ' + I18N.reviewsWord[LANG] + '</span>';
    meta += '<span class="dot">•</span><span>' + esc(pick(h, "type")) + '</span>';
    meta += '<span class="dot">•</span><span>' + esc(pick(h, "guests")) + '</span>';
    setHtml("heroMeta", meta);
    var fg = $("#factsGrid");
    if (fg) {
      fg.innerHTML = "";
      (h.facts || []).forEach(function (f) {
        var d = document.createElement("div"); d.className = "fact";
        d.innerHTML = '<span class="fact__num">' + esc(f.num) + '</span><span class="fact__label">' + esc(EN() ? f.label_en : f.label) + '</span>';
        fg.appendChild(d);
      });
    }
  }

  /* ---------- GALLERY ---------- */
  var grid = $("#galleryGrid");
  function renderGallery() {
    setText("galleryTitle", pick(D.gallery, "title"));
    setText("gallerySub", pick(D.gallery, "sub"));
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

  /* ---------- ABOUT + HOST CARD ---------- */
  function renderAbout() {
    var box = $(".about__text"), a = D.about;
    if (box && a) {
      var html = '<h2 class="section__title">' + esc(pick(a, "title") || "L'alloggio") + "</h2>";
      html += mdLite(pick(a, "intro"));
      (a.sections || []).forEach(function (s) {
        var hd = pick(s, "heading"); if (hd) html += "<h3>" + esc(hd) + "</h3>";
        html += mdLite(pick(s, "body"));
      });
      box.innerHTML = html;
    }
    var ho = D.host, r = D.reviews;
    setHtml("hostLine", bold(pick(ho, "hostLine")));
    setText("hostCta", pick(ho, "cta"));
    var rows = $("#hostRows");
    if (rows) {
      rows.innerHTML = "";
      (ho.rows || []).forEach(function (row) {
        var li = document.createElement("li");
        li.innerHTML = "<span>" + esc(EN() ? row.label_en : row.label) + "</span><strong>" + esc(EN() ? (row.value_en || row.value) : row.value) + "</strong>";
        rows.appendChild(li);
      });
      if (r && r.score) {
        var li2 = document.createElement("li");
        li2.innerHTML = "<span>Booking.com</span><strong>" + esc(r.score) + "/10 (" + esc(r.count) + ")</strong>";
        rows.appendChild(li2);
      }
    }
  }

  /* ---------- AMENITIES ---------- */
  function renderAmenities() {
    setText("amenTitle", pick(D.amenities, "title"));
    setText("amenSub", pick(D.amenities, "sub"));
    var aGrid = $("#amenitiesGrid");
    if (!aGrid) return;
    aGrid.innerHTML = "";
    ((D.amenities && D.amenities.items) || []).filter(function (a) { return a.on; }).forEach(function (a) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="ic">' + (a.icon || "•") + '</span><span>' + esc(EN() ? (a.label_en || a.label) : a.label) + "</span>";
      aGrid.appendChild(li);
    });
  }

  /* ---------- REVIEWS ---------- */
  function renderReviews() {
    var r = D.reviews, sec = $("#reviews");
    if (!r || r.show === false) { if (sec) sec.style.display = "none"; return; }
    if (sec) sec.style.display = "";
    setText("revTitle", pick(r, "title"));
    setText("revSub", pick(r, "sub"));
    setText("revScore", r.score || "");
    setHtml("revLabel", "<strong>" + esc(EN() ? (r.scoreLabel_en || r.scoreLabel) : r.scoreLabel) + "</strong><br />" +
      esc(r.count) + " " + I18N.reviewsWord[LANG] + " · " + esc(EN() ? (r.tagline_en || r.tagline) : r.tagline));
    var a = $("#revUrl"); if (a) { a.href = r.url || "#"; a.textContent = (EN() ? "Read on Booking.com ↗" : "Leggi su Booking.com ↗"); }
    var bars = $("#revBars");
    if (bars) {
      bars.innerHTML = "";
      (r.subscores || []).forEach(function (s) {
        var w = Math.max(0, Math.min(100, (parseFloat((s.value || "0").replace(",", ".")) || 0) * 10));
        var li = document.createElement("li");
        li.innerHTML = "<span>" + esc(EN() ? (s.label_en || s.label) : s.label) + '</span><i><b style="width:' + w + '%"></b></i><em>' + esc(s.value) + "</em>";
        bars.appendChild(li);
      });
    }
  }

  /* ---------- LOCATION ---------- */
  function renderLocation() {
    setText("locTitle", pick(D.location, "title"));
    setText("locSub", pick(D.location, "sub"));
    setText("locMaplink", pick(D.location, "maplink"));
    var list = $("#locList");
    if (list) {
      list.innerHTML = "";
      ((D.location && D.location.points) || []).forEach(function (p) {
        var li = document.createElement("li");
        li.innerHTML = bold(EN() ? (p.text_en || p.text) : p.text);
        list.appendChild(li);
      });
    }
  }

  /* ---------- BOOK + CONTACTS ---------- */
  function renderBook() {
    var b = D.book;
    setText("bookTitle", pick(b, "title"));
    setText("bookIntro", pick(b, "intro"));
    var wa = $("#cWa"); if (wa && b.whatsappIntl) { wa.href = "https://wa.me/" + b.whatsappIntl; wa.textContent = "WhatsApp " + (b.phoneDisplay || ""); }
    var call = $("#cCall"); if (call && b.phoneIntl) call.href = "tel:" + b.phoneIntl;
    var em = $("#cEmail"); if (em && b.email) em.href = "mailto:" + b.email;
    var fwa = $("#fWa"); if (fwa && b.whatsappIntl) fwa.href = "https://wa.me/" + b.whatsappIntl;
    var fph = $("#fPhone"); if (fph) { fph.href = "tel:" + (b.phoneIntl || ""); fph.textContent = b.phoneDisplay || ""; }
    var fem = $("#fEmail"); if (fem && b.email) fem.href = "mailto:" + b.email;
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
  function renderCal() {
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
    } else if (selStart) { sel.textContent = I18N.checkin[LANG].replace("%s", fmt(selStart)); }
    else { sel.textContent = I18N.noSel[LANG]; }
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
      renderCal();
    });
    $("#calPrev").addEventListener("click", function () {
      var m = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      var floor = new Date(today.getFullYear(), today.getMonth(), 1);
      if (m >= floor) { view = m; renderCal(); }
    });
    $("#calNext").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });
  }

  /* ---------- FORM ---------- */
  var form = $("#bookForm");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, L = I18N.reqLabels[LANG];
    var body = L[0] + ": " + f.name.value + "\n" + L[1] + ": " + f.email.value + "\n" +
      L[2] + ": " + (f.checkin.value || "—") + "\n" + L[3] + ": " + (f.checkout.value || "—") + "\n" +
      L[4] + ": " + f.guests.value + "\n\n" + L[5] + ":\n" + (f.message.value || "—");
    window.location.href = "mailto:" + (D.book.email || cfg.contactEmail || "") +
      "?subject=" + encodeURIComponent(I18N.reqSubject[LANG]) + "&body=" + encodeURIComponent(body);
    if ($("#bookNote")) $("#bookNote").textContent = I18N.reqSent[LANG];
  });

  /* ---------- LANGUAGE ---------- */
  function applyLang() {
    document.documentElement.lang = LANG;
    document.title = I18N.title[LANG];
    var tg = $("#langToggle"); if (tg) tg.textContent = EN() ? "IT" : "EN";
    applyStatic();
    renderHero(); renderGallery(); renderAbout(); renderAmenities();
    renderReviews(); renderLocation(); renderBook(); renderCal();
  }
  var toggle = $("#langToggle");
  if (toggle) toggle.addEventListener("click", function () {
    LANG = EN() ? "it" : "en";
    localStorage.setItem("lang", LANG);
    applyLang();
  });

  applyLang();
  if ($("#year")) $("#year").textContent = new Date().getFullYear();
  } // end boot
})();
