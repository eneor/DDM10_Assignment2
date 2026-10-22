/* ============================================================
   ACF — Abdallah Consultancy Firm · main.js
   jQuery: navigation, theme, slider, AJAX articles
   Vanilla JS: scroll reveal, counters, form validation
   ============================================================ */
$(function () {
  "use strict";

  /* ---------- 1. Active nav link ---------- */
  const page = location.pathname.split("/").pop() || "index.html";
  const map = { "index.html": "home", "about.html": "about", "expertise.html": "expertise", "articles.html": "articles", "contact.html": "contact" };
  $(`.nav-menu a[data-nav="${map[page] || "home"}"]`).attr("aria-current", "page");

  /* ---------- 2. Mobile menu ---------- */
  const $toggle = $("#navToggle"), $menu = $("#navMenu");
  $toggle.on("click", function () {
    const open = $menu.toggleClass("open").hasClass("open");
    $(this).attr("aria-expanded", open);
  });
  $menu.on("click", "a", function () {
    $menu.removeClass("open");
    $toggle.attr("aria-expanded", "false");
  });
  $(document).on("keydown", function (e) {
    if (e.key === "Escape" && $menu.hasClass("open")) {
      $menu.removeClass("open");
      $toggle.attr("aria-expanded", "false").trigger("focus");
    }
  });

  /* ---------- 3. Sticky header + back-to-top ---------- */
  const $top = $("#backToTop");
  $(window).on("scroll", function () {
    $("#siteHeader").toggleClass("scrolled", window.scrollY > 12);
    $top.toggleClass("visible", window.scrollY > 480);
  });
  $top.on("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- 4. Dark / light toggle (persisted) ---------- */
  const saved = localStorage.getItem("acf-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  $("#themeToggle").on("click", function () {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("acf-theme", next);
  });

  /* ---------- 5. Testimonial slider (auto + dots) ---------- */
  const $slides = $(".slide"), $dotsWrap = $(".slider-dots");
  if ($slides.length) {
    let idx = 0, timer;
    $slides.each(function (i) {
      const $b = $("<button>", { "aria-label": `Testimonial ${i + 1}`, "aria-selected": i === 0 }).appendTo($dotsWrap);
      if (i === 0) $b.attr("aria-selected", "true");
    });
    const show = (n) => {
      idx = (n + $slides.length) % $slides.length;
      $slides.removeClass("active").eq(idx).addClass("active");
      $dotsWrap.children().attr("aria-selected", "false").eq(idx).attr("aria-selected", "true");
    };
    const auto = () => { timer = setInterval(() => show(idx + 1), 5500); };
    $dotsWrap.on("click", "button", function () { clearInterval(timer); show($(this).index()); auto(); });
    auto();
  }

  /* ---------- 6. FAQ (accordion markup injected by pages that need it) ---------- */
  $(document).on("click", ".faq-q", function () {
    const open = $(this).attr("aria-expanded") === "true";
    $(".faq-q").attr("aria-expanded", "false");
    $(".faq-a").attr("hidden", true);
    if (!open) { $(this).attr("aria-expanded", "true"); $(this).next(".faq-a").removeAttr("hidden"); }
  });

  /* ---------- 7. AJAX: load articles from JSON (extensible) ---------- */
  const $grid = $("#articlesGrid");
  if ($grid.length) {
    $.ajax({
      url: "js/articles-data.json",
      dataType: "json",
      timeout: 8000,
    }).done(function (articles) {
      $grid.empty();
      articles.forEach(function (a) {
        $(`<article class="card reveal visible">
             <span class="tag"></span>
             <h3></h3>
             <p class="excerpt"></p>
             <p><time datetime=""></time> &middot; <span class="read"></span></p>
             <a href="contact.html" aria-label="Enquire about this topic">Enquire &rarr;</a>
           </article>`)
          .find(".tag").text(a.category).end()
          .find("h3").text(a.title).end()
          .find(".excerpt").text(a.excerpt).end()
          .find("time").attr("datetime", a.date).text(new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })).end()
          .find(".read").text(a.read).end()
          .appendTo($grid);
      });
    }).fail(function () {
      $grid.html('<p class="placeholder-note">Articles could not be loaded. Please check that <code>js/articles-data.json</code> is present and open the site through a local server (e.g. VS Code Live Server).</p>');
    });
  }
});

/* ---------- Vanilla JS below (no jQuery dependency) ---------- */
(function () {
  "use strict";

  /* ---------- 8. Scroll-reveal animations ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- 9. Animated counters ---------- */
  const counters = document.querySelectorAll(".counter");
  if (counters.length && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target, target = +el.dataset.target, dur = 1600, t0 = performance.now();
        const step = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- 10. Contact form validation (no backend) ---------- */
  const form = document.getElementById("contactForm");
  if (!form) return;

  // Pre-select practice area from ?area=... links on the Expertise page
  const params = new URLSearchParams(location.search);
  if (params.get("area")) {
    const sel = document.getElementById("practiceArea");
    [...sel.options].forEach((o) => { if (o.text === params.get("area")) sel.value = o.value || o.text; });
  }

  const setErr = (id, msg) => {
    const field = document.getElementById(id);
    const wrap = field.closest(".form-group");
    document.getElementById("err-" + id).textContent = msg || "";
    wrap.classList.toggle("invalid", !!msg);
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  };

  const validators = {
    fullName: (v) => (v.trim().length >= 2 ? "" : "Please enter your full name."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email address, e.g. name@example.com."),
    phone: (v) => (/^[+\d][\d\s\-()]{6,19}$/.test(v.trim()) ? "" : "Please enter a valid phone number (digits, spaces, +, -)."),
    practiceArea: (v) => (v ? "" : "Please choose a practice area."),
    message: (v) => (v.trim().length >= 10 ? "" : "Please tell us a little more (at least 10 characters)."),
    consent: () => (document.getElementById("consent").checked ? "" : "Please tick the consent box so we can reply to you."),
  };

  Object.keys(validators).forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("blur", () => setErr(id, validators[id](el.type === "checkbox" ? el.checked : el.value)));
    el.addEventListener("input", () => {
      if (el.closest(".form-group").classList.contains("invalid")) setErr(id, validators[id](el.type === "checkbox" ? el.checked : el.value));
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true, firstBad = null;
    Object.keys(validators).forEach((id) => {
      const el = document.getElementById(id);
      const valid = setErr(id, validators[id](el.type === "checkbox" ? el.checked : el.value));
      if (!valid) { ok = false; firstBad = firstBad || el; }
    });
    const success = document.getElementById("successMsg");
    if (ok) {
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });
      form.reset();
      setTimeout(() => { success.hidden = true; }, 9000);
    } else {
      success.hidden = true;
      firstBad.focus();
    }
  });
})();
