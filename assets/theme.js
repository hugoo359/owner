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

    /* Galerie: Desktop = Überblenden, Tablet/Handy = mit dem Finger wischen (Scroll-Snap) */
    const gallery = $('[data-gallery]', sec);
    const slides = $$('[data-media-main]', sec);
    const swipeMQ = matchMedia('(max-width: 1100px)');
    const isSwipe = () => swipeMQ.matches && slides.length > 1;
    const countNow = $('[data-count-now]', sec);
    const markActive = id => {
      $$('[data-thumbs] button', sec).forEach(b => b.classList.toggle('on', b.dataset.media === String(id)));
      $$('[data-dot]', sec).forEach(d => d.classList.toggle('on', d.dataset.dot === String(id)));
      const i = slides.findIndex(m => m.dataset.mediaMain === String(id));
      if (countNow && i > -1) countNow.textContent = i + 1;
    };
    const showMedia = (id, smooth = true) => {
      if (!id) return;
      const target = slides.find(m => m.dataset.mediaMain === String(id));
      if (!target) return;
      if (isSwipe()) {
        gallery.scrollTo({ left: target.offsetLeft, behavior: smooth && !calm() ? 'smooth' : 'auto' });
      } else {
        slides.forEach(m => {
          const on = m === target;
          m.classList.toggle('is-off', !on);
          if (!on) m.classList.remove('zooming');
        });
      }
      markActive(id);
    };
    if (gallery && slides.length > 1) {
      let raf = 0;
      gallery.addEventListener('scroll', () => {
        if (!isSwipe()) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const i = Math.round(gallery.scrollLeft / Math.max(1, gallery.clientWidth));
          const m = slides[Math.max(0, Math.min(slides.length - 1, i))];
          if (m) markActive(m.dataset.mediaMain);
        });
      }, { passive: true });
      /* Beim Wechsel Handy <-> Desktop das aktive Bild beibehalten */
      const sync = () => {
        const on = $('[data-thumbs] button.on', sec)?.dataset.media || slides[0].dataset.mediaMain;
        if (!isSwipe()) slides.forEach(m => m.classList.toggle('is-off', m.dataset.mediaMain !== String(on)));
        showMedia(on, false);
      };
      swipeMQ.addEventListener?.('change', sync);
      requestAnimationFrame(() => { if (isSwipe()) showMedia($('[data-thumbs] button.on', sec)?.dataset.media, false); });
    }

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
        m.addEventListener('click', () => { if (!isSwipe()) m.classList.toggle('zooming'); });
        m.addEventListener('mousemove', e => {
          const r = m.getBoundingClientRect();
          img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        });
        m.addEventListener('mouseleave', () => m.classList.remove('zooming'));
      });
    }

    /* Farb-Geschwister: Name beim Drüberfahren anzeigen */
    const sib = $('[data-siblings]', sec);
    const sibLabel = $('[data-sib-label]', sec);
    if (sib && sibLabel) {
      sib.addEventListener('mouseover', e => { const a = e.target.closest('[data-sib-name]'); if (a) sibLabel.textContent = a.dataset.sibName; });
      sib.addEventListener('mouseleave', () => { sibLabel.textContent = sibLabel.dataset.sibDefault; });
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
      document.dispatchEvent(new CustomEvent('grid:added', { detail: { cards: added } }));
    } catch (err) {
      b.disabled = false;
      b.textContent = 'Load more';
      toast('More products could not be loaded.');
    }
  });

  /* =========================================================
     KOLLEKTION: Schnellfilter (Fallback ohne Search & Discovery)
     Kategorie = Einzelauswahl, Farbe/Größe = Mehrfachauswahl,
     Zeilen werden mit UND verknüpft.
     ========================================================= */
  (function initQuickFilters() {
    const box = $('[data-qf]');
    const gridEl = $('#ProductGrid');
    if (!box || !gridEl) return;
    const rows = $$('[data-qf-row]', box);
    const stockBtn = $('[data-qf-stock]', box);
    const empty = $('[data-qf-empty]', gridEl);
    if (!rows.length && !stockBtn) return;

    const SIZE_ORDER = ['XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '4XL', '5XL'];
    const sizeRank = v => {
      const u = v.toUpperCase().trim();
      const i = SIZE_ORDER.indexOf(u);
      if (i > -1) return i;
      const n = parseFloat(u);
      return isNaN(n) ? 999 : 100 + n;
    };
    const sortRow = row => {
      const btns = $$('[data-qf-value]', row).sort((a, b) => sizeRank(a.dataset.qfValue) - sizeRank(b.dataset.qfValue));
      btns.forEach(b => row.appendChild(b));
    };
    $$('[data-qf-sort]', box).forEach(sortRow);

    const state = { type: '', colors: new Set(), sizes: new Set(), stock: false };
    const active = () => state.type || state.colors.size || state.sizes.size || state.stock;
    const has = (list, v) => (list || '').includes(`|${v}|`);

    function apply() {
      let shown = 0;
      $$('.card', gridEl).forEach(card => {
        const d = card.dataset;
        const ok =
          (!state.type || (d.fType || '') === state.type) &&
          (!state.colors.size || [...state.colors].some(c => has(d.fColors, c))) &&
          (!state.sizes.size || [...state.sizes].some(z => has(d.fSizes, z))) &&
          (!state.stock || d.fAvail === 'true');
        card.classList.toggle('qf-hide', !ok);
        if (ok) { shown++; card.classList.add('in'); }
      });
      if (empty) empty.hidden = shown > 0;
      const lm = $('#LoadMore');
      if (lm) lm.classList.toggle('is-hidden', !!active());
    }

    /* Damit alle Produkte gefiltert werden, beim ersten Filtern restliche Seiten nachladen */
    let loading = null;
    async function loadAll() {
      if (loading) return loading;
      loading = (async () => {
        let btn = $('#LoadMore [data-load-more]');
        box.classList.add('is-loading');
        while (btn) {
          try {
            const res = await fetch(btn.dataset.loadMore);
            const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
            const added = $$('#ProductGrid > .card', doc);
            added.forEach(c => { c.classList.add('in'); gridEl.insertBefore(c, empty || null); });
            addValues(added);
            const next = doc.getElementById('LoadMore');
            const wrap = document.getElementById('LoadMore');
            if (next) wrap.replaceWith(next); else wrap.remove();
            btn = $('#LoadMore [data-load-more]');
          } catch (e) { break; }
        }
        box.classList.remove('is-loading');
      })();
      return loading;
    }

    /* Neue Werte (Farben/Größen) aus nachgeladenen Produkten ergänzen */
    function addValues(cards) {
      const rowSizes = $('[data-qf-row="sizes"]', box);
      cards.forEach(card => {
        if (rowSizes) (card.dataset.fSizes || '').split('|').filter(Boolean).forEach(z => {
          if ($$('[data-qf-value]', rowSizes).some(b => b.dataset.qfValue === z)) return;
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'size-chip'; b.dataset.qfValue = z; b.textContent = z.toUpperCase();
          rowSizes.appendChild(b);
        });
      });
      if (rowSizes) sortRow(rowSizes);
    }

    box.addEventListener('click', async e => {
      const stock = e.target.closest('[data-qf-stock]');
      const btn = e.target.closest('[data-qf-value],[data-qf-all]');
      if (!stock && !btn) return;
      e.preventDefault();
      if (stock) {
        state.stock = !state.stock;
        stock.classList.toggle('on', state.stock);
        stock.setAttribute('aria-pressed', state.stock);
      } else {
        const row = btn.closest('[data-qf-row]');
        const key = row.dataset.qfRow;
        if (key === 'type') {
          state.type = btn.dataset.qfAll !== undefined ? '' : btn.dataset.qfValue;
          $$('.pill', row).forEach(p => p.classList.toggle('on', p === btn));
        } else {
          const v = btn.dataset.qfValue;
          const set = state[key];
          if (set.has(v)) set.delete(v); else set.add(v);
          btn.classList.toggle('on', set.has(v));
        }
      }
      apply();
      if (active() && $('#LoadMore [data-load-more]')) { await loadAll(); apply(); }
    });

    gridEl.addEventListener('click', e => {
      if (!e.target.closest('[data-qf-reset]')) return;
      state.type = ''; state.colors.clear(); state.sizes.clear(); state.stock = false;
      $$('[data-qf-value],[data-qf-stock]', box).forEach(b => b.classList.remove('on'));
      $$('[data-qf-all]', box).forEach(b => b.classList.add('on'));
      apply();
    });
    document.addEventListener('grid:added', e => { addValues(e.detail.cards); apply(); });
  })();

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
     GRÖSSENBERATER: nur noch der Größenrechner
     ========================================================= */
  (function initSizeGuide() {
    const root = $('[data-sg]');
    if (!root) return;
    document.addEventListener('click', e => {
      if (e.target.closest('[data-open="sizeguide"]')) root.dispatchEvent(new CustomEvent('sg:open'));
    });
    initFinder(root);
  })();

  /* =========================================================
     GRÖSSENRECHNER „Find your size“
     Schätzt aus Geschlecht, Körpergröße und Gewicht den Brustumfang und vergleicht ihn
     mit gängigen Konfektionstabellen (Brustumfang am Körper, nicht am Kleidungsstück).

     Brustumfang ≈ k · √(Gewicht / Größe): Gewicht/Größe entspricht dem mittleren
     Körperquerschnitt, dessen Wurzel proportional zum Umfang ist. k ist an die
     Mittelwerte der ANSUR-II-Körpervermessung angepasst
     (Männer 175,6 cm / 85,5 kg / 105,9 cm Brust, Frauen 162,9 cm / 67,8 kg / 94,9 cm).
     Größentabellen (Körper-Brustumfang in cm, Mitte der jeweiligen Spanne) gemittelt aus
     ASOS, Schöffel, Lidl, Under Armour, Lacoste. Die Körpergröße fließt zu 20 % ein
     (Länge von Ärmeln und Rumpf). Bundweite für Jeans = Brust minus 15 cm (Herren) bzw.
     16 cm (Damen), wie in den ASOS-/Levi’s-Tabellen.
     ========================================================= */
  function initFinder(root) {
    const form = $('[data-sgf-form]', root);
    if (!form) return;
    const LETTERS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const BODY = {
      men: {
        k: 151.9, drop: 15,
        chest: [83.5, 88.5, 93.5, 98.5, 103.5, 109, 115, 122],
        height: [164, 168, 173, 178, 183, 188, 192, 195]
      },
      women: {
        k: 147.1, drop: 16,
        chest: [75.5, 80.5, 85.5, 91, 97, 103.5, 110.5, 117],
        height: [154, 158, 163, 168, 172, 176, 180, 183]
      }
    };
    const KEY = 'size-finder';
    const FIT_LABEL = { '-1': 'tighter', 0: 'regular', 1: 'looser' };
    const offset = parseFloat(root.dataset.offset) || 0;
    const out = $('[data-sgf-out]', root);
    const emptyBox = $('[data-sgf-empty]', root);
    const err = $('[data-sgf-err]', root);
    const link = $('[data-sg-link]');
    const linkText = $('[data-sg-link-text]');
    const linkDefault = linkText ? linkText.textContent : '';
    const st = { g: null, fit: 0, result: null };

    const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
    const save = p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} };

    /* Stückweise lineare Position in einer Tabelle (0 = XXS, 3 = M ...), auch über die Ränder hinaus */
    function pos(arr, x) {
      const n = arr.length - 1;
      if (x <= arr[0]) return (x - arr[0]) / (arr[1] - arr[0]);
      for (let i = 0; i < n; i++) if (x <= arr[i + 1]) return i + (x - arr[i]) / (arr[i + 1] - arr[i]);
      return n + (x - arr[n]) / (arr[n] - arr[n - 1]);
    }
    function valAt(arr, f) {
      const n = arr.length - 1;
      const i = Math.max(0, Math.min(n - 1, Math.floor(f)));
      return arr[i] + (f - i) * (arr[i + 1] - arr[i]);
    }
    const norm = v => {
      const u = String(v).toUpperCase().replace(/\s+/g, '');
      return ({ XXXL: '3XL', '2XL': 'XXL', XXXS: 'XXS' })[u] || u;
    };

    /* Größen des Produkts (inkl. ausverkaufter) */
    function productSizes() {
      const btns = $$('[data-size-group] button[data-value]');
      if (btns.length) return btns.map(b => ({ label: b.dataset.value, sold: b.disabled, btn: b }));
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(l => ({ label: l, sold: false, btn: null }));
    }

    function calc(p) {
      const B = BODY[p.g];
      const chest = B.k * Math.sqrt(p.w / p.h);
      let f = 0.8 * pos(B.chest, chest) + 0.2 * pos(B.height, p.h);
      f += offset + p.fit * 0.6;
      const sizes = productSizes();
      const nums = sizes.map(s => parseFloat(s.label)).filter(n => !isNaN(n));
      const numeric = nums.length && nums.length === sizes.length;
      let pick, alt = null, dir = 0;

      const nearestBy = (score) => sizes.reduce((best, s) => (score(s) < score(best) ? s : best), sizes[0]);

      if (numeric) {
        /* Zahlengrößen: Jeans-Bundweite (Inch) oder EU/DE-Konfektionsgröße */
        const eqChest = valAt(B.chest, f);
        const even = nums.every(n => n % 2 === 0);
        let target;
        if (p.g === 'men' && Math.min(...nums) >= 42) target = eqChest / 2;               // EU Herren 44–58
        else if (p.g === 'women' && even && Math.min(...nums) >= 30 && Math.max(...nums) <= 54) target = eqChest / 2 - 7; // DE Damen 32–48
        else target = (eqChest - B.drop) / 2.54;                                             // Jeans W26–W38
        pick = nearestBy(s => Math.abs(parseFloat(s.label) - target));
        const sorted = [...sizes].sort((a, b) => parseFloat(a.label) - parseFloat(b.label));
        const i = sorted.indexOf(pick);
        const diff = target - parseFloat(pick.label);
        const step = Math.abs(parseFloat((sorted[i + 1] || sorted[i - 1] || pick).label) - parseFloat(pick.label)) || 1;
        if (Math.abs(diff) > step * 0.3) { dir = diff > 0 ? 1 : -1; alt = sorted[i + dir] || null; }
      } else {
        const idx = Math.round(f);
        const rank = s => { const r = LETTERS.indexOf(norm(s.label)); return r === -1 ? 99 : r; };
        pick = nearestBy(s => Math.abs(rank(s) - idx) + (rank(s) === 99 ? 50 : 0));
        const d = f - Math.floor(f);
        if (d > 0.35 && d < 0.65) {
          dir = rank(pick) > f ? -1 : 1;
          alt = sizes.find(s => rank(s) === rank(pick) + dir) || null;
        }
      }
      return { pick, alt, dir, chest: Math.round(chest) };
    }

    function setLink(res) {
      if (!link || !linkText) return;
      if (res) {
        linkText.textContent = `We recommend size ${res.pick.label}`;
        link.classList.add('has-reco');
      } else {
        linkText.textContent = linkDefault;
        link.classList.remove('has-reco');
      }
    }

    function show(p, res, animate) {
      st.result = res;
      emptyBox.hidden = true;
      out.hidden = false;
      const sizeEl = $('[data-sgf-size]', root);
      sizeEl.textContent = res.pick.label;
      if (animate) restartAnim(sizeEl, 'tick');
      const fitTxt = FIT_LABEL[p.fit];
      let why = `Based on: ${p.g === 'men' ? 'Men' : 'Women'} · ${p.h} cm · ${p.w} kg · ${fitTxt} fit.`;
      if (offset < 0) why += ' This item runs large – we have taken that into account.';
      if (offset > 0) why += ' This item runs small – we have taken that into account.';
      $('[data-sgf-why]', root).textContent = why;
      const altEl = $('[data-sgf-alt]', root);
      if (res.alt) {
        altEl.hidden = false;
        altEl.textContent = res.dir > 0
          ? `You are between two sizes. For a looser fit choose ${res.alt.label}.`
          : `You are between two sizes. For a closer fit choose ${res.alt.label}.`;
      } else altEl.hidden = true;
      $('[data-sgf-scale]', root).innerHTML = productSizes().map(s =>
        `<span class="${s.label === res.pick.label ? 'on' : ''}${res.alt && s.label === res.alt.label ? ' alt' : ''}${s.sold ? ' sold' : ''}">${s.label}</span>`).join('');
      const apply = $('[data-sgf-apply]', root);
      const lab = $('[data-sgf-apply-label]', root);
      apply.hidden = !res.pick.btn;
      apply.disabled = !!res.pick.sold;
      lab.textContent = res.pick.sold ? `Size ${res.pick.label} is sold out` : `Select size ${res.pick.label}`;
      setLink(res);
    }

    /* Formular */
    const hIn = $('[data-sgf-in="h"]', root), wIn = $('[data-sgf-in="w"]', root);
    const hR = $('[data-sgf-range="h"]', root), wR = $('[data-sgf-range="w"]', root);
    const setGender = g => {
      st.g = g;
      $$('[data-sgf-gender]', root).forEach(b => { const on = b.dataset.sgfGender === g; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    };
    const setFit = f => {
      st.fit = f;
      $$('[data-sgf-fit]', root).forEach(b => { const on = +b.dataset.sgfFit === f; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    };
    [[hIn, hR], [wIn, wR]].forEach(([num, rng]) => {
      rng.addEventListener('input', () => { num.value = rng.value; live(); });
      num.addEventListener('input', () => { if (num.value) rng.value = num.value; live(); });
    });
    root.addEventListener('click', e => {
      const g = e.target.closest('[data-sgf-gender]');
      if (g) { setGender(g.dataset.sgfGender); err.textContent = ''; live(); return; }
      const f = e.target.closest('[data-sgf-fit]');
      if (f) { setFit(+f.dataset.sgfFit); live(); return; }
      if (e.target.closest('[data-sgf-edit]')) { hIn.focus(); form.scrollIntoView?.({ block: 'start', behavior: calm() ? 'auto' : 'smooth' }); return; }
      if (e.target.closest('[data-sgf-apply]') && st.result?.pick?.btn) {
        const btn = st.result.pick.btn;
        closeLayer('sizeguide');
        if (!btn.disabled) setTimeout(() => btn.click(), 200);
      }
    });

    function read(strict) {
      const h = Math.round(+hIn.value), w = Math.round(+wIn.value);
      if (!st.g) return strict ? 'Please choose men or women.' : null;
      if (!h || h < 140 || h > 215) return strict ? 'Please enter your height between 140 and 215 cm.' : null;
      if (!w || w < 35 || w > 180) return strict ? 'Please enter your weight between 35 and 180 kg.' : null;
      const bmi = w / Math.pow(h / 100, 2);
      if (bmi < 14 || bmi > 55) return strict ? 'Please check your height and weight.' : null;
      return { g: st.g, h, w, fit: st.fit };
    }
    let shown = false;
    function run(strict, animate) {
      const p = read(strict);
      if (typeof p === 'string') { err.textContent = p; return; }
      if (!p) return;
      err.textContent = '';
      save(p);
      show(p, calc(p), animate);
      shown = true;
    }
    function live() { if (shown) run(false, true); }
    form.addEventListener('submit', e => {
      e.preventDefault();
      run(true, true);
      if (shown && matchMedia('(max-width: 820px)').matches) $('[data-sgf-result]', root).scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
    });

    /* Gespeicherte Angaben übernehmen -> Empfehlung direkt am Link zeigen (wie „Wir empfehlen Größe XS“) */
    const saved = load();
    if (saved && BODY[saved.g]) {
      setGender(saved.g);
      setFit([-1, 0, 1].includes(saved.fit) ? saved.fit : 0);
      hIn.value = hR.value = saved.h;
      wIn.value = wR.value = saved.w;
      run(false, false);
    }
    /* Nach Variantenwechsel (z. B. Größe ausverkauft) Ergebnis aktualisieren */
    root.addEventListener('sg:open', () => { if (shown) run(false, false); });
  }

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
