/* Sablier Theme – Interaktionen & Animationen */
(() => {
  window.__themeReady = true;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const T = window.theme || { routes: {}, strings: {}, settings: {} };
  const S = T.settings || {};
  const STR = T.strings || {};
  const html = document.documentElement;
  const rmQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => S.respectReducedMotion && rmQuery.matches;
  const designMode = !!(window.Shopify && window.Shopify.designMode);
  const restartAnim = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* ---------- Geld formatieren (Shopify money_format) ---------- */
  function formatMoney(cents) {
    const fmt = T.moneyFormat || '${{amount}}';
    const m = fmt.match(/\{\{\s*(\w+)\s*\}\}/);
    const type = m ? m[1] : 'amount';
    const fx = (n, d, ts, ds) => {
      const p = (n / 100).toFixed(d).split('.');
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ts);
      return p.join(ds);
    };
    const map = {
      amount: fx(cents, 2, ',', '.'),
      amount_no_decimals: fx(cents, 0, ',', '.'),
      amount_with_comma_separator: fx(cents, 2, '.', ','),
      amount_no_decimals_with_comma_separator: fx(cents, 0, '.', ','),
      amount_with_apostrophe_separator: fx(cents, 2, "'", '.'),
      amount_with_space_separator: fx(cents, 2, ' ', ','),
      amount_no_decimals_with_space_separator: fx(cents, 0, ' ', ','),
      amount_with_period_and_space_separator: fx(cents, 2, ' ', '.')
    };
    return fmt.replace(/\{\{\s*\w+\s*\}\}/, map[type] ?? map.amount);
  }

  function toast(msg) {
    const t = $('#Toast');
    if (!t) return;
    t.hidden = true;
    void t.offsetWidth;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (t.hidden = true), 3200);
  }

  /* =========================================================
     EBENEN: Menü, Warenkorb, Suche, Lightbox
     ========================================================= */
  if (!designMode) ['mnav'].forEach(id => { const el = document.getElementById(id); if (el && el.parentElement !== document.body) document.body.appendChild(el); });
  const anyOpen = () => $$('.layer').some(l => !l.hidden && !l.classList.contains('closing'));
  const lastFocus = {};
  const focusables = el => $$('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])', el).filter(x => x.offsetParent !== null);
  function setExpanded(id, open) { $$(`[aria-controls="${id}"]`).forEach(b => b.setAttribute('aria-expanded', open)); }
  function openLayer(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.hidden && !el.classList.contains('closing')) return;
    clearTimeout(el._t);
    lastFocus[id] = document.activeElement;
    el.classList.remove('closing', 'live');
    el.hidden = false;
    html.style.overflow = 'hidden';
    $('.section-header')?.classList.remove('is-hidden-up');
    setExpanded(id, true);
    el._t = setTimeout(() => el.classList.add('live'), 900);
    const target = id === 'search' ? $('#SearchInput') : focusables(el)[0];
    setTimeout(() => target?.focus({ preventScroll: true }), 60);
    document.dispatchEvent(new CustomEvent('layer:open', { detail: { id } }));
  }
  function closeLayer(id) {
    const el = document.getElementById(id);
    if (!el || el.hidden || el.classList.contains('closing')) return;
    el.classList.add('closing');
    clearTimeout(el._t);
    setExpanded(id, false);
    el._t = setTimeout(() => {
      el.hidden = true;
      el.classList.remove('closing', 'live');
      if (!anyOpen()) html.style.overflow = '';
      lastFocus[id]?.focus?.({ preventScroll: true });
    }, calm() ? 0 : 420);
  }
  window.theme.openLayer = openLayer;
  window.theme.closeLayer = closeLayer;
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o && document.getElementById(o.dataset.open)) {
      e.preventDefault();
      const fromLayer = o.closest('.layer');
      if (fromLayer && fromLayer.id !== o.dataset.open) closeLayer(fromLayer.id);
      openLayer(o.dataset.open);
      return;
    }
    const c = e.target.closest('[data-close]');
    if (c) { e.preventDefault(); closeLayer(c.dataset.close); }
  });
  /* Links im Handy-Menü schließen das Menü (wichtig für Anker wie #contact) */
  document.addEventListener('click', e => {
    const a = e.target.closest('#mnav a[href]:not([data-open])');
    if (a) closeLayer('mnav');
  });
  document.addEventListener('keydown', e => {
    const open = $$('.layer').filter(l => !l.hidden && !l.classList.contains('closing'));
    if (!open.length) return;
    const top = open[open.length - 1];
    if (e.key === 'Escape') { closeLayer(top.id); return; }
    if (e.key === 'Tab') {
      const f = focusables(top);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  matchMedia('(min-width: 990px)').addEventListener?.('change', ev => { if (ev.matches) closeLayer('mnav'); });

  /* =========================================================
     HEADER: transparent über dem Hero, beim Runterscrollen ausblenden
     ========================================================= */
  const nav = $('#SiteNav');
  const headerSec = $('.section-header');
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    if (nav && document.body.classList.contains('transparent-header')) nav.classList.toggle('over', y < 40);
    if (headerSec) {
      const hovering = headerSec.matches(':hover');
      if (y > 320 && y > lastY + 4 && !anyOpen() && !hovering && !headerSec.contains(document.activeElement)) headerSec.classList.add('is-hidden-up');
      else if (y < lastY - 4 || y < 320) headerSec.classList.remove('is-hidden-up');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Ankündigungs-Ticker */
  $$('[data-ticker]').forEach(bar => {
    const msgs = $$('.msg', bar);
    if (msgs.length < 2 || calm()) return;
    let i = 0;
    setInterval(() => {
      const cur = msgs[i];
      i = (i + 1) % msgs.length;
      const next = msgs[i];
      cur.classList.remove('on');
      cur.classList.add('out');
      next.classList.remove('out');
      void next.offsetWidth;
      next.classList.add('on');
      setTimeout(() => cur.classList.remove('out'), 900);
    }, (+bar.dataset.interval || 5) * 1000);
  });

  /* =========================================================
     TEXT-ANIMATIONEN + SCROLL-REVEAL
     ========================================================= */
  /* Teilt Überschriften wortweise auf und behält dabei <em>, <strong>, <a> usw. */
  function splitWords(el) {
    let wi = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.style.setProperty('--wi', wi++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
  }
  function splitTitles(root = document) {
    $$('[data-split]:not(.split-ready)', root).forEach(el => {
      if (html.classList.contains('js-anim') && !calm()) splitWords(el);
      el.classList.add('split-ready');
    });
  }
  let io = null;
  if (html.classList.contains('js-anim') && 'IntersectionObserver' in window && !calm()) {
    io = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      visible.forEach((e, idx) => {
        if (!e.target.style.getPropertyValue('--i')) e.target.style.setProperty('--i', Math.min(idx, 6));
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  }
  function observe(root = document) {
    splitTitles(root);
    const els = $$('[data-reveal]:not(.in),[data-split]:not(.in)', root);
    if (!io) { els.forEach(el => el.classList.add('in')); return; }
    els.forEach(el => io.observe(el));
  }
  observe();
  if (designMode) {
    const revealAll = root => $$('[data-reveal],[data-split]', root).forEach(el => el.classList.add('in'));
    revealAll(document);
    document.addEventListener('shopify:section:load', e => { splitTitles(e.target); revealAll(e.target); initSection(e.target); });
  }

  /* Wörter leuchten beim Scrollen auf (Manifest) */
  function initScrollWords(root = document) {
    $$('[data-scroll-words]:not(.sw-ready)', root).forEach(el => {
      el.classList.add('sw-ready');
      if (calm() || designMode) return;
      const walk = node => [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'sw';
            s.textContent = part;
            frag.appendChild(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
      walk(el);
      const words = $$('.sw', el);
      const update = () => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
        const n = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < n));
      };
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    });
  }

  /* Leichter Parallax für Hero- und Bildflächen */
  function initParallax(root = document) {
    if (calm()) return;
    const items = $$('[data-parallax] .hero-img, [data-parallax-img] img', root);
    if (!items.length) return;
    let raf = 0;
    const run = () => {
      raf = 0;
      const vh = window.innerHeight;
      items.forEach(img => {
        const box = img.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > vh) return;
        const isHero = !!img.closest('[data-parallax]');
        const p = isHero ? Math.min(1, Math.max(0, -box.top / box.height)) : (box.top + box.height / 2 - vh / 2) / vh;
        img.style.translate = isHero ? `0 ${p * 18}%` : `0 ${p * -6}%`;
      });
    };
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true });
    run();
  }

  /* =========================================================
     WEICHE SEITENWECHSEL
     ========================================================= */
  if (S.pageTransitions && !designMode) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download') || a.dataset.open || a.closest('[data-no-transition]')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.protocol.indexOf('http') !== 0) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (/^\/(checkout|cart\/|account\/logout|tools\/)/.test(url.pathname)) return;
      if (calm()) return;
      e.preventDefault();
      html.classList.add('leaving');
      setTimeout(() => { location.href = url.href; }, 320);
    });
    window.addEventListener('pageshow', ev => { if (ev.persisted) html.classList.remove('leaving'); });
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-cookie-settings]')) return;
    if (window.privacyBanner?.showPreferences) window.privacyBanner.showPreferences();
    else toast(STR.cookieUnavailable);
  });

  /* =========================================================
     SUCHE MIT VORSCHLÄGEN
     ========================================================= */
  const sInput = $('#SearchInput');
  const sBox = $('#SearchResults');
  if (sInput && sBox && T.routes.predictiveSearch) {
    let t, ctrl;
    sInput.addEventListener('input', () => {
      clearTimeout(t);
      const q = sInput.value.trim();
      if (!q) { sBox.hidden = true; sBox.innerHTML = ''; return; }
      t = setTimeout(async () => {
        ctrl?.abort();
        ctrl = new AbortController();
        try {
          const url = `${T.routes.predictiveSearch}?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=4&section_id=predictive-search`;
          const res = await fetch(url, { signal: ctrl.signal });
          const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
          const box = doc.getElementById('PredictiveResults');
          sBox.innerHTML = box ? box.innerHTML : '';
          sBox.hidden = !sBox.innerHTML.trim();
        } catch (err) { if (err.name !== 'AbortError') sBox.hidden = true; }
      }, 220);
    });
  }

  /* =========================================================
     WARENKORB (Shopify AJAX API) + FLIEGENDES BILD
     ========================================================= */
  function setCount(count, animate) {
    $$('#CartCount').forEach(c => {
      const prev = +c.textContent || 0;
      c.textContent = count;
      c.dataset.count = count;
      if (animate && count !== prev && count > 0) restartAnim(c, 'pop');
    });
    if (animate) restartAnim($('#CartIcon'), 'bump');
  }
  function updateCartDrawer(markup, { animateNew = false } = {}) {
    if (!markup) return;
    const doc = new DOMParser().parseFromString(markup, 'text/html');
    const fresh = doc.getElementById('CartDrawerInner');
    const old = $('#CartDrawerInner');
    if (!fresh || !old) return;
    const oldKeys = new Set($$('.line[data-key]', old).map(l => l.dataset.key));
    const oldQty = Object.fromEntries($$('.line[data-key]', old).map(l => [l.dataset.key, $('[data-qty-num]', l)?.textContent]));
    const oldBar = $('[data-bar]', old)?.style.width;
    old.replaceWith(fresh);
    $$('.line[data-key]', fresh).forEach(l => {
      if (animateNew && !oldKeys.has(l.dataset.key)) l.classList.add('line-new');
      const n = $('[data-qty-num]', l);
      if (n && oldQty[l.dataset.key] && oldQty[l.dataset.key] !== n.textContent) restartAnim(n, 'bump');
    });
    const bar = $('[data-bar]', fresh);
    if (bar && oldBar) {
      const target = bar.style.width;
      bar.style.width = oldBar;
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = target; }));
    }
    setCount(+(fresh.dataset.count || 0), true);
  }
  function flyToCart(img) {
    const icon = $('#CartIcon');
    if (!S.flyToCart || !img || !icon || calm()) return Promise.resolve();
    const from = img.getBoundingClientRect();
    const to = icon.getBoundingClientRect();
    if (!from.width || !to.width) return Promise.resolve();
    const clone = img.cloneNode();
    clone.removeAttribute('srcset');
    clone.removeAttribute('sizes');
    clone.removeAttribute('loading');
    clone.src = img.currentSrc || img.src;
    clone.className = 'fly-img';
    Object.assign(clone.style, { position: 'fixed', zIndex: 200, pointerEvents: 'none', objectFit: 'cover', left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', transition: 'transform .8s cubic-bezier(.16,1,.3,1), opacity .8s ease', transformOrigin: 'center' });
    document.body.appendChild(clone);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = Math.max(0.04, 24 / from.width);
    return new Promise(res => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
        clone.style.opacity = '0.2';
      }));
      setTimeout(() => { clone.remove(); res(); }, 780);
    });
  }
  async function cartChange(line, quantity) {
    const inner = $('#CartDrawerInner');
    const row = $$('.line[data-key]', inner)[line - 1];
    if (quantity === 0 && row && !calm()) {
      const h = row.offsetHeight;
      await row.animate(
        [{ opacity: 1, transform: 'none', height: h + 'px' }, { opacity: 0, transform: 'translateX(40px)', height: h + 'px', offset: 0.5 }, { opacity: 0, transform: 'translateX(40px)', height: '0px', paddingTop: '0px', paddingBottom: '0px' }],
        { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }
      ).finished.catch(() => {});
    } else {
      inner?.classList.add('is-busy');
    }
    try {
      const r = await fetch(`${T.routes.cartChange}.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line, quantity, sections: ['cart-drawer'], sections_url: location.pathname })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.description || data.message);
      updateCartDrawer(data.sections?.['cart-drawer']);
      document.dispatchEvent(new CustomEvent('cart:change', { detail: data }));
    } catch (err) {
      toast(err.message || STR.cartError);
      $('#CartDrawerInner')?.classList.remove('is-busy');
    }
  }
  async function cartAdd(formData, { img = null, openDrawer = true } = {}) {
    formData.append('sections', 'cart-drawer');
    formData.append('sections_url', location.pathname);
    const r = await fetch(`${T.routes.cartAdd}.js`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: formData
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.description || data.message || STR.cartError);
    const cartLayer = document.getElementById('cart');
    const drawerOpen = cartLayer && !cartLayer.hidden;
    await flyToCart(img);
    if (cartLayer && !drawerOpen) cartLayer.classList.remove('live');
    updateCartDrawer(data.sections?.['cart-drawer'], { animateNew: drawerOpen });
    if (openDrawer) openLayer('cart');
    document.dispatchEvent(new CustomEvent('cart:add', { detail: data }));
    return data;
  }
  document.addEventListener('click', async e => {
    const q = e.target.closest('#cart [data-line]');
    if (q) { cartChange(+q.dataset.line, +q.dataset.qty); return; }
    const add = e.target.closest('#cart [data-add-variant]');
    if (add) {
      const fd = new FormData();
      fd.append('id', add.dataset.addVariant);
      fd.append('quantity', '1');
      add.textContent = STR.adding;
      add.disabled = true;
      try { await cartAdd(fd); } catch (err) { toast(err.message); add.disabled = false; }
    }
  });
  /* Schnell-Hinzufügen auf Duft-Karten */
  document.addEventListener('submit', async e => {
    const form = e.target.closest('form[data-quick-add]');
    if (!form) return;
    e.preventDefault();
    const btn = $('button[type=submit]', form);
    const img = form.closest('.fcard')?.querySelector('.fcard-img');
    btn?.classList.add('is-loading');
    try { await cartAdd(new FormData(form), { img }); }
    catch (err) { toast(err.message); }
    finally { btn?.classList.remove('is-loading'); }
  });

  /* =========================================================
     PRODUKTSEITE: Varianten, Galerie, Menge, Kauf-Leiste
     ========================================================= */
  function initGallery(sec) {
    const g = $('[data-gallery]', sec);
    if (!g || g._init) return null;
    g._init = true;
    const track = $('[data-gallery-track]', g);
    const slides = $$('.pg-slide', track);
    const thumbs = $$('[data-thumb]', g);
    const now = $('[data-gallery-now]', g);
    const bar = $('[data-gallery-bar]', g);
    const prev = $('[data-gallery-prev]', g);
    const next = $('[data-gallery-next]', g);
    let index = 0;
    const pad = n => String(n).padStart(2, '0');
    const mark = i => {
      index = i;
      thumbs.forEach((t, k) => { const on = k === i; t.classList.toggle('is-on', on); on ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current'); });
      if (now) now.textContent = pad(i + 1);
      if (bar) bar.style.setProperty('--p', ((i + 1) / slides.length) * 100 + '%');
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
    };
    const go = (i, smooth = true) => {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: smooth && !calm() ? 'smooth' : 'auto' });
      mark(i);
    };
    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => mark(Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
    }, { passive: true });
    prev?.addEventListener('click', () => go(index - 1));
    next?.addEventListener('click', () => go(index + 1));
    thumbs.forEach((t, k) => t.addEventListener('click', () => go(k)));
    g.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });
    mark(0);

    /* Vollbild-Ansicht */
    const lbId = g.dataset.lightbox;
    const lb = lbId && document.getElementById(lbId);
    if (lb) {
      if (!designMode && lb.parentElement !== document.body) document.body.appendChild(lb);
      const lbTrack = $('[data-lightbox-track]', lb);
      const lbItems = $$('li', lbTrack);
      const lbGo = d => {
        const i = Math.round(lbTrack.scrollLeft / Math.max(1, lbTrack.clientWidth)) + d;
        const target = lbItems[Math.max(0, Math.min(lbItems.length - 1, i))];
        if (target) lbTrack.scrollTo({ left: target.offsetLeft, behavior: calm() ? 'auto' : 'smooth' });
      };
      $('[data-lightbox-prev]', lb)?.addEventListener('click', () => lbGo(-1));
      $('[data-lightbox-next]', lb)?.addEventListener('click', () => lbGo(1));
      lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') lbGo(1); if (e.key === 'ArrowLeft') lbGo(-1); });
      g.addEventListener('click', e => {
        const b = e.target.closest('[data-lightbox-open]');
        if (!b) return;
        openLayer(lbId);
        const target = lbItems.find(li => li.dataset.mediaId === b.dataset.lightboxOpen);
        requestAnimationFrame(() => { if (target) lbTrack.scrollTo({ left: target.offsetLeft, behavior: 'auto' }); });
      });
    }
    return {
      showMedia(id) {
        const i = slides.findIndex(s => s.dataset.mediaId === String(id));
        if (i > -1) go(i);
      }
    };
  }

  function initProduct(sec) {
    if (sec._init) return;
    sec._init = true;
    const gallery = initGallery(sec);
    const jsonEl = $('[data-product-json]', sec);
    if (!jsonEl) return;
    const product = JSON.parse(jsonEl.textContent);
    const variants = product.variants || [];
    const isSoon = sec.dataset.soon === 'true';
    const form = $('form.pform', sec) || $('form[data-type="add-to-cart-form"]', sec);
    const idInput = $('[data-variant-id]', sec);
    const groups = $$('[data-option-index]', sec);
    const atc = $('[data-atc]', sec);
    const atcLabel = $('[data-atc-label]', sec);
    const msg = $('[data-atc-msg]', sec);
    const stock = $('[data-stock]', sec);
    const stockText = $('[data-stock-text]', sec);
    const notify = $('[data-notify]', sec);
    const dynamic = $('[data-dynamic]', sec);
    const sticky = $('[data-sticky-atc]', sec);
    const stickyBtn = $('[data-sticky-btn]', sec);
    const stickyLabel = $('[data-sticky-label]', sec);
    const stickyPrice = $('[data-sticky-price]', sec);
    if (!idInput) return;

    let current = variants.find(v => String(v.id) === idInput.value) || variants[0];
    const selected = () => groups.map(g => $('input:checked', g)?.value);

    function statusOf(v) {
      if (v && v.available) return 'available';
      return isSoon ? 'soon' : (v ? 'soldout' : 'unavailable');
    }
    function labelFor(st) {
      return { available: STR.addToCart, soon: STR.comingSoon, soldout: STR.soldOut, unavailable: STR.unavailable }[st];
    }
    function markAvailability() {
      const sel = selected();
      groups.forEach(g => {
        const gi = +g.dataset.optionIndex;
        $$('input', g).forEach(input => {
          const ok = variants.some(v => v.available && v.options[gi] === input.value &&
            groups.every((g2, k2) => { const oi = +g2.dataset.optionIndex; return oi === gi || v.options[oi] === sel[k2]; }));
          input.nextElementSibling?.classList.toggle('is-unavailable', !ok);
        });
      });
    }
    function update(fromUser) {
      const sel = selected();
      const v = groups.length
        ? variants.find(x => groups.every((g, k) => x.options[+g.dataset.optionIndex] === sel[k]))
        : current;
      current = v || null;
      groups.forEach((g, k) => { const lab = $('[data-option-value]', g); if (lab) lab.textContent = sel[k] || ''; });
      const st = statusOf(v);
      if (v) {
        idInput.value = v.id;
        $$('[data-price]', sec).forEach(el => {
          const before = el.textContent.trim();
          el.textContent = formatMoney(v.price);
          if (fromUser && before !== el.textContent.trim()) restartAnim(el, 'bump');
        });
        $$('[data-compare]', sec).forEach(el => {
          const sale = v.compare_at_price && v.compare_at_price > v.price;
          el.hidden = !sale;
          el.textContent = sale ? formatMoney(v.compare_at_price) : '';
        });
        if (stickyPrice) stickyPrice.textContent = formatMoney(v.price);
        if (fromUser) {
          if (v.featured_media && gallery) gallery.showMedia(v.featured_media.id);
          const url = new URL(location.href);
          url.searchParams.set('variant', v.id);
          history.replaceState(history.state, '', url);
        }
      }
      const buyable = st === 'available';
      if (atc) atc.disabled = !buyable;
      if (atcLabel) atcLabel.textContent = labelFor(st);
      if (stickyBtn) stickyBtn.disabled = !buyable;
      if (stickyLabel) stickyLabel.textContent = labelFor(st);
      if (stock) {
        stock.className = `stock stock--${st}`;
        if (stockText) stockText.textContent = st === 'available' ? STR.inStock : labelFor(st);
      }
      if (notify) {
        notify.hidden = buyable;
        const a = $('[data-notify-soldout]', notify), b = $('[data-notify-soon]', notify);
        if (a) a.hidden = st === 'soon';
        if (b) b.hidden = st !== 'soon';
      }
      if (dynamic) dynamic.hidden = !buyable;
      if (msg) { msg.hidden = true; msg.textContent = ''; }
      markAvailability();
    }
    groups.forEach(g => g.addEventListener('change', () => update(true)));

    /* Menge */
    $$('[data-qty-input]', sec).forEach(box => {
      const input = $('input', box);
      box.addEventListener('click', e => {
        const b = e.target.closest('[data-step]');
        if (!b) return;
        const val = Math.max(1, (parseInt(input.value, 10) || 1) + +b.dataset.step);
        input.value = val;
      });
      input.addEventListener('change', () => { input.value = Math.max(1, parseInt(input.value, 10) || 1); });
    });

    /* In den Warenkorb */
    form?.addEventListener('submit', async e => {
      e.preventDefault();
      if (!current || !current.available) return;
      atc?.classList.add('is-loading');
      const img = $('.pg-slide img', sec);
      try {
        await cartAdd(new FormData(form), { img });
        atc?.classList.remove('is-loading');
        atc?.classList.add('is-added');
        setTimeout(() => atc?.classList.remove('is-added'), 2000);
      } catch (err) {
        if (msg) { msg.textContent = err.message; msg.hidden = false; }
      } finally {
        atc?.classList.remove('is-loading');
      }
    });

    /* Kauf-Leiste einblenden, wenn der Button aus dem Bild ist */
    if (sticky && atc && 'IntersectionObserver' in window) {
      const o = new IntersectionObserver(([en]) => {
        const show = !en.isIntersecting && en.boundingClientRect.top < 0;
        sticky.classList.toggle('is-visible', show);
        sticky.setAttribute('aria-hidden', !show);
        if (stickyBtn) stickyBtn.tabIndex = show ? 0 : -1;
      });
      o.observe(atc);
    }
    update(false);
  }

  /* =========================================================
     AKKORDEONS mit weicher Höhe
     ========================================================= */
  document.addEventListener('click', e => {
    const summary = e.target.closest('details.acc > summary, details.mnav-sub > summary');
    if (!summary || calm()) return;
    const details = summary.parentElement;
    const body = details.querySelector(':scope > :not(summary)');
    if (!body || details._anim) return;
    e.preventDefault();
    if (details.open) {
      const h = body.offsetHeight;
      details._anim = body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
      details._anim.onfinish = () => { details.open = false; details._anim = null; };
    } else {
      details.open = true;
      const h = body.offsetHeight;
      details._anim = body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' });
      details._anim.onfinish = () => { details._anim = null; };
    }
  });

  /* =========================================================
     COUNTDOWN (nur mit selbst eingetragenem Datum)
     ========================================================= */
  function initCountdown(root = document) {
    $$('[data-countdown]', root).forEach(el => {
      if (el._init) return;
      el._init = true;
      const target = Date.parse(el.dataset.countdown);
      if (isNaN(target) || target <= Date.now()) { el.hidden = true; return; }
      el.hidden = false;
      const pad = n => String(n).padStart(2, '0');
      const parts = { d: $('[data-cd="d"]', el), h: $('[data-cd="h"]', el), m: $('[data-cd="m"]', el), s: $('[data-cd="s"]', el) };
      const tick = () => {
        let diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
        if (diff === 0) { el.hidden = true; clearInterval(el._t); return; }
        const d = Math.floor(diff / 86400); diff -= d * 86400;
        const h = Math.floor(diff / 3600); diff -= h * 3600;
        const m = Math.floor(diff / 60); const s = diff - m * 60;
        parts.d.textContent = pad(d); parts.h.textContent = pad(h); parts.m.textContent = pad(m); parts.s.textContent = pad(s);
      };
      tick();
      el._t = setInterval(tick, 1000);
    });
  }

  /* =========================================================
     ZEITLEISTE: Linie wächst beim Scrollen
     ========================================================= */
  function initTimeline(root = document) {
    $$('[data-timeline]', root).forEach(sec => {
      if (sec._init) return;
      sec._init = true;
      const wrap = $('.tl-wrap', sec);
      const bar = $('[data-timeline-bar]', sec);
      const items = $$('.tl-item', sec);
      if (!wrap || !bar) return;
      let raf = 0;
      const run = () => {
        raf = 0;
        const r = wrap.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
        bar.style.setProperty('--p', (calm() ? 100 : p * 100) + '%');
        items.forEach(it => {
          const d = $('.tl-dot', it)?.getBoundingClientRect();
          if (d) it.classList.toggle('is-active', d.top < vh * 0.6);
        });
      };
      window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true });
      window.addEventListener('resize', run);
      run();
    });
  }

  /* Empfehlungen nachladen */
  function initRecs(root = document) {
    $$('[data-recs]', root).forEach(async el => {
      if (el._init || el.children.length) return;
      el._init = true;
      try {
        const res = await fetch(el.dataset.url);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const box = doc.querySelector('[data-recs]');
        if (box && box.innerHTML.trim()) { el.innerHTML = box.innerHTML; observe(el); }
      } catch (e) {}
    });
  }

  function initSection(root = document) {
    $$('[data-product]', root).forEach(initProduct);
    initCountdown(root);
    initTimeline(root);
    initScrollWords(root);
    initRecs(root);
  }
  initSection();
  initParallax();

  /* Nach erfolgreichem Formular-Versand zur Meldung springen */
  const posted = /[?&](contact_posted|customer_posted)=true/.test(location.search);
  if (posted) {
    const ok = $('.form-msg[tabindex="-1"]');
    if (ok) setTimeout(() => { ok.scrollIntoView({ block: 'center' }); ok.focus({ preventScroll: true }); }, 300);
  }

  /* Kunden-Seiten */
  document.addEventListener('click', e => {
    const r = e.target.closest('[data-recover-toggle]');
    if (!r) return;
    e.preventDefault();
    document.getElementById('recover')?.classList.toggle('show');
  });
  $$('select[data-default]').forEach(sel => { if (sel.dataset.default) sel.value = sel.dataset.default; });
})();
