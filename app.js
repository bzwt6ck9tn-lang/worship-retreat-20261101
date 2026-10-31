/* 敬拜部職員退修 2026.11.01｜答案只存本裝置 localStorage */
(function () {
  "use strict";

  /* 與同一 github.io 網域下其他頁面分開 */
  var PREFIX = "worshipRetreat20261101:";
  var STORAGE_KEY = PREFIX + "answers";

  function $(id) { return document.getElementById(id); }

  function fieldEls() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-key]"));
  }

  function showToast(msg) {
    var t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function loadAnswers() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      fieldEls().forEach(function (el) {
        var key = el.getAttribute("data-key");
        if (typeof data[key] === "string") el.value = data[key];
      });
      var current = {};
      fieldEls().forEach(function (el) { current[el.getAttribute("data-key")] = true; });
      var stale = Object.keys(data).filter(function (k) { return k !== "savedAt" && !current[k]; });
      if (stale.length) {
        stale.forEach(function (k) { delete data[k]; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) { console.warn("loadAnswers failed", e); }
  }

  function collectAnswers() {
    var data = { savedAt: new Date().toISOString() };
    fieldEls().forEach(function (el) {
      data[el.getAttribute("data-key")] = el.value;
    });
    return data;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectAnswers()));
      return true;
    } catch (e) { return false; }
  }

  function saveAnswers() {
    showToast(persist() ? "已儲存到本裝置" : "儲存失敗（本機空間可能不足）");
  }

  function clearAnswers() {
    if (!confirm("確定清除本裝置上這頁的全部答案？")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    fieldEls().forEach(function (el) { el.value = ""; });
    showToast("已清除");
  }

  function initNavSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-chips a[href^='#']"));
    var heads = links.map(function (a) {
      var id = (a.getAttribute("href") || "").replace(/^#/, "");
      return id ? document.getElementById(id) : null;
    });
    var nav = document.querySelector(".nav-chips");
    var jumpLockUntil = 0;

    function navHeight() {
      return nav ? nav.getBoundingClientRect().height : 0;
    }

    function syncNavVar() {
      var h = navHeight();
      if (h > 0) document.documentElement.style.setProperty("--nav-h", h + "px");
    }

    function scrollToTarget(el, id) {
      if (!el) return;
      syncNavVar();
      var top;
      if (id === "cover") {
        top = 0;
      } else {
        top = el.getBoundingClientRect().top + window.pageYOffset - navHeight() - 10;
      }
      jumpLockUntil = Date.now() + 700;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      try { history.replaceState(null, "", "#" + id); } catch (e) { /* ignore */ }
    }

    links.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        var href = a.getAttribute("href") || "";
        if (href.charAt(0) !== "#") return;
        var id = href.slice(1);
        var el = heads[i] || document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        scrollToTarget(el, id);
        links.forEach(function (x, j) {
          x.classList.toggle("active", j === i);
          if (j === i) x.setAttribute("aria-current", "true"); else x.removeAttribute("aria-current");
        });
      });
    });

    function update() {
      if (Date.now() < jumpLockUntil) return;
      syncNavVar();
      var offset = navHeight() + 12;
      var idx = 0;
      heads.forEach(function (h, i) {
        if (h && h.getBoundingClientRect().top - offset <= 0) idx = i;
      });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) idx = heads.length - 1;
      links.forEach(function (a, i) {
        a.classList.toggle("active", i === idx);
        if (i === idx) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
      /* Keep active chip visible in horizontal scroll */
      if (links[idx] && nav) {
        var chip = links[idx];
        var left = chip.offsetLeft - 24;
        var right = chip.offsetLeft + chip.offsetWidth + 24;
        if (left < nav.scrollLeft) nav.scrollLeft = left;
        else if (right > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = right - nav.clientWidth;
      }
    }
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener("resize", function () { syncNavVar(); update(); });
    /* Rundown items jump with same sticky offset */
    Array.prototype.slice.call(document.querySelectorAll(".rundown-list a[href^='#']")).forEach(function (a) {
      a.addEventListener("click", function (e) {
        var href = a.getAttribute("href") || "";
        if (href.charAt(0) !== "#") return;
        var id = href.slice(1);
        var el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        scrollToTarget(el, id);
      });
    });

    syncNavVar();
    update();
  }

  function init() {
    loadAnswers();
    initNavSpy();

    var saveBtn = $("btn-save"), clearBtn = $("btn-clear");
    if (saveBtn) saveBtn.addEventListener("click", saveAnswers);
    if (clearBtn) clearBtn.addEventListener("click", clearAnswers);

    var timer;
    fieldEls().forEach(function (el) {
      el.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(persist, 400);
      });
      el.addEventListener("blur", persist);
      el.addEventListener("change", persist);
    });
    window.addEventListener("pagehide", persist);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
