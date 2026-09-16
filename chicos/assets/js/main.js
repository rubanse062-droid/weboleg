
(function () {
  'use strict';
  var D = window.CHICOS || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BASE = document.body.dataset.base || '';
  var root = document.documentElement;

  root.classList.add('js');
  document.body.classList.remove('no-js');
  
  setTimeout(function () { $$('.reveal:not(.in)').forEach(function (el) { el.classList.add('in'); }); }, 2500);

  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  
  function trapFocus(container, onEscape) {
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onEscape(); return; }
      if (e.key !== 'Tab') return;
      var items = $$(FOCUSABLE, container).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKey);
    return function () { container.removeEventListener('keydown', onKey); };
  }

  
  var menu = $('#mobile-menu');
  var burger = $('[data-menu-toggle]');
  var releaseMenu = null, menuOpener = null;
  function setMenu(open) {
    if (!menu) return;
    if (open) {
      menuOpener = document.activeElement;
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('open'); });
      document.body.style.overflow = 'hidden';
      $$('.header, main, .footer').forEach(function (el) { el.setAttribute('inert', ''); });
      var first = $(FOCUSABLE, menu);
      if (first) first.focus();
      releaseMenu = trapFocus(menu, function () { setMenu(false); });
    } else {
      menu.classList.remove('open');
      document.body.style.overflow = '';
      $$('[inert]').forEach(function (el) { el.removeAttribute('inert'); });
      if (releaseMenu) { releaseMenu(); releaseMenu = null; }
      setTimeout(function () { if (!menu.classList.contains('open')) menu.hidden = true; }, 420);
      if (menuOpener && menuOpener.focus) menuOpener.focus();
    }
    if (burger) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  }
  if (burger) burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('[data-menu-close]').forEach(function (el) { el.addEventListener('click', function () { setMenu(false); }); });
  
  if (menu) menu.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"], a[href*="#"]');
    if (!a) return;
    var id = (a.getAttribute('href') || '').split('#')[1];
    setMenu(false);
    if (!id) return;
    var target = document.getElementById(id);
    if (target) {
      target.setAttribute('tabindex', '-1');
      setTimeout(function () { target.focus({ preventScroll: true }); }, 450);
    }
  });

  
  function wireTabs(list, onSelect) {
    if (!list) return null;
    var tabs = $$('[role="tab"]', list);
    function select(el, focus) {
      tabs.forEach(function (t) {
        var on = t === el;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      if (focus) el.focus();
      onSelect(el);
    }
    list.addEventListener('click', function (e) {
      var t = e.target.closest('[role="tab"]');
      if (t) select(t, false);
    });
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n === null) return;
      e.preventDefault();
      select(tabs[n], true);
    });
    return { tabs: tabs, select: select };
  }

  
  var teamTabs = $('[data-team-tabs]');
  var teamRow = $('[data-team-row]');
  var teamPanel = $('[data-team-panel]');
  if (teamTabs && teamPanel && D.barbers) {
    var renderBarber = function (b) {
      var work = b.igUrl
        ? '<a class="btn btn--ghost ig-link" href="' + esc(b.igUrl) + '" target="_blank" rel="noopener">' +
          '<svg aria-hidden="true"><use href="' + BASE + 'assets/svg/icons.svg#i-ig"/></svg>' + esc(b.workLabel) + ' · ' + esc(b.ig) + '</a>'
        : '<a class="btn btn--ghost" href="' + BASE + 'index.html#work">' + esc(b.workLabel) + '</a>';
      teamPanel.innerHTML =
        '<div class="team__fade team__head"><h3>' + esc(b.name) + '</h3><div class="team__role">' + esc(b.role) + '</div></div>' +
        '<div class="team__fade">' + (b.bio ? '<p class="team__bio">' + esc(b.bio) + '</p>' : '') +
        '<p class="team__note">' + esc(b.bookHint) + '</p><div class="team__actions">' + work +
        '<a class="btn" href="' + esc(D.links.book) + '" target="_blank" rel="noopener" data-book>Choose a Barber &amp; Book</a></div></div>';
    };
    var selectBarber = function (slug, scroll) {
      var b = D.barbers.filter(function (x) { return x.slug === slug; })[0] || D.barbers[0];
      renderBarber(b);
      $$('.portrait', teamRow).forEach(function (p) {
        p.dataset.selected = String(p.dataset.slug === b.slug);
      });
      if (scroll && window.matchMedia('(max-width: 960px)').matches) {
        var p = $('.portrait[data-slug="' + b.slug + '"]', teamRow);
        if (p) p.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
      }
    };
    wireTabs(teamTabs, function (tab) { selectBarber(tab.dataset.slug, true); });
    if (teamRow) teamRow.addEventListener('click', function (e) {
      var p = e.target.closest('.portrait');
      if (!p) return;
      var tab = $('[role="tab"][data-slug="' + p.dataset.slug + '"]', teamTabs);
      if (tab) tab.click();
    });
  }

  
  var svcTabs = $('[data-svc-tabs]');
  var svcPanels = $('[data-svc-panels]');
  if (svcTabs && svcPanels) {
    wireTabs(svcTabs, function (tab) {
      $$('[role="tabpanel"]', svcPanels).forEach(function (p) {
        var on = p.id === 'svc-panel-' + tab.dataset.id;
        p.hidden = !on;
        if (on) { p.classList.remove('team__fade'); void p.offsetWidth; p.classList.add('team__fade'); }
      });
    });
  }

  
  var gFilters = $('[data-gallery-filters]');
  var gGrid = $('[data-gallery-grid]');
  var lb = $('[data-lightbox]');
  var activeFilter = 'all';
  var lbItems = [], lbIndex = 0, lbOpener = null, releaseLb = null;

  function visibleTiles() {
    return $$('.tile', gGrid).filter(function (t) { return !t.classList.contains('is-hidden'); });
  }
  if (gFilters && gGrid) {
    gFilters.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      activeFilter = b.dataset.id;
      $$('.chip', gFilters).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $$('.tile', gGrid).forEach(function (t) {
        t.classList.toggle('is-hidden', activeFilter !== 'all' && t.dataset.tags.split(' ').indexOf(activeFilter) < 0);
      });
    });
    gGrid.addEventListener('click', function (e) {
      var t = e.target.closest('.tile');
      if (t) openLb(t);
    });
  }
  function openLb(tile) {
    if (!lb) return;
    lbItems = visibleTiles();
    lbIndex = Math.max(0, lbItems.indexOf(tile));
    lbOpener = tile;
    lb.hidden = false;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    $$('.header, main, .footer').forEach(function (el) { el.setAttribute('inert', ''); });
    renderLb();
    $('[data-lb-close]', lb).focus();
    releaseLb = trapFocus(lb, closeLb);
  }
  function renderLb() {
    var tile = lbItems[lbIndex];
    if (!tile) return;
    var img = $('img', tile);
    var out = $('[data-lb-img]', lb);
    out.src = img.getAttribute('src');
    out.alt = img.getAttribute('alt') || '';
    $('[data-lb-cap]', lb).textContent = img.getAttribute('alt') || '';
    var many = lbItems.length > 1;
    $('[data-lb-prev]', lb).hidden = !many;
    $('[data-lb-next]', lb).hidden = !many;
    var count = $('[data-lb-count]', lb);
    if (count) { count.hidden = !many; count.textContent = (lbIndex + 1) + ' of ' + lbItems.length; }
  }
  function step(d) { lbIndex = (lbIndex + d + lbItems.length) % lbItems.length; renderLb(); }
  function closeLb() {
    if (!lb) return;
    lb.classList.remove('open');
    lb.hidden = true;
    document.body.style.overflow = '';
    $$('[inert]').forEach(function (el) { el.removeAttribute('inert'); });
    if (releaseLb) { releaseLb(); releaseLb = null; }
    if (lbOpener && lbOpener.focus) lbOpener.focus();
  }
  if (lb) {
    $('[data-lb-close]', lb).addEventListener('click', closeLb);
    $('[data-lb-prev]', lb).addEventListener('click', function () { step(-1); });
    $('[data-lb-next]', lb).addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });
  }

  
  $$('[data-compare]').forEach(function (c) {
    var range = $('[data-compare-range]', c);
    var handle = $('.compare__handle', c);
    var set = function (v) { c.style.setProperty('--pos', v + '%'); };
    range.addEventListener('input', function () { set(range.value); });
    set(range.value);
    
    var dragging = false;
    var move = function (e) {
      if (!dragging) return;
      var r = c.getBoundingClientRect();
      var v = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
      range.value = v; set(v);
      e.preventDefault();
    };
    if (handle) {
      handle.addEventListener('pointerdown', function (e) { dragging = true; handle.setPointerCapture(e.pointerId); });
      handle.addEventListener('pointerup', function () { dragging = false; });
      handle.addEventListener('pointermove', move);
    }
  });

  
  var ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function shopDayIndex() {
    try {
      var name = new Intl.DateTimeFormat('en-US', {
        timeZone: (D.site && D.site.timeZone) || 'America/Los_Angeles', weekday: 'long'
      }).format(new Date());
      var i = ORDER.indexOf(name);
      if (i >= 0) return i;
    } catch (e) {  }
    return (new Date().getDay() + 6) % 7;
  }
  function markToday() {
    var i = shopDayIndex();
    $$('.hours-row').forEach(function (row, n) {
      var on = n === i;
      var bar = $('.hours-row__bar', row);
      if (bar) bar.classList.toggle('today', on);
      var tag = $('.hours-row__today', row);
      if (tag) tag.hidden = !on;
    });
    var box = $('[data-hours-today]');
    if (box && D.hours && D.hours[i]) {
      var h = D.hours[i];
      box.innerHTML = '<b>' + esc(h.day) + ': ' + esc(h.open) + ' – ' + esc(h.close) + '</b>' +
                      '<span>Pacific Time · subject to barber availability</span>';
    }
  }
  if ($('.hours-row')) {
    markToday();
    
    setInterval(markToday, 10 * 60 * 1000);
  }

  
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  
  var fab = $('.fab');
  if (fab && 'IntersectionObserver' in window) {
    var rivals = $$('.footer, .final, .post__aside, .price-box, .gallery__filters, .app__stores');
    if (rivals.length) {
      var onScreen = [];
      var io2 = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var i = onScreen.indexOf(e.target);
          if (e.isIntersecting && i < 0) onScreen.push(e.target);
          if (!e.isIntersecting && i >= 0) onScreen.splice(i, 1);
        });
        fab.classList.toggle('is-away', onScreen.length > 0);
      }, { threshold: 0 });
      rivals.forEach(function (r) { io2.observe(r); });
    }
  }

  
  var toTop = $('[data-to-top]');
  if (toTop) {
    var onScroll = function () { toTop.classList.toggle('show', window.scrollY > 700); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      var skip = $('.skip-link');
      if (skip) skip.focus();
    });
  }


  
  var AN = D.analytics || {};
  function track(action, extra) {
    if (typeof window.gtag !== 'function') return;
    var params = extra || {};
    window.gtag('event', action, params);
    var label = (AN.conversions || {})[action];
    if (AN.googleAdsId && label) {
      window.gtag('event', 'conversion', { send_to: AN.googleAdsId + '/' + label });
    }
  }
  document.addEventListener('click', function (e) {
    var el = e.target;
    var a = el && el.closest ? el.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (a.hasAttribute('data-book') || href.indexOf('book.squareup.com') > -1) {
      track('book', { link_url: href, page: location.pathname });
    } else if (href.indexOf('tel:') === 0) {
      track('call', { page: location.pathname });
    } else if (href.indexOf('google.com/maps') > -1) {
      track('directions', { page: location.pathname });
    }
  }, true);

  
  var map = $('.map');
  if (map && D.business && D.business.mapEmbed && !map.classList.contains('map--static')) {
    var frame = document.createElement('iframe');
    frame.title = 'Map: ' + D.business.name + ', ' + D.business.address1;
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.allowFullscreen = true;
    frame.src = D.business.mapEmbed;
    frame.addEventListener('load', function () { map.classList.add('map--loaded'); });
    map.appendChild(frame);
  }
})();
