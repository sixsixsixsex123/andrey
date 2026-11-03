/*
 * Содержание тренажёра. Перенесено из презентации «Геометрический тренажёр».
 *
 * Типы узлов:
 *   screen   — информационный экран с кнопками-переходами
 *   question — вопрос с вариантами ответа (счётчик ошибок и подсказок)
 *   methods  — список способов решения
 *   finish   — итоговый экран со статистикой
 *
 * Варианты ответа в вопросе:
 *   { t, ok: true }            — верный ответ (после него показывается q.success и кнопка «Далее» → q.next)
 *   { t, wrong: "..." }        — неверный ответ, засчитывается ошибка; текст — пояснение
 *   { t, to: "id", route: 1 }  — не ответ, а выбор пути (ошибкой не считается)
 * Пункт «Требуется подсказка» добавляется автоматически, если у вопроса есть hint.
 */

const PROBLEM = String.raw`Отрезки, соединяющие основания высот остроугольного треугольника $\triangle ABC$, равны $B_1C_1 = 5$, $A_1C_1 = 12$, $A_1B_1 = 13$. Найти площадь треугольника $\triangle ABC$.`;

const METHODS = [
  { id: "m1", title: "По двум сторонам и углу между ними", start: "m1_intro", active: true },
  { id: "m2", title: "С использованием теоремы Ван-Обеля", start: "m2_intro", active: true },
  { id: "m3", title: "По формуле Герона" },
  { id: "m4", title: "С использованием периметра ортоцентрического треугольника" },
  { id: "m5", title: "С использованием соотношения между площадями искомого и ортоцентрического треугольника" },
  { id: "m6", title: "Через радиусы вневписанных окружностей ортоцентрического треугольника" },
  { id: "m7", title: "С использованием окружности Эйлера" },
  { id: "m8", title: "Методом координат" },
  { id: "m9", title: "Формулой Пика" },
  { id: "m10", title: "С использованием определителя матрицы" },
  { id: "m11", title: "Интегральное решение" },
];

/* Полное решение способом 1 (в презентации — скан на слайде «Подсказка (2)») */
const SOLUTION_1 = String.raw`
<p><b>Решение 1.</b> Высоты остроугольного треугольника $ABC$ являются биссектрисами внутренних углов ортоцентрического треугольника $A_1B_1C_1$. Для этого построим окружности на сторонах треугольника $ABC$, как на диаметрах, и рассмотрим вписанные углы, опирающиеся на одну и ту же дугу. Заметим, что треугольники подобны: $ABC$ и $AB_1C_1$ $(k_1=\cos\angle A)$, $ABC$ и $A_1BC_1$ $(k_2=\cos\angle B)$, $ABC$ и $A_1B_1C$ $(k_3=\cos\angle C)$.</p>
<p>Так как $13^2 = 12^2 + 5^2$, треугольник $A_1B_1C_1$ — прямоугольный, тогда $\beta = 45^\circ$, а $2\alpha + 2\gamma = 90^\circ$, $\alpha+\gamma = 45^\circ$, то есть $\angle C = 45^\circ$.</p>
<p>Для нахождения площади воспользуемся формулой $$S_{ABC} = \tfrac12\,AC\cdot BC\cdot \sin\angle C = \tfrac12\,AC\cdot BC\cdot\sin 45^\circ.$$</p>
<p>Так как $\triangle A_1B_1C_1$ — прямоугольный, то $\cos 2\gamma = \frac{12}{13}$, $\cos\gamma = \frac{5}{\sqrt{26}}$. Из подобия указанных треугольников $\angle A = 90^\circ - \gamma$, значит $\sin\angle A = \frac{5}{\sqrt{26}}$. Аналогично $\cos 2\alpha = \frac{5}{13}$, $\cos\alpha = \frac{3}{\sqrt{13}}$, $\angle B = 90^\circ - \alpha$, значит $\sin\angle B = \frac{3}{\sqrt{13}}$.</p>
<p>Теорема синусов: $\triangle AB_1C_1$: $\frac{AB_1}{\sin 45^\circ} = \frac{C_1B_1}{\sin\angle A}$, откуда $AB_1 = \sqrt{13}$; $\triangle A_1B_1C$: $\frac{B_1C}{\sin\angle A} = \frac{A_1B_1}{\sin\angle C}$, откуда $B_1C = 5\sqrt{13}$.</p>
<p>Значит, $AC = AB_1 + B_1C = 6\sqrt{13}$. $\triangle ABC$: $\frac{BC}{\sin\angle A} = \frac{AC}{\sin\angle B}$, тогда $BC = 5\sqrt{26}$.</p>
<p>Таким образом, $$S_{ABC} = \tfrac12\cdot 6\sqrt{13}\cdot 5\sqrt{26}\cdot\tfrac{\sqrt2}{2} = 195.$$</p>`;

/* Полное решение способом 2 (слайд «Подсказка (7)») */
const SOLUTION_2 = String.raw`
<p><b>Решение 2.</b> Для нахождения площади треугольника $ABC$ воспользуемся формулой $S_{ABC} = \tfrac12\,AC\cdot BB_1$.</p>
<p>Заметим, что $\triangle BB_1C$, $\triangle BA_1H$, $\triangle AB_1H$ — равнобедренные прямоугольные треугольники, поэтому $BB_1 = B_1C$, $BA_1 = A_1H$, $AB_1 = B_1H$ и $AC = AB_1 + B_1C = B_1H + BB_1$, $BB_1 = BH + HB_1$ и $BH = \sqrt2\,A_1H$.</p>
<p>Воспользуемся теоремой Ван-Обеля и теоремой о биссектрисе угла треугольника $A_1B_1C_1$, получим: $$\frac{B_1H}{HB_2} = \frac{B_1C_2}{C_2A_1} + \frac{B_1A_2}{A_2C_1} = \frac{5}{12} + \frac{13}{12} = \frac32.$$</p>
<p>Следовательно, $B_1H = \frac35\cdot B_1B_2$, а $B_1B_2 = \frac{5\sqrt{13}}{3}$ ($B_1B_2$ — биссектриса внутреннего угла треугольника $A_1B_1C_1$: $\beta_a = \frac{2\sqrt{bcp(p-a)}}{b+c}$, или $B_1B_2$ — гипотенуза треугольника $C_1B_1B_2$).</p>
<p>Таким образом, $B_1H = \sqrt{13}$. Аналогично рассуждая, имеем: $$\frac{A_1H}{HA_2} = \frac{A_1B_2}{B_2C_1} + \frac{A_1C_2}{C_2B_1} = \frac{13}{5} + \frac{12}{5} = 5,$$ $A_1H = \frac56\,A_1A_2$ и $A_1A_2 = \frac{12\sqrt{26}}{5}$, то есть $A_1H = 2\sqrt{26}$.</p>
<p>Таким образом, $BB_1 = 5\sqrt{13}$, $AC = 6\sqrt{13}$ и $$S_{ABC} = \tfrac12\cdot 6\sqrt{13}\cdot 5\sqrt{13} = 195.$$</p>`;

const NODES = {
  /* ---------- Начало ---------- */
  start: {
    type: "screen",
    hero: true,
    kicker: "Интерактивный проект",
    title: "Геометрический тренажёр",
    body: `<p class="lead">Решите одну олимпиадную задачу о треугольнике несколькими способами. Тренажёр ведёт по шагам, подсказывает, когда нужно, и считает ошибки.</p>`,
    actions: [{ label: "Начать", to: "problem", kind: "primary" }],
  },

  problem: {
    type: "screen",
    kicker: "Условие задачи",
    title: "Задача",
    body: `<p class="problem">${PROBLEM}</p>`,
    actions: [{ label: "Далее", to: "action", kind: "primary" }],
  },

  action: {
    type: "screen",
    kicker: "Выбор действия",
    title: "С чего начнём?",
    body: `<p class="muted">Чертёж поможет вспомнить ключевые свойства ортоцентра. Если вы уверены в себе — переходите сразу к решению.</p>`,
    choices: [
      { label: "Выполнить чертёж к задаче", desc: "Два вопроса по теории + готовый чертёж", to: "q_ortho", icon: "pencil" },
      { label: "Перейти к решению задачи", desc: "Выбор способа решения", to: "methods", icon: "route" },
    ],
  },

  /* ---------- Ветка «Выполнить чертёж» ---------- */
  q_ortho: {
    type: "question",
    section: "Чертёж к задаче",
    step: [1, 2],
    title: "Что называется ортоцентром треугольника?",
    options: [
      { t: "Точка пересечения серединных перпендикуляров к сторонам треугольника", wrong: "Ваш ответ неверный. Точка пересечения серединных перпендикуляров — центр описанной окружности." },
      { t: "Точка пересечения медиан", wrong: "Ваш ответ неверный. Точка пересечения медиан — центроид (центр масс) треугольника." },
      { t: "Точка пересечения биссектрис", wrong: "Ваш ответ неверный. Точка пересечения биссектрис — центр вписанной окружности." },
      { t: "Точка пересечения высот", ok: true },
    ],
    success: String.raw`Верно: $H = AA_1 \cap BB_1 \cap CC_1$.`,
    next: "q_orthic",
  },

  q_orthic: {
    type: "question",
    section: "Чертёж к задаче",
    step: [2, 2],
    title: String.raw`Чем является ортоцентр $H$ для $\triangle A_1B_1C_1$?`,
    body: String.raw`<p>$A_1, B_1, C_1$ — основания высот остроугольного треугольника $ABC$, $A_1B_1C_1$ — ортоцентрический треугольник.</p><p class="note">Выбор целесообразно обосновать.</p>`,
    options: [
      { t: "Центром описанной окружности", wrong: "Ваш ответ неверный. Подумайте, какую роль играют высоты $AA_1$, $BB_1$, $CC_1$ по отношению к углам треугольника $A_1B_1C_1$." },
      { t: "Центром вписанной окружности", ok: true },
    ],
    success: String.raw`Верно: высоты остроугольного треугольника $ABC$ являются биссектрисами внутренних углов ортоцентрического треугольника $A_1B_1C_1$.`,
    nextLabel: "Выполнить чертёж",
    next: "drawing",
  },

  drawing: {
    type: "screen",
    kicker: "Чертёж",
    title: "Выполните чертёж на листе бумаги и выберите способ решения",
    body: `<p class="problem small">${PROBLEM}</p>`,
    figure: { angles: true },
    actions: [
      { label: "Перейти к решению", to: "methods", kind: "primary" },
      { label: "К выбору действия", to: "action", kind: "ghost" },
    ],
  },

  /* ---------- Способы ---------- */
  methods: { type: "methods", title: "Способы решения" },

  /* ---------- Способ 1 ---------- */
  m1_intro: {
    type: "screen",
    method: "m1",
    kicker: "Способ 1 · По двум сторонам и углу между ними",
    title: "Способ",
    body: String.raw`<div class="formula">$$S_{ABC} = \frac12\,AC\cdot BC\cdot\sin\angle C$$</div><p class="muted">Нужно найти угол $C$ и стороны $AC$, $BC$.</p>`,
    actions: [{ label: "Начать", to: "m1_q1", kind: "primary" }],
  },

  m1_q1: {
    type: "question",
    method: "m1",
    section: "Способ 1",
    step: [1, 4],
    title: String.raw`Чему равен $\angle A_1C_1B_1$?`,
    options: [
      { t: String.raw`$45^\circ$` },
      { t: String.raw`$30^\circ$` },
      { t: String.raw`$60^\circ$` },
      { t: String.raw`$90^\circ$`, ok: true },
    ],
    wrongDefault: "Неверно, обратите внимание на длины сторон ортоцентрического треугольника.",
    success: String.raw`Верно, $\angle A_1C_1B_1$ — прямой угол: так как $B_1C_1 = 5$, $A_1C_1 = 12$, $A_1B_1 = 13$, нетрудно заметить, что $13^2 = 12^2 + 5^2$, следовательно, треугольник $A_1B_1C_1$ — прямоугольный.`,
    next: "m1_q2",
  },

  m1_q2: {
    type: "question",
    method: "m1",
    section: "Способ 1",
    step: [2, 4],
    title: String.raw`Чему равен $\angle C$?`,
    options: [
      { t: String.raw`$45^\circ$`, ok: true },
      { t: String.raw`$60^\circ$` },
      { t: String.raw`$90^\circ$` },
    ],
    wrongDefault: "Неверно, обратите внимание на то, что вписанные углы, опирающиеся на равные хорды, равны (см. чертёж).",
    wrongFigure: { angles: true },
    hint: {
      title: "Подсказка (1)",
      body: String.raw`<p>$B_1C_1 = 5$, $A_1C_1 = 12$, $A_1B_1 = 13$. Нетрудно заметить, что $13^2 = 12^2 + 5^2$.</p><p>Следовательно, треугольник $A_1B_1C_1$ — прямоугольный, и тогда $\beta = 45^\circ$, а $2\alpha + 2\gamma = 90^\circ$, $\alpha + \gamma = 45^\circ$, то есть $\angle C = 45^\circ$.</p>`,
      figure: { angles: true, rightC1: true },
    },
    success: String.raw`Угол $\angle C = 45^\circ$ — верно.`,
    next: "m1_q3",
  },

  m1_q3: {
    type: "question",
    method: "m1",
    section: "Способ 1",
    step: [3, 4],
    title: String.raw`Необходимо найти длины сторон $AC$ и $BC$`,
    body: `<p class="muted">Выберите путь решения или сразу укажите свои значения.</p>`,
    options: [
      { t: String.raw`Воспользуемся теоремой синусов к треугольникам $AB_1C_1$ и $A_1B_1C$`, to: "m1_s1", route: 1 },
      { t: "Воспользуемся теоремой Ван-Обеля", to: "m2_intro", route: 1 },
      { t: String.raw`Мои значения: $AC = 5\sqrt{13}$, $BC = 6\sqrt{13}$` },
      { t: String.raw`Мои значения: $AC = \sqrt{13}$, $BC = 5\sqrt{26}$` },
      { t: String.raw`Мои значения: $AC = 5\sqrt{13}$, $BC = 5\sqrt{26}$` },
      { t: String.raw`Мои значения: $AC = 6\sqrt{13}$, $BC = 5\sqrt{26}$`, ok: true },
    ],
    wrongDefault: "Неверно. Попробуйте найти стороны с помощью теоремы синусов — тренажёр проведёт по шагам.",
    success: String.raw`Длины сторон $AC = 6\sqrt{13}$, $BC = 5\sqrt{26}$ найдены верно.`,
    next: "m1_q4",
  },

  m1_s1: {
    type: "question",
    method: "m1",
    section: "Способ 1 · теорема синусов",
    step: [3, 4],
    title: String.raw`Примените теорему синусов к $\triangle AB_1C_1$ и найдите $AB_1$`,
    options: [
      { t: String.raw`$AB_1 = \sqrt{13}$`, ok: true },
      { t: String.raw`$AB_1 = \sqrt{23}$` },
      { t: String.raw`$AB_1 = \sqrt{43}$` },
      { t: String.raw`$AB_1 = \sqrt{10}$` },
      { t: String.raw`$AB_1 = 6$` },
    ],
    wrongDefault: String.raw`Неверно, необходимо правильно найти $\sin\angle A$.`,
    hint: {
      title: "Подсказка (3)",
      body: String.raw`<p>Из подобия треугольников $ABC$ и $AB_1C_1$ $(k_1 = \cos\angle A)$, $ABC$ и $A_1BC_1$ $(k_2 = \cos\angle B)$, $ABC$ и $A_1B_1C$ $(k_3 = \cos\angle C)$ следует, что $\angle A = 90^\circ - \gamma$, где $2\gamma = \angle B_1A_1C_1$, $\cos 2\gamma = \frac{12}{13}$. Значит, $\sin\angle A = \cos\gamma = \frac{5}{\sqrt{26}}$.</p><p>Применим теорему синусов: $$\triangle AB_1C_1:\ \frac{AB_1}{\sin 45^\circ} = \frac{C_1B_1}{\sin\angle A},$$ откуда $AB_1 = \sqrt{13}$.</p>`,
      figure: { angles: true, hl: ["AB1C1"] },
    },
    success: String.raw`Верно: $AB_1 = \sqrt{13}$.`,
    next: "m1_s2",
  },

  m1_s2: {
    type: "question",
    method: "m1",
    section: "Способ 1 · теорема синусов",
    step: [3, 4],
    title: String.raw`Примените теорему синусов к $\triangle A_1B_1C$ и $\triangle ABC$, найдите $B_1C$ и $BC$`,
    options: [
      { t: String.raw`$B_1C = 15\sqrt{13}$, $BC = 5\sqrt{26}$` },
      { t: String.raw`$B_1C = 5\sqrt{13}$, $BC = 5\sqrt{26}$`, ok: true },
      { t: String.raw`$B_1C = 15\sqrt{17}$, $BC = \sqrt{26}$` },
      { t: String.raw`$B_1C = 5\sqrt{13}$, $BC = 5\sqrt{13}$` },
    ],
    wrongDefault: String.raw`Неверно, необходимо правильно найти $\sin\angle A$ и $\sin\angle C$.`,
    hint: {
      title: "Подсказка (4)",
      body: String.raw`<p>Из подобия треугольников следует, что $\angle A = 90^\circ - \gamma$, значит, $\sin\angle A = \frac{5}{\sqrt{26}}$. Аналогично $\cos 2\alpha = \frac{5}{13}$, $\cos\alpha = \frac{3}{\sqrt{13}}$, $\angle B = 90^\circ - \alpha$, значит, $\sin\angle B = \cos\alpha = \frac{3}{\sqrt{13}}$.</p><p>Применим теорему синусов:</p><p>$\triangle AB_1C_1$: $\frac{AB_1}{\sin 45^\circ} = \frac{C_1B_1}{\sin\angle A}$, откуда $AB_1 = \sqrt{13}$;</p><p>$\triangle A_1B_1C$: $\frac{B_1C}{\sin\angle A} = \frac{A_1B_1}{\sin\angle C}$, откуда $B_1C = 5\sqrt{13}$. Значит, $AC = AB_1 + B_1C = 6\sqrt{13}$.</p><p>$\triangle ABC$: $\frac{BC}{\sin\angle A} = \frac{AC}{\sin\angle B}$, тогда $BC = 5\sqrt{26}$.</p>`,
      figure: { angles: true, hl: ["A1B1C"] },
    },
    success: String.raw`Длины сторон найдены верно: $AC = AB_1 + B_1C = 6\sqrt{13}$, $BC = 5\sqrt{26}$.`,
    next: "m1_q4",
  },

  m1_q4: {
    type: "question",
    method: "m1",
    section: "Способ 1",
    step: [4, 4],
    title: String.raw`Найдите площадь треугольника $\triangle ABC$`,
    body: String.raw`<p class="muted">$AC = 6\sqrt{13}$, $BC = 5\sqrt{26}$, $\angle C = 45^\circ$.</p>`,
    options: [
      { t: "$195$", ok: true },
      { t: "$205$" },
      { t: "$185$" },
      { t: "$215$" },
    ],
    wrongDefault: "Неверно.",
    hint: { title: "Подсказка (2)", body: SOLUTION_1, figure: { angles: true } },
    success: String.raw`Верно! $$S_{ABC} = \tfrac12\,AC\cdot BC\cdot\sin\angle C = \tfrac12\cdot 6\sqrt{13}\cdot 5\sqrt{26}\cdot\tfrac{\sqrt2}{2} = 195.$$`,
    nextLabel: "Завершить способ",
    next: "again",
    completes: "m1",
  },

  /* ---------- Способ 2 ---------- */
  m2_intro: {
    type: "screen",
    method: "m2",
    kicker: "Способ 2 · С использованием теоремы Ван-Обеля",
    title: "Теорема Ван-Обеля",
    body: String.raw`<p>Если $AA_1$, $BB_1$ и $CC_1$ — чевианы, пересекающиеся в одной точке $H$, то для них выполнено соотношение:</p><div class="formula">$$\frac{AH}{HA_1} = \frac{AB_1}{B_1C} + \frac{AC_1}{C_1B}$$</div>`,
    figure: { vanAubel: true, angles: true },
    actions: [{ label: "Начать", to: "m2_q1", kind: "primary" }],
  },

  m2_q1: {
    type: "question",
    method: "m2",
    section: "Способ 2",
    step: [1, 3],
    title: String.raw`Выразите $B_1H$ через биссектрису $B_1B_2$ и $A_1H$ через биссектрису $A_1A_2$`,
    body: String.raw`<p>Для нахождения площади треугольника $ABC$ воспользуемся формулой $S_{ABC} = \frac12\,AC\cdot BB_1$, предварительно применив теорему Ван-Обеля к треугольнику $A_1B_1C_1$.</p>`,
    figure: { vanAubel: true, hl: ["B1B2", "A1A2"] },
    options: [
      { t: String.raw`$B_1H = \dfrac25\,B_1B_2$, $B_1B_2 = \dfrac{5\sqrt{13}}{2}$;<br>$A_1H = \dfrac56\,A_1A_2$, $A_1A_2 = \dfrac{12\sqrt{26}}{5}$` },
      { t: String.raw`$B_1H = \dfrac45\,B_1B_2$, $B_1B_2 = \dfrac{5\sqrt{13}}{2}$;<br>$A_1H = \dfrac46\,A_1A_2$, $A_1A_2 = \dfrac{2\sqrt{26}}{5}$` },
      { t: String.raw`$B_1H = \dfrac35\,B_1B_2$, $B_1B_2 = \dfrac{5\sqrt{13}}{3}$;<br>$A_1H = \dfrac56\,A_1A_2$, $A_1A_2 = \dfrac{12\sqrt{26}}{5}$`, ok: true },
      { t: String.raw`$B_1H = \dfrac15\,B_1B_2$, $B_1B_2 = \dfrac{5\sqrt{11}}{3}$;<br>$A_1H = \dfrac{12\sqrt{26}}{5}$` },
    ],
    wrongDefault: String.raw`<p>Неверно. Обратите внимание на равенство теоремы Ван-Обеля: $$\frac{B_1H}{HB_2} = \frac{B_1C_2}{C_2A_1} + \frac{B_1A_2}{A_2C_1}$$ и на то, что $B_1B_2$ — биссектриса внутреннего угла треугольника $A_1B_1C_1$: $\beta_a = \frac{2\sqrt{bcp(p-a)}}{b+c}$, или $B_1B_2$ — гипотенуза треугольника $C_1B_1B_2$.</p><p>Аналогично рассуждая, имеем: $$\frac{A_1H}{HA_2} = \frac{A_1B_2}{B_2C_1} + \frac{A_1C_2}{C_2B_1}.$$</p>`,
    hint: {
      title: "Подсказка (5)",
      body: String.raw`<p>Воспользуемся теоремой Ван-Обеля и теоремой о биссектрисе угла треугольника $A_1B_1C_1$, получим: $$\frac{B_1H}{HB_2} = \frac{B_1C_2}{C_2A_1} + \frac{B_1A_2}{A_2C_1} = \frac{5}{12} + \frac{13}{12} = \frac32.$$</p><p>Следовательно, $B_1H = \frac35\cdot B_1B_2$, а $B_1B_2 = \frac{5\sqrt{13}}{3}$ ($B_1B_2$ — биссектриса внутреннего угла треугольника $A_1B_1C_1$: $\beta_a = \frac{2\sqrt{bcp(p-a)}}{b+c}$, или $B_1B_2$ — гипотенуза треугольника $C_1B_1B_2$).</p><p>Таким образом, $B_1H = \sqrt{13}$. Аналогично рассуждая, имеем: $$\frac{A_1H}{HA_2} = \frac{A_1B_2}{B_2C_1} + \frac{A_1C_2}{C_2B_1} = \frac{13}{5} + \frac{12}{5} = 5,$$ $A_1H = \frac56\,A_1A_2$ и $A_1A_2 = \frac{12\sqrt{26}}{5}$, то есть $A_1H = 2\sqrt{26}$.</p>`,
      figure: { vanAubel: true, hl: ["B1B2", "A1A2"] },
    },
    success: String.raw`Верно: $B_1H = \sqrt{13}$, $A_1H = 2\sqrt{26}$.`,
    next: "m2_q2",
  },

  m2_q2: {
    type: "question",
    method: "m2",
    section: "Способ 2",
    step: [2, 3],
    title: String.raw`Найдите $BB_1$ и $AC$. Прежде укажите верное утверждение из предложенных`,
    body: String.raw`<p class="muted">Известно: $B_1H = \sqrt{13}$, $A_1H = 2\sqrt{26}$.</p>`,
    options: [
      { t: String.raw`$\triangle BB_1C$, $\triangle BA_1H$, $\triangle AB_1H$ — равнобедренные прямоугольные треугольники`, wrong: "Это утверждение верно, но оно не единственное верное. Посмотрите внимательно на остальные варианты." },
      { t: String.raw`$AC = B_1H + BB_1$, $BB_1 = BH + HB_1$ и $BH = \sqrt2\,A_1H$`, wrong: "Это утверждение верно, но оно не единственное верное. Посмотрите внимательно на остальные варианты." },
      { t: "Нет верных", wrong: String.raw`Неверно. Напомним, что $\angle C = 45^\circ$ — какие треугольники на чертеже оказываются равнобедренными?` },
      { t: "Верны первые два", ok: true },
    ],
    hint: {
      title: "Подсказка (6)",
      body: String.raw`<p>Напомним, что $\angle C = 45^\circ$, поэтому $\triangle BB_1C$, $\triangle BA_1H$, $\triangle AB_1H$ — равнобедренные прямоугольные треугольники, тогда $$BB_1 = B_1C,\quad BA_1 = A_1H,\quad AB_1 = B_1H$$ и $AC = AB_1 + B_1C = B_1H + BB_1$, $BB_1 = BH + HB_1$ и $BH = \sqrt2\,A_1H$.</p>`,
      figure: { hl: ["BB1C", "BA1H", "AB1H"] },
    },
    success: String.raw`Верно: $\triangle BB_1C$, $\triangle BA_1H$, $\triangle AB_1H$ — равнобедренные прямоугольные, поэтому $BB_1 = B_1C$, $BA_1 = A_1H$, $AB_1 = B_1H$, $AC = AB_1 + B_1C = B_1H + BB_1$, $BB_1 = BH + HB_1$ и $BH = \sqrt2\,A_1H$.`,
    next: "m2_q3",
  },

  m2_q3: {
    type: "question",
    method: "m2",
    section: "Способ 2",
    step: [3, 3],
    title: String.raw`Найдите $BB_1$ и $AC$`,
    body: String.raw`<p>$\triangle BB_1C$, $\triangle BA_1H$, $\triangle AB_1H$ — равнобедренные прямоугольные треугольники, поэтому $BB_1 = B_1C$, $BA_1 = A_1H$, $AB_1 = B_1H$ и $AC = AB_1 + B_1C = B_1H + BB_1$, $BB_1 = BH + HB_1$ и $BH = \sqrt2\,A_1H$.</p>`,
    options: [
      { t: String.raw`$BB_1 = 5\sqrt{13}$, $AC = 6\sqrt{13}$`, ok: true },
      { t: String.raw`$BB_1 = 6\sqrt{13}$, $AC = 5\sqrt{13}$`, wrong: "Неверно. Посмотрите полное решение в подсказке.", openHint: true },
    ],
    hint: { title: "Подсказка (7)", body: SOLUTION_2, figure: { vanAubel: true, hl: ["BB1", "AC"] } },
    success: String.raw`Верно: $BB_1 = 5\sqrt{13}$, $AC = 6\sqrt{13}$, $$S_{ABC} = \tfrac12\,AC\cdot BB_1 = 195.$$`,
    nextLabel: "Завершить способ",
    next: "again",
    completes: "m2",
  },

  /* ---------- Завершение ---------- */
  again: {
    type: "screen",
    kicker: "Ответ: $S_{ABC} = 195$",
    title: "Хотите решить предложенную задачу другим способом?",
    stats: true,
    actions: [
      { label: "Да", to: "methods", kind: "primary" },
      { label: "Нет", to: "finish", kind: "ghost" },
    ],
  },

  finish: { type: "finish", title: "Спасибо за работу" },
};

/* Авторы проекта — впишите имена, они появятся на итоговом экране */
const AUTHORS = [];
