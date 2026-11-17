/* ==========================================================================
   HIGISHOP — Landing Page
   Módulos: Header · Menu mobile · Scrollspy · Reveal · Split de texto ·
            Parallax · Spotlight · Tilt 3D · Botões magnéticos ·
            Bolhas (canvas) · Vídeo (lazy YouTube) · Utilidades
   ========================================================================== */
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ------------------------------------------------------------------
     Scroll global (rAF) — alimenta header, progresso, parallax e "topo"
  ------------------------------------------------------------------ */
  const ScrollEffects = {
    init() {
      this.header   = $('#header');
      this.progress = $('#progress');
      this.toTop    = $('#toTop');
      this.parallax = $$('[data-parallax]');
      this.ticking  = false;

      window.addEventListener('scroll', () => this.request(), { passive: true });
      window.addEventListener('resize', () => this.request(), { passive: true });
      this.toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      this.update();
    },
    request() {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => { this.update(); this.ticking = false; });
    },
    update() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;

      this.header?.classList.toggle('is-scrolled', y > 10);
      if (this.progress) this.progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      this.toTop?.classList.toggle('is-visible', y > 700);

      this.parallax.forEach(el => {
        if (y > window.innerHeight * 1.2) return; // fora da vista
        el.style.transform = `translate3d(0, ${y * parseFloat(el.dataset.parallax)}px, 0)`;
      });
    }
  };

  /* ------------------------------------------------------------------
     Menu mobile
  ------------------------------------------------------------------ */
  const MobileMenu = {
    init() {
      this.btn = $('#burger');
      this.nav = $('#nav');
      if (!this.btn || !this.nav) return;

      this.btn.addEventListener('click', () => this.toggle());
      $$('a', this.nav).forEach(a => a.addEventListener('click', () => this.toggle(false)));
      document.addEventListener('keydown', e => { if (e.key === 'Escape') this.toggle(false); });
      document.addEventListener('click', e => {
        if (!this.nav.classList.contains('is-open')) return;
        if (!this.nav.contains(e.target) && !this.btn.contains(e.target)) this.toggle(false);
      });
      window.matchMedia('(min-width: 1024px)').addEventListener('change', () => this.toggle(false));
    },
    toggle(force) {
      const open = typeof force === 'boolean' ? force : !this.nav.classList.contains('is-open');
      this.nav.classList.toggle('is-open', open);
      this.btn.setAttribute('aria-expanded', String(open));
      this.btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    }
  };

  /* ------------------------------------------------------------------
     Scrollspy — destaca o link da seção visível
  ------------------------------------------------------------------ */
  const ScrollSpy = {
    init() {
      const links = $$('[data-spy]');
      if (!links.length || !('IntersectionObserver' in window)) return;

      const map = new Map(links.map(l => [l.dataset.spy, l]));
      const sections = [...map.keys()].map(id => document.getElementById(id)).filter(Boolean);

      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          links.forEach(l => l.classList.remove('is-active'));
          map.get(entry.target.id)?.classList.add('is-active');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });

      sections.forEach(s => io.observe(s));
    }
  };

  /* ------------------------------------------------------------------
     Reveal — animações de entrada ao rolar (com stagger automático)
  ------------------------------------------------------------------ */
  const Reveal = {
    init() {
      // stagger: filhos de [data-stagger] recebem atraso incremental
      $$('[data-stagger]').forEach(group => {
        $$(':scope > .reveal', group).forEach((el, i) => el.style.setProperty('--d', `${i * 0.1}s`));
      });

      const items = $$('.reveal');
      if (!('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('is-visible'));
        return;
      }

      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

      items.forEach(el => io.observe(el));
    }
  };

  /* ------------------------------------------------------------------
     Split de texto — título do hero entra palavra por palavra
  ------------------------------------------------------------------ */
  const SplitText = {
    init() {
      $$('[data-split]').forEach(el => {
        let index = 0;
        const wrap = node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            node.textContent.split(/(\s+)/).forEach(part => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.append(' '); return; }
              const outer = document.createElement('span');
              const inner = document.createElement('span');
              outer.className = 'word';
              inner.textContent = part;
              inner.style.setProperty('--i', index++);
              outer.append(inner);
              frag.append(outer);
            });
            node.replaceWith(frag);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            [...node.childNodes].forEach(wrap);
          }
        };
        [...el.childNodes].forEach(wrap);
      });
    }
  };

  /* ------------------------------------------------------------------
     Spotlight — luz que acompanha o mouse no hero
  ------------------------------------------------------------------ */
  const Spotlight = {
    init() {
      const hero = $('.hero');
      if (!hero || !hasFinePointer) return;
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
        hero.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    }
  };

  /* ------------------------------------------------------------------
     Tilt 3D — cards inclinam seguindo o cursor + reflexo
  ------------------------------------------------------------------ */
  const Tilt = {
    max: 7,
    init() {
      if (!hasFinePointer) return;
      $$('[data-tilt]').forEach(card => {
        card.addEventListener('pointermove', e => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          card.style.setProperty('--ry', `${(px - 0.5) * this.max * 2}deg`);
          card.style.setProperty('--rx', `${(0.5 - py) * this.max * 2}deg`);
          card.style.setProperty('--gx', `${px * 100}%`);
          card.style.setProperty('--gy', `${py * 100}%`);
        });
        card.addEventListener('pointerleave', () => {
          card.style.setProperty('--rx', '0deg');
          card.style.setProperty('--ry', '0deg');
        });
      });
    }
  };

  /* ------------------------------------------------------------------
     Botões magnéticos
  ------------------------------------------------------------------ */
  const Magnetic = {
    strength: 0.25,
    init() {
      if (!hasFinePointer) return;
      $$('[data-magnetic]').forEach(btn => {
        btn.addEventListener('pointermove', e => {
          const r = btn.getBoundingClientRect();
          btn.style.setProperty('--mx', `${(e.clientX - (r.left + r.width / 2)) * this.strength}px`);
          btn.style.setProperty('--my', `${(e.clientY - (r.top + r.height / 2)) * this.strength}px`);
        });
        btn.addEventListener('pointerleave', () => {
          btn.style.setProperty('--mx', '0px');
          btn.style.setProperty('--my', '0px');
        });
      });
    }
  };

  /* ------------------------------------------------------------------
     Bolhas — canvas com bolhas de ar subindo no hero (tema higiene)
  ------------------------------------------------------------------ */
  const Bubbles = {
    init() {
      this.canvas = $('#bubbles');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.bubbles = [];
      this.running = false;
      this.resize();

      window.addEventListener('resize', () => this.resize(), { passive: true });
      new IntersectionObserver(([entry]) => {
        entry.isIntersecting ? this.start() : this.stop();
      }).observe(this.canvas);
    },
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = this.canvas;
      this.w = w; this.h = h;
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(34, Math.max(14, w / 45)));
      this.bubbles = Array.from({ length: count }, () => this.create(true));
    },
    create(randomY = false) {
      return {
        x: Math.random() * this.w,
        y: randomY ? Math.random() * this.h : this.h + 20,
        r: 3 + Math.random() * 16,
        speed: 0.25 + Math.random() * 0.8,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.008 + Math.random() * 0.014,
        alpha: 0.12 + Math.random() * 0.3
      };
    },
    start() {
      if (this.running) return;
      this.running = true;
      const loop = () => {
        if (!this.running) return;
        this.draw();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
    stop() { this.running = false; },
    draw() {
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);
      this.bubbles.forEach((b, i) => {
        b.y -= b.speed;
        b.drift += b.driftSpeed;
        const x = b.x + Math.sin(b.drift) * 22;

        if (b.y < -b.r * 2) { this.bubbles[i] = this.create(); return; }

        const g = ctx.createRadialGradient(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, x, b.y, b.r);
        g.addColorStop(0, `rgba(255,255,255,${b.alpha + 0.25})`);
        g.addColorStop(0.55, `rgba(53,197,238,${b.alpha * 0.35})`);
        g.addColorStop(1, `rgba(0,136,180,${b.alpha * 0.15})`);

        ctx.beginPath();
        ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(255,255,255,${b.alpha * 0.8})`;
        ctx.stroke();
      });
    }
  };

  /* ------------------------------------------------------------------
     Vídeo — carrega o iframe do YouTube só ao clicar (performance)
  ------------------------------------------------------------------ */
  const Video = {
    init() {
      const frame = $('#video');
      if (!frame) return;
      const load = () => {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${frame.dataset.yt}?autoplay=1&rel=0`;
        iframe.title = 'Consultoria Técnica Higishop';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;
        frame.replaceChildren(iframe);
        frame.style.cursor = 'default';
      };
      frame.addEventListener('click', load, { once: true });
    }
  };

  /* ------------------------------------------------------------------
     Utilidades — ano do rodapé
  ------------------------------------------------------------------ */
  const Utils = {
    init() {
      const year = $('#year');
      if (year) year.textContent = new Date().getFullYear();
    }
  };

  /* ------------------------------------------------------------------
     Boot
  ------------------------------------------------------------------ */
  const boot = () => {
    SplitText.init();   // antes do Reveal para o título já estar dividido
    ScrollEffects.init();
    MobileMenu.init();
    ScrollSpy.init();
    Reveal.init();
    Spotlight.init();
    Tilt.init();
    Magnetic.init();
    Bubbles.init();
    Video.init();
    Utils.init();
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
})();
