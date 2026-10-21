/* ==========================================================================
   Portfolio · Antonio Manuel Guerra Pérez
   Un único script para todas las páginas.

   - Carruseles: cualquier elemento con [data-carousel]
   - Comparadores antes/después: cualquier elemento con [data-compare]
   - Botón Claro / Oscuro de la cabecera: elemento con [data-mode-toggle]
   - Lightbox: clic en cualquier imagen ampliable para verla en grande
   No hace falta tocar este archivo para añadir imágenes: basta con copiar
   el bloque HTML de otro carrusel o comparador.
   ========================================================================== */

(function () {
  "use strict";

  var CHEVRON_LEFT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var CHEVRON_RIGHT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  /* ---------- Carrusel ---------- */
  function initCarousel(root) {
    var viewport = root.querySelector(".carousel-viewport");
    var slides = Array.prototype.slice.call(root.querySelectorAll(".carousel-slide"));
    if (!viewport || slides.length < 2) return;

    var current = Math.max(0, slides.findIndex(function (s) {
      return s.classList.contains("is-active");
    }));

    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "carousel-btn carousel-prev";
    prev.setAttribute("aria-label", "Imagen anterior");
    prev.innerHTML = CHEVRON_LEFT;

    var next = document.createElement("button");
    next.type = "button";
    next.className = "carousel-btn carousel-next";
    next.setAttribute("aria-label", "Imagen siguiente");
    next.innerHTML = CHEVRON_RIGHT;

    viewport.appendChild(prev);
    viewport.appendChild(next);

    var bar = document.createElement("div");
    bar.className = "carousel-bar";

    var dotsWrap = document.createElement("div");
    dotsWrap.className = "carousel-dots";

    var dots = slides.map(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", "Ir a la imagen " + (i + 1));
      dot.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(dot);
      return dot;
    });

    var count = document.createElement("span");
    count.className = "carousel-count";
    count.setAttribute("aria-live", "polite");

    bar.appendChild(dotsWrap);
    bar.appendChild(count);
    root.appendChild(bar);

    root.setAttribute("role", "group");
    root.setAttribute("aria-roledescription", "carrusel");
    slides.forEach(function (slide, i) {
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "imagen");
      slide.setAttribute("aria-label", (i + 1) + " de " + slides.length);
    });

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        var active = i === current;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
        dots[i].setAttribute("aria-current", active ? "true" : "false");
      });
      count.textContent = (current + 1) + " / " + slides.length;
    }

    prev.addEventListener("click", function () { goTo(current - 1); });
    next.addEventListener("click", function () { goTo(current + 1); });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { goTo(current - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { goTo(current + 1); e.preventDefault(); }
    });

    var startX = null;
    viewport.addEventListener("touchstart", function (e) {
      startX = e.changedTouches[0].clientX;
    }, { passive: true });
    viewport.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });

    goTo(current);
  }

  /* ---------- Comparador antes / después ---------- */
  function initCompare(root) {
    var input = root.querySelector(".compare-range");
    if (!input) return;

    function update() {
      root.style.setProperty("--pos", input.value + "%");
    }

    input.addEventListener("input", update);
    update();
  }

  /* ---------- Botón Claro / Oscuro ----------
     La elección se guarda en el navegador y se mantiene en todas las páginas.
     El atributo data-mode="dark" sobre <html> lo aplica style.css.
     La clave de localStorage sigue siendo "portfolio-bw" para no perder
     la preferencia guardada de los usuarios. */
  var STORAGE_KEY = "portfolio-bw";

  function initModeToggle(btn) {
    var root = document.documentElement;

    function apply(dark) {
      if (dark) root.setAttribute("data-mode", "dark");
      else root.removeAttribute("data-mode");
      btn.setAttribute("aria-checked", dark ? "true" : "false");
      btn.setAttribute("aria-label", dark ? "Modo oscuro activo" : "Modo claro activo");
    }

    apply(root.getAttribute("data-mode") === "dark");

    btn.addEventListener("click", function () {
      var dark = root.getAttribute("data-mode") !== "dark";
      apply(dark);
      try { localStorage.setItem(STORAGE_KEY, dark ? "1" : "0"); } catch (e) { /* sin almacenamiento */ }
    });
  }

  /* ---------- Lightbox ---------- */
  function initLightbox() {
    var box = document.getElementById("lightbox");
    if (!box) return;

    var imgEl = box.querySelector(".lightbox-img");
    var btnClose = box.querySelector(".lightbox-close");
    var btnPrev = box.querySelector(".lightbox-prev");
    var btnNext = box.querySelector(".lightbox-next");

    var selectors =
      ".carousel-slide img, .tile img, .compare-img, .home-media img, .about-bg";
    var allImages = Array.prototype.slice.call(document.querySelectorAll(selectors));
    if (!allImages.length) return;

    var currentIndex = -1;
    var lastFocused = null;
    var currentGroup = [];

    function getGroup(source) {
      var carousel = source.closest("[data-carousel]");
      if (carousel) {
        return Array.prototype.slice.call(
          carousel.querySelectorAll(".carousel-slide img")
        );
      }
      var gallery = source.closest(".gallery");
      if (gallery) {
        return Array.prototype.slice.call(gallery.querySelectorAll(".tile img"));
      }
      var compare = source.closest("[data-compare]");
      if (compare) {
        return Array.prototype.slice.call(
          compare.querySelectorAll(".compare-img")
        );
      }
      return [source];
    }

    function open(index) {
      currentIndex = (index + allImages.length) % allImages.length;
      var source = allImages[currentIndex];

      imgEl.src = source.currentSrc || source.src;
      imgEl.alt = source.alt || "";

      currentGroup = getGroup(source);
      var showArrows = currentGroup.length > 1;
      btnPrev.hidden = !showArrows;
      btnNext.hidden = !showArrows;

      lastFocused = document.activeElement;
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
      btnClose.focus();
    }

    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");
      imgEl.src = "";
      currentIndex = -1;
      currentGroup = [];
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function step(dir) {
      if (currentIndex < 0) return;
      var source = allImages[currentIndex];
      var group = currentGroup.length ? currentGroup : getGroup(source);
      if (group.length < 2) return;

      var pos = group.indexOf(source);
      if (pos < 0) pos = 0;
      var nextSource = group[(pos + dir + group.length) % group.length];
      var newIndex = allImages.indexOf(nextSource);
      if (newIndex < 0) newIndex = currentIndex;
      open(newIndex);
    }

    allImages.forEach(function (img, i) {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", function (e) {
        e.preventDefault();
        open(i);
      });
    });

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { step(-1); });
    btnNext.addEventListener("click", function () { step(1); });

    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });
    imgEl.addEventListener("click", close);

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") { close(); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); }
      else if (e.key === "ArrowRight") { step(1); e.preventDefault(); }
    });
  }

  document.querySelectorAll("[data-mode-toggle]").forEach(initModeToggle);
  document.querySelectorAll("[data-carousel]").forEach(initCarousel);
  document.querySelectorAll("[data-compare]").forEach(initCompare);
  initLightbox();
})();