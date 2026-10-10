/* Streetwear Theme – Interaktionen & Animationen */
(() => {
  window.__themeReady = true;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const T = window.theme || { routes: {}, strings: {}, settings: {} };
  const S = T.settings || {};
  const html = document.documentElement;
  const rmQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => S.respectReducedMotion && rmQuery.matches;
  const designMode = !!(window.Shopify && window.Shopify.designMode);

  /* ---------- Geld formatieren ---------- */
  function formatMoney(cents) {
    const fmt = T.moneyFormat || '€{{amount_with_comma_separator}} EUR';
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
      amount_with_space_separator: fx(cents, 2, ' ', ',')
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
    toast.t = setTimeout(() => (t.hidden = true), 2800);
  }
  const restartAnim = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* =========================================================
     EBENEN: Suche, Warenkorb, Menü
     ========================================================= */
  if (!designMode) ['account', 'mnav', 'sizeguide'].forEach(id => { const el = document.getElementById(id); if (el && el.parentElement !== document.body) document.body.appendChild(el); });
  const anyOpen = () => $$('.layer').some(l => !l.hidden && !l.classList.contains('closing'));
  function openLayer(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.hidden && !el.classList.contains('closing')) return;
    clearTimeout(el._t);
    el.classList.remove('closing', 'live');
    el.hidden = false;
    html.style.overflow = 'hidden';
    $('.section-header')?.classList.remove('is-hidden-up');
    el._t = setTimeout(() => el.classList.add('live'), 900);
    if (id === 'search') setTimeout(() => $('#SearchInput')?.focus({ preventScroll: true }), 80);
  }
  function closeLayer(id) {
    const el = document.getElementById(id);
    if (!el || el.hidden || el.classList.contains('closing')) return;
    el.classList.add('closing');
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
      el.classList.remove('closing', 'live');
      if (!anyOpen()) html.style.overflow = '';
    }, calm() ? 0 : 320);
  }
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o) {
      e.preventDefault();
      const fromLayer = o.closest('.layer');
      if (fromLayer && fromLayer.id !== o.dataset.open) closeLayer(fromLayer.id);
      openLayer(o.dataset.open);
      return;
    }
    const c = e.target.closest('[data-close]');
    if (c) { e.preventDefault(); closeLayer(c.dataset.close); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') ['search', 'cart', 'mnav', 'account', 'sizeguide'].forEach(closeLayer);
  });

  /* =========================================================
     HEADER: transparent, ausblenden beim Runterscrollen
     ========================================================= */
  const nav = $('#SiteNav');
  const headerSec = $('.section-header');
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    if (nav && document.body.classList.contains('transparent-header')) nav.classList.toggle('over', y < 40);
    if (headerSec) {
      headerSec.classList.toggle('is-scrolled', y > 10);
      const hovering = headerSec.matches(':hover');
      if (y > 240 && y > lastY + 4 && !anyOpen() && !hovering) headerSec.classList.add('is-hidden-up');
      else if (y < lastY - 4 || y < 240) headerSec.classList.remove('is-hidden-up');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* =========================================================
     ANKÜNDIGUNGS-TICKER
     ========================================================= */
  $$('[data-ticker]').forEach(bar => {
    const msgs = $$('.msg', bar);
    if (msgs.length < 2) return;
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
      setTimeout(() => cur.classList.remove('out'), 700);
    }, (+bar.dataset.interval || 4) * 1000);
  });

  /* =========================================================
     HERO-SLIDER mit Fortschrittsbalken
     ========================================================= */
  $$('[data-slider]').forEach(slider => {
    const slides = $$('.slide', slider);
    const dots = $$('.dots button', slider);
    if (slides.length < 2) return;
    let cur = 0, timer;
    const ms = (+slider.dataset.interval || 5) * 1000;
    const show = i => {
      cur = i;
      slides.forEach((s, k) => {
        if (k === i) restartAnim(s, 'on'); else s.classList.remove('on');
      });
      dots.forEach((d, k) => {
        d.classList.toggle('done', k < i);
        if (k === i) restartAnim(d, 'on'); else d.classList.remove('on');
      });
    };
    const restart = () => { clearInterval(timer); timer = setInterval(() => show((cur + 1) % slides.length), ms); };
    dots.forEach(d => d.addEventListener('click', () => { show(+d.dataset.slide); restart(); }));
    restart();
    document.addEventListener('shopify:block:select', e => {
      const i = slides.findIndex(s => s.contains(e.target) || s === e.target);
      if (i > -1) { clearInterval(timer); show(i); }
    });
  });

  /* =========================================================
     TITEL WORTWEISE + SCROLL-REVEAL
     ========================================================= */
  function splitTitles(root = document) {
    $$('[data-split]:not(.is-split)', root).forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map((w, i) => `<span class="w"><span style="--wi:${i}">${w.replace(/</g, '&lt;')}</span></span>`).join(' ');
      el.classList.add('is-split');
    });
  }
  const revealAll = root => $$('[data-reveal],[data-split]', root).forEach(el => el.classList.add('in'));
  let io = null;
  if (html.classList.contains('js-anim') && 'IntersectionObserver' in window && !calm()) {
    io = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      visible.forEach((e, idx) => {
        e.target.style.setProperty('--i', Math.min(idx, 8));
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  function observe(root = document) {
    splitTitles(root);
    const els = $$('[data-reveal]:not(.in),[data-split]:not(.in)', root);
    if (!io) { els.forEach(el => el.classList.add('in')); return; }
    els.forEach(el => io.observe(el));
  }
  observe();
  if (designMode) {
    revealAll(document);
    document.addEventListener('shopify:section:load', e => { splitTitles(e.target); revealAll(e.target); });
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
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (/^\/(checkout|cart\/|account\/logout)/.test(url.pathname)) return;
      if (calm()) return;
      e.preventDefault();
      html.classList.add('leaving');
      setTimeout(() => { location.href = url.href; }, 300);
    });
    window.addEventListener('pageshow', ev => { if (ev.persisted) html.classList.remove('leaving'); });
  }

  /* =========================================================
     NEWSLETTER
     ========================================================= */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-nl-toggle]');
    if (!b) return;
    const f = document.getElementById(b.getAttribute('aria-controls'));
    if (!f) return;
    const open = !f.classList.contains('open');
    f.classList.toggle('open', open);
    b.setAttribute('aria-expanded', open);
    if (open) setTimeout(() => f.querySelector('input[type=email]')?.focus({ preventScroll: true }), 250);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-cookie-settings]')) return;
    if (window.privacyBanner?.showPreferences) window.privacyBanner.showPreferences();
    else toast('Cookie settings are currently unavailable.');
  });

  /* =========================================================
     SUCHE MIT VORSCHLÄGEN
     ========================================================= */
  const sInput = $('#SearchInput');
  const sBox = $('#SearchResults');
  if (sInput && sBox) {
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
          $$('[data-reveal]', sBox).forEach(el => el.classList.add('in'));
          sBox.hidden = !sBox.innerHTML.trim();
        } catch (err) { if (err.name !== 'AbortError') sBox.hidden = true; }
      }, 220);
    });
  }

  /* =========================================================
     WARENKORB (AJAX) + FLIEGENDES BILD
     ========================================================= */
  function setCount(count, animate) {
    const c = $('#CartCount');
    if (!c) return;
    const prev = +c.textContent || 0;
    c.textContent = count;
    c.hidden = count === 0;
    if (animate && count !== prev && count > 0) {
      restartAnim(c, 'pop');
      restartAnim($('#CartIcon'), 'bump');
    }
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
    if (!from.width) return Promise.resolve();
    const to = icon.getBoundingClientRect();
    const clone = img.cloneNode();
    clone.removeAttribute('srcset');
    clone.removeAttribute('sizes');
    clone.src = img.currentSrc || img.src;
    clone.className = 'fly-img';
    Object.assign(clone.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', transform: 'none', opacity: '1' });
    document.body.appendChild(clone);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = Math.max(0.06, 26 / from.width);
    return new Promise(res => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
        clone.style.opacity = '0.4';
      }));
      setTimeout(() => { clone.remove(); restartAnim(icon, 'bump'); res(); }, 760);
    });
  }
  async function cartChange(line, quantity) {
    const inner = $('#CartDrawerInner');
    const row = $$('.line[data-key]', inner)[line - 1];
    if (quantity === 0 && row && !calm()) {
      const h = row.offsetHeight;
      await row.animate(
        [{ opacity: 1, transform: 'none', height: h + 'px' }, { opacity: 0, transform: 'translateX(40px)', height: h + 'px', offset: 0.55 }, { opacity: 0, transform: 'translateX(40px)', height: '0px', paddingTop: '0px', paddingBottom: '0px' }],
        { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }
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
    } catch (err) {
      toast(err.message || 'Something went wrong. Please reload the page.');
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
    if (!r.ok) throw new Error(data.description || data.message || 'Could not be added to cart.');
    const cartLayer = document.getElementById('cart');
    const drawerOpen = cartLayer && !cartLayer.hidden;
    await flyToCart(img);
    if (cartLayer && !drawerOpen) cartLayer.classList.remove('live');
    updateCartDrawer(data.sections?.['cart-drawer'], { animateNew: drawerOpen });
    if (openDrawer) openLayer('cart');
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
      add.textContent = 'Adding …';
      try { await cartAdd(fd); } catch (err) { toast(err.message); }
      return;
    }
    const dot = e.target.closest('#cart [data-ups-dot]');
    if (dot) {
      const n = dot.dataset.upsDot;
      $$('#cart [data-ups]').forEach(el => el.classList.toggle('is-hidden', el.dataset.ups !== n));
      $$('#cart [data-ups-dot]').forEach(d => d.classList.toggle('on', d === dot));
    }
  });

  /* Schnell-Hinzufügen auf Produktkarten */
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-qa-variant]');
    if (!b || b.disabled) return;
    e.preventDefault();
    const card = b.closest('.card');
    const img = card?.querySelector('.media img.main-img');
    const fd = new FormData();
    fd.append('id', b.dataset.qaVariant);
    fd.append('quantity', '1');
    b.classList.add('is-loading');
    try { await cartAdd(fd, { img }); }
    catch (err) { toast(err.message); }
    finally { b.classList.remove('is-loading'); }
  });

  /* =========================================================
     PRODUKTSEITE
     ========================================================= */
  $$('[data-product]').forEach(sec => {
    const jsonEl = $('[data-product-json]', sec);
    if (!jsonEl) return;
    const product = JSON.parse(jsonEl.textContent);
    const variants = product.variants;
    const idInput = $('[data-variant-id]', sec);
    const groups = $$('[data-option]', sec);
    const atc = $('[data-atc]', sec);
    const atcLabel = $('[data-atc-label]', sec);
    const msg = $('[data-atc-msg]', sec);
    const priceEl = $('[data-price]', sec);
    const compareEl = $('[data-compare]', sec);
    const avail = $('[data-avail]', sec);
    const availText = $('[data-avail-text]', sec);
    const okHTML = availText ? availText.innerHTML : '';
    const s = T.strings;

    let current = variants.find(v => String(v.id) === idInput.value) || variants[0];
    const sel = [...current.options];
    const picked = {};
    groups.forEach(g => { picked[g.dataset.option] = !g.classList.contains('psizes') || g.dataset.pick === 'auto'; });
    let touched = false;

    const showMedia = id => {
      if (!id) return;
      $$('[data-media-main]', sec).forEach(m => {
        const on = m.dataset.mediaMain === String(id);
        m.classList.toggle('is-off', !on);
        if (!on) m.classList.remove('zooming');
      });
      $$('[data-thumbs] button', sec).forEach(b => b.classList.toggle('on', b.dataset.media === String(id)));
    };

    function update() {
      groups.forEach(g => {
        const i = +g.dataset.option;
        const isSize = g.classList.contains('psizes');
        $$('button[data-value]', g).forEach(b => {
          const val = b.dataset.value;
          b.classList.toggle('on', val === sel[i] && picked[i]);
          if (isSize) {
            const ok = variants.some(v => v.available && v.options[i] === val && v.options.every((o, k) => k === i || o === sel[k] || !picked[k]));
            b.disabled = !ok;
          }
        });
        const lab = $(`[data-option-label="${i}"]`, sec);
        if (lab) lab.textContent = sel[i];
      });

      const v = variants.find(x => x.options.every((o, i) => o === sel[i]));
      const prevPrice = priceEl?.textContent;
      current = v || null;
      if (v) {
        idInput.value = v.id;
        if (priceEl) {
          priceEl.textContent = formatMoney(v.price);
          if (prevPrice !== priceEl.textContent) restartAnim(priceEl, 'flash');
        }
        if (compareEl) {
          compareEl.hidden = !(v.compare_at_price > v.price);
          compareEl.textContent = v.compare_at_price ? formatMoney(v.compare_at_price) : '';
        }
        if (v.featured_media && touched) showMedia(v.featured_media.id);
        if (touched) history.replaceState(null, '', `${location.pathname}?variant=${v.id}`);
      }
      const allPicked = Object.values(picked).every(Boolean);
      const sellable = v && v.available;
      if (atc) {
        atc.disabled = !!(allPicked && !sellable);
        if (atcLabel) atcLabel.textContent = allPicked && !sellable ? (v ? s.soldOut : s.unavailable) : s.addToCart;
      }
      if (avail) {
        const out = allPicked && !sellable;
        avail.classList.toggle('out', out);
        availText.innerHTML = out ? `<b>${s.soldOut}.</b>` : okHTML;
      }
    }

    groups.forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('button[data-value]');
      if (!b || b.disabled) return;
      const i = +g.dataset.option;
      sel[i] = b.dataset.value;
      picked[i] = true;
      touched = true;
      g.classList.remove('warn');
      if (msg) msg.textContent = '';
      update();
    }));

    $('[data-thumbs]', sec)?.addEventListener('click', e => {
      const b = e.target.closest('button[data-media]');
      if (b) showMedia(b.dataset.media);
    });

    /* Bild-Zoom (Desktop) */
    if (matchMedia('(hover: hover)').matches) {
      $$('[data-zoom]', sec).forEach(m => {
        const img = $('img', m);
        if (!img) return;
        m.addEventListener('click', () => m.classList.toggle('zooming'));
        m.addEventListener('mousemove', e => {
          const r = m.getBoundingClientRect();
          img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        });
        m.addEventListener('mouseleave', () => m.classList.remove('zooming'));
      });
    }

    $('[data-open-size]', sec)?.addEventListener('click', () => {
      const d = $('[data-size-acc]', sec);
      if (!d) return;
      if (!d.open) $('summary', d)?.click();
      d.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'center' });
    });

    const form = $('form.pform', sec);
    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const missing = groups.find(g => !picked[g.dataset.option]);
      if (missing) {
        missing.classList.remove('warn');
        void missing.offsetWidth;
        missing.classList.add('warn');
        if (msg) msg.textContent = s.chooseSize;
        return;
      }
      if (!current || !current.available) return;
      atc.classList.add('is-loading');
      const img = $('[data-media-main]:not(.is-off) img', sec);
      try {
        await cartAdd(new FormData(form), { img });
        atc.classList.remove('is-loading');
        atc.classList.add('is-added');
        setTimeout(() => atc.classList.remove('is-added'), 1800);
      } catch (err) {
        if (msg) msg.textContent = err.message;
      } finally {
        atc.classList.remove('is-loading');
      }
    });

    update();
  });

  /* Akkordeons mit weicher Höhe */
  document.addEventListener('click', e => {
    const summary = e.target.closest('.acc summary');
    if (!summary || calm()) return;
    const details = summary.parentElement;
    const body = $('.body', details);
    if (!body || details._anim) return;
    e.preventDefault();
    if (details.open) {
      const h = body.offsetHeight;
      details._anim = body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
      details.classList.add('closing');
      details._anim.onfinish = () => { details.open = false; details._anim = null; details.classList.remove('closing'); };
    } else {
      details.open = true;
      const h = body.offsetHeight;
      details._anim = body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
      details._anim.onfinish = () => { details._anim = null; };
    }
  });

  /* =========================================================
     KOLLEKTION: Spalten + Mehr laden
     ========================================================= */
  const grid = $('[data-grid]');
  const dens = $('[data-density]');
  if (grid && dens) {
    let cols = 4;
    try { cols = +localStorage.getItem('grid-cols') || 4; } catch (e) {}
    const set = (n, animate) => {
      cols = n;
      grid.style.setProperty('--cols', n);
      $$('button', dens).forEach(b => b.classList.toggle('on', +b.dataset.cols === n));
      try { localStorage.setItem('grid-cols', n); } catch (e) {}
      if (animate) {
        $$('.card', grid).forEach((c, i) => { c.style.setProperty('--i', Math.min(i, 16)); c.classList.add('in'); });
        restartAnim(grid, 'reflow');
        setTimeout(() => grid.classList.remove('reflow'), 1200);
      }
    };
    dens.addEventListener('click', e => { const b = e.target.closest('button[data-cols]'); if (b) set(+b.dataset.cols, true); });
    set(cols, false);
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-load-more]');
    if (!b) return;
    b.disabled = true;
    b.textContent = 'Loading …';
    try {
      const res = await fetch(b.dataset.loadMore);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const target = $('#ProductGrid');
      const added = $$('#ProductGrid > .card', doc);
      added.forEach(c => target.appendChild(c));
      observe(target);
      const next = doc.getElementById('LoadMore');
      const wrap = document.getElementById('LoadMore');
      if (next) wrap.replaceWith(next); else wrap.remove();
    } catch (err) {
      b.disabled = false;
      b.textContent = 'Load more';
      toast('More products could not be loaded.');
    }
  });

  /* =========================================================
     „PASST DAZU“ (Empfehlungen)
     ========================================================= */
  $$('[data-recs]').forEach(async el => {
    if (el.children.length) return;
    try {
      const res = await fetch(el.dataset.url);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const box = doc.querySelector('[data-recs]');
      if (box && box.innerHTML.trim()) {
        el.innerHTML = box.innerHTML;
        observe(el);
      }
    } catch (e) {}
  });

  /* =========================================================
     STARTSEITE: Produkt-Slider
     ========================================================= */
  function initCarousel(root) {
    const track = $('[data-car-track]', root);
    if (!track || track._init) return;
    track._init = true;
    const prev = $('[data-car-prev]', root);
    const next = $('[data-car-next]', root);
    const bar = $('[data-car-bar]', root);
    const step = () => {
      const card = track.querySelector('.slide-card');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const per = Math.max(1, Math.round(track.clientWidth / ((card?.offsetWidth || 300) + gap)) - 1);
      return ((card?.offsetWidth || 300) + gap) * per;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const x = track.scrollLeft;
      if (prev) prev.disabled = x <= 2;
      if (next) next.disabled = x >= max - 2;
      if (bar) {
        const ratio = track.clientWidth / track.scrollWidth;
        const w = Math.max(ratio * 100, 8);
        bar.style.setProperty('--w', w + '%');
        const travel = (100 - w) / w * 100;
        bar.style.setProperty('--x', (max > 0 ? (x / max) * travel : 0) + '%');
      }
    };
    prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: calm() ? 'auto' : 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: calm() ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    /* Ziehen mit der Maus */
    let down = false, startX = 0, startLeft = 0, moved = 0, vel = 0, lastX = 0, raf;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button')) return;
      down = true; moved = 0; startX = lastX = e.clientX; startLeft = track.scrollLeft; vel = 0;
      cancelAnimationFrame(raf);
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) track.classList.add('dragging');
      vel = e.clientX - lastX; lastX = e.clientX;
      track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      const glide = () => {
        vel *= 0.92;
        track.scrollLeft -= vel;
        if (Math.abs(vel) > 0.5) raf = requestAnimationFrame(glide);
        else track.classList.remove('dragging');
      };
      if (moved > 5 && !calm()) raf = requestAnimationFrame(glide);
      else track.classList.remove('dragging');
    });
    track.addEventListener('click', e => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
  $$('[data-carousel]').forEach(initCarousel);

  /* =========================================================
     STARTSEITE: Bildkarten mit Tabs
     ========================================================= */
  function initTabs(root) {
    const grid = $('[data-tab-grid]', root);
    const btns = $$('[data-tab-btn]', root);
    if (!grid || !btns.length || grid._init) return;
    grid._init = true;
    let busy = false;
    btns.forEach(btn => btn.addEventListener('click', () => {
      if (busy || btn.classList.contains('on')) return;
      const tab = btn.dataset.tabBtn;
      btns.forEach(b => { b.classList.toggle('on', b === btn); b.setAttribute('aria-selected', b === btn); });
      const cards = $$('.ft-card', grid);
      const out = cards.filter(c => !c.classList.contains('is-hidden'));
      const inc = cards.filter(c => c.dataset.tab === tab);
      const swap = () => {
        out.forEach(c => { c.classList.add('is-hidden'); c.classList.remove('ft-out', 'ft-in'); });
        inc.forEach((c, i) => {
          c.classList.remove('is-hidden');
          c.classList.add('in');
          c.style.setProperty('--i', i);
          restartAnim(c, 'ft-in');
        });
        grid.scrollTo?.({ left: 0 });
        busy = false;
      };
      if (calm()) { swap(); return; }
      busy = true;
      out.forEach(c => { c.classList.remove('ft-in'); c.classList.add('ft-out'); });
      setTimeout(swap, 280);
    }));
  }
  $$('[data-tabs]').forEach(initTabs);

  document.addEventListener('shopify:section:load', e => {
    $$('[data-carousel]', e.target).forEach(initCarousel);
    $$('[data-tabs]', e.target).forEach(initTabs);
    if (e.target.matches?.('[data-carousel]')) initCarousel(e.target);
  });
  document.addEventListener('shopify:block:select', e => {
    const card = e.target.closest?.('.ft-card');
    const sec = e.target.closest?.('[data-tabs]');
    if (!card || !sec || !card.classList.contains('is-hidden')) return;
    $(`[data-tab-btn="${card.dataset.tab}"]`, sec)?.click();
  });

  /* =========================================================
     KUNDENSTIMMEN: Zahl hochzählen, Sterne füllen
     ========================================================= */
  $$('[data-sp]').forEach(sp => {
    const num = $('[data-sp-count]', sp);
    const target = parseInt(num?.dataset.spCount, 10) || 0;
    const fmtN = n => n.toLocaleString('de-DE');
    if (num) num.textContent = calm() ? fmtN(target) : '0';
    const run = () => {
      sp.classList.add('in');
      if (!num || calm()) return;
      const t0 = performance.now(), dur = 1600;
      const tick = now => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 4);
        num.textContent = fmtN(Math.round(target * e));
        if (p < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 450);
    };
    if ('IntersectionObserver' in window) {
      const o = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { o.disconnect(); run(); } });
      o.observe(sp);
    } else run();
  });

  /* =========================================================
     GRÖSSENBERATER
     ========================================================= */
  (function initSizeGuide() {
    const root = $('[data-sg]');
    if (!root) return;
    let data = {};
    try { data = JSON.parse($('[data-sg-json]', root).textContent); } catch (e) {}
    const META = {
      tops: {
        labels: ['Length', 'Chest width', 'Sleeve length'],
        how: ['From the highest point of the shoulder to the hem.', 'Laid flat, from side seam to side seam just below the armpits.', 'From the shoulder seam to the sleeve hem.']
      },
      bottoms: {
        labels: ['Waist width', 'Total length', 'Inseam'],
        how: ['Waistband laid flat, edge to edge, unstretched.', 'From the top of the waistband to the hem.', 'From the crotch to the hem along the inner seam.']
      }
    };
    const ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'XXXL'];
    const parse = txt => String(txt || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
      const i = l.indexOf(':');
      if (i < 1) return null;
      return { size: l.slice(0, i).trim(), vals: l.slice(i + 1).split(',').map(x => parseFloat(x)).filter(n => !isNaN(n)) };
    }).filter(r => r && r.vals.length);
    const tables = { tops: parse(data.tops), bottoms: parse(data.bottoms) };

    const st = { tab: root.dataset.start === 'bottoms' ? 'bottoms' : 'tops', unit: 'cm', size: null, fit: 0 };
    if (!tables[st.tab].length) st.tab = st.tab === 'tops' ? 'bottoms' : 'tops';
    const stage = $('[data-sg-stage]', root);
    const tilt = $('[data-sg-tilt]', root);
    const fmt = v => st.unit === 'cm' ? `${v} cm` : `${(v / 2.54).toFixed(1)} in`;
    const rows = () => tables[st.tab];
    const current = () => rows().find(r => r.size === st.size) || rows()[0];

    function productSize() {
      const on = document.querySelector('.psizes button.on');
      return on ? on.dataset.value : null;
    }
    function moveInk() {
      const btn = $(`[data-sg-tab="${st.tab}"]`, root);
      const ink = $('.sg-ink', root);
      if (btn && ink) { ink.style.width = btn.offsetWidth + 'px'; ink.style.transform = `translateX(${btn.offsetLeft}px)`; }
    }
    function drawLines() {
      const model = $(`[data-sg-model="${st.tab}"]`, root);
      $$('.sg-m', model).forEach((m, i) => { m.style.setProperty('--d', i); restartAnim(m, 'draw'); });
    }
    function renderValues(animate) {
      const row = current();
      if (!row) return;
      const model = $(`[data-sg-model="${st.tab}"]`, root);
      $$('[data-sg-val]', model).forEach(t => {
        const v = row.vals[+t.dataset.sgVal];
        t.textContent = v != null ? (st.unit === 'cm' ? v : (v / 2.54).toFixed(1)) : '–';
        if (animate) restartAnim(t, 'tick');
      });
      const meta = META[st.tab];
      $('[data-sg-legend]', root).innerHTML = meta.labels.map((lab, i) => row.vals[i] == null ? '' :
        `<li data-hl="${i}" style="--d:${i}"><span class="ltr">${'ABC'[i]}</span><span class="nm">${lab}</span><span class="val">${fmt(row.vals[i])}</span><span class="how">${meta.how[i]}</span></li>`).join('');
      $$('[data-sg-sizes] button', root).forEach(b => b.classList.toggle('on', b.dataset.size === row.size));
      $$('[data-sg-table] tbody tr', root).forEach(tr => tr.classList.toggle('on', tr.dataset.size === row.size));
      $('[data-sg-apply-label]', root).textContent = `Apply size ${row.size}`;
    }
    function render(full) {
      $$('[data-sg-tab]', root).forEach(b => { b.classList.toggle('on', b.dataset.sgTab === st.tab); b.setAttribute('aria-selected', b.dataset.sgTab === st.tab); });
      $$('[data-sg-model]', root).forEach(m => m.classList.toggle('on', m.dataset.sgModel === st.tab));
      moveInk();
      const r = rows();
      if (!r.find(x => x.size === st.size)) st.size = (r[Math.floor(r.length / 2)] || {}).size;
      $('[data-sg-sizes]', root).innerHTML = r.map(x => `<button type="button" data-size="${x.size}">${x.size}</button>`).join('');
      const meta = META[st.tab];
      $('[data-sg-table]', root).innerHTML =
        `<thead><tr><th>Size</th>${meta.labels.map((l, i) => `<th><b>${'ABC'[i]}</b> ${l}</th>`).join('')}</tr></thead>` +
        `<tbody>${r.map(x => `<tr data-size="${x.size}"><td>${x.size}</td>${meta.labels.map((_, i) => `<td>${x.vals[i] != null ? fmt(x.vals[i]) : '–'}</td>`).join('')}</tr>`).join('')}</tbody>`;
      renderValues(false);
      if (full) drawLines();
      recommend();
    }
    function selectSize(size) {
      if (!size || size === st.size) return;
      st.size = size;
      renderValues(true);
    }

    root.addEventListener('click', e => {
      const tab = e.target.closest('[data-sg-tab]');
      if (tab && tab.dataset.sgTab !== st.tab) { st.tab = tab.dataset.sgTab; render(true); return; }
      const unit = e.target.closest('[data-sg-unit]');
      if (unit && unit.dataset.sgUnit !== st.unit) {
        st.unit = unit.dataset.sgUnit;
        $$('[data-sg-unit]', root).forEach(b => b.classList.toggle('on', b === unit));
        $('.sg-unit', root).classList.toggle('in', st.unit === 'in');
        render(false);
        renderValues(true);
        return;
      }
      const chip = e.target.closest('[data-sg-sizes] button');
      if (chip) { selectSize(chip.dataset.size); return; }
      const tr = e.target.closest('[data-sg-table] tbody tr');
      if (tr) { selectSize(tr.dataset.size); return; }
      const fit = e.target.closest('[data-sg-fit]');
      if (fit) { st.fit = +fit.dataset.sgFit; $$('[data-sg-fit]', root).forEach(b => b.classList.toggle('on', b === fit)); recommend(true); return; }
      if (e.target.closest('[data-sg-calc-toggle]')) {
        const c = $('[data-sg-calc]', root);
        c.classList.toggle('open');
        $('[data-sg-calc-toggle]', root).setAttribute('aria-expanded', c.classList.contains('open'));
        return;
      }
      if (e.target.closest('[data-sg-reco-use]')) { selectSize($('[data-sg-reco]', root).textContent); return; }
      if (e.target.closest('[data-sg-apply]')) {
        const size = current()?.size;
        const btn = [...document.querySelectorAll('.psizes button[data-value]')].find(b => b.dataset.value.toUpperCase() === String(size).toUpperCase());
        closeLayer('sizeguide');
        if (btn && !btn.disabled) setTimeout(() => btn.click(), 200);
        else if (btn) toast(`Size ${size} is currently sold out in this variant.`);
        else toast(`Size ${size} isn't available for this product.`);
      }
    });

    /* Maß hervorheben, wenn man über die Legende fährt */
    const legend = $('[data-sg-legend]', root);
    legend.addEventListener('mouseover', e => {
      const li = e.target.closest('[data-hl]');
      const model = $(`[data-sg-model="${st.tab}"]`, root);
      $$('.sg-m', model).forEach(m => {
        m.classList.toggle('hl', !!li && m.dataset.m === li.dataset.hl);
        m.classList.toggle('dim', !!li && m.dataset.m !== li.dataset.hl);
      });
    });
    legend.addEventListener('mouseleave', () => $$('.sg-m', root).forEach(m => m.classList.remove('hl', 'dim')));

    /* Größenrechner */
    function recommend(animate) {
      const h = +$('[data-sg-in="h"]', root).value;
      const w = +$('[data-sg-in="w"]', root).value;
      $('[data-sg-out="h"]', root).textContent = `${h} cm`;
      $('[data-sg-out="w"]', root).textContent = `${w} kg`;
      let idx = w < 58 ? 1 : w < 66 ? 2 : w < 76 ? 3 : w < 86 ? 4 : w < 97 ? 5 : 6;
      if (h > 188) idx += 1;
      if (h < 163) idx -= 1;
      idx += st.fit;
      const available = rows().map(r => r.size.toUpperCase());
      let best = rows()[0]?.size || 'M', bestDist = 99;
      available.forEach((sz, i) => {
        const o = ORDER.indexOf(sz);
        const d = o === -1 ? 99 : Math.abs(o - idx);
        if (d < bestDist) { bestDist = d; best = rows()[i].size; }
      });
      const out = $('[data-sg-reco]', root);
      if (out.textContent !== best) { out.textContent = best; if (animate) restartAnim(out, 'tick'); }
    }
    $$('[data-sg-in]', root).forEach(inp => inp.addEventListener('input', () => recommend(true)));

    /* Modell drehen: ziehen oder Maus bewegen */
    let drag = null, ry = 0, rx = 0, backT;
    const setRot = () => { tilt.style.setProperty('--ry', ry + 'deg'); tilt.style.setProperty('--rx', rx + 'deg'); };
    stage.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, ry, rx };
      stage.classList.add('dragging', 'interact');
      stage.setPointerCapture?.(e.pointerId);
      clearTimeout(backT);
    });
    stage.addEventListener('pointermove', e => {
      if (drag) {
        ry = Math.max(-45, Math.min(45, drag.ry + (e.clientX - drag.x) * 0.45));
        rx = Math.max(-14, Math.min(14, drag.rx - (e.clientY - drag.y) * 0.2));
        setRot();
      } else if (e.pointerType === 'mouse' && !calm()) {
        const r = stage.getBoundingClientRect();
        ry = ((e.clientX - r.left) / r.width - 0.5) * 16;
        rx = -((e.clientY - r.top) / r.height - 0.5) * 8;
        stage.classList.add('interact');
        setRot();
      }
    });
    const release = () => {
      if (!drag) return;
      drag = null;
      stage.classList.remove('dragging');
      backT = setTimeout(() => { ry = 0; rx = 0; setRot(); stage.classList.remove('interact'); }, 1400);
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('pointerleave', () => { if (!drag) { ry = 0; rx = 0; setRot(); stage.classList.remove('interact'); } });

    /* Beim Öffnen: aktuelle Produktgröße übernehmen und Maße neu zeichnen */
    document.addEventListener('click', e => {
      if (!e.target.closest('[data-open="sizeguide"]')) return;
      const ps = productSize();
      if (ps && rows().some(r => r.size === ps)) st.size = ps;
      requestAnimationFrame(() => render(true));
    });
    window.addEventListener('resize', moveInk);
    render(false);
  })();

  /* =========================================================
     KUNDEN-SEITEN
     ========================================================= */
  document.addEventListener('click', e => {
    const r = e.target.closest('[data-recover-toggle]');
    if (!r) return;
    e.preventDefault();
    document.getElementById('recover')?.classList.toggle('show');
  });
  $$('select[data-default]').forEach(sel => { if (sel.dataset.default) sel.value = sel.dataset.default; });
})();
