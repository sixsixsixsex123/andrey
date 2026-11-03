/*
 * Точный чертёж к задаче, построенный по найденным величинам:
 * AC = 6√13, BC = 5√26, ∠C = 45°  ⇒  B1C1 = 5, A1C1 = 12, A1B1 = 13.
 *
 * Figure.svg(opts) возвращает строку SVG.
 *   opts.vanAubel — показать точки A2, B2, C2 (биссектрисы ортотреугольника)
 *   opts.angles   — подписи углов α, β, γ в ортотреугольнике
 *   opts.rightC1  — отметка прямого угла при C1 в ортотреугольнике
 *   opts.hl       — список выделяемых фигур: "orthic", "AB1C1", "A1B1C", "BB1C",
 *                   "BA1H", "AB1H", "B1B2", "A1A2", "BB1", "AC"
 */
const Figure = (() => {
  const v = (x, y) => ({ x, y });
  const sub = (p, q) => v(p.x - q.x, p.y - q.y);
  const add = (p, q) => v(p.x + q.x, p.y + q.y);
  const mul = (p, k) => v(p.x * k, p.y * k);
  const dot = (p, q) => p.x * q.x + p.y * q.y;
  const len = (p) => Math.hypot(p.x, p.y);
  const norm = (p) => mul(p, 1 / len(p));

  const foot = (P, U, W) => {
    const d = sub(W, U);
    return add(U, mul(d, dot(sub(P, U), d) / dot(d, d)));
  };
  const meet = (P1, P2, Q1, Q2) => {
    const r = sub(P2, P1), s = sub(Q2, Q1);
    const t = ((Q1.x - P1.x) * s.y - (Q1.y - P1.y) * s.x) / (r.x * s.y - r.y * s.x);
    return add(P1, mul(r, t));
  };

  // Геометрия в «математических» координатах (ось y вверх)
  const a = 5 * Math.sqrt(26);
  const b = 6 * Math.sqrt(13);
  const B = v(0, 0), C = v(a, 0), A = v(a - b / Math.SQRT2, b / Math.SQRT2);
  const A1 = foot(A, B, C), B1 = foot(B, C, A), C1 = foot(C, A, B);
  const H = meet(A, A1, B, B1);
  const A2 = meet(A, A1, B1, C1), B2 = meet(B, B1, A1, C1), C2 = meet(C, C1, A1, B1);
  const P = { A, B, C, A1, B1, C1, H, A2, B2, C2 };

  // Перевод в координаты SVG
  const S = 22, PAD = 34;
  const W = a * S + PAD * 2, Hh = A.y * S + PAD * 2;
  const T = (p) => v(PAD + p.x * S, Hh - PAD - p.y * S);
  const tp = {};
  for (const k in P) tp[k] = T(P[k]);
  const f = (n) => n.toFixed(1);
  const pts = (...ks) => ks.map((k) => `${f(tp[k].x)},${f(tp[k].y)}`).join(" ");

  const seg = (p, q, cls) =>
    `<line x1="${f(tp[p].x)}" y1="${f(tp[p].y)}" x2="${f(tp[q].x)}" y2="${f(tp[q].y)}" class="${cls}"/>`;

  const rightMark = (at, p, q, size = 7, cls = "fig-mark") => {
    const o = tp[at];
    const u = mul(norm(sub(tp[p], o)), size), w = mul(norm(sub(tp[q], o)), size);
    const c1 = add(o, u), c2 = add(add(o, u), w), c3 = add(o, w);
    return `<polyline points="${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(c3.x)},${f(c3.y)}" class="${cls}"/>`;
  };

  const arc = (at, p, q, r, cls = "fig-arc") => {
    const o = tp[at];
    const u = norm(sub(tp[p], o)), w = norm(sub(tp[q], o));
    const s = add(o, mul(u, r)), e = add(o, mul(w, r));
    const sweep = u.x * w.y - u.y * w.x > 0 ? 1 : 0;
    return `<path d="M${f(s.x)},${f(s.y)} A${r},${r} 0 0 ${sweep} ${f(e.x)},${f(e.y)}" class="${cls}"/>`;
  };

  const angleLabel = (at, p, q, r, text, cls = "fig-greek") => {
    const o = tp[at];
    const dir = norm(add(norm(sub(tp[p], o)), norm(sub(tp[q], o))));
    const c = add(o, mul(dir, r));
    return `<text x="${f(c.x)}" y="${f(c.y)}" class="${cls}" text-anchor="middle" dominant-baseline="central">${text}</text>`;
  };

  // Подписи точек: смещение от «центра» наружу
  const label = (k, dx, dy) => {
    const p = tp[k];
    const name = k.length > 1 ? `${k[0]}<tspan class="sub" dy="4">${k[1]}</tspan>` : k;
    return `<text x="${f(p.x + dx)}" y="${f(p.y + dy)}" class="fig-label" text-anchor="middle" dominant-baseline="central">${name}</text>`;
  };

  const midLabel = (p, q, text, off, t = 0.5) => {
    const m = add(tp[p], mul(sub(tp[q], tp[p]), t));
    const d = sub(tp[q], tp[p]);
    const n = norm(v(-d.y, d.x));
    const c = add(m, mul(n, off));
    return `<text x="${f(c.x)}" y="${f(c.y)}" class="fig-len" text-anchor="middle" dominant-baseline="central">${text}</text>`;
  };

  const HL = {
    orthic: () => `<polygon points="${pts("A1", "B1", "C1")}" class="fig-hl"/>`,
    AB1C1: () => `<polygon points="${pts("A", "B1", "C1")}" class="fig-hl"/>`,
    A1B1C: () => `<polygon points="${pts("A1", "B1", "C")}" class="fig-hl"/>`,
    BB1C: () => `<polygon points="${pts("B", "B1", "C")}" class="fig-hl"/>`,
    BA1H: () => `<polygon points="${pts("B", "A1", "H")}" class="fig-hl fig-hl-2"/>`,
    AB1H: () => `<polygon points="${pts("A", "B1", "H")}" class="fig-hl fig-hl-3"/>`,
    B1B2: () => seg("B1", "B2", "fig-hl-line"),
    A1A2: () => seg("A1", "A2", "fig-hl-line"),
    BB1: () => seg("B", "B1", "fig-hl-line"),
    AC: () => seg("A", "C", "fig-hl-line"),
  };

  function svg(opts = {}) {
    const hl = opts.hl || [];
    const out = [];
    out.push(`<svg viewBox="0 0 ${f(W)} ${f(Hh)}" class="figure-svg" role="img" aria-label="Чертёж: треугольник ABC, его высоты и ортоцентрический треугольник A1B1C1">`);

    // заливки-выделения — под линиями
    hl.filter((k) => HL[k] && !k.match(/^(B1B2|A1A2|BB1|AC)$/)).forEach((k) => out.push(HL[k]()));
    out.push(`<polygon points="${pts("A1", "B1", "C1")}" class="fig-orthic-fill"/>`);

    // основной треугольник и высоты
    out.push(`<polygon points="${pts("A", "B", "C")}" class="fig-main"/>`);
    out.push(seg("A", "A1", "fig-alt"), seg("B", "B1", "fig-alt"), seg("C", "C1", "fig-alt"));
    out.push(`<polygon points="${pts("A1", "B1", "C1")}" class="fig-orthic"/>`);

    // прямые углы при основаниях высот
    out.push(rightMark("A1", "C", "A"), rightMark("B1", "A", "B"), rightMark("C1", "B", "C"));

    if (opts.rightC1) out.push(rightMark("C1", "A1", "B1", 10, "fig-mark fig-mark-accent"));

    if (opts.angles) {
      // высоты — биссектрисы углов ортотреугольника: β при C1, α при B1, γ при A1
      const g = [];
      g.push(arc("C1", "B1", "H", 20), arc("C1", "H", "A1", 23));
      g.push(angleLabel("C1", "B1", "H", 32, "β"), angleLabel("C1", "H", "A1", 32, "β"));
      g.push(arc("B1", "C1", "H", 20), arc("B1", "H", "A1", 23));
      g.push(angleLabel("B1", "C1", "H", 32, "α"), angleLabel("B1", "H", "A1", 32, "α"));
      g.push(arc("A1", "B1", "H", 20), arc("A1", "H", "C1", 23));
      g.push(angleLabel("A1", "B1", "H", 32, "γ"), angleLabel("A1", "H", "C1", 32, "γ"));
      g.push(arc("C", "A", "B", 34, "fig-arc fig-arc-accent"));
      g.push(angleLabel("C", "A", "B", 50, "45°", "fig-greek fig-greek-accent"));
      out.push(`<g class="fig-angles">${g.join("")}</g>`);
    }

    if (opts.vanAubel) {
      out.push(seg("A1", "A2", "fig-bis"), seg("B1", "B2", "fig-bis"), seg("C1", "C2", "fig-bis"));
    }

    // линии-выделения поверх
    hl.filter((k) => k.match(/^(B1B2|A1A2|BB1|AC)$/)).forEach((k) => out.push(HL[k]()));

    // длины сторон ортотреугольника
    out.push(midLabel("B1", "C1", "5", 11, 0.28), midLabel("A1", "C1", "12", 11), midLabel("A1", "B1", "13", -11));

    // точки
    const dotsK = ["A", "B", "C", "A1", "B1", "C1", "H"].concat(opts.vanAubel ? ["A2", "B2", "C2"] : []);
    dotsK.forEach((k) => out.push(`<circle cx="${f(tp[k].x)}" cy="${f(tp[k].y)}" r="${k === "H" ? 3.6 : 3}" class="fig-dot${k === "H" ? " fig-dot-h" : ""}"/>`));

    // подписи
    out.push(label("A", 0, -16), label("B", -14, 10), label("C", 14, 10));
    out.push(label("A1", 0, 20), label("B1", 18, -8), label("C1", -18, -8));
    out.push(label("H", 14, -4));
    if (opts.vanAubel) out.push(label("A2", -12, -13), label("B2", 14, 12), label("C2", -16, 8));

    out.push(`</svg>`);
    return out.join("");
  }

  return { svg };
})();
