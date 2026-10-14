"use client";

import { useEffect, useState, type RefObject } from "react";

// Port dari libraries/serahin-docs/design/serahin/assets/js/main.js — logika
// interaksi sama persis, cuma dipindah dari document.querySelector global ke
// refs React supaya aman dipakai berkali-kali per halaman tanpa bentrok.

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function debounce<Args extends unknown[]>(fn: (...args: Args) => void, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** `is-loaded` sekali di awal — dipakai animasi urutan muat Hero. */
export function usePageLoaded() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const go = () =>
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!cancelled) setLoaded(true); }));
    if (typeof document !== "undefined" && document.fonts?.ready) {
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(go);
    } else go();
    return () => { cancelled = true; };
  }, []);
  return loaded;
}

/** Header: shadow saat scroll + highlight link nav sesuai section terlihat. */
export function useHeaderScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/** Reveal-on-scroll untuk elemen ber-[data-reveal] di dalam containerRef. */
export function useReveal(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const fan = root.querySelector<HTMLElement>("[data-fan]");
    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      els.forEach((el) => el.removeAttribute("data-reveal"));
      fan?.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          if (el === fan) { el.classList.add("is-in"); return; }
          el.classList.add("is-in");
          const delay = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
          setTimeout(() => { el.removeAttribute("data-reveal"); el.classList.remove("is-in"); }, delay * 1000 + 1150);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => io.observe(el));
    if (fan) io.observe(fan);
    return () => io.disconnect();
  }, [containerRef]);
}

/** Progres 0..1 scroll di dalam satu section tinggi (section.offsetHeight - 100vh). */
function sectionProgress(section: HTMLElement) {
  const rect = section.getBoundingClientRect();
  const scrollable = section.offsetHeight - window.innerHeight;
  return scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
}

/** Cara Kerja — kartu langkah yang "terkunci" (pinned) saat scroll di desktop. */
export function usePinnedSteps(sectionRef: RefObject<HTMLElement | null>, stepCount: number) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const steps = Array.from(section.querySelectorAll<HTMLElement>("[data-step]"));
    if (steps.length === 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mq = window.matchMedia("(min-width: 1024px) and (min-height: 680px)");
    const TILT = [-2, 1.5, -1.5];
    let pinned = false, cardH = 0, gap = 0, raf = 0, last = -1;

    const measure = () => {
      steps.forEach((s) => { s.style.minHeight = ""; });
      cardH = Math.max(...steps.map((s) => s.offsetHeight));
      steps.forEach((s) => { s.style.minHeight = cardH + "px"; });
      gap = Math.min(170, window.innerHeight * 0.18);
      steps.forEach((s) => s.style.setProperty("--gap", gap + "px"));
    };

    const layout = (revealed: number) => {
      const focus = revealed - 1;
      const FOCUS_Y = revealed === 1 ? 0 : cardH * 0.95;
      steps.forEach((s, i) => {
        const d = i - focus;
        let y: number, rot: number, op = 1;
        if (d < 0) {
          y = FOCUS_Y + d * cardH * 0.95;
          rot = 1.5;
          if (d < -1) op = 0;
        } else if (d === 0) {
          y = FOCUS_Y;
          rot = 0;
        } else {
          y = FOCUS_Y + cardH + gap + (d - 1) * cardH * 0.95;
          rot = TILT[(d - 1) % 3];
        }
        s.classList.toggle("is-done", d < 0);
        s.classList.toggle("is-active", d === 0);
        s.classList.toggle("is-pending", d > 0);
        s.classList.toggle("is-linked", d === 0 && i < steps.length - 1);
        s.style.setProperty("--y", `${y}px`);
        s.style.setProperty("--rot", `${rot}deg`);
        s.style.opacity = String(op);
        s.style.zIndex = String(d === 0 ? 10 : d < 0 ? 5 + d : 1 + d);
        s.setAttribute("aria-current", d === 0 ? "step" : "false");
      });
    };

    const update = () => {
      raf = 0;
      const p = sectionProgress(section);
      const revealed = clamp(1 + Math.floor(p * 3.6), 1, steps.length);
      if (revealed !== last) { last = revealed; layout(revealed); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

    const staticUpdate = () => {
      if (pinned) return;
      const line = window.innerHeight * 0.62;
      let idx = 0;
      steps.forEach((s, i) => { if (s.getBoundingClientRect().top < line) idx = i; });
      steps.forEach((s, i) => {
        s.classList.toggle("is-active", i === idx);
        s.classList.toggle("is-done", i < idx);
      });
    };
    const onStaticScroll = () => requestAnimationFrame(staticUpdate);

    const enable = () => {
      pinned = true; last = -1;
      section.classList.add("is-pinned");
      measure(); update();
      window.addEventListener("scroll", onScroll, { passive: true });
    };
    const disable = () => {
      pinned = false;
      section.classList.remove("is-pinned");
      window.removeEventListener("scroll", onScroll);
      steps.forEach((s) => {
        s.classList.remove("is-done", "is-pending", "is-linked");
        s.removeAttribute("style");
        s.removeAttribute("aria-current");
      });
      staticUpdate();
    };

    const decide = () => {
      const want = mq.matches && !reduceMotion.matches;
      if (want && !pinned) enable();
      else if (!want && pinned) disable();
      else if (want) { measure(); last = -1; update(); }
      else if (!pinned) disable();
    };

    decide();
    window.addEventListener("scroll", onStaticScroll, { passive: true });
    const onResize = debounce(decide, 150);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onStaticScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [sectionRef, stepCount]);
}

/** Testimonial — stack kartu yang berganti fokus saat scroll di desktop, swipe carousel di mobile. */
export function usePinnedTestimonials(sectionRef: RefObject<HTMLElement | null>, cardCount: number) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const track = section.querySelector<HTMLElement>("[data-testi-track]");
    const cards = Array.from(section.querySelectorAll<HTMLElement>("[data-tcard]"));
    const glow = section.querySelector<HTMLElement>("[data-testi-glow]");
    const counter = section.querySelector<HTMLElement>("[data-testi-current]");
    if (!track || cards.length === 0 || !counter) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mq = window.matchMedia("(min-width: 1024px) and (min-height: 640px)");
    let pinned = false, current = -1, raf = 0;

    const setActive = (idx: number) => {
      if (idx === current) return;
      current = idx;
      counter.textContent = String(idx + 1).padStart(2, "0");
      cards.forEach((c, i) => c.classList.toggle("is-focus", i === idx));
      if (!pinned) return;
      if (glow) glow.dataset.tone = cards[idx].dataset.glow;
      cards.forEach((c, i) => {
        const d = i - idx;
        if (d < 0) {
          c.style.setProperty("--ty", "-90px"); c.style.setProperty("--sc", ".94");
          c.style.setProperty("--rot", "-7deg"); c.style.setProperty("--op", "0");
        } else {
          c.style.setProperty("--ty", `${d * 36}px`); c.style.setProperty("--sc", String(1 - d * 0.045));
          c.style.setProperty("--rot", "0deg"); c.style.setProperty("--op", d > 3 ? "0" : "1");
        }
        c.style.zIndex = String(d === 0 ? 30 : 20 - Math.abs(d));
        c.classList.toggle("is-ghost", d > 0);
        c.classList.toggle("is-focus", d === 0);
        c.setAttribute("aria-hidden", String(d !== 0));
      });
    };

    const onPinnedScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const p = sectionProgress(section);
        setActive(clamp(Math.floor(p * cards.length * 0.999), 0, cards.length - 1));
      });
    };
    const onTrackScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const mid = track.scrollLeft + track.clientWidth / 2;
        let best = 0, bestD = Infinity;
        cards.forEach((c, i) => {
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
          if (d < bestD) { bestD = d; best = i; }
        });
        setActive(best);
      });
    };

    const enable = () => {
      pinned = true; current = -1;
      section.classList.add("is-pinned");
      track.removeEventListener("scroll", onTrackScroll);
      window.addEventListener("scroll", onPinnedScroll, { passive: true });
      onPinnedScroll();
    };
    const disable = () => {
      pinned = false; current = -1;
      section.classList.remove("is-pinned");
      window.removeEventListener("scroll", onPinnedScroll);
      cards.forEach((c) => { c.removeAttribute("style"); c.classList.remove("is-ghost", "is-focus"); c.removeAttribute("aria-hidden"); });
      track.addEventListener("scroll", onTrackScroll, { passive: true });
      setActive(0);
    };

    const decide = () => {
      const want = mq.matches && !reduceMotion.matches;
      if (want && !pinned) enable();
      else if (!want && (pinned || current === -1)) disable();
    };
    decide();
    const onResize = debounce(decide, 150);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onPinnedScroll);
      track.removeEventListener("scroll", onTrackScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [sectionRef, cardCount]);
}

type ChipBody = {
  el: HTMLElement; i: number;
  x: number; y: number; vx: number; vy: number; a: number; va: number;
  hx: number; hy: number; ha: number; w: number; h: number;
  drag: boolean; ox: number; oy: number; lx: number; ly: number;
};

/** Playground — chip yang saling tolak dari pointer dan bisa di-drag/lempar. */
export function usePlayground(arenaRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const chips = Array.from(arena.querySelectorAll<HTMLElement>("[data-chip]"));
    if (chips.length === 0) return;
    const MOBILE: [number, number, number][] = [
      [0.3, 0.16, -6], [0.27, 0.5, 0], [0.76, 0.5, 0], [0.68, 0.17, 6], [0.72, 0.82, 4], [0.3, 0.84, -4],
    ];
    const bodies: ChipBody[] = chips.map((el, i) => ({
      el, i, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0,
      hx: 0, hy: 0, ha: 0, w: 0, h: 0, drag: false, ox: 0, oy: 0, lx: 0, ly: 0,
    }));
    const FLOOR = 44;
    let W = 0, H = 0, running = false, visible = false, settledFrames = 0;
    let pointer: { x: number; y: number } | null = null;

    const layoutHome = (snap: boolean) => {
      W = arena.clientWidth; H = arena.clientHeight - FLOOR;
      const narrow = W < 640;
      bodies.forEach((b) => {
        b.w = b.el.offsetWidth; b.h = b.el.offsetHeight;
        const d = b.el.dataset;
        const [fx, fy, fr] = narrow ? MOBILE[b.i] : [Number(d.x), Number(d.y), Number(d.r)];
        b.hx = clamp(fx * W, b.w / 2, W - b.w / 2);
        b.hy = clamp(fy * H, b.h / 2, H - b.h / 2);
        b.ha = fr;
        if (snap) { b.x = b.hx; b.y = b.hy; b.a = b.ha; }
      });
      paint();
    };

    const paint = () => {
      bodies.forEach((b) => {
        b.el.style.transform = `translate3d(${(b.x - b.w / 2).toFixed(1)}px, ${(b.y - b.h / 2).toFixed(1)}px, 0) rotate(${b.a.toFixed(2)}deg)`;
      });
    };

    const step = () => {
      let energy = 0;
      bodies.forEach((b) => {
        if (b.drag) return;
        let ax = (b.hx - b.x) * 0.014;
        let ay = (b.hy - b.y) * 0.014;
        if (pointer) {
          const dx = b.x - pointer.x, dy = b.y - pointer.y;
          const dist = Math.hypot(dx, dy) || 1;
          const R = 90 + Math.max(b.w, b.h) * 0.45;
          if (dist < R) {
            const f = Math.pow(1 - dist / R, 2) * 5.5;
            ax += (dx / dist) * f; ay += (dy / dist) * f;
            b.va += Math.sign(dx || 1) * f * 0.35;
          }
        }
        b.vx = (b.vx + ax) * 0.88;
        b.vy = (b.vy + ay) * 0.88;
        b.x += b.vx; b.y += b.vy;
      });

      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const A = bodies[i], B = bodies[j];
          const ox = ((A.w + B.w) / 2) * 0.92 - Math.abs(A.x - B.x);
          const oy = ((A.h + B.h) / 2) * 0.92 - Math.abs(A.y - B.y);
          if (ox > 0 && oy > 0) {
            const wa = A.drag ? 0 : B.drag ? 1 : 0.5;
            const wb = 1 - wa;
            if (ox < oy) {
              const s = Math.sign(A.x - B.x) || 1;
              A.x += s * ox * wa; B.x -= s * ox * wb;
              A.vx += s * ox * wa * 0.2; B.vx -= s * ox * wb * 0.2;
            } else {
              const s = Math.sign(A.y - B.y) || 1;
              A.y += s * oy * wa; B.y -= s * oy * wb;
              A.vy += s * oy * wa * 0.2; B.vy -= s * oy * wb * 0.2;
            }
          }
        }
      }

      bodies.forEach((b) => {
        const minX = b.w / 2, maxX = W - b.w / 2, minY = b.h / 2, maxY = H - b.h / 2;
        if (b.x < minX) { b.x = minX; b.vx = Math.abs(b.vx) * 0.5; }
        if (b.x > maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * 0.5; }
        if (b.y < minY) { b.y = minY; b.vy = Math.abs(b.vy) * 0.5; }
        if (b.y > maxY) { b.y = maxY; b.vy = -Math.abs(b.vy) * 0.5; }
        const target = b.ha + clamp(b.vx * 1.6, -24, 24);
        b.va = (b.va + (target - b.a) * 0.09) * 0.8;
        b.a += b.va;
        energy += Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.va) + Math.abs(b.hx - b.x) * 0.02 + Math.abs(b.hy - b.y) * 0.02;
      });
      paint();

      settledFrames = energy < 0.15 && !pointer && !bodies.some((b) => b.drag) ? settledFrames + 1 : 0;
      if (settledFrames > 20 || !visible) { running = false; return; }
      requestAnimationFrame(step);
    };

    const wake = () => {
      if (reduceMotion.matches) return;
      settledFrames = 0;
      if (!running && visible) { running = true; requestAnimationFrame(step); }
    };
    const local = (e: PointerEvent) => {
      const r = arena.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onArenaMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer = local(e); wake();
    };
    const onArenaLeave = () => { pointer = null; wake(); };
    arena.addEventListener("pointermove", onArenaMove);
    arena.addEventListener("pointerleave", onArenaLeave);

    const cleanups: Array<() => void> = [];
    bodies.forEach((b) => {
      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        b.el.setPointerCapture(e.pointerId);
        const p = local(e);
        b.drag = true; b.ox = p.x - b.x; b.oy = p.y - b.y; b.lx = p.x; b.ly = p.y;
        b.vx = b.vy = 0;
        b.el.classList.add("is-drag");
        if (e.pointerType !== "touch") pointer = null;
        wake();
      };
      const onMove = (e: PointerEvent) => {
        if (!b.drag) return;
        const p = local(e);
        b.x = p.x - b.ox; b.y = p.y - b.oy;
        b.vx = clamp(p.x - b.lx, -40, 40); b.vy = clamp(p.y - b.ly, -40, 40);
        b.lx = p.x; b.ly = p.y;
        if (reduceMotion.matches) paint();
      };
      const release = () => {
        if (!b.drag) return;
        b.drag = false;
        b.el.classList.remove("is-drag");
        wake();
      };
      b.el.addEventListener("pointerdown", onDown);
      b.el.addEventListener("pointermove", onMove);
      b.el.addEventListener("pointerup", release);
      b.el.addEventListener("pointercancel", release);
      b.el.addEventListener("lostpointercapture", release);
      cleanups.push(() => {
        b.el.removeEventListener("pointerdown", onDown);
        b.el.removeEventListener("pointermove", onMove);
        b.el.removeEventListener("pointerup", release);
        b.el.removeEventListener("pointercancel", release);
        b.el.removeEventListener("lostpointercapture", release);
      });
    });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(arena);

    const ready = document.fonts?.ready ?? Promise.resolve();
    ready.then(() => layoutHome(true));
    layoutHome(true);
    const onResize = debounce(() => { layoutHome(false); wake(); }, 120);
    window.addEventListener("resize", onResize);

    return () => {
      arena.removeEventListener("pointermove", onArenaMove);
      arena.removeEventListener("pointerleave", onArenaLeave);
      cleanups.forEach((fn) => fn());
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [arenaRef]);
}

/**
 * Port dari pengajuan.js (§1 "Locked-scroll sections") — dipakai halaman
 * Pengajuan Seller untuk section Ketentuan/Tanggung-jawab/Alur. Lebih
 * sederhana dari usePinnedSteps (Cara Kerja): item di dalam section cuma
 * toggle class `is-shown` satu-per-satu mengikuti progres scroll — tidak
 * ada transform y/rotate bertumpuk. Di luar breakpoint pin (mobile/tablet/
 * reduced-motion), tiap item reveal begitu masuk viewport (IntersectionObserver),
 * bukan dikunci scroll.
 */
export function usePinnedReveal(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = Array.from(section.querySelectorAll<HTMLElement>("[data-pin-item]"));
    if (items.length === 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pinMQ = window.matchMedia("(min-width: 1024px) and (min-height: 640px)");
    let pinned = false, raf = 0, last = -1;

    const show = (count: number) => {
      if (count === last) return;
      last = count;
      items.forEach((it, i) => it.classList.toggle("is-shown", i < count));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = section.getBoundingClientRect();
        const scrollable = section.offsetHeight - window.innerHeight;
        const p = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 1;
        show(rect.top > window.innerHeight * 0.4 ? 0 : clamp(1 + Math.floor(p * items.length * 1.15), 1, items.length));
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (pinned || !e.isIntersecting) return;
          e.target.classList.add("is-shown");
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.2 },
    );

    const decide = () => {
      const want = pinMQ.matches && !reduceMotion.matches;
      if (want && !pinned) {
        pinned = true; last = -1;
        section.classList.add("is-pinned");
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      } else if (!want) {
        if (pinned) {
          pinned = false;
          section.classList.remove("is-pinned");
          window.removeEventListener("scroll", onScroll);
        }
        if (reduceMotion.matches) items.forEach((it) => it.classList.add("is-shown"));
        else items.forEach((it) => { if (!it.classList.contains("is-shown")) io.observe(it); });
      }
    };
    decide();
    pinMQ.addEventListener("change", decide);

    return () => {
      window.removeEventListener("scroll", onScroll);
      pinMQ.removeEventListener("change", decide);
      io.disconnect();
    };
  }, [sectionRef]);
}
