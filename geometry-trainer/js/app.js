(() => {
  "use strict";

  const STORE_KEY = "geom-trainer:v1";
  const app = document.getElementById("app");
  const elWrong = document.getElementById("cnt-wrong");
  const elHints = document.getElementById("cnt-hints");
  const elFigBtn = document.getElementById("btn-figure");
  const elRestart = document.getElementById("btn-restart");
  const drawer = document.getElementById("figure-drawer");

  /* ---------------- Состояние ---------------- */

  const fresh = () => ({
    node: "start",
    wrong: 0,
    hints: 0,
    q: {},            // по вопросам: { wrong, hints, solved, picked: [] , order: [] }
    done: [],         // завершённые способы
    startedAt: null,
    finishedAt: null,
    log: [],          // { node, method } — посещённые вопросы в порядке прохождения
  });

  let S = Object.assign(fresh(), load() || {});
  if (!NODES[S.node]) S = fresh();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(S));
    } catch (e) { /* хранилище недоступно — работаем без сохранения */ }
  }

  const qs = (id) => {
    if (!S.q[id]) S.q[id] = { wrong: 0, hints: 0, solved: false, solvedEver: false, okIdx: null, routed: false, picked: [], order: null, hintOpen: false };
    return S.q[id];
  };

  /* ---------------- Утилиты ---------------- */

  const h = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content;
  };

  const math = (root) => {
    if (window.renderMathInElement) {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    }
  };

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };

  const fmtTime = (ms) => {
    const s = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(s / 60);
    return m ? `${m} мин ${s % 60} с` : `${s} с`;
  };

  const ICONS = {
    pencil: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>',
    route: '<svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3z"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };

  /* ---------------- Счётчики в шапке ---------------- */

  function updateCounters(bump) {
    elWrong.textContent = S.wrong;
    elHints.textContent = S.hints;
    elWrong.nextElementSibling.textContent = plural(S.wrong, "ошибка", "ошибки", "ошибок");
    elHints.nextElementSibling.textContent = plural(S.hints, "подсказка", "подсказки", "подсказок");
    if (bump) {
      const el = bump === "wrong" ? elWrong.parentElement : elHints.parentElement;
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }
  }

  /* ---------------- Навигация ---------------- */

  function go(id) {
    if (id === "start") {
      S = fresh();
    }
    if (!S.startedAt && id !== "start") S.startedAt = Date.now();
    const node = NODES[id];
    if (node && node.type === "question") {
      const st = qs(id);
      // каждый новый заход на вопрос — свежая попытка (счётчики копятся)
      st.picked = [];
      st.solved = false;
      st.hintOpen = false;
      st.order = null;
      st.okIdx = null;
      if (!S.log.some((l) => l.node === id)) S.log.push({ node: id, method: node.method || "draw" });
    }
    if (id === "finish") S.finishedAt = Date.now();
    S.node = id;
    save();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    const node = NODES[S.node] || NODES.start;
    app.innerHTML = "";
    let view;
    switch (node.type) {
      case "screen": view = renderScreen(node); break;
      case "question": view = renderQuestion(S.node, node); break;
      case "methods": view = renderMethods(node); break;
      case "finish": view = renderFinish(node); break;
    }
    app.appendChild(view);
    math(app);
    updateCounters();
    const inSolution = S.node !== "start" && S.node !== "problem";
    elFigBtn.hidden = !inSolution;
    elRestart.hidden = S.node === "start";
    document.body.dataset.node = S.node;
    requestAnimationFrame(() => app.firstElementChild && app.firstElementChild.classList.add("in"));
  }

  /* ---------------- Экраны ---------------- */

  function figureBlock(fig, caption) {
    if (!fig) return "";
    return `<figure class="figure">${Figure.svg(fig)}${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
  }

  function renderScreen(node) {
    const hasFig = !!node.figure;
    const frag = h(`
      <section class="view screen ${node.hero ? "hero" : ""} ${hasFig ? "with-figure" : ""}">
        <div class="screen-main">
          ${node.kicker ? `<div class="kicker">${node.kicker}</div>` : ""}
          <h1 class="title">${node.title}</h1>
          ${node.body ? `<div class="body">${node.body}</div>` : ""}
          ${node.stats ? statsInline() : ""}
          ${node.choices ? `<div class="choices">${node.choices.map((c, i) => `
            <button class="choice" data-to="${c.to}" style="--i:${i}">
              <span class="choice-icon">${ICONS[c.icon] || ""}</span>
              <span class="choice-text"><b>${c.label}</b><small>${c.desc || ""}</small></span>
              <span class="choice-arrow">${ICONS.arrow}</span>
            </button>`).join("")}</div>` : ""}
          ${node.actions ? `<div class="actions">${node.actions.map((a) => `
            <button class="btn ${a.kind === "primary" ? "btn-primary" : "btn-ghost"}" data-to="${a.to}">${a.label}</button>`).join("")}</div>` : ""}
        </div>
        ${hasFig ? `<div class="screen-figure">${figureBlock(node.figure)}</div>` : ""}
        ${node.hero ? heroArt() : ""}
      </section>`);
    frag.querySelectorAll("[data-to]").forEach((b) => b.addEventListener("click", () => go(b.dataset.to)));
    return frag;
  }

  function heroArt() {
    return `<div class="hero-art" aria-hidden="true">${Figure.svg({ angles: true })}</div>`;
  }

  function statsInline() {
    const done = S.done.map((id) => METHODS.find((m) => m.id === id)).filter(Boolean);
    return `<div class="stat-row">
      <div class="stat"><span class="stat-num danger">${S.wrong}</span><span class="stat-lbl">${plural(S.wrong, "ошибка", "ошибки", "ошибок")} всего</span></div>
      <div class="stat"><span class="stat-num warn">${S.hints}</span><span class="stat-lbl">${plural(S.hints, "подсказка", "подсказки", "подсказок")}</span></div>
      <div class="stat"><span class="stat-num ok">${done.length}</span><span class="stat-lbl">${plural(done.length, "способ решён", "способа решено", "способов решено")}</span></div>
    </div>`;
  }

  /* ---------------- Вопрос ---------------- */

  function renderQuestion(id, q) {
    const st = qs(id);
    if (!st.order) {
      const idx = q.options.map((_, i) => i);
      const answers = idx.filter((i) => !q.options[i].route);
      const routes = idx.filter((i) => q.options[i].route);
      st.order = routes.concat(shuffle(answers));
      save();
    }
    const [stepN, stepOf] = q.step || [0, 0];
    const letters = "АБВГДЕЖЗ";
    let li = 0;

    const optionsHtml = st.order.map((i) => {
      const o = q.options[i];
      if (o.route) {
        return `<button class="opt opt-route" data-i="${i}"><span class="opt-badge">${ICONS.route}</span><span class="opt-text">${o.t}</span><span class="opt-arrow">${ICONS.arrow}</span></button>`;
      }
      const letter = letters[li++];
      return `<button class="opt" data-i="${i}"><span class="opt-badge">${letter}</span><span class="opt-text">${o.t}</span><span class="opt-state"></span></button>`;
    }).join("");

    const hasRoutes = q.options.some((o) => o.route);

    const frag = h(`
      <section class="view question ${q.figure ? "with-figure" : ""}">
        <div class="q-head">
          <div class="crumbs">
            <span class="chip">${q.section}</span>
            ${stepOf ? `<span class="progress" aria-label="Шаг ${stepN} из ${stepOf}">${Array.from({ length: stepOf }, (_, k) => `<i class="${k < stepN - 1 ? "done" : k === stepN - 1 ? "cur" : ""}"></i>`).join("")}<span>Шаг ${stepN} из ${stepOf}</span></span>` : ""}
          </div>
          <div class="q-counter" title="Ошибок на этом шаге">
            ${ICONS.x}<span>Ошибок на шаге: <b class="q-wrong">${st.wrong}</b></span>
          </div>
        </div>

        <div class="q-grid">
          <div class="q-main">
            <h1 class="title q-title">${q.title}</h1>
            ${q.body ? `<div class="body">${q.body}</div>` : ""}
            <div class="opts ${hasRoutes ? "has-routes" : ""}" role="group" aria-label="Варианты ответа">
              ${optionsHtml}
            </div>
            ${q.hint ? `<button class="btn-hint" data-hint>${ICONS.bulb}<span>Требуется подсказка</span></button>` : ""}
            <div class="feedback" aria-live="polite"></div>
          </div>
          ${q.figure ? `<aside class="q-figure">${figureBlock(q.figure)}</aside>` : ""}
        </div>
      </section>`);

    const root = frag.querySelector(".view");
    const fb = frag.querySelector(".feedback");

    // восстановить уже сделанные неверные выборы (например, после перезагрузки)
    st.picked.forEach((i) => markWrong(root.querySelector(`.opt[data-i="${i}"]`), false));

    root.querySelectorAll(".opt").forEach((btn) => {
      btn.addEventListener("click", () => onPick(id, q, +btn.dataset.i, btn, root, fb));
    });
    const hintBtn = root.querySelector("[data-hint]");
    if (hintBtn) hintBtn.addEventListener("click", () => showHint(id, q, fb, true));
    if (st.hintOpen) showHint(id, q, fb, false);
    if (st.solved && st.okIdx != null) {
      const okBtn = root.querySelector(`.opt[data-i="${st.okIdx}"]`);
      if (okBtn) showSuccess(q, st, okBtn, root, fb, false);
    }
    return frag;
  }

  function markWrong(btn, animate = true) {
    if (!btn) return;
    btn.classList.add("is-wrong");
    btn.disabled = true;
    btn.querySelector(".opt-state").innerHTML = ICONS.x;
    if (animate) {
      btn.classList.add("shake");
      setTimeout(() => btn.classList.remove("shake"), 500);
    }
  }

  function onPick(id, q, i, btn, root, fb) {
    const st = qs(id);
    if (st.solved) return;
    const o = q.options[i];

    if (o.route) {
      st.routed = true;
      save();
      go(o.to);
      return;
    }

    if (o.ok) {
      st.solved = true;
      st.solvedEver = true;
      st.okIdx = i;
      if (q.completes && !S.done.includes(q.completes)) S.done.push(q.completes);
      save();
      showSuccess(q, st, btn, root, fb, true);
      return;
    }

    // неверный ответ
    st.wrong += 1;
    S.wrong += 1;
    st.picked.push(i);
    save();
    markWrong(btn);
    updateCounters("wrong");
    root.querySelector(".q-wrong").textContent = st.wrong;

    fb.querySelectorAll(".fb-wrong").forEach((n) => n.remove());
    const msg = o.wrong || q.wrongDefault || "Неверно.";
    const node = h(`
      <div class="fb fb-wrong">
        <div class="fb-icon">${ICONS.x}</div>
        <div class="fb-body">${msg.startsWith("<") ? msg : `<p>${msg}</p>`}
          <div class="fb-meta">Попробуйте ещё раз · ошибок на этом шаге: ${st.wrong}</div>
        </div>
        ${q.wrongFigure ? `<div class="fb-figure">${figureBlock(q.wrongFigure)}</div>` : ""}
      </div>`);
    fb.prepend(node);
    math(fb);
    if (o.openHint && q.hint) showHint(id, q, fb, false);
    fb.querySelector(".fb-wrong").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showSuccess(q, st, btn, root, fb, animate) {
    btn.classList.add("is-right");
    btn.disabled = true;
    btn.querySelector(".opt-state").innerHTML = ICONS.check;
    root.querySelectorAll(".opt").forEach((b) => { if (b !== btn) { b.disabled = true; b.classList.add("is-dim"); } });
    const hb = root.querySelector("[data-hint]");
    if (hb) hb.disabled = true;
    fb.querySelectorAll(".fb-wrong").forEach((n) => n.remove());
    const ok = h(`
      <div class="fb fb-ok">
        <div class="fb-icon">${ICONS.check}</div>
        <div class="fb-body">${q.success || "Верно!"}
          ${st.picked.length === 0 ? `<div class="fb-meta">С первой попытки 🎯</div>` : `<div class="fb-meta">Неверных попыток на этом шаге: ${st.picked.length}</div>`}
        </div>
      </div>
      <div class="actions"><button class="btn btn-primary" data-next>${q.nextLabel || "Далее"} ${ICONS.arrow}</button></div>`);
    fb.appendChild(ok);
    if (window.renderMathInElement) math(fb);
    fb.querySelector("[data-next]").addEventListener("click", () => go(q.next));
    if (animate) fb.querySelector(".fb-ok").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showHint(id, q, fb, count) {
    const st = qs(id);
    if (fb.querySelector(".fb-hint")) {
      fb.querySelector(".fb-hint").scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (count && !st.hintOpen) {
      st.hints += 1;
      S.hints += 1;
      updateCounters("hints");
    }
    st.hintOpen = true;
    save();
    const node = h(`
      <div class="fb fb-hint">
        <div class="fb-icon">${ICONS.bulb}</div>
        <div class="fb-body">
          <div class="fb-title">${q.hint.title}</div>
          ${q.hint.body}
        </div>
        ${q.hint.figure ? `<div class="fb-figure">${figureBlock(q.hint.figure)}</div>` : ""}
      </div>`);
    fb.appendChild(node);
    math(fb);
    const btn = document.querySelector("[data-hint]");
    if (btn) btn.classList.add("used");
    fb.querySelector(".fb-hint").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------------- Способы ---------------- */

  function renderMethods(node) {
    const frag = h(`
      <section class="view methods">
        <div class="kicker">Выбор способа</div>
        <h1 class="title">${node.title}</h1>
        <p class="muted">Задачу можно решить одиннадцатью способами. Сейчас доступны первые два — остальные появятся позднее.</p>
        <ol class="method-list">
          ${METHODS.map((m, i) => {
            const done = S.done.includes(m.id);
            return `<li>
              <button class="method ${m.active ? "" : "locked"} ${done ? "done" : ""}" ${m.active ? `data-to="${m.start}"` : "disabled"} style="--i:${i}">
                <span class="method-num">${i + 1}</span>
                <span class="method-title">${m.title}</span>
                <span class="method-tag">${done ? `${ICONS.check} Решено` : m.active ? `Начать ${ICONS.arrow}` : `${ICONS.lock} Скоро`}</span>
              </button>
            </li>`;
          }).join("")}
        </ol>
        ${S.done.length ? `<div class="actions"><button class="btn btn-ghost" data-to="finish">Завершить и посмотреть итоги</button></div>` : ""}
      </section>`);
    frag.querySelectorAll("[data-to]").forEach((b) => b.addEventListener("click", () => go(b.dataset.to)));
    return frag;
  }

  /* ---------------- Итоги ---------------- */

  function renderFinish(node) {
    const groups = [
      { id: "draw", title: "Чертёж к задаче" },
      ...METHODS.filter((m) => m.active).map((m) => ({ id: m.id, title: `Способ ${METHODS.indexOf(m) + 1}. ${m.title}` })),
    ];
    const rows = (gid) => S.log.filter((l) => l.method === gid).map((l) => {
      const q = NODES[l.node], st = S.q[l.node] || {};
      const res = !st.solvedEver
        ? (st.routed ? `<span class="tag tag-info">решён по шагам</span>` : `<span class="tag tag-warn">не решён</span>`)
        : st.wrong === 0 && st.hints === 0 ? `<span class="tag tag-ok">с первой попытки</span>`
        : st.wrong === 0 ? `<span class="tag tag-warn">с подсказкой</span>`
        : `<span class="tag tag-bad">${st.wrong} ${plural(st.wrong, "ошибка", "ошибки", "ошибок")}</span>`;
      return `<tr><td class="td-q">${q.title}</td><td class="num">${st.wrong || 0}</td><td class="num">${st.hints || 0}</td><td>${res}</td></tr>`;
    }).join("");

    const tables = groups.map((g) => {
      const r = rows(g.id);
      if (!r) return "";
      const done = g.id === "draw" || S.done.includes(g.id);
      return `<div class="result-group">
        <h3>${g.title} ${done ? "" : `<span class="tag tag-warn">не завершён</span>`}</h3>
        <div class="table-wrap"><table>
          <thead><tr><th>Вопрос</th><th class="num">Ошибки</th><th class="num">Подсказки</th><th>Итог</th></tr></thead>
          <tbody>${r}</tbody>
        </table></div>
      </div>`;
    }).join("");

    // «решён по шагам» (выбран пошаговый путь) в процент не входит
    const counted = S.log.filter((l) => { const st = S.q[l.node] || {}; return st.solvedEver || st.wrong || !st.routed; });
    const total = counted.length;
    const clean = counted.filter((l) => { const st = S.q[l.node] || {}; return st.solvedEver && !st.wrong && !st.hints; }).length;
    const pct = total ? Math.round((clean / total) * 100) : 0;
    const grade = S.wrong === 0 && S.hints === 0 ? "Безупречно!" : pct >= 75 ? "Отличная работа!" : pct >= 50 ? "Хороший результат" : "Есть над чем поработать";
    const time = S.startedAt ? fmtTime((S.finishedAt || Date.now()) - S.startedAt) : "—";

    const frag = h(`
      <section class="view finish">
        <div class="kicker">Итоги</div>
        <h1 class="title">${node.title}</h1>
        <p class="lead">${grade}</p>

        <div class="score">
          <div class="ring" style="--p:${pct}">
            <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring-fg" pathLength="100"/></svg>
            <div class="ring-text"><b>${pct}%</b><small>с первой<br>попытки</small></div>
          </div>
          <div class="stat-row">
            <div class="stat"><span class="stat-num danger">${S.wrong}</span><span class="stat-lbl">${plural(S.wrong, "неверный ответ", "неверных ответа", "неверных ответов")}</span></div>
            <div class="stat"><span class="stat-num warn">${S.hints}</span><span class="stat-lbl">${plural(S.hints, "подсказка", "подсказки", "подсказок")}</span></div>
            <div class="stat"><span class="stat-num ok">${S.done.length}</span><span class="stat-lbl">${plural(S.done.length, "способ решён", "способа решено", "способов решено")}</span></div>
            <div class="stat"><span class="stat-num">${time}</span><span class="stat-lbl">время</span></div>
          </div>
        </div>

        ${tables || `<p class="muted">Вы ещё не ответили ни на один вопрос.</p>`}

        <div class="actions">
          <button class="btn btn-primary" data-to="start">Пройти заново</button>
          <button class="btn btn-ghost" data-to="methods">К способам решения</button>
        </div>

        <div class="authors">
          <span>Авторы</span>
          ${AUTHORS.length ? `<b>${AUTHORS.join(", ")}</b>` : ""}
        </div>
      </section>`);
    frag.querySelectorAll("[data-to]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.to === "start") { S = fresh(); save(); }
      go(b.dataset.to);
    }));
    return frag;
  }

  /* ---------------- Шапка: чертёж и сброс ---------------- */

  drawer.querySelector(".drawer-figure").innerHTML = Figure.svg({ angles: true, vanAubel: true });
  const openDrawer = (open) => {
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
  };
  elFigBtn.addEventListener("click", () => openDrawer(!drawer.classList.contains("open")));
  drawer.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => openDrawer(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") openDrawer(false); });

  elRestart.addEventListener("click", () => {
    if (confirm("Начать заново? Счётчики ошибок и подсказок будут сброшены.")) {
      S = fresh();
      save();
      go("start");
    }
  });

  document.querySelector(".brand").addEventListener("click", (e) => {
    e.preventDefault();
    if (S.node !== "start") go("methods");
  });

  math(drawer);

  render();
})();
